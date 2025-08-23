# AI NeuraFit - Complete Frontend Code

This document contains all frontend code for the AI NeuraFit application.

## Project Structure

```
src/
├── App.tsx                        # Main React app component with routing
├── main.tsx                       # React app entry point
├── index.css                      # Global styles and Tailwind CSS
├── vite-env.d.ts                  # Vite type definitions
├── components/                    # Reusable React components
├── pages/                         # Page components
├── services/                      # API service layers
├── store/                         # State management (Zustand)
├── lib/                           # Core libraries
├── types/                         # TypeScript type definitions
└── utils/                         # Utility functions
```

## `src/App.tsx`

**Description:** Main React application component with routing, error boundaries, and lazy loading

```typescript
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
  '/app/settings': 'Settings',
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
/** NEW: Settings */
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
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
      void import('./pages/SettingsPage').catch(() => {}); // NEW
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
                {/* NEW: Settings */}
                <Route
                  path="settings"
                  element={
                    <Suspense
                      fallback={<PageSuspenseFallback message="Loading settings..." />}
                    >
                      <SettingsPage />
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
```

---

## `src/main.tsx`

**Description:** React application entry point with StrictMode and root rendering

```typescript
// main.tsx — robust entry with env-aware StrictMode & resilient SW registration
import { StrictMode, startTransition } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';


// ---- Root element (defensive) ----
const container = document.getElementById('root');
if (!container) {
  // Fail fast: this should never happen in a healthy build
  throw new Error('Root container #root not found');
}

const root = createRoot(container);



// ---- Render (use StrictMode in dev; opt-out automatically in prod) ----
const withStrict = import.meta.env.DEV;

startTransition(() => {
  root.render(
    withStrict ? (
      <StrictMode>
        <App />
      </StrictMode>
    ) : (
      <App />
    ),
  );
});

// Optional: expose a simple hot-reload accept for Vite HMR safety
if (import.meta.hot) {
  import.meta.hot.accept();
}
```

---

## `src/index.css`

**Description:** Global CSS styles, Tailwind configuration, and design system

```typescript
/* =============================================================================
   NeuraFit — Modern Design System (Apple/Nike Inspired)
   - System fonts for native feel
   - Refined color tokens
   - Enhanced accessibility
   - Premium visual hierarchy
============================================================================= */

/* === System Fonts (Apple/Nike inspired) === */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300..900&display=swap');

/* === Tailwind layers === */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* --------------------------------------------------------------------------------
   BASE
---------------------------------------------------------------------------------*/
@layer base {
  /* ---- Modern Design Tokens ---- */
  :root {
    /* Modern brand colors as space-separated RGB */
    --nf-primary-500: 100 116 139;   /* slate-500 */
    --nf-primary-600: 71 85 105;     /* slate-600 */
    --nf-primary-700: 51 65 85;      /* slate-700 */
    --nf-energy-500: 249 115 22;     /* orange-500 */
    --nf-energy-600: 234 88 12;      /* orange-600 */
    --nf-success-500: 34 197 94;     /* green-500 */
    --nf-success-600: 22 163 74;     /* green-600 */
    --nf-warning-500: 245 158 11;    /* amber-500 */
    --nf-error-500: 239 68 68;       /* red-500 */

    /* Modern font stacks - Apple/Nike inspired */
    --font-sans: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, 'Segoe UI', Roboto, sans-serif;
    --font-body: 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Inter', system-ui, sans-serif;
    --font-mono: 'SF Mono', Monaco, 'JetBrains Mono', Menlo, Consolas, monospace;

    /* Refined spacing system */
    --space-xs: 0.5rem;
    --space-sm: 0.75rem;
    --space-md: 1rem;
    --space-lg: 1.5rem;
    --space-xl: 2rem;
    --space-2xl: 3rem;

    /* Modern shadows */
    --shadow-subtle: 0 1px 3px 0 rgba(0, 0, 0, 0.06);
    --shadow-elevated: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
    --shadow-premium: 0 8px 32px 0 rgba(0, 0, 0, 0.12);

    /* System preferences */
    color-scheme: light dark;
  }

  /* Dark theme support */
  [data-theme="dark"] {
    --nf-primary-500: 148 163 184;   /* slate-400 */
    --nf-primary-600: 100 116 139;   /* slate-500 */
    --nf-primary-700: 71 85 105;     /* slate-600 */
    color-scheme: dark;
  }

  /* ---- Modern base reset (complements Tailwind preflight) ---- */
  *, *::before, *::after { box-sizing: border-box; }
  html, body { height: 100%; }

  html {
    font-family: var(--font-sans);
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    scroll-behavior: smooth;
  }

  body {
    @apply bg-white text-foreground antialiased;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    font-family: var(--font-body);
    font-synthesis: none;
    accent-color: rgb(var(--nf-energy-500));
    transition: background-color 0.2s ease, color 0.2s ease;
    font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1;
  }

  /* Modern font helpers */
  .font-display { font-family: var(--font-sans); font-weight: 700; }
  .font-body { font-family: var(--font-body); }
  .font-mono { font-family: var(--font-mono); }

  /* Modern selection styling */
  ::selection {
    background: rgb(var(--nf-energy-500) / 0.15);
    color: inherit;
  }

  /* Refined scrollbars */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { @apply bg-neutral-50; }
  ::-webkit-scrollbar-thumb { @apply bg-neutral-300 rounded-full; }
  ::-webkit-scrollbar-thumb:hover { @apply bg-neutral-400; }
  html { scrollbar-width: thin; scrollbar-color: rgb(203 213 225) rgb(248 250 252); }

  /* Focus: don’t suppress outlines globally; style keyboard focus clearly */
  :focus { outline: none; }
  :focus-visible { @apply ring-2 ring-primary-500 ring-offset-2; }

  /* High contrast mode */
  @media (prefers-contrast: more), (forced-colors: active) {
    .card { @apply border-2 border-neutral-900; }
    .btn-secondary, .input-field { border-width: 2px; border-color: currentColor; }
    .text-gradient, .text-gradient-primary, .text-gradient-accent {
      background: none; color: currentColor; -webkit-background-clip: initial; background-clip: initial;
    }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
    .animate-pulse, .animate-bounce, .animate-spin, .animate-ping { animation: none !important; }
    .animate-on-scroll { opacity: 1; transform: none; }
  }

  /* Reduced data: dampen heavy decorative backgrounds */
  @media (prefers-reduced-data: reduce) {
    .bg-mesh-gradient, .bg-gradient-background, .card-gradient, .card-gradient-accent, .card-gradient-secondary {
      background-image: none !important;
    }
  }

  /* Background tokens used via @apply elsewhere (Color4 syntax fixed) */
  .bg-gradient-background {
    background-image:
      radial-gradient(60% 80% at 20% 0%, rgb(var(--nf-primary-500) / 0.10), transparent 60%),
      radial-gradient(50% 70% at 100% 20%, rgb(var(--nf-accent-500) / 0.12), transparent 60%),
      linear-gradient(180deg, #fafafa 0%, #ffffff 60%, #f8fafc 100%);
  }
}

/* --------------------------------------------------------------------------------
   UTILITIES
---------------------------------------------------------------------------------*/
@layer utilities {
  /* Mesh + hero gradients */
  .bg-mesh-gradient {
    background-image:
      radial-gradient(1000px 500px at -10% -20%, rgb(var(--nf-primary-500) / 0.20), transparent 60%),
      radial-gradient(800px 400px at 110% 0%, rgb(var(--nf-accent-500) / 0.18), transparent 60%);
    background-repeat: no-repeat;
  }
  .bg-gradient-hero {
    background-image: linear-gradient(90deg, rgb(var(--nf-accent-500)) 0%, rgb(var(--nf-secondary-500)) 50%, rgb(var(--nf-primary-500)) 100%);
  }
  .bg-gradient-primary {
    background-image: linear-gradient(135deg, rgb(var(--nf-primary-500)) 0%, rgb(var(--nf-primary-600)) 50%, rgb(var(--nf-primary-700)) 100%);
  }
  .bg-gradient-accent {
    background-image: linear-gradient(135deg, rgb(var(--nf-accent-500)) 0%, rgb(14 165 233) 50%, rgb(56 189 248) 100%);
  }
  .bg-gradient-secondary {
    background-image: linear-gradient(135deg, rgb(var(--nf-secondary-500)) 0%, rgb(147 51 234) 50%, rgb(126 34 206) 100%);
  }
  .bg-gradient-brand {
    background-image: linear-gradient(135deg, rgb(var(--nf-brand-500)) 0%, rgb(var(--nf-primary-500)) 100%);
  }

  /* Fitness gradients */
  .bg-gradient-cardio { background-image: linear-gradient(135deg, #ef4444, #f97316); }
  .bg-gradient-strength { background-image: linear-gradient(135deg, #22c55e, #16a34a); }
  .bg-gradient-flexibility { background-image: linear-gradient(135deg, #06b6d4, #0ea5e9); }
  .bg-gradient-recovery { background-image: linear-gradient(135deg, #10b981, #0ea5a3); }
  .bg-gradient-hiit { background-image: linear-gradient(135deg, #f59e0b, #ef4444); }
  .bg-gradient-yoga { background-image: linear-gradient(135deg, #a78bfa, #22d3ee); }
  .bg-gradient-pilates { background-image: linear-gradient(135deg, #f472b6, #a78bfa); }
  .bg-gradient-energy { background-image: linear-gradient(135deg, #22d3ee, #6366f1); }

  /* Text gradients */
  .text-gradient { background-image: linear-gradient(90deg, rgb(var(--nf-primary-600)), rgb(67 56 202)); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .text-gradient-primary { background-image: linear-gradient(90deg, rgb(var(--nf-primary-500)), rgb(var(--nf-primary-700))); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .text-gradient-accent { background-image: linear-gradient(90deg, rgb(var(--nf-accent-500)), rgb(14 165 233)); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .text-gradient-secondary { background-image: linear-gradient(90deg, rgb(var(--nf-secondary-500)), rgb(147 51 234)); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .text-gradient-brand { background-image: linear-gradient(90deg, rgb(var(--nf-brand-500)), rgb(var(--nf-primary-500))); -webkit-background-clip: text; background-clip: text; color: transparent; }

  /* Fluid type scale */
  .text-display-xl { font-size: clamp(2.75rem, 1.6rem + 3vw, 5rem); line-height: 1.05; }
  .text-display-lg { font-size: clamp(2.25rem, 1.2rem + 2.5vw, 3.75rem); line-height: 1.08; }
  .text-display-md { font-size: clamp(1.75rem, 0.9rem + 2vw, 3rem); line-height: 1.12; }
  .text-fluid-6xl { font-size: clamp(2.25rem, 1.4rem + 2.8vw, 3.75rem); line-height: 1.1; }
  .text-fluid-5xl { font-size: clamp(2rem, 1.2rem + 2.4vw, 3rem); line-height: 1.12; }
  .text-fluid-4xl { font-size: clamp(1.5rem, 0.9rem + 2vw, 2.25rem); line-height: 1.2; }
  .text-fluid-3xl { font-size: clamp(1.375rem, 0.8rem + 1.6vw, 2rem); line-height: 1.25; }
  .text-fluid-2xl { font-size: clamp(1.25rem, 0.7rem + 1.2vw, 1.75rem); line-height: 1.3; }
  .text-fluid-xl  { font-size: clamp(1.125rem, 0.65rem + 1vw, 1.5rem); line-height: 1.35; }
  .text-fluid-lg  { font-size: clamp(1.0625rem, 0.7rem + 0.7vw, 1.25rem); }
  .text-fluid-base{ font-size: clamp(1rem, 0.8rem + 0.4vw, 1.0625rem); }
  .text-fluid-sm  { font-size: clamp(0.9375rem, 0.75rem + 0.3vw, 1rem); }
  .text-fluid-xs  { font-size: clamp(0.8125rem, 0.7rem + 0.2vw, 0.875rem); }

  /* Shadows */
  .shadow-soft { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
  .shadow-medium { box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
  .shadow-elevated { box-shadow: 0 12px 32px rgba(0,0,0,0.12); }
  .shadow-elevated-lg { box-shadow: 0 16px 40px rgba(0,0,0,0.16); }
  .shadow-hard { box-shadow: 0 10px 40px rgba(0,0,0,0.25); }
  .shadow-glass { box-shadow: 0 10px 30px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2); }
  .shadow-glow { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
  .shadow-glow-primary { box-shadow: 0 10px 30px rgb(var(--nf-primary-600) / 0.35), 0 0 0 1px rgb(var(--nf-primary-600) / 0.10); }
  .shadow-glow-accent  { box-shadow: 0 10px 30px rgb(var(--nf-accent-500) / 0.35), 0 0 0 1px rgb(var(--nf-accent-500) / 0.10); }
  .shadow-glow-secondary { box-shadow: 0 10px 30px rgb(var(--nf-secondary-500) / 0.35), 0 0 0 1px rgb(var(--nf-secondary-500) / 0.10); }
  .shadow-cardio { box-shadow: 0 10px 30px rgba(239,68,68,0.30); }
  .shadow-strength { box-shadow: 0 10px 30px rgba(34,197,94,0.30); }
  .shadow-flexibility { box-shadow: 0 10px 30px rgba(6,182,212,0.30); }
  .shadow-recovery { box-shadow: 0 10px 30px rgba(16,185,129,0.30); }
  .shadow-hiit { box-shadow: 0 10px 30px rgba(245,158,11,0.30); }
  .shadow-yoga { box-shadow: 0 10px 30px rgba(167,139,250,0.30); }
  .shadow-pilates { box-shadow: 0 10px 30px rgba(244,114,182,0.30); }

  /* Animation helpers */
  @keyframes gradientPan { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  .animate-gradient { background-size: 200% 200%; animation: gradientPan 8s ease infinite; }

  @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
  .shimmer { position: relative; overflow: hidden; }
  .shimmer::after { content:''; position:absolute; inset:0; background-image: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent); animation: shimmer 2s infinite; }

  @keyframes workoutPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }
  .animate-workout-pulse { animation: workoutPulse 1.5s ease-in-out infinite; }

  @keyframes restBreathe { 0%,100%{letter-spacing:0} 50%{letter-spacing:0.5px} }
  .animate-rest-breathe { animation: restBreathe 3s ease-in-out infinite; }

  /* Safe area helpers */
  .safe-area-bottom { padding-bottom: env(safe-area-inset-bottom); }
  .safe-area-top { padding-top: env(safe-area-inset-top); }
  .h-safe-bottom { height: env(safe-area-inset-bottom); }

  /* Fluid paddings */
  .px-fluid-sm { padding-left: clamp(1rem, 4vw, 1.5rem); padding-right: clamp(1rem, 4vw, 1.5rem); }
  .px-layout-md { padding-left: var(--space-layout-md); padding-right: var(--space-layout-md); }
  .px-layout-lg { padding-left: var(--space-layout-lg); padding-right: var(--space-layout-lg); }

  /* Grid templates */
  .grid-auto-fit { display:grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: var(--space-layout-md); }
  .grid-auto-fill { display:grid; grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr)); gap: var(--space-layout-md); }
  .grid-sidebar { display:grid; grid-template-columns: 280px 1fr; gap: var(--space-layout-lg); }
  .grid-holy-grail { display:grid; grid-template-columns: 1fr minmax(0, 800px) 1fr; gap: var(--space-layout-md); }

  /* Visibility & performance helpers */
  .cv-auto { content-visibility: auto; contain-intrinsic-size: 600px 800px; } /* tune per container */
  .break-anywhere { overflow-wrap: anywhere; word-break: break-word; }
  .hyphens-auto { hyphens: auto; }

  /* Screen-reader helpers */
  .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
  .sr-only-focusable:focus { position:static; width:auto; height:auto; padding:inherit; margin:inherit; overflow:visible; clip:auto; white-space:normal; }

  /* Skip link */
  .skip-link { @apply sr-only-focusable absolute top-0 left-0 z-50 bg-primary-600 text-white px-4 py-2 rounded-br-lg font-medium; transform: translateY(-100%); transition: transform 0.3s ease; }
  .skip-link:focus { transform: translateY(0); }

  /* Hover/focus motion utilities */
  .hover-lift { transition: transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s cubic-bezier(.16,1,.3,1); }
  .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 8px 25px rgba(0,0,0,.15); }
  .hover-scale { transition: transform .3s cubic-bezier(.16,1,.3,1); }
  .hover-scale:hover { transform: scale(1.05); }
  .hover-rotate { transition: transform .3s cubic-bezier(.16,1,.3,1); }
  .hover-rotate:hover { transform: rotate(5deg); }

  /* Patterns for color‑blind friendly cues */
  .pattern-dots { background-image: radial-gradient(circle, currentColor 1px, transparent 1px); background-size: 8px 8px; }
  .pattern-stripes { background-image: repeating-linear-gradient(45deg, transparent, transparent 4px, currentColor 4px, currentColor 8px); }
  .pattern-grid { background-image: linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px); background-size: 8px 8px; }
}

/* --------------------------------------------------------------------------------
   COMPONENTS
---------------------------------------------------------------------------------*/
@layer components {
  /* Modern Button System - Apple/Nike inspired */
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .btn-energy {
    @apply bg-energy-500 hover:bg-energy-600 active:bg-energy-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-energy-500 focus:ring-offset-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .btn-secondary {
    @apply bg-white hover:bg-neutral-50 active:bg-neutral-100 text-foreground font-semibold py-3 px-6 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 shadow-sm hover:shadow-md border border-neutral-200;
  }
  .btn-outline {
    @apply border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white active:bg-primary-700 font-semibold py-3 px-6 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 bg-transparent;
  }
  .btn-ghost {
    @apply text-foreground-secondary hover:text-foreground hover:bg-neutral-100 active:bg-neutral-200 font-medium py-3 px-6 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
  }
  .btn-success {
    @apply bg-success-500 hover:bg-success-600 active:bg-success-700 text-white font-semibold py-3 px-6 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-offset-2 shadow-sm hover:shadow-md;
  }
  .btn-glass {
    @apply bg-white/80 hover:bg-white/90 backdrop-blur-md border border-white/30 text-foreground font-semibold py-3 px-6 rounded-2xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 shadow-glass;
  }

  /* Inputs */
  .input-field {
    @apply w-full px-4 py-3 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 placeholder-foreground-tertiary text-foreground;
  }
  .input-field-filled {
    @apply w-full px-4 py-3 border-0 rounded-xl bg-background-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-background transition-all duration-200 placeholder-foreground-tertiary text-foreground;
  }
  .input-field-error { @apply input-field border-error-300 focus:ring-error-500; }

  /* Cards */
  .card { @apply bg-background rounded-3xl shadow-medium border border-border/50 p-6 transition-all duration-300; }
  .card-elevated { @apply bg-background rounded-3xl shadow-elevated border border-border/30 p-6 transition-all duration-300; }
  .card-glass { @apply bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl shadow-glass p-6 transition-all duration-300; }

  /* Gradient cards (Color4 syntax fixed) */
  .card-gradient { @apply text-white rounded-3xl p-6 transition-all duration-300 shadow-hard; background-image: linear-gradient(135deg, rgb(var(--nf-primary-500)), rgb(var(--nf-primary-700))); }
  .card-gradient-accent { @apply text-white rounded-3xl p-6 transition-all duration-300 shadow-hard; background-image: linear-gradient(135deg, rgb(var(--nf-accent-500)), rgb(14 165 233)); }
  .card-gradient-secondary { @apply text-white rounded-3xl p-6 transition-all duration-300 shadow-hard; background-image: linear-gradient(135deg, rgb(var(--nf-secondary-500)), rgb(147 51 234)); }

  /* Typography helpers */
  .text-balance { text-wrap: balance; }
  .text-pretty { text-wrap: pretty; }

  /* Heading/body scale using fluid utilities */
  .heading-1 { @apply text-fluid-6xl font-heading font-bold tracking-tight text-foreground; }
  .heading-2 { @apply text-fluid-5xl font-heading font-bold tracking-tight text-foreground; }
  .heading-3 { @apply text-fluid-4xl font-heading font-semibold tracking-tight text-foreground; }
  .heading-4 { @apply text-fluid-3xl font-heading font-semibold tracking-tight text-foreground; }
  .heading-5 { @apply text-fluid-2xl font-heading font-semibold tracking-tight text-foreground; }
  .heading-6 { @apply text-fluid-xl font-heading font-semibold tracking-tight text-foreground; }
  .body-large { @apply text-fluid-lg font-body leading-relaxed text-foreground; }
  .body-base  { @apply text-fluid-base font-body leading-relaxed text-foreground; }
  .body-small { @apply text-fluid-sm font-body leading-relaxed text-foreground-secondary; }
  .caption { @apply text-fluid-xs font-body leading-tight text-foreground-tertiary uppercase tracking-wider; }

  .display-hero { @apply text-display-xl font-heading font-black tracking-tight text-foreground; }
  .display-large { @apply text-display-lg font-heading font-bold tracking-tight text-foreground; }
  .display-medium { @apply text-display-md font-heading font-bold tracking-tight text-foreground; }

  /* Glass */
  .glass { @apply backdrop-blur-md bg-white/80 border border-white/20; }

  /* Cards – interactions */
  .card-hover { @apply card hover:shadow-medium hover:border-neutral-300 cursor-pointer; }
  .card-interactive { @apply card-hover active:scale-[0.98] transition-transform; }

  /* Loading */
  .skeleton { @apply animate-pulse bg-neutral-200 rounded; }
  .loading-skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size:200% 100%; animation: shimmer 1.5s infinite; }

  /* Status indicators */
  .status-dot { @apply w-2 h-2 rounded-full; }
  .status-online { @apply status-dot bg-success-500; }
  .status-offline { @apply status-dot bg-neutral-400; }
  .status-busy { @apply status-dot bg-warning-500; }

  /* Progress bar */
  .progress-bar { @apply w-full bg-neutral-200 rounded-full h-2 overflow-hidden; }
  .progress-fill { @apply h-full rounded-full transition-all duration-300; background-image: linear-gradient(90deg, rgb(var(--nf-energy-500)), rgb(var(--nf-energy-600))); }

  /* Modern badges */
  .badge { @apply inline-flex items-center px-3 py-1 rounded-full text-sm font-medium; }
  .badge-primary  { @apply badge bg-primary-100 text-primary-800; }
  .badge-energy   { @apply badge bg-energy-100 text-energy-800; }
  .badge-success  { @apply badge bg-success-100 text-success-800; }
  .badge-warning  { @apply badge bg-warning-100 text-warning-800; }
  .badge-error    { @apply badge bg-error-100 text-error-800; }

  /* Fitness-specific badges */
  .badge-cardio { @apply badge bg-fitness-cardio-100 text-fitness-cardio-800 border border-fitness-cardio-200; }
  .badge-strength { @apply badge bg-fitness-strength-100 text-fitness-strength-800 border border-fitness-strength-200; }
  .badge-flexibility { @apply badge bg-fitness-flexibility-100 text-fitness-flexibility-800 border border-fitness-flexibility-200; }
  .badge-recovery { @apply badge bg-fitness-recovery-100 text-fitness-recovery-800 border border-fitness-recovery-200; }
  .badge-hiit { @apply badge bg-fitness-hiit-100 text-fitness-hiit-800 border border-fitness-hiit-200; }
  .badge-yoga { @apply badge bg-fitness-yoga-100 text-fitness-yoga-800 border border-fitness-yoga-200; }
  .badge-pilates { @apply badge bg-fitness-pilates-100 text-fitness-pilates-800 border border-fitness-pilates-200; }

  /* Touch targets & selection */
  .touch-target { @apply min-h-[44px] min-w-[44px]; }
  .touch-target-large { min-height: 48px; min-width: 48px; }
  .touch-target-xl { min-height: 56px; min-width: 56px; }
  .no-select { -webkit-user-select: none; -moz-user-select: none; user-select: none; }

  /* Smooth scrolling wrappers */
  .smooth-scroll { -webkit-overflow-scrolling: touch; scroll-behavior: smooth; }
  .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .hide-scrollbar::-webkit-scrollbar { display: none; }

  /* Layout helpers */
  .container-fluid { width: 100%; max-width: none; padding-left: clamp(1rem, 4vw, 1.5rem); padding-right: clamp(1rem, 4vw, 1.5rem); }
  .container-narrow { max-width: 64rem; margin-inline: auto; padding-inline: var(--space-layout-md); }
  .container-wide { max-width: 96rem; margin-inline: auto; padding-inline: var(--space-layout-lg); }

  /* In-view animation helpers */
  .animate-on-scroll { opacity: 0; transform: translateY(20px); transition: opacity .6s cubic-bezier(.16,1,.3,1), transform .6s cubic-bezier(.16,1,.3,1); }
  .animate-on-scroll.in-view { opacity: 1; transform: translateY(0); }

  /* Focus animation */
  .focus-ring-animated { position: relative; overflow: hidden; }
  .focus-ring-animated::before { content: ''; position: absolute; inset: -2px; border-radius: inherit; background: linear-gradient(45deg, transparent, rgba(99,102,241,.3), transparent); opacity: 0; transition: opacity .3s ease; }
  .focus-ring-animated:focus::before { opacity: 1; animation: rotate 2s linear infinite; }
  @keyframes rotate { to { transform: rotate(360deg); } }

  /* Form accessibility */
  .form-field-required::after { content: ' *'; color: #dc2626; font-weight: 700; }
  .form-error { @apply text-error-600; }
  .form-error::before { content: '⚠ '; }
  .form-success { @apply text-success-600; }
  .form-success::before { content: '✓ '; }
  .loading-announced::before { content: 'Loading, please wait...'; @apply sr-only; }

  /* Progress (ARIA) */
  .progress-accessible { position: relative; }
  .progress-accessible::after { content: attr(aria-valuenow) '% complete'; @apply sr-only; }

  /* Workout components */
  .workout-card { @apply card relative overflow-hidden group cursor-pointer transition-all duration-300; }
  .workout-card:hover { @apply shadow-elevated-lg -translate-y-1 scale-[1.02]; }
  .workout-card-intensity-low { @apply border-l-4 border-fitness-flexibility-500; background-image: linear-gradient(90deg, rgba(6,182,212,0.08), #fff); }
  .workout-card-intensity-medium { @apply border-l-4 border-fitness-strength-500; background-image: linear-gradient(90deg, rgba(34,197,94,0.08), #fff); }
  .workout-card-intensity-high { @apply border-l-4 border-fitness-cardio-500; background-image: linear-gradient(90deg, rgba(239,68,68,0.08), #fff); }
  .workout-card-intensity-extreme { @apply border-l-4 border-fitness-hiit-500; background-image: linear-gradient(90deg, rgba(245,158,11,0.08), #fff); }

  .exercise-card { @apply card p-6 bg-white border border-neutral-200 hover:border-primary-300 transition-all duration-300; }
  .exercise-card-active { @apply border-primary-500; background-image: linear-gradient(90deg, rgb(var(--nf-primary-500) / 0.08), #fff); @apply shadow-glow-primary; }

  .progress-ring { @apply relative inline-flex items-center justify-center; }
  .progress-ring-background { @apply absolute inset-0 rounded-full border-4 border-neutral-200; }
  .progress-ring-fill { @apply absolute inset-0 rounded-full border-4 border-primary-500 transition-all duration-500; transform: rotate(-90deg); stroke-dasharray: calc(var(--progress) * 2.51) 251; }

  .timer-display { @apply text-6xl font-mono font-bold text-center tabular-nums; }
  .timer-active { @apply text-primary-600 animate-workout-pulse; }
  .timer-rest { @apply text-fitness-recovery-500 animate-rest-breathe; }
  .timer-warning { @apply text-warning-500 animate-pulse; }

  .achievement-badge { @apply inline-flex items-center px-4 py-2 rounded-full font-semibold text-sm; }
  .achievement-bronze { @apply achievement-badge text-white; background-image: linear-gradient(90deg, #b45309, #92400e); box-shadow: 0 8px 24px rgba(180,83,9,0.35); }
  .achievement-silver { @apply achievement-badge text-white; background-image: linear-gradient(90deg, #9ca3af, #6b7280); box-shadow: 0 8px 24px rgba(107,114,128,0.35); }
  .achievement-gold { @apply achievement-badge text-white; background-image: linear-gradient(90deg, #f59e0b, #eab308); box-shadow: 0 8px 24px rgba(234,179,8,0.35); }

  .motivation-text { @apply text-lg font-semibold bg-gradient-energy bg-clip-text text-transparent; }
  .energy-button { @apply btn-primary relative overflow-hidden; }
  .energy-button::before { content: ''; @apply absolute inset-0; background-image: linear-gradient(135deg, #22d3ee, #6366f1); opacity: 0; transition: opacity .3s; }
  .energy-button:hover::before { opacity: .2; }
}

/* --------------------------------------------------------------------------------
   RESPONSIVE + PRINT
---------------------------------------------------------------------------------*/

/* Mobile optimizations */
@media (max-width: 768px) {
  .btn, .button, button { min-height: 44px; min-width: 44px; }
  body { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
  .container { padding-left: 1rem; padding-right: 1rem; }
  .card { margin-bottom: 1rem; border-radius: 1rem; }
  .workout-card { padding: 1rem; margin-bottom: 0.75rem; }
  .timer-display { font-size: 3rem; }
  .progress-ring { width: 80px; height: 80px; }
  .nav-item { padding: 0.75rem; min-height: 60px; }
  .workout-interface { padding: 1rem; margin-bottom: 80px; }
  .modal { margin: 1rem; max-height: calc(100vh - 2rem); overflow-y: auto; }
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  .container { padding-left: 2rem; padding-right: 2rem; }
  .workout-card { padding: 1.5rem; }
}

/* HiDPI */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .icon, .badge, .button { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
}

/* Print */
@media print {
  .no-print { display: none !important; }
  .print-only { display: block !important; }
  * { background: transparent !important; color: black !important; box-shadow: none !important; text-shadow: none !important; }
  a, a:visited { text-decoration: underline; }
  a[href]::after { content: " (" attr(href) ")"; }
  .card { border: 1px solid #000; page-break-inside: avoid; }
}
```

