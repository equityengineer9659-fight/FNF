/**
 * PHASE 1 EMERGENCY CONSOLIDATED MOBILE NAVIGATION
 * Single file implementation for deployment readiness
 * Combines all mobile nav functionality with stats counter
 */

(function() {
'use strict';

// Prevent multiple initializations
if (window.fnfMobileNavInitialized) return;

let isOpen = false;

function initializeMobileNavigation() {
    const toggle = document.querySelector('.mobile-nav-toggle');
    const menu = document.querySelector('.nav-menu');
    
    if (!toggle || !menu) {
        console.error('❌ Mobile navigation elements not found');
        return;
    }
    
    // Toggle functionality
    toggle.addEventListener('click', function(e) {
        e.preventDefault();
        isOpen = !isOpen;
        menu.classList.toggle('nav-show', isOpen);
        toggle.setAttribute('aria-expanded', isOpen);
        menu.setAttribute('aria-hidden', !isOpen);
    });
    
    // Close handlers
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isOpen) {
            closeMenu();
            toggle.focus();
        }
    });
    
    document.addEventListener('click', function(e) {
        if (isOpen && !menu.contains(e.target) && !toggle.contains(e.target)) {
            closeMenu();
        }
    });
    
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && isOpen) closeMenu();
    });
    
    function closeMenu() {
        isOpen = false;
        menu.classList.remove('nav-show');
        toggle.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
    }
    
    // Initialize ARIA
    toggle.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    if (!menu.id) menu.id = 'nav-menu';
    if (!toggle.getAttribute('aria-controls')) toggle.setAttribute('aria-controls', 'nav-menu');
}

// Stats Counter (consolidated from stats-counter-unified.js)
function initStatsCounter() {
    const counters = document.querySelectorAll('.stats-counter, .counter-number, [data-counter]');
    if (!counters.length) return;
    
    let animated = false;
    
    function animateCounters() {
        if (animated) return;
        animated = true;
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target') || counter.textContent.replace(/\D/g, ''));
            if (!target) return;
            
            let current = 0;
            const increment = Math.ceil(target / 50);
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                counter.textContent = current.toLocaleString();
            }, 30);
        });
    }
    
    // Trigger on scroll
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) animateCounters();
        });
    });
    
    counters.forEach(counter => observer.observe(counter));
}

// Initialize everything
function init() {
    initializeMobileNavigation();
    initStatsCounter();
    window.fnfMobileNavInitialized = true;
}

// Execute
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

})();