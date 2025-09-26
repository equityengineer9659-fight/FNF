# Technical Guidelines - Phase 4 Enhanced Architecture

**Document Version**: 2.0  
**Last Updated**: 2025-08-25  
**Phase**: 4.1-4.2 Enhanced HTML-First Architecture with Security Hardening  
**Authority**: Technical Architect  
**Related**: ADR-010, ADR-011, ADR-012, Performance Budget

## Technical Guidelines Overview

These technical guidelines establish comprehensive development standards for Phase 4 enhanced HTML-first architecture with Web Components, ES6 modules, and production-ready security hardening. All development must adhere to these guidelines to maintain the exceptional performance and security achievements from Phases 1-3.

**Guiding Principles**:
1. **HTML-First Progressive Enhancement**: Core functionality works without JavaScript
2. **Performance Leadership**: Maintain <290KB total budget with enhanced features
3. **Security by Design**: Production-ready CSP without unsafe-* directives
4. **Zero Regression**: Mobile navigation and special effects are non-negotiable
5. **Accessibility Excellence**: WCAG 2.1 AA compliance maintained

## Folder Structure Guidelines

### Mandatory Directory Organization

```
C:\Users\luetk\Desktop\Website\Website Next Version\
├── css/                           # CSS Layer Architecture (27KB budget)
│   ├── reset/                     # CSS reset and normalization
│   ├── base/                      # Base typography and elements  
│   ├── components/                # Reusable component styles
│   ├── utilities/                 # Utility classes and overrides
│   └── pages/                     # Page-specific styles (minimal)
├── js/                           # Enhanced JavaScript Architecture (21KB budget)
│   ├── core/                     # Essential functionality (5KB)
│   │   ├── unified-navigation-refactored.js  # PROTECTED - Do not modify
│   │   ├── performance-monitor.js  # Core Web Vitals monitoring
│   │   └── emergency-rollback.js   # Emergency procedures
│   ├── components/               # Web Components (12KB budget)  
│   │   ├── navigation/           # Navigation components
│   │   ├── forms/                # Form enhancement components
│   │   ├── animations/           # Animation components
│   │   └── shared/               # Shared component utilities
│   ├── effects/                  # Premium Effects (8KB budget)
│   │   ├── premium-background-effects.js     # PROTECTED - Background animations
│   │   ├── premium-effects-refactored.js     # PROTECTED - Glassmorphism
│   │   └── logo-special-effects.js           # PROTECTED - Logo animations
│   ├── security/                 # Security Framework (4KB budget)
│   │   ├── csp-monitor.js        # CSP violation monitoring
│   │   ├── xss-prevention.js     # XSS prevention framework
│   │   └── security-reporter.js  # Security incident reporting
│   └── pages/                    # Page-specific enhancements
├── components/                   # Web Components HTML Templates
│   ├── navigation/               # Navigation component templates
│   ├── forms/                    # Form component templates
│   └── shared/                   # Shared templates
├── *.html                        # 6 main pages (semantic HTML-first)
├── adr/                          # Architecture Decision Records
├── docs/                         # Documentation and governance
├── tools/                        # Development and testing utilities
├── config/                       # Configuration files
└── security-reports/             # Security audit reports
```

### Folder Organization Rules

**CSS Organization (CSS Layers)**:
```css
/* All CSS files must use CSS Layers architecture */
@layer reset, base, components, utilities, overrides;

/* File organization by layer: */
/* reset/     -> @layer reset */
/* base/      -> @layer base */  
/* components/-> @layer components */
/* utilities/ -> @layer utilities */
/* overrides/ -> @layer overrides */
```

**JavaScript Module Organization**:
- **Core modules**: Essential functionality, loaded first
- **Components**: Web Components, lazy-loaded
- **Effects**: Premium animations, loaded after LCP
- **Security**: Security framework, loaded after critical path
- **Pages**: Page-specific code, loaded last

**Component Organization**:
- **Template files**: HTML templates for Web Components
- **Component CSS**: Shadow DOM styles, encapsulated
- **Component JS**: Component logic and lifecycle
- **Component tests**: Unit tests for each component

