/**
 * Food-N-Force Unified Navigation System
 * Consolidates all navigation functionality into a single, maintainable module
 */

class FoodNForceNavigation {
    constructor() {
        this.nav = null;
        this.toggle = null;
        this.navItems = null;
        this.isOpen = false;
        this.observers = [];
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.injectNavigation();
        this.addPageClassToBody();
        this.setupMobileNavigation();
        this.setupScrollAnimations();
        this.highlightCurrentPage();
        this.setupFormEnhancements();
    }

    // Add page-specific classes to body
    addPageClassToBody() {
        // Get the current page name from the URL
        const path = window.location.pathname;
        const pageName = path.split('/').pop().replace('.html', '') || 'index';
        
        // Add page-specific class to body
        document.body.classList.add(pageName + '-page');
        
        // Also add a generic class for pages with known issues
        if (['services', 'resources', 'impact'].includes(pageName)) {
            document.body.classList.add('has-button-conflicts');
        }
    }

    injectNavigation() {
        const navHTML = '<nav class="navbar universal-nav custom-nav" role="banner">' +
            '<div class="slds-container_fluid">' +
            '<!-- Top row with logo, centered company name, and navigation -->' +
            '<div class="slds-grid slds-grid_align-spread slds-wrap slds-grid_vertical-align-center slds-p-vertical_small">' +
            '<!-- Brand Logo - Left -->' +
            '<div class="slds-col slds-no-flex">' +
            '<a href="index.html" aria-label="Food-N-Force Home" class="brand-logo-link">' +
            '<div class="brand-logo-container">' +
            '<div class="brand-logo-inner">' +
            '<span class="brand-logo-text">F-n-F</span>' +
            '</div>' +
            '</div>' +
            '</a>' +
            '</div>' +
            '<!-- Centered Company Name -->' +
            '<div class="slds-col slds-text-align_center company-name-container">' +
            '<h1 class="brand-logo universal-brand-logo">Food-N-Force</h1>' +
            '</div>' +
            '<!-- Mobile Navigation Toggle - Right -->' +
            '<div class="slds-col slds-no-flex slds-hide slds-show_small">' +
            '<button class="mobile-nav-toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="main-nav">' +
            '<span class="hamburger-icon">☰</span>' +
            '</button>' +
            '</div>' +
            '<!-- Spacer for desktop -->' +
            '<div class="slds-col slds-no-flex slds-show slds-hide_small nav-spacer">' +
            '<!-- Balances the logo -->' +
            '</div>' +
            '</div>' +
            '<!-- Navigation Menu - Centered Below Company Name -->' +
            '<div class="slds-grid slds-grid_align-center slds-p-top_small">' +
            '<div class="slds-col">' +
            '<nav class="slds-text-align_center nav-menu-container" role="navigation" aria-label="Main navigation">' +
            '<ul class="nav-menu slds-nav-horizontal universal-nav-menu" id="main-nav">' +
            '<li class="slds-nav-horizontal__item">' +
            '<a href="index.html" class="nav-link universal-nav-link">Home</a>' +
            '</li>' +
            '<li class="slds-nav-horizontal__item">' +
            '<a href="services.html" class="nav-link universal-nav-link">Services</a>' +
            '</li>' +
            '<li class="slds-nav-horizontal__item">' +
            '<a href="resources.html" class="nav-link universal-nav-link">Resources</a>' +
            '</li>' +
            '<li class="slds-nav-horizontal__item">' +
            '<a href="impact.html" class="nav-link universal-nav-link">Impact</a>' +
            '</li>' +
            '<li class="slds-nav-horizontal__item">' +
            '<a href="contact.html" class="nav-link universal-nav-link">Contact</a>' +
            '</li>' +
            '<li class="slds-nav-horizontal__item">' +
            '<a href="about.html" class="nav-link universal-nav-link">About Us</a>' +
            '</li>' +
            '</ul>' +
            '</nav>' +
            '</div>' +
            '</div>' +
            '</div>' +
            '</nav>';
        
        // Insert navigation at the beginning of body
        document.body.insertAdjacentHTML('afterbegin', navHTML);
        
        // Cache DOM elements
        this.nav = document.getElementById('main-nav');
        this.toggle = document.querySelector('.mobile-nav-toggle');
        this.navItems = document.querySelectorAll('.nav-link');
        
        // Animate navigation elements after injection
        this.animateNavigationElements();
    }
    
