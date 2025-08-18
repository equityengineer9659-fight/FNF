/**
 * CSS Developer Agent
 * Helps resolve CSS cascading issues and refactor stylesheets
 */

class CSSDeveloperAgent {
    constructor() {
        this.cssFiles = [];
        this.rules = new Map();
        this.conflicts = [];
        this.specificity = new Map();
        this.duplicates = [];
        this.unusedSelectors = [];
        this.jsInjectedStyles = [];
        this.jsFiles = [];
        this.domMutations = [];
        this.mutationObserver = null;
        this.styleManipulationPatterns = [];
    }

    /**
     * Get all CSS files from project structure
     */
    getAllCSSFiles() {
        // Define all CSS files in your project - Updated after Phase 8 cleanup
        return [
            'css/styles.css',
            'css/navigation-styles.css',
            'css/slds-enhancements.css',
            'css/animations.css',
            'css/premium-effects.css',
            'css/slds-dark-theme.css',
            'css/about-page-spacing.css',
            'css/slds-cool-effects.css',
            'css/js-conflict-fixes.css',
            'css/navigation-fixes.css',
            'css/slds-dark-theme-fixes.css'
            // Removed unused files: focus-area-override.css, index-page-grid-fix.css, impact-numbers-style.css
            // Backup files excluded as they have .backup.css extension
        ];
    }

    /**
     * Get all JS files from project structure
     */
    getAllJSFiles() {
        return [
            'js/about-page-unified.js',
            'js/animations.js',
            'js/disable-conflicting-counters.js',
            'js/index-page-grid-fix.js',
            'js/premium-effects-refactored.js',
            'js/slds-cool-effects.js',
            'js/slds-enhancements.js',
            'js/stats-counter-fix.js',
            'js/unified-navigation-refactored.js'
            // Excluding css-developer-agent.js to avoid self-analysis
            // Backup files excluded
            // Consolidated: focus-area-fix.js + measurable-growth-fix.js → index-page-grid-fix.js
            // Consolidated: about-page-fix.js + about-page-layout-fix.js → about-page-unified.js
            // Refactored: premium-effects.js → premium-effects-refactored.js (39 style manipulations to CSS)
            // Refactored: unified-navigation.js → unified-navigation-refactored.js (33 style manipulations to CSS)
        ];
    }

    /**
     * Get all HTML files from project structure
     */
    getAllHTMLFiles() {
        return [
            'index.html',
            'about.html',
            'contact.html',
            'services.html',
            'impact.html',
            'resources.html'
            // Excluding css-agent.html
        ];
    }

    /**
     * Load and parse CSS files
     */
    async loadCSSFiles(scanAll = false) {
        const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
        const inlineStyles = document.querySelectorAll('style');
        const processedPaths = new Set();
        
        // If scanAll is true, load all CSS files from project
        if (scanAll) {
            const allCSSFiles = this.getAllCSSFiles();
            console.log(`%c📋 Attempting to load ${allCSSFiles.length} CSS files`, 'color: #2196F3;');
            for (const cssPath of allCSSFiles) {
                if (!processedPaths.has(cssPath)) {
                    try {
                        const response = await fetch(cssPath);
                        if (response.ok) {
                            const cssText = await response.text();
                            this.cssFiles.push({
                                type: 'external',
                                path: cssPath,
                                content: cssText,
                                rules: this.parseCSS(cssText, cssPath),
                                source: 'manual-scan'
                            });
                            processedPaths.add(cssPath);
                            console.log(`✓ Loaded CSS: ${cssPath} (${cssText.length} chars)`);
                        } else {
                            console.warn(`⚠️ Failed to fetch ${cssPath}: ${response.status}`);
                        }
                    } catch (error) {
                        console.error(`❌ Error loading ${cssPath}:`, error);
                    }
                }
            }
        }
        
        // Process linked CSS files from current page
        for (const link of cssLinks) {
            const href = link.getAttribute('href');
            if (href && !processedPaths.has(href)) {
                try {
                    const response = await fetch(href);
                    const cssText = await response.text();
                    this.cssFiles.push({
                        type: 'external',
                        path: href,
                        content: cssText,
                        rules: this.parseCSS(cssText, href),
                        source: 'page-linked'
                    });
                    processedPaths.add(href);
                } catch (error) {
                    console.error(`Failed to load ${href}:`, error);
                }
            }
        }

        // Process inline styles
        inlineStyles.forEach((style, index) => {
            this.cssFiles.push({
                type: 'inline',
                path: `inline-style-${index}`,
                content: style.textContent,
                rules: this.parseCSS(style.textContent, `inline-${index}`),
                source: 'inline'
            });
        });
    }

