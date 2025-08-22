import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AuthService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

type LoginForm = { email: string; password: string };
type LoadingState = 'email' | 'google' | null;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { setError, clearError } = useAuthStore();

  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [capsLock, setCapsLock] = useState(false);
  const [loading, setLoading] = useState<LoadingState>(null);

  // focus targets on failed validation
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

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

    // live validation
    if (name === 'email') {
      setErrors((prev) => ({
        ...prev,
        email: value && !emailPattern.test(value) ? 'Enter a valid email.' : undefined,
        general: undefined,
      }));
    } else if (name === 'password') {
      setErrors((prev) => ({ ...prev, password: value ? undefined : 'Password is required.', general: undefined }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAllErrors();
    if (!validateBeforeSubmit()) return;

    try {
      setLoading('email');
      await AuthService.signIn(form);
      navigate('/app');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to sign in. Please try again.';
      setGeneralError(message);
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleSignIn = async () => {
    clearAllErrors();
    try {
      setLoading('google');
      await AuthService.signInWithGoogle();
      // most providers redirect; navigate is a safety net
      navigate('/app');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.';
      if (message.toLowerCase().includes('redirecting to google')) {
        setErrors((e) => ({ ...e, general: 'Redirecting to Google sign‑in…' }));
        return; // keep loading during redirect
      }
      setGeneralError(message);
      setLoading(null);
    }
  };

  const isFormValid = emailPattern.test(form.email) && form.password.length > 0;
  const disableActions = loading !== null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-primary-50/20">
      {/* Decorative background (motion-aware) */}
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
          <div className="card p-6 sm:p-8">
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
              />

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
                onKeyUp={(e) => setCapsLock((e as React.KeyboardEvent<HTMLInputElement>).getModifierState('CapsLock'))}
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

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-neutral-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Google SSO */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  loading={loading === 'google'}
                  disabled={disableActions}
                  className="w-full"
                  size="lg"
                  data-testid="login-google"
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
};