# Food-N-Force Technical Guidelines

**Version:** 1.0  
**Date:** 2025-01-18  
**Owner:** Technical Architect  
**Scope:** All website development and maintenance activities

## Overview

This document establishes technical standards for the Food-N-Force website to ensure maintainable, performant, and SLDS-compliant code while preserving approved special effects and user experience.

## Folder Structure

### Root Directory Organization
```
/
├── css/                    # Stylesheets (production)
│   ├── styles.css         # Core styles and design tokens
│   ├── navigation-styles.css  # Navigation system styles
│   ├── responsive-enhancements.css  # Responsive behavior
│   └── fnf-modules.css    # Modular CSS components
├── js/                    # JavaScript files (production)
│   ├── core/              # Essential functionality
│   ├── effects/           # Special effects systems  
│   ├── pages/             # Page-specific scripts
│   └── monitoring/        # Production diagnostics
├── images/                # Image assets
│   ├── logos/             # Logo variants and formats
│   │   ├── primary/       # Main logo files
│   │   ├── fallbacks/     # PNG/fallback versions
│   │   ├── sizes/         # Different size variants
│   │   └── variants/      # White, dark variants
│   └── backgrounds/       # Background images/textures
├── adr/                   # Architecture Decision Records
├── docs/                  # Documentation (see ADR-002)
├── dev-tools/             # Development-only utilities
│   ├── js/                # Development JavaScript
│   ├── testing/           # Test files and utilities
│   └── servers/           # Local development servers
└── [page].html           # Production HTML pages
```

### JavaScript Organization Standards

#### `/js/core/` - Essential Systems
```
js/core/
├── unified-navigation-refactored.js  # Navigation system (protected)
├── slds-enhancements.js             # SLDS framework enhancements
└── animations.js                    # Core animation controllers
```

#### `/js/effects/` - Special Effects Systems
```
js/effects/
├── premium-effects-refactored.js    # Approved glassmorphism & animations
├── premium-background-effects.js    # Spinning/mesh backgrounds
├── slds-cool-effects.js             # SLDS-compliant effects
└── logo-optimization.js             # Logo loading & animations
```

#### `/js/pages/` - Page-Specific Scripts
```
js/pages/
├── about-page-unified.js            # About page enhancements
├── stats-counter-fix.js             # Counter animations
├── disable-conflicting-counters.js  # Animation conflict prevention
└── responsive-validation.js         # Responsive testing
```

#### `/js/monitoring/` - Production Diagnostics
```
js/monitoring/
├── navigation-height-diagnostic.js  # Navigation monitoring
├── services-diagnostic.js           # Services page monitoring
└── impact-diagnostic.js            # Impact page monitoring
```

## Naming Conventions

### File Naming Standards

#### HTML Files
- **Pattern:** `[page-name].html`
- **Examples:** `index.html`, `about.html`, `services.html`
- **Rules:** 
  - Lowercase only
  - Hyphens for multi-word pages
  - No underscores in production files

#### CSS Files
- **Pattern:** `[purpose]-[type].css`
- **Examples:** `navigation-styles.css`, `responsive-enhancements.css`
- **Rules:**
  - Descriptive purpose prefix
  - Lowercase with hyphens
  - Avoid generic names like `main.css` or `theme.css`

#### JavaScript Files
- **Pattern:** `[component]-[purpose].js`
- **Examples:** `unified-navigation-refactored.js`, `premium-effects-refactored.js`
- **Rules:**
  - Component name first
  - Purpose or version suffix
  - Use `-refactored` for improved versions
  - Use `-diagnostic` for monitoring scripts

#### Image Files
- **Pattern:** `[component]-[variant].[ext]`
- **Examples:** `fnf-logo.svg`, `fnf-logo-white.svg`, `fnf-logo-icon.png`
- **Rules:**
  - Component prefix (`fnf-` for brand assets)
  - Variant description
  - Appropriate file extension for format

### CSS Class Naming

#### SLDS-Compliant Patterns
- **Use SLDS classes first:** `slds-grid`, `slds-col`, `slds-button`
- **Extend with custom:** `slds-button custom-brand-button`
- **Namespace custom classes:** `fnf-[component]-[element]`

#### Component Naming Convention
```css
/* Component base */
.fnf-[component-name] { }

/* Component elements */
.fnf-[component-name]__[element] { }

/* Component modifiers */
.fnf-[component-name]--[modifier] { }

/* State classes */
.fnf-[component-name].is-[state] { }
```

