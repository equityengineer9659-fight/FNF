# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Food-N-Force website - A nonprofit food bank and pantry solution built with modern web standards, SLDS compliance, and multi-agent governance framework. Features glassmorphism effects, premium background animations, and comprehensive accessibility support.

## Development Commands

### Build and Validation
```bash
# Development
npm run dev                      # Vite development server
npm run build                    # Vite production build
npm run preview                  # Preview production build

# Full build pipeline
npm run build                    # Vite production build (optimized, minified)
npm run build:full               # Complete pipeline: lint → validate → test → build

# Linting
npm run lint                     # All linting (HTML, CSS, JS)
npm run lint:html                # HTMLHint validation
npm run lint:css                 # Stylelint validation (src/css)
npm run lint:js                  # ESLint validation (src/js)
npm run lint:fix                 # Auto-fix CSS and JS issues

# HTML Validation
npm run validate:html            # W3C HTML validation
npm run validate:slds           # SLDS compliance check

# Testing
npm run test                     # All tests (accessibility, performance, browser)
npm run test:accessibility       # pa11y accessibility tests
npm run test:performance         # Lighthouse CI audits
npm run test:browser             # Playwright browser tests
npm run test:multi-page          # Multi-page validation across all pages
npm run test:critical-navigation # Mobile navigation smoke tests
npm run test:performance-budget  # Performance budget monitoring

# Bundle Analysis
npm run analyze:bundle           # Vite bundle analyzer for optimization insights
```

### Development Workflow
```bash
npm run dev                     # Start Vite dev server (http://localhost:4173)
npm run preview                 # Preview production build locally
npm run serve                   # Alternative: live-server on port 8080
```

### Deployment
```bash
npm run deploy:staging          # SiteGround staging (via GitHub Actions push to staging branch)
npm run deploy:production       # SiteGround production (via GitHub Actions push to master)
npm run rollback                # Emergency rollback utility
```

### Governance Framework
```bash
npm run governance:sync         # Sync governance documentation
npm run governance:validate     # Validate governance compliance
```

### Blog Content Pipeline
```bash
npm run admin                   # Start Express server for scraper (http://localhost:3001)
# OR — open Blog and Article Content/scraper-admin.html directly in VS Code Live Server
```

## Code Architecture

### File Structure
```
/
├── src/                    # Source files
│   ├── css/               # CSS files with modular architecture (12 files)
│   ├── js/                # JavaScript modules (main.js, effects/, config/, monitoring/)
│   └── assets/            # Images, fonts, and other assets
├── *.html                  # 10 root pages (core + hub pages — see Page Inventory)
├── blog/                   # 41 article HTML pages (all at blog/slug.html)
├── Blog and Article Content/  # Editorial research tools — NOT part of the public website
│   ├── scraper-admin.html     # Standalone scraper UI (open directly via VS Code Live Server)
│   ├── scraper-server.js      # Optional Express server version (npm run admin)
│   └── Articles.xlsx          # Editorial research queue — scraped article candidates
├── config/                 # Configuration files (token_map, deployment, security)
├── docs/                   # Active documentation (project/, technical/, current/)
├── tools/                  # Development utilities (testing, deployment, governance)
├── scripts/               # Build scripts + scraper engine
│   ├── scrape-sources.js      # Core RSS scraper module (server version)
│   ├── sync-blog.js           # Regenerates blog.html card grid from blog/ article metadata
│   ├── rss-feeds.json         # Configurable RSS feed source list
│   ├── generate-sitemap.js    # Sitemap generator
│   ├── generate-pwa-icons.js  # PWA icon generator
│   ├── create-restore-point.cjs / apply-restore-point.cjs
│   └── detect-css-duplicates.cjs
├── public/                # Static assets (favicon, PWA icons, manifest, PHP API endpoints)
│   ├── manifest.json          # PWA web app manifest
│   └── api/               # PHP backend (contact.php, newsletter.php, csrf-token.php)
├── _archive/              # Archived outdated documentation
├── _audit/                # Historical backups and restore points
├── vite.config.js         # Vite build configuration
└── package.json           # Root-level build configuration
```

