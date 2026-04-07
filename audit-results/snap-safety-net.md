# SNAP Safety Net Dashboard Audit

Audited: 2026-04-07  
Production URL: https://food-n-force.com/dashboards/snap-safety-net.html  
Source: `src/js/dashboards/snap-safety-net.js` · `dashboards/snap-safety-net.html` · `public/data/snap-participation.json`

---

## API Endpoints

| Endpoint | Method | Live Status | Shape Match | Issues |
|---|---|---|---|---|
| `GET /data/snap-participation.json` | Static file | **200 OK** | Yes | Primary data file. All required fields present. |
| `GET /data/us-states-geo.json` | Static file | **200 OK** | Yes | GeoJSON for choropleth map. |
| `GET /api/dashboard-bls.php` | PHP proxy | **200 OK** | Yes | Returns `{ series: [...] }`. Code looks for `s.name === 'Food at Home'` — that series is present. 3 series returned: Food at Home, Food Away from Home, All Items. |
| `GET /api/dashboard-places.php?type=snap-receipt` | PHP proxy | **200 OK** | Partial | Returns `{ records: [{state, value}] }`. Only **40 of 51** state+DC records returned. Code filters silently — 11 states will render as gray on the CDC toggle view with no explanation. |
| `GET /api/dashboard-sdoh.php` | PHP proxy | **200 OK** | Yes | Returns `{ states: [...] }`. Each state has a `race` object with `whitePct`, `blackPct`, `asianPct`, `hispanicPct`. Fields match what the code expects. |

Dev proxy (localhost:4173) was not running at audit time — not tested.

---

## Hardcoded / Stale Data

- **Hero stats hardcoded in HTML** — `data-target="42.1"`, `data-target="188"`, `data-target="52.1"`, `data-target="8.2"` at [snap-safety-net.html:167–179](../dashboards/snap-safety-net.html). These are not driven by `snap-participation.json` at runtime. Currently accurate, but will silently drift if the JSON is updated without also editing the HTML.

- **Map info panel "Data Year: 2022 (FNS)"** stale — [snap-safety-net.html:247](../dashboards/snap-safety-net.html) says `2022 (FNS) | 2023 (CDC PLACES)` but `stateCoverage.year` in the JSON is `2024`. The freshness badge correctly shows "FY2024". The static info panel label is wrong.

- **`mealCostPerDay` fallback hardcoded at `3.58`** — [snap-safety-net.js:492](../src/js/dashboards/snap-safety-net.js). The JSON supplies this value so the fallback is currently never reached, but the code comment says "update annually", implying manual maintenance is required.

- **`updateFreshness('snap-sankey', { _static: true, _dataYear: 2022 })`** — [snap-safety-net.js:711](../src/js/dashboards/snap-safety-net.js) hardcodes 2022. This matches `sankey.year: 2022` in the JSON but is not driven by that field.

- **`benefitsPerPerson.year` in JSON is `2024`** but `updateFreshness('snap-benefits', { _static: true, _dataYear: 'FY2025' })` says FY2025 at [snap-safety-net.js:713](../src/js/dashboards/snap-safety-net.js). Minor inconsistency between JSON metadata and the freshness label shown to users.

- **`snapNational?.avgMonthlyBenefit || 188` fallback** — [snap-safety-net.js:48](../src/js/dashboards/snap-safety-net.js). Hardcodes `$188` as PPI fallback. This path is unreachable in normal operation since `snapNationalData` is populated before `fetchBLSForSnap()` is called, but the dead fallback will become wrong when the national benefit changes.

- **Gauge threshold maxes are all hardcoded**: `coverage` max=100, `lunch` max=100, `benefit` max=350, `gap` max=15M, `affordability` max=200. These are not data-driven. The `benefit` max (350) currently accommodates Hawaii's $312 — confirmed by test. The `affordability` max (200) has no test — current computed value is $134, leaving a 66-point margin.

---

## Data Transformation Gaps

**`renderGauges(national)` — NaN risk**
```js
const affordabilityGap = monthlyFoodCost - national.avgMonthlyBenefit;
```
If `national.avgMonthlyBenefit` is absent from the JSON, `affordabilityGap` becomes `NaN`. ECharts gauge would render `NaN$`. No guard present.

**`renderDemographicFlow` — negative "Other" race percentage**
```js
raceGroups['Other'] += pop * ((100 - hispanicPct - whitePct - blackPct - asianPct) / 100);
```
If the four reported race percentages sum to more than 100 (possible due to Census rounding, multiracial classification, or Hispanic overlap with other categories), `Other` becomes negative. A negative Sankey link value causes ECharts to either ignore the link or render it incorrectly. No `Math.max(0, ...)` guard.

