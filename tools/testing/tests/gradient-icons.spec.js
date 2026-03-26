import { test, expect } from '@playwright/test';

const PAGES_TO_TEST = [
  { path: '/index.html', name: 'index', expectedIcons: 6 },
  { path: '/services.html', name: 'services', expectedIcons: 6 },
  { path: '/resources.html', name: 'resources', expectedIcons: 6 },
  { path: '/about.html', name: 'about', expectedIcons: 8 },
  { path: '/impact.html', name: 'impact', expectedIcons: 0 },
  { path: '/contact.html', name: 'contact', expectedIcons: 0 }
];

for (const pageConfig of PAGES_TO_TEST) {
  test.describe(pageConfig.name + ' page - Gradient Icon System', () => {

    test('should load page successfully', async ({ page }) => {
      const response = await page.goto(pageConfig.path);
      expect(response.status()).toBe(200);
    });

    if (pageConfig.expectedIcons > 0) {
      test('should find correct number of icon elements', async ({ page }) => {
        await page.goto(pageConfig.path);
        await page.waitForLoadState('networkidle');

        const iconCount = await page.locator('[data-icon]').count();
        expect(iconCount).toBe(pageConfig.expectedIcons);
      });

      test('should hydrate all icons with gradient class', async ({ page }) => {
        await page.goto(pageConfig.path);
        await page.waitForLoadState('networkidle');

        const hydratedCount = await page.locator('.fnf-icon-gradient').count();
        expect(hydratedCount).toBe(pageConfig.expectedIcons);
      });

      test('should have accessible content in all icons (SVG or glyph fallback)', async ({ page }) => {
        await page.goto(pageConfig.path);
        await page.waitForLoadState('networkidle');

        // Icons use progressive enhancement: SVGs in HTML are primary,
        // .fnf-icon-glyph spans are created only as JS fallback when no SVG exists.
        // Check that each icon has either an SVG with <title> or a glyph span.
        const icons = page.locator('.fnf-icon-gradient');
        const count = await icons.count();
        expect(count).toBe(pageConfig.expectedIcons);

        for (let i = 0; i < count; i++) {
          const icon = icons.nth(i);
          const hasSvg = await icon.locator('svg').count() > 0;
          const hasGlyph = await icon.locator('.fnf-icon-glyph').count() > 0;
          expect(hasSvg || hasGlyph).toBe(true);
        }
      });

      test('should have aria-label on all icons', async ({ page }) => {
        await page.goto(pageConfig.path);
        await page.waitForLoadState('networkidle');

        const iconsWithAriaLabel = await page.locator('.fnf-icon-gradient[aria-label]').count();
        expect(iconsWithAriaLabel).toBe(pageConfig.expectedIcons);
      });

      test('should have role=img on all icons', async ({ page }) => {
        await page.goto(pageConfig.path);
        await page.waitForLoadState('networkidle');

        const iconsWithRole = await page.locator('.fnf-icon-gradient[role="img"]').count();
        expect(iconsWithRole).toBe(pageConfig.expectedIcons);
      });

      test('should have accessible text in all icons (SVG title or SR text)', async ({ page }) => {
        await page.goto(pageConfig.path);
        await page.waitForLoadState('networkidle');

        // Each icon should have either SVG <title> or .slds-assistive-text
        const icons = page.locator('.fnf-icon-gradient');
        const count = await icons.count();

        for (let i = 0; i < count; i++) {
          const icon = icons.nth(i);
          const hasSvgTitle = await icon.locator('svg title').count() > 0;
          const hasSrText = await icon.locator('.slds-assistive-text').count() > 0;
          expect(hasSvgTitle || hasSrText).toBe(true);
        }
      });

      test('should have gradient background on icons', async ({ page }) => {
        await page.goto(pageConfig.path);
        await page.waitForLoadState('networkidle');

        const firstIcon = page.locator('.fnf-icon-gradient').first();
        const background = await firstIcon.evaluate(el => window.getComputedStyle(el).background);

        expect(background).toContain('gradient');
      });

      test('should have proper sizing on icons', async ({ page }) => {
        await page.goto(pageConfig.path);
        await page.waitForLoadState('networkidle');

        const firstIcon = page.locator('.fnf-icon-gradient').first();
        const box = await firstIcon.boundingBox();

        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
      });

      test('should capture full page screenshot at 100% zoom', async ({ page }) => {
        await page.goto(pageConfig.path);
        await page.waitForLoadState('networkidle');

        await page.screenshot({
          path: 'test-results/' + pageConfig.name + '-100-fullpage.png',
          fullPage: true
        });
      });

      test('should capture full page screenshot at 25% zoom', async ({ page, context }) => {
        const zoomedPage = await context.newPage();
        await zoomedPage.goto(pageConfig.path);
        await zoomedPage.waitForLoadState('networkidle');

        await zoomedPage.evaluate(() => {
          document.body.style.zoom = '0.25';
        });

        await zoomedPage.screenshot({
          path: 'test-results/' + pageConfig.name + '-25-fullpage.png',
          fullPage: true
        });

        await zoomedPage.close();
      });
    }
  });
}
