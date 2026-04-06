# Dashboard Data Quality

> **Legend:** 🟢 Good — current data, no significant issues | 🟡 Caution — vintage lag or methodology caveats | 🔴 Poor — significant quality or accuracy issues
>
> Last audited: 2026-04-06

---

## Executive Summary Dashboard

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating |
|---|---|---|---|---|---|---|
| KPI — National Insecurity Rate | `food-insecurity-state.json` | 2024 | National | None | State sum (41.8M) ≠ national total (47.9M); reconciliation note in hover tooltip | 🟡 |
| KPI — SNAP Coverage Rate | `food-insecurity-state.json` + `snap-participation.json` | FI 2024 / SNAP FY2025 | National | None | Computed dynamically at runtime; denominator explained in hover tooltip | 🟢 |
| KPI — Food Bank Orgs | `food-bank-summary.json` | 2023 | National | None | State sum (51,218) vs national (61,284) — 10K gap from territories + federal-level orgs | 🟡 |
| KPI — Food CPI YoY | `bls-food-cpi.json` | Monthly, current | National | BLS API proxy (7-day) | Oct 2025 null bridged with `connectNulls`; 1–2 month BLS release lag | 🟡 |
| Vulnerability Map | `food-insecurity-state.json` | 2024 FI + ACS 2023 poverty | State | None | Index formula: (FI Rate × 0.4) + (Poverty Rate × 0.3) + (Normalized Meal Cost × 30); documented in methodology section | 🟢 |
| SNAP Coverage Gap (grouped bars) | `food-insecurity-state.json` + `snap-participation.json` | FI 2024 / SNAP FY2023 | Top 15 states | None | Scope disclaimer added to insight text explaining SNAP ≠ food-insecure population | 🟢 |
| Food Price YoY Inflation | `bls-food-cpi.json` | Monthly, current | National | BLS API proxy (7-day) | Oct 2025 null bridged; national only | 🟡 |
| Top 10 Vulnerable States | `food-insecurity-state.json` | 2024 | State | None | Rankings reflect composite vulnerability index; documented | 🟢 |

---

## Food Insecurity Overview Dashboard

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating |
|---|---|---|---|---|---|---|
| Choropleth Map (state + county) | `food-insecurity-state.json` + county GeoJSON | 2024 actual; 2025–26 projected | State + County | None | County rates are poverty-regression modeled estimates, not USDA survey data; projections from Columbia Univ.; both disclosed in tooltips | 🟡 |
| Trend Line Chart | `food-insecurity-state.json` | 2013–2024 actual; 2025–26 projected | National + State | None | USDA ERS series discontinued after 2024; projections flagged as dashed + "USDA Report Terminated" markLine | 🟡 |
| State Comparison Radar | `food-insecurity-state.json` | 2024 | State | None | 5 metrics from multiple source vintages blended | 🟡 |
| Poverty vs FI Scatter | `food-insecurity-state.json` | 2024 | State | None | Clean USDA + ACS cross-reference; regression coefficient displayed | 🟢 |
| Meal Cost by State | `food-insecurity-state.json` | 2024 (Feeding America) | State, Top 25 | None | Feeding America proprietary model; cited in tooltips | 🟡 |
| SNAP Participation vs FI | `food-insecurity-state.json` | FI 2024 / FI data only (SNAP coverage derived from same file) | State, Top 15 | None | Series legends now show "Food Insecurity Rate (2024)" and "SNAP Coverage (FY2023)" for vintage transparency | 🟡 |
| BLS Food CPI Trend | `bls-food-cpi.json` | Monthly, current | National | BLS API proxy (7-day) | Oct 2025 null; national only | 🟡 |
| SDOH Scatter | `/api/dashboard-sdoh.php` | ACS 2023 5-yr | State | Census ACS proxy (24hr) | Non-blocking; shows "Social determinants data unavailable" if API fails | 🟢 |
| Demographic Breakdown | `food-insecurity-state.json` | 2024 | State, Top 15 | None | Consistent source; child multiplier documented | 🟢 |
| Income Distribution ThemeRiver | `/api/dashboard-sdoh.php` | ACS 2023 | State | Census ACS proxy (24hr) | Optional enrichment; skips if API unavailable | 🟢 |
| Triple Burden Index | `food-insecurity-state.json` + `current-food-access.json` | FI 2024 + access current | State, Top 10 | None | Equal-weight min-max normalized composite (FI rate + low-access + SNAP gap); methodology note in chart | 🟡 |
| State Deep-Dive KPI Panel | `food-insecurity-state.json` | 2024 | Per-state | None | Reliable per-state lookup; sources cited in tooltips | 🟢 |

