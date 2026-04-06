# Data Source Inventory

Complete inventory of every data source powering the Food-N-Force dashboard platform: static JSON files, live API proxies, hardcoded JavaScript data, and refresh scripts.

> **Related docs:** [Dashboard Data Sources](dashboard-data-sources.md) (component-to-source mapping) | [Data Quality](data-quality.md) (quality ratings) | [Data Refresh Runbook](data-refresh-runbook.md) (procedures) | [Data Monitoring Strategy](data-monitoring-strategy.md) (freshness thresholds & caching)

Last updated: 2026-04-06

---

## Static JSON Data Files

All files are in `public/data/`. Dashboards load these first (instant render), then attempt live API upgrades in the background.

| File | Size | Upstream Source | Data Vintage | Update Cadence | Refresh Method | Freshness Field | Dependent Dashboards |
|---|---|---|---|---|---|---|---|
| `food-insecurity-state.json` | ~13 KB | USDA ERS ERR-358, Feeding America Map the Meal Gap, Columbia Univ projections, Census ACS 2023 | 2024 actual; 2025-26 projected | Annual (Dec) | Manual curation | `meta.updated` = `2026-04-04` | Exec Summary, Food Insecurity, Food Access (Triple Burden), Food Prices (CPI vs FI) |
| `snap-participation.json` | ~31 KB | USDA FNS SNAP Data Tables, KIDS COUNT, Census ACS | FY2025 national / FY2023-24 state | Monthly (national trend) / Annual (state) | Manual curation | `fetchedAt` = `2026-04-05` | Exec Summary, SNAP Safety Net, Food Prices (purchasing power) |
| `bls-food-cpi.json` | ~17 KB | BLS CPI series CUUR0000SAF1, SEFV, SA0 | Monthly, current (2018-present) | Monthly (~3rd week) | Script or PHP proxy refresh | `fetchedAt` = `2026-03-31` | Exec Summary, Food Insecurity (price overlay), SNAP Safety Net (purchasing power) |
| `bls-regional-cpi.json` | ~99 KB | BLS CPI (7 categories + 4 regions), Census ACS median income | Monthly, current (2018-present) | Monthly (~3rd week) | `scripts/refresh-bls-regional.js` | `fetchedAt` = `2026-04-06` | Food Prices (all charts) |
| `current-food-access.json` | ~946 KB | USDA FNS SNAP Retailer ArcGIS, Census 2020 tract centroids, Census ACS 2023 | Current (live compute) | Quarterly | `scripts/compute-food-access.cjs` + `scripts/patch-novehicle.cjs` | `meta.computed` = `2026-04-06` | Food Access (primary), Food Insecurity (Triple Burden) |
| `food-bank-summary.json` | ~11 KB | ProPublica Nonprofit Explorer / IRS 990 (NTEE K31) | 2023 (12-18 mo IRS lag) | Annual | Manual curation | `fetchedAt` = `2026-03-30` | Exec Summary, Food Banks (all charts), Food Insecurity (Triple Burden) |
| `snap-retailers.json` | ~20 KB | USDA FNS Retailer Management Dashboard FY2024 | FY2024 | Quarterly | Manual curation | `meta.updated` = `2026-04-05` | Food Access (SNAP Retailers map toggle) |
| `county-index.json` | ~108 KB | Census FIPS codes | Static (decennial) | Rarely | Manual | None | Food Insecurity (county search autocomplete) |
| `us-states-geo.json` | ~358 KB | us-atlas npm package (Census TIGER) | 2020 | Rarely (decennial) | `scripts/build-dashboard-data.js` | None | All map-based dashboards |
| `counties/*.json` (51 files) | ~3.2 MB total | us-atlas + Census ACS poverty + CHR 2025 | Mixed (boundaries 2020, data 2023-25) | Annual (CHR release) | `build-dashboard-data.js` + `fetch-county-data.js` + `import-chr-data.cjs` | Per-feature `dataSource` field | Food Insecurity (county drill-down) |

### Key data vintage notes

