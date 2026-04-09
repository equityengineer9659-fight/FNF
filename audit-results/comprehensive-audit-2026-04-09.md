# COMPREHENSIVE DASHBOARD AUDIT — 2026-04-09

**Scope**: 16 dimensions × 8 dashboards × 55 charts × 72 pages
**Method**: 18 parallel Sonnet subagents (Round 1 only — no conflicts required reconciliation)
**Baseline**: 521/521 unit tests pass, `npm run build` clean (28s)
**Branch**: `chore/final-audit-of-dashboards`
**Orchestrator**: Opus 4.6
**Per-agent scratch files**: `audit-results/_audit/dim-XX-*.md`

---

## Executive Summary

**Overall posture: YELLOW** — production is in a solid place after 15 phases of prior work. No P0 items block the next deploy *functionally*, but two configuration-level issues (`_headers` HTML caching, unresolved GitHub Actions versions) are P0 because they will cause hard failures the moment they're touched.

- **P0 critical**: 4 items (all configuration/infra, not user-facing bugs)
- **P1 major**: ~32 items (production code, accessibility, bundle, tests, content)
- **P2 minor**: ~40 items
- **P3 backlog**: ~25 items

**Best news**: Zero regressions of prior audit fixes. Phase 15 PHP security hardening holds up cleanly. Data freshness is strong — all JSON files are current (2024-2026). Glassmorphism/logo/particle protections were respected by every agent.

**Main themes**:
1. **Accessibility polish** — focus-visible gaps on tabs & back buttons, missing aria-live on 1 container, `-webkit-backdrop-filter` missing on 30+ rules.
2. **Bundle growth** — ECharts and CSS both exceeded their budgets (+21% / +15%).
3. **CI pipeline fragility** — four GitHub Actions references point to versions that don't exist; Lighthouse CI runs against unbuilt dev source; `scp _config.php` is silent on failure.
4. **Test quality, not quantity** — several test files are dominated by source-string scans rather than behavioral assertions.
5. **Content currency drift** — several dashboards still label 2022 data without noting vintage; a few "FY2024" labels overstate precision.

---

# Dimension 1 — Data Accuracy & Freshness

**Status**: YELLOW
**Scratch**: [dim-01-data-analytics.md](_audit/dim-01-data-analytics.md)

### Findings
1. **[P1] Sankey hardcodes 44.2M food-insecure (2022 figure) as present tense** — Evidence: `dashboards/snap-safety-net.html`. 2024 national total is 47.9M. Recommendation: add `(2022)` vintage qualifier or recompute from 2024.
2. **[P1] 10.5M with no assistance and 12.7M in food crisis** — Evidence: `dashboards/snap-safety-net.html`. Prose figures with no vintage qualifier.
3. **[P1] Demographic flow source still cites discontinued USDA ERS race-disaggregated series** — Evidence: `dashboards/snap-safety-net.html`. No note that series was terminated. Recommendation: add "(discontinued 2024)" label.
4. **[P1] Cost Burden chart labeled Data Year: 2022** — Evidence: `dashboards/food-prices.html`. No indication whether newer vintage exists.
5. **[P2] bls-food-cpi.json has null gap at October 2025** — BLS should have published; refresh static fallback.
6. **[P2] DC food bank density (35.9/100K) likely exceeds visualMap ceiling** — check `renderRevenue()` bounds.
7. **[P2] County child rate multiplier: PHP says 1.4x, HTML says 1.3-1.6x** — `public/api/dashboard-census.php` vs `dashboards/food-insecurity.html`.
8. **[P2] food-insecure persons state sum -12.8% gap vs national** — documented reconciliation note; code risk if future JS sums state records.

---

# Dimension 2 — Analytical Integrity

**Status**: YELLOW
**Scratch**: [dim-02-data-scientist.md](_audit/dim-02-data-scientist.md)

### Findings
1. **[P1] Scatter insight hardcodes "#1 predictor" unconditionally** — `src/js/dashboards/food-insecurity.js:737`. Editorial superlative survives regardless of live r-value.
2. **[P1] SNAP bar legend hardcodes "FY2024" but data is Feeding America 2023 model estimates** — `food-insecurity.js:908`. Overstates precision.
3. **[P1] "3x more likely" unemployment claim with no inline citation** — `food-insecurity.js:1057`. Static SDOH insight asserts a specific multiplier not derived from displayed data.
4. **[P2] Triple Burden "/300" denominator unexplained** — `food-insecurity.js:1486`. Composite scores appear as "247/300" with no note explaining the three-component 0-100 scale.
5. **[P3] "driven by" causal framing on Sankey insight** — `snap-safety-net.js:724`. Modeled flow data cannot support causal verb; should say "associated with".

**Passed**: CHR2025 county data, regression suppression, reconciliation notes, Sankey methodology disclosure all verified correct.

---

# Dimension 3 — PHP Security & API Contracts

**Status**: GREEN
**Scratch**: [dim-03-php-security.md](_audit/dim-03-php-security.md)

### Findings
1. **[P2] EIN validation inconsistency** — `public/api/charity-navigator.php:49` accepts EIN ≥2 digits; `nonprofit-org.php:29` correctly requires exactly 9. Risk: malformed EINs in cache keys / upstream calls.
2. **[P3] Form endpoints don't include `_cors.php`** — `contact.php`, `newsletter.php`, `csrf-token.php`. CSRF mitigates exploitation but cross-origin form submission is not origin-restricted.
3. **[P3] `cache-cleanup.php:19-20` fail-open** — if `CLEANUP_TOKEN` is undefined (commented out in `_config.php`), `hash_equals('', '')` → `true`. Add fail-closed guard.

