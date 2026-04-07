# Executive Summary Dashboard - Comprehensive Audit Report

**Date**: 2026-04-07
**Scope**: All 6 audit categories. Second-pass audit building on prior round-1 findings.
**Files reviewed**:
- /dashboards/executive-summary.html
- /src/js/dashboards/executive-summary.js
- /src/js/dashboards/shared/dashboard-utils.js
- /public/data/food-insecurity-state.json
- /public/data/snap-participation.json
- /public/data/bls-food-cpi.json
- /src/js/dashboards/executive-summary.test.js

---

## Prior Audit Fix Verification

| Prior Issue | Status |
|---|---|
| P1-7: Methodology typo x30 | FIXED - HTML:379 correctly reads x 0.3 |
| P1-8: renderSnapGap crashes on empty array | FIXED - guard at js:193 |
| P2-12: kpi-cpi-yoy HTML default 2.6% stale | FIXED - data-target=3.1 matches BLS YoY 3.06% rounded to 3.1% |
| P2-13: computeVulnerabilityIndex division by zero | FIXED - maxMealCost || 1 fallback at js:16 |
| P0-1: Vulnerability index formula x30 | FIXED - JS formula uses * 0.3 |
| P0-2: National insecurity KPI shows 12.8% | PARTIALLY FIXED - HTML updated to 13.7% matching JSON. JS never updates food-insecurity-kpi dynamically. Drift protection relies on a test at executive-summary.test.js:125-132, not elimination of hardcoding. |

---

## 1. API and Data Validation

### Data File Schema Checks

| File | Expected Fields | Present | Null Issues |
|---|---|---|---|
| food-insecurity-state.json | states[].name/rate/povertyRate/mealCost/persons; national.foodInsecurityRate/averageMealCost | All present, 51 records | None |
| snap-participation.json | national.snapParticipants/coverageGap; stateCoverage.states[].name/snapParticipants | All present, 51 records | None |
| bls-food-cpi.json | series[] Food at Home with date/value entries | Present | One intentional null at 2025-10 (BLS gap). Handled via date-keyed lookback. |
| us-states-geo.json | GeoJSON FeatureCollection | Consumed by echarts.registerMap() | No validation if malformed |

### Name-Join Reliability

The renderSnapGap join uses exact string matching on state name. All 51 state names match between the two files. Zero unmatched records. The join produces 51 entries before the top-15 slice -- no data loss.

### Error Handling Architecture (Carry-Forward)

A single try/catch at executive-summary.js:370 wraps all four fetches and all four chart renders inside one Promise.all. If any fetch fails or any chart throws, the entire dashboard goes blank silently. Console logging only occurs on localhost (line 408). Production users see no error message and no partial render. Individual chart failure isolation is absent.

Location: src/js/dashboards/executive-summary.js:369-412

### NEW: SNAP Data Vintage Mismatch

snap-participation.json has two distinct data vintages in use simultaneously on the same page. snap.stateCoverage.year = 2024 (Feeding America state estimates). snap.national.year = 2025 (USDA FNS FY2025 administrative data). The SNAP Coverage KPI (83.7%) is computed from national.snapParticipants (FY2025: 42.1M). The SNAP Gap bar chart uses stateCoverage.states[].snapParticipants (2024 estimates, sum 41.6M). No disclosure of this vintage difference exists in the dashboard UI.

Location: dashboards/executive-summary.html:234 (Data Year label), public/data/snap-participation.json national.year vs stateCoverage.year

---

## 2. Hardcoded, Stale, or Fragile Data

### Data Freshness

| Dataset | Updated | Data Year | Status |
|---|---|---|---|
| food-insecurity-state.json | 2026-04-04 | 2024 | Current (3 days old) |
| snap-participation.json | 2026-04-05 | 2024/2025 | Current (2 days old) |
| bls-food-cpi.json | 2026-03-31 | 2026-02 latest | Current (BLS March 2026 release expected mid-April) |

No dataset exceeds the 18-month staleness threshold.

### Food Bank Orgs KPI -- Fully Hardcoded 61.3K

The fourth hero stat has no id attribute, no corresponding JS update in init(), and no data source fetch anywhere in the codebase. Provenance is undocumented. The value stales silently when the actual count changes (annually).

Location: dashboards/executive-summary.html:179

### food-insecurity-kpi -- Hardcoded Without Dynamic Update

The national insecurity KPI (data-target=13.7) is not updated by any JavaScript in init(). The HTML default currently matches food-insecurity-state.json national.foodInsecurityRate (13.7%). A test at executive-summary.test.js:125-132 compares HTML data-target to JSON value and will fail if they diverge. The architecture requires a manual HTML edit every time the JSON updates; the test only fires in CI.

Location: dashboards/executive-summary.html:171-173

