# Food-N-Force Website - Technical Documentation

**Version**: 3.0  
**Last Updated**: 2026-03-26
**SLDS Version**: 2.22.2
**Node.js**: 20.0.0+ (CI uses Node 22)

---

## Overview

The Food-N-Force website is a production-ready, SLDS-compliant web application showcasing modern food bank solutions. This documentation consolidates comprehensive technical guidance for development teams, focusing on maintainability, scalability, and design system compliance.

---

## Architecture Overview

### System Components

#### Frontend Architecture
- **HTML5**: Semantic structure with WCAG 2.1 AA compliance
- **Salesforce Lightning Design System (SLDS)**: Primary component library
- **Modern CSS**: Custom properties, Grid, Flexbox with SLDS token integration
- **Vanilla JavaScript**: ES6+ modules with progressive enhancement
- **Node.js Toolchain**: Build, test, and deployment automation

#### Application Structure
```
Food-N-Force Website/
├── Frontend Application (Static Site)
│   ├── HTML Pages (6 primary pages)
│   ├── CSS Modules (4 organized stylesheets)
│   ├── JavaScript Modules (4 core modules)
│   └── Asset Management (Optimized images and logos)
├── Build System (NPM + Custom Scripts)
├── Testing Suite (Performance, Accessibility, Browser)
├── Deployment Pipeline (SiteGround + GitHub Actions CI/CD)
└── Monitoring (Lighthouse, HTML Validation, SLDS Compliance)
```

### Design System Integration

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

---

## Component Architecture

### HTML Pages Structure

#### Page Inventory
- **index.html**: Homepage with hero section and service overview
- **about.html**: Company story and mission
- **services.html**: Detailed service offerings
- **impact.html**: Success stories and metrics
- **contact.html**: Contact form and information
- **resources.html**: Educational content and downloads

#### Semantic Patterns
```html
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

### CSS Module Organization

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

### JavaScript Module Architecture

#### Core Modules
```
js/
├── fnf-core.js           # Core functionality: navigation, logo management
├── fnf-effects.js        # Visual effects and animations
├── fnf-performance.js    # Performance monitoring and optimization
└── fnf-app.js           # Application lifecycle and module coordination
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

---

## SLDS Compliance Framework

### Component Mapping Strategy
| UI Element | SLDS Component | Implementation Notes |
|------------|----------------|----------------------|
| Navigation | `slds-brand`, `slds-grid` | Logo + responsive menu |
| Hero Section | `slds-media`, `slds-text-heading_hero` | Brand + messaging |
| Service Cards | `slds-card`, `slds-grid_wrap` | Responsive card grid |
| Forms | `slds-form-element`, `slds-input` | Validation + accessibility |
| Buttons | `slds-button`, `slds-button_brand` | Multiple variants |
| Footer | `slds-grid`, `slds-brand_small` | Contact + branding |

### Token Usage Patterns
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

### Brand Exception: Glassmorphism for Logo Elements

#### Exception ID: FNF-BRAND-001
**Status**: APPROVED  
**Effective Date**: 2025-08-18  
**Review Date**: 2025-11-18  

#### Approved Scope
Glassmorphism effects are formally approved for Food-N-Force logo elements only:

```css
/* APPROVED: Navigation logo container */
.fnf-logo-wrapper {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* APPROVED: Hero section brand element */
.hero-brand-wrapper .slds-brand {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* APPROVED: Footer brand element */
.footer .slds-brand {
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
```

#### Prohibited Applications
- Any UI controls (buttons, forms, cards)
- Content containers
- Navigation menus (except logo wrapper)
- Any non-brand specific elements

---

## Responsive Design System