**Passed**: no `md5()`, no leaked API keys, sha256 cache keys, CSRF tokens correct, 60s rate limiting, `_config.php` gitignored, `_cache/` blocked via `.htaccess`, CSP correctly configured. All 11 proxy endpoints properly CORS-restricted with GET method guards.

---

# Dimension 4 — Accessibility (WCAG 2.1 AA)

**Status**: YELLOW
**Scratch**: [dim-04-accessibility.md](_audit/dim-04-accessibility.md)
**Note**: Static analysis only — pa11y-ci couldn't run locally (Chrome not installed).

### Findings
1. **[P1] `#help-search-status` missing `aria-live`** — `dashboards/nonprofit-directory.html:210`. Geo-search status written by JS; screen readers won't announce geocoding progress/errors.
2. **[P1] `.dashboard-tabs__tab` has no `:focus-visible` outline** — `src/css/11-dashboards.css`. Keyboard users tabbing through dashboards get no visible focus indicator.
3. **[P1] `.dashboard-back-btn` has no `:focus-visible` style** — `src/css/11-dashboards.css:246`. Back-to-national button has only `:hover`.
4. **[P2] `dashboard-insights__card-title` uses `<div>` instead of `<h3>`** — all 8 dashboards (e.g. `executive-summary.html:296`). Breaks heading outline under `<h2>` sections.
5. **[P2] `role="region"` containers without `aria-label`** — `food-access.html:362,364` (`#chart-double-burden`, `#chart-double-burden-tiles`).
6. **[P2] `.fnf-nav__link` desktop nav has no `:focus-visible`** — `src/css/03-navigation.css:51`.
7. **[P2] Animated KPI counters set `role="status"` dynamically** — `src/js/dashboards/shared/dashboard-utils.js:164`. Should be static in HTML.
8. **[P3] `title` tooltips unreachable by keyboard/touch** — `dashboards/executive-summary.html:169,173`. Methodology context buried in `title` attr.

**Passed**: all `<main tabindex="-1">`, all chart `role="img"` + `aria-label`, county combobox full ARIA pattern, D3 heatmap breadcrumbs keyboard-accessible, `prefers-reduced-motion` respected in CSS + JS, `aria-current="page"` on nav correct.

---

# Dimension 5 — UI/UX Visual Consistency

**Status**: GREEN
**Scratch**: [dim-05-uiux.md](_audit/dim-05-uiux.md)

### Findings
1. **[P2] Counter animation overwrites static text on nonprofit-directory** — `dashboards/nonprofit-directory.html:149,153` uses `data-format="thousand/plus"` attributes that `animateCounters()` in `src/js/dashboards/shared/dashboard-utils.js:128` does not recognize. After animation, "60K+" / "50+" will be replaced by "60" / "50". Fix: replace with `data-suffix="K+"` / `data-suffix="+"`.
2. **[P2] Executive-summary legend uses `COLORS.textMuted` instead of `COLORS.text`** — `src/js/dashboards/executive-summary.js:159`. SNAP coverage gap legend at 65% opacity, visibly dimmer than other dashboards.
3. **[P2] SNAP gauge containers use inline `style="height:200px"` without min-height** — `dashboards/snap-safety-net.html:364-376`.
4. **[P3] Legend font sizes inconsistent (10px/11px/unset) across dashboards** — standardize or extract shared `LEGEND_TEXT_STYLE` constant.

**Passed**: color palette, tooltip styles, freshness badges, `aria-current` on tabs all applied uniformly.

---

# Dimension 6 — Cross-Page Consistency

**Status**: GREEN
**Scratch**: [dim-06-crosspage.md](_audit/dim-06-crosspage.md)

### Findings
1. **[P2] Unescaped `&` in `dashboards/food-prices.html` lines 6 and 18** — bare `&` in `<title>` and `og:title`. HTML validity violation. Other dashboards correctly use `&amp;`.
2. **[P3] JSON-LD schema split** — `executive-summary.html` + `food-insecurity.html` use `"about": {"@type": "Thing"}`; the other 6 use `"isPartOf": {"@type": "WebSite"}`. Standardize on `isPartOf`.
3. **[P3] `chart-preview.html` absent from `build-components.js:280` dashboardPages** — Vite + pa11y include it, but nav/footer injection will go stale. Document as intentional dev-only tool or add.
4. **[P3] Sitemap dashboard `lastmod` dates stale at 2026-04-05** — `public/sitemap.xml:377-417`.

**Passed**: canonical URLs on `food-n-force.com` throughout (zero `foodnforce.com` leaks), blog article count (53) = sitemap count, `nonprofit-profile` correctly noindexed + excluded from sitemap.

---

# Dimension 7 — Performance & Bundle Size

**Status**: RED
**Scratch**: [dim-07-perf.md](_audit/dim-07-perf.md)

