# Executive Summary Dashboard Audit

Audited: 2026-04-07  
Source: `src/js/dashboards/executive-summary.js` + `dashboards/executive-summary.html`  
Tested against: `https://food-n-force.com/dashboards/executive-summary.html`  
All 4 production data fetches returned HTTP 200.

---

## API Endpoints

The dashboard fetches 4 static JSON files — no live PHP proxies are involved.

| Endpoint | Status | Shape Match | Issues |
|---|---|---|---|
| `GET /data/food-insecurity-state.json` | 200 OK | Yes — `states[]` with `name`, `rate`, `povertyRate`, `mealCost`, `persons`; `national.foodInsecurityRate`, `national.averageMealCost` | None |
| `GET /data/snap-participation.json` | 200 OK | Yes — `national.snapParticipants`, `national.coverageGap`, `stateCoverage.states[]` with `name`, `snapParticipants` | None |
| `GET /data/bls-food-cpi.json` | 200 OK | Yes — `series[]` with `name === 'Food at Home'`, entries have `date` (YYYY-MM) and `value` (number or null) | `2025-10` entry is `null` (BLS reporting gap); date-keyed YoY code handles it correctly |
| `GET /data/us-states-geo.json` | 200 OK | GeoJSON FeatureCollection consumed directly by `echarts.registerMap()` | None |

**Error handling gap:** A single `try/catch` wraps all 4 fetches in one `Promise.all`. If any one file returns non-OK, the entire dashboard silently fails — no user-visible error message or partial render. Individual chart failure isolation is absent. The catch block only logs to console on localhost, so production users see a blank dashboard with no indication of failure.

---

## Hardcoded / Stale Data

