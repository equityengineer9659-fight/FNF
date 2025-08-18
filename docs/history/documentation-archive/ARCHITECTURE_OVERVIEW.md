# Food-N-Force Website - Solution Architecture Documentation

## Executive Summary

The Food-N-Force website is a production-ready, SLDS-compliant web application built to showcase modern food bank solutions. This documentation provides comprehensive architectural guidance for development teams, focusing on maintainability, scalability, and SLDS design system compliance.

**Architecture Version**: 3.0  
**SLDS Version**: 2.22.2  
**Node.js**: 18.0.0+  
**Last Updated**: 2025-08-18  

---

## System Components Overview

### 1. Frontend Architecture

#### Core Technologies
- **HTML5**: Semantic structure with WCAG 2.1 AA compliance
- **Salesforce Lightning Design System (SLDS)**: Primary component library
- **Modern CSS**: Custom properties, Grid, Flexbox with SLDS token integration
- **Vanilla JavaScript**: ES6+ modules with progressive enhancement
- **Node.js Toolchain**: Build, test, and deployment automation

#### Application Structure
```
Food-N-Force Website/
├── Frontend Application (Static Site)
│   ├── HTML Pages (5 primary pages)
│   ├── CSS Modules (4 organized stylesheets)
│   ├── JavaScript Modules (10+ specialized modules)
│   └── Asset Management (Optimized images and logos)
├── Build System (NPM + Custom Scripts)
├── Testing Suite (Performance, Accessibility, Browser)
├── Deployment Pipeline (Netlify + CI/CD)
└── Monitoring (Lighthouse, HTML Validation, SLDS Compliance)
```

### 2. Design System Integration

#### SLDS Implementation Strategy
- **Token-First Approach**: All spacing, colors, typography use SLDS design tokens
- **Component Mapping**: Each UI element mapped to appropriate SLDS component
- **Progressive Enhancement**: Graceful degradation for older browsers
- **Accessibility-First**: WCAG 2.1 AA compliance through SLDS patterns

#### Design Token Usage
```css
:root {
    /* SLDS Core Tokens */
    --slds-c-brand-primary: #16325C;
    --slds-c-brand-secondary: #0176d3;
    --slds-c-text-default: #181818;
    
    /* Custom Extensions (SLDS-Compliant) */
    --fnf-accent-color: #00d4ff;
    --fnf-easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

### 3. Performance Architecture

#### Loading Strategy
1. **Critical Path Optimization**
   - Inline critical CSS for above-the-fold content
   - Preload essential fonts and images
   - Progressive enhancement with JavaScript

2. **Asset Optimization**
   - WebP/AVIF image formats with PNG fallbacks
   - SVG-first approach for logos and icons
   - CSS and JavaScript minification and bundling

3. **Runtime Performance**
   - Intersection Observer for lazy loading
   - RequestIdleCallback for non-critical tasks
   - Memory-efficient event handling with cleanup

#### Core Web Vitals Targets
- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Contentful Paint (FCP)**: < 1.8s

### 4. Accessibility Framework

#### WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 ratio for all text
- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader Support**: Semantic HTML with proper ARIA
- **Motion Preferences**: Respect `prefers-reduced-motion`

#### Implementation Patterns
```html
<!-- Semantic Structure Example -->
<main id="main-content" role="main">
    <section aria-labelledby="hero-heading">
        <h1 id="hero-heading">Modern Solutions to Feed More, Serve Better</h1>
    </section>
</main>

<!-- Skip Navigation -->
<a href="#main-content" class="skip-link">Skip to main content</a>
```

---

## Component Documentation

### 1. HTML Pages Structure

#### Page Inventory
- **index.html**: Homepage with hero section and service overview
- **about.html**: Company story and mission
- **services.html**: Detailed service offerings
- **impact.html**: Success stories and metrics
- **contact.html**: Contact form and information
- **resources.html**: Educational content and downloads

#### Semantic Patterns
```html
<!-- Standard Page Structure -->
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Meta tags, SLDS CSS, Custom CSS -->
</head>
<body class="page-specific-class">
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <!-- Navigation injected by JavaScript -->
    <main id="main-content" role="main">
        <!-- Page content with SLDS components -->
    </main>
    <!-- Footer injected by JavaScript -->
    <!-- JavaScript modules loaded progressively -->
