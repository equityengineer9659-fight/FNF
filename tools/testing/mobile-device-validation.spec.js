/**
 * MOBILE DEVICE VALIDATION SUITE
 * Specialized testing for mobile navigation across different device configurations
 * 
 * Focus Areas:
 * - Device-specific responsive breakpoints
 * - Touch interaction validation
 * - Screen orientation testing
 * - Viewport-specific layout verification
 */

const { test, expect, devices } = require('@playwright/test');

// Device configurations for comprehensive testing
const MOBILE_DEVICES = [
  {
    name: 'iPhone 14 Pro Max',
    device: devices['iPhone 14 Pro Max'],
    viewport: { width: 430, height: 932 },
    userAgent: devices['iPhone 14 Pro Max'].userAgent
  },
  {
    name: 'iPhone SE',
    device: devices['iPhone SE'],
    viewport: { width: 375, height: 667 },
    userAgent: devices['iPhone SE'].userAgent
  },
  {
    name: 'Samsung Galaxy S21',
    device: devices['Galaxy S21'],
    viewport: { width: 384, height: 854 },
    userAgent: devices['Galaxy S21'].userAgent
  },
  {
    name: 'Pixel 5',
    device: devices['Pixel 5'],
    viewport: { width: 393, height: 851 },
    userAgent: devices['Pixel 5'].userAgent
  },
  {
    name: 'Small Mobile (320px)',
    device: null,
    viewport: { width: 320, height: 568 },
    userAgent: devices['iPhone SE'].userAgent
  }
];

const PAGES_TO_TEST = [
  'index.html',
  'about.html', 
  'services.html',
  'resources.html',
  'impact.html',
  'contact.html'
];

