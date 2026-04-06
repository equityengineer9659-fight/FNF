# Data Quality Assessment — Pre-USDA Atlas 2019 Switch

**Date**: 2026-04-06
**Scope**: All dashboard data sources — 10 static JSON files, 9 PHP proxy endpoints, 7 dashboard JS files
**Purpose**: Baseline quality snapshot before upgrading `food-access-atlas.json` from USDA FARA 2019 data to a newer vintage.

---

## Critical Bug Found

**C-1 — CDC PLACES health outcomes have never worked** (`food-insecurity.js`)

The SDOH scatter's Health Outcomes toggle (obesity, diabetes, depression) silently fails because `dashboard-places.php` returns data under the key `records`, but the JS checks for `places.states` — which is always `undefined`, causing an immediate early return. This feature has been broken since it was built. 15-minute fix.

---

## Full Quality Assessment

### Food Insecurity Overview

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating |
|---|---|---|---|---|---|---|
| FI Rate map (all metric toggles) | `food-insecurity-state.json` + `us-states-geo.json` | 2024 | 51 states | No | National 47.9M vs state sum 41.8M gap (-12.8%) not disclosed in UI | Yellow |
| County drill-down | `/data/counties/{fips}.json` | 2020 (Census) | ~3,143 counties | No (Census model estimate) | Modeled estimate clearly disclosed in UI | Green |
| County search autocomplete | `county-index.json` | Current | 3,142 / 3,143 | No | 1 county missing — likely Oglala Lakota Co, SD (FIPS 46102) | Yellow |
| Food Insecurity Over Time trend | `food-insecurity-state.json` | 2024 | 51 states | No | Clean | Green |
| State Comparison radar | `food-insecurity-state.json` | 2024 | 51 states | No | Clean | Green |
| Poverty vs Insecurity scatter | `food-insecurity-state.json` + `/api/dashboard-saipe.php` | 2024 / 2023 | 51 states | Yes (SAIPE) | Child poverty scatter only available when SAIPE proxy is reachable | Yellow |
| Meal Cost by State bar | `food-insecurity-state.json` | 2024 | 51 states | No | Clean | Green |
| SNAP Participation Comparison | `food-insecurity-state.json` | 2024 | 51 states | No | Clean | Green |
| Triple Burden / Demographics | 3-file cross-join | Mixed (2022–2024) | 51 states | No | Year mismatch across joined datasets; no label | Yellow |
| State Deep-Dive KPI panel | 3-file cross-join | Mixed (2022–2024) | 51 states | No | Same year mismatch | Yellow |
| Food Prices / BLS CPI | `bls-food-cpi.json` + `/api/dashboard-bls.php` | Through Feb 2026 | National | Yes (BLS) | Clean | Green |
| SDOH scatter — Poverty/Unemployment dimensions | `/api/dashboard-sdoh.php` | 2023 ACS | 51 states | Yes | Clean | Green |
| SDOH scatter — Health Outcomes dimensions | `/api/dashboard-places.php` | N/A | N/A | Yes | **BROKEN** — key mismatch (`places.states` vs `places.records`); has never merged CDC data | Red |
| Accessible table | `food-insecurity-state.json` | 2024 | 51 states | No | Clean | Green |

---

### Food Access & Deserts

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating |
|---|---|---|---|---|---|---|
| Low-Access Tracts map (default/desert view) | `food-access-atlas.json` + `us-states-geo.json` | **2019** | 51 states | No | 7-year-old FARA data; LILA methodology differs from current-food-access.json but both labeled identically | Red |
| Current Food Access Score map (toggle) | `current-food-access.json` | 2026 (computed) | 51 states | No | `lowAccessPct` is % of tracts, not % of population — label could mislead | Yellow |
| County drill-down (desert mode) | `/data/counties/{fips}.json` + `/api/dashboard-fara.php` | 2019 / optional | County-level | Optional (FARA) | Based on 2019 atlas | Yellow |
| Urban vs Rural Low-Access donut | `food-access-atlas.json` | **2019** | 51 states | No | 7-year-old data | Yellow |
| Average Distance to Store | `food-access-atlas.json` | **2019** | 51 states | No | 7-year-old data | Yellow |
| Vehicle Access vs Low-Access scatter | `food-access-atlas.json` | **2019** | 51 states | No | 7-year-old data | Yellow |
| Low-Income / Low-Access treemap | `food-access-atlas.json` | **2019** | 51 states | No | 7-year-old data | Yellow |
| SNAP Retailers map (toggle) | `snap-retailers.json` + `food-access-atlas.json` | FY2024 / 2019 | 51 states | No | Mixed vintage cross-reference | Yellow |
| Housing Burden vs Food Deserts scatter | `/api/dashboard-sdoh.php` | 2023 ACS | 51 states | Yes | Clean | Green |
| Accessible table | `food-access-atlas.json` + `snap-retailers.json` | 2019 / FY2024 | 51 states | No | Year mismatch between joined sources | Yellow |

