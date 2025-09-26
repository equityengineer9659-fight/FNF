// Phase 4.1A Web Components Integration Test
const { chromium } = require('playwright');

async function testWebComponentsIntegration() {
  console.log('🧪 Phase 4.1A Web Components Integration Test Starting...\n');
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Navigate to the page with enhanced architecture
    await page.goto('http://localhost:8080/');
    await page.waitForLoadState('networkidle');
    
    // Test 1: Check if enhanced architecture is loading
    console.log('🔍 Test 1: Enhanced Architecture Loading');
    const architectureStatus = await page.evaluate(() => {
      return {
        enhancedArchitectureExists: typeof window.EnhancedArchitecture !== 'undefined',
        componentLoaderExists: typeof window.ComponentLoader !== 'undefined',
        customElementsSupported: typeof window.customElements !== 'undefined',
        modulesSupported: 'noModule' in document.createElement('script'),
        enhancedArchitectureStatus: window.EnhancedArchitectureStatus || null
      };
    });
    
    console.log(`   Enhanced Architecture loaded: ${architectureStatus.enhancedArchitectureExists ? '✅' : '❌'}`);
    console.log(`   Component Loader available: ${architectureStatus.componentLoaderExists ? '✅' : '❌'}`);
    console.log(`   Custom Elements supported: ${architectureStatus.customElementsSupported ? '✅' : '❌'}`);
    console.log(`   ES6 Modules supported: ${architectureStatus.modulesSupported ? '✅' : '❌'}`);
    
    if (architectureStatus.enhancedArchitectureStatus) {
      console.log(`   Architecture initialized: ${architectureStatus.enhancedArchitectureStatus.initialized ? '✅' : '❌'}`);
      console.log(`   Components loaded: ${architectureStatus.enhancedArchitectureStatus.componentsLoaded || 0}`);
      console.log(`   Init time: ${(architectureStatus.enhancedArchitectureStatus.initTime || 0).toFixed(2)}ms`);
    }
    
    // Test 2: Check for navigation component registration
    console.log('\n🧭 Test 2: Navigation Component Registration');
    const navigationComponentStatus = await page.evaluate(() => {
      const navComponentRegistered = customElements.get('navigation-component') !== undefined;
      const navComponentElements = document.querySelectorAll('navigation-component');
      
      return {
        registered: navComponentRegistered,
        elementsInDOM: navComponentElements.length,
        customElementsRegistry: Array.from(customElements).length || 'unavailable'
      };
    });
    
    console.log(`   Navigation component registered: ${navigationComponentStatus.registered ? '✅' : '❌'}`);
    console.log(`   Navigation elements in DOM: ${navigationComponentStatus.elementsInDOM}`);
    console.log(`   Custom elements in registry: ${navigationComponentStatus.customElementsRegistry}`);
    
    // Test 3: Check enhanced navigation functionality
    console.log('\n📱 Test 3: Enhanced Navigation Functionality');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const enhancedNavTest = await page.evaluate(() => {
      const mobileToggle = document.querySelector('.mobile-nav-toggle');
      const navMenu = document.querySelector('.nav-menu');
      
      if (!mobileToggle || !navMenu) {
        return { error: 'Navigation elements not found' };
      }
      
      // Check for enhanced attributes (ARIA improvements)
      const hasEnhancedARIA = mobileToggle.hasAttribute('aria-expanded') && 
                              mobileToggle.hasAttribute('aria-controls') && 
                              mobileToggle.hasAttribute('aria-label');
      
      // Test if enhanced click handler is working
      const originalOnclick = mobileToggle.onclick;
      
      // Check for enhanced event listeners (can't directly test but check for indicators)
      const hasEnhancedListeners = !originalOnclick; // Enhanced version removes onclick in favor of addEventListener
      
      return {
        mobileToggleExists: true,
        navMenuExists: true,
        hasEnhancedARIA: hasEnhancedARIA,
        hasEnhancedListeners: hasEnhancedListeners,
        ariaExpanded: mobileToggle.getAttribute('aria-expanded'),
        ariaControls: mobileToggle.getAttribute('aria-controls'),
        ariaLabel: mobileToggle.getAttribute('aria-label')
      };
    });
    
    if (enhancedNavTest.error) {
      console.log(`   ❌ ${enhancedNavTest.error}`);
    } else {
      console.log(`   Enhanced ARIA attributes: ${enhancedNavTest.hasEnhancedARIA ? '✅' : '❌'}`);
      console.log(`   Enhanced event listeners: ${enhancedNavTest.hasEnhancedListeners ? '✅' : '❌'}`);
      console.log(`   ARIA expanded: ${enhancedNavTest.ariaExpanded || 'not set'}`);
      console.log(`   ARIA controls: ${enhancedNavTest.ariaControls || 'not set'}`);
      console.log(`   ARIA label: ${enhancedNavTest.ariaLabel || 'not set'}`);
    }
    
    // Test 4: Console log analysis for enhanced architecture messages
    console.log('\n📋 Test 4: Enhanced Architecture Console Messages');
    const consoleLogs = [];
    
    page.on('console', (msg) => {
      if (msg.text().includes('Enhanced') || msg.text().includes('Component') || msg.text().includes('Phase 4')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // Reload to catch initialization messages
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Allow time for initialization
    
    console.log(`   Architecture messages captured: ${consoleLogs.length}`);
    if (consoleLogs.length > 0) {
      console.log('   Recent messages:');
      consoleLogs.slice(-5).forEach(log => {
        console.log(`     ${log}`);
      });
    }
    
    // Test 5: Performance impact assessment
    console.log('\n⚡ Test 5: Performance Impact Assessment');
    const performanceMetrics = await page.evaluate(() => {
      const perfEntries = performance.getEntriesByType("navigation")[0];
      const resourceEntries = performance.getEntriesByType("resource");
      
      let jsSize = 0;
      let moduleScripts = 0;
      let noModuleScripts = 0;
      
      resourceEntries.forEach(entry => {
        if (entry.name.includes('.js')) {
          jsSize += entry.transferSize || 0;
          
          if (entry.name.includes('enhanced-architecture') || entry.name.includes('enhanced-bundle')) {
            if (entry.name.includes('enhanced-architecture')) moduleScripts++;
            if (entry.name.includes('enhanced-bundle')) noModuleScripts++;
          }
        }
      });
      
      return {
        totalJSSize: jsSize,
        domContentLoaded: perfEntries.domContentLoadedEventEnd - perfEntries.domContentLoadedEventStart,
        loadComplete: perfEntries.loadEventEnd - perfEntries.loadEventStart,
        moduleScriptsLoaded: moduleScripts,
        noModuleScriptsLoaded: noModuleScripts
      };
    });
    
    const jsKB = performanceMetrics.totalJSSize / 1024;
    console.log(`   Total JS bundle: ${jsKB.toFixed(1)}KB`);
    console.log(`   DOM content loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`   Load complete: ${performanceMetrics.loadComplete.toFixed(2)}ms`);
    console.log(`   Module scripts loaded: ${performanceMetrics.moduleScriptsLoaded}`);
    console.log(`   NoModule scripts loaded: ${performanceMetrics.noModuleScriptsLoaded}`);
    
    // Overall assessment
    console.log('\n🎯 Phase 4.1A Integration Assessment:');
    console.log('=' .repeat(50));
    
    const tests = [
      { name: 'Enhanced Architecture Loading', pass: architectureStatus.enhancedArchitectureExists },
      { name: 'Web Components Support', pass: architectureStatus.customElementsSupported },
      { name: 'Navigation Component Registered', pass: navigationComponentStatus.registered },
      { name: 'Enhanced Navigation Features', pass: enhancedNavTest.hasEnhancedARIA },
      { name: 'Performance Within Budget', pass: jsKB < 90 } // Allow 90KB for enhanced architecture
    ];
    
    const passedTests = tests.filter(t => t.pass).length;
    const totalTests = tests.length;
    
    tests.forEach(test => {
      console.log(`   ${test.name}: ${test.pass ? '✅ PASS' : '❌ FAIL'}`);
    });
    
    console.log(`\n📊 Integration Success Rate: ${passedTests}/${totalTests} tests passed (${(passedTests/totalTests*100).toFixed(1)}%)`);
    
    if (passedTests >= 3) {
      console.log('✅ Phase 4.1A Web Components integration successful!');
      console.log('🚀 Enhanced HTML-First Architecture is operational');
    } else {
      console.log('⚠️  Phase 4.1A integration needs attention');
      console.log('🔄 Falling back to HTML-first baseline functionality');
    }
    
  } catch (error) {
    console.error('❌ Web Components integration test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testWebComponentsIntegration();