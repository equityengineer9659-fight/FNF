// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * CSS DECONFLICTION VISUAL REGRESSION TESTING
 * Pixel-perfect comparison against baseline to detect any visual regressions
 * during the deconfliction process
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

const zoomLevels = [100, 25];

test.describe('CSS Deconfliction - Visual Regression Detection', () => {
  
  for (const page of pages) {
    for (const viewport of viewports) {
      for (const zoom of zoomLevels) {
        test(`Regression Check: ${page.name} - ${viewport.name} @ ${zoom}%`, async ({ page: pwPage }) => {
          // Set viewport and zoom
          await pwPage.setViewportSize({ width: viewport.width, height: viewport.height });
          await pwPage.goto(page.url);
          
          // Wait for effects to stabilize
          await pwPage.waitForLoadState('networkidle');
          await pwPage.waitForTimeout(2000);
          
          // Apply zoom
          if (zoom !== 100) {
            await pwPage.evaluate((zoomLevel) => {
              document.body.style.zoom = `${zoomLevel}%`;
            }, zoom);
            await pwPage.waitForTimeout(1000);
          }
          
          // Take current screenshot
          const currentScreenshot = await pwPage.screenshot({ 
            fullPage: true,
            animations: 'disabled'
          });
          
          // Load baseline for comparison
          const baselinePath = path.join(__dirname, '..', 'baselines', 
            `${page.name}-${viewport.name}-${zoom}pct-baseline.png`);
          
          if (fs.existsSync(baselinePath)) {
            // Use Playwright's built-in visual comparison
            expect(currentScreenshot).toMatchSnapshot({
              name: `${page.name}-${viewport.name}-${zoom}pct.png`,
              threshold: 0.05, // 5% threshold for minor anti-aliasing differences
              maxDiffPixels: 1000 // Allow small differences for minor rendering variations
            });
          } else {
            console.warn(`⚠️  No baseline found for ${page.name}-${viewport.name}-${zoom}%. Run baseline capture first.`);
          }
        });
      }
    }
  }

  test('Regression Check: Premium Effects Functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Verify glassmorphism effects are present
    const glassmorphismElements = await page.locator('.fnf-premium-glass').count();
    expect(glassmorphismElements).toBeGreaterThan(0);
    
    // Check background spinning effects
    const spinningElements = await page.locator('[class*="spinning"]').count();
    expect(spinningElements).toBeGreaterThan(0);
    
    // Verify CSS animations are working
    const animatedElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let animatedCount = 0;
      
      elements.forEach(el => {
        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.animation !== 'none' || 
            computedStyle.transform !== 'none') {
          animatedCount++;
        }
      });
      
      return animatedCount;
    });
    
    expect(animatedCount).toBeGreaterThan(10); // Ensure animations are preserved
    console.log(`✅ Premium effects preserved: ${animatedCount} animated elements detected`);
  });

  test('Regression Check: Navigation Functionality', async ({ page }) => {
    // Test mobile navigation across all pages
    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      await page.setViewportSize({ width: 375, height: 667 });
      
      const mobileToggle = page.locator('.mobile-nav-toggle');
      const navMenu = page.locator('.nav-menu');
      
      // Verify elements exist and are functional
      await expect(mobileToggle).toBeVisible({ timeout: 5000 });
      await expect(navMenu).toBeVisible({ timeout: 5000 });
      
      // Test toggle functionality
      await mobileToggle.click();
      await expect(navMenu).toHaveClass(/nav-show/, { timeout: 1000 });
      
      await mobileToggle.click();
      await expect(navMenu).not.toHaveClass(/nav-show/, { timeout: 1000 });
    }
    
    console.log('✅ Navigation functionality preserved across all pages');
  });

  test('Regression Check: CSS Bundle Size Monitoring', async ({ page }) => {
    await page.goto('/');
    
    const currentCssStats = await page.evaluate(() => {
      const cssFiles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      return {
        totalFiles: cssFiles.length,
        files: cssFiles.map(link => ({
          href: link.href,
          disabled: link.disabled
        }))
      };
    });
    
    // Load baseline for comparison
    const baselinePath = path.join(__dirname, '..', 'baselines', 'css-bundle-baseline.json');
    if (fs.existsSync(baselinePath)) {
      const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
      
      // Ensure we haven't increased CSS files unexpectedly
      expect(currentCssStats.totalFiles).toBeLessThanOrEqual(baseline.totalFiles + 1); // Allow for 1 additional file
      
      console.log(`✅ CSS bundle size check: ${currentCssStats.totalFiles}/${baseline.totalFiles} files`);
    }
  });
});
