# Dashboard Data Sources

Complete inventory of every data source used across the 7 interactive dashboards. Covers static JSON files, live PHP proxy endpoints, and the upstream APIs they bridge.

> **See also:** [Data Source Inventory](data-source-inventory.md) (update frequencies, freshness thresholds, ownership) | [Data Refresh Runbook](data-refresh-runbook.md) (step-by-step update procedures) | [Data Monitoring Strategy](data-monitoring-strategy.md) (staleness detection & caching)

---

## Food Insecurity Overview

| Header/Title | Component Name | Data Source |
|---|---|---|
| Food Insecurity Rate map (+ toggle: Child Rate, Persons, Meal Gap, Meal Cost, SNAP Coverage) | `renderMap()` | `public/data/food-insecurity-state.json` + `public/data/us-states-geo.json` |
| County drill-down popup | `drillDown()` | `/data/counties/{stateFips}.json` (dynamic per state) |
| Find counties (search autocomplete) | `initCountySearch()` | `public/data/county-index.json` |
| Food Insecurity Over Time trend | `renderTrend()` | `public/data/food-insecurity-state.json` |
| State Comparison radar | `renderBar()` | `public/data/food-insecurity-state.json` |
| Poverty vs Insecurity scatter | `renderScatter()` | `public/data/food-insecurity-state.json` + `/api/dashboard-saipe.php` (live upgrade) |
| Meal Cost by State bar | `renderMealCost()` | `public/data/food-insecurity-state.json` |
| SNAP Participation Comparison bar | `renderSnap()` | `public/data/food-insecurity-state.json` |
| Triple Burden / Demographics | `renderTripleBurden()` | `food-insecurity-state.json` + `food-access-atlas.json` + `food-bank-summary.json` |
| State Deep-Dive KPI panel (6 metrics) | `renderStateDeepDive()` | All three JSON files merged |
| Food Prices / BLS Food CPI | `renderFoodPrices()` | `public/data/bls-food-cpi.json` + `/api/dashboard-bls.php` (live upgrade) |
| SDOH Census overlay | `fetchSDOHData()` | `/api/dashboard-census.php?type=states` |
| Full state breakdown (accessible table) | `populateAccessibleTable()` | `public/data/food-insecurity-state.json` |

---

## Food Access & Deserts

| Header/Title | Component Name | Data Source |
|---|---|---|
| Low-Access Census Tracts (%) state map | `renderDesertMap()` | `public/data/current-food-access.json` + `public/data/us-states-geo.json` |
| County-level low-access drill-down | `drillDown()` | `/data/counties/{stateFips}.json` |
| Urban vs Rural Low-Access donut | `renderUrbanRural()` | `public/data/current-food-access.json` |
| Average Distance to Store by State | `renderDistance()` | `public/data/current-food-access.json` |
| Vehicle Access vs Low-Access scatter | `renderVehicle()` | `public/data/current-food-access.json` |
| Low-Income / Low-Access treemap | `renderDoubleBurden()` | `public/data/current-food-access.json` |
| SNAP Retailers per 100K map toggle | `renderSnapRetailers()` | `public/data/snap-retailers.json` + `public/data/current-food-access.json` |
| Current Food Access Score map toggle | `renderLowAccessMap()` | `public/data/current-food-access.json` |
| Housing Burden vs Food Deserts scatter | `renderAccessSDOH()` | `/api/dashboard-sdoh.php` (live Census + CDC) |
| State breakdown (accessible table) | `populateAccessibleTable()` | `public/data/current-food-access.json` + `public/data/snap-retailers.json` |

---

## SNAP & Safety Net

| Header/Title | Component Name | Data Source |
|---|---|---|
| SNAP Participants Over Time (policy zone annotations) | `renderSnapTrend()` | `public/data/snap-participation.json` |
| Food CPI overlay on trend | `fetchBLSForSnap()` | `/api/dashboard-bls.php` (live upgrade) |
| SNAP Coverage Ratio by State map | `renderSnapMap()` | `public/data/snap-participation.json` + `public/data/us-states-geo.json` |
| CDC PLACES SNAP receipt % toggle | `fetchCDCPlacesSnap()` | `/api/dashboard-places.php?type=snap-receipt` |
| Safety Net Coverage Flow — Sankey | `renderCoverageGap()` | `public/data/snap-participation.json` (sankey section) |
| Free/Reduced Lunch — Nightingale rose | `renderSchoolLunch()` | `public/data/snap-participation.json` (schoolLunch section) |
| Avg Benefit vs Food Insecurity Rate bar+line | `renderBenefits()` | `public/data/snap-participation.json` |
| 5 KPI Gauges (Coverage, Lunch, Benefit, Gap, Affordability) | `renderGauges()` | `public/data/snap-participation.json` (national metrics) |
| Demographic Flow (race/ethnicity) | `renderDemographicFlow()` | `/api/dashboard-sdoh.php` (Census race data) |

---

## Food Prices & Affordability

