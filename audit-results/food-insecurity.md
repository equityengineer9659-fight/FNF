# Food Insecurity Dashboard Audit

**Date**: 2026-04-06
**Scope**: 12 charts, 5 data files, 5 PHP proxies

## Data Sources & API Endpoints

| Source | Type | Status | Issues |
|--------|------|--------|--------|
| `food-insecurity-state.json` | Static JSON | Current (2024 data) | Persons sum variance -12.8% vs national (documented) |
| `current-food-access.json` | Static JSON | Current | Field shape matches JS |
| `food-bank-summary.json` | Static JSON | Slightly stale (2026-03-30) | Revenue reconciles within 1.2% |
| `bls-food-cpi.json` | Static JSON | Current | Oct 2025 null handled correctly |
| `county-index.json` | Static JSON | Present | No freshness metadata |
| `counties/{fips}.json` (51 files) | GeoJSON | All present | `dataSource:"CHR2025"` contradicts methodology |
| `dashboard-bls.php` | PHP Proxy | Healthy | Series IDs correct, M13 filtered |
| `dashboard-census.php` | PHP Proxy | Healthy | ACS 2023, 24hr cache |
| `dashboard-saipe.php` | PHP Proxy | Healthy | SAIPE 2023, resilient parsing |
| `dashboard-sdoh.php` | PHP Proxy | Healthy | ACS 2023, 24hr cache |
| `dashboard-places.php` | PHP Proxy | Present | Optional enhancement |

## Hardcoded/Stale Data

- **Mississippi insight** (`js:90`): Hardcoded "Mississippi leads the nation at 18.7%" regardless of data
- **SNAP legend year** (`js:824`): Says "FY2023" but data is 2024
- **County GeoJSON `dataSource:"CHR2025"`** contradicts Census regression methodology described in code and HTML

## Accessibility Issues

| Severity | Issue | Location |
|----------|-------|----------|
| Critical | Map `aria-label` never updates on county drill-down (WCAG 1.3.1) | `html:226`, `js:164` |
| Critical | County search input missing `role="combobox"`, `aria-expanded`, `aria-autocomplete`, `aria-controls` (WCAG 4.1.2) | `html:197` |
| Major | 6 insight callouts missing `aria-live="polite"` | `js:89,219,714,1073,1249,1347,1438` |
| Major | Back button focus not managed after drill-down | `js:168-169` |
| Major | SDOH section visible briefly before buttons injected | `html:345` |
| Major | Scatter "Child Poverty" empty state no aria-live announcement | `js:640-645` |

## Mobile/Responsive Issues

| Severity | Issue | Location |
|----------|-------|----------|
| Major | Income river chart fixed 450px height — unreadable on mobile | `html:382` |
| Major | Radar axis labels overlap on narrow viewports | `js:590-601` |
| Major | Resize handler unbounded (no debounce) — 12 charts | `js:1593` |

## Data Integrity Issues

| Severity | Issue | Location |
|----------|-------|----------|
| Major | `drillDown` filter `.filter(f => f.properties.rate)` drops counties with rate=0 | `js:152` |
| Major | County tooltip shows state-average meal cost as county-specific | `js:74` |

## Summary
- Critical: 2
- Major: 11
- Info: 4