#### Examples
```css
/* Navigation component */
.fnf-navigation { }
.fnf-navigation__logo { }
.fnf-navigation__menu { }
.fnf-navigation--mobile { }
.fnf-navigation.is-fixed { }

/* Card components */
.fnf-card { }
.fnf-card__header { }
.fnf-card__content { }
.fnf-card--elevated { }
.fnf-card.is-loading { }
```

### JavaScript Naming

#### Variables and Functions
```javascript
// camelCase for variables and functions
const navigationHeight = 80;
const logoLoadingStates = new Map();

function calculateClearance() { }
function handleLogoOptimization() { }

// PascalCase for classes and constructors
class NavigationManager { }
class LogoOptimizer { }

// UPPER_SNAKE_CASE for constants
const MAX_LOGO_SIZE = 1024;
const DEFAULT_ANIMATION_DURATION = 300;
```

#### File and Module Patterns
```javascript
// Module pattern for namespace
const FNF = FNF || {};
FNF.Navigation = (function() {
    // Private members
    let isInitialized = false;
    
    // Public API
    return {
        init: function() { },
        destroy: function() { }
    };
})();

// ES6 Class pattern for components
class NavigationDiagnostic {
    constructor(options = {}) {
        this.config = { ...this.defaults, ...options };
    }
    
    // Public methods
    run() { }
    report() { }
}
```

## Import Boundaries

### CSS Import Rules

#### Allowed Import Patterns
```css
/* SLDS framework - External CDN only */
@import url('https://cdnjs.cloudflare.com/ajax/libs/design-system/2.22.2/styles/salesforce-lightning-design-system.min.css');

/* Google Fonts - External only */
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap');

/* NO local @import statements allowed - use HTML link tags */
```

#### Load Order Requirements
1. **SLDS Framework** (external)
2. **styles.css** (core design tokens and components)
3. **navigation-styles.css** (navigation-specific styles)
4. **responsive-enhancements.css** (responsive behavior)

#### Forbidden Patterns
```css
/* NEVER do this - breaks caching and performance */
@import url('navigation-styles.css');
@import url('responsive-enhancements.css');

/* Use HTML link tags instead */
```

### JavaScript Import Boundaries

#### Module Loading Rules
```javascript
// Allowed: Feature detection before loading
if ('IntersectionObserver' in window) {
    // Load performance features
}

// Allowed: Conditional loading for page types
if (document.body.classList.contains('index-page')) {
    // Load index-specific features
}

// Forbidden: Synchronous loading of large libraries
// (Use async loading or bundling instead)
```

#### Dependency Rules
- **Core scripts** may not depend on page-specific scripts
- **Effect scripts** must check for core script availability
- **Diagnostic scripts** load after functional scripts
- **No circular dependencies** between modules

#### Example Dependency Check
```javascript
// Good: Check for dependencies
if (typeof FNF !== 'undefined' && FNF.Navigation) {
    // Safe to use navigation features
    const diagnostics = new NavigationDiagnostic();
}

// Bad: Assume dependencies exist
const diagnostics = new NavigationDiagnostic(); // May fail
```

## Dependency Rules

### Allowed Dependencies

#### External Libraries (CDN Only)
- **SLDS Framework:** v2.22.2+ (Salesforce Lightning Design System)
- **Google Fonts:** Orbitron font family only
- **No other external dependencies** without architecture approval

#### Internal Dependencies
- **JavaScript:** Core → Effects → Pages → Monitoring (hierarchy enforced)
- **CSS:** SLDS → Core → Component-specific → Responsive
- **Images:** SVG preferred, PNG fallback, WebP optimization

### Forbidden Dependencies

#### JavaScript Libraries
```javascript
// FORBIDDEN: External JS libraries
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js"></script>

// REASON: Adds unnecessary weight, conflicts with SLDS, reduces performance
```

#### CSS Frameworks
```css
/* FORBIDDEN: Additional CSS frameworks */
@import url('https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css');
@import url('https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css');

/* REASON: Conflicts with SLDS, increases specificity wars */
```

#### Build Tools in Production
- **No Webpack/Rollup bundles** in current architecture
- **No transpiled ES6+** (write compatible ES5/ES6)
- **No CSS preprocessors** (use CSS custom properties)

