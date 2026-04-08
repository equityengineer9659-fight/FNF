// @ts-check
import { test, expect } from '@playwright/test';

/**
 * CONTACT FORM E2E TESTS
 * Tests form fields, validation, loading state, and honeypot accessibility.
 * Does NOT test actual server submission (would need mock backend).
 */

test.describe('Contact Form', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/contact.html');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Form fields are visible and accessible', async ({ page }) => {
    // Core form fields should be present
    await expect(page.locator('#firstName')).toBeVisible();
    await expect(page.locator('#lastName')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#message')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Labels should be associated with inputs
    const firstNameLabel = page.locator('label[for="firstName"]');
    await expect(firstNameLabel).toBeAttached();
    const emailLabel = page.locator('label[for="email"]');
    await expect(emailLabel).toBeAttached();
  });

  test('Submit button shows correct default text', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toHaveText('Send Message');
    await expect(submitBtn).toBeEnabled();
  });

  test('Honeypot field is hidden but present in DOM', async ({ page }) => {
    // Bot trap field should exist inside a visually-hidden container
    const honeypot = page.locator('input[name="bot-field"]');
    await expect(honeypot).toBeAttached();

    // Verify it's inside the visually-hidden wrapper (clip-rect hiding, not display:none)
    const parent = page.locator('.fnf-visually-hidden');
    await expect(parent).toBeAttached();
    const clip = await parent.evaluate(el => getComputedStyle(el).clip);
    expect(clip).toBe('rect(0px, 0px, 0px, 0px)');
  });

  test('Form has required field validation', async ({ page }) => {
    // Clear a required field and try to submit
    const emailInput = page.locator('#email');
    await emailInput.fill('');

    // Click submit — browser validation should prevent submission
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();

    // Form should still be visible (not submitted)
    await expect(page.locator('#contact-form, form')).toBeVisible();
  });

  test('Email field validates format', async ({ page }) => {
    const emailInput = page.locator('#email');

    // Fill with invalid email
    await emailInput.fill('not-an-email');

    // HTML5 validation should mark it invalid
    const isInvalid = await emailInput.evaluate(
      (el) => !/** @type {HTMLInputElement} */ (el).checkValidity()
    );
    expect(isInvalid).toBe(true);
  });

  test('Service dropdown has options', async ({ page }) => {
    const select = page.locator('#service, select[name="service"]');
    if (await select.isVisible()) {
      const optionCount = await select.locator('option').count();
      expect(optionCount).toBeGreaterThan(1);
    }
  });

  test('No console errors on page load', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Firefox returns JSHandle@object for object args — skip unresolvable entries
        if (!text.includes('JSHandle@')) errors.push(text);
      }
    });

    await page.goto('/contact.html');
    await page.waitForLoadState('networkidle');

    // Filter out expected errors (network requests to local API, canvas init on mobile)
    const realErrors = errors.filter(
      (e) =>
        !e.includes('Failed to fetch') &&
        !e.includes('ERR_CONNECTION_REFUSED') &&
        !e.includes('Particle system failed to initialize')
    );
    expect(realErrors).toEqual([]);
  });
});
