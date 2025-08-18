#!/usr/bin/env node

/**
 * Health Check Script for Food-N-Force Website
 * Validates deployment health and performance
 */

const https = require('https');
const http = require('http');

class HealthChecker {
  constructor() {
    this.baseUrl = process.argv[2] || 'https://foodnforce.com';
    this.results = [];
  }

  async runHealthCheck() {
    console.log(`🏥 Running Health Check for ${this.baseUrl}\n`);
    console.log('=' .repeat(50));

    try {
      // Test critical pages
      await this.testPages();
      
      // Test performance metrics
      await this.testPerformance();
      
      // Test accessibility
      await this.testAccessibility();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      process.exit(1);
    }
  }

  async testPages() {
    console.log('🔍 Testing page availability...');
    
    const pages = [
      { path: '/', name: 'Homepage' },
      { path: '/about.html', name: 'About' },
      { path: '/services.html', name: 'Services' },
      { path: '/impact.html', name: 'Impact' },
      { path: '/resources.html', name: 'Resources' },
      { path: '/contact.html', name: 'Contact' }
    ];
    
    for (const page of pages) {
      const result = await this.testPage(page.path, page.name);
      this.results.push(result);
    }
    
    console.log('');
  }

  async testPage(path, name) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const url = `${this.baseUrl}${path}`;
      const client = this.baseUrl.startsWith('https') ? https : http;
      
      const req = client.get(url, (res) => {
        const loadTime = Date.now() - startTime;
        const result = {
          page: name,
          path: path,
          status: res.statusCode,
          loadTime: loadTime,
          success: res.statusCode >= 200 && res.statusCode < 400
        };
        
        console.log(`   ${result.success ? '✅' : '❌'} ${name}: ${res.statusCode} (${loadTime}ms)`);
        resolve(result);
      });
      
      req.on('error', (error) => {
        const result = {
          page: name,
          path: path,
          status: 'ERROR',
          loadTime: Date.now() - startTime,
          success: false,
          error: error.message
        };
        
        console.log(`   ❌ ${name}: ERROR (${error.message})`);
        resolve(result);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        const result = {
          page: name,
          path: path,
          status: 'TIMEOUT',
          loadTime: 10000,
          success: false,
          error: 'Request timeout'
        };
        
        console.log(`   ❌ ${name}: TIMEOUT`);
        resolve(result);
      });
    });
  }

  async testPerformance() {
    console.log('⚡ Testing performance metrics...');
    
    // Test homepage load time
    const homepage = await this.testPagePerformance('/');
    
    if (homepage.loadTime > 3000) {
      console.log(`   ⚠️  Homepage load time: ${homepage.loadTime}ms (slow)`);
    } else {
      console.log(`   ✅ Homepage load time: ${homepage.loadTime}ms (good)`);
    }
    
    console.log('');
  }

  async testPagePerformance(path) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const url = `${this.baseUrl}${path}`;
      const client = this.baseUrl.startsWith('https') ? https : http;
      
      const req = client.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const loadTime = Date.now() - startTime;
          const size = Buffer.byteLength(data, 'utf8');
          
          resolve({
            loadTime: loadTime,
            size: size,
            status: res.statusCode
          });
        });
      });
      
      req.on('error', () => {
        resolve({
          loadTime: Date.now() - startTime,
          size: 0,
          status: 'ERROR'
        });
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        resolve({
          loadTime: 10000,
          size: 0,
          status: 'TIMEOUT'
        });
      });
    });
  }

  async testAccessibility() {
    console.log('♿ Testing basic accessibility...');
    
    try {
      const homepage = await this.fetchPageContent('/');
      
      // Check for basic accessibility elements
      const checks = [
        { test: /<html[^>]+lang=/, name: 'HTML lang attribute' },
        { test: /<title>/, name: 'Page title' },
        { test: /alt=["'][^"']*["']/, name: 'Image alt attributes' },
        { test: /role=["']main["']/, name: 'Main landmark' },
        { test: /skip.*link/i, name: 'Skip navigation link' }
      ];
      
      checks.forEach(check => {
        const found = check.test.test(homepage);
        console.log(`   ${found ? '✅' : '❌'} ${check.name}`);
      });
      
    } catch (error) {
      console.log('   ❌ Could not test accessibility');
    }
    
    console.log('');
  }

  async fetchPageContent(path) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${path}`;
      const client = this.baseUrl.startsWith('https') ? https : http;
      
      const req = client.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve(data);
        });
      });
      
      req.on('error', reject);
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  generateReport() {
    console.log('📊 Health Check Summary\n');
    console.log('=' .repeat(50));
    
    const successful = this.results.filter(r => r.success).length;
    const total = this.results.length;
    const avgLoadTime = this.results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.loadTime, 0) / successful;
    
    console.log(`Pages tested: ${total}`);
    console.log(`Successful: ${successful}`);
    console.log(`Failed: ${total - successful}`);
    console.log(`Average load time: ${Math.round(avgLoadTime)}ms`);
    
    if (successful === total) {
      console.log('\n🎉 All health checks passed!');
    } else {
      console.log('\n⚠️  Some health checks failed. Please investigate.');
      
      const failed = this.results.filter(r => !r.success);
      console.log('\nFailed pages:');
      failed.forEach(page => {
        console.log(`   ${page.page}: ${page.status}${page.error ? ' (' + page.error + ')' : ''}`);
      });
      
      process.exit(1);
    }
  }
}

// Usage instructions and execution
if (require.main === module) {
  console.log('Food-N-Force Health Check Script');
  console.log('Usage: node scripts/health-check.js [url]');
  console.log('Example: node scripts/health-check.js https://foodnforce.com');
  console.log('');
  
  const healthChecker = new HealthChecker();
  healthChecker.runHealthCheck();
}