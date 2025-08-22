// Simple performance monitoring for NeuraFit
import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
}

class SimplePerformanceMonitor {
  private metrics: PerformanceMetric[] = [];

  recordMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    // Log slow operations in development
    if (import.meta.env.DEV && value > 1000) {
      logger.warn(`Slow operation detected: ${name}`, { duration: value });
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  clearMetrics() {
    this.metrics = [];
  }
}

// Singleton instance
export const performanceMonitor = new SimplePerformanceMonitor();

// Utility functions for measuring custom performance
export const measureAsync = async <T>(name: string, fn: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(name, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(`${name}-error`, duration);
    throw error;
  }
};
