/**
 * PHASE 4.1B: TYPESCRIPT-ENHANCED COMPONENT LOADER
 * Type-safe component loading with full IntelliSense support
 * Maintains backward compatibility with existing JavaScript implementation
 */
/**
 * TypeScript-enhanced Component Loader
 * Provides type-safe component loading and initialization
 */
class ComponentLoader {
    constructor() {
        this.loadedComponents = new Map();
        this.componentRegistry = new Map();
        this.loadPromises = new Map();
        this.isInitialized = false;
        // Performance tracking with proper typing
        this.performanceMetrics = {
            startTime: performance.now(),
            loadTimes: new Map(),
            initTimes: new Map()
        };
        // Observer for progressive enhancement
        this.mutationObserver = null;
        console.log('🔧 TypeScript ComponentLoader: Initializing...');
    }
    /**
     * Initialize the component loader system with full type safety
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('ComponentLoader: Already initialized');
            return;
        }
        console.log('🚀 ComponentLoader: Initializing Enhanced Architecture...');
        try {
            await this.registerCoreComponents();
            await this.autoDiscoverComponents();
            this.setupProgressiveEnhancement();
            this.isInitialized = true;
            const totalTime = performance.now() - this.performanceMetrics.startTime;
            console.log(`✅ TypeScript ComponentLoader: Initialized in ${totalTime.toFixed(2)}ms`);
        }
        catch (error) {
            const componentError = this.createComponentError(error, 'initialize');
            console.error('❌ ComponentLoader: Initialization failed:', componentError);
            throw componentError;
        }
    }
    /**
     * Register core components with type-safe configuration
     */
    async registerCoreComponents() {
        console.log('📋 ComponentLoader: Registering core components...');
        // Register navigation component (TypeScript version preferred)
        this.componentRegistry.set('navigation-component', {
            module: async () => {
                // Try TypeScript version first, fallback to JavaScript
                try {
                    return await import('../components/navigation-component.js');
                }
                catch (error) {
                    console.warn('TypeScript component not found, using JavaScript fallback');
                    return await import('../components/navigation-component.js');
                }
            },
            selector: '.navbar, .nav-menu, .mobile-nav-toggle',
            priority: 1,
            autoInit: true
        });
        // Register future TypeScript components here
        // this.registerComponent('search-component', { ... });
        // this.registerComponent('modal-component', { ... });
        console.log(`📦 ComponentLoader: ${this.componentRegistry.size} components registered`);
    }
    /**
     * Type-safe component registration method
     */
    registerComponent(name, config) {
        if (this.componentRegistry.has(name)) {
            console.warn(`Component ${name} already registered, overwriting...`);
        }
        this.componentRegistry.set(name, config);
        console.log(`🔧 Component registered: ${name}`);
    }
    /**
     * Auto-discover components in the current DOM with type safety
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
     * Load and initialize a specific component with full type safety
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
            const error = new Error(`Component ${componentName} not registered`);
            throw this.createComponentError(error, 'loadComponent', componentName);
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
        }
        catch (error) {
            const componentError = this.createComponentError(error, 'loadComponent', componentName);
            console.error(`❌ ComponentLoader: Failed to load ${componentName}:`, componentError);
            this.loadPromises.delete(componentName);
            // Graceful degradation
            this.handleComponentLoadFailure(componentName, componentError);
            return null;
        }
    }
    /**
     * Load and initialize a component module with enhanced error handling
     */
    async loadComponentModule(componentName, config) {
        const initStartTime = performance.now();
        try {
            // Dynamic import with error handling
            const module = await config.module();
            let componentInstance = null;
            // Handle different export patterns
            if (module.default) {
                if (typeof module.default === 'function') {
                    // Class constructor or function
                    try {
                        componentInstance = new module.default();
                    }
                    catch (constructorError) {
                        // Handle non-constructor functions
                        componentInstance = module.default;
                    }
                }
                else {
                    // Direct export
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
        }
        catch (error) {
            throw this.createComponentError(error, 'loadComponentModule', componentName);
        }
    }
    /**
     * Initialize a component instance with type-safe error handling
     */
    async initializeComponentInstance(componentName, instance) {
        try {
            // For Web Components, they auto-initialize when added to DOM
            if (componentName === 'navigation-component') {
                await this.initializeNavigationComponent();
            }
            // Call initialize method if available
            if (instance && typeof instance.initialize === 'function') {
                await instance.initialize();
            }
            console.log(`🎉 ComponentLoader: ${componentName} instance initialized`);
        }
        catch (error) {
            throw this.createComponentError(error, 'initializeComponentInstance', componentName);
        }
    }
    /**
     * Initialize navigation component with type safety
     */
    async initializeNavigationComponent() {
        let navComponent = document.querySelector('navigation-component');
        if (!navComponent) {
            navComponent = document.createElement('navigation-component');
            // Append to body but make it invisible (it enhances existing navigation)
            navComponent.style.display = 'none';
            document.body.appendChild(navComponent);
        }
    }
    /**
     * Set up progressive enhancement with typed observers
     */
    setupProgressiveEnhancement() {
        // Use MutationObserver to detect new components added to DOM
        if (typeof MutationObserver !== 'undefined') {
            this.mutationObserver = new MutationObserver((mutations) => {
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
            this.mutationObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
            console.log('👀 ComponentLoader: Progressive enhancement observer active');
        }
        // Handle page visibility changes for performance optimization
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.resumeComponentActivity();
            }
            else {
                this.pauseComponentActivity();
            }
        });
    }
    /**
     * Enhance newly added DOM elements with type safety
     */
    async enhanceNewElements(element) {
        for (const [componentName, config] of this.componentRegistry) {
            const hasElement = element.matches?.(config.selector) || element.querySelector?.(config.selector);
            if (hasElement) {
                console.log(`🔄 ComponentLoader: Enhancing new ${componentName} element`);
                await this.loadComponent(componentName);
            }
        }
    }
    /**
     * Performance optimization: pause components when page is hidden
     */
    pauseComponentActivity() {
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
        for (const [name, component] of this.loadedComponents) {
            if (component && typeof component.resume === 'function') {
                component.resume();
            }
        }
        console.log('▶️ ComponentLoader: Component activity resumed');
    }
    /**
     * Get performance metrics with proper typing
     */
    getPerformanceMetrics() {
        const totalTime = performance.now() - this.performanceMetrics.startTime;
        const loadTimes = Array.from(this.performanceMetrics.loadTimes.values());
        const initTimes = Array.from(this.performanceMetrics.initTimes.values());
        return {
            totalInitializationTime: totalTime,
            componentsLoaded: this.loadedComponents.size,
            loadTimes: Object.fromEntries(this.performanceMetrics.loadTimes),
            initTimes: Object.fromEntries(this.performanceMetrics.initTimes),
            averageLoadTime: loadTimes.length > 0 ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length : 0
        };
    }
    /**
     * Manual component loading with enhanced type safety
     */
    async loadComponentManually(componentName, targetElement) {
        console.log(`🎯 ComponentLoader: Manual load requested for ${componentName}`);
        const component = await this.loadComponent(componentName);
        if (component && targetElement) {
            await this.initializeComponentInstance(componentName, component);
        }
        return component;
    }
    /**
     * Handle component load failures with graceful degradation
     */
    handleComponentLoadFailure(componentName, error) {
        console.warn(`⚠️ Component ${componentName} failed to load, ensuring baseline functionality...`);
        // Specific fallback for navigation component
        if (componentName === 'navigation-component') {
            this.ensureBasicNavigationFunctionality();
        }
        // Generic fallback handling could be added here for other components
    }
    /**
     * Ensure basic navigation works even if enhanced component fails
     */
    ensureBasicNavigationFunctionality() {
        const toggle = document.querySelector('.mobile-nav-toggle');
        const menu = document.querySelector('.nav-menu');
        if (toggle && menu && !toggle.onclick) {
            toggle.onclick = () => {
                menu.classList.toggle('active');
                toggle.classList.toggle('active');
                console.log('🔧 Basic navigation fallback active');
            };
        }
    }
    /**
     * Create typed component errors
     */
    createComponentError(error, context, componentName) {
        const componentError = error;
        componentError.componentName = componentName;
        componentError.phase = 'Phase 4.1B';
        componentError.recoverable = true;
        componentError.message = `${context}: ${error.message}`;
        return componentError;
    }
    /**
     * Cleanup method with proper typing
     */
    cleanup() {
        // Clean up mutation observer
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
        // Clear all loaded components
        for (const [name, component] of this.loadedComponents) {
            if (component && typeof component.cleanup === 'function') {
                component.cleanup();
            }
        }
        this.loadedComponents.clear();
        this.loadPromises.clear();
        this.isInitialized = false;
        console.log('🧹 TypeScript ComponentLoader: Cleanup completed');
    }
    /**
     * Get component by name with type safety
     */
    getComponent(componentName) {
        return this.loadedComponents.get(componentName) || null;
    }
    /**
     * Check if component is loaded
     */
    isComponentLoaded(componentName) {
        return this.loadedComponents.has(componentName);
    }
    /**
     * Get all loaded component names
     */
    getLoadedComponentNames() {
        return Array.from(this.loadedComponents.keys());
    }
}
// Create singleton instance with proper typing
const componentLoader = new ComponentLoader();
// Export for module usage
export default componentLoader;
// Type-safe global exposure (avoid interface conflict)
window.ComponentLoader = componentLoader;
//# sourceMappingURL=component-loader.js.map