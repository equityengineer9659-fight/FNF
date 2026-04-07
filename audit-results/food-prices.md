# Food Prices Dashboard Audit

**Date**: 2026-04-07
**Scope**: 8 charts, 2 PHP proxies (BLS + FRED), 4 static data files, cross-dataset join with `food-insecurity-state.json`
**Screenshots**: `food-prices-desktop-1280.png`, `food-prices-mobile-375.png`

---

## API Endpoints

| Endpoint | HTTP | Shape Match | Issues |
|---|---|---|---|
| `GET /data/bls-regional-cpi.json` | 200 | Yes | Static file; contains `categories`, `regions`, `affordability`, `stateAffordability` |
| `GET /data/bls-food-cpi.json` | 200 | Yes | Static file; contains `series` [{name,data[{year,month,date,value}]}] |
| `GET /data/snap-participation.json` | 200 | Yes | `benefitTimeline.data` is sparse (29 checkpoints, not monthly) — forward-filled in JS |
| `GET /data/food-insecurity-state.json` | 200 | Yes | Used for Chart 8 (CPI vs Insecurity); `trend` array accessed |
| `GET /api/dashboard-bls.php` | 200 (cached) | Yes | Returns 3 series; `_stale: null`, `_cached: true` — healthy |
| `GET /api/dashboard-bls.php?type=regional` | 200 (cached) | Partial mismatch | **Missing `affordability` and `stateAffordability` keys** — live response only has `categories` + `regions` |
| `GET /api/dashboard-fred.php?type=cpi-item&series=APU0000708111` | 200 (cached) | Yes | Returns `observations` with full date strings (`2018-01-01`); code uses `startsWith('2018-01')` correctly |

### API Shape Mismatch Detail

The live BLS regional endpoint (`/api/dashboard-bls.php?type=regional`) does **not** return `affordability` or `stateAffordability`. The PHP proxy only builds `categories` and `regions` — it does not embed the static quintile/state affordability data. The JS reads these from the static `bls-regional-cpi.json` file in `init()`, so Charts 3 and 4 are not affected at runtime. However, if `fetchLiveRegional()` were ever extended to pass the full live response as a replacement for `regionalData`, Charts 3 and 4 would break silently.

### Dev Server
Not tested — dev server was not running. Production endpoints confirmed healthy above.

---

## Hardcoded / Stale Data

- **W1: Regional chart `meta.startYear` says 2020 in PHP but data starts 2018** — `dashboard-bls.php:198` sets `'meta' => ['startYear' => 2020, ...]` for the regions route, but category data actually starts Jan 2018. The JS does not use this `meta` field directly, but it's a documentation inconsistency.

- **W2: Hero stat "Avg Meal Cost" = $3.58 is consistent** — matches `food-insecurity-state.json:national.averageMealCost = 3.58`. OK.

- **W3: Hero stat "Income on Food (Lowest 20%)" = 32.6% is consistent** — matches `bls-regional-cpi.json:affordability.quintiles[0].foodSharePct = 32.6`. OK.

- **W4: Chart 4 panel copy says "31.2% of their income on food" — data shows 32.6%** — `food-prices.html:299`. The copy does not match the current quintile data (1.4pp understatement). Previous audit may have been based on an older data version where 31.2% was correct.

- **W5: Chart 4 panel copy says "$407/month" bottom quintile — data shows $440** — `food-prices.html:310`. The insight text (`$407`) does not match `quintiles[0].monthlyFoodCost = 440`. Off by $33.

- **W6: Chart 4 panel copy says "$1,028 top quintile" — data shows $1,416** — `food-prices.html:310`. `quintiles[4].monthlyFoodCost = 1416`. The copy is $388 low. All three numbers in the Chart 4 insight (`31.2%`, `$407`, `$1,028`) are stale vs current JSON.

- **W7: Chart 4 body copy says "average meal cost of $3.99" — current data is $3.58** — `food-prices.html:302`. 11% discrepancy.

- **W8: Affordability map `visualMap.min = 40`, actual state index min is 42.8** — `food-prices.js:189`. The min is lower than needed (pads below the floor), which is acceptable, but this is a minor cosmetic inaccuracy on the legend scale. The `max = 75` vs actual max `65.4` is a larger pad on the high end, compressing the visual range. Consider tightening to min=40, max=68.

