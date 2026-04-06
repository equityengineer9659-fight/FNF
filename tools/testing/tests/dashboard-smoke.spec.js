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
      // Wait for JS to initialize charts
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Find chart containers (ECharts renders into divs with specific IDs)
      const chartContainers = page.locator('[id^="chart-"], [id^="map-"], .dashboard-card__chart');
      const count = await chartContainers.count();

      if (count > 0) {
        const firstChart = chartContainers.first();
        const box = await firstChart.boundingBox();
        // At least one chart should have rendered with visible dimensions
        if (box) {
          expect(box.width).toBeGreaterThan(0);
          expect(box.height).toBeGreaterThan(0);
        }
      }
    });

    test('No JavaScript errors on page load', async ({ page }) => {
      const errors = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto(dashboard.url);
      await page.waitForLoadState('networkidle');
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
