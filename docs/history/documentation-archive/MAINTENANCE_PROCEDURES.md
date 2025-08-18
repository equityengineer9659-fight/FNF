# Food-N-Force Maintenance Procedures
## Comprehensive Maintenance and Operations Guide

**Version**: 3.0  
**Maintenance Schedule**: Continuous Integration  
**Last Updated**: 2025-08-18  

---

## Maintenance Philosophy

### 1. Proactive Maintenance Approach

#### Core Principles
- **Prevention over Reaction**: Address issues before they impact users
- **Automated Quality Gates**: Continuous validation prevents regressions
- **SLDS-First Maintenance**: All updates must maintain SLDS compliance
- **Performance Budget Adherence**: No performance regressions allowed
- **Accessibility Standards**: Maintain WCAG 2.1 AA compliance

#### Maintenance Frequency
| Task Category | Frequency | Automation Level | Critical Level |
|---------------|-----------|------------------|----------------|
| **SLDS Compliance Check** | Every commit | Fully automated | High |
| **Accessibility Audit** | Daily | Automated + Manual review | High |
| **Performance Monitoring** | Continuous | Fully automated | High |
| **Security Updates** | Weekly | Semi-automated | Critical |
| **Dependency Updates** | Bi-weekly | Semi-automated | Medium |
| **Content Updates** | As needed | Manual | Low |
| **Full Site Audit** | Monthly | Manual | Medium |

---

## Code Organization and Standards

### 1. File Structure Standards

#### Directory Organization
```
Food-N-Force Website/
├── css/                          # Stylesheets (SLDS-compliant)
│   ├── styles.css               # Core styles and design tokens
│   ├── navigation-styles.css    # Navigation-specific styles
│   ├── responsive-enhancements.css # Responsive utilities
│   └── fnf-modules.css          # Component-specific enhancements
├── js/                          # JavaScript modules
│   ├── fnf-core.js             # Core application logic
│   ├── fnf-effects.js          # Visual effects and animations
│   ├── fnf-performance.js      # Performance monitoring
│   ├── fnf-app.js              # Application controller
│   └── specialized/            # Page-specific modules
├── images/                      # Asset management
│   ├── logos/                  # Logo variants and sizes
│   └── content/                # Content images
├── scripts/                     # Maintenance and deployment scripts
│   ├── slds-compliance-check.js
│   ├── deploy.js
│   ├── health-check.js
│   └── rollback.js
├── tests/                       # Testing suite
│   ├── website.spec.js         # Browser tests
│   └── performance/            # Performance test configs
└── documentation/              # Technical documentation
    ├── ARCHITECTURE_OVERVIEW.md
    ├── COMPONENT_SPECIFICATION.md
    └── MAINTENANCE_PROCEDURES.md
```

#### Naming Conventions
```javascript
// File naming standards
const NAMING_CONVENTIONS = {
    html: 'kebab-case.html',          // about.html, contact.html
    css: 'kebab-case.css',            // navigation-styles.css
    javascript: 'kebab-case.js',      // fnf-core.js
    images: 'kebab-case.ext',         // fnf-logo.svg
    classes: 'PascalCase',            // FoodNForceCore
    variables: 'camelCase',           // navigationState
    constants: 'SCREAMING_SNAKE_CASE' // PERFORMANCE_BUDGETS
};

// CSS class naming (SLDS + BEM hybrid)
.fnf-component-name                 // Component block
.fnf-component-name__element        // Element
.fnf-component-name--modifier       // Modifier
.slds-component                     // SLDS component (never modify)
```

### 2. Code Quality Standards

#### Linting Configuration
```javascript
// .eslintrc.js
module.exports = {
    extends: [
        'eslint:recommended',
        'airbnb-base'
    ],
    env: {
        browser: true,
        es2021: true
    },
    parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module'
    },
    rules: {
        // Performance rules
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        'no-debugger': 'error',
        'no-unused-vars': 'error',
        
        // Accessibility rules
        'jsx-a11y/accessible-emoji': 'error',
        'jsx-a11y/aria-role': 'error',
        
        // SLDS compliance rules (custom)
        'fnf/no-inline-styles': 'error',
        'fnf/slds-classes-only': 'error',
        'fnf/performance-budget': 'warn'
    },
    plugins: ['accessibility', 'fnf-custom']
};
```

