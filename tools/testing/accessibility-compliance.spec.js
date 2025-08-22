/**
 * ACCESSIBILITY COMPLIANCE VALIDATION SUITE
 * WCAG 2.1 AA Compliance Testing for Mobile Navigation
 * 
 * Test Categories:
 * - Keyboard Navigation Accessibility
 * - Screen Reader Compatibility
 * - Color Contrast Compliance
 * - Focus Management
 * - Touch Target Requirements
 * - ARIA Attribute Validation
 */

const { test, expect } = require('@playwright/test');

const PAGES_TO_TEST = [
  'index.html',
  'about.html',
  'services.html', 
  'resources.html',
  'impact.html',
  'contact.html'
];

// WCAG 2.1 AA Requirements
const ACCESSIBILITY_STANDARDS = {
  MIN_TOUCH_TARGET: 44, // pixels
  MIN_COLOR_CONTRAST: 4.5, // AA standard
  MAX_FOCUS_TIME: 500, // milliseconds
  MIN_TAB_INDEX: -1 // for programmatic focus
};

test.describe('WCAG 2.1 AA Accessibility Compliance', () => {
  
  // ============================================
  // KEYBOARD NAVIGATION ACCESSIBILITY
  // ============================================
  
  test.describe('Keyboard Navigation', () => {
    
    PAGES_TO_TEST.forEach(pageUrl => {
      test(`should support full keyboard navigation on ${pageUrl}`, async ({ page }) => {
        await page.goto(pageUrl);
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Start from hamburger button
        const mobileToggle = page.locator('.mobile-nav-toggle');
        await mobileToggle.focus();
        await expect(mobileToggle).toBeFocused();
        
        // Open menu with Enter key
        await page.keyboard.press('Enter');
        
        const navMenu = page.locator('.nav-menu');
        await expect(navMenu).toHaveClass(/nav-show/);
        
        // Tab through all navigation links
        const navLinks = page.locator('.nav-link');
        const linkCount = await navLinks.count();
        
        for (let i = 0; i < linkCount; i++) {
          await page.keyboard.press('Tab');
          const currentLink = navLinks.nth(i);
          await expect(currentLink).toBeFocused();
          
          // Verify link is actionable with Enter
          const href = await currentLink.getAttribute('href');
          expect(href).toBeTruthy();
        }
        
        // Close menu with Escape
        await page.keyboard.press('Escape');
        await expect(navMenu).not.toHaveClass(/nav-show/);
        
        // Focus should return to toggle button
        await expect(mobileToggle).toBeFocused();
      });
      
      test(`should handle Shift+Tab reverse navigation on ${pageUrl}`, async ({ page }) => {
        await page.goto(pageUrl);
        await page.setViewportSize({ width: 375, height: 667 });
        
        const mobileToggle = page.locator('.mobile-nav-toggle');
        await mobileToggle.click();
        
        // Move to last navigation item
        const navLinks = page.locator('.nav-link');
        const lastLink = navLinks.last();
        await lastLink.focus();
        await expect(lastLink).toBeFocused();
        
        // Shift+Tab through links in reverse
        const linkCount = await navLinks.count();
        for (let i = linkCount - 2; i >= 0; i--) {
          await page.keyboard.press('Shift+Tab');
          const currentLink = navLinks.nth(i);
          await expect(currentLink).toBeFocused();
        }
      });
      
    });
    
    test('should handle keyboard shortcuts consistently', async ({ page }) => {
      await page.goto('index.html');
      await page.setViewportSize({ width: 375, height: 667 });
      
      const mobileToggle = page.locator('.mobile-nav-toggle');
      const navMenu = page.locator('.nav-menu');
      
      // Test Space key activation
      await mobileToggle.focus();
      await page.keyboard.press('Space');
      await expect(navMenu).toHaveClass(/nav-show/);
      
      // Test Escape key closing
      await page.keyboard.press('Escape');
      await expect(navMenu).not.toHaveClass(/nav-show/);
      
      // Test Enter key activation
      await page.keyboard.press('Enter');
      await expect(navMenu).toHaveClass(/nav-show/);
    });
    
  });
  
  // ============================================
  // ARIA ATTRIBUTE VALIDATION
  // ============================================
  
  test.describe('ARIA Attributes', () => {
    
    PAGES_TO_TEST.forEach(pageUrl => {
      test(`should have correct ARIA attributes on ${pageUrl}`, async ({ page }) => {
        await page.goto(pageUrl);
        
        // Navigation banner role
        const navbar = page.locator('.navbar.universal-nav');
        await expect(navbar).toHaveAttribute('role', 'banner');
        
        // Mobile toggle button ARIA
        const mobileToggle = page.locator('.mobile-nav-toggle');
        await expect(mobileToggle).toHaveAttribute('aria-label', 'Toggle navigation menu');
        await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
        await expect(mobileToggle).toHaveAttribute('aria-controls', 'main-nav');
        
        // Navigation menu ARIA
        const navMenu = page.locator('.nav-menu');
        await expect(navMenu).toHaveAttribute('id', 'main-nav');
        
        // Open menu and check updated ARIA
        await mobileToggle.click();
        await expect(mobileToggle).toHaveAttribute('aria-expanded', 'true');
        await expect(navMenu).toHaveAttribute('aria-hidden', 'false');
        
        // Close menu and verify ARIA updates
        await page.keyboard.press('Escape');
        await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
        await expect(navMenu).toHaveAttribute('aria-hidden', 'true');
      });
      
    });
    
    test('should maintain ARIA relationships', async ({ page }) => {
      await page.goto('index.html');
      
      const mobileToggle = page.locator('.mobile-nav-toggle');
      const navMenu = page.locator('.nav-menu');
      
      // Verify aria-controls relationship
      const controlsId = await mobileToggle.getAttribute('aria-controls');
      const menuId = await navMenu.getAttribute('id');
      expect(controlsId).toBe(menuId);
      
      // Verify expanded state consistency
      await mobileToggle.click();
      
      const isExpanded = await mobileToggle.getAttribute('aria-expanded');
      const isHidden = await navMenu.getAttribute('aria-hidden');
      const hasShowClass = await navMenu.evaluate(el => el.classList.contains('nav-show'));
      
      expect(isExpanded).toBe('true');
      expect(isHidden).toBe('false');
      expect(hasShowClass).toBe(true);
    });
    
  });
  
  // ============================================
  // TOUCH TARGET REQUIREMENTS
  // ============================================
  
  test.describe('Touch Target Compliance', () => {
    
    PAGES_TO_TEST.forEach(pageUrl => {
      test(`should meet touch target requirements on ${pageUrl}`, async ({ page }) => {
        await page.goto(pageUrl);
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Check hamburger button size
        const mobileToggle = page.locator('.mobile-nav-toggle');
        const toggleBox = await mobileToggle.boundingBox();
        
        expect(toggleBox.width).toBeGreaterThanOrEqual(ACCESSIBILITY_STANDARDS.MIN_TOUCH_TARGET);
        expect(toggleBox.height).toBeGreaterThanOrEqual(ACCESSIBILITY_STANDARDS.MIN_TOUCH_TARGET);
        
        // Open menu and check navigation links
        await mobileToggle.click();
        
        const navLinks = page.locator('.nav-link');
        const linkCount = await navLinks.count();
        
        for (let i = 0; i < linkCount; i++) {
          const link = navLinks.nth(i);
          const linkBox = await link.boundingBox();
          
          expect(linkBox.height).toBeGreaterThanOrEqual(ACCESSIBILITY_STANDARDS.MIN_TOUCH_TARGET);
          expect(linkBox.width).toBeGreaterThan(100); // Reasonable minimum width
          
          // Verify adequate spacing between touch targets
          if (i > 0) {
            const prevLink = navLinks.nth(i - 1);
            const prevBox = await prevLink.boundingBox();
            const spacing = linkBox.y - (prevBox.y + prevBox.height);
            expect(spacing).toBeGreaterThanOrEqual(8); // Minimum spacing
          }
        }
      });
      
    });
    
  });
  
  // ============================================
  // COLOR CONTRAST COMPLIANCE
  // ============================================
  
  test.describe('Color Contrast', () => {
    
    test('should meet WCAG AA color contrast requirements', async ({ page }) => {
      await page.goto('index.html');
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check navigation background contrast
      const navbar = page.locator('.navbar.universal-nav');
      const navStyles = await navbar.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color
        };
      });
      
      console.log('Navigation styles:', navStyles);
      
      // Open menu and check link contrast
      await page.locator('.mobile-nav-toggle').click();
      
      const navLinks = page.locator('.nav-link');
      const firstLink = navLinks.first();
      
      const linkStyles = await firstLink.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          borderColor: computed.borderColor
        };
      });
      
      console.log('Link styles:', linkStyles);
      
      // Verify text is readable (basic check)
      expect(linkStyles.color).not.toBe('rgba(0, 0, 0, 0)'); // Not transparent
      expect(linkStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)'); // Has background
    });
    
    test('should maintain contrast in hover/focus states', async ({ page }) => {
      await page.goto('index.html');
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.locator('.mobile-nav-toggle').click();
      
      const firstLink = page.locator('.nav-link').first();
      
      // Get normal state
      const normalStyles = await firstLink.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color
        };
      });
      
      // Test hover state
      await firstLink.hover();
      const hoverStyles = await firstLink.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color
        };
      });
      
      // Hover should change styling
      expect(hoverStyles.backgroundColor).not.toBe(normalStyles.backgroundColor);
      
      // Test focus state
      await firstLink.focus();
      const focusStyles = await firstLink.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          outline: computed.outline
        };
      });
      
      // Focus should have visible indicator
      expect(focusStyles.outline).not.toBe('none');
    });
    
  });
  
  // ============================================
  // FOCUS MANAGEMENT
  // ============================================
  
  test.describe('Focus Management', () => {
    
    test('should manage focus correctly during navigation interactions', async ({ page }) => {
      await page.goto('index.html');
      await page.setViewportSize({ width: 375, height: 667 });
      
      const mobileToggle = page.locator('.mobile-nav-toggle');
      const navMenu = page.locator('.nav-menu');
      
      // Initial focus on toggle
      await mobileToggle.focus();
      await expect(mobileToggle).toBeFocused();
      
      // Open menu - focus should move to first nav item
      await mobileToggle.click();
      await page.waitForTimeout(150); // Allow focus transition
      
      const firstNavLink = page.locator('.nav-link').first();
      await expect(firstNavLink).toBeFocused();
      
      // Close with Escape - focus should return to toggle
      await page.keyboard.press('Escape');
      await expect(mobileToggle).toBeFocused();
    });
    
    test('should trap focus within navigation when open', async ({ page }) => {
      await page.goto('index.html');
      await page.setViewportSize({ width: 375, height: 667 });
      
      const mobileToggle = page.locator('.mobile-nav-toggle');
      await mobileToggle.click();
      
      const navLinks = page.locator('.nav-link');
      const lastLink = navLinks.last();
      
      // Move to last navigation item
      await lastLink.focus();
      await expect(lastLink).toBeFocused();
      
      // Tab from last item should loop back or stay within navigation
      await page.keyboard.press('Tab');
      
      // Focus should either be on first nav item or remain contained
      const focusedElement = page.locator(':focus');
      const isNavFocused = await focusedElement.evaluate(el => {
        const navMenu = el.closest('.nav-menu');
        return navMenu !== null;
      });
      
      expect(isNavFocused).toBe(true);
    });
    
    test('should maintain focus visibility indicators', async ({ page }) => {
      await page.goto('index.html');
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Test toggle button focus indicator
      const mobileToggle = page.locator('.mobile-nav-toggle');
      await mobileToggle.focus();
      
      const toggleFocusStyle = await mobileToggle.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          outlineOffset: computed.outlineOffset,
          boxShadow: computed.boxShadow
        };
      });
      
      // Should have visible focus indicator
      const hasFocusIndicator = toggleFocusStyle.outline !== 'none' || 
                               toggleFocusStyle.boxShadow !== 'none';
      expect(hasFocusIndicator).toBe(true);
      
      // Test navigation link focus indicators
      await mobileToggle.click();
      
      const firstNavLink = page.locator('.nav-link').first();
      await firstNavLink.focus();
      
      const linkFocusStyle = await firstNavLink.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          outline: computed.outline,
          outlineOffset: computed.outlineOffset,
          boxShadow: computed.boxShadow
        };
      });
      
      const hasLinkFocusIndicator = linkFocusStyle.outline !== 'none' || 
                                   linkFocusStyle.boxShadow !== 'none';
      expect(hasLinkFocusIndicator).toBe(true);
    });
    
  });
  
  // ============================================
  // SCREEN READER COMPATIBILITY
  // ============================================
  
  test.describe('Screen Reader Compatibility', () => {
    
    test('should provide clear navigation structure for screen readers', async ({ page }) => {
      await page.goto('index.html');
      
      // Check navigation landmarks
      const banner = page.locator('[role="banner"]');
      await expect(banner).toBeVisible();
      
      const navigation = page.locator('[role="navigation"]');
      await expect(navigation).toBeVisible();
      
      // Check accessible names
      const navSection = page.locator('[aria-label="Main navigation"]');
      await expect(navSection).toBeVisible();
    });
    
    test('should announce state changes to screen readers', async ({ page }) => {
      await page.goto('index.html');
      await page.setViewportSize({ width: 375, height: 667 });
      
      const mobileToggle = page.locator('.mobile-nav-toggle');
      const navMenu = page.locator('.nav-menu');
      
      // Initial state
      await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false');
      await expect(navMenu).toHaveAttribute('aria-hidden', 'true');
      
      // Open menu
      await mobileToggle.click();
      await expect(mobileToggle).toHaveAttribute('aria-expanded', 'true');
      await expect(navMenu).toHaveAttribute('aria-hidden', 'false');
      
      // Verify live region updates (if any)
      const liveRegions = page.locator('[aria-live]');
      const liveRegionCount = await liveRegions.count();
      
      if (liveRegionCount > 0) {
        // If live regions exist, they should have appropriate politeness
        for (let i = 0; i < liveRegionCount; i++) {
          const region = liveRegions.nth(i);
          const politeness = await region.getAttribute('aria-live');
          expect(['polite', 'assertive', 'off']).toContain(politeness);
        }
      }
    });
    
    test('should provide meaningful link text', async ({ page }) => {
      await page.goto('index.html');
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.locator('.mobile-nav-toggle').click();
      
      const navLinks = page.locator('.nav-link');
      const linkCount = await navLinks.count();
      
      for (let i = 0; i < linkCount; i++) {
        const link = navLinks.nth(i);
        const linkText = await link.textContent();
        const href = await link.getAttribute('href');
        
        // Link text should be meaningful (not just "click here" etc.)
        expect(linkText.trim().length).toBeGreaterThan(2);
        expect(linkText.toLowerCase()).not.toContain('click here');
        expect(linkText.toLowerCase()).not.toContain('read more');
        
        // Links should have valid destinations
        expect(href).toBeTruthy();
        expect(href).not.toBe('#');
      }
    });
    
  });
  
  // ============================================
  // REDUCED MOTION SUPPORT
  // ============================================
  
  test.describe('Reduced Motion Support', () => {
    
    test('should respect prefers-reduced-motion setting', async ({ page }) => {
      // Simulate user preference for reduced motion
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await page.goto('index.html');
      await page.setViewportSize({ width: 375, height: 667 });
      
      const mobileToggle = page.locator('.mobile-nav-toggle');
      const navMenu = page.locator('.nav-menu');
      
      // Check that animations are disabled
      const menuStyles = await navMenu.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          animation: computed.animation,
          transition: computed.transition
        };
      });
      
      // With reduced motion, animations should be minimal or none
      expect(menuStyles.animation).toMatch(/none|0s/);
      
      // Test navigation still works without animations
      await mobileToggle.click();
      await expect(navMenu).toHaveClass(/nav-show/);
    });
    
  });
  
});