### Findings
1. **[P1] ECharts chunk 21% over budget** — 778KB vs 645KB budget. Tree-shaking gaps likely. Recommendation: run `npm run analyze:bundle`; ensure all dashboard files import from `echarts/core` with explicit component registration.
2. **[P1] CSS bundle 15% over budget** — 144KB vs 125KB. Primary driver: `src/css/critical-gradients.css` at 73.5KB raw (51% of total CSS source). Audit for duplicate gradients, redundant keyframes, double-prefixing.
3. **[P2] Sentry SDK bundles Session Replay + BrowserTracing + Feedback + Profiling (~425KB / 138KB gzip)** — `src/js/monitoring/sentry.js:32`. Lazy-loaded correctly but full SDK loads at startup. Switching to `@sentry/core` with explicit integration opt-in would save ~200-300KB.
4. **[P3] SLDS and Google Fonts render-blocking** — accepted architectural constraint per CLAUDE.md; document as known debt.

**Passed**: ECharts + D3 correctly isolated to dashboard pages only; Sentry lazy-loads via dynamic import.

---

# Dimension 8 — SEO & Structured Data

**Status**: GREEN
**Scratch**: [dim-08-seo.md](_audit/dim-08-seo.md)

### Findings
1. **[P2] Author meta inconsistency on 2 root pages** — `case-studies.html:11` and `templates-tools.html:11` still say "Food-N-Force Team" instead of "Food-N-Force". Phase 15 missed these.
2. **[P2] Descriptions over 160 chars** — `executive-summary.html:9` (183 chars) and `food-insecurity.html:9` (179 chars) will be SERP-truncated.
3. **[P3] No `Dataset` JSON-LD schema on data dashboards** — all 8 use `WebPage` only. Adding a secondary `Dataset` type unlocks rich results eligibility on the 5 data-heavy dashboards.
4. **[P3] Short titles** — `nonprofit-directory.html` (34 chars) and `nonprofit-profile.html` (35 chars) under the 50-char target.

**Passed**: canonical domain, sitemap indexable/excluded lists, OG/Twitter tags, exactly 1 H1 per page.

---

# Dimension 9 — Error Handling & Resilience

**Status**: YELLOW
**Scratch**: [dim-09-resilience.md](_audit/dim-09-resilience.md)

### Findings
1. **[P1] `_stale` flag silently mis-reported as "Live"** — `src/js/dashboards/shared/dashboard-utils.js:200`. All 12 proxies set `_stale: true` when serving cached data after upstream failure, but `updateFreshness()` has no `_stale` branch. Fix: add `_stale` → "Cached" state.
2. **[P1] Error banner only on Executive Summary** — `dashboards/executive-summary.html:163`. The other 5 data dashboards (food-insecurity, food-access, snap, food-prices, food-banks) write error text directly into chart containers with no `role="alert"` region.
3. **[P3] County drill-down catch in food-access.js fully silent** — `src/js/dashboards/food-access.js:1625-1627`. On county GeoJSON fetch failure, `hideLoading()` runs but map silently reverts to empty with no user message or fallback.

**Passed**: Executive Summary error banner works, SDOH "Social determinants data unavailable" fallback works, all non-blocking API calls use correct silent-catch pattern, `fetchWithFallback()` handles live-API failure, Nonprofit Profile has a proper `showError()` path.

---

# Dimension 10 — Test Coverage & Quality

**Status**: YELLOW
**Scratch**: [dim-10-tests.md](_audit/dim-10-tests.md)

### Findings
1. **[P1] `networkidle` present in 3 Playwright specs** — banned pattern that caused 146 prior CI failures (see memory `project_mobile_playwright_failures.md`). Still in `tools/testing/tests/dashboard-smoke.spec.js:68`, `contact-form.spec.js`, `critical-navigation-smoke-test.spec.js`. Replace with `waitForSelector` / `toBeVisible`.
2. **[P1] Source-scan dominance in dashboard test files** — 57-119 `readFileSync`/`jsSource` occurrences per file. Tests assert code was *written* a certain way, not that it *behaves* correctly. Dead weight: `food-insecurity.test.js:267` (`toContain('currentMetric] ??')`), `food-prices.test.js:343-350` (entire `renderHomeVsAway` suite is 2 source-string checks).
3. **[P1] `renderPriceImpact` (`src/js/dashboards/executive-summary.js:205`) has no behavioral test** — `food-prices.test.js:337` describes a "data contract" but only reads source file.
4. **[P1] Cross-dataset null path untested** — `src/js/dashboards/food-insecurity.js:1670-1680`. `renderTripleBurden(data, null)` is reachable via `.catch(() => null)` with zero coverage.
5. **[P2] Zero interactive-feature Playwright coverage** — no spec exercises map-view-toggle, Double Burden mode toggle, county drill-down, back-button navigation.
6. **[P2] Nonprofit Profile absent from Playwright smoke matrix** — `tools/testing/tests/dashboard-smoke.spec.js:9-17` lists 7; profile page with 6 ECharts untested.
7. **[P2] PHP proxy error paths untested** — `src/js/dashboards/php-security.test.js` covers security surface only; no upstream non-200 / rate-limit / cache-stale tests.
8. **[P2] Tooltip formatters untested at runtime** — `food-access.test.js`, `food-banks.test.js`, `food-prices.test.js` have zero runtime tooltip tests.
9. **[P2] `norm(5,5,5)` NaN documented but not guarded** — `food-insecurity.test.js:286` asserts `toBeNaN()` as "edge case"; no corresponding test verifies production guard.
10. **[P3] No mobile-specific rendering assertions** — CI runs mobile viewports but `dashboard-smoke.spec.js` has no viewport-conditional assertions.

