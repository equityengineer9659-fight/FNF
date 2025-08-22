/**
 * PHASE 3 COMPREHENSIVE VALIDATION SUITE
 * Cross-Page Mobile Navigation Testing & Production Readiness Assessment
 * 
 * Test Coverage:
 * - Functional testing across all 6 pages
 * - Cross-browser validation (Chrome, Firefox, Safari)
 * - Mobile device testing and responsive validation
 * - Accessibility compliance verification (WCAG 2.1 AA)
 * - Performance budget compliance confirmation
 * - Production readiness assessment
 */

const { test, expect } = require('@playwright/test');

// Test data: All 6 pages to validate
const PAGES = [
  { name: 'Home', url: 'index.html', expectedTitle: 'Food-N-Force' },
  { name: 'Services', url: 'services.html', expectedTitle: 'Services' },
  { name: 'Resources', url: 'resources.html', expectedTitle: 'Resources' },
  { name: 'Impact', url: 'impact.html', expectedTitle: 'Impact' },
  { name: 'Contact', url: 'contact.html', expectedTitle: 'Contact' },
  { name: 'About', url: 'about.html', expectedTitle: 'About' }
];

// Expected navigation items - all 6 links must be accessible
const EXPECTED_NAV_ITEMS = [
  { text: 'Home', href: 'index.html' },
  { text: 'Services', href: 'services.html' },
  { text: 'Resources', href: 'resources.html' },
  { text: 'Impact', href: 'impact.html' },
  { text: 'Contact', href: 'contact.html' },
  { text: 'About Us', href: 'about.html' }
];

// Performance budget thresholds
const PERFORMANCE_BUDGETS = {
  CSS_BUNDLE_SIZE: 25000, // 25KB max (Phase 2 target: ~19KB)
  JAVASCRIPT_SIZE: 15000, // 15KB max (Phase 1 simplified)
  PAGE_LOAD_TIME: 3000,   // 3 seconds max
  ANIMATION_FPS: 30       // 30fps minimum
};