### Page Inventory (51 pages)
- **Core pages (7)**: index, about, services, resources, impact, contact, 404
- **Blog hub (1)**: blog
- **Hub pages at root (2)**: case-studies, templates-tools
- **Articles under `blog/` (41)**: ai-reshaping-food-banks, salesforce-food-bank-operations, donor-relationships-nonprofit-cloud, data-driven-food-banks, food-bank-workflow-automation, securing-technology-grants, ai-inventory-management, agentforce-nonprofits-guide, ai-ethics-nonprofit-governance, centralized-food-hub-case-study, client-choice-food-pantry-technology, community-food-center-model, data-privacy-food-bank-clients, digital-transformation-small-food-banks, donor-prospecting-salesforce, food-bank-client-services-technology, food-bank-crisis-response-planning, food-bank-kitchen-operations, food-bank-strategic-partnerships, food-bank-technology-stack, food-banks-healthcare-social-determinants, food-is-medicine-food-banks, future-food-banking-trends, grant-management-food-banks, grant-writing-nonprofit-sustainability, impact-measurement-food-banks, measuring-hunger-relief-outcomes, nonprofit-cloud-vs-sales-cloud, nutrition-first-food-bank-strategy, purpose-driven-ai-food-banks, rapid-technology-implementation, salesforce-flow-builder-nonprofits, salesforce-nonprofit-cloud-ai-automation, salesforce-reports-dashboards-food-banks, salesforce-security-nonprofits, salesforce-spring-2026-nonprofits, snap-cuts-ice-fears-food-bank-response, snap-policy-changes-food-banks, tax-policy-nonprofit-fundraising, volunteer-management-technology, volunteer-recruitment-retention-digital

**Adding new articles via scraper tool**: Use `npm run admin` → New Article tab → Generate with Claude → Save to blog/. The save-article endpoint automatically registers the slug in `build-components.js` (both `resourcesSubpages` and `articlePages` arrays), `scripts/generate-sitemap.js`, and `.pa11yci.json`, then runs `build-components.js` and `sync-blog.js` so the article is immediately available. After saving, ask Claude Code to create the illustration: *"Create the illustration for blog/{slug}.html"*.

**Adding new articles manually**: Place the HTML file in `blog/` — `vite.config.js` discovers it automatically. Register the slug in both arrays of `build-components.js`, `scripts/generate-sitemap.js`, and `.pa11yci.json`, then run `node build-components.js` and `node scripts/sync-blog.js`.

All pages processed by `build-components.js` (nav/footer injection), `scripts/generate-sitemap.js`, and `.pa11yci.json` (accessibility testing).

### Build Pipeline
- `build-components.js` injects shared navigation, footer, and script tags into all 51 pages before Vite builds
- `scripts/sync-blog.js` rebuilds the blog card grid in blog.html from article metadata (runs automatically on build)
- `scripts/generate-sitemap.js` generates sitemap.xml covering all public pages (excludes 404)
- Vite handles bundling, minification, and asset hashing for production

### Blog Content Pipeline
A two-part tool: a scraper for finding article candidates and an AI-powered article generator. Separate from the public website build — never deployed by Vite.

**Scraper purpose**: Find and triage article candidates from RSS feeds and web search, output to `Articles.xlsx` for editorial review.

**Article generator purpose**: Select scraped sources, have Claude write an original professional article, preview and edit, save directly to `blog/` with full nav/footer injection and blog listing update in one step.

**Access**:
- **For AI article generation** (required): `npm run admin` → `http://localhost:3001`
- **For scraping only**: Open `Blog and Article Content/scraper-admin.html` in VS Code Live Server

**AI generation requires** a `.env` file at project root with `ANTHROPIC_API_KEY=sk-ant-...`. Get a key at console.anthropic.com.

**Article generation workflow**:
1. Scraper tab → select preset → Start Scraping
2. New Article tab → check 1–5 sources → Generate with Claude (~10–15 sec)
3. Review/edit pre-populated form fields (title, slug, category, description, read time, related articles)
4. Preview in iframe, optionally regenerate with feedback
5. Save to blog/ — auto-injects nav/footer, updates blog listing, registers in all config files
6. Ask Claude Code to create the illustration: *"Create the illustration for blog/{slug}.html"*

**Why illustrations are created separately**: Claude Code reads the full saved article and creates a purpose-built SVG that directly reflects the article's specific content, arguments, and structure — producing much better results than generating a generic illustration during the article generation step.

