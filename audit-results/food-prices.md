# Food Prices & Affordability Dashboard Audit

**Date**: 2026-04-06
**Scope**: 8 charts, 2 PHP proxies, 4 data files, cross-dataset join with food-insecurity-state.json

## Data Sources & API Endpoints

| Source | Type | Status | Issues |
|--------|------|--------|--------|
| `bls-food-cpi.json` | Static JSON (BLS cache) | Current (2026-03-31) | — |
| `bls-regional-cpi.json` | Static JSON | Current (2026-04-06) | — |
| `snap-participation.json` | Static JSON | Current | — |
| `food-insecurity-state.json` | Static JSON | Current (2024) | — |
| `dashboard-bls.php` | PHP Proxy, 7-day cache | Healthy | CUUR* series IDs correct |
| `dashboard-fred.php` | PHP Proxy, 7-day cache | Healthy | APU* series IDs correct |

### API Series ID Verification

| Endpoint | Series IDs | Format | Status |
|----------|------------|--------|--------|
| `dashboard-bls.php` (default) | CUUR0000SAF1, CUUR0000SEFV, CUUR0000SA0 | CUUR* (BLS CPI) | Correct |
| `dashboard-bls.php?type=regional` | CUUR0000SAF111-116, regional SAF1 | CUUR* | Correct |
| `dashboard-fred.php?type=cpi-item` | APU0000708111, APU0000702111, APU0000703112, APU0000709112 | APU* (via FRED) | Correct |

## Hardcoded/Stale Data

### Warning

**W1: Regional chart legend label "Jan 2020" — data starts Jan 2018**
- File: `food-prices.js:91,111` and `dashboard-bls.php:198`
- Legend and PHP `meta.startYear` both say 2020. Data starts 2018.

**W2: Hero stat "Avg Meal Cost" shows $3.99 — current data is $3.58**
- File: `food-prices.html:176-177`
- 10.3% discrepancy. Also in Chart 4 panel text.

**W3: Hero stat "Income on Food (Lowest 20%)" shows 31.2% — data is 32.6%**
- File: `food-prices.html:183-185`
- 1.4pp understatement.

**W4: Affordability map `min:45` clips Utah at 42.8**
- File: `food-prices.js:183-185`

**W5: SNAP purchasing power baseline contradicts panel narrative**
- File: `food-prices.js:684-692`, `food-prices.html:387-389`
- Jan 2018 baseline shows SNAP outperforming food prices. Narrative says purchasing power is eroding.

**W6: Regional tooltip `baseMealCost` hardcoded to 3.58 while hero shows 3.99**
- File: `food-prices.js:82-84`
- Internal inconsistency between hero stat and tooltip calculation.

## Accessibility Issues

No critical accessibility issues found specific to this dashboard.

## Mobile/Responsive Issues

No critical mobile issues found. Charts use responsive resize handler correctly.

## Info

- I1: YoY null-hole fragility — single Oct 2025 gap handled, but multi-month gap would misalign (`js:391`)
- I2: `updateFreshness` transitions from static to live correctly
- I3: Chart 8 CPI vs FI correctly excludes projected years
- I4: FRED overlay baselines not aligned with main chart's Jan 2018 reference (`js:510-514`)

## Summary
- Critical: 0
- Warning: 6
- Info: 4
