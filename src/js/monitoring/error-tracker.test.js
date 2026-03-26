import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../config/environment.js', () => ({
  default: {
    env: 'test',
    appVersion: '2.0.0',
    performance: { errorThrottleMs: 1000 },
    monitoring: { sentry: { dsn: '', enabled: false }, logRocket: { appId: '', enabled: false } },
    security: { cspReportUri: '' },
  },
}));

vi.mock('./sentry.js', () => ({
  captureException: vi.fn(),
}));

// Import the singleton — it auto-initializes
import errorTracker from './error-tracker.js';

describe('ErrorTracker', () => {
  beforeEach(() => {
    // Reset internal state between tests
    errorTracker.errors = [];
    errorTracker.errorCounts.clear();
    errorTracker.lastErrorTime.clear();
  });

  describe('initialization', () => {
    it('should initialize when init() is called', () => {
      errorTracker.init();
      expect(errorTracker.initialized).toBe(true);
    });

    it('should have default configuration', () => {
      expect(errorTracker.config.maxErrors).toBe(50);
      expect(errorTracker.config.environment).toBe('test');
      expect(errorTracker.config.version).toBe('2.0.0');
    });

    it('should not re-initialize if already initialized', () => {
      errorTracker.init(); // first init
      const addSpy = vi.spyOn(window, 'addEventListener');
      errorTracker.init(); // second init — should no-op
      const errorCalls = addSpy.mock.calls.filter(c => c[0] === 'error');
      expect(errorCalls.length).toBe(0);
      addSpy.mockRestore();
    });
  });

  describe('captureError', () => {
    it('should store errors in the errors array', () => {
      errorTracker.captureError({
        type: 'test',
        message: 'Test error',
        timestamp: new Date().toISOString(),
      });
      expect(errorTracker.errors.length).toBe(1);
      expect(errorTracker.errors[0].message).toBe('Test error');
    });

    it('should add environment and version to captured errors', () => {
      errorTracker.captureError({
        type: 'test',
        message: 'Context test',
        timestamp: new Date().toISOString(),
      });
      expect(errorTracker.errors[0].environment).toBe('test');
      expect(errorTracker.errors[0].version).toBe('2.0.0');
    });

    it('should enforce max errors limit', () => {
      for (let i = 0; i < 60; i++) {
        errorTracker.captureError({
          type: 'test',
          message: `Error ${i}`,
          filename: `file${i}.js`,
          line: i,
          timestamp: new Date().toISOString(),
        });
      }
      expect(errorTracker.errors.length).toBeLessThanOrEqual(50);
    });
  });

  describe('isDuplicateError', () => {
    it('should not flag first occurrence as duplicate', () => {
      const error = { message: 'unique error', filename: 'test.js', line: 1 };
      expect(errorTracker.isDuplicateError(error)).toBe(false);
    });

    it('should flag rapid duplicate errors', () => {
      const error = { message: 'dup error', filename: 'test.js', line: 10 };
      errorTracker.isDuplicateError(error); // first call sets timestamp
      expect(errorTracker.isDuplicateError(error)).toBe(true); // second call within throttle
    });

    it('should allow same error after throttle period', () => {
      vi.useFakeTimers();
      const error = { message: 'throttled', filename: 'test.js', line: 5 };
      errorTracker.isDuplicateError(error);
      vi.advanceTimersByTime(2000); // past 1000ms throttle
      expect(errorTracker.isDuplicateError(error)).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('handleWindowError', () => {
    it('should capture window error events', () => {
      const mockEvent = {
        message: 'Uncaught TypeError',
        filename: 'app.js',
        lineno: 42,
        colno: 10,
        error: { stack: 'Error: at app.js:42' },
      };
      errorTracker.handleWindowError(mockEvent);
      expect(errorTracker.errors.length).toBe(1);
      expect(errorTracker.errors[0].type).toBe('javascript');
      expect(errorTracker.errors[0].line).toBe(42);
    });
  });

  describe('handleUnhandledRejection', () => {
    it('should capture unhandled promise rejections', () => {
      const mockEvent = {
        reason: new Error('Promise failed'),
      };
      errorTracker.handleUnhandledRejection(mockEvent);
      expect(errorTracker.errors.length).toBe(1);
      expect(errorTracker.errors[0].type).toBe('unhandled_rejection');
      expect(errorTracker.errors[0].message).toBe('Promise failed');
    });

    it('should handle non-Error rejection reasons', () => {
      const mockEvent = { reason: 'string rejection' };
      errorTracker.handleUnhandledRejection(mockEvent);
      expect(errorTracker.errors[0].message).toBe('string rejection');
    });
  });

  describe('errors array', () => {
    it('should accumulate captured errors', () => {
      errorTracker.captureError({ type: 'test', message: 'a', filename: 'a.js', line: 1, timestamp: new Date().toISOString() });
      errorTracker.captureError({ type: 'test', message: 'b', filename: 'b.js', line: 2, timestamp: new Date().toISOString() });
      expect(errorTracker.errors.length).toBe(2);
    });
  });

  describe('clearErrors', () => {
    it('should clear all stored errors', () => {
      errorTracker.captureError({ type: 'test', message: 'temp', filename: 'x.js', line: 1, timestamp: new Date().toISOString() });
      errorTracker.clearErrors();
      expect(errorTracker.errors.length).toBe(0);
    });
  });

  describe('destroy', () => {
    it('should set initialized to false', () => {
      errorTracker.destroy();
      expect(errorTracker.initialized).toBe(false);
      // Re-init for other tests
      errorTracker.init();
    });
  });
});