---

# Dimension 11 — Code Quality & Maintainability

**Status**: YELLOW
**Scratch**: [dim-11-code-quality.md](_audit/dim-11-code-quality.md)

### Findings
1. **[P1] `renderMap` in `src/js/dashboards/food-insecurity.js:18-312` is 295 lines** — single closure doing tooltip formatting, drill-down state, and event wiring. Natural split points are already-named inner functions (`stateTooltip`, `countyTooltip`, `showNational`).
2. **[P1] `snapTrendDates` in `src/js/dashboards/snap-safety-net.js:18` is a write-only dead variable suppressed by `eslint-disable`** — delete it.
3. **[P1] `snap-safety-net.js:194` `'cdc'` branch may be unreachable** — `snapMapActiveView` CDC toggle button may have been removed from HTML; verify and delete dead branch if so.
4. **[P2] `init` in `src/js/dashboards/food-access.js` is 232 lines**.
5. **[P2] `renderDesertMap` in `food-access.js` is 194 lines**.
6. **[P2] `getOrCreateChart` defined locally** rather than in `dashboard-utils.js` shared module.
7. **[P2] `window._fnfStateData` used as cross-function data bus inside a single module** — should be module-scope `let`.
8. **[P2] `REGION_COLORS` vs `HEATMAP_REGION_COLORS` — two region color maps undocumented** (may be deliberate).
9. **[P3] State selector UI widget lives in `dashboard-utils.js`** — should move to a dedicated module.
10. **[P3] `initStateSelector` injects `style=""` HTML attributes** — CSP concern (although CLAUDE.md says CSSOM assignment is allowed; inline `style` attributes are blocked). Verify.
11. **[P3] `createD3Heatmap` lacks a parameter schema comment**.

**Passed**: no TODO/FIXME/HACK comments, no commented-out blocks, no circular dependencies.

---

# Dimension 12 — Browser Compatibility

**Status**: YELLOW
**Scratch**: [dim-12-browser.md](_audit/dim-12-browser.md)

### Findings
1. **[P1] 30+ `backdrop-filter` declarations missing `-webkit-backdrop-filter`** — `src/css/06-effects.css`, `07-components.css`, `08-icons.css`, `critical-gradients.css`, `12-nonprofit-directory.css`. Only two declarations in `11-dashboards.css` carry the vendor prefix. Safari 15-17 users (~8% iOS) see no glassmorphism blur. **NOTE**: adding `-webkit-backdrop-filter` is NOT a visual regression — it restores the intended effect to Safari users. Safe under glassmorphism protection rule.
2. **[P2] `AbortController` `{ signal }` for `addEventListener`** — used in `src/js/effects/particles.js`, `smart-scroll.js`, `blog-filter.js`, `main.js`. Requires Safari 15+ / Firefox 87+. Document min browser target.
3. **[P2] D3 heatmap `dominant-baseline="central"` without `dy="0.35em"` fallback** — `src/js/dashboards/shared/d3-heatmap.js:231,241,250`. Firefox pre-93 misalignment.
4. **[P2] Tile hover `filter: brightness() drop-shadow()` applied to SVG `<rect>`** — `d3-heatmap.js:201`. Safari compositing bugs; target parent `<g>` instead.
5. **[P3] `fps` field in `ParticleSystem.getStats()` always stale** — never updated in animation loop.

**Passed**: no CSS nesting, `:has()`, container queries, or `color-mix()` detected.

---

# Dimension 13 — Data Pipeline & Build Integrity

**Status**: YELLOW
**Scratch**: [dim-13-pipeline.md](_audit/dim-13-pipeline.md)

### Findings
1. **[P1] `404.html` absent from `corePages` in `build-components.js:252`** — nav/footer will go stale on any future navigation change. Fix: add `'404'` to array.
2. **[P1] `tools/testing/lighthouserc.json:19` uses `npm run dev`** — Lighthouse CI scores reflect unbuilt source. Fix: change to `"npm run build && npm run preview"`; update `startServerReadyPattern` to `"Local:"`.
3. **[P2] `scripts/generate-sitemap.js:35` missing `nonprofit-profile`** — correctly noindexed, so this is intentional per Dim 6. Cross-verify.
4. **[P2] `chart-preview.html` excluded from `build-components.js:280` dashboardPages** — nav injection stale. Duplicate of Dim 6 finding.
5. **[P2] Dev server proxy missing entries** — `vite.config.js:83` has no entries for `/api/csrf-token.php`, `/api/contact.php`, `/api/newsletter.php`. Form interactions 404 locally.
6. **[P2] `ci-cd.yml:29` `cache: ''` disables npm caching** — adds ~45s per CI run.
7. **[P3] `tools/testing/lighthouserc.json:6` missing `nonprofit-directory` + `nonprofit-profile`** — both require live API; may be intentional per prior audit.

**Passed**: blog glob auto-discovery, atomic write via `.tmp` rename, Vite manual chunks, build order (sitemap → sync-blog → components → vite), `.htaccess` caching rule enforced, 71-URL pa11yci matches filesystem exactly.

---

# Dimension 14 — Deployment & Caching Safety

