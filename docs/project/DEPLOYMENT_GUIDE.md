# Food-N-Force Website - Deployment Guide

**Version**: 3.0  
**Last Updated**: 2025-08-18  
**Pipeline Status**: Production Ready  

---

## Overview

This guide provides comprehensive instructions for deploying the Food-N-Force website to production environments, including CI/CD pipeline setup, quality gates, and monitoring configurations.

---

## Quick Start

### Prerequisites
1. **Node.js**: Version 18 or higher
2. **npm**: Version 9 or higher
3. **Git**: Version control
4. **Netlify Account**: For deployment

### Initial Setup
```bash
# Clone Repository
git clone <repository-url>
cd food-n-force-website

# Install Dependencies
npm install

# Configure Environment
cp .env.example .env
# Edit .env with your values

# Run Development Server
npm run dev

# Run Quality Checks
npm run build
```

---

## CI/CD Pipeline Architecture

### Quality Gates

The pipeline implements multiple quality gates that must pass before deployment:

#### 1. Code Quality
- HTML validation (W3C compliance)
- CSS linting with SLDS compliance checks
- JavaScript linting with accessibility rules
- Security vulnerability scanning

#### 2. Performance Testing
- Lighthouse CI for Core Web Vitals
- Performance budget enforcement
- Resource optimization validation

#### 3. Accessibility Testing
- Pa11y for WCAG 2.1 AA compliance
- Automated accessibility audits
- Screen reader compatibility checks

#### 4. Cross-Browser Testing
- Chrome, Firefox, Safari compatibility
- Mobile, tablet, desktop responsiveness
- Progressive enhancement validation

### Deployment Environments

#### Development
- **Trigger**: Feature branch pushes
- **Process**: Quality gates + preview deployment
- **URL**: Auto-generated Netlify preview URLs
- **Purpose**: Developer testing and validation

#### Staging
- **Trigger**: Pull requests to `master` branch
- **Process**: Full test suite + staging deployment
- **URL**: Dedicated staging environment
- **Purpose**: Integration testing and stakeholder review

#### Production
- **Trigger**: Pushes to `main` branch
- **Process**: Complete validation + production deployment
- **URL**: https://foodnforce.com
- **Purpose**: Live website serving users

---

## Configuration Files

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "http-server -p 8080 -c-1",
    "lint": "npm run lint:html && npm run lint:css && npm run lint:js",
    "lint:html": "htmlhint \"*.html\" --config .htmlhintrc",
    "lint:css": "stylelint \"css/**/*.css\" --config .stylelintrc.json",
    "lint:js": "eslint \"js/**/*.js\" --config .eslintrc.json",
    "test": "npm run test:accessibility && npm run test:performance && npm run test:browser",
    "test:accessibility": "pa11y-ci --config .pa11yci.json",
    "test:performance": "lhci autorun --config lighthouserc.json",
    "test:browser": "playwright test",
    "validate:html": "html-validate \"*.html\"",
    "validate:slds": "node scripts/slds-compliance-check.js",
    "build": "npm run lint && npm run validate:html && npm run test",
    "deploy:staging": "netlify deploy",
    "deploy:production": "netlify deploy --prod",
    "health-check": "node scripts/health-check.js"
  }
}
```

### Netlify Configuration (netlify.toml)
```toml
[build]
  command = "npm run build"
  publish = "."

[build.environment]
  NODE_VERSION = "18"
  NODE_ENV = "production"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; frame-ancestors 'none';"

[[headers]]
  for = "/css/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/js/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=2592000"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 404
```

---

## GitHub Actions Workflows

### Main CI/CD Pipeline (.github/workflows/ci-cd.yml)

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ master ]
  pull_request:
    branches: [ master ]

jobs:
  quality-checks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint HTML
        run: npm run lint:html
      
      - name: Lint CSS
        run: npm run lint:css
      
      - name: Lint JavaScript
        run: npm run lint:js
      
      - name: Validate HTML
        run: npm run validate:html
      
      - name: Check SLDS Compliance
        run: npm run validate:slds
      
      - name: Security Audit
        run: npm audit --audit-level=moderate

  performance-tests:
    runs-on: ubuntu-latest
    needs: quality-checks
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build site
        run: npm run build
      
      - name: Accessibility Testing
        run: npm run test:accessibility
      
      - name: Performance Testing
        run: npm run test:performance
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

  browser-tests:
    runs-on: ubuntu-latest
    needs: quality-checks
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run browser tests
        run: npm run test:browser

  deploy-staging:
    if: github.ref == 'refs/heads/master'
    runs-on: ubuntu-latest
    needs: [quality-checks, performance-tests, browser-tests]
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy to staging
        run: npm run deploy:staging
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_STAGING_SITE_ID }}
      
      - name: Run health check
        run: npm run health-check
        env:
          HEALTH_CHECK_URL: ${{ secrets.STAGING_URL }}

  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: [quality-checks, performance-tests, browser-tests]
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy to production
        run: npm run deploy:production
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_PRODUCTION_SITE_ID }}
      
      - name: Run health check
        run: npm run health-check
        env:
          HEALTH_CHECK_URL: ${{ secrets.PRODUCTION_URL }}
      
      - name: Create deployment tag
        run: |
          git tag "deploy-$(date +'%Y%m%d-%H%M%S')"
          git push origin --tags
```

