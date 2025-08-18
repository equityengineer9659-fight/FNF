#!/usr/bin/env node

/**
 * Rollback Script for Food-N-Force Website
 * Handles rollback to previous production versions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

class RollbackManager {
  constructor() {
    this.netlifyAuthToken = process.env.NETLIFY_AUTH_TOKEN;
    this.netlifyProductionSiteId = process.env.NETLIFY_PRODUCTION_SITE_ID;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async rollback() {
    console.log('🔄 Food-N-Force Website Rollback Tool\n');
    console.log('=' .repeat(50));

    try {
      // Check for required environment variables
      if (!this.netlifyAuthToken || !this.netlifyProductionSiteId) {
        throw new Error('Missing required environment variables: NETLIFY_AUTH_TOKEN, NETLIFY_PRODUCTION_SITE_ID');
      }

      // Get available deployments
      const deployments = await this.getDeployments();
      
      if (deployments.length < 2) {
        console.log('❌ No previous deployments available for rollback.');
        return;
      }

      // Display current deployment
      const currentDeployment = deployments[0];
      console.log(`📍 Current Deployment:`);
      console.log(`   ID: ${currentDeployment.id}`);
      console.log(`   Created: ${new Date(currentDeployment.created_at).toLocaleString()}`);
      console.log(`   Commit: ${currentDeployment.commit_ref || 'N/A'}`);
      console.log(`   URL: ${currentDeployment.url}\n`);

      // Show available rollback targets
      console.log('🎯 Available Rollback Targets:\n');
      const rollbackTargets = deployments.slice(1, 6); // Show last 5 deployments
      
      rollbackTargets.forEach((deployment, index) => {
        console.log(`   ${index + 1}. ${deployment.id.slice(0, 8)}... - ${new Date(deployment.created_at).toLocaleString()}`);
        if (deployment.commit_ref) {
          console.log(`      Commit: ${deployment.commit_ref}`);
        }
        console.log(`      URL: ${deployment.url}\n`);
      });

      // Get user selection
      const selectedIndex = await this.getUserSelection(rollbackTargets.length);
      
      if (selectedIndex === -1) {
        console.log('❌ Rollback cancelled.');
        return;
      }

      const targetDeployment = rollbackTargets[selectedIndex];
      
      // Confirm rollback
      const confirmed = await this.confirmRollback(targetDeployment);
      
      if (!confirmed) {
        console.log('❌ Rollback cancelled.');
        return;
      }

      // Perform rollback
      await this.performRollback(targetDeployment);
      
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  async getDeployments() {
    console.log('🔍 Fetching deployment history...\n');
    
    try {
      const result = execSync(
        `curl -H "Authorization: Bearer ${this.netlifyAuthToken}" ` +
        `"https://api.netlify.com/api/v1/sites/${this.netlifyProductionSiteId}/deploys?per_page=10"`,
        { encoding: 'utf8' }
      );
      
      const deployments = JSON.parse(result);
      
      // Filter only successful production deployments
      return deployments.filter(deploy => 
        deploy.state === 'ready' && 
        deploy.context === 'production'
      );
    } catch (error) {
      throw new Error(`Failed to fetch deployments: ${error.message}`);
    }
  }

  async getUserSelection(maxOptions) {
    return new Promise((resolve) => {
      this.rl.question(`Enter the number of the deployment to rollback to (1-${maxOptions}), or 'q' to quit: `, (answer) => {
        if (answer.toLowerCase() === 'q') {
          resolve(-1);
          return;
        }
        
        const selection = parseInt(answer, 10);
        if (isNaN(selection) || selection < 1 || selection > maxOptions) {
          console.log('❌ Invalid selection. Please try again.\n');
          resolve(this.getUserSelection(maxOptions));
          return;
        }
        
        resolve(selection - 1);
      });
    });
  }

  async confirmRollback(targetDeployment) {
    return new Promise((resolve) => {
      console.log(`\n⚠️  You are about to rollback to:`);
      console.log(`   Deployment ID: ${targetDeployment.id}`);
      console.log(`   Created: ${new Date(targetDeployment.created_at).toLocaleString()}`);
      console.log(`   Commit: ${targetDeployment.commit_ref || 'N/A'}`);
      console.log(`   URL: ${targetDeployment.url}\n`);
      
      this.rl.question('Are you sure you want to proceed? (y/N): ', (answer) => {
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  async performRollback(targetDeployment) {
    console.log('\n🔄 Performing rollback...');
    
    try {
      // Create rollback deployment by restoring the target deployment
      const rollbackResult = execSync(
        `curl -X POST -H "Authorization: Bearer ${this.netlifyAuthToken}" ` +
        `"https://api.netlify.com/api/v1/sites/${this.netlifyProductionSiteId}/deploys/${targetDeployment.id}/restore"`,
        { encoding: 'utf8' }
      );
      
      const rollbackDeployment = JSON.parse(rollbackResult);
      
      console.log('✅ Rollback initiated successfully!');
      console.log(`   New Deployment ID: ${rollbackDeployment.id}`);
      console.log(`   Status: ${rollbackDeployment.state}`);
      
      // Wait for deployment to complete
      await this.waitForDeployment(rollbackDeployment.id);
      
      // Create rollback metadata
      await this.createRollbackMetadata(targetDeployment, rollbackDeployment);
      
      console.log('\n🎉 Rollback completed successfully!');
      console.log(`   Production URL: https://foodnforce.com`);
      console.log(`   Previous deployment restored: ${targetDeployment.id}`);
      
    } catch (error) {
      throw new Error(`Rollback failed: ${error.message}`);
    }
  }

  async waitForDeployment(deploymentId) {
    console.log('⏳ Waiting for deployment to complete...');
    
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes timeout
    
    while (attempts < maxAttempts) {
      try {
        const result = execSync(
          `curl -H "Authorization: Bearer ${this.netlifyAuthToken}" ` +
          `"https://api.netlify.com/api/v1/sites/${this.netlifyProductionSiteId}/deploys/${deploymentId}"`,
          { encoding: 'utf8' }
        );
        
        const deployment = JSON.parse(result);
        
        if (deployment.state === 'ready') {
          console.log('✅ Deployment completed successfully!');
          return;
        } else if (deployment.state === 'error') {
          throw new Error('Deployment failed');
        }
        
        process.stdout.write('.');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        attempts++;
        
      } catch (error) {
        throw new Error(`Failed to check deployment status: ${error.message}`);
      }
    }
    
    throw new Error('Deployment timeout - please check Netlify dashboard');
  }

  async createRollbackMetadata(targetDeployment, rollbackDeployment) {
    const metadata = {
      rollback_timestamp: new Date().toISOString(),
      rollback_deployment_id: rollbackDeployment.id,
      target_deployment_id: targetDeployment.id,
      target_deployment_created: targetDeployment.created_at,
      target_commit: targetDeployment.commit_ref,
      performed_by: process.env.USER || process.env.USERNAME || 'unknown',
      reason: 'Manual rollback via rollback script'
    };
    
    // Save to local file
    if (!fs.existsSync('deployment-metadata')) {
      fs.mkdirSync('deployment-metadata');
    }
    
    const filename = `deployment-metadata/rollback-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(metadata, null, 2));
    
    console.log(`📝 Rollback metadata saved to: ${filename}`);
  }
}

// Usage instructions
if (require.main === module) {
  console.log('Usage: node scripts/rollback.js');
  console.log('Environment variables required:');
  console.log('  - NETLIFY_AUTH_TOKEN');
  console.log('  - NETLIFY_PRODUCTION_SITE_ID\n');
  
  const rollbackManager = new RollbackManager();
  rollbackManager.rollback();
}