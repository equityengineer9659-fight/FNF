# Food-N-Force Product Knowledge v3.2

## 1. Design Framework & Guidelines

### SLDS Implementation
Leverage the Salesforce Lightning Design System (SLDS) throughout:
- Design tokens for colors, typography, spacing and elevation
- Utility classes (e.g. spacing, typography, sizing) for rapid, consistent styling
- Work WITH SLDS, not against it - avoid using !important unless absolutely necessary
- Use SLDS design tokens and utilities where possible
- When enhancing, extend SLDS components rather than override them
- CSS Grid can be used for specific layout needs (like forcing 3x2 grids)

### Design Restrictions
- Do not use Glassmorphism, Neumorphism, custom gradient backgrounds, or undertake any major visual overhauls
- Do not alter any existing words, text, icons, or case-study visuals under any circumstances
- **Approved Exceptions (Permanent Features)**:
  - Blue circular gradient backgrounds for icons are permitted and required
  - Logo special effects (CSS animations, gradients) are permitted for the F-n-F logo
  - Background spinning/mesh effects are permitted on index and about pages only
  - Controlled glassmorphism effects are permitted for navigation and hero sections when properly tested
  - **Note**: These approved effects, once implemented, must not be removed or altered

### Logo Design Standards
- The F-n-F CSS logo is the standard - maintain consistency across all pages
- Always check backup files for original design specifications
- Logo must have proper clearance from navigation elements
- Test logo visibility at all zoom levels (especially 25%)
- Document any logo modifications with before/after screenshots

## 2. Scope of Work

### Development Standards
- Apply clean-code principles, reusable components, semantic HTML, and modular CSS/JS
- Follow the latest SLDS guidelines for structure and accessibility
- Browser support requirements: IE11+, Chrome 15+, Firefox 10+, Safari 6+
- All enhancements must respect prefers-reduced-motion
- Use CSS Grid for precise layout control when SLDS flexbox isn't sufficient
- **NEW**: Implement systematic multi-page testing for all changes

### Reference Materials
- Base all changes on the existing project files and the most recent code-review feedback
- Ensure compatibility with current architecture, naming conventions, and styling patterns
- **NEW**: Always check backup files for original implementations before making changes

### Content Restrictions
- NEVER change emoji icons (they are intentionally chosen)
- NEVER alter text content
- NEVER rearrange sections
- NEVER change or remove the background spinning/mesh effects on index and about pages (approved special effect)
- Preserve all text content (mission statements, service descriptions, CTAs)
- Retain section order, container widths, spacing, and button styles
- Do not replace or relocate any icons, images, or client examples
- ONLY add CSS/JS enhancement references to HTML files when updating
- **NEW**: Maintain header spacing consistency across all pages

## 3. Technical Architecture

### File Structure Standards (Industry Standard)

**CRITICAL**: This project follows **industry-standard file structure** for static multi-page websites:

```
/
├── css/                    # Industry standard CSS folder (root level)
├── js/                     # Industry standard JavaScript folder (root level)
├── images/                 # Industry standard images folder (root level)
├── *.html                  # HTML pages in root
├── config/                 # Project configuration files
├── docs/                   # Documentation organized by purpose
└── tools/                  # Development and deployment utilities
```

**Key Principles**:
- **Root-level asset folders** (`css/`, `js/`, `images/`) for direct deployment
- **Simple HTML references**: `href="css/styles.css"`, `src="js/core/animations.js"`
- **Framework patterns** (`src/` folders) are for build-process projects, NOT direct-deployment sites
- **Clean root directory** with only HTML files and essential configuration

#### CSS Architecture:
- `css/styles.css` - Main styles and components
- `css/navigation-styles.css` - Navigation-specific styles
- `css/responsive-enhancements.css` - Responsive behavior
- `css/fnf-modules.css` - Modular CSS components
- **Special Effects Files** (when implemented):
  - `css/glassmorphism.css` - Navigation and hero glassmorphism effects
  - `css/spinning-background.css` - Index/about page background animations
  - `css/logo-animations.css` - F-n-F logo special effects

#### JavaScript Structure:
- `js/core/` - Essential functionality
  - `unified-navigation-refactored.js` - Core navigation system (adds body classes)
  - `slds-enhancements.js` - SLDS framework enhancements
  - `animations.js` - Core animation controllers
  - `fnf-*.js` - Consolidated modules (core, app, effects, performance)