---

## `src/vite-env.d.ts`

**Description:** Vite environment type definitions

```typescript
/// <reference types="vite/client" />

```

---

## `src/lib/firebase.ts`

**Description:** Firebase configuration and initialization

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, 'us-central1');

// Connect to emulators in development
if (import.meta.env.DEV) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8081);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('🔧 Connected to Firebase emulators');
  } catch (error) {
    console.warn('⚠️ Failed to connect to emulators, using production:', error);
  }
}

export default app;

```

---

## `src/types/index.ts`

**Description:** Shared TypeScript type definitions for the application

```typescript
/**
 * NeuraFit — Shared Domain Types
 * --------------------------------------------------------------------------
 * This file defines the domain model used across pages, services, and store.
 * It is designed to be:
 *  - Backward‑compatible with existing code (same field names/shapes).
 *  - Easy to consume in UI (exported literal arrays for pickers).
 *  - Clear on units (seconds/minutes) and semantics via JSDoc.
 */

/* =============================================================================
 * Utility Aliases (non-breaking, optional)
 * ============================================================================= */

/** Describes an ISO 8601 date-time string (e.g., "2025-01-31T12:00:00.000Z"). */
export type ISODateString = string;
/** Seconds (e.g., restTime, interval durations). Plain number with docs. */
export type Seconds = number;
/** Minutes (e.g., estimatedDuration, session length). Plain number with docs. */
export type Minutes = number;
/** Simple branded ID helpers (optional; still compatible with plain string). */
export type Id<T extends string> = string & { readonly __idBrand?: T };
export type UserId = Id<'User'>;
export type WorkoutPlanId = Id<'WorkoutPlan'>;
export type WorkoutSessionId = Id<'WorkoutSession'>;
export type ExerciseId = Id<'Exercise'>;

/* =============================================================================
 * Literals & Unions
 * ============================================================================= */

export const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type FitnessLevel = (typeof FITNESS_LEVELS)[number];

export const FITNESS_GOALS = [
  'lose_weight',
  'build_muscle',
  'improve_cardio',
  'improve_flexibility',
  'general_fitness',
  'sport_specific',
] as const;
export type FitnessGoal = (typeof FITNESS_GOALS)[number];

export const EQUIPMENT_TYPES = [
  'bodyweight',
  'dumbbells',
  'barbell',
  'kettlebells',
  'resistance_bands',
  'pull_up_bar',
  'yoga_mat',
  'cardio_machine',
  'gym_access',
] as const;
export type Equipment = (typeof EQUIPMENT_TYPES)[number];

export const WORKOUT_TYPES = [
  'strength_training',
  'cardio',
  'hiit',
  'yoga',
  'pilates',
  'stretching',
  'functional',
  'circuit',
] as const;
export type WorkoutType = (typeof WORKOUT_TYPES)[number];

/** Common 3‑step intensity that matches onboarding & generator UI. */
export type Intensity = 'low' | 'moderate' | 'high';

/** Canonical status values for workout sessions. */
export type WorkoutStatus = 'in_progress' | 'completed' | 'paused' | 'cancelled';

/** Optional hint for time‑of‑day selections (UI may still use raw strings). */
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/* =============================================================================
 * Users & Profiles
 * ============================================================================= */

/** Authenticated user (client projection of Firebase user). */
export interface User {
  id: string /* or UserId */;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Scheduling/availability for plan generation.
 * @example { daysPerWeek: 4, minutesPerSession: 45, preferredTimes: ['morning', 'evening'] }
 */
export interface TimeCommitment {
  daysPerWeek: number;           // 1..7
  minutesPerSession: Minutes;    // typical 10..180
  preferredTimes: string[];      // free-form or use TimeOfDay[]
}

/** User preferences that influence generation/adaptation. */
export interface UserPreferences {
  workoutTypes: WorkoutType[];
  intensity: Intensity;
  /** 0=Sunday .. 6=Saturday (or use any convention your UI enforces) */
  restDayPreference: number;
  /** Free‑form list. Keep short, like "left knee", "lower back". */
  injuriesOrLimitations: string[];
}

/** User profile stored in Firestore and used for AI generation. */
export interface UserProfile {
  userId: string /* or UserId */;
  fitnessLevel: FitnessLevel;
  fitnessGoals: FitnessGoal[];
  availableEquipment: Equipment[];
  timeCommitment: TimeCommitment;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

/* =============================================================================
 * Exercises & Workouts
 * ============================================================================= */

/**
 * Exercise catalogue entry.
 * - `duration`/`reps`/`sets` are default suggestions; a plan can override per workout.
 */
export interface Exercise {
  id: string /* or ExerciseId */;
  name: string;
  description: string;
  instructions: string[];
  targetMuscles: string[];           // keep string[] for compatibility; derive unions later if needed
  equipment: Equipment[];
  difficulty: FitnessLevel;

  /** Defaults (may be overridden in a plan) */
  duration?: Seconds;                // e.g., 45 sec
  reps?: number;
  sets?: number;
  restTime?: Seconds;

  videoUrl?: string;
  imageUrl?: string;

  tips: string[];
  progressionNotes?: string;         // How to scale up/down
  alternatives?: string[];           // Names/IDs of alternates if equipment is missing
  formCues?: string[];               // Key coaching cues
}

/**
 * A single prescribed exercise inside a workout.
 * Backward compatible: you can still use `reps?` and/or `duration?` directly.
 * `scheme` is optional but helpful to signal intent in UIs.
 */
export interface WorkoutExercise {
  exerciseId: string /* or ExerciseId */;
  exercise: Exercise;

  /** Number of working sets for this exercise (not including warmup sets). */
  sets: number;

  /** Choose one or both, depending on the protocol (kept optional for compatibility). */
  reps?: number;         // repetition‑based scheme
  duration?: Seconds;    // time‑based scheme (e.g., EMOM, AMRAP, intervals)

  /** Planned intra‑set rest. */
  restTime: Seconds;

  /** Optional load (kg/lb); leave undefined for BW or variable progression. */
  weight?: number;

  notes?: string;
  /** Stable ordering within the workout. 0‑based or 1‑based (UI decides). */
  order: number;

  /**
   * Optional discriminator: when set, helps UIs pick correct controls.
   * - "reps": rep‑count focus
   * - "time": time‑under‑tension or interval focus
   * - "hybrid": both reps and time supplied
   */
  scheme?: 'reps' | 'time' | 'hybrid';
}

/** Full workout definition produced by AI or authored manually. */
export interface WorkoutPlan {
  id: string /* or WorkoutPlanId */;
  userId: string /* or UserId */;

  name: string;
  description: string;
  type: WorkoutType;
  difficulty: FitnessLevel;

  /** Estimated total time to complete (minutes). */
  estimatedDuration: Minutes;

  /** Main block of the workout in execution order. */
  exercises: WorkoutExercise[];

  /** Equipment needed to complete this workout. */
  equipment: Equipment[];

  /** Broad tags for filtering/search (kept string[] for compatibility). */
  targetMuscles: string[];

  createdAt: Date;

  /** Meta */
  aiGenerated: boolean;
  /** Snapshot summary of the user context used for personalization (free‑form). */
  personalizedFor: string;

  /** Optional structured warm‑up/cool‑down blocks. */
  warmUp?: WorkoutExercise[];
  coolDown?: WorkoutExercise[];

  /** Coaching & adherence helpers */
  progressionTips?: string[];
  motivationalQuote?: string;
  calorieEstimate?: number;

  /** Provenance for adaptive flows */
  adaptedFrom?: string;       // workout ID this was adapted from
  adaptationReason?: string;  // explanation for user
}

/* =============================================================================
 * Sessions & Tracking
 * ============================================================================= */

/** A set completed within an exercise during a session. */
export interface CompletedSet {
  reps?: number;
  weight?: number;
  duration?: Seconds;
  restTime?: Seconds;
  completed: boolean;
}

/** Per‑exercise completion info for a session. */
export interface CompletedExercise {
  exerciseId: string /* or ExerciseId */;
  sets: CompletedSet[];
  notes?: string;
  skipped: boolean;
  completedAt: Date;
}

/** A concrete instance of a user performing a workout plan. */
export interface WorkoutSession {
  id: string /* or WorkoutSessionId */;
  userId: string /* or UserId */;
  workoutPlanId: string /* or WorkoutPlanId */;
  workoutPlan: WorkoutPlan;

  startTime: Date;
  endTime?: Date;

  completedExercises: CompletedExercise[];
  status: WorkoutStatus;

  /** Optional post‑session reflection */
  notes?: string;
  rating?: number;     // 1–5
  feedback?: string;   // free‑form
}

/** Body metrics (unit system decided by UI; document in labels). */
export interface BodyMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
  neck?: number;
}

/** Lightweight progress log for trends & analytics. */
export interface ProgressMetrics {
  userId: string /* or UserId */;
  date: Date;
  weight?: number;
  bodyFatPercentage?: number;
  measurements?: BodyMeasurements;
  photos?: string[];  // URLs or storage paths
  notes?: string;
}

/* =============================================================================
 * AI Generation & Adaptation
 * ============================================================================= */

/** Request payload to generate a workout for a specific user context. */
export interface WorkoutGenerationRequest {
  userId: string /* or UserId */;

  fitnessLevel: FitnessLevel;
  fitnessGoals: FitnessGoal[];
  availableEquipment: Equipment[];
  timeCommitment: TimeCommitment;

  workoutType: WorkoutType;

  /** Optional context of previous workouts (IDs) for continuity. */
  previousWorkouts?: string[];

  /** Active preferences for this generation (combines baseline + overrides). */
  preferences: UserPreferences;

  /** 1–10 coarser control for progression; higher → harder. */
  progressionLevel?: number;

  /** Optional focus tags (e.g., 'upper', 'core', 'mobility'). */
  focusAreas?: string[];
}

/** Raw AI response used by the app to construct a plan record. */
export interface AIWorkoutResponse {
  /** The generated plan (without server‑side identity fields). */
  workoutPlan: Omit<WorkoutPlan, 'id' | 'userId' | 'createdAt'>;

  /** Human‑readable rationale (great for tooltips or “Why this?” modals). */
  reasoning: string;

  /** What was adapted vs baseline template. */
  adaptations: string[];

  /** Suggestions to progress this workout over time. */
  progressionSuggestions: string[];
}

/** Inputs captured after a session to adapt the next one. */
export interface AdaptiveWorkoutRequest {
  previousWorkoutId: string;
  /** Session feedback metrics */
  performanceRating: number;     // 1–5
  completionRate: number;        // 0..1
  difficultyFeedback: 'too_easy' | 'just_right' | 'too_hard';
  timeActual: Minutes;           // actual minutes
  specificFeedback?: string;
}

/** Adaptive generation response. */
export interface AdaptiveWorkoutResponse {
  success: boolean;
  workoutPlan: WorkoutPlan & { id: string };
  adaptations: {
    /** New internal progression level chosen by the engine. */
    newProgressionLevel: number;
    /** Scalar intensity adjustment (e.g., 0.9, 1.1). */
    intensityAdjustment: number;
    /** Focus set for the next workout. */
    focusAreas: string[];
    /** Human‑readable reason to surface in UI. */
    reason: string;
  };
}

/* =============================================================================
 * Analytics
 * ============================================================================= */

/** Minimal performance analytics snapshot per workout (for trends). */
export interface WorkoutPerformance {
  workoutId: string /* or WorkoutPlanId */;
  userId: string /* or UserId */;
  startTime: Date;
  endTime: Date;

  completedExercises: number;
  totalExercises: number;
  averageRestTime: Seconds;

  /** Self‑reported metrics */
  perceivedExertion: number;   // RPE 1–10
  enjoymentRating: number;     // 1–5
  difficultyRating: number;    // 1–5

  notes?: string;
}

/* =============================================================================
 * Optional DTO helpers (useful for services)
 * ============================================================================= */

/**
 * Input shape for creating/updating a profile via cloud functions.
 * Mirrors `UserProfile` but omits server-managed fields.
 * Use in `UserProfileService` to avoid re-declaring string literal unions.
 */
export interface UserProfileInput {
  fitnessLevel: FitnessLevel;
  fitnessGoals: FitnessGoal[];
  availableEquipment: Equipment[];
  timeCommitment: TimeCommitment;
  preferences: UserPreferences;
}
```

---

## `src/store/authStore.ts`

**Description:** Authentication state management using Zustand

```typescript
import { create } from 'zustand';
import type { User, UserProfile } from '../types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  onboardingCompleted: boolean;
  isOnboarded: boolean; // Alias for onboardingCompleted for compatibility
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setOnboardingCompleted: (completed: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,
  onboardingCompleted: false,
  isOnboarded: false, // Alias for onboardingCompleted
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setOnboardingCompleted: (completed) => set({ onboardingCompleted: completed, isOnboarded: completed }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

```

---

## `src/store/workoutStore.ts`

**Description:** Workout state management using Zustand

```typescript
import { create } from 'zustand';
import type { WorkoutPlan, WorkoutSession } from '../types';

interface WorkoutState {
  currentWorkout: WorkoutPlan | null;
  activeSession: WorkoutSession | null;
  workoutHistory: WorkoutSession[];
  error: string | null;
  setCurrentWorkout: (workout: WorkoutPlan | null) => void;
  setActiveSession: (session: WorkoutSession | null) => void;
  setWorkoutHistory: (history: WorkoutSession[]) => void;
  addToHistory: (session: WorkoutSession) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  currentWorkout: null,
  activeSession: null,
  workoutHistory: [],
  error: null,
  setCurrentWorkout: (workout) => set({ currentWorkout: workout }),
  setActiveSession: (session) => set({ activeSession: session }),
  setWorkoutHistory: (history) => set({ workoutHistory: history }),
  addToHistory: (session) => {
    const { workoutHistory } = get();
    set({ workoutHistory: [session, ...workoutHistory] });
  },
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));

```

---

## `src/services/authService.ts`

**Description:** Authentication service layer

```typescript
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { logger } from '../utils/logger';
import type { User } from '../types';

export class AuthError extends Error {
  public code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
}

export class AuthService {
  // Convert Firebase user to our User type
  private static mapFirebaseUser(firebaseUser: FirebaseUser): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // Convert Firebase errors to our AuthError type
  private static toAuthError(err: any): AuthError {
    const code = err?.code || 'auth/unknown';
    let message = 'An authentication error occurred.';

    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        message = 'Invalid email or password.';
        break;
      case 'auth/email-already-in-use':
        message = 'An account with this email already exists.';
        break;
      case 'auth/weak-password':
        message = 'Password should be at least 6 characters.';
        break;
      case 'auth/invalid-email':
        message = 'Please enter a valid email address.';
        break;
      case 'auth/popup-blocked':
        message = 'Popup was blocked. Please allow popups and try again.';
        break;
      case 'auth/popup-closed-by-user':
        message = 'Sign-in was cancelled. Please try again.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection and try again.';
        break;
      default:
        message = err?.message || message;
    }

    return new AuthError(code, message);
  }

  // Email sign up
  static async signUp(data: SignUpData): Promise<User> {
    console.log('🔵 AuthService.signUp: Starting email sign-up', { email: data.email });
    
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // Update display name
      await updateProfile(cred.user, { displayName: data.displayName });
      
      // Refresh the user to get updated profile
      await cred.user.reload();
      const updatedUser = auth.currentUser!;
      
      console.log('✅ AuthService.signUp: Email sign-up successful', { uid: updatedUser.uid });
      logger.auth.login(updatedUser.uid);
      
      return this.mapFirebaseUser(updatedUser);
    } catch (err: any) {
      console.error('❌ AuthService.signUp: Email sign-up failed', err);
      logger.auth.error('Email sign up failed', err as Error);
      throw this.toAuthError(err);
    }
  }

  // Email sign in
  static async signIn(email: string, password: string): Promise<User> {
    console.log('🔵 AuthService.signIn: Starting email sign-in', { email });
    
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ AuthService.signIn: Email sign-in successful', { uid: cred.user.uid });
      logger.auth.login(cred.user.uid);
      
      return this.mapFirebaseUser(cred.user);
    } catch (err: any) {
      console.error('❌ AuthService.signIn: Email sign-in failed', err);
      logger.auth.error('Email sign in failed', err as Error);
      throw this.toAuthError(err);
    }
  }

  // Google sign in - simplified popup only
  static async signInWithGoogle(): Promise<User> {
    console.log('🔵 AuthService.signInWithGoogle: Starting Google sign-in');
    
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      console.log('🪟 AuthService.signInWithGoogle: Opening Google popup');
      const cred = await signInWithPopup(auth, provider);
      
      console.log('✅ AuthService.signInWithGoogle: Google sign-in successful', {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName
      });
      
      logger.auth.login(cred.user.uid);
      return this.mapFirebaseUser(cred.user);
    } catch (err: any) {
      console.error('❌ AuthService.signInWithGoogle: Google sign-in failed', err);
      logger.auth.error('Google sign in failed', err as Error);
      throw this.toAuthError(err);
    }
  }

  // Apple sign in - simplified popup only
  static async signInWithApple(): Promise<User> {
    console.log('🍎 AuthService.signInWithApple: Starting Apple sign-in');
    
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');

    try {
      console.log('🪟 AuthService.signInWithApple: Opening Apple popup');
      const cred = await signInWithPopup(auth, provider);
      
      console.log('✅ AuthService.signInWithApple: Apple sign-in successful', {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName
      });
      
      logger.auth.login(cred.user.uid);
      return this.mapFirebaseUser(cred.user);
    } catch (err: any) {
      console.error('❌ AuthService.signInWithApple: Apple sign-in failed', err);
      logger.auth.error('Apple sign in failed', err as Error);
      throw this.toAuthError(err);
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    console.log('🚪 AuthService.signOut: Signing out');
    
    try {
      await fbSignOut(auth);
      console.log('✅ AuthService.signOut: Sign out successful');
    } catch (err: any) {
      console.error('❌ AuthService.signOut: Sign out failed', err);
      logger.auth.error('Sign out failed', err as Error);
      throw new AuthError('auth/signout-failed', 'Failed to sign out. Please try again.');
    }
  }

  // Reset password
  static async resetPassword(email: string): Promise<void> {
    console.log('🔄 AuthService.resetPassword: Sending reset email', { email });
    
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('✅ AuthService.resetPassword: Reset email sent');
    } catch (err: any) {
      console.error('❌ AuthService.resetPassword: Failed to send reset email', err);
      logger.auth.error('Failed to send password reset email', err as Error);
      throw this.toAuthError(err);
    }
  }
}

```

---

## `src/services/workoutService.ts`

**Description:** Workout-related API service calls

```typescript
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import { logger } from '../utils/logger';
import type {
  WorkoutGenerationRequest,
  WorkoutPlan,
  WorkoutSession,
  Exercise,
  AdaptiveWorkoutRequest,
  AdaptiveWorkoutResponse,
  CompletedExercise,
  FitnessLevel,
  WorkoutType,
  Equipment,
} from '../types';

/** ---- Shared helpers ------------------------------------------------------ */

const CALLABLE_TIMEOUT_MS = 15_000;

function withTimeout<T>(p: Promise<T>, ms = CALLABLE_TIMEOUT_MS, label = 'request'): Promise<T> {
  let id: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    id = window.setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(id));
}

function mapFunctionsError(error: any): Error {
  const code = error?.code as string | undefined;
  const msg = error?.message as string | undefined;

  const nice =
    code === 'functions/invalid-argument' ? 'Invalid data sent to server.'
    : code === 'functions/permission-denied' ? 'You do not have permission to perform this action.'
    : code === 'functions/not-found' ? 'Resource not found.'
    : code === 'functions/deadline-exceeded' ? 'The server took too long to respond.'
    : code === 'functions/resource-exhausted' ? 'Server rate limit exceeded. Please retry shortly.'
    : code === 'functions/unavailable' ? 'Service temporarily unavailable. Check your connection and retry.'
    : msg || 'An unexpected error occurred.';

  return new Error(nice);
}

async function callFn<TReq, TRsp>(name: string, payload: TReq): Promise<TRsp> {
  logger.api.request(name, 'callable');
  const fn = httpsCallable<TReq, TRsp>(functions, name);
  const started = performance.now();

  try {
    const res = await withTimeout(fn(payload), CALLABLE_TIMEOUT_MS, name);
    logger.api.response(name, 200, performance.now() - started);
    return res.data;
  } catch (err: any) {
    logger.api.error(name, err);
    throw mapFunctionsError(err);
  }
}

/** ---- Contracts from Functions ------------------------------------------- */

export interface GenerateWorkoutResponse {
  success: boolean;
  workoutPlan: WorkoutPlan & { id: string };
}

export interface GetExercisesRequest {
  equipment?: Equipment[];
  targetMuscles?: string[];
  difficulty?: FitnessLevel;
  /** Optional category/kind of exercise (maps to your WorkoutType) */
  category?: WorkoutType;
  limit?: number;
  /** Optional free-text query */
  search?: string;
}

export interface GetExercisesResponse {
  exercises: (Exercise & { id: string })[];
}

export interface CompleteWorkoutSessionRequest {
  sessionId: string;
  completedExercises: CompletedExercise[];
  rating?: number;
  feedback?: string;
}

export interface CompleteWorkoutSessionResponse {
  success: boolean;
}

export interface GetWorkoutHistoryRequest {
  userId: string;
  limit?: number;
}

export interface GetWorkoutHistoryResponse {
  sessions: WorkoutSession[];
}

/** ---- Service ------------------------------------------------------------- */

export class WorkoutService {
  /** Generate an AI-powered workout */
  static async generateWorkout(
    request: WorkoutGenerationRequest,
  ): Promise<WorkoutPlan & { id: string }> {
    const data = await callFn<WorkoutGenerationRequest, GenerateWorkoutResponse>(
      'generateWorkout',
      request
    );

    if (!data?.success || !data.workoutPlan) {
      throw new Error('Failed to generate workout');
    }
    logger.workout.generated(request.userId, data.workoutPlan.id);
    return data.workoutPlan;
  }

  /** Get exercises by filters */
  static async getExercises(request: GetExercisesRequest = {}): Promise<(Exercise & { id: string })[]> {
    const data = await callFn<GetExercisesRequest, GetExercisesResponse>('getExercises', request);
    return data.exercises ?? [];
  }

  /** Initialize exercise database (admin) */
  static async initializeExercises(): Promise<void> {
    // Send {} to satisfy callable signature even if no args are used.
    await callFn<Record<string, never>, unknown>('initializeExercises', {});
  }

  /** Start a workout session (local-only construction; persistence handled elsewhere) */
  static async startWorkoutSession(workoutPlanId: string): Promise<WorkoutSession> {
    const session: WorkoutSession = {
      id: `session_${Date.now()}`,
      userId: '', // set by caller (e.g., component with auth context)
      workoutPlanId,
      workoutPlan: {} as WorkoutPlan, // populate upstream
      startTime: new Date(),
      completedExercises: [],
      status: 'in_progress',
    };
    return session;
  }

  /** Complete a workout session (persists via function if available) */
  static async completeWorkoutSession(
    sessionId: string,
    completedExercises: CompletedExercise[],
    rating?: number,
    feedback?: string,
  ): Promise<void> {
    try {
      await callFn<CompleteWorkoutSessionRequest, CompleteWorkoutSessionResponse>(
        'completeWorkoutSession',
        { sessionId, completedExercises, rating, feedback }
      );
      logger.workout.completed('current_user', sessionId);
    } catch (err) {
      // If a cloud function isn't deployed yet, keep UX flowing and surface a friendly message upstream.
      logger.workout.error('completeWorkoutSession failed', err as Error);
      throw err instanceof Error ? err : new Error('Failed to save workout session');
    }
  }

  /** Get workout history (server-backed); falls back to [] on error */
  static async getWorkoutHistory(userId: string, limit = 10): Promise<WorkoutSession[]> {
    try {
      const data = await callFn<GetWorkoutHistoryRequest, GetWorkoutHistoryResponse>(
        'getWorkoutHistory',
        { userId, limit }
      );
      return data.sessions ?? [];
    } catch (err) {
      // Keep the existing page functional if the function isn’t available yet
      logger.workout.error('getWorkoutHistory failed', err as Error);
      return [];
    }
  }

  /** Generate adaptive workout based on previous performance */
  static async generateAdaptiveWorkout(
    request: AdaptiveWorkoutRequest
  ): Promise<AdaptiveWorkoutResponse> {
    const data = await callFn<AdaptiveWorkoutRequest, AdaptiveWorkoutResponse>(
      'generateAdaptiveWorkout',
      request
    );

    if (!data?.success) {
      throw new Error('Failed to generate adaptive workout');
    }
    return data;
  }

  /** Analyze workout trends and progress */
  static async getWorkoutAnalytics(
    userId: string,
    timeframe: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<any> {
    const data = await callFn<{ userId: string; timeframe: string }, any>(
      'getWorkoutAnalytics',
      { userId, timeframe }
    );
    return data;
  }
}
```

---

## `src/services/userProfileService.ts`

**Description:** User profile API service calls

```typescript
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';
import type {
  UserProfile,
  FitnessLevel,
  FitnessGoal,
  Equipment,
  TimeCommitment,
  UserPreferences,
} from '../types';
import { logger } from '../utils/logger';

/** ---- Shared helpers ------------------------------------------------------ */

const CALLABLE_TIMEOUT_MS = 15_000;

function withTimeout<T>(p: Promise<T>, ms = CALLABLE_TIMEOUT_MS, label = 'request'): Promise<T> {
  let id: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    id = window.setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([p, timeout]).finally(() => clearTimeout(id));
}

function mapFunctionsError(error: any): Error {
  const code = error?.code as string | undefined; // e.g. "functions/invalid-argument"
  const msg = error?.message as string | undefined;

  const nice =
    code === 'functions/invalid-argument' ? 'Invalid data sent to server.'
    : code === 'functions/permission-denied' ? 'You do not have permission to perform this action.'
    : code === 'functions/not-found' ? 'Resource not found.'
    : code === 'functions/deadline-exceeded' ? 'The server took too long to respond.'
    : code === 'functions/resource-exhausted' ? 'Server rate limit exceeded. Please retry shortly.'
    : code === 'functions/unavailable' ? 'Service temporarily unavailable. Check your connection and retry.'
    : msg || 'An unexpected error occurred.';

  return new Error(nice);
}

async function callFn<TReq, TRsp>(name: string, payload: TReq): Promise<TRsp> {
  logger.api.request(name, 'callable');
  const fn = httpsCallable<TReq, TRsp>(functions, name);
  const started = performance.now();

  try {
    const res = await withTimeout(fn(payload), CALLABLE_TIMEOUT_MS, name);
    logger.api.response(name, 200, performance.now() - started);
    return res.data;
  } catch (err: any) {
    logger.api.error(name, err);
    throw mapFunctionsError(err);
  }
}

/** ---- Request/response contracts ----------------------------------------- */

export interface CreateUserProfileRequest {
  fitnessLevel: FitnessLevel;
  fitnessGoals: FitnessGoal[];
  availableEquipment: Equipment[];
  timeCommitment: TimeCommitment;
  preferences: UserPreferences;
}

export interface UserProfileResponse {
  success: boolean;
  message?: string;
}

export interface GetUserProfileResponse {
  profile: UserProfile | null;
}

/** ---- Service ------------------------------------------------------------- */

export class UserProfileService {
  /**
   * Create (or overwrite) the signed-in user's profile.
   * The server derives the UID from auth context; no need to pass it.
   */
  static async createUserProfile(profileData: CreateUserProfileRequest): Promise<void> {
    const data = await callFn<CreateUserProfileRequest, UserProfileResponse>(
      'createUserProfile',
      profileData
    );

    if (!data?.success) {
      throw new Error(data?.message || 'Failed to create user profile');
    }
  }

  /**
   * Get the signed-in user's profile.
   */
  static async getUserProfile(): Promise<UserProfile | null> {
    // Prefer sending an empty object to avoid TS friction on "no-arg" callables
    const data = await callFn<Record<string, never>, GetUserProfileResponse>('getUserProfile', {});
    return data.profile ?? null;
  }

  /**
   * Partially update the signed-in user's profile.
   */
  static async updateUserProfile(updates: Partial<CreateUserProfileRequest>): Promise<void> {
    const data = await callFn<Partial<CreateUserProfileRequest>, UserProfileResponse>(
      'updateUserProfile',
      updates
    );

    if (!data?.success) {
      throw new Error(data?.message || 'Failed to update user profile');
    }
  }
}
```

---

## `src/utils/animations.ts`

**Description:** Animation utilities and configurations

```typescript
import type { Variants, Transition } from 'framer-motion';

// Standard easing curves
export const easings = {
  easeOut: [0.4, 0, 0.2, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
} as const;

// Standard transitions
export const transitions = {
  fast: { duration: 0.2 } as Transition,
  normal: { duration: 0.3 } as Transition,
  slow: { duration: 0.5 } as Transition,
} as const;

// Common animation variants
export const fadeUp = (delay = 0): Variants => ({
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay }
  },
});

export const fadeIn = (delay = 0): Variants => ({
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3, delay }
  },
});

export const slideInUp = (delay = 0): Variants => ({
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay }
  },
});

export const slideInDown = (delay = 0): Variants => ({
  initial: { opacity: 0, y: -20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay }
  },
});

export const slideInLeft = (delay = 0): Variants => ({
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, delay }
  },
});

export const slideInRight = (delay = 0): Variants => ({
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, delay }
  },
});

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  },
};

// Page transition variants
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const pageTransition: Transition = {
  duration: 0.25,
};

