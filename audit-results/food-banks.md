# Food Bank Landscape Dashboard Audit

**Date**: 2026-04-07 (fresh re-audit)
**Scope**: All 6 audit categories
**Files**: `dashboards/food-banks.html`, `src/js/dashboards/food-banks.js`, `src/js/dashboards/shared/d3-heatmap.js`, `public/data/food-bank-summary.json`, `src/js/dashboards/__tests__/food-banks.test.js`, `src/js/dashboards/__tests__/d3-heatmap.test.js`

---

## Prior Audit Fix Verification

| Prior Finding | Status |
|---|---|
| P1-4: aria-label "colored by program efficiency" | FIXED — now "with continuous color gradient from low to high" |
| P1-14: Mississippi test uses non-existent `ms.foodInsecurePersons` | FIXED — derives from `population * foodInsecurityRate / 100` |
| P2-2: Breadcrumb not keyboard-accessible | FIXED — `tabindex="0"`, `role="button"`, `keydown` (Enter/Space) |
| P2-3: Radar max:18 clips Mississippi 18.7% | FIXED — now `max: 20` |
| P2-4: No feedback when regression line suppressed | FIXED — dynamic insight text: "No statistically meaningful correlation found" |

**All 5 prior findings confirmed resolved.**

---

## 1. Data Source Integrity

| Dataset | Source | Data Year | Updated | Status |
|---------|--------|-----------|---------|--------|
| food-bank-summary.json | ProPublica IRS 990 (NTEE K31) + Feeding America | 2023 IRS / 2024 FA | 2026-03-30 | OK |
| us-states-geo.json | US Census Bureau | Static GeoJSON | — | OK |

No live API calls — entirely static dashboard.

---

## 2. National vs. State Totals Cross-Check

| Metric | Sum of States | National | Variance | Status |
|--------|--------------|----------|----------|--------|
| Organization count | 51,218 | 61,284 | -16.4% | Documented in reconciliation note |
| Combined Revenue | $48.756B | $48.200B | +1.15% | WARNING — see F2 |
| Avg Efficiency | 83.5% (unweighted) | 82.4% (national) | -1.1pp | WARNING — see F1 |

---

## 3. Calculation Spot-Checks (all pass)

| Formula | Result | Status |
|---------|--------|--------|
| MS rev/person: 325M / round(2.961M × 18.7%) | $587 — matches HTML | OK |
| DC rev/person: 312M / 86,940 | $3,589 | OK |
| Regression r (density vs insecurity) | r = −0.0838, suppressed (|r| < 0.2) | Expected |
| Radar bounds vs actuals | Eff 86.8% < 90; FI 18.7% < 20; Density 17.8 < 40; AvgRev 0.92M < 1.5M | All clear |

---

## 4. Findings

### Warning

**F1: Radar national avg (83.5%) contradicts sidebar text and hero stat (82.4%)**
- **File**: `food-banks.js:259-266`, `food-banks.html:257`
- Radar National Avg benchmark computed as unweighted state mean (83.5%). Hero stat and sidebar use `national.avgEfficiencyRatio` = 82.4% (likely revenue-weighted). Two different "national average" values on same card.
- **Test**: Assert radar efficiency value equals `bankData.national.avgEfficiencyRatio`
- **Fix**: Use `bankData.national.avgEfficiencyRatio` in radar instead of recomputed mean
- **Effort**: XS

**F2: Revenue sum exceeds national aggregate — reconciliation note directionally inconsistent**
- **File**: `food-bank-summary.json` `national._reconciliationNote`
- State sum ($48.756B) > national ($48.2B). Note explains org count gap via multi-state orgs but doesn't address revenue exceeding national.
- **Fix**: Update reconciliation note
- **Effort**: XS

**F3: Freshness badge shows "Data: 2023" for mixed 2023/2024 dataset**
- **File**: `food-banks.js:416`
- Dashboard mixes 2023 IRS financials + 2024 Feeding America insecurity. Badge misrepresents insecurity data recency.
- **Fix**: Change `_dataYear` to `'2023/2024'`
- **Effort**: XS

### Minor

**F4**: Hero KPI counters hardcoded in HTML. `init()` never reads `bankData.national` to update. Will drift silently.
- **Effort**: M (need init() update + regression test)

**F5**: D3 SVG has no accessible name — screen readers navigate unlabeled `<rect>`/`<text>` elements inside `role="img"` container.
- **Fix**: Add `.attr('role', 'img').attr('aria-hidden', 'true')` to SVG
- **Effort**: XS

**F6**: D3 heatmap does not re-layout on resize; zero-size init silently skips render. ResizeObserver only updates `viewBox`. Small states unreadable at narrow widths.
- **Effort**: M (full re-layout on resize)

**F7**: `renderEfficiency` has no guard against `orgCount === 0` — produces `Infinity` in reduce callback.
- **Fix**: `st.orgCount > 0 ? st.totalRevenue / st.orgCount : 0`
- **Effort**: XS

**F8**: No ECharts `aria: { enabled: true }` on any of 5 chart `setOption` calls.
- **Effort**: S

**F9**: Breadcrumb hint text says "Click" despite keyboard support now present.
- **Fix**: "Click or press Enter on a region to zoom in"
- **Effort**: XS

### Info

**F10**: `markLine` attached to first series by array position, not by name. Stable in V8 but fragile if `REGION_COLORS` reordered.

**F11**: No test for breadcrumb keyboard accessibility (P2-2 regression risk). `tabindex`, `role="button"`, `keydown` handler untested.

**F12**: No test asserting regression suppression for current dataset (r = −0.084). Suppression behavior not covered.

**F13**: `insecurePersons` is float in `renderCapacityGap` but integer in `renderRevenue`. Tooltip shows "553.7K" vs "554K". Cosmetic.

---

## 5. Test Coverage

Existing tests (all passing):
- hexToRgba conversion
- Mississippi insight population formula
- Data year label mixed vintage
- JSON shape validation
- createRankNorm (5 cases including DC outlier)
- buildHeatmapLegend (5 cases)
- buildRegionChips (3 cases)
- HEATMAP_REGION_COLORS structure
- Module exports
- Hierarchy data contract

**Untested**: Breadcrumb keyboard (F11), regression suppression (F12), radar avg vs national (F1), hero stat vs JSON (F4), orgCount=0 guard (F7).

---

## 6. Summary

| Severity | Count | Key Findings |
|----------|-------|-------------|
| Warning | 3 | F1 (radar avg mismatch), F2 (revenue reconciliation), F3 (freshness badge) |
| Minor | 6 | F4–F9 |
| Info | 4 | F10–F13 |

**No critical findings.** All 5 prior issues confirmed fixed. Dashboard is in good shape. Remaining issues are minor data consistency (F1-F3) and accessibility gaps (F5, F8).