**Files**:
- `Blog and Article Content/scraper-admin.html` — complete UI (Scraper + New Article tabs; SheetJS + DOMParser + CORS proxies)
- `Blog and Article Content/scraper-server.js` — Express server (`npm run admin`) — required for AI features
- `Blog and Article Content/Articles.xlsx` — editorial research queue
- `.env` — `ANTHROPIC_API_KEY` (gitignored, never committed)
- `scripts/scrape-sources.js` — core scraper module used by the server version
- `scripts/rss-feeds.json` — configurable RSS feed list
- `scripts/sync-blog.js` — rebuilds `blog.html` card grid (auto-run on save)

**Built-in FNF search presets** (configured for each content pillar):
- **AI & Innovation** — food bank AI, predictive analytics nonprofit, Salesforce Einstein, generative AI
- **Tech Strategy** — Salesforce nonprofit cloud, nonprofit CRM, food bank software, donor management
- **Case Studies** — food bank case study, nonprofit Salesforce success, food pantry technology results
- **Implementation** — Salesforce implementation nonprofit, food bank workflow, volunteer management
- **Industry Insights** — food insecurity, food bank trends, SNAP benefits, hunger relief

**Excel columns**: Source URL · Title · Source Name · Published Date · Date Scraped · Suggested Category · Summary · Keywords Found · Status · Notes · Article Slug

**npm packages used** (devDependencies): `exceljs`, `rss-parser`, `express`, `@anthropic-ai/sdk`, `dotenv`
**Browser libraries** (CDN, standalone only): SheetJS 0.18.5

See `docs/current/blog-content-pipeline.md` for full usage guide.

### CSS Architecture
- **Location**: `src/css/` with modular organization (main.css imports all modules)
- **Import Order**: reset → design-tokens → navigation → typography → layout → effects → components → icons → critical-gradients → page-overrides
- **Design Tokens**: Centralized in `02-design-tokens.css` (colors, spacing, fonts, gradients, glass effects)
- **Bundle Optimization**: Minified production builds via Vite + CSSnano (~114KB, ~18KB gzipped)
- **SLDS Compliance**: 89% baseline maintained with token mapping system
- **Navigation**: Consolidated in `03-navigation.css` (single source of truth)
- **Effects/Animations**: Card stagger delays, keyframes, particles in `06-effects.css` (`will-change` limited to particles and buttons only — cards promoted by browser on hover)
- **Gradients/Theming**: Section backgrounds, hero gradients, SLDS button overrides in `critical-gradients.css`
- **Page Overrides**: Page-specific mobile/tablet responsive rules and expertise accordion in `10-page-overrides.css`
- **Critical Inline**: Loading placeholder CSS in `critical-inline.css` (loaded before main.css in HTML)
- **Note**: `@layer` declarations are NOT used — blocked by SLDS CDN dependency (un-layered SLDS overrides layered custom CSS)

### JavaScript Architecture
- **Progressive Enhancement**: HTML-first, JavaScript optional
- **Vite Build System**: Modern bundling with tree-shaking and Terser minification
- **Modules**: `src/js/main.js` orchestrates all modules:
  - `config/environment.js` — feature flags and configuration
  - `effects/particles.js` — canvas-based network particle system
  - `effects/smart-scroll.js` — nav auto-hide, active link tracking, scroll-to-top
  - `effects/counters.js` — animated number counters (aria-live announces final value)
  - `effects/newsletter-popup.js` — scroll-triggered modal with focus trap, CSRF validation, visible form errors (all styles in CSS, no inline styles for CSP compliance)
  - `effects/gradient-icons.js` — SVG gradient icon system
  - `effects/contact-form.js` — contact form submission with CSRF token validation (blocks submit if token fetch fails)
  - `effects/article-enhancements.js` — article page reading enhancements
  - `effects/blog-filter.js` — blog category filtering (aria-pressed + aria-current on active pill)
  - `monitoring/sentry.js`, `error-tracker.js`, `performance-monitor.js`
  - `expertise-accordion.js` — mobile accordion for about page expertise section
- **Cleanup**: All modules use AbortController or explicit cleanup in destroy()
- **Production**: Source maps disabled, no unguarded console.log in production code (ESLint `no-console` rule enforced; `console.warn`/`console.error` allowed, dev-gated `console.log` uses `eslint-disable` comments)
- **Unit Tests**: ~161 tests across 9 test files (vitest)
- **Design Tokens**: Glass opacity variants (`--glass-bg-light/primary/strong`), contact accent colors (`--fnf-contact-accent/*`), all centralized in `02-design-tokens.css`