### Dependency Validation

#### Pre-deployment Checklist
```bash
# Check for unauthorized dependencies
grep -r "cdnjs.cloudflare.com" . --exclude-dir=node_modules
grep -r "unpkg.com" . --exclude-dir=node_modules  
grep -r "jsdelivr.net" . --exclude-dir=node_modules

# Allowed: SLDS and Google Fonts only
# Flag: Any other CDN references
```

## Code Organization

### CSS Organization Standards

#### Design Token Structure
```css
/* 1. CSS Custom Properties (Design Tokens) */
:root {
    /* SLDS Brand Colors */
    --slds-c-brand-primary: #16325C;
    --slds-c-brand-secondary: #0176d3;
    
    /* FNF Extensions */
    --fnf-accent-color: #00d4ff;
    --fnf-easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* 2. Base Elements */
body { }
main { }

/* 3. Layout Components */
.slds-grid { /* SLDS extensions only */ }

/* 4. UI Components */
.fnf-card { }
.fnf-button { }

/* 5. Special Effects (marked clearly) */
/* ===== APPROVED SPECIAL EFFECTS ===== */
.fnf-logo-animation { }
.fnf-background-mesh { }
.fnf-glassmorphism { }

/* 6. Utility Classes */
.fnf-clearfix { }
.fnf-visually-hidden { }

/* 7. Responsive Overrides */
@media (max-width: 768px) { }
```

#### Component Structure Pattern
```css
/* Component: Card System */
.fnf-card {
    /* Layout properties */
    display: block;
    
    /* Box model */
    padding: var(--slds-c-spacing-large);
    margin: var(--slds-c-spacing-medium);
    
    /* Visual properties */
    background: var(--slds-c-background-default);
    border-radius: var(--slds-c-border-radius-medium);
    
    /* Typography */
    font-family: inherit;
    
    /* Transitions */
    transition: var(--slds-c-transition-medium) ease;
}

/* Component states */
.fnf-card:hover {
    box-shadow: var(--slds-c-elevation-shadow-2);
}

/* Component variants */
.fnf-card--elevated {
    box-shadow: var(--slds-c-elevation-shadow-3);
}

/* Component responsive behavior */
@media (max-width: 768px) {
    .fnf-card {
        padding: var(--slds-c-spacing-medium);
    }
}
```

### JavaScript Organization Standards

#### Module Structure Pattern
```javascript
/**
 * Component: Navigation Diagnostic
 * 
 * LIFECYCLE: Production monitoring
 * DEPENDENCIES: unified-navigation-refactored.js
 * LOADS: After navigation system initialization
 * SPECIAL_EFFECTS: No
 * LAST_MODIFIED: 2025-01-18
 */

class NavigationDiagnostic {
    constructor(options = {}) {
        // Configuration with defaults
        this.config = {
            monitoringInterval: 5000,
            errorThreshold: 3,
            ...options
        };
        
        // State management
        this.isRunning = false;
        this.errorCount = 0;
        this.metrics = new Map();
        
        // Initialize if dependencies available
        this.init();
    }
    
    // Public methods
    init() {
        if (!this.checkDependencies()) {
            console.warn('NavigationDiagnostic: Dependencies not available');
            return;
        }
        
        this.setupMonitoring();
        this.isRunning = true;
    }
    
    // Private methods
    checkDependencies() {
        return typeof FNF !== 'undefined' && 
               FNF.Navigation && 
               document.querySelector('.fnf-navigation');
    }
    
    setupMonitoring() {
        // Implementation
    }
    
    // Cleanup
    destroy() {
        this.isRunning = false;
        // Cleanup timers, listeners, etc.
    }
}

// Auto-initialize for production pages
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.navigationDiagnostic = new NavigationDiagnostic();
    });
} else {
    window.navigationDiagnostic = new NavigationDiagnostic();
}
```

#### Error Handling Standards
```javascript
// Good: Defensive programming with graceful degradation
function enhanceNavigation() {
    try {
        if (!document.querySelector('.fnf-navigation')) {
            console.info('Navigation enhancement skipped - element not found');
            return;
        }
        
        // Enhancement code
        
    } catch (error) {
        console.error('Navigation enhancement failed:', error);
        // Fallback to basic functionality
    }
}

// Good: Feature detection
if ('IntersectionObserver' in window) {
    // Use advanced features
} else {
    // Provide basic fallback
}
```

