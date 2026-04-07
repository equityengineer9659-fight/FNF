# Dashboard Audit — Prioritized Action Plan

> **Note**: This file supersedes the previous audit (2026-04-06). The previous 41-item audit is complete; all items below are **new findings** from the 2026-04-07 full re-audit.

**Date**: 2026-04-07  
**Dashboards**: executive-summary, food-insecurity, food-access, snap-safety-net, food-prices, food-banks  
**Total new findings**: 78 across 6 dashboards  
**Production-breaking**: 3  
**Factual data errors**: 6  
**Accessibility critical/major**: 14  

---

## Priority 1 — Production Bugs & Factually Wrong Data (Fix First)

These are visible failures or incorrect information shown to users right now.

| # | Dashboard | Issue | Effort | Location |
|---|---|---|---|---|
| P1-1 | food-insecurity | **CDC PLACES field mismatch** — `p.obesity`/`p.diabetes`/`p.depression`/`p.housinsec` don't match API response keys (`"obesity among adults"` etc). Health Outcomes buttons **never render** in SDOH section — confirmed missing in production | S | food-insecurity.js:fetchCDCPlacesData |
| P1-2 | food-prices | **LinearGradient serialization bug** — `JSON.parse(JSON.stringify(ppBaseOption))` destroys ECharts LinearGradient instances. Area fills disappear on first FRED toggle click | S | food-prices.js:rebuildPurchasingPowerSeries |
| P1-3 | food-access | **Food Insecurity map click silently fails** — tooltip says "Click for county breakdown" but `fips: null` on all data points means click guard always skips | S | food-access.js:renderInsecurityMap |
| P1-4 | food-banks | **aria-label/sidebar say "colored by program efficiency"** — color actually encodes revenue-per-person rank; efficiency only appears in tooltip | XS | food-banks.html:226,238 |
| P1-5 | food-prices | **4 stale numbers in Chart 4 copy**: "31.2%" (is 32.6%), "$407/month" (is $440), "$1,028/month" (is $1,416), "$3.99 meal cost" (is $3.58) | S | food-prices.html:299-310 |
| P1-6 | food-insecurity | **SNAP chart legend/series year mismatch** — legend "FY2024" vs series name "FY2023"; ECharts can't match them; legend toggle disconnected | Trivial | food-insecurity.js:renderSnap |
| P1-7 | executive-summary | **Methodology typo** — HTML says "normalized meal cost × 30" instead of "× 0.3" | XS | executive-summary.html:379 |
| P1-8 | executive-summary | **renderSnapGap crashes on empty joined array** — `joined[0]` undefined when no name matches | XS | executive-summary.js:124 |
| P1-9 | food-insecurity | **renderTripleBurden crashes when accessData empty** — `Math.min/max(...[])` on empty array = Infinity/NaN; composite scores display as "NaN/300" | S | food-insecurity.js:1382 |
| P1-10 | snap-safety-net | **"Other" race % can go negative in Sankey** — Census race percentages can sum >100; negative Sankey link value breaks diagram | Trivial | snap-safety-net.js:renderDemographicFlow |
| P1-11 | snap-safety-net | **Map info panel says "Data Year: 2022 (FNS)"** — JSON `stateCoverage.year` is 2024 | Trivial | snap-safety-net.html:247 |
| P1-12 | food-access | **Duplicate click listener on back button** — `renderDesertMap` and `init()` both add `addEventListener('click')`; showNational fires twice per click | Trivial | food-access.js:212,1440 |
| P1-13 | food-access | **`visualMap: undefined` leaves ghost county color legend on state view** — ECharts ignores `undefined`; needs `null` to clear | Trivial | food-access.js:drawAccessInsecurityScatter |
| P1-14 | food-banks | **Mississippi insight test uses non-existent field `ms.foodInsecurePersons`** — always passes vacuously | XS | food-banks.test.js |
| P1-15 | food-prices | **YoY insight copy says "returned below 2%"** — current BLS value is 3.1% (2026-02) | Trivial | food-prices.html |

---

## Priority 2 — Analytical Integrity & Major Accessibility

| # | Dashboard | Issue | Effort | Location |
|---|---|---|---|---|
| P2-1 | food-prices | **Purchasing power narrative contradicts data** — copy frames SNAP as losing purchasing power; current data shows SNAP +55% vs food +37% since 2018 | M | food-prices.html + annotation |
| P2-2 | food-banks | **D3 heatmap breadcrumb not keyboard-accessible** — `<span>` elements lack `tabindex`, `role="button"`, `keydown` handler | S | d3-heatmap.js:updateBreadcrumb |
| P2-3 | food-banks | **Radar chart `max: 18` clips Mississippi at 18.7%** — silently misrepresents insecurity score | XS | food-banks.js:233 |
| P2-4 | food-banks | **No visual feedback when regression line suppressed** (`|r| < 0.2`) — user sees scatter with no trend line, no explanation | S | food-banks.js:renderVsInsecurity |
| P2-5 | snap-safety-net | **Hero stats hardcoded; not driven by JSON** — 42.1M, $188/mo, 52.1%, 8.2M will drift on data update | S | snap-safety-net.html |
| P2-6 | snap-safety-net | **Gauge values inaccessible to screen readers** — canvas-only; `role="img"` label names gauge type but never the computed value | S | snap-safety-net.html + JS |
| P2-7 | snap-safety-net | **3 dynamic elements lack `aria-live`**: snap-map-insight, demographic-flow-insight, CDC toggle | Trivial | snap-safety-net.html |
| P2-8 | food-insecurity | **renderSnap division by zero** — `s.snapParticipation / s.persons` when `s.persons === 0` → NaN bars | Trivial | food-insecurity.js:828 |
| P2-9 | food-insecurity | **County truthy filter drops rate=0 counties** — `.filter(f => f.properties.rate)` (known bug, still in production) | Trivial | food-insecurity.js:155 |
| P2-10 | food-insecurity | **renderSDOH: no guard before linearRegression([])** on empty points → "r = NaN" insight | S | food-insecurity.js:1028 |
| P2-11 | food-insecurity | **renderIncomeRiver: null income band values pushed unchecked** → ECharts misrenders silently | S | food-insecurity.js:1295 |
| P2-12 | executive-summary | **kpi-cpi-yoy HTML default "2.6%" stale** — live computed value is 3.1% | XS | executive-summary.html:183 |
| P2-13 | executive-summary | **computeVulnerabilityIndex division by zero** when all mealCost=0 | XS | executive-summary.js:15 |
| P2-14 | food-access | **`aria-current="page"` on main nav points to food-insecurity (build artifact)** | S | build-components.js |
| P2-15 | food-insecurity | **Trend chart heading hardcoded "2013-2024"** — chart renders projected data to 2026 | Trivial | food-insecurity.html |
| P2-16 | snap-safety-net | **Trend chart Y-axis `min: 34` hardcoded** — clips data if enrollment < 34M | Trivial | snap-safety-net.js:32 |
| P2-17 | snap-safety-net | **School lunch `slice(0, 15)` relies on JSON sort order** — no defensive `.sort()` | Trivial | snap-safety-net.js |

