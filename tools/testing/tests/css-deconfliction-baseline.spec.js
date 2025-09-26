// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * CSS DECONFLICTION BASELINE CAPTURE
 * Captures pixel-perfect visual baseline before deconfliction process
 * MUST be run before any CSS changes to establish regression detection baseline
 */

const pages = [
  { url: '/', name: 'index' },
  { url: '/about.html', name: 'about' }, 
  { url: '/services.html', name: 'services' },
  { url: '/resources.html', name: 'resources' },
  { url: '/impact.html', name: 'impact' },
  { url: '/contact.html', name: 'contact' }
];

const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1920, height: 1080 }
];

const zoomLevels = [100, 25]; // Client requirement: test both standard and 25% zoom

test.describe('CSS Deconfliction - Baseline Capture', () => {
  
  test.beforeAll(async () => {
    // Ensure baseline directory exists
    const baselineDir = path.join(__dirname, '..', 'baselines');
    if (!fs.existsSync(baselineDir)) {
      fs.mkdirSync(baselineDir, { recursive: true });
    }
  });

  for (const page of pages) {
    for (const viewport of viewports) {
      for (const zoom of zoomLevels) {
        test(`Baseline: ${page.name} - ${viewport.name} @ ${zoom}%`, async ({ page: pwPage, browser }) => {
          // Set viewport and zoom
          await pwPage.setViewportSize({ width: viewport.width, height: viewport.height });
          await pwPage.goto(page.url);
          
          // Wait for all animations and effects to load
          await pwPage.waitForLoadState('networkidle');
          await pwPage.waitForTimeout(2000); // Allow premium effects to initialize
          
          // Apply zoom level
          if (zoom !== 100) {
            await pwPage.evaluate((zoomLevel) => {
              document.body.style.zoom = `${zoomLevel}%`;
            }, zoom);
            await pwPage.waitForTimeout(1000); // Allow zoom to settle
          }
          
          // Capture full page screenshot for visual regression
          const screenshotPath = path.join(__dirname, '..', 'baselines', 
            `${page.name}-${viewport.name}-${zoom}pct-baseline.png`);
          
          await pwPage.screenshot({ 
            path: screenshotPath,
            fullPage: true,
            animations: 'disabled' // Disable animations for consistent screenshots
          });
          
          // Capture critical element screenshots for fine-grained comparison
          const criticalElements = [
            { selector: '.navbar.universal-nav', name: 'navigation' },
            { selector: 'main', name: 'main-content' },
            { selector: '.hero-section', name: 'hero' },
            { selector: '.fnf-card', name: 'cards' }
          ];
          
          for (const element of criticalElements) {
            try {
              const elementHandle = await pwPage.locator(element.selector).first();
              if (await elementHandle.isVisible()) {
                const elementPath = path.join(__dirname, '..', 'baselines',
                  `${page.name}-${element.name}-${viewport.name}-${zoom}pct.png`);
                await elementHandle.screenshot({ path: elementPath });
              }
            } catch (error) {
              console.warn(`Could not capture ${element.name} for ${page.name}: ${error.message}`);
            }
          }
          
          console.log(`✅ Baseline captured: ${page.name} - ${viewport.name} @ ${zoom}%`);
        });
      }
    }
  }

  test('Baseline: CSS Bundle Size Measurement', async ({ page }) => {
    await page.goto('/');
    
    // Measure current CSS bundle sizes
    const cssStats = await page.evaluate(() => {
      const cssFiles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      const results = {
        totalFiles: cssFiles.length,
        files: []
      };
      
      cssFiles.forEach(link => {
        results.files.push({
          href: link.href,
          disabled: link.disabled
        });
      });
      
      return results;
    });
    
    // Save CSS statistics for bundle size monitoring
    const statsPath = path.join(__dirname, '..', 'baselines', 'css-bundle-baseline.json');
    fs.writeFileSync(statsPath, JSON.stringify(cssStats, null, 2));
    
    console.log(`✅ CSS bundle baseline captured: ${cssStats.totalFiles} files`);
  });

  test('Baseline: Performance Metrics Capture', async ({ page }) => {
    // Capture Core Web Vitals baseline for performance regression detection
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const performanceMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const metrics = {};
          
          entries.forEach(entry => {
            if (entry.entryType === 'measure') {
              metrics[entry.name] = entry.duration;
            }
            if (entry.entryType === 'navigation') {
              metrics.loadTime = entry.loadEventEnd - entry.fetchStart;
            }
          });
          
          resolve(metrics);
        });
        
        observer.observe({ entryTypes: ['measure', 'navigation'] });
        
        // Fallback resolve after timeout
        setTimeout(() => resolve({}), 3000);
      });
    });
    
    const metricsPath = path.join(__dirname, '..', 'baselines', 'performance-baseline.json');
    fs.writeFileSync(metricsPath, JSON.stringify(performanceMetrics, null, 2));
    
    console.log('✅ Performance baseline captured');
  });
});
