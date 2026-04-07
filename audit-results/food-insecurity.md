# Food Insecurity Dashboard Audit

**Date**: 2026-04-07
**Scope**: 12 charts, 8 data files, 5 PHP proxies

## Data Sources & API Endpoints
| Source | Type | Status | Issues |
|--------|------|--------|--------|
| `food-insecurity-state.json` | Static JSON | Current (2024 data) | None |
| `current-food-access.json` | Static JSON | Current | Loaded as optional (fail-safe catch) |
| `food-bank-summary.json` | Static JSON | Current | Loaded as optional (fail-safe catch) |
| `county-index.json` | Static JSON | Present | No freshness metadata |
| `counties/{fips}.json` (51 files) | GeoJSON | All present | Uses `fips` key correctly (not GEOID) |
| `bls-food-cpi.json` | Static JSON | Current | Oct 2025 null handled |
| `dashboard-census.php` | PHP Proxy | Healthy | ACS 2023 5-year (latest available) |
| `dashboard-saipe.php` | PHP Proxy | Healthy | SAIPE 2023 |
| `dashboard-sdoh.php` | PHP Proxy | Healthy | ACS 2023, 24hr cache |
| `dashboard-places.php` | PHP Proxy | Present | Optional enhancement data |
| `dashboard-bls.php` | PHP Proxy | Healthy | Series IDs correct |

## Hardcoded/Stale Data

- **Major** (JS:868): SNAP series name is `'SNAP Coverage (FY2023)'` but legend `data` array (JS:836) says `'SNAP Coverage (FY2024)'`. ECharts links legend to series by name — mismatch means legend toggle won't work for this series. Fix: change series name to `'SNAP Coverage (FY2024)'`.

## Calculation Errors

None found. SNAP coverage ratio (JS:31), vulnerability insight (JS:91-92), and county metric diff (JS:227-231) all compute correctly.

## API Contract Verification
| JS fetch URL | PHP file | Response shape match? | Issues |
|--------------|----------|----------------------|--------|
| `/api/dashboard-sdoh.php` | `dashboard-sdoh.php` | Yes | JS expects `data.states[]` with `noVehiclePct`, `povertyRate`, etc. — PHP emits matching fields |
| `/api/dashboard-places.php` | `dashboard-places.php` | Yes | JS expects `data.records[]` — PHP emits `records` array |
| `/api/dashboard-bls.php` | `dashboard-bls.php` | Yes | JS expects `data.series[].data[].{date, value}` — matches |
| `/api/dashboard-census.php` | `dashboard-census.php` | Yes | JS expects `data.records[].{fips, name, rate, povertyRate, persons}` — PHP emits all fields |
| `/api/dashboard-saipe.php` | `dashboard-saipe.php` | Yes | JS expects same shape as census — PHP provides it |

## Accessibility Issues
| Severity | Issue | WCAG | Location |
|----------|-------|------|----------|
| None | All previously reported issues are fixed: combobox ARIA (HTML:197), `aria-live="polite"` on 6 insight containers, back button focus management (JS:287), map drill-down hint text | — | — |

## Mobile/Responsive Issues
| Severity | Issue | Location |
|----------|-------|----------|
| None | Income river height now responsive (`min-height:350px; height:50vh; max-height:600px`). Resize handler debounced at 150ms. | — |

## Data Integrity Issues
| Severity | Issue | Location |
|----------|-------|----------|
| Major | County drill-down filter `.filter(f => f.properties.rate)` (JS:155) drops counties with `rate=0` (falsy). Should use `!= null` check. | JS:155 |
| Info | County GeoJSON `dataSource: "CHR2025"` contradicts Census regression methodology in code. Cosmetic — doesn't affect rendering. | counties/*.json |

## Summary
- Critical: 0 | Major: 2 | Info: 1
