# Dimension 13: Data Pipeline & Build Integrity Audit
Date: 2026-04-09

---

## Findings

**[P1] 404.html excluded from build-components.js injection**
Evidence: `build-components.js:252-268` — `corePages` array contains `['index','about','services','resources','impact','contact','blog']` + `hubPages = ['case-studies','templates-tools']`. `404.html` is absent. Nav/footer in `404.html` will go stale on any future nav link change.
Recommendation: Add `'404'` to `corePages` in `build-components.js:252`.

**[P1] Lighthouse CI tests dev server (source), not built dist**
Evidence: `tools/testing/lighthouserc.json:19` — `"startServerCommand": "npm run dev"`. `npm run dev` serves unbuilt source via Vite's dev server. Playwright correctly uses `npm run build && npm run preview` (`tools/testing/playwright.config.js`). Lighthouse scores may differ from production due to absence of Terser minification, tree-shaking, and hashed assets.
Recommendation: Change `startServerCommand` to `"npm run build && npm run preview"` and `startServerReadyPattern` to `"Local:"`.

**[P2] npm node_modules caching disabled in both CI workflows**
Evidence: `ci-cd.yml:29` and `weekly-a11y-sweep.yml` — `cache: ''` on `actions/setup-node`. Full `npm install` runs every pipeline execution, adding ~30-60s and consuming bandwidth unnecessarily.
Recommendation: Set `cache: 'npm'` on both `setup-node` steps.

**[P2] chart-preview.html built and deployed to production but excluded from sitemap and pa11y nav injection**
Evidence: `dashboards/chart-preview.html:7` — has `noindex,nofollow` meta tag, so SEO is intentionally excluded. However, `build-components.js:280` processes `dashboardPages` as a hardcoded list that excludes `chart-preview`. The file is picked up by `vite.config.js:17` glob (`dashboards/*.html`) and deployed to `dist/dashboards/chart-preview.html`. `generate-pa11y-config.js:39` uses glob so it IS picked up for pa11y testing. Nav injection will be stale on this page.
Recommendation: Either add `'chart-preview'` to `dashboardPages` in `build-components.js:280`, or move the file outside `dashboards/` to prevent glob pickup by Vite.

**[P2] nonprofit-profile missing from sitemap**
Evidence: `scripts/generate-sitemap.js:35-43` — `dashboardPages` array hardcodes 7 dashboard URLs; `dashboards/nonprofit-profile.html` is absent. The page exists, is built, and is deployed, but will not be indexed by search engines.
Recommendation: Add `{ path: 'dashboards/nonprofit-profile.html', priority: '0.7', changefreq: 'monthly' }` to `dashboardPages` in `generate-sitemap.js:35`.

**[P2] form PHP endpoints missing from Vite dev proxy**
Evidence: `vite.config.js:83-150` — proxy table covers 10 dashboard API endpoints but omits `/api/csrf-token.php`, `/api/contact.php`, `/api/newsletter.php`. These are called from `src/js/effects/contact-form.js:3`, `src/js/effects/newsletter-popup.js`, and `src/js/main.js`. During local development, form submissions and CSRF token fetch will 404.
Recommendation: Add proxy entries for `/api/csrf-token.php`, `/api/contact.php`, `/api/newsletter.php` targeting `https://food-n-force.com` in `vite.config.js`.

**[P3] lighthouserc.json missing nonprofit-directory and nonprofit-profile dashboards**
Evidence: `tools/testing/lighthouserc.json:6-17` — 12 URLs total; `nonprofit-directory` and `nonprofit-profile` are absent despite being production dashboards (Phase 15 added them per memory notes).
Recommendation: Add `http://localhost:4173/dashboards/nonprofit-directory.html` and `http://localhost:4173/dashboards/nonprofit-profile.html` to the `url` array.

**[P3] Actions pinned to non-existent major versions (v5/v6)**
Evidence: `ci-cd.yml:22` — `actions/checkout@v6`; `ci-cd.yml:25` — `actions/setup-node@v5`; `ci-cd.yml:61` — `actions/upload-artifact@v5`; `ci-cd.yml:79` — `actions/download-artifact@v5`. As of knowledge cutoff (Aug 2025), latest stable is `checkout@v4`, `setup-node@v4`, `upload-artifact@v4`, `download-artifact@v4`. These versions may not resolve.
Recommendation: Downgrade to `@v4` for all four actions or verify v5/v6 exist in the marketplace.

---

## Verified Safe

- `build-components.js`: Auto-discovers blog articles via `glob.sync('*.html', {cwd: blog/})` — no hardcoded list.
- `scripts/sync-blog.js`: Auto-discovers via glob, sorts by `datePublished` descending, atomic write via `.tmp` rename. Correctly skips non-article HTML.
- `scripts/generate-sitemap.js`: Blog articles auto-discovered via glob. Runs before `build-components.js` in build order — no dependency conflict.
- `scripts/generate-pa11y-config.js`: Dashboard URLs from `glob.sync('*.html', {cwd: dashboards/})` — picks up all 9 including `chart-preview`. Blog sample mode correctly randomized.
- `vite.config.js`: Discovers all 72 HTML entry points via three globs (root, blog/, dashboards/). `manualChunks` correctly isolates echarts, d3, and effects bundles.
- Build script order in `package.json`: `generate-sitemap → sync-blog → build-components → vite build` — correct; sitemap and card grid are stable before components inject nav/footer; Vite builds the final output.
- `public/.htaccess`: HTML `no-store, no-cache`; CSS/JS `max-age=31536000, immutable`. Caching rule enforced correctly.
- `dist/` output: 53 blog articles, 9 dashboard pages, all core pages present. No missing assets detected.
- `.pa11yci.json` count: 71 URLs (9 core+hub + 53 blog + 9 dashboards) — matches filesystem exactly when generated in full mode.
- CI deploy: `rsync --delete` scoped to `dist/` only; `_config.php` written via scp with secrets never echoed in shell args; health check retries 6x with 15s intervals; LiteSpeed + Memcached cache flush included.
