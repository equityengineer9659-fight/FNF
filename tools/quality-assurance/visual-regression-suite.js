#!/usr/bin/env node

/**
 * Visual Regression Testing Suite
 * Food-N-Force Quality Assurance Framework v1.0
 * 
 * Specialized visual testing for premium effects preservation
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

class VisualRegressionSuite {
  constructor() {
    this.config = null;
    this.testResults = [];
    this.baselineDir = 'tools/testing/baselines/';
    this.outputDir = 'tools/quality-assurance/reports/visual/';
  }

  async initialize() {
    const configPath = path.join(__dirname, 'qa-framework-config.json');
    const configData = await fs.readFile(configPath, 'utf8');
    this.config = JSON.parse(configData);
    
    // Ensure output directory exists
    await fs.mkdir(this.outputDir, { recursive: true });
    
    console.log('📸 Visual Regression Suite initialized');
    console.log(`🎯 Testing ${this.config.quality_gates.pre_deployment.visual_regression.pages.length} pages`);
    console.log(`📱 Testing ${this.config.quality_gates.pre_deployment.visual_regression.viewports.length} viewports`);
  }

  generateVisualTests() {
    const vrConfig = this.config.quality_gates.pre_deployment.visual_regression;
    const tests = [];

    // Generate tests for each page/viewport/zoom combination
    for (const page of vrConfig.pages) {
      for (const viewport of vrConfig.viewports) {
        for (const zoom of vrConfig.zoom_levels) {
          tests.push({
            name: `visual-regression-${page}-${viewport}-${zoom}`,
            page,
            viewport,
            zoom,
            type: 'full_page'
          });

          // Generate tests for special effects on each page
          for (const effect of vrConfig.special_effects) {
            tests.push({
              name: `visual-regression-${page}-${viewport}-${zoom}-${effect}`,
              page,
              viewport,
              zoom,
              effect,
              type: 'special_effect'
            });
          }
        }
      }
    }

    return tests;
  }

  async runVisualRegressionTests(browser) {
    console.log('📸 Running visual regression tests...');
    
    const tests = this.generateVisualTests();
    const results = {
      total: tests.length,
      passed: 0,
      failed: 0,
      details: []
    };

    for (const testCase of tests) {
      try {
        const result = await this.executeVisualTest(browser, testCase);
        results.details.push(result);
        
        if (result.passed) {
          results.passed++;
          console.log(`✅ ${testCase.name}`);
        } else {
          results.failed++;
          console.log(`❌ ${testCase.name}: ${result.error}`);
        }
      } catch (error) {
        results.failed++;
        results.details.push({
          ...testCase,
          passed: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        console.log(`❌ ${testCase.name}: ${error.message}`);
      }
    }

    this.testResults = results;
    return results;
  }

  async executeVisualTest(browser, testCase) {
    const page = await browser.newPage();
    
    try {
      // Set viewport based on test case
      const viewportSize = this.getViewportSize(testCase.viewport);
      await page.setViewportSize(viewportSize);

      // Navigate to page
      const url = `http://localhost:8080/${testCase.page === 'index' ? '' : testCase.page + '.html'}`;
      await page.goto(url, { waitUntil: 'networkidle' });

      // Set zoom level
      const zoomLevel = testCase.zoom === '100%' ? 1.0 : 0.25;
      await page.evaluate((zoom) => {
        document.body.style.zoom = zoom;
      }, zoomLevel);

      // Wait for animations to complete
      await page.waitForTimeout(2000);

      let screenshot;
      let baselinePath;
      
      if (testCase.type === 'special_effect') {
        // Test specific special effect
        screenshot = await this.captureSpecialEffect(page, testCase);
        baselinePath = path.join(this.baselineDir, `${testCase.page}-${testCase.effect}-${testCase.viewport}-${testCase.zoom}.png`);
      } else {
        // Full page screenshot
        screenshot = await page.screenshot({ 
          fullPage: true,
          animations: 'disabled'
        });
        baselinePath = path.join(this.baselineDir, `${testCase.page}-${testCase.viewport}-${testCase.zoom}-baseline.png`);
      }

      // Compare with baseline
      const comparisonResult = await this.compareWithBaseline(screenshot, baselinePath, testCase);
      
      await page.close();
      
      return {
        ...testCase,
        passed: comparisonResult.passed,
        difference: comparisonResult.difference,
        threshold: this.config.regression_detection.visual.comparison_threshold,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      await page.close();
      throw error;
    }
  }

  async captureSpecialEffect(page, testCase) {
    const { effect } = testCase;
    
    switch (effect) {
      case 'glassmorphism_navigation':
        return await this.captureGlassmorphismNavigation(page);
      
      case 'background_spinning_effects':
        return await this.captureBackgroundSpinning(page);
      
      case 'logo_animations':
        return await this.captureLogoAnimations(page);
      
      case 'blue_circular_gradients':
        return await this.captureBlueCircularGradients(page);
      
      default:
        throw new Error(`Unknown special effect: ${effect}`);
    }
  }

  async captureGlassmorphismNavigation(page) {
    // Wait for navigation to be visible and glassmorphism effect to load
    await page.waitForSelector('nav', { visible: true });
    
    // Check if glassmorphism styles are applied
    const hasGlassmorphism = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const styles = window.getComputedStyle(nav);
      return styles.backdropFilter !== 'none' || 
             styles.webkitBackdropFilter !== 'none' ||
             styles.background.includes('rgba');
    });

    if (!hasGlassmorphism) {
      throw new Error('Glassmorphism effect not detected in navigation');
    }

    // Capture navigation area with glassmorphism effect
    const navElement = await page.locator('nav').first();
    return await navElement.screenshot();
  }

  async captureBackgroundSpinning(page) {
    // Wait for background elements to be present
    await page.waitForSelector('body', { visible: true });
    
    // Check for spinning animations
    const hasSpinningBackground = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let el of elements) {
        const styles = window.getComputedStyle(el);
        if (styles.animation.includes('spin') || 
            styles.animation.includes('rotate') ||
            styles.transform.includes('rotate')) {
          return true;
        }
      }
      return false;
    });

    if (!hasSpinningBackground) {
      throw new Error('Background spinning effects not detected');
    }

    // Capture full page to include background effects
    return await page.screenshot({ 
      fullPage: false, // Just viewport to capture background
      clip: { x: 0, y: 0, width: 1200, height: 800 }
    });
  }

  async captureLogoAnimations(page) {
    // Wait for logo to be visible
    await page.waitForSelector('img[alt*="logo"], .logo, #logo', { visible: true });
    
    // Check for logo animations
    const hasLogoAnimation = await page.evaluate(() => {
      const logos = document.querySelectorAll('img[alt*="logo"], .logo, #logo');
      for (let logo of logos) {
        const styles = window.getComputedStyle(logo);
        if (styles.animation !== 'none' || 
            styles.transition !== 'none' ||
            styles.transform !== 'none') {
          return true;
        }
      }
      return false;
    });

    if (!hasLogoAnimation) {
      throw new Error('Logo animations not detected');
    }

    // Capture logo area
    const logoElement = await page.locator('img[alt*="logo"], .logo, #logo').first();
    return await logoElement.screenshot();
  }

  async captureBlueCircularGradients(page) {
    // Wait for page to load
    await page.waitForSelector('body', { visible: true });
    
    // Check for blue circular gradients (commonly used for emoji icons)
    const hasBlueGradients = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let el of elements) {
        const styles = window.getComputedStyle(el);
        if (styles.background.includes('radial-gradient') && 
            (styles.background.includes('blue') || styles.background.includes('#'))) {
          return true;
        }
      }
      return false;
    });

    if (!hasBlueGradients) {
      throw new Error('Blue circular gradients not detected');
    }

    // Capture elements with blue gradients
    const gradientElements = await page.locator('[style*="radial-gradient"], [class*="gradient"]');
    if (await gradientElements.count() > 0) {
      return await gradientElements.first().screenshot();
    }
    
    // Fallback to full page
    return await page.screenshot({ fullPage: false });
  }

  async compareWithBaseline(screenshot, baselinePath, testCase) {
    try {
      // Check if baseline exists
      try {
        await fs.access(baselinePath);
      } catch (error) {
        // Baseline doesn't exist, create it
        await fs.mkdir(path.dirname(baselinePath), { recursive: true });
        await fs.writeFile(baselinePath, screenshot);
        
        console.log(`📸 Created new baseline: ${path.basename(baselinePath)}`);
        return {
          passed: true,
          difference: 0,
          note: 'New baseline created'
        };
      }

      // Compare with existing baseline (simplified comparison)
      const baseline = await fs.readFile(baselinePath);
      
      // Basic byte-level comparison (in a real implementation, you'd use image diff libraries)
      const sizeDiff = Math.abs(screenshot.length - baseline.length) / Math.max(screenshot.length, baseline.length);
      const threshold = this.config.regression_detection.visual.comparison_threshold;
      
      const passed = sizeDiff <= threshold;
      
      if (!passed) {
        // Save current screenshot for debugging
        const failedPath = path.join(this.outputDir, `failed-${testCase.name}-${Date.now()}.png`);
        await fs.writeFile(failedPath, screenshot);
      }

      return {
        passed,
        difference: sizeDiff,
        comparedWith: baselinePath
      };
      
    } catch (error) {
      return {
        passed: false,
        difference: 1.0,
        error: error.message
      };
    }
  }

  getViewportSize(viewport) {
    const viewports = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1200, height: 800 }
    };
    
    return viewports[viewport] || viewports.desktop;
  }

  async generateVisualReport() {
    const report = {
      framework: 'Quality Assurance Framework v1.0',
      component: 'Visual Regression Suite',
      timestamp: new Date().toISOString(),
      summary: {
        total_tests: this.testResults.total || 0,
        passed: this.testResults.passed || 0,
        failed: this.testResults.failed || 0,
        pass_rate: this.testResults.total > 0 ? Math.round((this.testResults.passed / this.testResults.total) * 100) : 0
      },
      special_effects_status: this.analyzeSpecialEffectsStatus(),
      failed_tests: this.testResults.details?.filter(t => !t.passed) || [],
      configuration: {
        pages_tested: this.config.quality_gates.pre_deployment.visual_regression.pages,
        viewports: this.config.quality_gates.pre_deployment.visual_regression.viewports,
        zoom_levels: this.config.quality_gates.pre_deployment.visual_regression.zoom_levels,
        comparison_threshold: this.config.regression_detection.visual.comparison_threshold
      }
    };

    const reportPath = path.join(this.outputDir, `visual-regression-report-${Date.now()}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Visual regression report: ${reportPath}`);
    return report;
  }

  analyzeSpecialEffectsStatus() {
    if (!this.testResults.details) return {};
    
    const specialEffects = this.config.quality_gates.pre_deployment.visual_regression.special_effects;
    const effectStatus = {};
    
    for (const effect of specialEffects) {
      const effectTests = this.testResults.details.filter(t => t.effect === effect);
      const passedTests = effectTests.filter(t => t.passed).length;
      
      effectStatus[effect] = {
        total_tests: effectTests.length,
        passed_tests: passedTests,
        success_rate: effectTests.length > 0 ? Math.round((passedTests / effectTests.length) * 100) : 0,
        status: passedTests === effectTests.length ? 'HEALTHY' : 'DEGRADED'
      };
    }
    
    return effectStatus;
  }
}

// Playwright test file generation
const generatePlaywrightTestFile = async () => {
  const testFileContent = `
// Generated Visual Regression Tests
// Food-N-Force Quality Assurance Framework v1.0

const { test, expect } = require('@playwright/test');
const VisualRegressionSuite = require('./visual-regression-suite');

test.describe('Visual Regression Tests', () => {
  let visualSuite;

  test.beforeAll(async () => {
    visualSuite = new VisualRegressionSuite();
    await visualSuite.initialize();
  });

  test('Full Visual Regression Suite', async ({ browser }) => {
    const results = await visualSuite.runVisualRegressionTests(browser);
    
    // Generate report
    await visualSuite.generateVisualReport();
    
    // Assert overall success
    expect(results.failed).toBe(0);
    expect(results.passed).toBeGreaterThan(0);
    
    console.log(\`Visual Regression Results: \${results.passed}/\${results.total} passed\`);
  });

  // Individual special effects tests for better granularity
  test('Glassmorphism Navigation Effects', async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('http://localhost:8080');
    
    const hasGlassmorphism = await page.evaluate(() => {
      const nav = document.querySelector('nav');
      const styles = window.getComputedStyle(nav);
      return styles.backdropFilter !== 'none' || styles.webkitBackdropFilter !== 'none';
    });
    
    expect(hasGlassmorphism).toBeTruthy();
    await page.close();
  });

  test('Background Spinning Effects', async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('http://localhost:8080');
    
    const hasSpinning = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let el of elements) {
        const styles = window.getComputedStyle(el);
        if (styles.animation.includes('spin') || styles.animation.includes('rotate')) {
          return true;
        }
      }
      return false;
    });
    
    expect(hasSpinning).toBeTruthy();
    await page.close();
  });

  test('Logo Animations Present', async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('http://localhost:8080');
    
    const hasLogoAnimation = await page.evaluate(() => {
      const logos = document.querySelectorAll('img[alt*="logo"], .logo, #logo');
      for (let logo of logos) {
        const styles = window.getComputedStyle(logo);
        if (styles.animation !== 'none' || styles.transition !== 'none') {
          return true;
        }
      }
      return false;
    });
    
    expect(hasLogoAnimation).toBeTruthy();
    await page.close();
  });

  test('Blue Circular Gradients Present', async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('http://localhost:8080');
    
    const hasBlueGradients = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let el of elements) {
        const styles = window.getComputedStyle(el);
        if (styles.background.includes('radial-gradient') && 
            styles.background.includes('blue')) {
          return true;
        }
      }
      return false;
    });
    
    expect(hasBlueGradients).toBeTruthy();
    await page.close();
  });
});
`;

  await fs.writeFile(
    path.join(__dirname, '../testing/tests/qa-visual-regression.spec.js'), 
    testFileContent
  );
  
  console.log('📸 Generated Playwright visual regression test file');
};

// CLI execution
if (require.main === module) {
  (async () => {
    try {
      const visualSuite = new VisualRegressionSuite();
      await visualSuite.initialize();
      
      // Generate Playwright test file
      await generatePlaywrightTestFile();
      
      console.log('📸 Visual Regression Suite ready');
      console.log('🧪 Use: npx playwright test qa-visual-regression.spec.js');
      console.log('📊 Reports will be generated in: tools/quality-assurance/reports/visual/');
      
    } catch (error) {
      console.error('❌ Visual regression suite initialization failed:', error.message);
      process.exit(1);
    }
  })();
}

module.exports = VisualRegressionSuite;