#### CSS Quality Standards
```css
/* stylelint.config.js */
module.exports = {
    extends: [
        'stylelint-config-standard',
        'stylelint-config-slds'
    ],
    rules: {
        /* SLDS Compliance */
        'slds/no-custom-colors': true,
        'slds/use-spacing-tokens': true,
        'slds/use-typography-scale': true,
        
        /* Performance */
        'max-nesting-depth': 3,
        'selector-max-compound-selectors': 4,
        'declaration-no-important': true,
        
        /* Accessibility */
        'color-contrast': true,
        'font-size-minimum': '14px'
    }
};
```

---

## Update Procedures

### 1. SLDS Version Updates

#### Pre-Update Checklist
```bash
#!/bin/bash
# slds-update-prep.sh

echo "🔍 Preparing for SLDS update..."

# 1. Backup current state
git checkout -b "backup-before-slds-update-$(date +%Y%m%d)"
git add .
git commit -m "Backup before SLDS update"

# 2. Document current SLDS usage
npm run validate:slds > slds-baseline.txt

# 3. Check current performance metrics
npm run test:performance > performance-baseline.txt

# 4. Run full test suite
npm run test > test-baseline.txt

# 5. Document breaking changes
curl -s "https://api.github.com/repos/salesforce-ux/design-system/releases" | \
    jq -r '.[0] | .body' > slds-changelog.md

echo "✅ Pre-update checks completed"
echo "Review baselines and changelog before proceeding"
```

#### SLDS Update Process
```bash
#!/bin/bash
# slds-update.sh

set -e

CURRENT_VERSION=$(grep -o 'design-system/[0-9.]*' index.html | head -1 | cut -d'/' -f2)
NEW_VERSION=$1

if [ -z "$NEW_VERSION" ]; then
    echo "❌ Please specify new SLDS version: ./slds-update.sh 2.23.0"
    exit 1
fi

echo "🚀 Updating SLDS from $CURRENT_VERSION to $NEW_VERSION"

# 1. Update CDN links in all HTML files
find . -name "*.html" -type f -exec sed -i.bak \
    "s/design-system\/$CURRENT_VERSION/design-system\/$NEW_VERSION/g" {} \;

# 2. Update package.json if using local SLDS
if grep -q "@salesforce-ux/design-system" package.json; then
    npm update @salesforce-ux/design-system@$NEW_VERSION
fi

# 3. Run compliance check
echo "🔍 Checking SLDS compliance..."
npm run validate:slds

# 4. Run visual regression tests
echo "🎨 Running visual regression tests..."
npm run test:visual

# 5. Run performance tests
echo "⚡ Running performance tests..."
npm run test:performance

# 6. Full test suite
echo "🧪 Running full test suite..."
npm run test

echo "✅ SLDS update completed successfully"
echo "Please review changes and commit if tests pass"
```

#### Post-Update Validation
```javascript
// scripts/slds-update-validation.js
class SLDSUpdateValidator {
    constructor() {
        this.issues = [];
        this.warnings = [];
    }
    
    async validateUpdate() {
        console.log('🔍 Validating SLDS update...');
        
        await this.checkComponentCompatibility();
        await this.checkTokenChanges();
        await this.checkBreakingChanges();
        await this.validatePerformanceImpact();
        
        this.generateReport();
    }
    
    async checkComponentCompatibility() {
        const components = [
            '.slds-brand',
            '.slds-context-bar',
            '.slds-card',
            '.slds-button',
            '.slds-form-element',
            '.slds-grid'
        ];
        
        for (const component of components) {
            const elements = document.querySelectorAll(component);
            if (elements.length === 0) {
                this.warnings.push(`Component ${component} not found in DOM`);
                continue;
            }
            
            elements.forEach(element => {
                const computedStyle = window.getComputedStyle(element);
                
                // Check for expected SLDS properties
                if (!this.hasExpectedSLDSStyles(element, computedStyle)) {
                    this.issues.push({
                        component: component,
                        element: element,
                        issue: 'Missing expected SLDS styles'
                    });
                }
            });
        }
    }
    
    async checkTokenChanges() {
        const criticalTokens = [
            '--slds-c-brand-primary',
            '--slds-c-spacing-large',
            '--slds-c-font-size-4',
            '--slds-c-elevation-shadow-2'
        ];
        
        const rootStyle = window.getComputedStyle(document.documentElement);
        
        criticalTokens.forEach(token => {
            const value = rootStyle.getPropertyValue(token);
            if (!value) {
                this.issues.push({
                    type: 'token',
                    token: token,
                    issue: 'Token not found or undefined'
                });
            }
        });
    }
    
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            issues: this.issues,
            warnings: this.warnings,
            status: this.issues.length === 0 ? 'PASS' : 'FAIL'
        };
        
        console.log('📊 SLDS Update Validation Report:', report);
        
        if (report.status === 'FAIL') {
            console.error('❌ SLDS update validation failed');
            process.exit(1);
        } else {
            console.log('✅ SLDS update validation passed');
        }
        
        return report;
    }
}
```

