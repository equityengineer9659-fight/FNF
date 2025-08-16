/**
 * CSS Diagnostic Tools for Food-N-Force
 * Helps identify cascade order, conflicts, and JS-dependent selectors
 */

class CSSDiagnosticTools {
    constructor() {
        this.cascadeOrder = [];
        this.jsCreatedSelectors = new Set();
        this.conflictMap = new Map();
    }

    /**
     * Map the cascade order of all CSS files
     */
    mapCascadeOrder() {
        console.group('%c📋 CSS Cascade Order (Loading Sequence)', 'font-size: 14px; font-weight: bold; color: #2196F3;');
        
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        stylesheets.forEach((sheet, index) => {
            const href = sheet.getAttribute('href');
            this.cascadeOrder.push(href);
            
            // Determine priority level
            let priority = '';
            if (href.includes('salesforce-lightning')) priority = '🟢 BASE (SLDS)';
            else if (href.includes('styles.css')) priority = '🔵 MAIN';
            else if (href.includes('slds-dark-theme-fixes')) priority = '🔴 FINAL OVERRIDE';
            else if (href.includes('slds-dark-theme')) priority = '🟣 DARK THEME';
            else if (href.includes('premium-effects')) priority = '⚠️ KNOWN INTERFERER';
            else priority = '⚪ ENHANCEMENT';
            
            console.log(`${index + 1}. ${priority} ${href}`);
        });
        
        console.log('%c⚠️ Note: slds-dark-theme-fixes.css is the "final word" on styling', 'color: #DC2626; font-style: italic;');
        console.groupEnd();
        
        return this.cascadeOrder;
    }

    /**
     * Check which CSS file "wins" for conflicting selectors
     */
    findWinningStyles(selector) {
        console.group(`%c🎯 Finding winner for: ${selector}`, 'font-weight: bold; color: #10B981;');
        
        const element = document.querySelector(selector);
        if (!element) {
            console.log('❌ No element found with this selector');
            console.groupEnd();
            return null;
        }
        
        const computed = getComputedStyle(element);
        const results = {
            selector: selector,
            winner: {},
            conflicts: []
        };
        
        // Check critical properties
        const criticalProps = ['color', 'padding', 'margin', 'font-size', 'background'];
        
        criticalProps.forEach(prop => {
            const value = computed[prop];
            console.log(`${prop}: ${value}`);
            results.winner[prop] = value;
        });
        
        // Try to identify which file likely provides these styles
        const stylesheets = document.styleSheets;
        for (let sheet of stylesheets) {
            try {
                if (sheet.href && sheet.cssRules) {
                    for (let rule of sheet.cssRules) {
                        if (rule.selectorText === selector) {
                            const fileName = sheet.href.split('/').pop();
                            results.conflicts.push({
                                file: fileName,
                                properties: rule.style.cssText
                            });
                        }
                    }
                }
            } catch (e) {
                // CORS or other access issues
            }
        }
        
        console.groupEnd();
        return results;
    }

    /**
     * Detect selectors that might be created by JavaScript
     */
    detectJSDependentSelectors(unusedSelectors = []) {
        console.group('%c🔍 Checking for JS-Created Selectors', 'font-size: 14px; font-weight: bold; color: #F59E0B;');
        
        const jsPatterns = [
            // Body classes from unified-navigation.js
            /\.(services|about|contact|impact|resources)-page/,
            // Icon wrappers (protected)
            /\.(icon-wrapper|focus-area-icon|service-icon|resource-icon|expertise-icon|value-icon)/,
            // Animation classes
            /\.(fade-in|slide-up|animate|active|visible|hidden)/,
            // JavaScript state classes
            /\.(is-|has-|js-|state-)/,
            // Premium effects classes
            /\.(premium-|effect-|enhanced-)/,
            // Dark theme toggles
            /\.(dark-mode|light-mode|theme-)/,
            // Modal/overlay classes
            /\.(modal|overlay|popup|tooltip)/,
            // Loading states
            /\.(loading|loaded|pending|processing)/
        ];
        
        const potentiallyJSDependent = [];
        
        unusedSelectors.forEach(selector => {
            const isJSDependent = jsPatterns.some(pattern => pattern.test(selector));
            if (isJSDependent) {
                potentiallyJSDependent.push(selector);
                this.jsCreatedSelectors.add(selector);
            }
        });
        
        console.log(`Found ${potentiallyJSDependent.length} potentially JS-dependent selectors:`);
        console.log('These should NOT be deleted without verification:');
        potentiallyJSDependent.slice(0, 20).forEach(sel => {
            console.log(`  ⚠️ ${sel}`);
        });
        
        console.groupEnd();
        return potentiallyJSDependent;
    }

