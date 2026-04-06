# Data Quality Assessment — Post-USDA Atlas 2019 Switch

**Date**: 2026-04-06
**Scope**: All dashboard data sources — 9 static JSON files, 7 PHP proxy endpoints, 7 dashboard JS files
**Purpose**: Post-switch quality snapshot after migrating Food Access dashboard off `food-access-atlas.json` (USDA FARA 2019) to `current-food-access.json` (computed 2026), then addressing all remaining audit issues.
**Baseline**: `BEFORE_USDA_Atlas_2019_Switch.md` (captured 2026-04-06)

---

## Critical Bug Status

**C-1 — CDC PLACES health outcomes** (`food-insecurity.js`) — **RESOLVED**

The SDOH scatter's Health Outcomes toggle (obesity, diabetes, depression) was silently failing because the JS checked `places.states` while the PHP returned `places.records`. Fixed at `food-insecurity.js:1103` — now correctly checks `places.records` and iterates with `places.records.forEach()`.

---

## Full Quality Assessment

### Food Insecurity Overview

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating | Changed from Baseline? |
|---|---|---|---|---|---|---|---|
| FI Rate map (all metric toggles) | `food-insecurity-state.json` + `us-states-geo.json` | 2024 | 51 states | No | National 47.9M vs state sum 41.8M gap (-12.8%) now disclosed via `<div class="dashboard-data-notice">` banner on `food-insecurity.html:165` | Green | YES — was Yellow (no disclosure) |
| County drill-down | `/data/counties/{fips}.json` | 2020 (Census) | ~3,143 counties | No (Census model estimate) | Modeled estimate clearly disclosed in UI | Green | No |
| County search autocomplete | `county-index.json` | Current | 3,143 / 3,143 | No | Oglala Lakota Co, SD now present as `["Oglala Lakota County","46","South Dakota"]` | Green | YES — was Yellow (1 county missing) |
| Food Insecurity Over Time trend | `food-insecurity-state.json` | 2024 (trend extended to 2026 projections) | 51 states | No | Clean; sources updated to include USDA ERS Dec 2025 report (ERR-358) | Green | No |
| State Comparison radar | `food-insecurity-state.json` | 2024 | 51 states | No | Clean | Green | No |
| Poverty vs Insecurity scatter | `food-insecurity-state.json` + `/api/dashboard-saipe.php` | 2024 / 2023 | 51 states | Yes (SAIPE) | Child poverty scatter only available when SAIPE proxy is reachable | Yellow | No |
| Meal Cost by State bar | `food-insecurity-state.json` | 2024 | 51 states | No | Clean | Green | No |
| SNAP Participation Comparison | `food-insecurity-state.json` | 2024 | 51 states | No | Clean | Green | No |
| Triple Burden / Demographics | 3-file cross-join | Mixed (2024 FI + 2026 access + FY2024 SNAP) | 51 states | No | Year mismatch now disclosed via `<div class="dashboard-data-notice">` in `food-insecurity.html` | Green | YES — was Yellow (no label); disclosure added |
| State Deep-Dive KPI panel | 3-file cross-join | Mixed (2024 FI + 2026 access + 2023 food bank) | 51 states | No | Year mismatch now disclosed via `<div class="dashboard-data-notice">` in `food-insecurity.html` | Green | YES — was Yellow (no label); disclosure added |
| Food Prices / BLS CPI | `bls-food-cpi.json` + `/api/dashboard-bls.php` | Through Feb 2026 | National | Yes (BLS) | Clean | Green | No |
| SDOH scatter — Poverty/Unemployment dimensions | `/api/dashboard-sdoh.php` | 2023 ACS | 51 states | Yes | Clean | Green | No |
| SDOH scatter — Health Outcomes dimensions | `/api/dashboard-places.php` | 2023 | 51 states | Yes | **FIXED** — key changed from `places.states` to `places.records`; obesity, diabetes, depression, housing insecurity metrics now load correctly | Green | YES — was Red (BROKEN) |
| Accessible table | `food-insecurity-state.json` | 2024 | 51 states | No | Clean | Green | No |

---

