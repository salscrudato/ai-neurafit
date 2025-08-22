# NeuraFit Logging System

A centralized, minimalistic, and informative logging solution for the NeuraFit application.

## Overview

The logging system provides:
- **Environment-aware behavior** - Different log levels for development/production
- **Structured log format** - Consistent, parseable log entries
- **Performance optimization** - Minimal overhead and lazy evaluation
- **Type safety** - Full TypeScript support
- **Context enrichment** - Automatic context detection and metadata
- **Sensitive data protection** - Automatic redaction of passwords, tokens, etc.
- **Production monitoring** - Integration with external monitoring services

## Quick Start

### Basic Usage

```typescript
import { logger } from '@/utils/logger';

// Simple logging
logger.info('User logged in', { userId: '123' });
logger.warn('API response slow', { duration: 2500 });
logger.error('Database connection failed', error);
```

### Domain-Specific Loggers

```typescript
import { auth, performance, api } from '@/utils/loggers';

// Authentication logging
auth.signInAttempt('user@example.com', 'email');
auth.signInSuccess('user123', 'user@example.com', 'email');

// Performance logging
performance.metric('api-call', 150, 'ms');
performance.renderTime('Dashboard', 45);

// API logging
api.request('GET', '/api/users');
api.response('GET', '/api/users', 200, 150);
```

## Log Levels

| Level | Development | Production | Description |
|-------|-------------|------------|-------------|
| `debug` | ✅ | ❌ | Detailed debugging information |
| `info` | ✅ | ❌ | General information messages |
| `warn` | ✅ | ✅ | Warning conditions |
| `error` | ✅ | ✅ | Error conditions (always logged) |

## Configuration

### Environment-Specific Settings

The logging system automatically configures itself based on the environment:

- **Development**: All log levels, human-readable format
- **Production**: Warnings and errors only, structured JSON format
- **Test**: Errors only, minimal output

### Custom Configuration

```typescript
import { Logger } from '@/utils/logger';

const customLogger = new Logger({
  level: 'warn',
  enableConsoleOutput: true,
  enableStructuredOutput: false,
  maxDataSize: 500
});
```

## Domain-Specific Loggers

### Authentication (`auth`)
- `signInAttempt(email, method)`
- `signInSuccess(userId, email, method)`
- `signInFailure(email, error, method)`
- `signOut(userId)`
- `authStateChange(userId, isAuthenticated)`

### Performance (`performance`)
- `metric(name, value, unit)`
- `renderTime(componentName, duration)`
- `apiCall(endpoint, duration, status)`
- `memoryUsage(used, total, limit)`
- `bundleAnalysis(scripts, styles, size)`

### API (`api`)
- `request(method, endpoint, data?)`
- `response(method, endpoint, status, duration)`
- `error(method, endpoint, error, status?)`
- `retry(method, endpoint, attempt, maxAttempts)`

### Workout (`workout`)
- `generateRequest(userId, preferences)`
- `generateSuccess(userId, workoutId, duration)`
- `sessionStart(userId, workoutId, sessionId)`
- `sessionComplete(userId, sessionId, duration, rating?)`

## Sensitive Data Protection

The logging system automatically redacts sensitive information:

```typescript
const userData = {
  username: 'john',
  password: 'secret123',  // Will be redacted
  token: 'abc123',        // Will be redacted
  email: 'john@example.com' // Will be visible
};

logger.info('User data', userData);
// Output: { username: 'john', password: '[REDACTED]', token: '[REDACTED]', email: 'john@example.com' }
```

### Protected Fields
- `password`, `passwordHash`, `salt`
- `token`, `refreshToken`, `apiKey`
- `secret`, `auth`, `authorization`
- `socialSecurityNumber`, `creditCardNumber`
- And more...

## Production Monitoring

### Automatic Error Reporting

In production, errors are automatically sent to monitoring services:

```typescript
// This error will be sent to Sentry, custom analytics, etc.
logger.error('Payment processing failed', error, { 
  userId: '123', 
  amount: 99.99 
});
```

### Performance Monitoring

Performance metrics are sampled and sent to monitoring services:

```typescript
// Only 10% of these will be sent in production (configurable)
performance.metric('page-load-time', 1250);
```

### Supported Monitoring Services

- **Sentry** - Error tracking and performance monitoring
- **Custom Analytics** - Custom endpoint for log aggregation
- **Console** - Structured JSON output for log aggregation tools

## Context Management

### Global Context

```typescript
import { logger } from '@/utils/logger';

// Set global context that will be included in all logs
logger.setGlobalContext({ 
  userId: '123', 
  sessionId: 'session_456' 
});
```

### Child Loggers

```typescript
// Create a child logger with additional context
const componentLogger = logger.child({ 
  component: 'Dashboard',
  feature: 'workout-generation' 
});

componentLogger.info('Feature used'); 
// Includes component and feature context automatically
```

## Testing

### Development Test Page

Visit `/dev/logging` in development mode to test all logging functionality:

```bash
npm run dev
# Navigate to http://localhost:5173/dev/logging
```

### Unit Tests

```bash
npm test src/utils/__tests__/logger.test.ts
```

## Best Practices

### 1. Use Appropriate Log Levels
```typescript
// ✅ Good
logger.debug('Detailed debugging info');
logger.info('User action completed');
logger.warn('Slow API response');
logger.error('Critical failure');

// ❌ Avoid
logger.error('User clicked button'); // Not an error
logger.debug('Critical system failure'); // Wrong level
```

### 2. Include Relevant Context
```typescript
// ✅ Good
logger.info('Workout generated', { 
  userId, 
  workoutType, 
  duration: generationTime 
});

// ❌ Avoid
logger.info('Something happened'); // No context
```

### 3. Use Domain-Specific Loggers
```typescript
// ✅ Good
auth.signInSuccess(userId, email, 'google');

// ❌ Avoid
logger.info('User signed in with Google', { userId, email });
```

### 4. Handle Errors Properly
```typescript
// ✅ Good
try {
  await apiCall();
} catch (error) {
  api.error('POST', '/api/users', error, 400);
  throw error; // Re-throw if needed
}

// ❌ Avoid
try {
  await apiCall();
} catch (error) {
  logger.info('API call failed'); // Wrong level, no error object
}
```

## Configuration Files

- `src/utils/logger.ts` - Core logger implementation
- `src/utils/loggers.ts` - Domain-specific loggers
- `src/config/logging.ts` - Environment configurations
- `src/utils/monitoring.ts` - Production monitoring integration

## Environment Variables

No environment variables are required. The system automatically detects the environment using `import.meta.env.MODE`.

For custom monitoring services, you may want to add:
- `VITE_SENTRY_DSN` - Sentry Data Source Name
- `VITE_ANALYTICS_ENDPOINT` - Custom analytics endpoint

## Migration Guide

### From Console Statements

```typescript
// Before
console.log('User logged in', { userId });
console.error('API failed', error);

// After
import { auth, api } from '@/utils/loggers';
auth.signInSuccess(userId, email, 'email');
api.error('POST', '/api/auth/login', error);
```

### From Custom Loggers

```typescript
// Before
const authLogger = {
  info: (msg, data) => console.log(`[Auth] ${msg}`, data)
};

// After
import { auth } from '@/utils/loggers';
auth.signInSuccess(userId, email, method);
```
