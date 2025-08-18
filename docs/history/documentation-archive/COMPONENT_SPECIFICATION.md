# Food-N-Force Component Specification
## Comprehensive Component Architecture and Implementation Guide

**Version**: 3.0  
**SLDS Version**: 2.22.2  
**Last Updated**: 2025-08-18  

---

## Component Hierarchy Overview

### 1. Application Architecture

```
FoodNForce Application
├── Core System (fnf-core.js)
│   ├── Navigation Management
│   ├── Logo System
│   ├── Page Classification
│   └── Accessibility Framework
├── Visual Effects (fnf-effects.js)
│   ├── Animation System
│   ├── Hover Effects
│   └── Transition Management
├── Performance Layer (fnf-performance.js)
│   ├── Asset Optimization
│   ├── Loading Management
│   └── Monitoring System
└── Application Controller (fnf-app.js)
    ├── Module Coordination
    ├── Event Management
    └── Lifecycle Control
```

---

## Core System Components

### 1. Navigation System (fnf-core.js)

#### Navigation Component Structure
```javascript
class NavigationSystem {
    static NAVIGATION_HTML = `
        <nav class="slds-context-bar fnf-navbar" role="navigation" aria-label="Main navigation">
            <div class="slds-context-bar__primary slds-context-bar__item_divider-right">
                <div class="slds-brand fnf-logo-wrapper nav-animate-logo">
                    <a href="index.html" class="slds-brand__logo-link" aria-label="Food-N-Force Home">
                        <img src="images/logos/fnf-logo.svg" 
                             alt="Food-N-Force - Modern Solutions for Food Banks" 
                             class="slds-brand__logo-image fnf-logo-image" 
                             width="56" height="56" 
                             loading="eager">
                    </a>
                </div>
            </div>
            <div class="slds-context-bar__secondary">
                <ul class="slds-grid slds-context-bar__list">
                    <!-- Navigation items dynamically inserted -->
                </ul>
            </div>
        </nav>
    `;
}
```

#### Navigation States
| State | Visual Appearance | Interaction | SLDS Classes |
|-------|------------------|-------------|--------------|
| **Default** | Standard horizontal layout | Hover effects on items | `slds-context-bar` |
| **Mobile** | Hamburger menu with overlay | Touch-optimized targets | `slds-context-bar_vertical` |
| **Active Page** | Highlighted current page | Visual emphasis | `slds-is-active` |
| **Hover** | Subtle lift and glow | Smooth transitions | Custom hover states |
| **Focus** | High contrast outline | Keyboard navigation | `slds-has-focus` |

#### Implementation Specifications
```css
/* Navigation Base Styles */
.fnf-navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 9999;
    background: var(--slds-c-background-default);
    box-shadow: var(--slds-c-elevation-shadow-2);
    transition: all var(--slds-c-transition-medium) var(--fnf-easing-standard);
}

/* Logo Hover Animation */
.nav-animate-logo:hover {
    transform: translateY(-2px) scale(1.02);
    filter: drop-shadow(0 6px 24px rgba(16, 179, 255, 0.35));
    transition: all 0.28s var(--fnf-easing-standard);
}

/* Mobile Navigation Overlay */
.mobile-nav-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    z-index: 9998;
}
```

### 2. Logo Management System

#### Logo Component Architecture
```javascript
class LogoSystem {
    constructor() {
        this.logoCache = new Map();
        this.capabilities = {};
        this.formats = ['webp', 'avif', 'svg', 'png'];
        this.fallbackChain = this.buildFallbackChain();
    }
    
    async optimizeLogoForContext(context, viewport) {
        const logoConfig = {
            navigation: { size: this.getNavLogoSize(viewport), priority: 'high' },
            hero: { size: this.getHeroLogoSize(viewport), priority: 'high' },
            footer: { size: 32, priority: 'low' }
        };
        
        return this.loadOptimalLogo(logoConfig[context]);
    }
}
```

