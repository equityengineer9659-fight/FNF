/**
 * PHASE 4.1A: ES6 MODULE COMPONENT LOADER
 * Progressive enhancement architecture for loading and initializing Web Components
 * Maintains HTML-first approach with optional JavaScript enhancement
 */

class ComponentLoader {
  constructor() {
    this.loadedComponents = new Map();
    this.componentRegistry = new Map();
    this.loadPromises = new Map();
    this.isInitialized = false;
    
    // Performance tracking
    this.performanceMetrics = {
      startTime: performance.now(),
      loadTimes: new Map(),
      initTimes: new Map()
    };
  }

  /**
   * Initialize the component loader system
   */
  async initialize() {
    if (this.isInitialized) {
      console.warn('ComponentLoader: Already initialized');
      return;
    }

    console.log('🚀 ComponentLoader: Initializing Enhanced Architecture...');
    
    try {
      // Register available components
      await this.registerCoreComponents();
      
      // Auto-discover and initialize components in the DOM
      await this.autoDiscoverComponents();
      
      // Set up progressive enhancement listeners
      this.setupProgressiveEnhancement();
      
      this.isInitialized = true;
      
      const totalTime = performance.now() - this.performanceMetrics.startTime;
      console.log(`✅ ComponentLoader: Initialized in ${totalTime.toFixed(2)}ms`);
      
    } catch (error) {
      console.error('❌ ComponentLoader: Initialization failed:', error);
      // Graceful degradation - HTML-first navigation still works
    }
  }

  /**
   * Register core components that are available for loading
   */
  async registerCoreComponents() {
    console.log('📋 ComponentLoader: Registering core components...');
    
    // Register navigation component
    this.componentRegistry.set('navigation-component', {
      module: () => import('./navigation-component.js'),
      selector: '.navbar, .nav-menu, .mobile-nav-toggle',
      priority: 1, // High priority for navigation
      autoInit: true
    });

    // Register future components here
    // this.componentRegistry.set('search-component', { ... });
    // this.componentRegistry.set('modal-component', { ... });
    
    console.log(`📦 ComponentLoader: ${this.componentRegistry.size} components registered`);
  }

  /**
   * Auto-discover components in the current DOM
   */
  async autoDiscoverComponents() {
    console.log('🔍 ComponentLoader: Auto-discovering components in DOM...');
    
    const discoveredComponents = [];
    
    // Check each registered component
    for (const [componentName, config] of this.componentRegistry) {
      if (config.autoInit && document.querySelector(config.selector)) {
        discoveredComponents.push({
          name: componentName,
          config: config,
          priority: config.priority || 0
        });
        
        console.log(`🎯 ComponentLoader: Found ${componentName} in DOM`);
      }
    }

    // Sort by priority (higher first)
    discoveredComponents.sort((a, b) => b.priority - a.priority);

    // Initialize components in priority order
    for (const component of discoveredComponents) {
      await this.loadComponent(component.name);
    }

    console.log(`✅ ComponentLoader: ${discoveredComponents.length} components discovered and initialized`);
  }