### Food Access & Deserts

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating | Changed from Baseline? |
|---|---|---|---|---|---|---|---|
| Low-Access Tracts map (default/desert view) | `current-food-access.json` + `us-states-geo.json` | **2026 (computed 2026-04-06)** | 51 states | No | Fully migrated off 2019 FARA atlas; methodology note added to info panel explaining computation (SNAP retailers + Census 2020 tract centroids + Haversine distance) | Green | YES — was Red (2019 FARA) |
| Current Food Access Score map (toggle) | `current-food-access.json` | 2026 (computed) | 51 states | No | Info panel clarifies "% of census tracts classified as low-access"; tooltips now say "X% of tracts" | Green | YES — was Yellow; tooltip clarified |
| County drill-down (desert mode) | `/data/counties/{fips}.json` | Current | County-level | No | Now uses current data; `dashboard-fara.php` removed | Green | YES — was Yellow (2019 atlas) |
| Urban vs Rural Low-Access donut | `current-food-access.json` | **2026 (computed)** | 51 states | No | Migrated from 2019 atlas to current computed data | Green | YES — was Yellow (2019 data) |
| Average Distance to Store | `current-food-access.json` | **2026 (computed)** | 51 states | No | Migrated from 2019 atlas to current computed data | Green | YES — was Yellow (2019 data) |
| Vehicle Access vs Low-Access scatter | `current-food-access.json` | **2026 (computed)** | 51 states | No | Migrated from 2019 atlas to current computed data; tooltip now says "% of tracts" | Green | YES — was Yellow (2019 data) |
| Low-Income / Low-Access treemap | `current-food-access.json` | **2026 (computed)** | 51 states | No | Migrated from 2019 atlas to current computed data; tooltip now says "% of tracts" | Green | YES — was Yellow (2019 data) |
| SNAP Retailers map (toggle) | `snap-retailers.json` + `current-food-access.json` | FY2024 / 2026 | 51 states | No | Mixed-vintage gap eliminated — both sources now current-era | Green | YES — was Yellow (FY2024 + 2019 cross-ref) |
| Housing Burden vs Food Deserts scatter | `/api/dashboard-sdoh.php` + `current-food-access.json` | 2023 ACS / 2026 | 51 states | Yes | Clean; Y-axis now uses current `lowAccessPct` instead of 2019 atlas value | Green | No (was Green; minor Y-axis improvement) |
| Methodology note | N/A | N/A | N/A | N/A | **ADDED** — info panel explains: USDA FNS SNAP-authorized retailer locations (updated biweekly) + Census 2020 population-weighted tract centroids; qualifying store types listed; thresholds >1mi urban / >10mi rural | Green | YES — was missing entirely |
| Accessible table | `current-food-access.json` + `snap-retailers.json` | 2026 / FY2024 | 51 states | No | Single-era vintage; year mismatch eliminated | Green | YES — was Yellow (2019 + FY2024 mismatch) |

---

### SNAP & Safety Net

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating | Changed from Baseline? |
|---|---|---|---|---|---|---|---|
| SNAP Participants Over Time trend | `snap-participation.json` | 2024 (state), 2025 (national); trend through 2025-11 | 51 states | No | Clean | Green | No |
| Food CPI overlay | `/api/dashboard-bls.php` | Through Feb 2026 | National | Yes | Clean | Green | No |
| SNAP Coverage Ratio map | `snap-participation.json` + `us-states-geo.json` | FY2024 | 51 states | No | Freshness badge now data-driven: `` `FY${snapData.stateCoverage.year}` `` (resolves to FY2024) | Green | YES — was Yellow (badge said FY2022); fixed |
| CDC PLACES SNAP receipt toggle | `/api/dashboard-places.php?type=snap-receipt` | 2023 BRFSS | 51 states | Yes | Data year bumped from 2022 to 2023 | Green | MINOR — data year refreshed |
| Safety Net Coverage Flow — Sankey | `snap-participation.json` (sankey section) | 2022 | National | No | Clean | Green | No |
| Free/Reduced Lunch — Nightingale | `snap-participation.json` (schoolLunch) | 2023 | 51 states | No | Data year updated from 2022 to 2023; freshness badge correctly shows FY2023 | Green | MINOR — year updated |
| Avg Benefit vs FI Rate bar+line | `snap-participation.json` | FY2024 | 51 states | No | Data year updated; freshness badge shows FY2025 | Green | MINOR — year updated |
| 5 KPI Gauges | `snap-participation.json` (national) | FY2025 | National | No | Clean; monthly shortfall still uses hardcoded `3.58 * 3 * 30 = $322.20` | Green | No |
| Demographic Flow | `/api/dashboard-sdoh.php` | 2023 ACS | National | Yes | Clean; hardcoded 2022 race-level FI rates remain (USDA ERS 2022) | Green | No |

---

