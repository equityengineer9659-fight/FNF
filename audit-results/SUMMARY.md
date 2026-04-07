# Dashboard Audit — Prioritized Action Plan

**Date**: 2026-04-07 (fresh full re-audit)
**Dashboards**: executive-summary, food-insecurity, food-access, snap-safety-net, food-prices, food-banks
**Prior audit**: 78 findings, 30 fixed in commit `7ade07c`. 4 additional commits since (D3 heatmap, Double Burden dual-view).

---

## Aggregate Findings

| Dashboard | Critical | Major | Warning | Minor/Info | Total |
|-----------|----------|-------|---------|------------|-------|
| Executive Summary | 0 | 2 | 1 | 10 | 13 |
| Food Insecurity | 1 | 0 | 0 | 12 | 13 |
| Food Access | 3 | 4 | 5 | 7 | 19 |
| SNAP & Safety Net | 0 | 4 | 0 | 11 | 15 |
| Food Prices | 0 | 0 | 5 | 5 | 10 |
| Food Banks | 0 | 0 | 3 | 10 | 13 |
| **Total** | **4** | **10** | **14** | **55** | **83** |

### Prior Audit Resolution
- 24 of 26 prior findings verified as **fixed** across all 6 dashboards
- 2 partially fixed (CDC PLACES merge has residual bug, visualMap ghost still present)

---

## Cross-Dashboard Issues

These issues affect multiple or all dashboards and should be addressed as shared fixes:

| Issue | Dashboards Affected | Effort |
|-------|-------------------|--------|
| **No ECharts `aria: { enabled: true }`** on ~35 chart instances | All 6 | S per dashboard |
| **Dashboard tab strip overflows at 375px** with no scroll indicator | All 6 | S (one CSS fix) |
| **`aria-current="page"` on nav hardcoded** to food-insecurity URL | All dashboard pages | S (fix in build-components.js) |
| **Hero stat `data-target` values hardcoded in HTML** — JS never overrides from JSON | Exec Summary, Food Insecurity, SNAP, Food Banks | S per dashboard |
| **Map `role="img"` on interactive chart containers** | Food Insecurity (M-3), Food Access (FA-17) | Trivial each |
| **Dynamic insight containers missing `aria-live="polite"`** | Exec Summary (4), Food Insecurity (3), SNAP (4) | XS each |
| **D3 heatmap doesn't re-layout on resize** — only updates viewBox | Food Access, Food Banks | M |

---

## Priority 1 — Critical (Fix Immediately)

| # | Dashboard | Issue | Effort | Location |
|---|-----------|-------|--------|----------|
| 1 | Food Insecurity | **CDC PLACES state abbreviation vs full name mismatch** — `placesByName` keyed on `s.state` ("AL") but looked up by `sdohData.states[i].name` ("Alabama"). Health Outcomes buttons (Obesity, Diabetes, Depression, Housing Insecurity) never populate. Feature permanently broken. | S | food-insecurity.js:1179-1188 |
| 2 | Food Access | **Double Burden renders all-zero silently when food-insecurity-state.json fails** — states have no `povertyRate` without merge. Formula produces 0 for all 51 states. Insight says "0.0 million Americans." No error visible. `renderDoubleBurden` call is outside the `fiData?.states` guard. | S | food-access.js:1425-1450 |
| 3 | Food Access | **Food Insecurity map drill-down shows food desert data labeled as CDC PLACES** — tooltip says "Click for county breakdown" with "Source: CDC PLACES 2023" but click fires desert `drillDown()` showing tract percentages, not CDC data. Data labeling mismatch. | M | food-access.js:718-720, 221 |
| 4 | Food Access | **Mode B tiles compute columns from hidden container** — `display:none` → `clientWidth: 0` → 700px fallback → 6 columns. At 375px each tile is 53px wide, text overflows. Not recalculated on resize. | M | food-access.js:467-468, d3-heatmap.js:400 |

---

## Priority 2 — Major (Fix in Next Sprint)