#### Logo Variants and Usage
| Context | Size (Desktop) | Size (Mobile) | Format Priority | Loading Strategy |
|---------|---------------|---------------|-----------------|------------------|
| **Navigation** | 56px × 56px | 40px × 40px | SVG → WebP → PNG | Eager, preload |
| **Hero Section** | 80px × 80px | 48px × 48px | SVG → WebP → PNG | Eager, priority |
| **Footer** | 32px × 32px | 28px × 28px | SVG → PNG | Lazy loading |
| **Favicon** | 32px × 32px | 32px × 32px | ICO → PNG | Preload |

#### Logo States and Fallbacks
```javascript
// Logo error handling with progressive fallbacks
async handleLogoError(imgElement, context) {
    const fallbackSequence = [
        { format: 'svg', path: 'images/logos/fnf-logo.svg' },
        { format: 'png', path: 'images/logos/fnf-logo.png' },
        { format: 'css', generator: this.createCSSLogo }
    ];
    
    for (const fallback of fallbackSequence) {
        try {
            if (fallback.format === 'css') {
                return fallback.generator(context);
            }
            await this.loadImage(fallback.path);
            imgElement.src = fallback.path;
            return;
        } catch (error) {
            console.warn(`Logo fallback failed: ${fallback.format}`, error);
        }
    }
}
```

---

## CSS Architecture Components

### 1. Design Token System (styles.css)

#### SLDS Token Implementation
```css
:root {
    /* SLDS Brand Colors - Primary Palette */
    --slds-c-brand-primary: #16325C;
    --slds-c-brand-secondary: #0176d3;
    --slds-c-brand-accessible: #0176d3;
    --slds-c-text-brand: #0176d3;
    
    /* FNF Custom Extensions (SLDS-Compliant) */
    --fnf-accent-color: #00d4ff;
    --fnf-accent-mid: #0099cc;
    --fnf-accent-dark: #006699;
    
    /* Enhanced Typography Scale */
    --slds-c-font-size-1: 0.75rem;    /* 12px */
    --slds-c-font-size-2: 0.875rem;   /* 14px */
    --slds-c-font-size-3: 1rem;       /* 16px */
    --slds-c-font-size-4: 1.125rem;   /* 18px */
    --slds-c-font-size-5: 1.25rem;    /* 20px */
    --slds-c-font-size-6: 1.5rem;     /* 24px */
    --slds-c-font-size-7: 1.75rem;    /* 28px */
    --slds-c-font-size-8: 2rem;       /* 32px */
    --slds-c-font-size-9: 2.25rem;    /* 36px */
    --slds-c-font-size-10: 2.625rem;  /* 42px */
    --slds-c-font-size-11: 3rem;      /* 48px */
    
    /* Elevation and Shadow System */
    --slds-c-elevation-shadow-1: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
    --slds-c-elevation-shadow-2: 0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23);
    --slds-c-elevation-shadow-3: 0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23);
    --slds-c-elevation-shadow-4: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
    --slds-c-elevation-shadow-5: 0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22);
}
```

#### Token Usage Guidelines
```css
/* CORRECT: Use SLDS tokens */
.component {
    margin: var(--slds-c-spacing-large);
    font-size: var(--slds-c-font-size-4);
    color: var(--slds-c-text-default);
    box-shadow: var(--slds-c-elevation-shadow-2);
}

/* INCORRECT: Hard-coded values */
.component {
    margin: 16px;
    font-size: 18px;
    color: #333;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

### 2. Component-Specific Styles

#### Hero Section Component
```css
.hero-section {
    /* SLDS Grid Foundation */
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--slds-c-spacing-large);
    
    /* SLDS Spacing */
    padding: var(--slds-c-spacing-xx-large) var(--slds-c-spacing-large);
    
    /* SLDS Background */
    background: var(--slds-c-background-default);
    
    /* Responsive Behavior */
    min-height: 60vh;
    align-items: center;
    text-align: center;
}

