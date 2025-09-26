/**
 * PHASE 4.1A: ENHANCED HTML-FIRST ARCHITECTURE INITIALIZATION
 * Main entry point for the Enhanced Architecture implementation
 * Maintains backward compatibility while adding modern Web Components and ES6 modules
 */

import ComponentLoader from './modules/component-loader.js';

/**
 * Enhanced Architecture Manager
 * Coordinates the initialization and lifecycle of the enhanced architecture
 */
class EnhancedArchitectureManager {
  constructor() {
    this.isInitialized = false;
    this.initStartTime = null;
    this.features = {
      webComponents: false,
      es6Modules: false,
      progressiveEnhancement: false
    };
    
    // Compatibility flags
    this.browserSupport = {
      customElements: typeof window.customElements !== 'undefined',
      modules: 'noModule' in document.createElement('script'),
      es6: (() => {
        try {
          return new Function('() => {}');
        } catch (e) {
          return false;
        }
      })()
    };
  }

  /**
   * Initialize the enhanced architecture
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn('EnhancedArchitecture: Already initialized');
      return;
    }

    this.initStartTime = performance.now();
    
    console.log('🚀 Phase 4.1A: Enhanced HTML-First Architecture Starting...');
    console.log('🔧 Browser Support Check:', this.browserSupport);

    try {
      // Step 1: Validate browser compatibility
      this.validateBrowserSupport();

      // Step 2: Initialize core systems
      await this.initializeCoreSystem();

      // Step 3: Set up progressive enhancement
      await this.setupProgressiveEnhancement();

      // Step 4: Initialize performance monitoring
      this.setupPerformanceMonitoring();

      // Step 5: Set up graceful degradation
      this.setupGracefulDegradation();

      this.isInitialized = true;
      
      const totalInitTime = performance.now() - this.initStartTime;
      console.log(`✅ Enhanced Architecture: Initialized in ${totalInitTime.toFixed(2)}ms`);
      
      // Report initialization success
      this.reportInitializationStatus();

    } catch (error) {
      console.error('❌ Enhanced Architecture: Initialization failed:', error);
      console.log('🔄 Falling back to HTML-first baseline functionality');
      
      // Ensure baseline functionality still works
      this.ensureBaselineFunctionality();
    }
  }

  /**
   * Validate browser support for enhanced features
   */
  validateBrowserSupport() {
    console.log('🔍 Validating browser support for enhanced features...');

    if (!this.browserSupport.customElements) {
      console.warn('⚠️ Web Components not supported - using HTML-first fallback');
    } else {
      this.features.webComponents = true;
      console.log('✅ Web Components supported');
    }

    if (!this.browserSupport.modules) {
      console.warn('⚠️ ES6 modules not fully supported - using progressive loading');
    } else {
      this.features.es6Modules = true;
      console.log('✅ ES6 modules supported');
    }

    if (!this.browserSupport.es6) {
      console.warn('⚠️ Limited ES6 support - using compatibility mode');
    }

    console.log('🎯 Enhanced features available:', this.features);
  }

  /**
   * Initialize core system components
   */
  async initializeCoreSystem() {
    console.log('⚙️ Initializing core system...');

    // Initialize component loader if supported
    if (this.features.webComponents && this.features.es6Modules) {
      try {
        await ComponentLoader.initialize();
        console.log('✅ Component loader initialized');
      } catch (error) {
        console.error('❌ Component loader failed:', error);
        console.log('🔄 Continuing with HTML-first approach');
      }
    }

    // Initialize performance tracking
    this.initializePerformanceTracking();

    // Initialize accessibility enhancements
    this.initializeAccessibilityEnhancements();
  }

  /**
   * Set up progressive enhancement
   */
  async setupProgressiveEnhancement() {
    console.log('📈 Setting up progressive enhancement...');

    this.features.progressiveEnhancement = true;

    // Enhance existing navigation if Web Components are supported
    if (this.features.webComponents) {
      await this.enhanceExistingNavigation();
    }

    // Set up lazy loading for future enhancements
    this.setupLazyEnhancement();

    console.log('✅ Progressive enhancement configured');
  }

  /**
   * Enhance existing navigation with Web Components
   */
  async enhanceExistingNavigation() {
    console.log('🧭 Enhancing existing navigation...');

    // Verify existing navigation elements are present
    const navbar = document.querySelector('.navbar');
    const navMenu = document.querySelector('.nav-menu');
    const mobileToggle = document.querySelector('.mobile-nav-toggle');

    if (!navbar || !navMenu || !mobileToggle) {
      console.warn('⚠️ Navigation elements missing - skipping enhancement');
      return;
    }

    try {
      // Load navigation component if available
      if (ComponentLoader.isInitialized) {
        await ComponentLoader.loadComponent('navigation-component');
        console.log('✅ Navigation enhanced with Web Components');
      }
    } catch (error) {
      console.error('❌ Navigation enhancement failed:', error);
      console.log('🔄 Navigation fallback to HTML-first implementation');
    }
  }

