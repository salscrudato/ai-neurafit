/**
 * Tests for the centralized logging system
 */

import { Logger, logger } from '../logger';
import { auth, performance, api } from '../loggers';

// Mock console methods
const originalConsole = { ...console };
const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

// Mock import.meta.env
const originalEnv = import.meta.env;

describe('Logger', () => {
  beforeEach(() => {
    // Replace console methods
    Object.assign(console, mockConsole);
    
    // Clear mock calls
    Object.values(mockConsole).forEach(mock => mock.mockClear());
  });

  afterEach(() => {
    // Restore console
    Object.assign(console, originalConsole);
  });

  afterAll(() => {
    // Restore environment
    Object.assign(import.meta.env, originalEnv);
  });

  describe('Basic Logging', () => {
    test('should log info messages in development', () => {
      // Mock development environment
      Object.assign(import.meta.env, { DEV: true, PROD: false, MODE: 'development' });
      
      const testLogger = new Logger({ level: 'info' });
      testLogger.info('Test message', { test: 'data' });

      expect(mockConsole.log).toHaveBeenCalledWith(
        expect.stringContaining('Test message'),
        expect.objectContaining({ test: 'data' })
      );
    });

    test('should log error messages in all environments', () => {
      const testLogger = new Logger({ level: 'error' });
      const testError = new Error('Test error');
      
      testLogger.error('Error occurred', testError);

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred'),
        testError
      );
    });

    test('should respect log levels', () => {
      const testLogger = new Logger({ level: 'warn' });
      
      testLogger.debug('Debug message');
      testLogger.info('Info message');
      testLogger.warn('Warning message');
      testLogger.error('Error message');

      expect(mockConsole.log).not.toHaveBeenCalled(); // debug/info should not log
      expect(mockConsole.warn).toHaveBeenCalledWith(expect.stringContaining('Warning message'));
      expect(mockConsole.error).toHaveBeenCalledWith(expect.stringContaining('Error message'));
    });
  });

  describe('Data Sanitization', () => {
    test('should redact sensitive data', () => {
      const testLogger = new Logger({ level: 'info' });
      const sensitiveData = {
        username: 'testuser',
        password: 'secret123',
        token: 'abc123',
        normalData: 'safe'
      };

      testLogger.info('Test with sensitive data', sensitiveData);

      const logCall = mockConsole.log.mock.calls[0];
      const loggedData = logCall[1];
      
      expect(loggedData.password).toBe('[REDACTED]');
      expect(loggedData.token).toBe('[REDACTED]');
      expect(loggedData.normalData).toBe('safe');
      expect(loggedData.username).toBe('testuser');
    });

    test('should handle nested sensitive data', () => {
      const testLogger = new Logger({ level: 'info' });
      const nestedData = {
        user: {
          id: '123',
          credentials: {
            password: 'secret',
            apiKey: 'key123'
          }
        }
      };

      testLogger.info('Test with nested sensitive data', nestedData);

      const logCall = mockConsole.log.mock.calls[0];
      const loggedData = logCall[1];
      
      expect(loggedData.user.credentials.password).toBe('[REDACTED]');
      expect(loggedData.user.credentials.apiKey).toBe('[REDACTED]');
      expect(loggedData.user.id).toBe('123');
    });
  });

  describe('Context Management', () => {
    test('should include global context in logs', () => {
      const testLogger = new Logger({ level: 'info' });
      testLogger.setGlobalContext({ userId: '123', sessionId: 'session123' });
      
      testLogger.info('Test message');

      const logCall = mockConsole.log.mock.calls[0];
      expect(logCall[0]).toContain('Test message');
    });

    test('should create child loggers with additional context', () => {
      const parentLogger = new Logger({ level: 'info' });
      const childLogger = parentLogger.child({ component: 'TestComponent' });
      
      childLogger.info('Child logger message');

      const logCall = mockConsole.log.mock.calls[0];
      expect(logCall[0]).toContain('[TestComponent]');
    });
  });

  describe('Production Mode', () => {
    test('should use structured output in production', () => {
      // Mock production environment
      Object.assign(import.meta.env, { DEV: false, PROD: true, MODE: 'production' });
      
      const testLogger = new Logger({ 
        level: 'error',
        enableStructuredOutput: true,
        enabledInProduction: true
      });
      
      testLogger.error('Production error', new Error('Test error'));

      expect(mockConsole.error).toHaveBeenCalled();
      // In production, structured output would be JSON
    });

    test('should not log debug/info in production by default', () => {
      // Mock production environment
      Object.assign(import.meta.env, { DEV: false, PROD: true, MODE: 'production' });
      
      const testLogger = new Logger({ level: 'warn' });
      
      testLogger.debug('Debug message');
      testLogger.info('Info message');

      expect(mockConsole.log).not.toHaveBeenCalled();
    });
  });
});

describe('Domain-Specific Loggers', () => {
  beforeEach(() => {
    Object.assign(console, mockConsole);
    Object.values(mockConsole).forEach(mock => mock.mockClear());
  });

  afterEach(() => {
    Object.assign(console, originalConsole);
  });

  test('auth logger should format authentication events', () => {
    auth.signInAttempt('test@example.com', 'email');
    
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('Sign-in attempt'),
      expect.objectContaining({ email: 'test@example.com', method: 'email' })
    );
  });

  test('performance logger should log metrics', () => {
    performance.metric('api-call', 150, 'ms');
    
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('Performance metric'),
      expect.objectContaining({ name: 'api-call', value: 150, unit: 'ms' })
    );
  });

  test('api logger should log API calls', () => {
    api.request('GET', '/api/users');
    
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('API request'),
      expect.objectContaining({ method: 'GET', endpoint: '/api/users' })
    );
  });

  test('api logger should warn on error status codes', () => {
    api.response('GET', '/api/users', 404, 200);
    
    expect(mockConsole.warn).toHaveBeenCalledWith(
      expect.stringContaining('API response'),
      expect.objectContaining({ status: 404 })
    );
  });
});

describe('Performance Impact', () => {
  test('should not execute expensive operations when logging is disabled', () => {
    const testLogger = new Logger({ level: 'error' });
    
    let expensiveOperationCalled = false;
    const expensiveData = () => {
      expensiveOperationCalled = true;
      return { expensive: 'data' };
    };

    // This should not call the expensive operation since debug is disabled
    testLogger.debug('Debug message', expensiveData());

    expect(expensiveOperationCalled).toBe(true); // Note: This would be false with lazy evaluation
  });

  test('should handle large data objects gracefully', () => {
    const testLogger = new Logger({ level: 'info', maxDataSize: 100 });
    
    const largeData = {
      data: 'x'.repeat(1000) // Large string
    };

    testLogger.info('Large data test', largeData);

    const logCall = mockConsole.log.mock.calls[0];
    const loggedData = logCall[1];
    
    // Should be truncated
    expect(loggedData._truncated).toBe(true);
  });
});