- **USDA ERS discontinued** the Household Food Security report after the 2024 edition (ERR-358, December 2025). Future `food-insecurity-state.json` updates depend on whether the program resumes or an alternative source emerges.
- **State-national reconciliation gaps** are documented via `_reconciliationNote` fields in `food-insecurity-state.json`, `snap-participation.json`, and `food-bank-summary.json`. These are methodological, not errors.
- **County food insecurity rates** are modeled from poverty via regression (`0.75 x poverty + 2.5`), except where overridden by CHR 2025 actual rates (`dataSource: "CHR2025"`).
- **BLS CPI** has a known Oct 2025 null value bridged with `connectNulls` in charts.

---

## Live API Proxy Sources

All proxies are in `public/api/`. Each implements file-based caching in `_cache/dashboard/` and falls back to stale cache when upstream APIs fail.

| Proxy | Upstream API | Cache TTL | Rate Limit | API Key Required | Cache Key Pattern |
|---|---|---|---|---|---|
| `dashboard-bls.php` | BLS CPI API v2 (`api.bls.gov`) | 604,800s (7 days) | 450/day (v2) or 20/day (v1) | Optional (BLS_API_KEY for v2) | `bls-food-cpi.json`, `bls-regional-cpi.json` |
| `dashboard-census.php` | Census ACS 5-year 2023 (`api.census.gov`) | 86,400s (24 hours) | None enforced | No | `census-states.json`, `census-county-{fips}.json` |
| `dashboard-saipe.php` | Census SAIPE 2023 (`api.census.gov`) | 86,400s (24 hours) | 45/day | No | `saipe-states.json`, `saipe-county-{fips}.json` |
| `dashboard-sdoh.php` | Census ACS 5-year 2023 (multi-table) | 86,400s (24 hours) | None enforced | No | `sdoh-states.json` |
| `dashboard-places.php` | CDC PLACES SODA API (`data.cdc.gov`) | 86,400s (24 hours) | 900/day | No | `places-{type}.json`, `places-{type}-{state}.json` |
| `dashboard-fred.php` | FRED API (`api.stlouisfed.org`) | 604,800s (7 days) | 500/day | Yes (FRED_API_KEY) | `fred-{md5}.json` |
| `nonprofit-search.php` | ProPublica Nonprofit Explorer | 86,400s (24 hours) | None enforced | No | `nonprofit-search-{md5}.json` |
| `nonprofit-org.php` | ProPublica Nonprofit Explorer | 604,800s (7 days) | None enforced | No | `nonprofit-org-{ein}.json` |
| `charity-navigator.php` | Charity Navigator GraphQL | 604,800s (7 days) | 90,000/day | Yes (CN API key, not yet configured) | `cn-{ein}.json` |
| `mapbox-geocode.php` | Mapbox Geocoding v6 (`api.mapbox.com`) | 2,592,000s (30 days) | 90,000/month | Yes (MAPBOX_ACCESS_TOKEN) | `mapbox-{md5}.json` |

### Utility endpoints

| Endpoint | Purpose |
|---|---|
| `rate-limit-status.php` | Returns current rate limit counters for all tracked services |
| `cache-cleanup.php` | Deletes cache files older than 30 days. CLI: `php cache-cleanup.php`. HTTP: `?token=CLEANUP_TOKEN` |

### API keys

All keys are stored in `public/api/_config.php` (gitignored, copied from `_config.example.php`). Current keys:
- **BLS_API_KEY** -- registered v2 key (450 requests/day vs 20/day without)
- **FRED_API_KEY** -- required for all FRED requests
- **MAPBOX_ACCESS_TOKEN** -- free tier (100K requests/month)
- **CHARITY_NAVIGATOR_API_KEY** -- not yet configured (commented out)
- **CLEANUP_TOKEN** -- for HTTP-triggered cache cleanup

---

## Hardcoded Data in JavaScript

Data embedded directly in dashboard JS modules that cannot be refreshed by script or API.

