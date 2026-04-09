# Dimension 4: Accessibility Audit (WCAG 2.1 AA)

**Date**: 2026-04-09  
**Scope**: `dashboards/*.html`, `src/js/dashboards/*.js`, `src/css/`  
**Method**: Static analysis (pa11y unavailable — Chrome not installed)

---

## Issues Found

### P1 — Warnings (degrade experience)

**[P1] `help-search-status` div has no `aria-live` — geo-search status updates are silent to AT**  
Evidence: `dashboards/nonprofit-directory.html:210` — `<div id="help-search-status" style="color:...">` has no `aria-live` attribute. The JS at `src/js/dashboards/nonprofit-directory.js:194` writes status text into this container. Screen readers will not announce geocoding progress or error messages.  
Recommendation: Add `aria-live="polite"` and `aria-atomic="true"` to `#help-search-status`.

---

**[P1] `dashboard-tabs__tab` links have no `:focus-visible` outline**  
Evidence: `src/css/11-dashboards.css` — `.dashboard-metric-btn`, `.fred-toggle-btn`, `.dashboard-select`, and `.dashboard-search__input` all have explicit focus styles. The `.dashboard-tabs__tab` selector has no `:focus-visible` rule; the browser default may be suppressed by the nav reset (`*,*::before,*::after` in `main.css:13` and `.fnf-nav * { box-shadow:none }`).  
Recommendation: Add `.dashboard-tabs__tab:focus-visible { outline: 2px solid var(--fnf-secondary); outline-offset: 2px; }` to `src/css/11-dashboards.css`.

---

**[P1] `dashboard-back-btn` (map drill-down back button) has no `:focus-visible` style**  
Evidence: `src/css/11-dashboards.css:246-260` — `.dashboard-back-btn` defines only `:hover`. Button appears in `dashboards/food-insecurity.html:210` and `dashboards/food-access.html:190`. Keyboard users cannot see focus when drilling back to national map view.  
Recommendation: Add `.dashboard-back-btn:focus-visible { outline: 2px solid var(--fnf-secondary); outline-offset: 2px; }`.

---

### P2 — Info / Best Practice

**[P2] `dashboard-insights__card-title` uses `<div>` not a heading — heading hierarchy gap**  
Evidence: `dashboards/executive-summary.html:296`, `dashboards/food-insecurity.html:538`, and all other dashboard pages — card titles like "Grant Writers" and "Who This Helps" are `<div class="dashboard-insights__card-title">` rather than `<h3>`. Sections already have `<h2>` section headings, so these should be `<h3>` for correct hierarchy. Affects every dashboard.  
Recommendation: Change `<div class="dashboard-insights__card-title">` to `<h3 class="dashboard-insights__card-title">` across all dashboard pages.

---

**[P2] `<div id="chart-double-burden">` and `<div id="chart-double-burden-tiles">` use `role="region"` without `aria-label`**  
Evidence: `dashboards/food-access.html:362,364` — `role="region"` requires an accessible name (ARIA spec §4.3.4: landmark regions must be labelled when multiple exist on a page). Both containers lack `aria-label` or `aria-labelledby`.  
Recommendation: Add `aria-label="Treemap: double burden of low-income and low-access"` and `aria-label="Rate comparison: double burden by state"` respectively, or remove `role="region"` and use `role="img"` with an `aria-label` consistent with the other chart containers on the same page.

---

**[P2] Animated KPI counters set `aria-live="off"` during animation then switch to `aria-live="polite"` on completion — intermediate values will be announced if user navigates during animation**  
Evidence: `src/js/dashboards/shared/dashboard-utils.js:150,165` — `aria-live` toggled per-tick. This pattern is correct in intent but sets `role="status"` only on completion; during animation `role` is absent, so the live region type is inconsistent.  
Recommendation: Set `role="status"` and `aria-live="polite"` statically on `.dashboard-stat__number` elements in HTML, and only set `aria-atomic="true"` + suppress intermediate announcements by keeping `aria-live="off"` during the tick loop (already done). Remove the `setAttribute('role','status')` call from the tick completion — it creates a role change on a live element.

---

**[P2] `<nav class="fnf-nav__link">` — desktop nav links have no `:focus-visible` outline**  
Evidence: `src/css/03-navigation.css:51-60` — `.fnf-nav__link` has only `:hover` and `[aria-current="page"]` states. No `:focus-visible` rule. The `main.css:13` global transition suppressor (`animation-duration: 0.01ms`) does not add an outline.  
Recommendation: Add `.fnf-nav__link:focus-visible { outline: 2px solid var(--fnf-secondary); outline-offset: 2px; }` to `src/css/03-navigation.css`.

---

### P3 — Informational

**[P3] `title` tooltip on `dashboard-stat` divs is not accessible to keyboard/touch users**  
Evidence: `dashboards/executive-summary.html:169,173` — `<div class="dashboard-stat" title="State-level totals...">`. The `title` attribute is inaccessible to keyboard users and mobile users. The methodology context it provides is important.  
Recommendation: Move the tooltip content into the visible `dashboard-info__meta` block or add a `<details>`/visually-hidden `<p>` element.

---

## Passed Checks

- All `<main>` elements have `id="main-content"` and `tabindex="-1"` — skip link target is correct across all 8 dashboards.
- Every `<main>` is preceded by `<a href="#main-content" class="skip-link">`.
- All chart containers have `role="img"` with descriptive `aria-label` text.
- Dynamic insight containers use `aria-live="polite"` consistently across all dashboards.
- `role="alert"` on `#dashboard-error` is correctly hidden with `hidden` attribute until triggered.
- County search combobox (`food-insecurity.html:195`) has full ARIA pattern: `role="combobox"`, `aria-expanded`, `aria-autocomplete="list"`, `aria-controls`, and `aria-activedescendant` set correctly in JS (`food-insecurity.js:397,405`). Arrow key navigation, Enter selection, and Escape close all implemented.
- Dashboard map-view toggle buttons (`food-access.html:183-185`) have `aria-pressed` toggled correctly in JS (`food-access.js:574`).
- D3 heatmap breadcrumb spans have `role="button"`, `tabindex="0"`, `aria-label`, and `keydown` handler for Enter/Space (`d3-heatmap.js:366-371`).
- `prefers-reduced-motion` respected in CSS (`main.css:13`, `06-effects.css:113`, `03-navigation.css:231`) and in JS (`dashboard-utils.js:132`, `215`).
- All `<input>` elements in dashboards have `<label>` associations or `aria-label` attributes.
- `aria-current="page"` set correctly on active nav links and active dashboard tab in all dashboard pages.
- `role="group"` with `aria-label` on button-group containers (`food-access.html:181`, `food-insecurity.html:300`, `food-insecurity.html:343`).
- `role="note"` on data-notice divs provides appropriate landmark semantics.
- No heading levels are skipped on any dashboard page (h1 → h2 → h3 pattern is consistent).

---

## Summary

| Severity | Count |
|---|---|
| P1 | 3 |
| P2 | 4 |
| P3 | 1 |
| **Total** | **8** |

No P0 (blocking) issues found. The most impactful fixes are: (1) `aria-live` on the geo-search status container, (2) focus-visible outlines on dashboard tabs and back buttons, and (3) semantic heading elements for card titles.
