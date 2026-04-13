---
paths:
  - "src/js/dashboards/**"
  - "dashboards/**"
---

# Dashboard Module Reference

## Shared Utilities (`src/js/dashboards/shared/`)

### `dashboard-utils.js`
Shared ECharts setup, colors, `MAP_PALETTES`, formatters, `linearRegression`, `US_STATES`.
- `updateFreshness()` — two-state: filename ending `_static` → "Data: year", else → "Live"
- `animateCounters()` — respects `prefers-reduced-motion`, integer-aware

### `d3-heatmap.js`
D3 zoomable heatmap module. Key exports:
- `createD3Heatmap()`, `buildHeatmapLegend()`, `buildRegionChips()`
- `createRankNorm()` — rank-based normalization (prevents outlier compression)
- `sampleGradient()`, `tileTextColor()`, `tileSubTextColor()`, `HEATMAP_REGION_COLORS`
- 7-stop value gradient, SVG per-tile depth gradient, adaptive text contrast, keyboard-accessible breadcrumbs

## Dashboard Modules (`src/js/dashboards/`)

### `food-insecurity.js` — Food Insecurity Overview
12 charts: map with SNAP Coverage metric + county drill-down, trend with markLine annotations, radar, scatter, SDOH, demographics, income river, meal cost bar, CPI trend, SNAP coverage bars, Triple Burden Index, State Deep-Dive KPI panel. Cross-loads `current-food-access.json` + `food-bank-summary.json`.

### `food-access.js` — Food Access & Deserts
**Map toggle**: Food Deserts ↔ Food Insecurity ↔ SNAP Retailers on a single chart instance (drill-down in deserts + insecurity modes).
**Double Burden dual-mode**: "Total Affected" (D3 treemap, √-scaled area) and "Rate Comparison" (equal CSS Grid tiles, sorted by rate) with toggle; outlier emphasis on top-20% states.

### `snap-safety-net.js` — SNAP & Safety Net
Sankey data from `snap-participation.json`. 5 KPI gauges (coverage, lunch, benefit, gap, affordability shortfall). SNAP Purchasing Power Index line on trend chart.

### `food-prices.js` — Food Prices & Affordability
Live BLS regional CPI data. CPI vs Food Insecurity dual-axis chart (loads `food-insecurity-state.json` for trend overlay). FRED item-level CPI toggles — restore gradient after JSON clone.

### `food-banks.js` — Food Bank Landscape
Revenue heatmap (D3, uses `createRankNorm`). Regression line suppressed when |r| < 0.2 with dynamic insight text. Need-Capacity Gap scatter (revenue per insecure person vs insecurity rate).

### `nonprofit-directory.js` — Nonprofit Directory
ProPublica API, debounced search, state filter, pagination.

### `nonprofit-profile.js` — Nonprofit Profile
6 ECharts: revenue trend, composition, expenses vs revenue, assets/liabilities, compensation, efficiency radar. Dynamic data-driven descriptions with conditional insights.

## Data Sources
Always verify API endpoint URLs and field mappings against the actual API response schema before committing. See memory `project_dashboard.md` for full inventory of 10 PHP proxies, 50+ Census vars, 11 BLS series.

## Dashboard Page Inventory (`dashboards/`)
executive-summary, food-insecurity (Overview), food-access, snap-safety-net, food-prices, food-banks, nonprofit-directory, nonprofit-profile — 8 pages sharing 7-tab navigation (profile shares the Directory tab).