### Methodology Section Hardcodes Hawaii at .12

executive-summary.html:379 describes meal cost normalization using the national maximum (.12 in Hawaii). The JS computes this dynamically via Math.max() but the HTML description hardcodes the value and state. Currently correct (Hawaii .12 is the actual max). Will stale if data changes.

Location: dashboards/executive-summary.html:379

### BLS Static File Stales Monthly

bls-food-cpi.json is a static file with no scheduled refresh. BLS releases monthly CPI data approximately 6 weeks after the reference month. Current file has data through 2026-02. Without a CI workflow or cron job to re-fetch it, the CPI chart and KPI will fall one month behind per month.

Location: public/data/bls-food-cpi.json (fetchedAt: 2026-03-31)

---

## 3. Data Transformation and Chart Contract Review

### computeVulnerabilityIndex (executive-summary.js:15)

- Input: Array of state objects with name, rate, povertyRate, mealCost
- Output: Same array with added vulnerabilityIndex rounded to 2dp
- Formula: (rate x 0.4) + (povertyRate x 0.3) + ((mealCost / maxMealCost) x 0.3). Correct, matches all documentation.
- Division-by-zero guard: maxMealCost || 1 fallback -- fixed from prior audit
- Sample verification: Mississippi (rate 18.7, povertyRate 19.4, mealCost 3.18, maxMealCost 5.12) = 7.48 + 5.82 + 0.186 = 13.49. Confirmed correct.
- Remaining gap: No guard on individual field nullability. rate or povertyRate being null produces NaN silently. Current data has no nulls; schema enforcement absent.

### renderVulnerabilityMap (executive-summary.js:24)

- Tooltip at line 45 calls d.mealCost.toFixed(2) without a null guard. If mealCost is undefined this throws TypeError. Latent risk -- current data has no null mealCost values.
- Click handler (lines 96-114): topDriver selection is correct. Falls through to all-below-average branch when all diffs are negative.
- CSV export: correct fields, no issues.

### renderSnapGap (executive-summary.js:124)

- Join: 51/51 name matches, zero data loss.
- Tooltip at line 150: (d.foodInsecure - d.snapParticipants) / d.foodInsecure * 100. No guard for d.foodInsecure === 0. Produces NaN if zero food-insecure persons. Current minimum is Wyoming at 64,000 -- theoretical risk only.
- Reducer guard at line 193: if (insightEl && joined.length) -- fixed from prior audit. Safe.
- Y-axis has no name property. Values like 1.0M / 500K are ambiguous without a unit label.

### renderPriceImpact (executive-summary.js:205)

- Null handling: correct. 2025-10 null is skipped. 2025-11 through 2026-02 all compute valid YoY values.
- Latest YoY: 2026-02 = 3.06%, renders as 3.1% via toFixed(1). Matches HTML KPI default.
- KPI update: kpiEl.dataset.target = latest.value.toFixed(1) at line 283 runs before second animateCounters() call -- correct sequence.
- Guards blsData?.series and if (!foodHome) present and correct.

### renderWorstStates (executive-summary.js:297)

- top10.at(-1) guarded by if (insightEl && top10.length >= 3) at line 357 -- safe.
- getRegion() South count is correct.

### Counter Animation Sequence

animateCounters() runs at line 366 (HTML defaults before data loads) and again at line 404 (after data and KPI updates). snap-coverage-kpi and kpi-cpi-yoy animate to dynamic values on the second call. food-insecurity-kpi and food bank orgs have no JS update -- they animate from and to HTML defaults both times.

---

## 4. Accessibility Audit

| Check | Result |
|---|---|
| Heading hierarchy H1-H2-H3 | Pass -- no skipped levels |
| Skip link href=#main-content | Pass |
| Main landmark id=main-content | Pass |
| aria-current on active tab | Pass |
| Chart containers role=img + static aria-label | Pass (static only, no dynamic adaptation) |
| ECharts aria config on all 4 charts | FAIL -- absent on all 4 |
| Dynamic insight containers have aria-live | FAIL -- absent on all 4 containers |
| Card titles use heading element | FAIL -- all 3 use div not h3 |
| Map tooltip keyboard accessible | FAIL -- hover only, no focus handler |
| KPI reconciliation notes accessible | FAIL -- title attribute only |
| pp abbreviation expanded | FAIL -- raw text, no abbr expansion |

**aria-live missing**: #vulnerability-map-insight, #snap-gap-insight, #price-impact-insight, #worst-states-insight (HTML lines 212, 236, 261, 285) are populated after data loads via textContent/innerHTML but lack aria-live=polite. Screen readers will not announce updates.

**Card titles as divs**: HTML lines 297-309 -- Grant Writers, Executive Directors, Policy Advocates all use div.dashboard-insights__card-title under an H2. Should be h3 for screen reader heading navigation.

