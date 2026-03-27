/**
 * Error Tracking and Monitoring Module
 * Captures and reports errors to monitoring service
 * @module ErrorTracker
 */

import config from '../config/environment.js';
import { captureException as sentryCaptureException } from './sentry.js';

class ErrorTracker {
  constructor(customConfig = {}) {
    this.config = {
      maxErrors: 50, // Maximum errors to store locally
      throttleMs: config.performance.errorThrottleMs,
      environment: config.env,
      version: config.appVersion,
      enableConsoleCapture: true,
      enableNetworkCapture: true,
      enableLocalStorage: true,
      sentryDsn: config.monitoring.sentry.dsn,
      ...customConfig
    };

    this.errors = [];
    this.errorCounts = new Map();
    this.lastErrorTime = new Map();
    this.initialized = false;

    // Store originals for cleanup in destroy()
    this._originalConsoleError = null;
    this._originalFetch = null;
    this._originalXhrOpen = null;

    // Bind methods
    this.captureError = this.captureError.bind(this);
    this.handleUnhandledRejection = this.handleUnhandledRejection.bind(this);
    this.handleWindowError = this.handleWindowError.bind(this);
  }

  /**
   * Initialize error tracking
   */
  init() {
    if (this.initialized) return;

    // Set up global error handlers
    window.addEventListener('error', this.handleWindowError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);

    // Monkey-patch console.error if enabled
    if (this.config.enableConsoleCapture) {
      this.monkeyPatchConsole();
    }

    // Set up network error capture if enabled
    if (this.config.enableNetworkCapture) {
      this.setupNetworkCapture();
    }

    // Load stored errors from localStorage
    if (this.config.enableLocalStorage) {
      this.loadStoredErrors();
    }

    this.initialized = true;
    this.log('Error tracker initialized', 'info');
  }


  /**
   * Handle window error events
   */
  handleWindowError(event) {
    const error = {
      type: 'javascript',
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.captureError(error);
  }

  /**
   * Handle unhandled promise rejections
   */
  handleUnhandledRejection(event) {
    const error = {
      type: 'unhandled_rejection',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.captureError(error);
  }

  /**
   * Capture and process an error
   */
  captureError(error) {
    // Add environment context
    error.environment = this.config.environment;
    error.version = this.config.version;

    // Throttle duplicate errors
    if (this.isDuplicateError(error)) {
      return;
    }

    // Store error locally
    this.storeError(error);

    // Send to monitoring service
    this.sendToMonitoring(error);

    // Log in development
    if (this.config.environment === 'development') {
      // eslint-disable-next-line no-console -- dev-only error grouping
      console.group('🔴 Error Captured');
      console.error(error);
      // eslint-disable-next-line no-console -- closing dev-only group
      console.groupEnd();
    }
  }

  /**
   * Check if error is a duplicate (throttling)
   */
  isDuplicateError(error) {
    const errorKey = `${error.message}-${error.filename}-${error.line}`;
    const lastTime = this.lastErrorTime.get(errorKey);
    const now = Date.now();

    if (lastTime && (now - lastTime) < this.config.throttleMs) {
      // Increment count but don't report
      this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
      return true;
    }

    this.lastErrorTime.set(errorKey, now);
    return false;
  }

  /**
   * Store error locally
   */
  storeError(error) {
    this.errors.push(error);

    // Limit stored errors
    if (this.errors.length > this.config.maxErrors) {
      this.errors.shift();
    }

    // Store in localStorage (sanitize PII from URLs before storing)
    if (this.config.enableLocalStorage) {
      try {
        const sanitized = this.errors.map(e => this.sanitizeError(e));
        localStorage.setItem('fnf_errors', JSON.stringify(sanitized));
      } catch (e) {
        // localStorage might be full or disabled
      }
    }
  }

  /**
   * Strip query params from URLs to avoid storing PII
   */
  sanitizeError(error) {
    const sanitized = { ...error };
    const stripQuery = (url) => {
      try { return new URL(url).origin + new URL(url).pathname; } catch { return url; }
    };
    if (sanitized.url) sanitized.url = stripQuery(sanitized.url);
    if (sanitized.filename) sanitized.filename = stripQuery(sanitized.filename);
    return sanitized;
  }

  /**
   * Load previously stored errors
   */
  loadStoredErrors() {
    try {
      const stored = localStorage.getItem('fnf_errors');
      if (stored) {
        this.errors = JSON.parse(stored);
      }
    } catch (e) {
      // Invalid data in localStorage
    }
  }

  /**
   * Send error to monitoring service
   */
  async sendToMonitoring(error) {
    // In production, this would send to a real monitoring service
    // For now, we'll prepare the data structure

    const payload = {
      ...error,
      context: {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        screen: {
          width: screen.width,
          height: screen.height
        },
        memory: performance.memory ? {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        } : null,
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        } : null
      }
    };

    // For development, just log
    if (config.isDevelopment) {
      // eslint-disable-next-line no-console -- dev-only diagnostic output
      console.log('Would send to monitoring:', payload);
      return;
    }

    // Send to Sentry via module export (no window.Sentry needed)
    if (config.monitoring.sentry.dsn) {
      sentryCaptureException(new Error(error.message), {
        error: payload,
        environment: config.env,
        version: config.appVersion
      });
    }

    // Send to LogRocket if configured
    if (config.monitoring.logRocket.enabled && window.LogRocket) {
      window.LogRocket.captureException(new Error(error.message));
    }

    // Send to custom endpoint if configured
    if (config.security.cspReportUri && error.type !== 'network') {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      fetch(config.security.cspReportUri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      }).catch(() => {
        // Silently fail - don't create infinite error loop
      }).finally(() => clearTimeout(timeoutId));
    }
  }

