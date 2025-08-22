/**
 * CI/CD Integration for Rollback Validation
 * Ensures automated testing prevents mobile navigation regressions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class RollbackCIIntegration {
    constructor() {
        this.testResultsDir = path.join(__dirname, '../../test-results');
        this.performanceBudgets = {
            cssBundleSize: 2048, // 2KB
            jsBundleSize: 8192,  // 8KB
            loadTime: 2000       // 2 seconds
        };
        
        this.ensureTestResultsDir();
    }
    
    ensureTestResultsDir() {
        if (!fs.existsSync(this.testResultsDir)) {
            fs.mkdirSync(this.testResultsDir, { recursive: true });
        }
    }
    
    /**
     * Run critical navigation smoke tests for CI/CD pipeline
     */
    async runCriticalNavigationTests() {
        console.log('🔍 Running critical navigation smoke tests...');
        
        try {
            // Run only the critical smoke test for speed
            const result = execSync(
                'npx playwright test --config=tools/testing/playwright.config.js --grep="Critical navigation smoke test"',
                { encoding: 'utf8', cwd: process.cwd() }
            );
            
            console.log('✅ Critical navigation tests passed');
            return { success: true, output: result };
        } catch (error) {
            console.error('❌ Critical navigation tests failed');
            console.error(error.stdout || error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Run performance budget validation
     */
    async runPerformanceBudgetTests() {
        console.log('📊 Running performance budget validation...');
        
        try {
            const result = execSync(
                'npx playwright test --config=tools/testing/playwright.config.js --grep="Performance budget monitoring"',
                { encoding: 'utf8', cwd: process.cwd() }
            );
            
            console.log('✅ Performance budget tests passed');
            return { success: true, output: result };
        } catch (error) {
            console.error('❌ Performance budget tests failed');
            console.error(error.stdout || error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Full rollback validation suite (for release branches)
     */
    async runFullRollbackValidation() {
        console.log('🔍 Running full rollback validation suite...');
        
        try {
            const result = execSync(
                'npx playwright test tools/testing/rollback-validation-protocol.js --config=tools/testing/playwright.config.js',
                { encoding: 'utf8', cwd: process.cwd() }
            );
            
            console.log('✅ Full rollback validation passed');
            return { success: true, output: result };
        } catch (error) {
            console.error('❌ Full rollback validation failed');
            console.error(error.stdout || error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Generate CI/CD quality gate report
     */
    generateQualityGateReport(testResults) {
        const timestamp = new Date().toISOString();
        const report = {
            timestamp: timestamp,
            qualityGate: {
                criticalNavigationTests: testResults.criticalNavigation?.success || false,
                performanceBudgetTests: testResults.performanceBudget?.success || false,
                overallStatus: (testResults.criticalNavigation?.success && testResults.performanceBudget?.success) ? 'PASS' : 'FAIL'
            },
            details: {
                criticalNavigationResult: testResults.criticalNavigation,
                performanceBudgetResult: testResults.performanceBudget
            },
            recommendations: []
        };
        
        // Add recommendations based on failures
        if (!testResults.criticalNavigation?.success) {
            report.recommendations.push('BLOCKING: Mobile navigation is broken. Review rollback validation protocol.');
        }
        
        if (!testResults.performanceBudget?.success) {
            report.recommendations.push('BLOCKING: Performance budgets exceeded. Review CSS/JS bundle sizes.');
        }
        
        if (report.qualityGate.overallStatus === 'PASS') {
            report.recommendations.push('All quality gates passed. Safe to deploy.');
        }
        
        // Save report
        const reportPath = path.join(this.testResultsDir, `quality-gate-${timestamp.replace(/[:.]/g, '-')}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📋 Quality gate report saved: ${reportPath}`);
        return report;
    }
    
    /**
     * Main CI/CD entry point
     */
    async runCIValidation(mode = 'commit') {
        console.log(`🚀 Starting CI/CD validation in ${mode} mode...`);
        
        const testResults = {};
        
        try {
            // Always run critical navigation tests
            testResults.criticalNavigation = await this.runCriticalNavigationTests();
            
            // Always run performance budget tests
            testResults.performanceBudget = await this.runPerformanceBudgetTests();
            
            // Run full validation for release branches
            if (mode === 'release') {
                testResults.fullValidation = await this.runFullRollbackValidation();
            }
            
            // Generate quality gate report
            const report = this.generateQualityGateReport(testResults);
            
            // Exit with appropriate code
            if (report.qualityGate.overallStatus === 'PASS') {
                console.log('✅ All quality gates passed');
                process.exit(0);
            } else {
                console.error('❌ Quality gates failed');
                process.exit(1);
            }
            
        } catch (error) {
            console.error('💥 CI/CD validation failed with error:', error.message);
            process.exit(1);
        }
    }
}

// CLI interface
if (require.main === module) {
    const mode = process.argv[2] || 'commit';
    const ciIntegration = new RollbackCIIntegration();
    ciIntegration.runCIValidation(mode);
}

module.exports = RollbackCIIntegration;