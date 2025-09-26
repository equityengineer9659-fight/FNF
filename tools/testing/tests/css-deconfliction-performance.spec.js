// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * CSS DECONFLICTION PERFORMANCE IMPACT MONITORING
 * Ensures deconfliction maintains performance budgets and Core Web Vitals
 */

test.describe("CSS Deconfliction Performance Impact", () => {

  test("Performance Budget: CSS Bundle Size Monitoring", async ({ page }) => {
    await page.goto("/");
    
    // Measure CSS load performance
    const cssMetrics = await page.evaluate(() => {
      const cssLinks = document.querySelectorAll("link[rel=stylesheet]");
      const performanceEntries = performance.getEntriesByType("resource");
      
      let totalCssSize = 0;
      let cssLoadTime = 0;
      
      cssLinks.forEach(link => {
        const entry = performanceEntries.find(e => e.name === link.href);
        if (entry) {
          totalCssSize += entry.transferSize || 0;
          cssLoadTime = Math.max(cssLoadTime, entry.responseEnd - entry.fetchStart);
        }
      });
      
      return {
        cssFileCount: cssLinks.length,
        totalCssSize,
        cssLoadTime,
        cssFiles: Array.from(cssLinks).map(link => link.href)
      };
    });
    
    // Validate CSS bundle size stays within budget (45KB target from CLAUDE.md)
    const cssKB = cssMetrics.totalCssSize / 1024;
    expect(cssKB).toBeLessThan(50); // 5KB buffer above 45KB budget
    
    // Validate reasonable load time
    expect(cssMetrics.cssLoadTime).toBeLessThan(1000); // 1 second max
    
    console.log(`✅ CSS Bundle: ${cssKB.toFixed(1)}KB (${cssMetrics.cssFileCount} files) loaded in ${cssMetrics.cssLoadTime}ms`);
  });

  test("Core Web Vitals: Layout Stability During Deconfliction", async ({ page }) => {
    await page.goto("/");
    
    // Monitor CLS during page load and interactions
    const clsScore = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        });
        
        observer.observe({ type: "layout-shift", buffered: true });
        
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 3000);
      });
    });
    
    // CLS should be 0.0 based on current performance (from CLAUDE.md)
    expect(clsScore).toBeLessThan(0.1); // WCAG threshold
    console.log(`✅ Cumulative Layout Shift: ${clsScore.toFixed(4)}`);
  });

  test("Animation Performance: 60fps Premium Effects", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(2000);
    
    // Test that animations maintain 60fps
    const frameRate = await page.evaluate(() => {
      return new Promise((resolve) => {
        let frameCount = 0;
        const startTime = performance.now();
        
        function countFrame() {
          frameCount++;
          if (performance.now() - startTime < 1000) {
            requestAnimationFrame(countFrame);
          } else {
            resolve(frameCount);
          }
        }
        
        requestAnimationFrame(countFrame);
      });
    });
    
    // Should achieve close to 60fps for smooth animations
    expect(frameRate).toBeGreaterThan(45); // Allow some variance
    console.log(`✅ Animation frame rate: ${frameRate} fps`);
  });

  test("Performance Across All Pages", async ({ page }) => {
    const pages = ["/", "/about.html", "/services.html", "/resources.html", "/impact.html", "/contact.html"];
    
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      
      // Basic performance check for each page
      const pageMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType("navigation")[0];
        return {
          loadTime: navigation.loadEventEnd - navigation.fetchStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          firstPaint: performance.getEntriesByType("paint")[0]?.startTime || 0
        };
      });
      
      // Validate reasonable load times
      expect(pageMetrics.loadTime).toBeLessThan(5000); // 5 second max
      expect(pageMetrics.domContentLoaded).toBeLessThan(3000); // 3 second max
      
      console.log(`✅ ${pageUrl}: Load ${pageMetrics.loadTime}ms, DOMContentLoaded ${pageMetrics.domContentLoaded}ms`);
    }
  });
});
