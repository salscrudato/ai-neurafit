import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { AuthService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

type Errors = Partial<Record<'displayName' | 'email' | 'password' | 'confirmPassword', string>>;

const emailRegex =
  // simple, robust-enough email check for client side
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

  const pwStrength = useMemo(() => scorePassword(formData.password), [formData.password]);

  const validateField = (name: keyof typeof formData, value: string): string | undefined => {
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
      confirmPassword: validateField('confirmPassword', formData.confirmPassword),
    };
    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (localError) setLocalError('');
    clearError();

    // live-validate on change (soft)
    setErrors((prev) => ({ ...prev, [name]: validateField(name as keyof typeof formData, value) }));
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
      const message = err?.message || 'Unable to create account. Please try again.';
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
      const message = err?.message || '';
      if (message.includes('Redirecting to Google sign-in')) {
        setLocalError('Redirecting to Google sign-in...');
        return; // keep loading during redirect
      }
      setLocalError(message || 'Google sign-in failed.');
      setError(message || 'Google sign-in failed.');
      setLoading(false);
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
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8"
      >
        <div className="text-center">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-display font-bold bg-gradient-brand bg-clip-text text-transparent">
              NeuraFit
            </h1>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-neutral-900">Create your account</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>

        <div className="card">
          {localError && (
            <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-md" role="alert" aria-live="polite">
              <p className="text-sm text-error-600">{localError}</p>
            </div>
          )}

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

            <Input
              label="Email address"
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />

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
                helperText="Minimum 6 characters. Add upper/lowercase, numbers, and symbols for a stronger password."
                error={errors.password}
                showPasswordToggle
              />

              {/* Password strength meter */}
              {formData.password && (
                <div className="mt-2">
                  <div className="progress-bar" aria-hidden="true">
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
              error={errors.confirmPassword}
              showPasswordToggle
            />

            <div className="space-y-4">
              <Button type="submit" loading={loading} className="w-full" size="lg" disabled={!formValid}>
                Create Account
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-neutral-500">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignUp}
                loading={loading}
                className="w-full"
                size="lg"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
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
                Google
              </Button>
            </div>

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