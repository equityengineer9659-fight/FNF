# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Food-N-Force website - A nonprofit food bank and pantry solution built with modern web standards, SLDS compliance, and multi-agent governance framework. Features glassmorphism effects, premium background animations, and comprehensive accessibility support.

This project uses JavaScript (not TypeScript), HTML, CSS, Markdown, and YAML. The site is built with Vite. Always run `npm run build` to verify changes compile correctly before committing.

## Development Commands

```bash
# Development
npm run dev                      # Vite development server
npm run build                    # Vite production build
npm run preview                  # Preview production build
npm run build:full               # Complete pipeline: lint → validate → test → build

# Linting
npm run lint                     # All linting (HTML, CSS, JS)
npm run lint:fix                 # Auto-fix CSS and JS issues

# Validation
npm run validate:html            # W3C HTML validation
npm run validate:slds           # SLDS compliance check

# Testing
npm run test                     # All tests (accessibility, performance, browser)
npm run test:accessibility       # pa11y accessibility tests
npm run test:performance         # Lighthouse CI audits
npm run test:browser             # Playwright browser tests
npm run test:performance-budget  # Performance budget monitoring
npm run analyze:bundle           # Vite bundle analyzer
npm run generate:pa11y           # Regenerate .pa11yci.json from filesystem (--mode=full|sample)

# Deployment
npm run deploy:staging          # SiteGround staging (GitHub Actions → staging branch)
npm run deploy:production       # SiteGround production (GitHub Actions → master)

# Blog Content Pipeline
npm run admin                   # Start Express server for scraper + AI article generator (http://localhost:3001)
```

## Code Architecture

### File Structure
```
/
├── src/css/               # 13 CSS files (main.css imports all modules)
├── src/js/                # JS modules (main.js, effects/, dashboards/, config/, monitoring/)
├── src/data/              # Source data files (GeoJSON)
├── src/assets/            # Images, fonts
├── *.html                 # 10 root pages (index, about, services, resources, impact, contact, 404, blog, case-studies, templates-tools)
├── dashboards/            # Interactive ECharts dashboards
├── blog/                  # 53 article HTML pages
├── Blog and Article Content/  # Editorial tools (scraper + AI generator) — NOT deployed
├── scripts/               # Build scripts, scraper engine, sitemap/blog generators
├── public/                # Static assets, PWA manifest, PHP API endpoints, dashboard data files
│   ├── data/              # Dashboard JSON (state/county data, BLS CPI, GeoJSON, county search index, SNAP participation)
│   └── api/               # PHP backend (contact, newsletter, csrf, dashboard proxies)
├── config/                # token_map, deployment, security configs
├── docs/                  # Active documentation
├── tools/                 # Testing, deployment, governance utilities
├── vite.config.js         # Vite build config (auto-discovers *.html and blog/*.html)
└── build-components.js    # Injects nav/footer/dashboard-tabs/scripts into all 72 pages before Vite builds
```

### Page Inventory (72 pages)
- **Core pages (7)**: index, about, services, resources, impact, contact, 404
- **Blog hub (1)**: blog
- **Hub pages at root (2)**: case-studies, templates-tools
- **Dashboards (8)**: dashboards/executive-summary, dashboards/food-insecurity (Overview), dashboards/food-access, dashboards/snap-safety-net, dashboards/food-prices, dashboards/food-banks, dashboards/nonprofit-directory, dashboards/nonprofit-profile — linked by shared tab navigation (7 tabs; profile shares the Directory tab)
- **Articles (53)**: all in `blog/` directory (run `ls blog/` for full list)

### Case Studies
4 featured case studies on `case-studies.html` (real Salesforce implementations) + 10 blog articles (category: Case Studies). Cards appear on `blog.html`, testimonials on `impact.html`. Details in memory: `project_case_studies.md`

**Adding new articles via scraper tool**: `npm run admin` → New Article tab → Generate with Claude → Save to blog/. Runs `build-components.js` and `sync-blog.js` automatically. After saving, run `/create-illustration {slug}` to generate the SVG illustration.

