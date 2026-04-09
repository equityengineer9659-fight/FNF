# Dimension 12: Browser Compatibility Audit
**Date**: 2026-04-09
**Scope**: Cross-browser static analysis — CSS fallbacks, JS APIs, SVG rendering, Playwright config

---

## Issues Found

**[P1] Missing `-webkit-backdrop-filter` on most glassmorphism declarations**
Evidence: `src/css/11-dashboards.css:135,175` add `-webkit-backdrop-filter`, but the 30+ other `backdrop-filter` declarations across `06-effects.css`, `07-components.css`, `08-icons.css`, `critical-gradients.css`, and `12-nonprofit-directory.css` do NOT include the vendor-prefixed version. Safari required `-webkit-backdrop-filter` until Safari 18 (released 2024-09). Users on Safari 15–17 (still ~8% of iOS) see no glass blur on cards, nav, hero sections, or blog cards.
Recommendation: Add `-webkit-backdrop-filter` immediately before every unprefixed `backdrop-filter` rule. The two existing prefixed instances in `11-dashboards.css` confirm this is the intended pattern — it just wasn't applied globally.

**[P2] `AbortController` `signal` option for `addEventListener` — Firefox < 87 / Safari < 15**
Evidence: `src/js/effects/particles.js:107-109`, `src/js/effects/smart-scroll.js`, `src/js/effects/blog-filter.js`, `src/js/main.js:60`. All use `addEventListener(..., { signal })` for cleanup. This API landed in Safari 15.0 (2021) and Firefox 87 (2021). If the minimum browser bar is Safari 15+ / Firefox 87+, this is acceptable — confirm the support matrix.
Recommendation: Document the minimum browser requirement. If Safari 14 must be supported, replace with manual `removeEventListener` cleanup.

**[P2] D3 heatmap `dominant-baseline: central` — Firefox/IE SVG rendering**
Evidence: `src/js/dashboards/shared/d3-heatmap.js:231,241,250`. `dominant-baseline="central"` has historically rendered inconsistently in Firefox (treated as `auto` pre-Firefox 93). All tile labels and value text use this for vertical centering. In older Firefox, SVG text will appear misaligned within tiles.
Recommendation: Add `dy="0.35em"` as a fallback alongside `dominant-baseline="central"` on the `.attr()` chain. This is the canonical cross-browser SVG text centering technique.

**[P2] CSS `filter: brightness() drop-shadow()` on SVG rects — Safari compositing**
Evidence: `src/js/dashboards/shared/d3-heatmap.js:201`. On tile hover, `filter: brightness(1.15) drop-shadow(0 0 12px rgba(255,255,255,0.08))` is applied to `<rect>` elements. Safari has known bugs with CSS `filter` applied to individual SVG elements (not the SVG root), particularly when combined with `clip-path` or nested `<g>`. The brightness effect may flash or not render on Safari.
Recommendation: Apply the hover `filter` to the parent `<g>` element (`tg`) rather than the individual `rect`, or use a `fill-opacity` transition as the fallback.

**[P3] `performance.now()` referenced but `fps` metric never populated**
Evidence: `src/js/effects/particles.js:31-33`. `this.lastFrameTime`, `this.frameCount`, and `this.fps` are initialized but `fps` is never updated in the `update()` loop (no frame-time delta calculation). The `getStats()` method at line 307 returns stale `fps: 60`. Not a crash but misleads any monitoring consumer.

**[P3] Playwright firefox-mobile uses explicit viewport instead of `devices` preset**
Evidence: `tools/testing/playwright.config.js:59-64`. Firefox-mobile intentionally skips `devices['iPhone 14 Pro Max']` (which uses `userAgent` + `deviceScaleFactor`) and instead sets only `viewport + hasTouch`. This is per-memory (`project_mobile_playwright_failures.md`): the `devices` preset caused 100 failures. The explicit viewport approach means Firefox mobile tests run without a mobile `userAgent` string — server-side UA sniffing (if any) would serve desktop content to this test project. Current PHP proxies do not appear to UA-sniff, so this is low risk.

---

## Coverage: No Issues Found

- **CSS nesting / `:has()` / container queries / `color-mix()`**: None used anywhere in `src/css/`.
- **Canvas 2D API** (`getContext('2d')`, `clearRect`, `arc`, `beginPath`, `stroke`, `fill`, `requestAnimationFrame`): All standard, universally supported since IE9+. `prefers-reduced-motion` guard at `particles.js:52` prevents canvas creation entirely on reduced-motion devices.
- **ECharts**: No browser-specific quirks flagged in dashboard JS; ECharts itself handles cross-browser SVG/Canvas rendering internally.
- **`@supports` for backdrop-filter**: Not present, but acceptable — the visual degradation (no blur) is graceful since background colors remain intact.