.hero-title {
    /* SLDS Typography Scale */
    font-size: var(--slds-c-font-size-10);
    line-height: var(--slds-c-line-height-heading);
    font-weight: 700;
    
    /* SLDS Color System */
    color: var(--slds-c-text-default);
    
    /* Responsive Typography */
    @media (max-width: 768px) {
        font-size: var(--slds-c-font-size-8);
    }
    
    @media (max-width: 480px) {
        font-size: var(--slds-c-font-size-7);
    }
}
```

#### Service Cards Component
```css
.service-cards-grid {
    /* SLDS Grid System */
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: var(--slds-c-spacing-large);
    
    /* SLDS Spacing */
    padding: var(--slds-c-spacing-x-large) 0;
}

.service-card {
    /* SLDS Card Base */
    background: var(--slds-c-background-default);
    border: 1px solid var(--slds-c-border-color-default);
    border-radius: var(--slds-c-border-radius-medium);
    
    /* SLDS Elevation */
    box-shadow: var(--slds-c-elevation-shadow-1);
    
    /* SLDS Spacing */
    padding: var(--slds-c-spacing-large);
    
    /* Interactive States */
    transition: all var(--slds-c-transition-medium) var(--fnf-easing-standard);
}

.service-card:hover {
    box-shadow: var(--slds-c-elevation-shadow-3);
    transform: translateY(-2px);
}
```

---

## JavaScript Module Specifications

### 1. fnf-core.js - Core Application Module

#### Module Interface
```javascript
class FoodNForceCore {
    constructor() {
        this.isInitialized = false;
        this.observers = [];
        this.eventListeners = [];
        this.modules = new Map();
        
        // Capability Detection
        this.capabilities = {};
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Component Systems
        this.navigation = new NavigationSystem();
        this.logoSystem = new LogoSystem();
        this.accessibility = new AccessibilitySystem();
    }
    
    // Public API
    async init() { /* Core initialization */ }
    registerModule(name, module) { /* Module registration */ }
    getCapabilities() { /* Browser capability detection */ }
    cleanup() { /* Memory cleanup and observers */ }
}
```

#### Core Responsibilities
1. **Page Classification**: Identify current page and apply appropriate classes
2. **Navigation Injection**: Dynamic navigation insertion with SLDS compliance
3. **Logo Management**: Multi-format logo loading with fallbacks
4. **Accessibility Setup**: ARIA, focus management, reduced motion support
5. **Event Coordination**: Central event bus for module communication

### 2. fnf-effects.js - Visual Effects Module

#### Animation System
```javascript
class EffectsSystem {
    constructor() {
        this.animationQueue = [];
        this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.intersectionObserver = this.createIntersectionObserver();
    }
    
    // Animation Methods
    animateOnScroll(elements, animationConfig) {
        if (this.isReducedMotion) {
            return this.applyStaticStates(elements);
        }
        
        this.intersectionObserver.observe(elements);
    }
    
    createRevealAnimation(element, delay = 0) {
        return {
            name: 'reveal',
            element: element,
            delay: delay,
            duration: 600,
            easing: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
            keyframes: [
                { opacity: 0, transform: 'translateY(20px)' },
                { opacity: 1, transform: 'translateY(0)' }
            ]
        };
    }
}
```

#### Supported Animations
| Animation Type | Trigger | Duration | Easing | Reduced Motion Fallback |
|---------------|---------|----------|--------|------------------------|
| **Reveal** | Intersection | 600ms | Standard | Immediate display |
| **Logo Hover** | Mouse hover | 280ms | Standard | Static hover state |
| **Card Lift** | Mouse hover | 200ms | Decelerate | Border highlight |
| **Button Press** | Click/tap | 150ms | Sharp | Color change only |
| **Page Transition** | Navigation | 400ms | Standard | Instant transition |

### 3. fnf-performance.js - Performance Monitoring

#### Performance Metrics Collection
```javascript
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = [];
        this.thresholds = {
            LCP: 2500,
            FID: 100,
            CLS: 0.1,
            FCP: 1800
        };
    }
    
    initializeObservers() {
        // Core Web Vitals monitoring
        this.observeLCP();
        this.observeFID();
        this.observeCLS();
        
        // Custom metrics
        this.observeNavigationTiming();
        this.observeResourceTiming();
    }
    
    observeLCP() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                this.metrics.set('LCP', entry.startTime);
                this.evaluateThreshold('LCP', entry.startTime);
            });
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
}
```

### 4. fnf-app.js - Application Controller

#### Module Coordination
```javascript
class FoodNForceApp {
    constructor() {
        this.modules = new Map();
        this.loadOrder = ['core', 'effects', 'performance'];
        this.isInitialized = false;
    }
    
