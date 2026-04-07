# Food Prices & Affordability Dashboard Audit

**Date**: 2026-04-07
**Scope**: 9 charts, 4 data files, 2 PHP proxies

## Data Sources & API Endpoints
| Source | Type | Status | Issues |
|--------|------|--------|--------|
| `bls-food-cpi.json` | Static JSON | Current (through 2026-02, fetched 2026-03-31) | Oct 2025 null handled |
| `bls-regional-cpi.json` | Static JSON | Present | Regional + category breakdown |
| `food-insecurity-state.json` | Static JSON | Current (2024) | CPI vs insecurity cross-join |
| `snap-participation.json` | Static JSON | Current | Purchasing power overlay |
| `dashboard-bls.php` | PHP Proxy | Healthy | Default + regional types, series format matches |
| `dashboard-fred.php` | PHP Proxy | Healthy | CPI item overlays, observations format matches |

## Hardcoded/Stale Data

- **Info**: `avgMealCost = 3.58` (JS:16) matches JSON `national.averageMealCost` (3.58). Currently in sync.
- All hero stats verified:
  - 28% food inflation 2020-2024: BLS CPI 261.057 → 333.566 = 27.78% ≈ 28%. MATCH.
  - $3.58 avg meal cost: JSON = 3.58. MATCH.
  - $5.12 most expensive state (Hawaii): JSON = 5.12. MATCH.
  - 32.6% income on food (lowest quintile): confirmed by prior test. MATCH.

## Calculation Errors

None found.

## API Contract Verification
| JS fetch URL | PHP file | Response shape match? | Issues |
|--------------|----------|----------------------|--------|
| `/api/dashboard-bls.php` | `dashboard-bls.php` | Yes | Default: `{ series: [{ name, data: [{ date, value }] }] }` |
| `/api/dashboard-bls.php?type=regional` | `dashboard-bls.php` | Yes | `{ categories: { series: [...] }, regions: { series: [...] } }` |
| `/api/dashboard-fred.php?type=cpi-item&series=...` | `dashboard-fred.php` | Yes | `{ observations: [{ date, value }] }` |

## Accessibility Issues
| Severity | Issue | WCAG | Location |
|----------|-------|------|----------|
| Major | 2 dynamically populated insight containers lack `aria-live="polite"`: `yoy-insight` (HTML:368) and `purchasing-power-insight` (HTML:394) | 4.1.3 Status Messages | HTML |

## Mobile/Responsive Issues
| Severity | Issue | Location |
|----------|-------|----------|
| None found | — | — |

## Data Integrity Issues
| Severity | Issue | Location |
|----------|-------|----------|
| Info | Affordability map `visualMap` min=40. Prior audit flagged Utah at 42.8 with min=45. Now min=40, so no clipping. Should be monitored if state indices drop further. | JS:189 |

## Previously Fixed Items (Verified)
- FRED CPI items: 4 APU series IDs valid (APU0000708111, APU0000702111, APU0000703112, APU0000709112)
- BLS series IDs: CUUR format in PHP, APU in FRED — correct
- Regional baseline label: data starts 2018, no hardcoded "Jan 2020"
- YoY null handling: date-keyed lookback correctly skips nulls

## Summary
- Critical: 0 | Major: 1 | Info: 1
