/**
 * Food-N-Force Website Navigation Module
 * Enhanced with modern animations, interactions, and performance features
 */

class MobileNavigation {
    constructor() {
        this.nav = document.getElementById('main-nav');
        this.toggle = document.querySelector('.mobile-nav-toggle');
        this.navItems = document.querySelectorAll('.slds-nav-horizontal__item a');
        this.isOpen = false;
        
        this.init();
    }

    init() {
        if (!this.nav || !this.toggle) {
            console.warn('Navigation elements not found');
            return;
        }

        this.bindEvents();
        this.setInitialState();
    }

    bindEvents() {
        // Toggle button click with animation
        this.toggle.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleNav();
        });

        // Navigation item clicks
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                this.closeNav();
            });
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-nav')) {
                this.closeNav();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeNav();
                this.toggle.focus();
            }
        });

        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 768) {
                    // Reset mobile nav state on desktop
                    this.nav.classList.remove('show');
                    this.nav.style.display = '';
                    this.toggle.setAttribute('aria-expanded', 'false');
                    this.isOpen = false;
                }
            }, 250);
        });
    }

    setInitialState() {
        this.toggle.setAttribute('aria-expanded', 'false');
        this.nav.setAttribute('aria-hidden', 'true');
        
        // Ensure nav is hidden on mobile on page load
        if (window.innerWidth <= 768) {
            this.nav.classList.remove('show');
            this.nav.style.display = '';
        }
    }

    toggleNav() {
        if (this.isOpen) {
            this.closeNav();
        } else {
            this.openNav();
        }
    }

    openNav() {
        // Force reflow to ensure transition works
        this.nav.style.display = 'flex';
        this.nav.offsetHeight; // Trigger reflow
        
        this.nav.classList.add('show');
        this.toggle.setAttribute('aria-expanded', 'true');
        this.nav.setAttribute('aria-hidden', 'false');
        this.isOpen = true;

        // Focus first navigation item after animation
        setTimeout(() => {
            const firstNavItem = this.nav.querySelector('a');
            if (firstNavItem) {
                firstNavItem.focus();
            }
        }, 300);
    }

    closeNav() {
        this.nav.classList.remove('show');
        this.toggle.setAttribute('aria-expanded', 'false');
        this.nav.setAttribute('aria-hidden', 'true');
        this.isOpen = false;
        
        // Reset display after transition completes
        setTimeout(() => {
            if (!this.isOpen) {
                this.nav.style.display = '';
            }
        }, 300);
    }
}

/**
 * Scroll Animations Module
 * Handles intersection observer for element animations
 */
class ScrollAnimations {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '-50px'
        };
        this.init();
    }
    
    init() {
        if ('IntersectionObserver' in window) {
            this.setupObservers();
        } else {
            // Fallback for older browsers
            this.showAllElements();
        }
    }
    
    setupObservers() {
        // Cards observer
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                        cardObserver.unobserve(entry.target);
                    }, index * 100);
                }
            });
        }, this.observerOptions);
        
        // Stats observer
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    this.animateStats(entry.target);
                    statsObserver.unobserve(entry.target);
                }
            });
        }, this.observerOptions);
        
        // Observe elements
        document.querySelectorAll('.service-card, .focus-area-card, .resource-card, .testimonial-card, .value-card, .expertise-card')
            .forEach(el => cardObserver.observe(el));
            
        document.querySelectorAll('.stat-item')
            .forEach(el => statsObserver.observe(el));
            
        document.querySelectorAll('.mission-text')
            .forEach(el => cardObserver.observe(el));
    }
    
    animateStats(statItem) {
        statItem.classList.add('visible');
        const numberEl = statItem.querySelector('.stat-number');
        if (numberEl) {
            new StatCounter(numberEl);
        }
    }
    
    showAllElements() {
        // Fallback for browsers without IntersectionObserver
        document.querySelectorAll('.service-card, .focus-area-card, .resource-card, .stat-item')
            .forEach(el => el.classList.add('visible'));
    }
}

/**
 * Statistics Counter Animation
 * Animates number counting effect
 */
class StatCounter {
    constructor(element) {
        this.element = element;
        this.target = this.parseNumber(element.textContent);
        this.suffix = element.dataset.suffix || '';
        this.duration = 2000;
        this.animate();
    }
    
    parseNumber(text) {
        return parseInt(text.replace(/[^0-9]/g, ''));
    }
    
