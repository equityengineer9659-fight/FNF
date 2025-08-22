/**
 * Minimal Mobile Navigation Toggle
 * Progressive enhancement for static HTML navigation
 * ~20 lines of essential functionality only
 */

(function() {
    'use strict';
    
    // Early exit if no navigation present
    const toggle = document.querySelector('.mobile-nav-toggle');
    const menu = document.querySelector('.nav-menu');
    if (!toggle || !menu) return;
    
    let isOpen = false;
    
    // Toggle mobile menu
    toggle.addEventListener('click', function() {
        isOpen = !isOpen;
        menu.classList.toggle('nav-show', isOpen);
        toggle.setAttribute('aria-expanded', isOpen);
        menu.setAttribute('aria-hidden', !isOpen);
    });
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isOpen) {
            isOpen = false;
            menu.classList.remove('nav-show');
            toggle.setAttribute('aria-expanded', 'false');
            menu.setAttribute('aria-hidden', 'true');
            toggle.focus();
        }
    });
    
    // Close on outside click
    document.addEventListener('click', function(e) {
        if (isOpen && !menu.contains(e.target) && !toggle.contains(e.target)) {
            isOpen = false;
            menu.classList.remove('nav-show');
            toggle.setAttribute('aria-expanded', 'false');
            menu.setAttribute('aria-hidden', 'true');
        }
    });
    
    // Close on window resize (desktop breakpoint)
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && isOpen) {
            isOpen = false;
            menu.classList.remove('nav-show');
            toggle.setAttribute('aria-expanded', 'false');
            menu.setAttribute('aria-hidden', 'true');
        }
    });
})();