    /**
     * Analyze critical conflicts from the agent report
     */
    analyzeCriticalConflicts() {
        console.group('%c🔴 Critical Conflict Analysis', 'font-size: 16px; font-weight: bold; color: #DC2626;');
        
        const criticalSelectors = [
            '.stat-label',
            '.stat-item', 
            '.floating-cta-button',
            '.mission-text',
            '.hero-subtitle',
            '.stat-number'
        ];
        
        criticalSelectors.forEach(selector => {
            console.group(`Analyzing: ${selector}`);
            
            // Find all elements with this selector
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
                console.log(`Found ${elements.length} elements`);
                
                // Check computed styles for first element
                const computed = getComputedStyle(elements[0]);
                console.log('Current computed values:');
                console.log(`  color: ${computed.color}`);
                console.log(`  padding: ${computed.padding}`);
                console.log(`  margin: ${computed.margin}`);
                console.log(`  font-size: ${computed.fontSize}`);
                
                // Check for inline styles
                if (elements[0].style.cssText) {
                    console.log(`⚠️ Has inline styles: ${elements[0].style.cssText}`);
                }
            } else {
                console.log('❌ No elements found');
            }
            
            console.groupEnd();
        });
        
        console.groupEnd();
    }

    /**
     * Create backup documentation
     */
    documentCurrentState() {
        const state = {
            timestamp: new Date().toISOString(),
            cascadeOrder: this.cascadeOrder,
            criticalConflicts: {
                '.stat-label': this.findWinningStyles('.stat-label'),
                '.floating-cta-button': this.findWinningStyles('.floating-cta-button'),
                '.stat-number': this.findWinningStyles('.stat-number')
            },
            jsDependent: Array.from(this.jsCreatedSelectors),
            recommendations: [
                'Use slds-dark-theme-fixes.css for final overrides',
                'Preserve icon wrapper classes',
                'Check body classes from unified-navigation.js',
                'Be careful with premium-effects.js interference'
            ]
        };
        
        console.log('%c📄 Current State Documentation:', 'font-weight: bold; color: #10B981;');
        console.log(JSON.stringify(state, null, 2));
        
        return state;
    }

    /**
     * Run complete diagnostic
     */
    runFullDiagnostic() {
        console.group('%c🚀 Running Full CSS Diagnostic', 'font-size: 18px; font-weight: bold; color: #4CAF50;');
        
        // 1. Map cascade order
        this.mapCascadeOrder();
        
        // 2. Analyze critical conflicts
        this.analyzeCriticalConflicts();
        
        // 3. Check for JS dependencies (using sample unused selectors)
        const sampleUnused = [
            '.services-page',
            '.icon-wrapper',
            '.fade-in',
            '.old-class',
            '.test-selector'
        ];
        this.detectJSDependentSelectors(sampleUnused);
        
        // 4. Document state
        const state = this.documentCurrentState();
        
        console.groupEnd();
        
        console.log('%c✅ Diagnostic Complete! Ready to proceed with fixes.', 'font-size: 14px; font-weight: bold; color: #10B981;');
        
        return state;
    }
}

// Initialize and expose globally
window.cssDiagnostic = new CSSDiagnosticTools();

// Auto-run diagnostic on load
document.addEventListener('DOMContentLoaded', () => {
    console.log('%c🔧 CSS Diagnostic Tools Ready!', 'font-weight: bold; color: #4CAF50;');
    console.log('Run `cssDiagnostic.runFullDiagnostic()` for complete analysis');
    console.log('Run `cssDiagnostic.mapCascadeOrder()` to see CSS load order');
    console.log('Run `cssDiagnostic.analyzeCriticalConflicts()` for conflict details');
});