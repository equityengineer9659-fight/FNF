# ADR-015: Deployment Migration from Netlify to SiteGround

**Date**: 2026-03-26
**Status**: Accepted
**Supersedes**: Netlify references in ADR-004, ADR-005, ADR-006

---

## Context

The Food-N-Force website was originally deployed to Netlify via the `netlify-cli` package and `netlify.toml` configuration. The project has since migrated to SiteGround shared hosting with deployment via SSH/rsync from GitHub Actions.

This ADR documents the migration and formally supersedes the Netlify deployment references in earlier ADRs (004, 005, 006).

## Decision

Deploy to SiteGround via SSH/rsync in the GitHub Actions CI/CD pipeline instead of Netlify.

### Deployment Architecture

```
Push to master → GitHub Actions → Build (Vite) → rsync via SSH → SiteGround public_html
```

### CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

**Job 1: quality-checks**
- HTML validation, CSS/JS linting, unit tests, build, accessibility tests
- Uploads build artifact

**Job 2: deploy** (master branch only, requires quality-checks)
- Downloads build artifact
- Deploys `dist/` to SiteGround via rsync over SSH
- Flushes SiteGround caches (file touch + Memcached)
- Runs HTTP 200 health check against `https://food-n-force.com`

### GitHub Secrets Required
- `SITEGROUND_SSH_KEY` — SSH private key
- `SITEGROUND_SSH_PASSPHRASE` — Key passphrase
- `SITEGROUND_HOST` — Server hostname
- `SITEGROUND_USER` — SSH username
- `SITEGROUND_PORT` — SSH port
- `VITE_SENTRY_DSN` — Sentry error tracking (build-time)

## Rationale

1. **Hosting consolidation** — SiteGround is the primary hosting provider; deploying directly eliminates the Netlify intermediary
2. **Full server access** — SSH access enables cache flushing, file management, and direct debugging
3. **Cost** — No additional Netlify plan needed for a static site already hosted on SiteGround
4. **Simplicity** — rsync is a well-understood, reliable deployment mechanism

## Consequences

### Positive
- Single hosting provider (SiteGround) — simpler infrastructure
- Direct cache control via SSH (Memcached flush, file touch)
- No dependency on Netlify CLI or Netlify API availability
- Health check validates actual production URL

### Negative
- No automatic preview deployments for pull requests (Netlify provided these)
- No built-in rollback UI (mitigated by git revert + re-deploy and restore point system)
- SSH key management required in GitHub Secrets

### Removed Dependencies
- `netlify-cli` — No longer needed
- `netlify.toml` — Archived to `_archive/`

### Related Documentation
- `docs/CICD_SETUP.md` — Updated setup guide for SiteGround
- `docs/ENVIRONMENT.md` — Updated deployment configuration
- `.github/workflows/ci-cd.yml` — Actual workflow implementation