- `js/effects/` - Special effects systems
  - `logo-optimization.js` - F-n-F logo animations (approved permanent feature)
  - `premium-effects-refactored.js` - Premium visual effects
  - `premium-background-effects.js` - Background animations (approved permanent feature)
  - `slds-cool-effects.js` - Additional SLDS enhancements
- `js/pages/` - Page-specific functionality
  - `about-page-unified.js`, `stats-counter-fix.js`, etc.
- `js/monitoring/` - Production diagnostics (keep in production for monitoring)
  - `navigation-height-diagnostic.js` - Navigation clearance monitoring
  - `services-diagnostic.js`, `impact-diagnostic.js` - Page-specific diagnostics
  - `responsive-validation.js` - Responsive behavior validation

### Icon Implementation
- The project uses emoji icons (💡, 📊, 📋, 📦, ⚙️, 💬, 🎓, etc.) instead of SLDS SVG icons
- This was an intentional design decision for CDN compatibility
- All icons must have blue circular gradient backgrounds
- Icon wrapper classes: `.icon-wrapper`, `.focus-area-icon`, `.service-icon`, `.resource-icon`, `.expertise-icon`, `.value-icon`

### Navigation Clearance Requirements
- Logo must have minimum 20px clearance from navigation elements
- Navigation z-index hierarchy must be documented
- Test navigation at all responsive breakpoints
- Ensure no overlap between logo and nav items at any screen size

## 4. Enhancement Phases

### Phase 1 Enhancements (Approved Approach)
- Subtle hover effects using SLDS shadows
- Smooth transitions on existing components
- Focus state improvements with SLDS tokens
- Navigation shadow on scroll
- Stats counter animations
- Icon rotation on hover
- Card lift effects
- **General Restrictions**:
  - NO glassmorphism or neumorphism (except as noted below)
  - NO custom gradients (except as noted below)
  - NO major visual overhauls (except as noted below)
- **Approved Special Effects** (Exceptions - Permanent once implemented):
  - **Logo Effects**: CSS animations, transforms, and gradients for F-n-F logo
  - **Background Effects**: Spinning mesh/iridescent effects on index and about pages
  - **Glassmorphism**: Permitted for navigation bar and hero sections with proper fallbacks
  - **Custom Gradients**: Allowed for icon backgrounds, logo, and approved background effects
  - **Note**: All special effects must be tested across browsers and include fallbacks
  - **IMPORTANT**: These effects, once implemented, are permanent features and must not be removed

### Phase 1.5: Diagnostic Implementation (MANDATORY)
Before any visual enhancements:
- Implement diagnostic tools if not present
- Create visual debugging utilities
- Add cascade order documentation
- Build conflict detection mechanisms
- Map all JavaScript style dependencies
- **NEW**: Add navigation clearance diagnostics
- **NEW**: Implement header spacing consistency checks

**Key Learning**: "Build diagnostic tools FIRST, fix problems SECOND"

## 5. Structural & Visual Consistency

### Cross-Page Consistency Requirements
- Maintain uniform navigation behavior and responsiveness across desktop and mobile
- Keep padding/margins, container widths, and grid layouts exactly as implemented
- Highlight any new SLDS components with clear notation (e.g., "New – SLDS Card," "New – Utility Class: slds-m-around_medium")
- **NEW**: Header spacing must be identical across all pages (measure and document)
- **NEW**: Logo position and size must be consistent on every page
- **NEW**: Test all pages together, not in isolation

### ⚠️ CRITICAL: Avoid Past Mistakes
- **NEVER** use setInterval to enforce styles
- **NEVER** add "just one more fix file" without consolidation plan  
- **NEVER** skip diagnostic phase when debugging
- **NEVER** remove or alter approved special effects (spinning backgrounds, glassmorphism, logo effects)
- **ALWAYS** check if problem is CSS before adding JavaScript
- **ALWAYS** document WHY a nuclear fix was needed
- **ALWAYS** test with all enhancement files disabled first
- **NEW**: **ALWAYS** check backup files before implementing fixes
- **NEW**: **ALWAYS** test navigation clearance at multiple zoom levels
- **NEW**: **ALWAYS** verify header spacing matches across pages

