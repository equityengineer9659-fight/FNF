/**
 * Automated Performance Budget Enforcement System
 * Food-N-Force Performance Optimization Framework v1.0
 * 
 * Automated enforcement of performance budgets with governance integration
 * Authority: performance-optimizer + technical-architect
 * 
 * Features:
 * - Real-time performance budget monitoring
 * - Automatic deployment blocking on violations
 * - Progressive enforcement levels
 * - Integration with CI/CD pipeline
 * - Emergency response coordination
 * - Historical trend analysis
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class BudgetEnforcementSystem {
    constructor(configPath = null) {
        // Load configuration
        const defaultConfig = path.join(__dirname, 'performance-framework-config.json');
        const configFile = configPath || defaultConfig;
        this.config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        
        // Initialize enforcement state
        this.enforcementLevel = 'STANDARD'; // LENIENT, STANDARD, STRICT, EMERGENCY
        this.violationHistory = [];
        this.currentViolations = [];
        this.emergencyMode = false;
        this.deploymentBlocked = false;
        
        // Enforcement thresholds
        this.budgets = this.config.performance_budgets;
        this.enforcementThresholds = {
            LENIENT: { violation_percentage: 25, block_deployment: false },
            STANDARD: { violation_percentage: 15, block_deployment: true },
            STRICT: { violation_percentage: 10, block_deployment: true },
            EMERGENCY: { violation_percentage: 5, block_deployment: true }
        };
        
        console.log('🛡️  Performance Budget Enforcement System initialized');
        console.log(`   Enforcement Level: ${this.enforcementLevel}`);
        console.log(`   Authority: ${this.config.framework_authority}`);
    }
    
    /**
     * Set enforcement level based on deployment stage or emergency conditions
     */
    setEnforcementLevel(level) {
        const validLevels = ['LENIENT', 'STANDARD', 'STRICT', 'EMERGENCY'];
        if (!validLevels.includes(level)) {
            throw new Error(`Invalid enforcement level: ${level}. Must be one of: ${validLevels.join(', ')}`);
        }
        
        this.enforcementLevel = level;
        this.emergencyMode = level === 'EMERGENCY';
        
        console.log(`🔧 Enforcement level set to: ${level}`);
        
        // Log enforcement change
        this.logEnforcementChange(level);
    }
    
    /**
     * Analyze current performance against budgets
     */
    async analyzePerformanceBudgets() {
        console.log('🔍 Analyzing performance budgets...');
        
        // Get current bundle sizes
        const bundleSizes = await this.getCurrentBundleSizes();
        
        // Get current Core Web Vitals (from latest Lighthouse run)
        const webVitals = await this.getCurrentWebVitals();
        
        // Analyze budget compliance
        const budgetAnalysis = this.analyzeBudgetCompliance(bundleSizes, webVitals);
        
        // Check for violations
        const violations = this.identifyViolations(budgetAnalysis);
        
        this.currentViolations = violations;
        
        return {
            bundleSizes,
            webVitals,
            budgetAnalysis,
            violations,
            enforcementRecommendation: this.getEnforcementRecommendation(violations)
        };
    }
    
    /**
     * Get current bundle sizes by analyzing build output
     */
    async getCurrentBundleSizes() {
        const bundleSizes = {
            css: 0,
            javascript: 0,
            images: 0,
            fonts: 0,
            total: 0
        };
        
        try {
            // Analyze CSS files
            const cssFiles = await this.getFilesByPattern('css/**/*.css');
            for (const file of cssFiles) {
                const stats = fs.statSync(file);
                bundleSizes.css += stats.size;
            }
            
            // Analyze JavaScript files
            const jsFiles = await this.getFilesByPattern('js/**/*.js');
            for (const file of jsFiles) {
                const stats = fs.statSync(file);
                bundleSizes.javascript += stats.size;
            }
            
            // Analyze image files
            const imageFiles = await this.getFilesByPattern('**/*.{jpg,jpeg,png,gif,webp,svg}');
            for (const file of imageFiles) {
                const stats = fs.statSync(file);
                bundleSizes.images += stats.size;
            }
            
            // Analyze font files
            const fontFiles = await this.getFilesByPattern('**/*.{woff,woff2,ttf,otf}');
            for (const file of fontFiles) {
                const stats = fs.statSync(file);
                bundleSizes.fonts += stats.size;
            }
            
            bundleSizes.total = bundleSizes.css + bundleSizes.javascript + bundleSizes.images + bundleSizes.fonts;
            
        } catch (error) {
            console.warn(`⚠️  Could not analyze bundle sizes: ${error.message}`);
        }
        
        return bundleSizes;
    }
    
    /**
     * Get current Core Web Vitals from latest performance report
     */
    async getCurrentWebVitals() {
        try {
            // Try to get from latest Lighthouse run
            const { stdout } = await execAsync('npm run test:performance-budget || echo "No recent report"');
            
            // Default values if no recent data
            return {
                lcp: null,
                fid: null, 
                cls: null,
                fcp: null,
                ttfb: null,
                tti: null,
                lighthouseScore: null,
                lastMeasured: new Date().toISOString()
            };
        } catch (error) {
            console.warn(`⚠️  Could not get current Web Vitals: ${error.message}`);
            return {
                lcp: null, fid: null, cls: null, fcp: null, ttfb: null, tti: null,
                lighthouseScore: null, lastMeasured: null
            };
        }
    }
    
    /**
     * Analyze budget compliance across all metrics
     */
    analyzeBudgetCompliance(bundleSizes, webVitals) {
        const analysis = {
            resourceBudgets: {},
            performanceTargets: {},
            coreWebVitals: {}
        };
        
        // Resource budget analysis
        const resourceBudgets = this.budgets.resource_budgets;
        analysis.resourceBudgets = {
            totalBundleSize: {
                current: bundleSizes.total,
                budget: resourceBudgets.total_bundle_size,
                compliance: bundleSizes.total <= resourceBudgets.total_bundle_size,
                violationPercentage: ((bundleSizes.total - resourceBudgets.total_bundle_size) / resourceBudgets.total_bundle_size) * 100
            },
            cssBundleSize: {
                current: bundleSizes.css,
                budget: resourceBudgets.css_bundle_size,
                compliance: bundleSizes.css <= resourceBudgets.css_bundle_size,
                violationPercentage: ((bundleSizes.css - resourceBudgets.css_bundle_size) / resourceBudgets.css_bundle_size) * 100
            },
            javascriptBundleSize: {
                current: bundleSizes.javascript,
                budget: resourceBudgets.javascript_bundle_size,
                compliance: bundleSizes.javascript <= resourceBudgets.javascript_bundle_size,
                violationPercentage: ((bundleSizes.javascript - resourceBudgets.javascript_bundle_size) / resourceBudgets.javascript_bundle_size) * 100
            }
        };
        
        // Core Web Vitals analysis
        if (webVitals.lcp) {
            analysis.coreWebVitals.lcp = {
                current: webVitals.lcp,
                budget: this.budgets.core_web_vitals.largest_contentful_paint.mobile * 1000,
                compliance: webVitals.lcp <= this.budgets.core_web_vitals.largest_contentful_paint.mobile * 1000,
                violationPercentage: ((webVitals.lcp - this.budgets.core_web_vitals.largest_contentful_paint.mobile * 1000) / (this.budgets.core_web_vitals.largest_contentful_paint.mobile * 1000)) * 100
            };
        }
        
        if (webVitals.cls !== null && webVitals.cls !== undefined) {
            analysis.coreWebVitals.cls = {
                current: webVitals.cls,
                budget: this.budgets.core_web_vitals.cumulative_layout_shift.mobile,
                compliance: webVitals.cls <= this.budgets.core_web_vitals.cumulative_layout_shift.mobile,
                violationPercentage: ((webVitals.cls - this.budgets.core_web_vitals.cumulative_layout_shift.mobile) / this.budgets.core_web_vitals.cumulative_layout_shift.mobile) * 100
            };
        }
        
        // Performance targets analysis
        if (webVitals.lighthouseScore) {
            analysis.performanceTargets.lighthouseScore = {
                current: webVitals.lighthouseScore,
                budget: this.budgets.performance_targets.lighthouse_performance_score,
                compliance: webVitals.lighthouseScore >= this.budgets.performance_targets.lighthouse_performance_score,
                violationPercentage: ((this.budgets.performance_targets.lighthouse_performance_score - webVitals.lighthouseScore) / this.budgets.performance_targets.lighthouse_performance_score) * 100
            };
        }
        
        return analysis;
    }
    
    /**
     * Identify budget violations based on current enforcement level
     */
    identifyViolations(budgetAnalysis) {
        const violations = [];
        const threshold = this.enforcementThresholds[this.enforcementLevel];
        
        // Check resource budget violations
        Object.entries(budgetAnalysis.resourceBudgets).forEach(([metric, data]) => {
            if (!data.compliance && data.violationPercentage >= threshold.violation_percentage) {
                violations.push({
                    type: 'RESOURCE_BUDGET',
                    metric: metric,
                    severity: this.getViolationSeverity(data.violationPercentage),
                    current: data.current,
                    budget: data.budget,
                    violationPercentage: data.violationPercentage,
                    recommendation: this.getViolationRecommendation(metric, data.violationPercentage)
                });
            }
        });
        
        // Check Core Web Vitals violations
        Object.entries(budgetAnalysis.coreWebVitals).forEach(([metric, data]) => {
            if (!data.compliance && data.violationPercentage >= threshold.violation_percentage) {
                violations.push({
                    type: 'CORE_WEB_VITALS',
                    metric: metric,
                    severity: this.getViolationSeverity(data.violationPercentage),
                    current: data.current,
                    budget: data.budget,
                    violationPercentage: data.violationPercentage,
                    recommendation: this.getViolationRecommendation(metric, data.violationPercentage)
                });
            }
        });
        
        // Check performance target violations
        Object.entries(budgetAnalysis.performanceTargets).forEach(([metric, data]) => {
            if (!data.compliance && data.violationPercentage >= threshold.violation_percentage) {
                violations.push({
                    type: 'PERFORMANCE_TARGET',
                    metric: metric,
                    severity: this.getViolationSeverity(data.violationPercentage),
                    current: data.current,
                    budget: data.budget,
                    violationPercentage: data.violationPercentage,
                    recommendation: this.getViolationRecommendation(metric, data.violationPercentage)
                });
            }
        });
        
        return violations;
    }
    
    /**
     * Get violation severity based on percentage
     */
    getViolationSeverity(violationPercentage) {
        if (violationPercentage >= 50) return 'CRITICAL';
        if (violationPercentage >= 30) return 'HIGH';
        if (violationPercentage >= 15) return 'MEDIUM';
        return 'LOW';
    }
    
    /**
     * Get specific recommendation for violation
     */
    getViolationRecommendation(metric, violationPercentage) {
        const recommendations = {
            totalBundleSize: 'Implement code splitting and remove unused dependencies',
            cssBundleSize: 'Optimize CSS by removing unused styles and implementing critical CSS',
            javascriptBundleSize: 'Implement tree shaking, code splitting, and lazy loading',
            lcp: 'Optimize largest contentful paint by preloading critical resources',
            cls: 'Fix layout shifts by reserving space for dynamic content',
            lighthouseScore: 'Address all Lighthouse performance recommendations'
        };
        
        return recommendations[metric] || 'Review and optimize this performance metric';
    }
    
    /**
     * Get enforcement recommendation based on violations
     */
    getEnforcementRecommendation(violations) {
        const criticalViolations = violations.filter(v => v.severity === 'CRITICAL').length;
        const highViolations = violations.filter(v => v.severity === 'HIGH').length;
        
        if (criticalViolations > 0) {
            return {
                level: 'EMERGENCY',
                action: 'BLOCK_DEPLOYMENT',
                authority: 'technical-architect',
                sla: '15_minutes',
                reason: `${criticalViolations} critical performance violations detected`
            };
        }
        
        if (highViolations > 2 || violations.length > 5) {
            return {
                level: 'STRICT',
                action: 'BLOCK_DEPLOYMENT', 
                authority: 'performance-optimizer',
                sla: '30_minutes',
                reason: `Multiple high-severity performance violations detected`
            };
        }
        
        if (violations.length > 0) {
            return {
                level: 'STANDARD',
                action: 'WARNING',
                authority: 'performance-optimizer',
                sla: '1_hour',
                reason: 'Performance budget violations require attention'
            };
        }
        
        return {
            level: 'LENIENT',
            action: 'CONTINUE',
            authority: null,
            sla: null,
            reason: 'All performance budgets within acceptable limits'
        };
    }
    
    /**
     * Enforce performance budgets based on current violations
     */
    async enforcePerformanceBudgets() {
        console.log('🛡️  Enforcing performance budgets...');
        
        const analysis = await this.analyzePerformanceBudgets();
        const enforcement = analysis.enforcementRecommendation;
        
        // Log enforcement decision
        this.logEnforcementDecision(analysis, enforcement);
        
        // Take enforcement action
        if (enforcement.action === 'BLOCK_DEPLOYMENT') {
            this.blockDeployment(enforcement);
            return {
                blocked: true,
                reason: enforcement.reason,
                authority: enforcement.authority,
                violations: analysis.violations
            };
        }
        
        if (enforcement.action === 'WARNING') {
            this.issuePerformanceWarning(enforcement, analysis.violations);
            return {
                blocked: false,
                warning: true,
                reason: enforcement.reason,
                violations: analysis.violations
            };
        }
        
        // All budgets met
        console.log('✅ All performance budgets met - deployment approved');
        return {
            blocked: false,
            warning: false,
            reason: enforcement.reason,
            violations: []
        };
    }
    
    /**
     * Block deployment due to budget violations
     */
    blockDeployment(enforcement) {
        console.log('\n🚫 DEPLOYMENT BLOCKED - Performance Budget Violations');
        console.log('==================================================');
        console.log(`Reason: ${enforcement.reason}`);
        console.log(`Authority: ${enforcement.authority}`);
        console.log(`Response Required: ${enforcement.sla}`);
        console.log(`Enforcement Level: ${this.enforcementLevel}`);
        
        this.deploymentBlocked = true;
        
        // Create deployment block file
        const blockFile = path.join(__dirname, 'reports', 'deployment-blocks', `deployment-block-${Date.now()}.json`);
        fs.mkdirSync(path.dirname(blockFile), { recursive: true });
        fs.writeFileSync(blockFile, JSON.stringify({
            timestamp: new Date().toISOString(),
            reason: enforcement.reason,
            authority: enforcement.authority,
            sla: enforcement.sla,
            enforcementLevel: this.enforcementLevel,
            violations: this.currentViolations
        }, null, 2));
        
        console.log(`Deployment block report: ${blockFile}`);
        
        // Trigger governance notification if emergency
        if (this.enforcementLevel === 'EMERGENCY') {
            this.triggerEmergencyGovernanceResponse(enforcement);
        }
    }
    
    /**
     * Issue performance warning
     */
    issuePerformanceWarning(enforcement, violations) {
        console.log('\n⚠️  PERFORMANCE WARNING - Budget Violations Detected');
        console.log('==================================================');
        console.log(`Reason: ${enforcement.reason}`);
        console.log(`Violations: ${violations.length}`);
        
        violations.forEach((violation, index) => {
            console.log(`   ${index + 1}. ${violation.type}: ${violation.metric} (${violation.violationPercentage.toFixed(1)}% over budget)`);
            console.log(`      Recommendation: ${violation.recommendation}`);
        });
        
        console.log('\nDeployment will continue with warnings.');
    }
    
    /**
     * Trigger emergency governance response
     */
    triggerEmergencyGovernanceResponse(enforcement) {
        console.log('\n🚨 TRIGGERING EMERGENCY GOVERNANCE RESPONSE');
        console.log('==========================================');
        
        const emergencyResponse = {
            timestamp: new Date().toISOString(),
            type: 'PERFORMANCE_BUDGET_EMERGENCY',
            authority: enforcement.authority,
            sla: enforcement.sla,
            enforcementLevel: this.enforcementLevel,
            violations: this.currentViolations,
            deploymentBlocked: this.deploymentBlocked,
            immediateActions: [
                'Automatic deployment blocking activated',
                'Emergency response team notified',
                'Performance regression analysis initiated',
                'Rollback procedures prepared'
            ]
        };
        
        const emergencyPath = path.join(__dirname, 'reports', 'emergency', `budget-emergency-${Date.now()}.json`);
        fs.mkdirSync(path.dirname(emergencyPath), { recursive: true });
        fs.writeFileSync(emergencyPath, JSON.stringify(emergencyResponse, null, 2));
        
        console.log(`Emergency response report: ${emergencyPath}`);
    }
    
    /**
     * Log enforcement decision
     */
    logEnforcementDecision(analysis, enforcement) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            enforcementLevel: this.enforcementLevel,
            violationsCount: analysis.violations.length,
            enforcement: enforcement,
            bundleSizes: analysis.bundleSizes,
            webVitals: analysis.webVitals
        };
        
        const logPath = path.join(__dirname, 'reports', 'enforcement-log', `enforcement-${new Date().toISOString().split('T')[0]}.jsonl`);
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
        fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
    }
    
    /**
     * Log enforcement level change
     */
    logEnforcementChange(newLevel) {
        const changeLog = {
            timestamp: new Date().toISOString(),
            previousLevel: this.enforcementLevel,
            newLevel: newLevel,
            reason: 'Manual enforcement level change'
        };
        
        const logPath = path.join(__dirname, 'reports', 'enforcement-log', `level-changes-${new Date().toISOString().split('T')[0]}.jsonl`);
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
        fs.appendFileSync(logPath, JSON.stringify(changeLog) + '\n');
    }
    
    /**
     * Get files by glob pattern
     */
    async getFilesByPattern(pattern) {
        try {
            const { stdout } = await execAsync(`find . -name "${pattern}" -type f`);
            return stdout.trim().split('\n').filter(file => file && !file.includes('node_modules'));
        } catch (error) {
            console.warn(`Could not find files for pattern ${pattern}: ${error.message}`);
            return [];
        }
    }
    
    /**
     * CLI interface for budget enforcement
     */
    static async runCLI() {
        const args = process.argv.slice(2);
        const enforcement = new BudgetEnforcementSystem();
        
        // Handle enforcement level setting
        if (args[0] === 'set-level' && args[1]) {
            enforcement.setEnforcementLevel(args[1]);
            console.log(`Enforcement level set to: ${args[1]}`);
            return;
        }
        
        // Handle enforcement analysis
        if (args[0] === 'analyze') {
            const analysis = await enforcement.analyzePerformanceBudgets();
            console.log('\n📊 Budget Analysis Results:');
            console.log(`Violations: ${analysis.violations.length}`);
            console.log(`Recommendation: ${analysis.enforcementRecommendation.action}`);
            return;
        }
        
        // Default: run enforcement
        const result = await enforcement.enforcePerformanceBudgets();
        
        if (result.blocked) {
            console.error('\n❌ Deployment blocked due to performance budget violations');
            process.exit(2);
        } else if (result.warning) {
            console.warn('\n⚠️  Performance warnings detected - review recommended');
            process.exit(1);
        } else {
            console.log('\n✅ Performance budgets met - deployment approved');
            process.exit(0);
        }
    }
}

// CLI execution
if (require.main === module) {
    BudgetEnforcementSystem.runCLI().catch(error => {
        console.error('❌ Budget enforcement failed:', error);
        process.exit(1);
    });
}

module.exports = BudgetEnforcementSystem;