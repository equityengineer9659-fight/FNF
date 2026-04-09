# Dimension 11: Code Quality & Maintainability

**Audited**: 2026-04-09
**Scope**: src/js/dashboards/*.js (shared + per-dashboard), src/js/effects/, src/js/monitoring/, build-components.js

---

## Findings

### Functions over 200 lines

**[P1] renderMap in food-insecurity.js is 295 lines (lines 18-312)**
Evidence: src/js/dashboards/food-insecurity.js:18-312 — monolithic function containing tooltip formatters, drill-down state machine, showNational(), metric config, event handlers, and county tooltip logic all in one closure.
Recommendation: Extract stateTooltip (line 50), countyTooltip (line 65), showNational (line 79), and the drill-down event handler into named module-scope functions. The metric config object at line 35 can move to a const outside the function.

**[P2] init in food-access.js is 232 lines (lines 1420-1651)**
Evidence: src/js/dashboards/food-access.js:1420-1651 — combines data fetching, hero stat sync, chart orchestration, map toggle event handling (switchMapView closure, lines 1486-1542), and resize wiring.
Recommendation: Extract switchMapView to a named function and move the toggle event wiring to its own initMapToggle(mapCtrl, geoJSON, ...) function.

**[P2] renderDesertMap in food-access.js is 194 lines (lines 34-227)**
Evidence: src/js/dashboards/food-access.js:34-227 — contains the full map setup, four tooltip formatters, drill-down state machine, and click handler inline.
Recommendation: Same pattern as renderMap in food-insecurity.js — extract tooltip functions and drill-down logic.

---

### True dead code (write-only variables)

**[P1] snapTrendDates is assigned but never read**
Evidence: src/js/dashboards/snap-safety-net.js:18 declares let snapTrendDates = null and line 26 assigns it. It is never consumed anywhere in the file. The eslint-disable-line no-unused-vars comment confirms ESLint catches it.
Recommendation: Delete the variable declaration and the assignment at line 26. If date alignment was a planned future feature, add a TODO comment with intent instead of suppressing lint.

**[P1] snapMapActiveView CDC branch is unreachable at declaration time**
Evidence: src/js/dashboards/snap-safety-net.js:139 — declared as 'admin'; line 194 checks if (snapMapActiveView === 'cdc' && snapMapCdcData) but snapMapActiveView starts as 'admin' and is only changed inside renderSnapMap. If the CDC toggle is not wired in the HTML, the 'cdc' branch is never reached.
Recommendation: Audit whether the CDC toggle button exists in the HTML. If not, remove the dead branch and the eslint-disable. If it does exist, remove the lint suppression as the variable is legitimately read.

---

### Duplicate pattern: getOrCreateChart defined locally

**[P2] getOrCreateChart is a local re-implementation not exported from shared utils**
Evidence: src/js/dashboards/food-access.js:26-29 — defines a local getOrCreateChart(id) wrapping echarts.getInstanceByDom(el) || createChart(id). All other dashboards call createChart directly, which disposes and recreates on each call.
Recommendation: Move getOrCreateChart into dashboard-utils.js and export it so other toggle-heavy dashboards can adopt idempotent chart creation without reinventing it.

---

### Duplicate color maps

**[P2] Two parallel region color maps with intentionally different hues, but the divergence is undocumented**
Evidence: dashboard-utils.js:84-89 defines REGION_COLORS (vivid: Northeast #60a5fa, etc.); d3-heatmap.js:43-48 defines HEATMAP_REGION_COLORS (muted: Northeast #93B8DE, etc.).
Recommendation: Add a comment at d3-heatmap.js:43 noting these are intentionally muted versions of REGION_COLORS to prevent future unification attempts that would break tile legibility.

---

### window._fnfStateData global coupling

**[P2] Module-scope data shared via window property instead of module state**
Evidence: src/js/dashboards/food-insecurity.js:1621 sets window._fnfStateData = data; lines 762, 1214, 1247, 1750, 1784 read it. All read sites are in the same module file.
Recommendation: Promote to a module-scope let stateData = null; variable. The window global is unnecessary since all read sites are within food-insecurity.js.

---

### Inline style= attributes in JS-generated HTML

**[P3] initStateSelector injects HTML with inline style= attributes**
Evidence: src/js/dashboards/shared/dashboard-utils.js:362-363 — innerHTML template includes style= on both label and select elements.
Recommendation: Per the project CSP, HTML style="" attributes require unsafe-inline. Verify this is already permitted or migrate styles to CSS classes (.dashboard-state-selector label, .dashboard-state-selector select) in dashboards.css.

---

### eslint-disable comments audit

| Location | Rule suppressed | Verdict |
|---|---|---|
| snap-safety-net.js:18 | no-unused-vars (snapTrendDates) | Remove — fix by deleting dead variable |
| snap-safety-net.js:139 | no-unused-vars (snapMapActiveView) | Remove after resolving CDC branch |
| environment.js:136,196 | no-console | Keep — justified dev logger |
| executive-summary.js:418,420 | no-console | Keep — error boundary |
| main.js:13 | no-console | Keep — guarded by env check |
| monitoring/*.js | no-console (4 instances) | Keep — monitoring module |

---

### dashboard-utils.js organization

**[P3] State selector UI widget is out of place in a data/chart utility module**
Evidence: src/js/dashboards/shared/dashboard-utils.js:353-383 — initStateSelector and getSelectedState inject DOM and manage URL state; everything else in the file is pure data or chart infrastructure.
Recommendation: Not urgent. Track as chore/extract-state-selector — move these two functions to a future dashboard-controls.js when the file next needs significant changes.

---

### Circular dependencies

None. d3-heatmap.js imports from dashboard-utils.js; dashboard-utils.js does not import from d3-heatmap.js. No cross-dashboard imports.

---

### d3-heatmap.js documentation

**[P3] createD3Heatmap parameter shape has no schema description**
Evidence: src/js/dashboards/shared/d3-heatmap.js:393 — function signature is createD3Heatmap({ containerId, breadcrumbId, hierarchyData, tooltipFn, normFn }) with no JSDoc describing shape or types.
Recommendation: Add a brief JSDoc param block above line 393.

---

### TODO / FIXME / HACK comments

None found. Clean.

---

### Commented-out code blocks

None found. Clean.

---

## Summary Table

| Finding | File | Lines | Severity |
|---|---|---|---|
| renderMap 295 lines | food-insecurity.js | 18-312 | P1 |
| snapTrendDates write-only dead variable | snap-safety-net.js | 18, 26 | P1 |
| snapMapActiveView CDC branch likely unreachable | snap-safety-net.js | 139, 194 | P1 |
| init 232 lines | food-access.js | 1420-1651 | P2 |
| renderDesertMap 194 lines | food-access.js | 34-227 | P2 |
| getOrCreateChart not in shared utils | food-access.js | 26-29 | P2 |
| Divergent region color maps undocumented | d3-heatmap.js:43 / dashboard-utils.js:84 | — | P2 |
| window._fnfStateData cross-site coupling | food-insecurity.js | 1621, 762+ | P2 |
| initStateSelector injects style= attributes | dashboard-utils.js | 362-363 | P3 |
| dashboard-utils.js mixed purpose (state selector) | dashboard-utils.js | 353-383 | P3 |
| createD3Heatmap parameter shape undocumented | d3-heatmap.js | 393 | P3 |
