// Performance monitoring utilities

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'navigation' | 'resource' | 'measure' | 'custom';
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              if (navEntry.loadEventEnd > 0) {
                this.recordMetric('page-load-time', navEntry.loadEventEnd - navEntry.startTime, 'navigation');
              }
              if (navEntry.domContentLoadedEventEnd > 0) {
                this.recordMetric('dom-content-loaded', navEntry.domContentLoadedEventEnd - navEntry.startTime, 'navigation');
              }
              if (navEntry.loadEventStart > 0) {
                this.recordMetric('first-paint', navEntry.loadEventStart - navEntry.startTime, 'navigation');
              }
            }
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      } catch (error) {
        console.warn('Navigation timing observer not supported:', error);
      }

      // Observe resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              if (resourceEntry.responseEnd > 0 && resourceEntry.requestStart > 0) {
                const resourceName = resourceEntry.name.split('/').pop() || 'unknown';
                this.recordMetric(
                  `resource-${resourceName}`,
                  resourceEntry.responseEnd - resourceEntry.requestStart,
                  'resource'
                );
              }
            }
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource timing observer not supported:', error);
      }

      // Observe largest contentful paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('largest-contentful-paint', lastEntry.startTime, 'measure');
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // Observe first input delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as PerformanceEventTiming[]) {
            this.recordMetric('first-input-delay', (entry.processingStart || 0) - entry.startTime, 'measure');
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }
    }
  }

  recordMetric(name: string, value: number, type: PerformanceMetric['type'] = 'custom') {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      type
    };

    this.metrics.push(metric);

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric);
    }
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Send to your analytics service
    // Example: Google Analytics, Mixpanel, etc.
    try {
      if ('gtag' in window) {
        (window as any).gtag('event', 'performance_metric', {
          metric_name: metric.name,
          metric_value: metric.value,
          metric_type: metric.type
        });
      }
    } catch (error) {
      console.warn('Failed to send performance metric to analytics:', error);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  getMetricsByType(type: PerformanceMetric['type']): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.type === type);
  }

  getAverageMetric(name: string): number {
    const metrics = this.metrics.filter(metric => metric.name === name);
    if (metrics.length === 0) return 0;
    return metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length;
  }

  clearMetrics() {
    this.metrics = [];
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.clearMetrics();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

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

export const measureSync = <T>(name: string, fn: () => T): T => {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(name, duration);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.recordMetric(`${name}-error`, duration);
    throw error;
  }
};

// React hook for measuring component render time
export const useMeasureRender = (componentName: string) => {
  const startTime = performance.now();
  
  React.useEffect(() => {
    const duration = performance.now() - startTime;
    performanceMonitor.recordMetric(`render-${componentName}`, duration);
  });
};

// Bundle size analyzer
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

    // Estimate bundle size (rough approximation)
    let totalSize = 0;
    scripts.forEach((script: any) => {
      if (script.src.includes('localhost') || script.src.includes('127.0.0.1')) {
        // This is a rough estimate - in production you'd use actual file sizes
        totalSize += 100; // KB estimate per script
      }
    });

    // Use performance logger instead of console
    import('./loggers').then(({ performance }) => {
      performance.bundleAnalysis(scripts.length, styles.length, totalSize);
    });
  }
};

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    performanceMonitor.recordMetric('memory-used', memory.usedJSHeapSize / 1024 / 1024); // MB
    performanceMonitor.recordMetric('memory-total', memory.totalJSHeapSize / 1024 / 1024); // MB
    performanceMonitor.recordMetric('memory-limit', memory.jsHeapSizeLimit / 1024 / 1024); // MB
  }
};

// Import React for the hook
import React from 'react';
