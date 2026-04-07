# Food Insecurity Dashboard Audit

**Date**: 2026-04-07 (fresh re-audit)
**Scope**: Food Insecurity Overview dashboard — all 6 audit categories
**Files reviewed**: `dashboards/food-insecurity.html`, `src/js/dashboards/food-insecurity.js`, `src/js/dashboards/shared/dashboard-utils.js`, `public/data/food-insecurity-state.json`, `public/data/food-bank-summary.json`, `public/data/current-food-access.json`, `public/data/bls-food-cpi.json`, `public/data/snap-participation.json`, `public/api/dashboard-places.php`, `public/api/dashboard-sdoh.php`, `src/js/dashboards/__tests__/food-insecurity.test.js`

---

## Prior Audit Fix Verification

| Prior Finding | Status |
|---|---|
| P1-1: CDC PLACES field mismatch (`p.obesity` vs `"obesity among adults"`) | PARTIAL FIX — PHP proxy now correctly uses `strtolower($row['measureid'])` as key. However a new merge bug exists: see C-1 below |
| P1-6: SNAP chart legend/series year mismatch FY2024 vs FY2023 | FIXED — both legend (line 836) and series (line 868) now read `"SNAP Coverage (FY2024)"` |
| P1-9: `renderTripleBurden` crashes on empty accessData | PARTIALLY MITIGATED — `accessData?.states` guard prevents crash, but `Math.min/max(...[])` on empty `accessVals` still produces `Infinity`/`-Infinity`. See H-1 |
| P2-8: `renderSnap` division by zero | FIXED — line 828 guards with `s.persons > 0 ? ... : 0` |
| P2-9: County filter drops `rate === 0` counties | FIXED — filter changed from truthy to `f.properties.rate != null` at line 155 |
| P2-10: `renderSDOH` no guard before `linearRegression([])` | FIXED — early return at line 1024 |
| P2-11: `renderIncomeRiver` null values | FIXED — line 1297 uses `s.income[band.key] ?? 0` |
| P2-15: Trend heading hardcoded "2013-2024" | FIXED — HTML now reads "National Trend (2013-2026)" |

---

## 1. Data Freshness

| Dataset | Source | Data Year | Last Updated | Status |
|---------|--------|-----------|--------------|--------|
| food-insecurity-state.json | USDA ERS ERR-358 + Feeding America | 2024 | 2026-04-04 | Current |
| food-bank-summary.json | ProPublica / IRS 990 | 2023 | 2026-03-30 | Current |
| current-food-access.json | USDA FNS + Census 2020/ACS 2023 | Computed | 2026-04-06 | Current |
| snap-participation.json | USDA FNS | 2025 | 2026-04-05 | Current |
| bls-food-cpi.json | BLS CPI | 2026-02 (latest data point) | 2026-03-31 | Current |

---

## 2. National vs. State Totals Cross-Check

| Metric | Sum of States | National Aggregate | Variance | Status |
|--------|-------------|-------------------|----------|--------|
| Food Insecure Persons | 41.8M | 47.9M | -12.8% | EXCEEDS 5% — documented in `_reconciliationNote` |
| SNAP Participants | 41.6M | 41.7M | -0.3% | PASS |
| Food Bank Organizations | 51,218 | 61,284 | -16.4% | EXCEEDS — documented in reconciliation note |
| Food Bank Revenue | $48.76B | $48.20B | +1.2% | PASS |

---

## 3. Calculation Spot-Checks

| Formula | Expected | Actual | Status |
|---------|----------|--------|--------|
| Linear regression r (poverty vs FI) | 0.85–0.93 | 0.9311 (51 states) | PASS |
| Meal cost baseline | $3.58 (current national avg) | `avgMealCost = 3.58` | PASS |
| SNAP coverage ratio range | 0–200% | 47%–132% | PASS |
| renderBar maxRate | 25% (safe above 18.7% actual) | `maxRate = 25` | PASS |

---

## 4. Hardcoded Visualization Bounds

| Chart | Bound | Current Data Max | Clipping Risk |
|-------|-------|-----------------|---------------|
| FI Rate map | max=20% | 18.7% (Mississippi) | LOW — 1.3pp headroom |
| Child Rate map | max=30% | 26.3% (Mississippi) | LOW — 3.7pp headroom |
| mealCost map | max=5.5 | $5.12 (Hawaii) | LOW — $0.38 headroom |
| snapCoverage map | max=150% | 132% | LOW |
| Radar maxRate | 25% | 18.7% | LOW |

---

## 5. Findings

### Critical

**C-1: CDC PLACES state name vs abbreviation mismatch — Health Outcomes buttons never populate**
- **File**: `src/js/dashboards/food-insecurity.js:1179-1188`
- **Root cause**: `fetchCDCPlacesData()` builds `placesByName` keyed on `s.name` from `places.records`. But `dashboard-places.php` returns records with a `state` field (abbreviation: `"AL"`, `"TX"`), not `name`. So `placesByName["AL"]` is stored but `sdohData.states[i].name` = `"Alabama"` — lookup always returns `undefined`. Health Outcomes button group (Obesity, Diabetes, Depression, Housing Insecurity) is never injected.
- **Test**: Unit test that builds `placesByName` using `records[i].state` and verifies full-name lookup succeeds after abbreviation-to-name mapping
- **Fix**: Change key from `s.name` to `s.state`, add abbreviation-to-full-name lookup when merging into `sdohData.states`
- **Effort**: S

### High

