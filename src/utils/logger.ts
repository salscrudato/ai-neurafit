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
