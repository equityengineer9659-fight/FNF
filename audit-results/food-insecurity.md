# Food Insecurity Dashboard Audit

**Date:** 2026-04-07  
**Auditor:** Claude Code (automated — full re-audit)  
**Page:** `https://food-n-force.com/dashboards/food-insecurity.html`  
**Source:** [`src/js/dashboards/food-insecurity.js`](../src/js/dashboards/food-insecurity.js) · [`dashboards/food-insecurity.html`](../dashboards/food-insecurity.html)  
**Tests:** [`src/js/dashboards/food-insecurity.test.js`](../src/js/dashboards/food-insecurity.test.js)

---

## API Endpoints

| Endpoint | Live Status | Shape Match | Issues |
|---|---|---|---|
| `GET /data/food-insecurity-state.json` | 200 OK (static) | Yes | None — primary data, always available |
| `GET /data/us-states-geo.json` | 200 OK (static) | Yes | None |
| `GET /data/county-index.json` | 200 OK (static) | Yes | None |
| `GET /data/counties/{fips}.json` | 200 OK (static) | Yes | Truthy filter bug drops counties with `rate === 0` (see Data Transformation) |
| `GET /data/current-food-access.json` | 200 OK (static) | Yes | Computed 2026-04-06; data is current |
| `GET /data/food-bank-summary.json` | 200 OK (static) | Yes | `fetchedAt: "2026-03-30"`, `year: 2023`; static, no live update on this dashboard |
| `GET /api/dashboard-saipe.php?type=states` | 200 OK | Yes — `records[]` with `fips`, `povertyRate`, `childPovertyRate`, `medianIncome` | `povertyRate` has float precision artifact (e.g. `15.699999...` instead of `15.7`); used directly in tooltip display without rounding |
| `GET /api/dashboard-bls.php` | 200 OK | Yes — `series[]` with `name`, `data[{date,value}]` | None |
| `GET /api/dashboard-sdoh.php` | 200 OK | Yes — `states[]` with `uninsuredPct`, `collegePct`, `unemploymentPct`, `noVehiclePct`, `housingBurdenPct`, `income{}` | CDC PLACES fields absent until `fetchCDCPlacesData()` merges them in |
| `GET /api/dashboard-census.php?type=states` | 200 OK | Yes — `records[]` with `fips`, `povertyRate`, `population` | ACS fallback does not patch `childPovertyRate`; Child Poverty scatter stays stale if SAIPE fails |
| `GET /api/dashboard-places.php?type=health-indicators` | 200 OK | **Mismatch** — API returns full measure name strings as keys (e.g. `"depression among adults"`, `"obesity among adults"`); JS merges using `p.obesity`, `p.diabetes`, `p.depression`, `p.housinsec` — these short-form field names do not exist in the API response | **Critical** — CDC PLACES Health Outcomes buttons (Obesity, Diabetes, Depression, Housing Insecurity) never populate; `initSDOHButtons()` never adds the Health Outcomes group |

**Dev server:** Not running during audit. All endpoint tests run against production (`https://food-n-force.com`).

---

## Hardcoded / Stale Data

- **Hero stat counters** — `data-target="47.9"`, `"13.7"`, `"14.1"`, `"10.9"` are hardcoded HTML attributes in `dashboards/food-insecurity.html` lines 174–188. `animateCounters()` reads these attributes directly at runtime with no binding to `food-insecurity-state.json`. If the JSON is updated with new figures, counters will not change until the HTML is also manually updated.

