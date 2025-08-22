/**
 * Food-N-Force Unified Navigation System - REFACTORED
 * Phase 4: Converted 33 style manipulations to CSS classes
 * Phase 5: Integrated actual logo images with performance optimization
 * Consolidates all navigation functionality into a single, maintainable module
 */

// Logo Loading Manager for performance optimization
class LogoManager {
    constructor() {
        this.logoLoadingStates = new Map();
        this.preloadCriticalLogos();
        this.handleLogoErrors();
        this.setupAccessibilityEnhancements();
        this.initPerformanceMonitoring();
    }
    
    preloadCriticalLogos() {
        // Skip preloading for file:// protocol to avoid CORS issues
        if (location.protocol === 'file:') {
            console.log('Skipping logo preloading for file:// protocol');
            return;
        }
        
        // Logo preloading removed - site uses CSS-generated logos only
        console.log('Using CSS-generated logos - no image preloading needed');
        return;
    }
    
    handleLogoErrors() {
        // Logo error handling removed - site uses CSS-generated logos only
    }
    
    createCSSFallback(imgElement) {
        // CSS fallback function removed - site uses CSS-generated logos only
    }
    
    setupAccessibilityEnhancements() {
        // Enhanced keyboard navigation for logo links
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const target = e.target;
                if (target.classList.contains('slds-brand__logo-link')) {
                    e.preventDefault();
                    target.click();
                }
            }
        });
        
        // Screen reader announcements for logo state changes
        this.setupScreenReaderSupport();
        
        // High contrast mode detection and enhancement
        this.detectHighContrastMode();
    }
    
    setupScreenReaderSupport() {
        // Create live region for logo status announcements
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'slds-assistive-text';
        liveRegion.id = 'logo-status-announcer';
        document.body.appendChild(liveRegion);
        
        this.liveRegion = liveRegion;
    }
    
    announceToScreenReader(message) {
        if (this.liveRegion) {
            this.liveRegion.textContent = message;
            // Clear after announcement
            setTimeout(() => {
                this.liveRegion.textContent = '';
            }, 1000);
        }
    }
    
    detectHighContrastMode() {
        // Detect Windows High Contrast Mode
        if (window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches) {
            document.documentElement.classList.add('high-contrast-mode');
            this.enhanceLogosForHighContrast();
        }
        
        // Listen for changes
        if (window.matchMedia) {
            window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
                if (e.matches) {
                    document.documentElement.classList.add('high-contrast-mode');
                    this.enhanceLogosForHighContrast();
                } else {
                    document.documentElement.classList.remove('high-contrast-mode');
                }
            });
        }
    }
    
    enhanceLogosForHighContrast() {
        const logos = document.querySelectorAll('.fnf-logo-image, .hero-logo-large, .footer-logo');
        logos.forEach(logo => {
            logo.style.border = '2px solid currentColor';
            logo.style.filter = 'contrast(1.2)';
        });
    }
    
    initPerformanceMonitoring() {
        // Monitor logo loading performance
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.name.includes('logo')) {
                        console.log(`Logo ${entry.name} loaded in ${entry.duration}ms`);
                        
                        // Log slow loading logos
                        if (entry.duration > 1000) {
                            console.warn(`Slow logo loading detected: ${entry.name}`);
                        }
                    }
                });
            });
            
            try {
                observer.observe({ entryTypes: ['resource'] });
            } catch (e) {
                console.warn('Performance monitoring not available:', e);
            }
        }
    }
}

class FoodNForceNavigation {
    constructor() {
        this.nav = null;
        this.toggle = null;
        this.navItems = null;
        this.isOpen = false;
        this.observers = [];
        this.logoManager = new LogoManager();

        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.injectNavigation();
        this.setupMobileNavigation();
        this.setupScrollAnimations();
        this.highlightCurrentPage();
        this.setupFormEnhancements();
    }

