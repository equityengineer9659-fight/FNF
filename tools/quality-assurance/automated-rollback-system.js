#!/usr/bin/env node

/**
 * Automated Rollback System
 * Food-N-Force Quality Assurance Framework v1.0
 * 
 * Emergency rollback capabilities with governance framework integration
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class AutomatedRollbackSystem {
  constructor() {
    this.config = null;
    this.rollbackHistory = [];
    this.currentAttempt = 0;
    this.maxAttempts = 3;
    this.emergencyActive = false;
  }

  async initialize() {
    try {
      const configPath = path.join(__dirname, 'qa-framework-config.json');
      const configData = await fs.readFile(configPath, 'utf8');
      this.config = JSON.parse(configData);
      
      console.log('🔄 Automated Rollback System initialized');
      console.log('🚨 Emergency Response Integration: ACTIVE');
      console.log(`📊 Max rollback attempts: ${this.config.automated_rollback.max_rollback_attempts}`);
    } catch (error) {
      throw new Error(`Failed to initialize rollback system: ${error.message}`);
    }
  }

  async evaluateRollbackTriggers(qualityResults) {
    console.log('🔍 Evaluating rollback triggers...');
    
    const triggers = this.config.automated_rollback.triggers;
    const activeTriggers = [];

    // Check for critical visual regression
    if (triggers.critical_visual_regression && qualityResults.visual) {
      if (qualityResults.visual.special_effects) {
        const failedEffects = qualityResults.visual.special_effects.filter(e => e.status === 'FAIL' && e.critical);
        if (failedEffects.length > 0) {
          activeTriggers.push({
            type: 'critical_visual_regression',
            severity: 'CRITICAL',
            details: failedEffects,
            auto_rollback: true
          });
        }
      }
    }

    // Check for performance budget violation
    if (triggers.performance_budget_violation && qualityResults.performance) {
      const perfDetails = qualityResults.performance.details;
      if (perfDetails && (!perfDetails.css_budget.passed || !perfDetails.js_budget.passed)) {
        activeTriggers.push({
          type: 'performance_budget_violation',
          severity: 'CRITICAL',
          details: perfDetails,
          auto_rollback: true
        });
      }
    }

    // Check for mobile navigation failure (P0)
    if (triggers.mobile_navigation_failure && qualityResults.mobile) {
      if (!qualityResults.mobile.passed) {
        activeTriggers.push({
          type: 'mobile_navigation_failure',
          severity: 'CRITICAL',
          details: qualityResults.mobile.details,
          auto_rollback: true,
          priority: 'P0'
        });
      }
    }

    // Check for SLDS compliance drop
    if (triggers.slds_compliance_drop && qualityResults.slds) {
      if (!qualityResults.slds.passed) {
        activeTriggers.push({
          type: 'slds_compliance_drop',
          severity: 'HIGH',
          details: qualityResults.slds.details,
          auto_rollback: false // SLDS compliance doesn't trigger automatic rollback
        });
      }
    }

    // Check for accessibility regression
    if (triggers.accessibility_regression && qualityResults.accessibility) {
      if (!qualityResults.accessibility.passed) {
        activeTriggers.push({
          type: 'accessibility_regression',
          severity: 'HIGH',
          details: qualityResults.accessibility.details,
          auto_rollback: false
        });
      }
    }

    return activeTriggers;
  }

  async executeEmergencyRollback(triggers) {
    console.log('🚨 EMERGENCY ROLLBACK INITIATED');
    console.log('⏱️  Governance SLA: 15-minute technical-architect response');
    
    this.emergencyActive = true;
    this.currentAttempt++;

    const rollbackSession = {
      id: `rollback-${Date.now()}`,
      timestamp: new Date().toISOString(),
      attempt: this.currentAttempt,
      triggers: triggers,
      status: 'INITIATED',
      steps: []
    };

    try {
      // Step 1: Notify governance framework
      await this.notifyGovernanceEmergency(rollbackSession);
      rollbackSession.steps.push({
        step: 'governance_notification',
        status: 'COMPLETED',
        timestamp: new Date().toISOString()
      });

      // Step 2: Create rollback backup point
      await this.createRollbackBackup(rollbackSession);
      rollbackSession.steps.push({
        step: 'backup_creation',
        status: 'COMPLETED',
        timestamp: new Date().toISOString()
      });

      // Step 3: Execute rollback strategy
      await this.executeRollbackStrategy(rollbackSession);
      rollbackSession.steps.push({
        step: 'rollback_execution',
        status: 'COMPLETED',
        timestamp: new Date().toISOString()
      });

      // Step 4: Run verification tests
      const verificationResults = await this.runVerificationTests(rollbackSession);
      rollbackSession.steps.push({
        step: 'verification_tests',
        status: verificationResults.passed ? 'COMPLETED' : 'FAILED',
        results: verificationResults,
        timestamp: new Date().toISOString()
      });

      if (verificationResults.passed) {
        rollbackSession.status = 'SUCCESS';
        console.log('✅ Emergency rollback completed successfully');
        
        // Step 5: Update governance framework
        await this.notifyRollbackSuccess(rollbackSession);
      } else {
        rollbackSession.status = 'FAILED';
        console.log('❌ Emergency rollback verification failed');
        
        if (this.currentAttempt < this.maxAttempts) {
          console.log(`🔄 Attempting rollback retry (${this.currentAttempt + 1}/${this.maxAttempts})`);
          return await this.executeEmergencyRollback(triggers);
        } else {
          console.log('🚨 Maximum rollback attempts exceeded - escalating to technical-architect');
          await this.escalateToEmergencyResponse(rollbackSession);
        }
      }

    } catch (error) {
      rollbackSession.status = 'ERROR';
      rollbackSession.error = error.message;
      rollbackSession.steps.push({
        step: 'error_handling',
        status: 'FAILED',
        error: error.message,
        timestamp: new Date().toISOString()
      });

      console.error('❌ Emergency rollback failed:', error.message);
      await this.escalateToEmergencyResponse(rollbackSession);
    } finally {
      this.rollbackHistory.push(rollbackSession);
      await this.saveRollbackHistory();
    }

    return rollbackSession;
  }

  async notifyGovernanceEmergency(rollbackSession) {
    const notification = {
      timestamp: new Date().toISOString(),
      type: 'EMERGENCY_ROLLBACK_INITIATED',
      severity: 'CRITICAL',
      source: 'Automated Rollback System',
      rollback_id: rollbackSession.id,
      triggers: rollbackSession.triggers,
      authority: 'technical-architect',
      sla: '15 minutes',
      status: 'ROLLBACK_IN_PROGRESS',
      expected_actions: [
        'Monitor rollback progress',
        'Prepare for manual intervention if needed',
        'Coordinate with affected teams',
        'Document incident for post-mortem'
      ]
    };

    const notificationPath = path.join(__dirname, '../governance/emergency-notifications.json');
    await fs.writeFile(notificationPath, JSON.stringify(notification, null, 2));
    
    console.log('📞 Emergency notification sent to governance framework');
  }

  async createRollbackBackup(rollbackSession) {
    try {
      // Create a backup branch before rollback
      const backupBranch = `backup-before-rollback-${rollbackSession.id}`;
      execSync(`git branch ${backupBranch}`, { stdio: 'pipe' });
      
      rollbackSession.backup_branch = backupBranch;
      console.log(`💾 Backup branch created: ${backupBranch}`);
    } catch (error) {
      console.warn('⚠️ Could not create backup branch:', error.message);
      // Continue rollback even if backup fails
    }
  }

  async executeRollbackStrategy(rollbackSession) {
    const strategy = this.config.automated_rollback.rollback_strategy;
    
    console.log(`🔄 Executing rollback strategy: ${strategy}`);
    
    switch (strategy) {
      case 'git_reset_hard':
        await this.executeGitResetHard();
        break;
      case 'git_revert':
        await this.executeGitRevert();
        break;
      case 'branch_switch':
        await this.executeBranchSwitch();
        break;
      default:
        throw new Error(`Unknown rollback strategy: ${strategy}`);
    }
  }

  async executeGitResetHard() {
    console.log('🔄 Executing git reset --hard HEAD~1');
    
    // Get current commit for logging
    const currentCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    console.log(`📍 Rolling back from commit: ${currentCommit.substring(0, 8)}`);
    
    // Execute rollback
    execSync('git reset --hard HEAD~1', { stdio: 'inherit' });
    
    const newCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    console.log(`📍 Rolled back to commit: ${newCommit.substring(0, 8)}`);
  }

  async executeGitRevert() {
    console.log('🔄 Executing git revert HEAD');
    execSync('git revert HEAD --no-edit', { stdio: 'inherit' });
  }

  async executeBranchSwitch() {
    console.log('🔄 Executing branch switch to last known good');
    // Switch to last known good branch (would need configuration)
    execSync('git checkout last-known-good', { stdio: 'inherit' });
  }

  async runVerificationTests(rollbackSession) {
    console.log('🧪 Running rollback verification tests...');
    
    const verificationTests = this.config.automated_rollback.verification_tests;
    const results = {
      passed: true,
      tests: {},
      summary: {
        total: verificationTests.length,
        passed: 0,
        failed: 0
      }
    };

    for (const test of verificationTests) {
      try {
        console.log(`   Running: ${test}`);
        execSync(`npm run ${test}`, { stdio: 'pipe' });
        
        results.tests[test] = 'PASS';
        results.summary.passed++;
        console.log(`   ✅ ${test}: PASSED`);
      } catch (error) {
        results.tests[test] = 'FAIL';
        results.summary.failed++;
        results.passed = false;
        console.log(`   ❌ ${test}: FAILED`);
      }
    }

    const passRate = Math.round((results.summary.passed / results.summary.total) * 100);
    console.log(`🧪 Verification tests: ${passRate}% passed (${results.summary.passed}/${results.summary.total})`);

    return results;
  }

  async notifyRollbackSuccess(rollbackSession) {
    const notification = {
      timestamp: new Date().toISOString(),
      type: 'EMERGENCY_ROLLBACK_SUCCESS',
      severity: 'RESOLVED',
      source: 'Automated Rollback System',
      rollback_id: rollbackSession.id,
      status: 'COMPLETED',
      verification_results: rollbackSession.steps.find(s => s.step === 'verification_tests')?.results,
      next_actions: [
        'System is stable and operational',
        'Investigate root cause of quality failure',
        'Implement preventive measures',
        'Update quality gates if needed'
      ],
      governance_handoff: 'technical-architect'
    };

    const notificationPath = path.join(__dirname, '../governance/rollback-success-notifications.json');
    await fs.writeFile(notificationPath, JSON.stringify(notification, null, 2));
    
    console.log('✅ Rollback success notification sent to governance framework');
  }

  async escalateToEmergencyResponse(rollbackSession) {
    console.log('🚨 ESCALATING TO EMERGENCY RESPONSE');
    console.log('📞 Manual intervention required - technical-architect authority');
    
    const escalation = {
      timestamp: new Date().toISOString(),
      type: 'EMERGENCY_ROLLBACK_ESCALATION',
      severity: 'CRITICAL',
      source: 'Automated Rollback System',
      rollback_id: rollbackSession.id,
      reason: rollbackSession.status === 'ERROR' ? 'Rollback execution failed' : 'Verification tests failed after rollback',
      rollback_attempts: this.currentAttempt,
      max_attempts: this.maxAttempts,
      current_state: 'UNSTABLE',
      immediate_actions_required: [
        'Manual system assessment by technical-architect',
        'Determine if additional rollback needed',
        'Coordinate emergency response team',
        'Communicate with stakeholders'
      ],
      authority: 'technical-architect',
      sla: 'IMMEDIATE',
      contact_info: {
        primary: 'technical-architect',
        secondary: 'project-manager-proj',
        escalation: 'stakeholders'
      }
    };

    const escalationPath = path.join(__dirname, '../governance/emergency-escalations.json');
    await fs.writeFile(escalationPath, JSON.stringify(escalation, null, 2));
    
    console.log('📞 Emergency escalation sent to governance framework');
  }

  async saveRollbackHistory() {
    const historyPath = path.join(__dirname, 'rollback-history.json');
    await fs.writeFile(historyPath, JSON.stringify(this.rollbackHistory, null, 2));
  }

  async generateRollbackReport() {
    const report = {
      framework: 'Quality Assurance Framework v1.0',
      system: 'Automated Rollback System',
      timestamp: new Date().toISOString(),
      statistics: {
        total_rollbacks: this.rollbackHistory.length,
        successful_rollbacks: this.rollbackHistory.filter(r => r.status === 'SUCCESS').length,
        failed_rollbacks: this.rollbackHistory.filter(r => r.status === 'FAILED').length,
        average_rollback_time: this.calculateAverageRollbackTime()
      },
      recent_rollbacks: this.rollbackHistory.slice(-5),
      governance_integration: {
        emergency_response_integrations: this.rollbackHistory.filter(r => r.triggers.some(t => t.priority === 'P0')).length,
        escalations_to_technical_architect: this.rollbackHistory.filter(r => r.status === 'FAILED' || r.status === 'ERROR').length
      }
    };

    const reportPath = path.join(__dirname, 'reports', `rollback-system-report-${Date.now()}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    return report;
  }

  calculateAverageRollbackTime() {
    if (this.rollbackHistory.length === 0) return 0;
    
    const times = this.rollbackHistory.map(r => {
      const start = new Date(r.timestamp);
      const end = new Date(r.steps[r.steps.length - 1]?.timestamp || r.timestamp);
      return end - start;
    });
    
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length / 1000); // seconds
  }

  async reset() {
    this.currentAttempt = 0;
    this.emergencyActive = false;
    console.log('🔄 Rollback system reset');
  }
}

// CLI execution
if (require.main === module) {
  (async () => {
    try {
      const rollbackSystem = new AutomatedRollbackSystem();
      await rollbackSystem.initialize();
      
      console.log('🔄 Automated Rollback System ready');
      console.log('🚨 Use qa:emergency-rollback to trigger emergency rollback');
      console.log('📊 Use qa:rollback-report to generate system report');
      
      // Generate current report
      const report = await rollbackSystem.generateRollbackReport();
      console.log(`📄 Rollback system report generated`);
      console.log(`📈 Total rollbacks: ${report.statistics.total_rollbacks}`);
      console.log(`✅ Success rate: ${Math.round((report.statistics.successful_rollbacks / Math.max(report.statistics.total_rollbacks, 1)) * 100)}%`);
      
    } catch (error) {
      console.error('❌ Rollback system initialization failed:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = AutomatedRollbackSystem;