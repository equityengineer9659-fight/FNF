/**
 * Phase 2 Accessibility Compliance Auditor
 * WCAG 2.1 AA compliance validation
 */

const fs = require('fs');
const { execSync } = require('child_process');

class AccessibilityAuditor {
  constructor(options = {}) {
    this.complianceLevel = process.env.ACCESSIBILITY_COMPLIANCE_LEVEL || 'AA';
    this.testPages = [
      '/',
      '/about.html',
      '/services.html', 
      '/impact.html',
      '/resources.html',
      '/contact.html'
    ];
    this.serverUrl = options.serverUrl || 'http://localhost:8080';
  }

  async runAccessibilityAudit() {
    console.log('Phase 2 Accessibility Compliance Audit');
    console.log(`WCAG 2.1 ${this.complianceLevel} Compliance Testing`);
    
    const results = {
      pageResults: [],
      summary: {
        totalPages: this.testPages.length,
        passedPages: 0,
        failedPages: 0,
        totalViolations: 0
      }
    };

    for (const page of this.testPages) {
      const pageResult = await this.testPageAccessibility(page);
      results.pageResults.push(pageResult);
      
      if (pageResult.passed) {
        results.summary.passedPages++;
      } else {
        results.summary.failedPages++;
      }
      
      results.summary.totalViolations += pageResult.violations;
    }

    return this.evaluateAccessibilityResults(results);
  }

  async testPageAccessibility(page) {
    console.log(`Testing accessibility for: ${page}`);
    
    const testUrl = `${this.serverUrl}${page}`;
    const result = {
      page,
      url: testUrl,
      passed: false,
      violations: 0,
      errors: [],
      warnings: []
    };

    try {
      // Use pa11y for WCAG testing
      const command = `npx pa11y "${testUrl}" --standard WCAG2${this.complianceLevel} --level error --timeout 30000 --reporter cli`;
      const output = execSync(command, { 
        encoding: 'utf8',
        timeout: 35000
      });
      
      result.passed = true;
      console.log(`✅ ${page} - WCAG 2.1 ${this.complianceLevel} compliant`);
      
    } catch (error) {
      // Parse pa11y output for violations
      const errorOutput = error.stdout || error.message;
      const violationMatches = errorOutput.match(/Error:/g);
      result.violations = violationMatches ? violationMatches.length : 1;
      result.errors.push(errorOutput);
      
      console.log(`❌ ${page} - ${result.violations} WCAG violations found`);
    }

    return result;
  }

  async testMobileAccessibility() {
    console.log('Testing mobile navigation accessibility');
    
    try {
      const command = `npx pa11y "${this.serverUrl}/" --standard WCAG2${this.complianceLevel} --level warning --timeout 30000`;
      execSync(command, { encoding: 'utf8', timeout: 35000 });
      
      console.log('✅ Mobile accessibility validation passed');
      return { passed: true, violations: 0 };
      
    } catch (error) {
      console.log('⚠️ Mobile accessibility issues detected');
      return { passed: false, violations: 1 };
    }
  }

  evaluateAccessibilityResults(results) {
    console.log('Evaluating accessibility compliance results');
    console.log(`Pages tested: ${results.summary.totalPages}`);
    console.log(`Pages passed: ${results.summary.passedPages}`);
    console.log(`Pages failed: ${results.summary.failedPages}`);
    console.log(`Total violations: ${results.summary.totalViolations}`);

    const passRate = (results.summary.passedPages / results.summary.totalPages) * 100;
    
    if (results.summary.failedPages === 0) {
      console.log('✅ Full WCAG 2.1 AA compliance achieved');
      return { status: 'PASSED', passRate: 100, results };
    } else if (passRate >= 80) {
      console.log('⚠️ Partial compliance - review required');
      return { status: 'WARNING', passRate, results };
    } else {
      console.log('❌ Accessibility compliance failed');
      return { status: 'FAILED', passRate, results };
    }
  }

  async generateAccessibilityReport(results) {
    const reportDir = 'accessibility-reports';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const report = {
      timestamp: new Date().toISOString(),
      complianceLevel: this.complianceLevel,
      summary: results.summary,
      pageResults: results.pageResults
    };

    const reportFile = `${reportDir}/accessibility-audit-${Date.now()}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    console.log(`Accessibility report saved: ${reportFile}`);
    return reportFile;
  }
}

// CLI execution
if (require.main === module) {
  const auditor = new AccessibilityAuditor();
  
  auditor.runAccessibilityAudit()
    .then(async result => {
      await auditor.generateAccessibilityReport(result.results || {});
      
      if (result.status === 'FAILED') {
        console.error('Accessibility audit failed');
        process.exit(1);
      } else if (result.status === 'WARNING') {
        console.warn('Accessibility audit completed with warnings');
        process.exit(0);
      } else {
        console.log('Accessibility audit passed');
        process.exit(0);
      }
    })
    .catch(error => {
      console.error('Accessibility audit error:', error.message);
      process.exit(1);
    });
}

module.exports = AccessibilityAuditor;
