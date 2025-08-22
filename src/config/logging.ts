/**
 * Logging Configuration for NeuraFit
 * 
 * Centralized configuration for logging behavior across different environments
 */

import type { LogLevel, LoggerConfig } from '../utils/logger';

// Environment-specific logging configurations
export const loggingConfigs: Record<string, Partial<LoggerConfig>> = {
  development: {
    level: 'debug',
    enabledInProduction: false,
    enableConsoleOutput: true,
    enableStructuredOutput: false,
    maxDataSize: 2000, // Larger data size for debugging
  },
  
  production: {
    level: 'warn', // Only warnings and errors in production
    enabledInProduction: true,
    enableConsoleOutput: true,
    enableStructuredOutput: true, // Structured logs for monitoring
    maxDataSize: 500, // Smaller data size for performance
  },
  
  test: {
    level: 'error', // Only errors during testing
    enabledInProduction: false,
    enableConsoleOutput: false,
    enableStructuredOutput: false,
    maxDataSize: 100,
  }
};

// Get current environment configuration
export const getCurrentLoggingConfig = (): Partial<LoggerConfig> => {
  const env = import.meta.env.MODE || 'development';
  return loggingConfigs[env] || loggingConfigs.development;
};

// Production monitoring configuration
export const productionMonitoring = {
  // Enable error reporting to external services
  enableErrorReporting: import.meta.env.PROD,
  
  // Sample rate for performance logs (0.1 = 10% of logs)
  performanceLogSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  
  // Maximum number of logs to buffer before sending
  maxLogBuffer: 100,
  
  // Flush interval for batched logs (ms)
  flushInterval: 30000, // 30 seconds
  
  // Sensitive data patterns to redact
  sensitivePatterns: [
    /password/i,
    /token/i,
    /apikey/i,
    /secret/i,
    /auth/i,
    /authorization/i,
    /bearer/i,
    /session/i,
    /cookie/i,
    /ssn/i,
    /social.?security/i,
    /credit.?card/i,
    /card.?number/i,
    /cvv/i,
    /pin/i,
  ],
  
  // URLs that should not be logged in full
  sensitiveUrls: [
    /\/api\/auth\//,
    /\/api\/payment\//,
    /\/api\/user\/sensitive/,
  ],
  
  // User data fields that should be redacted
  sensitiveUserFields: [
    'password',
    'passwordHash',
    'salt',
    'token',
    'refreshToken',
    'apiKey',
    'socialSecurityNumber',
    'creditCardNumber',
    'bankAccount',
  ],
};

// Log level priorities for filtering
export const logLevelPriorities: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Performance thresholds for automatic logging
export const performanceThresholds = {
  // API call duration thresholds (ms)
  apiCall: {
    warn: 2000,   // Log warning if API call takes > 2s
    error: 5000,  // Log error if API call takes > 5s
  },
  
  // Component render time thresholds (ms)
  componentRender: {
    warn: 100,    // Log warning if render takes > 100ms
    error: 500,   // Log error if render takes > 500ms
  },
  
  // Memory usage thresholds (percentage)
  memoryUsage: {
    warn: 70,     // Log warning if memory usage > 70%
    error: 85,    // Log error if memory usage > 85%
  },
  
  // Bundle size thresholds (KB)
  bundleSize: {
    warn: 1000,   // Log warning if bundle > 1MB
    error: 2000,  // Log error if bundle > 2MB
  },
};

// Feature flags for logging
export const loggingFeatures = {
  // Enable user session tracking
  enableSessionTracking: true,
  
  // Enable performance monitoring
  enablePerformanceMonitoring: true,
  
  // Enable error boundary logging
  enableErrorBoundaryLogging: true,
  
  // Enable navigation logging
  enableNavigationLogging: import.meta.env.DEV,
  
  // Enable API request/response logging
  enableApiLogging: true,
  
  // Enable authentication flow logging
  enableAuthLogging: true,
  
  // Enable offline sync logging
  enableSyncLogging: import.meta.env.DEV,
  
  // Enable PWA event logging
  enablePwaLogging: true,
};

// Export configuration getter
export const getLoggingConfig = () => ({
  ...getCurrentLoggingConfig(),
  monitoring: productionMonitoring,
  thresholds: performanceThresholds,
  features: loggingFeatures,
});

// Utility function to check if a log level should be processed
export const shouldLog = (level: LogLevel, configLevel: LogLevel): boolean => {
  return logLevelPriorities[level] >= logLevelPriorities[configLevel];
};

// Utility function to check if data contains sensitive information
export const containsSensitiveData = (data: any): boolean => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  
  const dataString = JSON.stringify(data).toLowerCase();
  return productionMonitoring.sensitivePatterns.some(pattern => 
    pattern.test(dataString)
  );
};

// Utility function to redact sensitive fields from objects
export const redactSensitiveFields = (obj: any): any => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const result = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    if (productionMonitoring.sensitiveUserFields.some(field => 
      lowerKey.includes(field.toLowerCase())
    )) {
      (result as any)[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      (result as any)[key] = redactSensitiveFields(value);
    } else {
      (result as any)[key] = value;
    }
  }
  
  return result;
};