### 2. Security Update Procedures

#### Dependency Security Scanning
```bash
#!/bin/bash
# security-scan.sh

echo "🔒 Running security scan..."

# 1. NPM audit
echo "📦 Checking npm dependencies..."
npm audit --audit-level=moderate

# 2. Check for known vulnerabilities
if command -v safety &> /dev/null; then
    echo "🛡️ Running safety check..."
    safety check
fi

# 3. OWASP dependency check
if command -v dependency-check &> /dev/null; then
    echo "🔍 Running OWASP dependency check..."
    dependency-check --project "Food-N-Force" --scan . --format HTML
fi

# 4. Check Content Security Policy
echo "🌐 Validating CSP..."
node scripts/validate-csp.js

# 5. Security headers validation
echo "📡 Checking security headers..."
curl -I https://foodandforce.netlify.app | grep -E "(X-Frame-Options|X-Content-Type-Options|X-XSS-Protection)"

echo "✅ Security scan completed"
```

#### Security Update Process
```javascript
// scripts/security-update.js
class SecurityUpdater {
    constructor() {
        this.vulnerabilities = [];
        this.updateLog = [];
    }
    
    async performSecurityUpdate() {
        console.log('🔒 Starting security update process...');
        
        // 1. Scan for vulnerabilities
        await this.scanVulnerabilities();
        
        // 2. Categorize by severity
        const critical = this.vulnerabilities.filter(v => v.severity === 'critical');
        const high = this.vulnerabilities.filter(v => v.severity === 'high');
        const moderate = this.vulnerabilities.filter(v => v.severity === 'moderate');
        
        // 3. Apply fixes in order of severity
        if (critical.length > 0) {
            await this.applyCriticalFixes(critical);
        }
        
        if (high.length > 0) {
            await this.applyHighPriorityFixes(high);
        }
        
        if (moderate.length > 0) {
            await this.applyModerateFixes(moderate);
        }
        
        // 4. Validate fixes
        await this.validateSecurityFixes();
        
        // 5. Generate update report
        this.generateSecurityReport();
    }
    
    async applyCriticalFixes(vulnerabilities) {
        console.log('🚨 Applying critical security fixes...');
        
        for (const vuln of vulnerabilities) {
            try {
                if (vuln.fixAvailable) {
                    await this.executeNpmFix(vuln);
                } else {
                    await this.applyManualFix(vuln);
                }
                
                this.updateLog.push({
                    vulnerability: vuln.name,
                    status: 'fixed',
                    method: vuln.fixAvailable ? 'automatic' : 'manual'
                });
                
            } catch (error) {
                console.error(`Failed to fix ${vuln.name}:`, error);
                this.updateLog.push({
                    vulnerability: vuln.name,
                    status: 'failed',
                    error: error.message
                });
            }
        }
    }
    
    async validateSecurityFixes() {
        console.log('🔍 Validating security fixes...');
        
        // Run full test suite
        const testResult = await this.runTestSuite();
        if (!testResult.success) {
            throw new Error('Security fixes broke functionality');
        }
        
        // Re-scan for vulnerabilities
        const remainingVulns = await this.scanVulnerabilities();
        if (remainingVulns.some(v => v.severity === 'critical')) {
            throw new Error('Critical vulnerabilities still present');
        }
        
        // Check CSP headers
        await this.validateCSP();
        
        console.log('✅ Security fixes validated successfully');
    }
}
```

### 3. Performance Maintenance