- **Map insight initial value** — [`dashboards/food-insecurity.html:241`](../dashboards/food-insecurity.html#L241) hardcodes: `"Mississippi leads the nation at 18.7% — nearly 1 in 5 residents."` JS recomputes this dynamically via `showNational()` after data loads, but there is a flash of the hardcoded string before JS executes. If Mississippi's rate changes in JSON, the server-rendered fallback is stale.

- **Static narrative copy not driven by data** — The following strings in HTML will not update when JSON data changes:
  - Meal cost range: `"from $3.18 in Mississippi to $5.12 in Hawaii"` (meal cost info panel)
  - Meal cost insight: `"Hawaii's $5.12/meal is 28% above the national average"` (hardcoded `dashboard-info__insight`)
  - SNAP insight: `"Alabama and West Virginia show SNAP coverage exceeding insecurity"` (hardcoded `dashboard-info__insight`)
  - CPI insight: `"Food-at-home prices rose ~28% from 2020-2024"` (hardcoded `dashboard-info__insight`)

- **SNAP chart legend/series year mismatch** — `renderSnap()` legend at line 836 declares `"SNAP Coverage (FY2024)"` but the series `name` at line 869 is `"SNAP Coverage (FY2023)"`. ECharts matches legend entries by exact string — the series is disconnected from the legend, making legend toggling non-functional for that series.

- **Trend chart title hardcoded** — `<h2>National Trend (2013-2024)</h2>` is static. The chart renders projected data through 2026, making the heading description inaccurate.

- **`food-bank-summary.json`** — `fetchedAt: "2026-03-30"`, `year: 2023` (IRS 990 data). Static with no live update mechanism on this dashboard.

---

## Data Transformation Gaps

### `drillDown()` — County filter truthy check ([`js:155`](../src/js/dashboards/food-insecurity.js#L155))
```js
.filter(f => f.properties.rate)
```
Silently drops counties where `rate === 0`. Should use an explicit null/undefined check. This is documented as a known bug in [`food-insecurity.test.js:59`](../src/js/dashboards/food-insecurity.test.js#L59) but has not been fixed in production.

### `renderSnap()` — Division by zero ([`js:828`](../src/js/dashboards/food-insecurity.js#L828))
```js
const snapCoverageRatio = sorted.map(s => Math.round((s.snapParticipation / s.persons) * 100));
```
No guard for `s.persons === 0`. Produces `NaN` bars. The map version guards this with a ternary at line 31; the SNAP chart version does not.

### `renderTripleBurden()` — `Math.min/max` on empty array ([`js:1382`](../src/js/dashboards/food-insecurity.js#L1382))
```js
const accessVals = data.states.map(s => accessByName[s.name] || 0).filter(v => v > 0);
const accMin = Math.min(...accessVals), accMax = Math.max(...accessVals);
```
If `accessData` is null or has no matching states, `accessVals === []`. `Math.min(...[])` returns `Infinity` and `Math.max(...[])` returns `-Infinity`, causing `norm()` to produce `NaN` for every `accessScore`. All stacked bar segments silently disappear and the insight displays `"NaN/300"`.

### `renderSDOH()` — `linearRegression` called with potentially empty array ([`js:1028`](../src/js/dashboards/food-insecurity.js#L1028))
```js
const reg = linearRegression(points.map(p => p.value));
```
No guard for `points.length === 0`. If no SDOH states match food-insecurity state names, `linearRegression([])` returns `NaN` for `slope`, `intercept`, and `r`. The insight text then displays `"r = NaN"`.

### `renderIncomeRiver()` — Null income band values ([`js:1295`](../src/js/dashboards/food-insecurity.js#L1295))
```js
riverData.push([i, s.income[band.key], band.label]);
```
If `s.income[band.key]` is `undefined`, it is pushed into river data. ECharts silently misrenders that band. No null coalesce or guard exists.

### `renderIncomeRiver()` — Small dataset overlap in insight ([`js:1353`](../src/js/dashboards/food-insecurity.js#L1353))
```js
const lowInsecurity = merged.slice(0, 10);
const highInsecurity = merged.slice(-10);
```
If `merged.length < 10`, these slices overlap and the insight compares the same states to themselves — producing a meaningless `0.0% vs 0.0%` result.

### `renderBar()` — `maxSnap === 0` divide-by-zero ([`js:581`](../src/js/dashboards/food-insecurity.js#L581))
```js
const maxSnap = Math.max(...data.states.map(s => s.snapParticipation));
```
If all `snapParticipation` values are 0, `maxSnap === 0` and the normalize function produces `NaN` for all radar SNAP dimension values. Unlikely with real data but unguarded.

### `_tryACSFallback()` — Missing `childPovertyRate` in merge ([`js:1701`](../src/js/dashboards/food-insecurity.js#L1701))
The ACS fallback only updates `povertyRate` and `population`. It does not update `childPovertyRate`. If SAIPE is unavailable and ACS runs as fallback, the Child Poverty scatter toggle silently uses the static `childPovertyRate` from the JSON.

### County tooltip — meal cost is state average shown as county-specific ([`js:74`](../src/js/dashboards/food-insecurity.js#L74))
```js
Avg Meal Cost: $${d.mealCost} <span style="opacity:0.7">(state avg)</span>
```
The `(state avg)` label is present in the tooltip which is correct. However the county GeoJSON properties spread the state `mealCost` value into every county record — a user could mistake the value for a county-specific figure without reading the small parenthetical. The HTML in the tooltip string is valid but the disambiguation is subtle.

---

## Test Coverage Gaps

**Functions with existing test coverage:**
- County filter truthy bug (documented in test; fix logic tested but bug preserved in production)
- Hardcoded Mississippi insight detection (source-scan test)
- SNAP legend year mismatch detection (source-scan test)
- `food-insecurity-state.json` data shape (national, state, trend fields)
- County GeoJSON file existence (all 51 FIPS)
- County feature `fips` property key (spot-checks)
- County search ARIA attributes (HTML string scan)

**Functions with no test coverage:**
- `renderTrend()` — projected series null-fill logic, `actualRates`/`projectedRates` boundary, markLine annotations
- `renderBar()` — radar normalize, `maxSnap === 0` NaN case, correct top/bottom 5 slicing
- `renderScatter()` — empty-points fallback render, region grouping, regression line, `isChild` branch with no `childPovertyRate` data
- `renderSDOH()` — metric lookup, point merge, empty-array guard for `linearRegression`, `invert` axis logic
- `initSDOHButtons()` — active-key preservation on re-render, `placesAvailable` conditional, CDC button injection
- `fetchCDCPlacesData()` — **the critical CDC PLACES field-name merge bug is entirely untested**
- `renderDemographics()` — `avgGap` computation, `worstState` = `sorted[sorted.length - 1]` (highest child rate after reversing), `s.rate === 0` divide guard in multiplier
- `renderIncomeRiver()` — `riverData` shape, null band value guard, small-dataset overlap, insight calculation
- `renderTripleBurden()` — `norm()` with `Infinity` bounds, NaN propagation from empty `accessVals`, scoring correctness
- `renderStateDeepDive()` — KPI panel rendering, null `access`/`bank` data fallback, `buildStateInsight()` output
- `buildStateInsight()` — boundary cases: `coverage > 100`, `coverage === 0`, `rank === 1`
- `renderSnap()` — `s.persons === 0` NaN guard
- `renderMealCost()` — `natAvg` undefined when `data.national.averageMealCost` is missing
- `initCountySearch()` — keyboard navigation (ArrowDown/Up/Enter/Escape), lazy-load on first focus, results clear on short query
- `_trySAIPE()` / `_tryACSFallback()` — merge logic, FIPS lookup miss, fallback chain, missing `childPovertyRate` in ACS path

---

## Accessibility Issues

### Critical

- **Map is not keyboard-accessible:** `#chart-map` has `tabindex="-1"` and `role="img"`. The county drill-down requires a mouse click — there is no keyboard trigger. `role="img"` declares the element as a static image to AT, misrepresenting its interactive nature. Keyboard users can receive programmatic focus from the Back button's `mapEl.focus()` call but cannot navigate into states or trigger drill-down. No `aria-keyshortcuts` or keyboard instructions exist.

### Major

- **Map `role="img"` is semantically wrong for interactive content:** An element that accepts clicks and updates dynamically should use `role="application"` or be wrapped in an `aria-label`led region with instructions. `role="img"` communicates a non-interactive static graphic to AT.

- **`#county-search` missing `aria-activedescendant`:** The combobox sets `aria-expanded` and renders `role="option"` items with `aria-selected` during keyboard navigation, but never sets `aria-activedescendant` on the input to reference the focused option. Screen readers will not announce the active option as the user arrows through results.

- **Hero counter animation announces interim values:** `animateCounters()` runs a 2-second animation counting up from zero. If the counter container is within an `aria-live` region, screen readers announce every intermediate frame (fragments like `"5.4%"`, `"17.1M"`) before reaching the correct final value. The correct static values sit in `data-target` HTML attributes but are not surfaced separately to AT.

- **SDOH health-outcome category label is `aria-hidden`:** `<span class="dashboard-metric-separator" aria-hidden="true">Health Outcomes</span>` hides the category boundary from AT. Screen reader users have no indication they are transitioning from Census metrics to CDC PLACES metrics in the button group.

- **State Deep-Dive KPI panel — no semantic structure or ARIA associations:** `renderStateDeepDive()` injects raw HTML where KPI labels and values are disconnected `<div>` elements with only inline `style=`. No `<dl>`/`<dt>`/`<dd>`, no `aria-label`, no `aria-describedby`. Screen readers read label and value as unrelated text strings.

### Minor

- **Chart `aria-label` strings are static:** All 12 chart containers have a descriptive `aria-label`. When the user changes the map metric from "Food Insecurity Rate" to "SNAP Coverage Ratio", the `aria-label` still reads `"Choropleth map of food insecurity rates across US states"`. The description is no longer accurate after a metric change.

- **ECharts `aria` config not enabled on any chart:** No chart instance sets `aria: { enabled: true }`. ECharts' built-in accessible description mechanism (including decal patterns for color-blind users) is unused across all 12 charts.

- **`#map-back-btn` label lacks context:** `aria-label="Back to national view"` is functional. However the button is `display:none` until drill-down occurs and becomes focusable only when visible — correct behavior.

- **Heading hierarchy is correct:** `h1` → `h2` → `h3` is used consistently throughout with no skipped levels.

---

## Mobile Rendering Issues

**Viewport tested:** 375 × 812px (iPhone SE / standard mobile)  
**Screenshot:** `c:/tmp/food-insecurity-mobile.png`

### Major

- **Dashboard tabs overflow with no discovery affordance:** At 375px, only 3 of 7 dashboard tabs are visible ("Overview", "Food Access", "SNAP & Safety Net"). The tab rail is horizontally scrollable but provides no visual indicator — no fade edge, no arrow, no scrollbar hint. Users may not discover "Food Prices", "Food Banks", "Nonprofit Directory", or "Summary" without accidentally swiping.

### Minor

- **Data Notice banner displaces hero stats below fold:** The `dashboard-data-notice` block spans ~5 lines of text on mobile. Combined with the sticky nav and tab bar, the hero heading and KPI stats are pushed ~40% down the viewport. The first visible content on mobile is the warning notice rather than the dashboard's primary KPIs.

- **Map metric select and state selector stack vertically on mobile:** Both controls render in the card header and stack on narrow viewports, consuming significant space (~80px) above the map canvas before any chart is visible. No overflow or clipping was observed but the layout is dense.

- **Counter animation restarts on every navigation load:** `animateCounters()` runs on every `DOMContentLoaded`. On slow connections, counters display interim values (e.g. `"2.4M"`, `"0.7%"`) for up to 2 seconds. On the mobile Playwright snapshot, the counter had already completed to 47.9M — behavior is timing-dependent.

---

## Chart Configuration Issues

### SNAP chart — Legend/series name mismatch (High)
`renderSnap()` line 836 declares legend entry `"SNAP Coverage (FY2024)"` but line 869 defines `name: "SNAP Coverage (FY2023)"`. ECharts requires exact string match. The series is disconnected from the legend — users cannot toggle it and the legend color swatch for SNAP will not appear. The series year label is also factually wrong (data is 2024).

### Map — `snapCoverage` > 100% with no contextual explanation
When SNAP participation exceeds food-insecure persons, the map shows values like 113%. The `metricConfig` range allows up to 150, but no tooltip text or UI explanation clarifies why values can exceed 100%. Users may interpret this as a data error.

### County drill-down — metric fallback renders wrong data silently
When a non-`rate` metric is selected (e.g. `childRate`) and the user drills into a county, line 158 uses `f.properties[currentMetric] || f.properties.rate`. If the county GeoJSON lacks that field, it silently falls back to `rate`. The visualMap legend and tooltip label still say "Child Food Insecurity" but display overall rates.

### Triple Burden — `accessScore === 0` with no missing-data indicator
States with no access data entry receive `accessScore === 0`, understating their composite score with no asterisk, footnote, or tooltip note to indicate incomplete data.

### BLS CPI chart — `foodAway`/`allItems` series not pinned to `foodHome` x-axis dates
The x-axis category array is built from `foodHome`'s non-null filtered dates (line 932). `foodAway` and `allItems` series are rendered with their own independent filter pass. If either series has null values at different indices than `foodHome`, x-axis labels and data points would silently misalign. Currently safe since all three series share the same monthly date range, but structurally fragile.

### ECharts `aria` config absent on all 12 charts
`aria: { enabled: true }` is not set on any chart instance. ECharts' built-in accessible descriptions and decal pattern fills for color-blind users are unavailable across the entire dashboard.

---

## Prioritized Findings

| # | Issue | Severity | Effort |
|---|---|---|---|
| 1 | CDC PLACES field name mismatch — `p.obesity`/`p.diabetes`/`p.depression`/`p.housinsec` don't match API keys; Health Outcomes buttons never render | Critical | Small |
| 2 | SNAP chart series name `"FY2023"` does not match legend `"FY2024"` — series disconnected from legend; incorrect year label | High | Trivial |
| 3 | `renderSnap()` — `s.persons === 0` produces `NaN` bars (no division-by-zero guard) | High | Trivial |
| 4 | County drill-down truthy filter `f.properties.rate` drops `rate === 0` counties (known bug, unfixed) | High | Trivial |
| 5 | `renderTripleBurden()` — `Math.min/max(...[])` on empty array produces `Infinity`/NaN when access data missing | High | Small |
| 6 | Map `role="img"` is wrong for interactive drill-down; no keyboard access to county drill-down | High | Medium |
| 7 | `_tryACSFallback()` does not patch `childPovertyRate` — Child Poverty scatter silently stale on SAIPE failure | Medium | Small |
| 8 | `#county-search` missing `aria-activedescendant` — keyboard navigation not announced by screen readers | Medium | Small |
| 9 | Mobile dashboard tabs — 4 of 7 hidden at 375px with no scroll indicator | Medium | Small |
| 10 | Map `aria-label` is static; does not update when metric toggle changes chart content | Medium | Small |
| 11 | Hero counter values hardcoded in HTML; not bound to JSON data | Medium | Medium |
| 12 | County metric fallback silently shows `rate` when `childRate` etc. absent from county GeoJSON | Medium | Small |
| 13 | `renderSDOH()` — no guard before `linearRegression([])` on empty points produces `"r = NaN"` insight | Medium | Small |
| 14 | `renderIncomeRiver()` — null income band values pushed unchecked into river data | Medium | Small |
| 15 | SDOH Health Outcomes category label `aria-hidden` — AT users don't know category boundary | Minor | Trivial |
| 16 | Trend chart heading hardcoded `"2013-2024"` while chart renders projected data to 2026 | Minor | Trivial |
| 17 | Static CPI / meal-cost / SNAP insight copy in HTML does not update from live data | Minor | Medium |
| 18 | State Deep-Dive KPI panel markup has no semantic structure or ARIA associations | Minor | Small |
| 19 | SAIPE float precision artifact (`15.699999...`) shown raw if included in tooltip | Minor | Trivial |
| 20 | No test coverage for `renderSDOH`, `renderIncomeRiver`, `renderTripleBurden`, `renderStateDeepDive`, `buildStateInsight`, `fetchCDCPlacesData` | Minor | Large |

---

## Live Behavior Notes (Playwright, 2026-04-07)

- All 5 PHP proxy endpoints responded 200 OK.
- All static JSON files loaded correctly (`food-insecurity-state.json`, `current-food-access.json`, `food-bank-summary.json`, `county-index.json`, `us-states-geo.json`).
- SDOH and Income River sections (initially `display:none`) appear correctly after live data loads — confirmed visible in 375px DOM snapshot.
- Triple Burden insight populated: `"Mississippi ranks #1 with a composite score of 218/300"`.
- Scatter upgraded to SAIPE after live call: insight shows `"r ≈ 0.92 (Census SAIPE)"`.
- No JS errors in browser console during either desktop or mobile load.
- CDC PLACES health outcome buttons (Obesity, Diabetes, Depression) did **not** appear in the SDOH button group — confirming the field-name mismatch bug (#1 above).
