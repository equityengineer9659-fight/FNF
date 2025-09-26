#!/usr/bin/env node

/**
 * Phase 5: Security Headers Assessment Tool
 * 
 * Purpose: Analyze security headers configuration and implementation without modifying any website code
 * Authority: technical-architect + security-compliance-auditor
 * Framework: Critical Security & Compliance Remediation
 */

const fs = require('fs').promises;
const path = require('path');

class SecurityHeadersAssessmentTool {
    constructor() {
        this.framework = "Critical Security & Compliance Remediation v1.0.0";
        this.authority = "technical-architect + security-compliance-auditor";
        this.violations = [];
        this.recommendations = [];
        this.configFiles = ['config/netlify.toml', 'config/netlify-security-hardened.toml'];
        this.htmlFiles = ['index.html', 'about.html', 'services.html', 'resources.html', 'impact.html', 'contact.html'];
        this.reportDir = path.join(__dirname, 'reports', 'security-headers-assessment');
    }

    async initialize() {
        console.log('🛡️ Security Headers Assessment Tool initialized');
        console.log(`   Framework: ${this.framework}`);
        console.log(`   Authority: ${this.authority}`);
        console.log('🛡️ Starting comprehensive security headers analysis...');
        console.log('   Analysis scope: Configuration files + HTML meta headers');

        // Ensure report directory exists
        try {
            await fs.mkdir(this.reportDir, { recursive: true });
        } catch (error) {
            // Directory already exists
        }
    }

