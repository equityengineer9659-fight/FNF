# Food Access & Deserts Dashboard Audit

**Date**: 2026-04-07
**Scope**: 9+ charts, 4 data files, 2 PHP proxies

## Data Sources & API Endpoints
| Source | Type | Status | Issues |
|--------|------|--------|--------|
| `current-food-access.json` | Static JSON | Current (computed 2026-04-06) | 84,414 tracts, 259K retailers |
| `snap-retailers.json` | Static JSON | Present | Schema matches JS expectations |
| `food-insecurity-state.json` | Static JSON | Current (2024) | None |
| `us-states-geo.json` | GeoJSON | Present | 51 features, correct schema |
| `dashboard-sdoh.php` | PHP Proxy | Healthy | Emits `{ states: [...] }` — field names match JS |
| `dashboard-places.php` | PHP Proxy | Healthy | Emits `{ records: [...] }` — field names match JS |

## Hardcoded/Stale Data

None found. All hero stats match JSON national values:
- 137.5M affected population = JSON `national.lowAccessPopulation` (137,524,470)
- 34,638 tracts = JSON `national.lowAccessTracts` (34,638)
- 2.1 mi avg distance = JSON `national.avgDistance` (2.12)
- 41% urban = JSON `national.lowAccessPct` (41)

## Calculation Errors

None found.

## API Contract Verification
| JS fetch URL | PHP file | Response shape match? | Issues |
|--------------|----------|----------------------|--------|
| `/api/dashboard-sdoh.php` | `dashboard-sdoh.php` | Yes | JS expects `data.states[]` — PHP emits matching fields |
| `/api/dashboard-places.php?type=food-insecurity` | `dashboard-places.php` | Yes | JS expects `data.records[]` — PHP emits matching fields |

## Accessibility Issues
| Severity | Issue | WCAG | Location |
|----------|-------|------|----------|
| Major | 5 dynamically populated insight containers lack `aria-live="polite"`: `insecurity-map-insight` (HTML:210), `low-access-insight` (HTML:226), `snap-retailers-insight` (HTML:242), `sdoh-access-insight` (HTML:399), `access-insecurity-insight` (HTML:424) | 4.1.3 Status Messages | HTML |

## Mobile/Responsive Issues
| Severity | Issue | Location |
|----------|-------|----------|
| None found | — | — |

## Data Integrity Issues
| Severity | Issue | Location |
|----------|-------|----------|
| Info | County fallback filter `.filter(f => f.properties.povertyRate)` (JS:154) uses truthy check. PovertyRate=0 is unrealistic for US counties, so low practical risk. Primary path uses `.filter(Boolean)` which is correct. | JS:154 |

## Previously Fixed Items (Verified)
- Duplicate click listener: `chart.off('click')` before `chart.on('click')` (JS:214)
- GEOID dead code: No references found
- `info-current-access-mode` panel ID: Not in HTML (removed)
- ALASKA_CAP: Documented, tooltip shows raw value with cap note (JS:317-327)

## Summary
- Critical: 0 | Major: 1 | Info: 1
