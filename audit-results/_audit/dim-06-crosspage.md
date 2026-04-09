# Dimension 6: Cross-Page Consistency Audit
**Date**: 2026-04-09
**Pages scanned**: 8 dashboard pages, 10 root pages, 53 blog articles, sitemap.xml, build-components.js
**Issues found**: 5

---

## Navigation

**[P3] chart-preview.html receives nav injection but is not in build-components dashboardPages**
- Evidence: `build-components.js:280` lists 8 dashboardPages — `chart-preview` is absent. Yet `dashboards/chart-preview.html:67` shows `<!-- Navigation -->` was injected at some point (likely manually authored). The file is in `dashboards/` so Vite auto-discovers it (`vite.config.js:17`), but build-components will never update its nav/footer/tabs on future runs.
- Recommendation: Either add `chart-preview` to the `dashboardPages` array in `build-components.js:280`, or confirm it is intentionally a standalone dev-only page and document that exception.

**[P3] chart-preview.html is included in .pa11yci.json but has no nav/footer from build-components**
- Evidence: `.pa11yci.json:83` includes `chart-preview.html` in accessibility tests. Since build-components never processes it, any nav a11y regressions won't be caught consistently.
- Recommendation: Remove from pa11y if it's a dev tool, or add to build-components processing.

---

## SEO Meta Tags

**[P2] Unescaped `&` in food-prices.html `<title>` and `og:title`**
- Evidence: `dashboards/food-prices.html:6` — `<title>Food Prices & Affordability Dashboard</title>` and line 18 `og:title` use bare `&` instead of `&amp;`. Compare food-access (`&amp;`) and snap-safety-net (`&amp;`) which are correctly encoded.
- Recommendation: Change both to `Food Prices &amp; Affordability Dashboard` in `dashboards/food-prices.html:6` and `:18`.

**[P3] JSON-LD schema inconsistency: executive-summary and food-insecurity use `"about"`, other 6 dashboards use `"isPartOf"`**
- Evidence: `dashboards/executive-summary.html` and `dashboards/food-insecurity.html` have `"about": {"@type": "Thing", ...}` with no `"isPartOf"`. All other dashboards use `"isPartOf": {"@type": "WebSite", ...}` with no `"about"`.
- Recommendation: Standardize all 8 dashboards to use `"isPartOf"` (the more semantically appropriate property for sub-pages). Add `"isPartOf"` to executive-summary and food-insecurity JSON-LD blocks.

---

## Sitemap

**[P1] nonprofit-profile.html has `robots: noindex` but is still reachable via canonical and `og:url` — sitemap correctly excludes it. Confirmed correct.**
- No action needed.

**[P3] sitemap.xml dashboard `lastmod` dates are static (2026-04-05) rather than reflecting actual file modification dates**
- Evidence: `sitemap.xml:380-417` — all dashboards show `2026-04-05` regardless of subsequent changes. The sitemap generator (`scripts/generate-sitemap.js:47`) uses `new Date().toISOString()` for blog articles but the dashboard entries come from the static `dashboardPages` array, so `lastmod` only updates when `npm run generate:sitemap` is re-run.
- Recommendation: Low priority; re-run `node scripts/generate-sitemap.js` after dashboard changes. Consider automating in CI.

---

## Link Integrity

All internal `href` targets verified present:
- Dashboard tab links in `build-components.js:153-166` all point to existing `dashboards/*.html` files.
- `nonprofit-profile.html:147,241` back-links to `nonprofit-directory.html` — file exists.
- Footer and nav links in `build-components.js:115-129` all point to existing root pages.
- No `foodnforce.com` (wrong domain) found in any HTML or sitemap — all canonical/OG URLs correctly use `food-n-force.com`.

---

## Build Config Registration

- `vite.config.js`: Auto-discovers via glob — all pages including `chart-preview` picked up automatically. No gaps.
- `build-components.js`: `chart-preview` absent from `dashboardPages` array (see P3 above).
- `scripts/generate-sitemap.js`: Correctly excludes `nonprofit-profile` and `chart-preview` (neither in static lists).
- `.pa11yci.json`: Includes `chart-preview` — see P3 note above.
- Blog articles: 53 files on disk, 53 in sitemap — exact match. No orphans or missing entries.

---

## Summary Table

| ID | Severity | File | Line | Issue |
|----|----------|------|------|-------|
| 1 | P2 | `dashboards/food-prices.html` | 6, 18 | Unescaped `&` in `<title>` and `og:title` |
| 2 | P3 | `dashboards/executive-summary.html` | JSON-LD block | Uses `"about"` not `"isPartOf"` (inconsistent with 6 peers) |
| 3 | P3 | `dashboards/food-insecurity.html` | JSON-LD block | Uses `"about"` not `"isPartOf"` (inconsistent with 6 peers) |
| 4 | P3 | `build-components.js` | 280 | `chart-preview` absent from dashboardPages — nav/footer/tabs will never be auto-updated |
| 5 | P3 | `sitemap.xml` | 377-417 | Dashboard `lastmod` dates stale; not auto-updated on changes |