## Naming Conventions

### File Naming Standards

**CSS Files**:
```
✅ CORRECT:
navigation-unified.css           # Feature-based, descriptive
responsive-enhancements.css      # Function-based naming
premium-effects-refactored.css   # Version/state indication

❌ INCORRECT:
nav.css                          # Too abbreviated
styles2.css                      # Numeric versioning
temp-fix.css                     # Temporary naming
```

**JavaScript Files**:
```
✅ CORRECT:  
unified-navigation-refactored.js   # Descriptive with version context
premium-background-effects.js     # Feature and function clear
csp-violation-monitor.js          # Purpose immediately clear

❌ INCORRECT:
script.js                         # Generic naming
nav-new.js                        # Unclear versioning
utils.js                          # Too broad/generic
```

**Web Component Files**:
```
✅ CORRECT:
fnf-navigation.js                 # Prefixed, component name
fnf-contact-form.js               # Clear component purpose
fnf-stats-counter.js              # Specific functionality

❌ INCORRECT:
navigation.js                     # No prefix, collision risk
form.js                          # Too generic
counter.js                       # Unclear purpose
```

### CSS Class Naming Conventions

**SLDS-Compatible BEM with Performance Focus**:
```css
/* Component-based naming with SLDS compatibility */
✅ CORRECT:
.fnf-navigation__toggle          /* Component__element */
.fnf-navigation__toggle--active  /* Component__element--modifier */
.slds-nav-horizontal__item       /* SLDS standard classes preserved */
.nav-animate-logo                /* Animation classes descriptive */

❌ INCORRECT:
.toggle                          /* Too generic, collision risk */
.nav1                            /* Numeric indicators */
.blue-button                     /* Visual-based naming */
.temp-class                      /* Temporary naming */
```

**CSS Custom Properties (CSS Variables)**:
```css
✅ CORRECT:
--fnf-primary-color: #1976d2;     /* Component-prefixed */
--fnf-glassmorphism-blur: 10px;   /* Feature-specific */
--fnf-animation-duration: 300ms;  /* Function-specific */

❌ INCORRECT:
--blue: #1976d2;                  /* Generic color names */
--x: 10px;                        /* Single letter variables */
--temp: 300ms;                    /* Temporary naming */
```

### JavaScript Naming Conventions  

**Classes and Functions**:
```javascript
✅ CORRECT:
class FoodNForceNavigation {}      // PascalCase for classes
function validateCSPCompliance() {} // camelCase for functions  
const PERFORMANCE_BUDGET = {};    // CONSTANT_CASE for constants

❌ INCORRECT:
class navigation {}               // Missing prefix, lowercase
function validate_csp() {}        // snake_case (not JavaScript standard)
const budgets = {};               // Constants should be CONSTANT_CASE
```

**Variables and Properties**:
```javascript
✅ CORRECT:
const mobileNavigationToggle = document.querySelector('.mobile-nav-toggle');
const performanceMetrics = { lcp: 0, fid: 0, cls: 0 };
const isSecurityHeaderPresent = checkSecurityHeaders();

❌ INCORRECT:
const toggle = document.querySelector('.mobile-nav-toggle');  // Too generic
const perf_metrics = {};                                     // snake_case
const SecurityHeaderPresent = false;                         // PascalCase for variables
```

## Import Boundaries and Dependencies

### Module Import Rules

**Strict Import Boundaries**:
```javascript
// ✅ ALLOWED IMPORTS:

// Core modules can import from:
import './performance-monitor.js';     // Other core modules
// Cannot import from: components/, effects/, security/, pages/

// Components can import from:  
import '../core/performance-monitor.js';  // Core utilities
import '../security/xss-prevention.js';   // Security framework
// Cannot import from: effects/, pages/

// Effects can import from:
import '../core/performance-monitor.js';  // Core utilities only
// Cannot import from: components/, security/, pages/

// Security can import from:
import '../core/performance-monitor.js';  // Core utilities only  
// Cannot import from: components/, effects/, pages/

// Pages can import from: (any module - top-level)
import '../core/unified-navigation-refactored.js';
import '../components/fnf-navigation.js';
import '../effects/premium-background-effects.js';
```