### Food Prices & Affordability

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating | Changed from Baseline? |
|---|---|---|---|---|---|---|---|
| Food Price Trends by Category | `bls-regional-cpi.json` (categories.series) | **Through Feb 2026 (monthly)** | National categories | No | Refreshed via `scripts/refresh-bls-regional.js` — 98 monthly data points, last at 2026-02 | Green | YES — was Yellow (stale at 2025-01); now current |
| Regional Price Comparison bar | `bls-regional-cpi.json` (regions.series) | **Through Feb 2026** | 4 BLS regions | No | Refreshed — 98 monthly data points per region | Green | YES — was Yellow (stale at 2025-01); now current |
| Affordability Index map | `bls-regional-cpi.json` (stateAffordability) + `us-states-geo.json` | **2024** | 51 states | No | Refreshed with 2024 Feeding America meal costs (from `food-insecurity-state.json`) + Census ACS 2023 median income. Alaska now $4.89 (matches FI dashboard). Index formula: `(mealCost * 365 * 3) / medianIncome * 1000` | Green | YES — was Red (2022 data, Alaska $4.32 contradiction); now current |
| Food Cost as % of Budget sunburst | `bls-regional-cpi.json` (affordability.quintiles) | **2023** | National quintiles | No | Updated to 2023 USDA ERS Food Expenditure Series + BLS Consumer Expenditure Survey data | Green | YES — was Yellow (2022 data); updated to 2023 |
| Food at Home vs Away line+area | `bls-food-cpi.json` | Through Feb 2026 | National | No | Clean | Green | No |
| Year-over-Year Inflation Rate | `bls-food-cpi.json` | Through Feb 2026 | National | No | Clean | Green | No |
| SNAP Purchasing Power Index | `bls-food-cpi.json` + `snap-participation.json` (benefitTimeline) | Feb 2026 / data-driven | National | No | SNAP benefit timeline extracted from hardcoded JS to `snap-participation.json` — now data-driven and updatable without code changes | Green | YES — was Yellow (hardcoded in JS); now data-driven |
| Individual item price overlays | `/api/dashboard-fred.php` | Live | National items | Yes (FRED) | Returns 503 on prod until `FRED_API_KEY` configured in `_config.php`; buttons exist but silently do nothing | Yellow | No |
| CPI vs Food Insecurity Rate dual-axis | `bls-food-cpi.json` + `food-insecurity-state.json` | Feb 2026 / 2024 | National | No | Minor year-lag between series (monthly CPI vs annual FI survey) | Green | No |

---

### Food Bank Landscape

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating | Changed from Baseline? |
|---|---|---|---|---|---|---|---|
| Food Bank Density map | `food-bank-summary.json` + `us-states-geo.json` | 2023 (IRS 990) | 51 states | No | National 61,284 vs state sum 51,218 (-16.4%) — `_reconciliationNote` now rendered in UI via `<div id="density-reconciliation" class="dashboard-data-notice">` populated from `bankData.national._reconciliationNote` | Green | YES — was Yellow (note in data but not surfaced); now rendered |
| Density vs FI Rate scatter | `food-bank-summary.json` | 2023 | 51 states | No | Regression line suppressed when |r| < 0.2 — correct behavior | Green | No |
| Revenue per Food-Insecure Person treemap | `food-bank-summary.json` | 2023 | 51 states | No | Clean; division-by-zero guarded (`insecurePersons > 0`) | Green | No |
| Regional Comparison radar | `food-bank-summary.json` | 2023 | 51 states | No | Clean | Green | No |
| FI Rate vs Food Bank Density paired bar | `food-bank-summary.json` | 2023 | 51 states | No | Clean | Green | No |
| Need-Capacity Gap scatter (bubble) | `food-bank-summary.json` | 2023 | 51 states | No | Clean | Green | No |

---

### Nonprofit Directory

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating | Changed from Baseline? |
|---|---|---|---|---|---|---|---|
| Search results grid | `/api/nonprofit-search.php` -> ProPublica | Live IRS 990 | National | Yes | Stale fallback now serves cached data when ProPublica returns malformed JSON (was immediate 502) | Green | YES — was Yellow (no stale fallback); fixed |
| Pagination | Same | Live | National | Yes | Same improvement | Green | YES — was Yellow; fixed |
| Find Help Near Me | `/api/mapbox-geocode.php` + search | Live | National | Yes | Clean | Green | No |

---

### Nonprofit Profile

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating | Changed from Baseline? |
|---|---|---|---|---|---|---|---|
| All 6 ECharts + KPI header | `/api/nonprofit-org.php` -> ProPublica (IRS 990) | Live | Per org | Yes | Stale fallback now serves cached data when ProPublica returns malformed JSON (was immediate 502) | Green | YES — was Yellow (no stale fallback); fixed |
| Calculation clamps (ratios, efficiency) | Same | Live | Per org | Yes | All ratio clamps present; division-by-zero guarded (`Math.min` at lines 832, 847, 853) | Green | No |
| Charity Navigator gauge + badge | `/api/charity-navigator.php` | Live | Per org (optional) | Optional | Optional feature — graceful degradation confirmed | Green | No |

