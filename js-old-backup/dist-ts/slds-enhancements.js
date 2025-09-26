/* ============================================
   SLDS Enhancement Layer - Phase 1 Quick Wins
   Adds interactivity WITHOUT modifying content
   ============================================ */
(function () {
    'use strict';
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // ============================================
    // 1. NAVIGATION SHADOW ON SCROLL
    // ============================================
    function initNavScrollEffect() {
        const navbar = document.querySelector('.navbar');
        if (!navbar)
            return;
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            if (currentScroll > 50) {
                navbar.classList.add('scrolled');
            }
            else {
                navbar.classList.remove('scrolled');
            }
            lastScroll = currentScroll;
        }, { passive: true });
    }
    // ============================================
    // 2. STATS COUNTER ANIMATION
    // ============================================
    function initStatsCounter() {
        if (prefersReducedMotion)
            return;
        const stats = document.querySelectorAll('.stat-number[data-target]');
        if (!stats.length)
            return;
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
                }
                else if (element.dataset.format === 'million') {
                    element.textContent = (current / 1).toFixed(0) + 'M+';
                }
                else if (end >= 100) {
                    element.textContent = current + '+';
                }
                else {
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
    // 3. CARD HOVER EFFECTS
    // ============================================
    function initCardEffects() {
        const cards = document.querySelectorAll('.focus-area-card, .service-card, .resource-card, .expertise-card, .value-card');
        cards.forEach(card => {
            // Add hover class for CSS animations
            card.addEventListener('mouseenter', function () {
                this.classList.add('is-hovering');
            });
            card.addEventListener('mouseleave', function () {
                this.classList.remove('is-hovering');
            });
            // Add click feedback
            card.addEventListener('click', function (e) {
                // Only if the card itself is clicked, not a button inside
                if (e.target === this || !e.target.matches('a, button')) {
                    this.style.transform = 'scale(0.98)';
                    setTimeout(() => {
                        this.style.transform = '';
                    }, 200);
                }
            });
        });
    }
    // ============================================
    // 4. SMOOTH SCROLL FOR ANCHOR LINKS
    // ============================================
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const targetId = this.getAttribute('href');
                if (targetId === '#')
                    return;
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: prefersReducedMotion ? 'auto' : 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
    // ============================================
    // 5. FORM FIELD ANIMATIONS
    // ============================================
    function initFormAnimations() {
        const formGroups = document.querySelectorAll('.slds-form-element');
        formGroups.forEach(group => {
            const input = group.querySelector('.slds-input, .slds-textarea, .slds-select');
            if (!input)
                return;
            // Floating label effect
            input.addEventListener('focus', () => {
                group.classList.add('is-focused');
            });
            input.addEventListener('blur', () => {
                group.classList.remove('is-focused');
                if (input.value) {
                    group.classList.add('has-value');
                }
                else {
                    group.classList.remove('has-value');
                }
            });
            // Check initial state
            if (input.value) {
                group.classList.add('has-value');
            }
        });
    }
    // ============================================
    // 6. BUTTON RIPPLE EFFECT
    // ============================================
    function initButtonRipple() {
        const buttons = document.querySelectorAll('.slds-button');
        buttons.forEach(button => {
            button.addEventListener('click', function (e) {
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = x + 'px';
                ripple.style.top = y + 'px';
                this.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        });
    }
    // ============================================
    // 7. LAZY LOADING IMAGES
    // ============================================
    function initLazyLoading() {
        const images = document.querySelectorAll('img[data-src]');
        if (!images.length)
            return;
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px'
        });
        images.forEach(img => imageObserver.observe(img));
    }
    // ============================================
    // 8. SCROLL TO TOP BUTTON
    // ============================================
    function initScrollToTop() {
        // Create button
        const scrollButton = document.createElement('button');
        scrollButton.innerHTML = '↑';
        scrollButton.className = 'scroll-to-top slds-button slds-button_icon';
        scrollButton.setAttribute('aria-label', 'Scroll to top');
        scrollButton.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 1000;
            width: 3rem;
            height: 3rem;
            border-radius: 50%;
            background: var(--primary-color, #0176d3);
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(scrollButton);
        // Show/hide based on scroll position
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollButton.style.opacity = '1';
                scrollButton.style.visibility = 'visible';
            }
            else {
                scrollButton.style.opacity = '0';
                scrollButton.style.visibility = 'hidden';
            }
        }, { passive: true });
        // Scroll to top on click
        scrollButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
        });
    }
    // ============================================
    // INITIALIZATION
    // ============================================
    document.addEventListener('DOMContentLoaded', function () {
        initNavScrollEffect();
        initStatsCounter();
        initCardEffects();
        initSmoothScroll();
        initFormAnimations();
        initButtonRipple();
        initLazyLoading();
        initScrollToTop();
        // Mark enhancements as loaded
        document.body.classList.add('slds-enhancements-loaded');
    });
})();
//# sourceMappingURL=slds-enhancements.js.map