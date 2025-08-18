// index-page-grid-fix.js - Unified grid fixes for Focus Areas and Measurable Growth
// Consolidation of focus-area-fix.js and measurable-growth-fix.js
(function() {
    'use strict';
    
    console.log('Loading unified index page grid fix...');
    
    let isApplying = false; // Prevent infinite loops
    
    function applyIndexPageGridFixes() {
        if (isApplying) return;
        isApplying = true;
        
        console.log('Applying unified index page grid fixes...');
        
        // Fix Focus Areas Section (section 2)
        fixGridSection('.index-page section:nth-of-type(2)', 'focus-area-card', 'Focus Areas');
        
        // Fix Measurable Growth Section (section 3) 
        fixGridSection('.index-page section:nth-of-type(3)', 'measurable-card', 'Measurable Growth');
        
        // Fix Stats Section (section 4) - 4-column horizontal layout
        fixStatsSection('.index-page section:nth-of-type(4)', 'stat-card', 'Impact Numbers');
        
        setTimeout(() => {
            isApplying = false;
        }, 100);
    }
    
    function fixGridSection(sectionSelector, cardClass, sectionName) {
        const section = document.querySelector(sectionSelector);
        if (!section) {
            console.log(`${sectionName} section not found`);
            return;
        }
        
        const grid = section.querySelector('.slds-grid');
        if (!grid) {
            console.log(`${sectionName} grid not found`);
            return;
        }
        
        // Apply CSS-first approach - check if CSS rules are working first
        const computedStyle = window.getComputedStyle(grid);
        if (computedStyle.display === 'grid' && computedStyle.gap !== 'normal') {
            console.log(`${sectionName} grid already styled by CSS - skipping JS override`);
            return;
        }
        
        // EMERGENCY FIX: Skip JavaScript override for Measurable Growth to preserve CSS centering
        if (sectionName === 'Measurable Growth') {
            console.log(`${sectionName} - PRESERVING CSS CENTERING - skipping JS override`);
            return;
        }
        
        // Only apply JS if CSS isn't working
        console.log(`${sectionName} needs JS grid fix - CSS not taking effect`);
        
        // Remove problematic SLDS classes
        grid.classList.remove('slds-wrap', 'slds-gutters_large');
        
        // Apply minimal grid styles (let CSS handle the rest)
        grid.style.setProperty('display', 'grid', 'important');
        grid.style.setProperty('grid-template-columns', 'repeat(3, minmax(0, 340px))', 'important');
        grid.style.setProperty('gap', '2.5rem', 'important');
        grid.style.setProperty('justify-content', 'center', 'important');
        
        // Fix columns to work with grid
        const columns = grid.querySelectorAll('.slds-col');
        columns.forEach(col => {
            // Use CSS class approach instead of all:unset
            col.classList.add('grid-item-reset');
        });
        
        // Apply card styling through CSS classes instead of inline styles
        const cards = section.querySelectorAll(`.${cardClass}`);
        cards.forEach((card) => {
            // Remove problematic classes and let CSS handle styling
            card.classList.remove('premium-reveal');
            card.classList.add('grid-card-styled', 'revealed');
            
            // Add minimal hover effects (let CSS handle the rest)
            if (!card.hasAttribute('data-hover-fixed')) {
                addHoverEffects(card, cardClass);
                card.setAttribute('data-hover-fixed', 'true');
            }
        });
        
        console.log(`${sectionName} grid fix applied!`);
    }
    
    function fixStatsSection(sectionSelector, cardClass, sectionName) {
        const section = document.querySelector(sectionSelector);
        if (!section) {
            console.log(`${sectionName} section not found`);
            return;
        }
        
        const grid = section.querySelector('.slds-grid');
        if (!grid) {
            console.log(`${sectionName} grid not found`);
            return;
        }
        
        // Apply CSS-first approach - check if CSS rules are working first
        const computedStyle = window.getComputedStyle(grid);
        if (computedStyle.display === 'grid' && computedStyle.gridTemplateColumns && 
            computedStyle.gridTemplateColumns.includes('repeat(4')) {
            console.log(`${sectionName} grid already styled by CSS - skipping JS override`);
            return;
        }
        
        // EMERGENCY FIX: Skip JavaScript override for Impact Numbers to preserve CSS layout
        if (sectionName === 'Impact Numbers') {
            console.log(`${sectionName} - PRESERVING CSS 4-COLUMN LAYOUT - skipping JS override`);
            return;
        }
        
        // Only apply JS if CSS isn't working
        console.log(`${sectionName} needs JS grid fix - CSS not taking effect`);
        
        // Remove problematic SLDS classes
        grid.classList.remove('slds-wrap', 'slds-gutters_large');
        
        // Apply 4-column horizontal grid for stats
        grid.style.setProperty('display', 'grid', 'important');
        grid.style.setProperty('grid-template-columns', 'repeat(4, 1fr)', 'important');
        grid.style.setProperty('gap', '2rem', 'important');
        grid.style.setProperty('justify-content', 'center', 'important');
        grid.style.setProperty('align-items', 'center', 'important');
        grid.style.setProperty('justify-items', 'center', 'important');
        grid.style.setProperty('max-width', '1200px', 'important');
        grid.style.setProperty('margin', '0 auto', 'important');
        grid.style.setProperty('padding', '0 1rem', 'important');
        
        // Fix columns to work with grid
        const columns = grid.querySelectorAll('.slds-col');
        columns.forEach(col => {
            col.classList.add('grid-item-reset');
            col.style.setProperty('width', '100%', 'important');
            col.style.setProperty('max-width', '100%', 'important');
            col.style.setProperty('flex', 'none', 'important');
            col.style.setProperty('padding', '0', 'important');
            col.style.setProperty('display', 'flex', 'important');
            col.style.setProperty('justify-content', 'center', 'important');
        });
        
        // Apply card styling through CSS classes
        const cards = section.querySelectorAll(`.${cardClass}`);
        cards.forEach((card) => {
            card.classList.add('stats-card-styled', 'revealed');
        });
        
        console.log(`${sectionName} 4-column grid fix applied!`);
    }
    
    function addHoverEffects(card, cardClass) {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
            this.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            
            const iconSelector = cardClass === 'focus-area-card' ? 
                '.icon-wrapper, .focus-area-icon' : 
                '.measurable-icon, .resource-icon';
            const icon = this.querySelector(iconSelector);
            if (icon) {
                icon.style.transform = 'rotate(10deg) scale(1.1)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            
            const iconSelector = cardClass === 'focus-area-card' ? 
                '.icon-wrapper, .focus-area-icon' : 
                '.measurable-icon, .resource-icon';
            const icon = this.querySelector(iconSelector);
            if (icon) {
                icon.style.transform = 'rotate(0) scale(1)';
            }
        });
    }
    
    // Lightweight gap enforcement
    function enforceGridGaps() {
        const sections = [
            { selector: '.index-page section:nth-of-type(2)', name: 'Focus Areas' },
            { selector: '.index-page section:nth-of-type(3)', name: 'Measurable Growth' },
            { selector: '.index-page section:nth-of-type(4)', name: 'Impact Numbers' }
        ];
        
        sections.forEach(({ selector, name }) => {
            const section = document.querySelector(selector);
            if (section) {
                const grid = section.querySelector('.slds-grid');
                if (grid) {
                    const currentGap = window.getComputedStyle(grid).gap;
                    if (currentGap === 'normal' || currentGap === '0px') {
                        grid.style.setProperty('gap', '2.5rem', 'important');
                        console.log(`${name} gaps enforced`);
                    }
                }
            }
        });
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyIndexPageGridFixes);
    } else {
        applyIndexPageGridFixes();
    }
    
    // Progressive enhancement - try multiple times if needed
    setTimeout(applyIndexPageGridFixes, 500);
    setTimeout(applyIndexPageGridFixes, 1500);
    setTimeout(applyIndexPageGridFixes, 3000);
    
    // Gap enforcement
    setTimeout(enforceGridGaps, 5000);
    
    // Minimal observer for gap fixes only
    setTimeout(() => {
        const indexPage = document.querySelector('.index-page');
        if (indexPage) {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && 
                        mutation.attributeName === 'style' &&
                        mutation.target.classList.contains('slds-grid')) {
                        
                        const currentGap = window.getComputedStyle(mutation.target).gap;
                        if (currentGap === 'normal' || currentGap === '0px') {
                            enforceGridGaps();
                        }
                    }
                });
            });
            
            observer.observe(indexPage, {
                attributes: true,
                subtree: true
            });
        }
    }, 2000);
})();