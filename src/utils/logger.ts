/**
 * Centralized Logging System for NeuraFit
 *
 * Provides a clean, minimalistic, and informative logging solution with:
 * - Environment-aware behavior
 * - Structured log format
 * - Performance optimization
 * - Type safety
 * - Context enrichment
 * - Production monitoring integration
 */

import { getLoggingConfig, shouldLog, redactSensitiveFields } from '../config/logging';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  component?: string;
  userId?: string;
  sessionId?: string;
  route?: string;
  action?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context: LogContext;
  data?: any;
  error?: Error;
}

export interface LoggerConfig {
  level: LogLevel;
  enabledInProduction: boolean;
  enableConsoleOutput: boolean;
  enableStructuredOutput: boolean;
  maxDataSize: number;
}

class Logger {
  private config: LoggerConfig;
  private globalContext: LogContext = {};
  private sessionId: string;
  private logBuffer: LogEntry[] = [];
  private flushTimer?: number;

  constructor(config?: Partial<LoggerConfig>) {
    this.sessionId = this.generateSessionId();

    // Get environment-specific configuration
    const envConfig = getLoggingConfig();
    this.config = {
      level: this.getDefaultLogLevel(),
      enabledInProduction: false,
      enableConsoleOutput: true,
      enableStructuredOutput: import.meta.env.PROD,
      maxDataSize: 1000,
      ...envConfig,
      ...config,
    };

    // Set global context
    this.updateGlobalContext();

    // Initialize production monitoring
    if (import.meta.env.PROD) {
      this.initializeProductionMonitoring();
    }
  }

  private getDefaultLogLevel(): LogLevel {
    if (import.meta.env.PROD) return 'warn';
    if (import.meta.env.DEV) return 'debug';
    return 'info';
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updateGlobalContext(): void {
    this.globalContext = {
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      timestamp: new Date().toISOString(),
    };
  }

  private shouldLog(level: LogLevel): boolean {
    // Always log errors
    if (level === 'error') return true;

    // Check if logging is enabled for this environment
    if (import.meta.env.PROD && !this.config.enabledInProduction && level !== 'error') {
      return false;
    }

    // Use centralized shouldLog function
    return shouldLog(level, this.config.level);
  }

  private sanitizeData(data: any): any {
    if (!data) return data;

    try {
      const serialized = JSON.stringify(data);
      if (serialized.length > this.config.maxDataSize) {
        return { _truncated: true, _size: serialized.length };
      }

      // Remove sensitive data
      const sanitized = this.removeSensitiveData(data);
      return sanitized;
    } catch (error) {
      return { _error: 'Failed to serialize data', _type: typeof data };
    }
  }

  private removeSensitiveData(obj: any): any {
    // Use centralized sensitive data redaction
    return redactSensitiveFields(obj);
  }

  private formatMessage(level: LogLevel, message: string, context: LogContext): string {
    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    };

    const prefix = context.component ? `[${context.component}]` : '';
    return `${emoji[level]} ${prefix} ${message}`;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context: LogContext = {},
    data?: any,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: { ...this.globalContext, ...context },
      data: this.sanitizeData(data),
      error,
    };
  }

  private outputLog(entry: LogEntry): void {
    if (!this.config.enableConsoleOutput) return;

    const formattedMessage = this.formatMessage(entry.level, entry.message, entry.context);

    if (this.config.enableStructuredOutput) {
      // Structured output for production monitoring
      console.log(JSON.stringify(entry));
    } else {
      // Human-readable output for development
      const consoleMethod = entry.level === 'debug' ? 'log' : entry.level;
      const method = console[consoleMethod] || console.log;

      if (entry.data || entry.error) {
        method(formattedMessage, entry.data || entry.error);
      } else {
        method(formattedMessage);
      }
    }
  }

  // Public API
  setGlobalContext(context: Partial<LogContext>): void {
    this.globalContext = { ...this.globalContext, ...context };
  }

  debug(message: string, data?: any, context?: LogContext): void {
    if (!this.shouldLog('debug')) return;
    const entry = this.createLogEntry('debug', message, context, data);
    this.outputLog(entry);
  }

  info(message: string, data?: any, context?: LogContext): void {
    if (!this.shouldLog('info')) return;
    const entry = this.createLogEntry('info', message, context, data);
    this.outputLog(entry);
  }

  warn(message: string, data?: any, context?: LogContext): void {
    if (!this.shouldLog('warn')) return;
    const entry = this.createLogEntry('warn', message, context, data);
    this.outputLog(entry);
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    if (!this.shouldLog('error')) return;

    const errorObj = error instanceof Error ? error : new Error(String(error));
    const entry = this.createLogEntry('error', message, context, undefined, errorObj);
    this.outputLog(entry);

    // Add to monitoring buffer in production
    if (import.meta.env.PROD) {
      this.addToBuffer(entry);
    }
  }

  private initializeProductionMonitoring(): void {
    // Set up periodic log buffer flushing
    const config = getLoggingConfig();
    this.flushTimer = window.setInterval(() => {
      this.flushLogBuffer();
    }, config.monitoring.flushInterval);

    // Flush logs before page unload
    window.addEventListener('beforeunload', () => {
      this.flushLogBuffer();
    });
  }

  private addToBuffer(entry: LogEntry): void {
    if (!import.meta.env.PROD) return;

    this.logBuffer.push(entry);

    const config = getLoggingConfig();
    if (this.logBuffer.length >= config.monitoring.maxLogBuffer) {
      this.flushLogBuffer();
    }
  }

  private flushLogBuffer(): void {
    if (this.logBuffer.length === 0) return;

    try {
      // Send logs to monitoring service
      this.sendToMonitoring(this.logBuffer);
      this.logBuffer = [];
    } catch (error) {
      // Fail silently to avoid logging loops
      this.logBuffer = [];
    }
  }

  private sendToMonitoring(entries: LogEntry[]): void {
    // Placeholder for production error monitoring
    // Could integrate with services like Sentry, LogRocket, etc.
    try {
      // Example implementations:

      // Sentry integration
      // entries.forEach(entry => {
      //   if (entry.error) {
      //     window.Sentry?.captureException(entry.error, {
      //       extra: { ...entry, error: undefined },
      //       level: entry.level as any
      //     });
      //   } else {
      //     window.Sentry?.captureMessage(entry.message, entry.level as any);
      //   }
      // });

      // Custom analytics endpoint
      // fetch('/api/analytics/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ logs: entries })
      // });

      // Console output for now (structured for log aggregation)
      if (this.config.enableStructuredOutput) {
        entries.forEach(entry => {
          console.log(JSON.stringify(entry));
        });
      }
    } catch (monitoringError) {
      // Fail silently to avoid logging loops
    }
  }

  // Create child logger with additional context
  child(context: LogContext): Logger {
    const childLogger = new Logger(this.config);
    childLogger.globalContext = { ...this.globalContext, ...context };
    return childLogger;
  }

  // Cleanup method for production monitoring
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
    this.flushLogBuffer();
  }
}

// Create singleton instance
export const logger = new Logger();

// Export for testing and advanced usage
export { Logger };
