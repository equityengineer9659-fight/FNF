# Data Analytics Audit Report - Dimension 1: Data Accuracy and Freshness

**Date**: 2026-04-09
**Scope**: All static JSON data files (public/data/), dashboard HTML files (dashboards/*.html), PHP proxies (dashboard-bls.php, dashboard-census.php), JS dashboards (src/js/dashboards/*.js)

---

## Data Freshness

| Dataset | Source | Data Year | Last Updated | Status |
|---------|--------|-----------|--------------|--------|
| food-insecurity-state.json | USDA ERS ERR-358 + Feeding America | 2024 | 2026-04-04 | OK |
| snap-participation.json | USDA FNS | FY2025 through Nov 2025 | 2026-04-05 | OK |
| food-bank-summary.json | ProPublica / IRS 990 | 2023 | 2026-03-30 | OK (2024 990s not yet available) |
| bls-food-cpi.json | BLS CPI | Through 2026-02 | 2026-03-31 | OK - null at Oct 2025 in all three series |
| bls-regional-cpi.json | BLS CPI | Through 2026-02 | 2026-04-06 | OK |
| current-food-access.json | USDA FNS + Census ACS 2023 | Computed 2026-04-06 | 2026-04-06 | OK |
| snap-retailers.json | USDA FNS FY2024 | FY2024 | 2026-04-05 | OK |
| counties/*.json (51 files) | CHR 2025 | 2025 | N/A | OK - dataSource=CHR2025 confirmed in feature properties |

---

## National vs. State Totals Cross-Check

| Metric | Sum of States | National Aggregate | Variance | Status |
|--------|---------------|--------------------|----------|--------|
| Food Insecure Persons | 41,789,000 | 47,900,000 | -12.8% | WARN - exceeds 5%; documented in reconciliationNote |
| SNAP Participants (fi-state.json) | 41,582,000 | 41,700,000 | -0.3% | OK |
| SNAP Participants (snap-participation.json) | 41,582,000 | 42,126,585 | -1.3% | OK - documented |
| Food Bank Orgs | 51,218 | 61,284 | -16.4% | WARN - documented in reconciliationNote |
| Food Bank Revenue | 48,756M | 48,200M | +1.2% | OK |
| SNAP Coverage Ratio range | all 51 states | within 0-200 | none outside | OK |

---

## Calculation Spot-Checks

| Formula | Expected | Actual | Status |
|---------|----------|--------|--------|
| Meal cost baseline: food-prices.js vs national JSON | Match | Both 3.58 (food-prices.js:16 and fi-state.json national) | OK |
| SNAP coverage ratio range | 0-200% | Max 131.8%; no negatives or over 200% | OK |
| County FI formula in PHP | 0.75 * poverty + 2.5 | Confirmed with disclosure comment at dashboard-census.php:115-116 | OK |
| BLS M13 annual averages filtered | Excluded | parseSeries() restricts to month 1-12 at lines 96-99 | OK |
| Food bank revenue variance | within 5% | +1.2% | OK |
| FI persons state sum vs national | within 5% | -12.8% (documented) | WARN |

---

## Hardcoded Bounds Audit

| Chart | Bound | Current Data Max | Clipping Risk |
|-------|-------|-----------------|---------------|
| FI Rate map (food-insecurity.js:36) | max=20 | Mississippi 18.7% | Low - 1.3pt headroom |
| Child rate (food-insecurity.js:37) | max=30 | Mississippi 26.3% | Low - 3.7pt headroom |
| Annual Meal Gap map (food-insecurity.js:39) | max=900,000,000 | Texas 811,000,000 | Low |
| Meal Cost map (food-insecurity.js:40) | max=5.5 | Hawaii 5.12 | Low |
| SNAP Coverage map (food-insecurity.js:41) | max=150 | Top state 131.8% | Low |
| chart-preview.js normalization (line 27) | maxRate=20 maxChild=28 maxSnap=900K | Miss.18.7 Miss.26.3 | Low |
| Food bank density (food-banks.js) | No explicit visualMap max found | DC 35.9/100K | WARN - spec expected max=28; DC exceeds it |

---

## PHP Proxy Health

| Check | Result |
|-------|--------|
| BLS default series IDs (SAF1 SEFV SA0) | Correct - dashboard-bls.php:234 |
| BLS M13 annual averages filtered | YES - parseSeries() lines 96-99 restrict to month 1-12 |
| BLS regional series IDs | Correct - dashboard-bls.php:157-158 |
| Census ACS year consistent (2023 in URL and response) | YES - URL 2023/acs/acs5 (lines 65,67); response year:2023 (line 148) |
| Census FI model documented in code | YES - dashboard-census.php:115-116 explicit disclosure comment |

---

## Findings

### Critical

None.

---

### P1 Major

**[P1] Sankey body text presents 44.2M (2022) as present-tense national count -- figure is now 47.9M (2024)**
Evidence: dashboards/snap-safety-net.html:266,271 -- aria-label and paragraph body both reference 44.2 million food-insecure Americans. Current 2024 national figure is 47.9M.
Recommendation: Add 2022 data qualifier inline, or update Sankey flow values to reflect 2024 data.

**[P1] Sankey hardcoded prose counts (10.5M no assistance, 12.7M in crisis) lack vintage qualifier**
Evidence: dashboards/snap-safety-net.html:274,282 -- these figures read as present-tense. Data Year 2022 label at line 278 is visually separated from the sentences.
Recommendation: Prepend As of 2022: to these sentences, or update the Sankey model to 2024 data.

**[P1] SNAP demographic flow source cites USDA ERS 2022 -- that survey series was terminated after 2024**
Evidence: dashboards/snap-safety-net.html:414 -- USDA ERS 2022 (insecurity rates by race).
Recommendation: Note that the ERS race-disaggregated series was discontinued; these are the last available figures in that format.

**[P1] food-prices.html Cost Burden chart labeled Data Year: 2022 -- no indication whether newer data is available**
Evidence: dashboards/food-prices.html:304 -- Data Year 2022 for USDA ERS Food Expenditure Series. This series publishes annually.
Recommendation: Verify if USDA ERS released 2023 Food Expenditure data. Update if available, or relabel as 2022 (latest available).

---

### P2 Minor

**[P2] bls-food-cpi.json has null for Oct 2025 in all three series -- static fallback has a mid-series gap**
Evidence: public/data/bls-food-cpi.json -- all three series contain value:null at 2025-10 while Nov and Dec 2025 have values. BLS publishes CPI within 2-3 weeks; Oct 2025 data should have been available before April 2026.
Impact: JS iterating without null-filtering renders a visible chart gap or plots zero at Oct 2025.
Recommendation: Regenerate the static fallback file to fill the Oct 2025 null.

**[P2] DC food bank perCapitaOrgs = 35.9 -- above likely visualMap ceiling in food-banks.js**
Evidence: public/data/food-bank-summary.json DC record (perCapitaOrgs=35.9). Audit spec notes expected max=28/100K. No explicit global visualMap max was found in food-banks.js during grep audit.
Recommendation: Search food-banks.js for any visualMap max. If set to 28, raise to 40 or use data-driven max to prevent DC clipping silently to the maximum color band.

**[P2] County child rate multiplier inconsistency: PHP code uses 1.4x; HTML disclosure states 1.3-1.6x**
Evidence: public/api/dashboard-census.php:119 (1.4x hardcoded) vs dashboards/food-insecurity.html:633 (states 1.3-1.6x range).
Recommendation: Align both to cite exactly 1.4 rather than a range.

**[P2] Food insecure persons state sum -12.8% below national -- code risk if JS uses state sum as national proxy**
Evidence: Computed 41,789,000 vs national 47,900,000. Documented at food-insecurity-state.json:14 and food-insecurity.html:163.
Impact: Any dashboard code summing state persons to produce a national total underestimates by approximately 6.1M people.
Recommendation: Verify no JS aggregations rely on state persons sum as a proxy for the national figure.

---

### P3 Info

**[P3] snap-participation.json trend ends at Nov 2025 -- Dec 2025 not yet included**
The Data Notice on snap-safety-net.html:156 correctly states through November 2025. Consistent with FNS publication lag. No action needed.

**[P3] food-insecurity national.snapParticipation (41.7M) vs snap-participation national (42.1M) -- 0.4M gap from different publication cycles**
Both files are internally consistent with their respective sources. No action needed.

**[P3] snap-safety-net.js hardcodes _dataYear: 2022 for Sankey freshness label**
Evidence: src/js/dashboards/snap-safety-net.js:763. Accurate to data vintage. No action until Sankey is updated.

**[P3] food-bank-summary.json org state sum 16.4% below national -- documented in reconciliationNote**
Well-documented. Consider adding this structural gap to docs/current/dashboard-data-sources.md if not already present.

---

## Recommendations

1. **(P1 - priority)** Qualify or update the 44.2M / 10.5M / 12.7M Sankey figures at snap-safety-net.html:266,271,274,282 with 2022 vintage or current 2024 values.
2. **(P1)** Annotate ERS discontinuation at snap-safety-net.html:414 -- note these are the last race-disaggregated figures from that survey series.
3. **(P1)** Verify USDA ERS Food Expenditure 2023 release; update or relabel food-prices.html:304 as latest available.
4. **(P2)** Regenerate public/data/bls-food-cpi.json to fill null Oct 2025 entry in all three series.
5. **(P2)** Audit food-banks.js visualMap ceiling; if capped below 35.9, raise to accommodate DC (35.9/100K).
6. **(P2)** Align county child rate multiplier: standardize dashboard-census.php:119 and food-insecurity.html:633 to both cite exactly 1.4x.
7. **(P3)** Refresh snap-participation.json trend when USDA FNS publishes Dec 2025 data (expected approximately May 2026).