- **W9: Hero stat "Food Inflation 2020-2024 = 28%" matches computed value** — computed from static data: Jan 2020 to Dec 2024 = 27.8%, rounded to 28%. OK.

- **W10: `data-year` in affordability map info panel says "2024"** — `food-prices.html:274` says "Data Year 2024". `stateAffordability.year = 2024` in JSON. OK.

- **W11: FRED observations return full ISO dates (`2018-01-01`) not YYYY-MM** — the JS correctly handles this with `d.date.slice(0, 7)` in `toggleFredOverlay`. OK.

- **W12: SNAP benefit timeline is sparse, not monthly** — `snap-participation.json` has 29 data points from 2018-2025 at irregular intervals (Jan/Jun/Dec). The purchasing power chart forward-fills gaps, which is correct. The SNAP series ends at 2025-12 while food CPI extends to 2026-02; the last SNAP value is forward-filled to 2026-02, which may slightly misrepresent the current benefit level.

---

## Data Transformation Gaps

- **T1: `renderCategories` — series misalignment if null counts differ across categories** — Line `series.map(s => ({...s, data: s.data.filter(d => d.value !== null)}))` then uses `series[0].data` for the xAxis. If series[1+] have nulls at different positions, the chart series arrays are different lengths vs the xAxis. Currently all 7 category series have 97 non-null points (no divergence), but if the BLS API ever returns a gap in one series, charts would silently misalign. No guard exists.

- **T2: `rebuildPurchasingPowerSeries` — `JSON.parse(JSON.stringify(ppBaseOption))` loses ECharts LinearGradient objects** — `ppBaseOption.series[0].areaStyle.color` and `ppBaseOption.series[1].areaStyle.color` are `echarts.graphic.LinearGradient` class instances. After `JSON.stringify`, they become `{type:"linear"}` (losing all colorStop data). Result: when any FRED toggle button is pressed, the Food CPI and SNAP area gradients disappear and are replaced with a solid color. This is a **visual regression on first FRED overlay activation**.

- **T3: Tooltip `gap` comparison uses string `> 0`** — `renderPurchasingPower` line ~694: `const gap = (...).toFixed(1)` then `if (gap > 0)`. The gap is a string but JS coerces it numerically. This works correctly but is fragile.

