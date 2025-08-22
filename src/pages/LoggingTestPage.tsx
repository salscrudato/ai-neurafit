/**
 * Logging Test Page - For testing and demonstrating the logging system
 * This page should only be available in development mode
 */

import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { logger } from '../utils/logger';
import { auth, performance, api, workout, errorBoundary } from '../utils/loggers';

export const LoggingTestPage: React.FC = () => {
  const [logCount, setLogCount] = useState(0);

  // Only show in development
  if (import.meta.env.PROD) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center" padding="xl">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">
            Page Not Available
          </h1>
          <p className="text-neutral-600">
            This page is only available in development mode.
          </p>
        </Card>
      </div>
    );
  }

  const testBasicLogging = () => {
    logger.debug('Debug message from test page', { testData: 'debug' });
    logger.info('Info message from test page', { testData: 'info' });
    logger.warn('Warning message from test page', { testData: 'warning' });
    logger.error('Error message from test page', new Error('Test error'));
    setLogCount(prev => prev + 4);
  };

  const testSensitiveData = () => {
    const sensitiveData = {
      username: 'testuser',
      password: 'secret123',
      token: 'bearer_token_123',
      apiKey: 'api_key_456',
      normalData: 'this should be visible',
      nested: {
        secret: 'hidden',
        visible: 'shown'
      }
    };

    logger.info('Testing sensitive data redaction', sensitiveData);
    setLogCount(prev => prev + 1);
  };

  const testAuthLogging = () => {
    auth.signInAttempt('test@example.com', 'email');
    auth.signInSuccess('user123', 'test@example.com', 'email');
    auth.signInFailure('test@example.com', new Error('Invalid credentials'), 'email');
    auth.signOut('user123');
    setLogCount(prev => prev + 4);
  };

  const testPerformanceLogging = () => {
    performance.metric('page-load', 1250, 'ms');
    performance.renderTime('TestComponent', 45);
    performance.apiCall('/api/test', 300, 200);
    performance.memoryUsage(50, 100, 200);
    performance.bundleAnalysis(5, 2, 1200);
    setLogCount(prev => prev + 5);
  };

  const testApiLogging = () => {
    api.request('GET', '/api/users', { page: 1 });
    api.response('GET', '/api/users', 200, 150);
    api.error('POST', '/api/users', new Error('Validation failed'), 400);
    api.retry('GET', '/api/users', 2, 3);
    setLogCount(prev => prev + 4);
  };

  const testWorkoutLogging = () => {
    workout.generateRequest('user123', { fitnessLevel: 'beginner' });
    workout.generateSuccess('user123', 'workout456', 2000);
    workout.sessionStart('user123', 'workout456', 'session789');
    workout.sessionComplete('user123', 'session789', 1800, 4);
    workout.exerciseComplete('user123', 'session789', 'exercise1', 3, 12);
    setLogCount(prev => prev + 5);
  };

  const testErrorBoundary = () => {
    const testError = new Error('Test error boundary error');
    const errorInfo = {
      componentStack: 'at TestComponent\n  at App'
    };
    errorBoundary.errorCaught(testError, errorInfo, errorInfo.componentStack);
    errorBoundary.retry('TestComponent');
    setLogCount(prev => prev + 2);
  };

  const testChildLogger = () => {
    const childLogger = logger.child({ component: 'TestPage', userId: 'user123' });
    childLogger.info('Message from child logger');
    childLogger.warn('Warning from child logger', { additionalData: 'test' });
    setLogCount(prev => prev + 2);
  };

  const testLargeData = () => {
    const largeData = {
      smallField: 'normal',
      largeField: 'x'.repeat(2000), // Large string
      arrayField: Array(100).fill('item'),
      nestedLarge: {
        data: 'y'.repeat(1000)
      }
    };

    logger.info('Testing large data handling', largeData);
    setLogCount(prev => prev + 1);
  };

  const clearLogs = () => {
    console.clear();
    setLogCount(0);
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Logging System Test Page
          </h1>
          <p className="text-neutral-600">
            Test and demonstrate the centralized logging system. Open your browser's 
            developer console to see the log output.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-neutral-500">
              Logs generated: {logCount}
            </span>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              Clear Console
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Basic Logging
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Test all log levels: debug, info, warn, error
            </p>
            <Button onClick={testBasicLogging} className="w-full">
              Test Basic Logging
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Sensitive Data
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Test automatic redaction of passwords, tokens, etc.
            </p>
            <Button onClick={testSensitiveData} className="w-full">
              Test Sensitive Data
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Auth Logging
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Test authentication-specific logging methods
            </p>
            <Button onClick={testAuthLogging} className="w-full">
              Test Auth Logging
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Performance Logging
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Test performance metrics and monitoring
            </p>
            <Button onClick={testPerformanceLogging} className="w-full">
              Test Performance
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              API Logging
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Test API request/response logging
            </p>
            <Button onClick={testApiLogging} className="w-full">
              Test API Logging
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Workout Logging
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Test workout-specific logging methods
            </p>
            <Button onClick={testWorkoutLogging} className="w-full">
              Test Workout Logging
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Error Boundary
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Test error boundary logging
            </p>
            <Button onClick={testErrorBoundary} className="w-full">
              Test Error Boundary
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Child Logger
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Test child loggers with additional context
            </p>
            <Button onClick={testChildLogger} className="w-full">
              Test Child Logger
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              Large Data
            </h3>
            <p className="text-sm text-neutral-600 mb-4">
              Test handling of large data objects
            </p>
            <Button onClick={testLargeData} className="w-full">
              Test Large Data
            </Button>
          </Card>
        </div>

        <Card className="mt-8 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Current Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Environment:</strong> {import.meta.env.MODE}
            </div>
            <div>
              <strong>Development:</strong> {import.meta.env.DEV ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Production:</strong> {import.meta.env.PROD ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Logs Generated:</strong> {logCount}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
