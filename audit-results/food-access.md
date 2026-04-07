# Food Access Dashboard Audit

**Audited:** 2026-04-07
**Branch:** chore/codx-review-fixes
**Production URL:** https://food-n-force.com/dashboards/food-access.html

---

## API Endpoints

| Endpoint | Status | Shape Match | Issues |
|---|---|---|---|
| `GET /data/current-food-access.json` | 200 OK | Yes | No issues. Keys: `meta`, `national`, `states` (51 entries with `fips`, `name`, `lowAccessPct`, `avgDistance`, `totalPopulation`, `lowAccessPopulation`, `povertyRate`, `counties[]`). |
| `GET /data/snap-retailers.json` | 200 OK | Yes | No issues. Has `mediumGrocery` field used in CSV export. All 51 states present. |
| `GET /data/food-insecurity-state.json` | 200 OK | Yes | No issues. All 51 states have `povertyRate`. |
| `GET /data/us-states-geo.json` | 200 OK | Yes | Valid GeoJSON FeatureCollection. |
| `GET /data/counties/{fips}.json` | 200 OK (tested Alabama `01`) | Yes | First feature has `name`, `fips`, `rate`, `povertyRate`, `limitedAccess`. County drill-down can use these fields. |
| `GET /api/dashboard-sdoh.php` | 200 OK | Yes | Returns `states[]` with `housingBurdenPct`, `noVehiclePct`, `uninsuredPct`, `population`. Shape matches what `fetchSDOHAccess()` reads. |
| `GET /api/dashboard-places.php?type=food-insecurity` | 200 OK | **Partial** | Returns only **40 of 51 states**. Missing: CO, FL, KY, NV, OH, PA, TN, TX, WA, WY, and one more. The `renderInsecurityMap()` silently drops unmatched states — those states render as unfilled on the Food Insecurity map. |

**Dev proxy:** localhost:4173 was not running — not tested.

**Map toggle notes:** All three modes (Food Deserts, Food Insecurity, SNAP Retailers) are wired and data is present. SNAP mode disables drill-down via `setDrillDown(false)`. Food Insecurity mode sets `setDrillDown(true)` but the state tooltip says "Click for county breakdown" — the click handler in `renderDesertMap` guards on `params.data?.fips`, and `renderInsecurityMap` sets `fips: null` on all data points, so **clicking states in Food Insecurity mode silently does nothing** even though the tooltip and hint text promise a county breakdown.

---

## Hardcoded / Stale Data

- **Hero stat hardcodes (minor — JS overrides them):** The HTML contains `data-target="137.5"`, `data-target="34638"`, `data-target="2.1"`, `data-target="41"`. These are overridden at runtime by `init()` via `animateCounters()`. The hardcoded fallback values match the live JSON exactly (`lowAccessPopulation=137524470→137.5M`, `avgDistance=2.12→toFixed(1)=2.1`, `lowAccessPct=41`, `lowAccessTracts=34638`), so no visible stale data for now — but if the JSON changes, the HTML fallback will briefly flash the old values before JS runs.

- **Hardcoded visual map scale (`visualMap.min/max`) in `showNational()`:** `min: 7, max: 24` is hardcoded for the original desert map. However `renderLowAccessMap` (the new default) uses `min: 20, max: 65`. The `showNational()` function inside `renderDesertMap` is still called as a fallback in the `switchMapView` else-branch (line 1344), which would apply the wrong 7–24 scale to the current food desert data (actual range is 20–65).

- **SNAP Retailers visualMap hardcoded range:** `min: 58, max: 125` in `renderSnapRetailers`. These appear derived from the static data and match the file, so no staleness risk unless the file is regenerated.

- **Hardcoded year strings:** `_dataYear: 'FY2024'` (SNAP retailers freshness), `_dataYear: 'Current'` (food access freshness). Not stale — these correctly describe the source vintage.

