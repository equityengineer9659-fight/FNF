# ADR-006: CI/CD Pipeline Path Management Strategy

**Status:** Accepted  
**Date:** 2025-01-18  
**Deciders:** Technical Architect, DevOps CI/CD Agent, Project Manager  
**Related ADRs:** ADR-004 (Package.json Location), ADR-005 (Configuration Consolidation)

## Context

Following the successful file structure migration from `/src/` to root-level folders and the architectural decisions for package.json location (ADR-004) and configuration consolidation (ADR-005), we need to establish comprehensive CI/CD pipeline path management strategies. The current CI/CD configurations contain outdated path references that will fail with the new architecture.

### Current CI/CD State Analysis

**Netlify Configuration Issues:**
```toml
# /config/netlify.toml - OUTDATED PATHS
[[headers]]
  for = "/src/styles/*"          # Path no longer exists
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]  
  for = "/src/scripts/*"         # Path no longer exists
  
[[headers]]
  for = "/src/assets/*"          # Path no longer exists
```

**Package.json Script Issues:**
```json
{
  "scripts": {
    "validate:slds": "node scripts/slds-compliance-check.js",  // Path may be incorrect
    "rollback": "node scripts/rollback.js"                     // Path may be incorrect
  }
}
```

### Impact Assessment

1. **Immediate Risks**: Pipeline failures due to incorrect paths
2. **Caching Issues**: CDN caching configured for non-existent paths
3. **Security Headers**: CSP and other headers targeting wrong paths
4. **Performance**: Cache misses due to incorrect path patterns
5. **Deployment Failures**: Build processes may fail to locate resources

## Options Considered

### Option 1: Reactive Path Updates (Fix as They Break)

**Pros:**
- Minimal immediate effort
- Focuses only on breaking issues

**Cons:**
- Risk of production failures
- Difficult to track all path dependencies
- Creates technical debt
- Poor developer experience during transition

### Option 2: Comprehensive Path Audit and Update

**Pros:**
- Proactive identification of all path dependencies
- Prevents production issues
- Creates documentation of path patterns
- Establishes standards for future changes

**Cons:**
- Significant upfront effort
- Requires thorough testing
- May identify hidden dependencies

### Option 3: Path Abstraction Layer

**Pros:**
- Decouples CI/CD from specific paths
- Future-proof against structure changes
- Enables easy environment-specific customization

**Cons:**
- Adds complexity
- Requires additional tooling
- May not be supported by all CI/CD platforms

### Option 4: Standardized Path Management with Documentation

**Pros:**
- Combines comprehensive audit with established standards
- Creates reusable patterns for future changes
- Provides clear governance for path management
- Enables automated validation

**Cons:**
- Moderate setup effort
- Requires team discipline to follow standards

## Decision

**We choose Option 4: Standardized Path Management with Documentation**

### Rationale

1. **Risk Mitigation**: Comprehensive approach prevents production failures
2. **Long-term Maintainability**: Establishes patterns for future changes
3. **Performance Optimization**: Correct caching and header configurations
4. **Developer Experience**: Clear standards reduce confusion and errors
5. **Automation Enablement**: Structured approach supports automated validation

## Implementation Strategy

### Phase 1: Path Dependency Audit

**1. Inventory All Path References**
```bash
# Search for path references in configuration files
grep -r "src/" config/ tools/ *.toml *.json
grep -r "scripts/" config/ tools/ *.toml *.json  
grep -r "styles/" config/ tools/ *.toml *.json
grep -r "assets/" config/ tools/ *.toml *.json
```

**2. Categorize Path Types**
- **Static Asset Paths**: CSS, JS, images for caching headers
- **Build Process Paths**: Script execution, tool configuration
- **Deployment Paths**: File copy operations, publish directories
- **Monitoring Paths**: Log collection, error reporting

### Phase 2: Path Standardization

