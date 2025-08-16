# CSS Cleanup Documentation - Food-N-Force
## Pre-Phase Documentation - Current State

### Date: 2024
### Total Issues Found:
- 26 CSS conflicts
- 24 duplicate rules  
- 433 unused selectors
- 110 JavaScript style manipulations

### CSS Cascade Order (Loading Sequence):
1. SLDS Framework (base)
2. styles.css (main styles)
3. navigation-styles.css
4. slds-enhancements.css
5. animations.css
6. premium-effects.css (⚠️ known interferer)
7. slds-dark-theme.css
8. slds-cool-effects.css
9. slds-dark-theme-fixes.css (🔴 FINAL OVERRIDE - highest priority)
10. focus-area-override.css

### Critical Conflicts to Fix:
1. `.stat-label` - color (4 conflicting values)
2. `.stat-item` - margin (2 conflicting values)
3. `.floating-cta-button` - padding (2 conflicting values)
4. `a:hover` - color (2 conflicting values)
5. `.mission-text` - font-size (2 conflicting values)
6. `.hero-section::before` - background (2 conflicting values)
7. `.hero-subtitle` - font-size (2 conflicting values)
8. `.slds-button_outline-brand:hover` - color (2 conflicting values)
9. `.stat-number` - font-size & color (2 conflicting values each)

### Protected Selectors (DO NOT DELETE):
#### Icon Wrappers:
- `.icon-wrapper`
- `.focus-area-icon`
- `.service-icon`
- `.resource-icon`
- `.expertise-icon`
- `.value-icon`

#### Body Classes (from unified-navigation.js):
- `.services-page`
- `.about-page`
- `.contact-page`
- `.impact-page`
- `.resources-page`

#### JS-Dependent Classes:
- Animation classes (`.fade-in`, `.slide-up`, `.animate`)
- State classes (`.is-*`, `.has-*`, `.js-*`)
- Premium effect classes (`.premium-*`, `.effect-*`)
- Theme classes (`.dark-mode`, `.light-mode`)

### Known Issues:
- `premium-effects.js` interferes with CSS styles
- Multiple scripts modify same elements causing timing conflicts
- SLDS has high specificity requiring careful override strategy
- `slds-dark-theme-fixes.css` must remain as final override file

### Backup Created:
- All CSS files backed up before modifications
- Original analysis report exported as JSON
- This documentation serves as rollback reference

---

## Phase Progress Tracking

### Phase 1: Critical CSS Conflicts
- [ ] Fix `.stat-label` color conflict
- [ ] Fix `.floating-cta-button` padding conflict  
- [ ] Fix `.stat-number` font-size conflict
- [ ] Test at 25% zoom level
- [ ] Verify with diagnostic tool

### Phase 2: Duplicate Rules
- [ ] Consolidate 24 duplicate rules
- [ ] Preserve slds-dark-theme-fixes.css overrides
- [ ] Document which file kept for each rule

### Phases 3-6: Unused Selectors
- [ ] Batch 1: Review first 100 selectors
- [ ] Batch 2: Review selectors 101-200
- [ ] Batch 3: Review selectors 201-300
- [ ] Batch 4: Review remaining selectors
- [ ] Skip all protected selectors listed above

### Phase 7: JavaScript Style Review
- [ ] Review 110 inline style manipulations
- [ ] Identify timing conflicts
- [ ] Convert frequent patterns to CSS classes

### Phase 8: File Organization
- [ ] Plan consolidated structure
- [ ] Maintain SLDS compatibility
- [ ] Preserve cascade order importance