1. **"Food Bank Orgs" KPI is fully hardcoded at 61.3K.** The stat element (`data-target="61.3" data-suffix="K"`) has no `id`, is never updated by JavaScript, and has no corresponding data source or fetch anywhere in the codebase. The value's provenance is undocumented. If the actual count changes (likely annually), this number silently stales.  
   Location: [`dashboards/executive-summary.html:179`](../dashboards/executive-summary.html#L179)

2. **HTML default for `kpi-cpi-yoy` hardcodes `2.6%` but the live computed value is `3.1%`.** The HTML fallback `data-target="2.6"` is shown briefly during animation start and serves as the no-JS fallback. After JS runs, the correct value (`3.1%` from BLS 2026-02 data) is applied dynamically. If JS fails entirely, users see the incorrect `2.6%` default. The correct current value is 3.1%.  
   Location: [`dashboards/executive-summary.html:183`](../dashboards/executive-summary.html#L183)

3. **`bls-food-cpi.json` was last fetched 2026-03-31** (`fetchedAt` field). As of audit date 2026-04-07 the latest data point is 2026-02, which is current (BLS releases ~6 weeks after reference month). However this is a static file — it will stale month-over-month without a scheduled refresh job.

4. **Methodology section HTML source contains a typo: `normalized meal cost × 30`** instead of `× 0.3`. This is in a `<strong>` element inside the Methodology notes at line 379. The production server happens to be serving a different (correct) version, but the source file at `dashboards/executive-summary.html:379` has `&times; 30` — a factor-of-100 error in the displayed formula description.  
   Location: [`dashboards/executive-summary.html:379`](../dashboards/executive-summary.html#L379)

---

## Data Transformation Gaps

### `computeVulnerabilityIndex(states)` — [executive-summary.js:15](../src/js/dashboards/executive-summary.js#L15)
- **Input:** Array of state objects with `rate`, `povertyRate`, `mealCost`
- **Output:** Same array with added `vulnerabilityIndex` (rounded to 2dp)
- **Formula is correct** — uses `* 0.3` weight for normalized meal cost, consistent with documentation.
- **Edge case — division by zero:** `maxMealCost = Math.max(...states.map(s => s.mealCost || 0))`. If all states have `mealCost: 0`, `maxMealCost` is `0` and `s.mealCost / maxMealCost` produces `NaN`. The vulnerability scores for all states become `NaN`, silently breaking both the map and ranking chart.
- **No null guards on individual fields:** If any state entry is missing `rate`, `povertyRate`, or `mealCost`, arithmetic silently produces `NaN`. No field-presence validation before computing.

### `renderSnapGap(fiStates, snapStates)` — [executive-summary.js:124](../src/js/dashboards/executive-summary.js#L124)
- **Input:** Two state arrays joined on `name`, filtered to top 15 by `rate`
- **Edge case — empty joined array crash:** The `biggestGap` reducer at line 194 uses `joined[0]` as the initial value. If `joined` is empty (no name matches between the two arrays), `joined[0]` is `undefined` and the reducer throws `TypeError: Cannot read properties of undefined`. No guard exists before the reducer.
- **Gap percentage — division by zero:** `(d.foodInsecure - d.snapParticipants) / d.foodInsecure * 100` in the tooltip formatter at line 150 — if `d.foodInsecure === 0`, produces `NaN` or `Infinity`. No guard.

### `renderPriceImpact(blsData)` — [executive-summary.js:205](../src/js/dashboards/executive-summary.js#L205)
- **Null handling is correct** — filters `value !== null`, uses date-keyed lookback to skip the `2025-10` gap.
- **Edge case — missing `blsData.series`:** If `blsData` is malformed (no `series` key), `blsData.series.find()` at line 209 throws `TypeError`. The guard at line 207 checks `blsData?.series` but the optional chaining applies to the `if` condition, not to `.find()` — wait, re-reading: `if (!chart || !blsData?.series) return;` — this IS guarded. Safe.
- **Edge case — no "Food at Home" series in array:** If `foodHome` is `undefined` (series name changed), the function returns early at line 211 (`if (!foodHome) return;`). Safe, but silent.
- **Edge case — fewer than 13 valid data points:** `yoyData.at(-1)` returns `undefined`. The `if (latest)` guard at line 279 handles this safely.

### `renderWorstStates(statesWithIndex)` — [executive-summary.js:297](../src/js/dashboards/executive-summary.js#L297)
- **`top10.at(-1)` on empty array:** If `statesWithIndex` is empty, `top10` is empty and `top10.at(-1)` returns `undefined`. Line 360 would throw on `topState.vulnerabilityIndex`. The `if (insightEl && top10.length >= 3)` guard at line 357 prevents the insight crash but the chart would still attempt to render with empty data.

---

## Test Coverage Gaps

**Functions with test coverage:**
- `computeVulnerabilityIndex` — formula correctness (40/30/30 weighting), relative ordering, empty array
- Data shape: `food-insecurity-state.json` (national rate, state fields)
- Data shape: `bls-food-cpi.json` ("Food at Home" series, date/value entries)
- BLS YoY null-hole alignment logic
- SNAP coverage KPI formula (`participants / (participants + gap)`)
- Dead fetch absence (food-bank-summary.json)
- HTML KPI staleness for `food-insecurity-kpi`

**Untested functions / scenarios:**
1. `renderVulnerabilityMap` — no tests at all (map render, click handler, CSV export callback)
2. `renderSnapGap` — no tests (join logic, `biggestGap` reducer crash-on-empty, over-covered count)
3. `renderPriceImpact` — no tests for chart render path or `kpi-cpi-yoy` DOM update
4. `renderWorstStates` — no tests (`getRegion()` South-count, `top10.at(-1)` crash-on-empty)
5. `computeVulnerabilityIndex` with all `mealCost: 0` — division-by-zero NaN not tested
6. `renderSnapGap` with empty `joined` array — reducer crash not tested
7. `snap-participation.json` data shape — `stateCoverage.states[].snapParticipants` field has no shape test
8. HTML `kpi-cpi-yoy` default staleness — hardcoded `2.6` vs live `3.1` not caught by any test

---

## Accessibility Issues

- **[Minor] No ECharts `aria` config on any of the 4 charts.** ECharts supports an `aria: { enabled: true }` option that generates accessible titles and descriptions for the canvas content. None of the 4 `setOption()` calls include it. At runtime, the chart `<canvas>` elements have no `aria-label` attribute — confirmed via DOM inspection. The outer `<div>` wrappers have `role="img"` and `aria-label` which provides a static fallback, but the ECharts DOM nesting (canvas inside a div inside the `role="img"` div) may confuse some assistive technologies.

- **[Minor] Map tooltip "Hover for state details" hint is not keyboard-discoverable.** The vulnerability map's per-state detail is only accessible via mouse hover. No keyboard focus handler is registered on the ECharts map series. Keyboard users cannot access state-level detail data.

- **[Minor] `"pp"` abbreviation in dynamic insight text is not screen-reader-friendly.** The map click handler generates text like `"Food insecurity is the primary driver, running 3.2 pp above the national average."` The abbreviation "pp" (percentage points) has no `<abbr>` expansion and is injected into a plain text node, not markup.  
  Location: [`src/js/dashboards/executive-summary.js:105`](../src/js/dashboards/executive-summary.js#L105)

- **[Minor] Dynamic insight containers (`#vulnerability-map-insight`, `#snap-gap-insight`, `#price-impact-insight`, `#worst-states-insight`) have no `aria-live` attribute.** These elements are populated after data loads. Screen readers will not announce the new content unless `aria-live="polite"` is set on the container (or an ancestor).

- **[Minor] "Grant Writers", "Executive Directors", "Policy Advocates" card titles use `<div>` not a heading.** These visually appear as subheadings under the "How Organizations Use These Insights" H2, but they are plain `<div>` elements — invisible to screen reader heading navigation.  
  Location: [`dashboards/executive-summary.html:297–309`](../dashboards/executive-summary.html#L297)

- **[Minor] KPI reconciliation notes use `title=""` attribute only.** The tooltip text explaining the 41.8M vs 47.9M methodological discrepancy is only surfaced via `title` on the `.dashboard-stat` wrapper. `title` tooltips are inaccessible on touch devices and not consistently announced by screen readers.

- **[Pass] Heading hierarchy is correct** — H1 → H2 → H3 throughout with no skipped levels.

---

## Mobile Rendering Issues

Screenshots taken via Playwright full-page capture at 375px width. Saved to `c:/tmp/exec-summary-mobile.png` and `c:/tmp/exec-summary-desktop.png`.

- **[Minor] Dashboard tab bar overflows at 375px.** The 7-tab row is too wide for the viewport. The tabs scroll horizontally but there is no visible scroll indicator or affordance. The active "Summary" tab may be off-screen to the right, requiring the user to scroll the tab bar to see it — with no cue that scrolling is available.

- **[Minor] Map chart at 300px height on mobile is usable but cramped.** The US choropleth at 300px (≤480px breakpoint) renders legibly, but Alaska/Hawaii insets are small. No zoom or touch-pan is enabled (`roam: false`).

- **[Pass] No horizontal page overflow** — `body.scrollWidth === body.clientWidth` confirmed at desktop viewport; mobile layout uses `flex-direction: column` correctly.

- **[Pass] KPI stats stack to single column** at ≤480px (`flex-direction: column`).

- **[Pass] All 4 chart containers render at appropriate mobile heights** (260px bar/line, 300px map at ≤480px).

---

## Chart Configuration Issues

1. **[Minor] `aria` config absent on all 4 charts** (see Accessibility section — same finding).

2. **[Minor] `chart-snap-gap` y-axis has no unit label.** The y-axis uses `fmtNum(v)` (producing "1.0M", "500K" etc.) but has no `name` property. Other charts on the page set `name: 'YoY Change (%)'`. The SNAP gap y-axis values are ambiguous without a label identifying them as "People" or "Persons".

3. **[Minor] `chart-price-impact` hardcodes the area gradient with inline `rgba(255,107,53,...)` instead of referencing `COLORS.accent`.** The color `rgba(255,107,53,0.3)` correctly corresponds to `COLORS.accent` (`#ff6b35`) numerically, but uses a raw rgba string rather than the shared constant — a maintenance risk if the accent color changes.  
   Location: [`src/js/dashboards/executive-summary.js:264`](../src/js/dashboards/executive-summary.js#L264)

4. **[Pass] All charts use colors from `COLORS` or `MAP_PALETTES`** imported from `dashboard-utils.js`. No chart uses colors from outside the shared palette (aside from the inline rgba noted above which matches the constant).

5. **[Pass] `TOOLTIP_STYLE` applied consistently to all 4 charts.**

---

## Prioritized Findings

| # | Issue | Severity | Effort |
|---|---|---|---|
| 1 | HTML methodology text typo: `normalized meal cost × 30` should be `× 0.3` (line 379 in source) | Critical | XS — 1-char fix |
| 2 | `renderSnapGap` reducer crashes on empty `joined` array (`joined[0]` is undefined) | Major | XS — add `if (!joined.length) return;` guard |
| 3 | `computeVulnerabilityIndex` division-by-zero when all `mealCost` values are 0 (`maxMealCost = 0`) | Major | XS — guard before map |
| 4 | `kpi-cpi-yoy` HTML default hardcodes `2.6%` — live computed value is `3.1%` | Major | XS — update `data-target="2.6"` → `"3.1"` |
| 5 | "Food Bank Orgs" KPI (61.3K) has no `id`, no data source, undocumented provenance | Major | S — document source, add id, or mark explicitly as static |
| 6 | Single `try/catch` swallows all 4 fetch failures silently — no user-visible error state | Major | S — add per-section error placeholder |
| 7 | Dynamic insight containers (`#*-insight`) have no `aria-live` — screen readers miss updates | Minor | XS — add `aria-live="polite"` to 4 containers in HTML |
| 8 | No tests for `renderSnapGap`, `renderWorstStates`, `renderVulnerabilityMap`, `renderPriceImpact` | Minor | M — 4 new describe blocks |
| 9 | `computeVulnerabilityIndex` mealCost=0 NaN edge case not tested | Minor | XS — 1 new `it()` |
| 10 | `snap-participation.json` shape (`stateCoverage.states[].snapParticipants`) not tested | Minor | XS — 1 new describe block |
| 11 | ECharts `aria` config absent on all 4 charts | Minor | S — add `aria: { enabled: true }` to each setOption |
| 12 | Dashboard tab bar overflows on mobile with no scroll affordance | Minor | S — CSS fade edge or scroll-snap |
| 13 | Card titles ("Grant Writers" etc.) use `<div>` instead of `<h3>` | Minor | XS — change tag |
| 14 | `chart-snap-gap` y-axis missing unit label | Minor | XS — add `name: 'Persons'` |
| 15 | KPI reconciliation notes only accessible via `title` tooltip (not touch/screen reader) | Minor | S — add visually-hidden or `aria-describedby` text |
| 16 | `"pp"` abbreviation in map click insight is not screen-reader-friendly | Minor | XS — expand to "percentage points" |
| 17 | Inline rgba in price chart area gradient should reference `COLORS.accent` | Minor | XS — refactor to use constant |
