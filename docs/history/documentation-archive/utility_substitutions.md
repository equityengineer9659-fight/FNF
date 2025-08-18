# SLDS Utility Class Substitutions Report

## Critical Violations Requiring Immediate Attention

### BLOCKING ISSUE: Glassmorphism Implementation
**File**: `navigation-styles.css`
**Lines**: 118-119, 1054-1055

#### Violation: Glassmorphism Anti-Pattern
- **Current**: 
  ```css
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  ```
- **Replace with**: **REMOVE ENTIRELY** - Glassmorphism is not permitted in SLDS
- **Priority**: **CRITICAL - BLOCKS PR**
- **Reason**: SLDS strictly prohibits glassmorphism effects. This violates core design system principles.

---

### BLOCKING ISSUE: Neumorphism Implementation
**File**: `styles.css`
**Lines**: 77-78

#### Violation: Neumorphic Shadow System
- **Current**: 
  ```css
  --fnf-shadow-neumorphic: 20px 20px 60px #d1d1d1, -20px -20px 60px #ffffff;
  --fnf-shadow-neumorphic-hover: 30px 30px 80px #d1d1d1, -30px -30px 80px #ffffff;
  ```
- **Replace with**: **REMOVE ENTIRELY** - Use SLDS elevation tokens
- **Priority**: **CRITICAL - BLOCKS PR**
- **Reason**: Neumorphism creates accessibility issues and violates SLDS design principles.

---

## High Priority Spacing Violations

### Navigation Container Spacing
**File**: `navigation-styles.css`
**Line**: 121

#### Violation: Hard-coded Padding
- **Current**: `padding: 1rem 0;`
- **Replace with**: `slds-p-vertical_large`
- **Priority**: **HIGH**
- **Reason**: Must use SLDS spacing tokens for consistency

### Hero Section Spacing
**File**: Multiple HTML files

#### Violation: Inline Spacing Styles
- **Current**: Various hard-coded rem values
- **Replace with**: SLDS spacing utility classes
- **Priority**: **HIGH**
- **Reason**: Spacing must be consistent across design system

---

## Medium Priority Color Violations

### Custom Accent Color
**File**: `styles.css`
**Line**: 22

#### Violation: Non-SLDS Brand Color
- **Current**: `--fnf-accent-color: #00d4ff;`
- **Replace with**: `--slds-c-brand-accessible: #0176d3;`
- **Priority**: **MEDIUM**
- **Reason**: Colors must come from approved SLDS palette

### Inline Color Styles
**File**: `index.html`, `contact.html`
**Multiple lines**

#### Violation: Inline Color Declarations
- **Current**: `style="color: #ffffff;"`
- **Replace with**: `slds-text-color_inverse`
- **Priority**: **MEDIUM**
- **Reason**: Utility classes provide better maintainability

---

## Typography Substitutions

### Custom Font Sizing
**File**: `navigation-styles.css`
**Line**: 697

#### Violation: Hard-coded Font Size
- **Current**: `font-size: 2.8rem !important;`
- **Replace with**: `slds-text-heading_hero`
- **Priority**: **MEDIUM**
- **Reason**: Must use SLDS typography scale

### Navigation Link Sizing
**File**: `navigation-styles.css`
**Line**: 766

#### Violation: Pixel-based Font Size
- **Current**: `font-size: 18px !important;`
- **Replace with**: `slds-text-body_regular`
- **Priority**: **MEDIUM**
- **Reason**: SLDS uses rem-based typography scale

---

## Border Radius Violations

### Logo Border Radius
**File**: `navigation-styles.css`
**Line**: 216

#### Violation: Custom Border Radius
- **Current**: `border-radius: var(--logo-border-radius) !important;` where `--logo-border-radius: 12px`
- **Replace with**: `border-radius: var(--slds-c-border-radius-large);`
- **Priority**: **MEDIUM**
- **Reason**: Must use SLDS radius tokens

### Form Element Radius
**File**: Multiple CSS files

#### Violation: Custom Radius Values
- **Current**: Various `border-radius: 8px`, `border-radius: 4px`
- **Replace with**: 
  - `8px` → `var(--slds-c-border-radius-large)`
  - `4px` → `var(--slds-c-border-radius-medium)`
