# COMPREHENSIVE DASHBOARD AUDIT — ALL DIMENSIONS

## Context

We have 8 data dashboards (executive-summary, food-insecurity, food-access, snap-safety-net, food-prices, food-banks, nonprofit-directory, nonprofit-profile) that have been through 15 phases of development and auditing since 2026-04-02. Current stack: 521 vitest unit tests, 868 Playwright browser tests, 10 PHP API proxies with CORS restriction + method validation, ~55 charts across all dashboards. All prior work is documented in memory files — read them first.

This audit must be COMPREHENSIVE — every dimension, every dashboard, every chart. We are NOT making changes in this session. This is a READ-ONLY diagnostic that produces a prioritized remediation plan. The goal is to identify anything that is broken, wrong, misleading, stale, or suboptimal across ALL of the following dimensions.

## Pre-Audit Setup

1. Read ALL memory files in `.claude/projects/*/memory/` to understand the full history
2. Read CLAUDE.md for project constraints (glassmorphism protection, SLDS, no visual regressions)
3. Run `npm test` to get current test count and confirm green baseline
4. Run `npm run build` to confirm clean build
5. Run `git log --online -30 master` to see recent work
6. Audit *Consultants plus ALL agents in parallel*

---

## Dimension 1: Data Accuracy & Freshness