    animate() {
        const start = 0;
        const range = this.target - start;
        const startTime = performance.now();
        
        const updateNumber = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / this.duration, 1);
            
            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + (range * easeOutQuart));
            
            this.element.textContent = current + this.suffix;
            
            if (progress < 1) {
                requestAnimationFrame(updateNumber);
            } else {
                this.element.textContent = this.target + this.suffix;
                this.element.parentElement.classList.add('counted');
            }
        };
        
        requestAnimationFrame(updateNumber);
    }
}

/**
 * Parallax Effect Module
 * Creates depth with scrolling parallax
 */
class ParallaxEffect {
    constructor() {
        this.hero = document.querySelector('.hero-section');
        this.heroContent = document.querySelector('.hero-content');
        this.parallaxElements = [];
        this.init();
    }
    
    init() {
        if (!this.hero || !this.heroContent) return;
        
        this.setupParallax();
        this.bindEvents();
    }
    
    setupParallax() {
        // Add parallax data attributes if needed
        this.parallaxElements = [
            { element: this.heroContent, speed: 0.5 }
        ];
    }
    
    bindEvents() {
        let ticking = false;
        
        const updateParallax = () => {
            const scrolled = window.pageYOffset;
            
            this.parallaxElements.forEach(item => {
                const { element, speed } = item;
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
            
            ticking = false;
        };
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(updateParallax);
                ticking = true;
            }
        });
    }
}

/**
 * Magnetic Buttons Module
 * Creates magnetic effect on button hover
 */
class MagneticButtons {
    constructor() {
        this.buttons = document.querySelectorAll('.slds-button');
        this.init();
    }
    
    init() {
        this.buttons.forEach(button => {
            button.addEventListener('mousemove', (e) => this.magnetize(e, button));
            button.addEventListener('mouseleave', (e) => this.demagnetize(e, button));
            button.addEventListener('click', (e) => this.createRipple(e, button));
        });
    }
    
    magnetize(e, button) {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        button.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        button.style.transition = 'transform 0.1s ease-out';
    }
    
    demagnetize(e, button) {
        button.style.transform = 'translate(0, 0)';
        button.style.transition = 'transform 0.3s ease-out';
    }
    
    createRipple(e, button) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
}

/**
 * Smart Preloader Module
 * Predictively preloads pages based on user behavior
 */
class SmartPreloader {
    constructor() {
        this.preloadQueue = new Set();
        this.init();
    }
    
    init() {
        // Preload on hover intent
        document.querySelectorAll('a[href]').forEach(link => {
            let hoverTimer;
            
            link.addEventListener('mouseenter', () => {
                hoverTimer = setTimeout(() => {
                    this.preloadPage(link.href);
                }, 200);
            });
            
            link.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimer);
            });
        });
        
        // Preload visible links in viewport
        if ('IntersectionObserver' in window) {
            const linkObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.preloadPage(entry.target.href);
                    }
                });
            }, { rootMargin: '50px' });
            
            document.querySelectorAll('a[href$=".html"]').forEach(link => {
                linkObserver.observe(link);
            });
        }
    }
    
    preloadPage(url) {
        if (url.includes('.html') && !this.preloadQueue.has(url) && url !== window.location.href) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            document.head.appendChild(link);
            this.preloadQueue.add(url);
        }
    }
}

/**
 * Enhanced Form Module
 * Handles form validation and user experience improvements
 */
class FormEnhancement {
    constructor() {
        this.forms = document.querySelectorAll('form');
        this.init();
    }

    init() {
        this.forms.forEach(form => {
            this.enhanceForm(form);
            this.setupFloatLabels(form);
        });
    }
    
    setupFloatLabels(form) {
        const formElements = form.querySelectorAll('.slds-form-element');
        
        formElements.forEach(element => {
            const input = element.querySelector('input, textarea');
            const label = element.querySelector('label');
            
            if (input && label) {
                // Wrap in float label container
                element.classList.add('form-float-label');
                
                // Check initial state
                if (input.value) {
                    element.classList.add('has-value');
                }
                
                // Add event listeners
                input.addEventListener('focus', () => {
                    element.classList.add('focused');
                });
                
                input.addEventListener('blur', () => {
                    element.classList.remove('focused');
                    if (input.value) {
                        element.classList.add('has-value');
                    } else {
                        element.classList.remove('has-value');
                    }
                });
            }
        });
    }

    enhanceForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // Add real-time validation
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearErrors(input));
        });

        // Handle form submission
        form.addEventListener('submit', (e) => {
            if (!this.validateForm(form)) {
                e.preventDefault();
                this.showFormError(form);
            }
        });
    }

    validateField(field) {
        const errorContainer = this.getErrorContainer(field);
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (field.hasAttribute('required') && !field.value.trim()) {
            isValid = false;
            errorMessage = `${this.getFieldLabel(field)} is required.`;
        }

        // Email validation
        if (field.type === 'email' && field.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address.';
            }
        }

        // Phone validation
        if (field.type === 'tel' && field.value.trim()) {
            const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
            if (!phoneRegex.test(field.value.replace(/\D/g, ''))) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number.';
            }
        }

        this.displayFieldError(field, errorContainer, isValid, errorMessage);
        return isValid;
    }

    validateForm(form) {
        const fields = form.querySelectorAll('input[required], textarea[required], select[required]');
        let isFormValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isFormValid = false;
            }
        });

        return isFormValid;
    }
    
    showFormError(form) {
        // Shake the form to indicate error
        form.style.animation = 'shakeError 0.5s ease';
        setTimeout(() => {
            form.style.animation = '';
        }, 500);
    }

    getFieldLabel(field) {
        const label = document.querySelector(`label[for="${field.id}"]`);
        return label ? label.textContent.replace('*', '').trim() : 'This field';
    }

    getErrorContainer(field) {
        let errorContainer = field.parentNode.querySelector('.field-error');
        
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'field-error';
            errorContainer.setAttribute('role', 'alert');
            field.parentNode.appendChild(errorContainer);
        }

        return errorContainer;
    }

    displayFieldError(field, errorContainer, isValid, errorMessage) {
        if (isValid) {
            field.classList.remove('slds-has-error');
            errorContainer.textContent = '';
            errorContainer.style.display = 'none';
        } else {
            field.classList.add('slds-has-error');
            errorContainer.textContent = errorMessage;
            errorContainer.style.display = 'block';
        }
    }

    clearErrors(field) {
        field.classList.remove('slds-has-error');
        const errorContainer = field.parentNode.querySelector('.field-error');
        if (errorContainer) {
            errorContainer.textContent = '';
            errorContainer.style.display = 'none';
        }
    }
}

/**
 * Contextual Help System
 * Shows helpful tooltips based on user interaction
 */
class ContextualHelp {
    constructor() {
        this.helpTriggers = {
            formHesitation: 3000,
            navigationConfusion: 5000
        };
        this.activeTooltips = new Map();
        this.init();
    }
    
    init() {
        // Monitor form field focus duration
        document.querySelectorAll('input, textarea').forEach(field => {
            let focusTimer;
            
            field.addEventListener('focus', () => {
                focusTimer = setTimeout(() => {
                    this.showContextualHelp(field);
                }, this.helpTriggers.formHesitation);
            });
            
            field.addEventListener('blur', () => {
                clearTimeout(focusTimer);
                this.hideContextualHelp(field);
            });
            
            field.addEventListener('input', () => {
                clearTimeout(focusTimer);
                this.hideContextualHelp(field);
            });
        });
    }
    
    showContextualHelp(element) {
        if (this.activeTooltips.has(element)) return;
        
        const helpText = element.getAttribute('aria-describedby') 
            ? document.getElementById(element.getAttribute('aria-describedby'))?.textContent 
            : element.dataset.help || 'Need help? Start typing or click for more info.';
            
        const tooltip = this.createTooltip(helpText);
        this.positionTooltip(tooltip, element);
        element.parentNode.appendChild(tooltip);
        
        setTimeout(() => tooltip.classList.add('visible'), 100);
        this.activeTooltips.set(element, tooltip);
    }
    
    hideContextualHelp(element) {
        const tooltip = this.activeTooltips.get(element);
        if (tooltip) {
            tooltip.classList.remove('visible');
            setTimeout(() => {
                tooltip.remove();
                this.activeTooltips.delete(element);
            }, 300);
        }
    }
    
    createTooltip(text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.setAttribute('role', 'tooltip');
        return tooltip;
    }
    
