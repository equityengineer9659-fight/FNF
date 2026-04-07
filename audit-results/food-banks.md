# Food Bank Landscape Dashboard Audit

**Date**: 2026-04-07
**Scope**: 6 charts, 2 data files, 0 PHP proxies

## Data Sources & API Endpoints
| Source | Type | Status | Issues |
|--------|------|--------|--------|
| `food-bank-summary.json` | Static JSON | Current (fetched 2026-03-30) | IRS 990 2023 + Feeding America 2024 |
| `us-states-geo.json` | GeoJSON | Present | 51 features, correct schema |

## Hardcoded/Stale Data

- **Info**: HTML insight "Mississippi has only $587 in food bank revenue per food-insecure person" (HTML:304). Computed: Mississippi totalRevenue=$325M / (population 2.961M * 18.7% insecurity) = $325M / 553,707 = $587. MATCH.
- **Info**: Data year disclosure: HTML shows "IRS 990 filings (2023 tax year)" and metadata references Feeding America 2024. Accurate mix documented.

## Calculation Errors

None found.

## API Contract Verification

N/A — this dashboard uses no PHP API proxies. Only static JSON files.

## Accessibility Issues
| Severity | Issue | WCAG | Location |
|----------|-------|------|----------|
| None | All insight containers are static (not dynamically populated by JS). No `aria-live` needed. | — | — |

## Mobile/Responsive Issues
| Severity | Issue | Location |
|----------|-------|----------|
| None found | — | — |

## Data Integrity Issues
| Severity | Issue | Location |
|----------|-------|----------|
| None | All data shapes match JS expectations. `national` and `states[]` have all required fields: `name`, `fips`, `orgCount`, `totalRevenue`, `programExpenseRatio`, `population`, `foodInsecurityRate`, `perCapitaOrgs`. | `food-bank-summary.json` |

## Previously Fixed Items (Verified)
- `hexToRgba`: correctly parses hex codes to rgba (JS:17-22)
- Map visualMap: dynamic min/max from data (JS:52) — no hardcoded bounds
- Regression suppression: `|r| >= 0.2` threshold correct (JS:89)
- Capacity gap bubble: range 6-35px using population scaling (JS:370)
- Reconciliation note: surfaced dynamically if present in JSON (JS:416-418)

## Summary
- Critical: 0 | Major: 0 | Info: 2
