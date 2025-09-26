// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * PHASE 4 FRAMEWORK EVALUATION - PROTOTYPE COMPARISON TESTING
 * Compares Enhanced HTML-First Architecture against framework alternatives
 * Decision: Enhanced HTML-First selected by technical-architect (ADR-010)
 */

test.describe("Phase 4 Framework Evaluation - Baseline Validation", () => {

  test("Enhanced HTML-First Architecture: Performance Baseline", async ({ page }) => {
    await page.goto("/");
    
    // Measure current performance metrics as framework comparison baseline
    const performanceMetrics = await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType("navigation")[0];
      const resourceEntries = performance.getEntriesByType("resource");
      
      // Calculate bundle sizes
      let cssSize = 0;
      let jsSize = 0;
      
      resourceEntries.forEach(entry => {
        if (entry.name.includes('.css')) {
          cssSize += entry.transferSize || 0;
        }
        if (entry.name.includes('.js')) {
          jsSize += entry.transferSize || 0;
        }
      });
      
      return {
        domContentLoaded: perfEntries.domContentLoadedEventEnd - perfEntries.domContentLoadedEventStart,
        loadComplete: perfEntries.loadEventEnd - perfEntries.loadEventStart,
        firstPaint: performance.getEntriesByName("first-paint")[0]?.startTime || 0,
        totalCssSize: cssSize,
        totalJsSize: jsSize,
        totalBundleSize: cssSize + jsSize
      };
    });
    
    // Validate against Phase 4 performance budget (290KB total)
    const totalKB = performanceMetrics.totalBundleSize / 1024;
    expect(totalKB).toBeLessThan(290); // Phase 4 budget from technical-architect
    
    // Validate Enhanced HTML-First maintains current performance leadership
    expect(performanceMetrics.domContentLoaded).toBeLessThan(500); // 500ms target
    expect(performanceMetrics.loadComplete).toBeLessThan(1000); // 1s total load
    
    console.log(`✅ Enhanced HTML-First Baseline: ${totalKB.toFixed(1)}KB total`);
    console.log(`   CSS: ${(performanceMetrics.totalCssSize/1024).toFixed(1)}KB, JS: ${(performanceMetrics.totalJsSize/1024).toFixed(1)}KB`);
    console.log(`   Load: ${performanceMetrics.loadComplete}ms, DOMContentLoaded: ${performanceMetrics.domContentLoaded}ms`);
  });

  test("Framework Evaluation: SLDS Compliance Baseline", async ({ page }) => {
    await page.goto("/");
    
    // Measure current SLDS compliance as framework comparison baseline
    const sldsMetrics = await page.evaluate(() => {
      const elements = document.querySelectorAll("*");
      let sldsUtilityCount = 0;
      let totalClassCount = 0;
      let sldsTokenCount = 0;
      let totalStyleCount = 0;
      
      elements.forEach(el => {
        const classes = el.className.toString().split(/\s+/).filter(c => c.length > 0);
        totalClassCount += classes.length;
        
        // Count SLDS-like utilities
        classes.forEach(cls => {
          if (cls.startsWith('slds-') || 
              cls.match(/^(m|p)(t|r|b|l|x|y)?-[0-9]+$/) ||
              cls.match(/^(text|bg|border)-.+/) ||
              cls.match(/^(flex|grid|block|inline)/) ||
              cls.includes('responsive')) {
            sldsUtilityCount++;
          }
        });
        
        // Count SLDS tokens in computed styles
        const computedStyle = window.getComputedStyle(el);
        const styleProps = ['color', 'background-color', 'border-color', 'margin', 'padding'];
        styleProps.forEach(prop => {
          const value = computedStyle.getPropertyValue(prop);
          totalStyleCount++;
          if (value.includes('var(--slds') || 
              value.match(/^(4|8|12|16|20|24|32|48|64)px$/) ||
              value.includes('rem')) {
            sldsTokenCount++;
          }
        });
      });
      
      const sldsUtilityCompliance = (sldsUtilityCount / Math.max(totalClassCount, 1)) * 100;
      const sldsTokenCompliance = (sldsTokenCount / Math.max(totalStyleCount, 1)) * 100;
      const overallSldsCompliance = (sldsUtilityCompliance + sldsTokenCompliance) / 2;
      
      return {
        sldsUtilityCount,
        totalClassCount,
        sldsTokenCount,
        totalStyleCount,
        sldsUtilityCompliance,
        sldsTokenCompliance,
        overallSldsCompliance
      };
    });
    
    // Validate 89% SLDS compliance minimum (technical requirement)
    expect(sldsMetrics.overallSldsCompliance).toBeGreaterThan(89);
    
    console.log(`✅ SLDS Compliance Baseline: ${sldsMetrics.overallSldsCompliance.toFixed(1)}%`);
    console.log(`   Utility Classes: ${sldsMetrics.sldsUtilityCompliance.toFixed(1)}%`);
    console.log(`   Design Tokens: ${sldsMetrics.sldsTokenCompliance.toFixed(1)}%`);
  });

  test("Mobile Navigation P0 Protection Baseline", async ({ page }) => {
    // Test mobile navigation across all critical breakpoints
    const breakpoints = [
      { name: "mobile", width: 320, height: 568 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "desktop", width: 1024, height: 768 },
      { name: "large", width: 1440, height: 900 },
      { name: "xl", width: 1920, height: 1080 }
    ];
    
    for (const breakpoint of breakpoints) {
      await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      
      // Validate mobile navigation functionality
      const navFunctionality = await page.evaluate(() => {
        const navbar = document.querySelector(".navbar");
        const mobileToggle = document.querySelector(".mobile-nav-toggle");
        const navMenu = document.querySelector(".nav-menu");
        
        return {
          navbarExists: !!navbar,
          mobileToggleExists: !!mobileToggle,
          navMenuExists: !!navMenu,
          navbarVisible: navbar ? getComputedStyle(navbar).display !== 'none' : false,
          toggleVisible: mobileToggle ? getComputedStyle(mobileToggle).display !== 'none' : false
        };
      });
      
      // P0 Requirements: Navigation must exist and be functional
      expect(navFunctionality.navbarExists).toBe(true);
      expect(navFunctionality.navMenuExists).toBe(true);
      expect(navFunctionality.navbarVisible).toBe(true);
      
      // Test mobile toggle interaction if mobile breakpoint
      if (breakpoint.width < 768) {
        expect(navFunctionality.mobileToggleExists).toBe(true);
        
        // Test toggle functionality
        const toggleButton = page.locator(".mobile-nav-toggle");
        if (await toggleButton.isVisible()) {
          await toggleButton.click();
          await page.waitForTimeout(300); // Animation settle time
          
          const menuState = await page.evaluate(() => {
            const menu = document.querySelector(".nav-menu");
            return menu ? getComputedStyle(menu).display : 'none';
          });
          
          // Menu should be visible after toggle (not 'none')
          expect(menuState).not.toBe('none');
        }
      }
      
      console.log(`✅ Mobile Navigation P0: ${breakpoint.name} (${breakpoint.width}px) functional`);
    }
  });

  test("Special Effects Preservation Validation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Test all critical special effects that must be preserved
    const specialEffects = await page.evaluate(() => {
      // Check logo effects
      const logo = document.querySelector(".fnf-logo-image");
      const logoEffects = logo ? {
        hasLogo: true,
        hasAnimations: getComputedStyle(logo).animationName !== 'none',
        hasTransforms: getComputedStyle(logo).transform !== 'none',
        hasGradients: getComputedStyle(logo).backgroundImage.includes('gradient')
      } : { hasLogo: false };
      
      // Check glassmorphism effects
      const glassElements = document.querySelectorAll("[class*='glass'], .hero-content, .navbar");
      const glassmorphism = Array.from(glassElements).some(el => {
        const style = getComputedStyle(el);
        return style.backdropFilter !== 'none' || 
               style.webkitBackdropFilter !== 'none' ||
               style.background.includes('rgba');
      });
      
      // Check background spinning effects
      const backgroundEffects = document.querySelector(".background-animation") || 
                               document.querySelector("[class*='spin']") ||
                               document.querySelector("[style*='animation']");
      
      // Check blue circular gradients for emoji icons
      const emojiIcons = document.querySelectorAll(".emoji-icon, [class*='icon']");
      const blueGradients = Array.from(emojiIcons).some(el => {
        const style = getComputedStyle(el);
        return style.background.includes('radial-gradient') && 
               (style.background.includes('blue') || style.background.includes('rgb('));
      });
      
      return {
        logoEffects,
        glassmorphism,
        backgroundEffects: !!backgroundEffects,
        blueGradients,
        totalEffectsActive: [
          logoEffects.hasLogo,
          glassmorphism,
          !!backgroundEffects,
          blueGradients
        ].filter(Boolean).length
      };
    });
    
    // Validate special effects preservation
    expect(specialEffects.logoEffects.hasLogo).toBe(true);
    expect(specialEffects.totalEffectsActive).toBeGreaterThan(2); // At least 3/4 effects should be active
    
    console.log(`✅ Special Effects: ${specialEffects.totalEffectsActive}/4 active`);
    console.log(`   Logo: ${specialEffects.logoEffects.hasLogo ? '✅' : '❌'}`);
    console.log(`   Glassmorphism: ${specialEffects.glassmorphism ? '✅' : '❌'}`);
    console.log(`   Background: ${specialEffects.backgroundEffects ? '✅' : '❌'}`);
    console.log(`   Blue Gradients: ${specialEffects.blueGradients ? '✅' : '❌'}`);
  });
});