```

---

## `src/utils/logger.ts`

**Description:** Logging utilities for debugging and monitoring

```typescript
/**
 * Simple logging utility for NeuraFit
 * Provides basic logging with environment-aware behavior
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  userId?: string;
  action?: string;
  [key: string]: any;
}

class SimpleLogger {
  private isDev = import.meta.env.DEV;

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext) {
    if (this.isDev) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error, context?: LogContext) {
    const errorContext = error ? { ...context, error: error.message, stack: error.stack } : context;
    console.error(this.formatMessage('error', message, errorContext));

    // In production, you could send to external service here
    if (!this.isDev && error) {
      // Simple error reporting could go here
    }
  }

  // Convenience methods for common use cases
  auth = {
    login: (userId: string) => this.info('User logged in', { userId, action: 'login' }),
    logout: (userId: string) => this.info('User logged out', { userId, action: 'logout' }),
    warn: (message: string, context?: LogContext) => this.warn(`Auth warning: ${message}`, { ...context, component: 'auth' }),
    error: (message: string, error?: Error) => this.error(`Auth error: ${message}`, error, { component: 'auth' })
  };

  workout = {
    generated: (userId: string, workoutId: string) =>
      this.info('Workout generated', { userId, workoutId, action: 'generate' }),
    started: (userId: string, workoutId: string) =>
      this.info('Workout started', { userId, workoutId, action: 'start' }),
    completed: (userId: string, workoutId: string) =>
      this.info('Workout completed', { userId, workoutId, action: 'complete' }),
    error: (message: string, error?: Error) =>
      this.error(`Workout error: ${message}`, error, { component: 'workout' })
  };

  api = {
    request: (endpoint: string, method: string) =>
      this.debug('API request', { endpoint, method, action: 'request' }),
    response: (endpoint: string, status: number, duration?: number) =>
      this.debug('API response', { endpoint, status, duration, action: 'response' }),
    error: (endpoint: string, error: Error) =>
      this.error(`API error: ${endpoint}`, error, { component: 'api' })
  };
}

export const logger = new SimpleLogger();

```

---

## `src/pages/DashboardPage.tsx`

**Description:** Main dashboard page with workout generation CTA

```typescript
// src/pages/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';

import { Button } from '../components/ui/Button';
import { GradientCard } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageContainer } from '../components/ui/Container';
import { WorkoutGenerationModal } from '../components/workout/WorkoutGenerationModal';

import { useAuthStore } from '../store/authStore';
import { UserProfileService } from '../services/userProfileService';

/* --------------------------------- Page --------------------------------- */

