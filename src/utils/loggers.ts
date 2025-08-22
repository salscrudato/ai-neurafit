/**
 * Domain-Specific Loggers for NeuraFit
 * 
 * Provides specialized logging interfaces for different application domains
 * with appropriate context and consistent APIs.
 */

import { logger, type LogContext } from './logger';

// Authentication Logger
export const auth = {
  signInAttempt: (email: string, method: 'email' | 'google' = 'email') => {
    logger.info('Sign-in attempt', { email, method }, { component: 'Auth', action: 'sign-in' });
  },

  signInSuccess: (userId: string, email: string, method: 'email' | 'google' = 'email') => {
    logger.info('Sign-in successful', { userId, email, method }, { component: 'Auth', action: 'sign-in-success' });
  },

  signInFailure: (email: string, error: Error, method: 'email' | 'google' = 'email') => {
    logger.warn('Sign-in failed', { email, method, error: error.message }, { component: 'Auth', action: 'sign-in-failure' });
  },

  signUpAttempt: (email: string, displayName: string) => {
    logger.info('Sign-up attempt', { email, displayName }, { component: 'Auth', action: 'sign-up' });
  },

  signUpSuccess: (userId: string, email: string) => {
    logger.info('Sign-up successful', { userId, email }, { component: 'Auth', action: 'sign-up-success' });
  },

  signUpFailure: (email: string, error: Error) => {
    logger.warn('Sign-up failed', { email, error: error.message }, { component: 'Auth', action: 'sign-up-failure' });
  },

  signOut: (userId: string) => {
    logger.info('User signed out', { userId }, { component: 'Auth', action: 'sign-out' });
  },

  authStateChange: (userId: string | null, isAuthenticated: boolean) => {
    logger.debug('Auth state changed', { userId, isAuthenticated }, { component: 'Auth', action: 'state-change' });
  },

  error: (message: string, error: Error, context?: Partial<LogContext>) => {
    logger.error(message, error, { component: 'Auth', ...context });
  }
};

// Navigation Logger
export const navigation = {
  routeChange: (from: string, to: string, pageName: string) => {
    logger.debug('Route changed', { from, to, pageName }, { component: 'Navigation', action: 'route-change' });
  },

  pageLoad: (route: string, loadTime?: number) => {
    logger.info('Page loaded', { route, loadTime }, { component: 'Navigation', action: 'page-load' });
  },

  navigationError: (route: string, error: Error) => {
    logger.error('Navigation error', error, { component: 'Navigation', route });
  }
};

// Performance Logger
export const performance = {
  metric: (name: string, value: number, unit: 'ms' | 'bytes' | 'count' = 'ms') => {
    logger.debug('Performance metric', { name, value, unit }, { component: 'Performance', action: 'metric' });
  },

  renderTime: (componentName: string, duration: number) => {
    logger.debug('Component render time', { componentName, duration }, { component: 'Performance', action: 'render' });
  },

  apiCall: (endpoint: string, duration: number, status: number) => {
    const level = status >= 400 ? 'warn' : 'debug';
    logger[level]('API call completed', { endpoint, duration, status }, { component: 'Performance', action: 'api-call' });
  },

  memoryUsage: (used: number, total: number, limit: number) => {
    const usagePercent = (used / limit) * 100;
    const level = usagePercent > 80 ? 'warn' : 'debug';
    logger[level]('Memory usage', { used, total, limit, usagePercent }, { component: 'Performance', action: 'memory' });
  },

  bundleAnalysis: (scripts: number, styles: number, estimatedSize: number) => {
    logger.debug('Bundle analysis', { scripts, styles, estimatedSize }, { component: 'Performance', action: 'bundle' });
  }
};

// API Logger
export const api = {
  request: (method: string, endpoint: string, data?: any) => {
    logger.debug('API request', { method, endpoint, hasData: !!data }, { component: 'API', action: 'request' });
  },

  response: (method: string, endpoint: string, status: number, duration: number) => {
    const level = status >= 400 ? 'warn' : 'debug';
    logger[level]('API response', { method, endpoint, status, duration }, { component: 'API', action: 'response' });
  },

  error: (method: string, endpoint: string, error: Error, status?: number) => {
    logger.error('API error', error, { component: 'API', method, endpoint, status });
  },

  retry: (method: string, endpoint: string, attempt: number, maxAttempts: number) => {
    logger.warn('API retry', { method, endpoint, attempt, maxAttempts }, { component: 'API', action: 'retry' });
  }
};

