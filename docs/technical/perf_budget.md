# Food-N-Force Performance Budget

**Version:** 1.0  
**Date:** 2025-01-18  
**Owner:** Technical Architect  
**Review Cycle:** Quarterly or before major releases

## Performance Budget Overview

This document establishes measurable performance targets for the Food-N-Force website to ensure optimal user experience across all devices and connection speeds while preserving approved special effects.

## Network Conditions

### Target Connection Types
- **Fast 3G:** 1.6Mbps down, 750Kbps up, 150ms RTT (minimum target)
- **Regular 4G:** 4Mbps down, 3Mbps up, 20ms RTT (optimal target)
- **Slow 3G:** 400Kbps down, 400Kbps up, 400ms RTT (graceful degradation)

### Test Devices
- **Mobile:** iPhone 12, Samsung Galaxy S21, Pixel 5
- **Tablet:** iPad Air, Samsung Tab S7
- **Desktop:** Mid-range laptop (8GB RAM, integrated graphics)

## Core Web Vitals Targets

### Largest Contentful Paint (LCP)
- **Good:** ≤ 2.5 seconds
- **Needs Improvement:** 2.5 - 4.0 seconds  
- **Poor:** > 4.0 seconds

**Rationale:** Food bank operators often work in areas with limited bandwidth. Fast content visibility is critical for operational efficiency.

### First Input Delay (FID) / Interaction to Next Paint (INP)
- **FID Good:** ≤ 100ms
- **INP Good:** ≤ 200ms
- **Needs Improvement:** 100-300ms (FID), 200-500ms (INP)
- **Poor:** > 300ms (FID), > 500ms (INP)

**Rationale:** Navigation and form interactions must be responsive for effective workflow management.

### Cumulative Layout Shift (CLS)
- **Good:** ≤ 0.1
- **Needs Improvement:** 0.1 - 0.25
- **Poor:** > 0.25

**Rationale:** Layout stability essential for form completion and professional appearance.

## Time to Interactive (TTI) Thresholds

### Connection Speed Targets

| Connection Type | TTI Target | Maximum Acceptable |
|----------------|------------|-------------------|
| Fast 3G        | ≤ 3.5s     | 5.0s             |
| Regular 4G     | ≤ 2.0s     | 3.0s             |
| Fast 4G/WiFi   | ≤ 1.5s     | 2.5s             |

**Special Considerations:**
- Logo animations must not delay TTI by more than 200ms
- Background effects (index/about) must not delay TTI by more than 500ms
- Navigation must be functional within 2s regardless of effects loading

## Bundle Size Limits

### JavaScript Bundles

#### Initial Bundle (Critical Path)
- **unified-navigation-refactored.js:** ≤ 45KB compressed
- **slds-enhancements.js:** ≤ 25KB compressed
- **animations.js:** ≤ 20KB compressed
- **Total Initial JS:** ≤ 150KB compressed

#### Effect Systems (Lazy Loadable)
- **premium-effects-refactored.js:** ≤ 35KB compressed
- **premium-background-effects.js:** ≤ 30KB compressed
- **slds-cool-effects.js:** ≤ 25KB compressed
- **Total Effects JS:** ≤ 100KB compressed

#### Page-Specific Scripts
- **Per Page Maximum:** ≤ 20KB compressed additional JS
- **Total Page-Specific:** ≤ 80KB compressed across all pages

#### Diagnostic/Monitoring Scripts
- **Production Monitoring:** ≤ 15KB compressed total
- **Development Tools:** No limit (excluded from production)

### CSS Bundles

#### Core Styles
- **styles.css:** ≤ 150KB compressed (includes SLDS overrides)
- **navigation-styles.css:** ≤ 40KB compressed
- **responsive-enhancements.css:** ≤ 30KB compressed
- **Total Core CSS:** ≤ 250KB compressed

#### External Dependencies
- **SLDS Framework:** ~180KB (external CDN, cached)
- **Google Fonts (Orbitron):** ~25KB (external, cached)

### Image Assets

#### Logo Assets
- **SVG Logos:** ≤ 15KB each (optimized)
- **PNG Fallbacks:** ≤ 50KB each
- **WebP Variants:** ≤ 30KB each
- **Total Logo Bundle:** ≤ 100KB

#### Background/Effect Images
- **Hero Background:** ≤ 200KB (compressed)
- **Mesh/Pattern Assets:** ≤ 100KB total
- **Icon Assets:** ≤ 5KB each (prefer emoji/text)

## Frame Rate (FPS) Targets

### Animation Performance
- **Logo Animations:** Maintain 60fps for duration
- **Background Effects:** ≥ 30fps (60fps preferred)
- **Navigation Transitions:** 60fps mandatory
- **Card Hover Effects:** 60fps mandatory
- **Scroll Animations:** ≥ 30fps during scroll