| Data | File | Source | Vintage | Update Trigger |
|---|---|---|---|---|
| Racial disparity food insecurity rates | `src/js/dashboards/snap-safety-net.js` | USDA ERS ERR-337 | 2023 | USDA discontinued; no future updates expected |
| SNAP policy event markers (7 events) | `snap-participation.json` `trend.events` | Manual research | Historical (2020-2025) | Only when new policy events occur |
| Income quintile food burden | `bls-regional-cpi.json` `affordability.quintiles` | BLS Consumer Expenditure Survey | 2023 | Annual CE Survey release |
| SNAP max benefit timeline | `snap-participation.json` `benefitTimeline` | USDA FNS historical data | Through FY2025 | Annual SNAP benefit adjustment (October) |
| Vulnerability index formula | `src/js/dashboards/executive-summary.js` | Custom composite | N/A | Only if methodology changes |
| County FI regression model | `scripts/fetch-county-data.js` | Custom (0.75 x poverty + 2.5) | N/A | Only if model is recalibrated |

---

## Refresh Scripts

All scripts are in `scripts/`. None are automated -- all require manual execution.

| Script | Output | Upstream Dependencies | Runtime | Trigger |
|---|---|---|---|---|
| `refresh-bls-regional.js` | `bls-regional-cpi.json` | BLS API (key optional), Census ACS median income | ~10s | Monthly after BLS release |
| `compute-food-access.cjs` | `current-food-access.json` | USDA FNS SNAP Retailer ArcGIS, Census 2020 tract centroids, Census ACS 2023 | 2-5 min | Quarterly |
| `patch-novehicle.cjs` | Updates `current-food-access.json` vehicle access | Census ACS 2023 B25044 | ~5s | After `compute-food-access.cjs` |
| `fetch-county-data.js` | Enriches `counties/*.json` with poverty/FI data | Census ACS 2022 B17001, `food-insecurity-state.json` | ~2 min | Annual or after state data update |
| `import-chr-data.cjs` | Overlays CHR rates on `counties/*.json` | CHR CSV download (manual) | ~10s | Annual after CHR release (March) |
| `build-dashboard-data.js` | `us-states-geo.json`, `counties/*.json` (boundaries) | us-atlas npm package | <1s | Rarely (after us-atlas update) |

---

## External Source Release Calendar

Consolidated timeline of when upstream sources publish new data.

| Source | Typical Release | Data Lag | Action Required |
|---|---|---|---|
| **BLS CPI** | Monthly, ~3rd week (see [schedule](https://www.bls.gov/schedule/news_release/cpi.htm)) | ~3 weeks from reference month | Run `refresh-bls-regional.js`; static `bls-food-cpi.json` refreshed via proxy on next visit |
| **USDA FNS SNAP Tables** | Monthly (national), annual (state) | 1-2 months | Manually update `snap-participation.json` trend array |
| **Census ACS 5-year** | September (1-year) / December (5-year) | 1-2 years | Update year in 4 PHP proxies + 1 script (coordinated) |
| **Census SAIPE** | December | ~1 year | PHP proxy auto-serves; update year in URL when new vintage available |
| **CDC PLACES** | Annually (~October) | Model-based, ~1 year | No code change needed; SODA API serves latest |
| **County Health Rankings** | March | ~1-2 years | Download CSV, run `import-chr-data.cjs` |
| **USDA ERS Food Security** | Historically December | 1 year | **Discontinued after 2024** -- monitor for resumption or alternative |
| **Feeding America Map the Meal Gap** | Spring/Summer | 1 year | Update `food-insecurity-state.json` meal costs and state estimates |
| **ProPublica IRS 990** | Rolling (12-18 month lag) | 12-18 months | Update `food-bank-summary.json` annually |
| **USDA FNS SNAP Retailers** | Continuous (ArcGIS) | Real-time | Run `compute-food-access.cjs` quarterly |
| **BLS Consumer Expenditure Survey** | September | ~1 year | Update `affordability.quintiles` in `bls-regional-cpi.json` |
| **SNAP benefit adjustments** | October (COLA) | N/A | Update `benefitTimeline` in `snap-participation.json` |