---

## Food Access & Deserts Dashboard

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating |
|---|---|---|---|---|---|---|
| Food Desert Map (choropleth + SNAP toggle) | `current-food-access.json` | Computed 2026-04-06 | State + County | None | Haversine method; 40,144 qualifying retailers; thresholds well-documented | 🟢 |
| Urban vs Rural (stacked bar) | `current-food-access.json` | Current | State | None | Clear methodology | 🟢 |
| Distance to Store (gradient area) | `current-food-access.json` | Current | State | None | Alaska display capped at 10mi (actual 26.8mi) — intentional scale decision | 🟡 |
| Vehicle Access vs Food Deserts (scatter) | `current-food-access.json` | Current | State | None | Documented inverse correlation; 5 labeled outliers | 🟢 |
| Low-Income Low-Access (treemap) | `current-food-access.json` + `food-insecurity-state.json` | Current + 2024 poverty | State | None | Dual-burden = low-access pop × poverty rate — rough multiplicative approximation | 🟡 |
| Food Deserts vs Insecurity (scatter) | `current-food-access.json` + `food-insecurity-state.json` | Current + 2024 | State + County | None | County mode uses CHR "limited access" metric — different methodology than USDA food desert definition | 🟡 |
| SDOH Housing vs Food Access | `/api/dashboard-sdoh.php` | ACS 2023 | State | Census ACS proxy (24hr) | Non-blocking; fails silently | 🟢 |
| Accessible Data Table | `current-food-access.json` | Current | State | None | Well-structured; all key fields included | 🟢 |

---

## SNAP & Safety Net Dashboard

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating |
|---|---|---|---|---|---|---|
| SNAP Trend (area + CPI overlay) | `snap-participation.json` + BLS | FY2015–2025 monthly | National | BLS API proxy (non-blocking) | Policy event markers well-documented; CPI baseline alignment may shift if Jan 2018 is null | 🟢 |
| SNAP Coverage Map (admin vs CDC toggle) | `snap-participation.json` + CDC PLACES | Admin FY2024 / CDC 2023 | State | CDC PLACES proxy (24hr, non-blocking) | Vintage gap: FY2024 admin vs 2023 CDC model-based estimates; admin can exceed 100% (documented in tooltip) | 🟡 |
| Safety Net Coverage Flow (Sankey) | `snap-participation.json` → static nodes | 2022 | National | None | ECharts subtitle now reads "Modeled estimates · USDA FNS, Feeding America, Census ACS · 2022 data" | 🟡 |
| School Lunch Nightingale | `snap-participation.json` | FY2023 | State, Top 15 | None | Official FNS data; poverty thresholds labeled | 🟢 |
| Avg Benefit by State (dual-axis) | `snap-participation.json` | Benefits FY2025 / FI FY2024 | State, Top 20 | None | One-year vintage gap between axes; noted via series labels | 🟡 |
| Coverage KPI Gauges × 5 | `snap-participation.json` | FY2025 national | National | None | Meal cost uses `mealCostPerDay ?? 3.58`; falls back to Feeding America 2024 figure | 🟡 |
| Racial Disparity Flow (Sankey) | `/api/dashboard-sdoh.php` + hardcoded rates | ACS 2023 + USDA ERS ERR-337 2023 | National | SDOH proxy (non-blocking) | Race/ethnicity FI rates updated to USDA ERS ERR-337 (2023); White rate corrected 8.6% → 9.4%; USDA discontinued reports after 2024 — 2023 is most recent official data | 🟡 |
| SNAP Purchasing Power Index | `snap-participation.json` + `bls-food-cpi.json` | Jan 2018 = 100 baseline | National | BLS API proxy; FRED optional | Forward-fill alignment; FRED item overlays optional | 🟢 |

