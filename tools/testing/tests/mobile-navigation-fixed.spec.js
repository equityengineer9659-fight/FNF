// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * FIXED MOBILE NAVIGATION SAFETY TESTS - V3.2 BASELINE VALIDATION
 * Updated to use proper baseURL configuration
 */

const pages = [
  { url: '/', title: 'Food-N-Force - Modern Solutions to Feed More, Serve Better' },
  { url: '/services.html', title: 'Our Services - Food-N-Force' },
  { url: '/about.html', title: 'About Us - Food-N-Force' },
  { url: '/impact.html', title: 'Community Impact - Food-N-Force' },
  { url: '/contact.html', title: 'Contact Us - Food-N-Force' },
  { url: '/resources.html', title: 'Resources - Food-N-Force' }
];

test.describe('BASELINE VALIDATION - Mobile Navigation Safety', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
  });

  // Critical mobile navigation functionality test
  pages.forEach(pageInfo => {
    test(`Mobile navigation works on ${pageInfo.url}`, async ({ page }) => {
      await page.goto(pageInfo.url);
      
      // Verify page loads
      await expect(page).toHaveTitle(new RegExp(pageInfo.title.split(' - ')[0]));
      
      // Find mobile elements
      const mobileToggle = page.locator('.mobile-nav-toggle');
      const navMenu = page.locator('.nav-menu');
      
      // Mobile toggle must be visible
      await expect(mobileToggle).toBeVisible();
      
      // Menu initially hidden
      await expect(navMenu).not.toHaveClass(/nav-show/);
      
      // Click to open
      await mobileToggle.click();
      
      // Menu should open
      await expect(navMenu).toHaveClass(/nav-show/);
      await expect(mobileToggle).toHaveAttribute('aria-expanded', 'true');
      
      // Close by clicking toggle again
      await mobileToggle.click();
      await expect(navMenu).not.toHaveClass(/nav-show/);
      await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
    });
  });

  test('Mobile navigation keyboard accessibility', async ({ page }) => {
    await page.goto('/');
    
    const mobileToggle = page.locator('.mobile-nav-toggle');
    const navMenu = page.locator('.nav-menu');
    
    // Tab to toggle button
    await page.keyboard.press('Tab');
    await expect(mobileToggle).toBeFocused();
    
    // Press Enter to open
    await page.keyboard.press('Enter');
    await expect(navMenu).toHaveClass(/nav-show/);
    
    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(navMenu).not.toHaveClass(/nav-show/);
  });

  test('Mobile navigation performance timing', async ({ page }) => {
    await page.goto('/');
    
    const mobileToggle = page.locator('.mobile-nav-toggle');
    const navMenu = page.locator('.nav-menu');
    
    // Measure toggle performance
    const start = Date.now();
    await mobileToggle.click();
    await expect(navMenu).toHaveClass(/nav-show/);
    const duration = Date.now() - start;
    
    // Must complete in under 300ms
    expect(duration).toBeLessThan(300);
    console.log(`Mobile navigation toggle: ${duration}ms`);
  });
});