export const DashboardPage: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const { user, profile, loading, setProfile, setLoading } = useAuthStore();

  const [showWorkoutModal, setShowWorkoutModal] = useState(false);

  useEffect(() => {
    document.title = 'Dashboard • NeuraFit';
  }, []);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userProfile = await UserProfileService.getUserProfile();
        setProfile(userProfile);
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && !profile) {
      loadUserProfile();
    } else if (user && profile) {
      setLoading(false);
    }
  }, [user, profile, setProfile, setLoading]);

  /* --------------------------------- Load --------------------------------- */

  if (loading) {
    return (
      <PageContainer>
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <h3 className="mb-2 text-lg font-medium text-neutral-900">
              Loading your dashboard
            </h3>
            <p className="text-neutral-600">Getting your fitness data ready…</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  /* --------------------------------- View --------------------------------- */

  return (
    <>
      {/* Development Emulator Warning */}
      {import.meta.env.DEV && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-amber-800 text-center">
              <span className="font-medium">Development Mode:</span> Running with Firebase emulators. Do not use with production credentials.
            </p>
          </div>
        </div>
      )}
      
      <PageContainer>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5 }}
          className="mb-12"
        >
          <div className="text-center">
            <h1 className="text-4xl font-display font-bold leading-tight text-transparent bg-gradient-energy bg-clip-text lg:text-5xl mb-4">
              Welcome back, {user?.displayName?.split(' ')[0] || 'Champion'}!
            </h1>
            <p className="text-xl font-light text-neutral-600">Ready to crush your fitness goals today?</p>
          </div>
        </motion.div>

        {/* Generate AI Workout - Main CTA */}
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <div className="max-w-2xl mx-auto">
            <GradientCard
              hover
              interactive
              onClick={() => setShowWorkoutModal(true)}
              className="group relative min-h-[280px] cursor-pointer overflow-hidden"
              ariaLabel="Open AI workout generator"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative z-10 flex h-full flex-col justify-center text-center p-8 sm:p-12">
                <div className="mb-6 flex justify-center">
                  <motion.div
                    animate={reduceMotion ? {} : { scale: [1, 1.1, 1] }}
                    transition={reduceMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}
                    className="flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm"
                  >
                    <SparklesIcon className="h-10 w-10 text-white" aria-hidden />
                  </motion.div>
                </div>
                <div className="mb-4 flex justify-center">
                  <Badge variant="glass" size="md" className="font-semibold">
                    AI Powered
                  </Badge>
                </div>
                <h2 className="mb-4 text-3xl font-display font-bold sm:text-4xl">Generate AI Workout</h2>
                <p className="mb-8 text-lg leading-relaxed text-white/90 max-w-md mx-auto">
                  Get a personalized workout tailored to your goals, preferences, and fitness level
                </p>
                <div className="flex justify-center">
                  <Button 
                    variant="glass" 
                    size="xl" 
                    icon={<SparklesIcon />} 
                    className="transition-transform duration-300 group-hover:scale-105 px-8 py-4 text-lg font-semibold"
                  >
                    Create Your Workout
                  </Button>
                </div>
              </div>
              
              {/* Subtle ambient shapes */}
              {!reduceMotion && (
                <div className="absolute inset-0 opacity-20" aria-hidden>
                  <motion.div
                    className="absolute right-8 top-8 h-32 w-32 rounded-full bg-white"
                    animate={{ scale: [1, 1.12, 1], opacity: [0.1, 0.28, 0.1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute bottom-8 left-8 h-24 w-24 rounded-full bg-white"
                    animate={{ scale: [1, 1.18, 1], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                  />
                </div>
              )}
            </GradientCard>
          </div>
        </motion.div>
      </PageContainer>

      {/* Workout Generation Modal */}
      <WorkoutGenerationModal isOpen={showWorkoutModal} onClose={() => setShowWorkoutModal(false)} userProfile={profile} />
    </>
  );
};

```

---

## `src/pages/WorkoutPage.tsx`

**Description:** Workout interface for active workouts

```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutSelector } from '../components/workout/WorkoutSelector';
import { ActiveWorkout } from '../components/workout/ActiveWorkout';
import { WorkoutComplete } from '../components/workout/WorkoutComplete';
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { WorkoutService } from '../services/workoutService';
import type { WorkoutSession, CompletedExercise } from '../types';

type WorkoutState = 'selecting' | 'active' | 'paused' | 'completed';

export const WorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentWorkout, activeSession, setActiveSession, addToHistory } = useWorkoutStore();
  const [workoutState, setWorkoutState] = useState<WorkoutState>('selecting');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);

  useEffect(() => {
    if (currentWorkout && !activeSession) {
      // If we have a workout but no active session, we're in selection mode
      setWorkoutState('selecting');
    } else if (activeSession) {
      // If we have an active session, determine the state
      if (activeSession.status === 'completed') {
        setWorkoutState('completed');
      } else if (activeSession.status === 'paused') {
        setWorkoutState('paused');
      } else {
        setWorkoutState('active');
      }
    }
  }, [currentWorkout, activeSession]);

  const handleStartWorkout = async () => {
    if (!currentWorkout || !user) return;

    try {
      const session: WorkoutSession = {
        id: `session_${Date.now()}`,
        userId: user.id,
        workoutPlanId: currentWorkout.id || '',
        workoutPlan: currentWorkout,
        startTime: new Date(),
        completedExercises: [],
        status: 'in_progress',
      };

      setActiveSession(session);
      setWorkoutState('active');
      setCurrentExerciseIndex(0);
      setCompletedExercises([]);
    } catch (error) {
      console.error('Error starting workout:', error);
    }
  };

  const handleCompleteExercise = (exerciseData: CompletedExercise) => {
    setCompletedExercises(prev => [...prev, exerciseData]);

    if (currentExerciseIndex < (currentWorkout?.exercises.length || 0) - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      handleCompleteWorkout();
    }
  };

  const handleCompleteWorkout = async () => {
    if (!activeSession) return;

    const completedSession: WorkoutSession = {
      ...activeSession,
      endTime: new Date(),
      completedExercises,
      status: 'completed',
    };

    setActiveSession(completedSession);
    addToHistory(completedSession);
    setWorkoutState('completed');

    try {
      await WorkoutService.completeWorkoutSession(
        activeSession.id,
        completedExercises
      );
    } catch (error) {
      console.error('Error saving workout session:', error);
    }
  };

  const handleWorkoutRating = async (rating: number, feedback?: string) => {
    if (!activeSession) return;

    try {
      await WorkoutService.completeWorkoutSession(
        activeSession.id,
        completedExercises,
        rating,
        feedback
      );
    } catch (error) {
      console.error('Error saving workout rating:', error);
    }
  };

  const handleFinish = () => {
    setActiveSession(null);
    setWorkoutState('selecting');
    setCurrentExerciseIndex(0);
    setCompletedExercises([]);
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AnimatePresence mode="wait">
        {workoutState === 'selecting' && (
          <motion.div
            key="selecting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <WorkoutSelector
              currentWorkout={currentWorkout}
              onStartWorkout={handleStartWorkout}
            />
          </motion.div>
        )}

        {(workoutState === 'active' || workoutState === 'paused') && activeSession && (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <ActiveWorkout
              session={activeSession}
              currentExerciseIndex={currentExerciseIndex}
              onCompleteExercise={handleCompleteExercise}
              onCompleteWorkout={handleCompleteWorkout}
              onPause={() => setWorkoutState('paused')}
              onResume={() => setWorkoutState('active')}
              isPaused={workoutState === 'paused'}
            />
          </motion.div>
        )}

        {workoutState === 'completed' && activeSession && (
          <motion.div
            key="completed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <WorkoutComplete
              session={activeSession}
              onRating={handleWorkoutRating}
              onFinish={handleFinish}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

```

---

## `src/pages/HistoryPage.tsx`

**Description:** Workout history and analytics page

```typescript
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClockIcon,
  FireIcon,
  TrophyIcon,
  StarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
// Simplified history page without complex analytics
import { useWorkoutStore } from '../store/workoutStore';
import { useAuthStore } from '../store/authStore';
import { WorkoutService } from '../services/workoutService';
import type { WorkoutSession } from '../types';

type FilterType = 'all' | 'completed' | 'this_week' | 'this_month';

export const HistoryPage: React.FC = () => {
  const { user } = useAuthStore();
  const { workoutHistory, setWorkoutHistory } = useWorkoutStore();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [filteredWorkouts, setFilteredWorkouts] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    const loadWorkoutHistory = async () => {
      if (!user) return;

      try {
        const history = await WorkoutService.getWorkoutHistory(user.id, 50);
        setWorkoutHistory(history);
      } catch (error) {
        console.error('Error loading workout history:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkoutHistory();
  }, [user, setWorkoutHistory]);

  useEffect(() => {
    let filtered = workoutHistory;

    switch (filter) {
      case 'completed':
        filtered = workoutHistory.filter(w => w.status === 'completed');
        break;
      case 'this_week':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = workoutHistory.filter(w => w.startTime > weekAgo);
        break;
      case 'this_month':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = workoutHistory.filter(w => w.startTime > monthAgo);
        break;
      default:
        filtered = workoutHistory;
    }

    setFilteredWorkouts(filtered);
  }, [workoutHistory, filter]);

  const stats = {
    totalWorkouts: workoutHistory.filter(w => w.status === 'completed').length,
    totalTime: Math.round(workoutHistory.reduce((acc, w) => {
      if (w.endTime && w.startTime && w.status === 'completed') {
        return acc + (w.endTime.getTime() - w.startTime.getTime()) / (1000 * 60);
      }
      return acc;
    }, 0)),
    averageRating: workoutHistory.filter(w => w.rating).length > 0
      ? workoutHistory.reduce((acc, w) => acc + (w.rating || 0), 0) / workoutHistory.filter(w => w.rating).length
      : 0,
    thisWeekWorkouts: workoutHistory.filter(w => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return w.startTime > weekAgo && w.status === 'completed';
    }).length
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card">
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Workout History</h1>
        <p className="text-gray-600 mt-2">Track your progress and achievements</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <TrophyIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Workouts</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalWorkouts}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <ClockIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Time</p>
              <p className="text-2xl font-bold text-gray-900">{formatTime(stats.totalTime)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <StarIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Rating</p>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-gray-900 mr-2">
                  {stats.averageRating.toFixed(1)}
                </p>
                <StarIconSolid className="w-5 h-5 text-yellow-400" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <FireIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisWeekWorkouts}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Simplified analytics - removed complex charts for cleaner architecture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Workout Insights</h3>
          <p className="text-gray-600">
            Detailed analytics and charts will be available in a future update.
            For now, you can view your basic workout statistics above and browse your workout history below.
          </p>
        </motion.div>
      </div>

      {/* Workout History List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="card"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Workouts</h2>

          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Workouts</option>
              <option value="completed">Completed Only</option>
              <option value="this_week">This Week</option>
              <option value="this_month">This Month</option>
            </select>
            <FunnelIcon className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Simple workout list */}
        <div className="space-y-4">
          {filteredWorkouts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No workouts found for the selected period.</p>
            </div>
          ) : (
            filteredWorkouts.map((workout) => (
              <div key={workout.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {workout.workoutPlan?.name || 'Workout'}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    workout.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {workout.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {workout.startTime.toLocaleDateString()} at {workout.startTime.toLocaleTimeString()}
                </p>
                {workout.endTime && (
                  <p className="text-sm text-gray-600">
                    Duration: {formatTime(Math.round((workout.endTime.getTime() - workout.startTime.getTime()) / (1000 * 60)))}
                  </p>
                )}
                {workout.rating && (
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-gray-600 mr-2">Rating:</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${
                            star <= workout.rating! ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};

```

---

## `src/pages/ProfilePage.tsx`

**Description:** User profile management page

```typescript
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

import { useAuthStore } from '../store/authStore';
import { UserProfileService } from '../services/userProfileService';
import { AuthService } from '../services/authService';

import type {
  Equipment,
  FitnessGoal,
  FitnessLevel,
  UserProfile,
  WorkoutType,
} from '../types';

/* --------------------------------- Options --------------------------------- */

const fitnessLevels: { value: FitnessLevel; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const fitnessGoals: { value: FitnessGoal; label: string }[] = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'build_muscle', label: 'Build Muscle' },
  { value: 'improve_cardio', label: 'Improve Cardio' },
  { value: 'improve_flexibility', label: 'Improve Flexibility' },
  { value: 'general_fitness', label: 'General Fitness' },
  { value: 'sport_specific', label: 'Sport Specific' },
];

const equipmentOptions: { value: Equipment; label: string }[] = [
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'kettlebells', label: 'Kettlebells' },
  { value: 'resistance_bands', label: 'Resistance Bands' },
  { value: 'pull_up_bar', label: 'Pull-up bar' },
  { value: 'yoga_mat', label: 'Yoga Mat' },
  { value: 'cardio_machine', label: 'Cardio Machine' },
  { value: 'gym_access', label: 'Gym Access' },
];

const workoutTypes: { value: WorkoutType; label: string }[] = [
  { value: 'strength_training', label: 'Strength Training' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'hiit', label: 'HIIT' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'stretching', label: 'Stretching' },
  { value: 'functional', label: 'Functional' },
  { value: 'circuit', label: 'Circuit' },
];

const preferredTimeOptions = ['Morning', 'Afternoon', 'Evening'] as const;
type PreferredTime = (typeof preferredTimeOptions)[number];

type Intensity = 'low' | 'moderate' | 'high';

/* --------------------------------- Helpers --------------------------------- */

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const toggleInArray = <T,>(arr: T[], value: T) =>
  arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

const sameArray = <T,>(a: T[], b: T[]) =>
  a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);

/** Quick chip control (keyboard accessible) */
const Chip: React.FC<{
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}> = ({ selected, onClick, children, ariaLabel }) => (
  <button
    type="button"
    aria-pressed={!!selected}
    aria-label={ariaLabel}
    onClick={onClick}
    className={[
      'inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition border',
      selected
        ? 'bg-primary-600 text-white border-primary-600 shadow-sm hover:bg-primary-700'
        : 'bg-neutral-100 text-neutral-800 border-neutral-200 hover:bg-neutral-200',
    ].join(' ')}
  >
    {children}
  </button>
);

/* --------------------------------- Types ---------------------------------- */

type FormState = {
  displayName: string;
  fitnessLevel: FitnessLevel | null;
  fitnessGoals: FitnessGoal[];
  availableEquipment: Equipment[];
  timeCommitment: {
    daysPerWeek: number;
    minutesPerSession: number;
    preferredTimes: PreferredTime[];
  };
  preferences: {
    workoutTypes: WorkoutType[];
    intensity: Intensity;
    restDayPreference: number; // 0..6 (Sun..Sat)
    injuriesOrLimitations: string[];
  };
};

/* --------------------------------- Page ----------------------------------- */

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, setProfile } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialForm: FormState = useMemo(
    () => ({
      displayName: user?.displayName || '',
      fitnessLevel: profile?.fitnessLevel ?? null,
      fitnessGoals: profile?.fitnessGoals ?? [],
      availableEquipment: profile?.availableEquipment ?? ['bodyweight'],
      timeCommitment: {
        daysPerWeek: profile?.timeCommitment?.daysPerWeek ?? 3,
        minutesPerSession: profile?.timeCommitment?.minutesPerSession ?? 30,
        preferredTimes:
          (profile?.timeCommitment?.preferredTimes as PreferredTime[] | undefined) ??
          ['Morning'],
      },
      preferences: {
        workoutTypes: profile?.preferences?.workoutTypes ?? ['strength_training'],
        intensity: (profile?.preferences?.intensity as Intensity) ?? 'moderate',
        restDayPreference: profile?.preferences?.restDayPreference ?? 1,
        injuriesOrLimitations: profile?.preferences?.injuriesOrLimitations ?? [],
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.displayName, profile?.updatedAt?.toString()]
  );

  const [form, setForm] = useState<FormState>(initialForm);

  // Load or hydrate on mount
  useEffect(() => {
    document.title = 'Profile • NeuraFit';
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        // If store doesn't have profile, fetch it
        if (!profile) {
          const p = await UserProfileService.getUserProfile();
          if (p) {
            setProfile(p);
          }
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rehydrate form when store profile changes
  useEffect(() => {
    setForm({
      displayName: user?.displayName || '',
      fitnessLevel: profile?.fitnessLevel ?? null,
      fitnessGoals: profile?.fitnessGoals ?? [],
      availableEquipment: profile?.availableEquipment ?? ['bodyweight'],
      timeCommitment: {
        daysPerWeek: profile?.timeCommitment?.daysPerWeek ?? 3,
        minutesPerSession: profile?.timeCommitment?.minutesPerSession ?? 30,
        preferredTimes:
          (profile?.timeCommitment?.preferredTimes as PreferredTime[] | undefined) ??
          ['Morning'],
      },
      preferences: {
        workoutTypes: profile?.preferences?.workoutTypes ?? ['strength_training'],
        intensity: (profile?.preferences?.intensity as Intensity) ?? 'moderate',
        restDayPreference: profile?.preferences?.restDayPreference ?? 1,
        injuriesOrLimitations: profile?.preferences?.injuriesOrLimitations ?? [],
      },
    });
  }, [profile, user?.displayName]);

  const hasChanges = useMemo(() => {
    if (!profile) return true;
    const sameDisplay = (form.displayName || '') === (user?.displayName || '');
    const same =
      form.fitnessLevel === profile.fitnessLevel &&
      sameArray(form.fitnessGoals, profile.fitnessGoals) &&
      sameArray(form.availableEquipment, profile.availableEquipment) &&
      form.timeCommitment.daysPerWeek === profile.timeCommitment.daysPerWeek &&
      form.timeCommitment.minutesPerSession === profile.timeCommitment.minutesPerSession &&
      sameArray(form.timeCommitment.preferredTimes, profile.timeCommitment.preferredTimes as PreferredTime[]) &&
      (form.preferences.intensity === profile.preferences.intensity) &&
      form.preferences.restDayPreference === profile.preferences.restDayPreference &&
      sameArray(form.preferences.injuriesOrLimitations, profile.preferences.injuriesOrLimitations) &&
      sameArray(form.preferences.workoutTypes, profile.preferences.workoutTypes);
    return !(same && sameDisplay);
  }, [form, profile, user?.displayName]);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setStatus(null);

    try {
      // Update Firebase Auth displayName if changed
      if (form.displayName && form.displayName !== (user?.displayName || '')) {
        const { auth } = await import('../lib/firebase');
        const { updateProfile } = await import('firebase/auth');
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: form.displayName });
        }
      }

      // Update profile in backend
      await UserProfileService.updateUserProfile({
        fitnessLevel: form.fitnessLevel ?? 'beginner',
        fitnessGoals: form.fitnessGoals,
        availableEquipment: form.availableEquipment,
        timeCommitment: {
          daysPerWeek: clamp(form.timeCommitment.daysPerWeek, 1, 7),
          minutesPerSession: clamp(form.timeCommitment.minutesPerSession, 10, 180),
          preferredTimes: form.timeCommitment.preferredTimes,
        },
        preferences: {
          workoutTypes: form.preferences.workoutTypes,
          intensity: form.preferences.intensity,
          restDayPreference: clamp(form.preferences.restDayPreference, 0, 6),
          injuriesOrLimitations: form.preferences.injuriesOrLimitations,
        },
      });

      // Refresh store with latest profile
      const refreshed = await UserProfileService.getUserProfile();
      if (refreshed) setProfile(refreshed);

      setStatus('Profile updated successfully.');
    } catch (e: any) {
      setError(e?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const onResetPassword = async () => {
    if (!user?.email) return setError('No email found for this account.');
    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      await AuthService.resetPassword(user.email);
      setStatus(`Password reset email sent to ${user.email}.`);
    } catch (e: any) {
      setError(e?.message || 'Could not send password reset email.');
    } finally {
      setSaving(false);
    }
  };

  const onSignOut = async () => {
    try {
      await AuthService.signOut();
      navigate('/');
    } catch (e: any) {
      setError(e?.message || 'Failed to sign out.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" className="mx-auto mb-4" />
            <p className="text-neutral-700">Loading your profile…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="card p-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Complete your profile</h1>
          <p className="text-neutral-600 mb-6">
            We couldn’t find your fitness profile. Complete onboarding to personalize your training.
          </p>
          <Link to="/onboarding">
            <Button variant="energy" size="lg">Start Onboarding</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={onResetPassword} disabled={saving}>
            Reset Password
          </Button>
          <Button variant="error" onClick={onSignOut} disabled={saving}>
            Sign Out
          </Button>
        </div>
      </div>

      {/* Status + Errors */}
      {(status || error) && (
        <div
          className={[
            'mb-6 rounded-lg border px-4 py-3',
            status ? 'bg-green-50 border-green-200 text-green-700' : 'bg-rose-50 border-rose-200 text-rose-700',
          ].join(' ')}
          role="status"
          aria-live="polite"
        >
          {status ?? error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="card lg:col-span-1"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Account</h2>

          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-gradient-energy text-white grid place-items-center font-bold text-xl">
              {(form.displayName || user?.email || 'U').slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-neutral-900">{form.displayName || '—'}</p>
              <p className="text-sm text-neutral-600">{user?.email ?? 'No email'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Display name"
              name="displayName"
              type="text"
              value={form.displayName}
              onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              placeholder="Your name"
            />

            <div className="pt-2">
              <p className="text-sm font-medium text-neutral-700 mb-2">Fitness level</p>
              <div className="flex flex-wrap gap-2">
                {fitnessLevels.map((lvl) => (
                  <Chip
                    key={lvl.value}
                    selected={form.fitnessLevel === lvl.value}
                    onClick={() => setForm((f) => ({ ...f, fitnessLevel: lvl.value }))}
                    ariaLabel={`Fitness level ${lvl.label}`}
                  >
                    {lvl.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Goals & Equipment */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="card lg:col-span-2"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Goals & Equipment</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Goals */}
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">Primary goals</p>
              <div className="flex flex-wrap gap-2">
                {fitnessGoals.map((g) => (
                  <Chip
                    key={g.value}
                    selected={form.fitnessGoals.includes(g.value)}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        fitnessGoals: toggleInArray(f.fitnessGoals, g.value),
                      }))
                    }
                    ariaLabel={`Toggle goal ${g.label}`}
                  >
                    {g.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Equipment */}
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">Available equipment</p>
              <div className="flex flex-wrap gap-2">
                {equipmentOptions.map((eq) => (
                  <Chip
                    key={eq.value}
                    selected={form.availableEquipment.includes(eq.value)}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        availableEquipment: toggleInArray(f.availableEquipment, eq.value),
                      }))
                    }
                    ariaLabel={`Toggle equipment ${eq.label}`}
                  >
                    {eq.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Time & Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="card lg:col-span-2"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Schedule & Preferences</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Input
                label="Days per week"
                name="daysPerWeek"
                type="number"
                min={1}
                max={7}
                value={form.timeCommitment.daysPerWeek}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    timeCommitment: {
                      ...f.timeCommitment,
                      daysPerWeek: clamp(Number(e.target.value || 0), 1, 7),
                    },
                  }))
                }
              />
            </div>
            <div>
              <Input
                label="Minutes per session"
                name="minutesPerSession"
                type="number"
                min={10}
                max={180}
                value={form.timeCommitment.minutesPerSession}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    timeCommitment: {
                      ...f.timeCommitment,
                      minutesPerSession: clamp(Number(e.target.value || 0), 10, 180),
                    },
                  }))
                }
              />
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">Preferred time of day</p>
              <div className="flex flex-wrap gap-2">
                {preferredTimeOptions.map((t) => (
                  <Chip
                    key={t}
                    selected={form.timeCommitment.preferredTimes.includes(t)}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        timeCommitment: {
                          ...f.timeCommitment,
                          preferredTimes: toggleInArray(f.timeCommitment.preferredTimes, t),
                        },
                      }))
                    }
                    ariaLabel={`Toggle time ${t}`}
                  >
                    {t}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Workout types */}
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">Preferred workout types</p>
              <div className="flex flex-wrap gap-2">
                {workoutTypes.map((wt) => (
                  <Chip
                    key={wt.value}
                    selected={form.preferences.workoutTypes.includes(wt.value)}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        preferences: {
                          ...f.preferences,
                          workoutTypes: toggleInArray(f.preferences.workoutTypes, wt.value),
                        },
                      }))
                    }
                    ariaLabel={`Toggle ${wt.label}`}
                  >
                    {wt.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Intensity */}
            <div>
              <p className="text-sm font-medium text-neutral-700 mb-2">Typical intensity</p>
              <div className="flex flex-wrap gap-2">
                {(['low', 'moderate', 'high'] as Intensity[]).map((lvl) => (
                  <Chip
                    key={lvl}
                    selected={form.preferences.intensity === lvl}
                    onClick={() =>
                      setForm((f) => ({ ...f, preferences: { ...f.preferences, intensity: lvl } }))
                    }
                    ariaLabel={`Set intensity ${lvl}`}
                  >
                    {lvl[0].toUpperCase() + lvl.slice(1)}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          {/* Injuries / Limitations */}
          <div className="mt-6">
            <p className="text-sm font-medium text-neutral-700 mb-2">Injuries or limitations</p>
            <div className="bg-white border border-neutral-200 rounded-xl p-3">
              <textarea
                className="w-full resize-y min-h-[88px] outline-none"
                placeholder="List any injuries or movement restrictions (e.g., left shoulder impingement)"
                value={form.preferences.injuriesOrLimitations.join('\n')}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    preferences: {
                      ...f.preferences,
                      injuriesOrLimitations: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    },
                  }))
                }
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.preferences.injuriesOrLimitations.map((tag, i) => (
                <Badge key={`${tag}-${i}`} variant="secondary" size="sm" className="truncate max-w-[200px]">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="mt-8 flex items-center gap-3">
            <Button
              onClick={onSave}
              disabled={!hasChanges || saving || !form.fitnessLevel}
              loading={saving}
              size="lg"
              className="px-8"
            >
              Save changes
            </Button>
            {!form.fitnessLevel && (
              <span className="text-sm text-rose-600">Select your fitness level to save.</span>
            )}
            {!hasChanges && (
              <span className="text-sm text-neutral-500">No changes to save.</span>
            )}
          </div>
        </motion.div>

        {/* Tips / Info */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="card lg:col-span-1"
        >
          <h2 className="text-lg font-semibold text-neutral-900 mb-3">Quick tips</h2>
          <ul className="space-y-2 text-sm text-neutral-700">
            <li>• Keep “Injuries or limitations” up to date so workouts adapt safely.</li>
            <li>• Minutes/session drives workout block sizing and pacing.</li>
            <li>• Goals + equipment shape your AI workout recommendations.</li>
          </ul>
          <div className="mt-4">
            <Badge variant="gradient" animate>AI‑Powered</Badge>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
```

---

## `src/pages/LandingPage.tsx`

**Description:** Public landing page

```typescript
import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  SparklesIcon,
  ClockIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import { fadeUp } from '../utils/animations';

/**
 * LandingPage
 * - Modern hero with glass demo card to preview AI workout output
 * - Reduced-motion aware animations
 * - Streamlined containers + semantic landmarks
 * - Accessible, keyboard-friendly, and dark-mode ready
 */

type Feature = {
  name: string;
  description: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
};

const features: Feature[] = [
  {
    name: 'AI-Powered Workouts',
    description:
      'Personalized plans generated by an engine that learns from your progress, preferences, and available equipment.',
    icon: SparklesIcon,
  },
  {
    name: 'Adaptive Training',
    description:
      'Sessions evolve automatically—adjusting difficulty, volume, and focus to keep you progressing.',
    icon: ChartBarIcon,
  },
  {
    name: 'Time Efficient',
    description:
      'Hyper-focused programming that fits your schedule without sacrificing results.',
    icon: ClockIcon,
  },
  {
    name: 'Mobile First',
    description:
      'A seamless experience across devices, with offline support for when you’re on the move.',
    icon: DevicePhoneMobileIcon,
  },
];



const FeatureCard: React.FC<{ feature: Feature; index: number }> = ({ feature, index }) => (
  <motion.div
    variants={fadeUp(index * 0.05)}
    initial="initial"
    animate="animate"
    viewport={{ once: true, margin: '-20% 0px -20% 0px' }}
    className="group relative rounded-2xl border border-black/5 bg-white/70 backdrop-blur-md p-6 shadow-sm hover:shadow-lg transition-shadow"
  >
    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
      <feature.icon className="h-6 w-6 text-primary-600" aria-hidden="true" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900">{feature.name}</h3>
    <p className="mt-2 text-gray-600">{feature.description}</p>

    {/* Subtle hover halo */}
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
      style={{
        boxShadow:
          '0 0 0 1px rgba(59,130,246,0.10), 0 10px 30px rgba(59,130,246,0.10), inset 0 0 40px rgba(59,130,246,0.06)',
      }}
    />
  </motion.div>
);



export const LandingPage: React.FC = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Skip link for keyboard users */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-2xl focus:bg-primary-600 focus:text-white focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg focus:font-semibold"
      >
        Skip to content
      </a>

      {/* Decorative background */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-mesh-gradient opacity-20" />
        <motion.div
          animate={
            reduceMotion
              ? { opacity: 0.12, scale: 1 }
              : { scale: [1, 1.18, 1], opacity: [0.08, 0.22, 0.08] }
          }
          transition={reduceMotion ? { duration: 0 } : { duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-energy rounded-full blur-3xl"
        />
        <motion.div
          animate={
            reduceMotion
              ? { opacity: 0.14, scale: 1 }
              : { scale: [1.1, 0.92, 1.1], opacity: [0.12, 0.28, 0.12] }
          }
          transition={reduceMotion ? { duration: 0 } : { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-success rounded-full blur-3xl"
        />
      </div>

      {/* Hero */}
      <header className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-12 md:pt-28 md:pb-20">
          <motion.div
            variants={fadeUp()}
            initial="initial"
            animate="animate"
            className="text-center"
          >
            <div className="inline-flex items-center px-5 py-2.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-700 text-sm font-semibold mb-7 shadow-sm">
              <SparklesIcon className="w-4 h-4 mr-2 text-energy-500" aria-hidden="true" />
              <span className="bg-gradient-energy bg-clip-text text-transparent">
                AI‑Powered Fitness, Personalized
              </span>
              <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-energy-500 animate-pulse" aria-hidden="true" />
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-neutral-900 leading-tight tracking-tight">
              Your AI Fitness
              <br />
              <span className="bg-gradient-energy bg-clip-text text-transparent">
                Revolution
              </span>
            </h1>

            <p className="mt-6 text-lg md:text-xl text-neutral-600 mx-auto max-w-3xl leading-relaxed">
              Transform your training with{' '}
              <span className="font-semibold bg-gradient-energy bg-clip-text text-transparent">adaptive workouts</span>{' '}
              tuned to your goals, schedule, and equipment—evolving automatically as you do.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup" aria-label="Create your free NeuraFit account">
                <Button variant="energy" size="lg" className="text-lg px-8 py-4 font-semibold">
                  Start Your Journey
                </Button>
              </Link>
              <Link to="/login" aria-label="Sign in to NeuraFit">
                <Button variant="secondary" size="lg" className="text-lg px-8 py-4 font-semibold">
                  Sign In
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Value proposition */}
          <motion.div
            variants={fadeUp(0.25)}
            initial="initial"
            animate="animate"
            className="mt-12 md:mt-16 text-center max-w-3xl mx-auto"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
              Smarter plans. Better adherence. Real progress.
            </h2>
            <p className="mt-3 text-neutral-600">
              NeuraFit removes guesswork: the right movements, rep schemes, and rest—auto‑calibrated
              to your performance and recovery signals. Train with intent, not intuition.
            </p>
          </motion.div>
        </div>
      </header>

      <main id="main" className="relative z-10">
        {/* Features */}
        <section id="features" className="py-20 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={fadeUp()}
              initial="initial"
              animate="animate"
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Why Choose NeuraFit?
              </h2>
              <p className="mt-3 text-lg text-gray-600 max-w-2xl mx-auto">
                Experience the future of fitness with personalization that makes every minute count.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {features.map((f, i) => (
                <FeatureCard key={f.name} feature={f} index={i} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-white">
          <div className="mx-auto max-w-4xl text-center px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={fadeUp()}
              initial="initial"
              animate="animate"
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Ready to Transform Your Fitness?
              </h2>
              <p className="mt-3 text-lg text-gray-600">
                Join athletes, creators, and busy professionals training with AI‑guided precision.
              </p>
              <div className="mt-8 flex justify-center">
                <Link to="/signup">
                  <Button size="lg" className="px-8 py-4 text-lg" variant="energy">
                    Get Started Free
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
};
```

---

## `src/pages/LoginPage.tsx`

**Description:** User login page

```typescript
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AuthService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, onboardingCompleted } = useAuthStore();
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  useEffect(() => {
    document.title = 'Sign in • NeuraFit';
  }, []);

  // Handle navigation when user is authenticated
  useEffect(() => {
    if (user) {
      console.log('👤 LoginPage: User authenticated, navigating', { onboardingCompleted });
      
      // Get redirect parameter from URL
      const urlParams = new URLSearchParams(location.search);
      const redirectParam = urlParams.get('redirect');
      
      if (onboardingCompleted) {
        // User is onboarded, go to intended destination or app
        const destination = redirectParam && !redirectParam.startsWith('/login') && !redirectParam.startsWith('/signup') 
          ? redirectParam 
          : '/app';
        navigate(destination, { replace: true });
      } else {
        // User needs onboarding, preserve redirect intent
        const destination = redirectParam && !redirectParam.startsWith('/login') && !redirectParam.startsWith('/signup')
          ? `/onboarding?redirect=${encodeURIComponent(redirectParam)}`
          : '/onboarding';
        navigate(destination, { replace: true });
      }
    }
  }, [user, onboardingCompleted, navigate, location.search]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📧 LoginPage.handleEmailLogin: Starting email login');

    if (!validateForm()) {
      console.log('❌ LoginPage.handleEmailLogin: Form validation failed');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await AuthService.signIn(formData.email, formData.password);
      console.log('✅ LoginPage.handleEmailLogin: Email login successful');
      // Navigation will happen via useEffect when user state changes
    } catch (err: any) {
      console.error('❌ LoginPage.handleEmailLogin: Email login failed', err);
      setErrors({ general: err.message || 'Failed to sign in. Please try again.' });
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log('🔵 LoginPage.handleGoogleLogin: Starting Google login');
    
    setSocialLoading('google');
    setErrors({});

    try {
      await AuthService.signInWithGoogle();
      console.log('✅ LoginPage.handleGoogleLogin: Google login successful');
      // Navigation will happen via useEffect when user state changes
    } catch (err: any) {
      console.error('❌ LoginPage.handleGoogleLogin: Google login failed', err);
      setErrors({ general: err.message || 'Google sign-in failed. Please try again.' });
      setSocialLoading(null);
    }
  };

  const handleAppleLogin = async () => {
    console.log('🍎 LoginPage.handleAppleLogin: Starting Apple login');
    
    setSocialLoading('apple');
    setErrors({});

    try {
      await AuthService.signInWithApple();
      console.log('✅ LoginPage.handleAppleLogin: Apple login successful');
      // Navigation will happen via useEffect when user state changes
    } catch (err: any) {
      console.error('❌ LoginPage.handleAppleLogin: Apple login failed', err);
      setErrors({ general: err.message || 'Apple sign-in failed. Please try again.' });
      setSocialLoading(null);
    }
  };

  const isFormValid = formData.email && formData.password;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-neutral-900">Sign in to your account</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">
              Sign up
            </Link>
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-sm rounded-lg border border-neutral-200">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Social Sign-in Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              loading={socialLoading === 'google'}
              disabled={!!socialLoading || loading}
              className="w-full"
              size="lg"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleAppleLogin}
              loading={socialLoading === 'apple'}
              disabled={!!socialLoading || loading}
              className="w-full"
              size="lg"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Continue with Apple
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-neutral-500">Or continue with email</span>
            </div>
          </div>

          {/* Email Sign-in Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              required
            />

            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                Forgot your password?
              </Link>
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={!isFormValid || !!socialLoading}
              className="w-full"
              size="lg"
            >
              Sign In
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

```

---

## `src/pages/SignupPage.tsx`

**Description:** User registration page

```typescript
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AuthService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

interface FormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  useEffect(() => {
    document.title = 'Sign up • NeuraFit';
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      console.log('👤 SignupPage: User already authenticated, redirecting');
      navigate('/onboarding');
    }
  }, [user, navigate]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear errors when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📧 SignupPage.handleEmailSignup: Starting email signup');

    if (!validateForm()) {
      console.log('❌ SignupPage.handleEmailSignup: Form validation failed');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await AuthService.signUp({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
      });
      console.log('✅ SignupPage.handleEmailSignup: Email signup successful');
      // Navigation will happen via useEffect when user state changes
    } catch (err: any) {
      console.error('❌ SignupPage.handleEmailSignup: Email signup failed', err);
      setErrors({ general: err.message || 'Failed to create account. Please try again.' });
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    console.log('🔵 SignupPage.handleGoogleSignup: Starting Google signup');
    
    setSocialLoading('google');
    setErrors({});

    try {
      await AuthService.signInWithGoogle();
      console.log('✅ SignupPage.handleGoogleSignup: Google signup successful');
      // Navigation will happen via useEffect when user state changes
    } catch (err: any) {
      console.error('❌ SignupPage.handleGoogleSignup: Google signup failed', err);
      setErrors({ general: err.message || 'Google sign-up failed. Please try again.' });
      setSocialLoading(null);
    }
  };

  const handleAppleSignup = async () => {
    console.log('🍎 SignupPage.handleAppleSignup: Starting Apple signup');
    
    setSocialLoading('apple');
    setErrors({});

    try {
      await AuthService.signInWithApple();
      console.log('✅ SignupPage.handleAppleSignup: Apple signup successful');
      // Navigation will happen via useEffect when user state changes
    } catch (err: any) {
      console.error('❌ SignupPage.handleAppleSignup: Apple signup failed', err);
      setErrors({ general: err.message || 'Apple sign-up failed. Please try again.' });
      setSocialLoading(null);
    }
  };

  const isFormValid = formData.displayName && formData.email && formData.password && formData.confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-neutral-900">Create your account</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow-sm rounded-lg border border-neutral-200">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Social Sign-up Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignup}
              loading={socialLoading === 'google'}
              disabled={!!socialLoading || loading}
              className="w-full"
              size="lg"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleAppleSignup}
              loading={socialLoading === 'apple'}
              disabled={!!socialLoading || loading}
              className="w-full"
              size="lg"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Continue with Apple
            </Button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-neutral-500">Or continue with email</span>
            </div>
          </div>

          {/* Email Sign-up Form */}
          <form onSubmit={handleEmailSignup} className="space-y-4">
            <Input
              label="Full Name"
              name="displayName"
              type="text"
              value={formData.displayName}
              onChange={handleInputChange}
              error={errors.displayName}
              required
            />

            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              error={errors.password}
              required
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
              required
            />

            <Button
              type="submit"
              loading={loading}
              disabled={!isFormValid || !!socialLoading}
              className="w-full"
              size="lg"
            >
              Create Account
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

```

---

## `src/pages/OnboardingPage.tsx`

**Description:** User onboarding flow

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { OnboardingStep1 } from '../components/onboarding/OnboardingStep1';
import { OnboardingStep2 } from '../components/onboarding/OnboardingStep2';
import { OnboardingStep3 } from '../components/onboarding/OnboardingStep3';
import { OnboardingStep4 } from '../components/onboarding/OnboardingStep4';
import { UserProfileService } from '../services/userProfileService';
import { useAuthStore } from '../store/authStore';
import type { FitnessLevel, FitnessGoal, Equipment, WorkoutType } from '../types';


interface OnboardingData {
  fitnessLevel: FitnessLevel | null;
  fitnessGoals: FitnessGoal[];
  availableEquipment: Equipment[];
  timeCommitment: {
    daysPerWeek: number;
    minutesPerSession: number;
    preferredTimes: string[];
  };
  preferences: {
    workoutTypes: WorkoutType[];
    intensity: 'low' | 'moderate' | 'high';
    restDayPreference: number; // 0..6
    injuriesOrLimitations: string[];
  };
}

const STORAGE_KEY = 'onboardingDraft:v1';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { setOnboardingCompleted, setError, clearError } = useAuthStore();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    fitnessLevel: null,
    fitnessGoals: [],
    availableEquipment: [],
    timeCommitment: {
      daysPerWeek: 3,
      minutesPerSession: 30,
      preferredTimes: [],
    },
    preferences: {
      workoutTypes: ['strength_training'], // Default to strength training
      intensity: 'moderate',
      restDayPreference: 1, // Default to Monday as rest day
      injuriesOrLimitations: [],
    },
  });

  const [stepError, setStepError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [online, setOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  const dirtyRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    document.title = 'Onboarding • NeuraFit';
  }, []);

  /* ------------------------------ Draft: load/save ------------------------------ */

  // Load draft on mount (once)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.data) {
        setOnboardingData(parsed.data);
        if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= totalSteps) {
          setCurrentStep(parsed.currentStep);
        }
      }
    } catch {
      // ignore corrupted drafts
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ data: onboardingData, currentStep }),
        );
        dirtyRef.current = true;
      } catch {
        // storage may be full/blocked; ignore
      }
    }, 250);
    return () => clearTimeout(t);
  }, [onboardingData, currentStep]);

  // Warn on unload if editing
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current && !submitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [submitting]);

  // Online/offline banner
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



  /* -------------------------------- Validation -------------------------------- */

  const validateStep = (step: number, data: OnboardingData): string | null => {
    if (step === 1) {
      if (!data.fitnessLevel) return 'Please choose your current fitness level.';
    }
    if (step === 2) {
      if (!data.fitnessGoals.length) return 'Select at least one primary goal.';
    }
    if (step === 3) {
      // equipment optional; no-op
    }
    if (step === 4) {
      const { daysPerWeek, minutesPerSession, preferredTimes } = data.timeCommitment;
      if (daysPerWeek < 1 || daysPerWeek > 7) return 'Days per week must be between 1 and 7.';
      if (minutesPerSession < 10 || minutesPerSession > 180)
        return 'Minutes per session must be between 10 and 180.';
      if (!preferredTimes || !preferredTimes.length)
        return 'Select at least one preferred time of day.';
    }

    return null;
  };

  /* --------------------------------- Handlers --------------------------------- */

  const updateOnboardingData = (stepData: Partial<OnboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...stepData }));
    setStepError('');
  };

  const nextStep = () => {
    const err = validateStep(currentStep, onboardingData);
    if (err) {
      setStepError(err);
      return;
    }
    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
      setStepError('');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
      setStepError('');
    }
  };

  const handleComplete = async () => {
    // Validate final step before submit
    const err = validateStep(currentStep, onboardingData) || validateStep(5, onboardingData);
    if (err) {
      setStepError(err);
      return;
    }

    clearError();
    setSubmitting(true);
    setStepError('');
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      await UserProfileService.createUserProfile({
        fitnessLevel: onboardingData.fitnessLevel!,
        fitnessGoals: onboardingData.fitnessGoals,
        availableEquipment: onboardingData.availableEquipment,
        timeCommitment: onboardingData.timeCommitment,
        preferences: onboardingData.preferences,
      });

      // Clear draft and mark complete
      localStorage.removeItem(STORAGE_KEY);
      dirtyRef.current = false;
      setOnboardingCompleted(true);
      navigate('/app');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      setError(error?.message || 'Failed to complete onboarding');
      setStepError(error?.message || 'Failed to complete onboarding');
    } finally {
      setSubmitting(false);
    }
  };

  /* --------------------------------- Rendering -------------------------------- */

  const renderStep = () => {
    const stepProps = {
      data: onboardingData,
      onUpdate: updateOnboardingData,
    };
    switch (currentStep) {
      case 1:
        return <OnboardingStep1 {...stepProps} onNext={nextStep} />;
      case 2:
        return <OnboardingStep2 {...stepProps} onNext={nextStep} onPrev={prevStep} />;
      case 3:
        return <OnboardingStep3 {...stepProps} onNext={nextStep} onPrev={prevStep} />;
      case 4:
        return (
          <OnboardingStep4
            {...stepProps}
            onComplete={handleComplete}
            onPrev={prevStep}
            submitting={submitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* subtle moving gradient accent */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary-100 via-cyan-100 to-primary-100 opacity-60 blur-2xl bg-[length:200%_100%]"
        animate={
          shouldReduceMotion
            ? { opacity: 0.35 }
            : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }
        }
        transition={
          shouldReduceMotion ? { duration: 0 } : { duration: 18, repeat: Infinity, ease: 'easeInOut' }
        }
      />

      {/* offline banner */}
      {!online && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          You’re offline. Changes are saved locally and will sync when you’re back online.
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
            NeuraFit
          </h1>
          <p className="text-neutral-600 mt-2">Let’s personalize your fitness journey</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-neutral-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <motion.div
              className="bg-primary-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>



        {/* Step Error */}
        {stepError && (
          <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
            {stepError}
          </div>
        )}

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>


      </div>
    </div>
  );
};
```

---

## `src/pages/ForgotPasswordPage.tsx`

**Description:** Password reset page

```typescript
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthStore } from '../store/authStore';
import { AuthService } from '../services/authService';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export const ForgotPasswordPage: React.FC = () => {
  const reduceMotion = useReducedMotion();
  const { setError, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [err, setErr] = useState<string | undefined>();
  const [status, setStatus] = useState<'idle' | 'sent' | 'loading'>('idle');

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setEmail(v);
    setErr(v && !emailPattern.test(v) ? 'Enter a valid email.' : undefined);
    if (err) {
      setErr(undefined);
      clearError();
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setErr('Email is required.');
    if (!emailPattern.test(email)) return setErr('Enter a valid email.');

    setStatus('loading');
    setErr(undefined);
    clearError();

    try {
      await AuthService.resetPassword(email);
      setStatus('sent');
    } catch (error: any) {
      const message = error?.message || 'Unable to send reset email. Please try again.';
      setErr(message);
      setError(message);
      setStatus('idle');
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-primary-50/20">
      {/* Decorative background */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-mesh-gradient opacity-20" />
        <motion.div
          animate={
            reduceMotion ? { opacity: 0.12, scale: 1 } : { scale: [1, 1.15, 1], opacity: [0.08, 0.2, 0.08] }
          }
          transition={reduceMotion ? { duration: 0 } : { duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-gradient-primary blur-3xl"
        />
        <motion.div
          animate={
            reduceMotion ? { opacity: 0.14, scale: 1 } : { scale: [1.1, 0.92, 1.1], opacity: [0.12, 0.26, 0.12] }
          }
          transition={reduceMotion ? { duration: 0 } : { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-gradient-accent blur-3xl"
        />
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md space-y-8"
        >
          <div className="text-center">
            <Link to="/" className="inline-flex items-center justify-center gap-2">
              <SparklesIcon className="h-5 w-5 text-primary-500" aria-hidden="true" />
              <h1 className="text-3xl font-display font-bold bg-gradient-brand bg-clip-text text-transparent">
                NeuraFit
              </h1>
            </Link>
            <h2 className="mt-6 text-3xl font-extrabold text-neutral-900">
              Reset your password
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              Enter the email associated with your account and we'll send you a reset link.
            </p>
          </div>

          <div className="card p-6 sm:p-8">
            <form className="space-y-6" onSubmit={onSubmit} noValidate>
              <Input
                label="Email address"
                id="reset-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@domain.com"
                required
                value={email}
                onChange={onChange}
                error={err}
                animate
              />

              {status !== 'sent' ? (
                <Button type="submit" size="lg" className="w-full" loading={status === 'loading'} disabled={!!err || !email}>
                  Send reset link
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-md border border-success-200 bg-success-50 p-3" role="status" aria-live="polite">
                    <p className="text-sm text-success-700">
                      If an account exists for <span className="font-semibold">{email}</span>, a reset link has been sent.
                      Check your inbox (and spam).
                    </p>
                  </div>
                  <Button type="button" variant="primary" size="lg" className="w-full" onClick={() => setStatus('idle')}>
                    Send another email
                  </Button>
                </div>
              )}

              <div className="text-center text-sm">
                <Link to="/login" className="text-primary-600 hover:text-primary-500">
                  Back to sign in
                </Link>
              </div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

```

---

## `src/components/auth/AuthProvider.tsx`

**Description:** Authentication context provider

```typescript
import React, { useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types';
import { logger } from '../../utils/logger';

interface AuthProviderProps {
  children: React.ReactNode;
}

// Convert Firebase user to our User type
const toUser = (firebaseUser: any): User => ({
  id: firebaseUser.uid,
  email: firebaseUser.email || '',
  displayName: firebaseUser.displayName || '',
  photoURL: firebaseUser.photoURL || undefined,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Fetch onboarding completion status
const fetchOnboardingCompleted = async (userId: string): Promise<boolean> => {
  try {
    const userDoc = await getDoc(doc(db, 'userProfiles', userId));
    if (!userDoc.exists()) {
      console.log('📄 AuthProvider: User profile not found, onboarding needed');
      return false;
    }
    
    const data = userDoc.data();
    const completed = data?.onboardingStatus === 'completed';
    console.log('📊 AuthProvider: Onboarding status', { userId, completed, status: data?.onboardingStatus });
    return completed;
  } catch (error) {
    console.error('❌ AuthProvider: Error fetching onboarding status', error);
    logger.auth.error('Failed to fetch onboarding status', error as Error);
    return false;
  }
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { setUser, setLoading, setOnboardingCompleted } = useAuthStore();
  const isInitialized = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      console.log('🚀 AuthProvider: Initializing auth');

      // Set up auth state listener
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        console.log('🔔 AuthProvider: Auth state changed', {
          hasUser: !!firebaseUser,
          uid: firebaseUser?.uid,
          email: firebaseUser?.email,
        });

        if (!isMounted) {
          console.log('❌ AuthProvider: Component unmounted, skipping auth state change');
          return;
        }

        if (firebaseUser) {
          console.log('👤 AuthProvider: Processing authenticated user');
          
          try {
            // Convert to our User type
            const user = toUser(firebaseUser);
            setUser(user);
            console.log('✅ AuthProvider: User set in store', { uid: user.id, email: user.email });

            // Fetch onboarding status
            const completed = await fetchOnboardingCompleted(firebaseUser.uid);
            if (!isMounted) return;
            
            setOnboardingCompleted(completed);
            console.log('📊 AuthProvider: Onboarding status set', { completed });
            
            logger.auth.login(firebaseUser.uid);
          } catch (error) {
            console.error('❌ AuthProvider: Error processing user', error);
            logger.auth.error('Error processing authenticated user', error as Error);
          }
        } else {
          console.log('🚪 AuthProvider: No user, clearing auth state');
          setUser(null);
          setOnboardingCompleted(false);
        }

        // Mark as initialized and clear loading
        if (!isInitialized.current) {
          console.log('🏁 AuthProvider: Auth initialized');
          setLoading(false);
          isInitialized.current = true;
        }
      });

      unsubscribeRef.current = unsubscribe;
    };

    initializeAuth();

    // Cleanup function
    return () => {
      console.log('🧹 AuthProvider: Cleaning up');
      isMounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [setUser, setLoading, setOnboardingCompleted]);

  return <>{children}</>;
};

```

---

## `src/components/auth/ProtectedRoute.tsx`

**Description:** Route protection component

```typescript
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard:
 * - If loading: show spinner
 * - If no user: redirect to /login?redirect=<current>
 * - If user not onboarded: redirect to /onboarding (unless already there)
 * - If user onboarded but on /onboarding: send to /app
 * - Else: render children
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, isOnboarded } = useAuthStore(); // ensure store exposes isOnboarded
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const redirectParam = `redirect=${encodeURIComponent(
    location.pathname + location.search,
  )}`;

  // Not signed in → to login
  if (!user) {
    return <Navigate to={`/login?${redirectParam}`} replace />;
  }

  const path = location.pathname;

  // Signed in but not onboarded → force onboarding (unless already there)
  if (!isOnboarded && path !== '/onboarding') {
    return <Navigate to={`/onboarding?${redirectParam}`} replace />;
  }

  // Signed in and onboarded, but user somehow hit /onboarding → send to app
  if (isOnboarded && path === '/onboarding') {
    return <Navigate to="/app" replace />;
  }

  // All good
  return <>{children}</>;
};
```

---

## `src/components/layout/Layout.tsx`

**Description:** Main application layout wrapper

```typescript
import React, { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navigation } from './Navigation';
import { SkipLink } from '../ui/AccessibilityProvider';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { pageVariants, pageTransition } from '../../utils/animations';

export const Layout: React.FC = () => {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const mainRef = useRef<HTMLElement>(null);

  // Move focus to main on route change (pairs with SkipLink)
  useEffect(() => {
    mainRef.current?.focus();
  }, [location.pathname]);

  const variants = reduceMotion
    ? {
        initial: { opacity: 1, y: 0 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 1, y: 0 },
      }
    : pageVariants;

  const transition = reduceMotion ? undefined : pageTransition;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-primary-50/20 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-primary opacity-10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-accent opacity-10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%236366f1%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%221.5%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
      </div>

      <div className="relative z-10">
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        <Navigation />

        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          role="main"
          className="focus:outline-none pb-[calc(80px+env(safe-area-inset-bottom))] md:pb-0 md:pt-18"
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={transition}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};
```

---

## `src/components/layout/Navigation.tsx`

**Description:** Navigation component

```typescript
import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import {
  HomeIcon,
  PlayIcon,
  ClockIcon,
  UserIcon,
  ArrowRightStartOnRectangleIcon,
  Cog6ToothIcon,
  BellIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  PlayIcon as PlayIconSolid,
  ClockIcon as ClockIconSolid,
  UserIcon as UserIconSolid,
} from '@heroicons/react/24/solid';
import { auth } from '../../lib/firebase';
import { useAuthStore } from '../../store/authStore';
import { Badge } from '../ui/Badge';

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  iconSolid: React.ComponentType<React.ComponentProps<'svg'>>;
  description: string;
  color:
    | 'primary'
    | 'energy'
    | 'success'
    | 'secondary'
    | 'achievement'
    | 'accent';
  badge?: string;
};

const navigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/app',
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
    description: 'Your fitness overview',
    color: 'primary',
  },
  {
    name: 'Workout',
    href: '/app/workout',
    icon: PlayIcon,
    iconSolid: PlayIconSolid,
    description: 'Start your training',
    color: 'energy',
    badge: 'New',
  },
  {
    name: 'History',
    href: '/app/history',
    icon: ClockIcon,
    iconSolid: ClockIconSolid,
    description: 'Past workouts',
    color: 'secondary',
  },
  {
    name: 'Profile',
    href: '/app/profile',
    icon: UserIcon,
    iconSolid: UserIconSolid,
    description: 'Settings & preferences',
    color: 'accent',
  },
];

/** Prefetch likely‑next route chunk on hover/focus. */
const prefetchRoute = (to: string) => {
  // Keep this in sync with your lazy imports in App.tsx
  if (to.startsWith('/app/workout')) import('../../pages/WorkoutPage').catch(() => {});
  else if (to.startsWith('/app/history')) import('../../pages/HistoryPage').catch(() => {});
  else if (to.startsWith('/app/profile')) import('../../pages/ProfilePage').catch(() => {});
  else if (to === '/app') import('../../pages/DashboardPage').catch(() => {});
};

export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  // Close notifications on outside click / route change
  useEffect(() => {
    const onDocClick = (e: MouseEvent | TouchEvent) => {
      if (!notificationsRef.current) return;
      if (!notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
    };
  }, []);
  useEffect(() => setShowNotifications(false), [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      // Keep a console error in dev; avoid UI flash
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Error signing out:', error);
      }
    }
  };

  // Utility to compute active state compatible with nested routes
  const isActiveHref = (href: string) =>
    href === location.pathname ||
    (href !== '/app' && location.pathname.startsWith(href));

  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav
        role="navigation"
        aria-label="Primary"
        className="hidden md:flex md:fixed md:top-0 md:left-0 md:right-0 md:z-50 bg-white/95 backdrop-blur-xl border-b border-neutral-200/50 shadow-sm"
        initial={{ y: shouldReduceMotion ? 0 : -100 }}
        animate={{ y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <motion.button
                type="button"
                className="flex-shrink-0"
                whileHover={{ scale: shouldReduceMotion ? 1 : 1.05 }}
                whileTap={{ scale: shouldReduceMotion ? 1 : 0.95 }}
                onClick={() => navigate('/app')}
                aria-label="Go to dashboard"
              >
                <h1 className="text-3xl font-display font-bold bg-gradient-energy bg-clip-text text-transparent cursor-pointer">
                  NeuraFit
                </h1>
              </motion.button>

              <div className="ml-12 flex items-center space-x-1">
                {navigationItems.slice(0, 4).map((item) => {
                  const active = isActiveHref(item.href);
                  const Icon = active ? item.iconSolid : item.icon;
                  return (
                    <motion.div key={item.name} className="relative">
                      <NavLink
                        to={item.href}
                        aria-current={active ? 'page' : undefined}
                        onMouseEnter={() => prefetchRoute(item.href)}
                        onFocus={() => prefetchRoute(item.href)}
                        onPointerEnter={() => prefetchRoute(item.href)}
                        className={`relative px-6 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 flex items-center group ${
                          active
                            ? 'bg-energy-500 text-white shadow-sm'
                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                        }`}
                        title={item.description}
                      >
                        <Icon
                          aria-hidden
                          className={`w-5 h-5 mr-3 transition-transform duration-300 ${
                            active ? 'scale-110' : 'group-hover:scale-110'
                          }`}
                        />
                        <span>{item.name}</span>

                        {item.badge && !active && (
                          <Badge variant="accent" size="xs" className="ml-2 animate-pulse">
                            {item.badge}
                          </Badge>
                        )}
                      </NavLink>

                      {/* Active indicator */}
                      {active && (
                        <motion.div
                          className="absolute -bottom-1 left-1/2 w-2 h-2 bg-primary-500 rounded-full"
                          layoutId="activeIndicator"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          style={{ x: '-50%' }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Quick Actions */}
              <div className="relative flex items-center space-x-2" ref={notificationsRef}>
                {/* Notifications */}
                <motion.button
                  className="relative p-3 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-200"
                  aria-haspopup="dialog"
                  aria-expanded={showNotifications}
                  aria-controls="notifications-popover"
                  onClick={() => setShowNotifications((s) => !s)}
                  whileHover={{ scale: shouldReduceMotion ? 1 : 1.05 }}
                  whileTap={{ scale: shouldReduceMotion ? 1 : 0.95 }}
                >
                  <BellIcon className="w-5 h-5" aria-hidden />
                  <Badge
                    variant="error"
                    size="xs"
                    className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center"
                  >
                    3
                  </Badge>
                </motion.button>

                {/* Popover */}
                {showNotifications && (
                  <motion.div
                    id="notifications-popover"
                    role="dialog"
                    aria-label="Notifications"
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-black/5 bg-white/95 backdrop-blur-md shadow-lg p-4"
                  >
                    <h3 className="text-sm font-semibold text-neutral-900">
                      Notifications
                    </h3>
                    <ul className="mt-3 space-y-2 text-sm">
                      <li className="rounded-lg p-3 bg-neutral-50">
                        <span className="font-medium">New PR unlocked!</span>
                        <div className="text-neutral-600">
                          1‑rep max squat improved to 265 lb.
                        </div>
                      </li>
                      <li className="rounded-lg p-3 bg-neutral-50">
                        <span className="font-medium">Streak day 7 🔥</span>
                        <div className="text-neutral-600">
                          Keep it going—recovery looks solid.
                        </div>
                      </li>
                      <li className="rounded-lg p-3 bg-neutral-50">
                        <span className="font-medium">Coach tip</span>
                        <div className="text-neutral-600">
                          Add tempo to your push‑ups for more time under tension.
                        </div>
                      </li>
                    </ul>
                  </motion.div>
                )}

                {/* Settings */}
                <motion.button
                  className="p-3 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-all duration-200"
                  onClick={() => {
                    prefetchRoute('/app/settings');
                    navigate('/app/settings');
                  }}
                  whileHover={{ scale: shouldReduceMotion ? 1 : 1.05 }}
                  whileTap={{ scale: shouldReduceMotion ? 1 : 0.95 }}
                  aria-label="Open settings"
                  title="Settings"
                >
                  <Cog6ToothIcon className="w-5 h-5" aria-hidden />
                </motion.button>
              </div>

              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-900">
                    {user?.displayName || 'Fitness Enthusiast'}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="achievement-gold" size="xs">🔥 7 day streak</Badge>
                  </div>
                </div>

                <motion.button
                  onClick={handleSignOut}
                  className="text-neutral-600 hover:text-error-600 p-3 rounded-xl hover:bg-error-50 transition-all duration-200 group"
                  title="Sign out"
                  aria-label="Sign out"
                  whileHover={{ scale: shouldReduceMotion ? 1 : 1.05 }}
                  whileTap={{ scale: shouldReduceMotion ? 1 : 0.95 }}
                >
                  <ArrowRightStartOnRectangleIcon
                    aria-hidden
                    className="w-5 h-5 group-hover:scale-110 transition-transform duration-200"
                  />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      <motion.nav
        role="navigation"
        aria-label="Bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-neutral-200/50 shadow-elevated-lg safe-area-bottom"
        initial={{ y: shouldReduceMotion ? 0 : 100 }}
        animate={{ y: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.3, delay: shouldReduceMotion ? 0 : 0.1 }}
      >
        <div className="grid grid-cols-4 py-2 px-2">
          {navigationItems.slice(0, 4).map((item) => {
            const active = isActiveHref(item.href);
            const Icon = active ? item.iconSolid : item.icon;
            return (
              <motion.div key={item.name} className="relative">
                <NavLink
                  to={item.href}
                  aria-current={active ? 'page' : undefined}
                  onMouseEnter={() => prefetchRoute(item.href)}
                  onFocus={() => prefetchRoute(item.href)}
                  onPointerEnter={() => prefetchRoute(item.href)}
                  onTouchStart={() => prefetchRoute(item.href)}
                  className={`flex flex-col items-center py-3 px-2 text-xs font-semibold transition-all duration-300 rounded-2xl min-h-[68px] justify-center relative ${
                    active
                      ? 'text-white bg-energy-500 shadow-sm'
                      : 'text-neutral-600 active:text-neutral-900 active:bg-neutral-100'
                  }`}
                  title={item.description}
                >
                  <motion.div
                    animate={active ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon aria-hidden className="w-6 h-6 mb-1" />
                  </motion.div>
                  <span className="text-center leading-tight">{item.name}</span>

                  {item.badge && !active && (
                    <div className="absolute -top-1 -right-1">
                      <Badge variant="error" size="xs" className="min-w-[16px] h-4 text-[10px]">
                        !
                      </Badge>
                    </div>
                  )}
                </NavLink>

                {/* Active indicator */}
                {active && (
                  <motion.div
                    className="absolute top-1 left-1/2 w-1 h-1 bg-white rounded-full"
                    layoutId="mobileActiveIndicator"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    style={{ x: '-50%' }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Safe area padding for devices with home indicator */}
        <div className="h-safe-bottom" />
      </motion.nav>

      {/* Mobile Profile FAB (keeps Profile reachable without crowding the tab bar) */}
      <motion.button
        type="button"
        onClick={() => {
          prefetchRoute('/app/profile');
          navigate('/app/profile');
        }}
        aria-label="Open profile"
        className="md:hidden fixed right-4 bottom-[calc(76px+env(safe-area-inset-bottom))] z-[51] rounded-full p-3 shadow-glow-primary bg-white border border-black/5"
        initial={{ scale: shouldReduceMotion ? 1 : 0.9, opacity: shouldReduceMotion ? 1 : 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
        title="Profile"
      >
        <UserIcon className="w-6 h-6 text-neutral-800" aria-hidden />
      </motion.button>

      {/* Desktop top padding */}
      <div className="hidden md:block h-20" />

      {/* Mobile bottom padding */}
      <div className="md:hidden h-20" />
    </>
  );
};
```

---

## `src/components/ui/Button.tsx`

**Description:** Button component with variants

```typescript
import React, { forwardRef, type ReactNode, type ReactElement } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LoadingSpinner } from './LoadingSpinner';

type FitnessVariant =
  | 'cardio' | 'strength' | 'flexibility' | 'recovery' | 'hiit' | 'yoga' | 'pilates';
type IntensityVariant =
  | 'intensity-low' | 'intensity-medium' | 'intensity-high' | 'intensity-extreme';
type MotivationVariant =
  | 'energy' | 'power' | 'zen' | 'achievement';

export type ButtonVariant =
  | 'primary' | 'secondary' | 'outline' | 'ghost' | 'energy' | 'success' | 'warning' | 'error' | 'gradient' | 'glass'
  | FitnessVariant | IntensityVariant | MotivationVariant;

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'onDrag' | 'onDragEnd' | 'onDragStart' | 'onAnimationStart' | 'onAnimationEnd'
  > {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  glow?: boolean;
  pulse?: boolean;
  animation?: 'none' | 'bounce' | 'pulse' | 'wiggle' | 'scale' | 'workout-pulse' | 'motivation-bounce';
  focusRing?: boolean;
  loadingText?: string;
}

/** lightweight class combiner */
const cn = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

/**
 * Light-theme, subtle-glow base styles:
 * - Softer shadows (md → lg on hover)
 * - Lighter surfaces (white/neutral backgrounds)
 * - Reduced intensity on gradients and glass
 */
const VARIANT_BASE: Record<ButtonVariant, string> = {
  // Core (light theme)
  primary:
    'bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white shadow-md hover:shadow-lg',
  secondary:
    'bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-900 border border-neutral-200 shadow-sm hover:shadow-md',
  outline:
    'border-2 border-primary-500 text-primary-600 hover:bg-primary-50 active:bg-primary-100 shadow-sm hover:shadow-md',
  ghost:
    'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100/70 active:bg-neutral-200/70',

  success:
    'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md hover:shadow-lg',
  warning:
    'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-md hover:shadow-lg',
  error:
    'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-md hover:shadow-lg',

  // Subtle gradient (softer than before)
  gradient:
    'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-md hover:shadow-lg',

  // Light glass (readable on light backgrounds)
  glass:
    'bg-white/60 hover:bg-white/75 backdrop-blur-sm border border-neutral-200 text-neutral-900 shadow-sm hover:shadow-md',

  // Fitness (softened)
  cardio:      'bg-gradient-to-r from-rose-500 to-orange-500 hover:opacity-95 text-white shadow-md hover:shadow-lg',
  strength:    'bg-gradient-to-r from-emerald-500 to-green-600 hover:opacity-95 text-white shadow-md hover:shadow-lg',
  flexibility: 'bg-gradient-to-r from-cyan-500 to-sky-600 hover:opacity-95 text-white shadow-md hover:shadow-lg',
  recovery:    'bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white shadow-md hover:shadow-lg',
  hiit:        'bg-gradient-to-r from-amber-500 to-rose-600 hover:opacity-95 text-white shadow-md hover:shadow-lg',
  yoga:        'bg-gradient-to-r from-violet-500 to-cyan-400 hover:opacity-95 text-white shadow-md hover:shadow-lg',
  pilates:     'bg-gradient-to-r from-pink-400 to-violet-500 hover:opacity-95 text-white shadow-md hover:shadow-lg',

  // Intensity (soft base → full palette on hover)
  'intensity-low':
    'bg-cyan-50 text-cyan-800 hover:bg-gradient-to-r hover:from-cyan-500 hover:to-sky-600 hover:text-white shadow-sm hover:shadow-md',
  'intensity-medium':
    'bg-emerald-50 text-emerald-800 hover:bg-gradient-to-r hover:from-emerald-500 hover:to-green-600 hover:text-white shadow-sm hover:shadow-md',
  'intensity-high':
    'bg-rose-50 text-rose-800 hover:bg-gradient-to-r hover:from-rose-500 hover:to-orange-500 hover:text-white shadow-sm hover:shadow-md',
  'intensity-extreme':
    'bg-amber-50 text-amber-800 hover:bg-gradient-to-r hover:from-amber-500 hover:to-rose-600 hover:text-white shadow-sm hover:shadow-md',

  // Modern energy variant - Nike inspired
  energy:
    'bg-energy-500 hover:bg-energy-600 active:bg-energy-700 text-white shadow-sm hover:shadow-md',
  power:
    'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-md hover:shadow-lg',
  zen:
    'bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white shadow-md hover:shadow-lg',
  achievement:
    'bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white shadow-md hover:shadow-lg',
};

/** Focus ring color per variant (light accent ring) */
const VARIANT_RING: Partial<Record<ButtonVariant, string>> = {
  primary: 'focus-visible:ring-primary-400',
  secondary: 'focus-visible:ring-neutral-300',
  outline: 'focus-visible:ring-primary-400',
  ghost: 'focus-visible:ring-neutral-300',
  energy: 'focus-visible:ring-energy-400',
  success: 'focus-visible:ring-success-400',
  warning: 'focus-visible:ring-amber-400',
  error: 'focus-visible:ring-rose-400',
  gradient: 'focus-visible:ring-primary-400',
  glass: 'focus-visible:ring-neutral-300',

  cardio: 'focus-visible:ring-rose-300',
  strength: 'focus-visible:ring-emerald-300',
  flexibility: 'focus-visible:ring-cyan-300',
  recovery: 'focus-visible:ring-teal-300',
  hiit: 'focus-visible:ring-amber-300',
  yoga: 'focus-visible:ring-violet-300',
  pilates: 'focus-visible:ring-pink-300',

  'intensity-low': 'focus-visible:ring-cyan-300',
  'intensity-medium': 'focus-visible:ring-emerald-300',
  'intensity-high': 'focus-visible:ring-rose-300',
  'intensity-extreme': 'focus-visible:ring-amber-300',


  power: 'focus-visible:ring-red-300',
  zen: 'focus-visible:ring-teal-300',
  achievement: 'focus-visible:ring-amber-300',
};

/** Height/spacing are sized; icon gets its own scale */
const SIZE_ROOT: Record<ButtonSize, string> = {
  xs: 'h-8 px-3 text-xs',
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-base', // ≥44px touch target
  lg: 'h-12 px-6 text-lg',
  xl: 'h-14 px-7 text-xl',
};
const SIZE_ICON: Record<ButtonSize, string> = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-7 h-7',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    icon,
    iconPosition = 'left',
    glow = false,
    pulse = false,
    animation = 'none',
    focusRing = true,
    loadingText,
    disabled,
    className,
    children,
    type = 'button',
    ...props
  },
  ref
) {
  const isIconOnly = !!icon && !children;
  const shouldReduceMotion = useReducedMotion();

  // Softer motion
  const motionHover =
    !shouldReduceMotion && !disabled && !loading ? { scale: 1.01, y: -0.5 } : undefined;
  const motionTap =
    !shouldReduceMotion && !disabled && !loading ? { scale: 0.985 } : undefined;

  // Subtle glow: gentle primary-tinted drop shadow (no neon)
  const subtleGlow =
    glow &&
    'shadow-lg shadow-primary-500/10 hover:shadow-primary-500/15 hover:shadow-xl';

  const focusClasses = focusRing
    ? cn('focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2', VARIANT_RING[variant])
    : 'focus-visible:ring-0 focus-visible:ring-offset-0';

  const root = cn(
    'relative inline-flex items-center justify-center font-semibold rounded-2xl transition-all duration-200',
    'disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group touch-manipulation select-none',
    VARIANT_BASE[variant],
    SIZE_ROOT[size],
    focusClasses,
    fullWidth && 'w-full',
    subtleGlow,
    pulse && 'animate-workout-pulse',
    animation !== 'none' && `animate-${animation}`,
    isIconOnly && 'aspect-square px-0',
    className
  );

  const iconCls = cn(
    SIZE_ICON[size],
    isIconOnly ? '' : iconPosition === 'left' ? 'mr-2' : 'ml-2',
    'transition-transform duration-200 group-hover:scale-105'
  );

  const renderIcon = (node: ReactNode) => {
    if (!node) return null;
    return React.cloneElement(node as ReactElement<any>, { className: iconCls });
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      whileHover={motionHover}
      whileTap={motionTap}
      className={root}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-live={loading ? 'polite' : undefined}
      data-variant={variant}
      data-size={size}
      data-loading={loading ? '' : undefined}
      {...props}
    >
      {/* Subtle sheen (lighter & only on hover) */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

      {/* content */}
      <span className="relative z-10 inline-flex items-center">
        {loading ? (
          <>
            <LoadingSpinner size={size === 'xs' || size === 'sm' ? 'sm' : 'md'} className={children ? 'mr-2' : ''} />
            <span className="animate-pulse">{loadingText ?? children}</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && renderIcon(icon)}
            {children && <span className="transition-all duration-200 group-hover:tracking-wide">{children}</span>}
            {icon && iconPosition === 'right' && renderIcon(icon)}
            {isIconOnly && !props['aria-label'] && <span className="sr-only">Button</span>}
          </>
        )}
      </span>
    </motion.button>
  );
});

/* Convenience wrappers (kept but with gentler styling by virtue of base changes) */
export const WorkoutButton: React.FC<Omit<ButtonProps, 'variant'> & { workoutType: FitnessVariant }> = ({ workoutType, ...props }) => (
  <Button {...props} variant={workoutType} />
);

export const IntensityButton: React.FC<Omit<ButtonProps, 'variant'> & { intensity: 'low' | 'medium' | 'high' | 'extreme' }> = ({
  intensity,
  ...props
}) => <Button {...props} variant={`intensity-${intensity}` as IntensityVariant} />;

export const StartWorkoutButton: React.FC<Omit<ButtonProps, 'variant' | 'glow' | 'pulse'>> = (props) => (
  <Button {...props} variant="energy" glow size="lg" />
);

export const CompleteWorkoutButton: React.FC<Omit<ButtonProps, 'variant' | 'animation'>> = (props) => (
  <Button {...props} variant="achievement" animation="motivation-bounce" />
);

export const RestButton: React.FC<Omit<ButtonProps, 'variant' | 'pulse'>> = (props) => (
  <Button {...props} variant="zen" />
);

export const EmergencyStopButton: React.FC<Omit<ButtonProps, 'variant' | 'pulse'>> = (props) => (
  <Button {...props} variant="error" size="lg" />
);
```

---

## `src/components/ui/Card.tsx`

**Description:** Card component with variants

```typescript
// src/components/ui/Card.tsx
import React, { type KeyboardEvent, useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;

  /** Visual style */
  variant?:
    | 'default'
    | 'gradient'
    | 'glass'
    | 'elevated'
    | 'energy'
    | 'workout'
    | 'exercise'
    | 'achievement';

  /** Hover lift/scale */
  hover?: boolean;

  /** Adds button-like affordances (cursor, space/enter activation, focus ring) */
  interactive?: boolean;

  /** Internal padding scale */
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

  /** Additional classes */
  className?: string;

  /** Click handler (enables keyboard activation when `interactive`) */
  onClick?: () => void;

  /** Fade/slide-in on mount */
  animate?: boolean;

  /** Stagger delay (seconds) */
  delay?: number;

  /** Soft glow keyframe */
  glow?: boolean;

  /** Pulse keyframe (fitness vibe) */
  pulse?: boolean;

  /** Subtle ring to call attention */
  borderAccent?: boolean;

  /** Busy state overlay + skeleton shimmer */
  loading?: boolean;

  /** Optional title/subtitle for quick use (or use slot components below) */
  title?: React.ReactNode;
  subtitle?: React.ReactNode;

  /** ARIA label for interactive cards without visible text */
  ariaLabel?: string;
}

/** Lightweight utility */
const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hover = false,
  interactive = false,
  padding = 'md',
  className = '',
  onClick,
  animate = false,
  delay = 0,
  glow = false,
  pulse = false,
  borderAccent = false,
  loading = false,
  title,
  subtitle,
  ariaLabel,
}) => {
  const reduceMotion = useReducedMotion();
  const headingId = useId();
  const subId = useId();

  const base =
    'relative overflow-hidden rounded-3xl transition-all duration-300 focus:outline-none';
  const focusRing =
    'focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2';
  const pressable =
    interactive ? 'cursor-pointer select-none will-change-transform' : '';

  const paddingMap = {
    none: '',
    xs: 'p-3',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
    '2xl': 'p-12',
  } as const;

  const variantMap: Record<NonNullable<CardProps['variant']>, string> = {
    default:
      'bg-white border border-neutral-200 shadow-sm hover:shadow-md hover:border-neutral-300',
    gradient:
      'bg-gradient-primary text-white shadow-md',
    glass:
      'backdrop-blur-md bg-white/80 border border-white/30 shadow-glass',
    elevated:
      'bg-white border border-neutral-100 shadow-elevated',
    energy:
      'bg-gradient-energy text-white shadow-md',
    workout:
      'bg-white border-l-4 border-energy-500 shadow-sm hover:shadow-md hover:border-energy-600',
    exercise:
      'bg-white border border-neutral-200 hover:border-primary-300 shadow-sm hover:shadow-md',
    achievement:
      'bg-gradient-to-br from-success-50 to-white border border-success-200 shadow-sm',
  };

  const hoverFx = hover ? 'hover:-translate-y-1 hover:scale-[1.01] hover:shadow-hard' : '';
  const glowFx = glow ? 'animate-glow' : '';
  const pulseFx = pulse ? 'animate-workout-pulse' : '';
  const ringFx = borderAccent ? 'ring-2 ring-primary-500/20 ring-offset-2' : '';

  const classes = cx(
    base,
    focusRing,
    pressable,
    variantMap[variant],
    paddingMap[padding],
    hoverFx,
    glowFx,
    pulseFx,
    ringFx,
    className
  );

  const motionProps = animate
    ? {
        initial: { opacity: 0, y: reduceMotion ? 0 : 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: reduceMotion ? 0 : 0.5, delay },
      }
    : {};

  const whileHover = interactive && !reduceMotion ? { y: -2, scale: 1.01 } : {};
  const whileTap = interactive && !reduceMotion ? { scale: 0.98 } : {};

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!interactive || !onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      {...motionProps}
      whileHover={whileHover}
      whileTap={whileTap}
      className={classes}
      data-variant={variant}
      role={interactive ? 'button' : 'group'}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive && ariaLabel ? ariaLabel : undefined}
      aria-busy={loading || undefined}
      aria-describedby={subtitle ? subId : undefined}
      aria-labelledby={title ? headingId : undefined}
      onKeyDown={onKeyDown}
      onClick={onClick}
    >
      {/* Optional quick header */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3
              id={headingId}
              className={cx(
                'text-lg font-semibold text-neutral-900',
                variant === 'gradient' || variant === 'glass' ? 'text-white' : ''
              )}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p
              id={subId}
              className={cx(
                'mt-1 text-sm text-neutral-600',
                variant === 'gradient' || variant === 'glass' ? 'text-white/80' : ''
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Body */}
      <div className="relative">{children}</div>

      {/* Loading overlay */}
      {loading && (
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-white/60">
          <div className="absolute inset-0 shimmer" />
        </div>
      )}
    </motion.div>
  );
};

/* ---------- Slots (optional, composable) ---------- */

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={cx('mb-4 flex items-start justify-between gap-3', className)}>{children}</div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <h3 className={cx('text-lg font-semibold text-neutral-900', className)}>
    {children}
  </h3>
);

export const CardSubtitle: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <p className={cx('text-sm text-neutral-600', className)}>{children}</p>
);

export const CardBody: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cx('relative', className)}>{children}</div>;

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => <div className={cx('mt-6 pt-4 border-t border-border', className)}>{children}</div>;

export const CardDivider: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cx('my-4 border-t border-border', className)} />
);

/* ---------- Specialized Cards (preserved API) ---------- */

export const GradientCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="gradient" />
);

export const GlassCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="glass" />
);

export const InteractiveCard: React.FC<Omit<CardProps, 'interactive' | 'hover'>> = (props) => (
  <Card {...props} interactive hover />
);

export const WorkoutCard: React.FC<Omit<CardProps, 'variant'>> = (props) => (
  <Card {...props} variant="workout" hover interactive />
);

export const AchievementCard: React.FC<Omit<CardProps, 'variant' | 'glow' | 'animate'>> = (props) => (
  <Card {...props} variant="achievement" glow animate hover interactive />
);

export const StatsCard: React.FC<Omit<CardProps, 'variant' | 'hover'>> = (props) => (
  <Card {...props} variant="elevated" hover />
);
```

---

## `src/components/ui/Badge.tsx`

**Description:** Badge component with variants

```typescript
import React, { forwardRef, type ReactElement, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/* ===== Types ===== */
type AchievementVariant = 'achievement-bronze' | 'achievement-silver' | 'achievement-gold';

export type BadgeVariant =
  | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'accent' | 'gradient' | 'glass'
  | AchievementVariant;

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  glow?: boolean;
  animate?: boolean; // entrance/hover/tap micro-interactions
  pulse?: boolean;   // subtle attention animation
  icon?: ReactElement | null;
  iconPosition?: 'left' | 'right';
  srLabel?: string;  // optional screen reader label
  className?: string;
}

/* ===== Utils ===== */
const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');

/* ===== Tokens -> Classes ===== */
const VARIANT_CLS: Record<BadgeVariant, string> = {
  // Core
  primary:   'bg-primary-100 text-primary-800 border border-primary-200 hover:bg-primary-200',
  secondary: 'bg-neutral-100 text-neutral-800 border border-neutral-200 hover:bg-neutral-200',
  success:   'bg-success-100 text-success-800 border border-success-200 hover:bg-success-200',
  warning:   'bg-warning-100 text-warning-800 border border-warning-200 hover:bg-warning-200',
  error:     'bg-error-100 text-error-800 border border-error-200 hover:bg-error-200',
  accent:    'bg-accent-100 text-accent-800 border border-accent-200 hover:bg-accent-200',
  gradient:  'bg-gradient-primary text-white shadow-glow-primary hover:shadow-glow-primary-lg',
  glass:     'bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-glass hover:bg-white/20',

  // Achievements
  'achievement-bronze': 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-achievement',
  'achievement-silver': 'bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-achievement',
  'achievement-gold':   'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-achievement',
};

const SIZE_CLS: Record<BadgeSize, string> = {
  xs: 'px-2 py-0.5 text-xs min-h-[20px]',
  sm: 'px-2.5 py-1 text-xs min-h-[24px]',
  md: 'px-3 py-1.5 text-sm min-h-[28px]',
  lg: 'px-4 py-2 text-base min-h-[32px]',
  xl: 'px-5 py-2.5 text-lg min-h-[36px]',
};

const ICON_CLS: Record<BadgeSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

const DOT_CLS: Partial<Record<BadgeVariant, string>> = {
  primary: 'bg-primary-500',
  secondary: 'bg-neutral-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  accent: 'bg-accent-500',
};

/* ===== Component ===== */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    children,
    variant = 'primary',
    size = 'md',
    dot = false,
    glow = false,
    animate = false,
    pulse = false,
    icon,
    iconPosition = 'left',
    srLabel,
    className,
    ...rest
  },
  ref
) {
  const shouldReduceMotion = useReducedMotion();

  const root = cn(
    'inline-flex items-center font-semibold rounded-full select-none transition-all duration-300',
    VARIANT_CLS[variant],
    SIZE_CLS[size],
    glow && !shouldReduceMotion && 'animate-glow',
    pulse && !shouldReduceMotion && 'animate-pulse',
    className
  );

  const iconClass = cn(
    ICON_CLS[size],
    icon ? (iconPosition === 'left' ? 'mr-1.5' : 'ml-1.5') : '',
    'transition-transform duration-300'
  );

  const Dot = dot ? (
    <span
      aria-hidden="true"
      className={cn('w-2 h-2 rounded-full mr-2', DOT_CLS[variant] ?? 'bg-neutral-400')}
    />
  ) : null;

  const Icon = icon
    ? React.cloneElement(icon as ReactElement<any>, { 'aria-hidden': true, className: iconClass })
    : null;

  if (animate && !shouldReduceMotion) {
    return (
      <motion.span
        ref={ref}
        className={root}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24, mass: 0.6 }}
      >
        {srLabel && <span className="sr-only">{srLabel}</span>}
        {iconPosition === 'left' && Icon}
        {Dot}
        <span className="font-medium">{children}</span>
        {iconPosition === 'right' && Icon}
      </motion.span>
    );
  }

  return (
    <span ref={ref} className={root} {...rest}>
      {srLabel && <span className="sr-only">{srLabel}</span>}
      {iconPosition === 'left' && Icon}
      {Dot}
      <span className="font-medium">{children}</span>
      {iconPosition === 'right' && Icon}
    </span>
  );
});

/* ===== Specializations ===== */

export const StatusBadge: React.FC<{
  status: 'online' | 'offline' | 'busy';
  children: ReactNode;
  size?: BadgeSize;
  className?: string;
}> = ({ status, children, size = 'sm', className }) => {
  const map: Record<'online' | 'offline' | 'busy', BadgeVariant> = {
    online: 'success',
    offline: 'secondary',
    busy: 'warning',
  };
  return (
    <Badge variant={map[status]} size={size} dot srLabel={`Status: ${status}`} className={className}>
      {children}
    </Badge>
  );
};

export const CountBadge: React.FC<{
  count: number;
  max?: number;
  className?: string;
  size?: BadgeSize;
  ariaLabel?: string;
}> = ({ count, max = 99, className, size = 'sm', ariaLabel }) => {
  const display = count > max ? `${max}+` : `${count}`;
  return (
    <Badge
      variant="error"
      size={size}
      className={className}
      srLabel={ariaLabel ?? `Count ${display}`}
    >
      {display}
    </Badge>
  );
};



export const AchievementBadge: React.FC<{
  level: 'bronze' | 'silver' | 'gold';
  children: ReactNode;
  size?: BadgeSize;
  glow?: boolean;
  animate?: boolean;
}> = ({ level, children, size = 'md', glow = true, animate = true }) => {
  const variant = `achievement-${level}` as AchievementVariant;
  return (
    <Badge
      variant={variant}
      size={size}
      glow={glow}
      animate={animate}
      srLabel={`Achievement level: ${level}`}
    >
      {children}
    </Badge>
  );
};

export const StreakBadge: React.FC<{
  days: number;
  size?: BadgeSize;
  animate?: boolean;
}> = ({ days, size = 'md', animate = true }) => {
  const variant: BadgeVariant =
    days >= 30 ? 'achievement-gold'
      : days >= 14 ? 'achievement-silver'
      : days >= 7 ? 'achievement-bronze'
      : 'gradient';

  return (
    <Badge
      variant={variant}
      size={size}
      animate={animate}
      glow={days >= 7}
      pulse={days >= 30}
      srLabel={`Streak ${days} day${days !== 1 ? 's' : ''}`}
    >
      🔥 {days} day{days !== 1 ? 's' : ''}
    </Badge>
  );
};
```

---

## `src/components/ui/Progress.tsx`

**Description:** Progress indicators and bars

```typescript
import React from 'react';
import { motion } from 'framer-motion';

interface ProgressProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient' |
           'cardio' | 'strength' | 'flexibility' | 'recovery' | 'hiit' | 'yoga' | 'pilates';
  showValue?: boolean;
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
  striped?: boolean;
  pulse?: boolean;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showValue = false,
  showLabel = false,
  label,
  animate = true,
  striped = false,
  pulse = false,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
    xl: 'h-6',
  };

  const variantClasses = {
    default: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
    gradient: 'bg-gradient-primary',
    cardio: 'bg-gradient-cardio',
    strength: 'bg-gradient-strength',
    flexibility: 'bg-gradient-flexibility',
    recovery: 'bg-gradient-recovery',
    hiit: 'bg-gradient-hiit',
    yoga: 'bg-gradient-yoga',
    pilates: 'bg-gradient-pilates',
  };

  const getProgressColor = (): string => {
    if (percentage >= 100) return 'bg-success-500';
    if (percentage >= 75) return variantClasses[variant];
    if (percentage >= 50) return variantClasses[variant];
    if (percentage >= 25) return 'bg-warning-500';
    return 'bg-error-500';
  };

  const stripedClass = striped ? 'bg-stripes' : '';
  const pulseClass = pulse ? 'animate-pulse' : '';

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-neutral-700">
            {label || 'Progress'}
          </span>
          {showValue && (
            <span className="text-sm font-semibold text-neutral-600">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      {/* Progress Bar */}
      <div className={`w-full bg-neutral-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <motion.div
          className={`${getProgressColor()} ${stripedClass} ${pulseClass} h-full rounded-full transition-all duration-300`}
          initial={animate ? { width: 0 } : { width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// Circular Progress Component
interface CircularProgressProps {
  value: number; // 0-100
  size?: number; // diameter in pixels
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'gradient' | 
           'cardio' | 'strength' | 'flexibility' | 'recovery' | 'hiit' | 'yoga' | 'pilates';
  showValue?: boolean;
  showLabel?: boolean;
  label?: string;
  animate?: boolean;
  className?: string;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  size = 120,
  strokeWidth = 8,
  variant = 'default',
  showValue = true,
  showLabel = false,
  label,
  animate = true,
  className = '',
}) => {
  const percentage = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const variantColors: Record<NonNullable<CircularProgressProps['variant']>, string> = {
    default: 'stroke-primary-500',
    success: 'stroke-success-500',
    warning: 'stroke-warning-500',
    error: 'stroke-error-500',
    gradient: 'stroke-primary-500',
    cardio: 'stroke-fitness-cardio-500',
    strength: 'stroke-fitness-strength-500',
    flexibility: 'stroke-fitness-flexibility-500',
    recovery: 'stroke-fitness-recovery-500',
    hiit: 'stroke-fitness-hiit-500',
    yoga: 'stroke-fitness-yoga-500',
    pilates: 'stroke-fitness-pilates-500',
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-neutral-200"
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={variantColors[variant]}
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : strokeDashoffset}
          animate={animate ? { strokeDashoffset } : {}}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showValue && (
          <motion.span
            className="text-2xl font-bold text-neutral-900"
            initial={animate ? { opacity: 0, scale: 0.5 } : {}}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            {Math.round(percentage)}%
          </motion.span>
        )}
        {showLabel && label && (
          <span className="text-sm text-neutral-600 mt-1">{label}</span>
        )}
      </div>
    </div>
  );
};

// Fitness-specific progress components
export const WorkoutProgress: React.FC<Omit<ProgressProps, 'variant'> & { 
  workoutType: 'cardio' | 'strength' | 'flexibility' | 'recovery' | 'hiit' | 'yoga' | 'pilates';
}> = ({ workoutType, ...props }) => (
  <Progress {...props} variant={workoutType} />
);

export const SetProgress: React.FC<{ 
  currentSet: number; 
  totalSets: number; 
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
}> = ({ currentSet, totalSets, size = 'md', animate = true }) => (
  <Progress
    value={(currentSet / totalSets) * 100}
    size={size}
    variant="strength"
    showValue
    label={`Set ${currentSet} of ${totalSets}`}
    animate={animate}
  />
);

export const CalorieProgress: React.FC<{ 
  burned: number; 
  goal: number; 
  size?: number;
  animate?: boolean;
}> = ({ burned, goal, size = 120, animate = true }) => (
  <CircularProgress
    value={(burned / goal) * 100}
    size={size}
    variant="cardio"
    showValue
    label="Calories"
    animate={animate}
  />
);

export const HeartRateZone: React.FC<{ 
  currentHR: number; 
  maxHR: number; 
  size?: number;
  animate?: boolean;
}> = ({ currentHR, maxHR, size = 100, animate = true }) => {
  const percentage = (currentHR / maxHR) * 100;
  
  const getZoneVariant = () => {
    if (percentage < 50) return 'recovery';
    if (percentage < 60) return 'flexibility';
    if (percentage < 70) return 'cardio';
    if (percentage < 85) return 'strength';
    return 'hiit';
  };

  return (
    <CircularProgress
      value={percentage}
      size={size}
      variant={getZoneVariant()}
      showValue
      label="HR Zone"
      animate={animate}
    />
  );
};

```

---

## `src/components/ui/LoadingSpinner.tsx`

**Description:** Loading spinner component

```typescript
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'accent' | 'white' | 'neutral';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'primary',
  className = ''
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const variantClasses = {
    primary: 'border-neutral-200 border-t-primary-600',
    accent: 'border-neutral-200 border-t-accent-600',
    white: 'border-white/30 border-t-white',
    neutral: 'border-neutral-300 border-t-neutral-600',
  };

  const borderWidth = size === 'xs' || size === 'sm' ? 'border-2' : 'border-3';

  return (
    <div
      className={`animate-spin rounded-full ${borderWidth} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

```

---

## `src/components/ui/Container.tsx`

**Description:** Container and layout components

```typescript
// src/components/ui/Container.tsx
import React from 'react';

type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
type ContainerPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface ContainerProps {
  children: React.ReactNode;
  /** Max width */
  size?: ContainerSize;
  /** Internal padding */
  padding?: ContainerPadding;
  /** Extra classes */
  className?: string;
  /** Render as a different element */
  as?: React.ElementType;
  /** Center container horizontally (mx-auto) */
  center?: boolean;
  /** Bleed the container horizontally (negative margins that mirror padding) */
  bleedX?: boolean;
  /** Bleed the container vertically (negative margins that mirror padding) */
  bleedY?: boolean;
  /** Apply iOS safe-area padding at the top */
  safeTop?: boolean;
  /** Apply iOS safe-area padding at the bottom */
  safeBottom?: boolean;
  /** Enable CSS container queries (container-type: inline-size) */
  cq?: boolean;
  /** Optional named container for container queries */
  containerName?: string;
  /** Pass-through DOM props */
  id?: string;
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
}

/**
 * Base Container
 * - Responsive max-width
 * - Responsive padding
 * - Optional bleeds/safe areas
 * - Container-queries ready
 */
export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'xl',
  padding = 'md',
  className = '',
  as: As = 'div',
  center = true,
  bleedX = false,
  bleedY = false,
  safeTop = false,
  safeBottom = false,
  cq = false,
  containerName,
  ...rest
}) => {
  const sizeClasses: Record<ContainerSize, string> = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    // Tailwind has screen-2xl which is slightly wider than 7xl on many setups
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  const paddingClasses: Record<ContainerPadding, string> = {
    none: '',
    sm: 'px-4 py-4 sm:px-6 sm:py-6',
    md: 'px-4 py-6 sm:px-6 sm:py-8 lg:px-8',
    lg: 'px-4 py-8 sm:px-6 sm:py-12 lg:px-8',
    xl: 'px-4 py-10 sm:px-8 sm:py-16 lg:px-12',
  };

  // Bleed mirrors the padding scale so content can go edge-to-edge within a padded page
  const bleedXClasses =
    bleedX &&
    (padding === 'sm'
      ? '-mx-4 sm:-mx-6'
      : padding === 'md'
      ? '-mx-4 sm:-mx-6 lg:-mx-8'
      : padding === 'lg'
      ? '-mx-4 sm:-mx-6 lg:-mx-8'
      : padding === 'xl'
      ? '-mx-4 sm:-mx-8 lg:-mx-12'
      : '');

  const bleedYClasses =
    bleedY &&
    (padding === 'sm'
      ? '-my-4 sm:-my-6'
      : padding === 'md'
      ? '-my-6 sm:-my-8'
      : padding === 'lg'
      ? '-my-8 sm:-my-12'
      : padding === 'xl'
      ? '-my-10 sm:-my-16'
      : '');

  const safeAreaClasses = [
    safeTop ? 'safe-area-top' : '',
    safeBottom ? 'safe-area-bottom' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const base = [
    sizeClasses[size],
    center ? 'mx-auto' : '',
    paddingClasses[padding],
    bleedXClasses || '',
    bleedYClasses || '',
    safeAreaClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Container queries (style prop supports modern CSS fields in most TS setups; cast if needed)
  const styleCQ = cq
    ? ({ containerType: 'inline-size', containerName } as React.CSSProperties & Record<string, any>)
    : undefined;

  return (
    <As className={base} style={styleCQ} {...rest}>
      {children}
    </As>
  );
};

/* ----------------------------------------------------------------------------
 * Specialized Containers (friendly defaults)
 * --------------------------------------------------------------------------*/

/**
 * PageContainer
 * Recommended for top-level screens (inside your <main>).
 * Defaults to wide and comfy padding.
 */
export const PageContainer: React.FC<
  Omit<ContainerProps, 'size' | 'padding'>
> = ({ children, className = '', ...rest }) => {
  return (
    <Container
      size="xl"
      padding="lg"
      className={className}
      {...rest}
    >
      {children}
    </Container>
  );
};

/**
 * SectionContainer
 * For sections within a page (slightly narrower + medium padding).
 */
export const SectionContainer: React.FC<
  Omit<ContainerProps, 'size' | 'padding'>
> = ({ children, className = '', ...rest }) => {
  return (
    <Container
      size="lg"
      padding="md"
      className={className}
      {...rest}
    >
      {children}
    </Container>
  );
};

/**
 * NarrowContainer
 * Useful for forms and focused content.
 */
export const NarrowContainer: React.FC<
  Omit<ContainerProps, 'size'>
> = ({ children, className = '', ...rest }) => {
  return (
    <Container size="sm" className={className} {...rest}>
      {children}
    </Container>
  );
};

/**
 * ProseContainer
 * Typography-optimized wrapper using @tailwindcss/typography.
 */
export const ProseContainer: React.FC<
  Omit<ContainerProps, 'size' | 'padding'>
> = ({ children, className = '', ...rest }) => {
  return (
    <Container
      size="md"
      padding="lg"
      className={['prose prose-neutral', className].join(' ')}
      {...rest}
    >
      {children}
    </Container>
  );
};
```

---

## `src/components/ui/ErrorBoundary.tsx`

**Description:** Error boundary component

```typescript
import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import { Card } from './Card';
import { logger } from '../../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log error using simple logging
    logger.error('Error boundary caught error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  handleRetry = () => {
    logger.info('Error boundary retry attempted');
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full"
          >
            <Card className="text-center" padding="xl">
              <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ExclamationTriangleIcon className="w-8 h-8 text-error-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-neutral-900 mb-3">
                Oops! Something went wrong
              </h2>
              
              <p className="text-neutral-600 mb-6">
                We encountered an unexpected error. Don't worry, your data is safe. 
                Please try refreshing the page or contact support if the problem persists.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-neutral-700 mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="bg-neutral-100 rounded-lg p-4 text-xs font-mono text-neutral-800 overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    <div className="mb-2">
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleRetry}
                  icon={<ArrowPathIcon />}
                  size="lg"
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  size="lg"
                >
                  Refresh Page
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = () => setError(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
};

```

---

## `src/components/ui/SuspenseFallback.tsx`

**Description:** Suspense fallback component

```typescript
import React from 'react';
import { motion } from 'framer-motion';
import { LoadingSpinner } from './LoadingSpinner';
import { Card } from './Card';

interface SuspenseFallbackProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCard?: boolean;
}

export const SuspenseFallback: React.FC<SuspenseFallbackProps> = ({
  message = 'Loading...',
  size = 'md',
  showCard = false
}) => {
  const sizeClasses = {
    sm: 'min-h-[200px]',
    md: 'min-h-[400px]',
    lg: 'min-h-[600px]',
    full: 'min-h-screen'
  };

  const content = (
    <div className={`${sizeClasses[size]} flex items-center justify-center p-4`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">{message}</h3>
        <p className="text-neutral-600">Please wait while we load your content...</p>
      </motion.div>
    </div>
  );

  if (showCard) {
    return <Card>{content}</Card>;
  }

  return content;
};

// Specialized fallbacks for different sections
export const PageSuspenseFallback: React.FC<{ message?: string }> = ({ 
  message = 'Loading page...' 
}) => (
  <SuspenseFallback message={message} size="full" />
);

export const ComponentSuspenseFallback: React.FC<{ message?: string }> = ({ 
  message = 'Loading component...' 
}) => (
  <SuspenseFallback message={message} size="md" showCard />
);

export const InlineSuspenseFallback: React.FC<{ message?: string }> = ({ 
  message = 'Loading...' 
}) => (
  <SuspenseFallback message={message} size="sm" />
);

// Skeleton loading components
export const SkeletonCard: React.FC = () => (
  <Card className="animate-pulse">
    <div className="space-y-4">
      <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
      <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
      <div className="h-32 bg-neutral-200 rounded"></div>
      <div className="flex space-x-2">
        <div className="h-8 bg-neutral-200 rounded w-20"></div>
        <div className="h-8 bg-neutral-200 rounded w-24"></div>
      </div>
    </div>
  </Card>
);

export const SkeletonWorkoutCard: React.FC = () => (
  <Card className="animate-pulse">
    <div className="flex items-start space-x-4">
      <div className="w-12 h-12 bg-neutral-200 rounded-xl"></div>
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-neutral-200 rounded w-3/4"></div>
        <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
        <div className="flex space-x-2">
          <div className="h-6 bg-neutral-200 rounded-full w-16"></div>
          <div className="h-6 bg-neutral-200 rounded-full w-20"></div>
        </div>
      </div>
    </div>
  </Card>
);

export const SkeletonStats: React.FC = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 3 }).map((_, index) => (
      <Card key={index} className="animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-neutral-200 rounded-xl"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
            <div className="h-6 bg-neutral-200 rounded w-3/4"></div>
          </div>
        </div>
      </Card>
    ))}
  </div>
);

```

---

## `src/components/ui/AccessibilityProvider.tsx`

**Description:** Accessibility utilities

```typescript
import React, { useEffect } from 'react';

// Essential accessibility components
export const SkipLink: React.FC<{ href: string; children: React.ReactNode }> = ({
  href,
  children
}) => (
  <a
    href={href}
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg"
  >
    {children}
  </a>
);

export const VisuallyHidden: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only">{children}</span>
);

interface FocusTrapProps {
  children: React.ReactNode;
  active: boolean;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({ children, active }) => {
  const trapRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active || !trapRef.current) return;

    const focusableElements = trapRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active]);

  return (
    <div ref={trapRef}>
      {children}
    </div>
  );
};



```

---

## `src/components/workout/WorkoutGenerationModal.tsx`

**Description:** AI workout generation modal

```typescript
// src/components/workout/WorkoutGenerationModal.tsx
import React, { useEffect, useMemo, useRef, useState, useId } from 'react';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  SparklesIcon,
  ClockIcon,
  FireIcon,
  WrenchScrewdriverIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  ClipboardIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { fadeUp } from '../../utils/animations';

import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

import { WorkoutService } from '../../services/workoutService';
import { useWorkoutStore } from '../../store/workoutStore';
import { useAuthStore } from '../../store/authStore';

import type {
  UserProfile,
  WorkoutType,
  WorkoutGenerationRequest,
  Equipment,
} from '../../types';

/* ----------------------------- Constants / UI ---------------------------- */

const workoutTypes = [
  { value: 'strength_training', label: 'Strength Training', emoji: '💪', description: 'Build muscle and power' },
  { value: 'cardio', label: 'Cardio', emoji: '🏃‍♀️', description: 'Improve cardiovascular health' },
  { value: 'hiit', label: 'HIIT', emoji: '⚡', description: 'High‑intensity intervals' },
  { value: 'yoga', label: 'Yoga', emoji: '🧘‍♀️', description: 'Flexibility & mindfulness' },
  { value: 'functional', label: 'Functional', emoji: '🏋️‍♂️', description: 'Real‑world movement patterns' },
  { value: 'circuit', label: 'Circuit', emoji: '🔄', description: 'Mixed exercises in sequence' },
] as const;

const intensityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
] as const;

const focusOptions = [
  { value: 'full_body', label: 'Full Body' },
  { value: 'upper', label: 'Upper' },
  { value: 'lower', label: 'Lower' },
  { value: 'core', label: 'Core' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'power', label: 'Power' },
] as const;

const durationPresets = [10, 20, 30, 45];

const LOCAL_STORAGE_KEY = 'workoutGen:last';

/** Simple chip button */
const Chip: React.FC<{
  selected?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
  title?: string;
}> = ({ selected, onClick, children, className = '', ariaLabel, disabled, title }) => (
  <button
    type="button"
    aria-pressed={selected}
    aria-label={ariaLabel}
    title={title}
    onClick={onClick}
    disabled={disabled}
    className={[
      'inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-smooth border focus-visible-enhanced',
      disabled ? 'opacity-50 cursor-not-allowed' : '',
      selected
        ? 'bg-primary-600 text-white border-primary-600 shadow-soft hover:bg-primary-700'
        : 'bg-neutral-100 text-neutral-800 border-neutral-200 hover:bg-neutral-200',
      className,
    ].join(' ')}
  >
    {children}
  </button>
);

/* --------------------------------- Helpers -------------------------------- */

type Intensity = 'low' | 'moderate' | 'high';

const clampDuration = (n: number) => Math.max(5, Math.min(120, Math.round(n || 20)));

const intensityFromLevel = (fitnessLevel?: string): Intensity => {
  const level = (fitnessLevel || '').toLowerCase();
  if (level.includes('begin')) return 'low';
  if (level.includes('adv')) return 'high';
  return 'moderate';
};

const suggestFocusForType = (type: WorkoutType): string[] => {
  switch (type) {
    case 'cardio':
      return ['endurance', 'core'];
    case 'hiit':
      return ['full_body', 'power'];
    case 'yoga':
      return ['mobility', 'core'];
    case 'functional':
      return ['full_body', 'core'];
    case 'circuit':
      return ['full_body'];
    case 'strength_training':
    default:
      return ['full_body'];
  }
};

const labelFromType: Record<WorkoutType | 'pilates' | 'stretching', string> = {
  strength_training: 'Strength Blocks',
  cardio: 'Cardio Segments',
  hiit: 'HIIT Rounds',
  yoga: 'Flows & Holds',
  pilates: 'Pilates Movements',
  stretching: 'Stretching Sequences',
  functional: 'Functional Sets',
  circuit: 'Circuit Laps',
};

/* --------------------------------- Modal -------------------------------- */

interface WorkoutGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
}

export const WorkoutGenerationModal: React.FC<WorkoutGenerationModalProps> = ({
  isOpen,
  onClose,
  userProfile,
}) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setCurrentWorkout, setError, clearError } = useWorkoutStore();

  // ---- Local state
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<WorkoutType>('strength_training');
  const [intensity, setIntensity] = useState<Intensity>('moderate');
  const [autoIntensity, setAutoIntensity] = useState<boolean>(true);
  const [focusAreas, setFocusAreas] = useState<string[]>(['full_body']);
  const [duration, setDuration] = useState<number>(20);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [bodyweightOnly, setBodyweightOnly] = useState<boolean>(false);
  const [rememberSettings, setRememberSettings] = useState<boolean>(true);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const [generating, setGenerating] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);
  const [localError, setLocalError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const initialFocusRef = useRef<HTMLButtonElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const durationSliderId = useId();

  // ---- Load / reset when modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Defaults
    const defaultDuration = clampDuration(userProfile?.timeCommitment?.minutesPerSession ?? 20);
    const defaultEquip = userProfile?.availableEquipment ?? [];
    const defaultIntensity = intensityFromLevel(userProfile?.fitnessLevel);
    const defaultType: WorkoutType = 'strength_training';

    // Try to hydrate from localStorage if remembered
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const s = JSON.parse(stored) as {
          selectedWorkoutType: WorkoutType;
          intensity: Intensity;
          autoIntensity: boolean;
          focusAreas: string[];
          duration: number;
          equipment: Equipment[];
          bodyweightOnly: boolean;
          rememberSettings: boolean;
          showAdvanced?: boolean;
        };

        setSelectedWorkoutType(s.selectedWorkoutType ?? defaultType);
        setAutoIntensity(s.autoIntensity ?? true);
        setIntensity(s.intensity ?? defaultIntensity);
        setFocusAreas(Array.isArray(s.focusAreas) && s.focusAreas.length > 0 ? s.focusAreas : suggestFocusForType(s.selectedWorkoutType ?? defaultType));
        setDuration(clampDuration(s.duration ?? defaultDuration));
        setBodyweightOnly(Boolean(s.bodyweightOnly));
        setEquipment(s.bodyweightOnly ? [] : (s.equipment ?? defaultEquip));
        setRememberSettings(s.rememberSettings ?? true);
        setShowAdvanced(Boolean(s.showAdvanced));
      } catch {
        // Fallback to profile defaults
        setSelectedWorkoutType(defaultType);
        setAutoIntensity(true);
        setIntensity(defaultIntensity);
        setFocusAreas(suggestFocusForType(defaultType));
        setDuration(defaultDuration);
        setEquipment(defaultEquip);
        setBodyweightOnly(false);
      }
    } else if (userProfile) {
      // Profile‑based defaults
      setSelectedWorkoutType(defaultType);
      setAutoIntensity(true);
      setIntensity(defaultIntensity);
      setFocusAreas(suggestFocusForType(defaultType));
      setDuration(defaultDuration);
      setEquipment(defaultEquip);
      setBodyweightOnly(false);
    }

    // UI resets
    setLocalError('');
    setGeneratedWorkout(null);
    setCopied(false);

    // Move focus to first major control for a11y
    // Defer to next tick to ensure elements are in the DOM
    setTimeout(() => {
      initialFocusRef.current?.focus();
    }, 0);
  }, [isOpen, userProfile]);

  // Persist user choices
  useEffect(() => {
    if (!rememberSettings) return;
    const payload = {
      selectedWorkoutType,
      intensity,
      autoIntensity,
      focusAreas,
      duration,
      equipment,
      bodyweightOnly,
      rememberSettings,
      showAdvanced,
    };
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // best-effort; ignore quota failures
    }
  }, [
    selectedWorkoutType,
    intensity,
    autoIntensity,
    focusAreas,
    duration,
    equipment,
    bodyweightOnly,
    rememberSettings,
    showAdvanced,
  ]);

  const toggleArrayValue = <T,>(arr: T[], value: T): T[] =>
    arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];

  const handleClose = () => {
    if (generating) return; // prevent accidental close mid-generation
    setGeneratedWorkout(null);
    setLocalError('');
    clearError();
    onClose();
  };

  const validate = () => {
    if (!user || !userProfile) {
      const msg = 'User profile not found. Please complete onboarding first.';
      setLocalError(msg);
      setError(msg);
      return false;
    }
    if (!Number.isFinite(duration) || clampDuration(duration) <= 0) {
      setLocalError('Please set a valid session duration (5–120 minutes).');
      return false;
    }
    if (!focusAreas.length) {
      setLocalError('Please choose at least one focus area.');
      return false;
    }
    return true;
  };

  const resolvedIntensity: Intensity = autoIntensity ? intensityFromLevel(userProfile?.fitnessLevel) : intensity;

  // ---- Generate workout
  const handleGenerateWorkout = async () => {
    if (!validate()) return;

    setGenerating(true);
    setLocalError('');
    clearError();

    try {
      const request: WorkoutGenerationRequest = {
        userId: user!.id,
        fitnessLevel: userProfile!.fitnessLevel,
        fitnessGoals: userProfile!.fitnessGoals,
        availableEquipment: bodyweightOnly ? [] : equipment,
        timeCommitment: {
          ...userProfile!.timeCommitment,
          minutesPerSession: clampDuration(duration),
        },
        workoutType: selectedWorkoutType,
        focusAreas,
        preferences: {
          ...(userProfile!.preferences || {}),
          intensity: resolvedIntensity,
        },
      };

      const workout = await WorkoutService.generateWorkout(request);
      setGeneratedWorkout(workout);
      setCurrentWorkout(workout);
      setCopied(false);
      // move focus to the "Start Workout" button for a11y
      setTimeout(() => {
        closeBtnRef.current?.focus();
      }, 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate workout';
      setLocalError(message);
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleStartWorkout = () => {
    if (generatedWorkout) {
      setCurrentWorkout(generatedWorkout);
      handleClose();
      navigate('/app/workout');
    }
  };

  /* ------------------------------ Instant Preview ------------------------------ */

  const preview = useMemo(() => {
    const dur = clampDuration(duration || 20);
    const warmup = Math.min(10, Math.max(3, Math.round(dur * 0.15)));
    const cooldown = Math.min(10, Math.max(2, Math.round(dur * 0.1)));
    const work = Math.max(4, dur - warmup - cooldown);
    const workLabel = labelFromType[selectedWorkoutType] || 'Blocks';

    const blocks: { title: string; hint: string }[] = [];
    blocks.push({ title: `Warm‑up • ~${warmup} min`, hint: 'Light cardio, mobility, activation' });

    if (selectedWorkoutType === 'hiit') {
      const workSec = resolvedIntensity === 'high' ? '40s ON / 20s OFF' : resolvedIntensity === 'moderate' ? '30s / 30s' : '20s / 40s';
      blocks.push({ title: `${workLabel} • ~${work} min`, hint: `${workSec} × intervals` });
    } else if (selectedWorkoutType === 'yoga') {
      blocks.push({ title: `${workLabel} • ~${work} min`, hint: focusAreas.includes('mobility') ? 'Hips, hamstrings, T‑spine' : 'Balanced vinyasa' });
    } else if (selectedWorkoutType === 'cardio') {
      blocks.push({ title: `${workLabel} • ~${work} min`, hint: focusAreas.includes('endurance') ? 'Steady Zone 2–3' : 'Mixed pacing' });
    } else {
      const hint =
        focusAreas.includes('full_body')
          ? 'Full‑body emphasis'
          : `Focus: ${focusAreas.map((f) => f.replace('_', ' ')).join(', ')}`;
      blocks.push({ title: `${workLabel} • ~${work} min`, hint });
    }

    blocks.push({ title: `Cool‑down • ~${cooldown} min`, hint: 'Breathing + stretches' });

    return { dur, warmup, work, cooldown, blocks, intensity: resolvedIntensity };
  }, [selectedWorkoutType, resolvedIntensity, focusAreas, duration]);

  /* ---------------------------------- UI ---------------------------------- */

  if (!userProfile) {
    return (
      <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
        <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-[1px]" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="card w-full max-w-md">
            <div className="text-center p-4">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">Complete Your Profile</h3>
              <p className="text-neutral-600 mb-4">
                Please complete onboarding to generate personalized workouts.
              </p>
              <Button onClick={() => (window.location.href = '/onboarding')}>Complete Onboarding</Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  }

  // Derived UI helpers
  const profileHasEquipment = (userProfile.availableEquipment?.length ?? 0) > 0;
  const focusIsSelected = (key: string) => focusAreas.includes(key);

  const handleToggleFocus = (key: string) => {
    if (key === 'full_body') {
      setFocusAreas(['full_body']);
      return;
    }
    setFocusAreas((prev) => {
      // Remove 'full_body' if selecting a specific area
      const next = prev.filter((f) => f !== 'full_body');
      const maybe = toggleArrayValue(next, key);
      // Ensure at least one remains
      return maybe.length ? maybe : ['full_body'];
    });
  };

  const handleDurationInput = (n: number) => setDuration(clampDuration(n));

  const randomizeSelections = () => {
    const rand = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)];
    const type = rand(workoutTypes).value as WorkoutType;
    const suggested = suggestFocusForType(type);
    const dur = rand([10, 20, 30, 45, 60, 40, 25]);
    const inten = rand(['low', 'moderate', 'high'] as const);
    setSelectedWorkoutType(type);
    setFocusAreas(suggested);
    setAutoIntensity(false);
    setIntensity(inten);
    setDuration(dur);
    setLocalError('');
  };

  const applySmartAndGenerate = async () => {
    setAutoIntensity(true);
    setFocusAreas(suggestFocusForType(selectedWorkoutType));
    await handleGenerateWorkout();
  };

  const copyPlan = async () => {
    if (!generatedWorkout) return;
    try {
      const summary = {
        name: generatedWorkout.name ?? 'Workout',
        type: generatedWorkout.type ?? selectedWorkoutType,
        duration: generatedWorkout.estimatedDuration ?? preview.dur,
        difficulty: generatedWorkout.difficulty ?? preview.intensity,
        exercises: (generatedWorkout.exercises ?? []).map((x: any) => ({
          name: x.name,
          sets: x.sets,
          reps: x.reps,
          duration: x.duration,
          rest: x.rest,
        })),
      };
      await navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore; clipboard might be unavailable
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      className="relative z-50"
      // prevent closing on overlay click while generating
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-neutral-950/40 backdrop-blur-[1px]" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="card w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-2 sm:p-4">
            <div className="flex items-center">
              <SparklesIcon className="w-6 h-6 text-primary-600 mr-2" aria-hidden />
              <Dialog.Title className="text-xl font-semibold text-neutral-900">
                Generate AI Workout
              </Dialog.Title>
              <Badge variant="secondary" size="xs" className="ml-2">Beta</Badge>
            </div>
            <button
              ref={closeBtnRef}
              onClick={handleClose}
              className="rounded-lg p-1 text-neutral-400 hover:text-neutral-600 transition-smooth focus-visible-enhanced"
              aria-label="Close modal"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {/* Error banner */}
            <AnimatePresence>
              {localError && (
                <motion.div
                  role="alert"
                  aria-live="assertive"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-4 rounded-lg border border-error-200 bg-error-50 p-3"
                  data-testid="generation-error"
                >
                  <div className="flex items-start gap-2">
                    <span className="sr-only">Error</span>
                    <p className="text-sm text-error-700">{localError}</p>
                    <div className="ml-auto">
                      <Button size="xs" variant="ghost" onClick={() => setLocalError('')}>
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- Selection area (hidden when result is shown) --- */}
            <AnimatePresence mode="wait">
              {!generatedWorkout ? (
                <motion.form
                  key="selection"
                  variants={fadeUp()}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleGenerateWorkout();
                  }}
                  aria-describedby="instant-preview"
                >
                  {/* 1) Type */}
                  <section className="mb-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3">Workout Type</h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {workoutTypes.map((type, idx) => {
                        const selected = selectedWorkoutType === type.value;
                        return (
                          <button
                            key={type.value}
                            ref={idx === 0 ? initialFocusRef : undefined}
                            type="button"
                            onClick={() => {
                              setSelectedWorkoutType(type.value as WorkoutType);
                              // When changing type, offer sensible focus defaults if user kept full_body only
                              setFocusAreas((prev) => (prev.length === 1 && prev[0] === 'full_body' ? suggestFocusForType(type.value as WorkoutType) : prev));
                            }}
                            aria-pressed={selected}
                            className={[
                              'flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-smooth',
                              selected
                                ? 'border-primary-500 bg-primary-50 shadow-medium'
                                : 'border-neutral-200 hover:border-neutral-300 hover:shadow-soft',
                            ].join(' ')}
                          >
                            <span className="text-2xl leading-none">{type.emoji}</span>
                            <div>
                              <p className="font-semibold text-neutral-900">{type.label}</p>
                              <p className="text-sm text-neutral-600">{type.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* 2) Duration */}
                  <section className="mb-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <ClockIcon className="w-5 h-5 text-neutral-500" aria-hidden />
                      <h3 className="text-lg font-semibold text-neutral-900">Duration</h3>
                      <Badge variant="secondary" size="xs">{preview.dur} min</Badge>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap gap-2">
                        {durationPresets.map((m) => (
                          <Chip
                            key={m}
                            selected={duration === m}
                            onClick={() => handleDurationInput(m)}
                            ariaLabel={`Set duration to ${m} minutes`}
                          >
                            {m} min
                          </Chip>
                        ))}
                        <div className="inline-flex items-center gap-2">
                          <Input
                            label="Custom"
                            type="number"
                            min={5}
                            max={120}
                            step={1}
                            value={duration}
                            onChange={(e) => handleDurationInput(Number(e.target.value))}
                            className="w-28"
                            aria-label="Custom duration (minutes)"
                          />
                        </div>
                      </div>

                      {/* Slider for faster input */}
                      <div className="mt-2">
                        <label htmlFor={durationSliderId} className="sr-only">Duration slider</label>
                        <input
                          id={durationSliderId}
                          type="range"
                          min={5}
                          max={120}
                          step={5}
                          value={duration}
                          onChange={(e) => handleDurationInput(Number(e.target.value))}
                          className="w-full accent-primary-600"
                          aria-valuemin={5}
                          aria-valuemax={120}
                          aria-valuenow={duration}
                        />
                        <div className="mt-1 flex justify-between text-xs text-neutral-500">
                          <span>5</span>
                          <span>60</span>
                          <span>120</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 3) Intensity & Focus */}
                  <section className="mb-6">
                    <div className="mb-3 flex items-center gap-2">
                      <FireIcon className="w-5 h-5 text-neutral-500" aria-hidden />
                      <h3 className="text-lg font-semibold text-neutral-900">Intensity & Focus</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {/* Intensity */}
                      <div>
                        <p className="mb-2 text-sm font-medium text-neutral-700">Intensity</p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Chip
                            selected={autoIntensity}
                            onClick={() => setAutoIntensity((s) => !s)}
                            ariaLabel="Toggle auto intensity"
                            title="Auto (based on profile fitness level)"
                          >
                            Auto (Recommended)
                          </Chip>
                          {!autoIntensity &&
                            intensityOptions.map((opt) => (
                              <Chip
                                key={opt.value}
                                selected={intensity === opt.value}
                                onClick={() => setIntensity(opt.value as Intensity)}
                                ariaLabel={`Select intensity ${opt.label}`}
                              >
                                {opt.label}
                              </Chip>
                            ))}
                          {autoIntensity && (
                            <Badge variant="secondary" size="xs" className="ml-1">
                              Using: {intensityFromLevel(userProfile.fitnessLevel)}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Focus Areas */}
                      <div>
                        <p className="mb-2 text-sm font-medium text-neutral-700">Focus Areas</p>
                        <div className="flex flex-wrap gap-2">
                          {focusOptions.map((opt) => (
                            <Chip
                              key={opt.value}
                              selected={focusIsSelected(opt.value)}
                              onClick={() => handleToggleFocus(opt.value)}
                              ariaLabel={`Toggle focus ${opt.label}`}
                              title={opt.value === 'full_body' ? 'Selects a balanced full‑body plan' : ''}
                            >
                              {opt.label}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 4) Equipment */}
                  <section className="mb-6">
                    <div className="mb-3 flex items-center gap-2">
                      <WrenchScrewdriverIcon className="w-5 h-5 text-neutral-500" aria-hidden />
                      <h3 className="text-lg font-semibold text-neutral-900">Equipment</h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Chip
                        selected={bodyweightOnly}
                        onClick={() => {
                          setBodyweightOnly((s) => !s);
                          setEquipment((prev) => (!bodyweightOnly ? [] : prev));
                        }}
                        ariaLabel="Toggle bodyweight only"
                        title="Use no equipment"
                      >
                        Bodyweight only
                      </Chip>

                      {!bodyweightOnly && profileHasEquipment && (
                        <>
                          <Chip
                            onClick={() => setEquipment(userProfile.availableEquipment!)}
                            ariaLabel="Select all equipment"
                            title="Select all"
                          >
                            Select all
                          </Chip>
                          <Chip
                            onClick={() => setEquipment([])}
                            ariaLabel="Clear equipment"
                            title="Clear all"
                          >
                            Clear
                          </Chip>
                          {userProfile.availableEquipment!.map((eq) => (
                            <Chip
                              key={eq}
                              selected={equipment.includes(eq)}
                              onClick={() => setEquipment((prev) => toggleArrayValue(prev, eq))}
                              ariaLabel={`Toggle equipment ${eq}`}
                            >
                              {eq}
                            </Chip>
                          ))}
                        </>
                      )}

                      {!profileHasEquipment && !bodyweightOnly && (
                        <p className="text-sm text-neutral-500">
                          No equipment saved in profile. Add some in Settings to see quick chips.
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                        <input
                          type="checkbox"
                          className="accent-primary-600"
                          checked={rememberSettings}
                          onChange={(e) => setRememberSettings(e.target.checked)}
                        />
                        Remember these choices
                      </label>

                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-800 transition-smooth"
                        onClick={() => setShowAdvanced((s) => !s)}
                        aria-expanded={showAdvanced}
                      >
                        <AdjustmentsHorizontalIcon className="w-4 h-4" />
                        Advanced
                      </button>
                    </div>

                    <AnimatePresence initial={false}>
                      {showAdvanced && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700"
                        >
                          <p className="mb-2">
                            Advanced options are applied automatically during generation (e.g., interval structures for HIIT, set/rep schemes for strength).
                          </p>
                          <ul className="list-disc pl-5 space-y-1 text-neutral-600">
                            <li>Warm‑up and cool‑down are automatically scaled to session duration.</li>
                            <li>Intensity influences rest times, tempos, and density.</li>
                            <li>Focus areas guide exercise selection and ordering.</li>
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>

                  {/* 5) Instant Preview */}
                  <section className="mb-6" id="instant-preview">
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-primary-600" aria-hidden />
                        <h4 className="font-semibold text-neutral-900">Instant Preview</h4>
                        <Badge variant="secondary" size="xs">{selectedWorkoutType.replace('_', ' ')}</Badge>
                        <Badge variant="secondary" size="xs">Intensity: {preview.intensity}</Badge>
                        {bodyweightOnly && <Badge variant="secondary" size="xs">Bodyweight</Badge>}
                      </div>
                      <p className="text-sm text-neutral-600 mb-3">
                        A quick look at how your session could be structured:
                      </p>
                      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {preview.blocks.map((b, i) => (
                          <li key={i} className="rounded-xl bg-white p-3 shadow-soft border border-neutral-200">
                            <p className="font-medium text-neutral-900">{b.title}</p>
                            <p className="text-sm text-neutral-600">{b.hint}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={randomizeSelections}
                        title="Randomize selections"
                      >
                        <ArrowPathIcon className="w-5 h-5 mr-2" aria-hidden />
                        Surprise me
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={applySmartAndGenerate}
                        title="Use smart defaults and generate"
                      >
                        <SparklesIcon className="w-5 h-5 mr-2" aria-hidden />
                        Smart Generate
                      </Button>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                      <Button type="button" variant="ghost" onClick={handleClose}>
                        Cancel
                      </Button>
                      <Button type="submit" loading={generating} className="px-6" data-testid="generate-btn">
                        <SparklesIcon className="w-5 h-5 mr-2" aria-hidden />
                        Generate Workout
                      </Button>
                    </div>
                  </div>

                  {/* Loading overlay (subtle) */}
                  <AnimatePresence>
                    {generating && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-white/50 backdrop-blur-[1px] rounded-2xl"
                        aria-hidden="true"
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex flex-col items-center">
                            <div className="flex gap-2 mb-2">
                              {[0, 1, 2].map((i) => (
                                <motion.div
                                  key={i}
                                  className="h-2 w-2 rounded-full bg-primary-600"
                                  animate={{ y: [0, -6, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-neutral-700">Crafting your workout…</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.form>
              ) : (
                /* ---------------------------- Generated Result ---------------------------- */
                <motion.div
                  key="result"
                  variants={fadeUp()}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <div className="text-center mb-6">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
                      <SparklesIcon className="h-8 w-8 text-success-600" aria-hidden />
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                      Your Workout is Ready! 🎉
                    </h3>
                    <p className="text-neutral-600">
                      AI generated a personalized session from your selections.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-r from-primary-50 to-secondary-50 p-6 mb-6 border border-neutral-200">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-neutral-900">
                        {generatedWorkout.name ?? 'Personalized Workout'}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setGeneratedWorkout(null)}>
                          Edit selections
                        </Button>
                        <Button variant="outline" size="sm" onClick={copyPlan} title="Copy summary JSON to clipboard">
                          {copied ? <CheckIcon className="w-4 h-4 mr-2" /> : <ClipboardIcon className="w-4 h-4 mr-2" />}
                          {copied ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                    </div>

                    {generatedWorkout.description && (
                      <p className="text-neutral-700 mb-4">{generatedWorkout.description}</p>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                      <div>
                        <strong>Duration:</strong> {generatedWorkout.estimatedDuration ?? preview.dur} min
                      </div>
                      <div>
                        <strong>Exercises:</strong> {generatedWorkout.exercises?.length ?? 0}
                      </div>
                      <div>
                        <strong>Difficulty:</strong> {generatedWorkout.difficulty ?? preview.intensity}
                      </div>
                      <div>
                        <strong>Type:</strong> {generatedWorkout.type ?? selectedWorkoutType}
                      </div>
                    </div>

                    {Array.isArray(generatedWorkout.exercises) && generatedWorkout.exercises.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-neutral-700 mb-2">First few exercises</p>
                        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {generatedWorkout.exercises.slice(0, 6).map((ex: any, idx: number) => (
                            <li key={idx} className="rounded-xl bg-white p-3 shadow-soft border border-neutral-200">
                              <p className="font-medium text-neutral-900">
                                {ex.name ?? `Exercise ${idx + 1}`}
                              </p>
                              <p className="text-sm text-neutral-600">
                                {ex.sets && ex.reps ? (
                                  <>
                                    {ex.sets} sets × {ex.reps} reps
                                  </>
                                ) : ex.duration ? (
                                  <>~{ex.duration} sec</>
                                ) : (
                                  <>Details provided in workout</>
                                )}
                                {ex.rest ? <span className="text-neutral-500"> • Rest {ex.rest}s</span> : null}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <Button variant="outline" onClick={() => setGeneratedWorkout(null)}>
                      Generate Another
                    </Button>
                    <Button onClick={handleStartWorkout} className="px-6" data-testid="start-workout-btn">
                      Start Workout
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
```

---

## `src/components/workout/WorkoutSelector.tsx`

**Description:** Workout selection interface

```typescript
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PlayIcon, 
  ClockIcon, 
  FireIcon,
  SparklesIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { WorkoutGenerationModal } from './WorkoutGenerationModal';
import { useAuthStore } from '../../store/authStore';
import type { WorkoutPlan } from '../../types';

interface WorkoutSelectorProps {
  currentWorkout: WorkoutPlan | null;
  onStartWorkout: () => void;
}

export const WorkoutSelector: React.FC<WorkoutSelectorProps> = ({
  currentWorkout,
  onStartWorkout
}) => {
  const { profile } = useAuthStore();
  const [showGenerationModal, setShowGenerationModal] = useState(false);

  if (!currentWorkout) {
    return (
      <>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Link to="/app" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Choose Your Workout</h1>
            <p className="text-gray-600 mt-2">Select or generate a workout to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Generate AI Workout */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="card gradient-bg text-white cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => setShowGenerationModal(true)}
            >
              <div className="text-center py-8">
                <SparklesIcon className="w-16 h-16 text-white/80 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Generate AI Workout</h3>
                <p className="text-white/90 mb-6">
                  Create a personalized workout tailored to your goals and preferences
                </p>
                <Button className="bg-white text-primary-600 hover:bg-gray-100">
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Generate Now
                </Button>
              </div>
            </motion.div>

            {/* Quick Workouts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card border-2 border-dashed border-gray-300 hover:border-primary-300 transition-colors duration-200"
            >
              <div className="text-center py-8">
                <FireIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Quick Start</h3>
                <p className="text-gray-600 mb-6">
                  Browse pre-made workouts for immediate training
                </p>
                <Button variant="outline" disabled>
                  Coming Soon
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Recent Workouts */}
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Workouts</h2>
            <div className="card">
              <div className="text-center py-12">
                <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recent workouts</h3>
                <p className="text-gray-600 mb-4">
                  Generate your first AI workout to get started on your fitness journey!
                </p>
                <Button onClick={() => setShowGenerationModal(true)}>
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  Generate Workout
                </Button>
              </div>
            </div>
          </div>
        </div>

        <WorkoutGenerationModal
          isOpen={showGenerationModal}
          onClose={() => setShowGenerationModal(false)}
          userProfile={profile}
        />
      </>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link to="/app" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Ready to Start?</h1>
        <p className="text-gray-600 mt-2">Your personalized workout is ready</p>
      </div>

      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentWorkout.name}</h2>
            <p className="text-gray-600 mb-4">{currentWorkout.description}</p>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                {currentWorkout.estimatedDuration} min
              </div>
              <div className="flex items-center">
                <FireIcon className="w-4 h-4 mr-1" />
                {currentWorkout.difficulty}
              </div>
              <div>
                {currentWorkout.exercises.length} exercises
              </div>
            </div>
          </div>
          
          {currentWorkout.aiGenerated && (
            <div className="flex items-center px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              <SparklesIcon className="w-4 h-4 mr-1" />
              AI Generated
            </div>
          )}
        </div>

        {/* Exercise Preview */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exercises</h3>
          <div className="space-y-3">
            {currentWorkout.exercises.slice(0, 5).map((exercise, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{exercise.exercise.name}</h4>
                  <p className="text-sm text-gray-600">
                    {exercise.sets} sets × {exercise.reps || exercise.duration + 's'}
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {exercise.restTime}s rest
                </div>
              </div>
            ))}
            
            {currentWorkout.exercises.length > 5 && (
              <div className="text-center py-2 text-gray-500 text-sm">
                +{currentWorkout.exercises.length - 5} more exercises
              </div>
            )}
          </div>
        </div>

        {/* Equipment Needed */}
        {currentWorkout.equipment.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Equipment Needed</h3>
            <div className="flex flex-wrap gap-2">
              {currentWorkout.equipment.map((equipment, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {equipment.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={onStartWorkout}
            size="lg"
            className="flex-1 sm:flex-none px-8"
          >
            <PlayIcon className="w-5 h-5 mr-2" />
            Start Workout
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowGenerationModal(true)}
            size="lg"
            className="flex-1 sm:flex-none px-8"
          >
            <SparklesIcon className="w-5 h-5 mr-2" />
            Generate New
          </Button>
        </div>
      </div>

      <WorkoutGenerationModal
        isOpen={showGenerationModal}
        onClose={() => setShowGenerationModal(false)}
        userProfile={profile}
      />
    </div>
  );
};

```

---

## `src/components/workout/ActiveWorkout.tsx`

**Description:** Active workout interface

```typescript
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  PauseIcon,
  CheckIcon,
  ClockIcon,
  FireIcon,
  ArrowRightIcon,
  XMarkIcon,
  TrophyIcon,

  LightBulbIcon,
  SpeakerWaveIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Card, GradientCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Timer } from '../ui/Timer';
import { ExerciseInstructions } from './ExerciseInstructions';
import { PageContainer } from '../ui/Container';
import type { WorkoutSession, CompletedExercise, CompletedSet } from '../../types';

interface ActiveWorkoutProps {
  session: WorkoutSession;
  currentExerciseIndex: number;
  onCompleteExercise: (exerciseData: CompletedExercise) => void;
  onCompleteWorkout: () => void;
  onPause: () => void;
  onResume: () => void;
  isPaused: boolean;
}

export const ActiveWorkout: React.FC<ActiveWorkoutProps> = ({
  session,
  currentExerciseIndex,
  onCompleteExercise,
  onCompleteWorkout,
  onPause,
  onResume,
  isPaused
}) => {
  const [currentSet, setCurrentSet] = useState(0);
  const [completedSets, setCompletedSets] = useState<CompletedSet[]>([]);
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  const [workoutTimeElapsed, setWorkoutTimeElapsed] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showMotivation, setShowMotivation] = useState(false);
  // const [exerciseStartTime, setExerciseStartTime] = useState<Date | null>(null);
  // const [setStartTime, setSetStartTime] = useState<Date | null>(null);
  const [heartRate] = useState<number | null>(null);
  const [rpe] = useState<number | null>(null); // Rate of Perceived Exertion

  const currentExercise = session.workoutPlan.exercises[currentExerciseIndex];
  const totalExercises = session.workoutPlan.exercises.length;
  const progress = ((currentExerciseIndex + (currentSet / currentExercise.sets)) / totalExercises) * 100;
  const isLastExercise = currentExerciseIndex === totalExercises - 1;
  const isLastSet = currentSet === currentExercise.sets - 1;

  // Motivational messages based on progress
  const getMotivationalMessage = () => {
    const messages = [
      "You're crushing it! 💪",
      "Keep that energy up! 🔥",
      "Form over speed - you've got this! 🎯",
      "Every rep counts! 💯",
      "Push through - you're stronger than you think! 🚀",
      "Focus on your breathing! 🧘‍♀️",
      "Mind over muscle! 🧠",
      "You're building something amazing! 🏗️"
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Workout timer
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setWorkoutTimeElapsed(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPaused]);

  // Rest timer
  useEffect(() => {
    if (isResting && restTimeRemaining > 0 && !isPaused) {
      const interval = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isResting, restTimeRemaining, isPaused]);

  const handleCompleteSet = (reps?: number, weight?: number, duration?: number) => {
    const completedSet: CompletedSet = {
      reps,
      weight,
      duration,
      completed: true,
    };

    const updatedSets = [...completedSets, completedSet];
    setCompletedSets(updatedSets);

    if (currentSet + 1 < currentExercise.sets) {
      // More sets to go, start rest period
      setCurrentSet(prev => prev + 1);
      setIsResting(true);
      setRestTimeRemaining(currentExercise.restTime);
    } else {
      // Exercise complete
      const completedExercise: CompletedExercise = {
        exerciseId: currentExercise.exercise.id,
        sets: updatedSets,
        skipped: false,
        completedAt: new Date(),
      };

      onCompleteExercise(completedExercise);
      
      // Reset for next exercise
      setCurrentSet(0);
      setCompletedSets([]);
      setIsResting(false);
      setRestTimeRemaining(0);
    }
  };

  const handleSkipExercise = () => {
    const completedExercise: CompletedExercise = {
      exerciseId: currentExercise.exercise.id,
      sets: completedSets,
      skipped: true,
      completedAt: new Date(),
    };

    onCompleteExercise(completedExercise);
    
    // Reset for next exercise
    setCurrentSet(0);
    setCompletedSets([]);
    setIsResting(false);
    setRestTimeRemaining(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Enhanced Header */}
      <div className="glass border-b border-white/20 backdrop-blur-xl sticky top-0 z-40">
        <PageContainer>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                  <FireIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">{session.workoutPlan.name}</h1>
                  <div className="flex items-center space-x-4 text-sm text-neutral-600">
                    <span>Exercise {currentExerciseIndex + 1} of {totalExercises}</span>
                    <Badge variant="primary" size="sm">
                      Set {currentSet + 1} of {currentExercise.sets}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Enhanced Progress Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm text-neutral-600 mb-2">
                  <span className="font-medium">Workout Progress</span>
                  <span className="font-mono">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full relative"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </motion.div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Workout Timer */}
              <Card padding="sm" className="text-center">
                <div className="text-xs text-neutral-600 mb-1">Workout Time</div>
                <div className="font-mono text-lg font-bold text-neutral-900">
                  {formatTime(workoutTimeElapsed)}
                </div>
              </Card>

              {/* Heart Rate (if available) */}
              {heartRate && (
                <Card padding="sm" className="text-center">
                  <div className="text-xs text-neutral-600 mb-1">Heart Rate</div>
                  <div className="flex items-center justify-center space-x-1">
                    <HeartIcon className="w-4 h-4 text-error-500" />
                    <span className="font-bold text-error-600">{heartRate}</span>
                  </div>
                </Card>
              )}

              {/* Pause/Resume Button */}
              <Button
                variant={isPaused ? "energy" : "secondary"}
                onClick={isPaused ? onResume : onPause}
                size="lg"
                icon={isPaused ? <PlayIcon /> : <PauseIcon />}
                className="min-w-[120px]"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
            </div>
          </div>
        </PageContainer>
      </div>

      <PageContainer>
        <AnimatePresence mode="wait">
          {isResting ? (
            /* Enhanced Rest Period */
            <motion.div
              key="rest"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <GradientCard className="text-center text-white" padding="xl">
                <div className="py-8">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <ClockIcon className="w-10 h-10 text-white" />
                  </motion.div>

                  <h2 className="text-3xl font-bold mb-3">Rest & Recover</h2>
                  <p className="text-white/90 mb-8 text-lg">
                    {isLastSet ? "Great set! Prepare for the next exercise" : "Excellent work! Get ready for your next set"}
                  </p>

                  <div className="mb-8">
                    <Timer
                      initialTime={restTimeRemaining}
                      isActive={!isPaused}
                      onComplete={() => setIsResting(false)}
                      size="large"
                    />
                  </div>

                  {/* Motivational tip during rest */}
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20 mb-6">
                    <div className="flex items-center space-x-3">
                      <LightBulbIcon className="w-5 h-5 text-white" />
                      <p className="text-white/90 text-sm">
                        Use this time to focus on your breathing and visualize your next set
                      </p>
                    </div>
                  </Card>

                  <div className="flex justify-center space-x-4">
                    <Button
                      onClick={() => setIsResting(false)}
                      variant="secondary"
                      size="lg"
                      className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                    >
                      Skip Rest
                    </Button>
                  </div>
                </div>
              </GradientCard>
            </motion.div>
        ) : (
            /* Enhanced Active Exercise */
            <motion.div
              key="exercise"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Exercise Header Card */}
              <Card hover className="relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-500/10 to-primary-600/10 rounded-full -translate-y-16 translate-x-16" />

                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center">
                        <TrophyIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">
                          {currentExercise.exercise.name}
                        </h2>
                        <p className="text-neutral-600">{currentExercise.exercise.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Badge variant="primary" size="lg">
                        Set {currentSet + 1} of {currentExercise.sets}
                      </Badge>
                      <Badge variant="secondary">
                        <FireIcon className="w-4 h-4 mr-1" />
                        {currentExercise.exercise.difficulty}
                      </Badge>
                      <Badge variant="accent">
                        {currentExercise.exercise.targetMuscles.join(', ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowInstructions(true)}
                      size="lg"
                      icon={<LightBulbIcon />}
                    >
                      Instructions
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowMotivation(!showMotivation)}
                      size="lg"
                      icon={<SpeakerWaveIcon />}
                    >
                      Tips
                    </Button>
                  </div>
                </div>

                {/* Motivational message */}
                <AnimatePresence>
                  {showMotivation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 p-4 bg-accent-50 rounded-xl border border-accent-200"
                    >
                      <p className="text-accent-800 font-medium text-center">
                        💪 {getMotivationalMessage()}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Enhanced Set Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary-600 mb-2">
                      {currentExercise.reps || `${currentExercise.duration}s`}
                    </div>
                    <div className="text-sm font-medium text-primary-700 mb-3">
                      {currentExercise.reps ? 'Target Reps' : 'Duration'}
                    </div>
                    {currentExercise.exercise.formCues && (
                      <div className="text-xs text-primary-600">
                        💡 {currentExercise.exercise.formCues[0]}
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-accent-50 to-accent-100 border-accent-200">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-accent-600 mb-2">
                      {currentExercise.restTime}s
                    </div>
                    <div className="text-sm font-medium text-accent-700 mb-3">Rest Time</div>
                    <div className="text-xs text-accent-600">
                      ⏱️ Recovery between sets
                    </div>
                  </div>
                </Card>
              </div>

              {/* Progress Visualization */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Set Progress</h3>
                  <Badge variant="success" size="sm">
                    {completedSets.length} / {currentExercise.sets} completed
                  </Badge>
                </div>

                <div className="grid grid-cols-5 gap-2 mb-4">
                  {Array.from({ length: currentExercise.sets }).map((_, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{
                        scale: index < completedSets.length ? 1.1 : index === currentSet ? 1.05 : 1,
                        opacity: index < completedSets.length ? 1 : index === currentSet ? 0.8 : 0.5
                      }}
                      className={`h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                        index < completedSets.length
                          ? 'bg-success-500 text-white'
                          : index === currentSet
                          ? 'bg-primary-500 text-white'
                          : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      {index < completedSets.length ? (
                        <CheckIcon className="w-5 h-5" />
                      ) : (
                        index + 1
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Completed Sets Details */}
                {completedSets.length > 0 && (
                  <div className="space-y-2">
                    {completedSets.map((set, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 bg-success-50 rounded-xl border border-success-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-success-500 rounded-full flex items-center justify-center">
                            <CheckIcon className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium text-success-800">
                            Set {index + 1}: {set.reps || `${set.duration}s`}
                          </span>
                        </div>
                        {rpe && (
                          <Badge variant="success" size="sm">
                            RPE: {rpe}/10
                          </Badge>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Enhanced Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={() => handleCompleteSet(currentExercise.reps, undefined, currentExercise.duration)}
                  size="xl"
                  className="h-16"
                  icon={<CheckIcon />}
                >
                  <div className="text-center">
                    <div className="font-bold">Complete Set</div>
                    <div className="text-sm opacity-90">
                      {isLastSet ? 'Finish Exercise' : `${currentExercise.sets - currentSet - 1} sets left`}
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  onClick={handleSkipExercise}
                  size="xl"
                  className="h-16"
                  icon={<XMarkIcon />}
                >
                  <div className="text-center">
                    <div className="font-bold">Skip Exercise</div>
                    <div className="text-sm opacity-90">Move to next</div>
                  </div>
                </Button>
              </div>

              {/* Next Exercise Preview */}
              {currentExerciseIndex < totalExercises - 1 && (
                <Card className="bg-neutral-50 border-neutral-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-neutral-200 rounded-xl flex items-center justify-center">
                        <ArrowRightIcon className="w-5 h-5 text-neutral-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-neutral-700 mb-1">Up Next</h3>
                        <p className="text-neutral-900 font-semibold">
                          {session.workoutPlan.exercises[currentExerciseIndex + 1].exercise.name}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" size="sm">
                      {session.workoutPlan.exercises[currentExerciseIndex + 1].sets} sets
                    </Badge>
                  </div>
                </Card>
              )}

              {/* Finish Workout Celebration */}
              {isLastExercise && isLastSet && (
                <GradientCard className="text-center text-white" padding="xl">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <TrophyIcon className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-3">
                      Final Set! 🎉
                    </h3>
                    <p className="text-white/90 mb-6 text-lg">
                      You're about to complete this amazing workout!
                    </p>
                    <Button
                      onClick={onCompleteWorkout}
                      variant="secondary"
                      size="xl"
                      className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                      icon={<TrophyIcon />}
                    >
                      Complete Workout! 🏆
                    </Button>
                  </motion.div>
                </GradientCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </PageContainer>

      {/* Exercise Instructions Modal */}
      <ExerciseInstructions
        exercise={currentExercise.exercise}
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
    </div>
  );
};

```

---

## `src/components/workout/WorkoutComplete.tsx`

**Description:** Workout completion screen

```typescript
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrophyIcon, 
  ClockIcon, 
  FireIcon,
  StarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Button } from '../ui/Button';
import type { WorkoutSession } from '../../types';

interface WorkoutCompleteProps {
  session: WorkoutSession;
  onRating: (rating: number, feedback?: string) => void;
  onFinish: () => void;
}

export const WorkoutComplete: React.FC<WorkoutCompleteProps> = ({
  session,
  onRating,
  onFinish
}) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [hasRated, setHasRated] = useState(false);

  const workoutDuration = session.endTime && session.startTime 
    ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60))
    : 0;

  const completedExercises = session.completedExercises.filter(ex => !ex.skipped).length;
  const totalExercises = session.workoutPlan.exercises.length;
  const completionRate = Math.round((completedExercises / totalExercises) * 100);

  const handleRatingSubmit = () => {
    if (rating > 0) {
      onRating(rating, feedback.trim() || undefined);
      setHasRated(true);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full mx-4"
      >
        <div className="card text-center">
          {/* Success Animation */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <TrophyIcon className="w-12 h-12 text-green-600" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-gray-900 mb-2"
          >
            Workout Complete! 🎉
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600 mb-8"
          >
            Great job completing "{session.workoutPlan.name}"
          </motion.p>

          {/* Workout Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-3 gap-6 mb-8"
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <ClockIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatTime(workoutDuration)}</div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{completedExercises}/{totalExercises}</div>
              <div className="text-sm text-gray-600">Exercises</div>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <FireIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{completionRate}%</div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </motion.div>

          {/* Completion Rate Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mb-8"
          >
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Completion Rate</span>
              <span>{completionRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <motion.div
                className="bg-green-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionRate}%` }}
                transition={{ delay: 0.7, duration: 1 }}
              />
            </div>
          </motion.div>

          {/* Rating Section */}
          {!hasRated ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mb-8"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                How was your workout?
              </h3>
              
              {/* Star Rating */}
              <div className="flex justify-center space-x-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-colors duration-200"
                  >
                    {star <= rating ? (
                      <StarIconSolid className="w-8 h-8 text-yellow-400" />
                    ) : (
                      <StarIcon className="w-8 h-8 text-gray-300 hover:text-yellow-400" />
                    )}
                  </button>
                ))}
              </div>

              {/* Feedback */}
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Any feedback about this workout? (optional)"
                className="input-field resize-none mb-4"
                rows={3}
              />

              <Button
                onClick={handleRatingSubmit}
                disabled={rating === 0}
                className="mb-4"
              >
                Submit Rating
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 bg-green-50 rounded-lg"
            >
              <div className="flex items-center justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <StarIconSolid
                    key={i}
                    className={`w-5 h-5 ${
                      i < rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-green-700 text-sm">Thanks for your feedback!</p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-4"
          >
            <Button
              onClick={onFinish}
              size="lg"
              className="w-full"
            >
              Back to Dashboard
            </Button>
            
            <div className="text-sm text-gray-500">
              Your workout has been saved to your history
            </div>
          </motion.div>
        </div>

        {/* Motivational Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="text-center mt-6"
        >
          <p className="text-gray-600 italic">
            "The only bad workout is the one that didn't happen. Great job today!"
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

```

---

## `package.json`

**Description:** Frontend package configuration and scripts

```typescript
{
  "name": "ai-neurafit",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "start": "concurrently \"npm run dev\" \"firebase emulators:start\" --names \"frontend,backend\" --prefix-colors \"cyan,yellow\"",
    "dev:full": "./start-dev.sh",
    "dev:backend": "cd functions && npm start",
    "emulators": "firebase emulators:start",
    "functions:dev": "cd functions && npm run serve",
    "deploy": "npm run build && firebase deploy"
  },
  "dependencies": {
    "@headlessui/react": "^2.2.7",
    "@heroicons/react": "^2.2.0",
    "@tanstack/react-query": "^5.85.5",
    "autoprefixer": "^10.4.21",
    "firebase": "^12.1.0",
    "firebase-functions": "^6.4.0",
    "framer-motion": "^12.23.12",
    "postcss": "^8.5.6",
    "react": "^19.1.1",
    "react-dom": "^19.1.1",
    "react-router-dom": "^7.8.1",
    "zod": "^4.0.17",
    "zustand": "^5.0.8"
  },
  "devDependencies": {
    "@eslint/js": "^9.33.0",
    "@tailwindcss/forms": "^0.5.10",
    "@tailwindcss/typography": "^0.5.16",
    "@types/react": "^19.1.10",
    "@types/react-dom": "^19.1.7",
    "@vitejs/plugin-react": "^5.0.0",
    "eslint": "^9.33.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^16.3.0",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.8.3",
    "typescript-eslint": "^8.39.1",
    "vite": "^7.1.2"
  }
}

```

---

## `vite.config.ts`

**Description:** Vite build tool configuration

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  build: {
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'router-vendor': ['react-router-dom'],
          'ui-vendor': ['framer-motion', '@headlessui/react', '@heroicons/react'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/functions'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
    // Enable source maps for production debugging
    sourcemap: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Enable minification (use esbuild to avoid terser dependency)
    minify: 'esbuild',
  },
  server: {
    hmr: {
      port: 5173,
      overlay: false, // Disable error overlay for better UX
    },
  },
  // Enable dependency pre-bundling optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      '@headlessui/react',
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid',
      '@tanstack/react-query',
    ],
  },
})

```

---

## `tailwind.config.js`

**Description:** Tailwind CSS configuration

```typescript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    // Modern gradient utilities
    "bg-gradient-hero",
    "bg-gradient-primary",
    "bg-gradient-energy",
    "bg-gradient-success",
    "text-gradient-primary",
    "text-gradient-energy",
    "shadow-glow-primary",
    "shadow-glow-energy",
    "shadow-modern",
    "shadow-elevated",
  ],
  theme: {
    extend: {
      colors: {
        // Modern, refined brand palette inspired by Apple Fitness+ and Nike Training Club
        primary: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        // Energy/Action color - Nike-inspired vibrant orange
        energy: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316", // Main energy color
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407",
        },
        // Success/Achievement - Apple-inspired green
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e", // Main success color
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        // Warning - Refined amber
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        // Error - Clean red
        error: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a",
        },
        // Modern neutral palette - Apple-inspired grays
        neutral: {
          0: "#ffffff",
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
          1000: "#000000",
        },

        // Semantic design tokens for consistent theming
        background: {
          DEFAULT: "#ffffff",
          secondary: "#f8fafc",
          tertiary: "#f1f5f9",
          inverse: "#0f172a",
        },
        foreground: {
          DEFAULT: "#0f172a",
          secondary: "#334155",
          tertiary: "#64748b",
          inverse: "#ffffff",
        },
        border: {
          DEFAULT: "#e2e8f0",
          secondary: "#cbd5e1",
          tertiary: "#94a3b8",
          inverse: "#334155",
        },


        // Simplified fitness semantic colors - using main palette for consistency
        fitness: {
          // Cardio = Energy (orange)
          cardio: {
            50: "#fff7ed",
            100: "#ffedd5",
            500: "#f97316", // Maps to energy.500
            600: "#ea580c",
            700: "#c2410c",
          },
          // Strength = Primary (slate)
          strength: {
            50: "#f8fafc",
            100: "#f1f5f9",
            500: "#64748b", // Maps to primary.500
            600: "#475569",
            700: "#334155",
          },
          // Recovery = Success (green)
          recovery: {
            50: "#f0fdf4",
            100: "#dcfce7",
            500: "#22c55e", // Maps to success.500
            600: "#16a34a",
            700: "#15803d",
          },
        },
      },

      // Modern typography stack - Apple/Nike inspired
      fontFamily: {
        sans: [
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "sans-serif"
        ],
        display: [
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "system-ui",
          "sans-serif"
        ],
        body: [
          "SF Pro Text",
          "-apple-system",
          "BlinkMacSystemFont",
          "Inter",
          "system-ui",
          "sans-serif"
        ],
        mono: [
          "SF Mono",
          "Monaco",
          "JetBrains Mono",
          "Menlo",
          "Consolas",
          "monospace"
        ],
      },

      // Modern, refined gradients inspired by Apple and Nike
      backgroundImage: {
        // Primary brand gradients - subtle and sophisticated
        "gradient-primary": "linear-gradient(135deg, #64748b 0%, #475569 100%)",
        "gradient-primary-soft": "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",

        // Energy gradient - Nike-inspired vibrant
        "gradient-energy": "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
        "gradient-energy-soft": "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",

        // Success gradient - Apple-inspired green
        "gradient-success": "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
        "gradient-success-soft": "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",

        // Hero gradient - modern and engaging
        "gradient-hero": "linear-gradient(135deg, #f97316 0%, #22c55e 50%, #64748b 100%)",

        // Subtle background gradients
        "gradient-background": "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)",
        "gradient-background-dark": "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",

        // Modern glass effect - more subtle
        "gradient-glass": "linear-gradient(145deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
        "gradient-glass-dark": "linear-gradient(145deg, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.4) 100%)",

        // Simplified fitness gradients
        "gradient-cardio": "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
        "gradient-strength": "linear-gradient(135deg, #64748b 0%, #475569 100%)",
        "gradient-recovery": "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",

        // Utility gradients
        "gradient-shimmer": "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)",
      },

      // Modern typography scale - Apple/Nike inspired with better readability
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.025em" }],
        sm: ["0.875rem", { lineHeight: "1.25rem", letterSpacing: "0.01em" }],
        base: ["1rem", { lineHeight: "1.5rem", letterSpacing: "0" }],
        lg: ["1.125rem", { lineHeight: "1.75rem", letterSpacing: "-0.01em" }],
        xl: ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.015em" }],
        "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.02em" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.025em" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.03em" }],
        "5xl": ["3rem", { lineHeight: "1.1", letterSpacing: "-0.035em" }],
        "6xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.04em" }],
        "7xl": ["4.5rem", { lineHeight: "1.05", letterSpacing: "-0.045em" }],
        "8xl": ["6rem", { lineHeight: "1.05", letterSpacing: "-0.05em" }],
        "9xl": ["8rem", { lineHeight: "1", letterSpacing: "-0.055em" }],

        // Fluid typography for responsive design
        "fluid-xs": ["clamp(0.75rem, 0.7rem + 0.2vw, 0.8rem)", { lineHeight: "1.2" }],
        "fluid-sm": ["clamp(0.875rem, 0.8rem + 0.3vw, 0.95rem)", { lineHeight: "1.3" }],
        "fluid-base": ["clamp(1rem, 0.9rem + 0.4vw, 1.125rem)", { lineHeight: "1.5" }],
        "fluid-lg": ["clamp(1.125rem, 1rem + 0.5vw, 1.25rem)", { lineHeight: "1.6" }],
        "fluid-xl": ["clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem)", { lineHeight: "1.4" }],
        "fluid-2xl": ["clamp(1.5rem, 1.3rem + 0.8vw, 1.875rem)", { lineHeight: "1.3" }],
        "fluid-3xl": ["clamp(1.875rem, 1.6rem + 1.2vw, 2.25rem)", { lineHeight: "1.2" }],
        "fluid-4xl": ["clamp(2.25rem, 1.9rem + 1.5vw, 3rem)", { lineHeight: "1.1" }],
        "fluid-5xl": ["clamp(3rem, 2.5rem + 2vw, 3.75rem)", { lineHeight: "1.05" }],
        "fluid-6xl": ["clamp(3.75rem, 3rem + 3vw, 4.5rem)", { lineHeight: "1" }],

        // Display sizes for hero sections
        "display-sm": ["2.5rem", { lineHeight: "1.2", letterSpacing: "-0.03em", fontWeight: "700" }],
        "display-md": ["3.5rem", { lineHeight: "1.15", letterSpacing: "-0.035em", fontWeight: "700" }],
        "display-lg": ["4.5rem", { lineHeight: "1.1", letterSpacing: "-0.04em", fontWeight: "800" }],
        "display-xl": ["6rem", { lineHeight: "1.05", letterSpacing: "-0.045em", fontWeight: "800" }],
        "display-2xl": ["8rem", { lineHeight: "1", letterSpacing: "-0.05em", fontWeight: "900" }],
      },

      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem",
        30: "7.5rem",
        34: "8.5rem",
        38: "9.5rem",
        42: "10.5rem",
        46: "11.5rem",
        50: "12.5rem",
        54: "13.5rem",
        58: "14.5rem",
        62: "15.5rem",
        66: "16.5rem",
        70: "17.5rem",
        74: "18.5rem",
        78: "19.5rem",
        82: "20.5rem",
        86: "21.5rem",
        90: "22.5rem",
        94: "23.5rem",
        98: "24.5rem",
        102: "25.5rem",
        106: "26.5rem",
        110: "27.5rem",
        114: "28.5rem",
        118: "29.5rem",
        122: "30.5rem",
        126: "31.5rem",
        130: "32.5rem",

        // Safe area
        "safe-top": "env(safe-area-inset-top)",
        "safe-bottom": "env(safe-area-inset-bottom)",
        "safe-left": "env(safe-area-inset-left)",
        "safe-right": "env(safe-area-inset-right)",

        // Semantic spacing
        "section-sm": "3rem",
        "section-md": "4rem",
        "section-lg": "6rem",
        "section-xl": "8rem",
        "section-2xl": "12rem",

        // Component spacing
        "component-xs": "0.5rem",
        "component-sm": "1rem",
        "component-md": "1.5rem",
        "component-lg": "2rem",
        "component-xl": "3rem",

        // Layout spacing
        "layout-xs": "1rem",
        "layout-sm": "1.5rem",
        "layout-md": "2rem",
        "layout-lg": "3rem",
        "layout-xl": "4rem",
        "layout-2xl": "6rem",

        // Fluid spacing
        "fluid-xs": "clamp(0.5rem, 1vw, 1rem)",
        "fluid-sm": "clamp(1rem, 2vw, 1.5rem)",
        "fluid-md": "clamp(1.5rem, 3vw, 2rem)",
        "fluid-lg": "clamp(2rem, 4vw, 3rem)",
        "fluid-xl": "clamp(3rem, 5vw, 4rem)",
        "fluid-2xl": "clamp(4rem, 6vw, 6rem)",
        "fluid-3xl": "clamp(6rem, 8vw, 8rem)",
      },

      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
        "6xl": "3rem",
        "7xl": "3.5rem",
        "8xl": "4rem",
      },

      // Grid templates used by layout helpers
      gridTemplateColumns: {
        "auto-fit-xs": "repeat(auto-fit, minmax(16rem, 1fr))",
        "auto-fit-sm": "repeat(auto-fit, minmax(20rem, 1fr))",
        "auto-fit-md": "repeat(auto-fit, minmax(24rem, 1fr))",
        "auto-fit-lg": "repeat(auto-fit, minmax(28rem, 1fr))",
        "auto-fit-xl": "repeat(auto-fit, minmax(32rem, 1fr))",
        "auto-fill-xs": "repeat(auto-fill, minmax(16rem, 1fr))",
        "auto-fill-sm": "repeat(auto-fill, minmax(20rem, 1fr))",
        "auto-fill-md": "repeat(auto-fill, minmax(24rem, 1fr))",
        "auto-fill-lg": "repeat(auto-fill, minmax(28rem, 1fr))",
        "auto-fill-xl": "repeat(auto-fill, minmax(32rem, 1fr))",
        sidebar: "250px 1fr",
        "sidebar-reverse": "1fr 250px",
        "main-sidebar": "1fr 300px",
        "sidebar-main": "300px 1fr",
        "holy-grail": "200px 1fr 200px",
      },
      gridTemplateRows: {
        "header-main-footer": "auto 1fr auto",
        "main-footer": "1fr auto",
        "header-main": "auto 1fr",
      },

      // Modern shadow system - Apple/Nike inspired with subtle depth
      boxShadow: {
        // Basic shadows - more subtle and refined
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        sm: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.15)",

        // Modern elevated shadows
        elevated: "0 4px 16px 0 rgba(0, 0, 0, 0.08), 0 2px 8px 0 rgba(0, 0, 0, 0.04)",
        "elevated-lg": "0 8px 32px 0 rgba(0, 0, 0, 0.12), 0 4px 16px 0 rgba(0, 0, 0, 0.06)",

        // Subtle glow effects
        "glow-primary": "0 0 20px rgba(100, 116, 139, 0.15)",
        "glow-energy": "0 0 20px rgba(249, 115, 22, 0.2)",
        "glow-success": "0 0 20px rgba(34, 197, 94, 0.15)",

        // Modern glass effect
        glass: "0 8px 32px 0 rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)",

        // Fitness-specific shadows (simplified)
        cardio: "0 4px 16px 0 rgba(249, 115, 22, 0.15)",
        strength: "0 4px 16px 0 rgba(100, 116, 139, 0.15)",
        recovery: "0 4px 16px 0 rgba(34, 197, 94, 0.15)",
      },

      // Animations & keyframes (kept in config to allow class-based usage)
      animation: {
        "fade-in": "fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-out": "fadeOut 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-down": "slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-left": "slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-right": "slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-out": "scaleOut 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        "bounce-subtle": "bounceSubtle 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        wiggle: "wiggle 0.5s ease-in-out",
        shake: "shake 0.5s ease-in-out",
        "rubber-band": "rubberBand 0.8s ease-in-out",
        jello: "jello 0.9s ease-in-out",
        heartbeat: "heartbeat 1.5s ease-in-out infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-fast": "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        "spin-fast": "spin 0.5s linear infinite",
        "ping-slow": "ping 3s cubic-bezier(0, 0, 0.2, 1) infinite",
        "ping-fast": "ping 0.8s cubic-bezier(0, 0, 0.2, 1) infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "float-fast": "float 4s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        "shimmer-slow": "shimmer 3s linear infinite",
        shine: "shine 1.5s ease-in-out infinite",
        gradient: "gradient 15s ease infinite",
        "gradient-fast": "gradient 8s ease infinite",
        "gradient-slow": "gradient 25s ease infinite",
        "gradient-x": "gradientX 15s ease infinite",
        "gradient-y": "gradientY 15s ease infinite",
        "gradient-xy": "gradientXY 20s ease infinite",
        "type-writer": "typeWriter 3s steps(40, end)",
        "text-focus": "textFocus 0.8s cubic-bezier(0.55, 0.085, 0.68, 0.53) both",
        "text-blur": "textBlur 0.6s cubic-bezier(0.55, 0.085, 0.68, 0.53) both",
        "zoom-in": "zoomIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "zoom-out": "zoomOut 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "flip-in-x": "flipInX 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "flip-in-y": "flipInY 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        "rotate-in": "rotateIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
        flash: "flash 2s infinite",
        "pulse-ring": "pulseRing 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        "focus-ring": "focusRing 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "tap-feedback": "tapFeedback 0.1s ease-out",
        "swipe-left": "swipeLeft 0.3s ease-out",
        "swipe-right": "swipeRight 0.3s ease-out",
        "workout-pulse": "workoutPulse 2s ease-in-out infinite",
        "intensity-build": "intensityBuild 3s ease-in-out infinite",
        "rep-count": "repCount 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "achievement-pop": "achievementPop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "progress-fill": "progressFill 1s ease-out",
        "energy-wave": "energyWave 4s ease-in-out infinite",
        "motivation-bounce": "motivationBounce 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "workout-complete": "workoutComplete 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "rest-breathe": "restBreathe 4s ease-in-out infinite",
        "timer-tick": "timerTick 1s linear infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        fadeOut: { "0%": { opacity: "1" }, "100%": { opacity: "0" } },
        slideUp: { "0%": { transform: "translateY(20px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        slideDown: { "0%": { transform: "translateY(-20px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        slideLeft: { "0%": { transform: "translateX(20px)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
        slideRight: { "0%": { transform: "translateX(-20px)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
        scaleIn: { "0%": { transform: "scale(0.9)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        scaleOut: { "0%": { transform: "scale(1)", opacity: "1" }, "100%": { transform: "scale(0.9)", opacity: "0" } },
        bounceSubtle: {
          "0%, 20%, 53%, 80%, 100%": { transform: "translate3d(0,0,0)" },
          "40%, 43%": { transform: "translate3d(0,-8px,0)" },
          "70%": { transform: "translate3d(0,-4px,0)" },
          "90%": { transform: "translate3d(0,-2px,0)" },
        },
        wiggle: {
          "0%, 7%": { transform: "rotateZ(0)" },
          "15%": { transform: "rotateZ(-15deg)" },
          "20%": { transform: "rotateZ(10deg)" },
          "25%": { transform: "rotateZ(-10deg)" },
          "30%": { transform: "rotateZ(6deg)" },
          "35%": { transform: "rotateZ(-4deg)" },
          "40%, 100%": { transform: "rotateZ(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "10%,30%,50%,70%,90%": { transform: "translateX(-4px)" },
          "20%,40%,60%,80%": { transform: "translateX(4px)" },
        },
        rubberBand: {
          "0%": { transform: "scale3d(1, 1, 1)" },
          "30%": { transform: "scale3d(1.25, 0.75, 1)" },
          "40%": { transform: "scale3d(0.75, 1.25, 1)" },
          "50%": { transform: "scale3d(1.15, 0.85, 1)" },
          "65%": { transform: "scale3d(0.95, 1.05, 1)" },
          "75%": { transform: "scale3d(1.05, 0.95, 1)" },
          "100%": { transform: "scale3d(1, 1, 1)" },
        },
        jello: {
          "0%, 11.1%, 100%": { transform: "translate3d(0, 0, 0)" },
          "22.2%": { transform: "skewX(-12.5deg) skewY(-12.5deg)" },
          "33.3%": { transform: "skewX(6.25deg) skewY(6.25deg)" },
          "44.4%": { transform: "skewX(-3.125deg) skewY(-3.125deg)" },
          "55.5%": { transform: "skewX(1.5625deg) skewY(1.5625deg)" },
          "66.6%": { transform: "skewX(-0.78125deg) skewY(-0.78125deg)" },
          "77.7%": { transform: "skewX(0.390625deg) skewY(0.390625deg)" },
          "88.8%": { transform: "skewX(-0.1953125deg) skewY(-0.1953125deg)" },
        },
        heartbeat: { "0%": { transform: "scale(1)" }, "14%": { transform: "scale(1.1)" }, "28%": { transform: "scale(1)" }, "42%": { transform: "scale(1.1)" }, "70%": { transform: "scale(1)" } },
        float: { "0%,100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-10px)" } },
        hoverUp: { "0%": { transform: "translateY(0)" }, "100%": { transform: "translateY(-4px)" } },
        hoverDown: { "0%": { transform: "translateY(-4px)" }, "100%": { transform: "translateY(0)" } },
        glow: { "0%": { boxShadow: "0 0 5px currentColor" }, "100%": { boxShadow: "0 0 20px currentColor, 0 0 30px currentColor" } },
        glowPulse: { "0%,100%": { boxShadow: "0 0 5px currentColor" }, "50%": { boxShadow: "0 0 20px currentColor, 0 0 30px currentColor" } },
        shimmer: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(100%)" } },
        shine: { "0%": { backgroundPosition: "-200% center" }, "100%": { backgroundPosition: "200% center" } },
        gradient: { "0%,100%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" } },
        gradientX: { "0%,100%": { backgroundPosition: "0% 0%" }, "50%": { backgroundPosition: "100% 0%" } },
        gradientY: { "0%,100%": { backgroundPosition: "0% 0%" }, "50%": { backgroundPosition: "0% 100%" } },
        gradientXY: {
          "0%,100%": { backgroundPosition: "0% 0%" },
          "25%": { backgroundPosition: "100% 0%" },
          "50%": { backgroundPosition: "100% 100%" },
          "75%": { backgroundPosition: "0% 100%" },
        },
        typeWriter: { "0%": { width: "0" }, "100%": { width: "100%" } },
        textFocus: { "0%": { filter: "blur(12px)", opacity: "0" }, "100%": { filter: "blur(0px)", opacity: "1" } },
        textBlur: { "0%": { filter: "blur(0px)", opacity: "1" }, "100%": { filter: "blur(12px)", opacity: "0" } },
        zoomIn: { "0%": { transform: "scale(0.3)", opacity: "0" }, "50%": { opacity: "1" }, "100%": { transform: "scale(1)", opacity: "1" } },
        zoomOut: { "0%": { transform: "scale(1)", opacity: "1" }, "50%": { opacity: "1" }, "100%": { transform: "scale(0.3)", opacity: "0" } },
        flipInX: {
          "0%": { transform: "perspective(400px) rotateX(90deg)", opacity: "0" },
          "40%": { transform: "perspective(400px) rotateX(-20deg)" },
          "60%": { transform: "perspective(400px) rotateX(10deg)", opacity: "1" },
          "80%": { transform: "perspective(400px) rotateX(-5deg)" },
          "100%": { transform: "perspective(400px) rotateX(0deg)", opacity: "1" },
        },
        flipInY: {
          "0%": { transform: "perspective(400px) rotateY(90deg)", opacity: "0" },
          "40%": { transform: "perspective(400px) rotateY(-20deg)" },
          "60%": { transform: "perspective(400px) rotateY(10deg)", opacity: "1" },
          "80%": { transform: "perspective(400px) rotateY(-5deg)" },
          "100%": { transform: "perspective(400px) rotateY(0deg)", opacity: "1" },
        },
        rotateIn: { "0%": { transform: "rotate(-200deg)", opacity: "0" }, "100%": { transform: "rotate(0)", opacity: "1" } },
        flash: { "0%,50%,100%": { opacity: "1" }, "25%,75%": { opacity: "0" } },
        pulseRing: { "0%": { transform: "scale(0.33)", opacity: "1" }, "80%,100%": { transform: "scale(2.33)", opacity: "0" } },
        focusRing: { "0%": { transform: "scale(0.8)", opacity: "0" }, "50%": { transform: "scale(1.1)", opacity: "0.3" }, "100%": { transform: "scale(1)", opacity: "0" } },
        tapFeedback: { "0%": { transform: "scale(1)" }, "50%": { transform: "scale(0.95)" }, "100%": { transform: "scale(1)" } },
        swipeLeft: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-100%)" } },
        swipeRight: { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(100%)" } },
        workoutPulse: {
          "0%,100%": { transform: "scale(1)", boxShadow: "0 0 0 0 rgba(99,102,241,0.7)" },
          "50%": { transform: "scale(1.05)", boxShadow: "0 0 0 10px rgba(99,102,241,0)" },
        },
        intensityBuild: {
          "0%": { transform: "scale(1)", filter: "brightness(1) saturate(1)" },
          "50%": { transform: "scale(1.02)", filter: "brightness(1.1) saturate(1.2)" },
          "100%": { transform: "scale(1)", filter: "brightness(1) saturate(1)" },
        },
        repCount: {
          "0%": { transform: "scale(1) rotate(0deg)" },
          "25%": { transform: "scale(1.2) rotate(-5deg)" },
          "50%": { transform: "scale(1.3) rotate(0deg)" },
          "75%": { transform: "scale(1.2) rotate(5deg)" },
          "100%": { transform: "scale(1) rotate(0deg)" },
        },
        achievementPop: {
          "0%": { transform: "scale(0) rotate(-180deg)", opacity: "0", filter: "blur(4px)" },
          "50%": { transform: "scale(1.2) rotate(-90deg)", opacity: "1", filter: "blur(0px)" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1", filter: "blur(0px)" },
        },
        progressFill: { "0%": { width: "0%", opacity: "0.5" }, "100%": { width: "var(--progress-width)", opacity: "1" } },
        energyWave: {
          "0%,100%": { backgroundPosition: "0% 50%", filter: "hue-rotate(0deg)" },
          "25%": { backgroundPosition: "25% 25%", filter: "hue-rotate(90deg)" },
          "50%": { backgroundPosition: "100% 50%", filter: "hue-rotate(180deg)" },
          "75%": { backgroundPosition: "75% 75%", filter: "hue-rotate(270deg)" },
        },
        motivationBounce: {
          "0%": { transform: "translateY(0) scale(1)" },
          "30%": { transform: "translateY(-20px) scale(1.1)" },
          "50%": { transform: "translateY(-30px) scale(1.15)" },
          "70%": { transform: "translateY(-20px) scale(1.1)" },
          "100%": { transform: "translateY(0) scale(1)" },
        },
        workoutComplete: {
          "0%": { transform: "scale(0.8) rotate(-10deg)", opacity: "0", filter: "blur(4px)" },
          "50%": { transform: "scale(1.1) rotate(5deg)", opacity: "1", filter: "blur(0px)" },
          "100%": { transform: "scale(1) rotate(0deg)", opacity: "1", filter: "blur(0px)" },
        },
        restBreathe: { "0%,100%": { transform: "scale(1)", opacity: "0.8" }, "50%": { transform: "scale(1.05)", opacity: "1" } },
        timerTick: { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
      },

      backdropBlur: { xs: "2px" },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
```

---

## `tsconfig.json`

**Description:** TypeScript configuration

```typescript
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}

```

---

## `index.html`

**Description:** HTML entry point

```typescript
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/neurafit-icon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>NeuraFit - AI Fitness Trainer</title>
    <meta name="description" content="Your AI-powered personal fitness trainer. Get personalized workouts that adapt to your progress." />
    <meta name="theme-color" content="#0ea5e9" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="NeuraFit - AI Fitness Trainer" />
    <meta property="og:description" content="Your AI-powered personal fitness trainer. Get personalized workouts that adapt to your progress." />
    <meta property="og:image" content="/og-image.png" />
    <meta property="og:url" content="https://ai-neurafit.web.app" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="NeuraFit - AI Fitness Trainer" />
    <meta name="twitter:description" content="Your AI-powered personal fitness trainer. Get personalized workouts that adapt to your progress." />
    <meta name="twitter:image" content="/og-image.png" />

    <!-- Preconnect to external domains -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>


  </body>
</html>

```

---

