/**
 * Food-N-Force Effects Module
 * Consolidated animations, visual effects, and interactions
 * Replaces: animations.js, slds-enhancements.js, premium-effects-refactored.js,
 *           slds-cool-effects.js, premium-background-effects.js
 */
declare class FoodNForceEffects {
    isInitialized: boolean;
    observers: any[];
    eventListeners: any[];
    animations: Map<any, any>;
    particles: any[];
    performanceMetrics: {
        fps: number;
        frameCount: number;
        lastFrameTime: number;
        animationFrameId: any;
    };
    init(): void;
    capabilities: any;
    prefersReducedMotion: any;
    setupPerformanceMonitoring(): void;
    adaptiveQuality(): void;
    reduceEffectsQuality(): void;
    restoreEffectsQuality(): void;
    setupIntersectionObservers(): void;
    animationObserver: IntersectionObserver;
    statsObserver: any;
    showAllElements(): void;
    initializeScrollEffects(): void;
    setupNavigationScrollEffect(): void;
    setupSmoothScrolling(): void;
    setupScrollProgress(): void;
    setupParallaxEffects(): void;
    initializeCardEffects(): void;
    setupCardInteractions(card: any): void;
    setupCardTilt(card: any): void;
    setupMagneticIcon(card: any): void;
    resetMagneticIcon(card: any): void;
    triggerCardGlow(card: any): void;
    removeCardGlow(card: any): void;
    observeCardForAnimation(card: any): void;
    animateElement(element: any): void;
    initializeStatsCounters(): void;
    animateStats(statContainer: any): void;
    animateNumber(element: any): void;
    extractNumber(text: any): number;
    extractSuffix(text: any): "" | "+" | "%" | "M+" | "K+";
    initializeFormAnimations(): void;
    initializeButtonEffects(): void;
    setupRippleEffect(button: any): void;
    setupMagneticEffect(button: any): void;
    initializePremiumEffects(): void;
    createHeroParticles(): void;
    createParticle(container: any, index: any): void;
    setupModalEffects(): void;
    setupNewsletterPopup(): void;
    createNewsletterModal(): void;
    setupBackgroundEffects(): void;
    createIridescentBackground(): void;
    createSpinningPattern(animationClass: any): HTMLDivElement;
    setupEventListeners(): void;
    disableMotionEffects(): void;
    enableMotionEffects(): void;
    pauseAnimations(): void;
    resumeAnimations(): void;
    handleResize(): void;
    getPerformanceMetrics(): {
        fps: number;
        frameCount: number;
        lastFrameTime: number;
        animationFrameId: any;
    };
    forceAnimateElement(element: any): void;
    destroy(): void;
}
declare function initEffects(): void;
//# sourceMappingURL=fnf-effects.d.ts.map