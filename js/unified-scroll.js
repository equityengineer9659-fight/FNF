/**
 * Unified Scroll Progress and Smart Navigation
 * Combines scroll progress bar with smart navbar hide/show functionality
 * Replaces both scroll-progress.js and smart-scroll.js
 */

(function() {
    'use strict';

    class UnifiedScroll {
        constructor() {
            // Find navbar element
            this.navbar = document.querySelector('.navbar');
            
            // Initialize scroll tracking variables
            this.lastScroll = 0;
            this.scrollThreshold = 5;
            this.hideOffset = 100;
            this.isScrolling = false;
            this.progressBar = null;
            
            this.init();
        }

        init() {
            this.createProgressBar();
            this.bindScrollEvent();
            this.bindMouseEvent();
            this.updateProgress(); // Initial update
        }

        createProgressBar() {
            // Create progress bar element (using the working approach from scroll-progress.js)
            this.progressBar = document.createElement('div');
            this.progressBar.id = 'scroll-progress-bar';
            
            // Apply styles directly to ensure it works
            this.progressBar.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 0%;
                height: 6px;
                background: linear-gradient(to right, #0176d3, #00d4ff, #0099cc);
                box-shadow: 0 2px 8px rgba(1, 118, 211, 0.4);
                z-index: 9999;
                transition: width 0.2s ease-out;
                border-radius: 0 0 2px 2px;
                pointer-events: none;
            `;
            
            // Add to page
            document.body.appendChild(this.progressBar);
        }

        bindScrollEvent() {
            let ticking = false;

            const handleScroll = () => {
                const currentScroll = window.pageYOffset;
                
                // Update progress bar
                this.updateProgress();
                
                // Only do navbar logic if navbar exists
                if (this.navbar) {
                    // Skip navbar logic if scroll distance is too small
                    if (Math.abs(currentScroll - this.lastScroll) >= this.scrollThreshold) {
                        
                        // Add shadow when scrolled (using CSS class)
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
                    }
                }
                
                ticking = false;
            };

            // Use requestAnimationFrame for smooth performance
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(handleScroll);
                    ticking = true;
                }
            }, { passive: true });
        }

        bindMouseEvent() {
            // Only add mouse event if navbar exists
            if (this.navbar) {
                // Show navbar when mouse is near top of screen
                document.addEventListener('mousemove', (e) => {
                    if (e.clientY < 100 && this.isScrolling) {
                        this.showNavbar();
                    }
                });
            }
        }

        hideNavbar() {
            if (!this.navbar) return;
            
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
            if (!this.navbar) return;
            
            this.navbar.classList.remove('navbar-hidden');
            this.navbar.classList.add('navbar-visible');
            this.isScrolling = false;
        }

        updateProgress() {
            if (!this.progressBar) return;
            
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = window.pageYOffset;
            const progress = scrollHeight > 0 ? (scrolled / scrollHeight) * 100 : 0;
            
            this.progressBar.style.width = Math.min(Math.max(progress, 0), 100) + '%';
        }
    }

    // Initialize on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        new UnifiedScroll();
    });

})();