</body>
</html>
```

### 2. CSS Module Organization

#### File Structure
```
css/
├── styles.css              # Core styles, design tokens, base components
├── navigation-styles.css   # Navigation-specific styles and interactions
├── responsive-enhancements.css # Responsive utilities and breakpoint styles
└── fnf-modules.css        # Component-specific enhancements
```

#### styles.css (Primary Stylesheet)
- **Design Tokens**: SLDS token definitions and custom extensions
- **Base Styles**: Reset, typography, global utilities
- **Component Styles**: Core component implementations
- **Animation System**: Easing functions and transition patterns

#### navigation-styles.css
- **Navigation Components**: Header, mobile menu, footer
- **Interactive States**: Hover, focus, active states
- **Responsive Behavior**: Mobile-first navigation patterns

#### responsive-enhancements.css
- **Breakpoint System**: Mobile-first responsive utilities
- **Grid Enhancements**: CSS Grid and Flexbox responsive patterns
- **Typography Scaling**: Responsive font sizing

### 3. JavaScript Module Architecture

#### Core Modules
```
js/
├── fnf-core.js           # Core functionality: navigation, logo management
├── fnf-effects.js        # Visual effects and animations
├── fnf-performance.js    # Performance monitoring and optimization
├── fnf-app.js           # Application lifecycle and module coordination
└── specialized/
    ├── about-page-unified.js
    ├── animations.js
    ├── logo-optimization.js
    └── responsive-validation.js
```

#### fnf-core.js (Primary Module)
```javascript
class FoodNForceCore {
    constructor() {
        this.capabilities = {};    // Browser capability detection
        this.logoCache = new Map(); // Logo asset management
        this.observers = [];       // Intersection observers
        this.eventListeners = [];  // Event cleanup tracking
    }
    
    async init() {
        await this.detectCapabilities();
        this.setupPageClassification();
        this.injectNavigation();
        this.setupMobileNavigation();
        this.initializeLogoSystem();
        this.setupAccessibilityEnhancements();
    }
}
```

#### Module Communication
- **Event-Driven Architecture**: Custom events for module communication
- **Dependency Management**: Modules declare dependencies and load order
- **State Management**: Centralized state in fnf-core with event propagation

### 4. Asset Management System

#### Logo Asset Organization
```
images/logos/
├── primary/
│   ├── fnf-logo.svg      # Primary vector logo
│   ├── fnf-logo.webp     # Modern format optimization
│   └── fnf-logo.png      # Universal fallback
├── variants/
│   ├── fnf-logo-horizontal.svg
│   ├── fnf-logo-icon.svg
│   └── fnf-logo-white.svg
├── sizes/
│   ├── fnf-logo-32.png   # Size-specific raster versions
│   ├── fnf-logo-48.png
│   └── fnf-logo-80.png
└── favicon/
    ├── favicon.ico
    └── favicon-*.png
```

#### Image Optimization Strategy
1. **Format Selection**: Automatic format detection (WebP/AVIF → SVG → PNG)
2. **Responsive Images**: Appropriate sizing based on viewport and device
3. **Lazy Loading**: Intersection Observer for non-critical images
4. **Preloading**: Critical images loaded with high priority

---

## Technical Specifications

### 1. SLDS Compliance Framework

#### Component Mapping Strategy
| UI Element | SLDS Component | Implementation Notes |
|------------|----------------|----------------------|
| Navigation | `slds-brand`, `slds-grid` | Logo + responsive menu |
| Hero Section | `slds-media`, `slds-text-heading_hero` | Brand + messaging |
| Service Cards | `slds-card`, `slds-grid_wrap` | Responsive card grid |
| Forms | `slds-form-element`, `slds-input` | Validation + accessibility |
| Buttons | `slds-button`, `slds-button_brand` | Multiple variants |
| Footer | `slds-grid`, `slds-brand_small` | Contact + branding |

#### Token Usage Patterns
```css
/* Spacing (Always use SLDS tokens) */
.component {
    margin: var(--slds-c-spacing-large);      /* 1rem */
    padding: var(--slds-c-spacing-medium);    /* 0.75rem */
}

/* Typography (SLDS scale) */
.heading {
    font-size: var(--slds-c-font-size-8);    /* 2rem */
    line-height: var(--slds-c-line-height-heading);
}

/* Colors (Brand compliance) */
.brand-element {
    background-color: var(--slds-c-brand-primary);
    color: var(--slds-c-text-inverse);
}
```

### 2. Responsive Design System

#### Breakpoint Strategy
```css
/* Mobile-First Approach */
:root {
    --breakpoint-small: 480px;   /* Small mobile */
    --breakpoint-medium: 768px;  /* Tablet */
    --breakpoint-large: 1024px;  /* Desktop */
    --breakpoint-xlarge: 1200px; /* Large desktop */
}

