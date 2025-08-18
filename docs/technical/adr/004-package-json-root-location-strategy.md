# ADR-004: Package.json Root Location Strategy

**Status:** Accepted  
**Date:** 2025-01-18  
**Deciders:** Technical Architect, DevOps CI/CD Agent, Project Manager  
**Related ADRs:** ADR-001 (Safe File Removal), ADR-002 (Documentation Consolidation)

## Context

The Food-N-Force website currently has its `package.json` file located in `/config/package.json`, which deviates from industry standards and creates operational challenges for CI/CD pipeline management. With the recent successful migration from `/src/` structure to root-level folders (`css/`, `js/`, `images/`), we need to establish the correct architectural pattern for npm configuration management.

### Current State Issues

1. **Non-Standard Location**: `/config/package.json` is not recognized by npm tooling as the project root
2. **CI/CD Complexity**: Build systems expect package.json at project root for dependency resolution
3. **Script Execution Problems**: npm scripts reference paths relative to package.json location, causing failures
4. **Developer Experience**: Most IDEs and tools look for package.json at project root
5. **Dependency Resolution**: Node.js module resolution starts from package.json directory

### Technical Constraints

- **Zero Downtime Requirement**: Migration must not disrupt production
- **Script Compatibility**: All existing npm scripts must continue working
- **Path References**: 25+ npm scripts contain relative paths that need validation
- **CI/CD Integration**: GitHub Actions and Netlify builds must remain functional
- **Performance Budget**: Must not impact build performance (currently ~45s)

## Options Considered

### Option 1: Keep package.json in /config/ Directory

**Pros:**
- No immediate changes required
- Maintains current /config/ consolidation pattern
- Zero migration risk

**Cons:**
- Violates npm ecosystem standards
- Requires custom CI/CD configuration with working directory changes
- Poor developer experience with tooling
- Complicates dependency resolution
- Script paths become complex (`../css/`, `../js/`)
- Future scaling issues with monorepo patterns
- Tool integration problems (ESLint, Prettier, etc.)

### Option 2: Move package.json to Project Root

**Pros:**
- **Industry Standard**: Aligns with npm ecosystem conventions
- **CI/CD Simplification**: Standard tooling works without configuration
- **Developer Experience**: IDE tooling works correctly
- **Script Simplification**: Relative paths become straightforward (`css/`, `js/`)
- **Future-Proof**: Supports future architectural evolution
- **Tool Integration**: ESLint, Prettier, and other tools work seamlessly

**Cons:**
- Requires migration effort
- Temporary path updates needed
- Must update CI/CD configurations

### Option 3: Hybrid Approach with Symbolic Links

**Pros:**
- Maintains backward compatibility
- Gradual migration possible

**Cons:**
- Adds complexity without solving root issues
- Windows/Unix compatibility concerns
- Maintenance overhead
- Non-standard approach

## Decision

**We choose Option 2: Move package.json to Project Root**

This decision is based on:

1. **Architectural Consistency**: Aligns with the recent successful file structure migration
2. **Industry Standards Compliance**: Following npm ecosystem best practices
3. **Long-term Maintainability**: Reduces technical debt and complexity
4. **CI/CD Simplification**: Enables standard tooling and workflows
5. **Developer Experience**: Improves tooling integration and onboarding

## Implementation Strategy

### Phase 1: Pre-Migration Validation
```bash
# Validate all script paths work from root location
npm run lint --dry-run
npm run test --dry-run
npm run build --dry-run
```

### Phase 2: Migration Steps
1. **Copy** `package.json` from `/config/` to root
2. **Update** script paths to work from new location:
   ```json
   {
     "scripts": {
       "lint:css": "stylelint \"css/**/*.css\"",
       "lint:js": "eslint \"js/**/*.js\"",
       "validate:html": "html-validate \"*.html\""
     }
   }
   ```
3. **Update** CI/CD configurations to remove custom working directories
4. **Test** all build processes in staging environment
5. **Deploy** to production with monitoring
6. **Remove** old `/config/package.json` after successful validation

### Phase 3: Configuration Updates
- Update GitHub Actions workflows
- Update Netlify build configuration
- Update local development documentation
- Validate all npm scripts function correctly

## Consequences

### Positive Impacts

1. **Simplified CI/CD Pipelines**: Standard npm workflows without custom configuration
2. **Better Tool Integration**: ESLint, Prettier, IDE features work seamlessly
3. **Improved Developer Experience**: Standard project structure for new team members
4. **Future Architectural Flexibility**: Supports monorepo, workspace, and advanced tooling
5. **Reduced Maintenance**: Fewer custom workarounds needed
6. **Performance**: Faster dependency resolution from root location

### Temporary Challenges

1. **Migration Window**: ~30 minutes for full deployment cycle
2. **Path Updates**: Need to verify all script paths work correctly
3. **CI/CD Adjustments**: Temporary configuration updates needed
4. **Documentation Updates**: Development guides need path corrections

### Long-term Implications

1. **Scalability**: Supports future growth into multiple packages/workspaces
2. **Standards Compliance**: Aligns with industry best practices permanently
3. **Reduced Complexity**: Eliminates custom CI/CD workarounds
4. **Better Maintainability**: Standard patterns easier for new developers

## Compliance Checklist

### Performance Budget Impact
- [ ] Bundle sizes remain within established limits (≤150KB compressed JS)
- [ ] Build time remains under 60 seconds
- [ ] No impact on Core Web Vitals targets

### Security Considerations  
- [ ] Dependency audit results unchanged
- [ ] No new security vulnerabilities introduced
- [ ] CSP headers remain effective

### SLDS Compliance
- [ ] All SLDS framework integration preserved
- [ ] No impact on design token usage
- [ ] Component architecture remains compliant

### Special Effects Protection
- [ ] Logo animations preserve current functionality
- [ ] Background effects (index/about pages) remain intact
- [ ] Glassmorphism effects continue working
- [ ] No performance regression for effects systems

## Validation Criteria

### Success Metrics
1. All npm scripts execute successfully from new location
2. CI/CD pipelines pass with standard configuration
3. Zero production issues during migration window
4. Developer tooling (ESLint, IDE features) work correctly
5. Build performance remains within budget (45-60s)

### Rollback Plan
If critical issues arise:
1. Revert package.json to `/config/` location
2. Restore previous CI/CD configurations  
3. Validate all systems operational
4. Analyze failure points for future attempt

## Related Documentation

- [Performance Budget](../perf_budget.md) - Build performance requirements
- [Technical Guidelines](../tech_guidelines.md) - File organization standards
- [ADR-001](001-safe-file-removal-strategy.md) - File migration methodology
- [ADR-002](002-documentation-consolidation-approach.md) - Configuration organization

## Next Steps

1. **Immediate**: Validate script compatibility from root location
2. **Sprint 1**: Execute migration in staging environment
3. **Sprint 1**: Update CI/CD configurations
4. **Sprint 2**: Deploy to production with monitoring
5. **Sprint 2**: Update development documentation
6. **Future**: Leverage standard tooling capabilities for enhanced workflows

---
**Decision Record Owner:** Technical Architect  
**Implementation Owner:** DevOps CI/CD Agent  
**Review Date:** 2025-04-18 (Quarterly Review)