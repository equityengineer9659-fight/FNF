# SNAP & Safety Net Dashboard Audit

**Date**: 2026-04-07 (fresh re-audit)
**Scope**: All 6 audit categories
**Files**: `dashboards/snap-safety-net.html`, `src/js/dashboards/snap-safety-net.js`, `public/data/snap-participation.json`, `src/js/dashboards/__tests__/snap-safety-net.test.js`

---

## Prior Audit Fix Verification

| Prior Finding | Status |
|---|---|
| P1-10: "Other" race % can go negative in Sankey | FIXED — `Math.max(0,...)` guard present |
| P1-11: Map info panel "Data Year: 2022" vs JSON 2024 | FIXED — HTML now says "2024 (FNS) / 2023 (CDC PLACES)" |
| P2-16: Trend Y-axis `min:34` hardcoded | FIXED — no explicit min, only `max: 48` |
| P2-17: School lunch `slice(0,15)` without sort | FIXED — `.sort((a, b) => b.pct - a.pct)` added before slice |

---

## 1. API and Data Validation

**Schema match**: All fields present in `snap-participation.json`: `national`, `trend`, `benefitTimeline`, `stateCoverage.states`, `schoolLunch.states`, `benefitsPerPerson.states`, `sankey`.

| Live API Endpoint | Issues |
|---|---|
| `dashboard-bls.php` | None |
| `dashboard-places.php?type=snap-receipt` | Only **40 of 51** states — 11 render gray with no explanation |
| `dashboard-sdoh.php` | None |

**Sankey construction**: Race population shares from Census ACS live. FI rates and SNAP coverage from hardcoded constants with citations. "Other" race uses `Math.max(0, 100 - hispanic - white - black - asian)`.

---

## 2. Hardcoded, Stale, or Fragile Data

**B-1 (Minor)**: Hero stats hardcoded in HTML (`data-target="42.1"`, `"188"`, `"52.1"`, `"8.2"`), JS never overwrites from JSON. Currently correct but will drift on data update.

**B-2 (Minor)**: `benefitsPerPerson` freshness label says `FY2025` but JSON year is `2024`. `food-banks.js:713`.

**B-3 (Minor)**: Trend chart `max: 48` hardcoded. Current max 46.5M; SNAP peaked 47.6M in 2013. Could clip above 48M.

**B-4 (Minor)**: Sankey freshness year `2022` hardcoded, not read from `sankey.year`.

---

## 3. Data Transformation and Chart Contract Review

### Gauge Formula Verification (all pass)

| Gauge | Formula | Computed | Max | Status |
|-------|---------|----------|-----|--------|
| SNAP Coverage | 42.1M / (42.1M + 8.2M) × 100 | 83.7% | 100 | OK |
| School Lunch | `national.freeLunchPct` | 52.1% | 100 | OK |
| Avg Benefit | `national.avgMonthlyBenefit` | $188 | 350 | OK (Hawaii $312 within) |
| Coverage Gap | `national.coverageGap / 1M` | 8.2M | 15 | OK |
| Monthly Shortfall | `3.58 × 3 × 30 - 188` | $134 | 200 | OK |

### Sankey Balance (passes)
- Left: Children (13M) + Seniors (5.5M) + Working Adults (25.7M) = 44.2M
- Right: Needs Met (15.5M) + Partially Met (16.0M) + Still in Crisis (12.7M) = 44.2M

### Coverage Ratio Spot-Check (all pass)
Wyoming: 30,000/64,000 = 46.9%. California: 5,120,000/4,540,000 = 112.8%. Oregon: 684,000/519,000 = 131.8%. All 51 states verified — zero discrepancies.

### State Sum vs National
41.582M vs 42.127M = -1.29% — within ±5%. Reconciliation note correctly states "~41.6M."

### PPI Calculation
Uses `benefitTimeline` (not static $188). `getBenefitForDate()` traverses timeline as step function. `|| 188` fallback only if timeline absent.

**T-1 (Minor)**: NaN risk on missing `avgMonthlyBenefit` — `food-prices.js:494` has no `?? 0` guard. Field currently populated.

**A-1 (Moderate)**: CDC toggle shows 11 states gray with no user explanation. No tooltip fallback, no legend note. Users may infer zero SNAP receipt.

---

## 4. Accessibility Audit