**ECharts aria absent** on all four setOption() calls (JS lines 34, 138, 230, 306). Outer div role=img with static aria-label provides a fallback but does not adapt to rendered data.

**pp abbreviation** at JS line 105: map click insight generates text with the abbreviation pp (percentage points) as a plain text node. Not expandable by screen readers.

**KPI reconciliation** at HTML lines 170, 174 uses title attribute only for the 41.8M vs 47.9M discrepancy. title is inaccessible on touch devices and inconsistently announced by screen readers.

---

## 5. Mobile and Responsive Audit

| Viewport | Issue | Status |
|---|---|---|
| 375px | Tab bar overflows -- no scroll affordance for rightmost Summary tab | FAIL |
| 375px | Vulnerability map at 300px height -- legible, roam disabled | Pass |
| 375px | KPI stats stack to single column | Pass |
| 375px | No horizontal page overflow | Pass |
| 375px | All chart containers at appropriate mobile heights | Pass |
| All | Export button tap target size -- CSS-dependent, needs visual verification | Unknown |

**Tab overflow**: The 7-tab dashboard nav at HTML lines 148-160 overflows at 375px. Tabs scroll horizontally but no visual affordance (fade edge, scroll indicator) signals this. The Summary tab is rightmost and may be off-screen on initial render.

---

## 6. National vs. State Totals Cross-Check

| Metric | Sum of States | National Aggregate | Variance | Status |
|---|---|---|---|---|
| Food Insecure Persons | 41,789,000 | 47,900,000 | -12.76% | Documented -- outside 5% threshold but explained |
| SNAP Participants | 41,582,000 (2024 state) | 42,126,585 (FY2025) | -1.29% | Within tolerance |
| SNAP Coverage Ratios | 68.3%-143.4% | n/a | No value outside 0-200% | Pass |

**Persons variance**: The -12.76% variance exceeds the standard audit +-5% threshold. food-insecurity-state.json meta._reconciliationNote documents this as a known methodological difference between USDA ERS national survey and Feeding America state-level model. The JSON explanation is not surfaced in the dashboard UI -- only accessible via a title attribute hover tooltip on the hero stat (HTML line 170).

---

## Findings Summary Table

| # | Issue | Category | Severity | Location | Effort |
|---|---|---|---|---|---|
| NEW-1 | food-insecurity-kpi never updated by JS; manual HTML sync required | Hardcoded | High | executive-summary.js (missing in init) | S |
| NEW-2 | SNAP national KPI FY2025 vs gap chart 2024 -- different vintage, undisclosed | Data integrity | Medium | snap-participation.json; HTML:234 | XS |
| NEW-3 | Methodology hardcodes .12 Hawaii -- stales if data changes | Hardcoded | Low | executive-summary.html:379 | XS |
| NEW-4 | snap-participation.json stateCoverage schema has no test | Test gap | Medium | executive-summary.test.js | XS |
| NEW-5 | renderSnapGap tooltip -- no guard for d.foodInsecure === 0 | Transformation | Low | executive-summary.js:150 | XS |
| NEW-6 | renderVulnerabilityMap tooltip -- d.mealCost.toFixed(2) without null guard | Transformation | Low | executive-summary.js:45 | XS |
| CARRY-1 | Food Bank Orgs KPI hardcoded 61.3K -- no id, no data source | Hardcoded | High | executive-summary.html:179 | S |
| CARRY-2 | Single try/catch swallows all 4 fetch failures -- blank dashboard | Error handling | High | executive-summary.js:370-412 | S |
| CARRY-3 | Dynamic insight containers have no aria-live=polite | Accessibility | Medium | executive-summary.html:212,236,261,285 | XS |
| CARRY-4 | Card titles use div instead of h3 | Accessibility | Medium | executive-summary.html:297-309 | XS |
| CARRY-5 | ECharts aria config absent on all 4 charts | Accessibility | Medium | executive-summary.js:34,138,230,306 | S |
| CARRY-6 | No tests for any of the 4 chart render functions | Test gap | Medium | executive-summary.test.js | M |
| CARRY-7 | computeVulnerabilityIndex mealCost=0 NaN edge case not tested | Test gap | Low | executive-summary.test.js | XS |
| CARRY-8 | Dashboard tab bar overflows at 375px with no scroll affordance | Mobile | Low | Tab nav CSS | S |
| CARRY-9 | chart-snap-gap y-axis missing unit label | UX | Low | executive-summary.js:169-172 | XS |
| CARRY-10 | KPI reconciliation note only accessible via title attribute | Accessibility | Low | executive-summary.html:170,174 | S |
| CARRY-11 | pp abbreviation in map click insight not expanded | Accessibility | Low | executive-summary.js:105 | XS |
| CARRY-12 | BLS static file has no scheduled refresh mechanism | Data freshness | Low | public/data/bls-food-cpi.json | M |
| CARRY-13 | Inline rgba in price chart area gradient bypasses COLORS.accent | Maintenance | Low | executive-summary.js:264 | XS |