**Adding new articles manually**: Place HTML in `blog/`, then run `/register-article {slug}` to run build scripts. Or manually: `node build-components.js && node scripts/sync-blog.js`. No config file edits needed — all build scripts auto-discover articles from the `blog/` directory via glob.

### Navigation
8 links: Home | Services | Resources | Dashboards | Impact | Contact | Blog | About Us
- **Dashboards** highlights only when on a dashboard page (not Resources)
- **Blog** highlights only when on blog hub or any article page (not Resources)
- **Resources** highlights only for resources.html, case-studies, templates-tools
- Navigation arrays in `build-components.js`: `dashboardSubpages`, `blogSubpages`, `resourcesSubpages`

### Build Pipeline
- `build-components.js` auto-discovers blog articles from `blog/` via glob, then injects shared nav, footer, dashboard tabs, and script tags into all pages before Vite builds
- `scripts/sync-blog.js` rebuilds blog.html card grid from article metadata (auto-run on build)
- `scripts/generate-sitemap.js` auto-discovers blog articles from `blog/` via glob and generates sitemap.xml
- `scripts/generate-pa11y-config.js` auto-generates `.pa11yci.json` from filesystem (`--mode=full|sample`)
- ECharts is tree-shaken and code-split into a separate chunk loaded only on dashboard pages
- **Adding blog articles requires zero config file edits** — just drop HTML in `blog/` and run build scripts

### Blog Content Pipeline
AI-powered article generator + RSS scraper. Requires `npm run admin` and `ANTHROPIC_API_KEY` in `.env`. Full workflow: Scraper tab → select sources → New Article tab → Generate with Claude → Preview → Save to blog/. Illustrations created separately by Claude Code for better quality. See `docs/current/blog-content-pipeline.md` for full guide.

### CSS Architecture
- **Import Order**: reset → design-tokens → navigation → typography → layout → effects → components → icons → critical-gradients → page-overrides → dashboards → nonprofit-directory
- **Design Tokens**: Centralized in `02-design-tokens.css` (colors, spacing, fonts, gradients, glass effects)
- **Navigation**: Single source of truth in `03-navigation.css`
- **Note**: `@layer` declarations NOT used — blocked by SLDS CDN dependency (un-layered SLDS overrides layered custom CSS)
- **SLDS Compliance**: 89% baseline, token mapping in `config/token_map.json`, validate with `npm run validate:slds`

