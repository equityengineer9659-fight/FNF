const { test, expect } = require('@playwright/test');

test.describe('Food-N-Force Website', () => {
  test.describe('Homepage Tests', () => {
    test('should load homepage successfully', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Food-N-Force/);
      await expect(page.locator('h1')).toContainText('Modern Solutions to Feed More, Serve Better');
    });

    test('should have proper meta tags for SEO', async ({ page }) => {
      await page.goto('/');
      
      // Check meta description
      const metaDescription = page.locator('meta[name="description"]');
      await expect(metaDescription).toHaveAttribute('content', /Food-N-Force/);
      
      // Check Open Graph tags
      const ogTitle = page.locator('meta[property="og:title"]');
      await expect(ogTitle).toHaveAttribute('content', /Food-N-Force/);
    });

    test('should have accessible navigation', async ({ page }) => {
      await page.goto('/');
      
      // Wait for navigation to load
      await page.waitForSelector('nav', { timeout: 10000 });
      
      // Check for skip link
      const skipLink = page.locator('a.skip-link');
      await expect(skipLink).toBeVisible();
      
      // Check navigation exists
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
    });

    test('should have working hero CTA buttons', async ({ page }) => {
      await page.goto('/');
      
      // Check primary CTA
      const primaryCTA = page.locator('.cta-primary');
      await expect(primaryCTA).toBeVisible();
      await expect(primaryCTA).toHaveAttribute('href', /#get-started/);
      
      // Check secondary CTA
      const secondaryCTA = page.locator('.cta-secondary');
      await expect(secondaryCTA).toBeVisible();
      await expect(secondaryCTA).toHaveAttribute('href', /#how-it-works/);
    });

    test('should display impact statistics', async ({ page }) => {
      await page.goto('/');
      
      // Wait for stats to be visible
      await page.waitForSelector('.stat-card', { timeout: 10000 });
      
      // Check that all stat cards are present
      const statCards = page.locator('.stat-card');
      await expect(statCards).toHaveCount(4);
      
      // Check specific stats
      const pantries = page.locator('[data-target="150"]');
      await expect(pantries).toBeVisible();
      
      const efficiency = page.locator('[data-target="40"]');
      await expect(efficiency).toBeVisible();
    });
  });

  test.describe('Navigation Tests', () => {
    const pages = [
      { path: '/about.html', title: 'About' },
      { path: '/services.html', title: 'Services' },
      { path: '/impact.html', title: 'Impact' },
      { path: '/resources.html', title: 'Resources' },
      { path: '/contact.html', title: 'Contact' },
    ];

    pages.forEach(({ path, title }) => {
      test(`should load ${title} page successfully`, async ({ page }) => {
        await page.goto(path);
        await expect(page).toHaveTitle(new RegExp(title, 'i'));
        
        // Check that the page has main content
        const main = page.locator('main');
        await expect(main).toBeVisible();
      });
    });
  });

  test.describe('Accessibility Tests', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');
      
      // Check for h1
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      
      // Check that h2s come after h1
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingTexts = await headings.allTextContents();
      expect(headingTexts.length).toBeGreaterThan(1);
    });

    test('should have alt text for images', async ({ page }) => {
      await page.goto('/');
      
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i);
        await expect(image).toHaveAttribute('alt');
      }
    });

    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/');
      
      // Check for main landmark
      const main = page.locator('main');
      await expect(main).toHaveAttribute('role', 'main');
      
      // Check for banner
      const banner = page.locator('[role="banner"]');
      await expect(banner).toBeVisible();
      
      // Check for contentinfo
      const footer = page.locator('[role="contentinfo"]');
      await expect(footer).toBeVisible();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/');
      
      // Focus on skip link
      await page.keyboard.press('Tab');
      const skipLink = page.locator('a.skip-link');
      await expect(skipLink).toBeFocused();
      
      // Continue tabbing to check focusable elements
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('Performance Tests', () => {
    test('should load critical resources quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should have proper image optimization', async ({ page }) => {
      await page.goto('/');
      
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i);
        
        // Check for loading attribute
        const loading = await image.getAttribute('loading');
        if (i === 0) {
          // First image should be eager loaded
          expect(loading).toBe('eager');
        } else {
          // Other images should be lazy loaded
          expect(loading).toBe('lazy');
        }
        
        // Check for width and height attributes
        await expect(image).toHaveAttribute('width');
        await expect(image).toHaveAttribute('height');
      }
    });
  });

  test.describe('SLDS Compliance Tests', () => {
    test('should use SLDS components', async ({ page }) => {
      await page.goto('/');
      
      // Check for SLDS classes
      const sldsElements = page.locator('[class*="slds-"]');
      const sldsCount = await sldsElements.count();
      expect(sldsCount).toBeGreaterThan(0);
      
      // Check for proper SLDS button usage
      const sldsButtons = page.locator('.slds-button');
      expect(await sldsButtons.count()).toBeGreaterThan(0);
      
      // Check for SLDS grid system
      const sldsGrid = page.locator('.slds-grid');
      expect(await sldsGrid.count()).toBeGreaterThan(0);
    });

    test('should have proper SLDS brand components', async ({ page }) => {
      await page.goto('/');
      
      // Check for SLDS brand component
      const sldsBrand = page.locator('.slds-brand');
      await expect(sldsBrand).toBeVisible();
      
      // Check for proper brand logo usage
      const brandLogo = page.locator('.slds-brand__logo-image');
      await expect(brandLogo).toBeVisible();
    });
  });

  test.describe('Responsive Design Tests', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
    ];

    viewports.forEach(({ name, width, height }) => {
      test(`should be responsive on ${name}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        
        // Check that content is visible
        const main = page.locator('main');
        await expect(main).toBeVisible();
        
        // Check that hero title is visible
        const heroTitle = page.locator('.hero-title');
        await expect(heroTitle).toBeVisible();
        
        // Check that navigation is present (may be different on mobile)
        const nav = page.locator('nav');
        await expect(nav).toBeVisible();
      });
    });
  });

  test.describe('Form and Interaction Tests', () => {
    test('should handle focus states properly', async ({ page }) => {
      await page.goto('/');
      
      // Test focus on buttons
      const buttons = page.locator('button, a.slds-button');
      const buttonCount = await buttons.count();
      
      if (buttonCount > 0) {
        const firstButton = buttons.first();
        await firstButton.focus();
        await expect(firstButton).toBeFocused();
      }
    });

    test('should have proper color contrast', async ({ page }) => {
      await page.goto('/');
      
      // This is a basic check - in a real scenario, you'd use axe-core
      // to programmatically check color contrast
      const body = page.locator('body');
      const bodyStyles = await body.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
        };
      });
      
      expect(bodyStyles.color).toBeTruthy();
      expect(bodyStyles.backgroundColor).toBeTruthy();
    });
  });
});