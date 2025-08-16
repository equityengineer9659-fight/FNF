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
        this.setupMobileNavigation();
        this.setupScrollAnimations();
        this.highlightCurrentPage();
        this.setupFormEnhancements();
    }

    injectNavigation() {
        const navHTML = '<nav class="navbar universal-nav custom-nav" role="banner">' +
            '<div class="slds-container_fluid">' +
            '<!-- Top row with logo, centered company name, and mobile toggle -->' +
            '<div class="slds-grid slds-grid_align-spread slds-wrap slds-grid_vertical-align-center slds-p-vertical_small">' +
            '<!-- Brand Logo - Left -->' +
            '<div class="slds-col slds-no-flex">' +
            '<a href="index.html" aria-label="Food-N-Force Home" class="brand-logo-link">' +
            '<div class="fnf-logo" role="img" aria-label="F-n-F logo">' +
            '<div class="fnf-inner">' +
            '<span class="fnf-wordmark">F-n-F</span>' +
            '</div>' +
            '</div>' +
            '</a>' +
            '</div>' +
            '<!-- Centered Company Name -->' +
            '<div class="slds-col slds-text-align_center company-name-container">' +
            '<h1 class="brand-logo universal-brand-logo">Food-N-Force</h1>' +
            '</div>' +
            '<!-- Mobile Navigation Toggle - Right -->' +
            '<div class="slds-col slds-no-flex slds-hide slds-show_small mobile-toggle-container">' +
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
        const logoContainer = document.querySelector('.fnf-logo');
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
        this.nav.style.display = 'block';
        setTimeout(() => {
            this.nav.classList.add('show');
        }, 10);
        
        this.toggle.setAttribute('aria-expanded', 'true');
        this.nav.setAttribute('aria-hidden', 'false');
        this.isOpen = true;

        // Animate hamburger icon
        const icon = this.toggle.querySelector('.hamburger-icon');
        if (icon) {
            icon.style.transform = 'rotate(90deg)';
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