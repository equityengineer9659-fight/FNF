# Executive Summary Dashboard Audit

**Date**: 2026-04-06
**Scope**: `dashboards/executive-summary.html` + `src/js/dashboards/executive-summary.js` + all 5 data files

## Data Sources & API Endpoints

| Source | Type | Status | Issues |
|--------|------|--------|--------|
| `food-insecurity-state.json` | Static JSON | File exists | Data year 2024, not 2022 as labeled in HTML |
| `snap-participation.json` | Static JSON | File exists | `national.year` is 2025; `stateCoverage.year` is 2024 |
| `bls-food-cpi.json` | Static JSON (BLS cache) | File exists | Null value at 2025-10 breaks YoY lookback offset |
| `food-bank-summary.json` | Static JSON | Fetched but discarded | Parsed data thrown away; 61.3K KPI is hardcoded |
| `us-states-geo.json` | Static GeoJSON | File exists | No issues |

## Hardcoded/Stale Data

- **National insecurity rate KPI** (`html:171`, `data-target="12.8"`): Hardcoded to 12.8% (2022). JSON `national.foodInsecurityRate` is 13.7% (2024). No JS ever updates this counter.
- **SNAP Coverage Rate KPI fallback** (`html:175`, `data-target="95.4"`): Fallback is 95.4%. JS computes 87.9%.
- **"Data Year: 2022" labels** (`html:208,234,283`): Three instances. Data is 2024.
- **Methodology "Data Currency"** (`html:389`): States "2022." Data year is 2024.
- **Food Bank Orgs KPI** (`html:179`, `data-target="61.3"`): Hardcoded, not read from JSON.
- **Dead fetch** (`js:364-373`): `food-bank-summary.json` fetched, parsed, then discarded.

## Calculation Errors

### Critical: Vulnerability Index Formula Mismatch
- **Code** (`js:18`): `(s.rate * 0.4) + (s.povertyRate * 0.3) + ((s.mealCost / maxMealCost) * 30)`
- **Documented** (`html:209`): `(Insecurity x 0.4) + (Poverty x 0.3) + (Meal Cost x 0.3)`
- Meal cost term yields 18-30 points vs 4-8 for insecurity/poverty. Rankings are materially distorted.

### Major: BLS YoY Null-Shift Bug
- `bls-food-cpi.json` has `value: null` for 2025-10. Filtering nulls produces 98 elements. `slice(12)` with index `i` lookback misaligns by 1 month for the 4 most recent months.

### Major: SNAP Coverage KPI Comment Contradicts Code
- Comment says `SNAP / (SNAP + gap)`. Code does `totalSnap / totalInsecure`. These are different metrics.

## Accessibility Issues

| Severity | Issue | Location |
|----------|-------|----------|
| Major | `aria-current="page"` on wrong nav link | `html:115-116` |
| Major | Dynamic insight containers lack `aria-live` | `html:212,236,264,285` |
| Minor | SNAP gap insight uses `innerHTML` with inline style | `js:200` |
| Minor | Chart `role="img"` `aria-label` is static | `html:197,226,250,275` |

## Mobile/Responsive Issues

| Severity | Issue | Location |
|----------|-------|----------|
| Minor | No chart-specific min-heights for small screens | `js:25-82` |
| Minor | SNAP gap chart x-axis labels rotated 45deg may overlap | `js:162` |

## Summary
- Critical: 1 (vulnerability index formula)
- Major: 5 (insecurity KPI wrong, BLS YoY bug, SNAP KPI contradicts label, aria-current wrong, dead fetch)
- Minor: 7