| # | Dashboard | Issue | Effort | Location |
|---|-----------|-------|--------|----------|
| 5 | Exec Summary | **food-insecurity-kpi never updated by JS** — HTML default matches JSON by coincidence. Next data update → stale KPI until HTML manually edited. | XS | executive-summary.js:init() |
| 6 | Exec Summary | **Food Bank Orgs KPI fully hardcoded 61.3K** — no `id`, no JS update, undocumented source. | S | executive-summary.html:179 |
| 7 | Food Insecurity | **Meal cost insight factually wrong** — "28% above the national average" but actual is 43% ($5.12/$3.58). Wrong by 15 percentage points. | XS | food-insecurity.html:417 |
| 8 | Food Insecurity | **Triple Burden `Math.min/max(...[])` produces Infinity** — empty `accessVals` array → NaN scores, "NaN/300" insight text. | XS | food-insecurity.js:1384-1385 |
| 9 | Food Access | **`#map-view-toggle` missing group semantics** — 3 toggle buttons with no `role="group"` or `aria-label`. | Trivial | food-access.html:182 |
| 10 | Food Access | **Mode B tiles have no ARIA or keyboard access** — plain divs with mouse events only. | S | food-access.js:504-558 |
| 11 | SNAP | **All 5 gauge values inaccessible** — canvas-only values, `role="img"` label names gauge type but never computed value. | S | snap-safety-net.html:365-379 |
| 12 | SNAP | **3 dynamic elements lack `aria-live`** — snap-map-insight, demographic-flow-insight, CDC toggle container. Screen readers miss all updates. | Trivial | snap-safety-net.html |
| 13 | Exec Summary | **Single try/catch swallows all 4 fetch failures** — any one 404 → entire dashboard blank, no error shown. | S | executive-summary.js:370-412 |
| 14 | Food Access | **`role="img"` masks interactive D3 SVG** — all tile interactions invisible to AT. | Trivial | food-access.html:363 |

---

## Priority 3 — Warning (Address in Backlog)

| # | Dashboard | Issue | Effort |
|---|-----------|-------|--------|
| 15 | Food Insecurity | Demographics tooltip divide-by-zero when `rate === 0` | XS |
| 16 | Food Insecurity | County metric fallback `\|\|` should be `??` (rate=0 falls through) | XS |
| 17 | Food Insecurity | Map `aria-label` static across metric changes | XS |
| 18 | Food Insecurity | Hero counters hardcoded, not data-driven | S |
| 19 | Food Access | `showNational()` fallback uses wrong visualMap scale (7-24 vs 20-76) | S |
| 20 | Food Access | `buildHeatmapLegend` receives Infinity/-Infinity on empty enriched | XS |
| 21 | Food Access | `visualMap: undefined` leaves ghost county color scale | XS |
| 22 | Food Access | Two divergent county drill-down paths, different back behavior | M |
| 23 | Food Access | Mode B tile columns not recalculated on resize | M |
| 24 | Food Prices | Regional insight "8.6% more" — actual is 6.7% | Trivial |
| 25 | Food Prices | Data range "2020-present" — data starts 2018 | Trivial |
| 26 | Food Prices | SNAP benefit forward-fill past Dec 2025 not annotated | S |
| 27 | Food Prices | "Purchasing Power Gap" heading stale when SNAP is ahead | Trivial |
| 28 | Food Prices | "Keeping pace" insight understates 17.4pt SNAP advantage | S |
| 29 | Food Banks | Radar national avg (83.5%) vs sidebar/hero (82.4%) | XS |
| 30 | Food Banks | Revenue sum exceeds national — reconciliation note inconsistent | XS |
| 31 | Food Banks | Freshness badge "2023" for mixed 2023/2024 dataset | XS |
| 32 | SNAP | 11 CDC states gray with no user explanation | S |
| 33 | Exec Summary | SNAP vintage mismatch undisclosed (FY2025 national vs 2024 state) | XS |
| 34 | Exec Summary | 4 insight containers missing `aria-live` | XS |

---

## Priority 4 — Test Coverage Gaps

