/* ============================================
   SLDS-Compatible JavaScript Enhancements
   Phase 1: Lightweight interactions that work WITH SLDS
   ============================================ */

(function() {
    'use strict';

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ============================================
    // 1. NAVIGATION SHADOW ON SCROLL
    // ============================================
    function initNavScroll() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        let lastScroll = 0;
        
        function handleScroll() {
            const currentScroll = window.pageYOffset;
            
            if (currentScroll > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            lastScroll = currentScroll;
        }

        // Throttle scroll events
        let ticking = false;
        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(handleScroll);
                ticking = true;
                setTimeout(() => { ticking = false; }, 100);
            }
        }

        window.addEventListener('scroll', requestTick, { passive: true });
    }

    // ============================================
    // 2. STATS COUNTER ANIMATION
    // ============================================
    function initStatsCounter() {
        if (prefersReducedMotion) return;

        const stats = document.querySelectorAll('.stat-number[data-target]');
        if (!stats.length) return;

        const animateValue = (element, start, end, duration) => {
            const range = end - start;
            const increment = end > start ? 1 : -1;
            const stepTime = Math.abs(Math.floor(duration / range));
            let current = start;
            
            element.classList.add('counting');
            
            const timer = setInterval(() => {
                current += increment;
                
                // Handle different number formats
                if (element.dataset.format === 'percentage') {
                    element.textContent = current + '%';
                } else if (element.dataset.format === 'million') {
                    element.textContent = (current / 1).toFixed(0) + 'M+';
                } else if (end >= 100) {
                    element.textContent = current + '+';
                } else {
                    element.textContent = current;
                }
                
                if (current === end) {
                    clearInterval(timer);
                    element.classList.remove('counting');
                }
            }, stepTime);
        };

        // Intersection Observer for triggering animation
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                    entry.target.classList.add('animated');
                    const target = parseInt(entry.target.dataset.target);
                    animateValue(entry.target, 0, target, 2000);
                }
            });
        }, observerOptions);

        stats.forEach(stat => observer.observe(stat));
    }

    // ============================================
    // 3. SCROLL REVEAL ANIMATIONS
    // ============================================
    function initScrollReveal() {
        if (prefersReducedMotion) return;

        const reveals = document.querySelectorAll('.fade-in-up');
        if (!reveals.length) return;

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Optional: stop observing after reveal
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        reveals.forEach(element => observer.observe(element));
    }

    // ============================================
    // 4. ENHANCED FORM INTERACTIONS
    // ============================================
    function initFormEnhancements() {
        // Add floating label effect for inputs with values
        const formInputs = document.querySelectorAll('.slds-form-element__control input, .slds-form-element__control textarea');
        
        formInputs.forEach(input => {
            // Check on load
            if (input.value) {
                input.closest('.slds-form-element').classList.add('has-value');
            }
            
            // Check on input
            input.addEventListener('input', function() {
                if (this.value) {
                    this.closest('.slds-form-element').classList.add('has-value');
                } else {
                    this.closest('.slds-form-element').classList.remove('has-value');
                }
            });
        });
    }

    // ============================================
    // 5. SMOOTH ANCHOR SCROLLING
    // ============================================
    function initSmoothScroll() {
        if (prefersReducedMotion) return;

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href').slice(1);
                if (!targetId) return;
                
                const target = document.getElementById(targetId);
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

    // ============================================
    // 6. ADD FADE-IN CLASSES TO SECTIONS
    // ============================================
    function prepareAnimations() {
        // Add fade-in-up class to major sections
        const sections = document.querySelectorAll('.slds-p-vertical_xx-large, .hero-section, .stats-section');
        sections.forEach(section => {
            if (!section.classList.contains('fade-in-up')) {
                section.classList.add('fade-in-up');
            }
        });
    }

    // ============================================
    // 7. LOADING STATE HELPER
    // ============================================
    window.addLoadingState = function(element) {
        element.classList.add('loading');
        element.setAttribute('aria-busy', 'true');
    };

    window.removeLoadingState = function(element) {
        element.classList.remove('loading');
        element.setAttribute('aria-busy', 'false');
    };

    // ============================================
    // INITIALIZATION
    // ============================================
    function init() {
        // Prepare animations first
        prepareAnimations();
        
        // Initialize all enhancements
        initNavScroll();
        initStatsCounter();
        initScrollReveal();
        initFormEnhancements();
        initSmoothScroll();
        
        // Mark body as enhanced
        document.body.classList.add('slds-enhanced');
    }

    // Wait for DOM and ensure unified navigation has loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already loaded, but give navigation time to render
        setTimeout(init, 100);
    }

})();