# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Food-N-Force website - A nonprofit food bank and pantry solution built with modern web standards, SLDS compliance, and multi-agent governance framework. Features glassmorphism effects, premium background animations, and comprehensive accessibility support.

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
├── src/data/              # Source data files (food insecurity JSON, GeoJSON)
├── src/assets/            # Images, fonts
├── *.html                 # 10 root pages (index, about, services, resources, impact, contact, 404, blog, case-studies, templates-tools)
├── dashboards/            # Interactive ECharts dashboards
├── blog/                  # 53 article HTML pages
├── Blog and Article Content/  # Editorial tools (scraper + AI generator) — NOT deployed
├── scripts/               # Build scripts, scraper engine, sitemap/blog generators
├── public/                # Static assets, PWA manifest, PHP API endpoints, dashboard data files
│   ├── data/              # Dashboard JSON (state/county data, BLS CPI, GeoJSON, county search index)
│   └── api/               # PHP backend (contact, newsletter, csrf, dashboard proxies)
├── config/                # token_map, deployment, security configs
├── docs/                  # Active documentation
├── tools/                 # Testing, deployment, governance utilities
├── vite.config.js         # Vite build config (auto-discovers *.html and blog/*.html)
└── build-components.js    # Injects nav/footer/dashboard-tabs/scripts into all 68 pages before Vite builds
```

### Page Inventory (68 pages)
- **Core pages (7)**: index, about, services, resources, impact, contact, 404
- **Blog hub (1)**: blog
- **Hub pages at root (2)**: case-studies, templates-tools
- **Dashboards (7)**: dashboards/food-insecurity (Overview), dashboards/food-access, dashboards/snap-safety-net, dashboards/food-prices, dashboards/food-banks, dashboards/nonprofit-directory, dashboards/nonprofit-profile — linked by shared tab navigation (6 tabs; profile shares the Directory tab)
- **Articles (53)**: all in `blog/` directory (run `ls blog/` for full list)

### Case Studies
4 featured case studies on `case-studies.html` (real Salesforce implementations):
1. Second Harvest Food Bank of Central Florida — 250K meals/month, ~100 partner sites
2. Feeding America — 2B+ pounds recovered, 200 food banks, MealConnect
3. Midwest Food Bank — 400hrs saved/chapter/year, 95%+ email capture
4. National Food Bank Supply Chain — 50% faster delivery, 60% less compliance time

Case study cards also appear on `blog.html` and testimonials on `impact.html`.
10 additional case studies published as individual blog articles (category: Case Studies).

**Adding new articles via scraper tool**: `npm run admin` → New Article tab → Generate with Claude → Save to blog/. Auto-registers in `build-components.js`, `generate-sitemap.js`, and `.pa11yci.json`, then runs `build-components.js` and `sync-blog.js`. After saving, run `/create-illustration {slug}` to generate the SVG illustration.

**Adding new articles manually**: Place HTML in `blog/`, then run `/register-article {slug}` to register in all required files and run sync scripts. Or manually: register slug in both arrays of `build-components.js`, `scripts/generate-sitemap.js`, and `.pa11yci.json`, then run `node build-components.js && node scripts/sync-blog.js`.

### Navigation
8 links: Home | Services | Resources | Dashboards | Impact | Contact | Blog | About Us
- **Dashboards** highlights only when on a dashboard page (not Resources)
- **Blog** highlights only when on blog hub or any article page (not Resources)
- **Resources** highlights only for resources.html, case-studies, templates-tools
- Navigation arrays in `build-components.js`: `dashboardSubpages`, `blogSubpages`, `resourcesSubpages`

### Build Pipeline
- `build-components.js` injects shared nav, footer, dashboard tabs, and script tags into all 68 pages before Vite builds
- `scripts/sync-blog.js` rebuilds blog.html card grid from article metadata (auto-run on build)
- `scripts/generate-sitemap.js` generates sitemap.xml covering all public pages
- ECharts is tree-shaken and code-split into a separate chunk loaded only on dashboard pages

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
  - `dashboards/shared/dashboard-utils.js` — shared ECharts setup (incl. GaugeChart, ThemeRiverChart, SingleAxisComponent), colors, MAP_PALETTES, formatters, linearRegression, NTEE_MAP, US_STATES, getNteeName, scroll reveal
  - `dashboards/food-insecurity.js` — Food Insecurity Overview dashboard (separate entry point)
  - `dashboards/food-access.js` — Food Access & Deserts dashboard
  - `dashboards/snap-safety-net.js` — SNAP & Safety Net dashboard
  - `dashboards/food-prices.js` — Food Prices & Affordability dashboard
  - `dashboards/food-banks.js` — Food Bank Landscape dashboard
  - `dashboards/nonprofit-directory.js` — Nonprofit Directory search (ProPublica API, debounced search, state filter, pagination)
  - `dashboards/nonprofit-profile.js` — Nonprofit Profile with 6 ECharts (revenue trend, composition, expenses vs revenue, assets/liabilities, compensation, efficiency radar) + dynamic data-driven descriptions with conditional insights
- **Production**: Source maps disabled, ESLint `no-console` rule enforced
- **Unit Tests**: ~161 tests across 9 test files (vitest)

### PHP Backend (SiteGround)
- **Location**: `public/api/` (copied to `dist/api/` during build)
- **Deployment**: GitHub Actions → SSH/rsync to SiteGround `public_html/`
- **Endpoints**:
  - `POST /api/contact.php` — contact form (validates, sanitizes, sends via `mail()`)
  - `POST /api/newsletter.php` — newsletter subscription
  - `GET /api/csrf-token.php` — single-use CSRF tokens (session-based)
  - `GET /api/dashboard-census.php` — Census Bureau ACS proxy (24hr file cache)
  - `GET /api/dashboard-bls.php` — BLS CPI food price proxy (7-day file cache)
  - `GET /api/nonprofit-search.php` — ProPublica nonprofit search proxy (24hr file cache, params: q, state, page)
  - `GET /api/nonprofit-org.php` — ProPublica org detail proxy (7-day file cache, param: ein)
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
- **CSS**: ~125KB minified (~20KB gzipped)
- **JS Core**: ~53KB total (47KB main + 5KB effects, ~16KB gzipped)
- **Dashboard**: ~15-25KB per dashboard JS + ~645KB ECharts chunk (~210KB gzipped, shared across all 5 dashboard pages)
- **Core Web Vitals**: CLS 0.0000, LCP <2.5s mobile
- **Unit Test Coverage**: 65% threshold
- **Lighthouse Configs**: `lighthouse.config.js` (local) vs `tools/testing/lighthouserc.json` (CI)

### Special Effects Validation
- Glassmorphism fallbacks work in all browsers
- Background animations maintain >60fps
- Logo effects readable at all zoom levels (including 25% — client requirement)
- Reduced motion preferences respected

## Development Workflow (Jira + GitHub)

All development work follows this branch-based workflow tied to Jira stories:

1. **Pick a story** — user specifies the Jira issue key (e.g. "let's work on KAN-82")
2. **Move to In Progress** — Claude transitions the story to In Progress in Jira before touching any code
3. **Create branch** — named `KAN-XX-short-description` (e.g. `KAN-82-newsletter-notification`)
4. **Do the work** — all commits reference the issue key: `KAN-82 Add admin notification to newsletter.php`
5. **Push branch** — Claude pushes the branch to GitHub
6. **Open PR** — PR title includes the issue key; GitHub Actions automatically moves the story to In Review
7. **User merges PR** — the only step the user handles manually
8. **GitHub Actions** — automatically moves the story to Done on merge

### Jira Project
- **Board**: KAN project at foodnforce.atlassian.net (Kanban)
- **Transition IDs**: 21 = In Progress, 31 = In Review, 41 = Done
- **MCP**: mcp-atlassian configured in `.mcp.json` (gitignored)
- **GitHub integration**: GitHub for Atlassian app connected; commits/PRs with KAN keys appear on issue Development panel

### Key Rule
Never commit directly to master for story work — always use a branch and PR so the GitHub Actions workflow can update Jira automatically and the CI/CD pipeline runs before merge.

## Agent Framework

### Skills (3)
Reusable slash-command workflows in `.claude/skills/`:
- **`/create-illustration {slug}`** — reads a blog article and creates a matching SVG illustration following the project style guide
- **`/register-article {slug}`** — registers a manually added article in all required files (`build-components.js`, `generate-sitemap.js`, `.pa11yci.json`) and runs sync scripts
- **`/quality-sweep [scope]`** — launches validation agents in parallel (`all`, `content`, `css`, `deploy`) and presents a unified pass/fail summary

### Project-Specific Agents (10)
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

## Common Issues

### CSS Cascade Conflicts
- Import order in `main.css` determines cascade priority — `@layer` is blocked by SLDS CDN
- Only 9 `!important` declarations remain (utility classes and accessibility media queries)

### CSP Compliance
- `_headers` CSP forbids `unsafe-inline` for both scripts and styles
- CSSOM property assignment (`element.style`) is CSP-compliant — only HTML `style=""` attributes and `<style>` tags are blocked
- SLDS CDN has SRI hash (auto-added by `build-components.js`)

## Configuration Files
- `tools/testing/html-validate.json` — HTML validation rules
- `tools/testing/lighthouserc.json` — Performance audit config
- `tools/testing/playwright.config.js` — Browser testing (builds + preview server before tests)
- `.pa11yci.json` — Pa11y accessibility testing (WCAG2AA, all public pages)
- `config/token_map.json` — SLDS compliance token mappings
- `vite.config.js` — Vite build system
- `_headers` — Security headers and CSP policy

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
