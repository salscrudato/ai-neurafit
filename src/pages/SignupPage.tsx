import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AuthService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

type Errors = Partial<
  Record<'displayName' | 'email' | 'password' | 'confirmPassword', string>
>;

// Simple, robust-enough email check for client side
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const clamped = Math.min(score, 4);
  const map = [
    { label: 'Very weak', percent: 10, bar: 'bg-error-500' },
    { label: 'Weak', percent: 35, bar: 'bg-warning-500' },
    { label: 'Fair', percent: 60, bar: 'bg-accent-500' },
    { label: 'Strong', percent: 80, bar: 'bg-success-500' },
    { label: 'Very strong', percent: 100, bar: 'bg-primary-600' },
  ];
  return map[clamped];
}

// Gentle mapping of auth error codes -> user-safe copy
function mapAuthError(err: any): string {
  const code = err?.code || err?.error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email is already in use. Try signing in instead.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/weak-password':
      return 'Please choose a stronger password.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign‑in window was closed.';
    default:
      return err?.message || 'Unable to create account. Please try again.';
  }
}

// Mild email domain suggestions to reduce typos
const domainCorrections: Record<string, string> = {
  gamil: 'gmail',
  gmal: 'gmail',
  hotmial: 'hotmail',
  hotmil: 'hotmail',
  outlok: 'outlook',
  yaho: 'yahoo',
};
function suggestEmailDomain(email: string): string | null {
  const at = email.indexOf('@');
  if (at < 0) return null;
  const [local, domainRaw] = [email.slice(0, at), email.slice(at + 1)];
  const [name, tld = ''] = domainRaw.split('.');
  if (!name || !tld) return null;
  const fixedName = domainCorrections[name.toLowerCase()];
  if (fixedName && fixedName !== name) {
    return `${local}@${fixedName}.${tld}`;
  }
  return null;
}

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const { setError, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [emailHint, setEmailHint] = useState<string | null>(null);
  const [capsPassword, setCapsPassword] = useState(false);
  const [capsConfirm, setCapsConfirm] = useState(false);

  const pwStrength = useMemo(
    () => scorePassword(formData.password),
    [formData.password],
  );

  useEffect(() => {
    document.title = 'Sign up • NeuraFit';
  }, []);

  const validateField = (
    name: keyof typeof formData,
    value: string,
  ): string | undefined => {
    switch (name) {
      case 'displayName':
        if (!value.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Please enter your full name';
        return;
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!emailRegex.test(value)) return 'Enter a valid email address';
        return;
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return;
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== formData.password) return 'Passwords do not match';
        return;
      default:
        return;
    }
  };

  const validateForm = (): boolean => {
    const nextErrors: Errors = {
      displayName: validateField('displayName', formData.displayName),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
      confirmPassword: validateField(
        'confirmPassword',
        formData.confirmPassword,
      ),
    };
    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (localError) setLocalError('');
    clearError();

    // Live‑validate (soft)
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name as keyof typeof formData, value),
    }));

    if (name === 'email') {
      setEmailHint(suggestEmailDomain(value));
    }
  };

  const handlePasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ('getModifierState' in e) {
      setCapsPassword((e as any).getModifierState('CapsLock'));
    }
  };
  const handleConfirmKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ('getModifierState' in e) {
      setCapsConfirm((e as any).getModifierState('CapsLock'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setLocalError('');
    clearError();

    try {
      await AuthService.signUp({
        email: formData.email,
        password: formData.password,
        displayName: formData.displayName,
      });
      navigate('/onboarding');
    } catch (err: any) {
      const message = mapAuthError(err);
      setLocalError(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    setLocalError('');
    clearError();
    try {
      await AuthService.signInWithGoogle();
      navigate('/onboarding');
    } catch (err: any) {
      const message = mapAuthError(err);
      // If this is a redirect flow, keep subtle feedback but stop spinning
      if ((err?.message || '').includes('Redirecting to Google')) {
        setLocalError('Redirecting to Google sign‑in…');
      } else {
        setLocalError(message || 'Google sign‑in failed.');
        setError(message || 'Google sign‑in failed.');
        setLoading(false);
      }
    }
  };

  const formValid =
    !loading &&
    !!formData.displayName &&
    !!formData.email &&
    !!formData.password &&
    !!formData.confirmPassword &&
    !Object.values(errors).some(Boolean);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle moving gradient accent */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-primary-100 via-cyan-100 to-primary-100 opacity-60 blur-2xl bg-[length:200%_100%]"
        animate={
          shouldReduceMotion
            ? { opacity: 0.4 }
            : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 18, repeat: Infinity, ease: 'easeInOut' }
        }
      />

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-display font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
              NeuraFit
            </h1>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-neutral-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="card relative overflow-hidden">
          {/* Animated top border accent */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 -top-px h-[3px] bg-gradient-to-r from-primary-400 via-cyan-400 to-primary-400 bg-[length:200%_100%] animate-gradient"
          />
          {localError && (
            <div
              className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md"
              role="alert"
              aria-live="polite"
            >
              <p className="text-sm text-error-600">{localError}</p>
            </div>
          )}

          {/* Google Sign-in Button - First Option */}
          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignUp}
              loading={loading}
              className="w-full border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors duration-200 text-neutral-700 font-medium"
              size="lg"
              aria-label="Continue with Google"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-neutral-500 font-medium">
                  Or create account with email
                </span>
              </div>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <Input
              label="Full Name"
              id="displayName"
              name="displayName"
              placeholder="Enter your full name"
              autoComplete="name"
              required
              value={formData.displayName}
              onChange={handleChange}
              error={errors.displayName}
            />

            <div>
              <Input
                label="Email address"
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                aria-describedby={emailHint ? 'email-hint' : undefined}
              />
              {emailHint && (
                <p id="email-hint" className="mt-1 text-xs text-neutral-600">
                  Did you mean <span className="font-medium">{emailHint}</span>?
                </p>
              )}
            </div>

            <div>
              <Input
                label="Password"
                id="password"
                name="password"
                type="password"
                placeholder="Create a password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                onKeyUp={handlePasswordKey}
                helperText="Min 6 characters. Mix upper/lowercase, numbers, and symbols for a stronger password."
                error={errors.password}
                showPasswordToggle
              />
              {capsPassword && (
                <p className="mt-1 text-xs text-warning-600">Caps Lock is on.</p>
              )}

              {/* Accessible strength meter */}
              {formData.password && (
                <div className="mt-2">
                  <div
                    className="progress-bar"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={pwStrength.percent}
                    aria-label="Password strength"
                  >
                    <div
                      className={`progress-fill ${pwStrength.bar}`}
                      style={{ width: `${pwStrength.percent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-neutral-600">
                    Strength: <span className="font-medium">{pwStrength.label}</span>
                  </p>
                </div>
              )}
            </div>

            <div>
              <Input
                label="Confirm Password"
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                onKeyUp={handleConfirmKey}
                error={errors.confirmPassword}
                showPasswordToggle
              />
              {capsConfirm && (
                <p className="mt-1 text-xs text-warning-600">Caps Lock is on.</p>
              )}
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
              disabled={!formValid}
            >
              Create Account
            </Button>

            <p className="text-xs text-neutral-500 text-center">
              By creating an account, you agree to our{' '}
              <Link to="/terms" className="text-primary-600 hover:text-primary-500">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
                Privacy Policy
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};