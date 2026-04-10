// @ts-check
import { test, expect } from '@playwright/test';

/**
 * DASHBOARD SMOKE E2E TESTS
 * Validates each dashboard page loads, renders charts, and has no errors.
 */

const dashboards = [
  { url: '/dashboards/executive-summary.html', name: 'Executive Summary' },
  { url: '/dashboards/food-insecurity.html', name: 'Food Insecurity' },
  { url: '/dashboards/food-access.html', name: 'Food Access' },
  { url: '/dashboards/snap-safety-net.html', name: 'SNAP Safety Net' },
  { url: '/dashboards/food-prices.html', name: 'Food Prices' },
  { url: '/dashboards/food-banks.html', name: 'Food Banks' },
  { url: '/dashboards/nonprofit-directory.html', name: 'Nonprofit Directory' },
  // P2-18: nonprofit-profile was previously absent from the smoke matrix;
  // it renders six ECharts and should be covered by the same page-load /
  // chart-rendered assertions as the rest of the dashboards.
  { url: '/dashboards/nonprofit-profile.html?ein=952036884', name: 'Nonprofit Profile' },
];

for (const dashboard of dashboards) {
  test.describe(`${dashboard.name} Dashboard`, () => {

    test('Page loads successfully', async ({ page }) => {
      const response = await page.goto(dashboard.url);
      expect(response?.status()).toBe(200);
    });

    test('Tab navigation bar is present', async ({ page }) => {
      await page.goto(dashboard.url);
      await page.waitForLoadState('domcontentloaded');

      const tabNav = page.locator('.dashboard-tabs, .dashboard-tab-nav, nav[aria-label*="dashboard" i]');
      await expect(tabNav).toBeAttached({ timeout: 5000 });
    });

    test('Dashboard cards are rendered', async ({ page }) => {
      await page.goto(dashboard.url);
      await page.waitForLoadState('domcontentloaded');

      const cards = page.locator('.dashboard-card');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });

    test('Chart containers have non-zero dimensions', async ({ page }) => {
      await page.goto(dashboard.url);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Match only .dashboard-chart divs (not map-* buttons/selects/labels)
      const chartContainers = page.locator('[id^="chart-"].dashboard-chart, .dashboard-card__chart');
      const count = await chartContainers.count();

      if (count > 0) {
        const firstChart = chartContainers.first();
        const box = await firstChart.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThan(0);
          expect(box.height).toBeGreaterThan(0);
        }
      }
    });

    test('Renders correctly at mobile viewport (375px)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(dashboard.url);
      await page.waitForLoadState('domcontentloaded');

      // Dashboard cards should be visible and not overflowing
      const cards = page.locator('.dashboard-card');
      const count = await cards.count();
      if (count > 0) {
        const firstCard = cards.first();
        const box = await firstCard.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThan(0);
          expect(box.width).toBeLessThanOrEqual(375);
        }
      }

      // No horizontal scrollbar — body should not exceed viewport width
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(375 + 1); // 1px tolerance for rounding
    });

    test('No JavaScript errors on page load', async ({ page }) => {
      const errors = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto(dashboard.url);
      await page.waitForLoadState('domcontentloaded');
      // Allow time for async chart rendering
      await page.waitForTimeout(3000);

      // Filter out expected errors (API calls that fail in test env)
      const realErrors = errors.filter(
        (e) =>
          !e.includes('Failed to fetch') &&
          !e.includes('ERR_CONNECTION_REFUSED') &&
          !e.includes('NetworkError') &&
          !e.includes('Load failed')
      );
      expect(realErrors).toEqual([]);
    });
  });
}