    animateNavigationElements() {
        // Animate company name
        const companyName = document.querySelector('.universal-brand-logo');
        if (companyName) {
            companyName.style.opacity = '0';
            companyName.style.transform = 'translateY(-20px)';
            companyName.style.transition = 'all 0.8s ease-out';
            
            setTimeout(() => {
                companyName.style.opacity = '1';
                companyName.style.transform = 'translateY(0)';
            }, 300);
        }
        
        // Animate logo
        const logoContainer = document.querySelector('.brand-logo-container');
        if (logoContainer) {
            logoContainer.style.opacity = '0';
            logoContainer.style.transform = 'scale(0.8)';
            logoContainer.style.transition = 'all 0.6s ease-out';
            
            setTimeout(() => {
                logoContainer.style.opacity = '1';
                logoContainer.style.transform = 'scale(1)';
            }, 100);
        }
        
        // Animate nav items
        const navItems = document.querySelectorAll('.nav-link');
        navItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(10px)';
            item.style.transition = 'all 0.5s ease-out';
            
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 400 + (index * 100));
        });
    }

    setupMobileNavigation() {
        if (!this.toggle || !this.nav) return;

        // Toggle button click
        this.toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleNav();
        });

        // Close on nav item click
        this.navItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.closeNav();
                }
            });
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-nav') && this.isOpen) {
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
        this.handleResize();
    }

    toggleNav() {
        if (this.isOpen) {
            this.closeNav();
        } else {
            this.openNav();
        }
    }

    openNav() {
        this.nav.style.display = 'flex';
        this.nav.offsetHeight; // Force reflow
        
        this.nav.classList.add('show');
        this.toggle.setAttribute('aria-expanded', 'true');
        this.nav.setAttribute('aria-hidden', 'false');
        this.isOpen = true;

        // Rotate hamburger icon
        const icon = this.toggle.querySelector('.hamburger-icon');
        if (icon) {
            icon.style.transform = 'rotate(90deg)';
        }

        // Focus management
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

        // Reset hamburger icon
        const icon = this.toggle.querySelector('.hamburger-icon');
        if (icon) {
            icon.style.transform = 'rotate(0deg)';
        }
        
        // Reset display after transition
        setTimeout(() => {
            if (!this.isOpen) {
                this.nav.style.display = '';
            }
        }, 300);
    }

    handleResize() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 768 && this.isOpen) {
                    this.closeNav();
                    this.nav.style.display = '';
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
        if (!('IntersectionObserver' in window)) {
            this.showAllElements();
            return;
        }

        const observerOptions = {
            threshold: 0.3,
            rootMargin: '0px'
        };

        // Cards observer
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting && !entry.target.classList.contains('visible')) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                        cardObserver.unobserve(entry.target);
                    }, index * 100);
                }
            });
        }, observerOptions);

        // Stats observer with stricter settings
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                    // Add a small delay to ensure the element is truly visible
                    setTimeout(() => {
                        this.animateStats(entry.target);
                        statsObserver.unobserve(entry.target);
                    }, 300);
                }
            });
        }, {
            threshold: 0.5, // Stats must be 50% visible before animating
            rootMargin: '0px'
        });

        // Store observers for cleanup
        this.observers.push(cardObserver, statsObserver);

        // Observe elements
        const cards = document.querySelectorAll('.service-card, .focus-area-card, .resource-card, .testimonial-card, .value-card, .expertise-card');
        cards.forEach(el => cardObserver.observe(el));

        const stats = document.querySelectorAll('.stat-item');
        stats.forEach(el => statsObserver.observe(el));

        const missionTexts = document.querySelectorAll('.mission-text');
        missionTexts.forEach(el => cardObserver.observe(el));
    }

    animateStats(statItem) {
        statItem.classList.add('visible');
        const numberEl = statItem.querySelector('.stat-number');
        if (numberEl) {
            this.animateNumber(numberEl);
        }
    }

    animateNumber(element) {
        // Get the text content and clean it
        const text = element.textContent.trim();
        const suffix = element.dataset.suffix || '';
        
        // Remove any non-numeric characters to get just the number
        const cleanedText = text.replace(/[^0-9]/g, '');
        const target = parseInt(cleanedText);
        
        // Make sure we have a valid target number
        if (isNaN(target) || target === 0) {
            // Try to get the intended value from the data attribute if available
            const dataTarget = element.dataset.target;
            if (dataTarget) {
                const fallbackTarget = parseInt(dataTarget);
                if (!isNaN(fallbackTarget) && fallbackTarget > 0) {
                    this.animateToNumber(element, fallbackTarget, suffix);
                    return;
                }
            }
            return;
        }
        
        this.animateToNumber(element, target, suffix);
    }
    
    animateToNumber(element, target, suffix) {
        const duration = 2000;
        const steps = 60;
        const increment = target / steps;
        let current = 0;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current = Math.min(Math.floor(increment * step), target);
            element.textContent = current + suffix;

            if (step >= steps || current >= target) {
                element.textContent = target + suffix;
                element.parentElement.classList.add('counted');
                clearInterval(timer);
            }
        }, duration / steps);
    }

    showAllElements() {
        // Fallback for browsers without IntersectionObserver
        document.querySelectorAll('.service-card, .focus-area-card, .resource-card, .stat-item')
            .forEach(el => el.classList.add('visible'));
    }

    setupFormEnhancements() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            this.enhanceForm(form);
        });
    }

    enhanceForm(form) {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            // Add blur validation
            input.addEventListener('blur', () => this.validateField(input));
            
            // Clear errors on input
            input.addEventListener('input', () => {
                input.classList.remove('slds-has-error');
                const errorEl = input.parentNode.querySelector('.field-error');
                if (errorEl) {
                    errorEl.style.display = 'none';
                }
            });
        });

        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateForm(form)) {
                // Form is valid - you can add submission logic here
                // For now, just prevent the default action
            }
        });
    }

    validateField(field) {
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (field.hasAttribute('required') && !field.value.trim()) {
            isValid = false;
            errorMessage = 'This field is required.';
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

        this.displayFieldError(field, isValid, errorMessage);
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

    displayFieldError(field, isValid, errorMessage) {
        let errorContainer = field.parentNode.querySelector('.field-error');
        
        if (!errorContainer && !isValid) {
            errorContainer = document.createElement('div');
            errorContainer.className = 'field-error';
            errorContainer.setAttribute('role', 'alert');
            field.parentNode.appendChild(errorContainer);
        }

        if (errorContainer) {
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
    }

    // Cleanup method for when navigation is removed
    destroy() {
        // Disconnect all observers
        this.observers.forEach(observer => observer.disconnect());
        
        // Remove event listeners
        if (this.toggle) {
            this.toggle.removeEventListener('click', this.toggleNav);
        }
        
        // Remove navigation from DOM
        const nav = document.querySelector('.navbar.universal-nav');
        if (nav) {
            nav.remove();
        }
    }
}

// Initialize navigation when module loads
const foodNForceNav = new FoodNForceNavigation();

// Export for testing or external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FoodNForceNavigation;
}