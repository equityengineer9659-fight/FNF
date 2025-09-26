/**
 * Food-N-Force Core Module
 * Consolidated navigation, logo management, and essential functionality
 * Replaces: unified-navigation-refactored.js, logo-optimization.js
 */
declare class FoodNForceCore {
    isInitialized: boolean;
    observers: any[];
    eventListeners: any[];
    modules: Map<any, any>;
    prefersReducedMotion: boolean;
    logoCache: Map<any, any>;
    capabilities: {};
    nav: HTMLElement;
    toggle: Element;
    navItems: NodeListOf<Element>;
    isNavOpen: boolean;
    init(): Promise<void>;
    detectCapabilities(): Promise<void>;
    supportsFormat(format: any): Promise<any>;
    getConnectionSpeed(): "slow" | "medium" | "fast" | "unknown";
    setupPageClassification(): void;
    injectNavigation(): void;
    animateNavigationElements(): void;
    setupMobileNavigation(): void;
    openNav(): void;
    closeNav(): void;
    highlightCurrentPage(): void;
    setupFormEnhancements(): void;
    handleFormSubmission(form: any, type: any): Promise<void>;
    showSuccessMessage(form: any): void;
    initializeLogoSystem(): Promise<void>;
    setupLogoErrorHandling(): void;
    handleLogoError(img: any): void;
    createCSSFallback(imgElement: any): void;
    optimizeLogos(): Promise<void>;
    optimizeLogo(logoElement: any): Promise<void>;
    getOptimalLogoSource(src: any): any;
    preloadImage(src: any): Promise<any>;
    setupLazyLogoLoading(logoElement: any): void;
    setupLogoAccessibility(): void;
    enhanceLogosForHighContrast(): void;
    setupAccessibilityEnhancements(): void;
    setupScreenReaderSupport(): void;
    liveRegion: HTMLDivElement;
    announceToScreenReader(message: any): void;
    bindCoreEventListeners(): void;
    getCapabilities(): {};
    isReady(): boolean;
    registerModule(name: any, module: any): void;
    getModule(name: any): any;
    destroy(): void;
}
declare function initCore(): void;
//# sourceMappingURL=fnf-core.d.ts.map