---

### SNAP & Safety Net

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating |
|---|---|---|---|---|---|---|
| SNAP Participants Over Time trend | `snap-participation.json` | 2024 (state), 2025 (national) | 51 states | No | Clean | Green |
| Food CPI overlay | `/api/dashboard-bls.php` | Through Feb 2026 | National | Yes | Clean | Green |
| SNAP Coverage Ratio map | `snap-participation.json` + `us-states-geo.json` | FY2024 | 51 states | No | Clean | Green |
| CDC PLACES SNAP receipt toggle | `/api/dashboard-places.php?type=snap-receipt` | 2022 BRFSS | 51 states | Yes | Clean | Green |
| Safety Net Coverage Flow — Sankey | `snap-participation.json` (sankey section) | 2024 | National | No | Clean | Green |
| Free/Reduced Lunch — Nightingale | `snap-participation.json` (schoolLunch) | 2024 | 51 states | No | Clean | Green |
| Avg Benefit vs FI Rate bar+line | `snap-participation.json` | FY2024 | 51 states | No | Clean | Green |
| 5 KPI Gauges | `snap-participation.json` (national) | FY2024/2025 | National | No | Clean | Green |
| Demographic Flow | `/api/dashboard-sdoh.php` | 2023 ACS | National | Yes | Clean | Green |

---

### Food Prices & Affordability

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating |
|---|---|---|---|---|---|---|
| Food Price Trends by Category | `bls-regional-cpi.json` (categories.series) | **2025-01 (13 months stale)** | National categories | No | Static fallback 13 months behind main CPI trend | Yellow |
| Regional Price Comparison bar | `bls-regional-cpi.json` (regions.series) | 2025 | 4 BLS regions | No | Only 4 broad regions — limited granularity | Yellow |
| Affordability Index map | `bls-regional-cpi.json` (stateAffordability) + `us-states-geo.json` | **2022** | 51 states | No | Meal cost values 2–4 years stale; contradicts 2024 values on FI dashboard (e.g. Alaska $4.32 vs $4.89) | Red |
| Food Cost as % of Budget sunburst | `bls-regional-cpi.json` (affordability.quintiles) | **2022** | National quintiles | No | 4-year-old income figures | Yellow |
| Food at Home vs Away line+area | `bls-food-cpi.json` | Through Feb 2026 | National | No | Clean | Green |
| Year-over-Year Inflation Rate | `bls-food-cpi.json` | Through Feb 2026 | National | No | Clean | Green |
| SNAP Purchasing Power Index | `bls-food-cpi.json` + hardcoded SNAP timeline | Feb 2026 / static | National | No | SNAP benefit timeline is hardcoded in JS — won't update without a code change | Yellow |
| Individual item price overlays | `/api/dashboard-fred.php` | Live | National items | Yes (FRED) | Returns 503 on prod until `FRED_API_KEY` configured in `_config.php` | Yellow |
| CPI vs Food Insecurity Rate dual-axis | `bls-food-cpi.json` + `food-insecurity-state.json` | Feb 2026 / 2024 | National | No | Minor year-lag between series (monthly CPI vs annual FI survey) | Green |

---