### Breakpoint Strategy
```css
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

### Touch Target Standards
- **Minimum Size**: 44px × 44px for all interactive elements
- **Spacing**: Minimum 8px between adjacent touch targets
- **Hover States**: Only applied on non-touch devices
- **Focus Indicators**: Minimum 2px outline with sufficient contrast

### Navigation Clearance System

#### CSS Variables & SLDS Token System
```css
:root {
    --fnf-nav-height: 80px;
    --fnf-nav-clearance-mobile: calc(var(--fnf-nav-height) + var(--slds-c-spacing-small));     /* 92px */
    --fnf-nav-clearance-tablet: calc(var(--fnf-nav-height) + var(--slds-c-spacing-medium));    /* 96px */
    --fnf-nav-clearance-desktop: calc(var(--fnf-nav-height) + var(--slds-c-spacing-large));    /* 104px */
}
```

#### Responsive Coverage
- **Mobile (≤768px)**: 92px clearance
- **Tablet (769px-1024px)**: 96px clearance  
- **Desktop (≥1025px)**: 104px clearance

---

## Performance Standards

### Core Web Vitals Targets
| Metric | Good | Target | Current |
|--------|------|--------|---------|
| **Largest Contentful Paint (LCP)** | ≤ 2.5s | < 2.0s | 2.1s |
| **First Input Delay (FID)** | ≤ 100ms | < 75ms | 85ms |
| **Cumulative Layout Shift (CLS)** | ≤ 0.1 | < 0.05 | 0.08 |
| **First Contentful Paint (FCP)** | ≤ 1.8s | < 1.5s | 1.4s |
| **Time to Interactive (TTI)** | ≤ 3.8s | < 3.0s | 2.8s |

### Bundle Size Targets
- **CSS**: < 50KB minified and gzipped
- **JavaScript**: < 75KB minified and gzipped (excluding SLDS)
- **Images**: WebP < 500KB total, PNG fallbacks < 1MB total
- **Fonts**: Orbitron subset < 100KB

### Performance Budget Framework
```javascript
const PERFORMANCE_BUDGETS = {
    totalPageWeight: 1500, // KB
    totalRequests: 50,
    css: { total: 64 },     // KB
    javascript: { total: 100 }, // KB
    images: { total: 500 }, // KB
    fonts: { total: 100 }   // KB
};
```

---

## Accessibility Implementation

### WCAG 2.1 AA Compliance
- **Color Contrast**: Minimum 4.5:1 ratio for all text
- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader Support**: Semantic HTML with proper ARIA
- **Motion Preferences**: Respect `prefers-reduced-motion`

### Implementation Patterns
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

### ARIA Pattern Implementation
```html
<nav class="slds-context-bar" role="navigation" aria-label="Main navigation">
    <div class="slds-context-bar__primary">
        <div class="slds-brand">
            <a href="/" aria-label="Food-N-Force Home" class="slds-brand__logo-link">
                <img src="logo.svg" 
                     alt="Food-N-Force Logo" 
                     class="slds-brand__logo-image"
                     role="img">
            </a>
        </div>
    </div>
</nav>
```

---

## Logo Integration System

### File Structure
```
images/logos/
├── primary/
│   ├── fnf-logo.svg (current primary logo)
│   ├── fnf-logo.webp (optimized version)
│   └── fnf-logo.png (fallback)
├── variants/
│   ├── fnf-logo-horizontal.svg
│   ├── fnf-logo-icon.svg
│   └── fnf-logo-white.svg
├── sizes/
│   ├── fnf-logo-32.png
│   ├── fnf-logo-48.png
│   ├── fnf-logo-56.png
│   └── fnf-logo-80.png
└── favicon/
    ├── favicon.ico
    └── various sizes
```

### Implementation Examples

#### Navigation Logo
```html
<div class="slds-brand fnf-logo-wrapper nav-animate-logo">
    <a href="index.html" class="slds-brand__logo-link" aria-label="Food-N-Force Home">
        <img src="images/logos/fnf-logo.svg" 
             alt="Food-N-Force - Modern Solutions for Food Banks" 
             class="slds-brand__logo-image fnf-logo-image" 
             width="56" height="56" 
             loading="eager">
    </a>
</div>
```

#### Hero Section Logo
```html
<div class="slds-media hero-brand-wrapper" role="banner">
    <div class="slds-media__figure slds-media__figure_fixed-width">
        <div class="slds-brand slds-brand_large">
            <img src="images/logos/fnf-logo.svg" 
                 alt="Food-N-Force - Modern Solutions for Food Banks"
                 class="slds-brand__logo-image hero-logo-large"
                 width="80" height="80"
                 loading="eager">
        </div>
    </div>