    /**
     * Parse CSS text and extract rules
     */
    parseCSS(cssText, source) {
        const rules = [];
        const ruleRegex = /([^{]+)\{([^}]+)\}/g;
        let match;

        while ((match = ruleRegex.exec(cssText)) !== null) {
            const selector = match[1].trim();
            const declarations = match[2].trim();
            
            const properties = {};
            const propRegex = /([^:]+):([^;]+);?/g;
            let propMatch;

            while ((propMatch = propRegex.exec(declarations)) !== null) {
                const property = propMatch[1].trim();
                const value = propMatch[2].trim();
                properties[property] = value;
            }

            const rule = {
                selector,
                properties,
                source,
                specificity: this.calculateSpecificity(selector)
            };

            rules.push(rule);
            
            // Track rules by selector
            if (!this.rules.has(selector)) {
                this.rules.set(selector, []);
            }
            this.rules.get(selector).push(rule);
        }

        return rules;
    }

    /**
     * Calculate CSS specificity
     */
    calculateSpecificity(selector) {
        let specificity = [0, 0, 0, 0]; // [inline, ids, classes, elements]
        
        // Remove pseudo-elements
        selector = selector.replace(/::?[\w-]+/g, '');
        
        // Count IDs
        const idMatches = selector.match(/#[\w-]+/g);
        if (idMatches) specificity[1] = idMatches.length;
        
        // Count classes and attributes
        const classMatches = selector.match(/\.[\w-]+/g);
        const attrMatches = selector.match(/\[[^\]]+\]/g);
        if (classMatches) specificity[2] += classMatches.length;
        if (attrMatches) specificity[2] += attrMatches.length;
        
        // Count elements
        const elementMatches = selector.match(/^[a-z]+|[\s>+~][a-z]+/gi);
        if (elementMatches) specificity[3] = elementMatches.length;
        
        return specificity;
    }

    /**
     * Find CSS conflicts and cascading issues
     */
    findConflicts() {
        this.conflicts = [];
        
        // Check for conflicting rules
        for (const [selector, rules] of this.rules.entries()) {
            if (rules.length > 1) {
                const propertyMap = new Map();
                
                rules.forEach(rule => {
                    Object.keys(rule.properties).forEach(prop => {
                        if (!propertyMap.has(prop)) {
                            propertyMap.set(prop, []);
                        }
                        propertyMap.get(prop).push({
                            value: rule.properties[prop],
                            source: rule.source,
                            specificity: rule.specificity
                        });
                    });
                });
                
                // Find properties with different values
                for (const [prop, values] of propertyMap.entries()) {
                    const uniqueValues = new Set(values.map(v => v.value));
                    if (uniqueValues.size > 1) {
                        this.conflicts.push({
                            selector,
                            property: prop,
                            conflicts: values,
                            severity: this.calculateSeverity(prop, uniqueValues.size)
                        });
                    }
                }
            }
        }
        
        // Sort conflicts by severity
        this.conflicts.sort((a, b) => b.severity - a.severity);
    }

    /**
     * Calculate conflict severity
     */
    calculateSeverity(property, conflictCount) {
        const criticalProps = ['display', 'position', 'width', 'height', 'margin', 'padding'];
        const importantProps = ['color', 'background', 'font-size', 'z-index'];
        
        if (criticalProps.includes(property)) return 3 * conflictCount;
        if (importantProps.includes(property)) return 2 * conflictCount;
        return conflictCount;
    }

    /**
     * Find duplicate rules
     */
    findDuplicates() {
        this.duplicates = [];
        const seen = new Map();
        
        for (const file of this.cssFiles) {
            for (const rule of file.rules) {
                const key = `${rule.selector}-${JSON.stringify(rule.properties)}`;
                if (seen.has(key)) {
                    this.duplicates.push({
                        selector: rule.selector,
                        properties: rule.properties,
                        sources: [seen.get(key), rule.source]
                    });
                } else {
                    seen.set(key, rule.source);
                }
            }
        }
    }

