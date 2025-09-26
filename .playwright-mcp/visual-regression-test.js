const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runVisualRegressionTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  
  const pages = [
    'index.html',
    'about.html', 
    'services.html',
    'resources.html',
    'impact.html',
    'contact.html'
  ];
  
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];
  
  const results = {
    summary: { total: 0, passed: 0, failed: 0 },
    details: []
  };
  
  for (const pageName of pages) {
    for (const viewport of viewports) {
      results.summary.total++;
      
      try {
        const page = await context.newPage();
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        console.log(`Testing ${pageName} at ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        // Navigate to page
        await page.goto(`http://localhost:8080/${pageName}`, { 
          waitUntil: 'networkidle',
          timeout: 10000 
        });
        
        // Wait for any animations/effects to settle
        await page.waitForTimeout(2000);
        
        // Check critical elements
        const checks = await runElementChecks(page, pageName, viewport.name);
        
        // Take screenshot
        const pageBaseName = pageName.split('.')[0];
        const screenshotPath = `.playwright-mcp/${pageBaseName}-${viewport.name}-screenshot.png`;
        await page.screenshot({ 
          path: screenshotPath, 
          fullPage: true,
          animations: 'disabled'
        });
        
        results.details.push({
          page: pageName,
          viewport: viewport.name,
          status: checks.allPassed ? 'PASS' : 'FAIL',
          screenshot: screenshotPath,
          checks: checks.results,
          issues: checks.issues
        });
        
        if (checks.allPassed) {
          results.summary.passed++;
          console.log(`✅ ${pageName} - ${viewport.name}: PASSED`);
        } else {
          results.summary.failed++;
          console.log(`❌ ${pageName} - ${viewport.name}: FAILED - ${checks.issues.length} issues`);
        }
        
        await page.close();
      } catch (error) {
        results.summary.failed++;
        results.details.push({
          page: pageName,
          viewport: viewport.name,
          status: 'ERROR',
          error: error.message
        });
        console.log(`💥 ${pageName} - ${viewport.name}: ERROR - ${error.message}`);
      }
    }
  }
  
  await browser.close();
  
  // Generate report
  const reportPath = '.playwright-mcp/visual-regression-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  
  return results;
}

async function runElementChecks(page, pageName, viewport) {
  const results = [];
  const issues = [];
  
  // Check 1: Header exists and is visible
  try {
    const header = await page.locator('header').first();
    const isVisible = await header.isVisible();
    results.push({ check: 'Header visibility', status: isVisible ? 'PASS' : 'FAIL' });
    if (!isVisible) issues.push('Header not visible');
  } catch (error) {
    results.push({ check: 'Header visibility', status: 'ERROR', error: error.message });
    issues.push('Header check failed');
  }
  
  // Check 2: Navigation exists
  try {
    const nav = await page.locator('nav').first();
    const isVisible = await nav.isVisible();
    results.push({ check: 'Navigation visibility', status: isVisible ? 'PASS' : 'FAIL' });
    if (!isVisible) issues.push('Navigation not visible');
  } catch (error) {
    results.push({ check: 'Navigation visibility', status: 'ERROR', error: error.message });
    issues.push('Navigation check failed');
  }
  
  // Check 3: Footer exists and is visible
  try {
    const footer = await page.locator('footer').first();
    const isVisible = await footer.isVisible();
    results.push({ check: 'Footer visibility', status: isVisible ? 'PASS' : 'FAIL' });
    if (!isVisible) issues.push('Footer not visible');
  } catch (error) {
    results.push({ check: 'Footer visibility', status: 'ERROR', error: error.message });
    issues.push('Footer check failed');
  }
  
  // Check 4: Main content area
  try {
    const main = await page.locator('main').first();
    const isVisible = await main.isVisible();
    results.push({ check: 'Main content visibility', status: isVisible ? 'PASS' : 'FAIL' });
    if (!isVisible) issues.push('Main content not visible');
  } catch (error) {
    results.push({ check: 'Main content visibility', status: 'ERROR', error: error.message });
    issues.push('Main content check failed');
  }
  
  // Check 5: Text readability (check for color contrast)
  try {
    const textElements = await page.locator('h1, h2, h3, p, a').all();
    let readableText = 0;
    for (const element of textElements) {
      const isVisible = await element.isVisible();
      if (isVisible) {
        const color = await element.evaluate(el => window.getComputedStyle(el).color);
        // Basic check - ensure text has actual color (not transparent)
        if (color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent') {
          readableText++;
        }
      }
    }
    const hasReadableText = readableText > 0;
    results.push({ check: 'Text readability', status: hasReadableText ? 'PASS' : 'FAIL', details: `${readableText} visible text elements` });
    if (!hasReadableText) issues.push('No readable text found');
  } catch (error) {
    results.push({ check: 'Text readability', status: 'ERROR', error: error.message });
    issues.push('Text readability check failed');
  }
  
  const allPassed = results.every(r => r.status === 'PASS');
  
  return { results, issues, allPassed };
}

// Run the tests
runVisualRegressionTests().then(results => {
  console.log('\n' + '='.repeat(80));
  console.log('VISUAL REGRESSION TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${results.summary.total}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Success Rate: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`);
  
  if (results.summary.failed > 0) {
    console.log('\nFAILED TESTS:');
    results.details.filter(d => d.status !== 'PASS').forEach(detail => {
      console.log(`❌ ${detail.page} - ${detail.viewport}: ${detail.issues ? detail.issues.join(', ') : detail.error}`);
    });
  }
  
  console.log('\nReport saved to: .playwright-mcp/visual-regression-report.json');
  console.log('Screenshots saved to: .playwright-mcp/');
  console.log('='.repeat(80));
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
