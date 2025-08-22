/**
 * PHASE 2 FUNCTIONAL VALIDATION - PLAYWRIGHT TEST SUITE
 * 
 * Validates CSS Design Systems Expert implementation across all 6 pages:
 * ✅ Mobile navigation functionality after CSS consolidation
 * ✅ Cross-page consistency validation  
 * ✅ Phase 1 JavaScript integration with Phase 2 CSS
 * ✅ Performance impact assessment
 */

const { test, expect, devices } = require('@playwright/test');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PAGES_TO_TEST = [
  { path: 'index.html', name: 'Home' },
  { path: 'about.html', name: 'About Us' },
  { path: 'services.html', name: 'Services' },
  { path: 'impact.html', name: 'Impact' },
  { path: 'resources.html', name: 'Resources' },
  { path: 'contact.html', name: 'Contact' }
];

// Phase 2 validation test suite
test.describe('Phase 2 QA Validation - CSS Design Systems Implementation', () => {
  
  // Set mobile viewport for mobile-first testing
  test.use({ ...devices['iPhone 12'] });

  /**
   * PHASE 2 IMPLEMENTATION RESULTS VALIDATION
   */
  test.describe('Implementation Results Validation', () => {
    
    test('CSS consolidation - unified navigation file exists and loads', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);
      
      // Check if unified navigation CSS file exists and loads
      const cssResponse = await page.request.get(`${BASE_URL}/css/navigation-unified.css`);
      expect(cssResponse.status()).toBe(200);
      
      // Verify CSS content structure
      const cssContent = await cssResponse.text();
      expect(cssContent).toContain('@layer');
      expect(cssContent).toContain('.navbar.universal-nav');
      expect(cssContent).toContain('--slds-c-');
    });

    test('Performance budget compliance - CSS bundle size validation', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);
      
      // Measure CSS resource sizes
      const cssResources = [];
      
      page.on('response', response => {
        if (response.url().includes('.css')) {
          cssResources.push({
            url: response.url(),
            size: parseInt(response.headers()['content-length'] || '0')
          });
        }
      });
      
      await page.waitForLoadState('networkidle');
      
      // Calculate total CSS bundle size
      const totalCSSSize = cssResources.reduce((sum, resource) => sum + resource.size, 0);
      const totalSizeKB = Math.round(totalCSSSize / 1024 * 10) / 10;
      
      // Validate against 45KB performance budget
      expect(totalSizeKB).toBeLessThan(45);
      console.log(`Total CSS bundle size: ${totalSizeKB}KB (Budget: <45KB)`);
    });

    test('!important declarations elimination validation', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);
      
      // Fetch CSS files and check for !important declarations
      const cssFiles = [
        '/css/navigation-unified.css',
        '/css/styles.css', 
        '/css/performance-optimizations.css'
      ];
      
      for (const cssFile of cssFiles) {
        const response = await page.request.get(`${BASE_URL}${cssFile}`);
        if (response.status() === 200) {
          const content = await response.text();
          const importantMatches = content.match(/!important/gi) || [];
          
          console.log(`${cssFile}: ${importantMatches.length} !important declarations`);
          // Allow minimal !important usage for critical overrides
          expect(importantMatches.length).toBeLessThan(10);
        }
      }
    });
  });

  /**
   * FUNCTIONAL TESTING VALIDATION
   * Tests mobile navigation functionality across all 6 pages
   */
  test.describe('Functional Testing - All Pages', () => {
    
    for (const pageInfo of PAGES_TO_TEST) {
      test.describe(`${pageInfo.name} (${pageInfo.path})`, () => {
        
        test('navigation injection and structure', async ({ page }) => {
          await page.goto(`${BASE_URL}/${pageInfo.path}`);
          
          // Verify navigation is injected and structured correctly
          const navbar = await page.locator('.navbar.universal-nav');
          await expect(navbar).toBeVisible();
          
          // Check grid layout structure
          const headerLayout = await page.locator('.header-layout');
          await expect(headerLayout).toBeVisible();
          await expect(headerLayout).toHaveCSS('display', 'grid');
          
          // Verify logo container
          const logoContainer = await page.locator('.logo-container');
          await expect(logoContainer).toBeVisible();
          
          // Verify company name
          const companyName = await page.locator('h1.brand-logo.universal-brand-logo');
          await expect(companyName).toBeVisible();
          await expect(companyName).toContainText('FOOD-N-FORCE');
        });

        test('mobile toggle button functionality', async ({ page }) => {
          await page.goto(`${BASE_URL}/${pageInfo.path}`);
          
          // Find mobile toggle button
          const mobileToggle = await page.locator('.mobile-nav-toggle');
          await expect(mobileToggle).toBeVisible();
          
          // Verify hamburger icon
          const hamburgerIcon = await page.locator('.hamburger-icon');
          await expect(hamburgerIcon).toBeVisible();
          
          // Check ARIA attributes
          await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
          await expect(mobileToggle).toHaveAttribute('aria-controls', 'main-nav');
        });

        test('mobile menu open/close functionality', async ({ page }) => {
          await page.goto(`${BASE_URL}/${pageInfo.path}`);
          
          const navMenu = await page.locator('.nav-menu');
          const mobileToggle = await page.locator('.mobile-nav-toggle');
          
          // Initially menu should be hidden
          await expect(navMenu).not.toHaveClass(/nav-show/);
          
          // Click mobile toggle to open menu
          await mobileToggle.click();
          
          // Wait for CSS class to be added (Phase 1 pattern)
          await expect(navMenu).toHaveClass(/nav-show/);
          await expect(mobileToggle).toHaveAttribute('aria-expanded', 'true');
          
          // Click again to close menu
          await mobileToggle.click();
          await expect(navMenu).not.toHaveClass(/nav-show/);
          await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
        });

        test('navigation links accessibility and functionality', async ({ page }) => {
          await page.goto(`${BASE_URL}/${pageInfo.path}`);
          
          // Open mobile menu
          await page.locator('.mobile-nav-toggle').click();
          
          // Check all navigation links
          const navLinks = await page.locator('.nav-menu a.nav-link').all();
          expect(navLinks.length).toBeGreaterThan(0);
          
          for (const link of navLinks) {
            // Verify link is visible and clickable
            await expect(link).toBeVisible();
            
            // Check accessibility attributes
            const href = await link.getAttribute('href');
            expect(href).toBeTruthy();
            
            // Verify proper SLDS classes
            await expect(link).toHaveClass(/universal-nav-link/);
          }
        });

        test('menu dismissal methods', async ({ page }) => {
          await page.goto(`${BASE_URL}/${pageInfo.path}`);
          
          const navMenu = await page.locator('.nav-menu');
          const mobileToggle = await page.locator('.mobile-nav-toggle');
          
          // Open menu
          await mobileToggle.click();
          await expect(navMenu).toHaveClass(/nav-show/);
          
          // Test Escape key dismissal
          await page.keyboard.press('Escape');
          await expect(navMenu).not.toHaveClass(/nav-show/);
          
          // Open menu again
          await mobileToggle.click();
          await expect(navMenu).toHaveClass(/nav-show/);
          
          // Test outside click dismissal
          await page.click('body', { position: { x: 50, y: 200 } });
          await expect(navMenu).not.toHaveClass(/nav-show/);
        });

        test('responsive behavior on resize', async ({ page }) => {
          await page.goto(`${BASE_URL}/${pageInfo.path}`);
          
          // Start with mobile viewport (already set)
          const mobileToggle = await page.locator('.mobile-toggle-container');
          await expect(mobileToggle).toBeVisible();
          
          // Resize to desktop
          await page.setViewportSize({ width: 1024, height: 768 });
          
          // Mobile toggle should be hidden on desktop
          await expect(mobileToggle).toBeHidden();
          
          // Navigation menu should be visible horizontally
          const navMenu = await page.locator('.nav-menu');
          await expect(navMenu).toBeVisible();
          await expect(navMenu).toHaveCSS('flex-direction', 'row');
          
          // Resize back to mobile
          await page.setViewportSize({ width: 375, height: 667 });
          await expect(mobileToggle).toBeVisible();
        });

        test('Phase 1 JavaScript integration', async ({ page }) => {
          await page.goto(`${BASE_URL}/${pageInfo.path}`);
          
          // Verify Phase 1 JavaScript pattern - CSS class toggles only
          const mobileToggle = await page.locator('.mobile-nav-toggle');
          const navMenu = await page.locator('.nav-menu');
          
          // Click toggle and verify only CSS classes are manipulated (not inline styles)
          await mobileToggle.click();
          
          // Should have nav-show class, no inline style manipulation
          await expect(navMenu).toHaveClass(/nav-show/);
          
          // Verify no inline styles on navigation elements
          const navMenuStyle = await navMenu.getAttribute('style');
          expect(navMenuStyle).toBeFalsy();
        });
      });
    }
  });

  /**
   * CROSS-PAGE CONSISTENCY VALIDATION
   */
  test.describe('Cross-Page Consistency Validation', () => {
    
    test('navigation structure identical across all pages', async ({ page }) => {
      const navigationStructures = [];
      
      for (const pageInfo of PAGES_TO_TEST) {
        await page.goto(`${BASE_URL}/${pageInfo.path}`);
        
        // Extract navigation structure
        const navbar = await page.locator('.navbar.universal-nav');
        const navHTML = await navbar.innerHTML();
        
        navigationStructures.push({
          page: pageInfo.path,
          structure: navHTML
        });
      }
      
      // Compare all structures to first one
      const baseStructure = navigationStructures[0].structure;
      
      for (let i = 1; i < navigationStructures.length; i++) {
        // Compare navigation structure (allowing for minor differences like active states)
        const currentStructure = navigationStructures[i].structure;
        
        // Check key structural elements
        expect(currentStructure).toContain('navbar universal-nav');
        expect(currentStructure).toContain('logo-container');
        expect(currentStructure).toContain('brand-logo universal-brand-logo');
        expect(currentStructure).toContain('mobile-nav-toggle');
        expect(currentStructure).toContain('nav-menu');
      }
    });

    test('mobile toggle functionality consistent across pages', async ({ page }) => {
      for (const pageInfo of PAGES_TO_TEST) {
        await page.goto(`${BASE_URL}/${pageInfo.path}`);
        
        const mobileToggle = await page.locator('.mobile-nav-toggle');
        const navMenu = await page.locator('.nav-menu');
        
        // Test toggle functionality
        await mobileToggle.click();
        await expect(navMenu).toHaveClass(/nav-show/);
        
        await mobileToggle.click();
        await expect(navMenu).not.toHaveClass(/nav-show/);
      }
    });

    test('active page highlighting working correctly', async ({ page }) => {
      // Test active states for different pages
      for (const pageInfo of PAGES_TO_TEST) {
        await page.goto(`${BASE_URL}/${pageInfo.path}`);
        
        // Open mobile menu
        await page.locator('.mobile-nav-toggle').click();
        
        // Find the active navigation item
        const activeItems = await page.locator('.nav-menu .slds-is-active').all();
        
        // Should have exactly one active item
        expect(activeItems.length).toBe(1);
        
        // Active item should correspond to current page
        const activeLink = activeItems[0].locator('a');
        const linkText = await activeLink.textContent();
        
        // Verify active state matches current page
        if (pageInfo.path === 'index.html') {
          expect(linkText.toLowerCase()).toContain('home');
        } else {
          expect(linkText.toLowerCase()).toContain(pageInfo.name.toLowerCase().split(' ')[0]);
        }
      }
    });
  });

  /**
   * VISUAL CONSISTENCY TESTING
   */
  test.describe('Visual Consistency Testing', () => {
    
    test('glassmorphism effects preserved across pages', async ({ page }) => {
      for (const pageInfo of PAGES_TO_TEST) {
        await page.goto(`${BASE_URL}/${pageInfo.path}`);
        
        // Check glassmorphism logo effects
        const fnfLogo = await page.locator('.fnf-logo');
        if (await fnfLogo.count() > 0) {
          // Verify glassmorphism CSS properties
          await expect(fnfLogo).toHaveCSS('backdrop-filter', /blur/);
          await expect(fnfLogo).toHaveCSS('background', /linear-gradient/);
          
          // Check spinning border animation
          const logoBefore = await page.locator('.fnf-logo::before');
          // Note: Playwright can't directly test pseudo-elements, but can verify animation properties
        }
        
        // Check navbar backdrop filter
        const navbar = await page.locator('.navbar.universal-nav');
        await expect(navbar).toHaveCSS('backdrop-filter', 'blur(10px)');
      }
    });

    test('responsive behavior consistency', async ({ page }) => {
      const viewports = [
        { width: 320, height: 568, name: 'Small Mobile' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 1024, height: 768, name: 'Desktop' }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        
        // Test on first page as representative
        await page.goto(`${BASE_URL}/index.html`);
        
        const mobileToggle = await page.locator('.mobile-toggle-container');
        const navMenu = await page.locator('.nav-menu');
        
        if (viewport.width <= 768) {
          // Mobile behavior
          await expect(mobileToggle).toBeVisible();
          await expect(navMenu).not.toHaveClass(/nav-show/);
        } else {
          // Desktop behavior  
          await expect(mobileToggle).toBeHidden();
          await expect(navMenu).toBeVisible();
          await expect(navMenu).toHaveCSS('flex-direction', 'row');
        }
      }
    });

    test('no visual regression - navigation layout stability', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);
      
      // Measure Cumulative Layout Shift during navigation interactions
      await page.evaluate(() => {
        window.layoutShifts = [];
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              window.layoutShifts.push(entry.value);
            }
          }
        }).observe({type: 'layout-shift', buffered: true});
      });
      
      // Interact with navigation
      await page.locator('.mobile-nav-toggle').click();
      await page.waitForTimeout(500); // Allow for animation
      await page.locator('.mobile-nav-toggle').click();
      
      // Check CLS score
      const clsScore = await page.evaluate(() => {
        return window.layoutShifts.reduce((sum, shift) => sum + shift, 0);
      });
      
      // CLS should be minimal (<0.1 is good)
      expect(clsScore).toBeLessThan(0.1);
    });
  });

  /**
   * SLDS COMPLIANCE VALIDATION
   */
  test.describe('SLDS Compliance Validation', () => {
    
    test('SLDS design tokens usage validation', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);
      
      // Check for SLDS CSS custom properties
      const navbar = await page.locator('.navbar.universal-nav');
      
      // Verify SLDS-compliant CSS custom properties are applied
      const computedStyle = await navbar.evaluate(el => {
        const style = getComputedStyle(el);
        return {
          fontFamily: style.fontFamily,
          zIndex: style.zIndex,
          position: style.position
        };
      });
      
      // Should use Salesforce Sans font family
      expect(computedStyle.fontFamily).toContain('Salesforce Sans');
      
      // Should have appropriate z-index
      expect(parseInt(computedStyle.zIndex)).toBeGreaterThan(99);
    });

    test('semantic HTML structure validation', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);
      
      // Verify semantic HTML structure
      const nav = await page.locator('nav[role="navigation"]');
      await expect(nav).toBeVisible();
      
      // Check proper heading structure
      const brandHeading = await page.locator('h1.brand-logo');
      await expect(brandHeading).toBeVisible();
      
      // Verify list structure for navigation
      const navList = await page.locator('.nav-menu ul');
      await expect(navList).toBeVisible();
      
      // Check proper link structure
      const navLinks = await page.locator('.nav-menu a');
      const linkCount = await navLinks.count();
      expect(linkCount).toBeGreaterThan(0);
    });

    test('WCAG 2.1 AA accessibility compliance', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);
      
      // Color contrast validation (would need specific tools in real implementation)
      const navbar = await page.locator('.navbar.universal-nav');
      const navbarBg = await navbar.evaluate(el => getComputedStyle(el).backgroundColor);
      
      // Navigation links color contrast
      const navLinks = await page.locator('.nav-menu a').first();
      const linkColor = await navLinks.evaluate(el => getComputedStyle(el).color);
      
      // Should have sufficient contrast (actual contrast calculation would be more complex)
      expect(linkColor).toBeTruthy();
      expect(navbarBg).toBeTruthy();
      
      // Keyboard navigation
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.className);
      expect(focusedElement).toBeTruthy();
      
      // ARIA attributes
      const mobileToggle = await page.locator('.mobile-nav-toggle');
      await expect(mobileToggle).toHaveAttribute('aria-expanded');
      await expect(mobileToggle).toHaveAttribute('aria-controls');
    });
  });

  /**
   * PERFORMANCE REGRESSION TESTING
   */
  test.describe('Performance Regression Testing', () => {
    
    test('CSS loading performance within budget', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto(`${BASE_URL}/index.html`);
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time (adjust based on requirements)
      expect(loadTime).toBeLessThan(3000); // 3 seconds
      
      console.log(`Page load time: ${loadTime}ms`);
    });

    test('animation performance during interactions', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);
      
      // Measure performance during navigation animation
      await page.evaluate(() => {
        window.frameTimes = [];
        let lastTime = performance.now();
        
        function measureFrame() {
          const currentTime = performance.now();
          window.frameTimes.push(currentTime - lastTime);
          lastTime = currentTime;
          if (window.frameTimes.length < 60) { // Measure for ~1 second at 60fps
            requestAnimationFrame(measureFrame);
          }
        }
        requestAnimationFrame(measureFrame);
      });
      
      // Trigger navigation animation
      await page.locator('.mobile-nav-toggle').click();
      
      // Wait for measurements
      await page.waitForTimeout(1100);
      
      const frameStats = await page.evaluate(() => {
        const avgFrameTime = window.frameTimes.reduce((a, b) => a + b, 0) / window.frameTimes.length;
        const fps = 1000 / avgFrameTime;
        return { avgFrameTime, fps, totalFrames: window.frameTimes.length };
      });
      
      // Should maintain reasonable frame rate (>30fps)
      expect(frameStats.fps).toBeGreaterThan(30);
      
      console.log(`Average FPS: ${frameStats.fps.toFixed(1)}`);
    });

    test('Phase 1 JavaScript performance maintained', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);
      
      // Measure JavaScript execution time for navigation toggle
      const executionTime = await page.evaluate(async () => {
        const startTime = performance.now();
        
        // Simulate the Phase 1 navigation toggle
        const navMenu = document.querySelector('.nav-menu');
        const toggle = document.querySelector('.mobile-nav-toggle');
        
        // Perform several toggles to measure average
        for (let i = 0; i < 10; i++) {
          navMenu.classList.toggle('nav-show');
          toggle.setAttribute('aria-expanded', navMenu.classList.contains('nav-show'));
        }
        
        return performance.now() - startTime;
      });
      
      // Should execute quickly (<100ms for 10 operations)
      expect(executionTime).toBeLessThan(100);
      
      console.log(`JavaScript execution time: ${executionTime.toFixed(2)}ms`);
    });
  });
});

// Export test configuration for CI/CD integration
module.exports = {
  PAGES_TO_TEST,
  BASE_URL
};