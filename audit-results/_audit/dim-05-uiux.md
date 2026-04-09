# Dimension 5 — UI/UX Visual Consistency Audit
**Date**: 2026-04-09
**Scope**: dashboards/*.html, src/js/dashboards/*.js, src/css/11-dashboards.css
**Method**: Static analysis only

---

## Issues Found

**[P2] nonprofit-directory.html:149,153 — Hero counters use `data-format` attribute not recognised by `animateCounters()`**
Evidence: `animateCounters()` in `src/js/dashboards/shared/dashboard-utils.js:128-170` reads only `data-target`, `data-suffix`, and `data-prefix`. `dashboards/nonprofit-directory.html:149` uses `data-format="thousand"` and `data-format="plus"` with `data-target="60"` / `data-target="50"`. The static fallback text ("60K+" / "50+") is correct at page load, but the counter animation will rewrite them to "60" and "50" (raw numbers), losing the "K+" and "+" suffixes during and after animation.
Recommendation: Either add `data-suffix="K+"` / `data-suffix="+"` to these elements alongside removing `data-format`, or extend `animateCounters()` to handle `data-format`. The static text also needs `data-target` set to the already-formatted string or the HTML string fallback needs to match the animated output.

---

**[P2] executive-summary.js:159 — Legend text color uses `COLORS.textMuted` (65% opacity white) instead of `COLORS.text` (full white) used in all other dashboards**
Evidence: `src/js/dashboards/executive-summary.js:159`: `textStyle: { color: COLORS.textMuted }`. Every other dashboard legend uses `COLORS.text` (`#ffffff`): food-insecurity.js:494, food-access.js:271, snap-safety-net.js:107, food-banks.js:219, food-prices.js:767, nonprofit-profile.js:564. The SNAP coverage gap bar chart legend in the executive-summary dashboard will render noticeably dimmer than all other dashboards.
Recommendation: Change line 159 to `textStyle: { color: COLORS.text }` to match the system-wide convention.

---

**[P2] snap-safety-net.html:364-376 — KPI gauge containers use inline `style="height:200px"` without `min-height`, making them collapse to ~0px below 360px viewport width**
Evidence: `dashboards/snap-safety-net.html:364-376`: five gauge `<div>` elements set `style="height:200px"` only. The CSS rule in `src/css/11-dashboards.css:990-998` reduces `.dashboard-chart` to `height:220px; min-height:180px` at 360px, but inline styles override this. At 360px a 200px height is fine, however the inline style blocks the responsive CSS from applying `min-height`, which could cause ECharts to render into a 0-height container if any parent compresses the layout.
Recommendation: Move gauge heights to the CSS using a `.dashboard-chart--gauge` class or add `min-height:160px` alongside the inline height.

---

**[P3] Legend font sizes are inconsistent across dashboards — mix of implicit default, 10px, and 11px**
Evidence: `food-prices.js:49`: `fontSize: 10`; `food-access.js:401`: `fontSize: 11`; `food-banks.js:357`: `fontSize: 11`; `snap-safety-net.js:107`: no fontSize (ECharts default ~12px); `food-insecurity.js:494`: no fontSize. Charts in the same product toggle between visibly different legend text sizes.
Recommendation: Standardise on `fontSize: 11` across all legend `textStyle` blocks, or add a `LEGEND_TEXT_STYLE` constant to `dashboard-utils.js` and import it.

---

**[P3] Grid `containLabel` applied inconsistently — long state-name labels clip on some charts**
Evidence: `containLabel: true` present in: `executive-summary.js:162,239`; `food-access.js` (not set on line 272, 332, 418). `food-insecurity.js:789`: `grid: { left: 110, right: 40... }` compensates manually with wide left margin. `food-banks.js:100`: `left: 100`. Charts that compensate manually are brittle if label text changes; charts without either approach will clip at narrow widths.
Recommendation: Add `containLabel: true` to all chart grids and remove the manually inflated `left` values, or document the chosen approach consistently.

---

**[P3] `chart-snap-trend` and most non-map, non-special chart containers have no ID-specific height override in CSS — rely solely on the `.dashboard-chart` default (400px desktop / 300px mobile)**
Evidence: `src/css/11-dashboards.css:496-500`: `.dashboard-chart { height: 400px; min-height: 300px }`. Specific overrides exist only for `#chart-bar`, `#chart-burden`, `#chart-efficiency`, `#chart-meal-cost` (520px). The income river chart in food-insecurity.html uses an inline style (`style="min-height:350px; height:50vh; max-height:600px"`) for more nuanced control. The SNAP trend chart and Food Prices category chart do not have overrides and may feel cramped relative to the richer charts that do.
Recommendation: Add a `.dashboard-chart--tall { height: 480px; }` modifier class for charts that benefit from more vertical space (trend lines, theme rivers), applied via HTML rather than inline styles.

---

## Visual Consistency — Pass

- Color palette (`COLORS`, `MAP_PALETTES`) centralised in `dashboard-utils.js` and uniformly imported across all 7 dashboard JS files. No hard-coded hex values in chart config except `LOW_ACCESS_COLOR` in food-insecurity.js (which is a locally-scoped constant for a specific feature, not a systemic issue).
- `TOOLTIP_STYLE` spread used consistently across all dashboards — background, border, and font size are uniform.
- `MAP_PALETTES` per-dashboard identity is correctly applied: insecurity blue→amber→red, access teal→gold→orange, snap red→amber→green (inverted), prices blue→amber→red, banks amber→teal→blue.
- Freshness badge classes (`freshness--static`, `freshness--live`, `freshness--cached`) and styling are defined once in `11-dashboards.css:651-673` and used consistently across all dashboards.
- `dashboard-tabs` active state (`aria-current="page"`) is correctly set per-page tab in all 8 dashboard HTML files. Main nav `aria-current="page"` correctly points to the food-insecurity hub URL across all dashboard pages.

## Responsive Behavior — Mostly Pass

- Mobile breakpoints at 768px, 480px, and 360px all reduce `.dashboard-chart` height and `.dashboard-chart--map` height in `11-dashboards.css`.
- Dashboard tab bar scrolls horizontally on mobile with fade indicator — correct.
- Touch target for tabs meets 44px minimum (`min-height: 44px` at line 96).
- P2 gap: gauge inline heights bypass responsive min-height rules at 360px (noted above).
- No 1024px or 1440px breakpoint in `11-dashboards.css` — source grid collapses from 4-col to 2-col to 1-col, which is appropriate.

## Animation / Motion — Pass

- `animateCounters()` and `initScrollReveal()` both check `prefers-reduced-motion` in JS.
- `main.css:13` collapses all CSS transitions/animations to 0.01ms under `prefers-reduced-motion`, covering the `.scroll-reveal` transition not separately guarded in `11-dashboards.css`.
