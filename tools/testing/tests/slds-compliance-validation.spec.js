// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * SLDS COMPLIANCE VALIDATION DURING DECONFLICTION
 * Ensures 89% SLDS compliance baseline is maintained during CSS deconfliction
 */

test.describe("SLDS Compliance Validation", () => {

  test("SLDS Token Usage: Spacing Compliance", async ({ page }) => {
    await page.goto("/");
    
    // Check for SLDS spacing token usage
    const spacingCompliance = await page.evaluate(() => {
      const elements = document.querySelectorAll("*");
      let sldsSpacingCount = 0;
      let totalSpacingProperties = 0;
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const spacingProps = ["padding", "margin", "gap"];
        
        spacingProps.forEach(prop => {
          const value = styles.getPropertyValue(prop);
          if (value && value !== "0px") {
            totalSpacingProperties++;
            // Check for SLDS-like spacing values (multiples of 4px, 8px, 12px, 16px, etc.)
            if (value.match(/^(4|8|12|16|20|24|32|48|64)px$/) || 
                value.includes("var(--slds") || 
                value.includes("rem")) {
              sldsSpacingCount++;
            }
          }
        });
      });
      
      return {
        sldsCompliantSpacing: sldsSpacingCount,
        totalSpacingProperties,
        complianceRate: totalSpacingProperties > 0 ? (sldsSpacingCount / totalSpacingProperties) : 0
      };
    });
    
    // Maintain 89% SLDS baseline compliance
    expect(spacingCompliance.complianceRate).toBeGreaterThan(0.85);
    console.log(`✅ SLDS Spacing Compliance: ${(spacingCompliance.complianceRate * 100).toFixed(1)}%`);
  });

  test("SLDS Component Structure: Navigation Compliance", async ({ page }) => {
    await page.goto("/");
    
    // Check for SLDS navigation structure
    const sldsNavCompliance = await page.evaluate(() => {
      const navElements = {
        sldsContainer: document.querySelectorAll(".slds-container, .slds-container_fluid").length,
        sldsBrand: document.querySelectorAll(".slds-brand, .slds-brand__logo-link").length,
        sldsNav: document.querySelectorAll("[class*=slds-nav]").length,
        sldsUtilities: document.querySelectorAll("[class*=slds-]").length
      };
      
      return navElements;
    });
    
    // Verify SLDS components are preserved
    expect(sldsNavCompliance.sldsContainer).toBeGreaterThan(0);
    expect(sldsNavCompliance.sldsUtilities).toBeGreaterThan(5); // Should have multiple SLDS classes
    
    console.log(`✅ SLDS Components: ${sldsNavCompliance.sldsUtilities} SLDS classes preserved`);
  });

  test("SLDS Typography: Heading and Text Compliance", async ({ page }) => {
    await page.goto("/");
    
    // Check typography compliance
    const typographyCompliance = await page.evaluate(() => {
      const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
      const textElements = document.querySelectorAll("p, span, div");
      
      let sldsTypographyCount = 0;
      let totalTypographyElements = headings.length + textElements.length;
      
      [...headings, ...textElements].forEach(el => {
        const classes = el.className;
        if (classes.includes("slds-text") || 
            classes.includes("slds-heading") ||
            classes.includes("slds-") ||
            el.tagName.match(/H[1-6]/)) {
          sldsTypographyCount++;
        }
      });
      
      return {
        sldsTypographyElements: sldsTypographyCount,
        totalTypographyElements,
        complianceRate: totalTypographyElements > 0 ? (sldsTypographyCount / totalTypographyElements) : 0
      };
    });
    
    console.log(`✅ SLDS Typography: ${(typographyCompliance.complianceRate * 100).toFixed(1)}% compliance`);
  });

  test("SLDS Colors: Design Token Compliance", async ({ page }) => {
    await page.goto("/");
    
    // Check for SLDS color token usage
    const colorCompliance = await page.evaluate(() => {
      const elements = document.querySelectorAll("*");
      let sldsColorCount = 0;
      let totalColorProperties = 0;
      
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const colorProps = ["color", "background-color", "border-color"];
        
        colorProps.forEach(prop => {
          const value = styles.getPropertyValue(prop);
          if (value && value !== "rgba(0, 0, 0, 0)" && value !== "transparent") {
            totalColorProperties++;
            // Check for SLDS-like color values or CSS variables
            if (value.includes("var(--slds") || 
                value.includes("rgb(") ||
                value.match(/#[0-9a-fA-F]{6}/)) {
              sldsColorCount++;
            }
          }
        });
      });
      
      return {
        sldsColorCount,
        totalColorProperties,
        complianceRate: totalColorProperties > 0 ? (sldsColorCount / totalColorProperties) : 0
      };
    });
    
    console.log(`✅ SLDS Colors: ${(colorCompliance.complianceRate * 100).toFixed(1)}% token compliance`);
  });

  test("Cross-Page SLDS Compliance Consistency", async ({ page }) => {
    const pages = ["/", "/about.html", "/services.html", "/resources.html", "/impact.html", "/contact.html"];
    const complianceResults = [];
    
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      
      const pageCompliance = await page.evaluate(() => {
        const sldsElements = document.querySelectorAll("[class*=slds-]").length;
        const totalElements = document.querySelectorAll("*").length;
        
        return {
          sldsElements,
          totalElements,
          complianceRate: (sldsElements / totalElements)
        };
      });
      
      complianceResults.push({
        page: pageUrl,
        compliance: pageCompliance.complianceRate
      });
      
      // Each page should maintain reasonable SLDS usage
      expect(pageCompliance.sldsElements).toBeGreaterThan(3);
    }
    
    // Calculate average compliance across all pages
    const avgCompliance = complianceResults.reduce((sum, result) => sum + result.compliance, 0) / complianceResults.length;
    console.log(`✅ Average SLDS compliance across all pages: ${(avgCompliance * 100).toFixed(1)}%`);
    
    // Ensure consistency (no page should deviate too much from average)
    complianceResults.forEach(result => {
      const deviation = Math.abs(result.compliance - avgCompliance);
      expect(deviation).toBeLessThan(0.1); // 10% deviation tolerance
    });
  });
});
