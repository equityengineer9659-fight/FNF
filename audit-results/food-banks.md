# Food Banks Dashboard Audit

**Date**: 2026-04-07  
**Auditor**: Claude Code (full re-audit)  
**Scope**: `food-banks.js`, `food-banks.html`, `food-bank-summary.json`, `d3-heatmap.js`, `food-banks.test.js`, `d3-heatmap.test.js`, live production site

---

## API Endpoints

| Endpoint | Method | HTTP Status | Response Shape | Issues |
|---|---|---|---|---|
| `/data/food-bank-summary.json` | fetch (static) | 200 (11 KB) | `{ national, states[] }` | Shape matches JS field access |
| `/data/us-states-geo.json` | fetch (static) | 200 (366 KB) | GeoJSON FeatureCollection | Shape matches ECharts registerMap |

**Dev proxy**: `http://localhost:4173` was not running at audit time. Both endpoints verified against production `https://food-n-force.com`.

**Error handling**: A single `try/catch` block wraps both fetches. On failure, all `.dashboard-chart` elements receive a generic reload message. No per-chart fallback; if only one fetch fails, the entire dashboard goes blank.

**No PHP proxy endpoints** are used by this dashboard.

---

## Hardcoded / Stale Data

- **Hero KPI counters are hardcoded in HTML** — `data-target="61284"`, `"48.2"`, `"82.4"`, `"1"` — these match `food-bank-summary.json` `national` fields exactly and are correct for 2023 data. However, they are not dynamically read from the loaded JSON; a data refresh without an HTML edit will cause silent divergence.

- **Hardcoded year `_dataYear: 2023`** — `updateFreshness('banks', { _static: true, _dataYear: 2023 })` shows "Data: 2023" in the freshness badge. The food insecurity rates in the same JSON come from Feeding America's 2024 estimates. The single year label misrepresents the mixed vintage. The page's own data notice (shown in HTML) correctly discloses 2024 Feeding America data, but the freshness badge does not.

- **Mississippi hardcoded insight is correct** — HTML says "$587 in food bank revenue per food-insecure person". Computed from JSON: `totalRevenue=325,000,000 / insecure=553,707 = $587`. Matches. The "6x less than national leader" claim: DC leads at $3,589/person; ratio = 6.1x. Accurate.

- **Regression suppression threshold `0.2` is hardcoded** — `Math.abs(reg.r) >= 0.2` in `renderVsInsecurity`. Acceptable as a domain constant but undocumented; should have a code comment.

- **Radar chart `max` values hardcoded** — `{ name: 'Efficiency (%)', max: 90 }`, `{ name: 'Density\n(per 100K)', max: 40 }`, `{ name: 'Avg Rev/Org\n($M)', max: 1.5 }`, `{ name: 'Insecurity (%)', max: 18 }`, `{ name: 'Avg Org Count', max: 2000 }`. These are not computed from data. A state with insecurity > 18% or density > 40 would be clipped without warning. Current max values: insecurity 18.7% (Mississippi exceeds the `max: 18` cap), density 35.9 (DC, but excluded from regional avg).

- **`national.statesUnder100 = 1`** is a hardcoded field in `food-bank-summary.json`, not derived from `states[].orgCount`. It is consistent with the data (Wyoming has 82 orgs, the only state under 100), but could drift if data is refreshed without updating the national aggregate.

---

## D3 Heatmap Integration

**Container/breadcrumb ID match** — verified correct:
- `containerId: 'chart-revenue'` → `<div id="chart-revenue">` — matches
- `breadcrumbId: 'revenue-breadcrumb'` → `<div id="revenue-breadcrumb">` — matches
- `buildHeatmapLegend(document.getElementById('treemap-legend-banks'), ...)` → `<div id="treemap-legend-banks">` — matches
- `buildRegionChips(document.getElementById('revenue-region-legend'))` → `<div id="revenue-region-legend">` — matches

**State coverage in hierarchy** — all 51 states (50 states + DC) are present in `REGIONS` and in `food-bank-summary.json`. No states missing from any Census region. No duplicates.

