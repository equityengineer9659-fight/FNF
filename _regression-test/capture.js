import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = process.argv[2] || 'before';

const pages = [
  { name: 'index', url: 'http://localhost:4173/' },
  { name: 'about', url: 'http://localhost:4173/about.html' },
  { name: 'services', url: 'http://localhost:4173/services.html' },
  { name: 'resources', url: 'http://localhost:4173/resources.html' },
  { name: 'impact', url: 'http://localhost:4173/impact.html' },
  { name: 'contact', url: 'http://localhost:4173/contact.html' },
];

const viewports = [
  { name: 'desktop', width: 1280, height: 900 },
  { name: 'mobile', width: 375, height: 812 },
];

async function capture() {
  const browser = await chromium.launch({ headless: true });

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    for (const pg of pages) {
      await page.goto(pg.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);
      const filePath = path.join(__dirname, outputDir, `${pg.name}-${vp.name}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`Captured: ${pg.name}-${vp.name}.png`);
    }

    await context.close();
  }

  await browser.close();
  console.log(`\nAll screenshots saved to _regression-test/${outputDir}/`);
}

capture().catch(console.error);