test.describe('Mobile Device Navigation Validation', () => {
  
  // ============================================
  // DEVICE-SPECIFIC RESPONSIVE TESTING
  // ============================================
  
  MOBILE_DEVICES.forEach(deviceConfig => {
    test.describe(`${deviceConfig.name} Device Tests`, () => {
      
      test.beforeEach(async ({ page, context }) => {
        // Configure device-specific settings
        if (deviceConfig.device) {
          await context.addInitScript(() => {
            Object.defineProperty(navigator, 'userAgent', {
              value: deviceConfig.userAgent,
              configurable: true
            });
          });
        }
        
        await page.setViewportSize(deviceConfig.viewport);
      });
      
      PAGES_TO_TEST.forEach(pageUrl => {
        test(`should display navigation correctly on ${pageUrl} - ${deviceConfig.name}`, async ({ page }) => {
          await page.goto(pageUrl);
          await page.waitForLoadState('networkidle');
          
          // Verify navigation is injected and visible
          const navbar = page.locator('.navbar.universal-nav');
          await expect(navbar).toBeVisible();
          
          // Verify mobile toggle is visible and properly sized
          const mobileToggle = page.locator('.mobile-nav-toggle');
          await expect(mobileToggle).toBeVisible();
          
          const toggleBox = await mobileToggle.boundingBox();
          expect(toggleBox.width).toBeGreaterThanOrEqual(44); // WCAG requirement
          expect(toggleBox.height).toBeGreaterThanOrEqual(44);
          
          // Verify navigation layout fits viewport
          const navbarBox = await navbar.boundingBox();
          expect(navbarBox.width).toBeLessThanOrEqual(deviceConfig.viewport.width);
        });
        
        test(`should handle touch interactions on ${pageUrl} - ${deviceConfig.name}`, async ({ page }) => {
          await page.goto(pageUrl);
          await page.waitForLoadState('networkidle');
          
          const mobileToggle = page.locator('.mobile-nav-toggle');
          const navMenu = page.locator('.nav-menu');
          
          // Simulate touch interaction
          await mobileToggle.tap();
          
          // Verify menu opens
          await expect(navMenu).toHaveClass(/nav-show/);
          
          // Test touch on navigation links
          const firstNavLink = page.locator('.nav-link').first();
          const linkBox = await firstNavLink.boundingBox();
          
          // Verify touch target is adequate for the device
          expect(linkBox.height).toBeGreaterThanOrEqual(44);
          expect(linkBox.width).toBeGreaterThan(100); // Minimum touch area
          
          // Test touch outside to close
          await page.tap('body', { position: { x: 50, y: 50 } });
          await expect(navMenu).not.toHaveClass(/nav-show/);
        });
        
      });
      
      test(`should maintain layout stability across orientation changes`, async ({ page }) => {
        await page.goto('index.html');
        
        // Test portrait orientation
        await page.setViewportSize(deviceConfig.viewport);
        
        let navbar = page.locator('.navbar.universal-nav');
        let mobileToggle = page.locator('.mobile-nav-toggle');
        
        await expect(navbar).toBeVisible();
        await expect(mobileToggle).toBeVisible();
        
        // Open menu in portrait
        await mobileToggle.click();
        let navMenu = page.locator('.nav-menu.nav-show');
        await expect(navMenu).toBeVisible();
        
        // Switch to landscape
        const landscapeViewport = {
          width: deviceConfig.viewport.height,
          height: deviceConfig.viewport.width
        };
        await page.setViewportSize(landscapeViewport);
        
        // Verify navigation still works in landscape
        navbar = page.locator('.navbar.universal-nav');
        await expect(navbar).toBeVisible();
        
        // If still in mobile view (width < 769px), test mobile navigation
        if (landscapeViewport.width <= 768) {
          mobileToggle = page.locator('.mobile-nav-toggle');
          await expect(mobileToggle).toBeVisible();
          
          // Menu should still be open or re-openable
          navMenu = page.locator('.nav-menu');
          if (!await navMenu.isVisible() || !await navMenu.evaluate(el => el.classList.contains('nav-show'))) {
            await mobileToggle.click();
          }
          
          await expect(page.locator('.nav-menu.nav-show')).toBeVisible();
          
          // Verify all 6 links still fit in landscape
          const navLinks = page.locator('.nav-link');
          await expect(navLinks).toHaveCount(6);
          
          for (let i = 0; i < 6; i++) {
            const link = navLinks.nth(i);
            await expect(link).toBeVisible();
            
            const linkBox = await link.boundingBox();
            expect(linkBox.y + linkBox.height).toBeLessThan(landscapeViewport.height);
          }
        }
      });
      
    });
  });
  
  // ============================================
  // RESPONSIVE BREAKPOINT VALIDATION
  // ============================================
  
  test.describe('Responsive Breakpoint Testing', () => {
    
    const BREAKPOINTS = [
      { name: 'Mobile Small', width: 320, height: 568 },
      { name: 'Mobile Medium', width: 375, height: 667 },
      { name: 'Mobile Large', width: 414, height: 896 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Tablet Landscape', width: 1024, height: 768 }
    ];
    
    BREAKPOINTS.forEach(breakpoint => {
      test(`should handle ${breakpoint.name} breakpoint (${breakpoint.width}x${breakpoint.height})`, async ({ page }) => {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        await page.goto('index.html');
        await page.waitForLoadState('networkidle');
        
        const navbar = page.locator('.navbar.universal-nav');
        await expect(navbar).toBeVisible();
        
        if (breakpoint.width <= 768) {
          // Mobile/Tablet Portrait - should show mobile navigation
          const mobileToggle = page.locator('.mobile-nav-toggle');
          await expect(mobileToggle).toBeVisible();
          
          // Test navigation functionality
          await mobileToggle.click();
          const navMenu = page.locator('.nav-menu.nav-show');
          await expect(navMenu).toBeVisible();
          
          // Verify menu fits within viewport
          const menuBox = await navMenu.boundingBox();
          expect(menuBox.width).toBeLessThanOrEqual(breakpoint.width);
          expect(menuBox.y + menuBox.height).toBeLessThanOrEqual(breakpoint.height);
          
        } else {
          // Desktop/Tablet Landscape - should show desktop navigation
          const mobileToggle = page.locator('.mobile-nav-toggle');
          await expect(mobileToggle).not.toBeVisible();
          
          // Desktop navigation should be visible
          const navMenu = page.locator('.nav-menu');
          await expect(navMenu).toBeVisible();
        }
      });
    });
    
  });
  
  // ============================================
  // TOUCH INTERACTION VALIDATION
  // ============================================
  
  test.describe('Touch Interaction Validation', () => {
    
    test('should handle rapid tap sequences', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('index.html');
      
      const mobileToggle = page.locator('.mobile-nav-toggle');
      const navMenu = page.locator('.nav-menu');
      
      // Rapid taps to test debouncing
      for (let i = 0; i < 5; i++) {
        await mobileToggle.tap();
        await page.waitForTimeout(50);
      }
      
      // Should end up in a consistent state (either open or closed)
      const isOpen = await navMenu.evaluate(el => el.classList.contains('nav-show'));
      const ariaExpanded = await mobileToggle.getAttribute('aria-expanded');
      
      expect(ariaExpanded).toBe(isOpen ? 'true' : 'false');
    });
    
    test('should handle touch gestures on navigation links', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('index.html');
      
      const mobileToggle = page.locator('.mobile-nav-toggle');
      await mobileToggle.tap();
      
      const navLinks = page.locator('.nav-link');
      const linkCount = await navLinks.count();
      
      // Test touch on each navigation link
      for (let i = 0; i < linkCount; i++) {
        const link = navLinks.nth(i);
        
        // Simulate hover state with touch
        await link.hover();
        
        // Verify hover styles are applied
        const styles = await link.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            transform: computed.transform
          };
        });
        
        // Should have hover effects
        expect(styles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      }
    });
    
    test('should handle edge swipe gestures', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('index.html');
      
      const mobileToggle = page.locator('.mobile-nav-toggle');
      const navMenu = page.locator('.nav-menu');
      
      await mobileToggle.tap();
      await expect(navMenu).toHaveClass(/nav-show/);
      
      // Simulate swipe gesture to close menu
      await page.touchscreen.tap(200, 300);
      await page.touchscreen.tap(50, 300);
      
      // Menu should handle the gesture appropriately
      // (Either stay open if swipe didn't trigger close, or close if it did)
      const finalState = await navMenu.evaluate(el => el.classList.contains('nav-show'));
      const ariaExpanded = await mobileToggle.getAttribute('aria-expanded');
      
      expect(ariaExpanded).toBe(finalState ? 'true' : 'false');
    });
    
  });
  
  // ============================================
  // PERFORMANCE ON MOBILE DEVICES
  // ============================================
  
  test.describe('Mobile Performance Validation', () => {
    
    test('should maintain smooth scrolling with navigation open', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('index.html');
      
      const mobileToggle = page.locator('.mobile-nav-toggle');
      await mobileToggle.click();
      
      // Test scrolling performance with menu open
      const scrollPerformance = await page.evaluate(() => {
        return new Promise(resolve => {
          let frameCount = 0;
          let startTime = performance.now();
          
          function measureFrames() {
            frameCount++;
            
            if (frameCount < 30) {
              requestAnimationFrame(measureFrames);
            } else {
              const endTime = performance.now();
              const fps = (frameCount * 1000) / (endTime - startTime);
              resolve(Math.round(fps));
            }
          }
          
          // Trigger scroll while measuring
          window.scrollBy(0, 10);
          requestAnimationFrame(measureFrames);
        });
      });
      
      expect(scrollPerformance).toBeGreaterThan(25); // Minimum acceptable FPS
    });
    
    test('should not cause memory leaks on repeated interactions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('index.html');
      
      const mobileToggle = page.locator('.mobile-nav-toggle');
      
      // Get initial memory baseline
      const initialMemory = await page.evaluate(() => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      });
      
      // Perform 50 open/close cycles
      for (let i = 0; i < 50; i++) {
        await mobileToggle.click(); // Open
        await page.waitForTimeout(10);
        await page.click('body', { position: { x: 50, y: 50 } }); // Close
        await page.waitForTimeout(10);
      }
      
      // Check final memory usage
      const finalMemory = await page.evaluate(() => {
        if (performance.memory) {
          return performance.memory.usedJSHeapSize;
        }
        return 0;
      });
      
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        const memoryIncreasePercent = (memoryIncrease / initialMemory) * 100;
        
        // Memory increase should be reasonable (less than 50%)
        expect(memoryIncreasePercent).toBeLessThan(50);
        
        console.log(`Memory usage: ${initialMemory} -> ${finalMemory} (+${memoryIncreasePercent.toFixed(1)}%)`);
      }
    });
    
  });
  
});

