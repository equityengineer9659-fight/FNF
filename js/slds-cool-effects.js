/* ============================================
   Food-N-Force Cool Effects JavaScript
   Works WITH existing animations and parallax
   
   NO content changes - only visual enhancements
   ============================================ */

(function() {
    'use strict';

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ============================================
    // 1. ENHANCED NUMBER COUNTER - REMOVED
    // ============================================
    // Removed to preserve existing counter animation functionality

    // ============================================
    // 2. MAGNETIC ICON EFFECT
    // ============================================
    
    class MagneticIcons {
        constructor() {
            if (prefersReducedMotion) return;
            this.init();
        }

        init() {
            const icons = document.querySelectorAll('.icon-wrapper, .focus-area-icon, .service-icon, .resource-icon, .expertise-icon, .value-icon');
            
            icons.forEach(icon => {
                const parent = icon.closest('.slds-box, .focus-area-card, .service-card, .resource-card, .expertise-card, .value-card');
                
                if (parent) {
                    parent.addEventListener('mousemove', (e) => this.handleMouseMove(e, icon, parent));
                    parent.addEventListener('mouseleave', () => this.handleMouseLeave(icon));
                }
            });
        }

        handleMouseMove(e, icon, parent) {
            const rect = parent.getBoundingClientRect();
            const iconRect = icon.getBoundingClientRect();
            
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const iconCenterX = iconRect.left + iconRect.width / 2 - rect.left;
            const iconCenterY = iconRect.top + iconRect.height / 2 - rect.top;
            
            const deltaX = (x - iconCenterX) / 10;
            const deltaY = (y - iconCenterY) / 10;
            
            icon.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.1)`;
        }

        handleMouseLeave(icon) {
            icon.style.transform = '';
        }
    }

    // ============================================
    // 3. SCROLL PROGRESS INDICATOR
    // ============================================
    
    class ScrollProgress {
        constructor() {
            this.createProgressBar();
            this.init();
        }

        createProgressBar() {
            const progressBar = document.createElement('div');
            progressBar.className = 'scroll-progress';
            document.body.appendChild(progressBar);
            this.progressBar = progressBar;
        }

        init() {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const height = document.documentElement.scrollHeight - window.innerHeight;
                const progress = (scrolled / height) * 100;
                this.progressBar.style.width = progress + '%';
            });
        }
    }

    // ============================================
    // 4. SCROLL REVEAL ANIMATIONS
    // ============================================
    
    class ScrollReveal {
        constructor() {
            if (prefersReducedMotion) {
                this.showAllElements();
                return;
            }
            this.init();
        }

        showAllElements() {
            const elements = document.querySelectorAll('.focus-area-card, .service-card, .resource-card, .expertise-card, .value-card');
            elements.forEach(el => {
                el.classList.add('scroll-reveal', 'visible');
            });
        }

        init() {
            const elements = document.querySelectorAll('.focus-area-card, .service-card, .resource-card, .expertise-card, .value-card');
            
            elements.forEach(el => {
                el.classList.add('scroll-reveal');
            });
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '-50px'
            });
            
            elements.forEach(el => observer.observe(el));
        }
    }

    // ============================================
    // 5. SMOOTH LINK SCROLLING
    // ============================================
    
    class SmoothScroll {
        constructor() {
            this.init();
        }

        init() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    const href = anchor.getAttribute('href');
                    if (href === '#') return;
                    
                    const target = document.querySelector(href);
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                });
            });
        }
    }

    // ============================================
    // 6. FORM ENHANCEMENTS
    // ============================================
    
    class FormEnhancements {
        constructor() {
            this.init();
        }

        init() {
            // Add focus classes for styling
            const formElements = document.querySelectorAll('.slds-input, .slds-textarea, .slds-select');
            
            formElements.forEach(element => {
                element.addEventListener('focus', () => {
                    element.closest('.slds-form-element')?.classList.add('is-focused');
                });
                
                element.addEventListener('blur', () => {
                    element.closest('.slds-form-element')?.classList.remove('is-focused');
                });
            });
        }
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize all effects
        // EnhancedCounter removed to preserve existing counter animation
        new MagneticIcons();
        new ScrollProgress();
        new ScrollReveal();
        new SmoothScroll();
        new FormEnhancements();
        
        // Add class to indicate effects are loaded
        document.body.classList.add('cool-effects-loaded');
    });

})();