</div>
```

### Progressive Loading Strategy
1. **Critical Path**: Navigation logo preloaded
2. **Progressive Enhancement**: Format detection (WebP → SVG → PNG)
3. **Fallback System**: Multi-tier fallback chain
4. **Performance**: Lazy loading for non-critical logos

---

## Browser Compatibility

### Supported Browsers
| Browser | Version | Support Level | Notes |
|---------|---------|---------------|-------|
| Chrome | 90+ | Full | Primary development target |
| Firefox | 88+ | Full | Complete feature parity |
| Safari | 14+ | Full | WebKit-specific optimizations |
| Edge | 90+ | Full | Chromium-based support |
| iOS Safari | 14+ | Full | Touch-optimized |
| Android Chrome | 90+ | Full | Mobile-optimized |

### Progressive Enhancement Strategy
1. **Base Layer**: Semantic HTML works without CSS or JavaScript
2. **CSS Enhancement**: SLDS components with graceful degradation
3. **JavaScript Enhancement**: Progressive feature additions
4. **Modern Features**: WebP, CSS Grid, ES6+ with fallbacks

---

## Testing Standards

### Quality Gates
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

### Test Automation
```bash
# Complete test suite
npm run test                    # All tests
npm run test:accessibility      # pa11y accessibility testing
npm run test:performance        # Lighthouse CI
npm run test:browser           # Playwright cross-browser
npm run validate:html          # HTML validation
npm run validate:slds          # SLDS compliance check
```

---

## Security Framework

### Content Security Policy
```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  frame-ancestors 'none';
```

### Security Headers
- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin

---

## Maintenance Guidelines

### Code Organization Principles

#### File Naming Conventions
- **HTML**: `kebab-case.html` (e.g., `about.html`)
- **CSS**: `kebab-case.css` (e.g., `navigation-styles.css`)
- **JavaScript**: `kebab-case.js` (e.g., `fnf-core.js`)
- **Images**: `kebab-case.ext` (e.g., `fnf-logo.svg`)
- **Components**: `ComponentName` (e.g., `FoodNForceCore`)

#### Update Procedures

##### SLDS Version Updates
1. **Check Compatibility**: Review SLDS changelog for breaking changes
2. **Update CDN**: Modify SLDS CDN link in all HTML files
3. **Test Components**: Run full component regression tests
4. **Update Tokens**: Sync any new design tokens
5. **Validate Compliance**: Run SLDS compliance checks

##### Security Patch Process
```bash
# Security audit and updates
npm audit --audit-level=moderate
npm audit fix --force

# Validate after updates
npm run test
npm run validate:slds
npm run build
```

---

## Troubleshooting Framework

### Common Issues and Solutions

#### SLDS Compliance Failures
```bash
# Diagnosis
npm run validate:slds

# Solution
# Review SLDS_REPORT.md for specific violations
# Replace custom CSS with SLDS utilities
# Test with npm run validate:slds
```

#### Performance Regression
```bash
# Diagnosis
npm run test:performance

# Solution
# Check Lighthouse report for specific metrics
# Optimize images: npm run optimize:images
# Review bundle sizes: npm run analyze:bundle
```

#### Accessibility Failures
```bash
# Diagnosis
npm run test:accessibility

# Solution
# Check pa11y output for specific WCAG violations
# Validate color contrast ratios
# Test keyboard navigation manually
```

### Debugging Tools
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

## Development Process

### Contribution Guidelines
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

### Code Review Standards
- **SLDS Compliance**: All UI changes must use SLDS components
- **Accessibility**: No WCAG violations introduced
- **Performance**: No regression in Core Web Vitals
- **Browser Support**: Test in all supported browsers
- **Documentation**: Update architecture docs for significant changes

---

## Resources and References

### SLDS Resources
- [SLDS Design Tokens](https://www.lightningdesignsystem.com/design-tokens/)
- [SLDS Component Library](https://www.lightningdesignsystem.com/components/)
- [SLDS Accessibility Guidelines](https://www.lightningdesignsystem.com/accessibility/)

### Performance Resources
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Performance Budgets](https://web.dev/performance-budgets-101/)

### Accessibility Resources
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Pa11y Testing](https://pa11y.org/)
- [Accessibility Testing Guide](https://accessibility.18f.gov/guide/)

---

This comprehensive technical documentation provides the foundation for maintaining and extending the Food-N-Force website while ensuring SLDS compliance, accessibility, performance, and security standards. Teams should refer to this documentation for all development decisions and use it as the primary reference for architectural patterns and best practices.

**Document Status**: Active  
**Next Review**: 2025-09-18  
**Maintained By**: Development Team