**1. Establish Path Constants**
```toml
# Path variables for Netlify configuration
[build.environment]
  CSS_PATH = "css"
  JS_PATH = "js"
  IMAGES_PATH = "images"
  TOOLS_PATH = "tools"
  CONFIG_PATH = "config"
```

**2. Standardized Path Patterns**
```
Static Assets:
  CSS:     /css/*.css
  JS:      /js/**/*.js  
  Images:  /images/**/*

Build Tools:
  Scripts: tools/deployment/*.js
  Testing: tools/testing/*
  Config:  config/**/*

Deployment:
  Publish: . (root directory)
  Build:   . (root directory)
```

### Phase 3: Configuration Updates

**1. Netlify Configuration (netlify.toml)**
```toml
[build]
  publish = "."
  command = "npm run build"

# Updated cache headers for new paths
[[headers]]
  for = "/css/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    Content-Type = "text/css"

[[headers]]
  for = "/js/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    Content-Type = "application/javascript"

[[headers]]
  for = "/images/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
    Vary = "Accept"

[[headers]]
  for = "*.html"
  [headers.values]
    Cache-Control = "public, max-age=3600"
    Content-Type = "text/html; charset=utf-8"
```

**2. Package.json Script Updates**
```json
{
  "scripts": {
    "lint:css": "stylelint \"css/**/*.css\"",
    "lint:js": "eslint \"js/**/*.js\"",
    "validate:html": "html-validate \"*.html\"",
    "validate:slds": "node tools/deployment/slds-compliance-check.js",
    "deploy:staging": "netlify deploy",
    "deploy:production": "netlify deploy --prod",
    "rollback": "node tools/deployment/rollback.js"
  }
}
```

**3. CSP Header Updates**
```toml
# Updated Content Security Policy
Content-Security-Policy = """
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com;
  style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
"""
```

## Path Management Standards

### Directory Path Conventions

**Static Assets (Cacheable)**
```
/css/           - Stylesheets (long-term cache)
/js/            - JavaScript files (long-term cache)
/images/        - Image assets (long-term cache)
*.html          - HTML pages (short-term cache)
```

**Development Assets (No Cache)**
```
/tools/         - Build and deployment tools
/config/        - Configuration files
/docs/          - Documentation
```

**Build Process Paths**
```
Working Directory:  . (project root)
Config Directory:   config/
Tool Directory:     tools/
Output Directory:   . (builds in place)
```

### Path Reference Patterns

**1. Absolute Paths in Configuration**
```toml
# Good: Explicit absolute paths from root
for = "/css/*"
for = "/js/**/*.js"

# Bad: Relative paths that depend on context  
for = "css/*"
for = "../css/*"
```

**2. Relative Paths in npm Scripts**
```json
{
  "scripts": {
    "lint:css": "stylelint \"css/**/*.css\"",        // Good: relative to package.json
    "validate:html": "html-validate \"*.html\"",     // Good: pattern from root
    "build:tools": "node tools/deployment/build.js"  // Good: explicit tool path
  }
}
```

**3. Environment-Specific Paths**
```bash
# Development (local)
CSS_PATH=css
JS_PATH=js

# Production (CDN)  
CSS_PATH=https://cdn.foodnforce.org/css
JS_PATH=https://cdn.foodnforce.org/js
```

### Validation Automation

**1. Path Validation Script**
```javascript
// tools/validation/path-validator.js
const fs = require('fs');
const path = require('path');

class PathValidator {
  validateConfigPaths() {
    // Validate all configuration file paths exist
    // Report any broken references
    // Suggest corrections for common mistakes
  }
  
  validateCachePaths() {
    // Ensure cache headers target existing directories
    // Verify no critical paths are excluded
  }
  
  validateScriptPaths() {
    // Check all npm script paths are valid
    // Verify tool dependencies exist
  }
}
```

**2. Pre-deployment Validation**
```json
{
  "scripts": {
    "validate:paths": "node tools/validation/path-validator.js",
    "predeployment": "npm run validate:paths && npm run build && npm run test"
  }
}
```