    async init() {
        console.log('🚀 Initializing Food-N-Force Application...');
        
        try {
            // Load modules in dependency order
            for (const moduleName of this.loadOrder) {
                await this.loadModule(moduleName);
            }
            
            // Start application lifecycle
            this.bindGlobalEvents();
            this.startPerformanceMonitoring();
            
            this.isInitialized = true;
            console.log('✅ Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.handleInitializationError(error);
        }
    }
}
```

---

## SLDS Component Implementation

### 1. Button Components

#### SLDS Button Variants
```html
<!-- Primary Brand Button -->
<button class="slds-button slds-button_brand">
    <span class="slds-button__text">Primary Action</span>
</button>

<!-- Secondary Outline Button -->
<button class="slds-button slds-button_outline-brand">
    <span class="slds-button__text">Secondary Action</span>
</button>

<!-- Neutral Button -->
<button class="slds-button slds-button_neutral">
    <span class="slds-button__text">Neutral Action</span>
</button>

<!-- Icon Button -->
<button class="slds-button slds-button_icon slds-button_icon-brand">
    <svg class="slds-button__icon" aria-hidden="true">
        <use xlink:href="#utility-add"></use>
    </svg>
    <span class="slds-assistive-text">Add Item</span>
</button>
```

#### Button State Management
```css
/* SLDS Button Enhancement */
.slds-button {
    /* Ensure proper touch targets */
    min-height: 44px;
    min-width: 44px;
    
    /* Enhanced transitions */
    transition: all var(--slds-c-transition-medium) var(--fnf-easing-standard);
}

/* Focus states for accessibility */
.slds-button:focus {
    outline: 2px solid var(--slds-c-brand-accessible);
    outline-offset: 2px;
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
    .slds-button {
        transition: none;
    }
}
```

### 2. Form Components

#### SLDS Form Structure
```html
<div class="slds-form-element">
    <label class="slds-form-element__label" for="input-id">
        <span class="slds-required" aria-label="required">*</span>
        Field Label
    </label>
    <div class="slds-form-element__control">
        <input type="text" 
               id="input-id" 
               class="slds-input" 
               required
               aria-describedby="input-error">
    </div>
    <div id="input-error" class="slds-form-element__help slds-hide">
        Error message appears here
    </div>
</div>
```

#### Form Validation System
```javascript
class FormValidator {
    constructor(form) {
        this.form = form;
        this.fields = this.form.querySelectorAll('.slds-input, .slds-textarea, .slds-select');
        this.setupValidation();
    }
    
    setupValidation() {
        this.fields.forEach(field => {
            field.addEventListener('blur', (e) => this.validateField(e.target));
            field.addEventListener('input', (e) => this.clearError(e.target));
        });
    }
    
    validateField(field) {
        const value = field.value.trim();
        const isRequired = field.hasAttribute('required');
        const fieldType = field.type;
        
        // Clear previous errors
        this.clearError(field);
        
        // Required field validation
        if (isRequired && !value) {
            this.showError(field, 'This field is required');
            return false;
        }
        
        // Type-specific validation
        switch (fieldType) {
            case 'email':
                return this.validateEmail(field, value);
            case 'tel':
                return this.validatePhone(field, value);
            default:
                return true;
        }
    }
}
```

### 3. Card Components

#### SLDS Card Implementation
```html
<article class="slds-card">
    <header class="slds-card__header slds-grid">
        <div class="slds-media slds-media_center slds-has-flexi-truncate">
            <div class="slds-media__figure">
                <span class="slds-icon_container slds-icon-standard-opportunity">
                    <svg class="slds-icon slds-icon_small" aria-hidden="true">
                        <use xlink:href="#standard-opportunity"></use>
                    </svg>
                </span>
            </div>
            <div class="slds-media__body">
                <h2 class="slds-card__header-title">
                    <span class="slds-text-heading_small">Service Title</span>
                </h2>
            </div>
        </div>
    </header>
    