**`normFn` is correct** — `createRankNorm(revValues)` receives an array of revenue-per-insecure-person values; `normFn: (leaf) => rankNorm(leaf.value)` correctly maps the leaf's `size` (rev/person) to a rank position 0–1. Rank normalization is appropriate to prevent DC ($3,589/person) from compressing all other states toward zero.

**CRITICAL: `aria-label` on chart container contradicts actual behavior** — The `<div id="chart-revenue">` has:
```
aria-label="Treemap showing food bank revenue per food-insecure person by state, colored by program efficiency"
```
The sidebar panel text also says: _"Color indicates **program efficiency**"_. But the `normFn` encodes **revenue per insecure person** for color (same metric as size). Program efficiency (`programExpenseRatio`) appears only in the tooltip's third line and as `label3` when zoomed in. The aria-label and the sidebar paragraph are both factually wrong. The color gradient and the HTML description panel in `food-banks.html` (lines 234–235) were not updated when the D3 heatmap was wired to rank-norm revenue-per-person instead of efficiency.

**Resize behavior** — `ResizeObserver` updates only the SVG `viewBox` dimensions; the treemap tile layout (computed once at `init()` time from the original container dimensions) is **not re-computed**. On resize, tiles scale proportionally via `viewBox` but text sizes and tile positions do not reflow. On a narrow mobile viewport where `getBoundingClientRect()` returns a small width at init time, tiles will be very compressed. If `width < 10 || height < 10` at init, no SVG is created at all (silent no-render; no fallback message).

**`tooltipFn` robustness** — all fields accessed (`d.name`, `d.efficiency`, `d.totalRevenue`, `d.orgCount`, `d.insecurePersons`, `d.insecurityRate`) are explicitly set in `hierarchyData` construction. No null risk with current data. However, if a state has `insecure = 0` (e.g., hypothetical 0% insecurity rate), `rev = 0` is passed as `size`; D3 gives it zero area and the tile is never rendered — it silently disappears from the heatmap with no user indication.

**Breadcrumb navigation is keyboard-inaccessible** — `updateBreadcrumb()` in `d3-heatmap.js` creates `<span>` elements with `addEventListener('click')` for navigation. They have no `tabindex`, no `role="button"`, and no `keydown` handler. Keyboard users cannot activate breadcrumb navigation. The "Click breadcrumb to zoom out" hint text is also mouse-only.

---

## Data Transformation Gaps

| Function | Potential Issue |
|---|---|
| `renderRevenue()` | `ins = 0` → `rev = 0` → zero-area tile silently excluded from heatmap; no user feedback |
| `renderEfficiency()` | `avgRevPerOrg = st.totalRevenue / st.orgCount` — if `orgCount = 0`, produces `Infinity`. Current data has no zero-count states, but there's no guard. |
| `renderEfficiency()` | Region averages divide by `n` (number of matching states). If a region had no states in the JSON (impossible now, but possible if regions shift), `NaN` propagates to the radar chart silently. |
| `renderVsInsecurity()` | `symbolSize = Math.sqrt(params.data.totalRevenue / 10000000)` — if revenue is negative, produces `NaN` (no guard). Current data is clean. |
| `renderCapacityGap()` | `insecurePersons = s.population * s.foodInsecurityRate / 100` — not rounded here (float). Consistent with `renderRevenue` which does round; minor inconsistency but both end up in scatter as values, not for display. |
| `renderDensityMap()` | `d.value.toFixed(1)` in tooltip — would throw if `perCapitaOrgs` is `null`. Current data has no nulls. |

---

## Test Coverage Gaps

**Existing coverage:**

`food-banks.test.js` (4 tests in 4 describes):
- `REGION_COLORS hex-to-rgba conversion` — tests the `hexToRgba` utility function (2 tests)
- `Mississippi insight` — checks hardcoded `$587` value against `ms.foodInsecurePersons` field (see bug below)
- `data year label` — checks that Feeding America/2024 is mentioned in HTML
- `data shape: food-bank-summary.json` — validates JSON has `national`, `states[]`, and that all states have `name`, `orgCount`, `totalRevenue`, `foodInsecurityRate`

`d3-heatmap.test.js` — covers `createRankNorm`, `buildHeatmapLegend`, `buildRegionChips`, `HEATMAP_REGION_COLORS`, module exports, and hierarchy data contract (11 tests).