#### Performance Regression Detection
```javascript
// scripts/performance-regression-check.js
class PerformanceRegressionDetector {
    constructor() {
        this.baselineMetrics = this.loadBaseline();
        this.currentMetrics = {};
        this.regressions = [];
    }
    
    async checkForRegressions() {
        console.log('⚡ Checking for performance regressions...');
        
        // Run current performance tests
        this.currentMetrics = await this.measureCurrentPerformance();
        
        // Compare with baseline
        this.detectRegressions();
        
        // Generate report
        return this.generateRegressionReport();
    }
    
    async measureCurrentPerformance() {
        const lighthouse = require('lighthouse');
        const chromeLauncher = require('chrome-launcher');
        
        const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
        const options = {
            logLevel: 'info',
            output: 'json',
            onlyCategories: ['performance'],
            port: chrome.port
        };
        
        const pages = [
            'http://localhost:8080/',
            'http://localhost:8080/about.html',
            'http://localhost:8080/services.html'
        ];
        
        const results = {};
        
        for (const url of pages) {
            const runResult = await lighthouse(url, options);
            results[url] = {
                performance: runResult.lhr.categories.performance.score * 100,
                fcp: runResult.lhr.audits['first-contentful-paint'].numericValue,
                lcp: runResult.lhr.audits['largest-contentful-paint'].numericValue,
                cls: runResult.lhr.audits['cumulative-layout-shift'].numericValue,
                tbt: runResult.lhr.audits['total-blocking-time'].numericValue
            };
        }
        
        await chrome.kill();
        return results;
    }
    
    detectRegressions() {
        const thresholds = {
            performance: 5,  // 5 point drop in Lighthouse score
            fcp: 200,       // 200ms increase in FCP
            lcp: 300,       // 300ms increase in LCP
            cls: 0.05,      // 0.05 increase in CLS
            tbt: 100        // 100ms increase in TBT
        };
        
        Object.keys(this.currentMetrics).forEach(url => {
            const current = this.currentMetrics[url];
            const baseline = this.baselineMetrics[url];
            
            if (!baseline) {
                console.warn(`No baseline found for ${url}`);
                return;
            }
            
            Object.keys(thresholds).forEach(metric => {
                const currentValue = current[metric];
                const baselineValue = baseline[metric];
                const threshold = thresholds[metric];
                
                let regression = false;
                
                if (metric === 'performance') {
                    // Performance score - lower is worse
                    regression = (baselineValue - currentValue) > threshold;
                } else {
                    // Timing metrics - higher is worse
                    regression = (currentValue - baselineValue) > threshold;
                }
                
                if (regression) {
                    this.regressions.push({
                        url,
                        metric,
                        baseline: baselineValue,
                        current: currentValue,
                        change: currentValue - baselineValue,
                        threshold
                    });
                }
            });
        });
    }
    
    generateRegressionReport() {
        const report = {
            timestamp: new Date().toISOString(),
            regressions: this.regressions,
            status: this.regressions.length === 0 ? 'PASS' : 'FAIL',
            summary: {
                total: this.regressions.length,
                byMetric: this.groupBy(this.regressions, 'metric'),
                byPage: this.groupBy(this.regressions, 'url')
            }
        };
        
        if (report.status === 'FAIL') {
            console.error('❌ Performance regressions detected:', report);
            this.alertTeam(report);
        } else {
            console.log('✅ No performance regressions detected');
        }
        
        return report;
    }
}
```

---

## Testing Standards

### 1. Automated Testing Pipeline

#### Test Suite Configuration
```javascript
// playwright.config.js
module.exports = {
    testDir: './tests',
    timeout: 30000,
    retries: 2,
    use: {
        browserName: 'chromium',
        headless: true,
        viewport: { width: 1280, height: 720 },
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure'
    },
    projects: [
        {
            name: 'Desktop Chrome',
            use: { browserName: 'chromium' }
        },
        {
            name: 'Desktop Firefox', 
            use: { browserName: 'firefox' }
        },
        {
            name: 'Desktop Safari',
            use: { browserName: 'webkit' }
        },
        {
            name: 'Mobile Chrome',
            use: {
                browserName: 'chromium',
                ...devices['Pixel 5']
            }
        },
        {
            name: 'Mobile Safari',
            use: {
                browserName: 'webkit',
                ...devices['iPhone 12']
            }
        }
    ],
    reporter: [
        ['html'],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['json', { outputFile: 'test-results/results.json' }]
    ]
};
```

