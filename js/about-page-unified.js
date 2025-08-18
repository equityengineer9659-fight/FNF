/**
 * About Page Unified Fix
 * Consolidates about-page-fix.js and about-page-layout-fix.js
 * Handles both layout restructuring and styling with minimal JS overhead
 */

(function() {
    'use strict';
    
    // Only run on About page
    if (!document.body.classList.contains('about-page')) return;
    
    console.log('About page unified fix initializing...');
    
    let isApplying = false;
    
    function applyAboutPageFixes() {
        if (isApplying) return;
        isApplying = true;
        
        // Apply CSS classes instead of inline styles
        applyModernStyling();
        
        // Only restructure layout if not already done
        if (!document.querySelector('.expertise-single-row')) {
            restructureExpertiseLayout();
        }
        
        setTimeout(() => {
            isApplying = false;
        }, 100);
    }
    
    function applyModernStyling() {
        // Apply CSS classes instead of inline styles
        document.querySelectorAll('.expertise-card, .value-card').forEach(card => {
            card.classList.add('about-card-styled');
            
            const h3 = card.querySelector('h3');
            if (h3) {
                h3.classList.add('about-card-title');
                h3.removeAttribute('style'); // Clean up any inline styles
            }
            
            const p = card.querySelector('p');
            if (p) {
                p.classList.add('about-card-text');
                p.removeAttribute('style'); // Clean up any inline styles
            }
            
            const icon = card.querySelector('.expertise-icon, .value-icon');
            if (icon) {
                icon.classList.add('about-card-icon');
            }
        });
    }
    
    function restructureExpertiseLayout() {
        const expertiseHeading = document.getElementById('expertise-heading');
        if (!expertiseHeading) return;
        
        const section = expertiseHeading.closest('section');
        if (!section) return;
        
        const allCards = section.querySelectorAll('.expertise-card');
        if (allCards.length !== 4) return; // Should have exactly 4 cards
        
        const container = section.querySelector('.slds-container_large');
        if (!container) return;
        
        // Create a new single grid container with CSS classes
        const newGrid = document.createElement('div');
        newGrid.className = 'slds-grid slds-gutters_large expertise-single-row about-expertise-grid';
        
        // Create new column wrappers for each card
        allCards.forEach((card) => {
            const col = document.createElement('div');
            col.className = 'slds-col about-expertise-col';
            
            // Clone the card
            const cardClone = card.cloneNode(true);
            col.appendChild(cardClone);
            newGrid.appendChild(col);
        });
        
        // Find and remove the old grid containers
        const oldGrids = container.querySelectorAll('.slds-grid.slds-wrap');
        oldGrids.forEach(grid => grid.remove());
        
        // Insert the new single grid after the heading
        expertiseHeading.parentNode.insertBefore(newGrid, expertiseHeading.nextSibling);
        
        console.log('What We Bring section restructured into single row');
    }
    
    // Initialize immediately
    applyAboutPageFixes();
    
    // Progressive enhancement for timing issues
    setTimeout(applyAboutPageFixes, 100);
    setTimeout(applyAboutPageFixes, 500);
    setTimeout(applyAboutPageFixes, 1000);
    
    // Lightweight observer for fixing any inline style injection
    const observer = new MutationObserver((mutations) => {
        let needsFix = false;
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && 
                mutation.attributeName === 'style' &&
                mutation.target.matches('.expertise-card *, .value-card *')) {
                needsFix = true;
            }
        });
        if (needsFix) {
            setTimeout(applyModernStyling, 10);
        }
    });
    
    // Observe about page cards
    setTimeout(() => {
        document.querySelectorAll('.expertise-card, .value-card').forEach(card => {
            observer.observe(card, { 
                attributes: true, 
                attributeFilter: ['style'],
                subtree: true 
            });
        });
    }, 1000);
    
    console.log('About page unified fix initialized successfully');
})();