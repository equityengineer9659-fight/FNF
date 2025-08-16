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
        // Enhanced element detection with better error handling
        if (!this.nav) {
            this.nav = document.querySelector('.slds-nav-horizontal');
        }
        
        if (!this.toggle) {
            this.toggle = document.querySelector('button[aria-controls="main-nav"]');
        }
        
        if (!this.nav || !this.toggle) {
            console.warn('Mobile navigation elements not found');
            console.log('Nav found:', !!this.nav);
            console.log('Toggle found:', !!this.toggle);
            console.log('Available navigation elements:', document.querySelectorAll('nav, ul'));
            console.log('Available buttons:', document.querySelectorAll('button'));
            return;
        }

        console.log('Mobile navigation initialized successfully');
        this.bindEvents();
        this.setInitialState();
    }

    bindEvents() {
        // Toggle button click with animation
        this.toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
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
        
        // Force toggle visibility on mobile
        if (window.innerWidth <= 768) {
            this.toggle.style.display = 'block';
            this.toggle.style.visibility = 'visible';
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
 * Initialize all modules when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Core functionality
        new MobileNavigation();
        new FormEnhancement();
        
        // Enhanced features
        new ScrollAnimations();
        
        console.log('Food-N-Force website modules initialized successfully');
    } catch (error) {
        console.error('Error initializing website modules:', error);
    }
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MobileNavigation,
        FormEnhancement,
        ScrollAnimations,
        StatCounter
    };
}