### JavaScript Architecture
- **Progressive Enhancement**: HTML-first, JavaScript optional
- **Vite Build**: Tree-shaking + Terser minification
- **Modules** (`src/js/main.js` orchestrates all):
  - `config/environment.js` — feature flags
  - `effects/particles.js` — canvas particle system
  - `effects/smart-scroll.js` — nav auto-hide, active links, scroll-to-top
  - `effects/counters.js` — animated counters (aria-live announces final value, formats: percentage, plus, thousand, million, billion)
  - `effects/newsletter-popup.js` — scroll-triggered modal with focus trap, CSRF validation
  - `effects/gradient-icons.js` — SVG gradient icons
  - `effects/contact-form.js` — form submission with CSRF token validation
  - `effects/article-enhancements.js` — article reading enhancements
  - `effects/blog-filter.js` — category filtering (aria-pressed + aria-current)
  - `monitoring/sentry.js`, `error-tracker.js`, `performance-monitor.js`
  - `expertise-accordion.js` — mobile accordion for about page
  - `dashboards/shared/dashboard-utils.js` — shared ECharts setup, colors, MAP_PALETTES, formatters, linearRegression, US_STATES, `updateFreshness()` (two-state: `_static` → "Data: year", else → "Live"), `animateCounters()` (respects prefers-reduced-motion, integer-aware)
  - `dashboards/shared/d3-heatmap.js` — D3 zoomable heatmap module. Exports: `createD3Heatmap()`, `buildHeatmapLegend()`, `buildRegionChips()`, `createRankNorm()` (rank-based normalization preventing outlier compression), `sampleGradient()`, `tileTextColor()`, `tileSubTextColor()`, `HEATMAP_REGION_COLORS`. 7-stop value gradient, SVG per-tile depth gradient, adaptive text contrast, keyboard-accessible breadcrumbs.
  - `dashboards/food-insecurity.js` — Food Insecurity Overview dashboard (12 charts: map with SNAP Coverage metric + county drill-down, trend with markLine annotations, radar, scatter, SDOH, demographics, income river, meal cost bar, CPI trend, SNAP coverage bars, Triple Burden Index, State Deep-Dive KPI panel). Loads current-food-access.json + food-bank-summary.json for cross-dataset features.
  - `dashboards/food-access.js` — Food Access & Deserts dashboard. **Map toggle**: Food Deserts ↔ Food Insecurity ↔ SNAP Retailers on single chart instance (drill-down in deserts + insecurity modes). **Double Burden dual-mode**: "Total Affected" (D3 treemap, √-scaled area) and "Rate Comparison" (equal CSS Grid tiles, sorted by rate) with toggle, outlier emphasis on top-20% states.
  - `dashboards/snap-safety-net.js` — SNAP & Safety Net dashboard (Sankey data from `snap-participation.json`). 5 KPI gauges (coverage, lunch, benefit, gap, affordability shortfall). SNAP Purchasing Power Index line on trend chart.
  - `dashboards/food-prices.js` — Food Prices & Affordability dashboard (live BLS regional CPI data). CPI vs Food Insecurity dual-axis chart (loads food-insecurity-state.json for trend overlay). FRED item-level CPI toggles (gradient restoration after JSON clone).
  - `dashboards/food-banks.js` — Food Bank Landscape dashboard. Revenue heatmap (D3, `createRankNorm`). Regression line suppressed when |r| < 0.2 with dynamic insight text. Need-Capacity Gap scatter (revenue per insecure person vs insecurity rate).
  - `dashboards/nonprofit-directory.js` — Nonprofit Directory search (ProPublica API, debounced search, state filter, pagination)
  - `dashboards/nonprofit-profile.js` — Nonprofit Profile with 6 ECharts (revenue trend, composition, expenses vs revenue, assets/liabilities, compensation, efficiency radar) + dynamic data-driven descriptions with conditional insights
- **Production**: Source maps disabled, ESLint `no-console` rule enforced
- **ESLint 10.x** with flat config (`eslint.config.js`)
- **Unit Tests**: ~569 tests across 22 test files (vitest)

### PHP Backend (SiteGround)
- **Location**: `public/api/` (copied to `dist/api/` during build)
- **Deployment**: GitHub Actions → SSH/rsync to SiteGround `public_html/`
- **Stack**: nginx reverse proxy in front of Apache backend. Responses say `Server: nginx` but `public/.htaccess` (Apache mod_headers) is what sets headers. There is no nginx config to edit.
- **Endpoints**: 3 form endpoints (`contact.php`, `newsletter.php`, `csrf-token.php`) + 10 dashboard API proxies (BLS, Census, SDOH, SAIPE, PLACES, FRED, ProPublica search/org, Mapbox, Charity Navigator) + `cache-cleanup.php` (cron). Full inventory with cache TTLs in memory: `project_dashboard.md`
- **Security**: Rate limiting (60s cooldown), CSRF validation (`hash_equals()`), honeypot field, input sanitization (`htmlspecialchars()`), email validation (`FILTER_VALIDATE_EMAIL`), CRLF header injection prevention
- **Recipient**: All form emails to `hello@food-n-force.com`

### Critical Constraints
**NEVER modify these without explicit permission:**
- Logo special effects (CSS animations, gradients, transforms)
- Background spinning effects (mesh/iridescent on index, services, resources, about)
- **Glassmorphism effects are PROTECTED** (navigation, hero sections, cards) — all `backdrop-filter`, `rgba()` backgrounds, glass effects must be preserved
- Blue circular gradients for emoji icons
- Text content, emoji icons, or section order

## Testing & Performance

