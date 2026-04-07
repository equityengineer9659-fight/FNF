# Food Access & Deserts Dashboard Audit

**Date**: 2026-04-06
**Scope**: `dashboards/food-access.html`, `src/js/dashboards/food-access.js`, all data files + PHP proxies

## Data Sources & API Endpoints

| Source | Type | Status | Issues |
|--------|------|--------|--------|
| `current-food-access.json` | Static JSON | Current (2026-04-06) | Hero stats hardcoded in HTML, won't auto-sync |
| `snap-retailers.json` | Static JSON | Current (2026-04-05) | Info panel copy hardcodes state names/rates |
| `food-insecurity-state.json` | Static JSON | Current (2024) | Used only for povertyRate merge |
| `us-states-geo.json` | Static GeoJSON | OK | No issues |
| `counties/*.json` (51 files) | Static GeoJSON | All present | Property key is `"fips"` not `"GEOID"` |
| `dashboard-places.php` | Live API | OK (24h cache) | Optional; fails silently |
| `dashboard-sdoh.php` | Live API | OK (24h cache) | ACS 2023 consistent |

## Hardcoded/Stale Data

- **Hero stats** (`html:157-172`): Four `data-target` values hardcoded, never synced from JSON
- **SNAP retailers info panel** (`html:235-236`): Static text naming specific states and rates
- **National avg distance** (`js:1417-1419`): Hardcoded "2.1 miles" vs JSON 2.12
- **`renderLowAccessMap` visualMap max:65** (`js:699`): Handset; Alabama at 60%
- **`renderSnapRetailers` visualMap min:58, max:125** (`js:641-642`): Handset
- **`renderVehicle` comment** (`js:360`): Claims `r ~ -0.65` negative correlation; chart now shows positive correlation

## Critical Issues

**C1 — Duplicate click listener race condition on `chart-desert-map`**
- `renderDesertMap()` registers click listener (`js:215`), then `init()` registers a second (`js:1432-1441`)
- Both fire on state click: `drillDown()` and `drillDownLowAccess()` race, causing double spinners

**C2 — `renderVehicle` comment claims negative correlation but chart shows positive**
- Comment at `js:360-362` written for old chart that plotted `noVehiclePct`
- Current chart plots `avgDistance` vs `lowAccessPct` (positive correlation)
- Function name `renderVehicle` also stale

## Warning Issues

- W1: `info-current-access-mode` panel ID referenced in JS but absent from HTML (`js:1303`)
- W2: Hero stat counters hardcoded, will diverge on JSON recompute (`html:157-172`)
- W3: SNAP retailers insight text is static HTML, not dynamically populated (`html:242-244`)
- W4: Map `aria-label` static across three different map views (`html:193`)
- W5: `renderLowAccessMap` visualMap max:65 will clip future data (`js:699`)
- W6: `povertyRate` merge uses truthy guard instead of null check (`js:1261`)

## Accessibility Issues

| Severity | Issue | Location |
|----------|-------|----------|
| Warning | Map toggle div has no `role="group"` or `aria-label` | `html:182` |
| Warning | Map `role="img"` `aria-label` static across 3 views | `html:193` |
| Info | Hint text changes on drill-down but no `aria-live` | `html:194` |
| Info | Back button appears without focus management | `html:191` |

## Mobile/Responsive Issues

| Severity | Issue | Location |
|----------|-------|----------|
| Warning | Distance chart x-axis 8px labels at 60-degree rotation | `js:334` |
| Info | Map chart height and toggle touch targets unverified | `html:182,193` |

## Info

- I1: `f.properties.GEOID` dead code — county GeoJSON uses `"fips"` exclusively (`js:136`)
- I2: `drillDownLowAccess` used before `const` declaration (works due to closure timing) (`js:1370`)
- I3: Distance chart x-axis 8px labels below minimum readable size on mobile (`js:334`)

## Summary
- Critical: 2
- Warning: 6
- Info: 5
