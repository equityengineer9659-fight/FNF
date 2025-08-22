/**
 * Performance Budget Monitor for Rollback Validation
 * Monitors and enforces performance budgets to prevent over-engineering regression
 * 
 * Technical Architect Target: 750% performance improvement
 * - CSS: 15KB → 2KB (87% reduction)
 * - JS: 12KB → 8KB (33% reduction)
 * - Animation: Variable → 60fps (smooth)
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

class PerformanceBudgetMonitor {
    constructor() {
        this.budgets = {
            cssBundleSize: 2048,     // 2KB target
            jsBundleSize: 8192,      // 8KB target
            totalResourceSize: 102400, // 100KB total
            loadTime: 2000,          // 2 seconds
            animationFPS: 58,        // Minimum 58fps
            memoryUsage: 52428800,   // 50MB
            renderBlockingResources: 3 // Maximum 3 render-blocking resources
        };
        
        this.testPages = [
            '/',
            '/about.html',
            '/services.html',
            '/resources.html',
            '/impact.html',
            '/contact.html'
        ];
        
        this.devices = [
            { name: 'Mobile', viewport: { width: 375, height: 667 } },
            { name: 'Tablet', viewport: { width: 768, height: 1024 } },
            { name: 'Desktop', viewport: { width: 1920, height: 1080 } }
        ];
        
        this.results = [];
    }
    
    /**
     * Analyze resource loading performance
     */
    async analyzeResourcePerformance(page) {
        const resourceMetrics = await page.evaluate(() => {
            const resources = performance.getEntriesByType('resource');
            const navigation = performance.getEntriesByType('navigation')[0];
            
            // Categorize resources
            const cssResources = resources.filter(r => r.name.includes('.css'));
            const jsResources = resources.filter(r => r.name.includes('.js'));
            const imageResources = resources.filter(r => /\.(jpg|jpeg|png|gif|webp|svg)/.test(r.name));
            
            // Calculate sizes
            const cssSize = cssResources.reduce((total, r) => total + (r.transferSize || 0), 0);
            const jsSize = jsResources.reduce((total, r) => total + (r.transferSize || 0), 0);
            const imageSize = imageResources.reduce((total, r) => total + (r.transferSize || 0), 0);
            const totalSize = resources.reduce((total, r) => total + (r.transferSize || 0), 0);
            
            // Identify render-blocking resources
            const renderBlocking = resources.filter(r => {
                return (r.name.includes('.css') && !r.name.includes('async')) ||
                       (r.name.includes('.js') && !r.name.includes('defer') && !r.name.includes('async'));
            });
            
            return {
                cssSize,
                jsSize,
                imageSize,
                totalSize,
                resourceCount: resources.length,
                renderBlockingCount: renderBlocking.length,
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                firstPaint: navigation.loadEventEnd - navigation.fetchStart,
                resourceDetails: {
                    css: cssResources.map(r => ({ name: r.name, size: r.transferSize })),
                    js: jsResources.map(r => ({ name: r.name, size: r.transferSize })),
                    renderBlocking: renderBlocking.map(r => ({ name: r.name, size: r.transferSize }))
                }
            };
        });
        
        return resourceMetrics;
    }
    
    /**
     * Test navigation animation performance
     */
    async testAnimationPerformance(page) {
        const animationMetrics = await page.evaluate(async () => {
            const menuButton = document.querySelector('[data-mobile-menu-toggle], .mobile-menu-toggle, .slds-button[aria-controls*="mobile"], button[aria-expanded]');
            if (!menuButton) {
                return { fps: 0, smooth: false, error: 'Menu button not found' };
            }
            
            let frameCount = 0;
            let startTime = performance.now();
            let animationStarted = false;
            
            // Frame counter
            const countFrames = () => {
                frameCount++;
                if (performance.now() - startTime < 1000) {
                    requestAnimationFrame(countFrames);
                }
            };
            
            // Start frame counting
            requestAnimationFrame(countFrames);
            
            // Trigger menu animation
            menuButton.click();
            animationStarted = true;
            
            // Wait for animation to complete
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            const fps = frameCount;
            const smooth = fps >= 58;
            
            return {
                fps,
                smooth,
                animationStarted,
                duration: performance.now() - startTime
            };
        });
        
        return animationMetrics;
    }
    
    /**
     * Measure memory usage during navigation interactions
     */
    async measureMemoryUsage(page) {
        try {
            const memoryInfo = await page.evaluate(() => {
                if (performance.memory) {
                    return {
                        usedJSHeapSize: performance.memory.usedJSHeapSize,
                        totalJSHeapSize: performance.memory.totalJSHeapSize,
                        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                    };
                }
                return null;
            });
            
            return memoryInfo;
        } catch (error) {
            return { error: 'Memory measurement not available' };
        }
    }
    
    /**
     * Run comprehensive performance analysis for a single page
     */
    async analyzePage(browser, pageUrl, device) {
        const page = await browser.newPage();
        await page.setViewportSize(device.viewport);
        
        try {
            console.log(`📊 Analyzing ${pageUrl} on ${device.name}...`);
            
            // Navigate and wait for complete load
            await page.goto(`http://localhost:8080${pageUrl}`, { 
                waitUntil: 'networkidle',
                timeout: 30000 
            });
            
            // Wait additional time for JS initialization
            await page.waitForTimeout(2000);
            
            // Get resource performance metrics
            const resourceMetrics = await this.analyzeResourcePerformance(page);
            
            // Test animation performance
            const animationMetrics = await this.testAnimationPerformance(page);
            
            // Measure memory usage
            const memoryMetrics = await this.measureMemoryUsage(page);
            
            // Compile results
            const result = {
                page: pageUrl,
                device: device.name,
                timestamp: new Date().toISOString(),
                performance: resourceMetrics,
                animation: animationMetrics,
                memory: memoryMetrics,
                budgetCompliance: {
                    cssSize: resourceMetrics.cssSize <= this.budgets.cssBundleSize,
                    jsSize: resourceMetrics.jsSize <= this.budgets.jsBundleSize,
                    totalSize: resourceMetrics.totalSize <= this.budgets.totalResourceSize,
                    loadTime: resourceMetrics.loadTime <= this.budgets.loadTime,
                    animationFPS: animationMetrics.fps >= this.budgets.animationFPS,
                    renderBlocking: resourceMetrics.renderBlockingCount <= this.budgets.renderBlockingResources
                }
            };
            
            // Check memory budget if available
            if (memoryMetrics.usedJSHeapSize) {
                result.budgetCompliance.memoryUsage = memoryMetrics.usedJSHeapSize <= this.budgets.memoryUsage;
            }
            
            this.results.push(result);
            
            console.log(`   CSS: ${resourceMetrics.cssSize}/${this.budgets.cssBundleSize} bytes ${result.budgetCompliance.cssSize ? '✅' : '❌'}`);
            console.log(`   JS: ${resourceMetrics.jsSize}/${this.budgets.jsBundleSize} bytes ${result.budgetCompliance.jsSize ? '✅' : '❌'}`);
            console.log(`   Load: ${resourceMetrics.loadTime}/${this.budgets.loadTime}ms ${result.budgetCompliance.loadTime ? '✅' : '❌'}`);
            console.log(`   Animation: ${animationMetrics.fps}/${this.budgets.animationFPS} FPS ${result.budgetCompliance.animationFPS ? '✅' : '❌'}`);
            
            return result;
            
        } catch (error) {
            console.error(`❌ Error analyzing ${pageUrl} on ${device.name}:`, error.message);
            return {
                page: pageUrl,
                device: device.name,
                error: error.message,
                budgetCompliance: {
                    cssSize: false,
                    jsSize: false,
                    totalSize: false,
                    loadTime: false,
                    animationFPS: false,
                    renderBlocking: false
                }
            };
        } finally {
            await page.close();
        }
    }
    
    /**
     * Run performance monitoring across all pages and devices
     */
    async runPerformanceMonitoring() {
        console.log('🚀 Starting Performance Budget Monitoring...');
        console.log(`Target Budgets:`);
        console.log(`  CSS Bundle: ${this.budgets.cssBundleSize} bytes`);
        console.log(`  JS Bundle: ${this.budgets.jsBundleSize} bytes`);
        console.log(`  Load Time: ${this.budgets.loadTime}ms`);
        console.log(`  Animation: ${this.budgets.animationFPS}+ FPS`);
        console.log('');
        
        const browser = await chromium.launch();
        
        try {
            // Test each page on each device
            for (const pageUrl of this.testPages) {
                for (const device of this.devices) {
                    await this.analyzePage(browser, pageUrl, device);
                }
            }
        } finally {
            await browser.close();
        }
        
        return this.generateReport();
    }
    
    /**
     * Generate comprehensive performance report
     */
    generateReport() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Calculate overall compliance
        const totalTests = this.results.length;
        const passedTests = this.results.filter(r => {
            if (r.error) return false;
            return Object.values(r.budgetCompliance).every(compliant => compliant === true);
        }).length;
        
        const overallCompliance = (passedTests / totalTests) * 100;
        
        // Identify worst performers
        const validResults = this.results.filter(r => !r.error);
        const worstCSS = validResults.sort((a, b) => b.performance.cssSize - a.performance.cssSize)[0];
        const worstJS = validResults.sort((a, b) => b.performance.jsSize - a.performance.jsSize)[0];
        const slowestLoad = validResults.sort((a, b) => b.performance.loadTime - a.performance.loadTime)[0];
        
        // Calculate average improvements
        const avgCssSize = validResults.reduce((sum, r) => sum + r.performance.cssSize, 0) / validResults.length;
        const avgJsSize = validResults.reduce((sum, r) => sum + r.performance.jsSize, 0) / validResults.length;
        const avgLoadTime = validResults.reduce((sum, r) => sum + r.performance.loadTime, 0) / validResults.length;
        
        const report = {
            timestamp: timestamp,
            summary: {
                totalTests: totalTests,
                passedTests: passedTests,
                overallCompliance: overallCompliance,
                budgetsMet: overallCompliance >= 95
            },
            budgets: this.budgets,
            averageMetrics: {
                cssSize: Math.round(avgCssSize),
                jsSize: Math.round(avgJsSize),
                loadTime: Math.round(avgLoadTime)
            },
            worstPerformers: {
                css: worstCSS ? { page: worstCSS.page, device: worstCSS.device, size: worstCSS.performance.cssSize } : null,
                js: worstJS ? { page: worstJS.page, device: worstJS.device, size: worstJS.performance.jsSize } : null,
                load: slowestLoad ? { page: slowestLoad.page, device: slowestLoad.device, time: slowestLoad.performance.loadTime } : null
            },
            recommendations: [],
            detailedResults: this.results
        };
        
        // Generate recommendations
        if (avgCssSize > this.budgets.cssBundleSize) {
            report.recommendations.push(`CSS bundle exceeds budget. Average: ${Math.round(avgCssSize)} bytes, Target: ${this.budgets.cssBundleSize} bytes`);
        }
        
        if (avgJsSize > this.budgets.jsBundleSize) {
            report.recommendations.push(`JS bundle exceeds budget. Average: ${Math.round(avgJsSize)} bytes, Target: ${this.budgets.jsBundleSize} bytes`);
        }
        
        if (avgLoadTime > this.budgets.loadTime) {
            report.recommendations.push(`Load time exceeds budget. Average: ${Math.round(avgLoadTime)}ms, Target: ${this.budgets.loadTime}ms`);
        }
        
        if (overallCompliance < 95) {
            report.recommendations.push('Performance budgets not met. Review and optimize resource loading.');
        } else {
            report.recommendations.push('All performance budgets met. Maintain current optimization level.');
        }
        
        // Save report
        const reportPath = path.join(__dirname, '../../test-results', `performance-budget-${timestamp}.json`);
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Print summary
        console.log('\n📊 PERFORMANCE BUDGET MONITORING REPORT');
        console.log('=======================================');
        console.log(`Overall Compliance: ${overallCompliance.toFixed(1)}% (${passedTests}/${totalTests} tests passed)`);
        console.log(`Average CSS Size: ${Math.round(avgCssSize)} bytes (Budget: ${this.budgets.cssBundleSize})`);
        console.log(`Average JS Size: ${Math.round(avgJsSize)} bytes (Budget: ${this.budgets.jsBundleSize})`);
        console.log(`Average Load Time: ${Math.round(avgLoadTime)}ms (Budget: ${this.budgets.loadTime})`);
        
        if (report.recommendations.length > 0) {
            console.log('\n🔧 Recommendations:');
            report.recommendations.forEach(rec => console.log(`  • ${rec}`));
        }
        
        console.log(`\n📄 Full report saved: ${reportPath}`);
        
        return report;
    }
    
    /**
     * CLI interface for running as standalone script
     */
    static async runCLI() {
        const monitor = new PerformanceBudgetMonitor();
        const report = await monitor.runPerformanceMonitoring();
        
        // Exit with error code if budgets not met
        if (!report.summary.budgetsMet) {
            console.error('\n❌ Performance budgets not met');
            process.exit(1);
        } else {
            console.log('\n✅ All performance budgets met');
            process.exit(0);
        }
    }
}

// CLI execution
if (require.main === module) {
    PerformanceBudgetMonitor.runCLI().catch(error => {
        console.error('❌ Performance monitoring failed:', error);
        process.exit(1);
    });
}

module.exports = PerformanceBudgetMonitor;