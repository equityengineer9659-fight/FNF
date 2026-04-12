// @ts-check
import { test, expect } from '@playwright/test';

/**
 * DASHBOARD INTERACTIVE E2E TESTS
 *
 * Covers three highest-risk untested features:
 *   1. Food-access map-view toggle (Food Deserts / Food Insecurity / SNAP Retailers)
 *   2. Food-access Double Burden mode toggle (Total Affected / Rate Comparison)
 *   3. Food-insecurity county drill-down + back button
 *
 * Rules:
 *   - Never use networkidle — domcontentloaded + explicit waits only
 *   - Chromium-desktop only (playwright.config.js enforces this locally)
 */

// ---------------------------------------------------------------------------
// Feature 1: Food-Access Map-View Toggle
// ---------------------------------------------------------------------------

test.describe('Food-Access Map-View Toggle', () => {
  const URL = '/dashboards/food-access.html';

  test.beforeEach(async ({ page }) => {
    await page.goto(URL);
    await page.waitForLoadState('domcontentloaded');
    // Allow time for async chart init and data fetch attempts
    await page.waitForTimeout(2000);
  });

  test('Default state: Food Deserts button is active, others are not', async ({ page }) => {
    const desertsBtn = page.locator('button[data-map-view="deserts"]');
    const insecurityBtn = page.locator('button[data-map-view="insecurity"]');
    const snapBtn = page.locator('button[data-map-view="snap"]');

    await expect(desertsBtn).toHaveClass(/dashboard-metric-btn--active/);
    await expect(desertsBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(insecurityBtn).not.toHaveClass(/dashboard-metric-btn--active/);
    await expect(insecurityBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(snapBtn).not.toHaveClass(/dashboard-metric-btn--active/);
    await expect(snapBtn).toHaveAttribute('aria-pressed', 'false');
  });

  test('Default state: Food Deserts info panel visible, others hidden', async ({ page }) => {
    const desertPanel = page.locator('#info-desert-mode');
    const insecurityPanel = page.locator('#info-insecurity-mode');
    const snapPanel = page.locator('#info-snap-mode');

    await expect(desertPanel).toBeVisible();
    await expect(insecurityPanel).not.toBeVisible();
    await expect(snapPanel).not.toBeVisible();
  });

  test('Switching to Food Insecurity activates button and shows info panel', async ({ page }) => {
    await page.locator('button[data-map-view="insecurity"]').click();
    await page.waitForTimeout(500);

    const insecurityBtn = page.locator('button[data-map-view="insecurity"]');
    const desertsBtn = page.locator('button[data-map-view="deserts"]');
    const insecurityPanel = page.locator('#info-insecurity-mode');
    const desertPanel = page.locator('#info-desert-mode');

    await expect(insecurityBtn).toHaveClass(/dashboard-metric-btn--active/);
    await expect(insecurityBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(desertsBtn).not.toHaveClass(/dashboard-metric-btn--active/);
    await expect(insecurityPanel).toBeVisible();
    await expect(desertPanel).not.toBeVisible();
  });

  test('Switching to SNAP Retailers activates button and shows info panel', async ({ page }) => {
    await page.locator('button[data-map-view="snap"]').click();
    await page.waitForTimeout(500);

    const snapBtn = page.locator('button[data-map-view="snap"]');
    const snapPanel = page.locator('#info-snap-mode');
    const desertPanel = page.locator('#info-desert-mode');
    const mapContainer = page.locator('#chart-desert-map');

    await expect(snapBtn).toHaveClass(/dashboard-metric-btn--active/);
    await expect(snapBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(snapPanel).toBeVisible();
    await expect(desertPanel).not.toBeVisible();
    // Map container must still be present and sized
    const box = await mapContainer.boundingBox();
    expect(box?.width).toBeGreaterThan(0);
    expect(box?.height).toBeGreaterThan(0);
  });

  test('Cycling back to Food Deserts restores active state', async ({ page }) => {
    // Switch away then back
    await page.locator('button[data-map-view="insecurity"]').click();
    await page.waitForTimeout(300);
    await page.locator('button[data-map-view="deserts"]').click();
    await page.waitForTimeout(300);

    const desertsBtn = page.locator('button[data-map-view="deserts"]');
    const insecurityBtn = page.locator('button[data-map-view="insecurity"]');

    await expect(desertsBtn).toHaveClass(/dashboard-metric-btn--active/);
    await expect(desertsBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(insecurityBtn).not.toHaveClass(/dashboard-metric-btn--active/);
  });
});

// ---------------------------------------------------------------------------
// Feature 2: Double Burden Mode Toggle
// ---------------------------------------------------------------------------

test.describe('Food-Access Double Burden Mode Toggle', () => {
  const URL = '/dashboards/food-access.html';

  test.beforeEach(async ({ page }) => {
    await page.goto(URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('Default state: Rate Comparison (tiles) button active, tiles visible', async ({ page }) => {
    // Sync with the current default on master after PR #127 (a45f4f7) —
    // the default active Double Burden mode is Rate Comparison (tiles), not
    // Total Affected (treemap). dashboard-metric-btn--active lives on the
    // tiles button in the source HTML.
    const treemapBtn = page.locator('button[data-db-mode="treemap"]');
    const tilesBtn = page.locator('button[data-db-mode="tiles"]');
    const treemapEl = page.locator('#chart-double-burden');
    const tilesEl = page.locator('#chart-double-burden-tiles');

    await expect(tilesBtn).toHaveClass(/dashboard-metric-btn--active/);
    await expect(tilesBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(treemapBtn).not.toHaveClass(/dashboard-metric-btn--active/);
    await expect(treemapBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(tilesEl).toBeVisible();
    await expect(treemapEl).not.toBeVisible();
  });

  test('Switching to Rate Comparison shows tiles, hides treemap', async ({ page }) => {
    await page.locator('button[data-db-mode="tiles"]').click();
    await page.waitForTimeout(500);

    const tilesBtn = page.locator('button[data-db-mode="tiles"]');
    const treemapBtn = page.locator('button[data-db-mode="treemap"]');
    const treemapEl = page.locator('#chart-double-burden');
    const tilesEl = page.locator('#chart-double-burden-tiles');
    const hintEl = page.locator('#db-hint-text');

    await expect(tilesBtn).toHaveClass(/dashboard-metric-btn--active/);
    await expect(tilesBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(treemapBtn).not.toHaveClass(/dashboard-metric-btn--active/);
    await expect(tilesEl).toBeVisible();
    await expect(treemapEl).not.toBeVisible();
    await expect(hintEl).toContainText('Sorted by rate');
  });

  test('Switching back to Total Affected restores treemap', async ({ page }) => {
    // Go to tiles first
    await page.locator('button[data-db-mode="tiles"]').click();
    await page.waitForTimeout(300);
    // Switch back to treemap
    await page.locator('button[data-db-mode="treemap"]').click();
    await page.waitForTimeout(500);

    const treemapBtn = page.locator('button[data-db-mode="treemap"]');
    const treemapEl = page.locator('#chart-double-burden');
    const tilesEl = page.locator('#chart-double-burden-tiles');
    const hintEl = page.locator('#db-hint-text');

    await expect(treemapBtn).toHaveClass(/dashboard-metric-btn--active/);
    await expect(treemapEl).toBeVisible();
    await expect(tilesEl).not.toBeVisible();
    await expect(hintEl).toContainText('Click a region');
  });
});

// ---------------------------------------------------------------------------
// Feature 3: Food-Insecurity County Drill-Down + Back Button
// ---------------------------------------------------------------------------

test.describe('Food-Insecurity County Drill-Down', () => {
  const URL = '/dashboards/food-insecurity.html';

  test.beforeEach(async ({ page }) => {
    await page.goto(URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('Default state: back button hidden, state label empty', async ({ page }) => {
    const backBtn = page.locator('#map-back-btn');
    const stateLabel = page.locator('#map-state-label');

    await expect(backBtn).not.toBeVisible();
    await expect(stateLabel).toBeEmpty();
  });

  test('County search triggers drill-down: back button appears, state label set', async ({ page }) => {
    const searchInput = page.locator('input#county-search');
    await expect(searchInput).toBeVisible();

    // Click to trigger focus — the county index lazy-loads on focus via fetch('/data/county-index.json')
    await searchInput.click();
    // Wait for the local fetch to resolve before typing
    await page.waitForTimeout(1500);
    // Fill triggers the input event; index should be ready now
    await searchInput.fill('Jefferson');
    // Wait for results list to populate
    await page.waitForSelector('#county-search-results li', { timeout: 8000 });

    // Click the first result
    await page.locator('#county-search-results li').first().click();

    // Back button should now be visible
    await page.waitForSelector('#map-back-btn:not(.hidden)', { timeout: 6000 });
    const backBtn = page.locator('#map-back-btn');
    await expect(backBtn).toBeVisible();

    // State label should be non-empty
    const stateLabel = page.locator('#map-state-label');
    const labelText = await stateLabel.textContent();
    expect(labelText?.trim().length).toBeGreaterThan(0);
  });

  test('Back button resets to national view', async ({ page }) => {
    // Trigger drill-down via county search (click first to lazy-load county index)
    const searchInput2 = page.locator('input#county-search');
    await searchInput2.click();
    await page.waitForTimeout(1500);
    await searchInput2.fill('Jefferson');
    await page.waitForSelector('#county-search-results li', { timeout: 8000 });
    await page.locator('#county-search-results li').first().click();
    await page.waitForSelector('#map-back-btn:not(.hidden)', { timeout: 6000 });

    // Click back
    await page.locator('#map-back-btn').click();
    await page.waitForTimeout(500);

    const backBtn = page.locator('#map-back-btn');
    const stateLabel = page.locator('#map-state-label');
    const hint = page.locator('#chart-map + .dashboard-chart__hint');

    await expect(backBtn).not.toBeVisible();
    await expect(stateLabel).toBeEmpty();
    await expect(hint).toContainText('Hover for state details');
  });
});