## 6. Output Expectations

### Code Delivery
- Provide all code updates as artifacts when possible
- Use complete files rather than snippets
- Maintain consistent file naming conventions
- Always provide the full file content, not just the changes
- If showing examples, use the EXACT emoji icons from the project
- **NEW**: Include before/after screenshots for visual changes
- **NEW**: Document cascade order for any new CSS files

### Failed Attempt Documentation
- Keep ALL failed attempts as .backup files
- Document WHY each approach failed
- Include timestamp and specific issue
- Example: `gap-enforcer-continuous.js.backup.js // Failed: JS shouldn't fix CSS`
- These prevent repeating mistakes
- **NEW**: Include diagnostic output in failure documentation

### Change Justification Format
Every change must include:
```css
/* WHY: [Explain the problem this solves]
   WHAT: [What this code does]
   DEPENDS: [Any JS or other CSS this requires]
   OVERRIDES: [What this might break]
   TESTED: [Which pages/breakpoints were tested]
   CASCADE: [Position in CSS load order]
*/
```

### Documentation Standards
- Submit changes incrementally, each with a concise, descriptive Git commit message
- Provide a brief changelog summarizing:
  - New SLDS components or utilities introduced
  - Code refactors or structure optimizations
  - Any adjustments to compliance or accessibility
  - **NEW**: Multi-page impact assessment
  - **NEW**: Responsive breakpoint testing results
  - **NEW**: Cascade order changes

## 7. Technical Constraints & Lessons Learned

### CSS Specificity Battles
- SLDS has high specificity - design enhancements to complement, not override
- Multiple CSS files create cascade conflicts - document load order matters
- `slds-dark-theme-fixes.css` often contains the "final word" on styling
- Inline styles with `!important` can still be overridden by subsequent inline styles
- CSS Grid and Flexbox conflicts are common with SLDS classes
- **NEW**: Navigation CSS requires special attention due to z-index layering
- **NEW**: Logo styles may need isolation to prevent cascade conflicts

### JavaScript Timing Issues
- Body classes are automatically added by `unified-navigation.js` (e.g., services-page, about-page)
- Multiple scripts can conflict when modifying the same elements
- Script execution order matters - later scripts can override earlier ones
- MutationObservers can cause infinite loops if not carefully implemented
- Always check if elements exist before applying modifications
- **NEW**: Navigation scripts must complete before logo positioning

### Grid Layout Challenges
- The services page requires CSS Grid to achieve 3x2 layout due to SLDS flexbox limitations
- SLDS classes like `slds-wrap` force flexbox behavior and prevent CSS Grid gaps
- Different sections may have different HTML structures even if they look similar
- The `gap` property doesn't work with flexbox in older browsers
- `display: contents` can be used to make wrapper elements "invisible" to layout
- **NEW**: Header spacing must account for different content lengths

