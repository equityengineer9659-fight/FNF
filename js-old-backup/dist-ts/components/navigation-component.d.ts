/**
 * PHASE 4.1B: TYPESCRIPT-ENHANCED NAVIGATION COMPONENT
 * TypeScript version with full type safety and enhanced IntelliSense
 * Maintains compatibility with existing JavaScript implementation
 */
import type { NavigationComponentInterface, TouchTargetInfo } from '../types/enhanced-architecture.js';
/**
 * Enhanced Navigation Web Component with TypeScript support
 * Provides progressive enhancement for existing mobile navigation
 */
export declare class NavigationComponent extends HTMLElement implements NavigationComponentInterface {
    isInitialized: boolean;
    mobileToggle: Element | null;
    navMenu: Element | null;
    isMenuOpen: boolean;
    readonly breakpoint: number;
    private resizeTimeout;
    private animationFrame;
    private navMenuHeight;
    private mediaQueryListener;
    private boundHandleOutsideClick;
    private boundHandleEscapeKey;
    private boundHandleToggleClick;
    private boundHandleToggleKeydown;
    constructor();
    /**
     * Web Component lifecycle: connected to DOM
     */
    connectedCallback(): void;
    /**
     * Initialize enhanced navigation functionality
     */
    initializeEnhancedNavigation(): void;
    /**
     * Set up enhanced interaction handlers with proper typing
     */
    private setupEnhancedInteractions;
    /**
     * Enhanced accessibility with ARIA attributes and focus management
     */
    private setupAccessibilityEnhancements;
    /**
     * Type-safe ARIA attribute setting
     */
    private setAriaAttributes;
    /**
     * Update navigation links tab index based on menu state
     */
    private updateNavLinksTabIndex;
    /**
     * Set up responsive behavior with typed media query handling
     */
    private setupResponsiveHandling;
    /**
     * Performance optimizations with proper cleanup handling
     */
    private setupPerformanceOptimizations;
    /**
     * Event Handlers (properly typed)
     */
    private handleToggleClick;
    private handleToggleKeydown;
    private handleOutsideClick;
    private handleEscapeKey;
    /**
     * Public API Methods (typed interface implementation)
     */
    toggle(): void;
    open(): void;
    close(): void;
    isOpen(): boolean;
    /**
     * Core navigation functionality with enhanced typing
     */
    toggleMobileMenu(): void;
    openMobileMenu(): void;
    closeMobileMenu(animate?: boolean): void;
    /**
     * Dispatch typed custom events
     */
    private dispatchNavigationEvent;
    /**
     * Responsive visibility management
     */
    private updateNavigationVisibility;
    /**
     * Layout update for performance
     */
    private updateNavigationLayout;
    /**
     * Enhanced error handling with recovery
     */
    private handleComponentError;
    /**
     * Ensure basic navigation works even if enhancement fails
     */
    private ensureBasicFunctionality;
    /**
     * Touch target accessibility validation
     */
    validateTouchTargets(): TouchTargetInfo[];
    /**
     * Web Component lifecycle: disconnected from DOM
     */
    disconnectedCallback(): void;
}
export default NavigationComponent;
//# sourceMappingURL=navigation-component.d.ts.map