# ADR-009: CSS Cascade Management Architecture for Header Visibility

## Context

We are experiencing persistent header visibility issues where H1 "Food-N-Force" company name and H2 headers have `opacity: 0` despite CSS `!important` overrides. The glassmorphism logo effect was also incorrectly modified when only requested to be made smaller with faster rotation. This represents a critical architectural failure in CSS cascade management within the SLDS-based system.

### Current Issues Identified
1. **Animation classes setting opacity: 0**: `.nav-animate-company-name`, `.nav-animate-logo`, `.nav-animate-item` classes start with `opacity: 0` but lack JavaScript activation to reveal elements
2. **CSS specificity battles**: Multiple layers of CSS with conflicting priorities causing rules not to apply properly
3. **SLDS utility class conflicts**: SLDS utility classes potentially overriding custom styles
4. **Missing JavaScript triggers**: Animation classes depend on JavaScript to add `.nav-revealed` class, but JavaScript may not be executing properly
5. **Layer cascade conflicts**: CSS `@layer` directives may be interfering with proper cascade resolution

### Root Cause Analysis
The fundamental issue is **architectural**: we have animation-dependent visibility patterns without proper fallbacks or containment boundaries. Elements start invisible and rely on JavaScript to become visible, violating progressive enhancement principles.

## Options Considered

### Option A: Remove All Animation Classes (Quick Fix)
**Pros:**
- Immediate header visibility restoration
- Eliminates JavaScript dependency for basic visibility
- Reduces complexity

**Cons:**
- Loses all header animations
- Doesn't solve underlying cascade architecture issues
- May break other animation systems

### Option B: CSS Containment with Isolation Boundaries
**Pros:**
- Proper architectural solution
- Maintains animations with better control
- Provides containment boundaries to prevent cascade conflicts
- SLDS compliant
- Progressive enhancement friendly

**Cons:**
- More complex implementation
- Requires understanding of CSS containment
- May need broader refactoring

### Option C: Hybrid Approach - Visible by Default with Enhancement
**Pros:**
- Headers visible immediately (progressive enhancement)
- Animations enhance experience when JavaScript loads
- Fallback-first approach
- Maintains SLDS compliance

**Cons:**
- Requires careful coordination between CSS and JavaScript
- More complex state management

### Option D: Layer Restructuring with Explicit Cascade Control
**Pros:**
- Leverages CSS layers for proper cascade management
- Eliminates need for `!important` declarations
- Better performance through explicit layer control
- Future-proof architecture

**Cons:**
- Requires understanding of CSS layers
- May need extensive refactoring of existing CSS
- Modern browser requirement

## Decision

**Selected: Option B + C Hybrid - CSS Containment with Visible-by-Default Enhancement**

We will implement CSS containment boundaries for header elements with a progressive enhancement approach where headers are visible by default and animations enhance the experience when JavaScript is available.

### Architecture Principles
1. **Progressive Enhancement**: Headers visible without JavaScript
2. **CSS Containment**: Isolate header elements to prevent cascade conflicts
3. **Layer Management**: Use CSS layers for explicit cascade control
4. **Fallback Strategy**: Always provide visible fallbacks for critical elements

### Implementation Strategy

#### 1. CSS Containment Implementation
```css
@layer base {
  /* Header containment boundary */
  .navbar.universal-nav .company-name-container-centered {
    contain: layout style paint;
    isolation: isolate;
  }
  
  /* Visible by default - progressive enhancement */
  .brand-logo.universal-brand-logo {
    opacity: 1; /* Default visible state */
    font-size: 2.5rem;
    font-weight: 800;
    color: #ffffff;
    transition: all 0.8s ease-out;
  }
}

@layer components {
  /* Animation enhancement layer */
  .nav-animate-company-name {
    /* Animation states only apply when JavaScript is available */
    transform: translateY(0);
    transition: opacity 0.8s ease-out, transform 0.8s ease-out;
  }
  
  .nav-animate-company-name:not(.nav-revealed) {
    /* Only hide if JavaScript hasn't loaded yet */
    opacity: 0.9; /* Subtle fade instead of complete invisibility */
    transform: translateY(-10px);
  }
  
  .nav-animate-company-name.nav-revealed {
    opacity: 1;
    transform: translateY(0);
  }
}

@layer utilities {
  /* Emergency visibility overrides */
  .fnf-force-visible {
    opacity: 1 !important;
    visibility: visible !important;
    display: block !important;
  }
}
```

