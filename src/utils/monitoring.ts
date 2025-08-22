/**
 * Production Monitoring Integration for NeuraFit
 * 
 * Provides integration with external monitoring services for production logging,
 * error tracking, and performance monitoring.
 */

import type { LogEntry } from './logger';
import { getLoggingConfig } from '../config/logging';

// Types for monitoring services
interface MonitoringService {
  name: string;
  enabled: boolean;
  initialize(): Promise<void>;
  sendLogs(entries: LogEntry[]): Promise<void>;
  sendError(error: Error, context?: any): Promise<void>;
  sendPerformanceMetric(name: string, value: number, context?: any): Promise<void>;
}

// Sentry integration (example)
class SentryMonitoring implements MonitoringService {
  name = 'Sentry';
  enabled = false;

  async initialize(): Promise<void> {
    try {
      // Check if Sentry is available
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        this.enabled = true;
        console.log('Sentry monitoring initialized');
      }
    } catch (error) {
      console.warn('Failed to initialize Sentry monitoring:', error);
    }
  }

  async sendLogs(entries: LogEntry[]): Promise<void> {
    if (!this.enabled || typeof window === 'undefined') return;

    const Sentry = (window as any).Sentry;
    if (!Sentry) return;

    entries.forEach(entry => {
      if (entry.error) {
        Sentry.captureException(entry.error, {
          extra: { ...entry, error: undefined },
          level: this.mapLogLevel(entry.level),
          tags: {
            component: entry.context.component,
            action: entry.context.action,
          },
        });
      } else if (entry.level === 'error' || entry.level === 'warn') {
        Sentry.captureMessage(entry.message, {
          level: this.mapLogLevel(entry.level),
          extra: entry,
          tags: {
            component: entry.context.component,
            action: entry.context.action,
          },
        });
      }
    });
  }

  async sendError(error: Error, context?: any): Promise<void> {
    if (!this.enabled || typeof window === 'undefined') return;

    const Sentry = (window as any).Sentry;
    if (!Sentry) return;

    Sentry.captureException(error, {
      extra: context,
      level: 'error',
    });
  }

  async sendPerformanceMetric(name: string, value: number, context?: any): Promise<void> {
    if (!this.enabled || typeof window === 'undefined') return;

    const Sentry = (window as any).Sentry;
    if (!Sentry) return;

    // Send as custom metric
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${name}: ${value}ms`,
      level: 'info',
      data: { ...context, value, metric: name },
    });
  }

  private mapLogLevel(level: string): string {
    const mapping: Record<string, string> = {
      debug: 'debug',
      info: 'info',
      warn: 'warning',
      error: 'error',
    };
    return mapping[level] || 'info';
  }
}

// Custom analytics service (example)
class CustomAnalytics implements MonitoringService {
  name = 'CustomAnalytics';
  enabled = false;
  private endpoint = '/api/analytics';

  async initialize(): Promise<void> {
    try {
      // Check if custom analytics endpoint is available
      const response = await fetch(`${this.endpoint}/health`, { method: 'HEAD' });
      this.enabled = response.ok;
      if (this.enabled) {
        console.log('Custom analytics monitoring initialized');
      }
    } catch (error) {
      console.warn('Failed to initialize custom analytics:', error);
    }
  }

  async sendLogs(entries: LogEntry[]): Promise<void> {
    if (!this.enabled) return;

    try {
      await fetch(`${this.endpoint}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: entries,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (error) {
      console.warn('Failed to send logs to custom analytics:', error);
    }
  }

  async sendError(error: Error, context?: any): Promise<void> {
    if (!this.enabled) return;

    try {
      await fetch(`${this.endpoint}/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name,
          },
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (fetchError) {
      console.warn('Failed to send error to custom analytics:', fetchError);
    }
  }

  async sendPerformanceMetric(name: string, value: number, context?: any): Promise<void> {
    if (!this.enabled) return;

    try {
      await fetch(`${this.endpoint}/performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric: name,
          value,
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch (error) {
      console.warn('Failed to send performance metric to custom analytics:', error);
    }
  }
}

// Monitoring manager
class MonitoringManager {
  private services: MonitoringService[] = [];
  private initialized = false;

  constructor() {
    // Add monitoring services
    this.services.push(new SentryMonitoring());
    this.services.push(new CustomAnalytics());
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Only initialize in production
    if (!import.meta.env.PROD) {
      console.log('Monitoring disabled in development mode');
      return;
    }

    const config = getLoggingConfig();
    if (!config.monitoring.enableErrorReporting) {
      console.log('Error reporting disabled in configuration');
      return;
    }

    // Initialize all services
    await Promise.allSettled(
      this.services.map(service => service.initialize())
    );

    this.initialized = true;
    console.log('Monitoring services initialized');
  }

  async sendLogs(entries: LogEntry[]): Promise<void> {
    if (!this.initialized || entries.length === 0) return;

    // Send to all enabled services
    const enabledServices = this.services.filter(service => service.enabled);
    await Promise.allSettled(
      enabledServices.map(service => service.sendLogs(entries))
    );
  }

  async sendError(error: Error, context?: any): Promise<void> {
    if (!this.initialized) return;

    // Send to all enabled services
    const enabledServices = this.services.filter(service => service.enabled);
    await Promise.allSettled(
      enabledServices.map(service => service.sendError(error, context))
    );
  }

  async sendPerformanceMetric(name: string, value: number, context?: any): Promise<void> {
    if (!this.initialized) return;

    // Apply sampling for performance metrics
    const config = getLoggingConfig();
    if (Math.random() > config.monitoring.performanceLogSampleRate) {
      return;
    }

    // Send to all enabled services
    const enabledServices = this.services.filter(service => service.enabled);
    await Promise.allSettled(
      enabledServices.map(service => service.sendPerformanceMetric(name, value, context))
    );
  }

  getEnabledServices(): string[] {
    return this.services
      .filter(service => service.enabled)
      .map(service => service.name);
  }
}

// Create singleton instance
export const monitoringManager = new MonitoringManager();

// Initialize monitoring on module load
if (import.meta.env.PROD) {
  monitoringManager.initialize().catch(error => {
    console.warn('Failed to initialize monitoring:', error);
  });
}

// Export for manual initialization if needed
export { MonitoringManager, type MonitoringService };
