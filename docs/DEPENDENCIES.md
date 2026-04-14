# Dependency Management Guide

## Overview
Automated dependency management system to keep packages up-to-date and secure.

## Automated Updates

### GitHub Integration

#### Dependabot
Located in `.github/dependabot.yml`
- Runs weekly on Mondays
- Creates PRs for updates
- Groups related packages
- Auto-merges patch updates
- Requires review for major updates

#### Renovate (Alternative)
Located in `renovate.json`
- More configurable than Dependabot
- Supports auto-merging
- Creates dependency dashboard
- Better monorepo support

### Local Commands

#### Check for Updates
```bash
# Check all outdated packages
npm run deps:check

# Check with npm directly
npm outdated

# Check security vulnerabilities
npm run deps:audit
```

#### Apply Updates

##### Automatic Updates
```bash
# Run automated update tool
npm run deps:update
```

##### Manual Updates
```bash
# Update specific package
npm install package-name@latest

# Update to specific version
npm install package-name@1.2.3

# Update all dependencies
npm update
```

##### Security Updates
```bash
# Auto-fix security issues
npm run deps:security

# Audit and fix with force
npm audit fix --force
```

## Update Strategy

### Update Types

#### Patch Updates (1.0.x)
- **Risk**: Very Low
- **Auto-merge**: Yes
- **Testing**: Automated
- **Example**: 1.0.1 → 1.0.2

#### Minor Updates (1.x.0)
- **Risk**: Low
- **Auto-merge**: After tests
- **Testing**: Automated + Review
- **Example**: 1.0.0 → 1.1.0

#### Major Updates (x.0.0)
- **Risk**: High
- **Auto-merge**: No
- **Testing**: Manual review required
- **Example**: 1.0.0 → 2.0.0

### Package Groups

#### Safe for Auto-update
- autoprefixer
- cssnano
- postcss
- Development tools

#### Require Review
- vite (build tool)
- lighthouse (testing)
- Core frameworks

#### Never Auto-update
- @types/node (frequent breaking changes)
- Major framework updates

## Reports

### Dependency Report
Generated at: `dependency-report.html`

Includes:
- Outdated packages list
- Security vulnerabilities
- Update commands
- Risk assessment

### Check Report
```bash
# Generate report
npm run deps:check

# View report
open dependency-report.html
```

## CI/CD Integration

### GitHub Actions
Automated workflows run:
- Weekly on Monday 9 AM UTC
- On manual trigger
- On PR to master

### Workflow Features
1. **Check Phase**: Scan for updates
2. **Security Phase**: Apply security fixes
3. **Update Phase**: Apply safe updates
4. **Test Phase**: Run full test suite
5. **PR Creation**: Open PR with changes

## Best Practices

### Do's ✅
- Run `npm run deps:check` weekly
- Apply security updates immediately
- Test after every update
- Keep dependencies minimal
- Use exact versions in production

### Don'ts ❌
- Don't ignore security warnings
- Don't update everything at once
- Don't skip testing
- Don't use wildcards in versions
- Don't update right before deployment

## Troubleshooting

### Update Failures

#### Build Failures After Update
```bash
# Restore from backup
cd tools/dependencies
node auto-update.js --restore

# Or manually
git checkout -- package.json
npm install
```

#### Conflicting Dependencies
```bash
# Clean install
rm -rf node_modules
npm install
```

#### Audit Failures
```bash
# Force resolutions
npm audit fix --force

# Or manually update
npm ls package-name  # Find dependents
npm install package-name@latest
```

### Common Issues

#### "Cannot resolve dependency"
- Check for peer dependency conflicts
- Update related packages together
- Use `npm ls` to debug

#### "Module not found"
- Clear node_modules and reinstall
- Check for breaking changes in major updates
- Verify import paths

#### Performance Issues
- Check bundle size after updates
- Run performance tests
- Use `npm run analyze:bundle`

## Security

### Vulnerability Scanning
```bash
# Quick scan
npm audit

# Detailed report
npm audit --json > audit.json

# Fix automatically
npm audit fix

# Fix including breaking changes
npm audit fix --force
```

### Security Levels
- **Critical**: Fix immediately
- **High**: Fix within 24 hours
- **Moderate**: Fix within 1 week
- **Low**: Fix in next update cycle

### Supply Chain Security
- Review new dependencies carefully
- Check package popularity and maintenance
- Verify package signatures when possible
- Use `npm fund` to see funding

## Monitoring

### Automated Monitoring
- GitHub security alerts
- Dependabot alerts
- npm audit in CI/CD
- Weekly dependency checks

### Manual Checks
```bash
# Weekly routine
npm run deps:check
npm run deps:audit
npm run test

# Before deployment
npm run security
npm run build:full
```

## Configuration Files

### `.github/dependabot.yml`
GitHub's automated dependency updates

### `renovate.json`
Alternative to Dependabot with more features

### `tools/dependencies/`
- `check-updates.js`: Dependency checker
- `auto-update.js`: Automated updater

## Quick Reference

```bash
# Daily
npm run deps:security    # Fix security issues

# Weekly
npm run deps:check       # Check for updates
npm run deps:update      # Apply updates via auto-update tool

# Quarterly
npm outdated             # Full review of all packages

# Before deployment
npm run security         # Security check
npm run build:full       # Full validation
```