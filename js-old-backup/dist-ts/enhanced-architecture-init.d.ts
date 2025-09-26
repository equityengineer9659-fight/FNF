export default enhancedArchitecture;
declare const enhancedArchitecture: EnhancedArchitectureManager;
/**
 * Enhanced Architecture Manager
 * Coordinates the initialization and lifecycle of the enhanced architecture
 */
declare class EnhancedArchitectureManager {
    isInitialized: boolean;
    initStartTime: number;
    features: {
        webComponents: boolean;
        es6Modules: boolean;
        progressiveEnhancement: boolean;
    };
    browserSupport: {
        customElements: boolean;
        modules: boolean;
        es6: boolean | Function;
    };
    /**
     * Initialize the enhanced architecture
     */
    initialize(): Promise<void>;
    /**
     * Validate browser support for enhanced features
     */
    validateBrowserSupport(): void;
    /**
     * Initialize core system components
     */
    initializeCoreSystem(): Promise<void>;
    /**
     * Set up progressive enhancement
     */
    setupProgressiveEnhancement(): Promise<void>;
    /**
     * Enhance existing navigation with Web Components
     */
    enhanceExistingNavigation(): Promise<void>;
    /**
     * Set up lazy enhancement for future features
     */
    setupLazyEnhancement(): void;
    /**
     * Enhance element on demand
     */
    enhanceElementOnDemand(element: any): Promise<void>;
    /**
     * Initialize performance tracking
     */
    initializePerformanceTracking(): void;
    /**
     * Track bundle size impact
     */
    trackBundleSize(): void;
    /**
     * Initialize accessibility enhancements
     */
    initializeAccessibilityEnhancements(): void;
    /**
     * Set up ARIA live regions for dynamic content
     */
    setupLiveRegions(): void;
    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring(): void;
    /**
     * Set up graceful degradation
     */
    setupGracefulDegradation(): void;
    /**
     * Ensure baseline functionality works
     */
    ensureBaselineFunctionality(): void;
    /**
     * Report initialization status
     */
    reportInitializationStatus(): void;
    /**
     * Get current status
     */
    getStatus(): {
        initialized: boolean;
        features: {
            webComponents: boolean;
            es6Modules: boolean;
            progressiveEnhancement: boolean;
        };
        browserSupport: {
            customElements: boolean;
            modules: boolean;
            es6: boolean | Function;
        };
        componentLoader: import("./types/enhanced-architecture.js").PerformanceMetrics;
    };
}
//# sourceMappingURL=enhanced-architecture-init.d.ts.map