### Emergency Rollback (.github/workflows/rollback.yml)

```yaml
name: Emergency Rollback

on:
  workflow_dispatch:
    inputs:
      deployment_id:
        description: 'Target deployment ID to rollback to'
        required: true
      reason:
        description: 'Reason for rollback'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v3
      
      - name: Rollback deployment
        run: |
          echo "Rolling back to deployment: ${{ github.event.inputs.deployment_id }}"
          echo "Reason: ${{ github.event.inputs.reason }}"
          netlify api rollbackSiteDeploy --site-id=${{ secrets.NETLIFY_PRODUCTION_SITE_ID }} --deploy-id=${{ github.event.inputs.deployment_id }}
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
      
      - name: Verify rollback
        run: npm run health-check
        env:
          HEALTH_CHECK_URL: ${{ secrets.PRODUCTION_URL }}
      
      - name: Create incident report
        run: |
          echo "# Emergency Rollback Report" > rollback-report.md
          echo "**Date**: $(date)" >> rollback-report.md
          echo "**Deployment ID**: ${{ github.event.inputs.deployment_id }}" >> rollback-report.md
          echo "**Reason**: ${{ github.event.inputs.reason }}" >> rollback-report.md
          echo "**Status**: Complete" >> rollback-report.md
```

---

## Quality Standards

### Performance Budgets
- **First Contentful Paint**: < 2 seconds
- **Largest Contentful Paint**: < 3 seconds
- **Cumulative Layout Shift**: < 0.1
- **Total Blocking Time**: < 300ms
- **Performance Score**: ≥ 85%

### Accessibility Requirements
- **WCAG 2.1 AA Compliance**: 100% required
- **Accessibility Score**: ≥ 95%
- **Color Contrast**: Minimum 4.5:1 ratio
- **Keyboard Navigation**: Full support
- **Screen Reader**: Compatible

### SLDS Compliance
- **Design System**: Salesforce Lightning Design System
- **Component Usage**: SLDS-compliant components
- **Design Tokens**: SLDS color and spacing tokens
- **Grid System**: SLDS responsive grid

---

## Environment Setup

### Required Environment Variables

#### GitHub Secrets
Set these in GitHub repository settings → Secrets and variables → Actions:

```
NETLIFY_AUTH_TOKEN=your_netlify_auth_token
NETLIFY_STAGING_SITE_ID=your_staging_site_id
NETLIFY_PRODUCTION_SITE_ID=your_production_site_id
STAGING_URL=https://staging.foodandforce.com
PRODUCTION_URL=https://foodandforce.com
LHCI_GITHUB_APP_TOKEN=your_lighthouse_ci_token
```

#### Local Development (.env)
```bash
# Copy template
cp .env.example .env

# Edit with your values
NETLIFY_AUTH_TOKEN=your_token
NETLIFY_STAGING_SITE_ID=your_staging_id
NETLIFY_PRODUCTION_SITE_ID=your_production_id
```

### Netlify Setup

1. **Create Netlify Account**: Sign up at netlify.com
2. **Create Sites**:
   - Production site: Link to your main branch
   - Staging site: Link to a staging branch (if applicable)
3. **Get Site IDs**: From site settings → General → Site details
4. **Configure Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.` (root)
   - Node version: `18`

---

## Deployment Commands

### Manual Deployments
```bash
# Deploy to staging
npm run deploy:staging

# Deploy to production (requires approval in CI/CD)
npm run deploy:production

# Run health check
npm run health-check

# Emergency rollback (use GitHub Actions workflow)
# Go to Actions → Emergency Rollback → Run workflow
```

### Automated Deployments
- **Feature Branches**: Auto-preview on push
- **Develop Branch**: Auto-deploy to staging
- **Main Branch**: Auto-deploy to production (with approval)

---

## Monitoring and Health Checks

### Automated Health Checks

#### Health Check Script (scripts/health-check.js)
```javascript
class HealthChecker {
    constructor() {
        this.checks = [
            'siteAvailability',
            'performanceMetrics',
            'sldsCompliance',
            'accessibilityBaseline',
            'securityHeaders'
        ];
        this.results = {};
    }
    