/* SLDS Responsive Utilities */
.slds-hide_small-up     /* Hide on mobile and up */
.slds-show_medium       /* Show only on tablet */
.slds-size_1-of-2       /* 50% width responsive */
```

#### Touch Target Standards
- **Minimum Size**: 44px × 44px for all interactive elements
- **Spacing**: Minimum 8px between adjacent touch targets
- **Hover States**: Only applied on non-touch devices
- **Focus Indicators**: Minimum 2px outline with sufficient contrast

### 3. Performance Standards

#### Bundle Size Targets
- **CSS**: < 50KB minified and gzipped
- **JavaScript**: < 75KB minified and gzipped (excluding SLDS)
- **Images**: WebP < 500KB total, PNG fallbacks < 1MB total
- **Fonts**: Orbitron subset < 100KB

#### Loading Performance
```javascript
// Performance monitoring example
const performanceObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
            console.log('LCP:', entry.startTime);
        }
    });
});
performanceObserver.observe({entryTypes: ['largest-contentful-paint']});
```

### 4. Browser Compatibility Matrix

#### Supported Browsers
| Browser | Version | Support Level | Notes |
|---------|---------|---------------|-------|
| Chrome | 90+ | Full | Primary development target |
| Firefox | 88+ | Full | Complete feature parity |
| Safari | 14+ | Full | WebKit-specific optimizations |
| Edge | 90+ | Full | Chromium-based support |
| iOS Safari | 14+ | Full | Touch-optimized |
| Android Chrome | 90+ | Full | Mobile-optimized |

#### Progressive Enhancement Strategy
1. **Base Layer**: Semantic HTML works without CSS or JavaScript
2. **CSS Enhancement**: SLDS components with graceful degradation
3. **JavaScript Enhancement**: Progressive feature additions
4. **Modern Features**: WebP, CSS Grid, ES6+ with fallbacks

---

## Maintenance Guidelines

### 1. Code Organization Principles

#### File Naming Conventions
- **HTML**: `kebab-case.html` (e.g., `about.html`)
- **CSS**: `kebab-case.css` (e.g., `navigation-styles.css`)
- **JavaScript**: `kebab-case.js` (e.g., `fnf-core.js`)
- **Images**: `kebab-case.ext` (e.g., `fnf-logo.svg`)
- **Components**: `ComponentName` (e.g., `FoodNForceCore`)

#### Dependency Management
```javascript
// Module dependency pattern
class ModuleName {
    static dependencies = ['fnf-core'];
    
    constructor() {
        if (!window.FoodNForceCore) {
            throw new Error('fnf-core dependency required');
        }
    }
}
```

### 2. Update Procedures

#### SLDS Version Updates
1. **Check Compatibility**: Review SLDS changelog for breaking changes
2. **Update CDN**: Modify SLDS CDN link in all HTML files
3. **Test Components**: Run full component regression tests
4. **Update Tokens**: Sync any new design tokens
5. **Validate Compliance**: Run SLDS compliance checks

#### Security Patch Process
```bash
# Security audit and updates
npm audit --audit-level=moderate
npm audit fix --force

# Validate after updates
npm run test
npm run validate:slds
npm run build
```

### 3. Testing Standards

#### Quality Gates
```json
{
  "performance": {
    "lighthouse": "> 85",
    "lcp": "< 2.5s",
    "fid": "< 100ms",
    "cls": "< 0.1"
  },
  "accessibility": {
    "pa11y": "0 errors",
    "contrast": "> 4.5:1",
    "keyboard": "full navigation"
  },
  "compliance": {
    "slds": "> 90%",
    "html": "valid",
    "css": "valid"
  }
}
```

#### Test Automation
```bash
# Complete test suite
npm run test                    # All tests
npm run test:accessibility      # pa11y accessibility testing
npm run test:performance        # Lighthouse CI
npm run test:browser           # Playwright cross-browser
npm run validate:html          # HTML validation
npm run validate:slds          # SLDS compliance check
```

### 4. Troubleshooting Framework

#### Common Issues and Solutions

**Issue**: SLDS compliance failures
```bash
# Diagnosis
npm run validate:slds

# Solution
# Review SLDS_REPORT.md for specific violations
# Replace custom CSS with SLDS utilities
# Test with npm run validate:slds
```

**Issue**: Performance regression
```bash
# Diagnosis
npm run test:performance

# Solution
# Check Lighthouse report for specific metrics
# Optimize images: npm run optimize:images
# Review bundle sizes: npm run analyze:bundle
```

**Issue**: Accessibility failures
```bash
# Diagnosis
npm run test:accessibility

# Solution
# Check pa11y output for specific WCAG violations
# Validate color contrast ratios
# Test keyboard navigation manually
```

#### Debugging Tools
```javascript
// Performance debugging
console.time('module-load');
// Module loading code
console.timeEnd('module-load');

