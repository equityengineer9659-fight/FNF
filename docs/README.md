# Food-N-Force Documentation Navigation

**Last Updated**: 2026-03-30
**Current Phase**: Production + Blog Content Pipeline active

## Quick Navigation

### Most Frequently Accessed
- [Project Plan](project/plan.md) - Strategic refactoring phases
- [RACI Matrix](project/raci.md) - Agent coordination and responsibilities
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
- [Monitoring](MONITORING.md) - Performance monitoring
- [Monitoring Setup](MONITORING_SETUP.md) - Monitoring configuration

## Documentation Structure

```
docs/
├── README.md              # This file - navigation hub
├── CICD_SETUP.md          # CI/CD pipeline configuration
├── DEPENDENCIES.md        # Dependency management
├── ENVIRONMENT.md         # Environment variables
├── MONITORING.md          # Performance monitoring
├── MONITORING_SETUP.md    # Monitoring setup guide
├── SECURITY.md            # Security procedures
├── project/               # Project management
│   ├── plan.md            # Strategic refactoring plan
│   ├── raci.md            # Agent responsibilities matrix
│   ├── risks.md           # Risk register
│   ├── backlog.md         # Project backlog
│   ├── daily.md           # Daily standup template
│   ├── safety-protocols.md
│   ├── coordination-protocols.md
│   ├── workspace-setup-protocols.md
│   └── multi-page-testing-protocol.md
├── current/               # Enhanced active documentation
│   ├── blog-content-pipeline.md  # Scraper tool + editorial workflow
│   ├── emergency/         # Emergency response procedures
│   ├── design-system/     # SLDS governance
│   ├── governance/        # Agent coordination
│   └── operations/        # Quality gates
└── technical/             # Technical architecture
    ├── adr/               # 16 Architecture Decision Records
    ├── TECHNICAL_ARCHITECTURE_REVIEW.md
    └── PROJECT_DOCUMENTATION.md
```

## Current Performance Metrics

- **CSS Bundle**: ~114KB (minified, all modules including newsletter modal)
- **JavaScript Bundle**: ~51KB total (46KB main + 5KB effects, tree-shaken & minified via Terser)
- **Gzipped**: ~18KB CSS, ~15KB JS combined
- **Core Web Vitals**: CLS 0.0000, LCP <2.5s mobile
- **SLDS Compliance**: 89% baseline maintained

## Active CI/CD Workflows

Only 2 workflows are active in `.github/workflows/`:
- **ci-cd.yml** - Main CI/CD pipeline
- **dependency-update.yml** - Automated dependency updates

Legacy workflows have been archived to `_archive/github-workflows/`.

## Agent Coordination

### Agents
- **7 built-in Claude Code subagents** (general-purpose, Explore, Plan, etc.)
- **10 project-specific agents** in `.claude/agents/` (slds-compliance-checker, accessibility-auditor, cross-page-consistency, performance-budget-monitor, php-security-reviewer, uiux-reviewer, seo-auditor, content-reviewer, technical-architect, business-analyst)
- [RACI Matrix](project/raci.md) - Coordination
- [Agent Coordination Hub](current/governance/agent-coordination/)

### Key Authority Matrix
- **Emergency (0-15 min)**: technical-architect
- **Standard (15 min-4 hrs)**: Domain experts
- **Strategic (4-24 hrs)**: project-manager-proj + stakeholders

## Archived Documentation

Historical and outdated documentation has been moved to:
- `_archive/docs-technical/` - Resolved mobile navigation crisis docs, old phase reports
- `_archive/docs-project/` - Completed requirements, old CSS deconfliction plans, legacy Netlify deployment guides
- `_archive/github-workflows/` - Legacy CI/CD workflow files
- `_audit/` - Full historical snapshots and restore points