**H-1: `renderTripleBurden` — `Math.min(...[])` / `Math.max(...[])` on empty array produces `Infinity`/`-Infinity`**
- **File**: `src/js/dashboards/food-insecurity.js:1384-1385`
- **Impact**: `norm()` returns `NaN` for all `accessScore` values. Insight displays `"NaN/300"`. All bars render at zero height for Low Access dimension
- **Test**: Call `renderTripleBurden(fiData, null)` and verify no NaN in scored array
- **Fix**: `if (!accessVals.length) { accMin = 0; accMax = 1; }`
- **Effort**: XS

**H-2: `renderDemographics` tooltip — `s.rate === 0` divide-by-zero in `multiplier`**
- **File**: `src/js/dashboards/food-insecurity.js:1220`
- **Impact**: `(s.childRate / s.rate).toFixed(2)` produces `Infinity` when `s.rate === 0`
- **Fix**: `s.rate > 0 ? (s.childRate / s.rate).toFixed(2) : 'N/A'`
- **Effort**: XS

**H-3: `_tryACSFallback` does not patch `childPovertyRate`**
- **File**: `src/js/dashboards/food-insecurity.js:1702-1706`
- **Impact**: ACS fallback scatter in "Child Poverty" mode shows placeholder text but incorrectly says "Census ACS" suggesting child data is live
- **Fix**: Update placeholder text to clarify ACS fallback does not include child poverty
- **Effort**: XS

**H-4: Meal cost insight copy is factually wrong after national average update**
- **File**: `dashboards/food-insecurity.html:417`
- **Detail**: "Hawaii's $5.12/meal is 28% above the national average" — actual is 43% ($5.12 / $3.58 - 1). Wrong by 15 percentage points
- **Test**: Compute Hawaii premium vs `national.averageMealCost` from JSON, assert HTML matches
- **Fix**: Update to "43% above the national average of $3.58" or make data-driven
- **Effort**: XS

### Medium

**M-1: `renderBar` — `maxSnap === 0` NaN in radar SNAP dimension**
- **File**: `src/js/dashboards/food-insecurity.js:581`
- **Fix**: `Math.max(...) || 1`
- **Effort**: XS

**M-2: County drill-down — metric fallback silently shows `rate` when requested metric absent**
- **File**: `src/js/dashboards/food-insecurity.js:158`
- **Detail**: `f.properties[currentMetric] || f.properties.rate` — truthy fallback means metric value of `0` falls through to `rate`
- **Fix**: Change `||` to `??`
- **Effort**: XS

**M-3: Map `role="img"` is semantically incorrect for interactive drill-down element**
- **File**: `dashboards/food-insecurity.html:226`
- **Impact**: Screen readers will not expose map as interactive. No keyboard handler for drill-down
- **Fix**: Replace with `role="application"` or `role="region"`, add keyboard handler
- **Effort**: M

**M-4: `#county-search` missing `aria-activedescendant`**
- **File**: `src/js/dashboards/food-insecurity.js:396`
- **Fix**: Set `aria-activedescendant` in ArrowDown/ArrowUp handlers
- **Effort**: S

**M-5: Map `aria-label` is static — does not update on metric change**
- **File**: `dashboards/food-insecurity.html:226`
- **Fix**: Update in metric select change handler
- **Effort**: XS

**M-6: Hero counter `data-target` values not bound to JSON data**
- **File**: `dashboards/food-insecurity.html:174-188`
- **Detail**: `data-target="47.9"`, `"13.7"`, `"14.1"`, `"10.9"` hardcoded. Will silently stale on data update
- **Fix**: Patch `data-target` from `data.national` in `init()` before `animateCounters()`
- **Effort**: S

**M-7: `renderIncomeRiver` insight — small dataset overlap produces meaningless comparison**
- **File**: `src/js/dashboards/food-insecurity.js:1355-1358`
- **Detail**: `merged.slice(0, 10)` and `merged.slice(-10)` overlap when `merged.length < 20`
- **Fix**: Use `Math.floor(merged.length / 2)` for half-size slices
- **Effort**: XS

### Minor

**N-1**: SDOH "Health Outcomes" separator is `aria-hidden="true"` — AT users miss category boundary (`food-insecurity.js:1109`)
**N-2**: Static narrative copy that does not update from data (meal cost range, food-at-home rise %, SNAP coverage states) — 3 instances in HTML
**N-3**: BLS CPI x-axis date alignment structurally fragile — relies on all 3 series having identical non-null positions (`food-insecurity.js:932`)
**N-4**: Food bank org count 16.4% discrepancy has no UI disclosure on Food Banks dashboard
**N-5**: No tests for most complex functions: `renderTripleBurden`, `renderIncomeRiver`, `renderSDOH` (empty), `renderStateDeepDive`, `buildStateInsight`, `fetchCDCPlacesData`, `_tryACSFallback`, `renderDemographics` tooltip

---

## 6. Recommendations (Priority Order)

1. **Fix CDC PLACES merge key (C-1)** — S effort, Health Outcomes permanently disabled
2. **Fix meal cost insight copy (H-4)** — XS effort, factually wrong by 15pp
3. **Guard Triple Burden empty array (H-1)** — XS effort, prevents NaN propagation
4. **Fix county metric fallback operator (M-2)** — XS, change `||` to `??`
5. **Bind hero counters to JSON (M-6)** — S effort, prevents future drift
6. **Fix map accessibility (M-3, M-4, M-5)** — M effort combined, three related a11y fixes
7. **Write tests for critical paths (N-5)** — M effort, covers highest-risk untested functions
