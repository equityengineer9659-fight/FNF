/**
 * FOOD-N-FORCE PRACTICAL TEST RUNNER
 * Real measurements using file system verification
 */

const fs = require('fs').promises;
const path = require('path');

class FoodNForceTestRunner {
  constructor() {
    this.results = [];
    this.timestamp = new Date().toISOString();
    this.pages = ['index.html', 'services.html', 'resources.html', 'impact.html', 'contact.html', 'about.html'];
  }

  async runVisualTests() {
    console.log('FOOD-N-FORCE TEST SUITE');
    console.log('========================');
    
    const fileResults = await this.testFileExistence();
    this.results.push(...fileResults);

    const cssResults = await this.testCSSDefinitions();
    this.results.push(...cssResults);

    return this.generateReport();
  }

  async testFileExistence() {
    const results = [];
    const baseDir = path.resolve(__dirname, '../..');
    
    for (const page of this.pages) {
      const filePath = path.join(baseDir, page);
      try {
        await fs.access(filePath);
        results.push({
          test: 'File Existence',
          page: page,
          passed: true,
          expected: 'File should exist',
          actual: 'File exists'
        });
        console.log(`✓ ${page} exists`);
      } catch (error) {
        results.push({
          test: 'File Existence',
          page: page,
          passed: false,
          expected: 'File should exist',
          actual: 'File not found'
        });
        console.log(`✗ ${page} missing`);
      }
    }
    
    return results;
  }

  async testCSSDefinitions() {
    const results = [];
    const cssPath = path.join(__dirname, '../..', 'css', 'navigation-unified.css');
    
    try {
      const cssContent = await fs.readFile(cssPath, 'utf8');
      
      const requiredClasses = [
        '.navbar.universal-nav',
        '.brand-logo.universal-brand-logo',
        '.mobile-nav-toggle',
        '.nav-menu.nav-show'
      ];

      for (const className of requiredClasses) {
        const found = cssContent.includes(className);
        results.push({
          test: 'CSS Class Definition',
          target: className,
          passed: found,
          expected: className + ' should be defined',
          actual: found ? 'Class found' : 'Class not found'
        });
        console.log(`${found ? '✓' : '✗'} ${className}`);
      }

    } catch (error) {
      results.push({
        test: 'CSS File Access',
        target: 'navigation-unified.css',
        passed: false,
        expected: 'CSS file should be readable',
        actual: 'File access failed'
      });
    }

    return results;
  }

  async generateReport() {
    const summary = {
      timestamp: this.timestamp,
      total: this.results.length,
      passed: this.results.filter(r => r.passed).length,
      failed: this.results.filter(r => !r.passed).length,
      results: this.results
    };

    console.log('\nTEST SUMMARY');
    console.log('============');
    console.log('Total Tests:', summary.total);
    console.log('Passed:', summary.passed);
    console.log('Failed:', summary.failed);

    return { summary };
  }
}

if (require.main === module) {
  const runner = new FoodNForceTestRunner();
  runner.runVisualTests().catch(console.error);
}

module.exports = FoodNForceTestRunner;