**Status**: RED
**Scratch**: [dim-14-deploy.md](_audit/dim-14-deploy.md)

### Findings
1. **[P0] `_headers:19` HTML cache contradicts `.htaccess`** — `max-age=3600` on `/*.html`. File is inert on SiteGround today, but activates on any CDN (Cloudflare) layer addition. Exactly the failure mode documented in memory `project_deployment_caching.md`. Fix: delete the rule or annotate clearly.
2. **[P0] Live API keys in `public/api/_config.php`** — BLS, FRED, Mapbox hardcoded in plaintext. File is gitignored and CI correctly `scp`s it after rsync; risk is a developer running local rsync. Recommendation: rotate BLS (`553b343...`) and FRED (`74900dc...`); verify with `git log --all --full-history -- public/api/_config.php`.
3. **[P0] GitHub Actions versions do not exist** — `ci-cd.yml` references `checkout@v6`, `setup-node@v5`, `upload-artifact@v5`, `download-artifact@v5`. All ahead of latest stable (`@v4`). Pipeline will fail to resolve on GH runners. Fix: downgrade all to `@v4`.
4. **[P1] `scp _config.php` exit code unchecked** — `ci-cd.yml:130`. If scp fails silently after `rsync --delete`, all 10 dashboard PHP proxies return 500 with no alert. Add `set -e` or explicit exit-code check.
5. **[P2] No deploy concurrency lock** — two rapid pushes to master can run parallel rsync + scp on `public_html/`. Add `concurrency: { group: deploy, cancel-in-progress: false }`.
6. **[P2] Node cache disabled** — `ci-cd.yml:29` `cache: ''`. Duplicate of Dim 13 finding.

**Passed**: `.htaccess` HTML no-cache + immutable hashed assets + `_cache` deny; `dist/` clean (no source maps / .env / dev files); all 4 API keys referenced as GitHub Secrets; Jira transitions all present with `continue-on-error: true`.

---

# Dimension 15 — Business & Content Quality

**Status**: YELLOW
**Scratch**: [dim-15-business.md](_audit/dim-15-business.md) · [dim-15-content.md](_audit/dim-15-content.md)

### Business findings
1. **[P1] No above-fold CTA on any of the 8 dashboards** — every dashboard CTA sits in a `dashboard-narrative` block after all charts; hero/tab-nav has no CTA. Recommendation: inline sentence + link inside `dashboard-hero`.
2. **[P2] Dashboard CTA copy identical across 7/8 dashboards** — all say "Talk With Us About Dashboard Strategy" except `nonprofit-directory.html:255-257` which is thin generic copy with no Salesforce mention. Recommendation: differentiate per topic.
3. **[P2] index.html primary CTA vague** — `index.html:165` says "Start Your Digital Journey"; contact sidebar says "Book a 30-minute consultation". Change to "Schedule a Free 30-Minute Consultation".
4. **[P2] services.html service cards lack outcome links** — `services.html:170-372`. Add one metric or "See it in action →" to top 3 cards.
5. **[P2] index.html impact stats lack source attribution** — `index.html:394-396`. Add linked footnote/tooltip.
6. **[P3] services.html hero missing value proposition** — `services.html:133-136`.
7. **[P3] contact.html submit button weak framing** — `contact.html:192` says "Send Message"; should be "Request My Free Consultation".
8. **[P3] impact.html 2/4 testimonials lack named authors** — `impact.html:170-178`, `impact.html:207`.
9. **[P3] No Salesforce certification/credential signal in funnel** — nowhere in services/index/contact/impact.

### Content findings
1. **[P1] Read Next title mismatch** — `blog/ai-data-strategy-crm-food-banks.html:205` links to `ai-reshaping-food-banks.html` with title "How AI Is Reshaping Food Bank Operations" but target H1 is "…Operations in 2026".
2. **[P2] "Get in Touch" CTA on all 53 blog articles too vague** — dashboard pattern uses "Talk With Us About [Topic]".
3. **[P2] Methodology heading inconsistency** — 3 dashboards use "Methodology & Data Sources", 5 use "Data Sources". Standardize.
4. **[P2] Boilerplate "How Organizations Use These Insights" cards** — verbatim-identical across food-insecurity, snap-safety-net, food-prices, food-banks.
5. **[P3] "2026 computed" is jargon** — `dashboards/food-insecurity.html:499,525` data notices.
6. **[P3] Read-time badges understate actual article length by ~3-4 minutes** — blog/.
7. **[P3] One static insight panel lacks `aria-live`** where adjacent panels have it.

**Passed**: no lorem/placeholder text anywhere; blog structure consistent; dashboard insight prose specific and data-grounded.

---

# Dimension 16 — Privacy, Compliance & Supply Chain

**Status**: YELLOW
**Scratch**: [dim-16-privacy.md](_audit/dim-16-privacy.md) · [dim-16-deps.md](_audit/dim-16-deps.md)

