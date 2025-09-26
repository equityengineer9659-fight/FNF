/**
 * Food-N-Force Website - Main JavaScript Entry Point
 * Clean, modular architecture without conflicts
 */

// Production debug flag - set to false for production builds
const DEBUG = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const log = DEBUG ? log : () => {};

// Import effects modules
import SmartScroll from './effects/smart-scroll.js';
import { initParticles } from './effects/particles.js';

// Keep other imports commented for now
/*
import { initAnimations } from './effects/animations.js';
*/
import NewsletterPopup from './effects/newsletter-popup.js';
import { initCounters } from './effects/counters.js';

/**
 * Main Application Class
 * Coordinates all website functionality
 */
class FNFApp {
  constructor() {
    log('🏗️ FNFApp constructor called!');
    this.particles = null;
    this.animations = null;
    this.counters = null;
    this.newsletterPopup = null;
    this.smartScroll = null;
    this.isInitialized = false;

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

    // Set up event listeners
    window.addEventListener('load', this.handleLoad);
    window.addEventListener('resize', this.handleResize);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  initializeApp() {
    try {
      // Add loading class to body
      document.body.classList.add('fnf-loading');

      // Initialize core systems
      this.initParticleSystem();
      this.initAnimationSystem();
      this.initCounterSystem();
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
      this.handleInitializationError(error);
    }
  }

  initParticleSystem() {
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
    log('🎬 Animation system SKIPPED for testing');
    // Temporarily disabled
  }

  initCounterSystem() {
    log('🔢 Initializing counter system...');
    this.counters = initCounters();
  }

  initNewsletterPopup() {
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

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (navToggle) {
          navToggle.checked = false;
        }
      });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', (event) => {
      const nav = document.querySelector('.fnf-nav');
      const isNavClick = nav && nav.contains(event.target);

      if (!isNavClick && navToggle && navToggle.checked) {
        navToggle.checked = false;
      }
    });

    // Handle keyboard navigation
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navToggle && navToggle.checked) {
        navToggle.checked = false;
        navToggle.focus();
      }
    });

    // HAMBURGER FIX: Force hamburger lines to be white
    this.forceHamburgerWhite();

    log('🧭 Navigation system initialized');
  }

  forceHamburgerWhite() {
    // Force hamburger lines to be white using JavaScript
    const forceWhite = () => {
      const hamburgerLines = document.querySelectorAll('.hamburger-line');
      hamburgerLines.forEach(line => {
        line.style.setProperty('background', '#ffffff', 'important');
        line.style.setProperty('background-color', '#ffffff', 'important');
        line.style.setProperty('color', '#ffffff', 'important');
        line.style.setProperty('border-color', '#ffffff', 'important');
        line.style.setProperty('filter', 'none', 'important');
        line.style.setProperty('mix-blend-mode', 'normal', 'important');
      });
    };

    // Apply immediately
    forceWhite();

    // Also apply after a short delay in case elements load later
    setTimeout(forceWhite, 100);
    setTimeout(forceWhite, 500);

    // Listen for dark mode changes and reapply
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addListener((e) => {
        if (e.matches) {
          setTimeout(forceWhite, 50);
        }
      });
    }

    log('🍔 Hamburger lines forced to white');
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
    // Improve focus visibility for keyboard users
    let isUsingKeyboard = false;

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        isUsingKeyboard = true;
        document.body.classList.add('fnf-keyboard-user');
      }
    });

    document.addEventListener('mousedown', () => {
      isUsingKeyboard = false;
      document.body.classList.remove('fnf-keyboard-user');
    });

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
    skipLinks.forEach(link => {
      link.addEventListener('click', (event) => {
        const targetId = link.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);

        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
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
    // Monitor performance and adjust accordingly
    if ('PerformanceObserver' in window) {
      try {
        // Monitor long tasks
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) {
              console.warn('⚠️ Long task detected:', entry.duration + 'ms');

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
        console.warn('Performance monitoring not available:', error);
      }
    }

    // Log initialization time
    const initTime = performance.now() - this.performanceStartTime;
    log(`⚡ App initialized in ${initTime.toFixed(2)}ms`);
  }

  handleLoad() {
    // Page fully loaded
    const loadTime = performance.now() - this.performanceStartTime;
    log(`🚀 Page loaded in ${loadTime.toFixed(2)}ms`);

    // Refresh animations to catch any late-loading content
    if (this.animations && this.animations.controller) {
      this.animations.controller.refresh();
    }
  }

  handleResize() {
    // Debounced resize handler
    clearTimeout(this.resizeTimeout);
    this.resizeTimeout = setTimeout(() => {
      // Refresh systems that depend on viewport size
      if (this.animations && this.animations.controller) {
        this.animations.controller.refresh();
      }

      log('📐 Viewport resized, systems refreshed');
    }, 250);
  }

  handleVisibilityChange() {
    if (document.hidden) {
      // Page is hidden, pause expensive operations
      if (this.particles) {
        this.particles.pause();
      }
      if (this.animations && this.animations.controller) {
        this.animations.controller.pause();
      }
    } else {
      // Page is visible, resume operations
      if (this.particles) {
        this.particles.resume();
      }
      if (this.animations && this.animations.controller) {
        this.animations.controller.resume();
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
    // Clean up resources
    if (this.particles) {
      this.particles.destroy();
    }
    if (this.animations && this.animations.controller) {
      this.animations.controller.destroy();
    }
    if (this.smartScroll) {
      this.smartScroll.destroy();
    }

    // Remove event listeners
    window.removeEventListener('load', this.handleLoad);
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);

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