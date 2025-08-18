/**
 * Food-N-Force Responsive Design Validation Script
 * Tests breakpoint behavior and accessibility compliance
 */

class ResponsiveValidator {
    constructor() {
        this.breakpoints = {
            xsmall: 320,
            small: 480,
            medium: 768,
            large: 1024,
            xlarge: 1280,
            max: 1440
        };
        
        this.results = {};
        this.errors = [];
        this.warnings = [];
        
        this.init();
    }
    
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.runValidation());
        } else {
            this.runValidation();
        }
    }
    
    runValidation() {
        console.log('🔍 Starting Responsive Design Validation...');
        
        // Test each breakpoint
        Object.entries(this.breakpoints).forEach(([name, width]) => {
            this.testBreakpoint(name, width);
        });
        
        // Test touch targets
        this.validateTouchTargets();
        
        // Test navigation responsiveness
        this.validateNavigation();
        
        // Test grid layouts
        this.validateGridLayouts();
        
        // Test typography scaling
        this.validateTypography();
        
        // Test form responsiveness
        this.validateForms();
        
        // Generate report
        this.generateReport();
    }
    
    testBreakpoint(name, width) {
        console.log(`📱 Testing ${name} breakpoint (${width}px)`);
        
        // Simulate viewport width
        const mediaQuery = window.matchMedia(`(max-width: ${width}px)`);
        
        this.results[name] = {
            width: width,
            matches: mediaQuery.matches,
            elements: this.getResponsiveElements(),
            issues: []
        };
        
        // Test specific breakpoint behaviors
        if (width <= 480) {
            this.validateMobileBehavior(name);
        } else if (width <= 768) {
            this.validateTabletBehavior(name);
        } else {
            this.validateDesktopBehavior(name);
        }
    }
    
    validateMobileBehavior(breakpointName) {
        const issues = [];
        
        // Check hero CTA stacking
        const ctaGroup = document.querySelector('.hero-cta-group');
        if (ctaGroup) {
            const computedStyle = window.getComputedStyle(ctaGroup);
            if (computedStyle.flexDirection !== 'column' && window.innerWidth <= 480) {
                issues.push('Hero CTA buttons should stack vertically on mobile');
            }
        }
        
        // Check mobile navigation
        const mobileNav = document.querySelector('.mobile-menu-toggle');
        if (mobileNav && window.innerWidth <= 768) {
            const isVisible = window.getComputedStyle(mobileNav).display !== 'none';
            if (!isVisible) {
                issues.push('Mobile navigation toggle should be visible');
            }
        }
        
        // Check single column layout
        const grids = document.querySelectorAll('.slds-grid.slds-wrap.slds-gutters_large');
        grids.forEach((grid, index) => {
            if (!grid.closest('.impact-numbers-dark')) { // Exception for stats grid
                const computedStyle = window.getComputedStyle(grid);
                if (computedStyle.gridTemplateColumns !== '1fr' && window.innerWidth <= 480) {
                    issues.push(`Grid ${index + 1} should be single column on mobile`);
                }
            }
        });
        
        this.results[breakpointName].issues = issues;
    }
    
    validateTabletBehavior(breakpointName) {
        const issues = [];
        
        // Check 2-column layouts where appropriate
        const grids = document.querySelectorAll('.slds-grid.slds-wrap.slds-gutters_large');
        grids.forEach((grid, index) => {
            const computedStyle = window.getComputedStyle(grid);
            const isStatsGrid = grid.closest('.impact-numbers-dark');
            
            if (!isStatsGrid && window.innerWidth > 768 && window.innerWidth <= 1024) {
                // Most grids should be 2-column on tablet
                const columns = computedStyle.gridTemplateColumns;
                if (!columns.includes('1fr 1fr') && !columns.includes('repeat(2, 1fr)')) {
                    issues.push(`Grid ${index + 1} should be 2-column on tablet`);
                }
            }
        });
        
        this.results[breakpointName].issues = issues;
    }
    
    validateDesktopBehavior(breakpointName) {
        const issues = [];
        
        // Check desktop layouts
        if (window.innerWidth >= 1024) {
            const heroTitle = document.querySelector('.hero-title');
            if (heroTitle) {
                const fontSize = parseFloat(window.getComputedStyle(heroTitle).fontSize);
                if (fontSize < 32) { // Should be larger on desktop
                    issues.push('Hero title should be larger on desktop');
                }
            }
        }
        
        this.results[breakpointName].issues = issues;
    }
    
    validateTouchTargets() {
        console.log('👆 Validating Touch Targets...');
        
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
        const minSize = 44; // WCAG minimum
        const comfortableSize = 48; // Recommended
        
        interactiveElements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(element);
            
            // Consider padding in touch target size
            const paddingTop = parseFloat(computedStyle.paddingTop);
            const paddingBottom = parseFloat(computedStyle.paddingBottom);
            const paddingLeft = parseFloat(computedStyle.paddingLeft);
            const paddingRight = parseFloat(computedStyle.paddingRight);
            
            const effectiveWidth = rect.width + paddingLeft + paddingRight;
            const effectiveHeight = rect.height + paddingTop + paddingBottom;
            
            if (effectiveWidth < minSize || effectiveHeight < minSize) {
                this.errors.push(`Touch target ${index + 1} (${element.tagName}) is too small: ${Math.round(effectiveWidth)}x${Math.round(effectiveHeight)}px (minimum: ${minSize}x${minSize}px)`);
            } else if (effectiveWidth < comfortableSize || effectiveHeight < comfortableSize) {
                this.warnings.push(`Touch target ${index + 1} (${element.tagName}) could be larger for better usability: ${Math.round(effectiveWidth)}x${Math.round(effectiveHeight)}px (recommended: ${comfortableSize}x${comfortableSize}px)`);
            }
        });
    }
    
    validateNavigation() {
        console.log('🧭 Validating Navigation Responsiveness...');
        
        const nav = document.querySelector('.navbar, .universal-nav');
        if (!nav) {
            this.errors.push('Navigation not found');
            return;
        }
        
        // Check mobile menu behavior
        if (window.innerWidth <= 768) {
            const mobileToggle = nav.querySelector('.mobile-menu-toggle, .hamburger-menu');
            const navItems = nav.querySelector('.nav-items, .navigation-menu');
            
            if (!mobileToggle) {
                this.errors.push('Mobile menu toggle not found');
            }
            
            if (navItems) {
                const isHidden = window.getComputedStyle(navItems).display === 'none' || 
                               window.getComputedStyle(navItems).visibility === 'hidden';
                if (!isHidden) {
                    this.warnings.push('Navigation items should be hidden by default on mobile');
                }
            }
        }
        
        // Check logo sizing
        const logo = nav.querySelector('.fnf-logo-image, .navbar-logo img');
        if (logo) {
            const rect = logo.getBoundingClientRect();
            if (window.innerWidth <= 320 && rect.width > 40) {
                this.warnings.push(`Logo might be too large for very small screens: ${Math.round(rect.width)}px wide`);
            }
        }
    }
    
    validateGridLayouts() {
        console.log('📐 Validating Grid Layouts...');
        
        const grids = document.querySelectorAll('.slds-grid.slds-wrap.slds-gutters_large');
        
        grids.forEach((grid, index) => {
            const computedStyle = window.getComputedStyle(grid);
            const isStatsGrid = grid.closest('.impact-numbers-dark');
            
            // Check if grid is actually using CSS Grid
            if (computedStyle.display !== 'grid') {
                this.warnings.push(`Grid ${index + 1} is not using CSS Grid display`);
            }
            
            // Check gap property
            const gap = computedStyle.gap || computedStyle.gridGap;
            if (!gap || gap === 'normal') {
                this.warnings.push(`Grid ${index + 1} should have explicit gap spacing`);
            }
            
            // Check responsive columns
            const columns = computedStyle.gridTemplateColumns;
            if (window.innerWidth <= 480 && !isStatsGrid) {
                if (columns !== '1fr') {
                    this.warnings.push(`Grid ${index + 1} should be single column on mobile (currently: ${columns})`);
                }
            } else if (window.innerWidth <= 480 && isStatsGrid) {
                if (!columns.includes('repeat(2, 1fr)') && columns !== '1fr 1fr') {
                    this.warnings.push(`Stats grid should be 2-column on mobile (currently: ${columns})`);
                }
            }
        });
    }
    
    validateTypography() {
        console.log('📝 Validating Typography Scaling...');
        
        const heroTitle = document.querySelector('.hero-title');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        // Check hero title scaling
        if (heroTitle) {
            const fontSize = parseFloat(window.getComputedStyle(heroTitle).fontSize);
            const lineHeight = parseFloat(window.getComputedStyle(heroTitle).lineHeight);
            
            if (window.innerWidth <= 320 && fontSize > 30) {
                this.warnings.push(`Hero title might be too large for very small screens: ${fontSize}px`);
            }
            
            if (lineHeight / fontSize < 1.1) {
                this.warnings.push(`Hero title line-height might be too tight: ${lineHeight / fontSize}`);
            }
        }
        
        // Check heading hierarchy
        let previousSize = Infinity;
        headings.forEach((heading, index) => {
            const fontSize = parseFloat(window.getComputedStyle(heading).fontSize);
            if (fontSize > previousSize) {
                this.warnings.push(`Heading ${index + 1} (${heading.tagName}) might break size hierarchy`);
            }
            previousSize = fontSize;
        });
    }
    
    validateForms() {
        console.log('📋 Validating Form Responsiveness...');
        
        const forms = document.querySelectorAll('form');
        const inputs = document.querySelectorAll('input, textarea, select');
        
        forms.forEach((form, index) => {
            if (window.innerWidth <= 768) {
                const computedStyle = window.getComputedStyle(form);
                if (computedStyle.flexDirection !== 'column') {
                    const hasMultipleInputs = form.querySelectorAll('input, textarea, select').length > 1;
                    if (hasMultipleInputs) {
                        this.warnings.push(`Form ${index + 1} should stack vertically on mobile`);
                    }
                }
            }
        });
        
        inputs.forEach((input, index) => {
            const rect = input.getBoundingClientRect();
            if (window.innerWidth <= 480 && rect.height < 44) {
                this.warnings.push(`Input ${index + 1} height too small for mobile: ${Math.round(rect.height)}px`);
            }
        });
    }
    
    getResponsiveElements() {
        return {
            containers: document.querySelectorAll('.slds-container_large, .slds-container_medium'),
            grids: document.querySelectorAll('.slds-grid'),
            columns: document.querySelectorAll('[class*="slds-size_"], [class*="slds-medium-size_"], [class*="slds-large-size_"]'),
            buttons: document.querySelectorAll('.slds-button'),
            navigation: document.querySelectorAll('.navbar, .universal-nav'),
            forms: document.querySelectorAll('form, .slds-form')
        };
    }
    
    generateReport() {
        console.log('\n📊 RESPONSIVE DESIGN VALIDATION REPORT');
        console.log('=====================================');
        
        // Summary
        console.log(`\n📈 SUMMARY:`);
        console.log(`Current viewport: ${window.innerWidth}x${window.innerHeight}`);
        console.log(`Errors: ${this.errors.length}`);
        console.log(`Warnings: ${this.warnings.length}`);
        
        // Errors
        if (this.errors.length > 0) {
            console.log(`\n❌ ERRORS (${this.errors.length}):`);
            this.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        
        // Warnings
        if (this.warnings.length > 0) {
            console.log(`\n⚠️ WARNINGS (${this.warnings.length}):`);
            this.warnings.forEach((warning, index) => {
                console.log(`${index + 1}. ${warning}`);
            });
        }
        
        // Breakpoint results
        console.log(`\n📱 BREAKPOINT ANALYSIS:`);
        Object.entries(this.results).forEach(([name, result]) => {
            console.log(`${name.toUpperCase()} (${result.width}px):`);
            console.log(`  - Matches: ${result.matches}`);
            console.log(`  - Issues: ${result.issues.length}`);
            if (result.issues.length > 0) {
                result.issues.forEach(issue => console.log(`    • ${issue}`));
            }
        });
        
        // Recommendations
        this.generateRecommendations();
        
        // Performance metrics
        this.checkPerformance();
        
        console.log('\n✅ Validation complete!');
    }
    
    generateRecommendations() {
        console.log(`\n💡 RECOMMENDATIONS:`);
        
        const recommendations = [];
        
        if (this.errors.length > 0) {
            recommendations.push('Fix all errors before proceeding to production');
        }
        
        if (this.warnings.filter(w => w.includes('touch target')).length > 0) {
            recommendations.push('Increase touch target sizes for better mobile usability');
        }
        
        if (this.warnings.filter(w => w.includes('grid')).length > 0) {
            recommendations.push('Optimize grid layouts for better responsive behavior');
        }
        
        if (this.warnings.filter(w => w.includes('font')).length > 0) {
            recommendations.push('Adjust typography scaling for better readability');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('Responsive design appears to be well implemented!');
        }
        
        recommendations.forEach((rec, index) => {
            console.log(`${index + 1}. ${rec}`);
        });
    }
    
    checkPerformance() {
        console.log(`\n⚡ PERFORMANCE METRICS:`);
        
        // Check number of media queries
        const stylesheets = Array.from(document.styleSheets);
        let mediaQueryCount = 0;
        
        stylesheets.forEach(stylesheet => {
            try {
                const rules = Array.from(stylesheet.cssRules || stylesheet.rules || []);
                mediaQueryCount += rules.filter(rule => rule.type === CSSRule.MEDIA_RULE).length;
            } catch (e) {
                // Cross-origin stylesheets can't be accessed
            }
        });
        
        console.log(`Media queries found: ${mediaQueryCount}`);
        
        if (mediaQueryCount > 20) {
            console.log('⚠️ High number of media queries may impact performance');
        } else {
            console.log('✅ Media query count looks good');
        }
        
        // Check for layout shifts
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const clsScore = entries.reduce((sum, entry) => sum + entry.value, 0);
                if (clsScore > 0.1) {
                    console.log(`⚠️ Cumulative Layout Shift: ${clsScore.toFixed(3)} (should be < 0.1)`);
                } else {
                    console.log(`✅ Cumulative Layout Shift: ${clsScore.toFixed(3)}`);
                }
            });
            
            observer.observe({ entryTypes: ['layout-shift'] });
        }
    }
}

// Auto-run validation if not in production
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    new ResponsiveValidator();
}

// Export for manual testing
window.ResponsiveValidator = ResponsiveValidator;