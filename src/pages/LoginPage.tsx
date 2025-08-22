import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AuthService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

type LoginForm = { email: string; password: string };
type LoadingState = 'email' | 'google' | null;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function mapAuthError(err: any): string {
  const code = err?.code || err?.error?.code || '';
  switch (code) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in window was closed.';
    default:
      return err?.message || 'Unable to sign in. Please try again.';
  }
}

// Gentle “did you mean” for common domain typos
const domainFix: Record<string, string> = {
  gamil: 'gmail',
  gmal: 'gmail',
  hotmial: 'hotmail',
  outlok: 'outlook',
  yaho: 'yahoo',
};
function suggestEmail(email: string): string | null {
  const at = email.indexOf('@');
  if (at < 0) return null;
  const [local, domain] = [email.slice(0, at), email.slice(at + 1)];
  const [name, tld = ''] = domain.split('.');
  if (!name || !tld) return null;
  const fixed = domainFix[name.toLowerCase()];
  return fixed && fixed !== name ? `${local}@${fixed}.${tld}` : null;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reduceMotion = useReducedMotion();
  const { setError, clearError, isOnboarded } = useAuthStore();

  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [capsLock, setCapsLock] = useState(false);
  const [loading, setLoading] = useState<LoadingState>(null);
  const [emailHint, setEmailHint] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Document title
  useEffect(() => {
    document.title = 'Sign in • NeuraFit';
  }, []);

  // Determine where to go post-login
  const redirectTarget = useMemo(() => {
    const r = params.get('redirect');
    // sanitize: avoid redirecting back to /login to prevent loops
    if (r && !/^\/login/.test(r)) return r;
    return '/app';
  }, [params]);

  const setGeneralError = (msg: string) => {
    setErrors((e) => ({ ...e, general: msg }));
    setError(msg);
  };

  const clearAllErrors = () => {
    setErrors({});
    clearError();
  };

  const onFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'email') {
      setErrors((prev) => ({
        ...prev,
        email: value && !emailPattern.test(value) ? 'Enter a valid email.' : undefined,
        general: undefined,
      }));
      setEmailHint(suggestEmail(value));
    } else if (name === 'password') {
      setErrors((prev) => ({
        ...prev,
        password: value ? undefined : 'Password is required.',
        general: undefined,
      }));
    }

    if (errors.general) clearAllErrors();
  };

  const validateBeforeSubmit = (): boolean => {
    const next: typeof errors = {};
    if (!form.email) next.email = 'Email is required.';
    else if (!emailPattern.test(form.email)) next.email = 'Enter a valid email.';
    if (!form.password) next.password = 'Password is required.';
    setErrors(next);

    if (next.email) {
      emailRef.current?.focus();
      return false;
    }
    if (next.password) {
      passwordRef.current?.focus();
      return false;
    }
    return true;
  };

  const navigatePostAuth = () => {
    // If a redirect was requested and user is already onboarded, honor it; else guide to onboarding
    if (isOnboarded) {
      navigate(redirectTarget, { replace: true });
    } else {
      // Keep redirect intent so onboarding can bounce back
      navigate(`/onboarding?redirect=${encodeURIComponent(redirectTarget)}`, { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAllErrors();
    if (!validateBeforeSubmit()) return;

    try {
      setLoading('email');
      await AuthService.signIn({ email: form.email, password: form.password });
      navigatePostAuth();
    } catch (err: any) {
      setGeneralError(mapAuthError(err));
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    clearAllErrors();
    try {
      setLoading('google');
      await AuthService.signInWithGoogle();
      // Most providers use redirect; if popup was used and returns here, navigate now:
      navigatePostAuth();
    } catch (err: any) {
      const message = (err?.message || '').toLowerCase();
      if (message.includes('redirecting to google')) {
        setErrors((e) => ({ ...e, general: 'Redirecting to Google sign-in…' }));
        return; // keep loading during redirect
      }
      setGeneralError(mapAuthError(err));
      setLoading(null);
    }
  };

  const isFormValid = emailPattern.test(form.email) && form.password.length > 0;
  const disableActions = loading !== null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-primary-50/20">
      {/* Subtle moving gradient accent */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary-100 via-cyan-100 to-primary-100 opacity-60 blur-2xl bg-[length:200%_100%]"
        animate={
          reduceMotion
            ? { opacity: 0.4 }
            : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }
        }
        transition={
          reduceMotion ? { duration: 0 } : { duration: 18, repeat: Infinity, ease: 'easeInOut' }
        }
      />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-md space-y-8"
        >
          {/* Brand / Heading */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center justify-center gap-2">
              <SparklesIcon className="h-5 w-5 text-primary-500" aria-hidden="true" />
              <h1 className="text-3xl font-display font-bold bg-gradient-brand bg-clip-text text-transparent">
                NeuraFit
              </h1>
            </Link>
            <h2 className="mt-6 text-3xl font-extrabold text-neutral-900">Welcome back</h2>
            <p className="mt-2 text-sm text-neutral-600">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">
                Sign up
              </Link>
            </p>
          </div>

          {/* Auth Card */}
          <div className="card p-6 sm:p-8 relative overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 -top-px h-[3px] bg-gradient-to-r from-primary-400 via-cyan-400 to-primary-400 bg-[length:200%_100%] animate-gradient"
            />
            {/* General error banner */}
            {!!errors.general && (
              <div
                className="mb-4 rounded-md border border-error-200 bg-error-50 p-3"
                role="alert"
                aria-live="assertive"
              >
                <p className="text-sm text-error-700">{errors.general}</p>
              </div>
            )}

            {/* Google Sign-in Button - First Option */}
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                loading={loading === 'google'}
                disabled={disableActions}
                className="w-full border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors duration-200 text-neutral-700 font-medium"
                size="lg"
                data-testid="login-google"
                aria-label="Continue with Google"
              >
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-neutral-500 font-medium">
                    Or sign in with email
                  </span>
                </div>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <Input
                ref={emailRef}
                label="Email address"
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@domain.com"
                required
                value={form.email}
                onChange={onFieldChange}
                error={errors.email}
                animate
                data-testid="login-email"
                aria-describedby={emailHint ? 'email-hint' : undefined}
              />
              {emailHint && (
                <p id="email-hint" className="mt-1 text-xs text-neutral-600">
                  Did you mean <span className="font-medium">{emailHint}</span>?
                </p>
              )}

              {/* Password */}
              <Input
                ref={passwordRef}
                label="Password"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                required
                value={form.password}
                onChange={onFieldChange}
                onKeyUp={(e) =>
                  setCapsLock((e as React.KeyboardEvent<HTMLInputElement>).getModifierState('CapsLock'))
                }
                helperText={capsLock ? 'Caps Lock is on.' : undefined}
                error={errors.password}
                showPasswordToggle
                animate
                data-testid="login-password"
              />

              {/* Utility links */}
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              {/* Primary actions */}
              <div className="space-y-4">
                <Button
                  type="submit"
                  loading={loading === 'email'}
                  disabled={disableActions || !isFormValid}
                  className="w-full"
                  size="lg"
                  data-testid="login-submit"
                >
                  Sign in
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
};