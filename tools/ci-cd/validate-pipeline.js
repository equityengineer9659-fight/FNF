#!/usr/bin/env node

/**
 * Strategic Refactoring CI/CD Pipeline Validation Script
 * Validates that all enhanced CI/CD components are properly configured
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PipelineValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.passes = [];
    this.workflowDir = path.join(process.cwd(), '.github', 'workflows');
    this.toolsDir = path.join(process.cwd(), 'tools');
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
  }

  error(message) {
    this.errors.push(message);
    this.log('error', message);
  }

  warning(message) {
    this.warnings.push(message);
    this.log('warning', message);
  }

  pass(message) {
    this.passes.push(message);
    this.log('pass', message);
  }

  validateFileExists(filepath, description) {
    if (fs.existsSync(filepath)) {
      this.pass(`${description} exists: ${path.relative(process.cwd(), filepath)}`);
      return true;
    } else {
      this.error(`${description} missing: ${path.relative(process.cwd(), filepath)}`);
      return false;
    }
  }

  validateWorkflowFile(filename, requiredJobs) {
    const filepath = path.join(this.workflowDir, filename);
    
    if (!this.validateFileExists(filepath, `Workflow file ${filename}`)) {
      return false;
    }

    try {
      const content = fs.readFileSync(filepath, 'utf8');
      
      // Check for required jobs
      requiredJobs.forEach(job => {
        if (content.includes(`${job}:`)) {
          this.pass(`Workflow ${filename} contains required job: ${job}`);
        } else {
          this.error(`Workflow ${filename} missing required job: ${job}`);
        }
      });

      // Check for strategic refactoring keywords
      const strategicKeywords = ['phase', 'mobile-nav', 'agent-notification', 'rollback'];
      strategicKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          this.pass(`Workflow ${filename} includes strategic keyword: ${keyword}`);
        } else {
          this.warning(`Workflow ${filename} may be missing strategic feature: ${keyword}`);
        }
      });

      return true;
    } catch (error) {
      this.error(`Error reading workflow file ${filename}: ${error.message}`);
      return false;
    }
  }

  validatePackageScripts() {
    const packagePath = path.join(process.cwd(), 'package.json');
    
    if (!this.validateFileExists(packagePath, 'package.json')) {
      return false;
    }

    try {
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const scripts = packageData.scripts || {};

      const requiredScripts = [
        'test:critical-navigation',
        'test:performance-budget',
        'test:accessibility',
        'validate:slds',
        'ci:rollback-validation'
      ];

      requiredScripts.forEach(script => {
        if (scripts[script]) {
          this.pass(`Package.json contains required script: ${script}`);
        } else {
          this.error(`Package.json missing required script: ${script}`);
        }
      });

      return true;
    } catch (error) {
      this.error(`Error reading package.json: ${error.message}`);
      return false;
    }
  }

  validatePlaywrightConfig() {
    const playwrightPath = path.join(process.cwd(), 'playwright.config.js');
    
    if (!this.validateFileExists(playwrightPath, 'Playwright configuration')) {
      return false;
    }

    try {
      const content = fs.readFileSync(playwrightPath, 'utf8');

      // Check for enhanced project configurations
      const requiredProjects = [
        'chromium-mobile',
        'firefox-mobile',
        'webkit-mobile',
        'chromium-tablet',
        'chromium-desktop'
      ];

      requiredProjects.forEach(project => {
        if (content.includes(project)) {
          this.pass(`Playwright config includes enhanced project: ${project}`);
        } else {
          this.error(`Playwright config missing enhanced project: ${project}`);
        }
      });

      return true;
    } catch (error) {
      this.error(`Error reading Playwright config: ${error.message}`);
      return false;
    }
  }

  validateTestFiles() {
    const testDir = path.join(this.toolsDir, 'testing', 'tests');
    
    if (!fs.existsSync(testDir)) {
      this.error(`Test directory missing: ${testDir}`);
      return false;
    }

    const requiredTestFiles = [
      'mobile-navigation.spec.js',
      'mobile-navigation-fixed.spec.js'
    ];

    requiredTestFiles.forEach(testFile => {
      const filepath = path.join(testDir, testFile);
      this.validateFileExists(filepath, `Test file ${testFile}`);
    });

    return true;
  }

  validateEnvironmentSecrets() {
    this.log('info', 'Checking required environment variables and secrets...');
    
    const requiredSecrets = [
      'NETLIFY_AUTH_TOKEN',
      'NETLIFY_STAGING_SITE_ID',
      'NETLIFY_PRODUCTION_SITE_ID'
    ];

    // Note: In a real environment, you'd check if these are configured in GitHub
    // For now, we'll just document them as requirements
    requiredSecrets.forEach(secret => {
      this.warning(`Ensure GitHub secret is configured: ${secret}`);
    });
  }

  validateWorkflowFiles() {
    this.log('info', 'Validating workflow files...');

    // Main CI/CD pipeline
    this.validateWorkflowFile('ci-cd.yml', [
      'phase-detection',
      'mobile-navigation-safety', 
      'quality-checks',
      'strategic-performance-tests',
      'strategic-browser-tests',
      'deploy-staging'
    ]);

    // Strategic rollback system
    this.validateWorkflowFile('strategic-rollback.yml', [
      'emergency-validation',
      'phase-specific-rollback',
      'rollback-verification'
    ]);

    // Phase transition system
    this.validateWorkflowFile('phase-transition.yml', [
      'pre-transition-validation',
      'execute-phase-transition',
      'create-transition-pr'
    ]);

    // Continuous monitoring
    this.validateWorkflowFile('strategic-monitoring.yml', [
      'detect-active-phase',
      'mobile-navigation-monitoring',
      'performance-monitoring',
      'monitoring-summary'
    ]);

    // Legacy rollback validation
    this.validateWorkflowFile('rollback-validation.yml', [
      'critical-navigation-tests',
      'performance-budget-validation',
      'quality-gate-summary'
    ]);
  }

  validateDirectoryStructure() {
    this.log('info', 'Validating directory structure...');

    const requiredDirectories = [
      '.github/workflows',
      'tools/testing',
      'tools/deployment',
      'docs'
    ];

    requiredDirectories.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        this.pass(`Required directory exists: ${dir}`);
      } else {
        this.error(`Required directory missing: ${dir}`);
      }
    });
  }

  validateConfiguration() {
    this.log('info', 'Validating configuration files...');

    // Validate package.json scripts
    this.validatePackageScripts();

    // Validate Playwright configuration
    this.validatePlaywrightConfig();

    // Validate test files
    this.validateTestFiles();
  }

  async run() {
    console.log('🔍 Strategic Refactoring CI/CD Pipeline Validation');
    console.log('='.repeat(60));

    // Validate directory structure
    this.validateDirectoryStructure();

    // Validate workflow files
    this.validateWorkflowFiles();

    // Validate configuration
    this.validateConfiguration();

    // Validate environment setup
    this.validateEnvironmentSecrets();

    // Generate summary
    this.generateSummary();

    return {
      success: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      passes: this.passes
    };
  }

  generateSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(60));

    console.log(`✅ Passed: ${this.passes.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);

    if (this.errors.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES REQUIRING ATTENTION:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. ${warning}`);
      });
    }

    const overallStatus = this.errors.length === 0 ? 'READY' : 'NEEDS ATTENTION';
    const statusIcon = this.errors.length === 0 ? '✅' : '❌';
    
    console.log(`\n${statusIcon} OVERALL STATUS: ${overallStatus}`);
    
    if (this.errors.length === 0) {
      console.log('\n🎉 Strategic Refactoring CI/CD Pipeline is properly configured!');
      console.log('The enhanced pipeline is ready to support the 4-phase refactoring process.');
    } else {
      console.log('\n🔧 Please address the critical issues above before proceeding with the strategic refactoring.');
    }

    console.log('\n📚 Next Steps:');
    console.log('1. Review and address any critical issues');
    console.log('2. Configure required GitHub secrets');
    console.log('3. Test the pipeline with a small change');
    console.log('4. Begin Phase 1: JavaScript Consolidation');
    
    console.log('\n🔗 Documentation: docs/ci-cd-strategic-refactoring-plan.md');
    console.log('='.repeat(60));
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new PipelineValidator();
  validator.run().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Validation failed with error:', error);
    process.exit(1);
  });
}

module.exports = PipelineValidator;