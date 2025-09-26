/**
 * PHASE 4.1B: TYPESCRIPT-ENHANCED NAVIGATION COMPONENT
 * TypeScript version with full type safety and enhanced IntelliSense
 * Maintains compatibility with existing JavaScript implementation
 */
/**
 * Enhanced Navigation Web Component with TypeScript support
 * Provides progressive enhancement for existing mobile navigation
 */
export class NavigationComponent extends HTMLElement {
    constructor() {
        super();
        // Type-safe property declarations
        this.isInitialized = false;
        this.mobileToggle = null;
        this.navMenu = null;
        this.isMenuOpen = false;
        this.breakpoint = 768;
        // Private properties with proper typing
        this.resizeTimeout = null;
        this.animationFrame = null;
        this.navMenuHeight = null;
        this.mediaQueryListener = null;
        // Bind event handlers for proper 'this' context
        this.boundHandleOutsideClick = this.handleOutsideClick.bind(this);
        this.boundHandleEscapeKey = this.handleEscapeKey.bind(this);
        this.boundHandleToggleClick = this.handleToggleClick.bind(this);
        this.boundHandleToggleKeydown = this.handleToggleKeydown.bind(this);
    }
    /**
     * Web Component lifecycle: connected to DOM
     */
    connectedCallback() {
        if (!this.isInitialized) {
            this.initializeEnhancedNavigation();
            this.isInitialized = true;
        }
    }
    /**
     * Initialize enhanced navigation functionality
     */
    initializeEnhancedNavigation() {
        try {
            // Find existing navigation elements (HTML-first approach)
            this.mobileToggle = document.querySelector('.mobile-nav-toggle');
            this.navMenu = document.querySelector('.nav-menu');
            if (!this.mobileToggle || !this.navMenu) {
                const error = new Error('Required navigation elements not found');
                error.componentName = 'NavigationComponent';
                error.recoverable = true;
                console.warn('NavigationComponent:', error.message);
                return;
            }
            // Set up enhanced functionality
            this.setupEnhancedInteractions();
            this.setupAccessibilityEnhancements();
            this.setupResponsiveHandling();
            this.setupPerformanceOptimizations();
            console.log('✅ Navigation Web Component: Enhanced existing navigation');
        }
        catch (error) {
            this.handleComponentError(error, 'initializeEnhancedNavigation');
        }
    }
    /**
     * Set up enhanced interaction handlers with proper typing
     */
    setupEnhancedInteractions() {
        if (!this.mobileToggle)
            return;
        // Remove any existing onclick handlers
        this.mobileToggle.onclick = null;
        // Add enhanced event listeners
        this.mobileToggle.addEventListener('click', this.boundHandleToggleClick);
        this.mobileToggle.addEventListener('keydown', this.boundHandleToggleKeydown);
        // Global event listeners for enhanced UX
        document.addEventListener('click', this.boundHandleOutsideClick);
        document.addEventListener('keydown', this.boundHandleEscapeKey);
    }
    /**
     * Enhanced accessibility with ARIA attributes and focus management
     */
    setupAccessibilityEnhancements() {
        if (!this.mobileToggle || !this.navMenu)
            return;
        // Type-safe attribute setting
        this.setAriaAttributes(this.mobileToggle, {
            'aria-expanded': 'false',
            'aria-controls': 'nav-menu',
            'aria-label': 'Toggle navigation menu'
        });
        this.setAriaAttributes(this.navMenu, {
            'id': 'nav-menu',
            'role': 'navigation',
            'aria-label': 'Main navigation',
            'aria-hidden': 'true'
        });
        // Focus management for better screen reader experience
        this.updateNavLinksTabIndex(false);
    }
    /**
     * Type-safe ARIA attribute setting
     */
    setAriaAttributes(element, attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }
    /**
     * Update navigation links tab index based on menu state
     */
    updateNavLinksTabIndex(isMenuOpen) {
        if (!this.navMenu)
            return;
        const navLinks = this.navMenu.querySelectorAll('a');
        const tabIndex = isMenuOpen ? '0' : '-1';
        navLinks.forEach(link => {
            link.setAttribute('tabindex', tabIndex);
        });
    }
    /**
     * Set up responsive behavior with typed media query handling
     */
    setupResponsiveHandling() {
        const mediaQuery = window.matchMedia(`(max-width: ${this.breakpoint}px)`);
        this.mediaQueryListener = (e) => {
            if (!e.matches && this.isMenuOpen) {
                this.closeMobileMenu(false);
            }
            this.updateNavigationVisibility(e.matches);
        };
        mediaQuery.addListener(this.mediaQueryListener);
        this.mediaQueryListener({ matches: mediaQuery.matches });
    }
    /**
     * Performance optimizations with proper cleanup handling
     */
    setupPerformanceOptimizations() {
        if (!this.navMenu)
            return;
        // Optimize for animations
        this.navMenu.style.willChange = 'transform, opacity';
        // Debounced resize handler
        const handleResize = () => {
            if (this.resizeTimeout !== null) {
                clearTimeout(this.resizeTimeout);
            }
            this.resizeTimeout = window.setTimeout(() => {
                this.updateNavigationLayout();
                this.resizeTimeout = null;
            }, 150);
        };
        window.addEventListener('resize', handleResize);
    }
    /**
     * Event Handlers (properly typed)
     */
    handleToggleClick(e) {
        e.preventDefault();
        e.stopPropagation();
        this.toggleMobileMenu();
    }
    handleToggleKeydown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.toggleMobileMenu();
        }
    }
    handleOutsideClick(e) {
        const target = e.target;
        if (this.isMenuOpen &&
            this.navMenu && this.mobileToggle &&
            !this.navMenu.contains(target) &&
            !this.mobileToggle.contains(target)) {
            this.closeMobileMenu();
        }
    }
    handleEscapeKey(e) {
        if (e.key === 'Escape' && this.isMenuOpen) {
            this.closeMobileMenu();
            if (this.mobileToggle instanceof HTMLElement) {
                this.mobileToggle.focus();
            }
        }
    }
    /**
     * Public API Methods (typed interface implementation)
     */
    toggle() {
        this.toggleMobileMenu();
    }
    open() {
        this.openMobileMenu();
    }
    close() {
        this.closeMobileMenu();
    }
    isOpen() {
        return this.isMenuOpen;
    }
    /**
     * Core navigation functionality with enhanced typing
     */
    toggleMobileMenu() {
        if (this.isMenuOpen) {
            this.closeMobileMenu();
        }
        else {
            this.openMobileMenu();
        }
    }
    openMobileMenu() {
        if (this.isMenuOpen || !this.mobileToggle || !this.navMenu)
            return;
        this.isMenuOpen = true;
        // Type-safe DOM manipulation
        this.mobileToggle.setAttribute('aria-expanded', 'true');
        this.navMenu.setAttribute('aria-hidden', 'false');
        this.mobileToggle.classList.add('active');
        this.navMenu.classList.add('active');
        // Enable navigation links
        this.updateNavLinksTabIndex(true);
        // Focus management
        const firstLink = this.navMenu.querySelector('a');
        firstLink?.focus();
        // Performance optimization
        this.navMenu.style.transform = 'translateZ(0)';
        // Dispatch custom event
        this.dispatchNavigationEvent('open');
        console.log('📱 Mobile menu opened');
    }
    closeMobileMenu(animate = true) {
        if (!this.isMenuOpen || !this.mobileToggle || !this.navMenu)
            return;
        this.isMenuOpen = false;
        // Type-safe attribute updates
        this.mobileToggle.setAttribute('aria-expanded', 'false');
        this.navMenu.setAttribute('aria-hidden', 'true');
        this.mobileToggle.classList.remove('active');
        this.navMenu.classList.remove('active');
        // Disable navigation links
        this.updateNavLinksTabIndex(false);
        // Performance cleanup
        if (animate) {
            setTimeout(() => {
                if (this.navMenu) {
                    this.navMenu.style.transform = '';
                }
            }, 300);
        }
        else {
            this.navMenu.style.transform = '';
        }
        // Dispatch custom event
        this.dispatchNavigationEvent('close');
        console.log('📱 Mobile menu closed');
    }
    /**
     * Dispatch typed custom events
     */
    dispatchNavigationEvent(action) {
        if (!this.mobileToggle || !this.navMenu)
            return;
        const event = new CustomEvent('navigationToggle', {
            detail: {
                isOpen: this.isMenuOpen,
                toggleElement: this.mobileToggle,
                menuElement: this.navMenu
            },
            bubbles: true,
            cancelable: true
        });
        this.dispatchEvent(event);
    }
    /**
     * Responsive visibility management
     */
    updateNavigationVisibility(isMobile) {
        if (!this.mobileToggle || !this.navMenu)
            return;
        const toggleElement = this.mobileToggle;
        const menuElement = this.navMenu;
        if (isMobile) {
            toggleElement.style.display = 'block';
            if (!this.isMenuOpen) {
                menuElement.classList.remove('active');
            }
        }
        else {
            toggleElement.style.display = 'none';
            menuElement.classList.remove('active');
            menuElement.style.transform = '';
            // Enable all nav links for desktop
            this.updateNavLinksTabIndex(true);
        }
    }
    /**
     * Layout update for performance
     */
    updateNavigationLayout() {
        if (this.navMenu) {
            this.navMenuHeight = this.navMenu.scrollHeight;
        }
    }
    /**
     * Enhanced error handling with recovery
     */
    handleComponentError(error, context) {
        const componentError = error;
        componentError.componentName = 'NavigationComponent';
        componentError.phase = 'Phase 4.1B';
        console.error(`❌ NavigationComponent error in ${context}:`, componentError);
        // Attempt graceful recovery
        if (componentError.recoverable !== false) {
            console.log('🔄 Attempting graceful recovery...');
            this.ensureBasicFunctionality();
        }
    }
    /**
     * Ensure basic navigation works even if enhancement fails
     */
    ensureBasicFunctionality() {
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
     * Touch target accessibility validation
     */
    validateTouchTargets() {
        if (!this.mobileToggle || !this.navMenu)
            return [];
        const interactiveElements = this.navMenu.querySelectorAll('a, button, [role="button"]');
        const touchTargets = [];
        interactiveElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const computedStyle = getComputedStyle(element);
            touchTargets.push({
                element: element.className || element.tagName,
                width: rect.width,
                height: rect.height,
                minDimension: Math.min(rect.width, rect.height),
                visible: rect.width > 0 && rect.height > 0,
                interactive: computedStyle.pointerEvents !== 'none'
            });
        });
        return touchTargets.filter(target => target.visible && target.interactive);
    }
    /**
     * Web Component lifecycle: disconnected from DOM
     */
    disconnectedCallback() {
        // Cleanup timers
        if (this.resizeTimeout !== null) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
        }
        if (this.animationFrame !== null) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
        // Remove event listeners
        document.removeEventListener('click', this.boundHandleOutsideClick);
        document.removeEventListener('keydown', this.boundHandleEscapeKey);
        if (this.mobileToggle) {
            this.mobileToggle.removeEventListener('click', this.boundHandleToggleClick);
            this.mobileToggle.removeEventListener('keydown', this.boundHandleToggleKeydown);
        }
        // Remove media query listener
        if (this.mediaQueryListener) {
            const mediaQuery = window.matchMedia(`(max-width: ${this.breakpoint}px)`);
            mediaQuery.removeListener(this.mediaQueryListener);
            this.mediaQueryListener = null;
        }
        console.log('🔧 TypeScript Navigation Component: Cleaned up enhanced features');
    }
}
// Register the custom element (with type checking)
if (!customElements.get('navigation-component')) {
    customElements.define('navigation-component', NavigationComponent);
    console.log('🎯 TypeScript NavigationComponent registered successfully');
}
else {
    console.log('⚡ NavigationComponent already registered');
}
// Export for module usage with proper typing
export default NavigationComponent;
//# sourceMappingURL=navigation-component.js.map