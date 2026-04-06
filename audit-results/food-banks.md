# Food Bank Landscape Dashboard Audit

**Date**: 2026-04-06
**Scope**: 6 charts, `food-bank-summary.json`, `food-banks.js`, `food-banks.html`

## Data Sources & API Endpoints

| Source | Type | Status | Issues |
|--------|------|--------|--------|
| `food-bank-summary.json` | Static JSON | Current | Field shapes match JS expectations |
| `food-insecurity-state.json` | Static JSON | Current (2024) | Cross-dataset join for insecurity rates |
| `us-states-geo.json` | Static GeoJSON | OK | — |

No PHP proxies used by this dashboard.

## Hardcoded/Stale Data

### Warning

**W1: Radar area fill hex-to-rgba conversion is no-op**
- File: `food-banks.js:266`
- `REGION_COLORS[r.name].replace(')', ',0.2)').replace('rgb', 'rgba')` — REGION_COLORS are hex strings (e.g., `#4fc3f7`). The `.replace(')', ...)` matches nothing. Fills are solid opaque instead of 20% alpha.

**W2: Mississippi insight $593 vs computed $587**
- File: `food-banks.html:304`
- Hardcoded revenue-per-insecure-person is $6 off from current data.

**W3: Map visualMap `min:11` near Nevada clipping**
- File: `food-banks.js:45`
- Nevada sits at 11.2. A small data revision could cause clipping.

**W4: Data year label says "2023 IRS 990" but insecurity rates are 2024 Feeding America**
- File: `food-banks.html:145`
- Mixed data vintages not disclosed.

## Accessibility Issues

| Severity | Issue | Location |
|----------|-------|----------|
| Info | No accessible data alternatives on 5 of 6 charts | Multiple |

## Mobile/Responsive Issues

No critical mobile issues found.

## Info

- I1: Regression suppression working correctly (r=-0.084, below |r|<0.2 threshold)
- I2: Capacity-gap bubble radius range too compressed (8.0-9.7 px)
- I3: DC outlier unlabeled in gap scatter
- I4: `statesUnder100` is a hardcoded JSON field that could drift from state records

## Calculation Spot-Checks

| Check | Status |
|-------|--------|
| Regression r-value threshold |r| < 0.2 | Correctly suppresses line |
| Need-Capacity Gap scatter formula | Correct |
| Per-capita org density | Matches JSON |

## Summary
- Critical: 0
- Warning: 4
- Info: 5
