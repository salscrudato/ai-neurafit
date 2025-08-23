/* App.tsx — improved for performance, maintainability, and UX */
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
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
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PageSuspenseFallback } from './components/ui/SuspenseFallback';
import { logger } from './utils/logger';
import { Button } from './components/ui/Button';

/* ---------- App constants ---------- */
const APP_NAME = 'NeuraFit';
/**
 * Respect Vite's BASE_URL when the app is served from a subpath.
 * React Router expects no trailing slash.
 */
const BASENAME: string =
  (typeof import.meta !== 'undefined' &&
    (import.meta as any)?.env?.BASE_URL?.replace(/\/$/, '')) ||
  '';

/** Human‑readable names for a11y announcements & document titles */
const ROUTE_NAMES: Record<string, string> = {
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

/* ---------- Lazy pages (code splitting) ---------- */
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
const Layout = lazy(() =>
  import('./components/layout/Layout').then((m) => ({ default: m.Layout })),
);

/* ---------- Query Client (resilient defaults) ---------- */
function getStatusFromError(error: unknown): number | undefined {
  // Works across fetch / Axios / custom errors
  const e = error as any;
  const status = e?.status ?? e?.response?.status ?? e?.cause?.status;
  if (typeof status === 'number') return status;

  // Best-effort parse from message (e.g., "Request failed with status code 401")
  const msg: string | undefined = e?.message;
  const m = typeof msg === 'string' ? msg.match(/\b([45]\d{2})\b/) : null;
  return m ? Number(m[1]) : undefined;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        const status = getStatusFromError(error);
        // Do not retry on most client/authorization errors
        if (status && status >= 400 && status < 500) return false;
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

/* ---------- UX helpers ---------- */

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Use rAF to avoid layout thrash and ensure scroll occurs after paint
    const id = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [pathname]);
  return null;
}

function RouteAnnouncer() {
  const { pathname } = useLocation();
  const [message, setMessage] = useState('Loaded');
  const previousPathRef = useRef<string>('');

  useEffect(() => {
    const pageName = ROUTE_NAMES[pathname] ?? 'page';
    const from = previousPathRef.current;
    const to = pathname;

    setMessage(`Navigated to ${pageName}`);
    previousPathRef.current = pathname;

    // Keep document title in sync with navigation
    if (typeof document !== 'undefined') {
      document.title = `${pageName} • ${APP_NAME}`;
    }

    logger.debug('Route changed', { from, to, page: pageName });
  }, [pathname]);

  return (
    <div aria-live="polite" aria-atomic="true" role="status" className="sr-only">
      {message}
    </div>
  );
}

function NetworkStatusBanner() {
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const on = () => {
      setOnline(true);
      logger.info('Network online');
    };
    const off = () => {
      setOnline(false);
      logger.warn('Network offline');
    };
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (online) return null;
  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center px-3 py-2 text-sm text-white bg-red-600/90 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      You are offline. Some features may be unavailable.
    </div>
  );
}

/** Warm likely-next routes when idle (gentle hinting to the browser cache) */
function PrefetchOnIdle() {
  useEffect(() => {
    const prefetch = () => {
      // Fire-and-forget dynamic imports; ignore errors (e.g., on flaky networks)
      void import('./components/layout/Layout').catch(() => {});
      void import('./pages/DashboardPage').catch(() => {});
      void import('./pages/WorkoutPage').catch(() => {});
      void import('./pages/ProfilePage').catch(() => {});
      void import('./pages/HistoryPage').catch(() => {});
    };

    const w = window as any;
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(prefetch, { timeout: 2000 });
      return () => w.cancelIdleCallback?.(id);
    } else {
      const id = window.setTimeout(prefetch, 1200);
      return () => window.clearTimeout(id);
    }
  }, []);
  return null;
}

/* ---------- Light-weight 404 ---------- */
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

/* ---------- Main shell ---------- */
function AppShell() {
  return (
    <Router basename={BASENAME}>
      <AuthProvider>
        <ScrollToTop />
        <RouteAnnouncer />
        <NetworkStatusBanner />
        <PrefetchOnIdle />

      <div className="min-h-screen bg-neutral-50">
        <Suspense fallback={<PageSuspenseFallback message={`Loading ${APP_NAME}...`} />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

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
                  <Suspense
                    fallback={<PageSuspenseFallback message="Loading dashboard..." />}
                  >
                    <DashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="workout"
                element={
                  <Suspense
                    fallback={<PageSuspenseFallback message="Loading workout..." />}
                  >
                    <WorkoutPage />
                  </Suspense>
                }
              />
              <Route
                path="history"
                element={
                  <Suspense
                    fallback={<PageSuspenseFallback message="Loading history..." />}
                  >
                    <HistoryPage />
                  </Suspense>
                }
              />
              <Route
                path="profile"
                element={
                  <Suspense
                    fallback={<PageSuspenseFallback message="Loading profile..." />}
                  >
                    <ProfilePage />
                  </Suspense>
                }
              />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>


      </div>
      </AuthProvider>
    </Router>
  );
}

/* ---------- Root ---------- */
function App() {
  useEffect(() => {
    logger.info('App initialized');
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppShell />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;