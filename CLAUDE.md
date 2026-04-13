# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project Overview

Food-N-Force website — nonprofit food bank / pantry solution built with Vite, SLDS-compliant CSS, and multi-agent governance. Features glassmorphism, premium background animations, and comprehensive accessibility support.

Stack: JavaScript (not TypeScript), HTML, CSS, Markdown, YAML. Always run `npm run build` before committing to verify the project compiles.

## Development Commands

```bash
# Development
npm run dev                      # Vite dev server
npm run build                    # Vite production build
npm run preview                  # Preview production build
npm run build:full               # lint → validate → test → build

# Linting
npm run lint                     # HTML + CSS + JS
npm run lint:fix                 # Auto-fix CSS + JS

# Validation
npm run validate:html            # W3C HTML
npm run validate:slds            # SLDS compliance

# Testing
npm run test                     # All tests
npm run test:accessibility       # pa11y
npm run test:performance         # Lighthouse CI
npm run test:browser             # Playwright
npm run test:performance-budget  # Budget monitoring
npm run generate:pa11y           # Regenerate .pa11yci.json (--mode=full|sample)

# Deployment (via GitHub Actions)
npm run deploy:staging           # staging branch → SiteGround staging
npm run deploy:production        # master → SiteGround production

# Blog Content Pipeline
npm run admin                    # Scraper + AI article generator at http://localhost:3001
```

## File Structure

```
/
├── src/css/               # 15 CSS files (main.css imports all modules)
├── src/js/                # main.js + effects/, dashboards/, config/, monitoring/
├── src/data/              # Source GeoJSON
├── src/assets/            # Images, fonts
├── *.html                 # 10 root pages
├── dashboards/            # 8 interactive ECharts dashboards
├── blog/                  # 53 article HTML pages
├── Blog and Article Content/  # Editorial tools (scraper + AI generator) — NOT deployed
├── scripts/               # Build scripts, scraper engine, sitemap/blog generators
├── public/
│   ├── data/              # Dashboard JSON
│   └── api/               # PHP backend (20 files)
├── config/                # token_map, deployment, security configs
├── docs/                  # Active documentation
├── tools/                 # Testing, deployment, governance utilities
├── vite.config.js         # Auto-discovers *.html and blog/*.html
└── build-components.js    # Injects nav/footer/dashboard-tabs/scripts into all 71 pages
```

## Page Inventory (71 pages)

- **Root pages (10)**: index, about, services, resources, impact, contact, 404, blog, case-studies, templates-tools
- **Dashboards (8)**: executive-summary, food-insecurity (Overview), food-access, snap-safety-net, food-prices, food-banks, nonprofit-directory, nonprofit-profile — shared 7-tab navigation (profile shares the Directory tab)
- **Articles (53)**: all in `blog/` — run `ls blog/` for the full list

Detailed dashboard module map: see [.claude/rules/dashboards.md](.claude/rules/dashboards.md) (auto-loads when editing dashboard files).

### Case Studies
4 featured case studies on `case-studies.html` (real Salesforce implementations) + 10 blog articles (category: Case Studies). Cards on `blog.html`, testimonials on `impact.html`.

### Adding blog articles
- **Via scraper**: `npm run admin` → New Article → Generate → Save to blog/ (auto-runs build scripts). Then `/create-illustration {slug}`.
- **Manually**: drop HTML in `blog/`, then `/register-article {slug}`. No config edits needed — everything auto-discovers via glob.

Full scraper/generator guide: see [.claude/rules/blog-pipeline.md](.claude/rules/blog-pipeline.md).

## Navigation

8 links: Home | Services | Resources | Dashboards | Impact | Contact | Blog | About Us
- **Dashboards** highlights only on dashboard pages
- **Blog** highlights only on blog hub or article pages
- **Resources** highlights for resources.html, case-studies, templates-tools
- Nav arrays live in `build-components.js` (`dashboardSubpages`, `blogSubpages`, `resourcesSubpages`)

## Build Pipeline

- `build-components.js` auto-discovers blog articles and injects shared nav/footer/dashboard-tabs/script tags into every page before Vite builds
- `scripts/sync-blog.js` rebuilds the blog.html card grid from article metadata
- `scripts/generate-sitemap.js` auto-discovers articles and writes sitemap.xml
- `scripts/generate-pa11y-config.js` auto-generates `.pa11yci.json` from filesystem
- ECharts is tree-shaken and code-split into a chunk loaded only on dashboard pages
- **Adding articles requires zero config edits** — drop in `blog/` and run the scripts

