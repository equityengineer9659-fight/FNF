// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * PHASE 4 REGRESSION PREVENTION - MOBILE NAVIGATION P0 PROTECTION
 * Zero regression tolerance for mobile navigation during Enhanced HTML-First implementation
 * Critical requirement: Mobile navigation must remain 100% functional across all Phase 4 changes
 */

test.describe("Phase 4 Mobile Navigation P0 Protection", () => {

  const CRITICAL_BREAKPOINTS = [
    { name: "mobile-xs", width: 320, height: 568 },
    { name: "mobile-sm", width: 375, height: 812 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1024, height: 768 },
    { name: "desktop-xl", width: 1920, height: 1080 }
  ];

  const CRITICAL_PAGES = [
    { name: "index", url: "/" },
    { name: "about", url: "/about.html" },
    { name: "services", url: "/services.html" },
    { name: "resources", url: "/resources.html" },
    { name: "impact", url: "/impact.html" },
    { name: "contact", url: "/contact.html" }
  ];

  // P0 Test: Mobile Navigation Structure Validation
  CRITICAL_PAGES.forEach(pageInfo => {
    CRITICAL_BREAKPOINTS.forEach(breakpoint => {
      test(`P0 Navigation Structure: ${pageInfo.name} @ ${breakpoint.name} (${breakpoint.width}px)`, async ({ page }) => {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        await page.goto(pageInfo.url);
        await page.waitForLoadState("networkidle");

        // Critical P0 navigation elements must exist
        const navigationStructure = await page.evaluate(() => {
          return {
            navbar: !!document.querySelector(".navbar"),
            navMenu: !!document.querySelector(".nav-menu"),
            mobileToggle: !!document.querySelector(".mobile-nav-toggle"),
            navLinks: document.querySelectorAll(".nav-menu a, .navbar a").length,
            logo: !!document.querySelector(".fnf-logo-image"),
            navbarVisible: (() => {
              const navbar = document.querySelector(".navbar");
              return navbar ? getComputedStyle(navbar).display !== 'none' : false;
            })(),
            toggleVisible: (() => {
              const toggle = document.querySelector(".mobile-nav-toggle");
              if (!toggle) return false;
              const style = getComputedStyle(toggle);
              return style.display !== 'none' && style.visibility !== 'hidden';
            })()
          };
        });

        // P0 Requirements - ZERO TOLERANCE FOR FAILURE
        expect(navigationStructure.navbar).toBe(true);
        expect(navigationStructure.navMenu).toBe(true);
        expect(navigationStructure.navbarVisible).toBe(true);
        expect(navigationStructure.logo).toBe(true);
        expect(navigationStructure.navLinks).toBeGreaterThan(0);

        // Mobile-specific toggle requirements
        if (breakpoint.width < 768) {
          expect(navigationStructure.mobileToggle).toBe(true);
          expect(navigationStructure.toggleVisible).toBe(true);
        }

        console.log(`✅ P0 PASS: ${pageInfo.name} @ ${breakpoint.name} - All navigation elements present`);
      });
    });
  });

  // P0 Test: Mobile Navigation Interaction Testing
  CRITICAL_PAGES.forEach(pageInfo => {
    test(`P0 Navigation Interaction: ${pageInfo.name} Mobile Toggle`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 }); // iPhone 12 Pro size
      await page.goto(pageInfo.url);
      await page.waitForLoadState("networkidle");

      // Test mobile toggle functionality
      const mobileToggle = page.locator(".mobile-nav-toggle");
      const navMenu = page.locator(".nav-menu");

      // Verify toggle exists and is visible
      await expect(mobileToggle).toBeVisible();

      // Get initial menu state
      const initialMenuVisible = await navMenu.evaluate(el => {
        const style = getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });

      // Click toggle to change state
      await mobileToggle.click();
      await page.waitForTimeout(500); // Allow for animation/transition

      // Verify menu state changed
      const afterClickMenuVisible = await navMenu.evaluate(el => {
        const style = getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });

      // Menu state must change (visible → hidden or hidden → visible)
      expect(initialMenuVisible !== afterClickMenuVisible).toBe(true);

      // Test toggle reversal
      await mobileToggle.click();
      await page.waitForTimeout(500);

      const finalMenuVisible = await navMenu.evaluate(el => {
        const style = getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });

      // Menu should return to initial state
      expect(finalMenuVisible === initialMenuVisible).toBe(true);

      console.log(`✅ P0 PASS: ${pageInfo.name} - Mobile toggle interaction functional`);
    });
  });

  // P0 Test: Navigation Link Functionality
  test("P0 Navigation Links: Cross-Page Navigation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Find all navigation links
    const navLinks = await page.locator(".nav-menu a, .navbar a").all();
    expect(navLinks.length).toBeGreaterThan(0);

    // Test first few navigation links (avoid timeout on all links)
    const testLinks = navLinks.slice(0, Math.min(3, navLinks.length));
    
    for (let i = 0; i < testLinks.length; i++) {
      const link = testLinks[i];
      const href = await link.getAttribute("href");
      
      if (href && href.startsWith("/") || href.includes(".html")) {
        // Click link and verify navigation
        await Promise.all([
          page.waitForLoadState("networkidle"),
          link.click()
        ]);

        // Verify page navigated successfully
        const currentUrl = page.url();
        expect(currentUrl).toContain(href.replace("/", "").replace(".html", "") || "index");

        // Verify navigation still works on new page
        const newPageNavigation = await page.evaluate(() => {
          return {
            navbar: !!document.querySelector(".navbar"),
            navMenu: !!document.querySelector(".nav-menu"),
            mobileToggle: !!document.querySelector(".mobile-nav-toggle")
          };
        });

        expect(newPageNavigation.navbar).toBe(true);
        expect(newPageNavigation.navMenu).toBe(true);
        expect(newPageNavigation.mobileToggle).toBe(true);

        console.log(`✅ P0 PASS: Navigation link ${i + 1} - Page transition successful`);
      }
    }
  });

  // P0 Test: Touch Target Accessibility
  CRITICAL_BREAKPOINTS.slice(0, 2).forEach(breakpoint => { // Test on mobile breakpoints only
    test(`P0 Touch Targets: ${breakpoint.name} (${breakpoint.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Test touch target sizes for mobile accessibility
      const touchTargets = await page.evaluate(() => {
        const interactiveElements = document.querySelectorAll(
          ".mobile-nav-toggle, .nav-menu a, .navbar a, button, [role='button']"
        );

        return Array.from(interactiveElements).map(el => {
          const rect = el.getBoundingClientRect();
          const computedStyle = getComputedStyle(el);
          
          return {
            element: el.className || el.tagName,
            width: rect.width,
            height: rect.height,
            minDimension: Math.min(rect.width, rect.height),
            visible: rect.width > 0 && rect.height > 0,
            interactive: computedStyle.pointerEvents !== 'none'
          };
        }).filter(target => target.visible && target.interactive);
      });

      // Validate touch targets meet 44px minimum (WCAG AA standard)
      const validTouchTargets = touchTargets.filter(target => target.minDimension >= 44);
      const touchTargetCompliance = (validTouchTargets.length / Math.max(touchTargets.length, 1)) * 100;

      expect(touchTargetCompliance).toBeGreaterThan(80); // 80% minimum compliance
      
      console.log(`✅ P0 PASS: ${breakpoint.name} - Touch targets: ${touchTargetCompliance.toFixed(1)}% compliant`);
      console.log(`   Valid targets: ${validTouchTargets.length}/${touchTargets.length}`);
    });
  });

  // P0 Test: Keyboard Navigation Accessibility
  test("P0 Keyboard Navigation: Focus Management", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Test keyboard navigation through navigation elements
    await page.keyboard.press("Tab"); // Focus first interactive element
    
    let focusedElements = [];
    let tabCount = 0;
    const maxTabs = 10; // Limit to prevent infinite loop

    // Tab through navigation elements
    while (tabCount < maxTabs) {
      const focusedElement = await page.evaluate(() => {
        const focused = document.activeElement;
        if (focused && focused !== document.body) {
          return {
            tagName: focused.tagName,
            className: focused.className,
            id: focused.id,
            isInNavigation: focused.closest(".navbar, .nav-menu, .mobile-nav-toggle") !== null
          };
        }
        return null;
      });

      if (focusedElement && focusedElement.isInNavigation) {
        focusedElements.push(focusedElement);
      }

      await page.keyboard.press("Tab");
      tabCount++;

      // Stop if we've cycled through navigation
      if (focusedElements.length > 0 && !focusedElement?.isInNavigation) {
        break;
      }
    }

    // Verify keyboard navigation works for navigation elements
    expect(focusedElements.length).toBeGreaterThan(0);
    
    console.log(`✅ P0 PASS: Keyboard navigation - ${focusedElements.length} navigation elements focusable`);
    focusedElements.forEach((el, i) => {
      console.log(`   ${i + 1}. ${el.tagName}${el.className ? '.' + el.className.split(' ')[0] : ''}`);
    });
  });

  // P0 Test: Navigation Performance Under Load
  test("P0 Navigation Performance: Response Time", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Test mobile toggle response time
    const togglePerformance = await page.evaluate(async () => {
      const toggle = document.querySelector(".mobile-nav-toggle");
      const navMenu = document.querySelector(".nav-menu");
      
      if (!toggle || !navMenu) return { error: "Navigation elements not found" };

      const performanceTests = [];
      
      // Test multiple toggle interactions for performance consistency
      for (let i = 0; i < 3; i++) {
        const startTime = performance.now();
        
        // Simulate click
        toggle.click();
        
        // Wait for any transitions/animations
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const endTime = performance.now();
        performanceTests.push(endTime - startTime);
      }
      
      return {
        tests: performanceTests,
        averageResponseTime: performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length,
        maxResponseTime: Math.max(...performanceTests)
      };
    });

    if (togglePerformance.error) {
      throw new Error(togglePerformance.error);
    }

    // Navigation interactions must be responsive (<200ms)
    expect(togglePerformance.maxResponseTime).toBeLessThan(200);
    expect(togglePerformance.averageResponseTime).toBeLessThan(100);

    console.log(`✅ P0 PASS: Navigation performance`);
    console.log(`   Average response: ${togglePerformance.averageResponseTime.toFixed(1)}ms`);
    console.log(`   Max response: ${togglePerformance.maxResponseTime.toFixed(1)}ms`);
  });
});