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
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);

        const iconCount = await page.locator('[data-icon]').count();
        expect(iconCount).toBe(pageConfig.expectedIcons);
      });

      test('should hydrate all icons with gradient class', async ({ page }) => {
        await page.goto(pageConfig.path);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);

        const hydratedCount = await page.locator('.fnf-icon-gradient').count();
        expect(hydratedCount).toBe(pageConfig.expectedIcons);
      });

      test('should have accessible content in all icons (SVG or glyph fallback)', async ({ page }) => {
        await page.goto(pageConfig.path);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);
        // Wait for JS icon hydration to complete
        await page.waitForSelector('.fnf-icon-gradient[role="img"]', { timeout: 5000 });

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
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);

        const iconsWithAriaLabel = await page.locator('.fnf-icon-gradient[aria-label]').count();
        expect(iconsWithAriaLabel).toBe(pageConfig.expectedIcons);
      });

      test('should have role=img on all icons', async ({ page }) => {
        await page.goto(pageConfig.path);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);
        await page.waitForSelector('.fnf-icon-gradient[role="img"]', { timeout: 5000 });

        const iconsWithRole = await page.locator('.fnf-icon-gradient[role="img"]').count();
        expect(iconsWithRole).toBe(pageConfig.expectedIcons);
      });

      test('should have accessible text in all icons (SVG title or SR text)', async ({ page }) => {
        await page.goto(pageConfig.path);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);

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
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);
        await page.waitForSelector('.fnf-icon-gradient', { timeout: 5000 });

        const firstIcon = page.locator('.fnf-icon-gradient').first();
        const background = await firstIcon.evaluate(el => window.getComputedStyle(el).background);

        expect(background).toContain('gradient');
      });

      test('should have proper sizing on icons', async ({ page }) => {
        await page.goto(pageConfig.path);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);

        const firstIcon = page.locator('.fnf-icon-gradient').first();
        const box = await firstIcon.boundingBox();

        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
      });

      test('should capture full page screenshot at 100% zoom', async ({ page }) => {
        await page.goto(pageConfig.path);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: 'test-results/' + pageConfig.name + '-100-fullpage.png',
          fullPage: true
        });
      });

      test('should capture full page screenshot at 25% zoom', async ({ page, browserName }) => {
        // CSS zoom is non-standard — Firefox doesn't support it
        test.skip(browserName === 'firefox', 'Firefox does not support CSS zoom');
        // WebKit full-page screenshots at 25% zoom exceed max pixel dimensions (32767px limit)
        test.skip(browserName === 'webkit', 'WebKit 25% zoom screenshots exceed pixel limits');
        // Mobile/tablet full-page screenshots at 25% zoom also exceed pixel limits
        const projectName = test.info().project.name;
        test.skip(projectName.includes('mobile') || projectName.includes('tablet'), 'Zoom screenshots exceed pixel limits on small viewports');

        await page.goto(pageConfig.path);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);

        await page.evaluate(() => {
          document.body.style.zoom = '0.25';
        });

        await page.screenshot({
          path: 'test-results/' + pageConfig.name + '-25-fullpage.png',
          fullPage: true
        });
      });
    }
  });
}