---

## Food Prices & Affordability Dashboard

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating |
|---|---|---|---|---|---|---|
| Food CPI by Category (7 lines) | `bls-regional-cpi.json` | Jan 2018 – present | National | BLS API proxy (7-day) | 7 official BLS series; nulls bridged with `connectNulls` | 🟢 |
| Regional Price Comparison (grouped bar) | `bls-regional-cpi.json` | 2020 baseline + current | 4 US census regions | BLS API proxy | Only 4 broad regions; 2020 baseline choice not documented | 🟡 |
| Meal Affordability Index Map | `bls-regional-cpi.json` → stateAffordability | 2024 | State | None | Formula now documented in JSON and tooltip: index = annual meal cost per $1,000 of median income; national avg 57.2 | 🟢 |
| Food Budget Share by Quintile (sunburst) | `bls-regional-cpi.json` → quintiles | Vintage unclear | National by income quintile | None | Income quintile vintage not specified; may reflect stale CE Survey data | 🟡 |
| Food at Home vs Away (dual-line) | `bls-food-cpi.json` | Jan 2018 – present | National | BLS API proxy (non-blocking) | Oct 2025 null bridged with `connectNulls` + shutdown annotation | 🟢 |
| YoY Inflation Rate | `bls-food-cpi.json` | Jan 2018 – present | National | BLS API proxy | Derived correctly; dynamic insight text | 🟢 |
| SNAP Purchasing Power vs Food CPI | `bls-food-cpi.json` + `snap-participation.json` | Jan 2018 = 100 baseline | National | BLS API proxy; FRED optional | Forward-fill alignment; FRED requires API key | 🟢 |
| CPI vs Food Insecurity (dual-axis) | `bls-food-cpi.json` + `food-insecurity-state.json` | CPI monthly / FI annual | National | BLS API proxy | Annual FI points on monthly CPI grid; `connectNulls` bridges gaps | 🟡 |

---

## Food Bank Landscape Dashboard

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating |
|---|---|---|---|---|---|---|
| Food Bank Density Map | `food-bank-summary.json` | 2023 (IRS 990) | State | None | State org sum (51,218) vs national (61,284) — 10K gap from territories + federal-level orgs | 🟡 |
| Resource Density vs Need (scatter) | `food-bank-summary.json` | 2023 | State | None | Regression suppressed when |r| < 0.2; coefficient displayed | 🟢 |
| Revenue & Efficiency (treemap) | `food-bank-summary.json` | 2023 | State | None | Program expense ratio assumes standard 990 layout | 🟡 |
| Regional Benchmarking (radar) | `food-bank-summary.json` | 2023 | National + 4 regions | None | Aggregation methodology clear | 🟢 |
| Density vs Insecurity (paired bars) | `food-bank-summary.json` | 2023 | Top 15 states | None | Consistent single source | 🟢 |
| Need-Capacity Gap (scatter) | `food-bank-summary.json` | 2023 | State | None | Revenue per insecure person correctly derived | 🟡 |

---

## Nonprofit Directory Dashboard

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating |
|---|---|---|---|---|---|---|
| Organization Search | ProPublica Nonprofit Explorer API | IRS 990 (12–18 mo lag) | National | ProPublica proxy (24hr cache) | Hard cap at 1,000 results per query; NTEE K-code falls back to name-keyword heuristic | 🟡 |
| Find Help Near Me (geo-search) | Mapbox Geocode + ProPublica | Same | State resolution only | Mapbox + ProPublica APIs | Resolves to state only — no county/ZIP targeting | 🟡 |
| NTEE Category Filter | ProPublica metadata | Same | National | ProPublica API | K-code mapping reliable; name-based fallback is heuristic | 🟡 |

