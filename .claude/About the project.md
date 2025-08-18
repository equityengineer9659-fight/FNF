# Food-N-Force Product Knowledge v3.0

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
- Exception: Blue circular gradient backgrounds for icons are permitted and required

## 2. Scope of Work

### Development Standards
- Apply clean-code principles, reusable components, semantic HTML, and modular CSS/JS
- Follow the latest SLDS guidelines for structure and accessibility
- Browser support requirements: IE11+, Chrome 15+, Firefox 10+, Safari 6+
- All enhancements must respect prefers-reduced-motion
- Use CSS Grid for precise layout control when SLDS flexbox isn't sufficient

### Reference Materials
- Base all changes on the existing project files and the most recent code-review feedback
- Ensure compatibility with current architecture, naming conventions, and styling patterns

### Content Restrictions
- NEVER change emoji icons (they are intentionally chosen)
- NEVER alter text content
- NEVER rearrange sections
- Preserve all text content (mission statements, service descriptions, CTAs)
- Retain section order, container widths, spacing, and button styles
- Do not replace or relocate any icons, images, or client examples
- ONLY add CSS/JS enhancement references to HTML files when updating

## 3. Technical Architecture

### File Structure

#### CSS Architecture:
- `styles.css` - Main styles and components
- `navigation-styles.css` - Navigation-specific styles
- `navigation-fixes.css` - SLDS compatibility fixes for navigation
- `slds-enhancements.css` - Core SLDS enhancements
- `slds-dark-theme.css` - Dark theme base styling
- `slds-dark-theme-fixes.css` - Dark theme override fixes (HIGH SPECIFICITY - handles conflicts)
- `animations.css` - Animation definitions
- `premium-effects.css` - Premium visual effects
- `slds-cool-effects.css` - Additional visual enhancements

#### JavaScript Structure:
- `unified-navigation.js` - Core navigation and animations (adds body classes like services-page)
- `slds-enhancements.js` - Additional enhancement interactions
- `animations.js` - Animation controllers
- `premium-effects.js` - Premium effect controllers (KNOWN TO INTERFERE - handle with care)
- `slds-cool-effects.js` - Cool effect controllers
- `focus-area-fix.js` - Focus area card styling fixes
- `measurable-growth-fix.js` - Measurable growth card fixes

### Icon Implementation
- The project uses emoji icons (💡, 📊, 📋, 📦, ⚙️, 💬, 🎓, etc.) instead of SLDS SVG icons
- This was an intentional design decision for CDN compatibility
- All icons must have blue circular gradient backgrounds
- Icon wrapper classes: `.icon-wrapper`, `.focus-area-icon`, `.service-icon`, `.resource-icon`, `.expertise-icon`, `.value-icon`

## 4. Enhancement Phases

### Phase 1 Enhancements (Approved Approach)
- Subtle hover effects using SLDS shadows
- Smooth transitions on existing components
- Focus state improvements with SLDS tokens
- Navigation shadow on scroll
- Stats counter animations
- Icon rotation on hover
- Card lift effects
- NO glassmorphism or neumorphism (not SLDS-compatible)
- NO custom gradients (except for icon backgrounds)
- NO major visual overhauls

### Phase 1.5: Diagnostic Implementation (MANDATORY)
Before any visual enhancements:
- Implement diagnostic tools if not present
- Create visual debugging utilities
- Add cascade order documentation
- Build conflict detection mechanisms
- Map all JavaScript style dependencies

**Key Learning**: "Build diagnostic tools FIRST, fix problems SECOND"

## 5. Structural & Visual Consistency
- Maintain uniform navigation behavior and responsiveness across desktop and mobile
- Keep padding/margins, container widths, and grid layouts exactly as implemented
- Highlight any new SLDS components with clear notation (e.g., "New – SLDS Card," "New – Utility Class: slds-m-around_medium")

### ⚠️ CRITICAL: Avoid Past Mistakes
- **NEVER** use setInterval to enforce styles
- **NEVER** add "just one more fix file" without consolidation plan  
- **NEVER** skip diagnostic phase when debugging
- **ALWAYS** check if problem is CSS before adding JavaScript
- **ALWAYS** document WHY a nuclear fix was needed
- **ALWAYS** test with all enhancement files disabled first

## 6. Output Expectations

### Code Delivery
- Provide all code updates as artifacts when possible
- Use complete files rather than snippets
- Maintain consistent file naming conventions
- Always provide the full file content, not just the changes
- If showing examples, use the EXACT emoji icons from the project

### Failed Attempt Documentation
- Keep ALL failed attempts as .backup files
- Document WHY each approach failed
- Include timestamp and specific issue
- Example: `gap-enforcer-continuous.js.backup.js // Failed: JS shouldn't fix CSS`
- These prevent repeating mistakes

### Change Justification Format
Every change must include:
```css
/* WHY: [Explain the problem this solves]
   WHAT: [What this code does]
   DEPENDS: [Any JS or other CSS this requires]
   OVERRIDES: [What this might break]
*/
```

### Documentation
- Submit changes incrementally, each with a concise, descriptive Git commit message
- Provide a brief changelog summarizing:
  - New SLDS components or utilities introduced
  - Code refactors or structure optimizations
  - Any adjustments to compliance or accessibility

## 7. Technical Constraints & Lessons Learned