    <div class="slds-card__body slds-card__body_inner">
        <p class="slds-text-body_regular">
            Service description and key benefits...
        </p>
    </div>
    
    <footer class="slds-card__footer">
        <a href="#" class="slds-button slds-button_brand">
            Learn More
        </a>
    </footer>
</article>
```

---

## Accessibility Implementation

### 1. ARIA Pattern Implementation

#### Navigation ARIA
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
    
    <div class="slds-context-bar__secondary">
        <ul class="slds-grid slds-context-bar__list" role="menubar">
            <li class="slds-context-bar__item" role="none">
                <a href="/about" 
                   class="slds-context-bar__label-action" 
                   role="menuitem"
                   aria-current="page">
                    About
                </a>
            </li>
        </ul>
    </div>
</nav>
```

#### Form ARIA Patterns
```html
<fieldset class="slds-form-element__group">
    <legend class="slds-form-element__legend slds-form-element__label">
        Contact Information
    </legend>
    
    <div class="slds-form-element__control">
        <div class="slds-radio_button-group" role="radiogroup" aria-labelledby="contact-method">
            <span id="contact-method" class="slds-form-element__label">
                Preferred Contact Method
            </span>
            
            <input type="radio" 
                   id="contact-email" 
                   value="email" 
                   name="contact-method"
                   aria-describedby="contact-help">
            <label class="slds-radio_button__label" for="contact-email">
                <span class="slds-radio_faux">Email</span>
            </label>
        </div>
    </div>
    
    <div id="contact-help" class="slds-form-element__help">
        Choose how you'd like us to contact you
    </div>
</fieldset>
```

### 2. Keyboard Navigation Implementation

#### Focus Management System
```javascript
class FocusManager {
    constructor() {
        this.focusableSelectors = [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
            '[contenteditable="true"]'
        ].join(', ');
        
        this.setupKeyboardNavigation();
    }
    
    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'Tab':
                    this.handleTabNavigation(e);
                    break;
                case 'Escape':
                    this.handleEscapeKey(e);
                    break;
                case 'Enter':
                case ' ':
                    this.handleActivation(e);
                    break;
            }
        });
    }
    
    trapFocus(container) {
        const focusableElements = container.querySelectorAll(this.focusableSelectors);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        container.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey && document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                } else if (!e.shiftKey && document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    }
}
```

### 3. Screen Reader Optimization

#### Content Structure for Screen Readers
```html
<!-- Skip Navigation Links -->
<a href="#main-content" class="skip-link">Skip to main content</a>
<a href="#navigation" class="skip-link">Skip to navigation</a>

<!-- Proper Heading Hierarchy -->
<main id="main-content">
    <h1>Page Title</h1>
    <section aria-labelledby="section-1">
        <h2 id="section-1">Section Title</h2>
        <article aria-labelledby="article-1">
            <h3 id="article-1">Article Title</h3>
        </article>
    </section>
</main>

<!-- Live Regions for Dynamic Content -->
<div aria-live="polite" aria-atomic="true" class="slds-assistive-text">
    Status updates appear here
</div>

<div aria-live="assertive" aria-atomic="true" class="slds-assistive-text">
    Error messages appear here
</div>
```

---

## Performance Optimization Components

### 1. Image Optimization System

#### Responsive Image Implementation
```html
<!-- Hero Logo with Multiple Formats -->
<picture class="hero-logo">
    <source media="(min-width: 1024px)" 
            srcset="images/logos/fnf-logo-80.webp 1x, 
                    images/logos/fnf-logo-160.webp 2x"
            type="image/webp">
    <source media="(min-width: 768px)" 
            srcset="images/logos/fnf-logo-64.webp 1x, 
                    images/logos/fnf-logo-128.webp 2x"
            type="image/webp">
    <source media="(min-width: 480px)" 
            srcset="images/logos/fnf-logo-48.webp 1x, 
                    images/logos/fnf-logo-96.webp 2x"
            type="image/webp">
    
    <!-- PNG Fallbacks -->
    <source media="(min-width: 1024px)" 
            srcset="images/logos/fnf-logo-80.png 1x, 
                    images/logos/fnf-logo-160.png 2x">
    <source media="(min-width: 768px)" 
            srcset="images/logos/fnf-logo-64.png 1x, 
                    images/logos/fnf-logo-128.png 2x">
    
    <img src="images/logos/fnf-logo.svg" 
         alt="Food-N-Force Logo"
         class="slds-brand__logo-image"
         loading="eager"
         width="80" 
         height="80">
</picture>
```

### 2. Lazy Loading Implementation

#### Intersection Observer Lazy Loading
```javascript
class LazyLoader {
    constructor() {
        this.imageObserver = new IntersectionObserver(
            this.handleImageIntersection.bind(this),
            {
                root: null,
                rootMargin: '50px',
                threshold: 0.1
            }
        );
        
        this.initializeLazyImages();
    }
    
    initializeLazyImages() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            this.imageObserver.observe(img);
        });
    }
    
    handleImageIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                this.loadImage(img);
                this.imageObserver.unobserve(img);
            }
        });
    }
    
    async loadImage(img) {
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;
        
        try {
            // Create new image to test loading
            const testImg = new Image();
            testImg.src = src;
            
            await new Promise((resolve, reject) => {
                testImg.onload = resolve;
                testImg.onerror = reject;
            });
            
            // Apply loaded image
            img.src = src;
            if (srcset) img.srcset = srcset;
            img.classList.add('loaded');
            
        } catch (error) {
            console.warn('Image loading failed:', src, error);
            this.applyFallback(img);
        }
    }
}
```

---

## Testing and Quality Assurance

### 1. Component Testing Framework

#### Accessibility Testing
```javascript
// Automated accessibility testing
async function testAccessibility(page) {
    const results = {
        colorContrast: await testColorContrast(page),
        keyboardNavigation: await testKeyboardNavigation(page),
        screenReader: await testScreenReaderSupport(page),
        ariaImplementation: await testAriaImplementation(page)
    };
    
    return results;
}

async function testColorContrast(page) {
    const contrastIssues = [];
    const textElements = await page.$$('p, h1, h2, h3, h4, h5, h6, span, a, button');
    
    for (const element of textElements) {
        const styles = await page.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
                color: computed.color,
                backgroundColor: computed.backgroundColor,
                fontSize: computed.fontSize
            };
        }, element);
        
        const contrast = calculateContrast(styles.color, styles.backgroundColor);
        const requiredRatio = parseFloat(styles.fontSize) >= 18 ? 3 : 4.5;
        
        if (contrast < requiredRatio) {
            contrastIssues.push({
                element: await element.textContent(),
                contrast: contrast,
                required: requiredRatio
            });
        }
    }
    
    return contrastIssues;
}
```

### 2. Performance Testing

#### Core Web Vitals Monitoring
```javascript
class CoreWebVitalsMonitor {
    constructor() {
        this.metrics = {};
        this.thresholds = {
            LCP: { good: 2500, poor: 4000 },
            FID: { good: 100, poor: 300 },
            CLS: { good: 0.1, poor: 0.25 }
        };
    }
    
    startMonitoring() {
        this.measureLCP();
        this.measureFID();
        this.measureCLS();
        this.reportMetrics();
    }
    
    measureLCP() {
        new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.metrics.LCP = lastEntry.startTime;
            this.evaluateMetric('LCP', lastEntry.startTime);
        }).observe({entryTypes: ['largest-contentful-paint']});
    }
    
    evaluateMetric(name, value) {
        const threshold = this.thresholds[name];
        let status;
        
        if (value <= threshold.good) {
            status = 'good';
        } else if (value <= threshold.poor) {
            status = 'needs-improvement';
        } else {
            status = 'poor';
        }
        
        console.log(`${name}: ${value}ms (${status})`);
        
        // Send to analytics or monitoring service
        this.reportToAnalytics(name, value, status);
    }
}
```

---

This comprehensive component specification provides detailed implementation guidance for all major components of the Food-N-Force website, ensuring SLDS compliance, accessibility, performance, and maintainability across the entire application.