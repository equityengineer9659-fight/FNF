# Dimension 9: Error Handling & Resilience Audit
**Date**: 2026-04-09
**Scope**: `src/js/dashboards/*.js`, `public/api/*.php`, `dashboards/*.html`

---

## Findings

**[P2] `_stale` flag from PHP proxies is silently ignored in `updateFreshness()`**
Evidence: All 12 PHP proxies set `_stale: true` in the JSON payload when serving cached data after an upstream failure (`public/api/dashboard-bls.php:127`, `dashboard-sdoh.php:143`, etc.). `updateFreshness()` in `src/js/dashboards/shared/dashboard-utils.js:196–206` only branches on `_static`; it has no branch for `_stale`. When a proxy returns stale cache, the badge displays "Live" — which is factually incorrect.
Recommendation: Add a `_stale` branch: show "Cached" + apply `freshness--cached` class when `info._stale` is true.

**[P2] Error banner exists only on Executive Summary — five other dashboards have no `role="alert"` element**
Evidence: `grep -r "dashboard-error\|role=\"alert\""` in `dashboards/*.html` returns exactly one match: `dashboards/executive-summary.html:163`. Food Insecurity, Food Access, SNAP, Food Prices, and Food Banks all use `document.querySelectorAll('.dashboard-chart').forEach(el => el.innerHTML = ...)` as their catch handler (`food-insecurity.js:1701`, `food-prices.js:876`, `food-access.js:1647`, `snap-safety-net.js:802`, `food-banks.js:446`). This injects an error message into every chart container but provides no single accessible alert region for screen readers.
Recommendation: Add `<div id="dashboard-error" class="dashboard-error" role="alert" hidden></div>` to each dashboard HTML template and update the catch blocks to show it (matching executive-summary pattern).

**[P2] `fetchWithFallback()` static fallback can throw an unhandled rejection if the static JSON also fails**
Evidence: `src/js/dashboards/shared/dashboard-utils.js:253–255`: if the static `fetch` returns `!res.ok`, it throws. This function is not called from any dashboard init that wraps the invocation in try/catch — it's only used in tests. If static files go missing (bad deploy), the thrown error would propagate to an unhandled promise rejection.
Recommendation: Callers should wrap `fetchWithFallback` in try/catch, or the function itself should return a null/error object instead of throwing.

**[P3] SDOH fallback message checks for missing `<canvas>` but chart may already have a loading skeleton**
Evidence: `food-insecurity.js:1230–1233`: the catch block checks `!sdohChart.querySelector('canvas')` before injecting "Social determinants data unavailable". If the chart container has a loading spinner or placeholder element (no canvas yet), the check passes and the fallback renders correctly. But if the chart was partially initialised (e.g., ECharts added a canvas before the API call failed), the fallback is silently suppressed and the user sees an empty chart.
Recommendation: Replace the canvas-presence guard with an explicit `_sdohRendered` flag set when the chart successfully renders.

**[P3] `food-prices.js` and `snap-safety-net.js` init catch blocks do not disable the `resize` listener**
Evidence: Both `food-prices.js:875–879` and `snap-safety-net.js:801–805` write error HTML to chart containers then fall through without removing the `window.resize` listener (which was added inside the try block only on success, so this is a non-issue — the listener is never registered when the catch fires). Confirmed safe.
Recommendation: None needed.

**[P3] `food-access.js` county drill-down catch swallows the error without any user feedback**
Evidence: `food-access.js:1625–1627`: when county GeoJSON fails to load, the chart's `hideLoading()` is called but no fallback message is shown in the chart or to the user. The map simply stays in a loading state that disappears silently.
Recommendation: After `chart.hideLoading()`, render a brief error message in the chart container or restore the national view via `mapCtrl.showNational()`.

---

## Confirmed Working

- Executive Summary error banner (`dashboard-error`, `role="alert"`, Phase 13): working correctly at `executive-summary.js:417–428`.
- Per-chart inner try/catch in Executive Summary (`executive-summary.js:409–412`): partial renders survive individual chart failures.
- SDOH "Social determinants data unavailable" fallback (`food-insecurity.js:1228–1234`): present and functional for the common case.
- All non-blocking API calls (BLS, SAIPE, Census ACS, CDC PLACES, SDOH): use fire-and-forget pattern with silent catch — correct.
- `fetchWithFallback()` live-to-static pattern: correct for the happy path.
- Nonprofit Profile `showError()` (`nonprofit-profile.js:1363`): dedicated error function, used in all failure paths including missing EIN and empty filings.
- PHP proxies: all return `502 + {error: ...}` when stale cache is also unavailable — JS correctly checks `data.error` before using payload.

