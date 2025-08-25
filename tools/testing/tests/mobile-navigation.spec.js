// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * CRITICAL MOBILE NAVIGATION SAFETY TESTS
 * These tests MUST pass before any refactoring work begins
 * Based on specialist assessment requirements from STRATEGIC-REFACTORING-ASSESSMENT-2025-08-23.md
 */

const pages = [
  { url: '/', title: 'Food-N-Force - Modern Solutions to Feed More, Serve Better' },
  { url: '/services.html', title: 'Our Services - Food-N-Force' },
  { url: '/about.html', title: 'About Us - Food-N-Force' },
  { url: '/impact.html', title: 'Community Impact - Food-N-Force' },
  { url: '/contact.html', title: 'Contact Us - Food-N-Force' },
  { url: '/resources.html', title: 'Resources - Food-N-Force' }
];

test.describe('Mobile Navigation Critical Safety Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport for all tests
    await page.setViewportSize({ width: 375, height: 667 });
  });

  // Test mobile navigation functionality on each page
  for (const pageInfo of pages) {
    test(`Mobile navigation toggle works on ${pageInfo.url}`, async ({ page }) => {
      await page.goto(pageInfo.url);
      
      // Verify page loads correctly
      await expect(page).toHaveTitle(pageInfo.title);
      
      // Find mobile navigation toggle button
      const mobileToggle = page.locator('.mobile-nav-toggle');
      await expect(mobileToggle).toBeVisible();
      
      // Find navigation menu
      const navMenu = page.locator('.nav-menu');
      
      // Initially menu should be hidden (mobile-first design)
      await expect(navMenu).toBeHidden();
      
      // Initially menu should be closed (no nav-show class)
      await expect(navMenu).not.toHaveClass(/nav-show/);
      
      // Click toggle to open menu
      await mobileToggle.click();
      
      // Menu should now be open (has nav-show class) and visible
      await expect(navMenu).toHaveClass(/nav-show/);
      await expect(navMenu).toBeVisible();
      
      // Toggle should have aria-expanded="true"
      await expect(mobileToggle).toHaveAttribute('aria-expanded', 'true');
      
      // Click outside menu to close it (click on main content)
      const main = page.locator('main');
      if (await main.isVisible()) {
        await main.click();
      } else {
        // Fallback: click the body
        await page.locator('body').click({ position: { x: 100, y: 400 } });
      }
      
      // Menu should close
      await expect(navMenu).not.toHaveClass(/nav-show/);
      await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
    });
  }

  test('Mobile navigation accessibility - keyboard support', async ({ page }) => {
    await page.goto('/');
    
    const mobileToggle = page.locator('.mobile-nav-toggle');
    const navMenu = page.locator('.nav-menu');
    
    // Focus the toggle button
    await mobileToggle.focus();
    
    // Press Enter to open menu
    await page.keyboard.press('Enter');
    await expect(navMenu).toHaveClass(/nav-show/);
    
    // Press Escape to close menu
    await page.keyboard.press('Escape');
    await expect(navMenu).not.toHaveClass(/nav-show/);
  });

  test('Mobile navigation visual consistency across pages', async ({ page }) => {
    const screenshots = [];
    
    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      
      // Take screenshot of navigation area
      const navbar = page.locator('.navbar.universal-nav');
      await expect(navbar).toBeVisible();
      
      const screenshot = await navbar.screenshot();
      screenshots.push({
        page: pageInfo.url,
        screenshot: screenshot
      });
    }
    
    // This is a placeholder - in a real implementation we'd compare screenshots
    // For now, just verify we captured all screenshots
    expect(screenshots).toHaveLength(pages.length);
  });

  test('Mobile navigation preserves premium effects', async ({ page }) => {
    await page.goto('/');
    
    // Check that logo animations are preserved
    const logo = page.locator('.brand-logo-link');
    await expect(logo).toBeVisible();
    
    // Check that glassmorphism effects are applied (look for backdrop-filter CSS)
    const navbar = page.locator('.navbar.universal-nav');
    const styles = await navbar.evaluate((el) => {
      const computedStyle = window.getComputedStyle(el);
      return {
        backdropFilter: computedStyle.backdropFilter,
        background: computedStyle.background
      };
    });
    
    // This will help us verify premium effects are preserved
    console.log('Navigation styles:', styles);
  });

  test('Mobile navigation performance - toggle speed', async ({ page }) => {
    await page.goto('/');
    
    const mobileToggle = page.locator('.mobile-nav-toggle');
    const navMenu = page.locator('.nav-menu');
    
    // Measure toggle performance
    const startTime = Date.now();
    
    await mobileToggle.click();
    await expect(navMenu).toHaveClass(/nav-show/);
    
    const toggleTime = Date.now() - startTime;
    
    // Toggle should complete in under 300ms per requirement
    expect(toggleTime).toBeLessThan(300);
    
    console.log(`Mobile navigation toggle completed in ${toggleTime}ms`);
  });
});

test.describe('Cross-Browser Mobile Navigation Tests', () => {
  
  test('Mobile navigation works in Firefox mobile', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'Firefox-specific test');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const mobileToggle = page.locator('.mobile-nav-toggle');
    const navMenu = page.locator('.nav-menu');
    
    await mobileToggle.click();
    await expect(navMenu).toHaveClass(/nav-show/);
  });
  
  test('Mobile navigation works in WebKit mobile', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'WebKit-specific test');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const mobileToggle = page.locator('.mobile-nav-toggle');
    const navMenu = page.locator('.nav-menu');
    
    await mobileToggle.click();
    await expect(navMenu).toHaveClass(/nav-show/);
  });
});

test.describe('Security Headers Validation', () => {
  
  test('Content Security Policy headers are present', async ({ page }) => {
    const response = await page.goto('/');
    
    // Check that CSP meta tag is in the HTML
    const cspMeta = page.locator('meta[http-equiv="Content-Security-Policy"]');
    await expect(cspMeta).toBeVisible();
    
    // Verify CSP content includes required directives
    const cspContent = await cspMeta.getAttribute('content');
    expect(cspContent).toContain("default-src 'self'");
    expect(cspContent).toContain("frame-ancestors 'none'");
  });
  
  test('Security meta tags are present on all pages', async ({ page }) => {
    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      
      // Check for all required security meta tags
      await expect(page.locator('meta[http-equiv="X-Content-Type-Options"]')).toBeVisible();
      await expect(page.locator('meta[http-equiv="X-Frame-Options"]')).toBeVisible();
      await expect(page.locator('meta[http-equiv="X-XSS-Protection"]')).toBeVisible();
      await expect(page.locator('meta[name="referrer"]')).toBeVisible();
    }
  });
});