## CSS Architecture

- **Import order** in `main.css`: `01-reset → 02-design-tokens → 03-navigation → 04-typography → 05-layout → 06-effects → 07-components → 08-icons → critical-gradients → critical-inline → 10-page-overrides → 11-dashboards → 12-nonprofit-directory → 14-csp-utilities`
- **Design tokens** centralized in `02-design-tokens.css`
- **Navigation** single source of truth in `03-navigation.css`
- **`@layer` NOT used** — blocked by the SLDS CDN dependency (un-layered SLDS would override layered custom CSS)
- **SLDS compliance**: 89% baseline, token mapping in `config/token_map.json`, validate with `npm run validate:slds`

## JavaScript Architecture

- **Progressive enhancement** — HTML-first, JS optional
- **Vite** — tree-shaking + Terser minification
- **ESLint 10.x** flat config; `no-console` enforced in production
- **Unit tests**: ~569 vitest tests across 42 test files
- Module orchestration lives in `src/js/main.js`; shared effects in `src/js/effects/`; dashboards in `src/js/dashboards/` with shared helpers in `dashboards/shared/`

Detailed dashboard module descriptions: see [.claude/rules/dashboards.md](.claude/rules/dashboards.md).

## PHP Backend

Quick reference — full detail in [.claude/rules/php-backend.md](.claude/rules/php-backend.md) (auto-loads when editing `public/api/**`).

- **Location**: `public/api/` (copied to `dist/api/` during build)
- **Deployment**: GitHub Actions → SSH/rsync to SiteGround `public_html/`
- **Stack**: nginx reverse proxy in front of Apache. Response header says `Server: nginx` but `public/.htaccess` (Apache mod_headers) is what actually sets headers. No nginx config to edit.
- **Endpoints (20 files)**: 3 form endpoints, 10 dashboard API proxies, utilities (mapbox-geocode, rate-limit-status, cache-cleanup), 5 shared helpers (`_config`, `_cors`, `_rate-limiter`, `_validation`, `_config.example`)
- **Recipient**: all form emails go to `hello@food-n-force.com`

## Critical Constraints

**NEVER modify these without explicit permission:**
- Logo special effects (animations, gradients, transforms)
- Background spinning effects (mesh/iridescent on index, services, resources, about)
- **Glassmorphism effects are PROTECTED** — `backdrop-filter`, `rgba()` backgrounds, glass cards all preserved. `-webkit-backdrop-filter` prefix always paired with `backdrop-filter`.
- Blue circular gradients for emoji icons
- Text content, emoji icons, or section order

## Testing & Performance

Full budget numbers and config details in [.claude/rules/testing.md](.claude/rules/testing.md).

- **Core Web Vitals**: CLS 0.0000, LCP <2.5s mobile
- **Unit test coverage**: 65% threshold
- **Lighthouse configs**: `lighthouse.config.js` (local, relaxed) vs `tools/testing/lighthouserc.json` (CI, strict) — intentional split
- **Pa11y CI**: sample mode on push, full sweep weekly

## Development Workflow (Jira + GitHub)

### Story Work (Jira-tracked)
When the user provides a Jira key (e.g. "work on KAN-82"):
1. Move the story to **In Progress** in Jira before touching code
2. Create branch `KAN-XX-short-description`
3. Commits reference the issue key: `KAN-82 Add admin notification`
4. Push the branch
5. Open PR — title includes the key; GH Actions moves the story to **In Review**
6. User merges; GH Actions moves it to **Done**

### Ad Hoc Work (no Jira story)
1. **Fresh branch from master** — `chore/short-description`. Never reuse an existing story branch.
2. Plain commits (no `KAN-XX`)
3. Push + open PR when complete; Jira workflow runs but skips all jobs (expected)

### Jira Project
- **Board**: KAN at foodnforce.atlassian.net (Kanban)
- **Transition IDs**: 21 = In Progress, 31 = In Review, 41 = Done
- **MCP**: `mcp-atlassian` in `.mcp.json` (gitignored)

### Key Rule
**Never commit to master directly.** Always use a branch + PR so CI runs before merge.

## General Rules

- **Git**: always push after committing unless told otherwise
- **Dashboards**: verify API endpoint URLs and field mappings against the actual response before committing
- **Frontend**: run the build after visual changes; dev server HMR doesn't always reflect production
- **Jira-only tasks**: do Jira work exactly as specified; don't start code work when the user asked for a Jira task

