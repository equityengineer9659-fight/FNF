/**
 * Generate og:image (1200x630) using Playwright screenshot
 * Uses the site's gradient background with Food-N-Force branding
 */
import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, '..', 'public', 'og-image.png');

const html = `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px;
    height: 630px;
    background: linear-gradient(135deg, #0f1e3a 0%, #01478a 50%, #0176d3 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Segoe UI', Arial, sans-serif;
    color: #fff;
    position: relative;
    overflow: hidden;
  }
  body::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 20% 50%, rgba(0,212,255,0.2) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(1,118,211,0.2) 0%, transparent 50%);
    pointer-events: none;
  }
  .logo {
    width: 120px;
    height: 120px;
    border-radius: 24px;
    background: linear-gradient(145deg, #1b96ff, #0b5cab);
    display: grid;
    place-items: center;
    font-family: 'Segoe UI', Arial, sans-serif;
    font-weight: 700;
    font-size: 2rem;
    color: #fff;
    text-shadow: 1px 1px 0 rgba(255,255,255,0.15), 2px 2px 6px rgba(0,0,0,0.7);
    margin-bottom: 32px;
    box-shadow: 0 0 40px rgba(27,150,255,0.4);
    position: relative;
    z-index: 1;
  }
  h1 {
    font-size: 72px;
    font-weight: 700;
    letter-spacing: -1px;
    margin-bottom: 16px;
    position: relative;
    z-index: 1;
  }
  p {
    font-size: 28px;
    color: rgba(255,255,255,0.85);
    position: relative;
    z-index: 1;
  }
  .accent {
    width: 100px;
    height: 4px;
    background: linear-gradient(90deg, #0176d3, #00d4ff);
    border-radius: 2px;
    margin: 24px 0;
    position: relative;
    z-index: 1;
  }
</style>
</head>
<body>
  <div class="logo">F-n-F</div>
  <h1>Food-N-Force</h1>
  <div class="accent"></div>
  <p>Empowering Food Banks with Digital Innovation</p>
</body>
</html>`;

async function generate() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outputPath, type: 'png' });
  await browser.close();
  console.log(`Generated: ${outputPath}`);
}

generate().catch(console.error);