---

## Data Freshness Summary

| Dataset | Data Year | Status | Changed from Baseline? |
|---|---|---|---|
| `food-insecurity-state.json` | 2024 (sources updated to USDA ERS Dec 2025 report; trend extended to 2026) | Current | IMPROVED |
| `food-bank-summary.json` | 2023 (IRS 990) | Current | Same |
| `food-access-atlas.json` | **Deleted** — 2019 FARA data removed; no dashboard loaded it | Removed | YES — was dead code; now deleted |
| `current-food-access.json` | 2026 (computed 2026-04-06, 40,144 qualifying retailers, 84,414 tracts) | Current | REFRESHED |
| `snap-participation.json` | 2024 (state), 2025 (national); now includes `benefitTimeline` key | Current | IMPROVED — SNAP benefit data extracted from JS |
| `snap-retailers.json` | FY2024 | Current | Same |
| `bls-food-cpi.json` | Through Feb 2026 | Current | Same |
| `bls-regional-cpi.json` (categories) | **Through Feb 2026 (98 monthly points)** | Current | YES — was 2025-01 (14 months stale); refreshed via BLS API |
| `bls-regional-cpi.json` (regions) | **Through Feb 2026 (98 monthly points)** | Current | YES — was 2025-01; refreshed via BLS API |
| `bls-regional-cpi.json` (stateAffordability) | **2024** (meal costs from FI data + Census ACS 2023 income) | Current | YES — was 2022; refreshed |
| `bls-regional-cpi.json` (quintiles) | **2023** (USDA ERS + BLS CEX) | Current | YES — was 2022; updated to 2023 |
| `county-index.json` | Current (3,143 counties) | Current | FIXED (Oglala Lakota added) |
| `us-states-geo.json` | Current | Current | Same |

---

## National vs State Aggregate Cross-Check

| Metric | Sum of States | National Aggregate | Variance | Status | Changed from Baseline? |
|---|---|---|---|---|---|
| Food Insecure Persons | 41.8M | 47.9M | -12.8% | **Disclosed** — UI banner explains methodological gap | YES — was Warn (no disclosure) |
| SNAP Participants | 41.6M | 41.7M | -0.3% | Pass | No |
| Food Bank Org Count | 51,218 | 61,284 | -16.4% | **Disclosed** — `_reconciliationNote` now rendered in density map UI | YES — was Partial (note in data only) |
| Food Bank Combined Revenue | $48.76B | $48.20B | +1.2% | Pass | No |
| SNAP Retailers | 267,201 | 267,200 | 0.0% | Pass | No |

---

## Calculation Audit

| Formula | Status | Notes | Changed from Baseline? |
|---|---|---|---|
| `linearRegression()` — Pearson r | Pass | Formula correct; standard computational Pearson r in `dashboard-utils.js:99-113` | No |
| Per-capita orgs (food-banks.js) | Pass | Division-by-zero guarded (`insecurePop > 0`) | No |
| SNAP coverage ratio range | Pass | 46.9% (Wyoming) to 131.8% (California); visualMap bounds 40-150 | No |
| Meal cost baseline | Pass | `baseMealCost = 3.58` matches `national.averageMealCost` | No |
| Nonprofit programExpenseRatio clamp | Pass | `Math.max(0, Math.min(100, ...))` at line 832 | No |
| Nonprofit assetReserve clamp | Pass | `Math.max(0, Math.min(200, ...))` at line 847 | No |
| Nonprofit fundraisingEfficiency clamp | Pass | `Math.max(0, Math.min(100, ...))` at line 853 | No |
| SNAP Purchasing Power Index baseline | Pass | Uses first non-null CPI value as baseline | No |
| BLS M13 annual averages filtered | Pass | `if ($month < 1 || $month > 12) continue` correctly excludes M13 in `dashboard-bls.php` | No |
| stateAffordability index formula | Pass | `(mealCost * 365 * 3) / medianIncome * 1000` — verified against known values | New |

---

## PHP Proxy Health

