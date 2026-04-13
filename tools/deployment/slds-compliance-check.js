#!/usr/bin/env node

/**
 * SLDS Compliance Checker
 * Validates SLDS component usage and design token compliance
 */

import fs from 'fs';
import { glob } from 'glob';

class SLDSComplianceChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.requiredSLDSClasses = [
      'slds-grid',
      'slds-col',
      'slds-button',
      'slds-brand',
      'slds-text-heading',
      'slds-container',
    ];
    this.deprecatedClasses = [
      'slds-size--',
      'slds-large-size--',
      'slds-medium-size--',
      'slds-small-size--',
    ];
  }

  async checkFiles() {
    console.log('🔍 Starting SLDS Compliance Check...\n');

    // Check HTML files
    const htmlFiles = await glob('**/*.html', { ignore: 'node_modules/**' });
    for (const file of htmlFiles) {
      await this.checkHTMLFile(file);
    }

    // Check CSS files
    const cssFiles = await glob('src/css/**/*.css', { ignore: 'node_modules/**' });
    for (const file of cssFiles) {
      await this.checkCSSFile(file);
    }

    this.generateReport();
  }

  async checkHTMLFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for required SLDS classes usage
    let hasSldsClasses = false;
    this.requiredSLDSClasses.forEach(className => {
      if (content.includes(className)) {
        hasSldsClasses = true;
      }
    });

    if (!hasSldsClasses && filePath !== 'index.html') {
      this.warnings.push(`${filePath}: No SLDS classes detected. Consider using SLDS components.`);
    }

    // Check for deprecated SLDS classes
    this.deprecatedClasses.forEach(deprecatedClass => {
      if (content.includes(deprecatedClass)) {
        this.errors.push(`${filePath}: Deprecated SLDS class pattern '${deprecatedClass}' found. Update to new sizing utilities.`);
      }
    });

    // Check for proper SLDS button usage
    const buttonMatches = content.match(/<button[^>]*class="[^"]*slds-button[^"]*"/g);
    if (buttonMatches) {
      buttonMatches.forEach(button => {
        if (!button.includes('slds-button_')) {
          this.warnings.push(`${filePath}: SLDS button found without variant class. Consider adding slds-button_brand, slds-button_neutral, etc.`);
        }
      });
    }

    // Check for SLDS grid usage
    if (content.includes('slds-grid')) {
      if (!content.includes('slds-col')) {
        this.warnings.push(`${filePath}: SLDS grid found without slds-col classes. Ensure proper grid structure.`);
      }
    }

    // Check for proper SLDS brand component usage
    if (content.includes('slds-brand')) {
      if (!content.includes('slds-brand__logo-image')) {
        this.warnings.push(`${filePath}: SLDS brand component should include slds-brand__logo-image class.`);
      }
    }

    // Check for accessibility with SLDS patterns
    if (!content.includes('role=') && content.includes('main')) {
      this.warnings.push(`${filePath}: Consider using SLDS accessibility patterns with proper role attributes.`);
    }
  }

  async checkCSSFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Check for SLDS design tokens usage
    const sldsTokenPattern = /--slds-c-[a-z-]+/g;
    const customPropertyPattern = /--[a-z-]+/g;
    
    const sldsTokens = content.match(sldsTokenPattern) || [];
    const customProperties = content.match(customPropertyPattern) || [];
    const nonSldsCustomProperties = customProperties.filter(prop => !prop.startsWith('--slds-c-') && !prop.startsWith('--fnf-'));

    if (nonSldsCustomProperties.length > 0) {
      this.warnings.push(`${filePath}: Custom CSS properties found that don't follow SLDS token naming: ${nonSldsCustomProperties.slice(0, 3).join(', ')}${nonSldsCustomProperties.length > 3 ? '...' : ''}`);
    }

    // Check for hard-coded colors instead of design tokens
    const colorPattern = /#[0-9a-fA-F]{3,6}|rgb\([^)]+\)|rgba\([^)]+\)/g;
    const hardCodedColors = content.match(colorPattern) || [];
    
    if (hardCodedColors.length > 0) {
      this.warnings.push(`${filePath}: Hard-coded colors found. Consider using SLDS design tokens: ${hardCodedColors.slice(0, 3).join(', ')}${hardCodedColors.length > 3 ? '...' : ''}`);
    }

    // Check for SLDS spacing scale usage
    const spacingPattern = /(?:margin|padding)[^:]*:\s*(\d+(?:\.\d+)?(?:px|rem|em))/g;
    let match;
    while ((match = spacingPattern.exec(content)) !== null) {
      const value = match[1];
      if (!this.isSldsSpacingValue(value)) {
        this.warnings.push(`${filePath}: Custom spacing value '${value}' found. Consider using SLDS spacing utilities.`);
      }
    }
  }

  isSldsSpacingValue(value) {
    // SLDS spacing scale values
    const sldsSpacingValues = [
      '0.125rem', '0.25rem', '0.5rem', '0.75rem', '1rem', '1.5rem', '2rem', '3rem', '4rem', '6rem', '8rem', '12rem'
    ];
    return sldsSpacingValues.includes(value);
  }

  generateReport() {
    console.log('📊 SLDS Compliance Report\n');
    console.log('=' .repeat(50));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All SLDS compliance checks passed!\n');
      return;
    }

    if (this.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.errors.forEach(error => console.log(`  ${error}`));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`  ${warning}`));
      console.log('');
    }

    console.log(`Total Issues: ${this.errors.length} errors, ${this.warnings.length} warnings\n`);

    // Exit with error code if there are errors
    if (this.errors.length > 0) {
      process.exit(1);
    }
  }
}

// Run the checker
const checker = new SLDSComplianceChecker();
checker.checkFiles().catch(console.error);