  /**
   * Monkey-patch console.error to capture errors
   */
  monkeyPatchConsole() {
    const originalError = console.error;
    this._originalConsoleError = originalError;
    let capturing = false;
    console.error = (...args) => {
      // Call original console.error
      originalError.apply(console, args);

      // Guard against re-entrancy (captureError may trigger console.error)
      if (capturing) return;
      capturing = true;

      try {
        const error = {
          type: 'console_error',
          message: args.map(arg => String(arg)).join(' '),
          timestamp: new Date().toISOString(),
          url: window.location.href
        };

        this.captureError(error);
      } finally {
        capturing = false;
      }
    };
  }

  /**
   * Set up network error capture
   */
  setupNetworkCapture() {
    // Intercept fetch errors
    const originalFetch = window.fetch;
    this._originalFetch = originalFetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);

        // Capture non-ok responses
        if (!response.ok) {
          this.captureError({
            type: 'network',
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: args[0],
            status: response.status,
            timestamp: new Date().toISOString()
          });
        }

        return response;
      } catch (error) {
        this.captureError({
          type: 'network',
          message: error.message,
          url: args[0],
          timestamp: new Date().toISOString()
        });
        throw error;
      }
    };

    // Intercept XMLHttpRequest errors
    const originalOpen = XMLHttpRequest.prototype.open;
    this._originalXhrOpen = originalOpen;
    const tracker = this;
    XMLHttpRequest.prototype.open = function(...args) {
      this.addEventListener('error', () => {
        tracker.captureError({
          type: 'network',
          message: 'XMLHttpRequest failed',
          url: args[1],
          method: args[0],
          timestamp: new Date().toISOString()
        });
      });

      return originalOpen.apply(this, args);
    };
  }

  /**
   * Manual error capture method
   */
  captureException(error, context = {}) {
    const errorObj = {
      type: 'manual',
      message: error.message || String(error),
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    this.captureError(errorObj);
  }

  /**
   * Capture custom message
   */
  captureMessage(message, level = 'error', context = {}) {
    const error = {
      type: 'message',
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    this.captureError(error);
  }

  /**
   * Get error statistics
   */
  getStats() {
    return {
      totalErrors: this.errors.length,
      errorCounts: Object.fromEntries(this.errorCounts),
      recentErrors: this.errors.slice(-10),
      environment: this.config.environment
    };
  }

  /**
   * Clear stored errors
   */
  clearErrors() {
    this.errors = [];
    this.errorCounts.clear();
    this.lastErrorTime.clear();

    if (this.config.enableLocalStorage) {
      localStorage.removeItem('fnf_errors');
    }
  }

  /**
   * Log helper
   */
  log(message, level = 'log') {
    if (this.config.environment === 'development') {
      // eslint-disable-next-line no-console -- dev-only log helper
      console[level](`[ErrorTracker] ${message}`);
    }
  }

  /**
   * Destroy error tracker
   */
  destroy() {
    window.removeEventListener('error', this.handleWindowError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);

    // Restore patched globals
    if (this._originalConsoleError) {
      console.error = this._originalConsoleError;
      this._originalConsoleError = null;
    }
    if (this._originalFetch) {
      window.fetch = this._originalFetch;
      this._originalFetch = null;
    }
    if (this._originalXhrOpen) {
      XMLHttpRequest.prototype.open = this._originalXhrOpen;
      this._originalXhrOpen = null;
    }

    this.initialized = false;
  }
}

// Create and export singleton instance
const errorTracker = new ErrorTracker();

// Initialization handled by main.js — no auto-init to avoid double initialization

export default errorTracker;