## Risk Mitigation Strategies

### Deployment Risks

**1. Path-Related Build Failures**
- **Solution**: Comprehensive testing in staging environment
- **Implementation**: Validate all paths before production deployment
- **Monitoring**: Build process health checks

**2. Cache Misconfigurations**
- **Solution**: Explicit cache header validation
- **Implementation**: Automated testing of HTTP headers
- **Monitoring**: CDN hit rate monitoring

**3. Security Header Failures**
- **Solution**: CSP validation in CI/CD pipeline
- **Implementation**: Automated security header testing
- **Monitoring**: Security header compliance monitoring

### Performance Risks

**1. Incorrect Cache Headers**
- **Impact**: Reduced performance, increased bandwidth costs
- **Solution**: Automated cache header validation
- **Monitoring**: CDN performance metrics

**2. Missing Asset Optimization**  
- **Impact**: Larger bundle sizes, slower loading
- **Solution**: Automated asset optimization validation
- **Monitoring**: Bundle size tracking

## Migration Checklist

### Pre-Migration Validation
- [ ] Audit all configuration files for path references
- [ ] Document current path patterns and dependencies
- [ ] Identify all CI/CD systems that need updates
- [ ] Test current build process as baseline

### Configuration Updates
- [ ] Update Netlify configuration for new paths
- [ ] Update package.json scripts for new structure
- [ ] Update CSP headers for new resource locations
- [ ] Update cache headers for optimal performance

### Testing and Validation
- [ ] Test all npm scripts execute correctly
- [ ] Validate CI/CD pipelines with new configurations
- [ ] Verify cache headers work correctly
- [ ] Test security headers remain effective
- [ ] Validate deployment process end-to-end

### Post-Migration Monitoring
- [ ] Monitor build success rates
- [ ] Track cache hit rates and performance
- [ ] Validate security header compliance
- [ ] Monitor for path-related errors

## Performance Impact Assessment

### Cache Optimization
- **Benefit**: Proper cache headers for new paths improve performance
- **Implementation**: Long-term caching for static assets (CSS, JS, images)
- **Monitoring**: CDN hit rates should improve to >90%

### Bundle Optimization  
- **Current**: Build process unchanged
- **Benefit**: Proper path references enable better optimization
- **Future**: Enables advanced bundling strategies

### Network Performance
- **Headers**: Correct cache headers reduce bandwidth usage
- **Compression**: Proper path patterns enable optimal compression
- **CDN**: Efficient CDN utilization with correct path structure

## Success Metrics

1. **Zero Path-Related Build Failures**: All CI/CD pipelines execute successfully
2. **Correct Cache Headers**: >90% CDN hit rate for static assets
3. **Security Compliance**: All security headers properly configured
4. **Performance Maintenance**: Core Web Vitals remain within budget
5. **Developer Experience**: Clear documentation and error messages for path issues

## Future Considerations

### Scalability
- Path patterns support future growth (additional asset types, environments)
- Configuration structure enables easy addition of new paths
- Validation automation scales with project complexity

### Advanced Features
- Environment-specific path overrides
- Dynamic path generation for advanced deployments  
- Integration with advanced CDN features

### Maintenance
- Quarterly review of path patterns and optimization opportunities
- Annual assessment of CI/CD pipeline efficiency
- Continuous monitoring of performance impact

## Related Documentation

- [ADR-004: Package.json Root Location](004-package-json-root-location-strategy.md)
- [ADR-005: Configuration Consolidation](005-configuration-consolidation-approach.md)
- [Performance Budget](../perf_budget.md) - Impact on performance metrics
- [Technical Guidelines](../tech_guidelines.md) - File organization standards

---
**Decision Record Owner:** Technical Architect  
**Implementation Owner:** DevOps CI/CD Agent  
**Review Date:** 2025-04-18 (Quarterly Review)  
**Performance Impact:** Low risk - improved caching and optimization