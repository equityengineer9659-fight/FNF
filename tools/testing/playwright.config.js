// @ts-check
import { defineConfig, devices } from '@playwright/test';

// Local: chromium-desktop only (~2 min). CI: all 9 browser/viewport combos.
const allProjects = [
  // Desktop browsers
  {
    name: 'chromium-desktop',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1920, height: 1080 },
    },
  },
  {
    name: 'firefox-desktop',
    use: {
      ...devices['Desktop Firefox'],
      viewport: { width: 1920, height: 1080 },
    },
  },
  {
    name: 'webkit-desktop',
    use: {
      ...devices['Desktop Safari'],
      viewport: { width: 1920, height: 1080 },
    },
  },

  // Tablet viewports
  {
    name: 'chromium-tablet',
    use: {
      ...devices['iPad Pro'],
    },
  },
  {
    name: 'firefox-tablet',
    use: {
      ...devices['iPad Pro'],
      browserName: 'firefox',
    },
  },
  {
    name: 'webkit-tablet',
    use: {
      ...devices['iPad Pro'],
    },
  },

  // Mobile viewports
  {
    name: 'chromium-mobile',
    use: {
      ...devices['iPhone 14 Pro Max'],
    },
  },
  {
    name: 'firefox-mobile',
    use: {
      browserName: 'firefox',
      viewport: { width: 430, height: 932 },
      hasTouch: true,
    },
  },
  {
    name: 'webkit-mobile',
    use: {
      ...devices['iPhone 14 Pro Max'],
    },
  },
];

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:4173',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Local: chromium-desktop only. CI: full matrix. Override with --project flag. */
  projects: process.env.CI ? allProjects : [allProjects[0]],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