**Forbidden Import Patterns**:
```javascript
❌ PROHIBITED:

// Circular imports
import '../effects/animations.js';  // From components/
import '../components/nav.js';      // From effects/

// Deep relative imports  
import '../../other-folder/module.js';  // Use absolute paths

// Dynamic imports without lazy loading justification
const module = await import('./heavy-module.js');  // Must justify bundle impact

// Cross-boundary violations
import '../pages/contact.js';       // From core/ - FORBIDDEN
```

### Dependency Management Rules

**Allowed Dependencies**:
```javascript
// ✅ APPROVED DEPENDENCIES:

// Web Standards (zero bundle impact):
document.querySelector()           // Native DOM API
fetch()                           // Native Fetch API
customElements.define()           // Web Components API
IntersectionObserver              // Performance API

// Performance APIs:
PerformanceObserver               // Core Web Vitals monitoring
requestAnimationFrame()           // Animation optimization  

// Security APIs:
crypto.subtle                     // CSP hash generation
CSPViolationEvent                 // Security monitoring
```

**Forbidden Dependencies**:
```javascript
❌ PROHIBITED:

// Framework Libraries:
import React from 'react';         // Conflicts with HTML-first architecture
import Vue from 'vue';             // Bundle size impact
import $ from 'jquery';            // Unnecessary DOM abstraction

// Heavy Utility Libraries:
import _ from 'lodash';             // Bundle size impact, native alternatives available  
import moment from 'moment';       // Use native Date API

// Polyfills (unless explicitly approved):
import 'core-js';                  // Must justify browser support need

// CSS-in-JS Libraries:  
import styled from 'styled-components';  // Conflicts with CSS architecture
```

### Bundle Size Enforcement

**Import Budget Tracking**:
```javascript
// Each module must declare its budget impact:
/**
 * Module: unified-navigation-refactored.js
 * Bundle Budget: 5KB (Core allocation)
 * Dependencies: Native APIs only
 * Performance Impact: <50ms initialization
 */

// Automatic bundle size validation:
const bundleAnalyzer = {
  maxBundleSize: {
    'core/': 5 * 1024,        // 5KB core budget
    'components/': 12 * 1024,  // 12KB components budget  
    'effects/': 8 * 1024,      // 8KB effects budget
    'security/': 4 * 1024      // 4KB security budget
  },
  
  validateImports(modulePath, dependencies) {
    const estimatedSize = this.calculateBundleSize(dependencies);
    const allowedSize = this.maxBundleSize[this.getModuleCategory(modulePath)];
    
    if (estimatedSize > allowedSize) {
      throw new Error(`Bundle budget exceeded: ${modulePath} (${estimatedSize} > ${allowedSize})`);
    }
  }
};
```

## Code Organization Standards

### HTML-First Architecture Rules

**Semantic HTML Requirements**:
```html
<!-- ✅ CORRECT: Semantic, accessible HTML-first -->
<nav class="navbar universal-nav custom-nav" role="banner">
  <div class="slds-container_fluid">
    <button class="mobile-nav-toggle" 
            aria-label="Toggle navigation menu" 
            aria-expanded="false" 
            aria-controls="main-nav">
      <span class="hamburger-icon">☰</span>
    </button>
    <ul class="nav-menu slds-nav-horizontal" id="main-nav">
      <li class="slds-nav-horizontal__item">
        <a href="index.html" class="nav-link">Home</a>
      </li>
    </ul>
  </div>
</nav>

<!-- ❌ INCORRECT: JavaScript-dependent structure -->
<div id="navigation"></div>
<script>
  // Renders entire navigation with JavaScript - FORBIDDEN
  document.getElementById('navigation').innerHTML = generateNav();
</script>
```