    /**
     * Find unused selectors
     */
    findUnusedSelectors() {
        this.unusedSelectors = [];
        
        for (const [selector, rules] of this.rules.entries()) {
            // Skip pseudo-classes and media queries
            if (selector.includes(':') || selector.includes('@')) continue;
            
            try {
                const elements = document.querySelectorAll(selector);
                if (elements.length === 0) {
                    this.unusedSelectors.push({
                        selector,
                        sources: rules.map(r => r.source)
                    });
                }
            } catch (e) {
                // Invalid selector, skip
            }
        }
    }

    /**
     * Generate refactoring suggestions
     */
    generateSuggestions() {
        const suggestions = [];
        
        // Suggest consolidating duplicate rules
        if (this.duplicates.length > 0) {
            suggestions.push({
                type: 'consolidate',
                priority: 'high',
                message: `Found ${this.duplicates.length} duplicate rules that can be consolidated`,
                items: this.duplicates
            });
        }
        
        // Suggest removing unused selectors
        if (this.unusedSelectors.length > 0) {
            suggestions.push({
                type: 'remove-unused',
                priority: 'medium',
                message: `Found ${this.unusedSelectors.length} unused selectors that can be removed`,
                items: this.unusedSelectors
            });
        }
        
        // Suggest resolving conflicts
        if (this.conflicts.length > 0) {
            const highSeverity = this.conflicts.filter(c => c.severity >= 6);
            if (highSeverity.length > 0) {
                suggestions.push({
                    type: 'resolve-conflicts',
                    priority: 'critical',
                    message: `Found ${highSeverity.length} critical CSS conflicts that need resolution`,
                    items: highSeverity
                });
            }
        }
        
        // Suggest file organization
        const fileCount = this.cssFiles.filter(f => f.type === 'external').length;
        if (fileCount > 10) {
            suggestions.push({
                type: 'reorganize',
                priority: 'low',
                message: `Consider consolidating ${fileCount} CSS files into fewer, purpose-specific files`,
                recommendation: this.suggestFileOrganization()
            });
        }
        
        return suggestions;
    }

    /**
     * Suggest file organization structure
     */
    suggestFileOrganization() {
        return {
            'base.css': 'Reset, typography, and base styles',
            'layout.css': 'Grid, flexbox, and structural styles',
            'components.css': 'Reusable component styles',
            'utilities.css': 'Helper classes and utilities',
            'theme.css': 'Colors, fonts, and theme variables',
            'responsive.css': 'Media queries and responsive adjustments'
        };
    }

