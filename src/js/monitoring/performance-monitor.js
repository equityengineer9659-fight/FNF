/**
 * Performance Monitoring Module
 * Tracks Core Web Vitals and performance metrics
 * @module PerformanceMonitor
 */

import config from '../config/environment.js';

class PerformanceMonitor {
  constructor(customConfig = {}) {
    this.config = {
      trackCoreWebVitals: true,
      trackResources: true,
      trackUserTiming: true,
      sampleRate: config.performance.sampleRate,
      ...customConfig
    };

    this.metrics = {
      FCP: null, // First Contentful Paint
      LCP: null, // Largest Contentful Paint
      FID: null, // First Input Delay
      CLS: null, // Cumulative Layout Shift
      TTFB: null, // Time to First Byte
      INP: null, // Interaction to Next Paint
      resources: [],
      userTimings: []
    };

    this.observers = new Map();
    this.initialized = false;
  }

  /**
   * Initialize performance monitoring
   */
  init() {
    if (this.initialized) return;

    // Check if should sample this session
    if (Math.random() > this.config.sampleRate) {
      console.log('[PerformanceMonitor] Session not sampled');
      return;
    }

    // Track navigation timing
    this.trackNavigationTiming();

    // Track Core Web Vitals
    if (this.config.trackCoreWebVitals) {
      this.trackCoreWebVitals();
    }

    // Track resource timing
    if (this.config.trackResources) {
      this.trackResourceTiming();
    }

    // Track user timing
    if (this.config.trackUserTiming) {
      this.trackUserTiming();
    }

    this.initialized = true;
    console.log('[PerformanceMonitor] Initialized');
  }

  /**
   * Track navigation timing metrics
   */
  trackNavigationTiming() {
    if ('PerformanceNavigationTiming' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            // Time to First Byte
            this.metrics.TTFB = entry.responseStart - entry.requestStart;

            // DNS lookup time
            this.metrics.dnsTime = entry.domainLookupEnd - entry.domainLookupStart;

            // TCP connection time
            this.metrics.tcpTime = entry.connectEnd - entry.connectStart;

            // Request time
            this.metrics.requestTime = entry.responseEnd - entry.requestStart;

            // DOM processing time
            this.metrics.domProcessingTime = entry.domComplete - entry.domInteractive;

            this.reportMetric('navigation', {
              TTFB: this.metrics.TTFB,
              dnsTime: this.metrics.dnsTime,
              tcpTime: this.metrics.tcpTime,
              requestTime: this.metrics.requestTime,
              domProcessingTime: this.metrics.domProcessingTime
            });
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', observer);
    }
  }

