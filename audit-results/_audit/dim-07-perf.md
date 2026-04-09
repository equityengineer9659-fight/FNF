# Dimension 7: Performance & Bundle Size Audit
**Date**: 2026-04-09  
**Build**: success (dist/ current)

---

## Bundle Sizes vs Budgets

| Asset | Minified | Budget | Gzipped | Budget | Status |
|-------|----------|--------|---------|--------|--------|
| CSS (`main-Bi9q5ota.css`) | 144.4 KB | ~125 KB | 23.4 KB | ~20 KB | WARNING |
| JS Main (`main-Ce63eOv4.js`) | 48.1 KB | ~47 KB | 14.0 KB | ~16 KB | OK |
| JS Effects (`effects-DYS9c23G.js`) | 5.5 KB | ~5 KB | 1.8 KB | ~2 KB | OK |
| ECharts (`echarts-N6UFC3T6.js`) | 778.3 KB | ~645 KB | 252.6 KB | ~210 KB | WARNING |
| Sentry/index (`index-B3RYPSBH.js`) | 425.3 KB | unbudgeted | 138.2 KB | — | TRACK |
| D3 (`d3-C9f6MrPA.js`) | 16.4 KB | ~16 KB | 5.3 KB | ~5 KB | OK |

Dashboard JS chunks (all within ~15–25 KB budget):
- `dashboards_food-access` 44.5 KB — slightly over; at 11.9 KB gzip, acceptable
- `dashboards_food-insecurity` 41.8 KB — within range
- `dashboards_nonprofit-profile` 36.5 KB — within range
- All others 8–21 KB — OK

---

## Findings

**[P1] ECharts chunk 21% over budget (778 KB vs 645 KB)**  
Evidence: `dist/assets/echarts-N6UFC3T6.js` = 778,274 bytes (252.6 KB gzip vs 210 KB budget). Budget was set for ECharts v5.4; current version likely includes additional chart types or renderers pulled in via tree-shaking gaps.  
Recommendation: Run `npm run analyze:bundle` to identify which ECharts sub-modules are imported. Audit `src/js/dashboards/*.js` imports — ensure only used chart types and components are imported from `echarts/core` rather than the full package. Check if any dashboard imports `echarts` directly instead of the tree-shaken path.

**[P1] CSS bundle 15% over budget (144 KB vs 125 KB)**  
Evidence: `dist/assets/main-Bi9q5ota.css` = 144,449 bytes. Dominant source is `src/css/critical-gradients.css` at 73.5 KB raw — the single largest file, accounting for ~51% of source CSS. Gzipped (23.4 KB) is also 17% over the 20 KB budget.  
Recommendation: Audit `critical-gradients.css` for duplicate gradient declarations, unused animation keyframes, or vendored prefix redundancy. Autoprefixer may be duplicating already-prefixed rules. Consider splitting infrequently-used gradient variants into a lazy-loaded stylesheet.

**[P2] Sentry SDK bundles all integrations including Session Replay, BrowserTracing, Feedback, and Profiling (425 KB / 138 KB gzip)**  
Evidence: `dist/assets/index-B3RYPSBH.js` = 425,317 bytes. Node confirms `maskAllText`, `browserTracingIntegration`, `feedbackIntegration`, and `browserProfilingIntegration` are all present. `@sentry/browser` v10.17.0 bundles these by default. The `sentry.js` source at `/src/js/monitoring/sentry.js:32` uses `await import('@sentry/browser')` — Rollup resolves this as a static import and bundles the full SDK.  
The `replaysSessionSampleRate: 0.1` config at `sentry.js:46` causes the Replay integration to be included even though it is not explicitly imported as a separate integration. `@sentry/browser` v10 auto-registers default integrations.  
This chunk is not referenced by any HTML page directly — it is a dynamic import from `main-Ce63eOv4.js` which is loaded on every page. All 72 pages therefore carry a 138 KB gzip dependency for error monitoring.  
Recommendation: Either (a) switch to `@sentry/browser`'s tree-shakeable build by importing only `Sentry.init` + `captureException` from `@sentry/core` with explicit integration opt-in, removing `replaysSessionSampleRate` unless Replay is intentionally used; or (b) add `@sentry/browser` to `manualChunks` in `vite.config.js` so it is isolated and can be evaluated for lazy-loading. Option (a) would likely reduce this chunk by 200–300 KB.

**[P3] SLDS CSS loaded synchronously on all pages (render-blocking)**  
Evidence: `dist/index.html:69` — `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/...salesforce-lightning-design-system.min.css">` is a synchronous external stylesheet with no `media` query or `preload`/`print` trick. On slow connections this blocks first paint. Same pattern in `dist/dashboards/executive-summary.html:62`.  
Recommendation: This is a known architectural constraint (CLAUDE.md: `@layer` blocked by SLDS CDN). No action required unless CLS/LCP targets are missed. Document as accepted technical debt.

**[P3] Google Fonts render-blocking on all pages**  
Evidence: `dist/index.html:67` — Orbitron font loaded via standard `<link rel="stylesheet">` without `font-display: swap` override from the URL. This is a render-blocking external resource for a display font used only in the logo.  
Recommendation: Append `&display=swap` to the Google Fonts URL in `build-components.js` if not already present, or add `font-display: swap` in the local CSS override. Low impact given Orbitron is decorative-only.

---

## Code Splitting Verification

- ECharts: loaded only on dashboard pages via `<link rel="modulepreload">` in dashboard HTML (confirmed `dist/dashboards/executive-summary.html:67`). Not present in `dist/index.html`. CORRECT.
- D3: same pattern — not in non-dashboard pages. CORRECT.
- Sentry (`index-B3RYPSBH.js`): dynamically imported from `main.js` via `await import('@sentry/browser')` at runtime. Not injected as a `<script>` tag in any HTML. Lazy-loading is working. However the full SDK including Replay/Profiling/Feedback is still fetched on first interaction due to `initSentry()` running unconditionally at startup.

---

## Images / Assets

All SVG illustrations in `dist/assets/images/` are under 15 KB each (largest: 14.6 KB). No unoptimized raster images detected. No PNGs or JPEGs in the critical path.

---

## Summary

Two budget overruns require attention: the ECharts chunk (+21%) and CSS bundle (+15%). The Sentry SDK is the largest untracked asset at 425 KB / 138 KB gzip — it lazy-loads correctly but bundles every Sentry integration by default, adding unnecessary weight to every page session. No render-blocking JS issues; all module scripts use `type="module"` (deferred by spec).