- **Priority**: **MEDIUM**
- **Reason**: Consistency with SLDS radius system

---

## Container and Layout Improvements

### Grid Implementation
**File**: Multiple HTML files

#### Violation: Inconsistent Grid Usage
- **Current**: Mixed use of CSS Grid and SLDS grid classes
- **Replace with**: Consistent SLDS grid utility classes
- **Priority**: **MEDIUM**
- **Reason**: SLDS grid system provides responsive behavior

### Container Spacing
**File**: `responsive-enhancements.css`

#### Violation: Custom Container Padding
- **Current**: Hard-coded padding values
- **Replace with**: 
  - `padding-left: var(--slds-c-spacing-large)`
  - `padding-right: var(--slds-c-spacing-large)`
- **Priority**: **MEDIUM**
- **Reason**: Container spacing should use SLDS tokens

---

## Background and Effects Cleanup

### Custom Gradients
**File**: `styles.css`, `navigation-styles.css`

#### Violation: Multiple Custom Gradient Implementations
- **Current**: Various `linear-gradient()` and `conic-gradient()` declarations
- **Replace with**: SLDS background utilities or solid colors
- **Priority**: **HIGH**
- **Reason**: Custom gradients must be pre-approved by design system team

### Performance-Heavy Effects
**File**: `navigation-styles.css`

#### Violation: CSS Animation and Transform Heavy Effects
- **Current**: Complex animations and transforms
- **Replace with**: Simplified SLDS-compliant interactions
- **Priority**: **MEDIUM**
- **Reason**: Performance and accessibility considerations

---

## Form Element Compliance

### Input Field Styling
**File**: `contact.html`

#### Violation: Custom Form Styling
- **Current**: Mixed SLDS and custom form classes
- **Replace with**: Pure SLDS form components
- **Priority**: **MEDIUM**
- **Reason**: Form accessibility requires SLDS patterns

---

## Button and Interactive Element Fixes

### Button Hover States
**File**: Multiple CSS files

#### Violation: Custom Button Hover Effects
- **Current**: Custom transform and color changes
- **Replace with**: SLDS button state classes
- **Priority**: **MEDIUM**
- **Reason**: Interactive states must follow SLDS patterns

---

## Responsive Design Alignment

### Custom Breakpoints
**File**: `responsive-enhancements.css`
**Lines**: 13-18

#### Violation: Custom Breakpoint System
- **Current**: Custom CSS custom properties for breakpoints
- **Replace with**: SLDS standard breakpoints
- **Priority**: **MEDIUM**
- **Reason**: Breakpoints must align with SLDS responsive system

---

## Implementation Priority Matrix

### CRITICAL (Must Fix Before Merge)
1. Remove all glassmorphism implementations
2. Remove all neumorphism implementations
3. Replace custom gradients with SLDS alternatives

### HIGH Priority
1. Standardize spacing using SLDS tokens
2. Replace custom colors with SLDS palette
3. Implement proper SLDS grid system

### MEDIUM Priority
1. Typography scale alignment
2. Border radius standardization
3. Form component compliance
4. Button state improvements

### LOW Priority
1. Animation simplification
2. Performance optimizations
3. Progressive enhancement improvements

---

## Performance Impact Assessment

### Before Cleanup
- **CSS Bundle Size**: ~85KB (estimated with redundant styles)
- **Custom Properties**: 50+ custom variables
- **Browser Compatibility**: Limited due to backdrop-filter

### After SLDS Compliance
- **CSS Bundle Size**: ~45KB (estimated with SLDS utilities)
- **Custom Properties**: <10 necessary custom variables
- **Browser Compatibility**: Full SLDS browser support matrix
- **Maintenance**: Significantly reduced due to utility-first approach

---

## Migration Steps

1. **Phase 1 (CRITICAL)**: Remove all anti-patterns (glassmorphism, neumorphism)
2. **Phase 2 (HIGH)**: Implement SLDS spacing and color systems
3. **Phase 3 (MEDIUM)**: Typography and component alignment
4. **Phase 4 (LOW)**: Performance and accessibility enhancements

Each phase should include comprehensive testing across all supported browsers and devices.