/**
 * @fileoverview Food-N-Force Website - Main JavaScript Entry Point
 * @description Clean, modular architecture without conflicts
 * @version 2.0.0
 * @license MIT
 */

// Import configuration
import config from './config/environment.js';

// Production debug flag from environment config
const DEBUG = config.features.debugMode;
const log = DEBUG ? console.log : () => {};

// Import Sentry error monitoring
import { initSentry } from './monitoring/sentry.js';

// Import monitoring modules
import errorTracker from './monitoring/error-tracker.js';
import performanceMonitor from './monitoring/performance-monitor.js';

// Initialize Sentry first (before any errors can occur)
initSentry();

// Import effects modules
import SmartScroll from './effects/smart-scroll.js';
import { initParticles } from './effects/particles.js';
import { hydrateGradientIcons } from './effects/gradient-icons.js';

// Import page-specific modules (side-effect only)
import './expertise-accordion.js';

import NewsletterPopup from './effects/newsletter-popup.js';
import { initCounters } from './effects/counters.js';

/**
 * @class FNFApp
 * @description Main Application Class - Coordinates all website functionality
 */
class FNFApp {
  /**
   * @constructor
   * @description Initialize the FNF application
   */
  constructor() {
    log('🏗️ FNFApp constructor called!');
    this.particles = null;
    this.animations = null;
    this.counters = null;
    this.newsletterPopup = null;
    this.smartScroll = null;
    this.isInitialized = false;

    // AbortController for centralized event listener cleanup
    this.abortController = new AbortController();

    // Performance monitoring
    this.performanceStartTime = performance.now();

    // Bind methods
    this.handleLoad = this.handleLoad.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);

    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeApp());
    } else {
      this.initializeApp();
    }

    // Set up event listeners with abort signal for cleanup
    const signal = this.abortController.signal;
    window.addEventListener('load', this.handleLoad, { signal });
    window.addEventListener('resize', this.handleResize, { signal });
    document.addEventListener('visibilitychange', this.handleVisibilityChange, { signal });
  }

  /**
   * @method initializeApp
   * @description Initialize all application systems
   * @throws {Error} If initialization fails
   */
  initializeApp() {
    try {
      // Add loading class to body
      document.body.classList.add('fnf-loading');

      // Initialize monitoring first to catch any initialization errors
      errorTracker.init();
      performanceMonitor.init();

      // Initialize core systems
      this.initParticleSystem();
      this.initAnimationSystem();
      this.initCounterSystem();
      this.initGradientIcons();
      this.initNewsletterPopup();
      this.initSmartScroll();
      this.initNavigation();
      this.initAccessibility();
      this.initPerformanceMonitoring();

      this.isInitialized = true;

      // Remove loading class after a short delay
      setTimeout(() => {
        document.body.classList.remove('fnf-loading');
        document.body.classList.add('fnf-loaded');
      }, 100);

      log('🎉 FNF App initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing FNF App:', error);
      errorTracker.captureException(error, { context: 'initializeApp' });
      this.handleInitializationError(error);
    }
  }

  initParticleSystem() {
    // Check feature flag
    if (!config.features.particles) {
      log('✨ Particle system disabled by feature flag');
      return;
    }

    try {
      this.particles = initParticles();
      if (this.particles) {
        log('✨ Particle system initialized');
      }
    } catch (error) {
      console.error('❌ Particle system failed to initialize:', error);
    }
  }

  initAnimationSystem() {
    // Check feature flag
    if (!config.features.animations) {
      log('🎬 Animation system disabled by feature flag');
      return;
    }

    log('🎬 Animation system SKIPPED for testing');
    // Temporarily disabled - will be enabled when animations module is ready
  }

  initCounterSystem() {
    log('🔢 Initializing counter system...');
    this.counters = initCounters();
  }

  initGradientIcons() {
    log('🎨 Initializing gradient icon system...');
    try {
      hydrateGradientIcons(document);
      log('🎨 Gradient icons hydrated successfully');
    } catch (error) {
      console.error('❌ Gradient icon system failed to initialize:', error);
    }
  }

  initNewsletterPopup() {
    // Check feature flag
    if (!config.features.newsletter) {
      log('📧 Newsletter popup disabled by feature flag');
      return;
    }

    log('📧 MAIN.JS: Initializing newsletter popup...');
    try {
      this.newsletterPopup = new NewsletterPopup();
      log('📧 MAIN.JS: Newsletter popup initialized successfully');
    } catch (error) {
      console.error('📧 MAIN.JS: Error initializing newsletter popup:', error);
    }
  }

  initSmartScroll() {
    try {
      this.smartScroll = new SmartScroll({
        hideOnScroll: true,
        scrollThreshold: 100,
        offset: 80
      });
      log('📜 Smart scroll system initialized');
    } catch (error) {
      console.error('❌ Smart scroll failed to initialize:', error);
    }
  }

  initNavigation() {
    // Enhanced navigation functionality
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.querySelectorAll('.fnf-nav__mobile-link');
    const signal = this.abortController.signal;

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (navToggle) {
          navToggle.checked = false;
        }
      }, { signal });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (event) => {
      const nav = document.querySelector('.fnf-nav');
      const isNavClick = nav && nav.contains(event.target);

      if (!isNavClick && navToggle && navToggle.checked) {
        navToggle.checked = false;
      }
    }, { signal });

    // Handle keyboard navigation
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navToggle && navToggle.checked) {
        navToggle.checked = false;
        navToggle.focus();
      }
    }, { signal });

    log('🧭 Navigation system initialized');
  }

  initAccessibility() {
    // Enhanced focus management
    this.initFocusManagement();

    // Skip link functionality
    this.initSkipLinks();

    // ARIA live region for dynamic content
    this.createLiveRegion();

    log('♿ Accessibility features initialized');
  }

  initFocusManagement() {
    const signal = this.abortController.signal;

    // Improve focus visibility for keyboard users
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        document.body.classList.add('fnf-keyboard-user');
      }
    }, { signal });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('fnf-keyboard-user');
    }, { signal });

    // Focus trap for mobile menu
    const navToggle = document.getElementById('nav-toggle');
    const mobileMenu = document.querySelector('.fnf-nav__mobile');

    if (navToggle && mobileMenu) {
      navToggle.addEventListener('change', () => {
        if (navToggle.checked) {
          // Focus first link in mobile menu
          const firstLink = mobileMenu.querySelector('a');
          if (firstLink) {
            setTimeout(() => firstLink.focus(), 100);
          }
        }
      });
    }
  }

  initSkipLinks() {
    const skipLinks = document.querySelectorAll('.skip-link');
    const signal = this.abortController.signal;
    skipLinks.forEach(link => {
      link.addEventListener('click', () => {
        const href = link.getAttribute('href');
        if (!href) return;
        const targetId = href.substring(1);
        const target = document.getElementById(targetId);

        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }, { signal });
    });
  }

  createLiveRegion() {
    // Create a live region for announcing dynamic changes
    const liveRegion = document.createElement('div');
    liveRegion.id = 'fnf-live-region';
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(liveRegion);

    // Expose method to announce messages
    window.fnfAnnounce = (message) => {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    };
  }

  initPerformanceMonitoring() {
    // Initialize comprehensive performance monitoring
    try {
      // Mark app initialization start
      performanceMonitor.mark('fnf-app-init-start');

      // Monitor long tasks
      if ('PerformanceObserver' in window) {
        try {
          const longTaskObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
              if (entry.duration > 50) {
                console.warn('⚠️ Long task detected:', entry.duration + 'ms');

                // Report long task to error tracker
                errorTracker.captureMessage(`Long task detected: ${entry.duration}ms`, 'warning', {
                  duration: entry.duration,
                  startTime: entry.startTime
                });

                // Reduce particle count if performance is poor
                if (this.particles && entry.duration > 100) {
                  const stats = this.particles.getStats();
                  if (stats.particleCount > 4) {
                    this.particles.setParticleCount(stats.particleCount - 1);
                    log('🎯 Reduced particle count for performance');
                  }
                }
              }
            });
          });

          longTaskObserver.observe({ entryTypes: ['longtask'] });
        } catch (error) {
          console.warn('Long task monitoring not available:', error);
        }
      }

      // Mark app initialization end
      performanceMonitor.mark('fnf-app-init-end');
      performanceMonitor.measure('fnf-app-init', 'fnf-app-init-start', 'fnf-app-init-end');

      // Log initialization time
      const initTime = performance.now() - this.performanceStartTime;
      log(`⚡ App initialized in ${initTime.toFixed(2)}ms`);

      // Report metrics after page load
      if (document.readyState === 'complete') {
        this.reportPerformanceMetrics();
      } else {
        window.addEventListener('load', () => this.reportPerformanceMetrics());
      }
    } catch (error) {
      errorTracker.captureException(error, { context: 'initPerformanceMonitoring' });
    }
  }

  reportPerformanceMetrics() {
    // Report performance metrics after a delay to ensure all metrics are collected
    setTimeout(() => {
      const metrics = performanceMonitor.getMetrics();
      const assessment = performanceMonitor.getCoreWebVitalsAssessment();

      log('📊 Performance Metrics:', metrics);
      log('🎯 Core Web Vitals Assessment:', assessment);

      // Report poor performance metrics as warnings
      Object.entries(assessment).forEach(([metric, data]) => {
        if (data.rating === 'poor') {
          errorTracker.captureMessage(
            `Poor ${metric} performance: ${data.value}`,
            'warning',
            { metric, value: data.value, rating: data.rating }
          );
        }
      });
    }, 3000);
  }

  handleLoad() {
    // Page fully loaded
    const loadTime = performance.now() - this.performanceStartTime;
    log(`🚀 Page loaded in ${loadTime.toFixed(2)}ms`);

  }

  handleResize() {
    // Debounced resize handler
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      log('📐 Viewport resized, systems refreshed');
    }, 250);
  }

  handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden, pause expensive operations
      if (this.particles) {
        this.particles.pause();
      }
    } else {
      // Page is visible, resume operations
      if (this.particles) {
        this.particles.resume();
      }
    }
  }

  handleInitializationError(error) {
    // Graceful degradation
    document.body.classList.remove('fnf-loading');
    document.body.classList.add('fnf-error');

    // Show error message to developers
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const errorDiv = document.createElement('div');
      errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 1rem;
        border-radius: 8px;
        z-index: 10000;
        font-family: monospace;
        max-width: 300px;
      `;
      errorDiv.textContent = `FNF App Error: ${error.message}`;
      document.body.appendChild(errorDiv);

      setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.parentNode.removeChild(errorDiv);
        }
      }, 5000);
    }
  }

  // Public API
  getStats() {
    return {
      isInitialized: this.isInitialized,
      particles: this.particles ? this.particles.getStats() : null,
      newsletterPopup: this.newsletterPopup ? this.newsletterPopup : null,
      loadTime: performance.now() - this.performanceStartTime
    };
  }

  destroy() {
    clearTimeout(this.resizeTimeout);

    if (this.particles) {
      this.particles.destroy();
    }
    if (this.smartScroll) {
      this.smartScroll.destroy();
    }

    this.abortController.abort();
    log('🧹 FNF App destroyed');
  }
}

// Initialize the application
log('🎬 About to create FNFApp instance...');
const app = new FNFApp();
log('✅ FNFApp instance created:', app);

// Signal that modules loaded successfully
if (typeof window !== 'undefined') {
  window.modulesLoaded = true;
}

// Expose to global scope for debugging (development only)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.fnfApp = app;
  window.fnfDebug = {
    getStats: () => app.getStats(),
    particles: () => app.particles,
    animations: () => app.animations
  };
}

export default FNFApp;