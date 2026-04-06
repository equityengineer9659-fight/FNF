# SNAP & Safety Net Dashboard Audit

**Date**: 2026-04-06
**Scope**: 7 charts/gauges, `snap-participation.json`, PHP proxies, `snap-safety-net.js`, `snap-safety-net.html`

## Data Sources & API Endpoints

| Source | Type | Status | Issues |
|--------|------|--------|--------|
| `snap-participation.json` — national | USDA FNS FY2025 | OK | — |
| `snap-participation.json` — trend | USDA FNS (through Nov 2025) | OK | — |
| `snap-participation.json` — stateCoverage | Feeding America 2024 | OK | — |
| `snap-participation.json` — schoolLunch | USDA FNS / KIDS COUNT FY2023 | OK | — |
| `snap-participation.json` — benefitsPerPerson | USDA FNS FY2024 | OK | — |
| `snap-participation.json` — sankey | USDA FNS / Feeding America / Census 2022 | Oldest (4 years) | — |
| `dashboard-bls.php` (Food CPI) | BLS live API, 7-day cache | OK | Series IDs correct |
| `dashboard-places.php` (CDC BRFSS) | CDC PLACES, 24h cache | OK | `FOODSTAMP` measure confirmed |

## Hardcoded/Stale Data

### Critical

**C1: `_reconciliationNote` contains stale state-sum figure**
- File: `snap-participation.json:12`
- Note says "~39.1M / ~7% below national." Actual sum is 41.58M / 1.3% below.

**C2: Hardcoded Wyoming coverage ratio is wrong**
- File: `snap-safety-net.js:117` and `snap-safety-net.html:251`
- Both hardcode "Wyoming...40.6%". JSON shows Wyoming coverageRatio is 46.9%.
- Visible on every page load before any interaction.

### Warning

**W1: Benefit gauge max ($300) clips Hawaii ($312)**
- File: `snap-safety-net.js:482`
- ECharts visually clamps gauge at 100% for Hawaii.

**W2: PPI uses static $188 benefit, ignoring `benefitTimeline`**
- File: `snap-safety-net.js:48-49`
- Real SNAP benefits changed from $126 (2018) to $258 (COVID) to $194 (post-allotments).
- `benefitTimeline` array exists in JSON but is never used.

**W3: HTML data notice says "FY2022" but data is 2024**
- File: `snap-safety-net.html:158`

**W4: Demographic Sankey uses flat 84% SNAP coverage for all race groups**
- File: `snap-safety-net.js:615`
- Eliminates any equity signal from the demographic equity chart.

**W5: 5-gauge grid `repeat(5,1fr)` broken on mobile**
- File: `snap-safety-net.html:363`
- Inline style, no responsive override. Each gauge ~67px wide on 375px screen.

## Accessibility Issues

| Severity | Issue | Location |
|----------|-------|----------|
| Info | CDC PLACES toggle hidden entirely on API failure — no fallback message | `html:227`, `js:552-554` |

## Calculation Spot-Checks

| Formula | Expected | Actual | Status |
|---------|----------|--------|--------|
| Coverage gauge | `snap / (snap + gap) * 100` | 83.7% | OK |
| Monthly shortfall | `$3.58 * 3 * 30 - $188` | $134 | OK |
| Sankey flow balance | inflow = outflow all nodes | Balanced | OK |
| Coverage ratio all 51 states | stored == calculated | 0 mismatches | OK |

## Summary
- Critical: 2 (stale reconciliation note, wrong Wyoming ratio)
- Warning: 5 (gauge clips, PPI static, FY2022 label, flat Sankey, mobile gauges)
- Info: 5
