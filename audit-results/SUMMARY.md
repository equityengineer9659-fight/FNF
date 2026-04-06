# Dashboard Audit — Prioritized Action Plan

**Date**: 2026-04-06
**Scope**: All 6 dashboards audited by parallel data-analytics-auditor agents

## Aggregate Findings

| Dashboard | Critical | Major/Warning | Info |
|-----------|----------|---------------|------|
| Executive Summary | 1 | 5 | 3 |
| Food Insecurity | 2 | 11 | 4 |
| Food Access | 2 | 6 | 5 |
| SNAP & Safety Net | 2 | 5 | 5 |
| Food Prices | 0 | 6 | 4 |
| Food Banks | 0 | 4 | 5 |
| **Total** | **7** | **37** | **26** |

---

## P0 — Critical (Fix Immediately)

| # | Dashboard | Issue | Effort | Files |
|---|-----------|-------|--------|-------|
| 1 | Exec Summary | Vulnerability index formula: `*30` instead of `*0.3` — meal cost dominates rankings | 30min | `executive-summary.js:18` |
| 2 | Exec Summary | National insecurity KPI permanently shows 12.8% (2022) — data is 13.7% (2024) | 15min | `executive-summary.html:171` |
| 3 | Food Insecurity | County search input missing combobox ARIA (WCAG 4.1.2) | 30min | `food-insecurity.html:197` |
| 4 | Food Insecurity | Map aria-label never updates on drill-down (WCAG 1.3.1) | 1hr | `food-insecurity.html:226`, `food-insecurity.js:164` |
| 5 | Food Access | Duplicate click listener — two drill-down handlers race on state click | 30min | `food-access.js:215,1432-1441` |
| 6 | SNAP | Wyoming coverage ratio shows 40.6% — actual is 46.9% | 15min | `snap-safety-net.js:117`, `snap-safety-net.html:251` |
| 7 | SNAP | Reconciliation note says "39.1M / 7%" — actual is 41.58M / 1.3% | 10min | `snap-participation.json:12` |

---

## P1 — Major (Fix in Next Sprint)

| # | Dashboard | Issue | Effort | Files |
|---|-----------|-------|--------|-------|
| 8 | Exec Summary | BLS YoY null-shift: index lookback misaligns after null filtering | 1hr | `executive-summary.js:213-216` |
| 9 | Exec Summary | Dead fetch of `food-bank-summary.json` | 10min | `executive-summary.js:364-373` |
| 10 | Exec Summary | Three "Data Year: 2022" labels on 2024 data | 10min | `executive-summary.html:208,234,283` |
| 11 | Exec Summary | SNAP coverage KPI formula contradicts label/tooltip | 30min | `executive-summary.js:380-383` |
| 12 | Food Insecurity | Hardcoded Mississippi insight string | 15min | `food-insecurity.js:90` |
| 13 | Food Insecurity | SNAP legend says FY2023, data is 2024 | 5min | `food-insecurity.js:824` |
| 14 | Food Insecurity | County GeoJSON dataSource contradicts methodology | 2hr | `counties/*.json` |
| 15 | Food Insecurity | Income river chart fixed 450px height | 20min | `food-insecurity.html:382` |
| 16 | Food Insecurity | 6 insight callouts missing `aria-live="polite"` | 30min | `food-insecurity.html` |
| 17 | Food Insecurity | Back button focus not managed after drill-down | 30min | `food-insecurity.js:168-169` |
| 18 | Food Insecurity | drillDown filter drops counties with rate=0 | 5min | `food-insecurity.js:152` |
| 19 | Food Insecurity | County tooltip shows state-avg meal cost as county-specific | 5min | `food-insecurity.js:74` |
| 20 | Food Access | Hero stats hardcoded, will diverge from JSON | 1hr | `food-access.html:157-172` |
| 21 | Food Access | renderVehicle comment/name stale | 15min | `food-access.js:360-362` |
| 22 | Food Access | Map aria-label static across 3 views | 20min | `food-access.html:193` |
| 23 | SNAP | Benefit gauge max $300 clips Hawaii $312 | 10min | `snap-safety-net.js:482` |
| 24 | SNAP | 5-gauge grid broken on mobile | 30min | `snap-safety-net.html:363`, `11-dashboards.css` |
| 25 | SNAP | HTML data notice says "FY2022", data is 2024 | 5min | `snap-safety-net.html:158` |
| 26 | SNAP | PPI uses static $188, ignores benefitTimeline | 2hr | `snap-safety-net.js:48-49` |
| 27 | SNAP | Demographic Sankey flat 84% coverage all races | 2hr | `snap-safety-net.js:615` |
| 28 | Food Prices | Regional chart "Jan 2020" label, data starts 2018 | 20min | `food-prices.js:91,111`, `dashboard-bls.php:198` |
| 29 | Food Prices | Hero meal cost $3.99 vs actual $3.58 | 15min | `food-prices.html:176-177` |
| 30 | Food Prices | Hero lowest-quintile 31.2% vs actual 32.6% | 5min | `food-prices.html:183-185` |
| 31 | Food Prices | Affordability map min:45 clips Utah 42.8 | 5min | `food-prices.js:183-185` |
| 32 | Food Prices | SNAP purchasing power baseline contradicts narrative | 1hr | `food-prices.js:684-692` |
| 33 | Food Banks | Radar area fill hex-to-rgba no-op — solid opaque | 30min | `food-banks.js:266` |
| 34 | Food Banks | Mississippi insight $593 vs computed $587 | 5min | `food-banks.html:304` |
| 35 | Food Banks | Data year label mixes 2023 IRS + 2024 Feeding America | 10min | `food-banks.html:145` |

---

## P2 — Minor/Info (Backlog)

| # | Dashboard | Issue | Effort |
|---|-----------|-------|--------|
| 36 | Exec Summary | SNAP KPI fallback 95.4% vs computed 87.9% | 5min |
| 37 | Exec Summary | Vulnerability click insight uses unweighted state mean | 15min |
| 38 | Food Insecurity | Resize handler unbounded (no debounce) | 10min |
| 39 | Food Insecurity | Radar axis labels overlap on narrow viewports | 15min |
| 40 | Food Access | `f.properties.GEOID` dead code branch | 5min |
| 41 | Food Access | `info-current-access-mode` panel ID absent | 5min |
| 42 | Food Access | Distance chart x-axis 8px labels unreadable on mobile | 15min |
| 43 | SNAP | Sankey data 2022 vintage needs disclosure note | 15min |
| 44 | SNAP | `benefitTimeline` data never used | 10min |
| 45 | Food Prices | YoY null-hole fragility for multi-month gaps | 30min |
| 46 | Food Prices | FRED overlay baseline misaligned | 20min |
| 47 | Food Prices | Regional tooltip baseMealCost inconsistent | 10min |
| 48 | Food Banks | Map visualMap min:11 near Nevada clipping | 5min |
| 49 | Food Banks | Capacity-gap bubble radius too compressed | 15min |

---

## Estimated Total Effort

| Priority | Hours |
|----------|-------|
| P0 Critical | ~3.5 |
| P1 Major | ~13 |
| P2 Minor | ~3.5 |
| **Grand Total** | **~20** |