---

## Nonprofit Profile Dashboard

| Component | Data Source | Data Year | Coverage | Live Enrichment | Quality Issues | Rating |
|---|---|---|---|---|---|---|
| Revenue Trend | ProPublica API (`nonprofit-org.php`) | IRS 990 (12–18 mo lag) | Org-specific | ProPublica proxy (7-day cache) | Renders as bar if < 2 years filings; requires 2+ years for trend line | 🟡 |
| Revenue Composition (stacked bar / donut) | ProPublica API | Same | Org-specific | Same | Investment income can be negative; filtered from display | 🟡 |
| Expenses vs Revenue (grouped bars) | ProPublica API | Same | Org-specific | Same | Reliable when data present | 🟢 |
| Assets & Liabilities | ProPublica API | Same | Org-specific | Same | Net Assets derived correctly; expressed as months of reserves | 🟢 |
| Compensation Breakdown | ProPublica API | Same | Org-specific | Same | Officer comp not always reported separately on smaller orgs' 990s | 🟡 |
| Fundraising Efficiency Radar | ProPublica API (computed) | Same | Org-specific | Same | Asset reserve capped at 200% for display; fundraising efficiency misleading for very small orgs | 🟡 |

---

## Known Structural Limitations

These issues are structural — they cannot be fixed without new data releases or data source changes.

| Issue | Affected Dashboards | Notes |
|---|---|---|
| Racial Disparity Sankey rates are static | SNAP | USDA ERS discontinued annual food security reports after 2024; 2023 ERR-337 data is now the most recent official source. Updated White rate: 9.4% (was 8.6%). |
| Safety Net Sankey uses modeled 2022 estimates | SNAP | Rebuilding from USDA FNS microdata would be required to update; chart now shows "Modeled estimates · 2022" subtitle |
| SNAP state sum (39–41M) < national total (42.1M) | SNAP, Exec Summary | Multi-state households, federal facilities, vintage differences; reconciliation note in KPI hover tooltip |
| Food insecurity state sum (41.8M) < national (47.9M) | Exec Summary, Food Insecurity | USDA household survey (national) vs Feeding America state model methodological difference; reconciliation note in hover tooltip |
| Alaska distance display capped at 10mi (actual 26.8mi) | Food Access | Intentional scale decision for map readability |
| Income quintile food burden data vintage unclear | Food Prices | Consumer Expenditure Survey data; vintage not specified in source JSON |
| Food bank org counts from IRS 990 (12–18 mo lag) | Food Banks, Nonprofit Directory | Structural limitation of IRS 990 filing cycle |

---

## Data Sources Reference

| Source | Data | Vintage | Update Frequency |
|---|---|---|---|
| USDA ERS | Food insecurity rates by state | 2024 (final report) | Annual — discontinued after 2024 |
| Feeding America Map the Meal Gap | Meal costs, state FI estimates | 2024 | Annual |
| Columbia University | 2025–26 FI projections | 2025 model | As published |
| USDA FNS | SNAP participation, school lunch | FY2025 national / FY2023 state | Monthly national; annual state |
| BLS CPI | Food price indices (national + regional) | Monthly, current | Monthly (3-week lag) |
| Census ACS 5-yr | Poverty, income, demographics | 2023 | Annual |
| CDC PLACES | SNAP self-report, health indicators | 2023 model-based | Annual |
| ProPublica Nonprofit Explorer | IRS 990 financials, org counts | 2023 | Annual (12–18 mo lag) |
| USDA FNS SNAP Retailer ArcGIS | Authorized SNAP store locations | Current | Continuous |
| Census 2020 | Tract centroids for food access | 2020 | Decennial |