### PHP Backend (SiteGround)
- **Location**: `public/api/` (copied to `dist/api/` during build)
- **Hosting**: SiteGround shared hosting, PHP served natively
- **Deployment**: GitHub Actions → SSH/rsync to SiteGround `public_html/`
- **Endpoints**:
  - `POST /api/contact.php` — contact form handler (validates, sanitizes, sends email via `mail()`)
  - `POST /api/newsletter.php` — newsletter subscription handler (validates email, sends notification)
  - `GET /api/csrf-token.php` — generates single-use CSRF tokens stored in PHP sessions
- **Security layers**:
  - Rate limiting (session-based, 60-second cooldown per endpoint — set on successful submission only)
  - CSRF token validation (session-based, single-use, timing-safe `hash_equals()`)
  - Honeypot field (`bot-field`) — hidden input rejected server-side if filled
  - Input sanitization via `htmlspecialchars()`
  - Email validation via `filter_var(FILTER_VALIDATE_EMAIL)`
  - Header injection prevention (CRLF stripping on all email header fields)
- **Client integration**: `src/js/effects/contact-form.js` and `src/js/main.js` submit forms via `fetch()` to these endpoints
- **Recipient**: All form emails sent to `hello@food-n-force.com`

### Critical Constraints
**NEVER modify these without explicit permission:**
- Logo special effects (CSS animations, gradients, transforms)
- Background spinning effects (mesh/iridescent on index, services, resources, about)
- **Glassmorphism effects are PROTECTED and must be preserved** (navigation, hero sections, cards)
- Blue circular gradients for emoji icons
- Text content, emoji icons, or section order

**IMPORTANT**: Glassmorphism is a core premium feature - all `backdrop-filter`, `rgba()` backgrounds, and glass effects must be maintained during any refactoring or SLDS compliance work.

## Testing Requirements

### Multi-Page Protocol
Test ALL 47 pages at these configurations:
- **Pages**: All core pages, blog, and article subpages (see Page Inventory)
- **Zoom Levels**: 100% (standard) and 25% (client requirement)  
- **Breakpoints**: Mobile, tablet, desktop
- **Browsers**: Chrome, Firefox, Safari minimum

### Performance Budgets
- **CSS Bundle**: ~114KB minified (includes all modules, effects, and newsletter modal styles)
- **JavaScript Bundle**: ~51KB total (46KB main + 5KB effects, tree-shaken & minified via Terser)
- **Gzipped Sizes**: ~18KB CSS, ~15KB JS combined
- **Core Web Vitals**: CLS 0.0000, LCP <2.5s mobile
- **SLDS Compliance**: ≥89% baseline maintained
- **Bundle Analysis**: Use `npm run analyze:bundle` for detailed reports
- **Unit Test Coverage**: 65% threshold (lines, functions, branches, statements)
- **HTML Validation**: Covers root pages AND `blog/*.html` articles
- **Lighthouse Configs**: `lighthouse.config.js` (local, relaxed) vs `tools/testing/lighthouserc.json` (CI, strict)

### Special Effects Validation
- Glassmorphism fallbacks work in all browsers
- Background animations maintain >60fps performance  
- Logo effects remain readable at all zoom levels
- Dark theme compatibility verified
- Reduced motion preferences respected

## SLDS Compliance Framework

### Current Status
- **Baseline**: 89% SLDS compliance maintained
- **Token Mapping**: Located in `config/token_map.json`
- **Current Bundle**: ~114KB minified CSS (down from 821KB pre-optimization)
- **Validation Command**: `npm run validate:slds`

### Key Compliance Areas
- Spacing: Use SLDS spacing tokens instead of hard-coded rem values
- Colors: Map custom colors to SLDS design tokens  
- Typography: Use SLDS heading and text utilities
- Components: Follow SLDS component patterns where applicable

## Agent Framework

### Built-in Subagents (7)
Claude Code provides 7 built-in subagents:
- **general-purpose** — complex multi-step tasks, research, code search
- **Explore** — fast codebase exploration and file/pattern search
- **Plan** — implementation planning and architecture design
- **claude-code-guide** — Claude Code features, API, and SDK questions
- **deployment-cicd-specialist** — deployment workflows and CI/CD pipelines
- **mobile-navigation-specialist** — mobile navigation design and troubleshooting
- **statusline-setup** — status line configuration