**`renderSnapTrend` — CPI date alignment gap**
```js
const cpiAligned = dates.map(date => cpiMap[date] ?? null);
```
Uses exact date string match. SNAP trend dates include sparse quarterly/bi-monthly entries (e.g., `2015-01`, `2015-06`, `2015-12`) while BLS returns monthly data. For pre-2025 SNAP dates that don't fall on a BLS-covered month, the CPI lookup returns null and the PPI line shows a gap. This is handled gracefully (null rendered as gap), but the PPI line will appear broken in the 2015–2024 range where SNAP dates are coarser than BLS monthly output.

**`renderSchoolLunch` — assumes pre-sorted JSON**
```js
const top15 = lunchData.slice(0, 15);
```
The JSON is currently sorted by `pct` descending (Mississippi 75.8% first), so `slice(0, 15)` gives the top 15 states. There is no `.sort()` in the code. If the JSON order changes, this silently shows wrong states in the Nightingale chart.

**`renderCoverageGap` — Sankey node lookup in tooltip**
```js
const sourceNode = nodes.find(n => n.name === p.data.source);
```
Node names contain `\n` (e.g., `"Children\n13M"`). The lookup uses the full name including `\n`, which matches correctly since nodes are built from the same JSON. No bug, but it makes the tooltip formatter brittle to node name changes.

---

## Test Coverage Gaps

**Currently covered (8 tests in snap-safety-net.test.js):**
- `SNAP_MAP_DEFAULT_INSIGHT` references actual lowest-coverage state and correct ratio
- Reconciliation note accuracy
- Benefit gauge max (350) accommodates all state benefit values
- HTML data notice year not stale
- JSON shape: `national`, `stateCoverage.states`, `benefitsPerPerson.states`, `sankey`, `trend`
- `benefitTimeline` exists and has meaningful variation
- PPI calculation uses `snapBenefitTimeline` (not static fallback)

**Not tested — gaps:**

| Untested Behavior | Risk |
|---|---|
| `renderGauges` coverage formula: `snapParticipants / (snapParticipants + coverageGap)` | Moderate |
| `renderGauges` NaN guard on `affordabilityGap` when `avgMonthlyBenefit` missing | Low |
| `renderGauges` affordability max (200) — no test that `affordabilityGap < 200` | Minor |
| `renderDemographicFlow` — negative "Other" race percentage | Moderate |
| `renderSchoolLunch` — top15 requires pre-sorted JSON | Minor |
| `renderBenefits` — null insecurity rates for states not in `coverageStates` | Low |
| `renderSnapTrend` — behavior when "Food at Home" series absent from BLS response | Low |
| `fetchBLSForSnap`, `fetchCDCPlacesSnap`, `fetchDemographicData` (all 3 async fetches) | None tested |
| CDC PLACES returning < 51 states | Minor |
| `applySnapMapView('cdc')` when `snapMapCdcData` is null | Low |

---

## Accessibility Issues

**Major:**
1. **Gauge values not announced to screen readers** — All 5 gauge `<div>` containers have `role="img"` and static `aria-label` text (e.g., "Gauge showing SNAP coverage ratio") but no dynamic value. The computed value (e.g., 83.7%) is rendered entirely inside ECharts canvas. A screen reader user hears the static label but never the actual number. The info panel text contains the values in prose form, which is helpful but requires navigating past the chart.

2. **`snap-map-insight` has no `aria-live`** — Updated on map state click ([snap-safety-net.js:155–189](../src/js/dashboards/snap-safety-net.js)), but the `<div id="snap-map-insight">` has no `aria-live` attribute. Screen reader users clicking a state will not have the insight text read aloud.

3. **`demographic-flow-insight` has no `aria-live`** — Populated when the demographic section loads ([snap-safety-net.js:678](../src/js/dashboards/snap-safety-net.js)), but the `<div id="demographic-flow-insight">` has no `aria-live` attribute.

4. **CDC PLACES toggle appearance not announced** — When `fetchCDCPlacesSnap()` resolves, `toggleContainer.style.display = ''` shows the toggle buttons. No `aria-live` region notifies screen reader users that new controls appeared.

**Minor:**
5. **No ECharts `aria` config on any chart** — All 7 `setOption` calls omit `aria: { enabled: true }`. The wrapper `role="img"` provides minimum compliance, but ECharts native aria would expose series descriptions.

6. **Both Sankey charts have no data equivalent for screen readers** — Static `aria-label` text describes what the chart is, not the values. No `<table>` fallback or `aria-describedby` pointing to the insight text callout.

**Heading hierarchy:** Valid — H1 → H2 (per section) → H3 (per info panel). No skips.

**Skip link and focus management:** Present and correct.

---

## Mobile Rendering Issues

Screenshots taken: desktop 1280×900 (confirmed correct — hero stats visible, BLS CPI overlay loaded, all charts rendering), mobile 375×812.