#### Comprehensive Test Suite
```javascript
// tests/comprehensive.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Comprehensive Website Tests', () => {
    
    test.beforeEach(async ({ page }) => {
        // Set up performance monitoring
        await page.addInitScript(() => {
            window.testMetrics = {};
            
            // Monitor Core Web Vitals
            new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (entry.entryType === 'largest-contentful-paint') {
                        window.testMetrics.LCP = entry.startTime;
                    }
                });
            }).observe({ entryTypes: ['largest-contentful-paint'] });
        });
    });
    
    test('SLDS compliance validation', async ({ page }) => {
        await page.goto('/');
        
        // Check for required SLDS classes
        const requiredClasses = [
            '.slds-brand',
            '.slds-context-bar',
            '.slds-grid',
            '.slds-button',
            '.slds-card'
        ];
        
        for (const className of requiredClasses) {
            const element = await page.$(className);
            expect(element).not.toBeNull();
        }
        
        // Validate no custom CSS overriding SLDS
        const customOverrides = await page.evaluate(() => {
            const overrides = [];
            const stylesheets = Array.from(document.styleSheets);
            
            stylesheets.forEach(sheet => {
                try {
                    const rules = Array.from(sheet.cssRules);
                    rules.forEach(rule => {
                        if (rule.selectorText && rule.selectorText.includes('.slds-')) {
                            // Check if it's not in allowed custom files
                            if (!sheet.href.includes('styles.css') && 
                                !sheet.href.includes('navigation-styles.css')) {
                                overrides.push({
                                    selector: rule.selectorText,
                                    source: sheet.href
                                });
                            }
                        }
                    });
                } catch (e) {
                    // Skip cross-origin stylesheets
                }
            });
            
            return overrides;
        });
        
        expect(customOverrides).toHaveLength(0);
    });
    
    test('Accessibility compliance (WCAG 2.1 AA)', async ({ page }) => {
        await page.goto('/');
        
        // Inject axe-core for accessibility testing
        await page.addScriptTag({ url: 'https://unpkg.com/axe-core@4.4.1/axe.min.js' });
        
        // Run accessibility scan
        const results = await page.evaluate(() => {
            return axe.run(document, {
                rules: {
                    'color-contrast': { enabled: true },
                    'keyboard-navigation': { enabled: true },
                    'aria-roles': { enabled: true },
                    'semantic-structure': { enabled: true }
                }
            });
        });
        
        // Assert no accessibility violations
        expect(results.violations).toHaveLength(0);
        
        // Test keyboard navigation
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement.tagName);
        expect(['A', 'BUTTON', 'INPUT']).toContain(focusedElement);
        
        // Test skip navigation
        const skipLink = await page.$('.skip-link');
        expect(skipLink).not.toBeNull();
    });
    
    test('Performance benchmarks', async ({ page }) => {
        const startTime = Date.now();
        
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(3000);
        
        // Check Core Web Vitals
        const metrics = await page.evaluate(() => window.testMetrics);
        if (metrics.LCP) {
            expect(metrics.LCP).toBeLessThan(2500);
        }
        
        // Check bundle sizes
        const performanceEntries = await page.evaluate(() => {
            return performance.getEntriesByType('resource')
                .filter(entry => entry.name.includes('.css') || entry.name.includes('.js'))
                .map(entry => ({
                    name: entry.name,
                    size: entry.transferSize,
                    duration: entry.duration
                }));
        });
        
        const totalCSSSize = performanceEntries
            .filter(entry => entry.name.includes('.css'))
            .reduce((total, entry) => total + entry.size, 0);
        
        const totalJSSize = performanceEntries
            .filter(entry => entry.name.includes('.js'))
            .reduce((total, entry) => total + entry.size, 0);
        
        expect(totalCSSSize).toBeLessThan(50 * 1024); // 50KB
        expect(totalJSSize).toBeLessThan(75 * 1024);  // 75KB
    });
    
    test('Cross-browser compatibility', async ({ page, browserName }) => {
        await page.goto('/');
        
        // Test critical functionality works across browsers
        const logoVisible = await page.isVisible('.fnf-logo-image');
        const navigationVisible = await page.isVisible('.fnf-navbar');
        const heroVisible = await page.isVisible('.hero-section');
        
        expect(logoVisible).toBe(true);
        expect(navigationVisible).toBe(true);
        expect(heroVisible).toBe(true);
        
        // Test JavaScript functionality
        const coreLoaded = await page.evaluate(() => {
            return typeof window.FoodNForceCore !== 'undefined';
        });
        expect(coreLoaded).toBe(true);
        
        // Browser-specific checks
        if (browserName === 'webkit') {
            // Safari-specific tests
            const webpSupport = await page.evaluate(() => {
                const canvas = document.createElement('canvas');
                return canvas.toDataURL('image/webp').indexOf('webp') > -1;
            });
            // Safari may not support WebP, ensure PNG fallbacks work
            if (!webpSupport) {
                const logoSrc = await page.$eval('.fnf-logo-image', el => el.src);
                expect(logoSrc).toBeTruthy();
            }
        }
    });
});
```

