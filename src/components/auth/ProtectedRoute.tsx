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