**C-1 (Major)**: All 5 gauge values inaccessible to screen readers. Each `<div>` has `role="img"` with static `aria-label` ("Gauge showing SNAP coverage ratio") but no dynamic numeric value. The 83.7%, 52.1%, $188, etc. exist only inside ECharts canvas.

**C-2 (Major)**: `snap-map-insight` updates on state click without `aria-live`. Screen reader users won't hear updated insight.

**C-3 (Major)**: `demographic-flow-insight` populated on API resolve without `aria-live`. No announcement.

**C-4 (Major)**: CDC toggle buttons appear (`display:none` → `display:''`) without screen reader notification. No `aria-live` region.

**C-5 (Moderate)**: Zero `aria-live` attributes in entire page — confirmed by grep. 4+ dynamic content regions with no live region infrastructure.

**C-6 (Minor)**: No ECharts `aria: { enabled: true }` on any chart instance.

**C-7 (Minor)**: Both Sankey charts lack data equivalents for screen readers. No `<table>` fallback.

**Heading hierarchy**: Valid (H1 → H2 → H3, no skips).
**Toggle buttons**: Correct `aria-pressed` state management.

---

## 5. Mobile and Responsive Audit

**M-1 (Minor)**: 5 KPI gauges produce 2-2-1 layout at 375px. 5th gauge alone at full width. Visually unbalanced.

**M-2 (Minor)**: Hero stat grid collapses to 1-column at 375px, pushing charts below fold.

**M-3 (Minor)**: Dashboard tab bar overflows at 375px with no scroll indicator (cross-dashboard issue).

**M-4 (Minor)**: Sankey node label overlap risk at 375px. `fontSize: 11` with no overflow handling.

---

## 6. Test Coverage and Remediation Plan

**Current tests**: 11 tests in `snap-safety-net.test.js` (all passing). Covers: insight text, reconciliation note, benefit gauge max, HTML data notice, JSON schema, benefitTimeline variation, PPI calculation.

| # | Finding | Severity | Test to Write | Fix Approach | Effort |
|---|---------|----------|---------------|--------------|--------|
| C-1 | Gauge values inaccessible | Major | Assert gauge div `aria-label` contains computed value after render | Update `aria-label` with computed value after each `setOption()` | S |
| C-2 | snap-map-insight no aria-live | Major | Assert HTML contains `aria-live` on element | Add `aria-live="polite"` to div | Trivial |
| C-3 | demographic-flow-insight no aria-live | Major | Assert HTML contains `aria-live` on element | Add `aria-live="polite"` to div | Trivial |
| C-4 | CDC toggle reveal no notification | Major | Assert toggle container wrapped in `aria-live` | Wrap in `aria-live="polite"` div | S |
| A-1 | 11 gray CDC states unexplained | Moderate | Assert tooltip fallback for missing CDC states | Add "No survey data" tooltip, legend note | S |
| T-1 | NaN on missing avgMonthlyBenefit | Minor | `renderGauges({...national, avgMonthlyBenefit: undefined})` no throw | Change to `(national.avgMonthlyBenefit ?? 0)` | Trivial |
| B-1 | Hero stats drift risk | Minor | Assert `data-target` matches JSON | Regression test; optionally override in `init()` | S |
| B-2 | Benefits freshness year mismatch | Minor | Assert freshness reads from JSON year field | Use `snapData.benefitsPerPerson.year` | Trivial |
| B-3 | Trend max:48 hardcoded | Minor | Sentinel: assert data max < 48 | Consider removing explicit max | S |
| B-4 | Sankey year hardcoded | Minor | Assert freshness reads from JSON | Use `snapData.sankey.year` | Trivial |
| C-6 | No ECharts aria config | Minor | Assert `aria.enabled` in setOption args | Add `aria: { enabled: true }` to all calls | S |

---

## Summary

| Severity | Count |
|----------|-------|
| Major | 4 (C-1 through C-4) |
| Moderate | 2 (A-1, C-5) |
| Minor | 9 (B-1 through B-4, C-6, C-7, M-1 through M-4, T-1) |

**Closed since last audit**: P1-10, P1-11, P2-16, P2-17 — 4 of 7 prior findings confirmed resolved.
**No critical findings.** Primary issues are accessibility (gauge values, aria-live) and minor data staleness risks.