// Workout Logger
export const workout = {
  generateRequest: (userId: string, preferences: any) => {
    logger.info('Workout generation requested', { userId, preferences }, { component: 'Workout', action: 'generate-request' });
  },

  generateSuccess: (userId: string, workoutId: string, duration: number) => {
    logger.info('Workout generated successfully', { userId, workoutId, duration }, { component: 'Workout', action: 'generate-success' });
  },

  generateFailure: (userId: string, error: Error) => {
    logger.error('Workout generation failed', error, { component: 'Workout', userId });
  },

  sessionStart: (userId: string, workoutId: string, sessionId: string) => {
    logger.info('Workout session started', { userId, workoutId, sessionId }, { component: 'Workout', action: 'session-start' });
  },

  sessionComplete: (userId: string, sessionId: string, duration: number, rating?: number) => {
    logger.info('Workout session completed', { userId, sessionId, duration, rating }, { component: 'Workout', action: 'session-complete' });
  },

  exerciseComplete: (userId: string, sessionId: string, exerciseId: string, sets: number, reps: number) => {
    logger.debug('Exercise completed', { userId, sessionId, exerciseId, sets, reps }, { component: 'Workout', action: 'exercise-complete' });
  }
};

// User Profile Logger
export const profile = {
  create: (userId: string, profileData: any) => {
    logger.info('User profile created', { userId, profileData }, { component: 'Profile', action: 'create' });
  },

  update: (userId: string, changes: any) => {
    logger.info('User profile updated', { userId, changes }, { component: 'Profile', action: 'update' });
  },

  error: (userId: string, action: string, error: Error) => {
    logger.error('Profile operation failed', error, { component: 'Profile', userId, action });
  }
};

// Offline/Sync Logger
export const sync = {
  dataQueued: (type: string, id: string) => {
    logger.debug('Data queued for sync', { type, id }, { component: 'Sync', action: 'queue' });
  },

  syncStart: (queueSize: number) => {
    logger.info('Sync started', { queueSize }, { component: 'Sync', action: 'start' });
  },

  syncComplete: (processed: number, failed: number, duration: number) => {
    logger.info('Sync completed', { processed, failed, duration }, { component: 'Sync', action: 'complete' });
  },

  syncError: (error: Error, itemId?: string) => {
    logger.error('Sync error', error, { component: 'Sync', itemId });
  },

  networkStatusChange: (isOnline: boolean) => {
    logger.info('Network status changed', { isOnline }, { component: 'Sync', action: 'network-change' });
  }
};

// PWA Logger
export const pwa = {
  installPromptShown: () => {
    logger.info('Install prompt shown', {}, { component: 'PWA', action: 'install-prompt' });
  },

  installAccepted: () => {
    logger.info('App installation accepted', {}, { component: 'PWA', action: 'install-accepted' });
  },

  installRejected: () => {
    logger.info('App installation rejected', {}, { component: 'PWA', action: 'install-rejected' });
  },

  serviceWorkerRegistered: (scope: string) => {
    logger.info('Service worker registered', { scope }, { component: 'PWA', action: 'sw-registered' });
  },

  serviceWorkerError: (error: Error) => {
    logger.error('Service worker error', error, { component: 'PWA' });
  }
};

// Error Boundary Logger
export const errorBoundary = {
  errorCaught: (error: Error, errorInfo: any, componentStack?: string) => {
    logger.error('Error boundary caught error', error, { 
      component: 'ErrorBoundary', 
      errorInfo, 
      componentStack 
    });
  },

  retry: (componentName?: string) => {
    logger.info('Error boundary retry', { componentName }, { component: 'ErrorBoundary', action: 'retry' });
  }
};

// Export all loggers
export const loggers = {
  auth,
  navigation,
  performance,
  api,
  workout,
  profile,
  sync,
  pwa,
  errorBoundary
};
