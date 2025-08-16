// measurable-growth-fix.js - Fixes the Measurable Growth cards grid layout
(function() {
    'use strict';
    
    let isApplying = false; // Flag to prevent infinite loops
    
    function applyMeasurableGrowthFix() {
        // Prevent recursive calls
        if (isApplying) return;
        isApplying = true;
        
        console.log('Applying Measurable Growth grid fix...');
        
        // Find the Measurable Growth section
        const sections = document.querySelectorAll('.index-page section');
        let measurableSection = null;
        
        sections.forEach(section => {
            if (section.textContent.includes('Measurable Growth')) {
                measurableSection = section;
            }
        });
        
        if (!measurableSection) {
            console.log('Measurable Growth section not found');
            isApplying = false;
            return;
        }
        
        // Find the grid
        const grid = measurableSection.querySelector('.slds-grid');
        if (!grid) {
            console.log('Grid not found');
            isApplying = false;
            return;
        }
        
        // Remove problematic SLDS classes
        grid.classList.remove('slds-wrap', 'slds-gutters_large');
        
        // Apply grid styles using setProperty for maximum specificity
        grid.style.setProperty('display', 'grid', 'important');
        grid.style.setProperty('grid-template-columns', 'repeat(3, minmax(0, 340px))', 'important');
        grid.style.setProperty('gap', '2.5rem', 'important');
        grid.style.setProperty('grid-gap', '2.5rem', 'important'); // For older browsers
        grid.style.setProperty('row-gap', '2.5rem', 'important');
        grid.style.setProperty('column-gap', '2.5rem', 'important');
        grid.style.setProperty('width', '100%', 'important');
        grid.style.setProperty('max-width', '1140px', 'important');
        grid.style.setProperty('margin', '0 auto', 'important');
        grid.style.setProperty('padding', '0 2rem', 'important');
        grid.style.setProperty('flex-wrap', 'unset', 'important');
        grid.style.setProperty('justify-content', 'center', 'important');
        grid.style.setProperty('align-items', 'stretch', 'important');
        grid.style.setProperty('justify-items', 'center', 'important');
        
        // Fix all columns
        const columns = grid.querySelectorAll('.slds-col');
        columns.forEach(col => {
            col.style.cssText = `
                flex: unset !important;
                max-width: unset !important;
                width: 100% !important;
                padding: 0 !important;
                margin: 0 !important;
                display: flex !important;
                justify-content: center !important;
            `;
        });
        
        // Apply the same card styling as focus-area-fix.js
        const cards = measurableSection.querySelectorAll('.measurable-card');
        cards.forEach((card) => {
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
            
            // Style the icon
            const icon = card.querySelector('.measurable-icon, .resource-icon');
            if (icon) {
                icon.style.cssText = `
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
            
            // Remove existing event listeners by cloning
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            // Add hover effect
            newCard.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-4px)';
                this.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                const icon = this.querySelector('.measurable-icon, .resource-icon');
                if (icon) {
                    icon.style.transform = 'rotate(10deg) scale(1.1)';
                }
            });
            
            newCard.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
                this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                const icon = this.querySelector('.measurable-icon, .resource-icon');
                if (icon) {
                    icon.style.transform = 'rotate(0) scale(1)';
                }
            });
        });
        
        console.log('Measurable Growth grid fix applied!');
        
        // Reset flag after a delay
        setTimeout(() => {
            isApplying = false;
        }, 100);
    }
    
    // Final enforcement function to ensure gaps are applied
    function enforceGridGaps() {
        console.log('Enforcing Measurable Growth grid gaps...');
        
        const sections = document.querySelectorAll('.index-page section');
        let measurableSection = null;
        
        sections.forEach(section => {
            if (section.textContent.includes('Measurable Growth')) {
                measurableSection = section;
            }
        });
        
        if (measurableSection) {
            const grid = measurableSection.querySelector('.slds-grid');
            if (grid) {
                // Use setProperty for absolute maximum specificity
                grid.style.setProperty('display', 'grid', 'important');
                grid.style.setProperty('gap', '2.5rem', 'important');
                grid.style.setProperty('grid-gap', '2.5rem', 'important');
                grid.style.setProperty('row-gap', '2.5rem', 'important');
                grid.style.setProperty('column-gap', '2.5rem', 'important');
                console.log('Measurable Growth gaps enforced with setProperty');
            }
        }
    }
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyMeasurableGrowthFix);
    } else {
        applyMeasurableGrowthFix();
    }
    
    // Run after a delay to ensure other scripts have loaded
    setTimeout(applyMeasurableGrowthFix, 500);
    setTimeout(applyMeasurableGrowthFix, 1500);
    
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
            console.log('Measurable Growth gap removed, reapplying...');
            enforceGridGaps();
        }
    });
    
    // Start observing after a delay
    setTimeout(() => {
        const sections = document.querySelectorAll('.index-page section');
        let measurableSection = null;
        
        sections.forEach(section => {
            if (section.textContent.includes('Measurable Growth')) {
                measurableSection = section;
            }
        });
        
        if (measurableSection) {
            observer.observe(measurableSection, {
                attributes: true,
                childList: true,
                subtree: true
            });
        }
    }, 2000);
})();