### HTML Organization Standards

#### Document Structure Pattern
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Meta tags (charset, viewport, description) -->
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- SEO and social meta -->
    <meta name="description" content="...">
    <meta property="og:title" content="...">
    
    <!-- External CSS (SLDS first, then fonts) -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/design-system/2.22.2/styles/salesforce-lightning-design-system.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    
    <!-- Local CSS (order critical) -->
    <link rel="stylesheet" href="css/styles.css">
    <link rel="stylesheet" href="css/navigation-styles.css">
    <link rel="stylesheet" href="css/responsive-enhancements.css">
    
    <title>Page Title - Food-N-Force</title>
</head>
<body class="[page-name]-page">
    <!-- Skip navigation for accessibility -->
    <a href="#main-content" class="skip-link">Skip to main content</a>

    <!-- Navigation injection point -->
    <!-- Navigation will be automatically injected here by unified-navigation-refactored.js -->

    <!-- Main content -->
    <main id="main-content" role="main">
        <!-- Page content with semantic structure -->
    </main>

    <!-- Footer -->
    <footer class="custom-footer" role="contentinfo">
        <!-- Footer content -->
    </footer>

    <!-- JavaScript (order critical) -->
    <!-- Core system scripts -->
    <script src="js/unified-navigation-refactored.js"></script>
    <script src="js/slds-enhancements.js"></script>
    <script src="js/animations.js"></script>
    
    <!-- Effect system scripts -->
    <script src="js/premium-effects-refactored.js"></script>
    <script src="js/slds-cool-effects.js"></script>
    
    <!-- Page-specific scripts -->
    <!-- Load page-specific scripts here -->
    
    <!-- Page load completion -->
    <script>
        window.addEventListener('load', () => {
            document.body.classList.add('loaded');
        });
    </script>
</body>
</html>
```

## Special Effects Guidelines

### Approved Effects Protection

#### Logo Effects
```css
/* PROTECTED: Logo animations - DO NOT MODIFY without approval */
.fnf-logo-animation {
    /* Implementation details protected */
    animation: logoGlow 3s ease-in-out infinite alternate;
}

@keyframes logoGlow {
    /* Protected animation keyframes */
}
```

#### Background Effects
```javascript
// PROTECTED: Background spinning effects
// Only allowed on index and about pages
class BackgroundEffects {
    constructor() {
        // Enforce page restrictions
        const allowedPages = ['index-page', 'about-page'];
        const currentPage = document.body.className;
        
        if (!allowedPages.some(page => currentPage.includes(page))) {
            console.info('Background effects not enabled for this page');
            return;
        }
        
        // Implementation protected
    }
}
```

#### Glassmorphism Effects
```css
/* PROTECTED: Glassmorphism for navigation and hero sections only */
.fnf-glassmorphism {
    background: rgba(22, 50, 92, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    
    /* Fallback for unsupported browsers */
    @supports not (backdrop-filter: blur(10px)) {
        background: rgba(22, 50, 92, 0.98);
    }
}
```

### Implementation Standards
- All special effects must respect `prefers-reduced-motion`
- Performance budget compliance required
- Browser fallbacks mandatory
- Mobile optimization required

## Migration Paths

### Legacy Code Modernization

#### Phase 1: Immediate Issues
```css
/* Replace: Inline !important usage */
.old-style {
    color: red !important; /* BAD */
}

/* With: Proper specificity */
.fnf-component .slds-text {
    color: var(--slds-c-text-error); /* GOOD */
}
```

#### Phase 2: Architecture Improvements
```javascript
// Replace: Global variables
var globalNavHeight = 80; // BAD

// With: Namespaced modules
const FNF = {
    config: {
        navHeight: 80
    }
}; // GOOD
```

### Compliance Checklist

#### Before Each Commit
- [ ] No unauthorized dependencies added
- [ ] CSS follows BEM naming with FNF namespace
- [ ] JavaScript follows module pattern
- [ ] Performance budget respected
- [ ] Special effects preserved
- [ ] SLDS compliance maintained

#### Before Each Release
- [ ] All guidelines documentation reviewed
- [ ] Dependency audit completed
- [ ] Performance testing passed
- [ ] Cross-browser testing completed
- [ ] Accessibility testing passed

---
**Guidelines Version:** 1.0  
**Next Review:** Quarterly  
**Contact:** Technical Architect for clarifications