### Performance Budgets
- **CSS**: ~150KB minified (~25KB gzipped)
- **JS Core**: ~53KB total (47KB main + 5KB effects, ~16KB gzipped)
- **Dashboard**: ~15-25KB per dashboard JS + ~645KB ECharts chunk (~210KB gzipped, shared across all 5 dashboard pages)
- **Core Web Vitals**: CLS 0.0000, LCP <2.5s mobile
- **Unit Test Coverage**: 65% threshold
- **Lighthouse Configs**: `lighthouse.config.js` (local) vs `tools/testing/lighthouserc.json` (CI)
- **Pa11y CI**: Sample mode on push (non-blog pages + 5 random articles), full sweep weekly via scheduled workflow

### Special Effects Validation
- Glassmorphism fallbacks work in all browsers
- Background animations maintain >60fps
- Logo effects readable at all zoom levels (including 25% — client requirement)
- Reduced motion preferences respected

## Development Workflow (Jira + GitHub)

### Story Work (Jira-tracked)

When the user specifies a Jira issue key (e.g. "let's work on KAN-82"):

1. **Move to In Progress** — Claude transitions the story to In Progress in Jira before touching any code
2. **Create branch** — named `KAN-XX-short-description` (e.g. `KAN-82-newsletter-notification`)
3. **Do the work** — all commits reference the issue key: `KAN-82 Add admin notification to newsletter.php`
4. **Push branch** — Claude pushes the branch to GitHub
5. **Open PR** — PR title includes the issue key; GitHub Actions automatically moves the story to In Review
6. **User merges PR** — the only step the user handles manually
7. **GitHub Actions** — automatically moves the story to Done on merge

### Ad Hoc Work (no Jira story)

When the user asks for work without referencing a Jira issue key:

1. **Create a fresh branch from master** — named `chore/short-description` (e.g. `chore/code-review-fixes`, `chore/add-skills`). Never reuse an existing story branch.
2. **Do the work** — commits use plain descriptive messages (no `KAN-XX` prefix)
3. **Push branch** — Claude pushes the branch to GitHub
4. **Open PR** — when the work is complete and ready to merge
5. **User merges PR** — the Jira workflow runs but skips all jobs (no `KAN-` key found), which is expected

### Jira Project
- **Board**: KAN project at foodnforce.atlassian.net (Kanban)
- **Transition IDs**: 21 = In Progress, 31 = In Review, 41 = Done
- **MCP**: mcp-atlassian configured in `.mcp.json` (gitignored)
- **GitHub integration**: GitHub for Atlassian app connected; commits/PRs with KAN keys appear on issue Development panel

### Key Rule
Never commit directly to master — always use a branch and PR so the CI/CD pipeline runs before merge.

## Git Workflow

Always push to the remote after committing. Never stop at just a local commit unless explicitly told to.

## Data & APIs

When working on dashboards, always verify API endpoint URLs are current and field mappings match the actual API response schema before committing.

## Frontend Development

After making frontend changes, run the build and verify the output. Do not assume dev server hot-reload reflects production. Clear caches when debugging visual issues.

## Project Management

When given JIRA instructions, follow them exactly — correct epic, correct scope. Do not start code work when the user asks for JIRA-only tasks.

## Agent Framework

### Skills (5)
Reusable slash-command workflows in `.claude/skills/`:
- **`/create-illustration {slug}`** — reads a blog article and creates a matching SVG illustration following the project style guide
- **`/register-article {slug}`** — registers a manually added article in all required files (`build-components.js`, `generate-sitemap.js`, `.pa11yci.json`) and runs sync scripts
- **`/quality-sweep [scope]`** — launches validation agents in parallel (`all`, `content`, `css`, `deploy`) and presents a unified pass/fail summary
- **`/test-fix [scope]`** — systematic code review with test-first fixes: explore → find bugs → write failing test → fix → verify green → next issue. Scope: file path, category (`security`, `performance`, `tests`, `bugs`, `dead-code`), or omit for full review
- **`verify-changes`** *(auto-invoked, not a slash command)* — Claude auto-invokes after modifying source files: writes tests, runs vitest, verifies build + lint. Scoped to JS, PHP, HTML, CSS, and build scripts via `paths` filter

