// PHASE 4.2: Security Headers Validation Tool

const fs = require('fs');
const path = require('path');

class SecurityHeadersValidator {
    constructor() {
        this.results = { passed: 0, failed: 0, warnings: 0, details: [] };
    }

    async validateNetlifyConfig() {
        const netlifyPath = path.join(process.cwd(), 'config', 'netlify.toml');
        
        if (!fs.existsSync(netlifyPath)) {
            this.addResult('FAIL', 'netlify.toml', 'Configuration file missing');
            return false;
        }

        const config = fs.readFileSync(netlifyPath, 'utf8');
        
        // Check for required security headers
        const headers = ['X-Frame-Options', 'X-Content-Type-Options', 'X-XSS-Protection', 
                        'Strict-Transport-Security', 'Content-Security-Policy', 'Referrer-Policy'];
        
        headers.forEach(header => {
            if (config.includes(header)) {
                this.addResult('PASS', header, 'Header configured');
            } else {
                this.addResult('FAIL', header, 'Header missing');
            }
        });

        return this.results.failed === 0;
    }

    addResult(status, test, message) {
        this.results.details.push({ status, test, message });
        
        if (status === 'PASS') this.results.passed++;
        else if (status === 'FAIL') this.results.failed++;
        else if (status === 'WARN') this.results.warnings++;
    }

    async run() {
        console.log('🔒 Security Headers Validation');
        console.log('==============================');
        
        await this.validateNetlifyConfig();
        
        const score = Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100) || 0;
        
        console.log(`\nResults:`);
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`🎯 Score: ${score}%`);
        
        this.results.details.forEach(detail => {
            const icon = detail.status === 'PASS' ? '✅' : '❌';
            console.log(`${icon} ${detail.test}: ${detail.message}`);
        });
        
        return this.results.failed === 0;
    }
}

if (require.main === module) {
    const validator = new SecurityHeadersValidator();
    validator.run().then(success => {
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('Validation failed:', error);
        process.exit(1);
    });
}

module.exports = SecurityHeadersValidator;
