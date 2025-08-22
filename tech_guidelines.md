# Technical Guidelines - Food-N-Force Website

**Version**: 1.0  
**Last Updated**: 2025-08-21  
**Technical Architect**: Claude Code  

## Architecture Principles

### 1. Progressive Enhancement
- **Core Functionality**: Must work without JavaScript
- **Enhancement Layer**: JavaScript adds animations, interactions, and advanced features
- **Graceful Degradation**: Features degrade gracefully when JS is disabled

### 2. CSS Architecture Standards

#### CSS Layers (Required)
```css
@layer reset, base, components, utilities, overrides;
```

**Layer Hierarchy**:
- `reset`: CSS resets and normalizations
- `base`: Base element styles (typography, colors)
- `components`: Component-specific styles (navigation, cards, forms)
- `utilities`: Utility classes and helpers
- `overrides`: Emergency fixes and !important declarations (minimize use)

#### Naming Conventions
- **BEM-style Components**: `.component__element--modifier`
- **SLDS Integration**: Prefix custom classes with `fnf-` when extending SLDS
- **State Classes**: Use `is-` prefix (`.is-active`, `.is-loading`)
- **JavaScript Hooks**: Use `js-` prefix for JavaScript targeting

### 3. Performance Standards

#### CSS Performance
- **Maximum Bundle Size**: 50KB compressed
- **Critical CSS**: < 14KB inline for above-the-fold content
- **CSS Containment**: Use `contain: layout style paint` for component isolation
- **Hardware Acceleration**: Use `transform` and `opacity` for animations

#### JavaScript Performance
- **Core Navigation**: Must load and function < 100ms
- **Bundle Size**: Maximum 100KB compressed per page
- **Third-party Scripts**: Load asynchronously, defer non-critical functionality
- **Animation Budget**: 60fps, frame budget 16.67ms

### 4. Folder Structure

```
css/
├── critical.css           # Above-the-fold critical styles
├── navigation-unified.css # Navigation system (CSS Layers)
├── styles.css            # Global styles and base layer
└── [feature]-specific.css # Page-specific enhancements

js/
├── core/                 # Essential functionality
│   ├── navigation.js     # Simplified navigation controller
│   └── performance.js    # Performance monitoring
├── pages/               # Page-specific enhancements
└── vendor/              # Third-party libraries

adr/                     # Architecture Decision Records
docs/                    # Technical documentation
tools/                   # Build and testing utilities
```

### 5. Import Boundaries

#### CSS Import Rules
- **SLDS First**: Always load Salesforce Lightning Design System CSS first
- **Base Styles**: Load global styles before component styles
- **Critical Path**: Inline critical CSS, async load enhancement CSS
- **Order Matters**: CSS load order affects cascade resolution

#### JavaScript Dependencies
- **No Circular Dependencies**: Components cannot import each other directly
- **Core Dependencies**: Only core modules can be imported by all components
- **Progressive Loading**: Non-critical features loaded asynchronously

### 6. Component Organization

#### Navigation System
- **HTML**: Static navigation structure in all pages
- **CSS**: `navigation-unified.css` with CSS Layers architecture
- **JavaScript**: Progressive enhancement only (mobile toggle, animations)

#### Page Components
- **Self-Contained**: Each component includes its own CSS and JS
- **SLDS Compliant**: Use SLDS patterns and classes where possible
- **Accessibility**: WCAG 2.1 AA compliance required

### 7. Code Quality Standards

#### CSS Quality
- **No !important**: Use CSS Layers for cascade management
- **Vendor Prefixes**: Use autoprefixer, don't manually add
- **Color Variables**: Use CSS custom properties for theming
- **Mobile First**: Write mobile styles first, enhance for desktop

#### JavaScript Quality
- **ES6+ Features**: Use modern JavaScript syntax
- **Error Handling**: All async operations must include error handling
- **Performance**: Use requestAnimationFrame for animations
- **Accessibility**: Include ARIA attributes and keyboard navigation

#### HTML Quality
- **Semantic HTML**: Use appropriate semantic elements
- **SLDS Patterns**: Follow SLDS component patterns
- **Accessibility**: Include alt text, ARIA labels, proper heading hierarchy
- **Progressive Enhancement**: Core content accessible without CSS/JS

### 8. Dependency Rules

#### Allowed Dependencies
- **Salesforce Lightning Design System**: Core design framework
- **Google Fonts**: Typography (Orbitron font family)
- **Performance APIs**: Native browser APIs (Intersection Observer, etc.)

#### Forbidden Dependencies
- **jQuery**: Use vanilla JavaScript instead
- **Heavy Frameworks**: No React, Vue, Angular for this static site
- **CSS Preprocessors**: Use native CSS features (variables, layers)
- **Polyfills**: Target modern browsers only

### 9. Testing Requirements

#### Browser Support
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 90+
- **No IE Support**: Internet Explorer not supported

#### Testing Standards
- **Responsive Testing**: All viewport sizes from 320px to 1920px
- **Accessibility Testing**: WCAG 2.1 AA compliance validation
- **Performance Testing**: Core Web Vitals within budget
- **JavaScript Disabled**: Core functionality must work without JS

### 10. Enforcement and Tooling

#### Automated Checks
- **CSS Validation**: Use stylelint with SLDS-compatible rules
- **JavaScript Linting**: ESLint with accessibility plugin
- **Performance Monitoring**: Lighthouse CI integration
- **Accessibility Auditing**: axe-core integration

#### Manual Review Process
- **Architecture Review**: All new components reviewed against these guidelines
- **Performance Review**: Core Web Vitals measured for all changes
- **Accessibility Review**: Manual testing with screen readers
- **Cross-browser Testing**: Visual and functional testing across browsers

### 11. Emergency Procedures

#### Critical Issue Resolution
1. **Assess Impact**: Determine if issue affects core functionality
2. **Emergency Fix**: Apply minimal, targeted fix with documentation
3. **ADR Creation**: Document emergency architectural decisions
4. **Technical Debt**: Schedule proper resolution in next iteration

#### Rollback Strategy
- **CSS Changes**: Keep previous version as `.backup.css`
- **JavaScript Changes**: Git revert with specific commit references
- **HTML Changes**: Maintain known-good templates
- **Performance Regression**: Immediate rollback if Core Web Vitals exceed budget

### 12. Success Criteria

#### Performance Metrics
- **Largest Contentful Paint**: < 2.5s
- **First Input Delay**: < 100ms
- **Cumulative Layout Shift**: < 0.1
- **Time to Interactive**: < 3.5s

#### Quality Metrics
- **Accessibility Score**: 100% (Lighthouse)
- **CSS Size**: < 50KB compressed
- **JavaScript Size**: < 100KB compressed per page
- **Browser Compatibility**: 100% functionality in supported browsers

---

**Compliance**: All code changes must adhere to these guidelines. Exceptions require ADR documentation and technical architecture approval.