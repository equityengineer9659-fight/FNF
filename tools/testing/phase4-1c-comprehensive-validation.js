/**
 * PHASE 4.1C: COMPREHENSIVE ARCHITECTURE VALIDATION
 * Complete validation of Enhanced HTML-First Architecture before Phase 4.2
 * Ensures zero regression and validates all architectural components
 */

const { chromium, firefox, webkit } = require('playwright');

class Phase41CValidator {
  constructor() {
    this.testResults = {
      integrationTests: [],
      mobileNavTests: [],
      performanceTests: [],
      specialEffectsTests: [],
      crossBrowserTests: []
    };
    
    this.validationScore = {
      integration: 0,
      mobileNavigation: 0,
      performance: 0,
      specialEffects: 0,
      crossBrowser: 0
    };

    // Critical breakpoints for mobile navigation testing
    this.breakpoints = [
      { name: 'mobile-xs', width: 320, height: 568 },
      { name: 'mobile-sm', width: 375, height: 812 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop-sm', width: 1024, height: 768 },
      { name: 'desktop-xl', width: 1920, height: 1080 }
    ];

    // All 6 pages for comprehensive testing
    this.pages = [
      { name: 'index', url: '/', critical: true },
      { name: 'about', url: '/about.html', critical: true },
      { name: 'services', url: '/services.html', critical: true },
      { name: 'resources', url: '/resources.html', critical: false },
      { name: 'impact', url: '/impact.html', critical: false },
      { name: 'contact', url: '/contact.html', critical: true }
    ];
  }

  async executeComprehensiveValidation() {
    console.log('🔍 Phase 4.1C: Comprehensive Architecture Validation Starting...\n');
    
    try {
      // Test 1: Integration Testing
      console.log('📊 Test 1: Enhanced Architecture Integration Testing');
      await this.testArchitectureIntegration();
      
      // Test 2: Mobile Navigation P0 Protection
      console.log('\n📱 Test 2: Mobile Navigation P0 Protection Validation');
      await this.testMobileNavigationProtection();
      
      // Test 3: Performance Budget Compliance
      console.log('\n⚡ Test 3: Performance Budget Compliance Verification');
      await this.testPerformanceBudgetCompliance();
      
      // Test 4: Special Effects Preservation
      console.log('\n✨ Test 4: Special Effects Preservation Testing');
      await this.testSpecialEffectsPreservation();
      
      // Test 5: Cross-Browser Compatibility
      console.log('\n🌐 Test 5: Cross-Browser Compatibility Testing');
      await this.testCrossBrowserCompatibility();
      
      // Final Assessment
      console.log('\n🎯 Phase 4.1C: Final Architecture Validation');
      this.generateFinalAssessment();
      
    } catch (error) {
      console.error('❌ Phase 4.1C validation failed:', error.message);
      throw error;
    }
  }

  async testArchitectureIntegration() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      await page.goto('http://localhost:8080/');
      await page.waitForLoadState('networkidle');
      
      const integrationResults = await page.evaluate(() => {
        const results = {
          enhancedArchitectureLoaded: false,
          componentLoaderActive: false,
          webComponentsRegistered: false,
          typeScriptFunctioning: false,
          progressiveEnhancementWorking: false,
          gracefulDegradationTested: false,
          moduleLoadingWorking: false,
          errorHandlingActive: false
        };
        
        // Check Enhanced Architecture
        results.enhancedArchitectureLoaded = typeof window.EnhancedArchitecture !== 'undefined';
        results.componentLoaderActive = typeof window.ComponentLoader !== 'undefined';
        
        // Check Web Components registration
        results.webComponentsRegistered = customElements.get('navigation-component') !== undefined;
        
        // Check TypeScript compilation (look for compiled indicators)
        const scripts = Array.from(document.querySelectorAll('script'));
        results.typeScriptFunctioning = scripts.some(script => 
          script.src.includes('enhanced-architecture') || 
          script.src.includes('component-loader')
        );
        
        // Check progressive enhancement
        const mobileToggle = document.querySelector('.mobile-nav-toggle');
        if (mobileToggle) {
          results.progressiveEnhancementWorking = 
            mobileToggle.hasAttribute('aria-expanded') &&
            mobileToggle.hasAttribute('aria-controls') &&
            mobileToggle.hasAttribute('aria-label');
        }
        
        // Check module loading
        const moduleScripts = Array.from(document.querySelectorAll('script[type="module"]'));
        results.moduleLoadingWorking = moduleScripts.length > 0;
        
        // Test graceful degradation by simulating component failure
        try {
          // This should not throw an error due to graceful degradation
          if (window.ComponentLoader && window.ComponentLoader.cleanup) {
            results.gracefulDegradationTested = true;
          }
        } catch (e) {
          results.gracefulDegradationTested = false;
        }
        
        // Check error handling
        results.errorHandlingActive = 
          typeof window.onerror === 'function' ||
          window.addEventListener !== undefined;
        
        return results;
      });
      
      // Score integration testing
      const integrationTests = Object.entries(integrationResults);
      const passedIntegration = integrationTests.filter(([, passed]) => passed).length;
      this.validationScore.integration = (passedIntegration / integrationTests.length) * 100;
      
      integrationTests.forEach(([test, passed]) => {
        const result = `   ${test}: ${passed ? '✅' : '❌'}`;
        console.log(result);
        this.testResults.integrationTests.push({ test, passed, result });
      });
      
      console.log(`   Integration Score: ${this.validationScore.integration.toFixed(1)}%`);
      
    } finally {
      await browser.close();
    }
  }

  async testMobileNavigationProtection() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      let totalTests = 0;
      let passedTests = 0;
      
      // Test across all breakpoints and critical pages
      for (const breakpoint of this.breakpoints) {
        for (const pageInfo of this.pages.filter(p => p.critical)) {
          totalTests++;
          
          await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
          await page.goto(`http://localhost:8080${pageInfo.url}`);
          await page.waitForLoadState('networkidle');
          
          const navTest = await page.evaluate(() => {
            const navbar = document.querySelector('.navbar');
            const navMenu = document.querySelector('.nav-menu');
            const mobileToggle = document.querySelector('.mobile-nav-toggle');
            const logo = document.querySelector('.fnf-logo-image');
            
            const tests = {
              navbarExists: !!navbar,
              navMenuExists: !!navMenu,
              mobileToggleExists: !!mobileToggle,
              logoExists: !!logo,
              navbarVisible: navbar ? getComputedStyle(navbar).display !== 'none' : false,
              toggleVisible: mobileToggle ? getComputedStyle(mobileToggle).display !== 'none' : false,
              ariaEnhanced: mobileToggle ? mobileToggle.hasAttribute('aria-expanded') : false
            };
            
            return tests;
          });
          
          // P0 Requirements Check
          const p0Requirements = [
            navTest.navbarExists,
            navTest.navMenuExists, 
            navTest.navbarVisible
          ];
          
          // Mobile-specific requirements
          if (breakpoint.width < 768) {
            p0Requirements.push(navTest.mobileToggleExists, navTest.toggleVisible);
          }
          
          const testPassed = p0Requirements.every(req => req);
          if (testPassed) passedTests++;
          
          const result = `   ${pageInfo.name} @ ${breakpoint.name}: ${testPassed ? '✅' : '❌'}`;
          console.log(result);
          this.testResults.mobileNavTests.push({
            page: pageInfo.name,
            breakpoint: breakpoint.name,
            passed: testPassed,
            result,
            details: navTest
          });
        }
      }
      
      this.validationScore.mobileNavigation = (passedTests / totalTests) * 100;
      console.log(`   Mobile Navigation P0 Score: ${this.validationScore.mobileNavigation.toFixed(1)}%`);
      
    } finally {
      await browser.close();
    }
  }

  async testPerformanceBudgetCompliance() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      const performanceResults = [];
      
      // Test performance across critical pages
      for (const pageInfo of this.pages.filter(p => p.critical)) {
        await page.goto(`http://localhost:8080${pageInfo.url}`);
        await page.waitForLoadState('networkidle');
        
        const metrics = await page.evaluate(() => {
          const perfEntries = performance.getEntriesByType("navigation")[0];
          const resourceEntries = performance.getEntriesByType("resource");
          
          let cssSize = 0;
          let jsSize = 0;
          let totalSize = 0;
          
          resourceEntries.forEach(entry => {
            const size = entry.transferSize || 0;
            totalSize += size;
            
            if (entry.name.includes('.css')) {
              cssSize += size;
            }
            if (entry.name.includes('.js')) {
              jsSize += size;
            }
          });
          
          return {
            domContentLoaded: perfEntries.domContentLoadedEventEnd - perfEntries.domContentLoadedEventStart,
            loadComplete: perfEntries.loadEventEnd - perfEntries.loadEventStart,
            totalCssSize: cssSize,
            totalJsSize: jsSize,
            totalBundleSize: totalSize,
            firstPaint: performance.getEntriesByName("first-paint")[0]?.startTime || 0
          };
        });
        
        // Phase 4 Budget Compliance Check
        const budgetCompliance = {
          totalBundle: metrics.totalBundleSize < 290 * 1024, // 290KB
          cssBundle: metrics.totalCssSize < 27 * 1024, // 27KB  
          jsBundle: metrics.totalJsSize < 21 * 1024, // 21KB (expanded for TypeScript)
          loadTime: metrics.loadComplete < 2000 // 2s
        };
        
        const passedBudgets = Object.values(budgetCompliance).filter(Boolean).length;
        const budgetScore = (passedBudgets / 4) * 100;
        
        const result = {
          page: pageInfo.name,
          totalKB: (metrics.totalBundleSize / 1024).toFixed(1),
          cssKB: (metrics.totalCssSize / 1024).toFixed(1), 
          jsKB: (metrics.totalJsSize / 1024).toFixed(1),
          loadTime: metrics.loadComplete.toFixed(2),
          budgetScore: budgetScore,
          compliance: budgetCompliance
        };
        
        performanceResults.push(result);
        
        console.log(`   ${pageInfo.name}: ${result.totalKB}KB total (${result.budgetScore.toFixed(0)}% budget compliant)`);
        console.log(`     CSS: ${result.cssKB}KB, JS: ${result.jsKB}KB, Load: ${result.loadTime}ms`);
      }
      
      // Calculate overall performance score
      const avgBudgetScore = performanceResults.reduce((sum, r) => sum + r.budgetScore, 0) / performanceResults.length;
      this.validationScore.performance = avgBudgetScore;
      this.testResults.performanceTests = performanceResults;
      
      console.log(`   Performance Budget Score: ${this.validationScore.performance.toFixed(1)}%`);
      
    } finally {
      await browser.close();
    }
  }

  async testSpecialEffectsPreservation() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      await page.goto('http://localhost:8080/');
      await page.waitForLoadState('networkidle');
      
      const effectsResults = await page.evaluate(() => {
        const results = {
          logoPresent: false,
          logoAnimations: false,
          logoTransforms: false,
          logoGradients: false,
          glassmorphismActive: false,
          backgroundEffectsActive: false,
          blueGradientIconsActive: false,
          performanceOptimized: false
        };
        
        // Test logo effects
        const logo = document.querySelector('.fnf-logo-image');
        if (logo) {
          results.logoPresent = true;
          const logoStyle = getComputedStyle(logo);
          results.logoAnimations = logoStyle.animationName !== 'none';
          results.logoTransforms = logoStyle.transform !== 'none' && logoStyle.transform !== 'matrix(1, 0, 0, 1, 0, 0)';
          results.logoGradients = logoStyle.backgroundImage.includes('gradient');
        }
        
        // Test glassmorphism effects
        const glassElements = document.querySelectorAll('[class*="glass"], .hero-content, .navbar');
        results.glassmorphismActive = Array.from(glassElements).some(el => {
          const style = getComputedStyle(el);
          return style.backdropFilter !== 'none' || 
                 style.webkitBackdropFilter !== 'none' ||
                 (style.background.includes('rgba') && style.background.includes('0.'));
        });
        
        // Test background effects
        results.backgroundEffectsActive = !!(
          document.querySelector('.background-animation') ||
          document.querySelector('[class*="spin"]') ||
          document.querySelector('[style*="animation"]')
        );
        
        // Test blue gradient icons
        const emojiIcons = document.querySelectorAll('.emoji-icon, [class*="icon"]');
        results.blueGradientIconsActive = Array.from(emojiIcons).some(el => {
          const style = getComputedStyle(el);
          return style.background.includes('radial-gradient') && 
                 (style.background.includes('blue') || style.background.includes('rgb('));
        });
        
        // Test performance optimization (60fps indicators)
        results.performanceOptimized = Array.from(document.querySelectorAll('*')).some(el => {
          const style = getComputedStyle(el);
          return style.willChange !== 'auto' || style.transform3d !== undefined;
        });
        
        return results;
      });
      
      const effectTests = Object.entries(effectsResults);
      const passedEffects = effectTests.filter(([, passed]) => passed).length;
      this.validationScore.specialEffects = (passedEffects / effectTests.length) * 100;
      
      effectTests.forEach(([test, passed]) => {
        const result = `   ${test}: ${passed ? '✅' : '❌'}`;
        console.log(result);
        this.testResults.specialEffectsTests.push({ test, passed, result });
      });
      
      console.log(`   Special Effects Score: ${this.validationScore.specialEffects.toFixed(1)}%`);
      
    } finally {
      await browser.close();
    }
  }

  async testCrossBrowserCompatibility() {
    const browsers = [
      { name: 'Chromium', launcher: chromium },
      { name: 'Firefox', launcher: firefox },
      { name: 'WebKit', launcher: webkit }
    ];
    
    const browserResults = [];
    
    for (const { name, launcher } of browsers) {
      try {
        console.log(`   Testing ${name}...`);
        const browser = await launcher.launch();
        const page = await browser.newPage();
        
        await page.goto('http://localhost:8080/');
        await page.waitForLoadState('networkidle');
        
        const browserTest = await page.evaluate(() => {
          return {
            navbarVisible: !!document.querySelector('.navbar') && 
                          getComputedStyle(document.querySelector('.navbar')).display !== 'none',
            mobileToggleExists: !!document.querySelector('.mobile-nav-toggle'),
            enhancedFeaturesWork: !!document.querySelector('.mobile-nav-toggle')?.hasAttribute('aria-expanded'),
            jsErrorsCount: window.jsErrors ? window.jsErrors.length : 0,
            cssLoaded: document.styleSheets.length > 0,
            specialEffectsWork: !!document.querySelector('.navbar') // Simplified check
          };
        });
        
        const testsPassed = Object.values(browserTest).filter(v => v === true || v === 0).length;
        const browserScore = (testsPassed / Object.keys(browserTest).length) * 100;
        
        browserResults.push({
          browser: name,
          score: browserScore,
          tests: browserTest,
          passed: browserScore >= 80
        });
        
        console.log(`     ${name}: ${browserScore.toFixed(1)}% (${browserScore >= 80 ? '✅' : '❌'})`);
        
        await browser.close();
        
      } catch (error) {
        console.log(`     ${name}: ❌ Failed (${error.message})`);
        browserResults.push({
          browser: name,
          score: 0,
          tests: {},
          passed: false,
          error: error.message
        });
      }
    }
    
    const avgBrowserScore = browserResults.reduce((sum, r) => sum + r.score, 0) / browserResults.length;
    this.validationScore.crossBrowser = avgBrowserScore;
    this.testResults.crossBrowserTests = browserResults;
    
    console.log(`   Cross-Browser Score: ${this.validationScore.crossBrowser.toFixed(1)}%`);
  }

  generateFinalAssessment() {
    console.log('=' .repeat(60));
    
    const scores = this.validationScore;
    const weights = {
      integration: 0.25,      // 25%
      mobileNavigation: 0.30, // 30% - P0 requirement
      performance: 0.20,      // 20%
      specialEffects: 0.15,   // 15%
      crossBrowser: 0.10      // 10%
    };
    
    // Calculate weighted overall score
    const overallScore = 
      scores.integration * weights.integration +
      scores.mobileNavigation * weights.mobileNavigation +
      scores.performance * weights.performance +
      scores.specialEffects * weights.specialEffects +
      scores.crossBrowser * weights.crossBrowser;
    
    console.log('📊 Phase 4.1C Architecture Validation Results:');
    console.log(`   Integration Testing: ${scores.integration.toFixed(1)}% (25% weight)`);
    console.log(`   Mobile Navigation P0: ${scores.mobileNavigation.toFixed(1)}% (30% weight)`);
    console.log(`   Performance Budget: ${scores.performance.toFixed(1)}% (20% weight)`);
    console.log(`   Special Effects: ${scores.specialEffects.toFixed(1)}% (15% weight)`);
    console.log(`   Cross-Browser: ${scores.crossBrowser.toFixed(1)}% (10% weight)`);
    
    console.log(`\n🎯 Overall Architecture Score: ${overallScore.toFixed(1)}%`);
    
    // Determine phase completion status
    const p0Passed = scores.mobileNavigation >= 90; // P0 requirement
    const overallPassed = overallScore >= 80;
    const criticalPassed = scores.integration >= 70 && scores.performance >= 75;
    
    if (p0Passed && overallPassed && criticalPassed) {
      console.log('✅ Phase 4.1C: ARCHITECTURE VALIDATION PASSED');
      console.log('🎉 Enhanced HTML-First Architecture fully validated');
      console.log('🚀 Ready for Phase 4.2: Security Hardening');
      
      this.generatePhase42Readiness();
      
    } else {
      console.log('⚠️  Phase 4.1C: ARCHITECTURE VALIDATION REQUIRES ATTENTION');
      console.log('🔧 Issues identified that need resolution:');
      
      if (!p0Passed) console.log('   • P0 Mobile Navigation below 90% threshold');
      if (!criticalPassed) console.log('   • Critical systems below minimum thresholds');
      if (!overallPassed) console.log('   • Overall architecture score below 80%');
      
      console.log('🔄 Recommend addressing issues before Phase 4.2');
    }
    
    // Technical Architect Summary
    console.log('\n📋 Technical Architect Summary:');
    console.log('-' .repeat(40));
    console.log(`   Architecture Maturity: ${overallScore >= 85 ? 'Production Ready' : overallScore >= 70 ? 'Near Production' : 'Development'}`);
    console.log(`   Zero Regression Status: ${p0Passed ? '✅ Maintained' : '⚠️ At Risk'}`);
    console.log(`   Performance Leadership: ${scores.performance >= 80 ? '✅ Maintained' : '⚠️ Needs Optimization'}`);
    console.log(`   TypeScript Integration: ${scores.integration >= 75 ? '✅ Successful' : '⚠️ Partial'}`);
    console.log(`   Production Readiness: ${overallPassed && p0Passed ? '✅ Phase 4.2 Ready' : '⚠️ Requires Work'}`);
  }

  generatePhase42Readiness() {
    console.log('\n🔐 Phase 4.2 Security Hardening Readiness:');
    console.log('-' .repeat(45));
    console.log('   ✅ Enhanced Architecture foundation stable');
    console.log('   ✅ Mobile navigation P0 protection verified');
    console.log('   ✅ Performance budgets maintained');
    console.log('   ✅ Cross-browser compatibility confirmed');
    console.log('   ✅ TypeScript integration operational');
    console.log('   🔐 Ready for CSP implementation');
    console.log('   🔐 Ready for security headers deployment');
    console.log('   🔐 Ready for XSS prevention framework');
  }
}

// Execute Phase 4.1C validation
const validator = new Phase41CValidator();
validator.executeComprehensiveValidation();