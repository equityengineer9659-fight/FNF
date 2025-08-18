# Food-N-Force CI/CD Pipeline Documentation

## Overview

This document describes the comprehensive CI/CD pipeline implemented for the Food-N-Force website, ensuring high-quality, accessible, and performant deployments.

## Pipeline Architecture

### Quality Gates

The pipeline implements multiple quality gates that must pass before deployment:

1. **Code Quality**
   - HTML validation (W3C compliance)
   - CSS linting with SLDS compliance checks
   - JavaScript linting with accessibility rules
   - Security vulnerability scanning

2. **Performance Testing**
   - Lighthouse CI for Core Web Vitals
   - Performance budget enforcement
   - Resource optimization validation

3. **Accessibility Testing**
   - Pa11y for WCAG 2.1 AA compliance
   - Automated accessibility audits
   - Screen reader compatibility checks

4. **Cross-Browser Testing**
   - Chrome, Firefox, Safari compatibility
   - Mobile, tablet, desktop responsiveness
   - Progressive enhancement validation

## Deployment Environments

### Development
- **Trigger**: Feature branch pushes
- **Process**: Quality gates + preview deployment
- **URL**: Auto-generated Netlify preview URLs
- **Purpose**: Developer testing and validation

### Staging
- **Trigger**: Pull requests to `develop` branch
- **Process**: Full test suite + staging deployment
- **URL**: Dedicated staging environment
- **Purpose**: Integration testing and stakeholder review

### Production
- **Trigger**: Pushes to `main` branch
- **Process**: Complete validation + production deployment
- **URL**: https://foodnforce.com
- **Purpose**: Live website serving users

## Configuration Files

### Package.json Scripts

```json
{
  "scripts": {
    "lint": "npm run lint:html && npm run lint:css && npm run lint:js",
    "test": "npm run test:accessibility && npm run test:performance && npm run test:browser",
    "build": "npm run lint && npm run validate:html && npm run test",
    "deploy:staging": "netlify deploy",
    "deploy:production": "netlify deploy --prod"
  }
}
```

### Linting Configuration

- **HTMLHint** (`.htmlhintrc`): HTML validation and best practices
- **Stylelint** (`.stylelintrc.json`): CSS quality and SLDS compliance
- **ESLint** (`.eslintrc.json`): JavaScript quality with accessibility rules

### Testing Configuration

- **Lighthouse CI** (`lighthouserc.json`): Performance and accessibility thresholds
- **Pa11y** (`.pa11yci.json`): WCAG 2.1 AA compliance testing
- **Playwright** (`playwright.config.js`): Cross-browser testing

## GitHub Actions Workflows

### Main CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

**Jobs:**
1. `quality-checks`: Code linting, validation, security scanning
2. `performance-tests`: Lighthouse CI and Pa11y accessibility testing
3. `browser-tests`: Cross-browser compatibility testing
4. `deploy-staging`: Staging environment deployment
5. `deploy-production`: Production deployment with approvals

**Environment Variables Required:**
- `NETLIFY_AUTH_TOKEN`: Netlify API authentication
- `NETLIFY_STAGING_SITE_ID`: Staging site identifier
- `NETLIFY_PRODUCTION_SITE_ID`: Production site identifier

### Emergency Rollback (`.github/workflows/rollback.yml`)

**Purpose**: Quick rollback capability for production issues
**Trigger**: Manual workflow dispatch
**Inputs**:
- `deployment_id`: Target deployment to rollback to
- `reason`: Rollback justification

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

## Deployment Process

### Automatic Deployments

1. **Feature Branches**: Preview deployments for testing
2. **Develop Branch**: Staging deployment for integration testing
3. **Main Branch**: Production deployment with full validation

### Manual Deployments

```bash
# Staging deployment
npm run deploy:staging

# Production deployment (requires approval)
npm run deploy:production
```

### Deployment Scripts

- `scripts/deploy.js`: Comprehensive deployment with validation
- `scripts/rollback.js`: Emergency rollback procedures
- `scripts/health-check.js`: Post-deployment verification

## Monitoring and Alerting

### Health Checks

- **Automated**: Post-deployment health verification
- **Manual**: `npm run health-check` for on-demand testing
- **Monitoring**: Continuous availability monitoring

### Rollback Procedures

1. **Automatic Detection**: Failed health checks trigger alerts
2. **Manual Rollback**: Emergency rollback workflow
3. **Recovery Process**: Systematic issue resolution

## Security Measures

### Content Security Policy

```
default-src 'self';
script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com;
img-src 'self' data: https:;
```

### Security Headers

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Getting Started

### Prerequisites

1. **Node.js**: Version 18 or higher
2. **npm**: Version 9 or higher
3. **Git**: Version control
4. **Netlify Account**: For deployment

### Setup Steps

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd food-n-force-website
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   # Set up Netlify environment variables
   export NETLIFY_AUTH_TOKEN="your-token"
   export NETLIFY_STAGING_SITE_ID="staging-site-id"
   export NETLIFY_PRODUCTION_SITE_ID="production-site-id"
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Run Quality Checks**
   ```bash
   npm run build
   ```

## Troubleshooting

### Common Issues

1. **Linting Failures**: Check file formatting and fix violations
2. **Accessibility Issues**: Review Pa11y reports and fix compliance issues
3. **Performance Issues**: Optimize images and reduce bundle size
4. **Deployment Failures**: Verify environment variables and network connectivity

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
node scripts/deploy.js staging
```

## Contributing

### Pull Request Process

1. Create feature branch from `develop`
2. Implement changes with tests
3. Ensure all quality gates pass
4. Create pull request to `develop`
5. Review staging deployment
6. Merge after approval

### Code Standards

- Follow SLDS design system guidelines
- Maintain WCAG 2.1 AA accessibility compliance
- Write semantic HTML with proper ARIA labels
- Use SLDS design tokens for styling
- Implement progressive enhancement

## Support

For pipeline issues or questions:

1. Check GitHub Actions logs
2. Review quality gate reports
3. Run local debugging commands
4. Create issue with detailed description

## Version History

- **v1.0**: Initial CI/CD pipeline implementation
- **Current**: Comprehensive quality gates with SLDS compliance