
import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { InstallPrompt } from './components/pwa/InstallPrompt';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { PageSuspenseFallback } from './components/ui/SuspenseFallback';
import { initOfflineStorage } from './utils/offlineStorage';
import { performanceMonitor } from './utils/performance';
import { useMemoryMonitoring, useCoreWebVitals, usePerformanceBudget } from './hooks/usePerformance';

// Lazy load pages for better performance and code splitting
const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then(module => ({ default: module.SignupPage })));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then(module => ({ default: module.OnboardingPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const WorkoutPage = lazy(() => import('./pages/WorkoutPage').then(module => ({ default: module.WorkoutPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then(module => ({ default: module.HistoryPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(module => ({ default: module.ProfilePage })));
const Layout = lazy(() => import('./components/layout/Layout').then(module => ({ default: module.Layout })));

// Create a client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
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
    performanceMonitor.recordMetric('app-initialization', performance.now());

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        console.group('Performance Metrics');
        console.table(performanceMonitor.getMetrics());
        console.groupEnd();
      }, 5000);
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-neutral-50">
              <Suspense fallback={<PageSuspenseFallback message="Loading NeuraFit..." />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />

                  {/* Protected routes */}
                  <Route path="/onboarding" element={
                    <ProtectedRoute>
                      <OnboardingPage />
                    </ProtectedRoute>
                  } />

                  <Route path="/app" element={
                    <ProtectedRoute>
                      <Suspense fallback={<PageSuspenseFallback message="Loading app..." />}>
                        <Layout />
                      </Suspense>
                    </ProtectedRoute>
                  }>
                    <Route index element={
                      <Suspense fallback={<PageSuspenseFallback message="Loading dashboard..." />}>
                        <DashboardPage />
                      </Suspense>
                    } />
                    <Route path="workout" element={
                      <Suspense fallback={<PageSuspenseFallback message="Loading workout..." />}>
                        <WorkoutPage />
                      </Suspense>
                    } />
                    <Route path="history" element={
                      <Suspense fallback={<PageSuspenseFallback message="Loading history..." />}>
                        <HistoryPage />
                      </Suspense>
                    } />
                    <Route path="profile" element={
                      <Suspense fallback={<PageSuspenseFallback message="Loading profile..." />}>
                        <ProfilePage />
                      </Suspense>
                    } />
                  </Route>
                </Routes>
              </Suspense>

              {/* PWA Install Prompt */}
              <InstallPrompt />
            </div>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