### CSS Specificity Battles
- SLDS has high specificity - design enhancements to complement, not override
- Multiple CSS files create cascade conflicts - document load order matters
- `slds-dark-theme-fixes.css` often contains the "final word" on styling
- Inline styles with `!important` can still be overridden by subsequent inline styles
- CSS Grid and Flexbox conflicts are common with SLDS classes

### JavaScript Timing Issues
- Body classes are automatically added by `unified-navigation.js` (e.g., services-page, about-page)
- Multiple scripts can conflict when modifying the same elements
- Script execution order matters - later scripts can override earlier ones
- MutationObservers can cause infinite loops if not carefully implemented
- Always check if elements exist before applying modifications

### Grid Layout Challenges
- The services page requires CSS Grid to achieve 3x2 layout due to SLDS flexbox limitations
- SLDS classes like `slds-wrap` force flexbox behavior and prevent CSS Grid gaps
- Different sections may have different HTML structures even if they look similar
- The `gap` property doesn't work with flexbox in older browsers
- `display: contents` can be used to make wrapper elements "invisible" to layout

### The Nuclear Fix Protocol
When standard approaches fail:
1. **Document the standard attempt** (what should work)
2. **Try targeted override** (specific selectors)
3. **Implement diagnostic** (why isn't it working?)
4. **Nuclear option** (ultra-specific + !important)
5. **Schedule refactor** (mark as technical debt)

**Remember**: Nuclear fixes are temporary. They indicate architectural issues.

### Animation System Rules
- ONE animation controller per feature
- Central state management required
- Naming convention: `fnf-anim-[feature]-[state]`
- All animations must respect prefers-reduced-motion
- Document timing dependencies

### Testing Requirements
- Always test at multiple zoom levels (especially 25% as requested by client)
- Check computed styles in DevTools, not just CSS files
- Verify changes work across all page types (index, services, resources, about, etc.)
- Test responsive behavior at tablet and mobile breakpoints

### Common Pitfalls
- Icon backgrounds must be forced with `!important` due to existing style conflicts
- `premium-effects.js` is known to interfere with CSS styles
- Focus Area and Measurable Growth sections have different HTML structures
- SLDS utility classes can unexpectedly override custom styles
- Never assume similar-looking components have the same underlying structure

## 8. Debugging Workflow

### When Styles Aren't Applying:
1. Check if the CSS file is loaded
2. Verify selector specificity
3. Check computed styles in DevTools
4. Look for inline styles overriding CSS
5. Check for JavaScript applying styles after page load
6. Verify the HTML structure matches your selectors

### When Layouts Break:
1. Check for conflicting display properties (grid vs flex)
2. Verify SLDS classes aren't forcing unexpected behavior
3. Look for JavaScript modifying the DOM structure
4. Check responsive breakpoints
5. Test with enhancement files disabled to find conflicts

### Best Practices:
- Start with minimal changes and build up
- Disable enhancement files when troubleshooting to find root cause
- Use diagnostic console scripts to understand actual DOM/style state
- Document which files modify which elements
- Keep track of CSS cascade order

## 9. Project-Specific Fixes

### Known Issues and Solutions:
- **Gap spacing**: SLDS classes can override gap properties; may need to target exact class combinations
- **Card heights**: Use min-height instead of height for flexible content
- **Icon styling**: Always use blue gradient background with proper border-radius
- **Grid layouts**: Remove SLDS flex-forcing classes when using CSS Grid

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

### File Dependencies:
- Navigation files must load before page-specific scripts
- Dark theme fixes should be one of the last CSS files
- Enhancement scripts should run after DOM is ready
- Focus area and measurable growth fixes need specific timing

## 10. Version Control & Rollback Strategy

### Before Making Changes:
- Document current working state
- Identify which files will be modified
- Plan rollback strategy
- Test in isolated environment if possible

### When Issues Arise:
- Disable recent changes first
- Check browser console for errors
- Use git to revert if necessary
- Document what caused the issue for future reference

## 11. Pre-Development Checklist

### Before Making ANY Changes:
1. **Run Diagnostic Tools First**
   - Execute css-diagnostic-tools.js to map current cascade
   - Run grid-diagnostic.js to understand layout state
   - Document which styles are "winning" in DevTools
   - Save diagnostic output as baseline

2. **Check for JavaScript Style Dependencies**
   - Search codebase for any `.style` setters
   - Look for classList modifications
   - Document any JS-dependent selectors
   - NEVER use JS to fix CSS problems

3. **Identify Potential Conflicts**
   - List all files that target the same elements
   - Note current specificity levels
   - Plan your specificity strategy BEFORE coding
   - Remember: SLDS has high specificity by design

## 12. Consolidation Guidelines

### When to Consolidate Files
- More than 3 "fix" files for same feature = architectural problem
- Similar selectors across multiple files = consolidate
- JS and CSS fighting = redesign approach
- Diagnostic shows cascade conflicts = simplify

### Consolidation Process
1. **Map Dependencies**: Use diagnostic tools
2. **Identify Patterns**: Find repeated fixes
3. **Design Solution**: Address root cause, not symptoms
4. **Test Incrementally**: One section at a time
5. **Document Rationale**: Why this approach wins

### File Evolution Pattern
Expected lifecycle:
- v1: Simple, monolithic (1-2 files)
- v2: Feature explosion (many files)
- v3: Understanding emerges (diagnostic phase)
- v4: Intelligent consolidation (2-3 core files)
- v5: Refined simplicity (documented architecture)