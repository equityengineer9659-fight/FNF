/**
 * PERFORMANCE VALIDATION SUITE
 * Performance Budget Compliance and Optimization Testing
 * 
 * Test Categories:
 * - CSS Bundle Size Validation
 * - JavaScript Performance Testing
 * - Animation Performance Monitoring
 * - Load Time Optimization
 * - Memory Usage Validation
 * - Network Resource Optimization
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs').promises;
const path = require('path');

// Performance Budget Thresholds (Based on Phase 1 & 2 targets)
const PERFORMANCE_BUDGETS = {
  // File Size Budgets
  CSS_UNIFIED_MAX: 25000,     // 25KB - Phase 2 target: ~19KB achieved
  JAVASCRIPT_MAX: 15000,      // 15KB - Phase 1 simplified to ~5KB
  HTML_SIZE_MAX: 50000,       // 50KB per page
  
  // Load Time Budgets
  PAGE_LOAD_MAX: 3000,        // 3 seconds
  CSS_LOAD_MAX: 1000,         // 1 second
  JS_LOAD_MAX: 1000,          // 1 second
  
  // Animation Performance
  ANIMATION_FPS_MIN: 30,      // 30fps minimum
  FRAME_DROP_MAX: 5,          // Maximum 5% frame drops
  
  // Memory Usage
  MEMORY_INCREASE_MAX: 50,    // 50% max increase during interactions
  
  // Core Web Vitals
  LCP_MAX: 2500,              // Largest Contentful Paint
  FID_MAX: 100,               // First Input Delay
  CLS_MAX: 0.1                // Cumulative Layout Shift
};

const PAGES_TO_TEST = [
  'index.html',
  'about.html',
  'services.html',
  'resources.html',
  'impact.html',
  'contact.html'
];

test.describe('Performance Budget Compliance Validation', () => {
  
  // ============================================
  // FILE SIZE BUDGET VALIDATION
  // ============================================
  
  test.describe('File Size Budget Compliance', () => {
    
    test('should meet CSS bundle size targets (Phase 2 Achievement)', async ({ page }) => {
      await page.goto('index.html');
      
      // Intercept CSS requests
      const cssRequests = [];
      page.on('response', response => {
        if (response.url().includes('.css')) {
          cssRequests.push({
            url: response.url(),
            size: parseInt(response.headers()['content-length'] || '0'),
            status: response.status()
          });
        }
      });
      
      await page.waitForLoadState('networkidle');
      
      // Check unified CSS file
      const unifiedCSS = cssRequests.find(req => req.url.includes('navigation-unified.css'));
      expect(unifiedCSS).toBeTruthy();
      expect(unifiedCSS.size).toBeLessThan(PERFORMANCE_BUDGETS.CSS_UNIFIED_MAX);
      expect(unifiedCSS.status).toBe(200);
      
      console.log(`✓ Unified CSS Size: ${unifiedCSS.size} bytes (Budget: ${PERFORMANCE_BUDGETS.CSS_UNIFIED_MAX} bytes)`);
      
      // Total CSS size should be within budget
      const totalCSSSize = cssRequests.reduce((sum, req) => sum + req.size, 0);
      expect(totalCSSSize).toBeLessThan(PERFORMANCE_BUDGETS.CSS_UNIFIED_MAX * 1.5); // Allow some overhead
      
      console.log(`✓ Total CSS Size: ${totalCSSSize} bytes`);
    });
    
    test('should meet JavaScript size targets (Phase 1 Achievement)', async ({ page }) => {
      await page.goto('index.html');
      
      const jsRequests = [];
      page.on('response', response => {
        if (response.url().includes('.js')) {
          jsRequests.push({
            url: response.url(),
            size: parseInt(response.headers()['content-length'] || '0'),
            status: response.status()
          });
        }
      });
      
      await page.waitForLoadState('networkidle');
      
      // Check unified navigation JS
      const unifiedJS = jsRequests.find(req => req.url.includes('unified-navigation-refactored.js'));
      expect(unifiedJS).toBeTruthy();
      expect(unifiedJS.size).toBeLessThan(PERFORMANCE_BUDGETS.JAVASCRIPT_MAX);
      
      console.log(`✓ Navigation JS Size: ${unifiedJS.size} bytes (Budget: ${PERFORMANCE_BUDGETS.JAVASCRIPT_MAX} bytes)`);
      
      // Total JS size should be reasonable
      const totalJSSize = jsRequests.reduce((sum, req) => sum + req.size, 0);
      console.log(`✓ Total JS Size: ${totalJSSize} bytes`);
    });
    
    test('should have optimized HTML size across all pages', async ({ page }) => {
      const pageSizes = [];
      
      for (const pageUrl of PAGES_TO_TEST) {
        const response = await page.goto(pageUrl);
        const htmlSize = parseInt(response.headers()['content-length'] || '0');
        
        expect(htmlSize).toBeLessThan(PERFORMANCE_BUDGETS.HTML_SIZE_MAX);
        
        pageSizes.push({
          page: pageUrl,
          size: htmlSize
        });
      }
      
      console.log('HTML Page Sizes:');
      pageSizes.forEach(p => {
        console.log(`  ${p.page}: ${p.size} bytes`);
      });
    });
    
  });
  
  // ============================================
  // LOAD TIME PERFORMANCE
  // ============================================
  
  test.describe('Load Time Performance', () => {
    
    PAGES_TO_TEST.forEach(pageUrl => {
      test(`should meet load time targets on ${pageUrl}`, async ({ page }) => {
        const startTime = Date.now();
        
        await page.goto(pageUrl);
        await page.waitForLoadState('networkidle');
        
        const loadTime = Date.now() - startTime;
        expect(loadTime).toBeLessThan(PERFORMANCE_BUDGETS.PAGE_LOAD_MAX);
        
        console.log(`✓ ${pageUrl} Load Time: ${loadTime}ms (Budget: ${PERFORMANCE_BUDGETS.PAGE_LOAD_MAX}ms)`);
      });
    });
    
    test('should load critical CSS quickly', async ({ page }) => {
      const cssLoadTimes = [];
      
      page.on('response', response => {
        if (response.url().includes('navigation-unified.css')) {
          const loadTime = response.timing().responseEnd - response.timing().requestStart;
          cssLoadTimes.push(loadTime);
        }
      });
      
      await page.goto('index.html');
      await page.waitForLoadState('networkidle');
      
      expect(cssLoadTimes.length).toBeGreaterThan(0);
      const avgCSSLoadTime = cssLoadTimes.reduce((sum, time) => sum + time, 0) / cssLoadTimes.length;
      
      expect(avgCSSLoadTime).toBeLessThan(PERFORMANCE_BUDGETS.CSS_LOAD_MAX);
      console.log(`✓ CSS Load Time: ${avgCSSLoadTime.toFixed(2)}ms`);
    });
    
    test('should load JavaScript efficiently', async ({ page }) => {
      const jsLoadTimes = [];
      
      page.on('response', response => {
        if (response.url().includes('unified-navigation-refactored.js')) {
          const loadTime = response.timing().responseEnd - response.timing().requestStart;
          jsLoadTimes.push(loadTime);
        }
      });
      
      await page.goto('index.html');
      await page.waitForLoadState('networkidle');
      
      expect(jsLoadTimes.length).toBeGreaterThan(0);
      const avgJSLoadTime = jsLoadTimes.reduce((sum, time) => sum + time, 0) / jsLoadTimes.length;
      
      expect(avgJSLoadTime).toBeLessThan(PERFORMANCE_BUDGETS.JS_LOAD_MAX);
      console.log(`✓ JS Load Time: ${avgJSLoadTime.toFixed(2)}ms`);
    });
    
  });
  
  // ============================================
  // ANIMATION PERFORMANCE
  // ============================================
  
  test.describe('Animation Performance', () => {
    
    test('should maintain smooth navigation animations', async ({ page }) => {
      await page.goto('index.html');
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Monitor frame rate during navigation animation
      const animationPerformance = await page.evaluate(() => {
        return new Promise(resolve => {
          let frameCount = 0;
          let droppedFrames = 0;
          let startTime = performance.now();
          let lastFrameTime = startTime;
          
          function measureFrame() {
            const currentTime = performance.now();
            const frameDuration = currentTime - lastFrameTime;
            
            frameCount++;
            
            // Detect dropped frames (>16.67ms = dropped frame at 60fps)
            if (frameDuration > 16.67) {
              droppedFrames++;
            }
            
            lastFrameTime = currentTime;
            
            // Measure for 1 second during animation
            if (currentTime - startTime < 1000) {
              requestAnimationFrame(measureFrame);
            } else {
              const avgFPS = Math.round((frameCount * 1000) / (currentTime - startTime));
              const dropRate = (droppedFrames / frameCount) * 100;
              
              resolve({
                fps: avgFPS,
                droppedFrames: droppedFrames,
                dropRate: dropRate
              });
            }
          }
          
          // Start animation and measurement
          document.querySelector('.mobile-nav-toggle').click();
          requestAnimationFrame(measureFrame);
        });
      });
      
      expect(animationPerformance.fps).toBeGreaterThanOrEqual(PERFORMANCE_BUDGETS.ANIMATION_FPS_MIN);
      expect(animationPerformance.dropRate).toBeLessThan(PERFORMANCE_BUDGETS.FRAME_DROP_MAX);
      
      console.log(`✓ Animation FPS: ${animationPerformance.fps} (Min: ${PERFORMANCE_BUDGETS.ANIMATION_FPS_MIN})`);
      console.log(`✓ Frame Drop Rate: ${animationPerformance.dropRate.toFixed(1)}% (Max: ${PERFORMANCE_BUDGETS.FRAME_DROP_MAX}%)`);
    });
    
    test('should handle rapid interaction without performance degradation', async ({ page }) => {
      await page.goto('index.html');
      await page.setViewportSize({ width: 375, height: 667 });
      
      const mobileToggle = page.locator('.mobile-nav-toggle');
      
      // Measure performance during rapid interactions
      const startTime = Date.now();
      
      // Rapid open/close cycles
      for (let i = 0; i < 20; i++) {
        await mobileToggle.click(); // Open
        await page.waitForTimeout(50);
        await page.click('body', { position: { x: 50, y: 50 } }); // Close
        await page.waitForTimeout(50);
      }
      
      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgInteractionTime = totalTime / 40; // 40 interactions total
      
      // Should handle rapid interactions efficiently
      expect(avgInteractionTime).toBeLessThan(100); // <100ms per interaction
      
      console.log(`✓ Rapid Interaction Performance: ${avgInteractionTime.toFixed(1)}ms per interaction`);
    });
    
  });
  
  // ============================================
  // MEMORY USAGE VALIDATION
  // ============================================
  
  test.describe('Memory Usage Validation', () => {
    
    test('should not cause memory leaks during navigation usage', async ({ page }) => {
      await page.goto('index.html');
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Get initial memory baseline
      const initialMemory = await page.evaluate(() => {
        if (performance.memory) {
          return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      });
      
      if (!initialMemory) {
        console.log('⚠ Memory API not available, skipping memory test');
        return;
      }
      
      const mobileToggle = page.locator('.mobile-nav-toggle');
      
      // Perform extensive navigation interactions
      for (let i = 0; i < 100; i++) {
        await mobileToggle.click();
        await page.waitForTimeout(10);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(10);
        
        // Force garbage collection occasionally
        if (i % 25 === 0) {
          await page.evaluate(() => {
            if (window.gc) {
              window.gc();
            }
          });
        }
      }
      
      // Final memory measurement
      const finalMemory = await page.evaluate(() => {
        if (performance.memory) {
          return {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit
          };
        }
        return null;
      });
      
      const memoryIncrease = finalMemory.used - initialMemory.used;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.used) * 100;
      
      expect(memoryIncreasePercent).toBeLessThan(PERFORMANCE_BUDGETS.MEMORY_INCREASE_MAX);
      
      console.log(`✓ Memory Usage: ${initialMemory.used} -> ${finalMemory.used} bytes`);
      console.log(`✓ Memory Increase: ${memoryIncreasePercent.toFixed(1)}% (Max: ${PERFORMANCE_BUDGETS.MEMORY_INCREASE_MAX}%)`);
    });
    
  });
  
  // ============================================
  // CORE WEB VITALS
  // ============================================
  
  test.describe('Core Web Vitals', () => {
    
    test('should meet Core Web Vitals thresholds', async ({ page }) => {
      await page.goto('index.html');
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Wait for page to be fully loaded
      await page.waitForLoadState('networkidle');
      
      // Measure Core Web Vitals
      const webVitals = await page.evaluate(() => {
        return new Promise(resolve => {
          const vitals = {
            lcp: null,
            fid: null,
            cls: null
          };
          
          // Largest Contentful Paint
          new PerformanceObserver(entryList => {
            const entries = entryList.getEntries();
            if (entries.length > 0) {
              vitals.lcp = entries[entries.length - 1].startTime;
            }
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          
          // First Input Delay (simulate with click)
          document.addEventListener('click', (event) => {
            if (!vitals.fid) {
              vitals.fid = performance.now() - event.timeStamp;
            }
          });
          
          // Cumulative Layout Shift
          let clsValue = 0;
          new PerformanceObserver(entryList => {
            for (const entry of entryList.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            vitals.cls = clsValue;
          }).observe({ type: 'layout-shift', buffered: true });
          
          // Return measurements after interaction
          setTimeout(() => {
            // Trigger interaction for FID measurement
            document.querySelector('.mobile-nav-toggle').click();
            
            setTimeout(() => {
              resolve(vitals);
            }, 1000);
          }, 1000);
        });
      });
      
      // Validate Core Web Vitals
      if (webVitals.lcp !== null) {
        expect(webVitals.lcp).toBeLessThan(PERFORMANCE_BUDGETS.LCP_MAX);
        console.log(`✓ LCP: ${webVitals.lcp.toFixed(2)}ms (Target: <${PERFORMANCE_BUDGETS.LCP_MAX}ms)`);
      }
      
      if (webVitals.cls !== null) {
        expect(webVitals.cls).toBeLessThan(PERFORMANCE_BUDGETS.CLS_MAX);
        console.log(`✓ CLS: ${webVitals.cls.toFixed(3)} (Target: <${PERFORMANCE_BUDGETS.CLS_MAX})`);
      }
      
      console.log('✓ Core Web Vitals assessment complete');
    });
    
  });
  
  // ============================================
  // NETWORK OPTIMIZATION
  // ============================================
  
  test.describe('Network Resource Optimization', () => {
    
    test('should minimize HTTP requests for navigation assets', async ({ page }) => {
      const resourceRequests = [];
      
      page.on('request', request => {
        if (['stylesheet', 'script', 'image'].includes(request.resourceType())) {
          resourceRequests.push({
            url: request.url(),
            type: request.resourceType(),
            method: request.method()
          });
        }
      });
      
      await page.goto('index.html');
      await page.waitForLoadState('networkidle');
      
      // Count navigation-related requests
      const navRequests = resourceRequests.filter(req => 
        req.url.includes('navigation') || req.url.includes('nav')
      );
      
      console.log(`✓ Navigation-related requests: ${navRequests.length}`);
      console.log(`✓ Total resource requests: ${resourceRequests.length}`);
      
      // Should have minimal navigation-specific requests (ideally 2: CSS + JS)
      expect(navRequests.length).toBeLessThanOrEqual(3);
    });
    
    test('should use efficient caching headers', async ({ page }) => {
      const cacheableResources = [];
      
      page.on('response', response => {
        if (['stylesheet', 'script'].includes(response.request().resourceType())) {
          cacheableResources.push({
            url: response.url(),
            cacheControl: response.headers()['cache-control'],
            etag: response.headers()['etag'],
            lastModified: response.headers()['last-modified']
          });
        }
      });
      
      await page.goto('index.html');
      await page.waitForLoadState('networkidle');
      
      // Check navigation assets have caching headers
      const navAssets = cacheableResources.filter(resource => 
        resource.url.includes('navigation-unified') || 
        resource.url.includes('unified-navigation-refactored')
      );
      
      navAssets.forEach(asset => {
        // Should have some form of caching
        const hasCaching = asset.cacheControl || asset.etag || asset.lastModified;
        expect(hasCaching).toBeTruthy();
        
        console.log(`✓ ${asset.url} has caching headers`);
      });
    });
    
  });
  
});

// ============================================
// PERFORMANCE REGRESSION DETECTION
// ============================================

test.describe('Performance Regression Detection', () => {
  
  test('should not degrade from Phase 1 & 2 optimizations', async ({ page }) => {
    // Test that we maintain the performance gains from previous phases
    
    const performanceMetrics = {
      cssSize: null,
      jsSize: null,
      loadTime: null,
      animationFps: null
    };
    
    // Measure CSS size
    page.on('response', response => {
      if (response.url().includes('navigation-unified.css')) {
        performanceMetrics.cssSize = parseInt(response.headers()['content-length'] || '0');
      }
      if (response.url().includes('unified-navigation-refactored.js')) {
        performanceMetrics.jsSize = parseInt(response.headers()['content-length'] || '0');
      }
    });
    
    // Measure load time
    const startTime = Date.now();
    await page.goto('index.html');
    await page.waitForLoadState('networkidle');
    performanceMetrics.loadTime = Date.now() - startTime;
    
    // Measure animation performance
    await page.setViewportSize({ width: 375, height: 667 });
    performanceMetrics.animationFps = await page.evaluate(() => {
      return new Promise(resolve => {
        let frameCount = 0;
        const startTime = performance.now();
        
        function countFrames() {
          frameCount++;
          const elapsed = performance.now() - startTime;
          
          if (elapsed >= 500) { // Measure for 500ms
            const fps = Math.round((frameCount * 1000) / elapsed);
            resolve(fps);
          } else {
            requestAnimationFrame(countFrames);
          }
        }
        
        document.querySelector('.mobile-nav-toggle').click();
        requestAnimationFrame(countFrames);
      });
    });
    
    // Validate against expected Phase 2 achievements
    expect(performanceMetrics.cssSize).toBeLessThan(25000); // Phase 2: ~19KB achieved
    expect(performanceMetrics.jsSize).toBeLessThan(15000);  // Phase 1: ~5KB achieved
    expect(performanceMetrics.loadTime).toBeLessThan(3000);
    expect(performanceMetrics.animationFps).toBeGreaterThan(25);
    
    console.log('\n' + '='.repeat(50));
    console.log('PERFORMANCE REGRESSION CHECK RESULTS');
    console.log('='.repeat(50));
    console.log(`CSS Bundle Size: ${performanceMetrics.cssSize} bytes (Target: <25KB)`);
    console.log(`JS Bundle Size: ${performanceMetrics.jsSize} bytes (Target: <15KB)`);
    console.log(`Page Load Time: ${performanceMetrics.loadTime}ms (Target: <3s)`);
    console.log(`Animation FPS: ${performanceMetrics.animationFps} (Target: >25fps)`);
    console.log('='.repeat(50));
  });
  
});
