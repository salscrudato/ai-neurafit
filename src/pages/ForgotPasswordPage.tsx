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
