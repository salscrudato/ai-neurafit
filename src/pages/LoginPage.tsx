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
