# Complete Multi-Agent Code Review — 2026-04-13

**Status**: Discovery + planning complete. **No fixes applied.** Execution in a separate session against a fresh `chore/code-review-<topic>` branch from master.

**Plan of record**: `C:\Users\luetk\.claude\plans\jaunty-petting-phoenix.md`

**Waves completed**:
- **Wave A** (10 parallel): slds-compliance, accessibility, seo, perf-budget, dependency, php-security, data-analytics, devops, code-reviewer, silent-failure-hunter
- **Wave A re-runs** (4, with Context7 directive): dependency-auditor, devops-engineer, code-reviewer, php-security-reviewer
- **Wave B** (4 dependent): cross-page-consistency, uiux-reviewer, test-engineer, content-reviewer
- **Wave C** (2 advisory, review aggregated findings): technical-architect, business-analyst

**Context7 coverage**: Partial. The code-reviewer re-run successfully reached Context7 and cited ECharts, Mapbox, Sentry library IDs. The other three re-runs reported the MCP tool was not exposed in their sub-agent environment and substituted WebFetch / training-knowledge fallbacks. Bug register confidence is unaffected for findings verified by multiple agents; flagged explicitly where a single agent's doc currency matters.

**Protected surfaces**: No Wave A/B/C finding proposes touching glassmorphism, logo effects, background animations, or emoji gradients. All clear.

---

## Bug Register

Columns: ID / Severity / File / Agent(s) / Root Cause / Fix / Blast Radius / Blocked By / Blocks / Architect verdict / Business impact

### P0 — Must Fix (security, broken prod, conversion blocker)

| ID | File | Root Cause | Fix | Blast Radius | Verdict | Biz |
|---|---|---|---|---|---|---|
| **P0-1** | `src/js/dashboards/nonprofit-directory.js:240-257` | `initFindHelp` interpolates `name`, `city`, `state`, `ein` raw into HTML + href attributes; `escapeHtml()` already exists at line 184 but is not called here | Wrap each variable with `escapeHtml()`; URL-encode `ein` in href | User-facing search results (Find Help Near Me); ProPublica data is 3rd-party | GREEN (mechanical) | XSS risk: probability LOW / magnitude EXISTENTIAL |
| **P0-2** | `src/js/dashboards/food-insecurity.js:1725-1746` | TDZ/stale-closure: `let accessData = null, bankData = null` declared on line 1736 but captured by callbacks passed to `renderMap()` on line 1725 | Hoist the `let` declaration above the `renderMap` call | Every state-click path on the food-insecurity map during init window | GREEN | Empty deep-dive panels during dashboard demo = HIGH impact |
| **P0-3** | `.github/workflows/ci-cd.yml:155-171` | Health check retry loop falls off end of script without `exit 1`; job reports green on broken site | Add `exit 1` after final error echo | Every deploy since this landed has had a meaningless success gate | GREEN (P0-CRITICAL) | Internal: ships broken prod undetected |
| **P0-4** | `.github/workflows/ci-cd.yml:126-128` | `rsync -avz --delete dist/` with no `--exclude 'api/_config.php'`; rsync deletes server-side `_config.php` before scp re-uploads it, creating 5-30s window where PHP proxies return 500 | Add `--exclude 'api/_config.php'` to rsync line | Every deploy; LiteSpeed cache may warm the 500 responses | GREEN (must ship before any other CI change) | Brief 500s per deploy; LOW direct biz but HIGH internal |
| **P0-5** | `blog/salesforce-food-bank-operations.html:254` + `blog/food-bank-workflow-automation.html:264` | "Read Next" links use relative paths (`case-studies.html`, `templates-tools.html`) that resolve to `blog/case-studies.html` / `blog/templates-tools.html` → non-existent | Fix paths to `../case-studies.html` / `../templates-tools.html` | Highest-intent organic traffic pages for Salesforce+food-bank searches | GREEN | HIGH — destroys navigation at peak intent |
| **P0-6** | `src/js/dashboards/food-insecurity.js:1763-1773` | `Promise.all([...]).then(...)` enrichment chain has no trailing `.catch`; if `renderTripleBurden` throws on shape drift it becomes an unhandled rejection that escapes the outer try/catch | Add `.catch(err => errorTracker.captureException(err, {context: 'tripleBurden-enrichment'}))` | Dashboard data-source swaps historically cause shape drift (ref: feedback_data_field_normalization) | GREEN | MEDIUM — silent degradation during data changes |
| **P0-7** | `src/js/dashboards/shared/dashboard-utils.js:278-292` | `fetchWithFallback` catches live-API errors with empty block, loses cause chain when static also fails | Log live error via `errorTracker.captureMessage(... 'info')` before fallback | All dashboards using the helper inherit silent-degradation behavior | GREEN | LOW direct, MEDIUM debuggability |

