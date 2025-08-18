# ADR-005: Configuration Consolidation Approach

**Status:** Accepted  
**Date:** 2025-01-18  
**Deciders:** Technical Architect, DevOps CI/CD Agent, Project Manager  
**Related ADRs:** ADR-004 (Package.json Location), ADR-002 (Documentation Consolidation)

## Context

The Food-N-Force website currently has duplicated configuration files across multiple directories, creating maintenance overhead and potential inconsistencies. With the package.json migration to root (ADR-004) and recent file structure improvements, we need to establish a unified configuration management strategy.

### Current Configuration State

**Duplicated Configuration Files:**
```
/config/
├── html-validate.json        # HTML validation rules
├── lighthouserc.json        # Performance testing config
├── playwright.config.js     # Browser testing config
├── package.json            # Moving to root per ADR-004
└── netlify.toml            # Netlify deployment config

/tools/testing/
├── html-validate.json      # DUPLICATE of /config/ version
└── lighthouserc.json       # DUPLICATE of /config/ version

Root level:
└── netlify.toml            # DUPLICATE of /config/ version
```

### Problems with Current State

1. **Configuration Drift**: Duplicated files can become inconsistent over time
2. **Maintenance Overhead**: Changes must be made in multiple locations
3. **CI/CD Confusion**: Tools may use different config versions
4. **Developer Confusion**: Unclear which configuration is authoritative
5. **Build Inconsistencies**: Different environments may use different configs

### Business Impact

- **Risk of Production Issues**: Inconsistent configurations between environments
- **Development Velocity**: Time wasted maintaining duplicate configs
- **Quality Assurance**: Testing may use different rules than production

## Options Considered

### Option 1: Single Source of Truth in /config/

**Pros:**
- Centralizes all configuration files
- Maintains current /config/ organization pattern
- Clear ownership and governance
- Easy to find and maintain all configs

**Cons:**
- Some tools expect configs at project root
- CI/CD systems need custom path configuration
- Package.json move (ADR-004) breaks this pattern

### Option 2: Tool-Standard Locations (Root + Tool Directories)

**Pros:**
- Tools work without custom configuration
- Industry standard approach
- Better tool integration

**Cons:**
- Configurations scattered across project
- Harder to maintain governance
- No centralized configuration management

### Option 3: Hybrid Approach - Single Source with References

**Pros:**
- Single source of truth maintained
- Tools can find configs where expected
- Backward compatibility during transition

**Cons:**
- Adds complexity with references/symlinks
- Platform compatibility issues (Windows/Unix)
- Not a long-term sustainable solution

### Option 4: Configuration Consolidation with Clear Hierarchies

**Pros:**
- Single source of truth in /config/
- Clear referencing from package.json and CI/CD
- Maintains governance while enabling tool integration
- Supports environment-specific overrides

**Cons:**
- Requires initial setup effort
- Some tools need explicit config path specification

## Decision

**We choose Option 4: Configuration Consolidation with Clear Hierarchies**

### Rationale

1. **Governance**: Maintains single source of truth for configuration management
2. **Tool Integration**: Enables tools to work with explicit config paths
3. **Maintainability**: Single location for all configuration updates
4. **Environment Consistency**: Ensures same configs across all environments
5. **Future-Proof**: Supports advanced configuration patterns

## Implementation Strategy

### Configuration Hierarchy

```
/config/                    # Single source of truth
├── environments/           # Environment-specific overrides
│   ├── development.json
│   ├── staging.json
│   └── production.json
├── testing/               # Test framework configurations
│   ├── html-validate.json
│   ├── lighthouserc.json
│   └── playwright.config.js
├── deployment/            # Deployment configurations
│   └── netlify.toml
├── linting/              # Code quality configurations
│   ├── eslint.config.js
│   └── stylelint.config.js
└── package.json          # Will move to root per ADR-004
```

### Reference Strategy

**Package.json Scripts (at root):**
```json
{
  "scripts": {
    "validate:html": "html-validate --config config/testing/html-validate.json \"*.html\"",
    "test:performance": "lhci autorun --config config/testing/lighthouserc.json",
    "test:browser": "playwright test --config config/testing/playwright.config.js"
  }
}
```

**CI/CD Pipeline References:**
```yaml
# GitHub Actions example
- name: HTML Validation
  run: npm run validate:html
  
- name: Performance Testing  
  run: npm run test:performance
```

**Netlify Configuration:**
```toml
# netlify.toml at root references config
[build]
  command = "npm run build"
  publish = "."

# Include config-specific settings
[include]
  path = "config/deployment/netlify.toml"
```

## Migration Plan

### Phase 1: Audit and Consolidation

1. **Inventory Current Configurations**
   ```bash
   # Find all config files
   find . -name "*.json" -o -name "*.toml" -o -name "*.config.js"
   
   # Compare duplicates for differences
   diff config/html-validate.json tools/testing/html-validate.json
   diff config/lighthouserc.json tools/testing/lighthouserc.json
   ```