- **povertyRate overwrite:** `init()` merges poverty rate from `food-insecurity-state.json` over the values already in `current-food-access.json` using a truthy check (`if (fiByName[s.name]) s.povertyRate = ...`). This overwrites the values already present in `current-food-access.json` with values from a different source. For 17 states the two sources differ by more than 0.5 percentage points (e.g. Arizona: 12.5 vs 14.1, South Dakota: 11.6 vs 13.1). The Double Burden estimate (`lowAccessPopulation × povertyRate/100`) uses whichever value wins the merge, creating inconsistency between the map tooltip (uses `current-food-access.json` field, read before merge) and the heatmap tiles (use merged value).

---

## Data Transformation Gaps

- **`renderDoubleBurden()` / D3 heatmap pipeline:**
  - `hierarchyData` is built by iterating `Object.entries(REGIONS)` and filtering `enriched` by region name. All 51 states are covered by `REGIONS` (verified). No missing states.
  - `estimate = Math.round((s.lowAccessPopulation || 0) * ((s.povertyRate || 0) / 100))` — uses `|| 0` fallback correctly. No NaN risk with current data (all states have both fields, povertyRate ranges from ~8–19%).
  - `normFn = createRankNorm(pctValues)` — rank-normalizes `pctOfPop` values. Correct usage.
  - `pctValues = enriched.map(s => parseFloat(s.pctOfPop))` — all values are `toFixed(1)` strings, so `parseFloat` is safe.
  - `pctMin/pctMax` — passed to `buildHeatmapLegend`. If `enriched` is empty (network failure), `Math.min(...[])` = `Infinity`, `Math.max(...[])` = `-Infinity`, which would render a broken legend. No guard present.
  - **containerId `'chart-double-burden'` and `breadcrumbId 'double-burden-breadcrumb'`** — both match the HTML element IDs exactly. Correct.
  - The `treemap-legend-access` and `double-burden-region-legend` elements exist in the HTML and are populated by `buildHeatmapLegend` / `buildRegionChips`. Correct.

- **`renderCountyScatter()` truthy rate filter (known bug, documented in test):**
  - Line 973: `if (!props || !props.rate) return;` — this drops counties where food insecurity rate is `0`. The existing test documents this pattern but tests the *correct* logic in isolation, not the actual production code path. The production code still has the bug.

- **`renderDesertMap()` fallback truthy filter:**
  - Line 159: `.filter(f => f.properties.povertyRate)` — same pattern, drops counties where poverty rate is 0. The county GeoJSON features examined (Alabama) all have non-zero poverty rates, so this is low-risk in practice but structurally incorrect.

- **`renderVehicle()` scatter — `s.population` access:**
  - `points` are built from `curStates` which have `population: s.totalPopulation`. This is normalized in `init()` at line 1248. The `symbolSize` formula uses `params.data.population / 200000` — safe since all states have population.

- **`drawAccessInsecurityScatter()` — `visualMap: undefined`:**
  - When switching back to state view (county→state), the code sets `visualMap: undefined` via `{ ..., visualMap: undefined, series: [] }`. Passing `undefined` to ECharts `setOption` may not clear the visual map; the correct approach is `visualMap: null` or `visualMap: []`. This could leave a stale visual map color legend from county view overlaid on state view.

- **`renderLowAccessCounty()` — `chart.__currentMapName` usage:**
  - Line 728: `const mapName = chart.__currentMapName || 'USA-access';` — relies on a non-standard property set at line 1407 (`chart.__currentMapName = mapName`). If `renderLowAccessCounty` is called without first setting `__currentMapName`, it falls back to `'USA-access'` (national map), rendering county data on the wrong geography. This can happen if the function is called in an unexpected order.

---

## Test Coverage Gaps

**Functions with test coverage:**
- Click handler deduplication — static source text check (passes: 2 `.on('click')` calls found, within limit of 2)
- County filter truthy bug — tests correct logic in isolation, not production code path
- Hero stat sync — **effectively a no-op**: checks `accessData.national?.affectedPopulation` which does not exist in `current-food-access.json` (field is `lowAccessPopulation`), so the inner assertion never executes
- Data shape: `current-food-access.json` — basic field presence (`name`, `lowAccessPct`)
- Data shape: `snap-retailers.json` — basic field presence (`name`, `retailersPer100K`)