### P1 — Should Fix (regression risk, a11y AA, conversion UX)

| ID | File | Root Cause | Fix |
|---|---|---|---|
| **P1-1** | `src/js/dashboards/nonprofit-directory.js:26-75` | `handleSearch` debounces but has no AbortController; rapid typing lets stale fetch overwrite newer results; URL bar and rendered cards diverge | Per-call AbortController stored in module scope; abort prior on each call |
| **P1-2** | `src/js/dashboards/nonprofit-directory.js` (handleSearch) | `history.replaceState` quota exception (100/30s) thrown synchronously, unwinds handler before fetch begins | Wrap replaceState in try/catch OR throttle to post-debounce |
| **P1-3** | `src/js/dashboards/snap-safety-net.js:728-733` | `Promise.all([fetch, fetch])` with no AbortController/timeout; stall on either fetch hangs dashboard indefinitely with no error UI | AbortController + 15s timeout; wire into existing error-state DOM |
| **P1-4** | `src/js/dashboards/food-prices.js:846-847, 907` | `_snapBenefits` module-mutation only set inside `if (blsData)` branch; null-unguarded on snapData fetch error | Move assignment out of the branch with `?? null` default |
| **P1-5** | `public/api/contact.php:105` + `public/api/newsletter.php:74` | Rate-limit session write (`$_SESSION['last_contact_submit']`) deferred to `if ($sent)` success block; mail() failure leaves burned CSRF + no cooldown = stuck user | Move session rate-limit write to immediately after CSRF validation passes, before `mail()` call |
| **P1-6** | `src/css/critical-gradients.css:699-707` | Selector `h2#contact-main-heading` targets an actual `<h1>`; contact page heading renders unstyled | Change selector to `h1#contact-main-heading` (verify ID in `contact.html` first) |
| **P1-7** | `src/css/05-layout.css:77` | `slds-p-vertical_x-large` copy-paste bug uses `--slds-spacing-small` instead of x-large | Swap to `--slds-spacing-x-large` (YELLOW: verify rendered layout first — may be intentional override) |
| **P1-8** | `build-components.js` | `blogSubpages`, `resourcesSubpages` arrays not plumbed into aria-current injection; 55 pages affected (53 blog articles + templates-tools + case-studies) | Plumb arrays through the condition logic — YELLOW: isolate in own PR, full build + pa11y before merge |
| **P1-9** | `scripts/generate-sitemap.js:51` | All `<lastmod>` dates frozen via single `new Date()` at generation; no per-article timestamps | Read file mtime or front-matter date per article |
| **P1-10** | `src/js/dashboards/food-access.js:119` | Food desert choropleth `min: 20` hardcoded; clips Maine's 5.8% value = factually wrong map | Lower min or set `min: 'dataMin'` |
| **P1-11** | Root pages (8) | Missing JSON-LD Organization/LocalBusiness/Article blocks | Additive `<script type="application/ld+json">` (CSP-safe, data-only) |
| **P1-12** | `blog/ai-reshaping-food-banks.html` | Missing article illustration SVG | Run `/create-illustration ai-reshaping-food-banks` |
| **P1-13** | `tools/deployment/slds-compliance-check.js` | ESM/CJS mismatch: uses `require()` in `"type": "module"` project; dev script currently broken | Convert to `import` |
| **P1-14** | `.github/workflows/ci-cd.yml:23`, `weekly-a11y-sweep.yml:17`, `dependency-update.yml:27` | `actions/checkout@v6` does not exist (latest is v4); behavior under GitHub's tag resolution is undefined | Pin to `@v4` everywhere |
| **P1-15** | `.github/workflows/weekly-a11y-sweep.yml:24` | `cache: ''` disables npm caching; wastes 60-90s/run and risks transient registry failures producing false-negative a11y reports | `cache: 'npm'` |
| **P1-16** | `.github/workflows/jira-transition.yml:24` | Base64 credential composed inline; masking is per-secret so composed string would leak if `set -x` ever runs | Pass secrets separately or use Jira action with dedicated input |
| **P1-17** | `package.json` (transitive via Vite 8 Rolldown) | `tinyglobby → picomatch 4.0.0-4.0.3` ReDoS (GHSA-c2c7-rcm5-vvqj) — new since PR #144 | `overrides: { "picomatch": ">=4.0.4" }`; test build |
| **P1-18** | `package.json` (via puppeteer) | `basic-ftp` CRLF injection (GHSA-6v7q-wjvx-w8wg); dev only | Upgrade puppeteer or add override |
| **P1-19** | `vitest.config.js` | 65% coverage threshold configured but not enforced via CI exit code; suite passes at ~21% statements | SEQUENCE: write dashboard tests first, verify >65%, THEN enable gate |
| **P1-20** | `src/js/dashboards/food-insecurity.js`, `food-prices.js`, `food-banks.js`, `nonprofit-directory.js`, `sentry.js` | 0% statement coverage on 4 dashboards + sentry integration | Add behavioral tests (priority matches P1-19 sequencing) |
| **P1-21** | 2 blog articles | Title / H1 divergence confuses SERP snippets | Align title/H1 |
| **P1-22** | Several dashboards + `contact.html` text panels | Chart framing copy can contradict data after methodology swaps | Audit text panels against current data source (ref: feedback_chart_analytical_integrity) |