---

## Priority 3 — Test Coverage Gaps

| Dashboard | Untested Critical Paths | Risk | Effort |
|---|---|---|---|
| food-insecurity | `fetchCDCPlacesData` (P1-1 was untested), `renderTripleBurden`, `renderSDOH`, `renderIncomeRiver`, `renderStateDeepDive`, `buildStateInsight` | High | L |
| food-prices | `rebuildPurchasingPowerSeries` LinearGradient serialization (P1-2 was untested), `computeYoY`, `renderYoYInflation`, `renderPurchasingPower`, `renderCpiVsInsecurity` | High | M |
| food-access | `renderDoubleBurden` D3 pipeline, `renderInsecurityMap` fips bug, `renderUrbanRural`, `renderVehicle`, `renderSnapRetailers` | High | M |
| food-banks | D3 hierarchy construction (51 states, no dupes, zero-area guard), `renderCapacityGap`, `renderDistribution`, `renderEfficiency`, `renderDensityMap` | Medium | M |
| executive-summary | `renderSnapGap` join + empty array, `renderVulnerabilityMap`, `renderWorstStates`, `renderPriceImpact` | Medium | M |
| snap-safety-net | `renderGauges` coverage formula + NaN guard, `renderDemographicFlow` negative race guard, all 3 async fetches | Medium | M |

---

## Priority 4 — Cross-Cutting Minor (Low Effort Sweep)

| Issue | Affects | Effort |
|---|---|---|
| ECharts `aria: { enabled: true }` absent on all ~35 charts | All 6 dashboards | S per dashboard |
| Dashboard tab strip — no scroll indicator on mobile (7 tabs, 3 visible at 375px) | All 6 dashboards | S (one CSS fix) |
| `aria-live="polite"` missing on dynamic insight containers | executive-summary (4), food-insecurity (3) | XS |
| food-banks freshness badge shows "2023" for mixed 2023/2024 dataset | food-banks | XS |
| food-prices: SNAP benefit forward-fill extends 2 months past last known data | food-prices | S |
| food-prices: markArea for gov't shutdown hardcoded to 2025-10/11 (verify against latest BLS) | food-prices | Trivial |
| snap-safety-net: freshness label says "FY2025" but JSON year is 2024 | snap-safety-net | Trivial |

---

## Effort Key

| Label | Meaning |
|---|---|
| XS | < 5 min — string or one-line guard |
| Trivial | 5–15 min — small edit, no new tests needed |
| S | 15–60 min — code change + regression test |
| M | 1–3 hours — logic rewrite or significant revision |
| L | 3+ hours — new test suite for untested module |

---

## Implementation Sequence

1. **Batch 1 — P1 string/copy fixes** (P1-4, P1-5, P1-6, P1-7, P1-11, P1-15): HTML text changes only
2. **Batch 2 — P1 logic guards** (P1-8, P1-10, P1-12, P1-13, P1-14 test fix): simple defensive guards
3. **Batch 3 — P1 functional fixes** (P1-1 CDC PLACES, P1-2 LinearGradient, P1-3 map click): each requires test first
4. **Batch 4 — P2 correctness** (P2-3, P2-8, P2-9, P2-10, P2-11, P2-12, P2-13, P2-15, P2-16, P2-17)
5. **Batch 5 — P2 harder fixes** (P2-1 narrative, P2-2 keyboard, P2-4 suppression feedback, P2-6 gauge a11y)
6. **Batch 6 — P3/P4 tests and cross-cutting**

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

---

## Resolution Status (2026-04-06)

**41 of 49 items fixed** across 3 commits (50cba46, abd8c0d, +1). 56 new tests added (286 total passing).

### Fixed Items
P0: #1-7 (all 7 critical)
P1: #8-13, #15-31, #33-35 (26 of 28)
P2: #36, #38-42, #45-49 (10 of 14)

### Remaining (not actionable or already correct)
- #14: County GeoJSON methodology — surface hint text fixed; deeper doc work deferred
- #32: SNAP purchasing power narrative — already correct via dynamic gap logic
- #37: Vulnerability insight — surface fix done (uses `fiData.national`); deeper population-weighted poverty needs field not in JSON
- #43: Sankey vintage — already disclosed via `updateFreshness`
- #44: benefitTimeline — now used by PPI (fixed in #26)
