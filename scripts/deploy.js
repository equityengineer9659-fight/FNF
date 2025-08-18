#!/usr/bin/env node

/**
 * Deployment Script for Food-N-Force Website
 * Handles deployment to staging and production environments
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DeploymentManager {
  constructor() {
    this.environment = process.argv[2] || 'staging';
    this.netlifyAuthToken = process.env.NETLIFY_AUTH_TOKEN;
    this.staging_site_id = process.env.NETLIFY_STAGING_SITE_ID;
    this.production_site_id = process.env.NETLIFY_PRODUCTION_SITE_ID;
  }

  async deploy() {
    console.log(`🚀 Deploying Food-N-Force Website to ${this.environment}\n`);
    console.log('=' .repeat(50));

    try {
      // Validate environment
      this.validateEnvironment();
      
      // Pre-deployment checks
      await this.preDeploymentChecks();
      
      // Run build
      await this.runBuild();
      
      // Deploy to Netlify
      const deployment = await this.deployToNetlify();
      
      // Post-deployment verification
      await this.postDeploymentVerification(deployment);
      
      // Create deployment metadata
      await this.createDeploymentMetadata(deployment);
      
      console.log('🎉 Deployment completed successfully!');
      
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }

  validateEnvironment() {
    console.log('🔍 Validating environment...');
    
    if (!['staging', 'production'].includes(this.environment)) {
      throw new Error('Invalid environment. Use "staging" or "production"');
    }
    
    if (!this.netlifyAuthToken) {
      throw new Error('NETLIFY_AUTH_TOKEN environment variable is required');
    }
    
    const siteId = this.environment === 'production' ? this.production_site_id : this.staging_site_id;
    if (!siteId) {
      throw new Error(`NETLIFY_${this.environment.toUpperCase()}_SITE_ID environment variable is required`);
    }
    
    console.log('✅ Environment validation passed\n');
  }

  async preDeploymentChecks() {
    console.log('🔎 Running pre-deployment checks...');
    
    // Check if we're in a git repository
    try {
      execSync('git rev-parse --git-dir', { stdio: 'ignore' });
    } catch (error) {
      throw new Error('Not in a git repository. Please initialize git first.');
    }
    
    // Check for uncommitted changes in production
    if (this.environment === 'production') {
      try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (status.trim()) {
          throw new Error('Uncommitted changes detected. Please commit all changes before production deployment.');
        }
      } catch (error) {
        console.warn('⚠️  Could not check git status');
      }
    }
    
    // Check if package.json exists
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json not found. Please run from project root.');
    }
    
    console.log('✅ Pre-deployment checks passed\n');
  }

  async runBuild() {
    console.log('🔨 Running build process...');
    
    try {
      // Install dependencies if node_modules doesn't exist
      if (!fs.existsSync('node_modules')) {
        console.log('📦 Installing dependencies...');
        execSync('npm ci', { stdio: 'inherit' });
      }
      
      // Run linting
      console.log('🔍 Running linters...');
      execSync('npm run lint', { stdio: 'inherit' });
      
      // Run HTML validation
      console.log('📝 Validating HTML...');
      execSync('npm run validate:html', { stdio: 'inherit' });
      
      // Run SLDS compliance check
      console.log('🎨 Checking SLDS compliance...');
      execSync('npm run validate:slds', { stdio: 'inherit' });
      
      // Run security audit
      console.log('🔒 Running security audit...');
      execSync('npm run security', { stdio: 'inherit' });
      
      console.log('✅ Build process completed\n');
      
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async deployToNetlify() {
    console.log(`🌐 Deploying to ${this.environment}...`);
    
    const siteId = this.environment === 'production' ? this.production_site_id : this.staging_site_id;
    const prodFlag = this.environment === 'production' ? '--prod' : '';
    
    try {
      const deployCommand = `npx netlify-cli deploy ${prodFlag} --dir=. --json --site=${siteId}`;
      const result = execSync(deployCommand, { encoding: 'utf8' });
      const deployment = JSON.parse(result);
      
      console.log('✅ Deployment successful!');
      console.log(`   Deploy ID: ${deployment.deploy_id || deployment.id}`);
      console.log(`   URL: ${deployment.deploy_url || deployment.url}`);
      
      if (this.environment === 'production') {
        console.log(`   Live URL: ${deployment.url}`);
      }
      
      return deployment;
      
    } catch (error) {
      throw new Error(`Netlify deployment failed: ${error.message}`);
    }
  }

  async postDeploymentVerification(deployment) {
    console.log('🔍 Running post-deployment verification...');
    
    const url = deployment.deploy_url || deployment.url;
    
    try {
      // Wait a moment for deployment to propagate
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Test homepage accessibility
      console.log('   Testing homepage...');
      execSync(`curl -f ${url}`, { stdio: 'ignore' });
      
      // Test critical pages
      const pages = ['about.html', 'services.html', 'contact.html'];
      for (const page of pages) {
        console.log(`   Testing ${page}...`);
        try {
          execSync(`curl -f ${url}/${page}`, { stdio: 'ignore' });
        } catch (error) {
          console.warn(`   ⚠️  Warning: ${page} not accessible`);
        }
      }
      
      console.log('✅ Post-deployment verification passed\n');
      
    } catch (error) {
      throw new Error(`Post-deployment verification failed: ${error.message}`);
    }
  }

  async createDeploymentMetadata(deployment) {
    console.log('📝 Creating deployment metadata...');
    
    // Get git information
    let gitInfo = {};
    try {
      gitInfo.commit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      gitInfo.branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      gitInfo.message = execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
    } catch (error) {
      console.warn('   ⚠️  Could not get git information');
    }
    
    const metadata = {
      deployment_id: deployment.deploy_id || deployment.id,
      environment: this.environment,
      timestamp: new Date().toISOString(),
      url: deployment.deploy_url || deployment.url,
      git: gitInfo,
      deployed_by: process.env.USER || process.env.USERNAME || 'unknown',
      node_version: process.version,
      netlify_site_id: this.environment === 'production' ? this.production_site_id : this.staging_site_id
    };
    
    // Create metadata directory if it doesn't exist
    if (!fs.existsSync('deployment-metadata')) {
      fs.mkdirSync('deployment-metadata');
    }
    
    // Save metadata
    const filename = `deployment-metadata/${this.environment}-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(metadata, null, 2));
    
    console.log(`   Metadata saved to: ${filename}\n`);
  }
}

// Usage instructions and execution
if (require.main === module) {
  console.log('Food-N-Force Deployment Script');
  console.log('Usage: node scripts/deploy.js [staging|production]');
  console.log('');
  console.log('Environment variables required:');
  console.log('  - NETLIFY_AUTH_TOKEN');
  console.log('  - NETLIFY_STAGING_SITE_ID (for staging deployments)');
  console.log('  - NETLIFY_PRODUCTION_SITE_ID (for production deployments)');
  console.log('');
  
  const deploymentManager = new DeploymentManager();
  deploymentManager.deploy();
}