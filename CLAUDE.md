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
npm run test:multi-page          # Multi-page validation across all 6 pages
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
npm run deploy:staging          # Netlify staging deployment
npm run deploy:production       # Netlify production deployment
npm run rollback                # Emergency rollback utility
```

### Governance Framework
```bash
npm run governance:sync         # Sync governance documentation
npm run governance:validate     # Validate governance compliance
npm run governance:status       # Check governance framework status
```

## Code Architecture

### File Structure
```
/
├── src/                    # Source files
│   ├── css/               # CSS files with modular architecture (12 files)
│   ├── js/                # JavaScript modules (main.js, effects/, config/, monitoring/)
│   ├── assets/            # Images, fonts, and other assets
│   └── templates/         # HTML component templates
├── *.html                  # 6 pages: index, about, services, resources, impact, contact
├── config/                 # Configuration files (token_map, deployment, security)
├── docs/                   # Active documentation (project/, technical/, current/)
├── tools/                  # Development utilities (testing, deployment, governance)
├── scripts/               # Build scripts (sitemap, PWA icons, restore points, CSS analysis)
├── public/                # Static assets (favicon, PWA icons)
├── _archive/              # Archived outdated documentation
├── _audit/                # Historical backups and restore points
├── vite.config.js         # Vite build configuration
└── package.json           # Root-level build configuration
```

### CSS Architecture
- **Location**: `src/css/` with modular organization (main.css imports all modules)
- **Import Order**: reset → design-tokens → navigation → typography → layout → effects → components → icons → critical-gradients → page-overrides
- **Design Tokens**: Centralized in `02-design-tokens.css` (colors, spacing, fonts, gradients, glass effects)
- **Bundle Optimization**: Minified production builds via Vite + CSSnano (~96KB, ~16KB gzipped)
- **SLDS Compliance**: 89% baseline maintained with token mapping system
- **Navigation**: Consolidated in `03-navigation.css` (single source of truth)
- **Effects/Animations**: Card stagger delays, keyframes, particles in `06-effects.css`
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
  - `effects/counters.js` — animated number counters
  - `effects/newsletter-popup.js` — scroll-triggered modal with focus trap
  - `effects/gradient-icons.js` — SVG gradient icon system
  - `monitoring/sentry.js`, `error-tracker.js`, `performance-monitor.js`
  - `expertise-accordion.js` — mobile accordion for about page expertise section
- **Cleanup**: All modules use AbortController or explicit cleanup in destroy()
- **Production**: Source maps disabled, no console.log in production code
- **Unit Tests**: 159 tests across 9 test files (vitest)
- **Design Tokens**: Glass opacity variants (`--glass-bg-light/primary/strong`), contact accent colors (`--fnf-contact-accent/*`), all centralized in `02-design-tokens.css`

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
Test ALL 6 pages at these configurations:
- **Pages**: index.html, about.html, services.html, resources.html, impact.html, contact.html
- **Zoom Levels**: 100% (standard) and 25% (client requirement)  
- **Breakpoints**: Mobile, tablet, desktop
- **Browsers**: Chrome, Firefox, Safari minimum

### Performance Budgets
- **CSS Bundle**: ~96KB minified (includes all modules and effects)
- **JavaScript Bundle**: ~50KB total (44KB main + 6KB effects, tree-shaken & minified)
- **Gzipped Sizes**: ~16KB CSS, ~15KB JS combined
- **Core Web Vitals**: CLS 0.0000, LCP <2.5s mobile
- **SLDS Compliance**: ≥89% baseline maintained
- **Bundle Analysis**: Use `npm run analyze:bundle` for detailed reports

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
- **Phase 2 Target**: CSS bundle 821KB → 100KB (87% reduction)
- **Validation Command**: `npm run validate:slds`

### Key Compliance Areas
- Spacing: Use SLDS spacing tokens instead of hard-coded rem values
- Colors: Map custom colors to SLDS design tokens  
- Typography: Use SLDS heading and text utilities
- Components: Follow SLDS component patterns where applicable

## Governance Framework

### Multi-Agent Coordination
17+ specialized agents with clear authority matrix:
- **Emergency (0-15 min)**: technical-architect  
- **Standard (15 min-4 hrs)**: Domain experts
- **Strategic (4-24 hrs)**: project-manager-proj + stakeholders

### Critical Files for Agent Coordination
- `docs/project/raci.md` - Agent responsibilities matrix
- `docs/current/governance/agent-coordination/` - Coordination protocols
- `docs/current/emergency/15min-response-playbook.md` - Emergency procedures

## Development Guidelines

### Mobile Navigation
- **Architecture**: HTML-first with progressive enhancement
- **JavaScript Optional**: Core functionality works without JS
- **CSS Layers**: Proper cascade management eliminates !important conflicts
- **Testing**: Must validate across all 6 pages and 5 breakpoints

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
- `tools/testing/playwright.config.js` - Browser testing configuration
- `config/token_map.json` - SLDS compliance token mappings
- `config/deployment-config.json` - Deployment settings
- `config/security-config.json` - Security configuration
- `vite.config.js` - Vite build system configuration (development server, bundling, minification)

### MCP Integration
- **Protected Configuration**: `.mcp.json` contains 11 essential MCP servers
- **Browser Automation**: Playwright and Puppeteer configured for testing
- **Performance Monitoring**: Lighthouse integration for CI/CD

## Common Issues and Solutions

### Mobile Navigation Issues
- **Root Cause**: JavaScript conflicts between effects and navigation
- **Diagnostic**: Comment out single scripts conservatively
- **Solution**: CSS Layers architecture eliminates cascade conflicts

### CSS Cascade Conflicts
- **Prevention**: Import order in main.css determines cascade priority
- **Legacy**: Avoid !important declarations (only 8 remain — all in utility classes and accessibility media queries)
- **Architecture**: HTML-first with progressive CSS enhancement
- **Note**: @layer is blocked by SLDS CDN — cascade relies on import order

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
- ✅ **Mobile navigation functional** across all 6 pages with consistent behavior
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

### MCP Configuration Protection

**CRITICAL:** The `.mcp.json` file contains 11 essential MCP servers that provide core functionality.

#### Protected Configuration
- **File**: `.mcp.json`
- **Server Count**: 11 total servers
- **Status**: Playwright connection fixed, all servers restored

#### Server List (DO NOT REMOVE without user permission):
1. `playwright` - Browser automation (fixed with --headless flag)
2. `puppeteer` - Alternative browser automation
3. `web-analysis` - Lighthouse integration
4. `filesystem` - File system operations
5. `github` - GitHub integration
6. `lighthouse` - Performance auditing
7. `browser-tools` - Browser utilities
8. `browser-server` - Browser server functionality
9. `browserbase` - Browser base services
10. `mcp-inspector` - MCP debugging
11. `mcp-everything` - Comprehensive MCP server

#### Guard Rails
- Protective comments added to `.mcp.json`
- Server count verification included
- Modification warnings in place
- Always get user permission before modifying MCP configurations

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
Located in `docs/technical/adr/` with 15 active ADRs covering:
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
- `_archive/docs-project/` - Completed requirements, old CSS deconfliction plans
- `_archive/github-workflows/` - 11 legacy CI/CD workflows (only ci-cd.yml and dependency-update.yml are active)

### Cleanup Completed (2026-03-24)
All files from `_proposed-deletion/` have been reviewed and deleted:
- Dead JS (animations.js, sw.js), unused fallback scripts removed from HTML
- 11 legacy test specs deleted
- 9 unused tool scripts deleted
- Backup files and duplicate configs removed