    positionTooltip(tooltip, element) {
        const rect = element.getBoundingClientRect();
        tooltip.style.left = '0';
        tooltip.style.top = `${element.offsetHeight + 10}px`;
    }
}

/**
 * Accessibility Enhancement Module
 * Improves keyboard navigation and screen reader support
 */
class AccessibilityEnhancement {
    constructor() {
        this.init();
    }

    init() {
        this.enhanceKeyboardNavigation();
        this.addSkipLinks();
        this.improveHeadingStructure();
        this.setupLiveRegions();
    }

    enhanceKeyboardNavigation() {
        // Add visible focus indicators
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });

        // Trap focus in mobile navigation when open
        const nav = document.getElementById('main-nav');
        if (nav) {
            nav.addEventListener('keydown', (e) => {
                if (e.key === 'Tab' && nav.classList.contains('show')) {
                    this.trapFocus(e, nav);
                }
            });
        }
    }

    trapFocus(e, container) {
        const focusableElements = container.querySelectorAll(
            'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }

    addSkipLinks() {
        // Skip links are already in HTML, but we can enhance them
        const skipLinks = document.querySelectorAll('.skip-link');
        skipLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    improveHeadingStructure() {
        // Ensure proper heading hierarchy
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let previousLevel = 0;
        
        headings.forEach(heading => {
            const currentLevel = parseInt(heading.tagName.charAt(1));
            
            if (currentLevel > previousLevel + 1) {
                console.warn(`Heading level gap detected: ${heading.textContent}`);
            }
            
            previousLevel = currentLevel;
        });
    }
    
    setupLiveRegions() {
        // Create a live region for dynamic announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'visually-hidden';
        liveRegion.id = 'live-region';
        document.body.appendChild(liveRegion);
    }
}

/**
 * Performance Enhancement Module
 * Handles lazy loading and performance optimizations
 */
class PerformanceEnhancement {
    constructor() {
        this.init();
    }

    init() {
        this.lazyLoadImages();
        this.deferNonCriticalCSS();
        this.optimizeAnimations();
    }

    lazyLoadImages() {
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px'
            });

            images.forEach(img => imageObserver.observe(img));
        } else {
            // Fallback for older browsers
            images.forEach(img => {
                img.src = img.dataset.src;
            });
        }
    }
    
    deferNonCriticalCSS() {
        // Defer loading of non-critical CSS
        const links = document.querySelectorAll('link[data-defer]');
        links.forEach(link => {
            link.setAttribute('media', 'print');
            link.addEventListener('load', () => {
                link.media = 'all';
            });
        });
    }
    
    optimizeAnimations() {
        // Pause animations when not visible
        let visibilityState = 'visible';
        
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                visibilityState = 'hidden';
                // Pause all CSS animations
                document.querySelectorAll('*').forEach(el => {
                    const computedStyle = window.getComputedStyle(el);
                    if (computedStyle.animationName !== 'none') {
                        el.style.animationPlayState = 'paused';
                    }
                });
            } else {
                visibilityState = 'visible';
                // Resume animations
                document.querySelectorAll('*').forEach(el => {
                    if (el.style.animationPlayState === 'paused') {
                        el.style.animationPlayState = 'running';
                    }
                });
            }
        });
    }
}

/**
 * Feature Detection Module
 * Detects browser capabilities and applies appropriate enhancements
 */
class FeatureDetection {
    constructor() {
        this.features = {
            intersectionObserver: 'IntersectionObserver' in window,
            cssBackdropFilter: this.checkBackdropFilter(),
            webAnimations: 'animate' in Element.prototype,
            smoothScroll: 'scrollBehavior' in document.documentElement.style,
            customProperties: window.CSS && CSS.supports('color', 'var(--test)'),
            grid: window.CSS && CSS.supports('display', 'grid'),
            sticky: window.CSS && CSS.supports('position', 'sticky')
        };
        
        this.applyEnhancements();
    }
    
    checkBackdropFilter() {
        return window.CSS && (
            CSS.supports('backdrop-filter', 'blur(10px)') ||
            CSS.supports('-webkit-backdrop-filter', 'blur(10px)')
        );
    }
    
    applyEnhancements() {
        // Add feature classes to HTML element
        Object.entries(this.features).forEach(([feature, supported]) => {
            if (supported) {
                document.documentElement.classList.add(`has-${feature}`);
            } else {
                document.documentElement.classList.add(`no-${feature}`);
            }
        });
        
        // Log feature support for debugging
        console.log('Feature Support:', this.features);
    }
}