---

## 7. Test-First Remediation Plan

### NEW-1 -- food-insecurity-kpi not dynamically updated (High / S)

Test to write first:
  it should update food-insecurity-kpi data-target from fiData.national during init
    Mock fetch with national.foodInsecurityRate = 15.0
    Run init()
    Assert getElementById(food-insecurity-kpi).dataset.target === 15.0

Fix: In init() after fiData loads, add:
  const fiKpiEl = document.getElementById(food-insecurity-kpi);
  if (fiKpiEl) fiKpiEl.dataset.target = fiData.national.foodInsecurityRate.toFixed(1);
Also update the HTML inline text from 13.7% to a neutral placeholder so the no-JS fallback is clearly static.

### NEW-2 -- SNAP vintage mismatch not disclosed (Medium / XS)

Test to write first:
  it SNAP section should note that state data year differs from national data year
    Read HTML
    Assert SNAP Data Year label contains year disambiguation text

Fix: Update the SNAP section Data Year label at HTML:234 from 2024 to 2024 (state) / FY2025 (national).

### NEW-4 -- snap-participation.json stateCoverage schema not tested (Medium / XS)

Tests to write:
  describe data shape: snap-participation.json stateCoverage
    it should have states array with name and snapParticipants for each state
    it should have no state with coverageRatio > 200 or < 0

Fix: Tests only -- no production code change needed.

### CARRY-1 -- Food Bank Orgs KPI hardcoded (High / S)

Tests to write first:
  it food-bank-orgs-kpi should have an id attribute in the HTML
  it JS should dynamically update food-bank-orgs-kpi from food-bank-summary.json

Fix: Add id=food-bank-orgs-kpi to HTML:179. Fetch food-bank-summary.json in init() and compute the national org count dynamically, using the same pattern as snap-coverage-kpi.

### CARRY-2 -- Silent failure on fetch error (High / S)

Test to write first:
  it should show visible error message when data fetches fail
    Mock global.fetch to reject
    Run init()
    Assert at least one chart container has non-empty error text

Fix: Separate chart renders so each can fail independently. On Promise.all rejection, inject an error message into each chart container div rather than leaving them blank.

### CARRY-3 -- aria-live missing (Medium / XS)

Test to write first:
  it all four dynamic insight containers should have aria-live=polite
    Read HTML
    Assert each of the four insight divs has aria-live=polite attribute

Fix: Add aria-live=polite to the four insight container divs (HTML lines 212, 236, 261, 285).

### CARRY-4 -- Card titles as divs (Medium / XS)

Test to write first:
  it organization card titles should use h3 elements not divs
    Assert no div.dashboard-insights__card-title exists in HTML
    Assert three h3.dashboard-insights__card-title elements exist

Fix: Change the three div.dashboard-insights__card-title to h3 in HTML lines 297-309.

### CARRY-6 -- No render function tests (Medium / M)

Four new describe blocks needed in executive-summary.test.js:

  describe renderSnapGap
    it renders bar chart for top 15 states by food insecurity rate
    it produces insight naming state with largest absolute gap
    it handles empty joined array without throwing
    it does not throw when foodInsecure equals snapParticipants

  describe renderPriceImpact
    it updates kpi-cpi-yoy data-target with latest computed YoY
    it produces correct YoY for 2026-02 given actual BLS data
    it skips null entries in YoY computation

  describe renderWorstStates
    it returns top 10 states sorted descending by vulnerability index
    it counts southern states correctly in insight text
    it does not throw when statesWithIndex is empty

  describe renderVulnerabilityMap
    it calls echarts.registerMap with USA-exec
    it sets series data with vulnerabilityIndex values
    it CSV export callback returns correct headers and row count

Fix: Tests only -- no production code changes needed.

### CARRY-9 -- SNAP gap y-axis missing unit label (Low / XS)

Test: it renderSnapGap should configure y-axis with a name label
  Assert setOption called with yAxis.name set to a non-empty string

Fix: Add name: Persons and nameTextStyle: { color: COLORS.textMuted } to yAxis in renderSnapGap.

### CARRY-11 -- pp abbreviation not expanded (Low / XS)

Test: it map click insight text should spell out percentage points not use abbreviation
  Build the insight string directly from the template literal
  Assert output does not contain the space-bounded two-character abbreviation

Fix: Change the abbreviation to percentage points in the template literal at executive-summary.js:105.