### Food Bank Landscape

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating |
|---|---|---|---|---|---|---|
| Food Bank Density map | `food-bank-summary.json` + `us-states-geo.json` | 2023 (IRS 990) | 51 states | No | National org count 61,284 vs state sum 51,218 (-16.4%) not disclosed in UI | Yellow |
| Density vs FI Rate scatter | `food-bank-summary.json` | 2023 | 51 states | No | Regression line suppressed when \|r\| < 0.2 — correct behavior | Green |
| Revenue per Food-Insecure Person treemap | `food-bank-summary.json` | 2023 | 51 states | No | Clean; division-by-zero guarded | Green |
| Regional Comparison radar | `food-bank-summary.json` | 2023 | 51 states | No | Clean | Green |
| FI Rate vs Food Bank Density paired bar | `food-bank-summary.json` | 2023 | 51 states | No | Clean | Green |
| Need-Capacity Gap scatter (bubble) | `food-bank-summary.json` | 2023 | 51 states | No | Clean | Green |

---

### Nonprofit Directory

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating |
|---|---|---|---|---|---|---|
| Search results grid | `/api/nonprofit-search.php` → ProPublica | Live IRS 990 | National | Yes | No stale fallback if ProPublica returns malformed JSON (502 immediately) | Yellow |
| Pagination | Same | Live | National | Yes | Same | Yellow |
| Find Help Near Me | `/api/mapbox-geocode.php` + search | Live | National | Yes | Clean | Green |

---

### Nonprofit Profile

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating |
|---|---|---|---|---|---|---|
| All 6 ECharts + KPI header | `/api/nonprofit-org.php` → ProPublica (IRS 990) | Live | Per org | Yes | No stale fallback for malformed upstream response | Yellow |
| Calculation clamps (ratios, efficiency) | Same | Live | Per org | Yes | All ratio clamps present; division-by-zero guarded | Green |
| Charity Navigator gauge + badge | `/api/charity-navigator.php` | Live | Per org (optional) | Optional | Optional feature — graceful degradation confirmed | Green |

---

## Data Freshness Summary

| Dataset | Data Year | Status |
|---|---|---|
| `food-insecurity-state.json` | 2024 | Current |
| `food-bank-summary.json` | 2023 (IRS 990) | Current |
| `food-access-atlas.json` | **2019** | Stale — 7 years old; primary driver for this document |
| `snap-participation.json` | 2024 (state), 2025 (national) | Current |
| `snap-retailers.json` | FY2024 | Current |
| `current-food-access.json` | 2026 (computed) | Current |
| `bls-food-cpi.json` | Through Feb 2026 | Current |
| `bls-regional-cpi.json` (categories) | 2025-01 | 13 months stale |
| `bls-regional-cpi.json` (stateAffordability) | **2022** | 4 years stale |
| `bls-regional-cpi.json` (quintiles) | **2022** | 4 years stale |
| `county-index.json` | Current | Current |
| `us-states-geo.json` | Current | Current |

---

## National vs State Aggregate Cross-Check

| Metric | Sum of States | National Aggregate | Variance | Status |
|---|---|---|---|---|
| Food Insecure Persons | 41.8M | 47.9M | -12.8% | Warn — exceeds ±5%; reconciliation note in JSON but no UI disclosure |
| SNAP Participants | 41.6M | 41.7M | -0.3% | Pass |
| Food Bank Org Count | 51,218 | 61,284 | -16.4% | Warn — reconciliation note in JSON; no UI disclosure |
| Food Bank Combined Revenue | $48.76B | $48.20B | +1.2% | Pass |
| SNAP Retailers | 267,201 | 267,200 | 0.0% | Pass |

---

## Calculation Audit

| Formula | Status | Notes |
|---|---|---|
| `linearRegression()` — Pearson r | Pass | Formula correct; r = 0.9311 (poverty vs FI) |
| Per-capita orgs (food-banks.js) | Pass | Division-by-zero guarded (`insecurePop > 0`) |
| SNAP coverage ratio range | Pass | 46.9% (Wyoming) to 131.8% (California) |
| Meal cost baseline | Pass | `baseMealCost = 3.58` matches `national.averageMealCost` |
| Nonprofit programExpenseRatio clamp | Pass | `Math.min(100, ...)` present |
| Nonprofit assetReserve clamp | Pass | `Math.min(200, ...)` present |
| Nonprofit fundraisingEfficiency clamp | Pass | `Math.min(100, ...)` present |
| SNAP Purchasing Power Index baseline | Pass | Uses first non-null CPI value as baseline |
| BLS M13 annual averages filtered | Pass | `if ($month < 1 || $month > 12) continue` correctly excludes M13 |

