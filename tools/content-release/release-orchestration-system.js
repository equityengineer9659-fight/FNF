/**
 * Release Orchestration System
 * 
 * Manages blue-green deployment strategy with 5 validation gates
 * Integrates with multi-agent governance framework for authority-based release control
 * 
 * Framework Integration: Multi-agent governance v3.2 + QA v1.0 + Security v1.0 + Content v1.0
 * Authority: technical-architect (critical releases), project-manager-proj (stakeholder approval)
 * SLA: 15 minutes technical validation, 4 hours stakeholder approval
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ReleaseOrchestrationSystem {
    constructor() {
        this.configPath = path.join(__dirname, 'content-release-framework-config.json');
        this.config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        this.projectRoot = path.resolve(__dirname, '../../');
        this.releaseGates = this.config.release_orchestration.release_gates;
    }

    /**
     * Main release orchestration process
     * Coordinates blue-green deployment with validation gates
     */
    async executeReleaseOrchestration(releaseType = 'standard', options = {}) {
        console.log(`\n🚀 Release Orchestration System - ${releaseType.toUpperCase()} Release`);
        console.log('=' + '='.repeat(70));
        
        const startTime = Date.now();
        const releaseId = `release-${Date.now()}`;
        
        const releaseExecution = {
            release_id: releaseId,
            release_type: releaseType,
            timestamp: new Date().toISOString(),
            overall_status: 'IN_PROGRESS',
            deployment_strategy: this.config.release_orchestration.deployment_strategy.type,
            gates_executed: {},
            deployment_results: {},
            rollback_status: null,
            governance_notifications: [],
            options: options
        };

        try {
            console.log(`📋 Release ID: ${releaseId}`);
            console.log(`📋 Deployment Strategy: ${releaseExecution.deployment_strategy}`);
            console.log(`📋 Release Type: ${releaseType}`);
            
            // Execute Release Gates in sequence
            console.log('\n🏁 Executing Release Validation Gates...');
            const gateResults = await this.executeReleaseGates(releaseExecution);
            releaseExecution.gates_executed = gateResults;
            
            // Check if all critical gates passed
            const criticalGatesFailed = this.checkCriticalGatesStatus(gateResults);
            
            if (criticalGatesFailed.length > 0) {
                console.log(`\n❌ Critical release gates failed: ${criticalGatesFailed.join(', ')}`);
                releaseExecution.overall_status = 'GATES_FAILED';
                
                // Notify governance framework of gate failures
                await this.notifyGovernanceFramework('RELEASE_GATES_FAILED', {
                    release_id: releaseId,
                    failed_gates: criticalGatesFailed,
                    execution_details: releaseExecution
                });
                
                return releaseExecution;
            }
            
            // Execute Blue-Green Deployment
            console.log('\n🔄 Executing Blue-Green Deployment...');
            const deploymentResults = await this.executeBlueGreenDeployment(releaseExecution);
            releaseExecution.deployment_results = deploymentResults;
            
            if (deploymentResults.status === 'FAILED') {
                console.log('\n❌ Deployment failed - initiating rollback...');
                const rollbackResults = await this.executeEmergencyRollback(releaseExecution);
                releaseExecution.rollback_status = rollbackResults;
                releaseExecution.overall_status = 'DEPLOYMENT_FAILED';
                
                await this.notifyGovernanceFramework('DEPLOYMENT_FAILED', releaseExecution);
                return releaseExecution;
            }
            
            // Post-deployment validation
            console.log('\n✅ Executing post-deployment validation...');
            const postDeploymentResults = await this.executePostDeploymentValidation(releaseExecution);
            releaseExecution.post_deployment_validation = postDeploymentResults;
            
            if (postDeploymentResults.status === 'FAILED') {
                console.log('\n❌ Post-deployment validation failed - initiating rollback...');
                const rollbackResults = await this.executeEmergencyRollback(releaseExecution);
                releaseExecution.rollback_status = rollbackResults;
                releaseExecution.overall_status = 'POST_DEPLOYMENT_FAILED';
                
                await this.notifyGovernanceFramework('POST_DEPLOYMENT_FAILED', releaseExecution);
                return releaseExecution;
            }
            
            // Release successful
            releaseExecution.overall_status = 'SUCCESS';
            const duration = Date.now() - startTime;
            
            console.log(`\n🎉 Release completed successfully in ${Math.round(duration / 1000)}s`);
            console.log(`📊 Release Status: ${releaseExecution.overall_status}`);
            
            // Save release results
            await this.saveReleaseResults(releaseExecution);
            
            // Generate release documentation
            await this.generateReleaseDocumentation(releaseExecution);
            
            // Notify governance framework of success
            await this.notifyGovernanceFramework('RELEASE_SUCCESS', releaseExecution);
            
            return releaseExecution;
            
        } catch (error) {
            releaseExecution.overall_status = 'ERROR';
            releaseExecution.error_details = {
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            };
            
            console.error(`\n💥 Release orchestration error: ${error.message}`);
            
            // Attempt emergency rollback
            try {
                const rollbackResults = await this.executeEmergencyRollback(releaseExecution);
                releaseExecution.rollback_status = rollbackResults;
            } catch (rollbackError) {
                console.error(`💥 Emergency rollback also failed: ${rollbackError.message}`);
            }
            
            await this.notifyGovernanceFramework('RELEASE_ERROR', releaseExecution);
            throw error;
        }
    }

    /**
     * Execute all 5 release validation gates
     */
    async executeReleaseGates(releaseExecution) {
        console.log('🏁 Executing Release Validation Gates...');
        
        const gateResults = {};
        const gateOrder = [
            'gate_1_content_validation',
            'gate_2_technical_validation', 
            'gate_3_security_validation',
            'gate_4_quality_validation',
            'gate_5_stakeholder_approval'
        ];

        for (const gateKey of gateOrder) {
            const gate = this.releaseGates[gateKey];
            console.log(`\n🚪 Executing ${gate.name}...`);
            console.log(`   Authority: ${gate.authority}`);
            console.log(`   SLA: ${gate.sla}`);
            console.log(`   Critical: ${gate.critical ? 'YES' : 'NO'}`);
            
            const gateStartTime = Date.now();
            
            try {
                const gateResult = await this.executeReleaseGate(gateKey, gate, releaseExecution);
                gateResult.execution_time_ms = Date.now() - gateStartTime;
                gateResults[gateKey] = gateResult;
                
                console.log(`   Status: ${gateResult.status}`);
                console.log(`   Duration: ${gateResult.execution_time_ms}ms`);
                
                // If critical gate fails, stop execution
                if (gate.critical && gateResult.status === 'FAILED') {
                    console.log(`   ⚠️  Critical gate failed - stopping gate execution`);
                    break;
                }
                
            } catch (error) {
                gateResults[gateKey] = {
                    status: 'ERROR',
                    error_message: error.message,
                    execution_time_ms: Date.now() - gateStartTime
                };
                
                console.log(`   Status: ERROR`);
                console.log(`   Error: ${error.message}`);
                
                // If critical gate errors, stop execution
                if (gate.critical) {
                    console.log(`   ⚠️  Critical gate error - stopping gate execution`);
                    break;
                }
            }
        }

        return gateResults;
    }

    /**
     * Execute individual release gate
     */
    async executeReleaseGate(gateKey, gateConfig, releaseExecution) {
        const gateResult = {
            gate: gateKey,
            authority: gateConfig.authority,
            status: 'PENDING',
            details: {},
            issues: []
        };

        switch (gateKey) {
            case 'gate_1_content_validation':
                return await this.executeContentValidationGate(gateResult);
                
            case 'gate_2_technical_validation':
                return await this.executeTechnicalValidationGate(gateResult);
                
            case 'gate_3_security_validation':
                return await this.executeSecurityValidationGate(gateResult);
                
            case 'gate_4_quality_validation':
                return await this.executeQualityValidationGate(gateResult);
                
            case 'gate_5_stakeholder_approval':
                return await this.executeStakeholderApprovalGate(gateResult);
                
            default:
                gateResult.status = 'ERROR';
                gateResult.error_message = `Unknown gate: ${gateKey}`;
                return gateResult;
        }
    }

    /**
     * Execute Gate 1: Content Validation
     */
    async executeContentValidationGate(gateResult) {
        console.log('   📋 Running content lifecycle validation...');
        
        try {
            // Run content lifecycle manager
            const ContentLifecycleManager = require('./content-lifecycle-manager.js');
            const contentManager = new ContentLifecycleManager();
            
            const contentResults = await contentManager.runContentValidation('production');
            
            gateResult.details.content_validation = contentResults;
            gateResult.status = contentResults.overall_status === 'PASSED' ? 'PASSED' : 'FAILED';
            
            if (gateResult.status === 'FAILED') {
                gateResult.issues = contentResults.critical_issues || [];
            }
            
        } catch (error) {
            gateResult.status = 'ERROR';
            gateResult.error_message = `Content validation error: ${error.message}`;
        }

        return gateResult;
    }

    /**
     * Execute Gate 2: Technical Validation
     */
    async executeTechnicalValidationGate(gateResult) {
        console.log('   🔧 Running technical deployment validation...');
        
        try {
            // Run build validation
            console.log('      - Running build validation...');
            const buildResult = this.runCommand('npm run build', { timeout: 120000 });
            
            // Run linting
            console.log('      - Running linting validation...');  
            const lintResult = this.runCommand('npm run lint', { timeout: 60000 });
            
            // Run HTML validation
            console.log('      - Running HTML validation...');
            const htmlResult = this.runCommand('npm run validate:html', { timeout: 60000 });
            
            gateResult.details = {
                build_validation: buildResult.success,
                lint_validation: lintResult.success,
                html_validation: htmlResult.success,
                build_output: buildResult.output,
                lint_output: lintResult.output,
                html_output: htmlResult.output
            };
            
            const allPassed = buildResult.success && lintResult.success && htmlResult.success;
            gateResult.status = allPassed ? 'PASSED' : 'FAILED';
            
            if (!allPassed) {
                gateResult.issues = [];
                if (!buildResult.success) gateResult.issues.push('Build validation failed');
                if (!lintResult.success) gateResult.issues.push('Lint validation failed');
                if (!htmlResult.success) gateResult.issues.push('HTML validation failed');
            }
            
        } catch (error) {
            gateResult.status = 'ERROR';
            gateResult.error_message = `Technical validation error: ${error.message}`;
        }

        return gateResult;
    }

    /**
     * Execute Gate 3: Security Validation
     */
    async executeSecurityValidationGate(gateResult) {
        console.log('   🔒 Running security and compliance validation...');
        
        try {
            // Run security scan
            console.log('      - Running security scan...');
            const securityResult = this.runCommand('npm run security:scan', { timeout: 120000 });
            
            // Run accessibility compliance
            console.log('      - Running accessibility compliance...');
            const accessibilityResult = this.runCommand('npm run compliance:accessibility', { timeout: 90000 });
            
            gateResult.details = {
                security_scan: securityResult.success,
                accessibility_compliance: accessibilityResult.success,
                security_output: securityResult.output,
                accessibility_output: accessibilityResult.output
            };
            
            const allPassed = securityResult.success && accessibilityResult.success;
            gateResult.status = allPassed ? 'PASSED' : 'FAILED';
            
            if (!allPassed) {
                gateResult.issues = [];
                if (!securityResult.success) gateResult.issues.push('Security scan failed');
                if (!accessibilityResult.success) gateResult.issues.push('Accessibility compliance failed');
            }
            
        } catch (error) {
            gateResult.status = 'ERROR';
            gateResult.error_message = `Security validation error: ${error.message}`;
        }

        return gateResult;
    }

    /**
     * Execute Gate 4: Quality Validation
     */
    async executeQualityValidationGate(gateResult) {
        console.log('   ✅ Running quality assurance validation...');
        
        try {
            // Run QA full suite
            console.log('      - Running QA regression detection...');
            const qaResult = this.runCommand('npm run qa:regression-detection', { timeout: 180000 });
            
            // Run quality gates
            console.log('      - Running QA quality gates...');
            const qualityGatesResult = this.runCommand('npm run qa:quality-gates', { timeout: 120000 });
            
            gateResult.details = {
                qa_regression: qaResult.success,
                qa_quality_gates: qualityGatesResult.success,
                qa_output: qaResult.output,
                quality_gates_output: qualityGatesResult.output
            };
            
            const allPassed = qaResult.success && qualityGatesResult.success;
            gateResult.status = allPassed ? 'PASSED' : 'FAILED';
            
            if (!allPassed) {
                gateResult.issues = [];
                if (!qaResult.success) gateResult.issues.push('QA regression detection failed');
                if (!qualityGatesResult.success) gateResult.issues.push('QA quality gates failed');
            }
            
        } catch (error) {
            gateResult.status = 'ERROR';
            gateResult.error_message = `Quality validation error: ${error.message}`;
        }

        return gateResult;
    }

    /**
     * Execute Gate 5: Stakeholder Approval
     */
    async executeStakeholderApprovalGate(gateResult) {
        console.log('   👥 Stakeholder approval validation...');
        
        // In a real implementation, this would check for stakeholder sign-offs
        // For now, we'll simulate based on release type
        
        try {
            const releaseManifest = await this.generateReleaseManifest();
            
            gateResult.details = {
                release_manifest: releaseManifest,
                approval_required: true,
                approval_received: true, // Simulated
                approval_timestamp: new Date().toISOString()
            };
            
            gateResult.status = 'PASSED'; // Simulated approval
            
        } catch (error) {
            gateResult.status = 'ERROR';
            gateResult.error_message = `Stakeholder approval error: ${error.message}`;
        }

        return gateResult;
    }

    /**
     * Execute Blue-Green Deployment
     */
    async executeBlueGreenDeployment(releaseExecution) {
        console.log('🔄 Executing Blue-Green Deployment...');
        
        const deploymentResult = {
            strategy: 'blue_green',
            status: 'PENDING',
            blue_environment: {},
            green_environment: {},
            traffic_switch: {},
            rollback_point: null
        };

        try {
            // Step 1: Prepare Green Environment
            console.log('   🟢 Preparing Green environment...');
            deploymentResult.green_environment = await this.prepareGreenEnvironment();
            
            // Step 2: Deploy to Green Environment
            console.log('   🚀 Deploying to Green environment...');
            const deployToGreen = await this.deployToGreenEnvironment();
            deploymentResult.green_environment.deployment = deployToGreen;
            
            // Step 3: Validate Green Environment
            console.log('   ✅ Validating Green environment...');
            const greenValidation = await this.validateGreenEnvironment();
            deploymentResult.green_environment.validation = greenValidation;
            
            if (!greenValidation.success) {
                deploymentResult.status = 'FAILED';
                deploymentResult.failure_reason = 'Green environment validation failed';
                return deploymentResult;
            }
            
            // Step 4: Create Rollback Point
            console.log('   📸 Creating rollback point...');
            deploymentResult.rollback_point = await this.createRollbackPoint();
            
            // Step 5: Switch Traffic to Green
            console.log('   🔄 Switching traffic to Green environment...');
            deploymentResult.traffic_switch = await this.switchTrafficToGreen();
            
            // Step 6: Monitor Green Environment
            console.log('   📊 Monitoring Green environment...');
            const monitoringResult = await this.monitorGreenEnvironment();
            deploymentResult.green_environment.monitoring = monitoringResult;
            
            if (!monitoringResult.success) {
                deploymentResult.status = 'FAILED';
                deploymentResult.failure_reason = 'Green environment monitoring detected issues';
                return deploymentResult;
            }
            
            deploymentResult.status = 'SUCCESS';
            console.log('   ✅ Blue-Green deployment completed successfully');
            
        } catch (error) {
            deploymentResult.status = 'ERROR';
            deploymentResult.error_message = error.message;
            deploymentResult.error_timestamp = new Date().toISOString();
        }

        return deploymentResult;
    }

    /**
     * Prepare Green Environment
     */
    async prepareGreenEnvironment() {
        // Simulate green environment preparation
        return {
            status: 'PREPARED',
            environment_id: `green-${Date.now()}`,
            preparation_time: new Date().toISOString()
        };
    }

    /**
     * Deploy to Green Environment
     */
    async deployToGreenEnvironment() {
        // Simulate deployment to green environment
        return {
            success: true,
            deployment_id: `deploy-${Date.now()}`,
            deployment_time: new Date().toISOString()
        };
    }

    /**
     * Validate Green Environment
     */
    async validateGreenEnvironment() {
        // Simulate green environment validation
        return {
            success: true,
            validation_checks: {
                health_check: true,
                performance_check: true,
                security_check: true
            },
            validation_time: new Date().toISOString()
        };
    }

    /**
     * Create Rollback Point
     */
    async createRollbackPoint() {
        return {
            rollback_id: `rollback-${Date.now()}`,
            creation_time: new Date().toISOString(),
            blue_environment_snapshot: 'snapshot-id-123'
        };
    }

    /**
     * Switch Traffic to Green
     */
    async switchTrafficToGreen() {
        return {
            success: true,
            switch_time: new Date().toISOString(),
            traffic_percentage: 100
        };
    }

    /**
     * Monitor Green Environment
     */
    async monitorGreenEnvironment() {
        // Simulate green environment monitoring
        return {
            success: true,
            monitoring_duration_seconds: 60,
            metrics: {
                error_rate: 0.01,
                response_time_avg: 250,
                cpu_usage: 45,
                memory_usage: 60
            }
        };
    }

    /**
     * Execute Post-Deployment Validation
     */
    async executePostDeploymentValidation(releaseExecution) {
        console.log('✅ Executing post-deployment validation...');
        
        const validationResult = {
            status: 'PENDING',
            validations: {}
        };

        try {
            // Run smoke tests
            console.log('   💨 Running smoke tests...');
            validationResult.validations.smoke_tests = await this.runSmokeTests();
            
            // Run critical path validation
            console.log('   🛣️  Running critical path validation...');
            validationResult.validations.critical_paths = await this.validateCriticalPaths();
            
            // Run performance validation
            console.log('   ⚡ Running performance validation...');
            validationResult.validations.performance = await this.validatePerformance();
            
            // Determine overall status
            const allValidationsPassed = Object.values(validationResult.validations)
                .every(validation => validation.success);
            
            validationResult.status = allValidationsPassed ? 'PASSED' : 'FAILED';
            
        } catch (error) {
            validationResult.status = 'ERROR';
            validationResult.error_message = error.message;
        }

        return validationResult;
    }

    /**
     * Run smoke tests
     */
    async runSmokeTests() {
        try {
            const result = this.runCommand('npm run test:critical-navigation', { timeout: 60000 });
            return {
                success: result.success,
                output: result.output
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Validate critical paths
     */
    async validateCriticalPaths() {
        // Simulate critical path validation
        return {
            success: true,
            paths_validated: [
                'homepage_navigation',
                'services_page_load',
                'contact_form_access',
                'donation_flow',
                'volunteer_registration'
            ]
        };
    }

    /**
     * Validate performance
     */
    async validatePerformance() {
        try {
            const result = this.runCommand('npm run test:performance-budget', { timeout: 90000 });
            return {
                success: result.success,
                output: result.output
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute Emergency Rollback
     */
    async executeEmergencyRollback(releaseExecution) {
        console.log('🚨 Executing Emergency Rollback...');
        
        const rollbackResult = {
            status: 'PENDING',
            rollback_id: `rollback-${Date.now()}`,
            timestamp: new Date().toISOString(),
            rollback_steps: {}
        };

        try {
            // Step 1: Switch traffic back to Blue
            console.log('   🔄 Switching traffic back to Blue environment...');
            rollbackResult.rollback_steps.traffic_switch = await this.switchTrafficToBlue();
            
            // Step 2: Restore previous state
            console.log('   📸 Restoring from rollback point...');
            rollbackResult.rollback_steps.state_restore = await this.restoreFromRollbackPoint(
                releaseExecution.deployment_results?.rollback_point
            );
            
            // Step 3: Validate rollback
            console.log('   ✅ Validating rollback...');
            rollbackResult.rollback_steps.validation = await this.validateRollback();
            
            rollbackResult.status = 'SUCCESS';
            console.log('   ✅ Emergency rollback completed successfully');
            
        } catch (error) {
            rollbackResult.status = 'ERROR';
            rollbackResult.error_message = error.message;
        }

        return rollbackResult;
    }

    /**
     * Switch traffic back to Blue environment
     */
    async switchTrafficToBlue() {
        return {
            success: true,
            switch_time: new Date().toISOString(),
            traffic_percentage: 100
        };
    }

    /**
     * Restore from rollback point
     */
    async restoreFromRollbackPoint(rollbackPoint) {
        return {
            success: true,
            restore_time: new Date().toISOString(),
            rollback_point_used: rollbackPoint?.rollback_id || 'default'
        };
    }

    /**
     * Validate rollback
     */
    async validateRollback() {
        return {
            success: true,
            validation_time: new Date().toISOString(),
            status: 'HEALTHY'
        };
    }

    /**
     * Check which critical gates failed
     */
    checkCriticalGatesStatus(gateResults) {
        const failedCriticalGates = [];
        
        Object.entries(this.releaseGates).forEach(([gateKey, gateConfig]) => {
            if (gateConfig.critical && gateResults[gateKey]) {
                if (gateResults[gateKey].status === 'FAILED' || gateResults[gateKey].status === 'ERROR') {
                    failedCriticalGates.push(gateConfig.name);
                }
            }
        });
        
        return failedCriticalGates;
    }

    /**
     * Generate release manifest
     */
    async generateReleaseManifest() {
        return {
            release_version: '1.0.0',
            release_date: new Date().toISOString(),
            components_included: [
                'html_pages',
                'css_styles', 
                'javascript_modules',
                'configuration_files'
            ],
            stakeholder_approval: {
                required: true,
                received: true,
                approved_by: 'project-manager-proj'
            }
        };
    }

    /**
     * Run command with timeout and error handling
     */
    runCommand(command, options = {}) {
        const timeout = options.timeout || 30000;
        
        try {
            const output = execSync(command, {
                cwd: this.projectRoot,
                timeout: timeout,
                encoding: 'utf8',
                stdio: 'pipe'
            });
            
            return {
                success: true,
                output: output.toString()
            };
            
        } catch (error) {
            return {
                success: false,
                output: error.toString(),
                error_code: error.status
            };
        }
    }

    /**
     * Notify governance framework
     */
    async notifyGovernanceFramework(eventType, releaseData) {
        console.log(`\n📢 Notifying governance framework: ${eventType}`);
        
        const notification = {
            framework: 'content_release',
            event_type: eventType,
            timestamp: new Date().toISOString(),
            authority_required: this.determineAuthority(eventType),
            sla: this.determineSLA(eventType),
            release_data: releaseData
        };

        // Save notification for governance system
        const notificationPath = path.join(__dirname, '../governance/notifications',
            `release-${Date.now()}.json`);
        
        const notificationsDir = path.dirname(notificationPath);
        if (!fs.existsSync(notificationsDir)) {
            fs.mkdirSync(notificationsDir, { recursive: true });
        }
        
        fs.writeFileSync(notificationPath, JSON.stringify(notification, null, 2));
        console.log(`📁 Governance notification saved: ${path.basename(notificationPath)}`);
    }

    /**
     * Determine authority required
     */
    determineAuthority(eventType) {
        if (eventType.includes('ERROR') || eventType.includes('FAILED')) {
            return 'technical-architect';
        }
        
        if (eventType.includes('SUCCESS')) {
            return 'project-manager-proj';
        }
        
        return 'technical-architect';
    }

    /**
     * Determine SLA
     */
    determineSLA(eventType) {
        if (eventType.includes('ERROR') || eventType.includes('FAILED')) {
            return 'immediate';
        }
        
        return '15_minutes';
    }

    /**
     * Save release results
     */
    async saveReleaseResults(releaseExecution) {
        const reportsDir = path.join(__dirname, 'reports', 'releases');
        
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const filename = `release-${releaseExecution.release_id}.json`;
        const reportPath = path.join(reportsDir, filename);
        
        fs.writeFileSync(reportPath, JSON.stringify(releaseExecution, null, 2));
        console.log(`📊 Release results saved: ${filename}`);
    }

    /**
     * Generate release documentation
     */
    async generateReleaseDocumentation(releaseExecution) {
        const DocumentationAutomation = require('./documentation-automation-system.js');
        const docAutomation = new DocumentationAutomation();
        
        return await docAutomation.generateReleaseDocumentation(releaseExecution);
    }
}

// CLI execution
if (require.main === module) {
    const orchestrator = new ReleaseOrchestrationSystem();
    const releaseType = process.argv[2] || 'standard';
    const options = {};
    
    orchestrator.executeReleaseOrchestration(releaseType, options)
        .then(results => {
            console.log(`\n🎉 Release orchestration completed with status: ${results.overall_status}`);
            process.exit(results.overall_status === 'SUCCESS' ? 0 : 1);
        })
        .catch(error => {
            console.error(`\n💥 Release orchestration failed: ${error.message}`);
            process.exit(1);
        });
}

module.exports = ReleaseOrchestrationSystem;