### Project-Specific Agents (10)
Custom agents in `.claude/agents/` tailored to this project:
- **slds-compliance-checker** — validates CSS against SLDS token map; use after CSS changes
- **accessibility-auditor** — WCAG 2.1 AA checks (headings, labels, ARIA); use after HTML changes
- **cross-page-consistency** — validates SEO tags, link integrity, Read Next cards across all pages; use after content changes
- **performance-budget-monitor** — checks bundle sizes against budgets after builds
- **php-security-reviewer** — reviews PHP API endpoints for injection, CSRF, and validation gaps
- **uiux-reviewer** — visual consistency, responsive layout, design tokens, and user flow; use after visual changes
- **seo-auditor** — JSON-LD structured data, sitemap coverage, meta tags, Lighthouse SEO scores; use after adding pages or publishing content
- **content-reviewer** — brand voice, publication checklist, article structure, and SEO alignment; use before publishing any new article
- **technical-architect** — enforces SLDS CDN constraints, SiteGround limits, glassmorphism protection, and 4-phase plan alignment; use before significant structural changes
- **business-analyst** — CTA clarity, value proposition, service alignment, and conversion paths; use when modifying service pages or consulting-oriented content

### Project Coordination References
- `docs/project/raci.md` - Role responsibilities matrix
- `docs/current/governance/agent-coordination/` - Coordination protocols
- `docs/current/emergency/15min-response-playbook.md` - Emergency procedures

## Development Guidelines

### Mobile Navigation
- **Architecture**: HTML-first with progressive enhancement
- **JavaScript Optional**: Core functionality works without JS
- **CSS Layers**: Proper cascade management eliminates !important conflicts
- **Testing**: Must validate across all pages and 5 breakpoints

### Performance Optimization
- **CSS**: Use CSS Layers for cascade management
- **JavaScript**: Progressive enhancement pattern  
- **Effects**: Preserve premium animations while maintaining 60fps
- **Bundle Management**: Strict budget enforcement via CI/CD

### Emergency Procedures
1. **Immediate**: Revert to last known good version
2. **Diagnose**: Run `npm run test:critical-navigation`
3. **Isolate**: Test single file modifications conservatively  
4. **Document**: Update ADRs in `docs/technical/adr/`
5. **Fix Forward**: Apply targeted solution with full validation

## Configuration Files

### Key Configuration
- `tools/testing/html-validate.json` - HTML validation rules (active config used by `npm run validate:html`)
- `tools/testing/lighthouserc.json` - Performance audit configuration
- `tools/testing/playwright.config.js` - Browser testing configuration (builds + preview server before tests)
- `.pa11yci.json` - Pa11y CI accessibility testing (WCAG2AA, all public pages)
- `config/token_map.json` - SLDS compliance token mappings
- `config/deployment-config.json` - Deployment settings
- `config/security-config.json` - Security configuration
- `vite.config.js` - Vite build system configuration (development server, bundling, minification)
- `_headers` - Security headers and CSP policy (connect-src allows Sentry)

### MCP Integration
- **Configuration**: MCP servers configured at user/IDE level (not in-repo; `.mcp.json` was removed)
- **Browser Automation**: Playwright and Puppeteer configured for testing
- **Performance Monitoring**: Lighthouse integration for CI/CD

## Common Issues and Solutions

### Mobile Navigation Issues
- **Root Cause**: JavaScript conflicts between effects and navigation
- **Diagnostic**: Comment out single scripts conservatively
- **Solution**: CSS Layers architecture eliminates cascade conflicts

### CSS Cascade Conflicts
- **Prevention**: Import order in main.css determines cascade priority
- **Legacy**: Avoid !important declarations (only 9 remain — all in utility classes and accessibility media queries)
- **Architecture**: HTML-first with progressive CSS enhancement
- **Note**: @layer is blocked by SLDS CDN — cascade relies on import order

