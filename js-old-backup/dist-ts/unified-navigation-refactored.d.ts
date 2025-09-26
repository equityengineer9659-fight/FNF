/**
 * Food-N-Force Unified Navigation System - REFACTORED
 * Phase 4: Converted 33 style manipulations to CSS classes
 * Phase 5: Integrated actual logo images with performance optimization
 * Consolidates all navigation functionality into a single, maintainable module
 */
declare class LogoManager {
    logoLoadingStates: Map<any, any>;
    preloadCriticalLogos(): void;
    handleLogoErrors(): void;
    createCSSFallback(imgElement: any): void;
    setupAccessibilityEnhancements(): void;
    setupScreenReaderSupport(): void;
    liveRegion: HTMLDivElement;
    announceToScreenReader(message: any): void;
    detectHighContrastMode(): void;
    enhanceLogosForHighContrast(): void;
    initPerformanceMonitoring(): void;
}
declare class FoodNForceNavigation {
    nav: HTMLElement;
    toggle: Element;
    navItems: NodeListOf<Element>;
    isOpen: boolean;
    observers: any[];
    logoManager: LogoManager;
    init(): void;
    injectNavigation(): void;
    animateNavigationElements(): void;
    setupMobileNavigation(): void;
    openNav(): void;
    closeNav(): void;
    handleResize(): void;
    highlightCurrentPage(): void;
    setupScrollAnimations(): void;
    animateStats(element: any): void;
    animateToNumber(element: any, start: any, end: any, suffix: any, duration: any): void;
    animateNumber(element: any): void;
    setupFormEnhancements(): void;
}
declare const foodNForceNav: FoodNForceNavigation;
//# sourceMappingURL=unified-navigation-refactored.d.ts.map