### 2. Manual Testing Checklists

#### Pre-Release Testing Checklist
```markdown
## Pre-Release Testing Checklist

### Functionality Testing
- [ ] **Navigation**: All links work correctly
- [ ] **Mobile Menu**: Opens/closes properly on mobile devices
- [ ] **Contact Form**: Submits successfully with validation
- [ ] **Logo Display**: All logo variants display correctly
- [ ] **Responsive Design**: Layout adapts properly to all breakpoints
- [ ] **Browser Compatibility**: Test in Chrome, Firefox, Safari, Edge

### Performance Testing
- [ ] **Page Load Speed**: All pages load within 3 seconds
- [ ] **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] **Image Optimization**: Images load in appropriate formats
- [ ] **Bundle Sizes**: CSS < 50KB, JS < 75KB (gzipped)
- [ ] **Caching**: Static assets cached properly

### Accessibility Testing
- [ ] **Keyboard Navigation**: Full site navigable with keyboard only
- [ ] **Screen Reader**: Test with screen reader (NVDA/JAWS)
- [ ] **Color Contrast**: All text meets 4.5:1 contrast ratio
- [ ] **Focus Indicators**: Clear focus states for all interactive elements
- [ ] **Alt Text**: All images have appropriate alt text

### SLDS Compliance
- [ ] **Component Usage**: All UI uses proper SLDS components
- [ ] **Token Usage**: Colors and spacing use SLDS tokens
- [ ] **No Custom Overrides**: No SLDS classes modified
- [ ] **Design Consistency**: Visual design matches SLDS patterns

### Security Testing
- [ ] **CSP Headers**: Content Security Policy configured correctly
- [ ] **XSS Protection**: No XSS vulnerabilities
- [ ] **HTTPS**: All resources served over HTTPS
- [ ] **Dependencies**: No security vulnerabilities in dependencies

### Content Validation
- [ ] **Grammar/Spelling**: All content proofread
- [ ] **Links**: All external links work and open in new tabs
- [ ] **Contact Information**: All contact details accurate
- [ ] **Copyright**: Copyright notices up to date
```

---

## Troubleshooting Guide

### 1. Common Issues and Solutions

#### SLDS Compliance Issues
```bash
# Issue: SLDS compliance check fails
# Symptom: npm run validate:slds returns errors

# Diagnosis steps:
echo "🔍 Diagnosing SLDS compliance issues..."

# 1. Check for custom CSS overriding SLDS
grep -r "\.slds-" css/ --include="*.css" | grep -v "navigation-styles.css" | grep -v "styles.css"

# 2. Validate SLDS CDN link is correct
curl -I "https://cdnjs.cloudflare.com/ajax/libs/design-system/2.22.2/styles/salesforce-lightning-design-system.min.css"

# 3. Check for non-SLDS colors
grep -r "color:" css/ --include="*.css" | grep -v "var(--slds-"

# 4. Validate spacing tokens
grep -r "margin\|padding" css/ --include="*.css" | grep -v "var(--slds-c-spacing-"

# Solution process:
# 1. Replace custom CSS with SLDS utilities
# 2. Update token usage
# 3. Re-run compliance check
npm run validate:slds
```

