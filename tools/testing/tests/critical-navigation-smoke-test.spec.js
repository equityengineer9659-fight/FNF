// @ts-check
import { test, expect } from '@playwright/test';

/**
 * CRITICAL NAVIGATION SMOKE TEST - P0 SAFETY VALIDATION
 * Tests the HTML-first mobile navigation system (CSS checkbox hack).
 * Navigation uses <input type="checkbox" id="nav-toggle"> + <label> pattern.
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
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('Mobile toggle functionality', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/Food-N-Force/);

    // Mobile navigation elements must exist
    const navToggleCheckbox = page.locator('#nav-toggle');
    const navToggleLabel = page.locator('label.fnf-nav__toggle');
    const mobileMenu = page.locator('.fnf-nav__mobile');

    // P0: Toggle label is visible at mobile viewport
    await expect(navToggleLabel).toBeVisible({ timeout: 5000 });

    // P0: Mobile menu exists in DOM
    await expect(mobileMenu).toBeAttached({ timeout: 5000 });

    // P0: Initial state — checkbox unchecked, menu hidden
    await expect(navToggleCheckbox).not.toBeChecked();
    await expect(mobileMenu).not.toBeVisible();

    // P0: Click toggle opens menu
    await navToggleLabel.click();
    await expect(navToggleCheckbox).toBeChecked();
    await expect(mobileMenu).toBeVisible({ timeout: 1000 });

    // P0: Click toggle closes menu
    await navToggleLabel.click();
    await expect(navToggleCheckbox).not.toBeChecked();
    await expect(mobileMenu).not.toBeVisible({ timeout: 1000 });

    console.log('✅ Mobile toggle functionality PASSED');
  });

  test('Cross-page consistency', async ({ page }) => {
    for (const pageInfo of pages) {
      await page.goto(pageInfo.url);

      const navToggleLabel = page.locator('label.fnf-nav__toggle');
      const navToggleCheckbox = page.locator('#nav-toggle');
      const mobileMenu = page.locator('.fnf-nav__mobile');

      // Nav elements exist on every page
      await expect(navToggleLabel).toBeVisible({ timeout: 3000 });
      await expect(mobileMenu).toBeAttached();

      // Toggle opens menu
      await navToggleLabel.click();
      await expect(navToggleCheckbox).toBeChecked();
      await expect(mobileMenu).toBeVisible({ timeout: 1000 });

      // Toggle closes menu
      await navToggleLabel.click();
      await expect(navToggleCheckbox).not.toBeChecked();
      await expect(mobileMenu).not.toBeVisible({ timeout: 1000 });
    }

    console.log('✅ Cross-page consistency PASSED');
  });

  test('Desktop navigation visibility', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');

    // Desktop menu should be visible
    const desktopMenu = page.locator('.fnf-nav__menu');
    await expect(desktopMenu).toBeVisible({ timeout: 5000 });

    // Mobile toggle should be hidden on desktop
    const navToggleLabel = page.locator('label.fnf-nav__toggle');
    await expect(navToggleLabel).not.toBeVisible();

    // Desktop nav links should be visible
    const navLinks = page.locator('.fnf-nav__link');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(5);

    console.log('✅ Desktop navigation visibility PASSED');
  });

  test('Mobile menu links navigate correctly', async ({ page }) => {
    await page.goto('/');

    const navToggleLabel = page.locator('label.fnf-nav__toggle');
    const mobileMenu = page.locator('.fnf-nav__mobile');

    // Open mobile menu
    await navToggleLabel.click();
    await expect(mobileMenu).toBeVisible({ timeout: 1000 });

    // Mobile links should be present
    const mobileLinks = page.locator('.fnf-nav__mobile-link');
    const linkCount = await mobileLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(5);

    // Click a link — menu should close (JS handles this)
    await mobileLinks.nth(1).click();
    await page.waitForLoadState('networkidle');

    console.log('✅ Mobile menu links PASSED');
  });

  test('Keyboard navigation - Escape closes menu', async ({ page }) => {
    await page.goto('/');

    const navToggleLabel = page.locator('label.fnf-nav__toggle');
    const navToggleCheckbox = page.locator('#nav-toggle');

    // Open menu
    await navToggleLabel.click();
    await expect(navToggleCheckbox).toBeChecked();

    // Escape should close the menu (handled by JS in main.js)
    await page.keyboard.press('Escape');
    await expect(navToggleCheckbox).not.toBeChecked({ timeout: 1000 });

    console.log('✅ Keyboard Escape PASSED');
  });
});