    /**
     * Generate detailed report
     */
    generateReport() {
        // Collect all scanned files
        const scannedFiles = {
            css: [],
            html: [],
            js: []
        };
        
        // If full scan was requested, show all expected files
        if (this.scanMode === 'full-project') {
            // Show all CSS files that were attempted
            scannedFiles.css = this.getAllCSSFiles();
            
            // Show all HTML files that were attempted  
            scannedFiles.html = this.getAllHTMLFiles();
            
            // Show all JS files that were attempted
            scannedFiles.js = this.getAllJSFiles();
        } else {
            // For current page scan, collect only what was actually processed
            this.cssFiles.forEach(file => {
                console.log('Processing CSS file:', file.path, 'type:', file.type, 'source:', file.source);
                
                // Check if it's a regular CSS file
                if (file.path.startsWith('css/') && file.type === 'external') {
                    scannedFiles.css.push(file.path);
                } 
                // Check if it's from an HTML file's <style> tag
                else if (file.path.includes('.html')) {
                    const htmlFile = file.path.split('-style-')[0];
                    if (!scannedFiles.html.includes(htmlFile)) {
                        scannedFiles.html.push(htmlFile);
                    }
                }
            });
            
            // Also track HTML files that had inline styles (from jsInjectedStyles)
            this.jsInjectedStyles.forEach(style => {
                if (style.htmlFile && !scannedFiles.html.includes(style.htmlFile)) {
                    scannedFiles.html.push(style.htmlFile);
                } else if (style.source && style.source.includes('.html-inline')) {
                    const htmlFile = style.source.replace('-inline', '');
                    if (!scannedFiles.html.includes(htmlFile)) {
                        scannedFiles.html.push(htmlFile);
                    }
                }
            });
            
            // Collect JS files
            this.jsFiles.forEach(file => {
                console.log('Processing JS file:', file.path, 'type:', file.type, 'source:', file.source);
                
                // Check if it's a regular JS file
                if (file.path.startsWith('js/') && file.type === 'external') {
                    scannedFiles.js.push(file.path);
                }
            });
        }
        
        // Sort files for consistent display
        scannedFiles.css.sort();
        scannedFiles.html.sort();
        scannedFiles.js.sort();
        
        // Debug output
        console.log('%cScanned Files Summary:', 'font-weight: bold; color: #10B981;');
        console.log('CSS files:', scannedFiles.css);
        console.log('HTML files:', scannedFiles.html);
        console.log('JS files:', scannedFiles.js);
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFiles: this.cssFiles.length,
                totalRules: Array.from(this.rules.values()).flat().length,
                totalConflicts: this.conflicts.length,
                totalDuplicates: this.duplicates.length,
                totalUnused: this.unusedSelectors.length
            },
            scannedFiles: scannedFiles,
            conflicts: this.conflicts.slice(0, 10),
            duplicates: this.duplicates.slice(0, 10),
            unused: this.unusedSelectors.slice(0, 10),
            suggestions: this.generateSuggestions()
        };
        
        return report;
    }

    /**
     * Display report in console with formatting
     */
    displayReport(report) {
        console.group('%c🔍 CSS Developer Agent Report', 'font-size: 16px; font-weight: bold; color: #4CAF50;');
        
        // Summary
        console.group('%c📊 Summary', 'font-weight: bold; color: #2196F3;');
        console.table(report.summary);
        console.groupEnd();
        
        // JavaScript Analysis
        if (report.jsAnalysis) {
            console.group('%c🔧 JavaScript Style Manipulation', 'font-weight: bold; color: #FF6B35;');
            console.log(`Found ${report.jsAnalysis.totalJSFiles} JS files manipulating styles`);
            console.log(`Total manipulations: ${report.jsAnalysis.totalManipulations}`);
            console.log(`Inline styles: ${report.jsAnalysis.totalInlineStyles}`);
            console.log(`DOM mutations tracked: ${report.jsAnalysis.totalMutations}`);
            
            if (Object.keys(report.jsAnalysis.manipulationsByType).length > 0) {
                console.log('Manipulation types:');
                console.table(report.jsAnalysis.manipulationsByType);
            }
            
            if (report.jsAnalysis.jsConflicts.length > 0) {
                console.group('%c⚡ JS-CSS Conflicts', 'color: #DC2626;');
                report.jsAnalysis.jsConflicts.forEach(conflict => {
                    console.log(`%c${conflict.selector}`, 'font-weight: bold; color: #DC2626;');
                    console.log(`Property: ${conflict.property}`);
                    console.log(`CSS value: ${conflict.cssValue} (from ${conflict.cssSource})`);
                    console.log(`JS value: ${conflict.jsValue} (from ${conflict.jsSource})`);
                    console.log(`Resolution: ${conflict.resolution}`);
                    console.log('---');
                });
                console.groupEnd();
            }
            
            if (report.jsAnalysis.recommendations.length > 0) {
                console.group('%c📝 JS Recommendations', 'color: #8B5CF6;');
                report.jsAnalysis.recommendations.forEach(rec => {
                    const icon = rec.priority === 'critical' ? '🔴' : 
                               rec.priority === 'high' ? '🟠' : '🟡';
                    console.log(`${icon} ${rec.message}`);
                });
                console.groupEnd();
            }
            
            console.groupEnd();
        }
        
        // Critical Issues
        if (report.conflicts.length > 0) {
            console.group('%c⚠️ CSS Conflicts', 'font-weight: bold; color: #FF9800;');
            report.conflicts.forEach(conflict => {
                console.log(`%c${conflict.selector}`, 'font-weight: bold;');
                console.log(`Property: ${conflict.property}`);
                console.log('Conflicting values:', conflict.conflicts);
            });
            console.groupEnd();
        }
        
        // Suggestions
        if (report.suggestions.length > 0) {
            console.group('%c💡 Suggestions', 'font-weight: bold; color: #9C27B0;');
            report.suggestions.forEach(suggestion => {
                const icon = suggestion.priority === 'critical' ? '🔴' : 
                           suggestion.priority === 'high' ? '🟠' : 
                           suggestion.priority === 'medium' ? '🟡' : '🟢';
                console.log(`${icon} ${suggestion.message}`);
            });
            console.groupEnd();
        }
        
        console.groupEnd();
        
        return report;
    }

    /**
     * Export report as JSON
     */
    exportReport(report) {
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `css-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Detect JavaScript files that manipulate CSS
     */
    async scanJavaScriptFiles(scanAll = false) {
        const scripts = document.querySelectorAll('script[src]');
        const inlineScripts = document.querySelectorAll('script:not([src])');
        const processedPaths = new Set();
        
        // Patterns to detect CSS manipulation in JS
        this.styleManipulationPatterns = [
            /\.style\.[a-zA-Z]+\s*=/g,
            /\.classList\.(add|remove|toggle)/g,
            /\.setAttribute\(['"]style['"]/g,
            /\.css\(/g,
            /\.addClass\(/g,
            /\.removeClass\(/g,
            /document\.styleSheets/g,
            /insertRule\(/g,
            /addRule\(/g,
            /\.getComputedStyle\(/g,
            /createElement\(['"]style['"]\)/g
        ];
        
        // If scanAll is true, scan all JS files from project
        if (scanAll) {
            const allJSFiles = this.getAllJSFiles();
            console.log(`%c📋 Attempting to scan ${allJSFiles.length} JS files`, 'color: #F59E0B;');
            for (const jsPath of allJSFiles) {
                if (!processedPaths.has(jsPath)) {
                    try {
                        const response = await fetch(jsPath);
                        if (response.ok) {
                            const jsContent = await response.text();
                            const manipulations = this.detectStyleManipulation(jsContent, jsPath);
                            // Store ALL JS files, even if no manipulations found
                            this.jsFiles.push({
                                path: jsPath,
                                type: 'external',
                                manipulations,
                                source: 'manual-scan'
                            });
                            processedPaths.add(jsPath);
                            console.log(`✓ Scanned JS: ${jsPath} (${manipulations.length} style manipulations)`);
                        } else {
                            console.warn(`⚠️ Failed to fetch ${jsPath}: ${response.status}`);
                        }
                    } catch (error) {
                        console.error(`❌ Error scanning ${jsPath}:`, error);
                    }
                }
            }
        }
        
        // Scan linked JS files from current page
        for (const script of scripts) {
            const src = script.getAttribute('src');
            if (src && !processedPaths.has(src)) {
                try {
                    const response = await fetch(src);
                    const jsContent = await response.text();
                    const manipulations = this.detectStyleManipulation(jsContent, src);
                    if (manipulations.length > 0) {
                        this.jsFiles.push({
                            path: src,
                            type: 'external',
                            manipulations,
                            source: 'page-linked'
                        });
                    }
                    processedPaths.add(src);
                } catch (error) {
                    console.error(`Failed to scan ${src}:`, error);
                }
            }
        }
        
        // Scan inline scripts
        inlineScripts.forEach((script, index) => {
            const manipulations = this.detectStyleManipulation(script.textContent, `inline-script-${index}`);
            if (manipulations.length > 0) {
                this.jsFiles.push({
                    path: `inline-script-${index}`,
                    type: 'inline',
                    manipulations,
                    source: 'inline'
                });
            }
        });
    }

    /**
     * Detect style manipulation patterns in JavaScript code
     */
    detectStyleManipulation(code, source) {
        const manipulations = [];
        
        this.styleManipulationPatterns.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    // Extract context around the match
                    const index = code.indexOf(match);
                    const start = Math.max(0, index - 50);
                    const end = Math.min(code.length, index + match.length + 50);
                    const context = code.substring(start, end).trim();
                    
                    // Try to extract the property being set
                    let property = 'unknown';
                    let value = 'unknown';
                    
                    if (match.includes('.style.')) {
                        const propMatch = match.match(/\.style\.([a-zA-Z]+)/);
                        if (propMatch) property = propMatch[1];
                        
                        // Try to find the value
                        const valueMatch = context.match(new RegExp(`\\.style\\.${property}\\s*=\\s*['"\`]([^'"\`]+)['"\`]`));
                        if (valueMatch) value = valueMatch[1];
                    }
                    
                    manipulations.push({
                        pattern: match,
                        property,
                        value,
                        context,
                        source,
                        type: this.categorizeManipulation(match)
                    });
                });
            }
        });
        
        return manipulations;
    }

    /**
     * Categorize the type of style manipulation
     */
    categorizeManipulation(pattern) {
        if (pattern.includes('.style.')) return 'inline-style';
        if (pattern.includes('classList')) return 'class-manipulation';
        if (pattern.includes('setAttribute')) return 'attribute-style';
        if (pattern.includes('.css(') || pattern.includes('addClass')) return 'jquery';
        if (pattern.includes('styleSheets')) return 'stylesheet-api';
        if (pattern.includes('createElement')) return 'dynamic-style-element';
        return 'other';
    }

    /**
     * Scan HTML files for inline styles and style tags
     */
    async scanHTMLFiles(scanAll = false) {
        if (!scanAll) return;
        
        const htmlFiles = this.getAllHTMLFiles();
        console.log(`%c📄 Scanning ${htmlFiles.length} HTML files for inline styles...`, 'font-weight: bold; color: #10B981;');
        
        for (const htmlPath of htmlFiles) {
            try {
                const response = await fetch(htmlPath);
                if (response.ok) {
                    const htmlContent = await response.text();
                    
                    // Parse HTML content
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlContent, 'text/html');
                    
                    // Extract <style> tags
                    const styleTags = doc.querySelectorAll('style');
                    styleTags.forEach((style, index) => {
                        if (style.textContent.trim()) {
                            this.cssFiles.push({
                                type: 'inline',
                                path: `${htmlPath}-style-${index}`,
                                content: style.textContent,
                                rules: this.parseCSS(style.textContent, `${htmlPath}-style-${index}`),
                                source: 'html-file'
                            });
                        }
                    });
                    
                    // Extract inline styles
                    const elementsWithStyles = doc.querySelectorAll('[style]');
                    elementsWithStyles.forEach(element => {
                        const styleAttr = element.getAttribute('style');
                        const styles = {};
                        
                        // Parse inline styles
                        styleAttr.split(';').forEach(declaration => {
                            const [property, value] = declaration.split(':').map(s => s.trim());
                            if (property && value) {
                                styles[property] = value;
                            }
                        });
                        
                        if (Object.keys(styles).length > 0) {
                            this.jsInjectedStyles.push({
                                element: element.tagName.toLowerCase(),
                                selector: this.generateSelector(element),
                                styles,
                                source: `${htmlPath}-inline`,
                                htmlFile: htmlPath,
                                specificity: [1, 0, 0, 0] // Inline styles have highest specificity
                            });
                        }
                    });
                    
                    console.log(`✓ Scanned HTML: ${htmlPath} (${styleTags.length} style tags, ${elementsWithStyles.length} inline styles)`);
                } else {
                    console.warn(`⚠️ Failed to fetch ${htmlPath}: ${response.status}`);
                }
            } catch (error) {
                console.error(`❌ Error scanning ${htmlPath}:`, error);
            }
        }
    }

    /**
     * Track inline styles on current page elements
     */
    trackInlineStyles() {
        const elementsWithInlineStyles = document.querySelectorAll('[style]');
        
        elementsWithInlineStyles.forEach(element => {
            const styleAttr = element.getAttribute('style');
            const styles = {};
            
            // Parse inline styles
            styleAttr.split(';').forEach(declaration => {
                const [property, value] = declaration.split(':').map(s => s.trim());
                if (property && value) {
                    styles[property] = value;
                }
            });
            
            this.jsInjectedStyles.push({
                element: element.tagName.toLowerCase(),
                selector: this.generateSelector(element),
                styles,
                source: 'current-page-inline',
                specificity: [1, 0, 0, 0] // Inline styles have highest specificity
            });
        });
    }

    /**
     * Generate a unique selector for an element
     */
    generateSelector(element) {
        if (element.id) return `#${element.id}`;
        if (element.className) return `.${element.className.split(' ').join('.')}`;
        
        let path = [];
        while (element && element.nodeType === Node.ELEMENT_NODE) {
            let selector = element.nodeName.toLowerCase();
            if (element.id) {
                selector = '#' + element.id;
                path.unshift(selector);
                break;
            } else if (element.className) {
                selector += '.' + element.className.split(' ').join('.');
            }
            path.unshift(selector);
            element = element.parentNode;
        }
        return path.join(' > ');
    }

    /**
     * Setup DOM mutation observer to track dynamic style changes
     */
    setupMutationObserver() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
        }
        
        this.mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    this.domMutations.push({
                        type: 'style-change',
                        element: this.generateSelector(mutation.target),
                        oldValue: mutation.oldValue,
                        newValue: mutation.target.getAttribute('style'),
                        timestamp: new Date().toISOString()
                    });
                } else if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    this.domMutations.push({
                        type: 'class-change',
                        element: this.generateSelector(mutation.target),
                        oldValue: mutation.oldValue,
                        newValue: mutation.target.className,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        });
        
        // Start observing
        this.mutationObserver.observe(document.body, {
            attributes: true,
            attributeOldValue: true,
            subtree: true,
            attributeFilter: ['style', 'class']
        });
    }

    /**
     * Stop mutation observer
     */
    stopMutationObserver() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
    }

    /**
     * Analyze JS-injected styles for conflicts
     */
    analyzeJSConflicts() {
        const jsConflicts = [];
        
        // Check JS-injected styles against CSS rules
        this.jsInjectedStyles.forEach(jsStyle => {
            const selector = jsStyle.selector;
            
            // Find matching CSS rules
            if (this.rules.has(selector)) {
                const cssRules = this.rules.get(selector);
                
                Object.keys(jsStyle.styles).forEach(property => {
                    cssRules.forEach(cssRule => {
                        if (cssRule.properties[property]) {
                            jsConflicts.push({
                                type: 'js-css-conflict',
                                selector,
                                property,
                                jsValue: jsStyle.styles[property],
                                cssValue: cssRule.properties[property],
                                cssSource: cssRule.source,
                                jsSource: jsStyle.source,
                                resolution: 'JS inline styles will override CSS due to higher specificity'
                            });
                        }
                    });
                });
            }
        });
        
        return jsConflicts;
    }

    /**
     * Generate JS manipulation report
     */
    generateJSReport() {
        // Count HTML inline styles separately
        const htmlInlineStyles = this.jsInjectedStyles.filter(s => 
            s.source.includes('html') || s.source.includes('-inline')
        ).length;
        
        const jsReport = {
            totalJSFiles: this.jsFiles.length,
            totalManipulations: this.jsFiles.reduce((sum, file) => sum + file.manipulations.length, 0),
            totalInlineStyles: this.jsInjectedStyles.length,
            htmlInlineStyles: htmlInlineStyles,
            totalMutations: this.domMutations.length,
            manipulationsByType: {},
            jsConflicts: this.analyzeJSConflicts(),
            recommendations: []
        };
        
        // Count manipulations by type
        this.jsFiles.forEach(file => {
            file.manipulations.forEach(manip => {
                if (!jsReport.manipulationsByType[manip.type]) {
                    jsReport.manipulationsByType[manip.type] = 0;
                }
                jsReport.manipulationsByType[manip.type]++;
            });
        });
        
        // Add recommendations
        if (jsReport.totalInlineStyles > 20) {
            jsReport.recommendations.push({
                priority: 'high',
                message: `Found ${jsReport.totalInlineStyles} inline styles. Consider moving to CSS classes for better maintainability.`
            });
        }
        
        if (jsReport.manipulationsByType['inline-style'] > 10) {
            jsReport.recommendations.push({
                priority: 'medium',
                message: 'Heavy use of .style property detected. Consider using CSS classes instead.'
            });
        }
        
        if (jsReport.jsConflicts.length > 0) {
            jsReport.recommendations.push({
                priority: 'critical',
                message: `Found ${jsReport.jsConflicts.length} conflicts between JS and CSS. JS styles will override CSS.`
            });
        }
        
        return jsReport;
    }

    /**
     * Main analysis function
     */
    async analyze(scanAll = false) {
        console.log('%c🚀 Starting CSS analysis...', 'font-weight: bold; color: #4CAF50;');
        
        if (scanAll) {
            console.log('%c📁 Full Project Scan Mode', 'font-weight: bold; color: #2196F3;');
            console.log('Scanning: HTML files, CSS folder, JS folder');
        }
        
        // Clear previous data
        this.cssFiles = [];
        this.jsFiles = [];
        this.jsInjectedStyles = [];
        this.rules.clear();
        this.conflicts = [];
        this.duplicates = [];
        this.unusedSelectors = [];
        this.scanMode = scanAll ? 'full-project' : 'current-page';
        
        // Load all resources
        await this.loadCSSFiles(scanAll);
        await this.scanHTMLFiles(scanAll);
        await this.scanJavaScriptFiles(scanAll);
        
        // Only track current page inline styles if not doing full scan
        if (!scanAll) {
            this.trackInlineStyles();
        }
        
        this.setupMutationObserver();
        
        this.findConflicts();
        this.findDuplicates();
        this.findUnusedSelectors();
        
        const report = this.generateReport();
        const jsReport = this.generateJSReport();
        report.jsAnalysis = jsReport;
        report.scanMode = scanAll ? 'full-project' : 'current-page';
        
        this.displayReport(report);
        
        // Stop observer after initial analysis
        setTimeout(() => this.stopMutationObserver(), 5000);
        
        return report;
    }

    /**
     * Export duplicate rules for Phase 2 cleanup
     */
    exportDuplicateRules() {
        console.group('%c📋 DUPLICATE RULES FOR PHASE 2', 'font-size: 16px; font-weight: bold; color: #F59E0B;');
        
        this.duplicates.forEach((dup, index) => {
            console.group(`${index + 1}. ${dup.selector}`);
            console.log('Properties:', dup.properties);
            console.log('Found in files:', dup.sources);
            console.log('Recommendation: Keep in most specific file, remove from others');
            console.groupEnd();
        });
        
        console.groupEnd();
        
        return this.duplicates;
    }

    /**
     * Show detailed quick fixes for all found issues
     */
    showDetailedQuickFixes() {
        console.group('%c⚡ DETAILED QUICK FIXES', 'font-size: 16px; font-weight: bold; color: #DC2626;');
        
        // Critical Conflicts
        if (this.conflicts.length > 0) {
            console.group('%c🔴 CRITICAL: Resolve CSS Conflicts', 'font-weight: bold; color: #DC2626;');
            this.conflicts.slice(0, 5).forEach((conflict, index) => {
                console.log(`%c${index + 1}. ${conflict.selector}`, 'font-weight: bold;');
                console.log(`   Property: ${conflict.property}`);
                console.log(`   Conflicting values:`, conflict.conflicts);
                console.log(`   🔧 FIX: Pick the value you want and remove others from the conflicting files`);
                console.log('   ---');
            });
            console.groupEnd();
        }

        // Duplicates
        if (this.duplicates.length > 0) {
            console.group('%c🟠 HIGH: Remove Duplicate Rules', 'font-weight: bold; color: #F59E0B;');
            this.duplicates.slice(0, 10).forEach((dup, index) => {
                console.log(`%c${index + 1}. ${dup.selector}`, 'font-weight: bold;');
                console.log(`   Found in: ${dup.sources.join(', ')}`);
                console.log(`   🔧 FIX: Keep only ONE instance, delete from other files`);
                console.log('   ---');
            });
            console.groupEnd();
        }

        // Unused Selectors  
        if (this.unusedSelectors.length > 0) {
            console.group('%c🟡 MEDIUM: Remove Unused Selectors', 'font-weight: bold; color: #F59E0B;');
            console.log(`Found ${this.unusedSelectors.length} unused selectors. Here are the top 10:`);
            this.unusedSelectors.slice(0, 10).forEach((unused, index) => {
                console.log(`%c${index + 1}. ${unused.selector}`, 'font-weight: bold;');
                console.log(`   In files: ${unused.sources.join(', ')}`);
                console.log(`   🔧 FIX: Safe to delete - no elements match this selector`);
                console.log('   ---');
            });
            console.groupEnd();
        }

        // File Organization
        const cssFileCount = this.cssFiles.filter(f => f.type === 'external').length;
        if (cssFileCount > 10) {
            console.group('%c🟢 LOW: Optimize File Organization', 'font-weight: bold; color: #10B981;');
            console.log(`You have ${cssFileCount} CSS files. Consider consolidating into:`);
            const organization = this.suggestFileOrganization();
            Object.entries(organization).forEach(([file, description]) => {
                console.log(`   📄 ${file}: ${description}`);
            });
            console.groupEnd();
        }

        console.log('%c💡 PRO TIP: Start with critical conflicts (red), then duplicates (orange)', 'font-style: italic; color: #6B7280;');
        console.groupEnd();
    }

    /**
     * Quick fix function for specific issues
     */
    quickFix(type, item) {
        switch(type) {
            case 'remove-unused':
                console.log(`To remove unused selector "${item.selector}", delete it from:`, item.sources);
                break;
            case 'consolidate-duplicate':
                console.log(`To consolidate duplicate rule "${item.selector}", keep only one instance in:`, item.sources[0]);
                break;
            case 'resolve-conflict':
                console.log(`To resolve conflict in "${item.selector}" for property "${item.property}":`);
                console.log('Choose the value with highest specificity or most recent declaration');
                break;
        }
    }
}

// Initialize and expose globally
window.CSSDeveloperAgent = CSSDeveloperAgent;

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.cssAgent = new CSSDeveloperAgent();
    console.log('%c✅ CSS Developer Agent ready!', 'font-weight: bold; color: #4CAF50;');
    console.log('Run `cssAgent.analyze()` to start analysis');
    console.log('Run `cssAgent.exportReport(report)` to save results');
});