### Privacy findings
1. **[P1] Sentry `ip_address: '{{auto}}'` contradicts `sendDefaultPii: false`** — `src/js/monitoring/sentry.js:79` explicitly re-enables IP collection after line 40 disables it. Every visitor's IP is sent to Sentry with no consent gate. Fix: remove `ip_address` field.
2. **[P2] Mapbox proxy caches raw address queries** — `public/api/mapbox-geocode.php:133-138`. Raw `'query'` written into 30-day cache file. If a user types a home address, it persists. Strip `query` from cached payload.
3. **[P2] Newsletter modal has no privacy disclosure or policy link** — `src/js/effects/newsletter-popup.js:80-96`. ePrivacy best practice requires disclosure.
4. **[P2] GA4 not found in source** — if SiteGround/tag-manager injects analytics externally, no consent banner = GDPR gap. Verify SiteGround panel.
5. **[P3] CSP `connect-src` uses wildcard `*.ingest.us.sentry.io`** — `_headers:13`. Pin to exact DSN host.

### Dependency findings
1. **[P1] basic-ftp@5.2.0 — GHSA-chqc-8p9q-pq6q CVSS 8.6** — FTP command injection. Transitive via puppeteer/playwright. Dev-only, no production exposure. Await upstream fix.
2. **[P1] picomatch ≤2.3.1 — GHSA-c2c7-rcm5-vvqj ReDoS CVSS 7.5** — transitive via vite/tinyglobby. Resolved by vite@6.4.2 bump.
3. **[P1] braces — GHSA-grv7-fg5c-xmjg ReDoS** — transitive via `live-server` (unmaintained since 2020). Replace with `vite preview`.
4. **[P2] @anthropic-ai/sdk@0.80.0 — GHSA-5474-4w2j-mq4c Memory Tool sandbox escape** — declared in `dependencies` but dev-only (blog scraper). Fix: `npm install --save-dev @anthropic-ai/sdk@^0.86.1` + move to devDeps.
5. **[P2] vite@5.4.21 — GHSA-4w7w-66w2-5vf9 path traversal** — fix at vite@6.4.2. Dependabot ignore rule blocks auto-bump. Manual branch test required.
6. **[P3] @sentry/browser 31 minor versions behind** — 10.17.0 vs 10.48.0, same major. Safe routine bump.
7. **[P3] `.github/dependabot.yml:19` has `@your-github-username` placeholder** — Dependabot PRs cannot assign reviewers.
8. **[P3] `package.json:39` `--audit-level critical`** — should be `--audit-level high`.

**Passed**: 0 critical/high advisories touching direct runtime dependencies; lockfile clean (v3, no drift); all 7 d3-* subpackages current; ECharts@6.0.0 current v6 stable.

---

# CONSOLIDATED REMEDIATION PLAN

Sorted by priority. `E` = Effort (S/M/L), `R` = Risk (L/M/H).

## P0 — Must fix before next deploy

| # | Finding | Evidence | E | R |
|---|---|---|---|---|
| P0-1 | GitHub Actions versions don't exist (`checkout@v6`, `setup-node@v5`, `upload-artifact@v5`, `download-artifact@v5`) | `.github/workflows/ci-cd.yml:22+` | S | L |
| P0-2 | `_headers:19` HTML `max-age=3600` contradicts `.htaccess` no-cache rule (activates on any CDN add) | `_headers:19` | S | L |
| P0-3 | Live API keys hardcoded in `public/api/_config.php` — rotate if ever in git history | `public/api/_config.php` | M | M |

> **P0-3 Resolution (2026-04-09, verified-only)**: `git log --all --full-history -- public/api/_config.php` returned empty — the file has never been committed to git. Zero exposure. Rotation **skipped** after owner review: BLS/FRED are free low-sensitivity keys, Mapbox is a scoped public `pk.*` token meant to be client-visible, Charity Navigator slot holds only a placeholder, and this is a sole-developer project with no shared machines. Remediation applied: added `public/api/_config.example.php` template documenting the CI-secrets source of truth. If exposure is ever discovered (e.g. file pasted in a chat/screenshot, old backup surfaces), rotate via each provider's developer portal → update GitHub repo Secrets → redeploy.
| P0-4 | `scp _config.php` exit code unchecked — silent deploy failure risk | `.github/workflows/ci-cd.yml:130` | S | L |

## P1 — Fix this sprint

