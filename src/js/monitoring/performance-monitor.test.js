import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../config/environment.js', () => ({
  default: {
    env: 'test',
    appVersion: '2.0.0',
    performance: { sampleRate: 1.0 },
    monitoring: { sentry: { dsn: '' } },
  },
}));

import performanceMonitor from './performance-monitor.js';

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    // Reset metrics between tests
    performanceMonitor.metrics.FCP = null;
    performanceMonitor.metrics.LCP = null;
    performanceMonitor.metrics.FID = null;
    performanceMonitor.metrics.CLS = null;
    performanceMonitor.metrics.TTFB = null;
    performanceMonitor.metrics.INP = null;
    performanceMonitor.metrics.resources = [];
    performanceMonitor.metrics.userTimings = [];
  });

  describe('initialization', () => {
    it('should have default configuration', () => {
      expect(performanceMonitor.config.trackCoreWebVitals).toBe(true);
      expect(performanceMonitor.config.trackResources).toBe(true);
      expect(performanceMonitor.config.trackUserTiming).toBe(true);
      expect(performanceMonitor.config.sampleRate).toBe(1.0);
    });

    it('should have initial null metrics', () => {
      expect(performanceMonitor.metrics.FCP).toBeNull();
      expect(performanceMonitor.metrics.LCP).toBeNull();
      expect(performanceMonitor.metrics.CLS).toBeNull();
    });
  });

  describe('mark', () => {
    it('should call performance.mark if available', () => {
      const markSpy = vi.spyOn(performance, 'mark').mockImplementation(() => {});
      performanceMonitor.mark('test-mark');
      expect(markSpy).toHaveBeenCalledWith('test-mark');
      markSpy.mockRestore();
    });
  });

  describe('measure', () => {
    it('should call performance.measure if available', () => {
      const markSpy = vi.spyOn(performance, 'mark').mockImplementation(() => {});
      const measureSpy = vi.spyOn(performance, 'measure').mockImplementation(() => {});
      performanceMonitor.mark('start');
      performanceMonitor.mark('end');
      performanceMonitor.measure('test-measure', 'start', 'end');
      expect(measureSpy).toHaveBeenCalledWith('test-measure', 'start', 'end');
      markSpy.mockRestore();
      measureSpy.mockRestore();
    });

    it('should not throw if measure fails', () => {
      vi.spyOn(performance, 'measure').mockImplementation(() => {
        throw new Error('Marks not found');
      });
      expect(() => {
        performanceMonitor.measure('fail-measure', 'nonexistent', 'also-nonexistent');
      }).not.toThrow();
    });
  });

  describe('getMetrics', () => {
    it('should return structured metrics snapshot', () => {
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveProperty('coreWebVitals');
      expect(metrics.coreWebVitals).toHaveProperty('FCP');
      expect(metrics.coreWebVitals).toHaveProperty('LCP');
      expect(metrics.coreWebVitals).toHaveProperty('CLS');
      expect(metrics.coreWebVitals).toHaveProperty('TTFB');
      expect(metrics).toHaveProperty('navigation');
      expect(metrics).toHaveProperty('resources');
      expect(metrics).toHaveProperty('userTimings');
    });
  });

  describe('destroy', () => {
    it('should disconnect all observers', () => {
      // Add a mock observer
      const mockObserver = { disconnect: vi.fn() };
      performanceMonitor.observers.set('test', mockObserver);

      performanceMonitor.destroy();

      expect(mockObserver.disconnect).toHaveBeenCalled();
      expect(performanceMonitor.observers.size).toBe(0);
      expect(performanceMonitor.initialized).toBe(false);

      // Re-init for other tests
      performanceMonitor.initialized = false;
      performanceMonitor.init();
    });
  });
});