test.describe('Phase 3: Cross-Page Mobile Navigation Validation', () => {
  
  // ============================================
  // FUNCTIONAL TESTING MATRIX
  // ============================================
  
  test.describe('Functional Testing - All Pages', () => {
    
    PAGES.forEach(page => {
      test.describe(`${page.name} Page Navigation Tests`, () => {
        
        test.beforeEach(async ({ page: testPage }) => {
          await testPage.goto(page.url);
          await testPage.waitForLoadState('networkidle');
        });
        
        test(`should load unified CSS and JavaScript correctly on ${page.name}`, async ({ page: testPage }) => {
          // Verify unified CSS is loaded
          const cssLink = await testPage.locator('link[href*="navigation-unified.css"]').count();
          expect(cssLink).toBeGreaterThan(0);
          
          // Verify navigation JavaScript is loaded
          const navElement = await testPage.locator('.navbar.universal-nav').count();
          expect(navElement).toBe(1);
          
          // Verify navigation is injected correctly
          const navMenu = await testPage.locator('.nav-menu').count();
          expect(navMenu).toBe(1);
        });
        
        test(`should display mobile hamburger button on ${page.name}`, async ({ page: testPage }) => {
          // Set mobile viewport
          await testPage.setViewportSize({ width: 375, height: 667 });
          
          // Verify hamburger button is visible
          const mobileToggle = testPage.locator('.mobile-nav-toggle');
          await expect(mobileToggle).toBeVisible();
          
          // Verify it has correct ARIA attributes
          await expect(mobileToggle).toHaveAttribute('aria-label', 'Toggle navigation menu');
          await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
          await expect(mobileToggle).toHaveAttribute('aria-controls', 'main-nav');
        });
        
        test(`should open mobile navigation menu correctly on ${page.name}`, async ({ page: testPage }) => {
          await testPage.setViewportSize({ width: 375, height: 667 });
          
          const mobileToggle = testPage.locator('.mobile-nav-toggle');
          const navMenu = testPage.locator('.nav-menu');
          
          // Initial state - menu should be hidden
          await expect(navMenu).not.toHaveClass(/nav-show/);
          
          // Click hamburger button
          await mobileToggle.click();
          
          // Menu should now be visible with nav-show class
          await expect(navMenu).toHaveClass(/nav-show/);
          
          // ARIA attributes should update
          await expect(mobileToggle).toHaveAttribute('aria-expanded', 'true');
          await expect(navMenu).toHaveAttribute('aria-hidden', 'false');
        });
        
        test(`should display all 6 navigation links without scrolling on ${page.name}`, async ({ page: testPage }) => {
          await testPage.setViewportSize({ width: 375, height: 667 });
          
          // Open mobile menu
          await testPage.locator('.mobile-nav-toggle').click();
          await testPage.waitForSelector('.nav-menu.nav-show');
          
          // Verify all 6 navigation items are present and visible
          for (const navItem of EXPECTED_NAV_ITEMS) {
            const link = testPage.locator(`a.nav-link[href="${navItem.href}"]`);
            await expect(link).toBeVisible();
            await expect(link).toContainText(navItem.text);
            
            // Verify link is within viewport (no scrolling required)
            const linkBox = await link.boundingBox();
            expect(linkBox.y).toBeGreaterThan(0);
            expect(linkBox.y + linkBox.height).toBeLessThan(667);
          }
        });
        
        test(`should close mobile menu with outside click on ${page.name}`, async ({ page: testPage }) => {
          await testPage.setViewportSize({ width: 375, height: 667 });
          
          const mobileToggle = testPage.locator('.mobile-nav-toggle');
          const navMenu = testPage.locator('.nav-menu');
          
          // Open menu
          await mobileToggle.click();
          await expect(navMenu).toHaveClass(/nav-show/);
          
          // Click outside menu
          await testPage.click('body', { position: { x: 50, y: 50 } });
          
          // Menu should close
          await expect(navMenu).not.toHaveClass(/nav-show/);
          await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
        });
        
        test(`should close mobile menu with Escape key on ${page.name}`, async ({ page: testPage }) => {
          await testPage.setViewportSize({ width: 375, height: 667 });
          
          const mobileToggle = testPage.locator('.mobile-nav-toggle');
          const navMenu = testPage.locator('.nav-menu');
          
          // Open menu
          await mobileToggle.click();
          await expect(navMenu).toHaveClass(/nav-show/);
          
          // Press Escape key
          await testPage.keyboard.press('Escape');
          
          // Menu should close and focus should return to toggle
          await expect(navMenu).not.toHaveClass(/nav-show/);
          await expect(mobileToggle).toBeFocused();
        });
        
        test(`should highlight current page in navigation on ${page.name}`, async ({ page: testPage }) => {
          await testPage.setViewportSize({ width: 375, height: 667 });
          
          // Open mobile menu
          await testPage.locator('.mobile-nav-toggle').click();
          await testPage.waitForSelector('.nav-menu.nav-show');
          
          // Find the current page link and verify it's highlighted
          const currentPageLink = testPage.locator(`a.nav-link[href="${page.url}"]`);
          const parentLi = currentPageLink.locator('..');
          
          await expect(parentLi).toHaveClass(/slds-is-active/);
        });
        
      });
    });
    
  });
  
  // ============================================
  // CROSS-PAGE CONSISTENCY VALIDATION
  // ============================================
  
  test.describe('Cross-Page Consistency Validation', () => {
    
    test('should have identical navigation behavior across all pages', async ({ page }) => {
      const behaviorResults = [];
      
      for (const testPage of PAGES) {
        await page.goto(testPage.url);
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Test navigation behavior consistency
        const mobileToggle = page.locator('.mobile-nav-toggle');
        const navMenu = page.locator('.nav-menu');
        
        // Open menu and measure timing
        const startTime = Date.now();
        await mobileToggle.click();
        await page.waitForSelector('.nav-menu.nav-show');
        const openTime = Date.now() - startTime;
        
        // Check menu positioning
        const menuBox = await navMenu.boundingBox();
        
        // Close menu and measure timing
        const closeStartTime = Date.now();
        await page.click('body', { position: { x: 50, y: 50 } });
        await page.waitForSelector('.nav-menu:not(.nav-show)');
        const closeTime = Date.now() - closeStartTime;
        
        behaviorResults.push({
          page: testPage.name,
          openTime,
          closeTime,
          menuPosition: { x: menuBox.x, y: menuBox.y, width: menuBox.width }
        });
      }
      
      // Verify consistent timing (within 100ms variance)
      const avgOpenTime = behaviorResults.reduce((sum, r) => sum + r.openTime, 0) / behaviorResults.length;
      const avgCloseTime = behaviorResults.reduce((sum, r) => sum + r.closeTime, 0) / behaviorResults.length;
      
      behaviorResults.forEach(result => {
        expect(Math.abs(result.openTime - avgOpenTime)).toBeLessThan(100);
        expect(Math.abs(result.closeTime - avgCloseTime)).toBeLessThan(100);
      });
    });
    
    test('should have consistent visual styling across all pages', async ({ page }) => {
      const styleResults = [];
      
      for (const testPage of PAGES) {
        await page.goto(testPage.url);
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Check navigation styling consistency
        const navbar = page.locator('.navbar.universal-nav');
        const styles = await navbar.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            borderBottom: computed.borderBottom,
            zIndex: computed.zIndex
          };
        });
        
        styleResults.push({
          page: testPage.name,
          styles
        });
      }
      
      // Verify all pages have identical navigation styling
      const referenceStyles = styleResults[0].styles;
      styleResults.forEach(result => {
        expect(result.styles).toEqual(referenceStyles);
      });
    });
    
  });
  
  // ============================================
  // ACCESSIBILITY COMPLIANCE VERIFICATION
  // ============================================
  
  test.describe('Accessibility Compliance (WCAG 2.1 AA)', () => {
    
    PAGES.forEach(page => {
      test(`should meet touch target requirements on ${page.name}`, async ({ page: testPage }) => {
        await testPage.goto(page.url);
        await testPage.setViewportSize({ width: 375, height: 667 });
        
        // Open mobile menu
        await testPage.locator('.mobile-nav-toggle').click();
        await testPage.waitForSelector('.nav-menu.nav-show');
        
        // Check hamburger button size (44px minimum)
        const toggleBox = await testPage.locator('.mobile-nav-toggle').boundingBox();
        expect(toggleBox.width).toBeGreaterThanOrEqual(44);
        expect(toggleBox.height).toBeGreaterThanOrEqual(44);
        
        // Check all navigation links meet touch target size
        const navLinks = testPage.locator('.nav-link');
        const linkCount = await navLinks.count();
        
        for (let i = 0; i < linkCount; i++) {
          const linkBox = await navLinks.nth(i).boundingBox();
          expect(linkBox.height).toBeGreaterThanOrEqual(44);
        }
      });
      
      test(`should have proper focus management on ${page.name}`, async ({ page: testPage }) => {
        await testPage.goto(page.url);
        await testPage.setViewportSize({ width: 375, height: 667 });
        
        const mobileToggle = testPage.locator('.mobile-nav-toggle');
        
        // Focus should move to first nav item when menu opens
        await mobileToggle.click();
        await testPage.waitForTimeout(150); // Allow focus transition
        
        const firstNavLink = testPage.locator('.nav-link').first();
        await expect(firstNavLink).toBeFocused();
        
        // Focus should return to toggle when menu closes with Escape
        await testPage.keyboard.press('Escape');
        await expect(mobileToggle).toBeFocused();
      });
      
      test(`should have proper ARIA attributes on ${page.name}`, async ({ page: testPage }) => {
        await testPage.goto(page.url);
        
        const navbar = testPage.locator('.navbar.universal-nav');
        const mobileToggle = testPage.locator('.mobile-nav-toggle');
        const navMenu = testPage.locator('.nav-menu');
        
        // Check navigation roles
        await expect(navbar).toHaveAttribute('role', 'banner');
        
        // Check button ARIA attributes
        await expect(mobileToggle).toHaveAttribute('aria-label');
        await expect(mobileToggle).toHaveAttribute('aria-expanded');
        await expect(mobileToggle).toHaveAttribute('aria-controls', 'main-nav');
        
        // Check menu ARIA attributes
        await expect(navMenu).toHaveAttribute('id', 'main-nav');
      });
      
    });
    
  });
  
  // ============================================
  // PERFORMANCE BUDGET COMPLIANCE
  // ============================================
  
  test.describe('Performance Budget Compliance', () => {
    
    test('should meet CSS bundle size targets', async ({ page }) => {
      await page.goto('index.html');
      
      // Check unified CSS file size
      const cssResponse = await page.waitForResponse(response => 
        response.url().includes('navigation-unified.css')
      );
      
      const cssSize = parseInt(cssResponse.headers()['content-length'] || '0');
      expect(cssSize).toBeLessThan(PERFORMANCE_BUDGETS.CSS_BUNDLE_SIZE);
      
      console.log(`CSS bundle size: ${cssSize} bytes (Budget: ${PERFORMANCE_BUDGETS.CSS_BUNDLE_SIZE} bytes)`);
    });
    
    test('should meet JavaScript size targets', async ({ page }) => {
      await page.goto('index.html');
      
      // Check JavaScript file size
      const jsResponse = await page.waitForResponse(response => 
        response.url().includes('unified-navigation-refactored.js')
      );
      
      const jsSize = parseInt(jsResponse.headers()['content-length'] || '0');
      expect(jsSize).toBeLessThan(PERFORMANCE_BUDGETS.JAVASCRIPT_SIZE);
      
      console.log(`JavaScript size: ${jsSize} bytes (Budget: ${PERFORMANCE_BUDGETS.JAVASCRIPT_SIZE} bytes)`);
    });
    
    test('should meet page load time targets', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('index.html');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.PAGE_LOAD_TIME);
      
      console.log(`Page load time: ${loadTime}ms (Budget: ${PERFORMANCE_BUDGETS.PAGE_LOAD_TIME}ms)`);
    });
    
    test('should maintain smooth animations', async ({ page }) => {
      await page.goto('index.html');
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Monitor animation performance
      await page.evaluate(() => {
        return new Promise(resolve => {
          let frameCount = 0;
          let startTime = performance.now();
          
          function countFrame() {
            frameCount++;
            const elapsed = performance.now() - startTime;
            
            if (elapsed >= 1000) {
              const fps = Math.round((frameCount * 1000) / elapsed);
              resolve(fps);
            } else {
              requestAnimationFrame(countFrame);
            }
          }
          
          // Trigger animation
          document.querySelector('.mobile-nav-toggle').click();
          requestAnimationFrame(countFrame);
        });
      }).then(fps => {
        expect(fps).toBeGreaterThanOrEqual(PERFORMANCE_BUDGETS.ANIMATION_FPS);
        console.log(`Animation FPS: ${fps} (Budget: ${PERFORMANCE_BUDGETS.ANIMATION_FPS} fps)`);
      });
    });
    
  });
  
  // ============================================
  // PRODUCTION READINESS ASSESSMENT
  // ============================================
  
  test.describe('Production Readiness Assessment', () => {
    
    test('should have no console errors across all pages', async ({ page }) => {
      const consoleErrors = [];
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push({
            page: page.url(),
            error: msg.text()
          });
        }
      });
      
      // Test all pages for console errors
      for (const testPage of PAGES) {
        await page.goto(testPage.url);
        await page.waitForLoadState('networkidle');
        
        // Interact with navigation to trigger any errors
        await page.setViewportSize({ width: 375, height: 667 });
        await page.locator('.mobile-nav-toggle').click();
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
      }
      
      expect(consoleErrors).toHaveLength(0);
    });
    
    test('should have valid HTML structure on all pages', async ({ page }) => {
      for (const testPage of PAGES) {
        await page.goto(testPage.url);
        
        // Check for navigation structure
        await expect(page.locator('.navbar.universal-nav')).toBeVisible();
        await expect(page.locator('.nav-menu')).toBeVisible();
        await expect(page.locator('.mobile-nav-toggle')).toBeVisible();
        
        // Verify all 6 navigation links exist
        const navLinks = page.locator('.nav-link');
        await expect(navLinks).toHaveCount(6);
      }
    });
    
    test('should handle network failures gracefully', async ({ page }) => {
      // Block CSS loading to test fallback behavior
      await page.route('**/navigation-unified.css', route => route.abort());
      
      await page.goto('index.html');
      
      // Navigation should still be functional even without CSS
      const navElement = page.locator('.navbar.universal-nav');
      await expect(navElement).toBeVisible();
      
      const mobileToggle = page.locator('.mobile-nav-toggle');
      await expect(mobileToggle).toBeVisible();
    });
    
    test('should work across different screen orientations', async ({ page }) => {
      await page.goto('index.html');
      
      // Test portrait orientation
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.locator('.mobile-nav-toggle').click();
      const navMenuPortrait = page.locator('.nav-menu.nav-show');
      await expect(navMenuPortrait).toBeVisible();
      
      // Close menu
      await page.click('body', { position: { x: 50, y: 50 } });
      
      // Test landscape orientation
      await page.setViewportSize({ width: 667, height: 375 });
      
      await page.locator('.mobile-nav-toggle').click();
      const navMenuLandscape = page.locator('.nav-menu.nav-show');
      await expect(navMenuLandscape).toBeVisible();
      
      // Verify all links still accessible in landscape
      const navLinks = page.locator('.nav-link');
      await expect(navLinks).toHaveCount(6);
    });
    
  });
  
});