/**
 * Analytics and Tracking Module
 * Enhanced with engagement tracking
 */
class AnalyticsTracking {
    constructor() {
        this.events = [];
        this.sessionStart = Date.now();
        this.init();
    }

    init() {
        this.trackPageView();
        this.trackUserInteractions();
        this.trackEngagement();
        this.trackPerformance();
    }

    trackPageView() {
        const pageData = {
            page: window.location.pathname,
            title: document.title,
            timestamp: new Date().toISOString(),
            referrer: document.referrer
        };
        
        this.trackEvent('page_view', pageData);
    }

    trackUserInteractions() {
        // Track button clicks with context
        document.querySelectorAll('.slds-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.trackEvent('button_click', {
                    button_text: e.target.textContent.trim(),
                    button_class: e.target.className,
                    page: window.location.pathname,
                    timestamp: new Date().toISOString()
                });
            });
        });

        // Track form submissions
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('submit', () => {
                this.trackEvent('form_submit', {
                    form_id: form.id || 'unknown',
                    page: window.location.pathname,
                    fields_count: form.querySelectorAll('input, textarea, select').length,
                    timestamp: new Date().toISOString()
                });
            });
        });
        
        // Track navigation clicks
        document.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', () => {
                this.trackEvent('navigation_click', {
                    link_text: link.textContent.trim(),
                    destination: link.href,
                    timestamp: new Date().toISOString()
                });
            });
        });
    }
    
    trackEngagement() {
        // Track scroll depth
        let maxScroll = 0;
        let scrollTimer;
        
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                const scrollPercentage = Math.round(
                    (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
                );
                
                if (scrollPercentage > maxScroll) {
                    maxScroll = scrollPercentage;
                    
                    // Track milestones
                    if ([25, 50, 75, 90, 100].includes(maxScroll)) {
                        this.trackEvent('scroll_milestone', {
                            depth: maxScroll,
                            page: window.location.pathname,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            }, 100);
        });
        
        // Track time on page
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Math.round((Date.now() - this.sessionStart) / 1000);
            this.trackEvent('page_exit', {
                time_on_page: timeOnPage,
                page: window.location.pathname,
                max_scroll_depth: maxScroll
            });
        });
    }
    
    trackPerformance() {
        // Track page load performance
        if ('performance' in window && 'timing' in window.performance) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const timing = window.performance.timing;
                    const loadTime = timing.loadEventEnd - timing.navigationStart;
                    const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
                    const firstPaint = performance.getEntriesByType('paint').find(
                        entry => entry.name === 'first-contentful-paint'
                    );
                    
                    this.trackEvent('performance_metrics', {
                        page_load_time: loadTime,
                        dom_ready_time: domReady,
                        first_contentful_paint: firstPaint ? firstPaint.startTime : null,
                        page: window.location.pathname
                    });
                }, 0);
            });
        }
    }

    trackEvent(eventName, parameters) {
        const event = {
            name: eventName,
            parameters: parameters,
            timestamp: new Date().toISOString()
        };
        
        this.events.push(event);
        
        // Log to console in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Analytics Event:', event);
        }
        
        // Here you would send to your analytics service
        // Example: gtag('event', eventName, parameters);
        // Example: analytics.track(eventName, parameters);
    }
}

/**
 * Initialize all modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Feature detection first
        new FeatureDetection();
        
        // Core functionality
        new MobileNavigation();
        new FormEnhancement();
        new AccessibilityEnhancement();
        new PerformanceEnhancement();
        
        // Enhanced features
        new ScrollAnimations();
        new ParallaxEffect();
        new MagneticButtons();
        new SmartPreloader();
        new ContextualHelp();
        
        // Analytics
        new AnalyticsTracking();
        
        console.log('Food-N-Force website modules initialized successfully');
    } catch (error) {
        console.error('Error initializing website modules:', error);
    }
});

// Smooth page transitions
window.addEventListener('beforeunload', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease-out';
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MobileNavigation,
        FormEnhancement,
        AccessibilityEnhancement,
        PerformanceEnhancement,
        ScrollAnimations,
        ParallaxEffect,
        MagneticButtons,
        SmartPreloader,
        ContextualHelp,
        FeatureDetection,
        AnalyticsTracking,
        StatCounter
    };
}