### P2 — Polish / Tech Debt

| ID | File | Root Cause | Fix |
|---|---|---|---|
| **P2-1** | `public/api/csrf-token.php:26` | Missing `exit` after success echo | Add `exit;` |
| **P2-2** | `public/api/cache-cleanup.php:11` | `@include __DIR__ . '/_config.php'` silently swallows parse errors | Use `include` without `@`; log to PHP error log |
| **P2-3** | `public/api/dashboard-places.php:145` | SODA `$where` built via string interpolation; allowlist protects current paths but pattern is architecturally dangerous | Parameterize via helper (YELLOW: don't restructure query-build contract) |
| **P2-4** | `public/api/dashboard-sdoh.php:133-134` | Missing rate-limit guard on Census API calls (siblings have `rateLimitCheck('census-saipe', ...)`) | Copy sibling pattern |
| **P2-5** | `public/api/_rate-limiter.php:229` | XFF-all-private fallback collapses all users to one REMOTE_ADDR bucket | Document constraint + add monitoring alert |
| **P2-6** | `public/api/contact.php:33-39` | CSRF single-use race — currently safe via session file lock, fragile if `session_write_close()` added later | Document constraint (don't restructure) |
| **P2-7** | `.github/workflows/ci-cd.yml:53-58` | `kill %1 \|\| true` preview-server cleanup race; slow runners can kill wrong job | Track PID explicitly |
| **P2-8** | `.github/workflows/dependency-update.yml:97` | `peter-evans/create-pull-request` force-pushes to static `automated-security-updates` branch; rewrites history on open PR | Use dynamic branch names or squash mode |
| **P2-9** | `src/js/dashboards/cluster-a-b-guard.test.js` | Silently excludes `snap-safety-net` from AbortController guard | Add snap-safety-net to guard list |
| **P2-10** | `src/css/**` (templates-tools, case-studies, nav edges) | 7 interactive elements missing `:focus-visible` rings | Additive CSS — YELLOW: design carefully against glassmorphism aesthetic |
| **P2-11** | `src/css/**` | Untokenized hex values in several modules | Token substitution referencing `02-design-tokens.css` |
| **P2-12** | `package.json` | `live-server` unmaintained since 2021; carries 6 transitive advisories; `vite preview` is direct substitute | `npm uninstall live-server`, remove `serve` script |
| **P2-13** | `.github/dependabot.yml` | Lighthouse major-version ignore rule blocks security fix PRs for `@sentry/node` + `tmp` advisories | Remove ignore after testing Lighthouse 12 against `lighthouserc.json` |

### Out of Scope (documented, deferred)

- **PHPMailer replacement for `mail()`**: requires ADR, SiteGround SMTP validation, separate testing cycle. Document the MTA header-injection surface as an accepted risk pending architectural decision.
- **`php-security.test.js` runtime include-path validation**: requires PHP runtime in CI which is not currently feasible on Vite build environment.
- **Lighthouse 12 upgrade**: separately scoped; unblocks several P2 dependency fixes.

### Dedup notes

- accessibility-auditor (aria-current on 55 pages) + cross-page-consistency (same) → **P1-8 build-components.js root cause**
- seo-auditor (missing JSON-LD) + cross-page-consistency (title/H1 divergence) → **P1-11 + P1-21** kept separate
- code-reviewer + silent-failure-hunter (food-insecurity unhandled rejection) → **P0-6** single entry
- slds-compliance-checker + uiux-reviewer (untokenized hex + focus-visible) → **P2-10, P2-11** separate because touching different modules

---

## Execution Order — Atomic PR Punch List

Each PR lands on a fresh `chore/code-review-<topic>` branch from master. Ad hoc workflow (no Jira key). Follow CLAUDE.md rules: `git add` by filename, verify with `git show HEAD`, commit automatically, push only when told.

### Sequence rules applied

1. P0 first, regardless of blast radius
2. rsync `--exclude` (P0-4) must ship before any other CI/CD change
3. Same-file fixes bundled to avoid merge conflicts
4. CSS/visual changes only after JS/PHP dependencies
5. Coverage CI gate (P1-19) gated behind test additions (P1-20)
6. `build-components.js` (P1-8) isolated — 71-page regeneration risk

### PR sequence

**PR 1 — `chore/code-review-deploy-safety` — P0 CI/CD blockers**
- P0-3: ci-cd.yml health check `exit 1`
- P0-4: ci-cd.yml rsync `--exclude 'api/_config.php'`
- P1-14: pin all workflow `actions/checkout@v4`
- P1-15: weekly-a11y `cache: 'npm'`
- P1-16: jira-transition credential composition
- **Why bundled**: all touch `.github/workflows/*.yml`; ship first because P0-4 blocks safe deploys.
- **Verify**: dry-run the rsync command locally; manual workflow_dispatch after merge.

**PR 2 — `chore/code-review-xss-and-js-safety` — P0 JS fixes**
- P0-1: nonprofit-directory.js `initFindHelp` escapeHtml wraps
- P0-2: food-insecurity.js TDZ hoist
- P0-6: food-insecurity.js enrichment `.catch`
- P0-7: dashboard-utils.js fetchWithFallback error logging
- P1-1: nonprofit-directory.js handleSearch AbortController
- P1-2: nonprofit-directory.js history.replaceState try/catch
- P1-3: snap-safety-net.js Promise.all AbortController + timeout
- P1-4: food-prices.js _snapBenefits null guard
- **Why bundled**: single atomic change to `src/js/dashboards/` touching 5 files. Writing tests for each fix satisfies P1-20 partially.
- **Verify**: vitest, vite build, manual dashboard preview.

**PR 3 — `chore/code-review-blog-read-next-404s` — P0 content fix**
- P0-5: fix relative paths in 2 blog articles
- **Why alone**: trivial, unblocks organic-traffic conversion risk immediately.

**PR 4 — `chore/code-review-php-security` — P1 + P2 PHP hardening**
- P1-5: contact.php + newsletter.php rate-limit write ordering
- P2-1: csrf-token.php exit
- P2-2: cache-cleanup.php `@include` → `include` + log
- P2-4: dashboard-sdoh.php rate-limit guard
- P2-5: _rate-limiter.php XFF fallback documentation
- **Why bundled**: all touch `public/api/**`; one deploy window.
- **Deferred within PHP**: P2-3 (SODA parameterization) and P2-6 (CSRF race doc) as lower-risk follow-ups.

**PR 5 — `chore/code-review-dependencies` — P1 deps + P2 cleanup**
- P1-17: picomatch override
- P1-18: basic-ftp/puppeteer override
- P2-12: remove live-server
- P2-13: dependabot Lighthouse ignore rule
- **Why bundled**: all `package.json` / `.github/dependabot.yml`.

**PR 6 — `chore/code-review-aria-current-build-components` — P1-8 isolated**
- P1-8 only: `build-components.js` aria-current plumbing
- **Why alone**: regenerates all 71 pages; full build + pa11y sweep required before merge.

**PR 7 — `chore/code-review-seo-and-sitemap` — P1 SEO batch**
- P1-9: sitemap lastmod per-file
- P1-11: JSON-LD on 8 root pages
- P1-21: 2 articles title/H1 alignment
- P1-13: slds-compliance-check.js ESM fix
- **Why bundled**: all cross-cutting SEO/meta; no source-code risk.

**PR 8 — `chore/code-review-dashboard-data-accuracy` — P1-10 + P1-12 + P1-22**
- P1-10: food-access.js Maine clipping
- P1-12: ai-reshaping-food-banks illustration
- P1-22: text panel audit after data swaps
- **Why bundled**: all user-facing dashboard/content accuracy.

**PR 9 — `chore/code-review-css-polish` — P1 + P2 CSS**
- P1-6: contact heading dead selector
- P1-7: slds-p-vertical_x-large token
- P2-10: focus-visible rings
- P2-11: hex → token cleanup
- **Why bundled**: all CSS, lands last to avoid visual interaction with JS fixes.
- **Careful**: P2-10 focus rings must be designed against glassmorphism — may pair with a uiux-reviewer pre-merge pass.

**PR 10 — `chore/code-review-test-coverage` — P1-19 + P1-20 sequenced**
- P1-20: dashboard + sentry.js behavioral tests
- P1-19: enable coverage CI gate ONLY after threshold crosses 65%
- P2-9: cluster-a-b-guard add snap-safety-net
- **Why last**: tests depend on all prior fixes landing so they don't test stale behavior.

### Out-of-PR items (must not ship in this review round)

- `php-security.test.js` runtime validation — feasibility research first
- PHPMailer replacement — needs ADR
- Lighthouse 12 upgrade — separate scope

---

## Verification Protocol (per fix, during execution session)

For each PR:
- `npm run lint` clean
- `npm run build` succeeds
- `npm run test` relevant scope passes
- Visual check via `npm run preview` for HTML/CSS/JS touches
- `git show HEAD` after each commit (lint-staged stash gotcha)
- `/quality-sweep deploy` before final push of each PR
- Protected-surface re-check — grep diff for `backdrop-filter`, `mesh`, `iridescent`, logo rules, emoji gradients

## Context7 Provenance Note

Findings by source of doc verification:
- **Context7-verified**: P0-2, P0-6, P0-7 (code-reviewer re-run cited `/apache/echarts-doc`, `/mapbox/mapbox-gl-js`, `/getsentry/sentry-javascript`)
- **WebFetch-verified**: P1-17 (Vite 8 `tinyglobby` advisory trace), P1-14 (actions/checkout version check), dependency advisory severities
- **Training-knowledge fallback**: PHP findings (OWASP Top 10 references), rsync semantics, GitHub Actions syntax — all cross-checked against official docs via WebFetch where possible

Where a finding depends on library-API currency (ECharts dispose contract, Mapbox queryRenderedFeatures, Sentry captureException shape), Context7 citations are available in the code-reviewer agent transcript.