**Progressive Enhancement Pattern**:
```html
<!-- ✅ CORRECT: Progressive Enhancement -->
<!-- Base functionality works without JavaScript -->
<form class="newsletter-form" action="/subscribe" method="post">
  <input type="email" name="email" required aria-label="Email address">
  <button type="submit">Subscribe</button>
</form>

<!-- JavaScript enhancement (optional) -->
<script>
  // Enhance form with validation and animation
  const form = document.querySelector('.newsletter-form');
  if (form) {
    form.addEventListener('submit', enhanceSubmission);
  }
</script>

<!-- ❌ INCORRECT: JavaScript-required functionality -->
<div class="newsletter-form">
  <input type="email" id="email">  
  <button onclick="subscribeUser()">Subscribe</button>  <!-- Inline handlers forbidden -->
</div>
```

### Web Components Architecture

**Component Registration Standards**:
```javascript
// ✅ CORRECT: Web Component definition
class FNFNavigation extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
    this.setupEventListeners();
  }
  
  // Lifecycle callbacks required
  connectedCallback() {
    this.setAttribute('aria-label', 'Main navigation');
    this.setupKeyboardAccessibility();
  }
  
  disconnectedCallback() {
    this.cleanup();  // Required: prevent memory leaks
  }
  
  // Shadow DOM rendering
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        /* Encapsulated styles - no global pollution */
        :host { 
          display: block;
          /* CSS custom properties for theming */
          background: var(--fnf-nav-background, transparent);
        }
      </style>
      <nav>
        <slot name="nav-items"></slot>
      </nav>
    `;
  }
}

// Component registration with error handling
try {
  customElements.define('fnf-navigation', FNFNavigation);
} catch (error) {
  console.warn('Failed to register fnf-navigation component:', error);
}

// ❌ INCORRECT: Missing lifecycle management
class BadComponent extends HTMLElement {
  constructor() {
    super();
    document.body.innerHTML = '<nav>...</nav>';  // Global DOM manipulation
    setInterval(() => {}, 1000);                 // Memory leak - no cleanup
  }
  // Missing disconnectedCallback, cleanup, error handling
}
```

**Component Communication Pattern**:
```javascript
// ✅ CORRECT: Event-based component communication
class FNFContactForm extends HTMLElement {
  submitForm(data) {
    // Emit custom event for parent components
    this.dispatchEvent(new CustomEvent('fnf-form-submit', {
      bubbles: true,
      detail: { formData: data, timestamp: Date.now() }
    }));
  }
  
  handleResponse(success) {
    // Update component state
    this.setAttribute('data-state', success ? 'success' : 'error');
    
    // Accessibility announcement
    this.announceToScreenReader(
      success ? 'Form submitted successfully' : 'Form submission failed'
    );
  }
}

// ❌ INCORRECT: Direct component manipulation
class BadForm extends HTMLElement {
  submitForm() {
    // Direct access to other components - FORBIDDEN
    document.querySelector('fnf-navigation').updateState();
    
    // Global variable pollution - FORBIDDEN  
    window.formSubmitted = true;
  }
}
```

### CSS Architecture Standards

**CSS Layers Implementation**:
```css
/* ✅ CORRECT: CSS Layers architecture */

/* Layer definition (must be first in CSS) */
@layer reset, base, components, utilities, overrides;

/* Reset layer - normalize browser differences */
@layer reset {
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
}