2. **Identify Configuration Differences**
   - Document any differences between duplicated files
   - Determine which version is correct/preferred
   - Plan reconciliation strategy

### Phase 2: Consolidate Authoritative Versions

1. **Keep /config/ as Single Source**
   ```
   /config/testing/html-validate.json     # Master version
   /config/testing/lighthouserc.json      # Master version
   /config/testing/playwright.config.js   # Master version
   /config/deployment/netlify.toml        # Master version
   ```

2. **Remove Duplicate Files**
   ```
   DELETE: /tools/testing/html-validate.json
   DELETE: /tools/testing/lighthouserc.json  
   DELETE: /netlify.toml (root level)
   ```

3. **Update References**
   - Update npm scripts to reference /config/ locations
   - Update CI/CD pipelines to use npm scripts
   - Update deployment configurations

### Phase 3: Validation and Testing

1. **Staging Environment Testing**
   ```bash
   # Test all configuration-dependent processes
   npm run validate:html
   npm run test:performance  
   npm run test:browser
   npm run build
   ```

2. **CI/CD Pipeline Testing**
   - Validate GitHub Actions use correct configs
   - Verify Netlify builds use proper settings
   - Test deployment process end-to-end

3. **Cross-Platform Validation**
   - Test on Windows (current development)
   - Validate on Linux (CI/CD environments)
   - Verify path resolution works correctly

## Consequences

### Positive Impacts

1. **Configuration Consistency**: Single source of truth eliminates drift
2. **Easier Maintenance**: One location for all configuration changes
3. **Better Governance**: Clear ownership and change control
4. **Reduced Errors**: No risk of updating only some copies
5. **Cleaner Project Structure**: Eliminates duplicate files

### Implementation Considerations

1. **Tool Configuration Updates**: Some tools need explicit config paths
2. **CI/CD Adjustments**: Pipeline configurations need updates
3. **Documentation Updates**: Developer guides need path corrections
4. **Migration Window**: Brief period where both old and new patterns exist

### Long-term Benefits

1. **Scalability**: Easy to add new configurations in organized manner
2. **Environment Management**: Clear separation of environment-specific settings
3. **Audit Trail**: Single location makes configuration changes traceable
4. **Developer Experience**: Clear configuration location for new team members

## Configuration Standards

### File Organization Rules

1. **Grouping**: Related configurations in same subdirectory
2. **Naming**: Descriptive names indicating purpose and tool
3. **Environment Handling**: Environment-specific configs in `/config/environments/`
4. **Tool Configs**: Tool-specific settings in `/config/[tool-category]/`

### Change Management

1. **Version Control**: All configuration changes through pull requests
2. **Testing**: Configuration changes must pass staging validation
3. **Documentation**: Significant changes documented in ADRs
4. **Backwards Compatibility**: Consider impact on existing workflows

### Access Patterns

```bash
# Direct tool usage (development)
html-validate --config config/testing/html-validate.json "*.html"
lhci autorun --config config/testing/lighthouserc.json
playwright test --config config/testing/playwright.config.js

# Through npm scripts (preferred for consistency)
npm run validate:html
npm run test:performance
npm run test:browser
```

## Risk Mitigation

### Configuration Consistency Risks
- **Solution**: Automated validation of config file integrity
- **Implementation**: Add npm script to verify configurations match expected schemas

### Tool Integration Risks  
- **Solution**: Maintain compatibility with tool standard locations where critical
- **Implementation**: Use npm scripts as abstraction layer

### Migration Risks
- **Solution**: Gradual migration with extensive testing
- **Implementation**: Keep old configs until new system fully validated

## Success Metrics

1. **Zero Configuration Duplicates**: No duplicate config files in project
2. **Build Consistency**: Same configuration used across all environments
3. **Tool Integration**: All tools work correctly with centralized configs
4. **Developer Efficiency**: Faster configuration updates and maintenance

## Validation Checklist

### Pre-Migration
- [ ] Audit all configuration files and their locations
- [ ] Compare duplicate files for differences
- [ ] Document current CI/CD configuration dependencies
- [ ] Test current build process for baseline

### Post-Migration
- [ ] All duplicate configuration files removed
- [ ] npm scripts reference correct configuration paths
- [ ] CI/CD pipelines use updated configurations
- [ ] All build processes complete successfully
- [ ] No configuration-related errors in production

## Related Documentation

- [ADR-004: Package.json Root Location](004-package-json-root-location-strategy.md)
- [ADR-002: Documentation Consolidation](002-documentation-consolidation-approach.md)
- [Technical Guidelines](../tech_guidelines.md) - File organization standards
- [Performance Budget](../perf_budget.md) - Configuration impact on performance

---
**Decision Record Owner:** Technical Architect  
**Implementation Owner:** DevOps CI/CD Agent  
**Review Date:** 2025-04-18 (Quarterly Review)