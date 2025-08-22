import { useEffect, useRef, useCallback } from 'react';
import { performanceMonitor } from '../utils/performance';

// Hook to measure component render performance
export const useRenderPerformance = (componentName: string) => {
  const renderStartTime = useRef<number>(performance.now());
  
  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    performanceMonitor.recordMetric(`render-${componentName}`, renderTime);
  });
  
  // Update start time for next render
  renderStartTime.current = performance.now();
};

// Hook to measure async operations
export const useAsyncPerformance = () => {
  const measureAsync = useCallback(async <T>(
    operationName: string,
    asyncOperation: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    try {
      const result = await asyncOperation();
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric(`async-${operationName}`, duration);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric(`async-${operationName}-error`, duration);
      throw error;
    }
  }, []);

  return { measureAsync };
};

// Hook to track user interactions
export const useInteractionPerformance = () => {
  const measureInteraction = useCallback((
    interactionName: string,
    callback: () => void | Promise<void>
  ) => {
    return async () => {
      const startTime = performance.now();
      try {
        await callback();
        const duration = performance.now() - startTime;
        performanceMonitor.recordMetric(`interaction-${interactionName}`, duration);
      } catch (error) {
        const duration = performance.now() - startTime;
        performanceMonitor.recordMetric(`interaction-${interactionName}-error`, duration);
        throw error;
      }
    };
  }, []);

  return { measureInteraction };
};

// Hook to monitor memory usage
export const useMemoryMonitoring = (intervalMs: number = 30000) => {
  useEffect(() => {
    if (!('memory' in performance)) return;

    const monitorMemory = () => {
      const memory = (performance as any).memory;
      performanceMonitor.recordMetric('memory-used-mb', memory.usedJSHeapSize / 1024 / 1024);
      performanceMonitor.recordMetric('memory-total-mb', memory.totalJSHeapSize / 1024 / 1024);
      
      // Log memory usage
      const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      import('../utils/loggers').then(({ performance }) => {
        performance.memoryUsage(
          memory.usedJSHeapSize / 1024 / 1024,
          memory.totalJSHeapSize / 1024 / 1024,
          memory.jsHeapSizeLimit / 1024 / 1024
        );
      });
    };

    const interval = setInterval(monitorMemory, intervalMs);
    monitorMemory(); // Initial measurement

    return () => clearInterval(interval);
  }, [intervalMs]);
};

// Hook to track page visibility and performance impact
export const useVisibilityPerformance = () => {
  useEffect(() => {
    let hiddenTime: number | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenTime = performance.now();
      } else if (hiddenTime !== null) {
        const timeHidden = performance.now() - hiddenTime;
        performanceMonitor.recordMetric('page-hidden-duration', timeHidden);
        hiddenTime = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
};

// Hook to measure network performance
export const useNetworkPerformance = () => {
  const measureNetworkRequest = useCallback(async <T>(
    requestName: string,
    requestFn: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await requestFn();
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric(`network-${requestName}`, duration);
      
      // Track network connection info if available
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        performanceMonitor.recordMetric(`network-${requestName}-effectiveType`, 
          connection.effectiveType === '4g' ? 4 : 
          connection.effectiveType === '3g' ? 3 : 
          connection.effectiveType === '2g' ? 2 : 1
        );
      }
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      performanceMonitor.recordMetric(`network-${requestName}-error`, duration);
      throw error;
    }
  }, []);

  return { measureNetworkRequest };
};

// Hook to track Core Web Vitals
export const useCoreWebVitals = () => {
  useEffect(() => {
    // Track Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window) {
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          if (clsValue > 0) {
            performanceMonitor.recordMetric('cumulative-layout-shift', clsValue);
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        return () => clsObserver.disconnect();
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }
    }
  }, []);
};

// Hook for performance budget monitoring
export const usePerformanceBudget = (budgets: Record<string, number>) => {
  useEffect(() => {
    const checkBudgets = () => {
      Object.entries(budgets).forEach(([metricName, budget]) => {
        const average = performanceMonitor.getAverageMetric(metricName);
        if (average > budget) {
          console.warn(`Performance budget exceeded for ${metricName}: ${average.toFixed(2)}ms > ${budget}ms`);
          performanceMonitor.recordMetric(`budget-exceeded-${metricName}`, average - budget);
        }
      });
    };

    // Check budgets every 30 seconds
    const interval = setInterval(checkBudgets, 30000);
    return () => clearInterval(interval);
  }, [budgets]);
};
