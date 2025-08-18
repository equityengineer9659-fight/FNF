/**
 * Premium Background Effects for Food-N-Force Website
 * SLDS-Compliant Visual Enhancement System
 * Implements particle effects, enhanced animations, and premium interactions
 */

(function() {
    'use strict';

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    /**
     * Premium Background Effects Controller
     */
    class PremiumBackgroundEffects {
        constructor() {
            this.particles = [];
            this.isInitialized = false;
            this.resizeTimeout = null;
            
            // Performance monitoring
            this.performanceMetrics = {
                animationFrameId: null,
                lastFrameTime: 0,
                frameCount: 0,
                fps: 0
            };
            
            this.init();
        }

        /**
         * Initialize premium effects system
         */
        init() {
            if (this.isInitialized || prefersReducedMotion) {
                return;
            }

            console.log('Initializing Premium Background Effects...');
            
            // Add premium effects class to body
            document.body.classList.add('fnf-premium-effects-enabled');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setupEffects());
            } else {
                this.setupEffects();
            }
        }

        /**
         * Setup all premium effects
         */
        setupEffects() {
            try {
                this.createHeroParticles();
                this.enhanceCardInteractions();
                this.setupNavigationGlass();
                this.setupIntersectionObserver();
                this.setupPerformanceMonitoring();
                this.bindEventListeners();
                
                this.isInitialized = true;
                console.log('Premium Background Effects initialized successfully');
            } catch (error) {
                console.warn('Premium effects initialization failed:', error);
            }
        }

        /**
         * Create floating particles for hero section
         */
        createHeroParticles() {
            const heroSection = document.querySelector('.hero-section');
            if (!heroSection) return;

            // Create particle container
            const particleContainer = document.createElement('div');
            particleContainer.className = 'fnf-particle-container';
            particleContainer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                pointer-events: none;
                z-index: -1;
            `;
            
            heroSection.appendChild(particleContainer);

            // Create particles with performance limits
            const particleCount = window.innerWidth > 1200 ? 15 : window.innerWidth > 768 ? 10 : 5;
            
            for (let i = 0; i < particleCount; i++) {
                this.createParticle(particleContainer, i);
            }
        }

        /**
         * Create individual particle element
         */
        createParticle(container, index) {
            const particle = document.createElement('div');
            particle.className = 'fnf-particle';
            
            // Random size and position
            const size = Math.random() * 4 + 2; // 2-6px
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const duration = Math.random() * 10 + 15; // 15-25s
            const delay = Math.random() * 5; // 0-5s delay
            
            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${x}%;
                top: ${y}%;
                animation-duration: ${duration}s;
                animation-delay: ${delay}s;
            `;
            
            container.appendChild(particle);
            this.particles.push(particle);
        }

        /**
         * Enhance card interactions with shimmer effects
         */
        enhanceCardInteractions() {
            const cards = document.querySelectorAll(`
                .focus-area-card,
                .measurable-card,
                .service-card,
                .resource-card,
                .value-card,
                .expertise-card
            `);

            cards.forEach(card => {
                // Add shimmer class
                card.classList.add('fnf-card-shimmer');
                
                // Add premium hover lift
                card.classList.add('fnf-premium-hover-lift');
                
                // Throttled hover events for performance
                let hoverTimeout;
                
                card.addEventListener('mouseenter', () => {
                    clearTimeout(hoverTimeout);
                    if (!prefersReducedMotion) {
                        this.triggerCardGlow(card);
                    }
                });
                
                card.addEventListener('mouseleave', () => {
                    hoverTimeout = setTimeout(() => {
                        this.removeCardGlow(card);
                    }, 300);
                });
            });
        }

        /**
         * Add glow effect to card
         */
        triggerCardGlow(card) {
            card.classList.add('fnf-premium-glow');
            
            // Remove glow after animation
            setTimeout(() => {
                card.classList.remove('fnf-premium-glow');
            }, 2000);
        }

        /**
         * Remove glow effect from card
         */
        removeCardGlow(card) {
            card.classList.remove('fnf-premium-glow');
        }

        /**
         * Setup navigation glass morphism effect
         */
        setupNavigationGlass() {
            // Wait for navigation to be loaded
            setTimeout(() => {
                const navigation = document.querySelector('nav, .slds-global-header, .fnf-navigation');
                if (navigation) {
                    navigation.classList.add('fnf-nav-glass');
                }
            }, 1000);
        }

        /**
         * Setup intersection observer for scroll-based animations
         */
        setupIntersectionObserver() {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.animateSection(entry.target);
                    }
                });
            }, observerOptions);

            // Observe sections for scroll animations
            const sections = document.querySelectorAll('section:not(.hero-section)');
            sections.forEach(section => observer.observe(section));
        }

        /**
         * Animate section on scroll into view
         */
        animateSection(section) {
            if (prefersReducedMotion) return;

            // Add subtle entrance animation
            section.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }

        /**
         * Setup performance monitoring
         */
        setupPerformanceMonitoring() {
            let frameCount = 0;
            let lastTime = performance.now();

            const monitorFrame = (currentTime) => {
                frameCount++;
                
                if (currentTime - lastTime >= 1000) {
                    this.performanceMetrics.fps = frameCount;
                    frameCount = 0;
                    lastTime = currentTime;
                    
                    // Adaptive quality based on performance
                    this.adaptiveQuality();
                }
                
                this.performanceMetrics.animationFrameId = requestAnimationFrame(monitorFrame);
            };

            if (!prefersReducedMotion) {
                requestAnimationFrame(monitorFrame);
            }
        }

        /**
         * Adaptive quality based on performance
         */
        adaptiveQuality() {
            if (this.performanceMetrics.fps < 30) {
                // Reduce particle count
                this.reduceParticleCount();
                console.warn('Reduced particle effects due to low FPS:', this.performanceMetrics.fps);
            }
        }

        /**
         * Reduce particle count for performance
         */
        reduceParticleCount() {
            const particlesToRemove = Math.floor(this.particles.length * 0.3);
            
            for (let i = 0; i < particlesToRemove; i++) {
                const particle = this.particles.pop();
                if (particle && particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }
        }

        /**
         * Bind event listeners
         */
        bindEventListeners() {
            // Throttled resize handler
            window.addEventListener('resize', () => {
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    this.handleResize();
                }, 250);
            });

            // Visibility change handler
            document.addEventListener('visibilitychange', () => {
                this.handleVisibilityChange();
            });

            // Reduced motion change handler
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            mediaQuery.addEventListener('change', () => {
                this.handleReducedMotionChange(mediaQuery.matches);
            });
        }

        /**
         * Handle window resize
         */
        handleResize() {
            // Recreate particles for new viewport size
            const particleContainer = document.querySelector('.fnf-particle-container');
            if (particleContainer) {
                // Clear existing particles
                this.particles.forEach(particle => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                });
                this.particles = [];
                
                // Recreate with new count
                const particleCount = window.innerWidth > 1200 ? 15 : window.innerWidth > 768 ? 10 : 5;
                for (let i = 0; i < particleCount; i++) {
                    this.createParticle(particleContainer, i);
                }
            }
        }

        /**
         * Handle visibility change (tab switching)
         */
        handleVisibilityChange() {
            if (document.hidden) {
                // Pause animations when tab is hidden
                if (this.performanceMetrics.animationFrameId) {
                    cancelAnimationFrame(this.performanceMetrics.animationFrameId);
                }
            } else {
                // Resume animations when tab is visible
                if (!prefersReducedMotion) {
                    this.setupPerformanceMonitoring();
                }
            }
        }

        /**
         * Handle reduced motion preference change
         */
        handleReducedMotionChange(reducedMotion) {
            if (reducedMotion) {
                this.disableEffects();
            } else {
                this.enableEffects();
            }
        }

        /**
         * Disable all effects
         */
        disableEffects() {
            document.body.classList.remove('fnf-premium-effects-enabled');
            
            // Remove particles
            this.particles.forEach(particle => {
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            });
            this.particles = [];
            
            // Cancel animation frame
            if (this.performanceMetrics.animationFrameId) {
                cancelAnimationFrame(this.performanceMetrics.animationFrameId);
            }
        }

        /**
         * Enable effects
         */
        enableEffects() {
            document.body.classList.add('fnf-premium-effects-enabled');
            this.createHeroParticles();
            this.setupPerformanceMonitoring();
        }

        /**
         * Cleanup method
         */
        destroy() {
            this.disableEffects();
            
            // Remove event listeners
            window.removeEventListener('resize', this.handleResize);
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
            
            this.isInitialized = false;
        }
    }

    /**
     * Initialize premium effects when DOM is ready
     */
    function initializePremiumEffects() {
        // Only initialize if not already done
        if (!window.premiumBackgroundEffects) {
            window.premiumBackgroundEffects = new PremiumBackgroundEffects();
        }
    }

    // Initialize immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePremiumEffects);
    } else {
        // Small delay to ensure other scripts have loaded
        setTimeout(initializePremiumEffects, 100);
    }

    // Global access for debugging
    window.PremiumBackgroundEffects = PremiumBackgroundEffects;

})();