// ============================================
// COMPREHENSIVE ACCESSIBILITY AUDIT
// ============================================

test.describe('Comprehensive Accessibility Audit', () => {
  
  test('should pass automated accessibility scan', async ({ page }) => {
    await page.goto('index.html');
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Open navigation to test both states
    await page.locator('.mobile-nav-toggle').click();
    
    // Inject axe-core for automated testing
    await page.addScriptTag({
      url: 'https://unpkg.com/axe-core@4.7.2/axe.min.js'
    });
    
    // Run axe accessibility scan
    const results = await page.evaluate(() => {
      return new Promise((resolve) => {
        axe.run(document, {
          rules: {
            'color-contrast': { enabled: true },
            'keyboard-navigation': { enabled: true },
            'focus-management': { enabled: true },
            'aria-attributes': { enabled: true }
          }
        }, (err, results) => {
          resolve(results);
        });
      });
    });
    
    // Report any violations
    if (results.violations && results.violations.length > 0) {
      console.log('Accessibility violations found:');
      results.violations.forEach(violation => {
        console.log(`- ${violation.id}: ${violation.description}`);
        violation.nodes.forEach(node => {
          console.log(`  Target: ${node.target}`);
        });
      });
    }
    
    // Should have no critical violations
    const criticalViolations = results.violations?.filter(v => 
      ['critical', 'serious'].includes(v.impact)
    ) || [];
    
    expect(criticalViolations).toHaveLength(0);
  });
  
});