### The Nuclear Fix Protocol
When standard approaches fail:
1. **Document the standard attempt** (what should work)
2. **Try targeted override** (specific selectors)
3. **Implement diagnostic** (why isn't it working?)
4. **Check backup files** for original implementation
5. **Nuclear option** (ultra-specific + !important)
6. **Schedule refactor** (mark as technical debt)
7. **Test across all pages** (not just the problem page)

**Remember**: Nuclear fixes are temporary. They indicate architectural issues.

### Animation System Rules
- ONE animation controller per feature
- Central state management required
- Naming convention: `fnf-anim-[feature]-[state]`
- All animations must respect prefers-reduced-motion
- Document timing dependencies
- **NEW**: Navigation animations must not affect logo position

### Testing Requirements
- Always test at multiple zoom levels (especially 25% as requested by client)
- Check computed styles in DevTools, not just CSS files
- Verify changes work across all page types (index, services, resources, about, etc.)
- Test responsive behavior at tablet and mobile breakpoints
- **NEW**: Multi-page visual regression testing
- **NEW**: Navigation clearance testing at all breakpoints
- **NEW**: Header spacing consistency validation
- **Special Effects Testing**:
  - Glassmorphism fallbacks in Safari/Firefox
  - Spinning background performance on mobile devices
  - Logo animation smoothness at different frame rates
  - Dark theme compatibility with all effects
  - Reduced motion preference compliance
  - CPU/GPU usage monitoring for animations

### Common Pitfalls
- Icon backgrounds must be forced with `!important` due to existing style conflicts
- `premium-effects.js` is known to interfere with CSS styles
- Focus Area and Measurable Growth sections have different HTML structures
- SLDS utility classes can unexpectedly override custom styles
- Never assume similar-looking components have the same underlying structure
- **NEW**: Logo positioning can be affected by navigation CSS changes
- **NEW**: Header spacing varies if not explicitly controlled
- **Special Effects Pitfalls**:
  - Glassmorphism can break in Safari without -webkit prefix
  - Spinning backgrounds can cause performance issues on mobile
  - Logo animations may need z-index adjustments
  - Always test special effects with dark theme enabled
  - **CRITICAL**: Never remove or disable approved special effects once implemented

### File Structure Lessons Learned (2025)
- **Static websites** require different structure than **framework applications**
- **Root-level folders** (`css/`, `js/`, `images/`) are industry standard for direct deployment
- **Framework patterns** (`src/` folders) add unnecessary complexity without build processes
- **Developer expectations** strongly favor standard web project structure
- **Deployment platforms** (Netlify, GitHub Pages) expect and optimize for standard structure
- **Browser performance** is better with shorter, predictable paths
- **HTML references** should be simple: `href="css/styles.css"` not `href="src/styles/styles.css"`

## 8. Debugging Workflow

### When Styles Aren't Applying:
1. Check if the CSS file is loaded
2. Verify selector specificity
3. Check computed styles in DevTools
4. Look for inline styles overriding CSS
5. Check for JavaScript applying styles after page load
6. Verify the HTML structure matches your selectors
7. **NEW**: Check backup files for working implementations
8. **NEW**: Run diagnostic tools to map cascade order

### When Layouts Break:
1. Check for conflicting display properties (grid vs flex)
2. Verify SLDS classes aren't forcing unexpected behavior
3. Look for JavaScript modifying the DOM structure
4. Check responsive breakpoints
5. Test with enhancement files disabled to find conflicts
6. **NEW**: Compare with other pages that work correctly
7. **NEW**: Check navigation z-index hierarchy

### Best Practices:
- Start with minimal changes and build up
- Disable enhancement files when troubleshooting to find root cause
- Use diagnostic console scripts to understand actual DOM/style state
- Document which files modify which elements
- Keep track of CSS cascade order
- **NEW**: Always compare changes across all pages
- **NEW**: Screenshot before making changes
- **NEW**: Use version control for incremental changes

## 9. Project-Specific Fixes

### Known Issues and Solutions:
- **Gap spacing**: SLDS classes can override gap properties; may need to target exact class combinations
- **Card heights**: Use min-height instead of height for flexible content
- **Icon styling**: Always use blue gradient background with proper border-radius
- **Grid layouts**: Remove SLDS flex-forcing classes when using CSS Grid
- **Logo clearance**: Ensure minimum spacing from navigation elements
- **Header consistency**: Use explicit spacing values, not relative units

### Lesson-Learned Fixes
Based on v1-v3 evolution:

**Gap Spacing Issues**:
- Root cause: SLDS flexbox vs CSS Grid conflict
- Wrong fix: JS enforcement every second
- Right fix: Remove SLDS flex classes, use pure CSS Grid
- Diagnostic: Check computed display property

**Icon Background Persistence**:
- Root cause: Multiple cascade layers
- Wrong fix: Inline styles
- Right fix: Ultra-specific selector in final override file
- Prevention: Single source of truth for icon styles

**Animation Conflicts**:
- Root cause: Multiple controllers
- Wrong fix: Disable competing animations
- Right fix: Single animation orchestrator
- Pattern: `AnimationManager.register()` for all animations

**Navigation Clearance** (NEW):
- Root cause: CSS cascade and z-index conflicts
- Wrong fix: Inline positioning styles
- Right fix: Dedicated navigation spacing rules
- Prevention: Test at multiple zoom levels

**Header Spacing Consistency** (NEW):
- Root cause: Inconsistent margin/padding values
- Wrong fix: Page-specific overrides
- Right fix: Global header spacing variables
- Prevention: Multi-page testing protocol

### File Dependencies:
- Navigation files must load before page-specific scripts
- Dark theme fixes should be one of the last CSS files
- Enhancement scripts should run after DOM is ready
- Focus area and measurable growth fixes need specific timing
- **NEW**: Logo styles must load after navigation base styles
- **NEW**: Diagnostic tools should load early for monitoring

### Special Effects Implementation Guidelines (NEW)
**IMPORTANT**: These approved special effects, once implemented, are permanent features and must not be removed or altered.

When implementing approved special effects:

**Logo Effects**:
- Must maintain readability at all zoom levels
- Should not interfere with navigation functionality
- Fallback to static logo for reduced motion preference
- Test clearance with spinning/animated states
- Once implemented, preserve the effect as designed

**Background Spinning Effects**:
- Only on index and about pages
- Must not affect content readability
- Include performance optimization (requestAnimationFrame)
- Provide static fallback for older browsers
- Test on low-end devices for performance
- **This is a permanent approved feature - do not remove or modify**

**Glassmorphism Implementation**:
- Use backdrop-filter with -webkit prefix
- Always provide solid color fallback
- Test contrast ratios for accessibility
- Limit to navigation and hero sections only
- Once applied, maintain the glassmorphism effect
- Example:
```css
.navbar {
    background: rgba(22, 50, 92, 0.95);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}
/* Fallback for unsupported browsers */
@supports not (backdrop-filter: blur(10px)) {
    .navbar {
        background: rgba(22, 50, 92, 0.98);
    }
}
```

## 10. Version Control & Rollback Strategy

### Before Making Changes:
- Document current working state
- Identify which files will be modified
- Plan rollback strategy
- Test in isolated environment if possible
- **NEW**: Create visual screenshots of current state
- **NEW**: Note current cascade order

### When Issues Arise:
- Disable recent changes first
- Check browser console for errors
- Use git to revert if necessary
- Document what caused the issue for future reference
- **NEW**: Compare with backup files
- **NEW**: Run diagnostic tools to identify conflicts

## 11. Pre-Development Checklist

### Before Making ANY Changes:
1. **Run Diagnostic Tools First**
   - Execute css-diagnostic-tools.js to map current cascade
   - Run grid-diagnostic.js to understand layout state
   - Document which styles are "winning" in DevTools
   - Save diagnostic output as baseline
   - **NEW**: Check navigation clearance measurements
   - **NEW**: Document header spacing values

2. **Check for JavaScript Style Dependencies**
   - Search codebase for any `.style` setters
   - Look for classList modifications
   - Document any JS-dependent selectors
   - NEVER use JS to fix CSS problems
   - **NEW**: Map navigation-related scripts

3. **Identify Potential Conflicts**
   - List all files that target the same elements
   - Note current specificity levels
   - Plan your specificity strategy BEFORE coding
   - Remember: SLDS has high specificity by design
   - **NEW**: Check multi-page implications
   - **NEW**: Review backup files for context

4. **Visual Baseline** (NEW)
   - Screenshot all pages at standard zoom
   - Screenshot at 25% zoom (client requirement)
   - Document current logo position
   - Measure header spacing
   - Note navigation clearances

5. **Special Effects Checklist** (When implementing approved effects)
   - Verify effect is on approved list
   - Check performance impact baseline
   - Test browser compatibility
   - Prepare static fallbacks
   - Document z-index requirements
   - Test with dark theme enabled

## 12. Project Organization & Consolidation Guidelines

### Clean Codebase Principles (2025)
- **Root directory** should contain only HTML files and essential configuration
- **Configuration files** belong in dedicated `/config/` directory
- **Documentation** should be organized by purpose (`/docs/technical/`, `/docs/project/`, `/docs/history/`)
- **Development tools** separate from production code (`/tools/`)
- **File proliferation** during troubleshooting requires regular cleanup to prevent technical debt
- **Professional appearance** affects developer confidence and project perception

### When to Consolidate Files
- More than 3 "fix" files for same feature = architectural problem
- Similar selectors across multiple files = consolidate
- JS and CSS fighting = redesign approach
- Diagnostic shows cascade conflicts = simplify
- **NEW**: Navigation fixes spread across files = consolidate
- **NEW**: Logo styles in multiple places = unify
- **File accumulation** in root directory = reorganization needed

### Consolidation Process
1. **Map Dependencies**: Use diagnostic tools
2. **Identify Patterns**: Find repeated fixes
3. **Design Solution**: Address root cause, not symptoms
4. **Test Incrementally**: One section at a time
5. **Document Rationale**: Why this approach wins
6. **Multi-Page Validation**: Test on all pages
7. **Backup Original**: Keep working version accessible
8. **Question Assumptions**: Verify structure matches project type and deployment method

### File Evolution Pattern
Expected lifecycle:
- v1: Simple, monolithic (1-2 files)
- v2: Feature explosion (many files)
- v3: Understanding emerges (diagnostic phase)
- v4: Intelligent consolidation (2-3 core files)
- v5: Refined simplicity (documented architecture)
- v6: Industry-standard structure (professional, maintainable)
- **NEW**: v7: Ultra-clean organization (optimized for long-term success)

## 13. Technical Decision Making & Architecture Analysis (NEW)

### Critical Decision Framework
When making structural or architectural decisions:

1. **Question Framework Assumptions**
   - Just because something is "modern" doesn't mean it's right for every project
   - Verify that patterns match the actual project type and deployment method
   - Consider whether complexity is justified by benefits

2. **Match Structure to Deployment Method**
   - **Direct deployment** = simple, standard structure (`css/`, `js/`, `images/`)
   - **Build process projects** = complex structure with `src/` folders acceptable
   - **Static multi-page sites** ≠ **Single Page Applications** (different patterns)

3. **Industry Analysis is Critical**
   - Check what deployment platforms (Netlify, GitHub Pages) actually recommend
   - Review MDN and W3C guidelines for the specific project type
   - Consider what web developers expect based on industry standards

4. **Developer Experience Considerations**
   - Structure should be immediately recognizable to team members
   - New developers should feel confident navigating the project
   - Onboarding time should be minimized through familiar patterns

5. **Long-term Maintenance Impact**
   - How will this decision affect future development?
   - Does it support or hinder scaling and optimization?
   - Will it require more documentation or training?

### Architecture Evolution Insights
- **Professional appearance** through structure affects stakeholder confidence
- **Multi-agent collaboration** enables comprehensive analysis and safer implementations
- **Incremental migration** with testing prevents regression while enabling improvements
- **User feedback integration** is essential for catching architectural mistakes early

## 14. Quality Assurance Protocol (NEW)

### Multi-Page Testing Checklist
- [ ] Test change on ALL 6 pages (index, about, services, resources, impact, contact)
- [ ] Verify at standard zoom (100%)
- [ ] Verify at client zoom (25%)
- [ ] Check mobile responsiveness
- [ ] Validate navigation clearance
- [ ] Confirm header spacing consistency
- [ ] Test in Chrome, Firefox, Safari
- [ ] Document any page-specific variations
- [ ] **Special Effects Validation** (if applicable):
  - [ ] Glassmorphism renders correctly with fallbacks
  - [ ] Background animations perform smoothly
  - [ ] Logo effects don't break layout
  - [ ] Dark theme compatibility verified
  - [ ] Reduced motion preference respected

### Visual Regression Testing
- Before/after screenshots required
- Use consistent browser and zoom level
- Document any intentional changes
- Flag any unintended side effects
- Archive screenshots with version numbers

### Performance Validation
- Page load time should not increase
- No new console errors
- CSS file size within limits
- JavaScript execution time acceptable
- No layout shift issues
- **Special Effects Performance**:
  - Background animations < 60fps warning threshold
  - GPU acceleration properly utilized
  - Memory usage remains stable
  - No jank on scroll with effects active

## 15. Emergency Response Procedures (NEW)

### When Production Breaks
1. **Immediate**: Revert to last known good version
2. **Diagnose**: Run diagnostic tools
3. **Isolate**: Disable enhancement files one by one
4. **Document**: What broke and why
5. **Fix Forward**: Apply targeted solution
6. **Test**: Full multi-page validation
7. **Deploy**: With extra monitoring

### Backup Recovery Process
1. Locate relevant .backup files
2. Compare with broken implementation
3. Extract working code sections
4. Test in isolation first
5. Integrate carefully
6. Document the recovery

This document represents the accumulated wisdom from the Food-N-Force project journey. Following these guidelines will help maintain a stable, beautiful, and functional website while avoiding the pitfalls discovered along the way.