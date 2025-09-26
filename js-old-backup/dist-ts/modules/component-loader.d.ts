/**
 * PHASE 4.1B: TYPESCRIPT-ENHANCED COMPONENT LOADER
 * Type-safe component loading with full IntelliSense support
 * Maintains backward compatibility with existing JavaScript implementation
 */
import type { ComponentLoaderInterface, ComponentConfig, PerformanceMetrics } from '../types/enhanced-architecture.js';
/**
 * TypeScript-enhanced Component Loader
 * Provides type-safe component loading and initialization
 */
declare class ComponentLoader implements ComponentLoaderInterface {
    readonly loadedComponents: Map<string, any>;
    readonly componentRegistry: Map<string, ComponentConfig>;
    private readonly loadPromises;
    isInitialized: boolean;
    private readonly performanceMetrics;
    private mutationObserver;
    constructor();
    /**
     * Initialize the component loader system with full type safety
     */
    initialize(): Promise<void>;
    /**
     * Register core components with type-safe configuration
     */
    private registerCoreComponents;
    /**
     * Type-safe component registration method
     */
    registerComponent(name: string, config: ComponentConfig): void;
    /**
     * Auto-discover components in the current DOM with type safety
     */
    private autoDiscoverComponents;
    /**
     * Load and initialize a specific component with full type safety
     */
    loadComponent(componentName: string): Promise<any>;
    /**
     * Load and initialize a component module with enhanced error handling
     */
    private loadComponentModule;
    /**
     * Initialize a component instance with type-safe error handling
     */
    private initializeComponentInstance;
    /**
     * Initialize navigation component with type safety
     */
    private initializeNavigationComponent;
    /**
     * Set up progressive enhancement with typed observers
     */
    private setupProgressiveEnhancement;
    /**
     * Enhance newly added DOM elements with type safety
     */
    private enhanceNewElements;
    /**
     * Performance optimization: pause components when page is hidden
     */
    private pauseComponentActivity;
    /**
     * Performance optimization: resume components when page is visible
     */
    private resumeComponentActivity;
    /**
     * Get performance metrics with proper typing
     */
    getPerformanceMetrics(): PerformanceMetrics;
    /**
     * Manual component loading with enhanced type safety
     */
    loadComponentManually(componentName: string, targetElement?: Element): Promise<any>;
    /**
     * Handle component load failures with graceful degradation
     */
    private handleComponentLoadFailure;
    /**
     * Ensure basic navigation works even if enhanced component fails
     */
    private ensureBasicNavigationFunctionality;
    /**
     * Create typed component errors
     */
    private createComponentError;
    /**
     * Cleanup method with proper typing
     */
    cleanup(): void;
    /**
     * Get component by name with type safety
     */
    getComponent<T = any>(componentName: string): T | null;
    /**
     * Check if component is loaded
     */
    isComponentLoaded(componentName: string): boolean;
    /**
     * Get all loaded component names
     */
    getLoadedComponentNames(): string[];
}
declare const componentLoader: ComponentLoader;
export default componentLoader;
//# sourceMappingURL=component-loader.d.ts.map