| Proxy | Cache TTL | Error Handling | Issues | Changed from Baseline? |
|---|---|---|---|---|
| `dashboard-bls.php` | 7 days | Stale fallback present; rate limit guard present | Clean | No |
| `dashboard-census.php` | 24 hours | Stale fallback (`_stale: true`) | Clean | No |
| `dashboard-saipe.php` | 24 hours | Stale fallback; 45/day rate limit guard | Clean | No |
| `dashboard-sdoh.php` | 24 hours | No rate limiter (Census ACS has no hard key limit) | Info | No |
| `dashboard-places.php` | 24 hours | `returnStaleOrError()` called before definition (works at runtime via PHP function hoisting; maintenance hazard) | Warn | No |
| `dashboard-fara.php` | N/A | N/A | **REMOVED** — file deleted; FARA data no longer proxied after Food Access migration. Orphaned `'fara'` entry removed from `_rate-limiter.php`. | YES — was present with 7-day cache |
| `dashboard-fred.php` | 7 days | Returns 503 if `FRED_API_KEY` not configured; `returnStaleOrError()` defined after first call site (hoisted but poor ordering) | Warn | No |
| `nonprofit-search.php` | 24 hours | Stale fallback now covers both network failure AND malformed upstream JSON | Clean | YES — was Warn (no malformed-JSON fallback); fixed |
| `nonprofit-org.php` | 7 days | Stale fallback now covers both network failure AND malformed upstream JSON | Clean | YES — was Warn (no malformed-JSON fallback); fixed |

---

## Changes Since Baseline — Summary

### Resolved from Original Audit (all 8 priority items + 3 new issues)

| # | Issue | Resolution |
|---|---|---|
| C-1 | CDC PLACES key mismatch — SDOH Health Outcomes never loaded | Fixed in `food-insecurity.js:1103` — `places.states` changed to `places.records` |
| P-1 | `stateAffordability` meal costs 2022 — contradicts FI dashboard | **Refreshed** via `scripts/refresh-bls-regional.js` with 2024 Feeding America meal costs + Census ACS 2023 median income |
| P-2 | Category CPI series 14+ months stale (2025-01) | **Refreshed** via BLS API — now 98 monthly points through Feb 2026 |
| P-3 | National 47.9M vs state sum 41.8M gap — no UI footnote | `<div class="dashboard-data-notice">` added to `food-insecurity.html:165` |
| P-4 | SNAP benefit timeline hardcoded in `food-prices.js` | **Extracted** to `snap-participation.json` `benefitTimeline` key; `food-prices.js` now fetches it |
| P-5 | Food Deserts FARA 2019 vs Current Access methodology unexplained | Superseded — entire Food Access dashboard migrated to current computed data; methodology note added |
| P-6 | `nonprofit-search.php` / `nonprofit-org.php` — 502 on malformed JSON | **Fixed** — stale-cache fallback added before 502 in both files |
| P-7 | `county-index.json` missing Oglala Lakota Co, SD | Added as `["Oglala Lakota County","46","South Dakota"]` |
| P-8 | Triple Burden / State Deep-Dive year-mismatch not labeled | **Fixed** — `<div class="dashboard-data-notice">` added to both sections |
| N-1 | SNAP Coverage map freshness badge said `FY2022` | **Fixed** — now data-driven: `` `FY${snapData.stateCoverage.year}` `` |
| N-2 | Food Bank density `_reconciliationNote` not rendered in UI | **Fixed** — `renderDensityMap()` now populates `#density-reconciliation` div from JSON |
| N-3 | `food-access-atlas.json` orphaned dead code | **Deleted** — file removed; orphaned `'fara'` rate-limiter entry also removed |

### Major Migration Completed

The entire Food Access & Deserts dashboard (10 components) migrated from `food-access-atlas.json` (USDA FARA 2019) to `current-food-access.json` (computed 2026-04-06 from live USDA FNS SNAP retailer locations + Census 2020 tract centroids). The `dashboard-fara.php` proxy was removed.

### New Tooling

`scripts/refresh-bls-regional.js` — Node.js script that:
1. Fetches all 11 BLS CPI series (7 categories + 4 regions) via BLS API v2
2. Fetches Census ACS median household income by state
3. Reads 2024 meal costs from `food-insecurity-state.json`
4. Recomputes stateAffordability index
5. Preserves `affordability.quintiles` (manual ERS data)
6. Writes updated `public/data/bls-regional-cpi.json`

Run: `node scripts/refresh-bls-regional.js` (requires `BLS_API_KEY` env var or `_config.php`)

### Remaining Issues (2 items)

| # | Priority | Issue | Location | Effort |
|---|---|---|---|---|
| 1 | **Low / Config** | `dashboard-fred.php` returns 503 without `FRED_API_KEY` — item price overlay buttons silently do nothing | Configure `FRED_API_KEY` in `public/api/_config.php` on SiteGround | Config change |
| 2 | **Low / Code quality** | `dashboard-places.php` + `dashboard-fred.php` — `returnStaleOrError()` defined after first call site (works via PHP hoisting but poor ordering) | Reorder function definitions | Maintenance |
