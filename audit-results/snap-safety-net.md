# SNAP & Safety Net Dashboard Audit

**Date**: 2026-04-07
**Scope**: 7 charts + 5 gauges, 2 data files, 3 PHP proxies

## Data Sources & API Endpoints
| Source | Type | Status | Issues |
|--------|------|--------|--------|
| `snap-participation.json` | Static JSON | Current (fetched 2026-04-05) | FY2025 national, 2024 state coverage |
| `us-states-geo.json` | GeoJSON | Present | 51 features, correct schema |
| `dashboard-bls.php` | PHP Proxy | Healthy | Optional CPI overlay, series format matches |
| `dashboard-places.php` | PHP Proxy | Healthy | Optional CDC SNAP self-report toggle |
| `dashboard-sdoh.php` | PHP Proxy | Healthy | Race/ethnicity data for demographic flow |

## Hardcoded/Stale Data

None found. All hero stats match JSON:
- 42.1M SNAP participants = JSON `national.snapParticipants` (42,126,585)
- $188 avg benefit = JSON `national.avgMonthlyBenefit` (188)
- 52.1% free lunch = JSON `national.freeLunchPct` (52.1)
- 8.2M coverage gap = JSON `national.coverageGap` (8,200,000)

## Calculation Errors

None found. SNAP coverage gauge correctly uses `participants / (participants + coverageGap)` (JS:506). PPI uses `benefitTimeline` via `getBenefitForDate()` (JS:51-58), not static $188 fallback.

## API Contract Verification
| JS fetch URL | PHP file | Response shape match? | Issues |
|--------------|----------|----------------------|--------|
| `/api/dashboard-bls.php` | `dashboard-bls.php` | Yes | JS expects `data.series[].data[].{date, value}` |
| `/api/dashboard-places.php?type=snap-receipt` | `dashboard-places.php` | Yes | JS expects `data.records[]` |
| `/api/dashboard-sdoh.php` | `dashboard-sdoh.php` | Yes | JS expects `data.states[].race` for demographic flow |

## Accessibility Issues
| Severity | Issue | WCAG | Location |
|----------|-------|------|----------|
| Major | 2 dynamically populated insight containers lack `aria-live="polite"`: `snap-map-insight` (HTML:250) and `demographic-flow-insight` (HTML:417) | 4.1.3 Status Messages | HTML |

## Mobile/Responsive Issues
| Severity | Issue | Location |
|----------|-------|----------|
| None found | Gauge grid and chart layouts render correctly at tested breakpoints | — |

## Data Integrity Issues
| Severity | Issue | Location |
|----------|-------|----------|
| None | Sankey data fully balanced: total inflows = 44.2M = total outflows across all 3 layers. All intermediate nodes balance (SNAP 23.5M, School Meals 3.5M, Food Banks 6.7M, No Assistance 10.5M). | `snap-participation.json:1250-1382` |
| Info | Coverage gap Sankey data vintage is 2022 — disclosed in HTML (line 279) | `snap-participation.json:1253` |

## Previously Fixed Items (Verified)
- Gauge benefit max: now 350 (JS:508), accommodates all state values
- Data notice year: says "2024" and "FY2025" correctly (HTML:158)
- PPI: uses benefitTimeline, not static $188
- Demographic Sankey: uses race-specific coverage rates (JS:642), not flat 84%
- Reconciliation note: accurately states ~1.3% variance (JSON:12)
- Wyoming: coverage data at 46.9% (30K/64K) — correct in JSON

## Summary
- Critical: 0 | Major: 1 | Info: 1