**Gaps and bugs in existing tests:**

- **Bug in `Mississippi insight` test**: `ms.foodInsecurePersons` — this field does **not exist** in `food-bank-summary.json`. The computed value is `NaN`. The `if (match)` guard prevents an assertion failure, but the test never actually validates anything; it always passes vacuously. The test should use `Math.round(ms.population * ms.foodInsecurityRate / 100)` to derive the insecure population.

- **No test for the aria-label/color mismatch** — nothing validates that `chart-revenue`'s `aria-label` accurately describes what color encodes.

- **No test for `renderVsInsecurity` regression suppression** — the `|r| >= 0.2` logic is not tested. No test verifies that when `|r| < 0.2` the `markLine` is omitted.

- **No test for D3 heatmap hierarchy construction** in `food-banks.test.js` — the `hierarchyData` builder inside `renderRevenue()` is not tested. No test verifies: all 51 states appear, no state is duplicated, `insecure = 0` states get `rev = 0` and `size = 0`.

- **No test for radar `max` value clamping** — Mississippi's insecurity rate (18.7%) exceeds the hardcoded radar `max: 18`. No test flags this.

- **No test for `renderEfficiency` zero-division guard** — `orgCount === 0` scenario is untested.

- **No test for breadcrumb keyboard accessibility** in `d3-heatmap.test.js`.

- **`renderCapacityGap`, `renderDistribution`, `renderEfficiency`, `renderDensityMap`** have zero dedicated test coverage in `food-banks.test.js`.

---

## Accessibility Issues

| Severity | Issue | Location |
|---|---|---|
| Critical | `aria-label` on `chart-revenue` div says "colored by program efficiency" but color encodes revenue-per-person rank | `food-banks.html:226` |
| Critical | Breadcrumb `<span>` elements in D3 heatmap lack `tabindex`, `role="button"`, and `keydown` handler — not keyboard accessible | `d3-heatmap.js:356–369` |
| Major | HTML sidebar text for Revenue chart says "Color indicates **program efficiency**" — contradicts actual chart behavior | `food-banks.html:238` |
| Major | Freshness badge shows "Data: 2023" for a dataset that mixes 2023 IRS 990 data and 2024 Feeding America estimates | `food-banks.js:403` |
| Major | D3 heatmap `<svg>` element has no `aria-label` or `role` — only the container `<div>` has `role="img"`, but screen readers may not always associate the SVG content with the div's label | `d3-heatmap.js:397–403` |
| Minor | Radar chart indicator `Density\n(per 100K)` contains a literal `\n` newline in the label string — renders correctly in canvas but is a code smell | `food-banks.js:232` |
| Minor | "Click a region to zoom in. Click breadcrumb to zoom out." hint text describes mouse-only interaction; no keyboard equivalent is mentioned | `food-banks.html:229` |
| Minor | No `aria-live` region for when D3 heatmap zoom level changes | `d3-heatmap.js` |
| Minor | `chart-vs-insecurity` and `chart-capacity-gap` aria-labels describe bubble size as "total revenue" and "population" respectively, which is correct, but do not mention color encodes region — minor gap in description completeness | `food-banks.html:203, 296` |

**Heading hierarchy**: H1 → H2 → H3 throughout — correct.  
**Skip link**: present and functional.  
**Dashboard tab `aria-current="page"`**: correctly set on Food Banks tab.  
**Freshness timestamp**: present (`freshness-banks` element), populated via JS.

---

## Mobile Rendering Issues

Screenshots captured at 375×812 (mobile) and 1280×900 (desktop). Note: the mobile screenshot navigated to `snap-safety-net.html` mid-resize due to a viewport-change-triggered navigation event — this itself is a bug in the nav system but is pre-existing and out of scope for this dashboard.