    injectNavigation() {
        const navHTML = '<nav class="navbar universal-nav custom-nav" role="banner">' +
            '<div class="slds-container_fluid">' +
            '<!-- SLDS Brand Header Pattern: Logo (far left) | Company Name (center) | Mobile Toggle (far right) -->' +
            '<div class="slds-grid slds-grid_align-spread slds-wrap slds-grid_vertical-align-center slds-p-vertical_small header-layout">' +
            '<!-- SLDS Brand Logo Container - Far Left -->' +
            '<div class="slds-col slds-no-flex logo-container">' +
            '<div class="slds-brand fnf-logo-wrapper nav-animate-logo">' +
            '<a href="index.html" class="slds-brand__logo-link brand-logo-link" aria-label="Food-N-Force Home" title="Food-N-Force - Modern Solutions for Food Banks">' +
            '<div class="fnf-logo" role="img" aria-labelledby="nav-logo-title">' +
            '<div class="fnf-inner">' +
            '<span class="fnf-wordmark">F-n-F</span>' +
            '</div>' +
            '</div>' +
            '<span id="nav-logo-title" class="slds-assistive-text">Food-N-Force Logo - Modern Solutions for Food Banks</span>' +
            '</a>' +
            '</div>' +
            '</div>' +
            '<!-- Company Name Container - Center -->' +
            '<div class="slds-col slds-no-flex company-name-container-centered">' +
            '<h1 class="brand-logo universal-brand-logo nav-animate-company-name">Food-N-Force</h1>' +
            '</div>' +
            '<!-- Mobile Navigation Toggle - Far Right -->' +
            '<div class="slds-col slds-no-flex slds-hide slds-show_small mobile-toggle-container">' +
            '<button class="mobile-nav-toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="main-nav">' +
            '<span class="hamburger-icon nav-hamburger-icon nav-hamburger-closed">☰</span>' +
            '</button>' +
            '</div>' +
            '<!-- Spacer for desktop (maintains balance) -->' +
            '<div class="slds-col slds-no-flex slds-show slds-hide_small nav-spacer">' +
            '<!-- Balances the logo container -->' +
            '</div>' +
            '</div>' +
            '<!-- Navigation Menu - Centered Below Company Name -->' +
            '<div class="slds-grid slds-grid_align-center slds-p-top_small">' +
            '<div class="slds-col">' +
            '<nav class="slds-text-align_center nav-menu-container" role="navigation" aria-label="Main navigation">' +
            '<ul class="nav-menu slds-nav-horizontal universal-nav-menu nav-mobile-menu" id="main-nav">' +
            '<li class="slds-nav-horizontal__item">' +
            '<a href="index.html" class="nav-link universal-nav-link nav-animate-item">Home</a>' +
            '</li>' +
            '<li class="slds-nav-horizontal__item">' +
            '<a href="services.html" class="nav-link universal-nav-link nav-animate-item">Services</a>' +
            '</li>' +
            '<li class="slds-nav-horizontal__item">' +
            '<a href="resources.html" class="nav-link universal-nav-link nav-animate-item">Resources</a>' +
            '</li>' +
            '<li class="slds-nav-horizontal__item">' +
            '<a href="impact.html" class="nav-link universal-nav-link nav-animate-item">Impact</a>' +
            '</li>' +
            '<li class="slds-nav-horizontal__item">' +
            '<a href="contact.html" class="nav-link universal-nav-link nav-animate-item">Contact</a>' +
            '</li>' +
            '<li class="slds-nav-horizontal__item">' +
            '<a href="about.html" class="nav-link universal-nav-link nav-animate-item">About Us</a>' +
            '</li>' +
            '</ul>' +
            '</nav>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</nav>';
        
        // Insert navigation at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', navHTML);
        
        // Add Orbitron font link to head if not already present
        if (!document.querySelector('link[href*="Orbitron"]')) {
            const fontLink = document.createElement('link');
            fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap';
            fontLink.rel = 'stylesheet';
            document.head.appendChild(fontLink);
        }
        
        // Cache DOM elements
        this.nav = document.getElementById('main-nav');
        this.toggle = document.querySelector('.mobile-nav-toggle');
        this.navItems = document.querySelectorAll('.nav-link');
        
        // Animate navigation elements after injection using CSS classes
        this.animateNavigationElements();
    }
    
