const { chromium } = require('playwright');

async function testPages() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const pages = ['index.html', 'about.html', 'services.html', 'resources.html', 'impact.html', 'contact.html'];
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'desktop', width: 1920, height: 1080 }
  ];
  
  let total = 0;
  let passed = 0;
  
  for (const pageName of pages) {
    for (const viewport of viewports) {
      total++;
      try {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('http://localhost:8080/' + pageName, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(1000);
        
        const header = await page.locator('header').count();
        const nav = await page.locator('nav').count();
        const main = await page.locator('main').count();
        const footer = await page.locator('footer').count();
        
        const pageBase = pageName.split('.')[0];
        await page.screenshot({ path: pageBase + '-' + viewport.name + '.png', fullPage: true });
        
        if (header > 0 && nav > 0 && main > 0 && footer > 0) {
          passed++;
          console.log('✅ ' + pageName + ' - ' + viewport.name + ': PASSED');
        } else {
          console.log('❌ ' + pageName + ' - ' + viewport.name + ': FAILED');
        }
        
      } catch (error) {
        console.log('💥 ' + pageName + ' - ' + viewport.name + ': ERROR - ' + error.message);
      }
    }
  }
  
  await browser.close();
  
  console.log('\nTEST SUMMARY:');
  console.log('Total: ' + total);
  console.log('Passed: ' + passed);
  console.log('Success Rate: ' + ((passed / total) * 100).toFixed(1) + '%');
}

testPages().catch(console.error);
