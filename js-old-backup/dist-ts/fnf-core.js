/**
 * Food-N-Force Core Module
 * Consolidated navigation, logo management, and essential functionality
 * Replaces: unified-navigation-refactored.js, logo-optimization.js
 */
class FoodNForceCore {
    constructor() {
        this.isInitialized = false;
        this.observers = [];
        this.eventListeners = [];
        this.modules = new Map();
        // Performance and accessibility
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.logoCache = new Map();
        this.capabilities = {};
        // Navigation state
        this.nav = null;
        this.toggle = null;
        this.navItems = null;
        this.isNavOpen = false;
        this.init();
    }
    async init() {
        if (this.isInitialized)
            return;
        console.log('🚀 Initializing Food-N-Force Core...');
        try {
            await this.detectCapabilities();
            this.setupPageClassification();
            this.injectNavigation();
            this.setupMobileNavigation();
            this.highlightCurrentPage();
            this.setupFormEnhancements();
            this.initializeLogoSystem();
            this.setupAccessibilityEnhancements();
            this.bindCoreEventListeners();
            this.isInitialized = true;
            console.log('✅ Food-N-Force Core initialized successfully');
            // Dispatch ready event for other modules
            document.dispatchEvent(new CustomEvent('fnf:core:ready', {
                detail: { core: this }
            }));
        }
        catch (error) {
            console.error('❌ Core initialization failed:', error);
        }
    }
    async detectCapabilities() {
        this.capabilities = {
            webp: await this.supportsFormat('webp'),
            avif: await this.supportsFormat('avif'),
            svg: true,
            connectionSpeed: this.getConnectionSpeed(),
            devicePixelRatio: window.devicePixelRatio || 1,
            prefersReducedData: navigator.connection?.saveData || false,
            intersectionObserver: 'IntersectionObserver' in window,
            requestIdleCallback: 'requestIdleCallback' in window
        };
        console.log('📊 Browser capabilities detected:', this.capabilities);
    }
    supportsFormat(format) {
        return new Promise((resolve) => {
            const testImages = {
                webp: 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA',
                avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
            };
            if (!testImages[format]) {
                resolve(false);
                return;
            }
            const img = new Image();
            img.onload = () => resolve(img.width === 2);
            img.onerror = () => resolve(false);
            img.src = testImages[format];
        });
    }
    getConnectionSpeed() {
        if (navigator.connection) {
            switch (navigator.connection.effectiveType) {
                case 'slow-2g':
                case '2g': return 'slow';
                case '3g': return 'medium';
                case '4g':
                default: return 'fast';
            }
        }
        return 'unknown';
    }
    setupPageClassification() {
        const path = window.location.pathname;
        const pageName = path.split('/').pop().replace('.html', '') || 'index';
        document.body.classList.add(`${pageName}-page`);
        // Add capability classes
        Object.entries(this.capabilities).forEach(([key, value]) => {
            if (value === true) {
                document.body.classList.add(`supports-${key}`);
            }
        });
    }
    injectNavigation() {
        // Only inject if navigation doesn't already exist
        if (document.querySelector('.fnf-navigation')) {
            console.log('ℹ️ Navigation already exists, skipping injection');
            return;
        }
        const navHTML = `
            <nav class="fnf-navigation navbar universal-nav custom-nav" role="banner" aria-label="Main navigation">
                <div class="slds-container_fluid">
                    <div class="slds-grid slds-grid_align-spread slds-wrap slds-grid_vertical-align-center slds-p-vertical_small header-layout">
                        <!-- Logo Container -->
                        <div class="slds-col slds-no-flex logo-container">
                            <div class="slds-brand fnf-logo-wrapper nav-animate-logo">
                                <a href="index.html" class="slds-brand__logo-link brand-logo-link" 
                                   aria-label="Food-N-Force Home" 
                                   title="Food-N-Force - Modern Solutions for Food Banks">
                                    <img src="images/logos/fnf-logo.svg" 
                                         alt="Food-N-Force - Modern Solutions for Food Banks" 
                                         class="slds-brand__logo-image fnf-logo-image" 
                                         width="56" height="56" 
                                         loading="eager" 
                                         role="img" 
                                         data-logo-priority="critical"
                                         aria-labelledby="nav-logo-title">
                                    <span id="nav-logo-title" class="slds-assistive-text">Food-N-Force Logo - Modern Solutions for Food Banks</span>
                                </a>
                            </div>
                        </div>
                        
                        <!-- Company Name Container -->
                        <div class="slds-col slds-no-flex company-name-container-centered">
                            <h1 class="brand-logo universal-brand-logo nav-animate-company-name">Food-N-Force</h1>
                        </div>
                        
                        <!-- Mobile Toggle -->
                        <div class="slds-col slds-no-flex slds-hide slds-show_small mobile-toggle-container">
                            <button class="mobile-nav-toggle" 
                                    aria-label="Toggle navigation menu" 
                                    aria-expanded="false" 
                                    aria-controls="main-nav"
                                    type="button">
                                <span class="hamburger-icon nav-hamburger-icon nav-hamburger-closed">☰</span>
                            </button>
                        </div>
                        
                        <!-- Spacer for desktop -->
                        <div class="slds-col slds-no-flex slds-show slds-hide_small nav-spacer"></div>
                    </div>
                    
                    <!-- Navigation Menu -->
                    <div class="slds-grid slds-grid_align-center slds-p-top_small">
                        <div class="slds-col">
                            <nav class="slds-text-align_center nav-menu-container" role="navigation" aria-label="Main navigation">
                                <ul class="nav-menu slds-nav-horizontal universal-nav-menu nav-mobile-menu" id="main-nav">
                                    <li class="slds-nav-horizontal__item">
                                        <a href="index.html" class="nav-link universal-nav-link nav-animate-item">Home</a>
                                    </li>
                                    <li class="slds-nav-horizontal__item">
                                        <a href="services.html" class="nav-link universal-nav-link nav-animate-item">Services</a>
                                    </li>
                                    <li class="slds-nav-horizontal__item">
                                        <a href="resources.html" class="nav-link universal-nav-link nav-animate-item">Resources</a>
                                    </li>
                                    <li class="slds-nav-horizontal__item">
                                        <a href="impact.html" class="nav-link universal-nav-link nav-animate-item">Impact</a>
                                    </li>
                                    <li class="slds-nav-horizontal__item">
                                        <a href="contact.html" class="nav-link universal-nav-link nav-animate-item">Contact</a>
                                    </li>
                                    <li class="slds-nav-horizontal__item">
                                        <a href="about.html" class="nav-link universal-nav-link nav-animate-item">About Us</a>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            </nav>
        `;
        document.body.insertAdjacentHTML('afterbegin', navHTML);
        // Cache DOM elements
        this.nav = document.getElementById('main-nav');
        this.toggle = document.querySelector('.mobile-nav-toggle');
        this.navItems = document.querySelectorAll('.nav-link');
        // Add Orbitron font if needed
        if (!document.querySelector('link[href*="Orbitron"]')) {
            const fontLink = document.createElement('link');
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap';
            fontLink.rel = 'stylesheet';
            document.head.appendChild(fontLink);
        }
        // Trigger navigation animation
        this.animateNavigationElements();
    }
    animateNavigationElements() {
        // Progressive enhancement - only animate if motion is not reduced
        if (this.prefersReducedMotion) {
            document.querySelectorAll('.nav-animate-logo, .nav-animate-company-name, .nav-animate-item').forEach(el => {
                el.classList.add('nav-revealed');
            });
            return;
        }
        // Staggered animations
        const animations = [
            { selector: '.nav-animate-logo', delay: 100 },
            { selector: '.nav-animate-company-name', delay: 300 },
            { selector: '.nav-animate-item', delay: 400, stagger: 100 }
        ];
        animations.forEach(({ selector, delay, stagger }) => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((element, index) => {
                const finalDelay = delay + (stagger ? index * stagger : 0);
                setTimeout(() => {
                    element.classList.add('nav-revealed');
                }, finalDelay);
            });
        });
    }
    setupMobileNavigation() {
        if (!this.toggle || !this.nav)
            return;
        // Toggle click handler
        const toggleHandler = () => {
            this.isNavOpen ? this.closeNav() : this.openNav();
        };
        this.toggle.addEventListener('click', toggleHandler);
        this.eventListeners.push({ element: this.toggle, event: 'click', handler: toggleHandler });
        // Keyboard handlers
        const keydownHandler = (e) => {
            if (e.key === 'Escape' && this.isNavOpen) {
                this.closeNav();
                this.toggle.focus();
            }
        };
        document.addEventListener('keydown', keydownHandler);
        this.eventListeners.push({ element: document, event: 'keydown', handler: keydownHandler });
        // Click outside handler
        const clickOutsideHandler = (e) => {
            if (this.isNavOpen &&
                !this.nav.contains(e.target) &&
                !this.toggle.contains(e.target)) {
                this.closeNav();
            }
        };
        document.addEventListener('click', clickOutsideHandler);
        this.eventListeners.push({ element: document, event: 'click', handler: clickOutsideHandler });
        // Resize handler with throttling
        let resizeTimeout;
        const resizeHandler = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (window.innerWidth > 768 && this.isNavOpen) {
                    this.closeNav();
                }
            }, 250);
        };
        window.addEventListener('resize', resizeHandler);
        this.eventListeners.push({ element: window, event: 'resize', handler: resizeHandler });
    }
    openNav() {
        this.nav.classList.add('nav-show');
        this.toggle.setAttribute('aria-expanded', 'true');
        this.nav.setAttribute('aria-hidden', 'false');
        this.isNavOpen = true;
        const icon = this.toggle.querySelector('.nav-hamburger-icon');
        if (icon) {
            icon.classList.remove('nav-hamburger-closed');
            icon.classList.add('nav-hamburger-open');
        }
        // Focus management
        setTimeout(() => {
            const firstNavItem = this.nav.querySelector('.nav-link');
            if (firstNavItem) {
                firstNavItem.focus();
            }
        }, 300);
        // Emit event
        document.dispatchEvent(new CustomEvent('fnf:nav:opened'));
    }
    closeNav() {
        this.nav.classList.remove('nav-show');
        this.toggle.setAttribute('aria-expanded', 'false');
        this.nav.setAttribute('aria-hidden', 'true');
        this.isNavOpen = false;
        const icon = this.toggle.querySelector('.nav-hamburger-icon');
        if (icon) {
            icon.classList.remove('nav-hamburger-open');
            icon.classList.add('nav-hamburger-closed');
        }
        // Emit event
        document.dispatchEvent(new CustomEvent('fnf:nav:closed'));
    }
    highlightCurrentPage() {
        const currentPath = window.location.pathname;
        this.navItems.forEach(link => {
            const href = link.getAttribute('href');
            const linkPath = '/' + href;
            // Remove existing active state
            link.parentElement.classList.remove('slds-is-active');
            // Set active state
            if ((currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/')) && href === 'index.html') {
                link.parentElement.classList.add('slds-is-active');
            }
            else if (currentPath.includes(href) && href !== 'index.html') {
                link.parentElement.classList.add('slds-is-active');
            }
        });
    }
    setupFormEnhancements() {
        // Newsletter form enhancement
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            const submitHandler = (e) => {
                e.preventDefault();
                this.handleFormSubmission(newsletterForm, 'newsletter');
            };
            newsletterForm.addEventListener('submit', submitHandler);
            this.eventListeners.push({ element: newsletterForm, event: 'submit', handler: submitHandler });
        }
        // Contact form enhancement
        const contactForm = document.querySelector('#contact-form');
        if (contactForm) {
            const submitHandler = (e) => {
                e.preventDefault();
                this.handleFormSubmission(contactForm, 'contact');
            };
            contactForm.addEventListener('submit', submitHandler);
            this.eventListeners.push({ element: contactForm, event: 'submit', handler: submitHandler });
        }
        // Form field enhancements
        const formElements = document.querySelectorAll('.slds-input, .slds-textarea, .slds-select');
        formElements.forEach(element => {
            const focusHandler = () => {
                element.closest('.slds-form-element')?.classList.add('is-focused');
            };
            const blurHandler = () => {
                const formElement = element.closest('.slds-form-element');
                formElement?.classList.remove('is-focused');
                if (element.value) {
                    formElement?.classList.add('has-value');
                }
                else {
                    formElement?.classList.remove('has-value');
                }
            };
            element.addEventListener('focus', focusHandler);
            element.addEventListener('blur', blurHandler);
            this.eventListeners.push({ element, event: 'focus', handler: focusHandler }, { element, event: 'blur', handler: blurHandler });
            // Check initial state
            if (element.value) {
                element.closest('.slds-form-element')?.classList.add('has-value');
            }
        });
    }
    async handleFormSubmission(form, type) {
        const button = form.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        // Show loading state
        button.textContent = type === 'newsletter' ? 'Subscribing...' : 'Sending...';
        button.disabled = true;
        button.classList.add('slds-is-loading');
        try {
            // Simulate form submission
            await new Promise(resolve => setTimeout(resolve, 1500));
            // Success state
            button.textContent = type === 'newsletter' ? 'Subscribed!' : 'Message Sent!';
            button.classList.add('slds-button_success');
            if (type === 'contact') {
                this.showSuccessMessage(form);
            }
            // Reset form
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
                button.classList.remove('slds-is-loading', 'slds-button_success');
                form.reset();
                // Remove success message
                const successMessage = form.parentNode.querySelector('.fnf-success-message');
                if (successMessage) {
                    successMessage.remove();
                }
            }, type === 'newsletter' ? 3000 : 5000);
        }
        catch (error) {
            console.error('Form submission error:', error);
            button.textContent = 'Error - Try Again';
            button.disabled = false;
            button.classList.remove('slds-is-loading');
            button.classList.add('slds-button_destructive');
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('slds-button_destructive');
            }, 3000);
        }
    }
    showSuccessMessage(form) {
        const successMessage = document.createElement('div');
        successMessage.className = 'fnf-success-message slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_success';
        successMessage.innerHTML = '<h2>Thank you! We\'ll be in touch soon.</h2>';
        form.parentNode.insertBefore(successMessage, form);
    }
    async initializeLogoSystem() {
        // Logo system removed - site uses CSS-generated logos only
        this.setupLogoAccessibility();
    }
    setupLogoErrorHandling() {
        // Logo error handling removed - site uses CSS-generated logos only
    }
    handleLogoError(img) {
        // Logo error handling removed - site uses CSS-generated logos only
    }
    createCSSFallback(imgElement) {
        // CSS fallback removed - site uses CSS-generated logos only
    }
    async optimizeLogos() {
        // Logo optimization removed - site uses CSS-generated logos only
        const logos = [];
        for (const logo of logos) {
            if (logo.dataset.logoPriority === 'critical') {
                await this.optimizeLogo(logo);
            }
            else {
                // Lazy load non-critical logos
                if (this.capabilities.intersectionObserver) {
                    this.setupLazyLogoLoading(logo);
                }
            }
        }
    }
    async optimizeLogo(logoElement) {
        const originalSrc = logoElement.src || logoElement.dataset.src;
        const optimalSrc = this.getOptimalLogoSource(originalSrc);
        if (optimalSrc !== originalSrc) {
            logoElement.classList.add('logo-loading');
            try {
                await this.preloadImage(optimalSrc);
                logoElement.src = optimalSrc;
                logoElement.classList.remove('logo-loading');
                logoElement.classList.add('logo-fade-in');
            }
            catch (error) {
                console.warn('Logo optimization failed:', error);
                logoElement.classList.remove('logo-loading');
            }
        }
    }
    getOptimalLogoSource(src) {
        if (this.capabilities.webp && !this.capabilities.prefersReducedData) {
            return src.replace(/\.(png|jpg|jpeg)$/, '.webp');
        }
        return src;
    }
    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(src);
            img.onerror = () => reject(new Error(`Failed to load: ${src}`));
            img.src = src;
        });
    }
    setupLazyLogoLoading(logoElement) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.optimizeLogo(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        observer.observe(logoElement);
        this.observers.push(observer);
    }
    setupLogoAccessibility() {
        // High contrast mode detection
        const highContrastHandler = (e) => {
            if (e.matches) {
                document.documentElement.classList.add('high-contrast-mode');
                this.enhanceLogosForHighContrast();
            }
            else {
                document.documentElement.classList.remove('high-contrast-mode');
            }
        };
        const mediaQuery = window.matchMedia('(prefers-contrast: high)');
        mediaQuery.addEventListener('change', highContrastHandler);
        // Initial check
        if (mediaQuery.matches) {
            highContrastHandler(mediaQuery);
        }
    }
    enhanceLogosForHighContrast() {
        // Logo enhancement removed - site uses CSS-generated logos only
    }
    setupAccessibilityEnhancements() {
        // Keyboard navigation for logo links
        const keydownHandler = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const target = e.target;
                if (target.classList.contains('slds-brand__logo-link')) {
                    e.preventDefault();
                    target.click();
                }
            }
        };
        document.addEventListener('keydown', keydownHandler);
        this.eventListeners.push({ element: document, event: 'keydown', handler: keydownHandler });
        // Screen reader support
        this.setupScreenReaderSupport();
    }
    setupScreenReaderSupport() {
        if (document.querySelector('#fnf-status-announcer'))
            return;
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'slds-assistive-text';
        liveRegion.id = 'fnf-status-announcer';
        document.body.appendChild(liveRegion);
        this.liveRegion = liveRegion;
    }
    announceToScreenReader(message) {
        if (this.liveRegion) {
            this.liveRegion.textContent = message;
            setTimeout(() => {
                this.liveRegion.textContent = '';
            }, 1000);
        }
    }
    bindCoreEventListeners() {
        // Reduced motion preference changes
        const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const motionHandler = (e) => {
            this.prefersReducedMotion = e.matches;
            document.dispatchEvent(new CustomEvent('fnf:motion:changed', {
                detail: { prefersReducedMotion: this.prefersReducedMotion }
            }));
        };
        motionMediaQuery.addEventListener('change', motionHandler);
        // Page visibility changes
        const visibilityHandler = () => {
            document.dispatchEvent(new CustomEvent('fnf:visibility:changed', {
                detail: { hidden: document.hidden }
            }));
        };
        document.addEventListener('visibilitychange', visibilityHandler);
        this.eventListeners.push({ element: document, event: 'visibilitychange', handler: visibilityHandler });
    }
    // Public API methods
    getCapabilities() {
        return { ...this.capabilities };
    }
    isReady() {
        return this.isInitialized;
    }
    registerModule(name, module) {
        this.modules.set(name, module);
        console.log(`📦 Module registered: ${name}`);
    }
    getModule(name) {
        return this.modules.get(name);
    }
    // Cleanup method
    destroy() {
        // Remove all event listeners
        this.eventListeners.forEach(({ element, event, handler, capture }) => {
            element.removeEventListener(event, handler, capture);
        });
        // Disconnect all observers
        this.observers.forEach(observer => observer.disconnect());
        // Clear caches
        this.logoCache.clear();
        this.modules.clear();
        // Remove live region
        if (this.liveRegion) {
            this.liveRegion.remove();
        }
        this.isInitialized = false;
        console.log('🧹 Food-N-Force Core cleaned up');
    }
}
// Initialize core when DOM is ready
const initCore = () => {
    if (!window.fnfCore) {
        window.fnfCore = new FoodNForceCore();
    }
};
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCore);
}
else {
    initCore();
}
// Export for module usage
window.FoodNForceCore = FoodNForceCore;
//# sourceMappingURL=fnf-core.js.map