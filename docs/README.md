# Food-N-Force Documentation Navigation

**Last Updated**: 2026-04-01
**Current Phase**: Production + Blog Content Pipeline active

## Quick Navigation

### Most Frequently Accessed
- [Project Plan](project/plan.md) - Strategic refactoring phases
- [Technical Architecture](../CLAUDE.md) - Complete technical architecture and build system
- [ADRs](technical/adr/) - Architecture Decision Records
- [Blog Content Pipeline](current/blog-content-pipeline.md) - Scraper tool, editorial workflow, search presets

### Emergency Procedures
- [Emergency Response](current/emergency/) - 15-minute technical architect response
- [Rollback](../scripts/create-restore-point.cjs) - Restore point system (`npm run restore:create` / `npm run restore:apply`)

### Operations & Infrastructure
- [CI/CD Setup](CICD_SETUP.md) - Pipeline configuration
- [Dependencies](DEPENDENCIES.md) - Dependency management
- [Environment](ENVIRONMENT.md) - Environment variables
- [Security](SECURITY.md) - Security procedures
- [Monitoring](MONITORING.md) - Error tracking (Sentry) and analytics (GA4)

## Documentation Structure

```
docs/
├── README.md              # This file - navigation hub
├── CICD_SETUP.md          # CI/CD pipeline configuration
├── DEPENDENCIES.md        # Dependency management
├── ENVIRONMENT.md         # Environment variables
├── MONITORING.md          # Error tracking and analytics setup
├── SECURITY.md            # Security procedures
├── project/               # Project management
│   ├── plan.md            # Strategic refactoring plan
│   └── risks.md           # Risk register
├── current/               # Enhanced active documentation
│   ├── blog-content-pipeline.md  # Scraper tool + editorial workflow
│   ├── emergency/         # Emergency response procedures
│   ├── design-system/     # SLDS governance
│   ├── governance/        # Agent coordination
│   └── operations/        # Quality gates
└── technical/             # Technical architecture
    ├── adr/               # 16 Architecture Decision Records
    └── TECHNICAL_ARCHITECTURE_REVIEW.md
```

## Current Performance Metrics

- **CSS Bundle**: ~125KB minified (~20KB gzipped)
- **JavaScript Bundle**: ~53KB total (47KB main + 5KB effects, ~16KB gzipped)
- **Dashboard**: +15KB dashboard + ~645KB ECharts (~210KB gzipped, loaded only on dashboard pages)
- **Core Web Vitals**: CLS 0.0000, LCP <2.5s mobile
- **SLDS Compliance**: 89% baseline maintained

## Active CI/CD Workflows

Only 2 workflows are active in `.github/workflows/`:
- **ci-cd.yml** - Main CI/CD pipeline
- **dependency-update.yml** - Automated dependency updates

Legacy workflows have been archived to `_archive/github-workflows/`.

## Agent Coordination

### Agents & Skills
- **7 built-in Claude Code subagents** (general-purpose, Explore, Plan, etc.)
- **10 project-specific agents** in `.claude/agents/` (slds-compliance-checker, accessibility-auditor, cross-page-consistency, performance-budget-monitor, php-security-reviewer, uiux-reviewer, seo-auditor, content-reviewer, technical-architect, business-analyst)
- **3 skills** in `.claude/skills/`: `/create-illustration`, `/register-article`, `/quality-sweep`
- [Agent Coordination Hub](current/governance/agent-coordination/)

## Archived Documentation

Historical and outdated documentation has been moved to:
- `_archive/docs-technical/` - Resolved mobile navigation crisis docs, old phase reports
- `_archive/docs-project/` - Completed requirements, old CSS deconfliction plans, legacy Netlify deployment guides
- `_archive/github-workflows/` - Legacy CI/CD workflow files