**Functions with NO test coverage:**
- `renderUrbanRural()` — no tests for urban/rural rate computation, NaN guard, or chart option shape
- `renderDistance()` — no tests for Alaska cap, sort order, or gradient area config
- `renderVehicle()` — no tests for region grouping, regression line, or scatter point construction
- `renderDoubleBurden()` — **new D3 heatmap**, no tests for `hierarchyData` construction, `normFn` mapping, `pctMin/pctMax` guard, or tooltip output
- `renderInsecurityMap()` — no tests for CDC state abbreviation→name mapping or missing-state handling
- `renderSnapRetailers()` — no tests for `superPct` computation, tooltip field access, or CSV export row structure
- `renderLowAccessMap()` — no tests for `_lowAccessDefaultInsight` population or insight element update
- `renderLowAccessCounty()` — no tests for `__currentMapName` fallback behavior
- `drawAccessInsecurityScatter()` — no tests for `visualMap: undefined` clear behavior
- `updateAccessInsecurityInsight()` — no tests
- `fetchSDOHAccess()` — no tests for chart creation, point filtering, or error handling
- `populateAccessibleTable()` — no tests for row output shape
- `drillDownLowAccess()` (inner function in `init`) — no tests
- D3 heatmap data pipeline: no test validates the full path from `currentAccessData.states[]` → `enriched[]` → `hierarchyData` → `createD3Heatmap()`
- CDC PLACES incomplete coverage (40/51 states) — no test asserts all 51 states are present in the insecurity view

---

## Accessibility Issues

- **Critical — `map-view-toggle` missing `role="group"` and `aria-label`:** The three map toggle buttons (`Food Deserts`, `Food Insecurity`, `SNAP Retailers`) live in a plain `<div id="map-view-toggle">` with no `role="group"` and no group label. The `access-insecurity-toggle` correctly uses `role="group" aria-label="..."`. The map toggle div should match that pattern.

- **Major — Food Insecurity map click handler is broken (accessibility deception):** The tooltip text says "Click for county breakdown" and the hint text confirms this, but state clicks in Food Insecurity mode silently do nothing because `fips: null` causes the click guard (`params.data?.fips`) to skip. Screen reader users relying on the announced tooltip instruction cannot complete the action.

- **Major — `aria-current="page"` misfire on main nav:** Both the desktop nav (`<a href="/dashboards/food-insecurity.html" ... aria-current="page">Dashboards</a>`) and mobile nav have `aria-current="page"` pointing to the food-insecurity URL, not food-access. The current page is food-access. This is a build artifact — `build-components.js` injects the nav before page-specific `aria-current` is resolved. Screen readers announce the wrong page as current.

- **Minor — back button registers two `click` listeners:** `renderDesertMap()` adds one `addEventListener('click', showNational)` at line 212. `init()` adds a second `addEventListener('click', ...)` at line 1440. On repeated toggle/drill-down cycles, `showNational()` fires twice per click in deserts mode (double render, double insight reset).

- **Minor — `chart-double-burden` has `role="img"` but the D3 heatmap contains interactive SVG tiles:** After D3 renders, the container has interactive `<svg>` with clickable regions. Overriding with `role="img"` makes all interactive tiles inaccessible to keyboard/screen reader navigation. D3 tiles are not keyboard-reachable (no `tabindex`, no `keydown` handlers).

---

## Mobile Rendering Issues

**Screenshots taken at 375×812 (iPhone SE):**

- **Minor — map toggle buttons wrap to two rows:** The three buttons wrap with `flex-wrap:wrap` — SNAP Retailers appears on its own row, centered, which looks asymmetric. Functionally fine.

- **No issues** with hero stats (stacked single-column, expected responsive behavior).

- **No overflow issues** on map — choropleth, scale bar, and hint text all fit at 375px.

- **No issues** with Urban vs. Rural bar chart at mobile.