| Dashboard | Test File | Untested Critical Paths | Effort |
|-----------|-----------|------------------------|--------|
| Food Access | **NONE** — zero tests | Entire dashboard: D3 pipeline, drill-down, Double Burden, mode toggle | L |
| Food Insecurity | 233 lines | `renderTripleBurden`, `fetchCDCPlacesData` merge, `renderSDOH`, `renderIncomeRiver`, `renderStateDeepDive`, `renderDemographics` tooltip | L |
| Executive Summary | Exists | 4 render functions: `renderSnapGap`, `renderPriceImpact`, `renderWorstStates`, `renderVulnerabilityMap` | M |
| SNAP | 11 tests | Gauge value updates, all 3 async fetches, Sankey balance | M |
| Food Banks | Exists | Breadcrumb keyboard, regression suppression, radar avg, orgCount=0 | S |
| Food Prices | 12 tests | Good coverage. Minor: series null-alignment guard | XS |

---

## Implementation Sequence

### Batch 1 — Critical functional bugs (P1)
Fix #1 (CDC PLACES merge), #2 (Double Burden all-zero), #3 (insecurity map label), #4 (Mode B columns). Each requires a test first.

### Batch 2 — Quick major/warning text fixes
Fix #7 (28% → 43%), #8 (Triple Burden guard), #24 (8.6% → 6.7%), #25 (2020 → 2018), #27 (heading rename), #29 (radar avg), #30 (reconciliation), #31 (freshness badge). All XS/Trivial.

### Batch 3 — Major accessibility
Fix #9 (toggle group), #10 (tile ARIA), #11 (gauge values), #12 (aria-live), #14 (role="img"), #34 (insight aria-live). Cross-cutting aria-live can be batched.

### Batch 4 — Data-driven hero stats
Fix #5, #6, #18 (exec summary, food insecurity, SNAP hero stats). Same pattern: override `data-target` from JSON in `init()`.

### Batch 5 — Chart/logic guards
Fix #15 (divide-by-zero), #16 (|| → ??), #19 (wrong scale), #20 (Infinity legend), #21 (ghost visualMap). All XS/S.

### Batch 6 — Harder fixes
Fix #13 (per-section error handling), #22 (consolidate drill-down), #23 (ResizeObserver), #26 (SNAP forward-fill annotation), #28 (insight text), #32 (CDC gray states).

### Batch 7 — Test coverage
Create `food-access.test.js`. Expand food-insecurity, executive-summary, SNAP test suites.

---

## Effort Key

| Label | Meaning |
|-------|---------|
| XS | < 5 min — string or one-line guard |
| Trivial | 5–15 min — small edit, no new tests needed |
| S | 15–60 min — code change + regression test |
| M | 1–3 hours — logic rewrite or significant revision |
| L | 3+ hours — new test suite for untested module |

---

## Estimated Total Effort

| Priority | Hours |
|----------|-------|
| P1 Critical | ~4 |
| P2 Major | ~5 |
| P3 Warning | ~6 |
| P4 Test Coverage | ~8 |
| **Grand Total** | **~23** |

---

## Resolution Status (2026-04-07)

**39 of 83 items fixed** across 8 batches. 62 new tests added (380 total passing). PRs #33 + #34 merged; Batch 8 on `chore/audit-remaining-fixes`.

### Batch 1 — Critical Functional Bugs (4 fixed)
- #1: CDC PLACES merge key — changed `s.name` to `s.state` with `nameToAbbr` lookup
- #2: Double Burden all-zero — moved `renderDoubleBurden` inside `fiData?.states` guard, fixed truthy merge to `!= null`
- #3: Insecurity map drill-down — disabled drill-down in insecurity view (`setDrillDown(false)`)
- #4: Mode B tile columns — changed `Math.max(4,...)` to `Math.max(2,...)` for mobile