  /**
   * Track Core Web Vitals
   */
  trackCoreWebVitals() {
    // First Contentful Paint (FCP)
    this.observePaint('first-contentful-paint', (entry) => {
      this.metrics.FCP = Math.round(entry.startTime);
      this.reportMetric('FCP', this.metrics.FCP);
    });

    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.LCP = Math.round(lastEntry.startTime);
        this.reportMetric('LCP', this.metrics.LCP);
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);
    }

    // First Input Delay (FID)
    if ('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('first-input')) {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.FID = Math.round(entry.processingStart - entry.startTime);
          this.reportMetric('FID', this.metrics.FID);
        }
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);
    }

    // Cumulative Layout Shift (CLS)
    if ('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
      let clsScore = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
          }
        }
        this.metrics.CLS = Number(clsScore.toFixed(4));
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', clsObserver);
    }

    // Interaction to Next Paint (INP) - newer metric
    this.trackINP();
  }

  /**
   * Track Interaction to Next Paint
   */
  trackINP() {
    if (!('PerformanceObserver' in window)) return;

    const interactions = [];

    const processInteractions = () => {
      if (interactions.length > 0) {
        // Calculate 98th percentile
        interactions.sort((a, b) => b - a);
        const index = Math.floor(interactions.length * 0.98);
        this.metrics.INP = interactions[index];
        this.reportMetric('INP', this.metrics.INP);
      }
    };

    if (PerformanceObserver.supportedEntryTypes?.includes('event')) {
      const inpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.interactionId) {
            interactions.push(entry.duration);
            processInteractions();
          }
        }
      });

      inpObserver.observe({ entryTypes: ['event'], buffered: true });
      this.observers.set('inp', inpObserver);
    }
  }

  /**
   * Observe paint timing
   */
  observePaint(paintType, callback) {
    if ('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('paint')) {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === paintType) {
            callback(entry);
          }
        }
      });

      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.set(paintType, paintObserver);
    }
  }

  /**
   * Track resource timing
   */
  trackResourceTiming() {
    if ('PerformanceObserver' in window && PerformanceObserver.supportedEntryTypes?.includes('resource')) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = {
            name: entry.name,
            type: entry.initiatorType,
            duration: Math.round(entry.duration),
            size: entry.transferSize,
            startTime: Math.round(entry.startTime)
          };

          this.metrics.resources.push(resource);

          // Report slow resources
          if (resource.duration > 1000) {
            this.reportMetric('slow_resource', resource);
          }
        }
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);
    }
  }

  /**
   * Track user timing (custom marks and measures)
   */
  trackUserTiming() {
    if ('PerformanceObserver' in window) {
      if (PerformanceObserver.supportedEntryTypes?.includes('mark')) {
        const markObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.metrics.userTimings.push({
              type: 'mark',
              name: entry.name,
              startTime: Math.round(entry.startTime)
            });
          }
        });

        markObserver.observe({ entryTypes: ['mark'] });
        this.observers.set('mark', markObserver);
      }

      if (PerformanceObserver.supportedEntryTypes?.includes('measure')) {
        const measureObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.metrics.userTimings.push({
              type: 'measure',
              name: entry.name,
              duration: Math.round(entry.duration),
              startTime: Math.round(entry.startTime)
            });

            this.reportMetric('user_timing', {
              name: entry.name,
              duration: entry.duration
            });
          }
        });

        measureObserver.observe({ entryTypes: ['measure'] });
        this.observers.set('measure', measureObserver);
      }
    }
  }

  /**
   * Create a custom mark
   */
  mark(name) {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  }

  /**
   * Create a custom measure
   */
  measure(name, startMark, endMark) {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (e) {
        console.error(`Failed to measure ${name}:`, e);
      }
    }
  }

  /**
   * Report metric to monitoring service
   */
  reportMetric(name, value) {
    const report = {
      metric: name,
      value: value,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // In development, just log
    if (config.isDevelopment) {
      console.log(`[PerformanceMonitor] ${name}:`, value);
    }

    // Send to Google Analytics if configured
    if (config.monitoring.ga.enabled && window.gtag) {
      window.gtag('event', name, {
        value: typeof value === 'object' ? JSON.stringify(value) : value,
        event_category: 'Performance',
        non_interaction: true
      });
    }

    // Send to custom monitoring endpoint
    if (config.security.cspReportUri && !config.isDevelopment) {
      fetch(config.security.cspReportUri, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      }).catch(() => {
        // Silently fail
      });
    }
  }

  /**
   * Get all collected metrics
   */
  getMetrics() {
    // Report final CLS when getting metrics
    if (this.metrics.CLS !== null) {
      this.reportMetric('CLS', this.metrics.CLS);
    }

    return {
      coreWebVitals: {
        FCP: this.metrics.FCP,
        LCP: this.metrics.LCP,
        FID: this.metrics.FID,
        CLS: this.metrics.CLS,
        TTFB: this.metrics.TTFB,
        INP: this.metrics.INP
      },
      navigation: {
        dnsTime: this.metrics.dnsTime,
        tcpTime: this.metrics.tcpTime,
        requestTime: this.metrics.requestTime,
        domProcessingTime: this.metrics.domProcessingTime
      },
      resources: this.metrics.resources.slice(0, 20), // Top 20 resources
      userTimings: this.metrics.userTimings
    };
  }

  /**
   * Get Core Web Vitals assessment
   */
  getCoreWebVitalsAssessment() {
    const assessments = {};

    // FCP: Good < 1.8s, Needs Improvement < 3s, Poor >= 3s
    if (this.metrics.FCP !== null) {
      assessments.FCP = {
        value: this.metrics.FCP,
        rating: this.metrics.FCP < 1800 ? 'good' : this.metrics.FCP < 3000 ? 'needs-improvement' : 'poor'
      };
    }

    // LCP: Good < 2.5s, Needs Improvement < 4s, Poor >= 4s
    if (this.metrics.LCP !== null) {
      assessments.LCP = {
        value: this.metrics.LCP,
        rating: this.metrics.LCP < 2500 ? 'good' : this.metrics.LCP < 4000 ? 'needs-improvement' : 'poor'
      };
    }

    // FID: Good < 100ms, Needs Improvement < 300ms, Poor >= 300ms
    if (this.metrics.FID !== null) {
      assessments.FID = {
        value: this.metrics.FID,
        rating: this.metrics.FID < 100 ? 'good' : this.metrics.FID < 300 ? 'needs-improvement' : 'poor'
      };
    }

    // CLS: Good < 0.1, Needs Improvement < 0.25, Poor >= 0.25
    if (this.metrics.CLS !== null) {
      assessments.CLS = {
        value: this.metrics.CLS,
        rating: this.metrics.CLS < 0.1 ? 'good' : this.metrics.CLS < 0.25 ? 'needs-improvement' : 'poor'
      };
    }

    // INP: Good < 200ms, Needs Improvement < 500ms, Poor >= 500ms
    if (this.metrics.INP !== null) {
      assessments.INP = {
        value: this.metrics.INP,
        rating: this.metrics.INP < 200 ? 'good' : this.metrics.INP < 500 ? 'needs-improvement' : 'poor'
      };
    }

    return assessments;
  }

  /**
   * Destroy performance monitor
   */
  destroy() {
    for (const [key, observer] of this.observers) {
      observer.disconnect();
    }
    this.observers.clear();
    this.initialized = false;
  }
}

// Create and export singleton instance
const performanceMonitor = new PerformanceMonitor();

// Initialization handled by main.js — no auto-init to avoid double initialization

export default performanceMonitor;