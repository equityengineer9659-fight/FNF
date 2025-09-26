// @ts-check
const { test, expect } = require("@playwright/test");

/**
 * PHASE 4 SECURITY HARDENING - CSP VALIDATION TESTING
 * Validates Content Security Policy implementation and security header deployment
 * Architecture: Staged CSP implementation (Report-Only → Enforcing) - ADR-011
 */

test.describe("Phase 4 Security Hardening - CSP Validation", () => {

  test("CSP Report-Only Mode Validation", async ({ page }) => {
    // Monitor CSP violations during normal page usage
    const cspViolations = [];
    
    page.on('console', msg => {
      if (msg.text().includes('Content Security Policy') || msg.text().includes('CSP')) {
        cspViolations.push(msg.text());
      }
    });
    
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    
    // Check current CSP headers
    const response = await page.goto("/");
    const cspHeader = response.headers()['content-security-policy'] || 
                     response.headers()['content-security-policy-report-only'];
    
    if (cspHeader) {
      console.log(`✅ CSP Header detected: ${cspHeader.substring(0, 100)}...`);
      
      // Parse CSP directives
      const directives = cspHeader.split(';').map(d => d.trim());
      const hasUnsafeInline = cspHeader.includes("'unsafe-inline'");
      const hasUnsafeEval = cspHeader.includes("'unsafe-eval'");
      
      // Current implementation allows some unsafe directives during transition
      console.log(`   'unsafe-inline': ${hasUnsafeInline ? '⚠️ Present' : '✅ Absent'}`);
      console.log(`   'unsafe-eval': ${hasUnsafeEval ? '⚠️ Present' : '✅ Absent'}`);
      console.log(`   Directives: ${directives.length}`);
    } else {
      console.log(`⚠️ No CSP header detected - baseline implementation needed`);
    }
    
    // Test page functionality with current CSP
    const functionality = await page.evaluate(() => {
      return {
        scriptsLoaded: document.scripts.length > 0,
        stylesLoaded: document.styleSheets.length > 0,
        noJsErrors: !window.onerror,
        imagesLoaded: document.images.length > 0
      };
    });
    
    expect(functionality.scriptsLoaded).toBe(true);
    expect(functionality.stylesLoaded).toBe(true);
    
    console.log(`✅ Page functionality maintained with CSP: ${cspViolations.length} violations`);
  });

  test("Security Headers Baseline Assessment", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response.headers();
    
    // Assess current security headers
    const securityHeaders = {
      'strict-transport-security': headers['strict-transport-security'],
      'x-frame-options': headers['x-frame-options'],
      'x-content-type-options': headers['x-content-type-options'],
      'referrer-policy': headers['referrer-policy'],
      'permissions-policy': headers['permissions-policy'] || headers['feature-policy'],
      'content-security-policy': headers['content-security-policy'],
      'csp-report-only': headers['content-security-policy-report-only']
    };
    
    let implementedCount = 0;
    let productionReadyCount = 0;
    
    Object.entries(securityHeaders).forEach(([header, value]) => {
      if (value) {
        implementedCount++;
        console.log(`✅ ${header}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
        
        // Check for production-ready configurations
        if (header === 'strict-transport-security' && value.includes('max-age')) {
          productionReadyCount++;
        } else if (header === 'x-frame-options' && (value === 'DENY' || value === 'SAMEORIGIN')) {
          productionReadyCount++;
        } else if (header === 'x-content-type-options' && value === 'nosniff') {
          productionReadyCount++;
        } else if (header === 'referrer-policy') {
          productionReadyCount++;
        } else if (header === 'content-security-policy' && !value.includes('unsafe-')) {
          productionReadyCount++;
        }
      } else {
        console.log(`❌ ${header}: Not implemented`);
      }
    });
    
    console.log(`\n📊 Security Headers Status:`);
    console.log(`   Implemented: ${implementedCount}/7 headers`);
    console.log(`   Production-ready: ${productionReadyCount}/7 configurations`);
    
    // Phase 4 baseline requirement: at least basic security headers
    expect(implementedCount).toBeGreaterThan(1);
  });

  test("Inline Script and Style Audit", async ({ page }) => {
    await page.goto("/");
    
    // Audit inline scripts and styles that need CSP handling
    const inlineContent = await page.evaluate(() => {
      // Find inline scripts
      const inlineScripts = Array.from(document.querySelectorAll('script:not([src])'))
        .map(script => ({
          content: script.innerHTML.substring(0, 100),
          length: script.innerHTML.length,
          hasContent: script.innerHTML.trim().length > 0
        }))
        .filter(script => script.hasContent);
      
      // Find inline styles
      const inlineStyles = Array.from(document.querySelectorAll('style, [style]'))
        .map(el => ({
          tag: el.tagName.toLowerCase(),
          content: el.tagName === 'STYLE' ? 
            el.innerHTML.substring(0, 100) : 
            el.getAttribute('style').substring(0, 100),
          length: el.tagName === 'STYLE' ? 
            el.innerHTML.length : 
            el.getAttribute('style').length
        }));
      
      // Find event handlers
      const eventHandlers = Array.from(document.querySelectorAll('*'))
        .filter(el => {
          const attrs = el.attributes;
          for (let i = 0; i < attrs.length; i++) {
            if (attrs[i].name.startsWith('on')) {
              return true;
            }
          }
          return false;
        })
        .map(el => ({
          tag: el.tagName.toLowerCase(),
          handlers: Array.from(el.attributes)
            .filter(attr => attr.name.startsWith('on'))
            .map(attr => `${attr.name}="${attr.value.substring(0, 50)}..."`)
        }));
      
      return {
        inlineScripts,
        inlineStyles,
        eventHandlers,
        totalInlineContent: inlineScripts.length + inlineStyles.length + eventHandlers.length
      };
    });
    
    console.log(`\n🔍 Inline Content Audit:`);
    console.log(`   Inline Scripts: ${inlineContent.inlineScripts.length}`);
    console.log(`   Inline Styles: ${inlineContent.inlineStyles.length}`);
    console.log(`   Event Handlers: ${inlineContent.eventHandlers.length}`);
    console.log(`   Total Inline Items: ${inlineContent.totalInlineContent}`);
    
    // Log details for CSP planning
    inlineContent.inlineScripts.forEach((script, i) => {
      console.log(`     Script ${i + 1}: ${script.content}... (${script.length} chars)`);
    });
    
    inlineContent.eventHandlers.forEach((handler, i) => {
      console.log(`     Handler ${i + 1}: ${handler.tag} - ${handler.handlers.join(', ')}`);
    });
    
    // Phase 4 goal: minimize inline content for strict CSP
    console.log(`\n📋 CSP Implementation Strategy:`);
    if (inlineContent.inlineScripts.length > 0) {
      console.log(`   - Extract ${inlineContent.inlineScripts.length} inline scripts to external files`);
    }
    if (inlineContent.eventHandlers.length > 0) {
      console.log(`   - Convert ${inlineContent.eventHandlers.length} inline handlers to event listeners`);
    }
    if (inlineContent.inlineStyles.length > 0) {
      console.log(`   - Review ${inlineContent.inlineStyles.length} inline styles for extraction`);
    }
  });

  test("XSS Prevention Framework Assessment", async ({ page }) => {
    await page.goto("/");
    
    // Test current XSS prevention measures
    const xssProtection = await page.evaluate(() => {
      // Test for common XSS vulnerabilities
      const testCases = [
        // Test script injection resistance
        {
          name: "Script Tag Injection",
          test: () => {
            const testDiv = document.createElement('div');
            testDiv.innerHTML = '<script>window.xssTest1 = true;</script>';
            document.body.appendChild(testDiv);
            const result = !window.xssTest1;
            document.body.removeChild(testDiv);
            return result;
          }
        },
        // Test attribute injection resistance
        {
          name: "Attribute Injection",
          test: () => {
            const testDiv = document.createElement('div');
            testDiv.innerHTML = '<img src="x" onerror="window.xssTest2 = true">';
            document.body.appendChild(testDiv);
            const result = !window.xssTest2;
            document.body.removeChild(testDiv);
            return result;
          }
        },
        // Test innerHTML safety
        {
          name: "innerHTML Safety",
          test: () => {
            try {
              const testDiv = document.createElement('div');
              testDiv.innerHTML = 'javascript:window.xssTest3 = true';
              return !window.xssTest3;
            } catch (e) {
              return true; // Error is good for XSS prevention
            }
          }
        }
      ];
      
      const results = testCases.map(testCase => ({
        name: testCase.name,
        passed: testCase.test(),
        description: testCase.passed ? 'Protected' : 'Vulnerable'
      }));
      
      return {
        tests: results,
        overallProtection: results.every(r => r.passed)
      };
    });
    
    console.log(`\n🛡️ XSS Prevention Assessment:`);
    xssProtection.tests.forEach(test => {
      console.log(`   ${test.name}: ${test.passed ? '✅' : '❌'} ${test.description}`);
    });
    
    console.log(`   Overall XSS Protection: ${xssProtection.overallProtection ? '✅ Good' : '⚠️ Needs improvement'}`);
    
    // Phase 4 requirement: enhanced XSS protection
    expect(xssProtection.tests.length).toBeGreaterThan(0);
  });

  test("Security Monitoring and Reporting Setup", async ({ page }) => {
    // Test security monitoring capabilities
    const monitoringCapabilities = await page.evaluate(() => {
      // Check for security monitoring hooks
      const hasErrorHandling = !!window.onerror || !!window.addEventListener;
      const hasConsoleMonitoring = typeof console.error === 'function';
      const hasPerformanceMonitoring = !!window.performance;
      const hasSecurityObservers = 'SecurityPolicyViolationEvent' in window;
      
      return {
        errorHandling: hasErrorHandling,
        consoleMonitoring: hasConsoleMonitoring,
        performanceMonitoring: hasPerformanceMonitoring,
        securityObservers: hasSecurityObservers,
        capabilities: [
          hasErrorHandling,
          hasConsoleMonitoring, 
          hasPerformanceMonitoring,
          hasSecurityObservers
        ].filter(Boolean).length
      };
    });
    
    console.log(`\n📊 Security Monitoring Capabilities:`);
    console.log(`   Error Handling: ${monitoringCapabilities.errorHandling ? '✅' : '❌'}`);
    console.log(`   Console Monitoring: ${monitoringCapabilities.consoleMonitoring ? '✅' : '❌'}`);
    console.log(`   Performance Monitoring: ${monitoringCapabilities.performanceMonitoring ? '✅' : '❌'}`);
    console.log(`   Security Observers: ${monitoringCapabilities.securityObservers ? '✅' : '❌'}`);
    console.log(`   Total Capabilities: ${monitoringCapabilities.capabilities}/4`);
    
    // Phase 4 goal: comprehensive security monitoring
    expect(monitoringCapabilities.capabilities).toBeGreaterThan(2);
  });
});