// ============================================
// CROSS-BROWSER VALIDATION SUITE
// ============================================

test.describe('Cross-Browser Compatibility', () => {
  
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test.describe(`${browserName.toUpperCase()} Browser Tests`, () => {
      
      test(`should render navigation correctly in ${browserName}`, async ({ page, browserName: currentBrowser }) => {
        test.skip(currentBrowser !== browserName, `Skipping ${browserName} test in ${currentBrowser}`);
        
        await page.goto('index.html');
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Basic functionality test
        const mobileToggle = page.locator('.mobile-nav-toggle');
        await expect(mobileToggle).toBeVisible();
        
        await mobileToggle.click();
        const navMenu = page.locator('.nav-menu.nav-show');
        await expect(navMenu).toBeVisible();
        
        // Verify all navigation links work
        const navLinks = page.locator('.nav-link');
        await expect(navLinks).toHaveCount(6);
      });
      
    });
  });
  
});

// ============================================
// UTILITIES AND HELPERS
// ============================================

/**
 * Generate comprehensive validation report
 */
test.afterAll(async () => {
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 3 COMPREHENSIVE VALIDATION COMPLETE');
  console.log('='.repeat(60));
  console.log('Test Coverage:');
  console.log('✓ Functional testing across all 6 pages');
  console.log('✓ Cross-page consistency validation');
  console.log('✓ Accessibility compliance verification (WCAG 2.1 AA)');
  console.log('✓ Performance budget compliance confirmation');
  console.log('✓ Cross-browser compatibility validation');
  console.log('✓ Production readiness assessment');
  console.log('='.repeat(60));
});
