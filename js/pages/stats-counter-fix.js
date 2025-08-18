/* ============================================
   Stats Counter Fix - Final Version
   Handles separate number and suffix elements
   ============================================ */

(function() {
    'use strict';

    // Stats Counter Animation
    class StatsCounterFix {
        constructor() {
            this.counters = [];
            this.hasAnimated = false;
            this.init();
        }

        init() {
            // Find all stat numbers
            this.counters = document.querySelectorAll('.stat-number[data-count]');
            
            if (this.counters.length === 0) {
                console.log('No stat counters found');
                return;
            }

            console.log(`Found ${this.counters.length} stat counters`);
            
            // Set up intersection observer
            this.setupObserver();
            
            // Also try to animate immediately if they're already visible
            this.checkIfVisible();
        }

        setupObserver() {
            const options = {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !this.hasAnimated) {
                        this.animateCounters();
                        this.hasAnimated = true;
                    }
                });
            }, options);

            // Observe the impact section
            const impactSection = document.querySelector('.impact-numbers-dark');
            if (impactSection) {
                observer.observe(impactSection);
            }
        }

        checkIfVisible() {
            // Check if counters are already in viewport
            if (this.counters.length > 0) {
                const firstCounter = this.counters[0];
                const rect = firstCounter.getBoundingClientRect();
                
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    // Already visible, animate immediately
                    setTimeout(() => {
                        if (!this.hasAnimated) {
                            this.animateCounters();
                            this.hasAnimated = true;
                        }
                    }, 500);
                }
            }
        }

        animateCounters() {
            console.log('Starting counter animations');
            
            this.counters.forEach((counter, index) => {
                const target = parseInt(counter.getAttribute('data-count'));
                const duration = 2000; // 2 seconds
                const delay = index * 200; // Stagger by 200ms
                
                setTimeout(() => {
                    this.animateValue(counter, 0, target, duration);
                }, delay);
            });
        }

        animateValue(element, start, end, duration) {
            const startTime = performance.now();
            
            const updateCounter = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function for smooth animation
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                
                const current = Math.floor(start + (end - start) * easeOutQuart);
                
                // Update just the number content
                element.textContent = current;
                
                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    element.textContent = end;
                    // Add a pulse effect when complete
                    element.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        element.style.transform = 'scale(1)';
                    }, 200);
                }
            };
            
            requestAnimationFrame(updateCounter);
        }
    }

    // Initialize on DOM ready
    function initStatsCounter() {
        new StatsCounterFix();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initStatsCounter);
    } else {
        // DOM already loaded
        initStatsCounter();
    }

    // Also reinitialize if the page uses dynamic content loading
    window.addEventListener('load', () => {
        setTimeout(initStatsCounter, 100);
    });

})();