#### 2. Progressive Enhancement JavaScript
```javascript
// Immediate visibility fallback
document.addEventListener('DOMContentLoaded', () => {
  // Ensure headers are visible immediately
  const headers = document.querySelectorAll('.brand-logo, h1, h2');
  headers.forEach(header => {
    if (getComputedStyle(header).opacity === '0') {
      header.classList.add('fnf-force-visible');
    }
  });
  
  // Progressive enhancement for animations
  setTimeout(() => {
    const animatedElements = document.querySelectorAll('[class*="nav-animate"]');
    animatedElements.forEach(el => {
      el.classList.add('nav-revealed');
      el.classList.remove('fnf-force-visible'); // Remove emergency override
    });
  }, 100); // Small delay to ensure CSS is loaded
});
```

#### 3. CSS Layer Architecture
```css
/* Explicit layer order for cascade control */
@layer reset, base, slds-overrides, components, utilities, animations, emergency-overrides;

@layer emergency-overrides {
  /* Ultimate fallback for critical visibility issues */
  html body .brand-logo.universal-brand-logo {
    opacity: 1;
    color: #ffffff;
    display: block;
  }
  
  html body h1.brand-logo {
    opacity: 1;
    color: #ffffff;
  }
  
  html body h2 {
    opacity: 1;
    color: inherit;
  }
}
```

### SLDS Compliance Strategy

#### 1. SLDS Integration Pattern
```css
@layer slds-overrides {
  /* Extend SLDS patterns without breaking them */
  .slds-brand .brand-logo.universal-brand-logo {
    /* SLDS-compliant brand logo styling */
    font-family: var(--slds-c-font-family-heading);
    font-size: var(--slds-c-font-size-8);
    font-weight: var(--slds-c-font-weight-bold);
    line-height: var(--slds-c-line-height-heading);
  }
  
  /* Responsive SLDS overrides */
  @media (max-width: 768px) {
    .slds-brand .brand-logo.universal-brand-logo {
      font-size: var(--slds-c-font-size-6);
    }
  }
}
```

#### 2. SLDS Utility Class Harmonization
```css
@layer utilities {
  /* Harmonize with SLDS utilities */
  .fnf-text-visible {
    opacity: 1;
    visibility: visible;
  }
  
  /* Override problematic SLDS utilities when necessary */
  .navbar .slds-hide {
    display: none !important;
  }
  
  .navbar .slds-show {
    display: block !important;
  }
}
```

## Consequences

### Positive Consequences
1. **Immediate Header Visibility**: All headers will be visible immediately, eliminating the primary user experience issue
2. **Progressive Enhancement**: Animations enhance the experience without breaking basic functionality
3. **CSS Containment**: Prevents future cascade conflicts through proper isolation boundaries
4. **SLDS Compliance**: Maintains compliance with Salesforce Lightning Design System patterns
5. **Performance**: CSS containment can improve rendering performance by creating optimization boundaries
6. **Maintainability**: Clear separation of concerns between base visibility and enhanced animations
7. **Accessibility**: Headers are always visible for screen readers and users with JavaScript disabled
8. **Future-Proof**: CSS layers provide modern cascade management that scales with complexity

### Negative Consequences
1. **Increased Complexity**: More CSS architecture to understand and maintain
2. **Browser Support**: CSS containment and layers require modern browsers (95%+ coverage)
3. **Animation Coordination**: Requires careful coordination between CSS and JavaScript for smooth animations
4. **Technical Debt**: Existing animation classes may need refactoring to work with new architecture
5. **Learning Curve**: Team needs to understand CSS containment and layer concepts

### Risk Mitigation
1. **Fallback Strategy**: Multiple layers of fallbacks ensure headers are always visible
2. **Progressive Enhancement**: Core functionality works without advanced CSS features
3. **Emergency Overrides**: Ultimate fallback layer for critical visibility issues
4. **Documentation**: Comprehensive documentation of new architecture patterns
5. **Testing**: Extensive testing across browsers and with JavaScript disabled

### Success Criteria
- [ ] All headers (H1, H2) visible immediately on page load
- [ ] Company name "Food-N-Force" visible in navigation on all pages
- [ ] Animations enhance experience when JavaScript is available
- [ ] No `!important` declarations needed for basic visibility
- [ ] SLDS compliance maintained
- [ ] Performance budget maintained (CSS bundle size, frame rate)
- [ ] Accessibility compliance (WCAG 2.1 AA)

### Monitoring and Validation
1. **Automated Testing**: Playwright tests to verify header visibility across all pages
2. **Performance Monitoring**: Core Web Vitals tracking to ensure no regression
3. **Cross-Browser Testing**: Validation across supported browsers
4. **Accessibility Auditing**: Screen reader testing and axe-core validation
5. **Visual Regression**: Screenshot comparison to ensure consistent appearance

---

**Status**: Approved  
**Implementation Priority**: P0 (Critical)  
**Estimated Effort**: 8-16 hours  
**Dependencies**: None  
**Breaking Changes**: None (progressive enhancement approach)