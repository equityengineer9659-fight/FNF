/* ============================================
   Phase 2 Enhancements: Enhanced Interactions & Motion
   Building on existing functionality
   ============================================ */

(function() {
    'use strict';

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ============================================
    // 1. ENHANCED SCROLL ANIMATIONS
    // ============================================
    
    class ScrollAnimator {
        constructor() {
            this.animatedElements = [];
            this.init();
        }

        init() {
            if (prefersReducedMotion) return;

            // Prepare elements for animation
            this.prepareElements();
            
            // Set up intersection observer
            this.setupObserver();
            
            // Add scroll-based nav enhancement
            this.enhanceNavOnScroll();
        }

        prepareElements() {
            // Add animation classes to sections
            const sections = document.querySelectorAll('.section-padding, .stats-section');
            sections.forEach((section, index) => {
                section.classList.add('section-reveal');
                
                // Alternate left/right animations
                if (index % 2 === 0) {
                    section.classList.add('section-left');
                } else {
                    section.classList.add('section-right');
                }
            });

            // Add fade-in-up to cards
            const cards = document.querySelectorAll('.service-card, .focus-area-card, .resource-card, .testimonial-card, .value-card, .expertise-card');
            cards.forEach(card => {
                card.classList.add('fade-in-up', 'animate-on-scroll');
            });

            // Add stagger animation to grid containers
            const grids = document.querySelectorAll('.slds-grid.slds-wrap');
            grids.forEach(grid => {
                if (grid.querySelector('.service-card, .focus-area-card, .resource-card')) {
                    grid.classList.add('stagger-animation');
                }
            });

            // Mission text animations
            const missionTexts = document.querySelectorAll('.mission-text');
            missionTexts.forEach((text, index) => {
                text.classList.add('fade-in', 'animate-on-scroll');
                text.style.transitionDelay = `${index * 0.2}s`;
            });

            // Hero elements
            const heroElements = document.querySelectorAll('.hero-heading, .hero-subtitle, .hero-actions');
            heroElements.forEach(el => {
                el.classList.add('will-animate');
            });
        }

        setupObserver() {
            const observerOptions = {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        // Add animated class
                        entry.target.classList.add('animated', 'revealed');
                        
                        // Remove will-change for performance
                        setTimeout(() => {
                            entry.target.classList.remove('will-animate');
                        }, 1000);
                        
                        // Stop observing
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);

            // Observe all animated elements
            document.querySelectorAll('.animate-on-scroll, .section-reveal').forEach(el => {
                observer.observe(el);
            });
        }

        enhanceNavOnScroll() {
            const navbar = document.querySelector('.navbar');
            if (!navbar) return;

            let lastScroll = 0;
            let ticking = false;

            const handleScroll = () => {
                const currentScroll = window.pageYOffset;
                
                // Add enhanced shadow on scroll
                if (currentScroll > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
                
                lastScroll = currentScroll;
                ticking = false;
            };

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(handleScroll);
                    ticking = true;
                }
            }, { passive: true });
        }
    }

    // ============================================
    // 2. ENHANCED MICRO-INTERACTIONS
    // ============================================

    class MicroInteractions {
        constructor() {
            this.init();
        }

        init() {
            this.enhanceButtons();
            this.enhanceCards();
            this.enhanceFormFields();
            this.addRippleEffects();
        }

        enhanceButtons() {
            const buttons = document.querySelectorAll('.slds-button');
            
            buttons.forEach(button => {
                // Add ripple container
                button.style.position = 'relative';
                button.style.overflow = 'hidden';
                
                // Mouse enter effect
                button.addEventListener('mouseenter', (e) => {
                    if (prefersReducedMotion) return;
                    
                    const rect = button.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    button.style.setProperty('--mouse-x', `${x}px`);
                    button.style.setProperty('--mouse-y', `${y}px`);
                });
            });
        }

        enhanceCards() {
            const cards = document.querySelectorAll('.service-card, .focus-area-card, .resource-card');
            
            cards.forEach(card => {
                // Add shine effect on hover
                card.addEventListener('mouseenter', function(e) {
                    if (prefersReducedMotion) return;
                    
                    this.classList.add('shine-effect');
                });
                
                card.addEventListener('mouseleave', function() {
                    this.classList.remove('shine-effect');
                });

                // Add tilt effect
                card.addEventListener('mousemove', (e) => {
                    if (prefersReducedMotion) return;
                    
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateX = (y - centerY) / 20;
                    const rotateY = (centerX - x) / 20;
                    
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
                });
                
                card.addEventListener('mouseleave', () => {
                    card.style.transform = '';
                });
            });
        }

        enhanceFormFields() {
            const formFields = document.querySelectorAll('.slds-form-element');
            
            formFields.forEach(field => {
                const input = field.querySelector('.slds-input, .slds-textarea');
                const label = field.querySelector('.slds-form-element__label');
                
                if (input && label) {
                    // Float label setup
                    if (input.value) {
                        field.classList.add('has-value');
                    }
                    
                    input.addEventListener('focus', () => {
                        field.classList.add('is-focused');
                    });
                    
                    input.addEventListener('blur', () => {
                        field.classList.remove('is-focused');
                        if (input.value) {
                            field.classList.add('has-value');
                        } else {
                            field.classList.remove('has-value');
                        }
                    });
                    
                    // Add success animation on valid input
                    input.addEventListener('input', () => {
                        if (input.validity.valid && input.value) {
                            field.classList.add('is-valid');
                        } else {
                            field.classList.remove('is-valid');
                        }
                    });
                }
            });
        }

        addRippleEffects() {
            document.addEventListener('click', (e) => {
                const button = e.target.closest('.slds-button');
                if (!button || prefersReducedMotion) return;
                
                const ripple = document.createElement('span');
                const rect = button.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                ripple.classList.add('ripple');
                
                button.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
            });
        }
    }

    // ============================================
    // 3. ENHANCED STATS COUNTER
    // ============================================

    class EnhancedStatsCounter {
        constructor() {
            this.init();
        }

        init() {
            const stats = document.querySelectorAll('.stat-number[data-target]');
            if (!stats.length || prefersReducedMotion) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                        this.animateNumber(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });

            stats.forEach(stat => observer.observe(stat));
        }

        animateNumber(element) {
            const target = parseInt(element.dataset.target);
            const duration = 2500;
            const increment = target / 100;
            let current = 0;
            
            element.classList.add('counting');
            
            const updateNumber = () => {
                current += increment;
                
                if (current < target) {
                    element.textContent = Math.floor(current);
                    
                    if (element.dataset.format === 'percentage') {
                        element.textContent += '%';
                    } else if (element.dataset.format === 'million') {
                        element.textContent = (current / 1).toFixed(0) + 'M+';
                    } else if (target >= 100) {
                        element.textContent += '+';
                    }
                    
                    requestAnimationFrame(updateNumber);
                } else {
                    // Final value
                    if (element.dataset.format === 'percentage') {
                        element.textContent = target + '%';
                    } else if (element.dataset.format === 'million') {
                        element.textContent = target + 'M+';
                    } else {
                        element.textContent = target + '+';
                    }
                    
                    element.classList.remove('counting');
                    element.classList.add('counted');
                }
            };
            
            updateNumber();
        }
    }

    // ============================================
    // 4. PAGE LOAD ENHANCEMENTS
    // ============================================

    class PageLoadEnhancer {
        constructor() {
            this.init();
        }

        init() {
            // Add page transition class
            document.body.classList.add('page-transition');
            
            // Preload critical images
            this.preloadImages();
            
            // Add loading state handler
            this.handleLoadingStates();
        }

        preloadImages() {
            const criticalImages = document.querySelectorAll('img[data-critical]');
            criticalImages.forEach(img => {
                const imageLoader = new Image();
                imageLoader.src = img.src;
            });
        }

        handleLoadingStates() {
            // Add skeleton loading to slow-loading elements
            const lazyElements = document.querySelectorAll('[data-lazy]');
            lazyElements.forEach(el => {
                el.classList.add('skeleton-loading');
                
                // Remove skeleton after content loads
                if (el.complete || el.readyState === 4) {
                    el.classList.remove('skeleton-loading');
                } else {
                    el.addEventListener('load', () => {
                        el.classList.remove('skeleton-loading');
                    });
                }
            });
        }
    }

    // ============================================
    // 5. SMOOTH SCROLL ENHANCEMENTS
    // ============================================

    class SmoothScrollEnhancer {
        constructor() {
            this.init();
        }

        init() {
            // Enhance anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    const targetId = anchor.getAttribute('href').slice(1);
                    if (!targetId) return;
                    
                    const target = document.getElementById(targetId);
                    if (target) {
                        e.preventDefault();
                        
                        const offset = 100; // Account for fixed nav
                        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                        
                        window.scrollTo({
                            top: targetPosition,
                            behavior: prefersReducedMotion ? 'auto' : 'smooth'
                        });
                        
                        // Add focus for accessibility
                        target.setAttribute('tabindex', '-1');
                        target.focus();
                    }
                });
            });
        }
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    function initPhase2Enhancements() {
        // Initialize all enhancement classes
        new ScrollAnimator();
        new MicroInteractions();
        new EnhancedStatsCounter();
        new PageLoadEnhancer();
        new SmoothScrollEnhancer();
        
        // Mark as enhanced
        document.body.classList.add('phase2-enhanced');
        
        // Log success
        console.log('Phase 2 enhancements initialized successfully');
    }

    // Wait for DOM and other scripts to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // Give other scripts time to initialize
            setTimeout(initPhase2Enhancements, 100);
        });
    } else {
        setTimeout(initPhase2Enhancements, 100);
    }

})();