#### Performance Regression Issues
```javascript
// Issue: Performance tests failing
// scripts/performance-debug.js

class PerformanceDebugger {
    async diagnosePerformanceIssues() {
        console.log('🔍 Diagnosing performance issues...');
        
        // 1. Check bundle sizes
        await this.checkBundleSizes();
        
        // 2. Analyze render-blocking resources
        await this.analyzeRenderBlocking();
        
        // 3. Check image optimization
        await this.checkImageOptimization();
        
        // 4. Analyze JavaScript execution
        await this.analyzeJavaScriptPerformance();
    }
    
    async checkBundleSizes() {
        const fs = require('fs');
        const path = require('path');
        const gzipSize = require('gzip-size');
        
        const files = [
            'css/styles.css',
            'css/navigation-styles.css',
            'js/fnf-core.js',
            'js/fnf-app.js'
        ];
        
        for (const file of files) {
            if (fs.existsSync(file)) {
                const size = fs.statSync(file).size;
                const compressed = await gzipSize.file(file);
                
                console.log(`📦 ${file}: ${size} bytes (${compressed} gzipped)`);
                
                // Check against budgets
                const budget = this.getBudgetForFile(file);
                if (compressed > budget) {
                    console.warn(`⚠️ ${file} exceeds budget: ${compressed} > ${budget}`);
                    await this.suggestOptimizations(file);
                }
            }
        }
    }
    
    async suggestOptimizations(file) {
        if (file.endsWith('.css')) {
            console.log(`💡 CSS Optimization suggestions for ${file}:`);
            console.log('   - Remove unused CSS rules');
            console.log('   - Combine duplicate selectors');
            console.log('   - Use SLDS utilities instead of custom CSS');
        } else if (file.endsWith('.js')) {
            console.log(`💡 JavaScript Optimization suggestions for ${file}:`);
            console.log('   - Remove unused code');
            console.log('   - Lazy load non-critical modules');
            console.log('   - Use dynamic imports for large features');
        }
    }
}
```

#### Accessibility Issues
```javascript
// Issue: Accessibility tests failing
// scripts/accessibility-debug.js

class AccessibilityDebugger {
    async diagnoseAccessibilityIssues() {
        console.log('♿ Diagnosing accessibility issues...');
        
        const issues = [];
        
        // 1. Check color contrast
        const contrastIssues = await this.checkColorContrast();
        issues.push(...contrastIssues);
        
        // 2. Check keyboard navigation
        const keyboardIssues = await this.checkKeyboardNavigation();
        issues.push(...keyboardIssues);
        
        // 3. Check ARIA implementation
        const ariaIssues = await this.checkARIAImplementation();
        issues.push(...ariaIssues);
        
        // 4. Generate fix recommendations
        this.generateFixRecommendations(issues);
    }
    
    async checkColorContrast() {
        const issues = [];
        
        // This would be run in a browser context
        const colorPairs = [
            { selector: '.hero-title', background: '#ffffff', text: '#181818' },
            { selector: '.slds-button_brand', background: '#0176d3', text: '#ffffff' },
            { selector: '.nav-item', background: '#ffffff', text: '#181818' }
        ];
        
        colorPairs.forEach(pair => {
            const contrast = this.calculateContrast(pair.background, pair.text);
            if (contrast < 4.5) {
                issues.push({
                    type: 'color-contrast',
                    selector: pair.selector,
                    contrast: contrast,
                    required: 4.5,
                    fix: 'Increase color contrast by adjusting colors'
                });
            }
        });
        
        return issues;
    }
    
    generateFixRecommendations(issues) {
        console.log('🔧 Accessibility Fix Recommendations:');
        
        issues.forEach((issue, index) => {
            console.log(`\n${index + 1}. ${issue.type.toUpperCase()}`);
            console.log(`   Element: ${issue.selector}`);
            console.log(`   Issue: ${issue.description || 'See details above'}`);
            console.log(`   Fix: ${issue.fix}`);
            
            if (issue.type === 'color-contrast') {
                console.log(`   Current contrast: ${issue.contrast.toFixed(2)}`);
                console.log(`   Required contrast: ${issue.required}`);
            }
        });
    }
}
```

### 2. Emergency Procedures