  /**
   * Load and initialize a specific component
   */
  async loadComponent(componentName) {
    if (this.loadedComponents.has(componentName)) {
      console.log(`⚡ ComponentLoader: ${componentName} already loaded`);
      return this.loadedComponents.get(componentName);
    }

    if (this.loadPromises.has(componentName)) {
      console.log(`⏳ ComponentLoader: ${componentName} already loading...`);
      return this.loadPromises.get(componentName);
    }

    const config = this.componentRegistry.get(componentName);
    if (!config) {
      console.error(`❌ ComponentLoader: Component ${componentName} not registered`);
      return null;
    }

    console.log(`📥 ComponentLoader: Loading ${componentName}...`);
    
    const loadStartTime = performance.now();
    
    const loadPromise = this.loadComponentModule(componentName, config);
    this.loadPromises.set(componentName, loadPromise);
    
    try {
      const component = await loadPromise;
      
      const loadTime = performance.now() - loadStartTime;
      this.performanceMetrics.loadTimes.set(componentName, loadTime);
      
      this.loadedComponents.set(componentName, component);
      this.loadPromises.delete(componentName);
      
      console.log(`✅ ComponentLoader: ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
      
      return component;
      
    } catch (error) {
      console.error(`❌ ComponentLoader: Failed to load ${componentName}:`, error);
      this.loadPromises.delete(componentName);
      
      // Graceful degradation - component functionality should still work without enhancement
      return null;
    }
  }

  /**
   * Load and initialize a component module
   */
  async loadComponentModule(componentName, config) {
    const initStartTime = performance.now();
    
    try {
      // Dynamic import of the component module
      const module = await config.module();
      
      // Initialize the component if it has an initialization method
      let componentInstance = null;
      
      if (module.default) {
        // For class-based components or direct exports
        if (typeof module.default === 'function') {
          componentInstance = new module.default();
        } else {
          componentInstance = module.default;
        }
      }

      // Auto-initialize if DOM elements exist
      if (config.selector && document.querySelector(config.selector)) {
        await this.initializeComponentInstance(componentName, componentInstance);
      }

      const initTime = performance.now() - initStartTime;
      this.performanceMetrics.initTimes.set(componentName, initTime);
      
      return componentInstance;
      
    } catch (error) {
      console.error(`❌ ComponentLoader: Module loading failed for ${componentName}:`, error);
      throw error;
    }
  }

  /**
   * Initialize a component instance
   */
  async initializeComponentInstance(componentName, instance) {
    try {
      // For Web Components, they auto-initialize when added to DOM
      if (componentName === 'navigation-component') {
        // Create a navigation-component element if it doesn't exist
        let navComponent = document.querySelector('navigation-component');
        if (!navComponent) {
          navComponent = document.createElement('navigation-component');
          // Append to body but make it invisible (it enhances existing navigation)
          navComponent.style.display = 'none';
          document.body.appendChild(navComponent);
        }
      }

      // Call initialize method if available
      if (instance && typeof instance.initialize === 'function') {
        await instance.initialize();
      }

      console.log(`🎉 ComponentLoader: ${componentName} instance initialized`);
      
    } catch (error) {
      console.error(`❌ ComponentLoader: Instance initialization failed for ${componentName}:`, error);
    }
  }

  /**
   * Set up progressive enhancement for dynamically added content
   */
  setupProgressiveEnhancement() {
    // Use MutationObserver to detect new components added to DOM
    if (window.MutationObserver) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                this.enhanceNewElements(node);
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      console.log('👀 ComponentLoader: Progressive enhancement observer active');
    }

    // Handle page visibility changes for performance optimization
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.resumeComponentActivity();
      } else {
        this.pauseComponentActivity();
      }
    });
  }

  /**
   * Enhance newly added DOM elements
   */
  async enhanceNewElements(element) {
    for (const [componentName, config] of this.componentRegistry) {
      if (element.matches && element.matches(config.selector)) {
        console.log(`🔄 ComponentLoader: Enhancing new ${componentName} element`);
        await this.loadComponent(componentName);
      }
      
      // Check child elements as well
      if (element.querySelector && element.querySelector(config.selector)) {
        console.log(`🔄 ComponentLoader: Enhancing new child ${componentName} elements`);
        await this.loadComponent(componentName);
      }
    }
  }

  /**
   * Performance optimization: pause components when page is hidden
   */
  pauseComponentActivity() {
    // Pause animations, timers, etc. in loaded components
    for (const [name, component] of this.loadedComponents) {
      if (component && typeof component.pause === 'function') {
        component.pause();
      }
    }
    console.log('⏸️ ComponentLoader: Component activity paused');
  }

  /**
   * Performance optimization: resume components when page is visible
   */
  resumeComponentActivity() {
    // Resume animations, timers, etc. in loaded components
    for (const [name, component] of this.loadedComponents) {
      if (component && typeof component.resume === 'function') {
        component.resume();
      }
    }
    console.log('▶️ ComponentLoader: Component activity resumed');
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics() {
    const totalTime = performance.now() - this.performanceMetrics.startTime;
    
    return {
      totalInitializationTime: totalTime,
      componentsLoaded: this.loadedComponents.size,
      loadTimes: Object.fromEntries(this.performanceMetrics.loadTimes),
      initTimes: Object.fromEntries(this.performanceMetrics.initTimes),
      averageLoadTime: Array.from(this.performanceMetrics.loadTimes.values())
        .reduce((sum, time) => sum + time, 0) / this.performanceMetrics.loadTimes.size || 0
    };
  }

  /**
   * Manual component loading for specific use cases
   */
  async loadComponentManually(componentName, targetElement = null) {
    console.log(`🎯 ComponentLoader: Manual load requested for ${componentName}`);
    
    const component = await this.loadComponent(componentName);
    
    if (component && targetElement) {
      // Apply component to specific element if provided
      await this.initializeComponentInstance(componentName, component);
    }
    
    return component;
  }

  /**
   * Cleanup method for testing or page unload
   */
  cleanup() {
    // Clear all loaded components
    for (const [name, component] of this.loadedComponents) {
      if (component && typeof component.cleanup === 'function') {
        component.cleanup();
      }
    }
    
    this.loadedComponents.clear();
    this.loadPromises.clear();
    this.isInitialized = false;
    
    console.log('🧹 ComponentLoader: Cleanup completed');
  }
}

// Create singleton instance
const componentLoader = new ComponentLoader();

// Export for module usage
export default componentLoader;

// Also expose globally for debugging
window.ComponentLoader = componentLoader;