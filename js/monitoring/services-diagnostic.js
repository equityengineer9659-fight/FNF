/**
 * Services Page Diagnostic Script
 * Run this in the browser console on the Services page to diagnose styling issues
 */

function runServicesDiagnostics() {
    console.log('=== SERVICES PAGE DIAGNOSTICS ===');
    console.log('Timestamp:', new Date().toISOString());
    
    // Check if we're on the services page
    const isServicesPage = document.body.classList.contains('services-page');
    console.log('Is Services Page:', isServicesPage);
    
    if (!isServicesPage) {
        console.warn('This script should be run on the Services page');
        return;
    }
    
    // Find all focus area cards
    const focusAreaCards = document.querySelectorAll('.focus-area-card');
    console.log('Focus Area Cards Found:', focusAreaCards.length);
    
    // Find all focus area icons
    const focusAreaIcons = document.querySelectorAll('.focus-area-icon');
    console.log('Focus Area Icons Found:', focusAreaIcons.length);
    
    // Analyze each card
    focusAreaCards.forEach((card, index) => {
        console.log(`\n--- CARD ${index + 1} ---`);
        console.log('Classes:', Array.from(card.classList).join(', '));
        
        const computedStyles = window.getComputedStyle(card);
        console.log('Background Color:', computedStyles.backgroundColor);
        console.log('Border:', computedStyles.border);
        console.log('Padding:', computedStyles.padding);
        console.log('Border Radius:', computedStyles.borderRadius);
        console.log('Display:', computedStyles.display);
        console.log('Flex Direction:', computedStyles.flexDirection);
        
        // Check for inline styles
        if (card.style.cssText) {
            console.log('Inline Styles:', card.style.cssText);
        }
        
        // Find icon within this card
        const icon = card.querySelector('.focus-area-icon');
        if (icon) {
            const iconStyles = window.getComputedStyle(icon);
            console.log('Icon Width:', iconStyles.width);
            console.log('Icon Height:', iconStyles.height);
            console.log('Icon Border Radius:', iconStyles.borderRadius);
            console.log('Icon Background:', iconStyles.backgroundColor);
            console.log('Icon Display:', iconStyles.display);
            console.log('Icon Font Size:', iconStyles.fontSize);
            
            if (icon.style.cssText) {
                console.log('Icon Inline Styles:', icon.style.cssText);
            }
        }
        
        // Check h3 styling
        const h3 = card.querySelector('h3');
        if (h3) {
            const h3Styles = window.getComputedStyle(h3);
            console.log('H3 Color:', h3Styles.color);
            console.log('H3 Font Size:', h3Styles.fontSize);
            console.log('H3 Font Weight:', h3Styles.fontWeight);
        }
        
        // Check paragraph styling
        const p = card.querySelector('p');
        if (p) {
            const pStyles = window.getComputedStyle(p);
            console.log('P Color:', pStyles.color);
            console.log('P Line Height:', pStyles.lineHeight);
        }
    });
    
    // Check for any JavaScript that might be modifying styles
    console.log('\n--- JAVASCRIPT FILES ---');
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    scripts.forEach(script => {
        if (script.src.includes('services') || script.src.includes('focus-area')) {
            console.log('Services-related script:', script.src);
        }
    });
    
    // Check for CSS rules targeting services page
    console.log('\n--- CSS RULE ANALYSIS ---');
    const styleSheets = Array.from(document.styleSheets);
    let servicesRules = 0;
    
    try {
        styleSheets.forEach(sheet => {
            if (sheet.cssRules) {
                Array.from(sheet.cssRules).forEach(rule => {
                    if (rule.cssText && (
                        rule.cssText.includes('services-page') ||
                        rule.cssText.includes('focus-area-card') ||
                        rule.cssText.includes('focus-area-icon')
                    )) {
                        console.log('Relevant CSS Rule:', rule.cssText);
                        servicesRules++;
                    }
                });
            }
        });
    } catch (e) {
        console.warn('Could not access some CSS rules (CORS):', e.message);
    }
    
    console.log('Total Services-related CSS rules found:', servicesRules);
    
    // Check for competing rules
    console.log('\n--- SPECIFICITY CHECK ---');
    if (focusAreaCards.length > 0) {
        const firstCard = focusAreaCards[0];
        const allRules = [];
        
        // Get all matching rules for the first card
        for (let sheet of document.styleSheets) {
            try {
                for (let rule of sheet.cssRules) {
                    if (rule.style && firstCard.matches(rule.selectorText)) {
                        allRules.push({
                            selector: rule.selectorText,
                            specificity: getSpecificity(rule.selectorText),
                            styles: rule.style.cssText
                        });
                    }
                }
            } catch (e) {
                // CORS or other access issues
            }
        }
        
        allRules.sort((a, b) => b.specificity - a.specificity);
        console.log('CSS Rules affecting first card (by specificity):');
        allRules.slice(0, 10).forEach(rule => {
            console.log(`${rule.selector} (${rule.specificity}):`, rule.styles);
        });
    }
    
    console.log('\n=== END DIAGNOSTICS ===');
}

// Simple specificity calculator
function getSpecificity(selector) {
    if (!selector) return 0;
    
    let specificity = 0;
    
    try {
        // Count IDs
        specificity += (selector.match(/#/g) || []).length * 100;
        
        // Count classes, attributes, pseudo-classes
        specificity += (selector.match(/\./g) || []).length * 10;
        specificity += (selector.match(/\[/g) || []).length * 10;
        specificity += (selector.match(/:/g) || []).length * 10;
        
        // Count elements
        specificity += (selector.match(/[a-z]/g) || []).length;
    } catch (e) {
        console.warn('Error calculating specificity for:', selector, e);
    }
    
    return specificity;
}

// Export to global scope
window.runServicesDiagnostics = runServicesDiagnostics;

console.log('Services diagnostic script loaded. Run: runServicesDiagnostics()');