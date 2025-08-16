/* ============================================
   Phase 2: Micro Animations & Interactions
   ADDS smooth animations WITHOUT changing content
   ============================================ */

(function() {
    'use strict';

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ============================================
    // 1. INTERSECTION OBSERVER FOR ANIMATIONS
    // ============================================
    
    class ScrollAnimations {
        constructor() {
            this.observers = [];
            this.init();
        }

        init() {
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
            const elements = document.querySelectorAll('.service-card, .focus-area-card, .resource-card, .testimonial-card, .value-card, .expertise-card, .mission-text');
            elements.forEach(el => el.classList.add('visible'));
        }

        destroy() {
            this.observers.forEach(observer => observer.disconnect());
        }
    }

    // ============================================
    // 2. SMOOTH REVEAL ANIMATIONS
    // ============================================
    
    class RevealAnimations {
        constructor() {
            if (prefersReducedMotion) return;
            this.init();
        }

        init() {
            // Add reveal class to elements
            const reveals = document.querySelectorAll('.hero-content, .section-header, .cta-section');
            
            reveals.forEach((el, index) => {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
                
                setTimeout(() => {
                    el.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
                    el.style.opacity = '1';
                    el.style.transform = 'translateY(0)';
                }, index * 200);
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
    // 4. MAGNETIC BUTTONS
    // ============================================
    
    class MagneticButtons {
        constructor() {
            if (prefersReducedMotion) return;
            this.init();
        }

        init() {
            const buttons = document.querySelectorAll('.slds-button_brand, .btn-primary');
            
            buttons.forEach(button => {
                button.addEventListener('mousemove', (e) => {
                    const rect = button.getBoundingClientRect();
                    const x = e.clientX - rect.left - rect.width / 2;
                    const y = e.clientY - rect.top - rect.height / 2;
                    
                    button.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
                });
                
                button.addEventListener('mouseleave', () => {
                    button.style.transform = '';
                });
            });
        }
    }

    // ============================================
    // 5. PARALLAX SCROLL EFFECTS
    // ============================================
    
    class ParallaxEffects {
        constructor() {
            if (prefersReducedMotion) return;
            this.elements = [];
            this.init();
        }

        init() {
            // Simple parallax for hero sections
            const heroSections = document.querySelectorAll('.hero, .hero-section');
            heroSections.forEach(section => {
                this.elements.push({
                    element: section,
                    speed: 0.5
                });
            });
            
            this.bindEvents();
        }

        bindEvents() {
            let ticking = false;
            
            const updateElements = () => {
                const scrolled = window.pageYOffset;
                
                this.elements.forEach(({ element, speed }) => {
                    const yPos = -(scrolled * speed);
                    element.style.transform = `translateY(${yPos}px)`;
                });
                
                ticking = false;
            };
            
            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(updateElements);
                    ticking = true;
                }
            });
        }
    }

    // ============================================
    // 6. HOVER CARD TILT
    // ============================================
    
    class CardTilt {
        constructor() {
            if (prefersReducedMotion) return;
            this.init();
        }

        init() {
            const cards = document.querySelectorAll('.service-card, .focus-area-card, .value-card');
            
            cards.forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const centerX = rect.width / 2;
                    const centerY = rect.height / 2;
                    
                    const rotateX = (y - centerY) / 10;
                    const rotateY = (centerX - x) / 10;
                    
                    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
                });
                
                card.addEventListener('mouseleave', () => {
                    card.style.transform = '';
                });
            });
        }
    }

    // ============================================
    // 7. TEXT ANIMATION ON SCROLL
    // ============================================
    
    class TextAnimations {
        constructor() {
            if (prefersReducedMotion) return;
            this.init();
        }

        init() {
            const headings = document.querySelectorAll('h1, h2, .hero-title');
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('text-reveal');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.5 });
            
            headings.forEach(heading => {
                heading.style.opacity = '0';
                observer.observe(heading);
            });
        }
    }

    // ============================================
    // 8. LOADING STATE ANIMATIONS
    // ============================================
    
    class LoadingStates {
        constructor() {
            this.init();
        }

        init() {
            // Add loading class to forms on submit
            const forms = document.querySelectorAll('form');
            
            forms.forEach(form => {
                form.addEventListener('submit', function(e) {
                    const submitBtn = this.querySelector('[type="submit"]');
                    if (submitBtn) {
                        submitBtn.classList.add('is-loading');
                        submitBtn.disabled = true;
                    }
                });
            });
        }
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize all animation modules
        new ScrollAnimations();
        new RevealAnimations();
        new EnhancedStatsCounter();
        new MagneticButtons();
        new ParallaxEffects();
        new CardTilt();
        new TextAnimations();
        new LoadingStates();
        
        // Add loaded class
        document.body.classList.add('animations-loaded');
    });

})();