const { chromium } = require('playwright');

async function testSinglePage() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('http://localhost:8080/index.html');
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: '.playwright-mcp/index-desktop.png', fullPage: true });
  
  // Check basic elements
  const header = await page.locator('header').isVisible();
  const nav = await page.locator('nav').isVisible();
  const main = await page.locator('main').isVisible();
  const footer = await page.locator('footer').isVisible();
  
  console.log('Header visible:', header);
  console.log('Nav visible:', nav);
  console.log('Main visible:', main);
  console.log('Footer visible:', footer);
  
  await browser.close();
}

testSinglePage().catch(console.error);