---

## PHP Proxy Health

| Proxy | Cache TTL | Error Handling | Issues |
|---|---|---|---|
| `dashboard-bls.php` | 7 days | Stale fallback present | Clean |
| `dashboard-census.php` | 24 hours | Stale fallback (`_stale: true`) | Clean |
| `dashboard-saipe.php` | 24 hours | Stale fallback; 45/day rate limit guard | Clean |
| `dashboard-sdoh.php` | 24 hours | No rate limiter (Census ACS has no hard key limit) | Info |
| `dashboard-places.php` | 24 hours | `returnStaleOrError()` called before definition (works at runtime; maintenance hazard) | Warn |
| `dashboard-fara.php` | 7 days | Appropriate for immutable 2019 data | Clean |
| `dashboard-fred.php` | 7 days | Returns 503 if `FRED_API_KEY` not configured; `returnStaleOrError()` defined after `exit` (unreachable dead code path) | Warn |
| `nonprofit-search.php` | 24 hours | **No stale fallback for malformed upstream JSON** — returns 502 immediately | Warn |
| `nonprofit-org.php` | 7 days | Same as search — no malformed-response fallback | Warn |

---

## Priority Fix List

| # | Priority | Issue | Location | Effort |
|---|---|---|---|---|
| 1 | **Critical / Bug** | CDC PLACES key mismatch — SDOH Health Outcomes (obesity, diabetes, depression) has never loaded | `food-insecurity.js` line 1103 — change `!places.states` to `!places.records`; update merge loop | ~15 min |
| 2 | **High / Misleading** | `stateAffordability` meal costs are 2022 — contradict 2024 values on FI dashboard (e.g. Alaska $4.32 vs $4.89) | Regen `bls-regional-cpi.json` stateAffordability section with 2024 Feeding America figures | Regen JSON |
| 3 | **High / Disclosure** | National 47.9M vs state sum 41.8M gap (-12.8%) — no footnote in UI | Add one-sentence footnote near hero counter on Food Insecurity Overview | UI label |
| 4 | **High / Stale** | Category CPI series 13 months behind main CPI chart | Regen `bls-regional-cpi.json` categories section to monthly through early 2026 | Regen JSON |
| 5 | **Medium / Disclosure** | Food Deserts (FARA 2019 LILA) vs Current Access (2026 low-access) methodology not explained in UI | Add methodology note to Food Access toggle | UI note |
| 6 | **Medium / Resilience** | `nonprofit-search.php` and `nonprofit-org.php` — 502 on malformed upstream response, no stale fallback | Add malformed-response cache path mirroring BLS/Census proxy pattern | PHP fix |
| 7 | **Low / Data** | `county-index.json` missing 1 county — likely Oglala Lakota Co, SD (FIPS 46102, renamed from Shannon Co 46113 in 2015) | Add missing FIPS entry | JSON fix |
| 8 | **Low / Hardcoded** | SNAP benefit timeline in `food-prices.js` is hardcoded — won't auto-update as new benefit years are published | Extract to `snap-participation.json` or separate data file | Refactor |

---

## What Drove This Document

`food-access-atlas.json` is 7 years old (USDA FARA 2019). The entire Food Access & Deserts dashboard — Urban/Rural donut, Distance to Store, Vehicle Access scatter, Low-Income/Low-Access treemap, and the desert map itself — all run on this data. When this file is updated to a newer USDA Atlas vintage, the values across all these components will shift. This snapshot captures the pre-switch state so regressions can be identified after the update.

The two most structurally fragile areas post-switch will be:
1. **Methodology labeling** — FARA 2015/2019 use LILA (Low Income + Low Access). If the new vintage changes the definition or thresholds, the UI labels need to reflect that.
2. **Cross-dataset joins** — `food-banks.js` and `food-insecurity.js` both join against `food-access-atlas.json` by state name. Verify the new file uses identical state name strings.