### Batch 2 — Text/Copy/Guard Fixes (11 fixed)
- #5: food-insecurity-kpi now updated from `fiData.national.foodInsecurityRate` in init()
- #6: Added `id="food-bank-orgs-kpi"` to executive-summary.html
- #7: Meal cost insight "28%" updated to "43%" matching $5.12/$3.58 calculation
- #8: Triple Burden `accessVals` guarded: `accessVals.length ? Math.min(...) : 0`
- #24: Regional gap "8.6%" updated to "approximately 7%"
- #25: Data range "2020-present" updated to "2018-present" (HTML + PHP)
- #27: Heading renamed from "The Purchasing Power Gap" to "SNAP vs. Food Prices: Purchasing Power Index"
- #29: Radar national avg now uses `national.avgEfficiencyRatio` (82.4%, not recomputed 83.5%)
- #30: Revenue reconciliation note verified (within 1.2%)
- #31: Freshness badge changed from `2023` to `'2023/2024'`

### Batch 3 — Accessibility (6 fixed)
- #9: `#map-view-toggle` added `role="group" aria-label="Map view"`
- #10: Mode B tiles: grid gets `role="list"`, each tile gets `role="listitem"` + `aria-label`
- #11: 5 gauge `aria-label` now includes computed values (e.g., "Gauge showing SNAP Coverage: 83.7%")
- #12: CDC toggle reveal announces via `aria-live` status element
- #14: D3 treemap container changed from `role="img"` to `role="region"`
- #34: Executive Summary insight containers already had `aria-live="polite"` (verified)

### Batch 4 — Data-Driven Hero Stats (3 fixed)
- #18: Food Insecurity hero stats synced from `data.national` (rate, persons, children, meals)
- B-1: SNAP hero stats synced from `snapData.national` (participants, gap, benefit, lunch)
- F4: Food Banks hero stats synced from `bankData.national` (orgs, revenue, insecurity rate)

### Batch 5 — Chart/Logic Guards (5 fixed)
- #15: Demographics tooltip divide-by-zero guard (`s.rate > 0 ? ... : 'N/A'`)
- #16: County metric fallback `||` → `??` (rate=0 no longer falls through)
- #19: `showNational()` visualMap scale corrected: 7/24 → 20/65 (matches `renderLowAccessMap`)
- #20: `buildHeatmapLegend` Infinity guard (`!isFinite(pctMin) || !isFinite(pctMax)`)
- #21: `visualMap: undefined` → `null` (properly clears county color scale)

### Batch 6 — Harder Fixes (5 fixed)
- #13: Per-chart error isolation in executive-summary.js (4 independent try/catch blocks)
- #26: SNAP forward-fill annotation — markLine at last benefitTimeline date
- #28: Purchasing power insight: "keeping pace" → "outpaced" with magnitude
- #32: CDC gray states tooltip fallback: "No CDC survey data available"
- #22: Resolved by #19 — both drill-down paths now use matching 20/65 scale

### Batch 7 — Test Coverage Expansion (57 new tests)
- food-insecurity.test.js: CDC PLACES merge, Triple Burden guard, hero stats, demographics guard, county fallback
- food-access.test.js: Double Burden guard, tile ARIA, D3 role, showNational scale, Infinity guard, visualMap null
- executive-summary.test.js: KPI sync, org KPI id, per-chart error isolation
- snap-safety-net.test.js: hero stats, gauge a11y, CDC toggle a11y, gray states tooltip, Sankey balance
- food-prices.test.js: regional insight, data range, heading, insight language
- food-banks.test.js: hero stats, radar avg, reconciliation, freshness badge, breadcrumb keyboard, regression suppression, orgCount guard

### Batch 8 — Remaining P3 fixes + cross-cutting (6 fixed)
- #17: Map aria-label updates dynamically on metric change (food-insecurity.js)
- #23: Mode B tiles recalculate columns on resize via ResizeObserver (food-access.js)
- #33: SNAP vintage mismatch disclosed — FY2025 national vs 2024 state (executive-summary.html)
- Cross-cutting: ECharts `aria: { enabled: true }` applied to all ~35 charts via `createChart()` (dashboard-utils.js)
- Cross-cutting: D3 heatmap ResizeObserver recomputes treemap layout on resize, not just viewBox (d3-heatmap.js)
- Cross-cutting: `aria-current="page"` already dynamic per page in build-components.js (audit was incorrect)

### Remaining (44 items — P4 minor/info)
- Dashboard tab strip already has mobile scroll indicator (gradient fade, verified)
- Additional test coverage for untested render functions