| Severity | Issue |
|---|---|
| Major | D3 heatmap layout is computed once at desktop dimensions; on mobile the tile positions are only scaled via `viewBox` — text sizes and proportions do not reflow. Small states (e.g., Rhode Island, Delaware) likely produce tiles too small to read labels. No re-layout on mobile viewport. |
| Major | If `chart-revenue` container has `width < 10` or `height < 10` at JS init time (e.g., hidden by CSS on mobile, or scroll-reveal not yet visible), `createD3Heatmap()` returns silently with no SVG and no error message. |
| Minor | The breadcrumb row (`revenue-breadcrumb`) is `display:flex` with inline styles — may wrap awkwardly on 375px if several region labels are in the path. |
| Minor | Scatter chart labels (axis names) are not mobile-responsive; `nameGap: 35` and fixed `left: 60` grid padding may cause label clipping on narrow screens. |

---

## Chart Configuration Issues

| Issue | Location |
|---|---|
| No `aria` config on any ECharts chart options | All 5 ECharts charts in `food-banks.js` |
| Radar `max: 18` for insecurity rate — Mississippi at 18.7% is clipped; the polygon is capped at the max rather than overflowing, silently misrepresenting the state's position | `food-banks.js:233` |
| Regression suppression: when `|r| < 0.2` the line is omitted, but there is **no visual indicator** to the user that suppression occurred. The user sees a scatter plot with no trend line and no explanation. Other dashboards use a text note in this case. | `food-banks.js:92–99` |
| `renderVsInsecurity` places `markLine` only on series index `i === 0` (first region in `REGION_COLORS`). If the region iteration order changes, the regression line may attach to the wrong series legend entry. | `food-banks.js:108` |
| `renderDistribution`: `names.reverse()`, `rates.reverse()`, `density.reverse()` are called sequentially on the same `sorted` array's derived arrays — `.reverse()` mutates in place, but since these are separate `.map()` outputs, the triple-reverse is safe. However, it reverses `names` and `rates`/`density` independently; a future refactor that shares arrays could break the pairing. | `food-banks.js:306–309` |
| Tooltip for `renderDensityMap` says `Revenue: $${fmtNum(d.totalRevenue)}` — no label for units (millions? billions?). `fmtNum` returns e.g. "685.0M" but the tooltip does not say "685.0M in revenue" or provide context. | `food-banks.js:52` |
| All 5 ECharts charts use `animateCounters()` is called before charts are rendered (line 402 before renderDensityMap line 404) — correct order. |  |

---

## Prioritized Findings

| # | Issue | Severity | Effort |
|---|---|---|---|
| 1 | `aria-label` on `chart-revenue` and sidebar copy say "colored by program efficiency" — actually color encodes revenue-per-person rank | Critical | XS (text edit) |
| 2 | D3 heatmap breadcrumb spans are not keyboard accessible (no `tabindex`, no `role="button"`, no `keydown` handler) | Critical | S |
| 3 | Mississippi insight test uses `ms.foodInsecurePersons` which doesn't exist in JSON — test always passes vacuously, never validates the insight | Major | XS |
| 4 | Radar `max: 18` for insecurity rate clips Mississippi (18.7%) silently | Major | XS |
| 5 | No visual feedback when regression line is suppressed (`|r| < 0.2`) | Major | S |
| 6 | D3 heatmap: no re-layout on resize — only `viewBox` is updated; tiles don't reflow for mobile | Major | M |
| 7 | Freshness badge shows "Data: 2023" but insecurity data is 2024 Feeding America | Major | XS |
| 8 | No D3 heatmap hierarchy construction test — zero-area states, all-51-present, no duplicates | Major | S |
| 9 | Hero KPI counters hardcoded in HTML; not derived from loaded JSON — silent divergence risk on data refresh | Minor | M |
| 10 | `renderEfficiency` `avgRevPerOrg` has no guard against `orgCount === 0` (Infinity) | Minor | XS |
| 11 | `markLine` anchored to series index `i === 0` by position, not by name — fragile | Minor | XS |
| 12 | No `aria` config in any ECharts chart `setOption` calls | Minor | S |
| 13 | `createD3Heatmap` returns silently with no SVG if container is <10px at init time — no fallback message | Minor | S |
| 14 | D3 heatmap `<svg>` has no aria label; relies on container `role="img"` which screen readers may not reliably associate | Minor | XS |
| 15 | No test coverage for `renderCapacityGap`, `renderDistribution`, `renderEfficiency`, `renderDensityMap` | Minor | L |