| # | Finding | Evidence | E | R |
|---|---|---|---|---|
| P1-01 | Sankey hardcodes 44.2M as present-tense (2022 figure) + vintage gap on 3 prose numbers | `dashboards/snap-safety-net.html` | S | L |
| P1-02 | Demographic flow cites terminated USDA ERS series without disclosure | `dashboards/snap-safety-net.html` | S | L |
| P1-03 | Cost Burden chart labeled "Data Year: 2022" without currency note | `dashboards/food-prices.html` | S | L |
| P1-04 | Scatter insight hardcodes "#1 predictor" unconditionally | `src/js/dashboards/food-insecurity.js:737` | S | L |
| P1-05 | SNAP bar legend hardcodes "FY2024" but data is FA 2023 estimates | `food-insecurity.js:908` | S | L |
| P1-06 | "3x more likely" claim with no inline citation | `food-insecurity.js:1057` | S | L |
| P1-07 | `#help-search-status` missing `aria-live` | `dashboards/nonprofit-directory.html:210` | S | L |
| P1-08 | `.dashboard-tabs__tab` missing `:focus-visible` outline | `src/css/11-dashboards.css` | S | L |
| P1-09 | `.dashboard-back-btn` missing `:focus-visible` style | `src/css/11-dashboards.css:246` | S | L |
| P1-10 | ECharts bundle 778KB vs 645KB budget (+21%) | `dist/assets/echarts-*.js` | L | M |
| P1-11 | CSS bundle 144KB vs 125KB budget (+15%) — `critical-gradients.css` is 73.5KB raw | `src/css/critical-gradients.css` | M | M |
| P1-12 | `_stale` flag silently shows "Live" in freshness badge | `src/js/dashboards/shared/dashboard-utils.js:200` | S | L |
| P1-13 | Error banner only on Executive Summary — 5 other dashboards lack `role="alert"` region | `dashboards/*.html` | M | L |
| P1-14 | `networkidle` in 3 Playwright specs — banned per prior 146-failure incident | `tools/testing/tests/*.spec.js` | S | L |
| P1-15 | Dashboard test files dominated by source-string scans (vacuous tests) | `src/js/dashboards/*.test.js` | L | M |
| P1-16 | `renderPriceImpact` has no behavioral test | `src/js/dashboards/executive-summary.js:205` | S | L |
| P1-17 | `renderTripleBurden(data, null)` null-path untested | `food-insecurity.js:1670-1680` | S | L |
| P1-18 | `renderMap` in food-insecurity.js is 295 lines | `food-insecurity.js:18-312` | M | M |
| P1-19 | `snapTrendDates` dead variable suppressed by eslint-disable | `snap-safety-net.js:18` | S | L |
| P1-20 | `snap-safety-net.js:194` `'cdc'` branch may be unreachable | `snap-safety-net.js:194` | S | L |
| P1-21 | 30+ `backdrop-filter` declarations missing `-webkit-backdrop-filter` | `src/css/06-effects.css` + 4 others | S | L |
| P1-22 | `404.html` absent from `corePages` | `build-components.js:252` | S | L |
| P1-23 | Lighthouse CI uses `npm run dev` instead of build+preview | `tools/testing/lighthouserc.json:19` | S | L |
| P1-24 | No above-fold CTA on any dashboard | `dashboards/*.html` | M | L |
| P1-25 | Read Next title mismatch in blog article | `blog/ai-data-strategy-crm-food-banks.html:205` | S | L |
| P1-26 | Sentry `ip_address: '{{auto}}'` contradicts `sendDefaultPii: false` | `src/js/monitoring/sentry.js:79` | S | L |
| P1-27 | basic-ftp CVE (dev-only, transitive) — await upstream | package-lock | — | L |
| P1-28 | picomatch CVE — resolved by vite@6.4.2 bump (manual test) | package.json | M | M |
| P1-29 | braces CVE — replace `live-server` with `vite preview` | package.json | S | L |

## P2 — Fix when convenient

| # | Finding | Evidence | E | R |
|---|---|---|---|---|
| P2-01 | BLS null gap at Oct 2025 — refresh bls-food-cpi.json | `public/data/bls-food-cpi.json` | S | L |
| P2-02 | DC food bank density may exceed visualMap ceiling | `src/js/dashboards/food-banks.js` | S | L |
| P2-03 | Child rate multiplier doc mismatch (PHP 1.4x vs HTML 1.3-1.6x) | `public/api/dashboard-census.php` | S | L |
| P2-04 | Triple Burden "/300" denominator unexplained | `food-insecurity.js:1486` | S | L |
| P2-05 | EIN validation inconsistency in charity-navigator.php | `public/api/charity-navigator.php:49` | S | L |
| P2-06 | `dashboard-insights__card-title` uses `<div>` instead of `<h3>` | 8 dashboards | S | L |
| P2-07 | `role="region"` chart containers without `aria-label` | `food-access.html:362,364` | S | L |
| P2-08 | `.fnf-nav__link` missing `:focus-visible` | `src/css/03-navigation.css:51` | S | L |
| P2-09 | KPI counter `role="status"` set dynamically not statically | `dashboard-utils.js:164` | S | L |
| P2-10 | Counter `data-format="thousand/plus"` unrecognized; strips "K+"/"+" | `dashboards/nonprofit-directory.html:149,153` | S | L |
| P2-11 | Exec-summary SNAP gap legend uses `textMuted` (dimmer than others) | `executive-summary.js:159` | S | L |
| P2-12 | SNAP gauge inline height without min-height | `snap-safety-net.html:364-376` | S | L |
| P2-13 | Unescaped `&` in `food-prices.html` title + og:title | `food-prices.html:6,18` | S | L |
| P2-14 | Sentry Session Replay bundle ~200-300KB overhead | `src/js/monitoring/sentry.js:32` | L | M |
| P2-15 | Author meta "Team" on 2 root hub pages | `case-studies.html:11`, `templates-tools.html:11` | S | L |
| P2-16 | Meta descriptions >160 chars on 2 dashboards | `executive-summary.html:9`, `food-insecurity.html:9` | S | L |
| P2-17 | Zero interactive Playwright coverage (toggles, drill-downs) | `tools/testing/tests/dashboard-smoke.spec.js` | M | L |
| P2-18 | Nonprofit Profile absent from smoke matrix | `dashboard-smoke.spec.js:9-17` | S | L |
| P2-19 | PHP proxy error paths untested | `src/js/dashboards/php-security.test.js` | M | L |
| P2-20 | Tooltip formatters untested at runtime | `food-access/banks/prices.test.js` | M | L |
| P2-21 | `init` in food-access.js is 232 lines | `food-access.js` | M | M |
| P2-22 | `renderDesertMap` is 194 lines | `food-access.js` | M | M |
| P2-23 | `getOrCreateChart` defined locally (should move to utils) | `food-access.js` | S | L |
| P2-24 | `window._fnfStateData` as cross-function bus | `food-insecurity.js` | S | L |
| P2-25 | `REGION_COLORS` vs `HEATMAP_REGION_COLORS` undocumented | `dashboard-utils.js`, `d3-heatmap.js` | S | L |
| P2-26 | AbortController signal minimum browser target undocumented | `particles.js`, `smart-scroll.js`, etc. | S | L |
| P2-27 | D3 heatmap SVG text baseline fallback for Firefox <93 | `d3-heatmap.js:231,241,250` | S | L |
| P2-28 | D3 heatmap SVG rect filter applied to wrong node (Safari) | `d3-heatmap.js:201` | S | L |
| P2-29 | `scripts/generate-sitemap.js` profile exclusion (confirm intentional) | `scripts/generate-sitemap.js:35` | S | L |
| P2-30 | `chart-preview.html` excluded from `dashboardPages` | `build-components.js:280` | S | L |
| P2-31 | Dev proxy missing entries for form endpoints | `vite.config.js:83` | S | L |
| P2-32 | `ci-cd.yml` npm cache disabled | `ci-cd.yml:29` | S | L |
| P2-33 | No deploy concurrency lock | `.github/workflows/ci-cd.yml` | S | L |
| P2-34 | Dashboard CTA copy identical across 7/8 dashboards | `dashboards/*.html` CTA blocks | S | L |
| P2-35 | index.html CTA vague ("Start Your Digital Journey") | `index.html:165` | S | L |
| P2-36 | services.html cards lack outcome metrics/links | `services.html:170-372` | M | L |
| P2-37 | index.html impact stats lack source attribution | `index.html:394-396` | S | L |
| P2-38 | Methodology heading inconsistency (3 vs 5 dashboards) | `dashboards/*.html` | S | L |
| P2-39 | Boilerplate "How Organizations Use These Insights" cards | 4 dashboards | S | L |
| P2-40 | Blog CTA "Get in Touch" too vague | 53 articles | S | L |
| P2-41 | Mapbox proxy caches raw query strings 30 days | `mapbox-geocode.php:133-138` | S | L |
| P2-42 | Newsletter modal lacks privacy disclosure | `newsletter-popup.js:80-96` | S | L |
| P2-43 | GA4 consent banner verification (check SiteGround panel) | infra | S | L |
| P2-44 | `@anthropic-ai/sdk` in `dependencies` should be devDep + bump | `package.json:121` | S | L |
| P2-45 | vite@5.4.21 path traversal CVE — manual v6.4.2 bump | `package.json` | M | M |