## Agent Framework

### Skills (6) in `.claude/skills/`
- **`/create-illustration {slug}`** — generates an SVG illustration for a blog article
- **`/register-article {slug}`** — registers a manually added article (runs `build-components.js` + `sync-blog.js`)
- **`/quality-sweep [scope]`** — parallel validation agents with unified pass/fail summary
- **`/test-fix [scope]`** — systematic code review with test-first fixes
- **`/ship`** — release/deploy helper
- **`verify-changes`** *(auto-invoked)* — after modifying source files: writes tests, runs vitest, verifies build + lint

### Project-Specific Agents (16) in `.claude/agents/`
slds-compliance-checker, accessibility-auditor, cross-page-consistency, performance-budget-monitor, php-security-reviewer, uiux-reviewer, seo-auditor, content-reviewer, technical-architect, business-analyst, data-scientist, project-manager, data-analytics-auditor, dependency-auditor, devops-engineer, test-engineer

Each agent's description in `.claude/agents/*.md` explains its use case.

### Agent Documentation Standards

When dispatching agents for implementation, optimization, or upgrade work, **always use Context7 to fetch current documentation**. Agents have access to the Context7 MCP server and should query it for:
- **Vite** — build system, bundling, migration guides
- **ECharts** — chart optimization, tree-shaking, performance
- **Playwright** — browser testing configuration, best practices
- **Vitest** — unit testing, coverage thresholds, configuration
- **Mapbox GL JS** — map integration, geocoding, feature queries
- **SLDS** — design tokens, styling hooks, compliance validation

**Why**: Ensures agents use current APIs and best practices, not training-data assumptions. Particularly critical for library upgrades (Vite 6, P1-21), performance work (ECharts optimization), and compliance (SLDS tokens).

Mention Context7 explicitly in dispatch prompts for critical work:
```
Use Context7 to fetch current Vite docs, then assess the v6 migration path...
```

## Common Issues

### CSS Cascade Conflicts
- Import order in `main.css` determines cascade priority — `@layer` is blocked by SLDS CDN
- Only 9 `!important` declarations remain (utility classes + a11y media queries)

### CSP Compliance
- **CSP is enforcing in production** as of 2026-04-10 (PR #104) via `public/.htaccess`
- Currently uses an Option-A `unsafe-inline` safety net for ECharts; Session 7 will remove it
- All 6 security headers live via `.htaccess`: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- When migrating to `style-src 'self'`, any new inline `style=""` or `<style>` must be moved to CSS first
- SLDS CDN has SRI hash (auto-added by `build-components.js`)
- Sentry DSN host for `connect-src`: `o4510112854704128.ingest.us.sentry.io`

### Browser Compatibility
- **Minimum supported**: Safari 15+, Firefox 87+, Chrome 90+ (matches the `AbortController` signal pattern used in `src/js/effects/*` and `main.js`)
- `backdrop-filter` always shipped with the `-webkit-backdrop-filter` prefix
- No CSS nesting, `:has()`, container queries, or `color-mix()` until all three targets support them

### Verifying Production State
- **Don't trust config files alone.** Verify against the live wire before editing configs.
- Canonical header check: `curl -sI https://food-n-force.com/dashboards/food-insecurity.html`
- Canonical body check: `curl -s https://food-n-force.com/<path> | head -50`

## Configuration Files
- `tools/testing/html-validate.json` — HTML validation rules
- `tools/testing/lighthouserc.json` — CI performance audit
- `tools/testing/playwright.config.js` — Browser testing (builds + preview server first)
- `.pa11yci.json` — Pa11y (WCAG2AA)
- `config/token_map.json` — SLDS compliance token mappings
- `vite.config.js` — Vite build system
- `public/.htaccess` — Apache config; **production source of truth** for security headers, cache rules, and 404 routing

## Documentation
- `docs/README.md` — Documentation navigation hub
- `docs/project/plan.md` — Strategic refactoring plan
- `docs/project/risks.md` — Risk register
- `docs/SECURITY.md` — Security procedures
- `docs/MONITORING.md` — Sentry + GA4 setup
- `docs/CICD_SETUP.md` — CI/CD pipeline
- `docs/current/blog-content-pipeline.md` — Scraper/generator full guide
- `docs/current/emergency/15min-response-playbook.md` — Emergency response
- `docs/technical/adr/` — Architecture Decision Records
