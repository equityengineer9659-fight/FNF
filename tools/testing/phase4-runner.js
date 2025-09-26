// Phase 4 Test Runner - Direct validation without Playwright config conflicts
const { chromium } = require('playwright');

async function runPhase4Validation() {
  console.log('🚀 Phase 4 Implementation Validation Starting...\n');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Test 1: Performance Budget Validation (Phase 4 targets)
    console.log('📊 Test 1: Phase 4 Performance Budget Validation');
    await page.goto('http://localhost:8080/');
    await page.waitForLoadState('networkidle');
    
    const performanceMetrics = await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType("navigation")[0];
      const resourceEntries = performance.getEntriesByType("resource");
      
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
        totalCssSize: cssSize,
        totalJsSize: jsSize,
        totalBundleSize: cssSize + jsSize
      };
    });
    
    const totalKB = performanceMetrics.totalBundleSize / 1024;
    const cssKB = performanceMetrics.totalCssSize / 1024;
    const jsKB = performanceMetrics.totalJsSize / 1024;
    
    console.log(`   Total Bundle: ${totalKB.toFixed(1)}KB (Budget: 290KB) - ${totalKB < 290 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   CSS Bundle: ${cssKB.toFixed(1)}KB (Budget: 27KB) - ${cssKB < 27 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   JS Bundle: ${jsKB.toFixed(1)}KB (Budget: 21KB) - ${jsKB < 21 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Load Time: ${performanceMetrics.loadComplete}ms - ${performanceMetrics.loadComplete < 2000 ? '✅ PASS' : '❌ FAIL'}\n`);
    
    // Test 2: Mobile Navigation P0 Protection
    console.log('📱 Test 2: Mobile Navigation P0 Protection');
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:8080/');
    await page.waitForLoadState('networkidle');
    
    const mobileNavigation = await page.evaluate(() => {
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
    
    console.log(`   Navbar exists: ${mobileNavigation.navbar ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Nav menu exists: ${mobileNavigation.navMenu ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Mobile toggle exists: ${mobileNavigation.mobileToggle ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Toggle visible: ${mobileNavigation.toggleVisible ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Navigation links: ${mobileNavigation.navLinks} ${mobileNavigation.navLinks > 0 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Logo present: ${mobileNavigation.logo ? '✅ PASS' : '❌ FAIL'}\n`);
    
    // Test 3: SLDS Compliance Validation
    console.log('🎨 Test 3: SLDS Compliance Validation');
    const sldsMetrics = await page.evaluate(() => {
      const elements = document.querySelectorAll("*");
      let sldsUtilityCount = 0;
      let totalClassCount = 0;
      let sldsTokenCount = 0;
      let totalStyleCount = 0;
      
      elements.forEach(el => {
        const classes = el.className.toString().split(/\s+/).filter(c => c.length > 0);
        totalClassCount += classes.length;
        
        classes.forEach(cls => {
          if (cls.startsWith('slds-') || 
              cls.match(/^(m|p)(t|r|b|l|x|y)?-[0-9]+$/) ||
              cls.match(/^(text|bg|border)-.+/) ||
              cls.match(/^(flex|grid|block|inline)/) ||
              cls.includes('responsive')) {
            sldsUtilityCount++;
          }
        });
        
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
        overallSldsCompliance
      };
    });
    
    console.log(`   SLDS Compliance: ${sldsMetrics.overallSldsCompliance.toFixed(1)}% (Minimum: 89%) - ${sldsMetrics.overallSldsCompliance > 89 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Utility classes: ${sldsMetrics.sldsUtilityCount}/${sldsMetrics.totalClassCount}`);
    console.log(`   Design tokens: ${sldsMetrics.sldsTokenCount}/${sldsMetrics.totalStyleCount}\n`);
    
    // Test 4: Special Effects Preservation
    console.log('✨ Test 4: Special Effects Preservation');
    const specialEffects = await page.evaluate(() => {
      const logo = document.querySelector(".fnf-logo-image");
      const logoEffects = logo ? {
        hasLogo: true,
        hasAnimations: getComputedStyle(logo).animationName !== 'none',
        hasTransforms: getComputedStyle(logo).transform !== 'none',
        hasGradients: getComputedStyle(logo).backgroundImage.includes('gradient')
      } : { hasLogo: false };
      
      const glassElements = document.querySelectorAll("[class*='glass'], .hero-content, .navbar");
      const glassmorphism = Array.from(glassElements).some(el => {
        const style = getComputedStyle(el);
        return style.backdropFilter !== 'none' || 
               style.webkitBackdropFilter !== 'none' ||
               style.background.includes('rgba');
      });
      
      const backgroundEffects = document.querySelector(".background-animation") || 
                               document.querySelector("[class*='spin']") ||
                               document.querySelector("[style*='animation']");
      
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
    
    console.log(`   Special effects: ${specialEffects.totalEffectsActive}/4 active - ${specialEffects.totalEffectsActive >= 3 ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Logo present: ${specialEffects.logoEffects.hasLogo ? '✅' : '❌'}`);
    console.log(`   Glassmorphism: ${specialEffects.glassmorphism ? '✅' : '❌'}`);
    console.log(`   Background effects: ${specialEffects.backgroundEffects ? '✅' : '❌'}`);
    console.log(`   Blue gradients: ${specialEffects.blueGradients ? '✅' : '❌'}\n`);
    
    // Summary
    const tests = [
      { name: 'Performance Budget', pass: totalKB < 290 && cssKB < 27 && jsKB < 21 },
      { name: 'Mobile Navigation P0', pass: mobileNavigation.navbar && mobileNavigation.navMenu && mobileNavigation.mobileToggle && mobileNavigation.logo },
      { name: 'SLDS Compliance', pass: sldsMetrics.overallSldsCompliance > 89 },
      { name: 'Special Effects', pass: specialEffects.totalEffectsActive >= 3 }
    ];
    
    const passedTests = tests.filter(t => t.pass).length;
    const totalTests = tests.length;
    
    console.log('📋 Phase 4 Implementation Status Summary:');
    console.log('=' .repeat(50));
    tests.forEach(test => {
      console.log(`   ${test.name}: ${test.pass ? '✅ PASS' : '❌ FAIL'}`);
    });
    console.log(`\n🎯 Overall Status: ${passedTests}/${totalTests} tests passed (${(passedTests/totalTests*100).toFixed(1)}%)`);
    
    if (passedTests === totalTests) {
      console.log('✅ Phase 4 implementation ready for next phase!');
    } else {
      console.log('⚠️  Phase 4 implementation needs attention before proceeding.');
    }
    
  } catch (error) {
    console.error('❌ Phase 4 validation error:', error.message);
  } finally {
    await browser.close();
  }
}

runPhase4Validation();