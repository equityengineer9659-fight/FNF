#!/usr/bin/env node

/**
 * Setup and Verification Script for Rollback Validation Infrastructure
 * Ensures all testing components are properly configured and functional
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class RollbackValidationSetup {
    constructor() {
        this.projectRoot = path.resolve(__dirname, '../..');
        this.requiredDirectories = [
            'test-results',
            'tools/testing',
            '.github/workflows'
        ];
        
        this.requiredFiles = [
            'tools/testing/rollback-validation-protocol.js',
            'tools/testing/rollback-ci-integration.js',
            'tools/testing/performance-budget-monitor.js',
            'tools/testing/playwright.config.js',
            '.github/workflows/rollback-validation.yml',
            'docs/technical/qa-rollback-validation-guide.md'
        ];
        
        this.npmScripts = [
            'test:rollback-validation',
            'test:rollback-pre',
            'test:rollback-post',
            'test:performance-budget',
            'test:critical-navigation',
            'ci:rollback-validation'
        ];
    }
    
    checkDirectories() {
        console.log('📁 Checking required directories...');
        
        for (const dir of this.requiredDirectories) {
            const fullPath = path.join(this.projectRoot, dir);
            if (!fs.existsSync(fullPath)) {
                console.log(`   Creating directory: ${dir}`);
                fs.mkdirSync(fullPath, { recursive: true });
            } else {
                console.log(`   ✅ ${dir}`);
            }
        }
    }
    
    checkFiles() {
        console.log('\n📄 Checking required files...');
        
        const missingFiles = [];
        
        for (const file of this.requiredFiles) {
            const fullPath = path.join(this.projectRoot, file);
            if (!fs.existsSync(fullPath)) {
                console.log(`   ❌ Missing: ${file}`);
                missingFiles.push(file);
            } else {
                console.log(`   ✅ ${file}`);
            }
        }
        
        return missingFiles;
    }
    
    checkNpmScripts() {
        console.log('\n📦 Checking npm scripts...');
        
        try {
            const packageJsonPath = path.join(this.projectRoot, 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            const missingScripts = [];
            
            for (const script of this.npmScripts) {
                if (packageJson.scripts && packageJson.scripts[script]) {
                    console.log(`   ✅ ${script}`);
                } else {
                    console.log(`   ❌ Missing: ${script}`);
                    missingScripts.push(script);
                }
            }
            
            return missingScripts;
        } catch (error) {
            console.error(`   ❌ Error reading package.json: ${error.message}`);
            return this.npmScripts;
        }
    }
    
    checkDependencies() {
        console.log('\n📚 Checking dependencies...');
        
        const requiredDeps = [
            '@playwright/test',
            'playwright'
        ];
        
        try {
            const packageJsonPath = path.join(this.projectRoot, 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };
            
            for (const dep of requiredDeps) {
                if (allDeps[dep]) {
                    console.log(`   ✅ ${dep} (${allDeps[dep]})`);
                } else {
                    console.log(`   ❌ Missing: ${dep}`);
                }
            }
        } catch (error) {
            console.error(`   ❌ Error checking dependencies: ${error.message}`);
        }
    }
    
    validateTestConfiguration() {
        console.log('\n⚙️  Validating test configuration...');
        
        try {
            const configPath = path.join(this.projectRoot, 'tools/testing/playwright.config.js');
            const config = require(configPath);
            
            console.log(`   ✅ Playwright config loaded`);
            console.log(`   ✅ Base URL: ${config.use?.baseURL || 'http://localhost:8080'}`);
            console.log(`   ✅ Projects: ${config.projects?.length || 0}`);
            
            // Check for mobile projects
            const mobileProjects = config.projects?.filter(p => 
                p.name?.includes('mobile') || p.name?.includes('tablet')
            ) || [];
            console.log(`   ✅ Mobile/Tablet projects: ${mobileProjects.length}`);
            
        } catch (error) {
            console.error(`   ❌ Error validating config: ${error.message}`);
        }
    }
    
    testScriptExecution() {
        console.log('\n🧪 Testing script execution...');
        
        const testScripts = [
            {
                name: 'CI Integration (dry run)',
                command: 'node tools/testing/rollback-ci-integration.js --dry-run',
                optional: true
            },
            {
                name: 'Performance Monitor (help)',
                command: 'node tools/testing/performance-budget-monitor.js --help',
                optional: true
            }
        ];
        
        for (const test of testScripts) {
            try {
                console.log(`   Testing: ${test.name}`);
                // Note: These would normally run the actual commands
                // For now, just check if files are executable
                const scriptPath = test.command.split(' ')[1];
                const fullScriptPath = path.join(this.projectRoot, scriptPath);
                
                if (fs.existsSync(fullScriptPath)) {
                    console.log(`   ✅ ${test.name} - Script exists`);
                } else {
                    console.log(`   ❌ ${test.name} - Script missing`);
                }
            } catch (error) {
                if (test.optional) {
                    console.log(`   ⚠️  ${test.name} - ${error.message} (optional)`);
                } else {
                    console.log(`   ❌ ${test.name} - ${error.message}`);
                }
            }
        }
    }
    
    generateSetupReport() {
        console.log('\n📋 Setup Report');
        console.log('================');
        
        const missingFiles = this.checkFiles();
        const missingScripts = this.checkNpmScripts();
        
        const setupComplete = missingFiles.length === 0 && missingScripts.length === 0;
        
        if (setupComplete) {
            console.log('🎉 Rollback validation infrastructure is fully set up!');
            console.log('\nNext steps:');
            console.log('1. Install dependencies: npm install');
            console.log('2. Install Playwright browsers: npx playwright install');
            console.log('3. Start dev server: npm run dev');
            console.log('4. Run pre-rollback documentation: npm run test:rollback-pre');
            console.log('5. After rollback: npm run test:rollback-validation');
        } else {
            console.log('❌ Setup incomplete. Missing components:');
            if (missingFiles.length > 0) {
                console.log('\nMissing files:');
                missingFiles.forEach(file => console.log(`  - ${file}`));
            }
            if (missingScripts.length > 0) {
                console.log('\nMissing npm scripts:');
                missingScripts.forEach(script => console.log(`  - ${script}`));
            }
        }
        
        return setupComplete;
    }
    
    async run() {
        console.log('🚀 Rollback Validation Infrastructure Setup');
        console.log('===========================================\n');
        
        this.checkDirectories();
        this.checkDependencies();
        this.validateTestConfiguration();
        this.testScriptExecution();
        
        const success = this.generateSetupReport();
        
        if (success) {
            console.log('\n✅ Setup validation completed successfully');
            process.exit(0);
        } else {
            console.log('\n❌ Setup validation found issues');
            process.exit(1);
        }
    }
}

// CLI execution
if (require.main === module) {
    const setup = new RollbackValidationSetup();
    setup.run().catch(error => {
        console.error('💥 Setup validation failed:', error);
        process.exit(1);
    });
}

module.exports = RollbackValidationSetup;