### CPU Usage During Animations
- **Peak CPU Usage:** ≤ 80% during active animations
- **Sustained Usage:** ≤ 50% for background effects
- **Memory Growth:** ≤ 10MB during animation sequences

### Performance on Low-End Devices
- **iPhone 6s/Android equivalent:** Graceful degradation to 30fps
- **Reduced Motion Support:** Disable animations when `prefers-reduced-motion: reduce`
- **Low Memory Mode:** Disable background effects if memory < 2GB

## Memory Usage Constraints

### JavaScript Memory
- **Initial Page Load:** ≤ 15MB heap usage
- **Peak Usage:** ≤ 30MB during heavy interactions
- **Memory Leaks:** Zero tolerance for growing memory usage
- **Garbage Collection:** Avoid blocking GC pauses > 100ms

### Image Memory
- **Loaded Images:** ≤ 50MB total in memory
- **Lazy Loading:** Images outside viewport not loaded
- **Retina Assets:** Load appropriate resolution for device

## Special Effects Performance Budget

### Logo Effects
- **Animation Duration:** ≤ 2s initial load
- **CSS Keyframe Size:** ≤ 5KB for all logo animations
- **Performance Impact:** ≤ 200ms additional TTI

### Background Spinning Effects
- **Index/About Pages Only:** Enforced in code
- **Canvas/WebGL Usage:** Prefer CSS transforms when possible
- **Fallback Strategy:** Static background for poor performance
- **Resource Usage:** ≤ 20% CPU, ≤ 10MB memory

### Glassmorphism Effects
- **Backdrop Filter Support:** Required for full effect
- **Fallback Styling:** Solid background for unsupported browsers
- **Performance Impact:** ≤ 100ms additional render time

## Monitoring and Enforcement

### Automated Monitoring
- **Lighthouse CI:** Run on every deployment
- **Real User Monitoring:** Core Web Vitals tracking
- **Synthetic Testing:** Hourly checks on key pages
- **Performance Regression Alerts:** 10% degradation threshold

### Development Workflow
- **Pre-commit Hooks:** Bundle size analysis
- **Pull Request Checks:** Performance impact assessment
- **Staging Environment:** Full performance test suite
- **Production Validation:** Post-deployment verification

### Performance Testing Protocol

#### Weekly Performance Audit
1. Run Lighthouse on all 6 production pages
2. Test on slow 3G simulation
3. Verify Core Web Vitals compliance
4. Check memory usage patterns
5. Validate animation frame rates

#### Monthly Deep Analysis
1. Real User Monitoring data review
2. Bundle size trend analysis
3. Device-specific performance patterns
4. Regional performance variations
5. Special effects impact assessment

## Budget Violation Response

### Severity Levels

#### Critical (Production Blocker)
- Core Web Vitals in "Poor" range
- TTI > maximum acceptable thresholds
- Memory leaks or crashes
- **Response:** Immediate hotfix required

#### High (Next Release Priority)
- Bundle sizes exceed limits by >20%
- Animation frame rates below targets
- **Response:** Fix in next sprint

#### Medium (Technical Debt)
- Bundle sizes exceed limits by 10-20%
- Performance degradation trends
- **Response:** Plan optimization in next quarter

### Optimization Strategies

#### JavaScript Optimization
- Code splitting for non-critical features
- Tree shaking of unused SLDS components
- Async loading of diagnostic scripts
- Service worker caching for repeat visits

#### CSS Optimization
- Critical CSS inlining for above-fold content
- Unused CSS elimination
- CSS containment for isolated components
- Media query optimization

#### Asset Optimization
- Image format optimization (WebP, AVIF when supported)
- Responsive image sizing
- Lazy loading implementation
- CDN optimization

## Success Metrics and Reporting

### Key Performance Indicators
- **95th Percentile LCP:** ≤ 3.0s across all pages
- **Median FID:** ≤ 50ms
- **CLS Score:** ≤ 0.05 for 95% of page loads
- **Bounce Rate:** ≤ 40% (performance-related)

### Monthly Performance Report
- Core Web Vitals trend analysis
- Bundle size evolution
- Device/connection performance breakdown
- Special effects performance impact
- Optimization recommendations

### Quarterly Budget Review
- Adjust targets based on user behavior data
- Evaluate new performance opportunities
- Update testing protocols
- Review tool effectiveness

## Related Documentation
- [Technical Architecture Review](TECHNICAL_ARCHITECTURE_REVIEW.md)
- [ADR-001: Safe File Removal Strategy](adr/001-safe-file-removal-strategy.md)
- [Component Specification](COMPONENT_SPECIFICATION.md)

---
**Next Review:** 2025-04-18  
**Performance Contact:** Technical Architect  
**Monitoring Dashboard:** [Link to performance monitoring tools]