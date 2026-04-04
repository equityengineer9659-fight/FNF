# Free API & Data Source Integration Plan

> Reference document for dashboard data enhancement opportunities. All services listed are free ($0 cost).
> Created: 2026-04-04

## Current Data Gaps

| Dashboard | Source | Data Year | Key Limitation |
|-----------|--------|-----------|----------------|
| Food Insecurity | USDA ERS + Feeding America | 2022 | County FI rates are modeled, not real |
| Food Access | USDA Food Access Atlas | **2019** | 7 years old, no store-level data |
| SNAP & Safety Net | USDA FNS | 2024 | Static JSON, no real-time caseload |
| Food Prices | BLS CPI | 2026 (Feb) | Using v1 API with severe rate limits (25 req/day, 3 series/req) |
| Food Banks | ProPublica/IRS 990 | 2023 | No quality ratings, limited program details |
| Nonprofit Directory | ProPublica | On-demand | No charity ratings or transparency scores |

## Free Services

### 1. BLS API v2 Key (Food Prices Dashboard)
- **Register**: https://data.bls.gov/registrationEngine/
- **Gain**: 500 req/day (vs 25), 50 series/req (vs 3), 20 years of data (vs 10)
- **Impact**: More food categories, deeper history, faster refresh
- **Effort**: ~30 min. Config slot exists at `public/api/_config.php` line 13-14

### 2. Charity Navigator GraphQL API (Nonprofit Dashboards)
- **Register**: https://developer.charitynavigator.org/
- **Gain**: Financial health scores (0-100), accountability/transparency ratings for ~200K charities
- **Impact**: Score gauges on nonprofit profiles, rating badges in directory
- **Effort**: ~1-2 days. New PHP proxy + JS integration

### 3. AHRQ SDOH Database (Food Insecurity + Food Access)
- **Download**: https://www.ahrq.gov/sdoh/data-analytics/sdoh-data.html
- **Gain**: Housing instability, transportation barriers, education, healthcare access at county level
- **Impact**: SDOH scatter plots on Food Insecurity, transportation overlay on Food Access
- **Effort**: ~2-3 days. Download CSV, preprocess to JSON, add charts

### 4. ESRI ArcGIS Nonprofit Program (Food Access)
- **Apply**: https://www.esri.com/en-us/industries/nonprofit/nonprofit-program
- **Gain**: Living Atlas food desert layers, 20K free geocodes/month
- **Impact**: Updated food desert data, distance calculations
- **Effort**: Large (~1-2 weeks). Apply first, defer implementation until pricing confirmed

### 5. Open Referral / HSDS (Community Resource Locator)
- **URL**: https://openreferral.org/
- **Gain**: Food pantry/meal program data from regional 211 systems
- **Impact**: "Find Food Help Near You" feature
- **Effort**: Medium-large. Research regional API availability first

### 6. Feeding America Data Partnership (Food Insecurity)
- **Contact**: research@feedingamerica.org
- **Gain**: Map the Meal Gap county-level food insecurity estimates (replaces modeled formula)
- **Impact**: Biggest data quality upgrade possible for Food Insecurity dashboard
- **Effort**: ~1-3 days once data received

### 7. Mapbox Free Tier (Geocoding & Maps)
- **Sign up**: https://www.mapbox.com/pricing
- **Gain**: 100K geocodes/month + 50K map loads/month
- **Impact**: Distance calculations, food bank location markers on Food Access
- **Effort**: ~2-3 days

## Remaining Gaps (Require Paid Services)

- County-level food insecurity stays modeled unless Feeding America partnership succeeds
- Food Access Atlas stays at 2019 unless ESRI provides Living Atlas access
- No DEI data, program descriptions, or grant history on nonprofit profiles (requires Candid ~$4.8K+/year)
- No real-time grocery prices (no free path; BLS CPI is sufficient)