- **D3 heatmap at 375px not verified** — `scrollIntoView` during mobile testing triggered an unintended navigation to the next dashboard (the dashboard tab strip intercepted the scroll gesture). Manual verification at 375px is recommended, particularly for small-state tile label clipping.

---

## Chart Configuration Issues

- **`renderDesertMap()` `showNational()` uses stale `visualMap` range (7–24):** The default map view is now `renderLowAccessMap` (range 20–65), but `showNational()` hardcodes `min: 7, max: 24`. The fallback `else` branch in `switchMapView` (line 1344) calls `mapCtrl.showNational()` instead of `renderLowAccessMap`, which would display the wrong scale. This fallback only fires on data load failure but would display a misleading color scale if triggered.

- **Dual drill-down paths in deserts mode:** Map click → `renderDesertMap`'s internal `drillDown()` (fetches county GeoJSON, uses `_currentData` path). State selector → `drillDownLowAccess()` + `renderLowAccessCounty()`. Both paths produce county maps but use slightly different rendering functions, different back-button behavior (map click back → `showNational()` from inside `renderDesertMap`; state selector back → `switchMapView('deserts')` → `renderLowAccessMap`). The inconsistency is minor but could cause visual differences between the two drill-down entry points.

- **`HEATMAP_REGION_COLORS` desaturated colors:** Used correctly — intentionally desaturated per design intent. The `buildRegionChips` legend uses opacity 0.6. No configuration issue.

- **`visualMap: undefined` in state-view reset (Chart 7):** When `drawAccessInsecurityScatter` is called for state view, the county view's `visualMap` (color ramp min/max 5–30) is not explicitly cleared. ECharts ignores `undefined` in merge mode — the previous visual map persists as a ghost legend. Needs `visualMap: null` to clear.

---

## Prioritized Findings

| # | Issue | Severity | Effort |
|---|---|---|---|
| 1 | CDC PLACES API returns 40/51 states — 11 states render as blank on Food Insecurity map | Major | Small |
| 2 | Food Insecurity map tooltip/hint promises county drill-down but click silently does nothing (`fips: null`) | Major | Small |
| 3 | `map-view-toggle` missing `role="group"` and `aria-label` | Major | Trivial |
| 4 | `aria-current="page"` on main nav points to food-insecurity, not food-access | Major | Small |
| 5 | Back button registers duplicate `click` listener (renderDesertMap line 212 + init line 1440) | Minor | Trivial |
| 6 | Hero stat test is a no-op (`affectedPopulation` field doesn't exist; inner assertion never runs) | Minor | Trivial |
| 7 | `povertyRate` merge overwrites `current-food-access.json` values with `food-insecurity-state.json` — 17-state mismatch >0.5pp creates inconsistency between map tooltip and heatmap tiles | Minor | Small |
| 8 | `renderCountyScatter()` truthy filter `!props.rate` silently drops counties with rate=0 | Minor | Trivial |
| 9 | `renderDesertMap()` fallback truthy filter `f.properties.povertyRate` drops counties with poverty=0 | Minor | Trivial |
| 10 | `visualMap: undefined` in `drawAccessInsecurityScatter` reset leaves ghost county color scale on state view | Minor | Trivial |
| 11 | D3 heatmap `buildHeatmapLegend` receives `Infinity/-Infinity` if `enriched` is empty (no guard) | Minor | Small |
| 12 | `renderLowAccessCounty()` relies on `chart.__currentMapName` non-standard property — fragile if call order changes | Minor | Small |
| 13 | No test coverage for `renderDoubleBurden()` / D3 heatmap data pipeline (new code, highest risk) | Minor | Medium |
| 14 | No test coverage for `renderUrbanRural()`, `renderDistance()`, `renderVehicle()`, `renderSnapRetailers()`, `populateAccessibleTable()` | Minor | Medium |
| 15 | D3 heatmap tiles not keyboard-navigable (`role="img"` masks interactive SVG; no `tabindex`/`keydown`) | Minor | Large |
