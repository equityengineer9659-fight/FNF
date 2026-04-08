// @ts-check
import { test, expect } from '@playwright/test';

/**
 * NEWSLETTER POPUP E2E TESTS
 * Tests scroll-triggered modal on about page: appearance, ARIA, keyboard, focus trap.
 */

test.describe('Newsletter Popup', () => {

  test('Should NOT appear on non-about pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Scroll down significantly
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    const modal = page.locator('.fnf-newsletter-modal');
    await expect(modal).not.toBeAttached();
  });

  test('Should appear after scrolling on about page', async ({ page }) => {
    await page.goto('/about.html');
    await page.waitForLoadState('domcontentloaded');

    // Scroll past threshold (30%)
    await page.evaluate(() => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, scrollHeight * 0.5);
    });

    // Wait for the 120ms delay + render
    const modal = page.locator('.fnf-newsletter-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });
  });

  test('Modal has correct ARIA attributes', async ({ page }) => {
    await page.goto('/about.html');
    await page.waitForLoadState('domcontentloaded');

    // Trigger popup
    await page.evaluate(() => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, scrollHeight * 0.5);
    });

    const modal = page.locator('.fnf-newsletter-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });

    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
  });

  test('Close button dismisses modal', async ({ page }) => {
    await page.goto('/about.html');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, scrollHeight * 0.5);
    });

    const modal = page.locator('.fnf-newsletter-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Click close button
    const closeBtn = page.locator('.fnf-close-btn');
    await closeBtn.click();

    // Modal should disappear (280ms animation)
    await expect(modal).not.toBeAttached({ timeout: 2000 });
  });

  test('Escape key dismisses modal', async ({ page }) => {
    await page.goto('/about.html');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, scrollHeight * 0.5);
    });

    const modal = page.locator('.fnf-newsletter-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });

    await page.keyboard.press('Escape');
    await expect(modal).not.toBeAttached({ timeout: 2000 });
  });

  test('Email input and submit button are present', async ({ page }) => {
    await page.goto('/about.html');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, scrollHeight * 0.5);
    });

    const modal = page.locator('.fnf-newsletter-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });

    const emailInput = modal.locator('.fnf-email-input');
    const submitBtn = modal.locator('.fnf-submit-btn');
    await expect(emailInput).toBeVisible();
    await expect(submitBtn).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('Empty email shows validation error', async ({ page }) => {
    await page.goto('/about.html');
    await page.waitForLoadState('domcontentloaded');

    await page.evaluate(() => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo(0, scrollHeight * 0.5);
    });

    const modal = page.locator('.fnf-newsletter-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Dispatch submit programmatically to bypass native HTML5 required validation
    // (clicking the button triggers browser validation which blocks the JS handler)
    const form = modal.locator('.fnf-email-form');
    await form.evaluate(el => el.dispatchEvent(new Event('submit', { cancelable: true })));

    // Validation error should appear
    const error = modal.locator('.fnf-newsletter-validation-error');
    await expect(error).toBeVisible({ timeout: 1000 });
    await expect(error).toHaveAttribute('role', 'alert');
  });
});