- **T4: Purchasing power chart tooltip assumes `params[0]` = Food Prices, `params[1]` = SNAP** — `const gap = params[0] && params[1] ? (params[0].value - params[1].value).toFixed(1) : null`. When FRED overlays are active, `params` array grows. The gap calculation still uses `params[0]` vs `params[1]`, which remains the correct two base series (they're defined first in the options), so this is OK in practice but implicit.

- **T5: `renderPurchasingPower` baseline assumes `data[0]` = Jan 2018** — `const baseline = data[0].value`. After null-filtering, `data[0]` should be Jan 2018 from the static file. If live BLS data ever starts at a different point, the indexed baseline would be wrong. No date validation exists.

- **T6: `renderCpiVsInsecurity` — FI data for 2025+ is projected and correctly filtered** — `fiTrend.filter(t => !t.projected)` excludes 2025 and 2026. The latest plotted FI point is 2024. The CPI line extends to 2026-02. The right side of the CPI line has no corresponding FI data, which is correct behavior but leaves a ~14-month null tail on the FI series. No annotation explains this gap to users.

- **T7: `computeYoY` date-key lookback is robust** — uses date dictionary lookup (not array index arithmetic), handles null filtering, and matches `YYYY-MM` keys correctly. No issues.

- **T8: `renderHomeVsAway` tooltip YoY guard (`dataIndex >= 12`) is correct** — prevents negative array index arithmetic. No issues.

---

## Test Coverage Gaps

Existing tests in `food-prices.test.js` cover:
- [x] Regional chart baseline label (P1 #28)
- [x] Hero meal cost vs JSON (P1 #29)
- [x] Lowest quintile food share vs JSON (P1 #30)
- [x] Affordability map visualMap bounds (P1 #31)
- [x] BLS series ID format (CUUR* in PHP, APU* in JS)
- [x] Data shape: bls-regional-cpi.json structure

**Untested functions** (0 direct unit tests):
- `renderCategories` — no test for series alignment after null-filtering
- `renderRegions` — no test for correct baseline/latest year label derivation
- `renderAffordabilityMap` — no test for tooltip data field access
- `renderBurden` — no test for sunburst data structure
- `renderHomeVsAway` — no test for YoY tooltip formatting
- `renderYoYInflation` / `computeYoY` — no test for the date-key lookback, peak detection, or dynamic insight text
- `renderPurchasingPower` — no test for SNAP alignment (forward-fill), baseline indexing, or FRED overlay merge
- `rebuildPurchasingPowerSeries` — **no test for LinearGradient serialization bug (T2 above)**
- `toggleFredOverlay` — no test for FRED item indexing
- `renderCpiVsInsecurity` — no test for FI alignment on CPI x-axis
- `fetchLiveBLS` / `fetchLiveRegional` — no test for live upgrade path

---

## Accessibility Issues

- **Minor: `aria-current="page"` on main nav points to food-insecurity.html, not this page** — `food-prices.html:116,139`. Both the desktop and mobile nav mark the `Dashboards` link with `aria-current="page"`, pointing to `/dashboards/food-insecurity.html`. This is technically correct (Dashboards is the section active), but a screen reader user on this page will hear "link, current page" for food-insecurity, not food-prices. The dashboard tab nav at line 155 correctly marks food-prices with `aria-current="page"`. No change needed if intentional, but worth noting.

- **Minor: Chart 4 (Sunburst) has no text description for screen readers** — `chart-burden` has `role="img" aria-label="Sunburst chart..."`. The aria-label describes the chart type and general content but does not provide a text-equivalent summary of the data (e.g., income quintile percentages). For a complex visual like a sunburst, this is a WCAG 1.1.1 gap.

- **Minor: Chart 8 (CPI vs Insecurity) has no text description for screen readers** — `chart-cpi-vs-insecurity` has `role="img" aria-label="Dual-axis chart..."`. The section has narrative text in the adjacent panel, which partially mitigates this, but there is no programmatic `aria-describedby` link connecting the chart element to the description.

- **Minor: FRED toggle buttons have correct `aria-pressed` and `aria-label`** — dynamically set in JS. Keyboard accessibility verified via snapshot (buttons are focusable). OK.

- **Minor: State selector dropdown has `aria-label="Focus on state:"`** — OK.

- **Minor: All 8 chart divs have `role="img"` and `aria-label`** — consistent pattern. OK.

- **Minor: Dashboard tab nav has `aria-label="Dashboard navigation"`** — OK.

- **Minor: YoY insight text `chart 6` is in a plain `div` with id `yoy-insight`** — not connected to the chart via `aria-describedby`. A screen reader would encounter the div in DOM order but without an explicit association to the chart.

- **Minor: Copy text "31.2%" and "$407/month" in Chart 4 panel are factually wrong vs current data** — Screen reader users hearing these numbers will receive incorrect information (see W4–W6 above). This is a content accuracy issue affecting all users, not just AT users.

---

## Mobile Rendering Issues

Based on the 375px screenshot and snapshot analysis:

- **Minor: Dashboard tabs scroll horizontally on mobile** — The 7-tab tab strip at 375px requires horizontal scroll. The "Food Prices" active tab may not be immediately visible without scrolling, since it's the 4th of 7. No scroll indicator visible. This is consistent with other dashboards and is a known pattern issue.

- **Minor: Hero stats stacked correctly on mobile** — 4-stat grid collapses to 2×2 on mobile. No overflow observed.

- **Minor: Charts render inside `dashboard-chart` divs with fixed height** — All charts use `dashboard-chart` class height (typically 300–350px). On 375px, the chart-plus-info-panel layout stacks vertically, so charts get their full width. No clipping observed.

- **Minor: FRED toggle buttons (`Eggs`, `Bread`, `Ground Beef`, `Milk`) are not tested for wrapping at 375px** — The toggle container is horizontal-flow. At narrow widths, "Ground Beef" (10 chars) may cause wrapping. Not confirmed to be broken but not validated.

- **Note: Mobile screenshot shows chart sections as mostly empty black** — This is expected behavior: ECharts canvas renders asynchronously and the screenshot was taken before all chart animations completed. The page structure (hero, section headings, info panels) is intact.

---

## Chart Configuration Issues

- **C1: `renderPurchasingPower` — FRED overlay destroys area gradients (see T2)** — LinearGradient instances are not JSON-serializable. On first FRED toggle, both base series lose their area fills. Severity: Major. Visible to all users who interact with the FRED toggles.

- **C2: `updateFreshness` called correctly for both BLS data streams** — `freshness-bls-categories` and `freshness-bls-regional` both get static-first then live-upgraded calls. The "Data: CPI" → "Live" transition observed in the snapshot confirms this is working.

- **C3: No `aria` config in any ECharts `setOption` calls** — ECharts 5 supports `aria: { enabled: true, decal: { show: true } }`. None of the 8 charts use it. All charts rely on the `role="img"` + `aria-label` approach on the container div instead. This is adequate but means ECharts' own accessibility enhancements (pattern fills for color-blind users) are disabled.

- **C4: Affordability map tooltip does `d.value.toFixed(1)`** — if `d.value` is an integer (e.g., `62` for Alabama), `.toFixed(1)` returns `"62.0"`. This is correct but slightly inconsistent with the display — some states have integer indices (integer-valued from the JSON), others have `.0`. Minor cosmetic.

- **C5: Purchasing power chart insight text has inverted framing** — Current data (2026-02): food +37%, SNAP +55%. The insight reads "SNAP benefits (55% above 2018) are keeping pace with food prices (37% above 2018)." This is factually accurate but the dashboard's narrative throughout is "SNAP is losing purchasing power." The chart shows SNAP above food — which contradicts the framing in the copy text ("the 2022 inflation surge and end of emergency allotments in March 2023 eroded much of that gain"). The data now shows SNAP ahead of food, but the explanatory copy still frames this as a loss. This is an analytical integrity issue.

- **C6: `renderHomeVsAway` markArea for government shutdown gap is hardcoded to `2025-10` / `2025-11`** — `food-prices.js:347`. If BLS reports data for these months, the visual annotation will overlap real data. This should be data-driven or at minimum confirmed against the latest BLS release calendar.

- **C7: BLS rate limiter uses v1 limit of 20/day when no API key configured** — `dashboard-bls.php:43`. The regional endpoint fetches 11 series requiring 4 v1 requests (3 series max per v1 call). With a 20/day limit and 7 series in the `type=regional` path chunked 3-at-a-time, this consumes 4 API calls per cache miss. High-traffic days could exhaust the v1 budget.

---

## Prioritized Findings

| # | Issue | Severity | Effort |
|---|---|---|---|
| 1 | FRED overlay toggle destroys LinearGradient area fills on base series | Major | Small — store gradients separately, reconstruct in `rebuildPurchasingPowerSeries` |
| 2 | Chart 4 copy: "31.2%", "$407/month", "$1,028/month" all stale vs JSON (32.6%, $440, $1,416) | Major | Small — update 3 values in HTML |
| 3 | Chart 4 copy: "average meal cost of $3.99" stale vs current $3.58 | Major | Trivial — update 1 value in HTML |
| 4 | Purchasing power narrative frames SNAP as losing ground, but current data shows SNAP +55% vs food +37% | Major | Medium — requires copy revision + possible chart annotation update |
| 5 | `renderCategories` — no guard against per-series null count divergence causing xAxis misalignment | Minor | Small — align dates across all series before rendering |
| 6 | `computeYoY` / `renderYoYInflation` / `renderPurchasingPower` / `renderCpiVsInsecurity` have zero test coverage | Minor | Medium — 5–8 new test cases |
| 7 | `rebuildPurchasingPowerSeries` has no test for the LinearGradient serialization bug | Minor | Small — 1 test asserting gradients survive toggle |
| 8 | Chart 4 (sunburst) and Chart 8 (CPI vs insecurity) lack `aria-describedby` linking to narrative text | Minor | Trivial — add `aria-describedby` attributes |
| 9 | YoY inflation copy says "By 2024, the rate returned below 2%" — actual latest value is 3.1% (2026-02) | Minor | Trivial — update static copy to reflect current data |
| 10 | markArea for gov't shutdown gap hardcoded to 2025-10/11 — should be confirmed against latest BLS release | Minor | Trivial — verify or document |
| 11 | SNAP benefit forward-fill extends 2 months past last known data point (2025-12 to 2026-02) | Minor | Small — annotate or clip the SNAP line at last known value |
| 12 | Dashboard tabs strip not scroll-indicated on mobile — active "Food Prices" tab (4th of 7) may not be visible without horizontal scroll | Minor | Small — CSS scroll-into-view on page load |