#### Rollback Process
```bash
#!/bin/bash
# scripts/emergency-rollback.sh

set -e

echo "🚨 EMERGENCY ROLLBACK PROCEDURE"
echo "This will revert to the last known good state"
read -p "Are you sure you want to proceed? (y/N): " confirm

if [[ $confirm != [yY] ]]; then
    echo "Rollback cancelled"
    exit 0
fi

# 1. Get last successful deploy
LAST_GOOD_COMMIT=$(git log --oneline --grep="✅ Deploy:" -n 1 | cut -d' ' -f1)

if [ -z "$LAST_GOOD_COMMIT" ]; then
    echo "❌ No successful deploy found in git history"
    exit 1
fi

echo "📝 Rolling back to commit: $LAST_GOOD_COMMIT"

# 2. Create emergency branch
EMERGENCY_BRANCH="emergency-rollback-$(date +%Y%m%d-%H%M%S)"
git checkout -b "$EMERGENCY_BRANCH"

# 3. Reset to last good state
git reset --hard "$LAST_GOOD_COMMIT"

# 4. Deploy immediately
echo "🚀 Deploying rollback..."
npm run deploy:production

# 5. Verify deployment
echo "🔍 Verifying rollback..."
sleep 30
curl -f https://foodandforce.netlify.app/ > /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Rollback successful"
    
    # 6. Create incident report
    cat > incident-report-$(date +%Y%m%d-%H%M%S).md << EOF
# Emergency Rollback Incident Report

**Date**: $(date)
**Rollback Commit**: $LAST_GOOD_COMMIT
**Emergency Branch**: $EMERGENCY_BRANCH

## Incident Details
- Rollback triggered due to production issue
- Reverted to last known good state
- Site verified operational after rollback

## Next Steps
- [ ] Investigate root cause of issue
- [ ] Fix issue in development
- [ ] Test thoroughly before next deployment
- [ ] Update incident documentation
EOF
    
    echo "📄 Incident report created"
else
    echo "❌ Rollback verification failed"
    exit 1
fi
```

#### Health Check System
```javascript
// scripts/health-check.js
class HealthChecker {
    constructor() {
        this.checks = [
            'siteAvailability',
            'performanceMetrics',
            'sldsCompliance',
            'accessibilityBaseline',
            'securityHeaders'
        ];
        this.results = {};
    }
    
    async runHealthCheck() {
        console.log('🏥 Running health check...');
        
        for (const check of this.checks) {
            try {
                console.log(`🔍 Running ${check}...`);
                this.results[check] = await this[check]();
                console.log(`✅ ${check}: PASS`);
            } catch (error) {
                console.error(`❌ ${check}: FAIL - ${error.message}`);
                this.results[check] = { status: 'FAIL', error: error.message };
            }
        }
        
        return this.generateHealthReport();
    }
    
    async siteAvailability() {
        const pages = [
            'https://foodandforce.netlify.app/',
            'https://foodandforce.netlify.app/about.html',
            'https://foodandforce.netlify.app/services.html'
        ];
        
        for (const url of pages) {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`${url} returned ${response.status}`);
            }
        }
        
        return { status: 'PASS', message: 'All pages accessible' };
    }
    
    async performanceMetrics() {
        // Simplified performance check
        const start = Date.now();
        const response = await fetch('https://foodandforce.netlify.app/');
        const loadTime = Date.now() - start;
        
        if (loadTime > 3000) {
            throw new Error(`Load time too slow: ${loadTime}ms`);
        }
        
        return { status: 'PASS', loadTime: `${loadTime}ms` };
    }
    
    generateHealthReport() {
        const overallStatus = Object.values(this.results)
            .every(result => result.status === 'PASS') ? 'HEALTHY' : 'UNHEALTHY';
        
        const report = {
            timestamp: new Date().toISOString(),
            status: overallStatus,
            checks: this.results,
            summary: {
                total: this.checks.length,
                passed: Object.values(this.results).filter(r => r.status === 'PASS').length,
                failed: Object.values(this.results).filter(r => r.status === 'FAIL').length
            }
        };
        
        console.log('📊 Health Check Report:', JSON.stringify(report, null, 2));
        
        if (overallStatus === 'UNHEALTHY') {
            this.alertTeam(report);
        }
        
        return report;
    }
    
    alertTeam(report) {
        console.log('🚨 ALERT: System health check failed');
        console.log('Failed checks:', 
            Object.entries(report.checks)
                .filter(([, result]) => result.status === 'FAIL')
                .map(([check, result]) => `${check}: ${result.error}`)
        );
    }
}

// Run health check if called directly
if (require.main === module) {
    const checker = new HealthChecker();
    checker.runHealthCheck()
        .then(report => {
            process.exit(report.status === 'HEALTHY' ? 0 : 1);
        })
        .catch(error => {
            console.error('Health check failed:', error);
            process.exit(1);
        });
}
```

---

This comprehensive maintenance procedures guide provides the framework for keeping the Food-N-Force website secure, performant, and compliant with SLDS standards through systematic maintenance processes, automated quality gates, and emergency response procedures.