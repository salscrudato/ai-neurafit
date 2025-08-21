import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
  bundleSize: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showOverlay?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = process.env.NODE_ENV === 'development',
  showOverlay = false,
  onMetricsUpdate,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0,
    bundleSize: 0,
  });

  const [isVisible, setIsVisible] = useState(showOverlay);

  // FPS Monitoring
  useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics(prev => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [enabled]);

  // Memory Usage Monitoring
  useEffect(() => {
    if (!enabled || !('memory' in performance)) return;

    const measureMemory = () => {
      const memory = (performance as any).memory;
      if (memory) {
        const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }
    };

    const interval = setInterval(measureMemory, 1000);
    measureMemory();

    return () => clearInterval(interval);
  }, [enabled]);

  // Load Time Monitoring
  useEffect(() => {
    if (!enabled) return;

    const measureLoadTime = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = Math.round(navigation.loadEventEnd - navigation.fetchStart);
        setMetrics(prev => ({ ...prev, loadTime }));
      }
    };

    if (document.readyState === 'complete') {
      measureLoadTime();
    } else {
      window.addEventListener('load', measureLoadTime);
      return () => window.removeEventListener('load', measureLoadTime);
    }
  }, [enabled]);

  // Render Time Monitoring
  const measureRenderTime = useCallback(() => {
    if (!enabled) return;

    const startTime = performance.now();
    
    requestAnimationFrame(() => {
      const renderTime = Math.round(performance.now() - startTime);
      setMetrics(prev => ({ ...prev, renderTime }));
    });
  }, [enabled]);

  useEffect(() => {
    measureRenderTime();
  });

  // Bundle Size Estimation
  useEffect(() => {
    if (!enabled) return;

    const estimateBundleSize = async () => {
      try {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const jsResources = resources.filter(resource => 
          resource.name.includes('.js') && resource.transferSize
        );
        
        const totalSize = jsResources.reduce((sum, resource) => 
          sum + (resource.transferSize || 0), 0
        );
        
        const bundleSize = Math.round(totalSize / 1024);
        setMetrics(prev => ({ ...prev, bundleSize }));
      } catch (error) {
        console.warn('Could not estimate bundle size:', error);
      }
    };

    estimateBundleSize();
  }, [enabled]);

  // Report metrics to callback
  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }
  }, [metrics, onMetricsUpdate]);

  // Performance warnings
  useEffect(() => {
    if (!enabled) return;

    const warnings = [];
    
    if (metrics.fps < 30 && metrics.fps > 0) {
      warnings.push('Low FPS detected');
    }
    
    if (metrics.memoryUsage > 100) {
      warnings.push('High memory usage');
    }
    
    if (metrics.loadTime > 3000) {
      warnings.push('Slow page load');
    }
    
    if (metrics.renderTime > 16) {
      warnings.push('Slow render time');
    }

    if (warnings.length > 0) {
      console.warn('Performance warnings:', warnings);
    }
  }, [metrics, enabled]);

  // Keyboard shortcut to toggle overlay
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [enabled]);

  if (!enabled || !isVisible) {
    return null;
  }

  const getPerformanceColor = (value: number, thresholds: [number, number]) => {
    if (value <= thresholds[0]) return 'text-success-600';
    if (value <= thresholds[1]) return 'text-warning-600';
    return 'text-error-600';
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -100 }}
        className="fixed top-4 right-4 z-50 bg-black/90 text-white p-4 rounded-lg font-mono text-sm backdrop-blur-sm"
        style={{ minWidth: '200px' }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold">Performance</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/60 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>FPS:</span>
            <span className={getPerformanceColor(60 - metrics.fps, [30, 45])}>
              {metrics.fps}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Memory:</span>
            <span className={getPerformanceColor(metrics.memoryUsage, [50, 100])}>
              {metrics.memoryUsage}MB
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Load:</span>
            <span className={getPerformanceColor(metrics.loadTime, [1000, 3000])}>
              {metrics.loadTime}ms
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Render:</span>
            <span className={getPerformanceColor(metrics.renderTime, [8, 16])}>
              {metrics.renderTime}ms
            </span>
          </div>
          
          {metrics.bundleSize > 0 && (
            <div className="flex justify-between">
              <span>Bundle:</span>
              <span className={getPerformanceColor(metrics.bundleSize, [500, 1000])}>
                {metrics.bundleSize}KB
              </span>
            </div>
          )}
        </div>
        
        <div className="mt-2 pt-2 border-t border-white/20 text-xs text-white/60">
          Ctrl+Shift+P to toggle
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Performance optimization hooks
export const usePerformanceOptimization = () => {
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);

  useEffect(() => {
    // Detect low-end devices
    const checkDeviceCapabilities = () => {
      const hardwareConcurrency = navigator.hardwareConcurrency || 1;
      const memory = (navigator as any).deviceMemory || 1;
      
      // Consider device low-end if it has <= 2 CPU cores or <= 2GB RAM
      const isLowEnd = hardwareConcurrency <= 2 || memory <= 2;
      setIsLowEndDevice(isLowEnd);
      
      if (isLowEnd) {
        // Apply performance optimizations for low-end devices
        document.documentElement.classList.add('low-end-device');
      }
    };

    checkDeviceCapabilities();
  }, []);

  return { isLowEndDevice };
};

// Lazy loading utility
export const useLazyLoading = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = React.useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};