// Accessibility debugging
document.addEventListener('keydown', (e) => {
    console.log('Key pressed:', e.key, 'Focus:', document.activeElement);
});

// SLDS compliance debugging
window.sldsDebug = true; // Enables SLDS validation warnings
```

---

## Future Scalability

### 1. Component Extension Strategy

#### Adding New Pages
1. **Create HTML**: Follow existing semantic structure
2. **Add Page Class**: Include page-specific body class
3. **Update Navigation**: Modify navigation injection logic
4. **Create Page Module**: Optional page-specific JavaScript
5. **Test Compliance**: Full testing suite validation

#### Custom Component Development
```javascript
// SLDS-compliant component pattern
class FNFCustomComponent {
    constructor(element, options = {}) {
        this.element = element;
        this.options = { ...this.defaults, ...options };
        this.init();
    }
    
    static defaults = {
        sldsCompliant: true,
        accessible: true,
        responsive: true
    };
    
    init() {
        this.addSldsClasses();
        this.setupAccessibility();
        this.bindEvents();
    }
    
    addSldsClasses() {
        // Ensure SLDS compliance
        this.element.classList.add('slds-component-base');
    }
}
```

### 2. Performance Scaling Roadmap

#### Phase 1: Current State (Complete)
- SLDS integration
- Core Web Vitals optimization
- Accessibility compliance
- Basic CI/CD pipeline

#### Phase 2: Enhanced Performance (6 months)
- Service Worker implementation
- Advanced image optimization
- Critical CSS extraction
- HTTP/2 optimization

#### Phase 3: Advanced Features (12 months)
- Progressive Web App (PWA)
- Advanced caching strategies
- Performance monitoring dashboard
- Automated performance budgets

### 3. Team Onboarding Framework

#### Developer Onboarding Checklist
- [ ] **Environment Setup**: Node.js 18+, NPM dependencies
- [ ] **SLDS Training**: Complete SLDS component library review
- [ ] **Code Standards**: Review style guides and linting rules
- [ ] **Testing**: Understand testing framework and quality gates
- [ ] **Deployment**: Practice deployment process and rollback
- [ ] **Accessibility**: WCAG 2.1 AA requirements training

#### Contribution Guidelines
```markdown
## Code Contribution Process
1. Create feature branch from main
2. Implement changes following SLDS patterns
3. Add/update tests for new functionality
4. Run full test suite: `npm run test`
5. Create pull request with detailed description
6. Address code review feedback
7. Ensure CI/CD pipeline passes
8. Merge with squash commit
```

#### Code Review Standards
- **SLDS Compliance**: All UI changes must use SLDS components
- **Accessibility**: No WCAG violations introduced
- **Performance**: No regression in Core Web Vitals
- **Browser Support**: Test in all supported browsers
- **Documentation**: Update architecture docs for significant changes

---

## Deployment Architecture

### 1. CI/CD Pipeline

#### Build Process
```yaml
# Netlify Build Configuration
build:
  command: "npm run build"
  environment:
    NODE_VERSION: "18"
    NODE_ENV: "production"

# Build Steps
1. Install Dependencies: npm ci
2. Run Linting: npm run lint
3. Validate HTML: npm run validate:html
4. Run Tests: npm run test
5. Build Assets: npm run build
6. Deploy to Netlify
```

#### Quality Gates
- **Lint Checks**: ESLint, Stylelint, HTMLHint
- **Accessibility**: pa11y-ci with zero errors
- **Performance**: Lighthouse CI with 85+ scores
- **SLDS Compliance**: Custom validation script
- **Security**: npm audit for vulnerabilities

### 2. Monitoring and Analytics

#### Performance Monitoring
- **Real User Monitoring**: Core Web Vitals tracking
- **Synthetic Testing**: Lighthouse CI on every deploy
- **Error Tracking**: JavaScript error monitoring
- **Asset Performance**: CDN and image optimization metrics

#### Accessibility Monitoring
- **Automated Testing**: pa11y-ci in CI/CD pipeline
- **Manual Testing**: Quarterly accessibility audits
- **User Feedback**: Accessibility feedback collection
- **Compliance Reporting**: WCAG 2.1 AA compliance dashboards

---

## Security Framework

### 1. Content Security Policy
```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  frame-ancestors 'none';
```

### 2. Security Headers
- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin

### 3. Dependency Security
```bash
# Regular security audits
npm audit --audit-level=moderate
npm audit fix

# Automated dependency updates
npm update
npm outdated
```

---

This architecture documentation provides a comprehensive foundation for maintaining and extending the Food-N-Force website while ensuring SLDS compliance, accessibility, performance, and security standards. Teams should refer to this documentation for all development decisions and use it as the primary reference for architectural patterns and best practices.