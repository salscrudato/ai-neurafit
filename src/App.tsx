import { useEffect, Suspense, lazy, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Link,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { InstallPrompt } from './components/pwa/InstallPrompt';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PageSuspenseFallback } from './components/ui/SuspenseFallback';
import { initOfflineStorage } from './utils/offlineStorage';
import { performanceMonitor } from './utils/performance';
import {
  useMemoryMonitoring,
  useCoreWebVitals,
  usePerformanceBudget,
} from './hooks/usePerformance';
import { navigation, performance as perfLogger } from './utils/loggers';
import { Button } from './components/ui/Button';

// Lazy load pages for better performance and code splitting
const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((m) => ({ default: m.LandingPage })),
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const SignupPage = lazy(() =>
  import('./pages/SignupPage').then((m) => ({ default: m.SignupPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
);
const OnboardingPage = lazy(() =>
  import('./pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })),
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const WorkoutPage = lazy(() =>
  import('./pages/WorkoutPage').then((m) => ({ default: m.WorkoutPage })),
);
const HistoryPage = lazy(() =>
  import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })),
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);

// Development-only pages
const LoggingTestPage = lazy(() =>
  import('./pages/LoggingTestPage').then((m) => ({ default: m.LoggingTestPage })),
);
const Layout = lazy(() =>
  import('./components/layout/Layout').then((m) => ({ default: m.Layout })),
);

// Create a client with resilient, client-friendly defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Avoid retries on most client/authorization errors
        const status =
          error?.status ?? error?.response?.status ?? error?.cause?.status;
        if (typeof status === 'number' && status >= 400 && status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

/* ---------- UX helpers (in-file to keep setup simple) ---------- */

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Instant jump avoids motion sickness between pages
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
}

function RouteAnnouncer() {
  const { pathname } = useLocation();
  const [message, setMessage] = useState('Loaded');
  const [previousPath, setPreviousPath] = useState<string>('');

  useEffect(() => {
    const names: Record<string, string> = {
      '/': 'Home',
      '/login': 'Login',
      '/signup': 'Sign up',
      '/forgot-password': 'Forgot Password',
      '/onboarding': 'Onboarding',
      '/app': 'Dashboard',
      '/app/workout': 'Workout',
      '/app/history': 'History',
      '/app/profile': 'Profile',
    };
    const pageName = names[pathname] ?? 'page';
    setMessage(`Navigated to ${pageName}`);

    // Log navigation using centralized logger
    navigation.routeChange(previousPath, pathname, pageName);
    setPreviousPath(pathname);
  }, [pathname, previousPath]);

  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

function NetworkStatusBanner() {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (online) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center px-3 py-2 text-sm text-white bg-red-600/90 backdrop-blur-sm">
      You are offline. Some features may be unavailable.
    </div>
  );
}

// Warm up likely-next routes when the main bundle is idle
function PrefetchOnIdle() {
  useEffect(() => {
    const prefetch = () => {
      import('./components/layout/Layout').catch(() => {});
      import('./pages/DashboardPage').catch(() => {});
      import('./pages/WorkoutPage').catch(() => {});
      import('./pages/ProfilePage').catch(() => {});
      import('./pages/HistoryPage').catch(() => {});
    };

    const ric: typeof window.requestIdleCallback | undefined = (window as any)
      .requestIdleCallback;

    if (ric) {
      const id = ric(prefetch, { timeout: 2000 });
      return () => (window as any).cancelIdleCallback?.(id);
    } else {
      const id = window.setTimeout(prefetch, 1200);
      return () => window.clearTimeout(id);
    }
  }, []);
  return null;
}

function NotFoundPage() {
  return (
    <div className="min-h-[60vh] grid place-items-center px-6 py-24 text-center">
      <div className="max-w-md">
        <p className="text-sm font-semibold tracking-wider text-primary-600">404</p>
        <h1 className="mt-2 text-3xl font-bold text-neutral-900">Page not found</h1>
        <p className="mt-2 text-neutral-600">
          The page you’re looking for doesn’t exist or was moved.
        </p>
        <div className="mt-6 flex justify-center">
          <Link to="/">
            <Button variant="gradient">Go home</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function AppShell() {
  return (
    <Router>
      <ScrollToTop />
      <RouteAnnouncer />
      <NetworkStatusBanner />
      <PrefetchOnIdle />

      <div className="min-h-screen bg-neutral-50">
        <Suspense fallback={<PageSuspenseFallback message="Loading NeuraFit..." />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Development-only routes */}
            {import.meta.env.DEV && (
              <Route
                path="/dev/logging"
                element={
                  <Suspense fallback={<PageSuspenseFallback message="Loading test page..." />}>
                    <LoggingTestPage />
                  </Suspense>
                }
              />
            )}

            {/* Protected routes */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Suspense fallback={<PageSuspenseFallback message="Loading app..." />}>
                    <Layout />
                  </Suspense>
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={
                  <Suspense fallback={<PageSuspenseFallback message="Loading dashboard..." />}>
                    <DashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="workout"
                element={
                  <Suspense fallback={<PageSuspenseFallback message="Loading workout..." />}>
                    <WorkoutPage />
                  </Suspense>
                }
              />
              <Route
                path="history"
                element={
                  <Suspense fallback={<PageSuspenseFallback message="Loading history..." />}>
                    <HistoryPage />
                  </Suspense>
                }
              />
              <Route
                path="profile"
                element={
                  <Suspense fallback={<PageSuspenseFallback message="Loading profile..." />}>
                    <ProfilePage />
                  </Suspense>
                }
              />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>

        {/* PWA Install Prompt */}
        <InstallPrompt />
      </div>
    </Router>
  );
}

function App() {
  // Performance monitoring hooks
  useMemoryMonitoring();
  useCoreWebVitals();
  usePerformanceBudget({
    'page-load-time': 3000, // 3 seconds
    'largest-contentful-paint': 2500, // 2.5 seconds
    'first-input-delay': 100, // 100ms
    'cumulative-layout-shift': 0.1, // 0.1 CLS score
  });

  useEffect(() => {
    // Initialize offline storage
    initOfflineStorage();

    // Start performance monitoring
    const initTime = performance.now();
    performanceMonitor.recordMetric('app-initialization', initTime);
    perfLogger.metric('app-initialization', initTime);

    // Log performance metrics in development
    if (import.meta.env.DEV) {
      const id = window.setTimeout(() => {
        const metrics = performanceMonitor.getMetrics();
        perfLogger.bundleAnalysis(
          metrics.filter(m => m.name.includes('script')).length,
          metrics.filter(m => m.name.includes('style')).length,
          metrics.reduce((sum, m) => sum + (m.value || 0), 0)
        );
      }, 5000);
      return () => window.clearTimeout(id);
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppShell />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;