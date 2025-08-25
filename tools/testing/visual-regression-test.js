/**
 * FOOD-N-FORCE VISUAL REGRESSION TEST SUITE
 * Real measurements, not assumptions
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class VisualRegressionTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: { passed: 0, failed: 0, total: 0 }
    };
    this.baselineDir = path.join(__dirname, '../baselines');
    this.reportsDir = path.join(__dirname, '../reports');
  }

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: null
    });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async testLogoPosition(url) {
    const testName = 'Logo Position';
    console.log(`Testing: ${testName} on ${url}`);
    
    await this.page.goto(url, { waitUntil: 'networkidle0' });
    
    const logoMetrics = await this.page.evaluate(() => {
      const logoContainer = document.querySelector('.navbar.universal-nav .logo-container');
      if (!logoContainer) return { error: 'Logo container not found' };
      
      const rect = logoContainer.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(logoContainer);
      
      return {
        left: rect.left,
        width: rect.width,
        height: rect.height,
        display: computedStyle.display,
        position: computedStyle.position,
        gridColumn: computedStyle.gridColumn
      };
    });
    
    const passed = logoMetrics.left <= 50 && logoMetrics.left >= 0;
    
    this.testResults.tests.push({
      name: testName,
      url: url,
      passed: passed,
      expected: 'Logo left position <= 50px',
      actual: `Logo left position: ${logoMetrics.left}px`,
      metrics: logoMetrics,
      timestamp: new Date().toISOString()
    });
    
    return { testName, passed, metrics: logoMetrics };
  }

  async runFullTestSuite() {
    const pages = [
      'index.html',
      'services.html',
      'resources.html',
      'impact.html',
      'contact.html',
      'about.html'
    ];
    
    console.log('FOOD-N-FORCE VISUAL REGRESSION TEST SUITE');
    console.log('==========================================');
    
    await this.initialize();
    
    const allResults = {};
    
    for (const page of pages) {
      const baseUrl = process.argv[2] || 'file://' + path.resolve(__dirname, '../..');
      const fullUrl = baseUrl.endsWith('.html') ? baseUrl : `${baseUrl}/${page}`;
      
      allResults[page] = await this.testLogoPosition(fullUrl);
    }
    
    await this.cleanup();
    
    this.testResults.summary.total = this.testResults.tests.length;
    this.testResults.summary.passed = this.testResults.tests.filter(t => t.passed).length;
    this.testResults.summary.failed = this.testResults.summary.total - this.testResults.summary.passed;
    
    const reportPath = path.join(this.reportsDir, `test-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(this.testResults, null, 2));
    
    console.log('\nTEST SUITE COMPLETE');
    console.log(`Total Tests: ${this.testResults.summary.total}`);
    console.log(`Passed: ${this.testResults.summary.passed}`);
    console.log(`Failed: ${this.testResults.summary.failed}`);
    
    return { allResults, summary: this.testResults.summary, reportPath };
  }
}

if (require.main === module) {
  const tester = new VisualRegressionTester();
  tester.runFullTestSuite().catch(console.error);
}

module.exports = VisualRegressionTester;