- Are all static JSON data files using the most current available data? Check dates/vintages in:
  - `food-insecurity-state.json` (should be 2024 data + 2025-2026 projections)
  - `snap-participation.json` (should be through Nov 2025)
  - `food-bank-summary.json` (2023 IRS 990 — is newer available?)
  - `bls-food-cpi.json` and `bls-regional-cpi.json` (should be through early 2026)
  - `current-food-access.json` (projected 2026-04-06 — still valid?)
  - `snap-retailers.json` (what vintage?)
  - `county-index.json` + counties/*.json (CHR 2025 data)
- Are hardcoded numbers in HTML (hero stats, insight text, data notices) still matching the JSON?
- Do all `updateFreshness()` calls show correct data years?
- Are projected/modeled values clearly labeled as such?

## Dimension 2: Analytical Integrity

- Do chart titles, descriptions, and insight panels accurately describe what the data shows?
- Is any causal language used where only correlation exists? (We fixed 20 instances in Phase 8 — check for new ones)
- Are methodology notes present where data is modeled, estimated, or composited?
- Do axis labels, legend entries, and tooltip formats match the actual metric being shown?
- Are there any charts where the visual framing contradicts or exaggerates the data?
- Check the Vulnerability Index, Triple Burden, Double Burden, and PPI calculations for correctness
- Verify regression lines are suppressed when |r| < 0.2
- Verify all reconciliation notes are accurate (state svn vs national gaps)

## Dimension 3: PHP Security & API Contracts

- Scan ALL PHP files in `public/api/` for:
  - All must require `_cors.php` (domain-restricted CORS, no wildcard `*`)
  - All must have GET method validation (405 on non-GET)
  - No error messages containing "API key", "not configured", or upstream error details
  - No `md5()` calls (should be `hash('sha256')`)
  - Input validation: EIN=9 digits, state=allowlist, all user inputs sanitized
  - Rate limiting functioning (60s cooldown)
  - CSRF validation on form endpoints (contact.php, newsletter.php)
  - Cache directory not accessible via HTTP (.htaccess deny rule)
  - `_config.php` is gitignored and not in source control
- Verify PHP-to-JS field contracts: every field the JS reads from an API response must exist in the PHP output
- Check for PHP files that may have been added without security hardening

## Dimension 4: Accessibility (WCAG 2.1 AA)

- Run pa11y against all 8 dashboard URLs
- Check every chart container for appropriate ARIA roles and labels
- Verify all dynamic content updates have `aria-live="polite"` on their containers
- Check all interactive controls: toggles, selectors, tabs, buttons for:
  - Keyboard accessibility (Enter/Space activation, Escape to close)
  - Focus management (visible focus indicators, logical tab order)
- ARIA states (aria-expanded, aria-pressed, aria-current, aria-selected)
- Verify skip links and `tabindex="-1"` on all `<main>` elements
- Check color contrast ratios on all text (especially on glassmorphism backgrounds)
- Verify `prefers-reduced-motion` is respected in all animation paths (CSS + JS)
- Check all form inputs have associated labels
- D3 heatmap breadcrumbs: keyboard navigable with `role=button`
- Combobox (county search): full ARIA pattern (role, aria-autocomplete, aria-controls, aria-activedescendant, aria-expanded)?

## Dimension 5: UI/UX Visual Consistency

- Are all dashboards visually consistent? Check:
  - Color palette usage (PAL/low/mid/high, COLORS.primary/secondary/accent)
  - Legend positioning and text styles
  - Tooltip formatting (consistent structure, correct colors, proper units)
  - Chart spacing, grid margins, font sizes
  - Glassmorphism effects preserved (backdrop-filter, rgba backgrounds)
  - Mobile responsive: do all charts render properly at 360px, 768px, 1024px, 1440px?
  - Dashboard tab navigation: correct active states, proper highlighting
  - Hero stat counters: animated, correct prefix/suffix, dynamic from data
  - Freshness badges: consistent styling and placement
  - Scroll reveal animations triggering correctly
  - Logo spinning effect and particles rendering
- Check for any visual regressions from the 15 phases of changes

## Dimension 6: Cross-Page Consistency

- Navigation: all 8 links present and correct on every dashboard?
- Dashboard tabs: all 7 tabs present, correct active state per page
- Meta tags: consistent author, description, OG tags across all dashboard HTML?
- JSON-LD structured data present and valid on each dashboard?
- Canonical URLs correct (food-n-force.com, not foodnforce.com)
- Footer consistent across all pages?
- "Read Next" or cross-dashboard links working?
- Sitemap includes all dashboards (except nonprofit-profile which is noindex)?

## Dimension 7: Performance & Bundle Size

- Check Lighthouse scores for all 6 main dashboards (skip directory/profile — need live API)
- Verify against performance budgets:
  - CSS: ~125KB minified (~20KB gzipped)
  - JS Core: ~53KB total (~16KB gzipped)
  - Dashboard JS: ~15-25KB each
  - ECharts chunk: ~645KB (~210KB gzipped, shared)
  - D3 chunk: ~16KB (~5KB gzipped)
- Are there any render-blocking resources?
- Core Web Vitals: CLS, LCP, FID/INP targets met?
- Are all images optimized (SVGs for illustrations)?
- Is code splitting working correctly (ECharts + D3 only loaded on dashboard pages)?
- Check for unnecessary bundle bloat (unused imports, dead code in dash chunks)

## Dimension 8: SEO & Structured Data

- All dashboard pages have unique, descriptive `<title>` and `<meta name="description">`?
- JSON-LD WebPage or Dataset schema on each dashboard?
- Open Graph and Twitter Card meta tags present?
- `<meta name="author">` consistent "Food-N-Force"? consistent everywhere?
- Canonical URLs correct?
- sitemap.xml includes all public dashboards?
- No broken internal links?
- Heading hierarchy (h1 → h2 → h3) correct on each page?

## Dimension 9: Error Handling & Resilience

- What happens when each API proxy returns an error or times out?
- Do all dashboards have try/catch in their init() with user-visible error states?
- Do charts show fallback/empty states when data is unavailable?
- Are all 'fetchWithFallback' and fire-and-forget patterns handling failures silently?
- Executive Summary: does the error banner work?
- Does the SDOH section show "Social determinants data unavailable" on API failure?
- Are there any unhandled promise rejections?
- What happens with stale cache files — does the `_stale` flag work correctly?

## Dimension 10: Test Coverage & Quality

- What percentage of render functions have unit tests?
- List ALL untested exported functions across all 6 dashboard JS files
- Are there any tests that are vacuous (always pass regardless of code)?
- Do tests actually verify behavior, or just check source code strings?
- Are Playwright tests covering all interactive features (toggles, drill-downs, selectors)?
- Is there test coverage for:
  - Every PHP proxy error path?
  - Every chart's tooltip formatter?
  - Edge cases (empty data, zero values, null values, single-state result)?
  - Cross-dataset loading failures (what if food-bank-summary.json fails to load on food-insecurity dash)?
- Mobile-specific rendering?

## Dimension 11: Code Quality & Maintainability

- Any functions over 200 lines that should be broken up?
- Duplicate code patterns across dashboard JS files?
- Are there any 'eslint-disable' comments that can be removed?
- Is the shared `dashboard-utils.js` well-organized or becoming a dumping ground?
- Are there any circular dependencies?
- Is the D3 heatmap module well-documented?
- Are there any leftover TODO/FIXME/HACK comments?
- Dead code: unused exports, unreachable branches, commented-out blocks?

## Dimension 12: Browser Compatibility

- Do all dashboards work in Chrome, Firefox, Safari, Edge?
- Do glassmorphism fallbacks work in browsers without backdrop-filter?
- Are there any CSS features used without proper fallbacks?
- Does the canvas particle system work across browsers?
- ECharts rendering: any browser-specific quirks?
- D3 heatmap: SVG rendering consistent across browsers?

## Dimension 13: Data Pipeline & Build Integrity

- Does `build-components.js` correctly inject nav/footer/tabs/scripts into all 72 pages?
- Does `scripts/sync-blog.js` correctly rebuild the blog card grid?
- Does `scripts/generate-sitemap.js` include all pages?
- Is `.pa11yci.json` up to date with all pages?
- Does `lighthouserc.json` include all 6 dashboard URLs?
- Does `vite.config.js` correctly discover all HTML entry points?
- Are all Vite dev server proxy entries working for local development?
- Does `npm run build` produce a clean `dist/` with no missing assets?

## Dimension 14: Deployment & Caching Safety

- Is `.htaccess` correctly configured (no HTML caching, hashed asset caching)?
- Does rsync --delete handle stale files correctly?
- Are all GitHub Secrets (BLS, FRED, Mapbox, Charity Navigator API keys) present?
- Does CI/CD write `_config.php` correctly on deploy?
- Is the Jira auto-transition working on PR merge?
- Are there any files in `dist/` that shouldn't be deployed?

## Dimension 15: Business & Content Quality

- Do dashboards tell a coherent story for grant writers and nonprofit leaders?
- Are CTAs or next-step prompts present where appropriate?
- Is the academic tone appropriate for the audience, or should it be more actionable?
- Are data source attributions clear and visible?
- Do the "Learn more" or methodology sections build credibility?
- Is there a clear path from dashboards → services → contact for potential clients?

## Dimension 16: Privacy & Compliance

- Are any user-identifiable data points exposed in API responses?
- Do PHP proxies log anything sensitive (IP addresses, search queries)?
- Is the CSP header in `_headers` correctly configured?
- Are SRI hashes present on external CDN resources (SLDS)?
- Does the site comply with basic GDPR considerations (no tracking without consent)?
- Are Sentry and GA4 configured with appropriate data filtering?

---

## Output Format

For EACH dimension, produce:

1. **"Status":** GREEN (no issues), YELLOW (minor/low-priority), RED (needs immediate fix)
2. **"Findings":** numbered list with severity (P0 Critical / P1 Major / P2 Minor / P3 Info)
3. **"Evidence":** file path + line number or specific data point for each finding
4. **"Recommendation":** what to fix and how

Then produce a **"CONSOLIDATED REMEDIATION PLAN"** sorted by priority:

- **P0:** Must fix before next deploy
- **P1:** Fix this sprint
- **P2:** Fix when convenient
- **P3:** Backlog / future enhancement

Include estimated effort (S/M/L) and risk level for each item.

---

## Important

Do NOT make any code changes. This is diagnostic only. Save the full report to `audit-results/comprehensive-audit-2026-MM-DD.md`.

## Constraints

- NEVER modify glassmorphism effects, logo animations, background effects, or particle system
- NEVER change text content, emoji icons, or section order
- NEVER introduce `@layer` declarations (blocked by SLDS CDN)
- NEVER add inline styles or `<style>` tags (blocked by CSP)
- The site runs on SiteGround shared hosting — no Node.js, server, no Redis, no Docker
- All API keys are in `_config.php` which is gitignored — they are NOT exposed