    async runHealthCheck() {
        console.log('🏥 Running health check...');
        
        for (const check of this.checks) {
            try {
                console.log(`🔍 Running ${check}...`);
                this.results[check] = await this[check]();
                console.log(`✅ ${check}: PASS`);
            } catch (error) {
                console.error(`❌ ${check}: FAIL - ${error.message}`);
                this.results[check] = { status: 'FAIL', error: error.message };
            }
        }
        
        return this.generateHealthReport();
    }
    
    async siteAvailability() {
        const pages = [
            'https://foodandforce.netlify.app/',
            'https://foodandforce.netlify.app/about.html',
            'https://foodandforce.netlify.app/services.html'
        ];
        
        for (const url of pages) {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`${url} returned ${response.status}`);
            }
        }
        
        return { status: 'PASS', message: 'All pages accessible' };
    }
}

// Run health check if called directly
if (require.main === module) {
    const checker = new HealthChecker();
    checker.runHealthCheck()
        .then(report => {
            process.exit(report.status === 'HEALTHY' ? 0 : 1);
        })
        .catch(error => {
            console.error('Health check failed:', error);
            process.exit(1);
        });
}
```

### Monitoring Dashboards
- GitHub Actions provide automated quality gates
- Netlify shows deployment status and previews
- All reports are archived for 30-90 days

---

## Emergency Procedures

### Rollback Process

#### Automatic Rollback (GitHub Actions)
1. Go to GitHub Actions
2. Select "Emergency Rollback" workflow
3. Click "Run workflow"
4. Provide deployment ID and reason
5. Confirm execution

#### Manual Rollback
```bash
# Set environment variables
export NETLIFY_AUTH_TOKEN="your_token"
export NETLIFY_PRODUCTION_SITE_ID="your_site_id"

# Use Netlify CLI
netlify api rollbackSiteDeploy --site-id=$NETLIFY_PRODUCTION_SITE_ID --deploy-id=<target-deployment-id>

# Verify rollback
npm run health-check
```

### Incident Response
1. **Immediate**: Use emergency rollback workflow
2. **Investigation**: Check logs and deployment artifacts
3. **Communication**: Notify stakeholders of issue and resolution
4. **Documentation**: Create incident report with lessons learned

---

## Security Measures

### Content Security Policy
```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  frame-ancestors 'none';
```

### Security Headers
- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin

### Security Scanning
```bash
# Automated security scanning (runs in CI/CD)
npm audit --audit-level=moderate
npm audit fix --force

# Manual security validation
node scripts/security-check.js
```

---

## Troubleshooting

### Common Issues

#### Build Failures
1. **Check Logs**: Review GitHub Actions logs for specific errors
2. **Local Testing**: Run `npm run build` locally
3. **Dependencies**: Update dependencies with `npm update`
4. **Environment**: Verify environment variables are set

#### Performance Issues
1. **Lighthouse Reports**: Review generated performance reports
2. **Bundle Analysis**: Check asset sizes and optimization
3. **Network**: Test on different connection speeds
4. **Caching**: Verify CDN and browser caching

#### Accessibility Issues
1. **Pa11y Output**: Review accessibility test results
2. **Manual Testing**: Test with keyboard navigation and screen readers
3. **Contrast**: Check color contrast ratios
4. **ARIA**: Validate ARIA attributes and semantics

### Debug Commands
```bash
# Run individual quality checks
npm run lint:html
npm run lint:css
npm run lint:js

# Run specific tests
npm run test:accessibility
npm run test:performance
npm run test:browser

# Manual deployment with verbose output
netlify deploy --dir=. --prod --debug
```

---

## Success Metrics

### Deployment Success Indicators
- ✅ 100% WCAG 2.1 AA accessibility compliance
- ✅ 85%+ performance scores across all pages
- ✅ SLDS design system compliance
- ✅ Cross-browser compatibility
- ✅ Automated security scanning
- ✅ Zero-downtime deployments
- ✅ One-click rollback capability

### Performance Targets Met
- **Load Time**: < 3 seconds on 3G connections
- **Core Web Vitals**: All metrics in "Good" range
- **Accessibility**: Zero violations in automated testing
- **Security**: All security headers properly configured

---

## Support and Maintenance

### Deployment Support
- **Documentation**: Comprehensive deployment guides
- **Monitoring**: Automated health checks and alerts
- **Rollback**: One-click emergency rollback procedures
- **Logs**: Complete deployment and error logging

### Regular Maintenance
- **Weekly**: Security updates and dependency patches
- **Monthly**: Performance optimization and monitoring review
- **Quarterly**: Full security audit and penetration testing
- **Annually**: Architecture review and technology updates

---

This deployment guide ensures the Food-N-Force website can be deployed safely, efficiently, and reliably to production environments with comprehensive quality assurance, monitoring, and emergency response capabilities.

**Document Status**: Active  
**Next Review**: 2025-09-18  
**Maintained By**: DevOps Team