/* Base layer - typography, colors, base elements */
@layer base {
  body {
    font-family: 'Orbitron', -apple-system, BlinkMacSystemFont, sans-serif;
    color: var(--fnf-text-color, #333);
    background: var(--fnf-background-color, #fff);
  }
}

/* Components layer - reusable component styles */  
@layer components {
  .fnf-navigation {
    /* Component-specific styles */
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .fnf-navigation__toggle {
    /* BEM methodology with SLDS compatibility */
    border: none;
    background: transparent;
    cursor: pointer;
  }
}

/* Utilities layer - utility classes */
@layer utilities {
  .slds-text-align_center { text-align: center; }
  .slds-p-top_small { padding-top: 0.5rem; }
}

/* Overrides layer - exceptional cases only */
@layer overrides {
  /* Use sparingly - document justification */
  .emergency-override {
    /* Emergency styling with !important ONLY in overrides layer */
    display: block !important; /* Justified: emergency mobile nav fix */
  }
}

/* ❌ INCORRECT: No layer organization */
.nav { position: sticky; }      /* Global scope pollution */
.nav { color: red !important; } /* !important outside overrides layer */
```

**Responsive Design Standards**:
```css
/* ✅ CORRECT: Mobile-first responsive design */
.fnf-navigation {
  /* Mobile-first base styles */
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

/* Tablet enhancement */  
@media (min-width: 768px) {
  .fnf-navigation {
    flex-direction: row;
    padding: 1.5rem;
  }
}

/* Desktop optimization */
@media (min-width: 1024px) {
  .fnf-navigation {
    max-width: 1200px;
    margin: 0 auto;
  }
}

/* ❌ INCORRECT: Desktop-first approach */
.fnf-navigation {
  display: flex;
  flex-direction: row;      /* Desktop-first - WRONG */
  max-width: 1200px;
}

@media (max-width: 768px) { /* Desktop-first breakpoint - WRONG */
  .fnf-navigation {
    flex-direction: column;
  }
}
```

### Security Implementation Standards

**Content Security Policy Compliance**:
```javascript
// ✅ CORRECT: CSP-compliant code
class SecurityCompliantComponent {
  constructor() {
    this.initializeSecurely();
  }
  
  initializeSecurely() {
    // Event listeners instead of inline handlers
    this.button = document.querySelector('.secure-button');
    this.button?.addEventListener('click', this.handleClick.bind(this));
    
    // No eval() or innerHTML with user content
    this.updateContent = this.updateContent.bind(this);
    
    // Hash-based inline styles when necessary
    this.addSecureStyles();
  }
  
  handleClick(event) {
    // Secure event handling
    event.preventDefault();
    
    // XSS prevention - sanitize any user input
    const userInput = this.sanitizeInput(event.target.value);
    this.updateContent(userInput);
  }
  
  updateContent(safeContent) {
    // Use textContent for plain text (XSS safe)
    this.element.textContent = safeContent;
    
    // Use DOMPurify for HTML content
    if (safeContent.includes('<')) {
      this.element.innerHTML = DOMPurify.sanitize(safeContent);
    }
  }
}

// ❌ INCORRECT: CSP violations and security risks
class InsecureComponent {
  constructor() {
    // CSP violation - inline event handler
    document.body.innerHTML = '<button onclick="alert()">Click</button>';
    
    // XSS vulnerability - unsanitized innerHTML  
    this.element.innerHTML = userInput;
    
    // CSP violation - eval usage
    eval('someUserCode()');
    
    // Security risk - global variable exposure
    window.sensitiveData = this.secrets;
  }
}
```

**Security Headers Integration**:
```javascript
// ✅ CORRECT: Security-aware code
class SecurityAwareModule {
  constructor() {
    this.initializeWithSecurityChecks();
  }
  
  initializeWithSecurityChecks() {
    // Check for security headers presence
    if (!this.isSecurityHeaderPresent('Content-Security-Policy')) {
      console.warn('CSP header missing - potential security risk');
    }
    
    // Secure communication only
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      throw new Error('HTTPS required for secure operation');
    }
    
    // Validate trusted origins
    this.validateOrigin();
  }
  
  isSecurityHeaderPresent(headerName) {
    // Check if security headers are properly configured
    return document.querySelector(`meta[http-equiv="${headerName}"]`) !== null;
  }
  
  validateOrigin() {
    const allowedOrigins = ['https://food-n-force.com', 'http://localhost:8080'];
    if (!allowedOrigins.includes(window.location.origin)) {
      console.warn('Untrusted origin detected');
    }
  }
}
```

## Development Workflow Standards

### Git Workflow and Commit Standards

**Branch Naming Convention**:
```bash
✅ CORRECT:
feature/web-components-navigation     # Feature development
security/csp-implementation          # Security enhancements
performance/bundle-optimization      # Performance improvements  
bugfix/mobile-nav-accessibility     # Bug fixes
emergency/navigation-rollback       # Emergency fixes

❌ INCORRECT:
new-stuff                           # Unclear purpose
temp-branch                         # Temporary naming
john-dev                            # Personal naming
feature123                          # Numeric naming
```

**Commit Message Standards**:
```bash
✅ CORRECT:
feat: Add Web Components navigation framework (5KB bundle impact)
security: Implement CSP hash-based inline elimination  
perf: Optimize component lazy loading for 200ms LCP improvement
fix: Resolve mobile navigation ARIA accessibility violation
docs: Update technical guidelines for enhanced architecture

❌ INCORRECT:  
add stuff                          # Unclear change
quick fix                          # Vague description
WIP                               # Work in progress commits to main
.                                 # Empty/minimal messages
```

**Required Pre-commit Checks**:
```bash
# Automated pre-commit validation (required):
npm run lint                       # Code quality checks
npm run test:critical-navigation   # P0 mobile navigation tests
npm run test:performance-budget    # Performance budget validation
npm run security:comprehensive     # Security vulnerability scan
npm run test:accessibility         # WCAG 2.1 AA compliance check
```

### Code Review Standards

**Mandatory Review Criteria**:

**Performance Review Requirements**:
- [ ] Bundle size impact documented and within budget
- [ ] Core Web Vitals impact measured and acceptable  
- [ ] Animation performance validated (≥60fps)
- [ ] Mobile navigation functionality preserved
- [ ] Memory usage impact assessed

**Security Review Requirements**:
- [ ] CSP compliance validated (no unsafe-* usage)
- [ ] XSS vulnerability assessment completed
- [ ] Input sanitization implemented where required
- [ ] Security headers compatibility verified
- [ ] Dependency vulnerability scan passed

**Accessibility Review Requirements**:
- [ ] WCAG 2.1 AA compliance maintained
- [ ] Keyboard navigation functional
- [ ] Screen reader compatibility verified
- [ ] ARIA attributes properly implemented  
- [ ] Color contrast requirements met

**Architecture Review Requirements**:
- [ ] Import boundaries respected
- [ ] Naming conventions followed
- [ ] Web Components properly encapsulated
- [ ] Progressive enhancement maintained
- [ ] Emergency rollback compatibility preserved

### Testing Standards

**Required Test Coverage**:
```javascript
// ✅ CORRECT: Comprehensive test coverage
describe('FNF Navigation Component', () => {
  // P0 Requirements - MUST PASS
  test('mobile navigation toggle functionality', async () => {
    // Test across all 6 pages and 5 breakpoints
    const pages = ['index.html', 'about.html', /* ... */];
    const breakpoints = [320, 768, 1024, 1440, 1920];
    
    for (const page of pages) {
      for (const width of breakpoints) {
        await validateMobileNavigation(page, width);
      }
    }
  });
  
  // Performance Requirements
  test('component bundle size within budget', () => {
    const bundleSize = calculateBundleSize('fnf-navigation');
    expect(bundleSize).toBeLessThan(5 * 1024); // 5KB budget
  });
  
  // Security Requirements  
  test('CSP compliance without violations', () => {
    const violations = detectCSPViolations();
    expect(violations).toHaveLength(0);
  });
  
  // Accessibility Requirements
  test('WCAG 2.1 AA compliance', async () => {
    const results = await pa11y(page);
    expect(results.issues).toHaveLength(0);
  });
  
  // Cross-browser Requirements
  test('functionality across supported browsers', async () => {
    const browsers = ['chrome', 'firefox', 'safari'];
    for (const browser of browsers) {
      await validateInBrowser(browser);
    }
  });
});

// ❌ INCORRECT: Insufficient test coverage
test('navigation works', () => {
  expect(navigation).toBeTruthy();  // Too generic, no specific validation
});
```

**Performance Test Requirements**:
```javascript
// Mandatory performance validation
const performanceTests = {
  // Bundle size validation
  validateBundleSize: () => {
    const totalSize = calculateTotalBundleSize();
    expect(totalSize).toBeLessThan(290 * 1024); // 290KB budget
  },
  
  // Core Web Vitals validation
  validateCoreWebVitals: async () => {
    const metrics = await measureCoreWebVitals();
    expect(metrics.LCP).toBeLessThan(2500);     // 2.5s budget
    expect(metrics.FID).toBeLessThan(100);      // 100ms budget  
    expect(metrics.CLS).toBeLessThan(0.1);      // 0.1 budget
  },
  
  // Animation performance validation
  validateAnimationPerformance: async () => {
    const fps = await measureAnimationFPS();
    expect(fps).toBeGreaterThanOrEqual(60);     // 60fps requirement
  }
};
```

## Enforcement and Monitoring

### Automated Enforcement

**CI/CD Pipeline Integration**:
```yaml
# Required CI/CD checks (all must pass)
name: Phase 4 Technical Guidelines Enforcement

on: [push, pull_request]

jobs:
  guidelines-enforcement:
    steps:
      - name: Validate Folder Structure
        run: node tools/validate-folder-structure.js
        
      - name: Check Naming Conventions  
        run: node tools/validate-naming-conventions.js
        
      - name: Validate Import Boundaries
        run: node tools/validate-import-boundaries.js
        
      - name: Enforce Bundle Size Budgets
        run: npm run test:performance-budget
        
      - name: Security Guidelines Compliance
        run: npm run security:guidelines-check
        
      - name: Block on Guideline Violations
        if: failure()
        run: exit 1  # Block deployment on violations
```

**Development Environment Integration**:
```javascript
// Real-time guideline enforcement in development
class DevelopmentGuidelineEnforcer {
  constructor() {
    this.setupWatchers();
    this.enableRealTimeValidation();
  }
  
  setupWatchers() {
    // Watch for guideline violations during development
    const watcher = chokidar.watch(['css/**/*.css', 'js/**/*.js']);
    
    watcher.on('change', (path) => {
      this.validateFile(path);
    });
  }
  
  validateFile(filePath) {
    const violations = [];
    
    // Check naming conventions
    if (!this.isValidFileName(filePath)) {
      violations.push(`Invalid file name: ${filePath}`);
    }
    
    // Check bundle size impact
    if (this.exceedsBundgeBudget(filePath)) {
      violations.push(`Bundle budget exceeded: ${filePath}`);
    }
    
    if (violations.length > 0) {
      this.reportViolations(filePath, violations);
    }
  }
}
```

### Violation Response Procedures

**Guideline Violation Classification**:

**CRITICAL Violations (Block Deployment)**:
- Mobile navigation P0 functionality broken
- Performance budget exceeded by >50%
- CSP violations or security regressions
- Import boundary violations causing circular dependencies

**HIGH Violations (Require Review)**:
- Performance budget exceeded by 25-50%
- Accessibility compliance violations
- Architectural pattern violations
- Missing required test coverage

**MEDIUM Violations (Warning)**:
- Naming convention violations
- Code organization non-compliance
- Documentation deficiencies
- Non-critical test coverage gaps

**Violation Resolution Process**:
1. **Automated Detection**: CI/CD pipeline identifies violations
2. **Developer Notification**: Immediate feedback on violations
3. **Review Required**: Architecture review for HIGH/CRITICAL violations
4. **Resolution Tracking**: Violations tracked until resolution
5. **Prevention**: Guidelines updated to prevent recurring violations

### Success Metrics

**Guideline Compliance Targets**:
- [ ] 100% folder structure compliance (automated validation)
- [ ] 95% naming convention compliance (automated validation)
- [ ] 100% import boundary compliance (automated validation)
- [ ] 100% performance budget compliance (automated enforcement)
- [ ] 100% security guideline compliance (automated validation)
- [ ] 95% code review criteria compliance (manual validation)

**Quality Metrics Monitoring**:
- Bundle size trends and budget utilization
- Performance regression detection and prevention
- Security compliance monitoring and alerting
- Accessibility compliance tracking
- Code review quality metrics

---

**Technical Guidelines Status**: APPROVED - Phase 4 Enhanced Architecture  
**Enforcement Level**: Automated CI/CD integration with deployment blocking  
**Compliance Target**: 95% automated compliance, 100% P0 requirements  
**Review Cycle**: Monthly guideline review and updates based on development experience