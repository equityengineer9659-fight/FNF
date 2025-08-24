/**
 * Smart Scroll Navigation
 * Hides navbar on scroll down, shows on scroll up
 */

(function() {
    'use strict';

    class SmartScroll {
        constructor() {
            console.log('SmartScroll constructor called');
            this.navbar = document.querySelector('.navbar');
            console.log('Navbar found:', !!this.navbar);
            if (!this.navbar) {
                console.error('No navbar found! SmartScroll will not initialize.');
                return;
            }

            this.lastScroll = 0;
            this.scrollThreshold = 5;
            this.hideOffset = 100;
            this.isScrolling = false;
            this.progressBar = null;
            
            console.log('Calling SmartScroll init()');
            this.init();
        }

        init() {
            // Create scroll progress bar
            this.createProgressBar();
            // Bind scroll event for navbar hide/show and progress bar
            this.bindScrollEvent();
        }

        createProgressBar() {
            // Create progress bar element
            this.progressBar = document.createElement('div');
            this.progressBar.className = 'scroll-progress';
            this.progressBar.style.position = 'fixed';
            this.progressBar.style.top = '0';
            this.progressBar.style.left = '0';
            this.progressBar.style.width = '0%';
            this.progressBar.style.height = '6px';
            this.progressBar.style.background = 'linear-gradient(to right, #0176d3, #00d4ff, #0099cc)';
            this.progressBar.style.boxShadow = '0 2px 8px rgba(1, 118, 211, 0.4)';
            this.progressBar.style.zIndex = '1001';
            this.progressBar.style.transition = 'width 0.2s ease-out';
            this.progressBar.style.borderRadius = '0 0 2px 2px';
            document.body.appendChild(this.progressBar);
            console.log('Scroll progress bar created and added to page');
        }

        bindScrollEvent() {
            let ticking = false;

            const handleScroll = () => {
                const currentScroll = window.pageYOffset;
                
                // Update progress bar
                this.updateProgressBar(currentScroll);
                
                // Skip navbar logic if scroll distance is too small
                if (Math.abs(currentScroll - this.lastScroll) < this.scrollThreshold) {
                    return;
                }

                // Add shadow when scrolled (using CSS class, no inline styles)
                if (currentScroll > 50) {
                    this.navbar.classList.add('scrolled');
                } else {
                    this.navbar.classList.remove('scrolled');
                }

                // Smart hide/show logic
                if (currentScroll > this.hideOffset) {
                    if (currentScroll > this.lastScroll && !this.isScrolling) {
                        // Scrolling down - hide navbar
                        this.hideNavbar();
                    } else if (currentScroll < this.lastScroll && this.isScrolling) {
                        // Scrolling up - show navbar
                        this.showNavbar();
                    }
                } else {
                    // Always show navbar near top of page
                    this.showNavbar();
                }

                this.lastScroll = currentScroll;
                ticking = false;
            };

            // Use requestAnimationFrame for smooth performance
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(handleScroll);
                    ticking = true;
                }
            }, { passive: true });

            // Show navbar when mouse is near top of screen
            document.addEventListener('mousemove', (e) => {
                if (e.clientY < 100 && this.isScrolling) {
                    this.showNavbar();
                }
            });
        }

        hideNavbar() {
            this.navbar.classList.add('navbar-hidden');
            this.navbar.classList.remove('navbar-visible');
            this.isScrolling = true;
            
            // Hide mobile menu if open
            const mobileMenu = document.querySelector('.nav-menu');
            const mobileToggle = document.querySelector('.mobile-nav-toggle');
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                if (mobileToggle) {
                    mobileToggle.setAttribute('aria-expanded', 'false');
                }
            }
        }

        showNavbar() {
            this.navbar.classList.remove('navbar-hidden');
            this.navbar.classList.add('navbar-visible');
            this.isScrolling = false;
        }

        updateProgressBar(currentScroll) {
            if (!this.progressBar) {
                console.log('No progress bar found');
                return;
            }
            
            // Calculate scroll percentage
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercentage = scrollHeight > 0 ? (currentScroll / scrollHeight) * 100 : 0;
            
            // Update progress bar width
            this.progressBar.style.width = Math.min(scrollPercentage, 100) + '%';
            
            // Debug first few updates
            if (currentScroll < 100) {
                console.log('Scroll progress:', scrollPercentage.toFixed(1) + '%');
            }
        }
    }

    // Initialize on DOM ready
    console.log('Smart scroll script loaded');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOM loaded, initializing SmartScroll');
            new SmartScroll();
        });
    } else {
        console.log('DOM already loaded, initializing SmartScroll immediately');
        new SmartScroll();
    }

    // Expose to global scope for debugging
    window.SmartScroll = SmartScroll;
})();