# Dimension 2: Analytical Integrity — Data Scientist Audit

**Date**: 2026-04-09
**Scope**: `src/js/dashboards/*.js` (all 7 dashboards + executive-summary)
**Auditor role**: Data Scientist (READ-ONLY)

---

## Summary

No P0 blockers found. Three P1 issues: a hardcoded year label for SNAP data that may be stale, a causal "3x more likely" claim with no inline citation in a static insight string, and a static insight label that hardcodes "poverty is the #1 predictor" regardless of the live r-value. Two P2 issues: the Triple Burden composite tooltip implies a unit ("/300") that is not explained to the user, and the Vulnerability Index does not label itself as composite/weighted in its tooltip. Three P3 observations around minor framing choices.

---

## Findings

**[P1] Scatter insight hardcodes "poverty is the #1 predictor" unconditionally**
Evidence: `src/js/dashboards/food-insecurity.js:737`
The `label` string for the overall-poverty scatter is always `'poverty is the #1 predictor of food insecurity'`, even when a live SAIPE overlay produces an r-value that is moderate or when the dataset shifts. The insight already computes `strength` dynamically from `reg.r` but appends this fixed editorial claim regardless of magnitude. If `reg.r` were ever 0.5 (moderate), the text would still assert "#1 predictor."
Recommendation: Gate the claim on `|r| >= 0.7`; replace with `'a strong correlate of food insecurity'` when moderate, and omit the ranking superlative entirely. Keep the dynamic `strength` word as the lead.

---

**[P1] SNAP Coverage bar chart legend hardcodes "FY2024" without data support**
Evidence: `src/js/dashboards/food-insecurity.js:908` — `'SNAP Coverage (FY2024)'`
The `snapParticipation` field in `food-insecurity-state.json` is drawn from Feeding America Map the Meal Gap 2025 (which models 2023 data), not from USDA FNS FY2024 administrative enrollment. The JSON `meta.sources` cites "Map the Meal Gap 2025 (2023 data)" and the national `year` field is 2024 (referring to the USDA ERS report year, not SNAP enrollment year). Labeling it "FY2024" overstates precision.
Recommendation: Change to `'SNAP Participation (Feeding America est.)'` or `'SNAP Coverage (2023 est.)'` to match the actual source vintage.

---

**[P1] SDOH unemployment insight asserts "3x more likely" without citation**
Evidence: `src/js/dashboards/food-insecurity.js:1057`
The static insight string reads: `"unemployed workers are 3x more likely to be food insecure than employed peers."` This specific multiplier is not derived from the scatter data shown (which is a state-level Census vs USDA correlation), and no inline source is given. The claim may be directionally true (USDA ERS household surveys support elevated risk) but the 3x figure is presented as fact computed from the chart.
Recommendation: Add a source parenthetical: `"(USDA ERS, 2024)"` or soften to `"significantly more likely"` to avoid implying the chart itself produces that statistic.

---

**[P2] Triple Burden tooltip tooltip states "/300" with no explanation**
Evidence: `src/js/dashboards/food-insecurity.js:1486`
The tooltip renders `<strong>Composite: ${s.total.toFixed(0)}/300</strong>`. The denominator 300 comes from three 0–100 component scores, but the chart has no legend entry, axis label, or explanatory note describing this. Users see a number like "247/300" with no context for what 300 means or how each component is weighted.
Recommendation: Add a subtitle or chart note: `"Each component scored 0–100 (food insecurity rate, low-access tract %, SNAP gap). Max = 300."` Also consider displaying the composite score on the y-axis label of the bar chart.

---

**[P2] Vulnerability Index tooltip does not disclose composite weighting**
Evidence: `src/js/dashboards/executive-summary.js:18` — formula is `(rate * 0.4) + (povertyRate * 0.3) + ((mealCost/maxMealCost) * 0.3)`; tooltip at line 41–45 shows only raw components without disclosing the weighted formula.
The map tooltip shows `Vulnerability Index: X.X` alongside the three input values, which is good, but never discloses the weights. A user clicking a state cannot verify or understand why a state ranks higher than another.
Recommendation: Add a line to the tooltip: `"Weighted: 40% insecurity + 30% poverty + 30% meal cost"`. Consider adding a static methodology note below the map.

---

**[P3] SDOH housing-burden correlation insight always shows regardless of r-value**
Evidence: `src/js/dashboards/food-access.js:1412–1413`
The housing-burden vs low-access scatter computes `reg.r` and labels it `strength`, but the insight text always ends with `"States where renters are most cost-burdened tend to have more food access challenges."` even if the correlation is weak. The strength word is prepended but the causal implication persists.
Recommendation: Add the same weak-correlation branching used elsewhere (lines 1096–1107 in the same file) to this insight.

---

**[P3] "driven by systemic income and employment disparities" is causal framing for correlational data**
Evidence: `src/js/dashboards/snap-safety-net.js:724`
The demographic flow Sankey insight says overrepresentation is `"driven by systemic income and employment disparities."` The Sankey visualizes modeled flow data (not a regression), so "driven by" goes beyond what the chart can support.
Recommendation: Change to `"associated with"` or `"reflecting"` to match the correlational nature of the data.

---

**[P3] county drill-down hint attributes data to "County Health Rankings 2025"**
Evidence: `src/js/dashboards/food-insecurity.js:181`
The hint text correctly cites CHR2025 — confirmed by `dataSource:"CHR2025"` in county GeoJSON properties. This is accurate. However, the hint says "not direct survey data" without clarifying what CHR2025 food insecurity rates actually represent (they are modeled estimates from CHR, combining poverty and health data). The distinction between CHR model and survey is valid but the word "modeled estimates" in the *insight callout* at line 237 is inconsistent with the hint calling them simply "not direct survey data."
Recommendation: Align both strings: either both say "modeled estimates" or both say "CHR 2025 model-based estimates."

---

## Methodology Confirmations (No Issues)

- County food insecurity rates are CHR2025 data, NOT the `0.75 * povertyRate + 2.5` formula mentioned in CLAUDE.md. The CLAUDE.md note appears outdated. Data verified by inspecting county `01.json` properties directly.
- Regression suppression at `|r| < 0.2` is implemented in `food-banks.js` (confirmed via grep — the `renderCapacityGap` scatter has no markLine, and the food-access scatter does suppress at `|r| < 0.4` with a branched insight text at lines 1096–1107, which is more conservative than the stated threshold). No active regressions are shown without disclosure.
- Food-access county drill-down fallback (poverty proxy) is correctly labeled `"Showing poverty rate as proxy for food access risk"` at line 168.
- Sankey methodology note is present: `"Modeled estimates · USDA FNS, Feeding America, Census ACS · 2022 data"` at `snap-safety-net.js:353`.
- Reconciliation notes are surfaced in both `food-insecurity-state.json` and `snap-participation.json` and the bank dashboard conditionally renders them at `food-banks.js:415–418`.
- SNAP purchasing power index formula (benefit × firstCPI / currentCPI) is internally consistent at `snap-safety-net.js:65`.
- Triple Burden normalization uses min/max range scaling per dimension (lines 1453–1468), which is correct and avoids cross-dimension comparison bias.
- Affordability index formula is disclosed in both tooltip and chart subtitle: `"annual meal cost per $1,000 of median income"` at `food-prices.js:177`.