**Minor:**
1. **Hero stat grid collapses to 1-column at 375px** — Only one stat card visible per row; users must scroll past 4 cards before reaching charts. This is the shared dashboard pattern and not unique to this page, but it pushes chart content further down the fold.

2. **Dashboard tab bar requires horizontal scroll at 375px** — "SNAP & Safety Net" tab is visible and active but tabs overflow horizontally with no visual indicator of scrollability. Shared pattern across all dashboards.

3. **5 KPI gauges stack 2–2–1 at 375px** — `grid-template-columns: repeat(auto-fit, minmax(150px, 1fr))` produces two gauges per row at 375px, leaving the 5th gauge (Monthly Shortfall) alone in a third row at full width. Functional but visually asymmetric. Consider `minmax(140px, 1fr)` to allow 2 per row more consistently, or accept the layout.

4. **Sankey charts on narrow screens** — Node labels in the Sankey (`renderCoverageGap`) include embedded count values (e.g., `"Children\n13M"`) which may overlap or truncate at 375px. The `label: { color: COLORS.text, fontSize: 11, fontWeight: 'bold' }` config has no overflow handling. Not confirmed live due to Playwright navigation issues during testing.

**Playwright note:** The browser consistently navigated away from snap-safety-net.html to other dashboard pages a few seconds after each resize event. This appears to be a test-environment artifact (likely `smart-scroll.js` IntersectionObserver or `performance-monitor.js` reacting to the resize) — not a production bug. Real users on mobile do not encounter this.

---

## Chart Configuration Issues

1. **Trend chart Y-axis min/max hardcoded at `min: 34, max: 48`** ([snap-safety-net.js:32](../src/js/dashboards/snap-safety-net.js)) — Enrollment is currently at 40.4M and declining. If SNAP enrollment drops below 34M (historically plausible), the axis clips the data on initial view. The `dataZoom` slider would still expose it, but the main chart area would misrepresent the trend. Recommend removing explicit `min`/`max` to let ECharts auto-scale.

2. **CDC map visual range hardcoded `min: 3, max: 25`** ([snap-safety-net.js:295](../src/js/dashboards/snap-safety-net.js)) — Not data-driven. Adequate for current CDC BRFSS range (~5–22%) but would silently clip outliers.

3. **Admin map visual range hardcoded `min: 40, max: 150`** ([snap-safety-net.js:245](../src/js/dashboards/snap-safety-net.js)) — Current data max is Oregon at 131.8%, within range. DC at 130.2%, also fine. Adequate for current data but not data-driven.

4. **Sankey `layoutIterations: 0`** ([snap-safety-net.js:354](../src/js/dashboards/snap-safety-net.js)) — Disables ECharts' automatic node layout optimization. Intentional (paired with `layout: 'none'` from JSON) but means the visualization degrades silently if link values shift significantly.

5. **No ECharts `aria` config on any chart instance** — `aria: { enabled: true }` absent from all 7 `setOption` calls. Affects all charts equally.

6. **Trend chart tooltip `else` branch** ([snap-safety-net.js:103](../src/js/dashboards/snap-safety-net.js)) — Falls through to a catch-all that labels any unrecognized series as Food CPI. Future series additions would inherit a wrong label.

---

## Prioritized Findings

| # | Issue | Severity | Effort |
|---|---|---|---|
| 1 | Hero stats hardcoded in HTML — will silently drift when JSON updates | Major | Small |
| 2 | Map info panel says "Data Year: 2022 (FNS)" but data is 2024 | Major | Trivial |
| 3 | `snap-map-insight` and `demographic-flow-insight` updated dynamically without `aria-live` | Major | Trivial |
| 4 | CDC PLACES toggle appears without screen reader notification | Major | Trivial |
| 5 | Gauge values (e.g., 83.7%) inaccessible to screen readers — no `aria-live` or visible text alternative | Major | Small |
| 6 | `renderDemographicFlow` "Other" race % can go negative — no `Math.max(0, ...)` guard | Moderate | Trivial |
| 7 | CDC PLACES returns only 40/51 states — gray patches on toggle map with no explanation | Moderate | Small |
| 8 | Trend chart Y-axis `min: 34` hardcoded — clips data if enrollment falls below 34M | Moderate | Trivial |
| 9 | School lunch `slice(0, 15)` relies on JSON sort order — no defensive `.sort()` | Minor | Trivial |
| 10 | `benefitsPerPerson.year: 2024` in JSON vs `_dataYear: 'FY2025'` in freshness call | Minor | Trivial |
| 11 | `affordabilityGap` gauge max (200) has no test — NaN risk if `avgMonthlyBenefit` missing | Minor | Trivial |
| 12 | No ECharts `aria` config on any of 7 chart instances | Minor | Small |
| 13 | Async fetch functions (BLS, CDC, SDOH) have zero test coverage | Minor | Medium |
