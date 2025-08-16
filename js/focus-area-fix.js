// focus-area-fix.js - Fixes the styling and layout of Focus Area cards
(function() {
    'use strict';
    
    console.log('Loading focus-area-fix.js...');
    
    function rebuildFocusAreaCards() {
        console.log('Rebuilding Focus Area cards...');
        
        // Find all focus area cards
        const focusCards = document.querySelectorAll('.index-page .focus-area-card');
        
        if (focusCards.length === 0) {
            console.log('No focus area cards found');
            return;
        }
        
        // FIRST: Fix the grid layout for proper spacing
        const focusSection = document.querySelector('.index-page section:nth-of-type(2)');
        if (focusSection) {
            const grid = focusSection.querySelector('.slds-grid');
            if (grid) {
                // Remove problematic SLDS classes that force flex
                grid.classList.remove('slds-wrap', 'slds-gutters_large');
                
                // Apply grid styles using setProperty for maximum specificity
                grid.style.setProperty('display', 'grid', 'important');
                grid.style.setProperty('grid-template-columns', 'repeat(3, minmax(0, 340px))', 'important');
                grid.style.setProperty('gap', '2.5rem', 'important');
                grid.style.setProperty('grid-gap', '2.5rem', 'important'); // For older browsers
                grid.style.setProperty('width', '100%', 'important');
                grid.style.setProperty('max-width', '1140px', 'important');
                grid.style.setProperty('margin', '0 auto', 'important');
                grid.style.setProperty('padding', '0 2rem', 'important');
                grid.style.setProperty('flex-wrap', 'unset', 'important');
                grid.style.setProperty('justify-content', 'center', 'important');
                grid.style.setProperty('align-items', 'stretch', 'important');
                grid.style.setProperty('justify-items', 'center', 'important');
                
                // Fix all columns to use display: contents
                const columns = grid.querySelectorAll('.slds-col');
                columns.forEach(col => {
                    col.style.setProperty('all', 'unset', 'important');
                    col.style.setProperty('display', 'contents', 'important');
                });
                
                console.log('Grid styling applied');
            } else {
                console.log('Could not find grid element');
            }
        }
        
        // Get a reference measurable card for comparison
        const measurableCard = document.querySelector('.measurable-card');
        if (measurableCard) {
            const measurableStyles = window.getComputedStyle(measurableCard);
            console.log('Measurable card background:', measurableStyles.backgroundColor);
        }
        
        focusCards.forEach((card, index) => {
            // Apply the same styling as measurable cards
            card.style.cssText = `
                background: rgba(26, 26, 26, 0.8) !important;
                border: 2px solid rgba(255, 255, 255, 0.3) !important;
                border-radius: 16px !important;
                padding: 2.5rem !important;
                text-align: center !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                cursor: pointer !important;
                overflow: hidden !important;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                backdrop-filter: blur(10px) !important;
                -webkit-backdrop-filter: blur(10px) !important;
                min-height: 340px !important;
                display: flex !important;
                flex-direction: column !important;
                align-items: center !important;
                justify-content: flex-start !important;
                position: relative !important;
                width: 100% !important;
                max-width: 340px !important;
                margin: 0 auto !important;
            `;
            
            // Style the icon wrapper and icon
            const iconWrapper = card.querySelector('.icon-wrapper, .focus-area-icon');
            if (iconWrapper) {
                iconWrapper.style.cssText = `
                    font-size: 80px !important;
                    width: 80px !important;
                    height: 80px !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    margin: 0 auto 1.5rem !important;
                    background: linear-gradient(135deg, #0070f0 0%, #00a6ff 100%) !important;
                    border-radius: 50% !important;
                    padding: 0 !important;
                    line-height: 1 !important;
                    transition: transform 0.3s ease !important;
                `;
            }
            
            // Style the h3
            const h3 = card.querySelector('h3');
            if (h3) {
                h3.style.cssText = `
                    color: #ffffff !important;
                    font-size: 1.25rem !important;
                    font-weight: 600 !important;
                    margin-bottom: 1rem !important;
                    line-height: 1.4 !important;
                `;
            }
            
            // Style the p
            const p = card.querySelector('p');
            if (p) {
                p.style.cssText = `
                    color: rgba(255, 255, 255, 0.8) !important;
                    font-size: 0.95rem !important;
                    line-height: 1.6 !important;
                    margin: 0 !important;
                `;
            }
            
            // Remove any existing hover listeners to prevent duplicates
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            // Add hover effect to the new card
            newCard.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-4px)';
                this.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                const icon = this.querySelector('.icon-wrapper, .focus-area-icon');
                if (icon) {
                    icon.style.transform = 'rotate(10deg) scale(1.1)';
                }
            });
            
            newCard.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                const icon = this.querySelector('.icon-wrapper, .focus-area-icon');
                if (icon) {
                    icon.style.transform = 'rotate(0) scale(1)';
                }
            });
        });
        
        console.log(`Focus Area cards rebuilt successfully`);
    }
    
    // Final enforcement function to ensure gaps are applied
    function enforceGridGaps() {
        console.log('Enforcing grid gaps...');
        
        const focusSection = document.querySelector('.index-page section:nth-of-type(2)');
        if (focusSection) {
            const grid = focusSection.querySelector('.slds-grid');
            if (grid) {
                // Use setProperty for absolute maximum specificity
                grid.style.setProperty('display', 'grid', 'important');
                grid.style.setProperty('gap', '2.5rem', 'important');
                grid.style.setProperty('grid-gap', '2.5rem', 'important');
                grid.style.setProperty('row-gap', '2.5rem', 'important');
                grid.style.setProperty('column-gap', '2.5rem', 'important');
                console.log('Grid gaps enforced with setProperty');
            }
        }
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', rebuildFocusAreaCards);
    } else {
        rebuildFocusAreaCards();
    }
    
    // Run after delays to ensure everything is loaded
    setTimeout(rebuildFocusAreaCards, 500);
    setTimeout(rebuildFocusAreaCards, 1500);
    setTimeout(rebuildFocusAreaCards, 3000);
    
    // Final enforcement after everything else
    setTimeout(enforceGridGaps, 5000);
    setTimeout(enforceGridGaps, 7000);
    
    // Monitor for changes and reapply if needed
    const observer = new MutationObserver((mutations) => {
        let needsRebuild = false;
        
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target;
                if (target.classList && target.classList.contains('slds-grid')) {
                    const currentGap = window.getComputedStyle(target).gap;
                    if (currentGap === 'normal' || currentGap === '0px') {
                        needsRebuild = true;
                    }
                }
            }
        });
        
        if (needsRebuild) {
            console.log('Grid gap removed, reapplying...');
            enforceGridGaps();
        }
    });
    
    // Start observing after a delay
    setTimeout(() => {
        const focusSection = document.querySelector('.index-page section:nth-of-type(2)');
        if (focusSection) {
            observer.observe(focusSection, {
                attributes: true,
                childList: true,
                subtree: true
            });
        }
    }, 2000);
})();