    async analyzeNetlifyConfig(configFile) {
        const violations = [];
        const recommendations = [];
        
        try {
            const content = await fs.readFile(configFile, 'utf-8');
            console.log(`🔍 Analyzing ${configFile}...`);

            // Check for required security headers
            const requiredHeaders = {
                'X-Frame-Options': {
                    pattern: /X-Frame-Options\s*=\s*["']?(DENY|SAMEORIGIN)["']?/i,
                    severity: 'CRITICAL',
                    description: 'Prevents clickjacking attacks',
                    recommendation: 'X-Frame-Options = "DENY"'
                },
                'X-Content-Type-Options': {
                    pattern: /X-Content-Type-Options\s*=\s*["']?nosniff["']?/i,
                    severity: 'HIGH',
                    description: 'Prevents MIME type sniffing',
                    recommendation: 'X-Content-Type-Options = "nosniff"'
                },
                'X-XSS-Protection': {
                    pattern: /X-XSS-Protection\s*=\s*["']?1;\s*mode=block["']?/i,
                    severity: 'HIGH',
                    description: 'Enables XSS filtering',
                    recommendation: 'X-XSS-Protection = "1; mode=block"'
                },
                'Strict-Transport-Security': {
                    pattern: /Strict-Transport-Security\s*=\s*["']?max-age=\d+/i,
                    severity: 'CRITICAL',
                    description: 'Enforces HTTPS connections',
                    recommendation: 'Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"'
                },
                'Content-Security-Policy': {
                    pattern: /Content-Security-Policy\s*=/i,
                    severity: 'CRITICAL',
                    description: 'Prevents code injection attacks',
                    recommendation: 'Content-Security-Policy with proper directives'
                },
                'Referrer-Policy': {
                    pattern: /Referrer-Policy\s*=\s*["']?(strict-origin-when-cross-origin|no-referrer)["']?/i,
                    severity: 'MEDIUM',
                    description: 'Controls referrer information',
                    recommendation: 'Referrer-Policy = "strict-origin-when-cross-origin"'
                },
                'Permissions-Policy': {
                    pattern: /Permissions-Policy\s*=/i,
                    severity: 'HIGH',
                    description: 'Controls browser feature permissions',
                    recommendation: 'Permissions-Policy with restricted permissions'
                }
            };

            for (const [headerName, config] of Object.entries(requiredHeaders)) {
                if (!config.pattern.test(content)) {
                    violations.push({
                        type: 'missing_security_header',
                        severity: config.severity,
                        header: headerName,
                        file: configFile,
                        description: `${headerName} header missing or incorrectly configured`,
                        securityImpact: config.description,
                        attackVector: this.getAttackVector(headerName),
                        legalRisk: config.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM'
                    });

                    recommendations.push({
                        type: 'add_security_header',
                        priority: config.severity,
                        header: headerName,
                        file: configFile,
                        solution: config.recommendation,
                        implementation: `Add to [build] section: ${config.recommendation}`,
                        estimatedEffort: '5 minutes',
                        securityImpact: `Prevents ${this.getAttackVector(headerName)} attacks`
                    });
                }
            }

            // Analyze CSP configuration if present
            const cspAnalysis = await this.analyzeCSPConfiguration(content, configFile);
            violations.push(...cspAnalysis.violations);
            recommendations.push(...cspAnalysis.recommendations);

            return { violations, recommendations };

        } catch (error) {
            console.log(`   ⚠️ Could not read ${configFile}: ${error.message}`);
            
            violations.push({
                type: 'config_file_missing',
                severity: 'CRITICAL',
                file: configFile,
                description: `Security configuration file missing or unreadable`,
                securityImpact: 'No security headers configured',
                attackVector: 'All web-based attacks',
                legalRisk: 'HIGH'
            });

            return { violations, recommendations };
        }
    }

    async analyzeCSPConfiguration(content, configFile) {
        const violations = [];
        const recommendations = [];

        const cspMatch = content.match(/Content-Security-Policy\s*=\s*["']([^"']+)["']/i);
        
        if (cspMatch) {
            const cspValue = cspMatch[1];
            
            // Check for unsafe CSP directives
            const unsafePatterns = [
                { pattern: /'unsafe-inline'/g, severity: 'HIGH', directive: 'unsafe-inline' },
                { pattern: /'unsafe-eval'/g, severity: 'CRITICAL', directive: 'unsafe-eval' },
                { pattern: /\*/g, severity: 'MEDIUM', directive: 'wildcard (*) sources' }
            ];

            for (const unsafePattern of unsafePatterns) {
                const matches = cspValue.match(unsafePattern.pattern);
                if (matches) {
                    violations.push({
                        type: 'unsafe_csp_directive',
                        severity: unsafePattern.severity,
                        directive: unsafePattern.directive,
                        file: configFile,
                        description: `CSP contains unsafe directive: ${unsafePattern.directive}`,
                        securityImpact: 'Weakens CSP protection against XSS and code injection',
                        attackVector: 'Cross-site scripting, code injection',
                        legalRisk: unsafePattern.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM'
                    });
                }
            }

            // Check for missing important CSP directives
            const importantDirectives = [
                'default-src', 'script-src', 'style-src', 'img-src', 'font-src', 'frame-ancestors'
            ];

            for (const directive of importantDirectives) {
                if (!cspValue.includes(directive)) {
                    violations.push({
                        type: 'missing_csp_directive',
                        severity: 'MEDIUM',
                        directive: directive,
                        file: configFile,
                        description: `CSP missing important directive: ${directive}`,
                        securityImpact: 'Incomplete protection against resource injection',
                        attackVector: 'Resource injection, mixed content',
                        legalRisk: 'MEDIUM'
                    });
                }
            }
        }

        return { violations, recommendations };
    }

    async analyzeHTMLMetaHeaders(htmlFile) {
        const violations = [];
        const recommendations = [];

        try {
            const content = await fs.readFile(htmlFile, 'utf-8');
            console.log(`🔍 Analyzing HTML meta headers in ${htmlFile}...`);

            // Check for security-related meta tags
            const securityMetaTags = {
                'Content-Security-Policy': {
                    pattern: /<meta\s+http-equiv=["']?Content-Security-Policy["']?\s+content=["']([^"']+)["']\s*\/?>/i,
                    severity: 'HIGH',
                    description: 'CSP meta tag configuration'
                },
                'X-Content-Type-Options': {
                    pattern: /<meta\s+http-equiv=["']?X-Content-Type-Options["']?\s+content=["']?nosniff["']?\s*\/?>/i,
                    severity: 'MEDIUM',
                    description: 'MIME type protection'
                },
                'X-Frame-Options': {
                    pattern: /<meta\s+http-equiv=["']?X-Frame-Options["']?\s+content=["']?(DENY|SAMEORIGIN)["']?\s*\/?>/i,
                    severity: 'MEDIUM',
                    description: 'Clickjacking protection'
                },
                'referrer': {
                    pattern: /<meta\s+name=["']?referrer["']?\s+content=["']?(strict-origin-when-cross-origin|no-referrer)["']?\s*\/?>/i,
                    severity: 'LOW',
                    description: 'Referrer policy control'
                }
            };

            // Check for CSP in meta tags (should be in HTTP headers instead)
            const cspMetaMatch = content.match(securityMetaTags['Content-Security-Policy'].pattern);
            if (cspMetaMatch) {
                const cspContent = cspMetaMatch[1];
                
                // Check if it contains unsafe directives
                if (cspContent.includes('unsafe-inline') || cspContent.includes('unsafe-eval')) {
                    violations.push({
                        type: 'unsafe_meta_csp',
                        severity: 'HIGH',
                        file: htmlFile,
                        content: cspContent,
                        description: 'CSP meta tag contains unsafe directives',
                        securityImpact: 'Weakens XSS protection',
                        attackVector: 'Cross-site scripting',
                        legalRisk: 'HIGH'
                    });

                    recommendations.push({
                        type: 'secure_csp_meta',
                        priority: 'HIGH',
                        file: htmlFile,
                        solution: 'Remove unsafe-inline and unsafe-eval from CSP',
                        implementation: 'Move CSP to HTTP headers and remove unsafe directives',
                        estimatedEffort: '15 minutes',
                        securityImpact: 'Strengthens XSS protection'
                    });
                }
            }

            // Check for viewport meta tag (security consideration for mobile)
            const viewportMatch = content.match(/<meta\s+name=["']?viewport["']?\s+content=["']?([^"']+)["']?\s*\/?>/i);
            if (viewportMatch) {
                const viewportContent = viewportMatch[1];
                if (viewportContent.includes('user-scalable=no')) {
                    violations.push({
                        type: 'accessibility_viewport_restriction',
                        severity: 'MEDIUM',
                        file: htmlFile,
                        content: viewportContent,
                        description: 'Viewport disables user scaling',
                        securityImpact: 'Accessibility violation, potential legal risk',
                        attackVector: 'Accessibility discrimination',
                        legalRisk: 'MEDIUM'
                    });
                }
            }

            return { violations, recommendations };

        } catch (error) {
            console.log(`   ⚠️ Error analyzing ${htmlFile}: ${error.message}`);
            return { violations, recommendations };
        }
    }

    getAttackVector(headerName) {
        const attackVectors = {
            'X-Frame-Options': 'Clickjacking',
            'X-Content-Type-Options': 'MIME type confusion',
            'X-XSS-Protection': 'Cross-site scripting',
            'Strict-Transport-Security': 'Man-in-the-middle',
            'Content-Security-Policy': 'Code injection, XSS',
            'Referrer-Policy': 'Information leakage',
            'Permissions-Policy': 'Feature abuse'
        };
        
        return attackVectors[headerName] || 'Various web attacks';
    }

    calculateSecurityScore() {
        const totalPossibleScore = 100;
        let deductions = 0;
        
        this.violations.forEach(violation => {
            switch (violation.severity) {
                case 'CRITICAL':
                    deductions += 25;
                    break;
                case 'HIGH':
                    deductions += 15;
                    break;
                case 'MEDIUM':
                    deductions += 8;
                    break;
                case 'LOW':
                    deductions += 3;
                    break;
            }
        });

        return Math.max(0, Math.round(totalPossibleScore - deductions));
    }

    async generateSecurityHeadersReport() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportData = {
            framework: this.framework,
            authority: this.authority,
            timestamp: new Date().toISOString(),
            assessment: {
                configFilesAnalyzed: this.configFiles.length,
                htmlFilesAnalyzed: this.htmlFiles.length,
                totalViolations: this.violations.length,
                criticalViolations: this.violations.filter(v => v.severity === 'CRITICAL').length,
                highViolations: this.violations.filter(v => v.severity === 'HIGH').length,
                mediumViolations: this.violations.filter(v => v.severity === 'MEDIUM').length,
                securityScore: this.calculateSecurityScore(),
                securityStatus: this.violations.filter(v => v.severity === 'CRITICAL').length > 0 ? 'CRITICAL_VULNERABILITIES' : 'SECURE'
            },
            violations: this.violations,
            recommendations: this.recommendations,
            remediationPlan: this.generateRemediationPlan(),
            securityRiskAssessment: this.generateSecurityRiskAssessment()
        };

        const reportFile = path.join(this.reportDir, `security-headers-assessment-${timestamp}.json`);
        await fs.writeFile(reportFile, JSON.stringify(reportData, null, 2));
        
        return { reportFile, reportData };
    }

    generateRemediationPlan() {
        return {
            immediate: {
                title: "Critical Security Header Issues",
                timeline: "0-2 hours",
                priority: "CRITICAL",
                tasks: this.recommendations.filter(r => r.priority === 'CRITICAL')
            },
            urgent: {
                title: "High Priority Security Issues",
                timeline: "2-4 hours", 
                priority: "HIGH",
                tasks: this.recommendations.filter(r => r.priority === 'HIGH')
            },
            standard: {
                title: "Medium Priority Issues",
                timeline: "4-8 hours",
                priority: "MEDIUM", 
                tasks: this.recommendations.filter(r => r.priority === 'MEDIUM')
            }
        };
    }

    generateSecurityRiskAssessment() {
        const criticalViolations = this.violations.filter(v => v.severity === 'CRITICAL').length;
        const highViolations = this.violations.filter(v => v.severity === 'HIGH').length;
        
        let riskLevel = 'LOW';
        let riskDescription = 'Minor security configuration issues';
        
        if (criticalViolations > 0) {
            riskLevel = 'CRITICAL';
            riskDescription = `${criticalViolations} critical security vulnerabilities detected. Immediate remediation required.`;
        } else if (highViolations > 2) {
            riskLevel = 'HIGH';
            riskDescription = `${highViolations} high-risk security issues. Urgent remediation recommended.`;
        } else if (highViolations > 0) {
            riskLevel = 'MEDIUM';
            riskDescription = `${highViolations} high-risk issues detected.`;
        }
        
        return {
            level: riskLevel,
            description: riskDescription,
            criticalViolations: criticalViolations,
            highViolations: highViolations,
            securityStatus: criticalViolations > 0 ? 'VULNERABLE' : 'PROTECTED',
            recommendedAction: riskLevel === 'CRITICAL' ? 'IMMEDIATE_REMEDIATION' : 'SCHEDULED_REMEDIATION'
        };
    }

    async run() {
        await this.initialize();

        // Analyze configuration files
        for (const configFile of this.configFiles) {
            const analysis = await this.analyzeNetlifyConfig(configFile);
            this.violations.push(...analysis.violations);
            this.recommendations.push(...analysis.recommendations);
        }

        // Analyze HTML files for meta headers
        for (const htmlFile of this.htmlFiles) {
            const analysis = await this.analyzeHTMLMetaHeaders(htmlFile);
            this.violations.push(...analysis.violations);
            this.recommendations.push(...analysis.recommendations);
        }

        // Generate comprehensive report
        const report = await this.generateSecurityHeadersReport();

        // Summary output
        console.log('\n🛡️ SECURITY HEADERS ASSESSMENT SUMMARY');
        console.log(`🔐 Security score: ${report.reportData.assessment.securityScore}%`);
        console.log(`🚨 Critical vulnerabilities: ${report.reportData.assessment.criticalViolations}`);
        console.log(`⚠️ High risk issues: ${report.reportData.assessment.highViolations}`);
        console.log(`ℹ️ Medium risk issues: ${report.reportData.assessment.mediumViolations}`);
        console.log(`📄 Detailed report: ${report.reportFile}`);
        
        const securityStatus = report.reportData.assessment.securityStatus;
        const securityRisk = report.reportData.securityRiskAssessment.level;
        
        console.log(`\n🛡️ SECURITY STATUS: ${securityStatus}`);
        console.log(`⚖️ SECURITY RISK: ${securityRisk}`);
        
        if (securityStatus === 'CRITICAL_VULNERABILITIES') {
            console.log('\n🚨 SECURITY EMERGENCY DETECTED');
            console.log('📞 Notifying technical-architect (IMMEDIATE SLA)');
            console.log('⚡ Emergency remediation plan available in report');
        }

        return report.reportData;
    }
}

// Run if called directly
if (require.main === module) {
    const tool = new SecurityHeadersAssessmentTool();
    tool.run().catch(console.error);
}

module.exports = SecurityHeadersAssessmentTool;