  /**
   * Set up lazy enhancement for future features
   */
  setupLazyEnhancement() {
    // Use Intersection Observer for lazy loading enhancements
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.enhanceElementOnDemand(entry.target);
          }
        });
      }, {
        rootMargin: '100px' // Start enhancing 100px before element is visible
      });

      // Observe elements that could benefit from enhancement
      const enhanceableElements = document.querySelectorAll('[data-enhance]');
      enhanceableElements.forEach(el => observer.observe(el));

      console.log(`👀 Lazy enhancement observer watching ${enhanceableElements.length} elements`);
    }
  }

  /**
   * Enhance element on demand
   */
  async enhanceElementOnDemand(element) {
    const enhanceType = element.getAttribute('data-enhance');
    
    if (ComponentLoader.isInitialized && enhanceType) {
      try {
        await ComponentLoader.loadComponentManually(enhanceType, element);
        console.log(`⚡ Element enhanced: ${enhanceType}`);
      } catch (error) {
        console.error(`❌ Failed to enhance element: ${enhanceType}`, error);
      }
    }
  }

  /**
   * Initialize performance tracking
   */
  initializePerformanceTracking() {
    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Track Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log(`📊 LCP: ${lastEntry.startTime.toFixed(2)}ms`);
      });
      
      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.log('⚠️ LCP monitoring not available');
      }

      // Track Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((entryList) => {
        let clsValue = 0;
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        if (clsValue > 0) {
          console.log(`📊 CLS: ${clsValue.toFixed(4)}`);
        }
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.log('⚠️ CLS monitoring not available');
      }
    }

    // Track bundle size impact
    this.trackBundleSize();
  }

  /**
   * Track bundle size impact
   */
  trackBundleSize() {
    if ('performance' in window && performance.getEntriesByType) {
      const resourceEntries = performance.getEntriesByType('resource');
      let totalJSSize = 0;
      let totalCSSSize = 0;

      resourceEntries.forEach(entry => {
        if (entry.name.includes('.js')) {
          totalJSSize += entry.transferSize || 0;
        } else if (entry.name.includes('.css')) {
          totalCSSSize += entry.transferSize || 0;
        }
      });

      const totalSizeKB = (totalJSSize + totalCSSSize) / 1024;
      console.log(`📦 Bundle Size: ${totalSizeKB.toFixed(1)}KB (JS: ${(totalJSSize/1024).toFixed(1)}KB, CSS: ${(totalCSSSize/1024).toFixed(1)}KB)`);

      // Check against Phase 4 budget (290KB total)
      if (totalSizeKB > 290) {
        console.warn(`⚠️ Bundle size exceeds Phase 4 budget: ${totalSizeKB.toFixed(1)}KB > 290KB`);
      } else {
        console.log(`✅ Bundle size within Phase 4 budget: ${totalSizeKB.toFixed(1)}KB < 290KB`);
      }
    }
  }

  /**
   * Initialize accessibility enhancements
   */
  initializeAccessibilityEnhancements() {
    // Enhanced focus management
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-nav');
    });

    // Enhanced ARIA live regions
    this.setupLiveRegions();

    console.log('♿ Accessibility enhancements initialized');
  }

  /**
   * Set up ARIA live regions for dynamic content
   */
  setupLiveRegions() {
    // Create live region for status messages
    let liveRegion = document.getElementById('aria-live-status');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'aria-live-status';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }

    // Expose live region announcement function
    window.announceToScreenReader = (message) => {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    };
  }

  /**
   * Set up performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor for performance regressions
    setInterval(() => {
      if (ComponentLoader.isInitialized) {
        const metrics = ComponentLoader.getPerformanceMetrics();
        if (metrics.averageLoadTime > 100) { // 100ms threshold
          console.warn(`⚠️ Component load time high: ${metrics.averageLoadTime.toFixed(2)}ms`);
        }
      }
    }, 30000); // Check every 30 seconds

    console.log('📊 Performance monitoring active');
  }

  /**
   * Set up graceful degradation
   */
  setupGracefulDegradation() {
    // Handle errors gracefully
    window.addEventListener('error', (event) => {
      if (event.filename && event.filename.includes('enhanced-architecture')) {
        console.error('❌ Enhanced architecture error:', event.error);
        console.log('🔄 Graceful degradation: HTML-first functionality preserved');
        event.preventDefault(); // Prevent default error handling
      }
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message && event.reason.message.includes('Component')) {
        console.error('❌ Component promise rejection:', event.reason);
        console.log('🔄 Graceful degradation: Continuing with available functionality');
        event.preventDefault();
      }
    });

    console.log('🛡️ Graceful degradation configured');
  }

  /**
   * Ensure baseline functionality works
   */
  ensureBaselineFunctionality() {
    // Ensure mobile navigation toggle works even if enhancement fails
    const mobileToggle = document.querySelector('.mobile-nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileToggle && navMenu && !mobileToggle.onclick) {
      mobileToggle.onclick = function() {
        navMenu.classList.toggle('active');
        this.classList.toggle('active');
        console.log('📱 Baseline mobile navigation toggle active');
      };

      console.log('🔧 Baseline functionality ensured');
    }
  }

  /**
   * Report initialization status
   */
  reportInitializationStatus() {
    const report = {
      initialized: this.isInitialized,
      initTime: performance.now() - this.initStartTime,
      features: this.features,
      browserSupport: this.browserSupport,
      componentsLoaded: ComponentLoader.isInitialized ? ComponentLoader.getPerformanceMetrics().componentsLoaded : 0
    };

    console.log('📋 Enhanced Architecture Status:', report);

    // Make status available globally for debugging
    window.EnhancedArchitectureStatus = report;
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      features: this.features,
      browserSupport: this.browserSupport,
      componentLoader: ComponentLoader.isInitialized ? ComponentLoader.getPerformanceMetrics() : null
    };
  }
}

// Create and initialize the enhanced architecture
const enhancedArchitecture = new EnhancedArchitectureManager();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    enhancedArchitecture.initialize();
  });
} else {
  // DOM already loaded
  enhancedArchitecture.initialize();
}

// Export for module usage
export default enhancedArchitecture;

// Also expose globally for debugging
window.EnhancedArchitecture = enhancedArchitecture;