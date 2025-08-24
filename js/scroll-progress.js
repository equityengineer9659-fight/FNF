/**
 * Simple Scroll Progress Bar
 * Creates a progress bar at the top of the page that fills as you scroll
 */

(function() {
    'use strict';

    // Wait for DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Creating scroll progress bar...');
        
        // Create progress bar element
        const progressBar = document.createElement('div');
        progressBar.id = 'scroll-progress-bar';
        
        // Apply styles directly to ensure it works
        progressBar.style.cssText = `
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
        document.body.appendChild(progressBar);
        console.log('Progress bar added to page');
        
        // Update progress bar on scroll
        function updateProgress() {
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrolled = window.pageYOffset;
            const progress = scrollHeight > 0 ? (scrolled / scrollHeight) * 100 : 0;
            
            progressBar.style.width = Math.min(Math.max(progress, 0), 100) + '%';
        }
        
        // Listen for scroll events
        let ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(function() {
                    updateProgress();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
        
        // Initial update
        updateProgress();
        
        console.log('Scroll progress bar initialized successfully');
    });

})();