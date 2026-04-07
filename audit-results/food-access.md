# Food Access & Deserts Dashboard Audit

**Date**: 2026-04-07 (fresh re-audit)
**Scope**: Food Access dashboard — all 6 audit categories
**Files reviewed**: `dashboards/food-access.html`, `src/js/dashboards/food-access.js`, `src/js/dashboards/shared/d3-heatmap.js`, `public/data/current-food-access.json`, `public/data/snap-retailers.json`, `public/data/food-insecurity-state.json`
**Note**: This dashboard had major changes in 4 recent commits (D3 heatmap replacement, Double Burden dual-view redesign)

---

## Prior Audit Fix Verification

| Prior Finding | Status |
|---|---|
| P1-3: Food Insecurity map click silently fails (fips: null) | PARTIALLY FIXED — see FA-15 for residual data labeling mismatch |
| P1-12: Duplicate click listener on back button | FIXED — only one `addEventListener` at food-access.js:213 |
| P1-13: visualMap: undefined leaves ghost county legend | STILL PRESENT — see FA-09 |
| P2-14: aria-current="page" on nav points to food-insecurity | STILL PRESENT — see FA-16 |

---

## 1. API and Data Source Integrity

| Dataset | Source | Data Year | Updated | Status |
|---------|--------|-----------|---------|--------|
| current-food-access.json | USDA FNS SNAP Retailer ArcGIS + Census 2020 | Current | 2026-04-06 | Fresh |
| snap-retailers.json | USDA FNS FY2024 Retailer Management | FY2024 | 2026-04-05 | Fresh |
| food-insecurity-state.json | USDA ERS / Feeding America MMG 2025 | 2024 | 2026-04-04 | Fresh |
| us-states-geo.json | Census 2020 GeoJSON | 2020 | Static | OK |
| /data/counties/{fips}.json | CHR 2025 + Census | 2025 | Static | Fresh |
| /api/dashboard-sdoh.php | Census ACS 5-year | 2023 | Live (24hr cache) | Fresh |
| /api/dashboard-places.php?type=food-insecurity | CDC PLACES | 2023 | Live | **Partial — 40/51 states** |

**CDC PLACES partial coverage**: Returns ~40 of 51 states. 11 missing states render as blank on Food Insecurity map with no user-visible warning.

**Schema compliance**: `current-food-access.json` states have NO `povertyRate` at state level — this field depends entirely on the `food-insecurity-state.json` merge succeeding (see FA-06).

---

## 2. Hardcoded, Stale, or Fragile Data

**FA-01 (Info)**: Hero stat HTML `data-target` values match JSON but are hardcoded. `init()` overrides before `animateCounters()` runs, so no stale display under normal load. Low risk.

**FA-02 (Warning)**: `showNational()` uses `visualMap: { min: 7, max: 24 }` — calibrated for old USDA Atlas data. Current `lowAccessPct` range is 20–76%. Only fires as a fallback, but would display badly miscalibrated colors.

**FA-03 (Info)**: `povertyRate` merge uses truthy guard `if (fiByName[s.name])` — would skip poverty rate of 0. No U.S. state has 0% poverty. Change to `!= null` for correctness.

**FA-04 (Info)**: `mediumGrocery` present in CSV export but omitted from SNAP Retailers tooltip.

---

## 3. Data Transformation and Chart Contract Review

### Critical

**FA-06: Double Burden renders all-zero silently when `food-insecurity-state.json` fails to load**
- **File**: `food-access.js:1425-1430, 1450`
- **Root cause**: State records have NO `povertyRate` — it comes solely from the merge with `food-insecurity-state.json`. If that file fails, `fiData` is `null`, the merge is skipped, and every state has `povertyRate: undefined`. The formula `(s.lowAccessPopulation || 0) * ((s.povertyRate || 0) / 100)` evaluates to 0 for all states. D3 heatmap renders all tiles same size/color, insight says "0.0 million Americans face overlapping low food access." No error visible.
- **Key detail**: `renderDoubleBurden` call at line 1450 is OUTSIDE the `if (fiData?.states)` guard — always runs regardless of merge success
- **Test**: Call `renderDoubleBurden(states)` where all states have `povertyRate: undefined`, assert error/empty state shown instead of zero-filled heatmap
- **Fix**: Move `renderDoubleBurden` inside the guard, or add explicit check for populated `povertyRate`
- **Effort**: S

### Warning

**FA-05: `pctMin/pctMax` passed to legend are `Infinity/-Infinity` when enriched is empty**
- **File**: `food-access.js:632-634`
- `Math.min(...[])` returns `Infinity`. Passed to `buildHeatmapLegend` which would render `NaN%` or `Infinity%`
- **Fix**: Early-exit guard before `buildHeatmapLegend`
- **Effort**: XS

**FA-09: `visualMap: undefined` leaves ghost county color scale on state scatter**
- **File**: `food-access.js:1045`
- ECharts `setOption` in merge mode ignores `undefined` values — previous county visualMap persists
- **Fix**: Change `regionBased ? undefined : [...]` to `regionBased ? null : [...]`
- **Effort**: XS

