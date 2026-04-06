# Data Refresh Runbook

Step-by-step procedures for refreshing every data source in the Food-N-Force dashboard platform, organized by frequency.

> **Related docs:** [Data Source Inventory](data-source-inventory.md) (what each source is) | [Data Monitoring Strategy](data-monitoring-strategy.md) (when to trigger these procedures)

Last updated: 2026-04-06

---

## Monthly Procedures

### 1A. BLS Food CPI Data

**When:** ~3rd week of each month after BLS CPI release ([release schedule](https://www.bls.gov/schedule/news_release/cpi.htm))

**Affects:** `bls-regional-cpi.json` (static file) + `bls-food-cpi.json` (proxy-refreshed)

**Steps:**
1. Run the regional refresh script:
   ```bash
   node scripts/refresh-bls-regional.js
   ```
2. Verify `public/data/bls-regional-cpi.json`:
   - `fetchedAt` timestamp should be today
   - Last entry in `categories.series[0].data` should include the newly released month
3. The static `bls-food-cpi.json` is separately refreshed by the PHP proxy (`dashboard-bls.php`) on next visitor request after its 7-day cache expires. No manual action needed for this file unless you want to force a refresh.
4. To force `bls-food-cpi.json` refresh: delete `_cache/dashboard/bls-food-cpi.json` on the server, then visit the Food Prices dashboard.
5. Commit updated file(s) and deploy.

**Verification:** Load Food Prices dashboard. Check latest data point on the trend chart matches the BLS release.

**Rollback:** `git checkout public/data/bls-regional-cpi.json`

---

### 1B. SNAP National Participation Update

**When:** Monthly, when USDA FNS publishes updated [SNAP Data Tables](https://www.fns.usda.gov/pd/supplemental-nutrition-assistance-program-snap)

**Affects:** `snap-participation.json` (trend section)

**Steps:**
1. Check the FNS website for new monthly participation figures.
2. Edit `public/data/snap-participation.json`:
   - Add new data point to `trend.data` array: `{"month": "YYYY-MM", "participants": X.X}`
   - Update `fetchedAt` to today's ISO timestamp
3. If a significant policy event occurred, add to `trend.events` array.
4. Commit and deploy.

**Verification:** Load SNAP Safety Net dashboard. Trend chart should show the new month.

**Rollback:** `git checkout public/data/snap-participation.json`

**Note:** This is manual because FNS publishes data as PDFs/spreadsheets, not an API.

---

## Quarterly Procedures

### 2A. Food Access Recompute

**When:** January, April, July, October -- or when SNAP retailer locations change significantly.

**Affects:** `current-food-access.json`

**Prerequisites:** Internet access (downloads ~260K SNAP retailer records + ~85K Census tract centroids)

**Steps:**
1. Run the food access computation (2-5 minutes, do not interrupt):
   ```bash
   node scripts/compute-food-access.cjs
   ```
2. Run the vehicle access patch:
   ```bash
   node scripts/patch-novehicle.cjs
   ```
3. Verify `public/data/current-food-access.json`:
   - `meta.computed` timestamp should be today
   - `meta.retailerCount` should be ~260K (total) and `meta.qualifyingRetailerCount` ~40K
   - `meta.tractCount` should be ~84K
4. Commit and deploy.

**Verification:** Load Food Access dashboard. Desert map should render with updated low-access percentages.

**Rollback:** `git checkout public/data/current-food-access.json`

---

### 2B. SNAP Retailers Update

**When:** Quarterly, aligned with food access refresh.

**Affects:** `snap-retailers.json`

**Source:** [USDA FNS Retailer Management Year End Summary](https://www.fns.usda.gov/snap/retailer-management-year-end-summary)

**Steps:**
1. Download latest FNS retailer statistics.
2. Update state-level retailer counts in `public/data/snap-retailers.json`.
3. Update `meta.updated` to today's date.
4. Commit and deploy.

**Note:** This is separate from `compute-food-access.cjs` which downloads live retailer locations. `snap-retailers.json` is a curated aggregate by store type.

---

## Annual Procedures

### 3A. Food Insecurity State Data

**When:** Historically December (USDA ERS publication). **CRITICAL: USDA discontinued this report after 2024 (ERR-358).**

**Affects:** `food-insecurity-state.json` -- the core baseline dataset referenced by 5 dashboards.

**Contingency plan (post-discontinuation):**
- Monitor for USDA resuming the Household Food Security program
- Feeding America Map the Meal Gap continues to publish state estimates independently
- Columbia University may continue publishing projections
- If no official source emerges, clearly label existing data as "last official: 2024" in the meta

**Steps (when new data available):**
1. Update `national` object with new rates (insecurityRate, childRate, persons, etc.)
2. Append new year to `trend` array; set `projected: false` for actual data
3. Update `states` array with per-state rates from Feeding America
4. Update `meta.sources` and `meta.updated`
5. Verify `_reconciliationNote` still holds (state sum vs national total)
6. Commit and deploy.

**Verification:** Check Executive Summary vulnerability map and Food Insecurity trend chart.

---

### 3B. Food Bank Summary

**When:** Annually, when ProPublica updates IRS 990 data (12-18 month lag from tax year).

**Affects:** `food-bank-summary.json`

**Steps:**
1. Query ProPublica Nonprofit Explorer for NTEE K31 organizations.
2. Aggregate per-state: org count, total revenue, program expense ratio.
3. Update `public/data/food-bank-summary.json`:
   - Update `national` totals
   - Update `states` array
   - Update `fetchedAt`
   - Verify `_reconciliationNote` for state-vs-national gap
4. Commit and deploy.

**Verification:** Load Food Banks dashboard. Check density map and scatter plot.

---

### 3C. County Health Rankings Import

**When:** Annually after CHR publishes new rankings (typically March).

**Affects:** `counties/*.json` (overlays actual FI rates on modeled estimates)

**Prerequisites:** Download CHR analytic CSV from [countyhealthrankings.org](https://www.countyhealthrankings.org/health-data/methodology-and-sources/data-documentation)

**Steps:**
1. Download the CHR analytic data CSV.
2. Place it in a temp directory (e.g., `C:\tmp\chr_analytic_2026.csv`).
3. Run the import:
   ```bash
   node scripts/import-chr-data.cjs C:\tmp\chr_analytic_2026.csv
   ```
4. Check console output for number of counties updated.
5. Verify a sample county file (e.g., `public/data/counties/01.json`) -- features should have `dataSource: "CHR2026"`.
6. Commit and deploy.

**Rollback:** `git checkout public/data/counties/`

---

### 3D. Census ACS Year Update (Coordinated)

**When:** Annually after Census releases new ACS 5-year estimates (typically September for 1-year, December for 5-year).

**Affects:** 4 PHP proxy files + 1 refresh script. This is a coordinated change -- update all at once.

**Files to update (change year from `2023` to the new vintage):**
1. `public/api/dashboard-census.php` -- line ~58-60 (ACS URL year)
2. `public/api/dashboard-saipe.php` -- line ~82-84 (SAIPE `time=` parameter)
3. `public/api/dashboard-sdoh.php` -- lines ~115-116 (ACS URL year)
4. `scripts/refresh-bls-regional.js` -- Census ACS URL for median income

**Steps:**
1. Search-and-replace the year in all 4 files.
2. Clear cache for affected services on the server:
   ```bash
   rm _cache/dashboard/census-*.json _cache/dashboard/saipe-*.json _cache/dashboard/sdoh-*.json
   ```
3. Run `refresh-bls-regional.js` to regenerate state affordability with new income data.
4. Test all SDOH scatter plots and the poverty vs insecurity chart.
5. Commit and deploy.

**Verification:** Load Food Insecurity scatter plot -- data should reflect new ACS vintage.

---

### 3E. CDC PLACES Vintage Verification

**When:** Annually after CDC releases new PLACES data (~October).

**Affects:** `dashboard-places.php` (no code changes needed -- SODA API serves latest)

**Steps:**
1. Verify the new vintage is live by hitting the proxy: `GET /api/dashboard-places.php?type=food-insecurity`
2. Check the `year` field in the response.
3. If the response still shows the old year, verify at [data.cdc.gov](https://data.cdc.gov/resource/cwsq-ngmh.json).
4. Clear `_cache/dashboard/places-*.json` if stale cache is serving old data.

---

### 3F. SNAP Benefit Adjustment

**When:** October (annual COLA adjustment).

**Affects:** `snap-participation.json` (benefitTimeline section)

**Steps:**
1. Check USDA FNS for the new maximum SNAP benefit amount.
2. Add new entry to `benefitTimeline.data` array in `snap-participation.json`.
3. Update `benefitsPerPerson.year` if new state-level data is available.
4. Commit and deploy.

---

## Rare / One-Time Procedures

### 4A. GeoJSON Boundary Rebuild

**When:** After decennial census boundary changes or `us-atlas` npm package update.

**Steps:**
1. Update `us-atlas` if needed: `NODE_OPTIONS='--dns-result-order=ipv4first' npm update us-atlas`
2. Rebuild boundaries:
   ```bash
   node scripts/build-dashboard-data.js
   ```
3. Verify `public/data/us-states-geo.json` and sample county files render correctly.
4. Commit and deploy.

---

### 4B. API Key Rotation

**When:** If a key is compromised, or periodically for security hygiene.

**Location:** `public/api/_config.php` (gitignored)

| Key | Where to Obtain |
|---|---|
| BLS_API_KEY | [BLS Registration](https://data.bls.gov/registrationEngine/) |
| FRED_API_KEY | [FRED API Keys](https://fred.stlouisfed.org/docs/api/api_key.html) |
| MAPBOX_ACCESS_TOKEN | [Mapbox Account](https://account.mapbox.com/) |
| CHARITY_NAVIGATOR_API_KEY | Charity Navigator developer portal |

**Steps:**
1. Obtain new key from the provider.
2. SSH to SiteGround and update `public_html/api/_config.php`.
3. Clear all cache for the affected service.
4. Verify by hitting the proxy endpoint and confirming a successful upstream response.

---

## Cache Management

### Clear cache for a specific service

SSH to SiteGround and delete cached files:
```bash
cd public_html/_cache/dashboard/
rm bls-*.json          # BLS
rm census-*.json       # Census ACS
rm saipe-*.json        # Census SAIPE
rm sdoh-*.json         # Census SDOH
rm places-*.json       # CDC PLACES
rm fred-*.json         # FRED
rm nonprofit-*.json    # ProPublica
rm cn-*.json           # Charity Navigator
rm mapbox-*.json       # Mapbox
```

### Run cache cleanup

Removes all cache files older than 30 days:
```bash
# CLI (from server)
php public_html/api/cache-cleanup.php

# HTTP (with auth token)
curl "https://food-n-force.com/api/cache-cleanup.php?token=YOUR_CLEANUP_TOKEN"
```

### Check rate limit status

```bash
curl "https://food-n-force.com/api/rate-limit-status.php"
```

Returns current daily/monthly counters for all tracked services (BLS, SAIPE, CDC PLACES, FRED, Mapbox, Charity Navigator).
