// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * CRITICAL NAVIGATION SMOKE TEST - P0 SAFETY VALIDATION
 * This test MUST pass for feature branch validation workflow
 * Tests the consolidated mobile navigation system from Phase 1
 */

const pages = [
  { url: '/', title: 'Food-N-Force - Modern Solutions to Feed More, Serve Better' },
  { url: '/services.html', title: 'Our Services - Food-N-Force' },
  { url: '/about.html', title: 'About Us - Food-N-Force' },
  { url: '/impact.html', title: 'Community Impact - Food-N-Force' },
  { url: '/contact.html', title: 'Contact Us - Food-N-Force' },
  { url: '/resources.html', title: 'Resources - Food-N-Force' }
];

test.describe('Critical Navigation Smoke Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport - this is where mobile navigation should be visible
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('Critical navigation smoke test - Mobile toggle functionality', async ({ page }) => {
    // Test the most critical mobile navigation functionality
    await page.goto('/');
    
    // Verify page loads
    await expect(page).toHaveTitle(/Food-N-Force/);
    
    // Mobile navigation elements must exist
    const mobileToggle = page.locator('.mobile-nav-toggle');
    const navMenu = page.locator('.nav-menu');
    
    // P0 Safety Check: Elements exist
    await expect(mobileToggle).toBeVisible({ timeout: 5000 });
    await expect(navMenu).toBeVisible({ timeout: 5000 });
    
    // P0 Safety Check: Initial state is correct
    await expect(navMenu).not.toHaveClass(/nav-show/);
    await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
    
    // P0 Safety Check: Toggle opens menu
    await mobileToggle.click();
    await expect(navMenu).toHaveClass(/nav-show/, { timeout: 1000 });
    await expect(mobileToggle).toHaveAttribute('aria-expanded', 'true');
    
    // P0 Safety Check: Toggle closes menu
    await mobileToggle.click();
    await expect(navMenu).not.toHaveClass(/nav-show/, { timeout: 1000 });
    await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
    
    console.log('✅ Critical navigation smoke test PASSED - Mobile navigation is functional');
  });

  test('Critical navigation smoke test - Cross-page consistency', async ({ page }) => {
    // Test that mobile navigation works consistently across all pages
    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);
      
      // Verify mobile nav exists on every page
      const mobileToggle = page.locator('.mobile-nav-toggle');
      const navMenu = page.locator('.nav-menu');
      
      await expect(mobileToggle).toBeVisible({ timeout: 3000 });
      await expect(navMenu).toBeVisible({ timeout: 3000 });
      
      // Quick toggle test
      await mobileToggle.click();
      await expect(navMenu).toHaveClass(/nav-show/, { timeout: 1000 });
      
      // Close for next iteration
      await mobileToggle.click();
      await expect(navMenu).not.toHaveClass(/nav-show/, { timeout: 1000 });
    }
    
    console.log('✅ Critical navigation smoke test PASSED - All pages have functional mobile navigation');
  });

  test('Critical navigation smoke test - Accessibility basics', async ({ page }) => {
    await page.goto('/');
    
    const mobileToggle = page.locator('.mobile-nav-toggle');
    const navMenu = page.locator('.nav-menu');
    
    // ARIA attributes must be present for P0 accessibility
    await expect(mobileToggle).toHaveAttribute('aria-expanded');
    await expect(mobileToggle).toHaveAttribute('aria-controls');
    await expect(navMenu).toHaveAttribute('aria-hidden');
    
    // Keyboard navigation must work
    await page.keyboard.press('Tab'); // Focus the toggle
    await page.keyboard.press('Enter'); // Open menu
    await expect(navMenu).toHaveClass(/nav-show/);
    
    await page.keyboard.press('Escape'); // Close menu
    await expect(navMenu).not.toHaveClass(/nav-show/);
    
    console.log('✅ Critical navigation smoke test PASSED - Basic accessibility requirements met');
  });
});