**FA-13: Two divergent county drill-down paths in deserts mode**
- **File**: `food-access.js:111, 1564`
- Map click path uses inline `drillDown()` → `showNational()` (wrong 7-24 scale on back)
- State selector path uses `renderLowAccessCounty()` → `switchMapView('deserts')` (correct scale)
- County click insight handler only registered in `renderLowAccessCounty` path
- **Fix**: Consolidate back-button to always use `renderLowAccessMap` instead of `showNational()`
- **Effort**: M

### Critical (Accessibility)

**FA-15: Food Insecurity map county drill-down shows food desert data labeled as CDC PLACES**
- **File**: `food-access.js:718-720, 221`
- Tooltip says "Click for county breakdown" with "Source: CDC PLACES 2023" — but click fires `renderDesertMap`'s `drillDown()` which shows food desert tract percentages, not CDC data. Data labeling mismatch.
- **Test**: Mock map click in insecurity mode; assert tooltip does not claim CDC source
- **Fix**: Either label county view as "food desert data" or implement separate CDC county path
- **Effort**: M

**FA-21: D3 heatmap renders at zero size if container hidden when called**
- **File**: `d3-heatmap.js:400-401`
- Mode B `renderDoubleBurdenTiles` called while container has `display:none`. Uses `clientWidth || 700` fallback, computing 6 columns that overflow at mobile widths
- **Test**: Call `renderDoubleBurdenTiles` with container `clientWidth: 375`, assert `cols <= 3`
- **Fix**: Call `renderDoubleBurdenTiles` lazily on first toggle, not at init
- **Effort**: M

---

## 4. Accessibility Audit

**FA-14 (Major)**: `#map-view-toggle` div missing `role="group"` and `aria-label`. Three toggle buttons have no group semantics.
- **Fix**: Add `role="group" aria-label="Map view"` — Trivial

**FA-16 (Major)**: `aria-current="page"` on main nav targets food-insecurity URL. Build artifact from `build-components.js`.
- **Fix**: Fix nav injection to set `aria-current` by URL match — S

**FA-17 (Major)**: `role="img"` on `#chart-double-burden` container suppresses all interactive D3 tile accessibility.
- **Fix**: Remove `role="img"`, add `aria-label` to SVG — Trivial

**FA-18 (Major)**: Mode B tiles have no ARIA roles, labels, or keyboard support. Plain `<div>` with mouse events only.
- **Fix**: Add `role="list"` container, `role="listitem"` + `aria-label` per tile — S

**FA-19 (Pass)**: Double Burden mode toggle buttons correctly use `aria-pressed`.
**FA-20 (Pass)**: Breadcrumb active item uses `aria-current="true"` with `role="button"`, `tabindex="0"`, keyboard handler.

---

## 5. Mobile and Responsive Audit

**FA-22 (Warning)**: Mode B tile columns calculated once from hidden container (700px fallback), not recalculated on resize.
- **Fix**: Use `ResizeObserver` on tiles container — M

**FA-23 (Minor)**: D3 treemap ResizeObserver only updates `viewBox`, does not re-layout tiles. Causes stretching at extreme aspect ratios.

**FA-24 (Info)**: Distance chart x-axis at mobile shows ~17 of 51 state labels with `interval:2`. Reasonable tradeoff.

**FA-25 (Info)**: Map toggle buttons wrap asymmetrically at 375px. Functional but visually unbalanced.

---

## 6. Test Coverage

**No `food-access.test.js` file exists.** Zero test coverage for this dashboard.

---

## Findings Summary

| Severity | Count | Key Findings |
|----------|-------|-------------|
| Critical | 3 | FA-06 (Double Burden all-zero), FA-15 (wrong data on insecurity drill-down), FA-21 (zero-size render) |
| Major | 4 | FA-14 (toggle group), FA-16 (aria-current), FA-17 (role="img"), FA-18 (tile a11y) |
| Warning | 5 | FA-02 (wrong scale), FA-05 (Infinity legend), FA-09 (ghost visualMap), FA-13 (divergent paths), FA-22 (no resize) |
| Minor/Info | 7 | FA-01, FA-03, FA-04, FA-07, FA-08, FA-23, FA-24, FA-25 |

## Remediation Priority

1. **FA-06** — Double Burden silent all-zero on data failure (S)
2. **FA-15** — Insecurity map drill-down shows wrong dataset (M)
3. **FA-21** — Mode B tile column calculation from hidden container (M)
4. **FA-14, FA-17** — Group semantics + role="img" removal (Trivial each)
5. **FA-18** — Mode B tile ARIA/keyboard support (S)
6. **FA-09** — Ghost visualMap fix (XS)
7. **FA-16** — aria-current build artifact (S, affects all dashboards)
8. **FA-13** — Consolidate drill-down paths (M)
9. **Create food-access.test.js** — Zero test coverage currently (L)
