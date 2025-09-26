// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * EMERGENCY ROLLBACK CAPABILITY TESTING
 * Validates rapid revert capability during CSS deconfliction process
 */

test.describe("Emergency Rollback Capability", () => {

  test("Rollback Readiness: Critical Functionality Check", async ({ page }) => {
    await page.goto("/");
    
    // Test all critical functionality that must work for rollback decision
    const criticalChecks = await page.evaluate(() => {
      const checks = {
        navigationExists: !!document.querySelector(".navbar"),
        mobileToggleExists: !!document.querySelector(".mobile-nav-toggle"),
        logoExists: !!document.querySelector(".fnf-logo-image"),
        mainContentExists: !!document.querySelector("main"),
        cssFilesLoaded: document.styleSheets.length > 0,
        jsFilesLoaded: document.scripts.length > 0
      };
      
      return checks;
    });
    
    // All critical elements must exist for system to be considered functional
    Object.entries(criticalChecks).forEach(([check, passed]) => {
      expect(passed).toBe(true);
      console.log(`✅ ${check}: ${passed ? "PASS" : "FAIL"}`);
    });
    
    console.log("✅ System meets rollback readiness criteria");
  });

  test("Rollback Speed: Mobile Navigation Response Time", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 375, height: 667 });
    
    const mobileToggle = page.locator(".mobile-nav-toggle");
    const navMenu = page.locator(".nav-menu");
    
    // Measure response time for critical mobile navigation
    const startTime = Date.now();
    await mobileToggle.click();
    await expect(navMenu).toHaveClass(/nav-show/, { timeout: 1000 });
    const responseTime = Date.now() - startTime;
    
    // Navigation should respond within 500ms for good UX
    expect(responseTime).toBeLessThan(500);
    console.log(`✅ Mobile navigation response time: ${responseTime}ms`);
  });

  test("Rollback Validation: Cross-Browser Emergency Check", async ({ page, browserName }) => {
    await page.goto("/");
    
    // Quick cross-browser compatibility check for rollback decision
    const browserCompatibility = await page.evaluate((browser) => {
      const checks = {
        cssSupport: "CSS" in window,
        flexboxSupport: CSS.supports("display", "flex"),
        gridSupport: CSS.supports("display", "grid"),
        customPropertiesSupport: CSS.supports("--custom", "value"),
        transformSupport: CSS.supports("transform", "translateX(0)"),
        animationSupport: CSS.supports("animation", "none")
      };
      
      return { browser, checks };
    }, browserName);
    
    // Critical CSS features must be supported
    expect(browserCompatibility.checks.cssSupport).toBe(true);
    expect(browserCompatibility.checks.flexboxSupport).toBe(true);
    
    console.log(`✅ ${browserName} compatibility check passed`);
  });

  test("Rollback Decision Matrix: Performance Thresholds", async ({ page }) => {
    await page.goto("/");
    
    // Quick performance check for rollback decision
    const performanceCheck = await page.evaluate(() => {
      const navigation = performance.getEntriesByType("navigation")[0];
      const paintEntries = performance.getEntriesByType("paint");
      
      return {
        loadTime: navigation?.loadEventEnd - navigation?.fetchStart || 0,
        firstPaint: paintEntries[0]?.startTime || 0,
        firstContentfulPaint: paintEntries[1]?.startTime || 0,
        resourceCount: performance.getEntriesByType("resource").length
      };
    });
    
    // Define rollback thresholds (if exceeded, consider rollback)
    const rollbackThresholds = {
      maxLoadTime: 10000, // 10 seconds
      maxFirstPaint: 5000, // 5 seconds
      maxFirstContentfulPaint: 6000, // 6 seconds
      maxResourceCount: 50 // Reasonable resource limit
    };
    
    const rollbackNeeded = 
      performanceCheck.loadTime > rollbackThresholds.maxLoadTime ||
      performanceCheck.firstPaint > rollbackThresholds.maxFirstPaint ||
      performanceCheck.firstContentfulPaint > rollbackThresholds.maxFirstContentfulPaint ||
      performanceCheck.resourceCount > rollbackThresholds.maxResourceCount;
    
    expect(rollbackNeeded).toBe(false);
    
    console.log(`✅ Performance within rollback thresholds:`);
    console.log(`   Load time: ${performanceCheck.loadTime}ms (max: ${rollbackThresholds.maxLoadTime}ms)`);
    console.log(`   First paint: ${performanceCheck.firstPaint}ms (max: ${rollbackThresholds.maxFirstPaint}ms)`);
    console.log(`   Resources: ${performanceCheck.resourceCount} (max: ${rollbackThresholds.maxResourceCount})`);
  });

  test("Rollback Smoke Test: All Pages Functional", async ({ page }) => {
    const pages = ["/", "/about.html", "/services.html", "/resources.html", "/impact.html", "/contact.html"];
    
    for (const pageUrl of pages) {
      const startTime = Date.now();
      await page.goto(pageUrl);
      
      // Quick functionality check per page
      const pageHealth = await page.evaluate(() => {
        return {
          title: document.title,
          hasContent: document.body.innerText.length > 100,
          hasNavigation: !!document.querySelector(".navbar"),
          cssLoaded: document.styleSheets.length > 0,
          noJsErrors: !window.onerror
        };
      });
      
      const loadTime = Date.now() - startTime;
      
      // Each page must meet basic functionality for system health
      expect(pageHealth.hasContent).toBe(true);
      expect(pageHealth.hasNavigation).toBe(true);
      expect(pageHealth.cssLoaded).toBe(true);
      expect(loadTime).toBeLessThan(5000); // 5 second max per page
      
      console.log(`✅ ${pageUrl}: ${pageHealth.title} - ${loadTime}ms`);
    }
    
    console.log("✅ All pages pass rollback smoke test");
  });
});
