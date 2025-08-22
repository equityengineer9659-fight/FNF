# Mobile Navigation Hotfix Plan
**Created:** 2025-08-22  
**Priority:** CRITICAL  
**Status:** PLANNED  

## Problem Summary

**Critical Issue:** CSS cascade conflict in `navigation-unified.css` causing mobile navigation failure
**Root Cause:** `slds-hide` class overriding `slds-show_small` in SLDS utility classes
**Impact:** 60-80% of users (mobile) cannot access navigation

## Technical Analysis

### CSS Cascade Conflict
```css
/* PROBLEM: These classes conflict at mobile breakpoints */
.slds-hide                     /* Always hidden */
.slds-show_small              /* Show only on small screens */

/* CURRENT HTML (BROKEN): */
<div class="slds-col slds-no-flex slds-hide slds-show_small mobile-toggle-container">
```

### Specificity Issue
- `slds-hide` has higher CSS specificity than `slds-show_small`
- Result: Mobile toggle hidden at ALL breakpoints
- Should be: Hidden on desktop, visible on mobile

## Hotfix Strategy

### Phase 1: CSS Class Order Fix
```css
/* SOLUTION 1: Override with higher specificity */
@layer overrides {
  @media (max-width: 768px) {
    .mobile-toggle-container.slds-hide.slds-show_small {
      display: flex !important;
    }
  }
}
```

### Phase 2: HTML Structure Fix
```html
<!-- BETTER: Remove conflicting classes -->
<div class="slds-col slds-no-flex mobile-toggle-container slds-show_small">
  <!-- Mobile toggle content -->
</div>
```

### Phase 3: CSS Architecture Improvement
```css
/* BEST: Custom responsive classes */
.mobile-nav-toggle {
  display: none;
}

@media (max-width: 768px) {
  .mobile-nav-toggle {
    display: flex;
  }
}
```

## Implementation Plan

### Step 1: Emergency CSS Override (5 minutes)
- Add high-specificity override to navigation-unified.css
- Test on mobile devices
- Deploy if successful

### Step 2: HTML Structure Fix (15 minutes)
- Remove conflicting SLDS classes from HTML
- Use custom responsive classes instead
- Validate across all pages

### Step 3: CSS Architecture Cleanup (30 minutes)
- Remove !important declarations
- Implement clean responsive design
- Update documentation

## Testing Requirements

### Mandatory Validation
- [ ] iPhone Safari (iOS 17+)
- [ ] Android Chrome (latest)
- [ ] iPad tablet view
- [ ] Desktop breakpoint (ensure no regression)
- [ ] Screen reader compatibility
- [ ] Keyboard navigation

### Performance Validation
- [ ] No impact on CSS bundle size
- [ ] Animation performance maintained
- [ ] No layout shift issues

## Success Criteria

**Functional Requirements:**
- Mobile navigation toggle visible and functional
- Desktop navigation unaffected
- WCAG 2.1 AA compliance maintained
- Cross-browser compatibility

**Performance Requirements:**
- CSS parsing time unchanged
- Animation smoothness preserved
- Bundle size impact < 1KB

## Risk Mitigation

**Risk:** New CSS conflicts
**Mitigation:** Staged testing with immediate rollback plan

**Risk:** Desktop regression
**Mitigation:** Cross-device validation before deployment

**Risk:** Animation performance impact
**Mitigation:** GPU acceleration preserved in fix

## Post-Fix Actions

1. Update mobile device testing protocol
2. Create CSS specificity guidelines
3. Implement mandatory cross-device validation
4. Document SLDS utility class best practices

---

**Next Action:** Implement Step 1 emergency override as soon as mobile navigation restoration is confirmed