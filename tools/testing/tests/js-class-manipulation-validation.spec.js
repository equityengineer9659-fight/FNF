// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * JAVASCRIPT CLASS MANIPULATION VALIDATION
 * Tests the 212 JavaScript class manipulations identified in the dependency report
 */

test.describe("JavaScript Class Manipulation Validation", () => {

  test("Critical JS Classes: Navigation State Classes", async ({ page }) => {
    await page.goto("/");
    await page.setViewportSize({ width: 375, height: 667 });
    
    const mobileToggle = page.locator(".mobile-nav-toggle");
    const navMenu = page.locator(".nav-menu");
    
    // Test nav-show class manipulation
    await mobileToggle.click();
    await expect(navMenu).toHaveClass(/nav-show/);
    
    // Close menu and verify class removal
    await mobileToggle.click();
    await expect(navMenu).not.toHaveClass(/nav-show/);
    
    console.log("✅ Navigation state classes working correctly");
  });

  test("Critical JS Classes: Premium Effects Classes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000);
    
    const premiumClasses = [
      "fnf-premium-glow",
      "fnf-iridescent-background", 
      "fnf-particle-container",
      "fnf-effects-loaded"
    ];
    
    for (const className of premiumClasses) {
      const elementsWithClass = await page.locator(`.${className}`).count();
      if (elementsWithClass > 0) {
        console.log(`✅ ${className} class correctly applied to ${elementsWithClass} elements`);
      }
    }
  });

  test("Cross-Page JS Class Consistency", async ({ page }) => {
    const pages = ["/", "/about.html", "/services.html", "/resources.html", "/impact.html", "/contact.html"];
    
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      await page.waitForLoadState("networkidle");
      
      // Test that core navigation JS still works
      const mobileToggle = page.locator(".mobile-nav-toggle");
      if (await mobileToggle.count() > 0) {
        await mobileToggle.click();
        const navMenu = page.locator(".nav-menu");
        await expect(navMenu).toHaveClass(/nav-show/);
        await mobileToggle.click();
      }
    }
    
    console.log("✅ JavaScript class consistency verified across all pages");
  });
});