### Project-Specific Agents (12)
Custom agents in `.claude/agents/` tailored to this project:
- **slds-compliance-checker** — validates CSS against SLDS token map; use after CSS changes
- **accessibility-auditor** — WCAG 2.1 AA checks; use after HTML changes
- **cross-page-consistency** — SEO tags, link integrity, Read Next cards; use after content changes
- **performance-budget-monitor** — bundle sizes against budgets; use after builds
- **php-security-reviewer** — PHP injection, CSRF, validation gaps; use when PHP changes
- **uiux-reviewer** — visual consistency, responsive layout; use after visual changes
- **seo-auditor** — JSON-LD, sitemap, meta tags; use after adding pages
- **content-reviewer** — brand voice, article structure, SEO; use before publishing articles
- **technical-architect** — SLDS CDN constraints, SiteGround limits, glassmorphism protection; use before structural changes
- **business-analyst** — CTA clarity, value proposition, conversion paths; use when modifying service pages
- **data-scientist** — trend analysis, correlations, anomalies, visualization recommendations; use after data updates or to improve dashboard insights
- **project-manager** — sprint planning, story prioritization, dependency mapping, status reporting; use when planning work or reviewing backlog

## Common Issues

### CSS Cascade Conflicts
- Import order in `main.css` determines cascade priority — `@layer` is blocked by SLDS CDN
- Only 9 `!important` declarations remain (utility classes and accessibility media queries)

### CSP Compliance
- **NOT yet enforced in production.** `_headers` (Netlify format) is dead code on SiteGround Apache; CSP migration to `.htaccess` is pending PR B (see `project_security_headers_2026_04_10.md` memory)
- HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy are live in production via `public/.htaccess` `Header always set` directives (PR #95, 2026-04-10)
- When CSP lands it will use `style-src 'self'` (no unsafe-inline) — any new inline `style=""` attribute or `<style>` block will need to be migrated first
- SLDS CDN has SRI hash (auto-added by `build-components.js`)
- Sentry DSN host for `connect-src`: `o4510112854704128.ingest.us.sentry.io`

### Browser Compatibility
- **Minimum supported**: Safari 15+, Firefox 87+, Chrome 90+ (matches the `AbortController` signal pattern used across `src/js/effects/*` and `main.js`)
- `backdrop-filter` always shipped with the `-webkit-backdrop-filter` prefix (glassmorphism protected rule)
- No CSS nesting, `:has()`, container queries, or `color-mix()` until all three targets support them

### Verifying production state
- **Don't trust config files alone.** `_headers` was dead for months; nobody noticed because nobody curl'd the live site.
- Canonical header check: `curl -sI https://food-n-force.com/dashboards/food-insecurity.html`
- Canonical body check: `curl -s https://food-n-force.com/<path> | head -50`
- For investigations into "is X actually enforced?", always verify against the wire before editing config files.

## Configuration Files
- `tools/testing/html-validate.json` — HTML validation rules
- `tools/testing/lighthouserc.json` — Performance audit config
- `tools/testing/playwright.config.js` — Browser testing (builds + preview server before tests)
- `.pa11yci.json` — Pa11y accessibility testing (WCAG2AA, all public pages)
- `config/token_map.json` — SLDS compliance token mappings
- `vite.config.js` — Vite build system
- `public/.htaccess` — Apache config; **the actual production source of truth** for security headers, cache rules, and 404 routing on SiteGround
- `_headers` — DEAD CODE (Netlify format, ignored by Apache); kept until CSP migration completes, then deletable

## Documentation
- `docs/README.md` — Documentation navigation hub
- `docs/project/plan.md` — Strategic refactoring plan
- `docs/project/risks.md` — Risk register
- `docs/SECURITY.md` — Security procedures
- `docs/MONITORING.md` — Error tracking (Sentry) and analytics (GA4) setup
- `docs/CICD_SETUP.md` — CI/CD pipeline configuration
- `docs/current/blog-content-pipeline.md` — Full scraper + article generator guide
- `docs/current/emergency/15min-response-playbook.md` — Emergency response
- `docs/technical/adr/` — 16 Architecture Decision Records