// ============================================
// DEVICE-SPECIFIC EDGE CASES
// ============================================

test.describe('Device-Specific Edge Cases', () => {
  
  test('should handle iOS Safari specific behaviors', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'iOS Safari specific test');
    
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('index.html');
    
    // iOS Safari specific touch behavior
    const mobileToggle = page.locator('.mobile-nav-toggle');
    
    // Test touch delay behavior
    await mobileToggle.tap();
    
    const navMenu = page.locator('.nav-menu');
    await expect(navMenu).toHaveClass(/nav-show/);
    
    // Test iOS viewport zoom behavior
    await page.setViewportSize({ width: 375, height: 667, deviceScaleFactor: 2 });
    await expect(navMenu).toHaveClass(/nav-show/);
  });
  
  test('should handle Android Chrome specific behaviors', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Android Chrome specific test');
    
    await page.setViewportSize({ width: 384, height: 854 });
    await page.goto('index.html');
    
    // Android specific touch ripple effects should not interfere
    const mobileToggle = page.locator('.mobile-nav-toggle');
    
    await mobileToggle.tap({ position: { x: 22, y: 22 } });
    
    const navMenu = page.locator('.nav-menu');
    await expect(navMenu).toHaveClass(/nav-show/);
    
    // Test Android back button behavior (if available)
    await page.keyboard.press('Escape');
    await expect(navMenu).not.toHaveClass(/nav-show/);
  });
  
});