### CSP and Inline Styles
- **Policy**: `_headers` CSP forbids `unsafe-inline` for both scripts and styles
- **SRI**: SLDS CDN stylesheet has Subresource Integrity hash (auto-added by `build-components.js`). Google Fonts cannot use SRI (content varies by browser).
- **CSP Reporting**: Not yet configured — requires backend endpoint or third-party service (documented as future improvement in `_headers`)
- **Newsletter popup**: Fully CSP-compliant (all styles in `07-components.css`)
- **CSSOM style manipulation**: `particles.js` (canvas), `smart-scroll.js` (progress bar), `main.js` (live region) use `element.style` via JavaScript. This is CSP-compliant — CSSOM property assignment is not blocked by `style-src` directives (only HTML `style=""` attributes and `<style>` tags are affected).
- **Sentry integration**: `error-tracker.js` imports `captureException` from `sentry.js` via ES module exports. The bridge is correctly wired — no `window.Sentry` dependency.

### SLDS Compliance Violations
- **Detection**: Use `npm run validate:slds` 
- **Resolution**: Reference `config/token_map.json` for proper mappings
- **Common**: Replace hard-coded rem/px values with SLDS tokens

## Project History and Context

### Mobile Navigation Crisis Resolution (August 2025)
**Major Achievement**: Crisis resolved with significant architectural improvements beyond original v3.1

#### Crisis & Resolution Summary
- **Problem**: Mobile navigation completely broken across all pages with multiple UI issues
- **Approach**: Systematic collaborative agent assessment
- **Result**: Crisis resolved with significant architectural improvements

#### Key Technical Achievements
- ✅ **HTML-based navigation** with progressive enhancement (JavaScript no longer required for core functionality)
- ✅ **CSS Layers architecture** implemented, eliminating 58+ !important cascade conflicts
- ✅ **93% JavaScript reduction** (718 lines → 47 lines) while maintaining full functionality
- ✅ **73% CSS bundle reduction** (74KB → 19KB) with better performance
- ✅ **Mobile navigation functional** across all pages with consistent behavior
- ✅ **WCAG 2.1 AA compliance** maintained throughout transition
- ✅ **All visual effects preserved** including background animations and glassmorphism

#### Root Cause & Fix
- **Root Cause**: JavaScript conflict between `premium-background-effects.js` and mobile navigation on index page
- **Diagnostic Method**: Conservative testing approach (commenting out single script)
- **Resolution**: Surgical fix preserving all functionality while eliminating conflict

#### Collaborative Agent Success Model
- **Agents Involved**: Technical Architect, CSS Design Systems Expert, JavaScript Behavior Expert, QA Automation Engineer, Project Manager
- **Process**: Strategic assessment → Architecture decision → Specialized implementation → Validation
- **Key Learning**: Complex problems require coordinated expertise, not individual "cowboy coding"

### MCP Configuration (Historical)

The `.mcp.json` file with 11 MCP servers was previously used but has been removed from the repository. MCP servers are now configured at the user/IDE level rather than in-repo.

## Documentation References

### Essential Documentation
- `docs/README.md` - Documentation navigation and quick access guide
- `docs/project/plan.md` - 4-phase strategic refactoring plan
- `docs/project/raci.md` - Agent responsibilities and coordination matrix
- `docs/current/emergency/15min-response-playbook.md` - Emergency response procedures
- `docs/CICD_SETUP.md` - CI/CD pipeline configuration
- `docs/SECURITY.md` - Security procedures
- `docs/ENVIRONMENT.md` - Environment variables

### Architecture Decision Records
Located in `docs/technical/adr/` with 16 active ADRs covering:
- Mobile navigation architecture decisions
- CSS cascade management approach
- JavaScript bundle optimization strategy
- Emergency rollback procedures
- Documentation consolidation and file management
- CI/CD pipeline strategy
- Quality assurance and security compliance frameworks

### Archived Documentation
Historical docs moved to `_archive/` during 2026-03-24 audit:
- `_archive/docs-technical/` - Resolved mobile nav crisis docs, old phase reports
- `_archive/docs-project/` - Completed requirements, old CSS deconfliction plans, legacy Netlify deployment guides
- `_archive/github-workflows/` - 11 legacy CI/CD workflows (only ci-cd.yml and dependency-update.yml are active)

### Cleanup Completed (2026-03-24)
All files from `_proposed-deletion/` have been reviewed and deleted:
- Dead JS (animations.js, sw.js), unused fallback scripts removed from HTML
- 11 legacy test specs deleted
- 9 unused tool scripts deleted
- Backup files and duplicate configs removed