    animateNavigationElements() {
        // Animate company name using CSS classes
        const companyName = document.querySelector('.nav-animate-company-name');
        if (companyName) {
            setTimeout(() => {
                companyName.classList.add('nav-revealed');
            }, 300);
        }
        
        // Animate logo using CSS classes
        const logoContainer = document.querySelector('.nav-animate-logo');
        if (logoContainer) {
            setTimeout(() => {
                logoContainer.classList.add('nav-revealed');
            }, 100);
        }
        
        // Animate nav items using CSS classes with staggered delays
        const navItems = document.querySelectorAll('.nav-animate-item');
        navItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('nav-revealed');
            }, 400 + (index * 100));
        });
    }

    setupMobileNavigation() {
        this.toggle.addEventListener('click', () => {
            this.isOpen ? this.closeNav() : this.openNav();
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeNav();
                this.toggle.focus();
            }
        });

        // Handle clicks outside nav
        document.addEventListener('click', (e) => {
            if (this.isOpen && 
                !this.nav.contains(e.target) && 
                !this.toggle.contains(e.target)) {
                this.closeNav();
            }
        });

        // Handle resize events
        this.handleResize();
    }

    openNav() {
        // Use CSS classes instead of inline styles
        this.nav.classList.add('nav-show');
        
        this.toggle.setAttribute('aria-expanded', 'true');
        this.nav.setAttribute('aria-hidden', 'false');
        this.isOpen = true;

        // Animate hamburger icon using CSS classes
        const icon = this.toggle.querySelector('.nav-hamburger-icon');
        if (icon) {
            icon.classList.remove('nav-hamburger-closed');
            icon.classList.add('nav-hamburger-open');
        }

        // Trap focus
        setTimeout(() => {
            const firstNavItem = this.nav.querySelector('.nav-link');
            if (firstNavItem) {
                firstNavItem.focus();
            }
        }, 300);
    }

    closeNav() {
        // Use CSS classes instead of inline styles
        this.nav.classList.remove('nav-show');
        this.toggle.setAttribute('aria-expanded', 'false');
        this.nav.setAttribute('aria-hidden', 'true');
        this.isOpen = false;

        // Reset hamburger icon using CSS classes
        const icon = this.toggle.querySelector('.nav-hamburger-icon');
        if (icon) {
            icon.classList.remove('nav-hamburger-open');
            icon.classList.add('nav-hamburger-closed');
        }
    }

    handleResize() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 768 && this.isOpen) {
                    this.closeNav();
                }
            }, 250);
        });
    }

    highlightCurrentPage() {
        const currentPath = window.location.pathname;
        
        this.navItems.forEach(link => {
            const href = link.getAttribute('href');
            const linkPath = '/' + href;
            
            // Remove any existing active class
            link.parentElement.classList.remove('slds-is-active');
            
            // Check if we're on the home page
            if ((currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/')) && href === 'index.html') {
                link.parentElement.classList.add('slds-is-active');
            }
            // Check other pages
            else if (currentPath.includes(href) && href !== 'index.html') {
                link.parentElement.classList.add('slds-is-active');
            }
        });
    }

    setupScrollAnimations() {
        if (!this.observers) return;

        // Intersection Observer for scroll animations
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    
                    // Special handling for stats numbers
                    if (entry.target.classList.contains('stat-number') && 
                        entry.target.hasAttribute('data-count')) {
                        this.animateNumber(entry.target);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px'
        });

        // Stats animation observer (for better control)
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    this.animateStats(entry.target);
                    entry.target.classList.add('counted');
                }
            });
        }, {
            threshold: 0.5
        });

        // Observe elements
        const animatedElements = document.querySelectorAll('.focus-area-card, .service-card, .resource-card, .testimonial-card, .value-card, .expertise-card');
        animatedElements.forEach(el => {
            animationObserver.observe(el);
            el.classList.add('fade-in-up');
        });

        // Observe stats
        const statNumbers = document.querySelectorAll('.stat-number[data-count]');
        statNumbers.forEach(stat => {
            statsObserver.observe(stat);
        });

        // Mission text animation
        const missionText = document.querySelector('.mission-text');
        if (missionText) {
            animationObserver.observe(missionText);
            missionText.classList.add('fade-in');
        }

        // Store observers for cleanup
        this.observers.push(animationObserver, statsObserver);
    }

    animateStats(element) {
        const text = element.textContent.trim();
        const cleanedText = text.replace(/[+%M]/g, '');
        const target = parseInt(cleanedText) || 0;
        
        // Determine suffix
        let suffix = '';
        if (text.includes('+')) suffix = '+';
        else if (text.includes('%')) suffix = '%';
        else if (text.includes('M')) suffix = 'M+';
        
        if (target === 0) {
            return;
        }
        
        this.animateToNumber(element, 0, target, suffix, 2000);
    }

    animateToNumber(element, start, end, suffix, duration) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= end) {
                element.textContent = end + suffix;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current) + suffix;
            }
        }, 16);
    }

    animateNumber(element) {
        const target = parseInt(element.getAttribute('data-count'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const updateNumber = () => {
            current += increment;
            if (current < target) {
                element.textContent = Math.floor(current);
                requestAnimationFrame(updateNumber);
            } else {
                element.textContent = target;
            }
        };

        updateNumber();
    }

    setupFormEnhancements() {
        // Newsletter form
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const button = newsletterForm.querySelector('button[type="submit"]');
                const originalText = button.textContent;
                
                // Show loading state
                button.textContent = 'Subscribing...';
                button.disabled = true;
                
                // Simulate submission
                setTimeout(() => {
                    button.textContent = 'Subscribed!';
                    button.classList.add('slds-button_success');
                    
                    // Reset after delay
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.disabled = false;
                        button.classList.remove('slds-button_success');
                        newsletterForm.reset();
                    }, 3000);
                }, 1500);
            });
        }

        // Contact form
        const contactForm = document.querySelector('#contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const button = contactForm.querySelector('button[type="submit"]');
                const originalText = button.textContent;
                
                // Show loading state
                button.textContent = 'Sending...';
                button.disabled = true;
                
                // Simulate submission
                setTimeout(() => {
                    button.textContent = 'Message Sent!';
                    button.classList.add('slds-button_success');
                    
                    // Show success message
                    const successMessage = document.createElement('div');
                    successMessage.className = 'slds-notify slds-notify_alert slds-theme_alert-texture slds-theme_success';
                    successMessage.innerHTML = '<h2>Thank you! We\'ll be in touch soon.</h2>';
                    contactForm.parentNode.insertBefore(successMessage, contactForm);
                    
                    // Reset after delay
                    setTimeout(() => {
                        button.textContent = originalText;
                        button.disabled = false;
                        button.classList.remove('slds-button_success');
                        contactForm.reset();
                        successMessage.remove();
                    }, 5000);
                }, 1500);
            });
        }
    }
}

// Initialize navigation system
const foodNForceNav = new FoodNForceNavigation();