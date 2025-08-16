// gap-enforcer-continuous.js - Continuously enforces gaps on index page
(function() {
    'use strict';
    
    let enforceCount = 0;
    const maxEnforcements = 20; // Stop after 20 attempts to avoid infinite loops
    
    function enforceGaps() {
        if (enforceCount >= maxEnforcements) {
            console.log('Gap enforcement reached maximum attempts');
            return;
        }
        
        enforceCount++;
        
        // Find both grids
        const focusGrid = document.querySelector('.index-page section:nth-of-type(2) .slds-grid');
        const measurableGrid = document.querySelector('.index-page section:nth-of-type(3) .slds-grid');
        
        // Apply gaps to Focus Area grid
        if (focusGrid) {
            const currentGap = window.getComputedStyle(focusGrid).gap;
            if (currentGap === 'normal' || currentGap === '0px' || !currentGap.includes('2.5rem')) {
                console.log(`Enforcing Focus Area gaps (attempt ${enforceCount})`);
                
                // Remove all gap-related inline styles first
                focusGrid.style.removeProperty('gap');
                focusGrid.style.removeProperty('grid-gap');
                focusGrid.style.removeProperty('row-gap');
                focusGrid.style.removeProperty('column-gap');
                
                // Then set them with setProperty
                focusGrid.style.setProperty('display', 'grid', 'important');
                focusGrid.style.setProperty('gap', '2.5rem', 'important');
                focusGrid.style.setProperty('grid-gap', '2.5rem', 'important');
                focusGrid.style.setProperty('row-gap', '2.5rem', 'important');
                focusGrid.style.setProperty('column-gap', '2.5rem', 'important');
            }
        }
        
        // Apply gaps to Measurable Growth grid
        if (measurableGrid) {
            const currentGap = window.getComputedStyle(measurableGrid).gap;
            if (currentGap === 'normal' || currentGap === '0px' || !currentGap.includes('2.5rem')) {
                console.log(`Enforcing Measurable Growth gaps (attempt ${enforceCount})`);
                
                // Remove all gap-related inline styles first
                measurableGrid.style.removeProperty('gap');
                measurableGrid.style.removeProperty('grid-gap');
                measurableGrid.style.removeProperty('row-gap');
                measurableGrid.style.removeProperty('column-gap');
                
                // Then set them with setProperty
                measurableGrid.style.setProperty('display', 'grid', 'important');
                measurableGrid.style.setProperty('gap', '2.5rem', 'important');
                measurableGrid.style.setProperty('grid-gap', '2.5rem', 'important');
                measurableGrid.style.setProperty('row-gap', '2.5rem', 'important');
                measurableGrid.style.setProperty('column-gap', '2.5rem', 'important');
            }
        }
    }
    
    // Run immediately
    enforceGaps();
    
    // Run at various intervals to catch late-loading scripts
    const timings = [100, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];
    timings.forEach(timing => {
        setTimeout(enforceGaps, timing);
    });
    
    // Also run on window load and DOM mutations
    window.addEventListener('load', enforceGaps);
    document.addEventListener('DOMContentLoaded', enforceGaps);
    
    // Monitor for any style changes and reapply
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target;
                if (target.classList && target.classList.contains('slds-grid')) {
                    // Debounce to avoid infinite loops
                    clearTimeout(window.gapEnforcerTimeout);
                    window.gapEnforcerTimeout = setTimeout(enforceGaps, 50);
                }
            }
        });
    });
    
    // Start observing after a delay
    setTimeout(() => {
        const mainElement = document.querySelector('.index-page main');
        if (mainElement) {
            observer.observe(mainElement, {
                attributes: true,
                childList: true,
                subtree: true
            });
        }
    }, 2000);
    
    // Nuclear option: Check every second for 10 seconds
    let intervalCount = 0;
    const gapInterval = setInterval(() => {
        intervalCount++;
        if (intervalCount > 10) {
            clearInterval(gapInterval);
            return;
        }
        enforceGaps();
    }, 1000);
    
})();