| Header/Title | Component Name | Data Source |
|---|---|---|
| Food Price Trends by Category multi-line | `renderCategories()` | `public/data/bls-regional-cpi.json` (categories.series) |
| Regional Price Comparison bar | `renderRegions()` | `public/data/bls-regional-cpi.json` (regions.series) |
| Affordability Index map | `renderAffordabilityMap()` | `public/data/bls-regional-cpi.json` (stateAffordability) + `us-states-geo.json` |
| Food Cost as % of Budget by Income sunburst | `renderBurden()` | `public/data/bls-regional-cpi.json` (affordability.quintiles) |
| Food at Home vs Away line+area | `renderHomeVsAway()` | `public/data/bls-food-cpi.json` |
| Year-over-Year Inflation Rate | `renderYoYInflation()` | `public/data/bls-food-cpi.json` |
| SNAP Purchasing Power Index dual-axis | `renderPurchasingPower()` | `public/data/bls-food-cpi.json` + Static SNAP timeline (hardcoded in JS) |
| Individual item price overlays toggle | `toggleFredOverlay()` | `/api/dashboard-fred.php?type=cpi-item&series={id}` |
| CPI vs Food Insecurity Rate dual-axis | `renderCpiVsInsecurity()` | `public/data/bls-food-cpi.json` + `public/data/food-insecurity-state.json` |

---

## Food Bank Landscape

| Header/Title | Component Name | Data Source |
|---|---|---|
| Food Bank Density per 100K map | `renderDensityMap()` | `public/data/food-bank-summary.json` + `public/data/us-states-geo.json` |
| Density vs Food Insecurity Rate scatter | `renderVsInsecurity()` | `public/data/food-bank-summary.json` |
| Revenue per Food-Insecure Person treemap | `renderRevenue()` | `public/data/food-bank-summary.json` |
| Regional Comparison radar | `renderEfficiency()` | `public/data/food-bank-summary.json` |
| Food Insecurity Rate vs Food Bank Density paired bar | `renderDistribution()` | `public/data/food-bank-summary.json` |
| Need-Capacity Gap scatter (bubble) | `renderCapacityGap()` | `public/data/food-bank-summary.json` |

---

## Nonprofit Directory

| Header/Title | Component Name | Data Source |
|---|---|---|
| Search results grid (name, location, revenue, category) | `handleSearch()` | `/api/nonprofit-search.php?q=&state=&page=` → ProPublica Nonprofit Explorer |
| Pagination | `renderPagination()` | Same as search (paginated response) |
| Find Help Near Me | `initFindHelp()` / `doSearch()` | `/api/mapbox-geocode.php` + `/api/nonprofit-search.php` |

---

## Nonprofit Profile

| Header/Title | Component Name | Data Source |
|---|---|---|
| Organization header KPIs (name, EIN, NTEE, revenue, expenses, assets) | `populateHeader()` / `populateStats()` | `/api/nonprofit-org.php?ein=` → ProPublica (IRS 990 filings) |
| Revenue Trend (trend line + volatility band) | `renderRevenueTrend()` | ProPublica IRS 990 filings |
| Revenue Composition stacked bar/donut | `renderRevenueComposition()` | ProPublica IRS 990 filings |
| Expenses vs Revenue bar | `renderExpensesVsRevenue()` | ProPublica IRS 990 filings |
| Assets & Liabilities dual-line | `renderAssetsLiabilities()` | ProPublica IRS 990 filings |
| Compensation Breakdown stacked bar+line | `renderCompensation()` | ProPublica IRS 990 filings |
| Compensation as % of Expenses gauge | Inline gauge | ProPublica IRS 990 filings |
| Fundraising Efficiency radar | `renderRadar()` | ProPublica IRS 990 filings |
| Charity Navigator score gauge + badge | `fetchCharityNavigator()` | `/api/charity-navigator.php?ein=` (optional) |
| YoY change badges | `populateStats()` | ProPublica IRS 990 filings |

---

## Static JSON Files (`public/data/`)

| File | Purpose |
|---|---|
| `food-insecurity-state.json` | State-level food insecurity rates, child rates, meal costs, SNAP coverage, trend history |
| `food-access-atlas.json` | USDA Food Access Atlas — low-access %, urban/rural split, distance, vehicle access |
| `snap-participation.json` | SNAP trend, state coverage, Sankey flows, school lunch, benefits per person |
| `snap-retailers.json` | SNAP-authorized retailer counts by store type per state |
| `current-food-access.json` | Computed food access score (FNS retailer data + Census tracts) |
| `food-bank-summary.json` | Food bank counts, revenue, density, efficiency by state |
| `bls-food-cpi.json` | BLS food at home vs away CPI time series |
| `bls-regional-cpi.json` | BLS regional + category CPI breakdown, state affordability, income quintiles |
| `us-states-geo.json` | GeoJSON for all state-level choropleth maps |
| `county-index.json` | Flat array of county names + FIPS codes for autocomplete |

---

## Live PHP Proxy Endpoints

| Endpoint | Upstream Source | Cache TTL |
|---|---|---|
| `/api/dashboard-bls.php` | U.S. Bureau of Labor Statistics API | 7 days |
| `/api/dashboard-census.php` | Census Bureau ACS | 24 hours |
| `/api/dashboard-saipe.php` | Census Bureau SAIPE (poverty estimates) | 24 hours |
| `/api/dashboard-sdoh.php` | Census ACS + CDC PLACES merged | 24 hours |
| `/api/dashboard-places.php` | CDC PLACES / BRFSS | 24 hours |
| `/api/dashboard-fara.php` | ~~Removed~~ — FARA proxy deleted after Food Access migration to `current-food-access.json` | N/A |
| `/api/dashboard-fred.php` | Federal Reserve FRED (individual CPI items) | 7 days |
| `/api/nonprofit-search.php` | ProPublica Nonprofit Explorer | 24 hours |
| `/api/nonprofit-org.php` | ProPublica Nonprofit Explorer (org detail) | 7 days |
| `/api/charity-navigator.php` | Charity Navigator API (optional) | 7 days |
| `/api/mapbox-geocode.php` | Mapbox Geocoding API | 24 hours |
