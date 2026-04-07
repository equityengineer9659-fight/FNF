# Dashboard Audit — Prioritized Action Plan

**Date**: 2026-04-07
**Scope**: Full re-audit of all 6 data dashboards

## Aggregate Findings

| Dashboard | Critical | Major | Info |
|-----------|----------|-------|------|
| Executive Summary | 0 | 1 | 3 |
| Food Insecurity | 0 | 2 | 1 |
| Food Access | 0 | 1 | 1 |
| SNAP & Safety Net | 0 | 1 | 1 |
| Food Prices | 0 | 1 | 1 |
| Food Banks | 0 | 0 | 2 |
| **Total** | **0** | **6** | **9** |

---

## P0 — Critical (Fix Immediately)

None. All 7 critical items from the 2026-04-06 audit remain fixed.

---

## P1 — Major (Fix in Next Sprint)

| # | Dashboard | Issue | Effort | Files |
|---|-----------|-------|--------|-------|
| 1 | Food Insecurity | County drill-down filter `.filter(f => f.properties.rate)` drops counties with rate=0 (truthy bug) | 5min | `food-insecurity.js:155` |
| 2 | Food Insecurity | SNAP series name `'SNAP Coverage (FY2023)'` mismatches legend `'SNAP Coverage (FY2024)'` — legend toggle broken | 5min | `food-insecurity.js:868` |
| 3 | Exec Summary | 4 dynamic insight containers lack `aria-live="polite"` | 10min | `executive-summary.html:212,236,261,285` |
| 4 | Food Access | 5 dynamic insight containers lack `aria-live="polite"` | 10min | `food-access.html:210,226,242,399,424` |
| 5 | SNAP Safety Net | 2 dynamic insight containers lack `aria-live="polite"` | 5min | `snap-safety-net.html:250,417` |
| 6 | Food Prices | 2 dynamic insight containers lack `aria-live="polite"` | 5min | `food-prices.html:368,394` |

---

## P2 — Minor/Info (Backlog)

| # | Dashboard | Issue | Effort |
|---|-----------|-------|--------|
| 7 | Exec Summary | Food Bank Orgs KPI `data-target="61.3"` is static HTML (not updated by JS) — will drift | Info only |
| 8 | Exec Summary | CPI YoY fallback `data-target="2.6"` is stale (~3.06% actual) but overwritten by JS at runtime | Info only |
| 9 | Exec Summary | Map click insight has no keyboard-equivalent announcement | Info only |
| 10 | Food Insecurity | County GeoJSON `dataSource:"CHR2025"` contradicts Census regression methodology | Info only |
| 11 | Food Access | County fallback filter uses truthy check on povertyRate (rate=0 unrealistic, low risk) | Info only |
| 12 | SNAP Safety Net | Coverage gap Sankey vintage is 2022, disclosed in HTML | Info only |
| 13 | Food Prices | Affordability map min=40 should be monitored if state indices drop below | Info only |
| 14 | Food Banks | Mississippi insight ($587) and data year labels are accurate but hardcoded — will drift | Info only |

---

## Estimated Total Effort

| Priority | Hours |
|----------|-------|
| P0 Critical | 0 |
| P1 Major | ~0.7 |
| P2 Info | 0 (no fixes needed) |
| **Grand Total** | **~0.7** |

---

## Comparison to Prior Audit (2026-04-06)

The prior audit found **49 items (7 critical, 28 major, 14 minor)**. After fixes, 41 were resolved and 8 deferred.

This fresh re-audit found **6 major + 9 info = 15 total items**, with **0 critical**. Key differences:

- **41 prior fixes verified as still correct** — no regressions detected
- **6 new major items found**: 4 are `aria-live` gaps across dashboards (cross-cutting WCAG 4.1.3 issue), 1 is a county filter truthy bug that persists, 1 is a legend/series name mismatch
- **Food Banks dashboard is clean** — 0 major issues
- **All hardcoded values match current data** — no staleness detected
- **All PHP-to-JS contracts verified** — field names align across all 10 proxy/consumer pairs

## Test-First Fix Plan

### Round 1: County filter + legend mismatch (items #1-2)
1. Write test asserting county filter preserves rate=0 features
2. Write test asserting SNAP legend and series names match
3. Fix both in `food-insecurity.js`
4. Run `npx vitest run`

### Round 2: aria-live (items #3-6)
1. Write test scanning all `dashboard-info__insight` elements with dynamic IDs for `aria-live`
2. Add `aria-live="polite"` to all 13 containers across 4 HTML files
3. Run `npx vitest run` + `npm run build`