## P3 — Backlog / enhancement

| # | Finding | E | R |
|---|---|---|---|
| P3-01 | "driven by" causal framing on Sankey insight | S | L |
| P3-02 | Form endpoints don't include `_cors.php` | S | L |
| P3-03 | `cache-cleanup.php` fail-open guard | S | L |
| P3-04 | `title` tooltips unreachable by keyboard/touch | S | L |
| P3-05 | Legend font sizes inconsistent across dashboards | S | L |
| P3-06 | JSON-LD schema split (`about` vs `isPartOf`) | S | L |
| P3-07 | Sitemap `lastmod` dates stale | S | L |
| P3-08 | Dataset JSON-LD schema absent on data dashboards | M | L |
| P3-09 | Short titles on nonprofit directory/profile | S | L |
| P3-10 | County drill-down silent catch in food-access.js | S | L |
| P3-11 | No mobile-specific Playwright assertions | M | L |
| P3-12 | State selector widget in dashboard-utils.js (location) | S | L |
| P3-13 | `initStateSelector` uses inline `style=""` attributes | S | L |
| P3-14 | `createD3Heatmap` lacks parameter schema comment | S | L |
| P3-15 | `ParticleSystem.getStats().fps` always stale | S | L |
| P3-16 | Lighthouse CI missing directory/profile URLs | S | L |
| P3-17 | services.html hero missing value proposition | S | L |
| P3-18 | contact.html submit button weak framing | S | L |
| P3-19 | impact.html testimonials missing named authors | S | L |
| P3-20 | No Salesforce certification signal in funnel | S | L |
| P3-21 | "2026 computed" jargon in data notices | S | L |
| P3-22 | Blog read-time badges understated | S | L |
| P3-23 | CSP `connect-src` wildcard for Sentry ingest | S | L |
| P3-24 | `@sentry/browser` 31 minor versions behind (routine bump) | S | L |
| P3-25 | dependabot.yml reviewer placeholder `@your-github-username` | S | L |
| P3-26 | `npm run security` should use `--audit-level high` | S | L |
| P3-27 | SLDS + Google Fonts render-blocking (architectural constraint) | — | — |

---

## Verification
- `npm test`: **521/521 passing** (baseline captured)
- `npm run build`: **clean, 28s**
- `git status`: only new untracked files under `audit-results/` — no source modifications.

## Next Steps

The implementation phase is split across four separate sessions — one per priority bucket — each with its exact resume prompt in `C:/Users/luetk/.claude/plans/crispy-sparking-stallman.md`. Run them one at a time in fresh sessions to keep context clean. Start with **P0** (4 items, all config-level, ~1 short session).
