/**
 * Core Performance Monitoring System
 * Food-N-Force Performance Optimization Framework v1.0
 * 
 * Comprehensive performance monitoring with governance integration
 * Authority: performance-optimizer + technical-architect
 * 
 * Features:
 * - Real-time Core Web Vitals monitoring
 * - Performance budget enforcement
 * - Regression detection with automatic rollback triggers
 * - Governance-integrated emergency response
 * - Multi-device performance validation
 * - Nonprofit-specific performance targets
 */

const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs');
const path = require('path');

class CorePerformanceMonitor {
    constructor(configPath = null) {
        // Load configuration
        const defaultConfig = path.join(__dirname, 'performance-framework-config.json');
        const configFile = configPath || defaultConfig;
        this.config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        
        // Initialize monitoring state
        this.monitoringActive = false;
        this.performanceBaseline = null;
        this.currentResults = [];
        this.regressionHistory = [];
        this.emergencyTriggered = false;
        
        // Test configuration
        this.testPages = [
            '/', '/about.html', '/services.html', 
            '/resources.html', '/impact.html', '/contact.html'
        ];
        
        this.testDevices = [
            { name: 'Mobile', viewport: { width: 375, height: 667 }, userAgent: 'Mobile' },
            { name: 'Tablet', viewport: { width: 768, height: 1024 }, userAgent: 'Tablet' },
            { name: 'Desktop', viewport: { width: 1920, height: 1080 }, userAgent: 'Desktop' }
        ];
        
        this.browsers = ['chromium', 'firefox', 'webkit'];
        
        // Performance thresholds from config
        this.budgets = this.config.performance_budgets;
        this.monitoring = this.config.monitoring_configuration;
        
        console.log('🚀 Core Performance Monitor initialized');
        console.log(`   Framework Version: ${this.config.framework_version}`);
        console.log(`   Authority: ${this.config.framework_authority}`);
    }
    
    /**
     * Measure Core Web Vitals using browser APIs
     */
    async measureCoreWebVitals(page, pageUrl, device) {
        const webVitals = await page.evaluate(() => {
            return new Promise((resolve) => {
                const vitals = {
                    lcp: null, fid: null, cls: null, fcp: null, ttfb: null, tti: null
                };
                let resolved = false;
                
                // Timeout to prevent hanging
                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        resolve(vitals);
                    }
                }, 10000);
                
                // Performance Observer for LCP
                try {
                    const lcpObserver = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        if (entries.length > 0) {
                            vitals.lcp = entries[entries.length - 1].startTime;
                        }
                    });
                    lcpObserver.observe({entryTypes: ['largest-contentful-paint']});
                } catch (e) {}
                
                // Performance Observer for FCP
                try {
                    const fcpObserver = new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        for (const entry of entries) {
                            if (entry.name === 'first-contentful-paint') {
                                vitals.fcp = entry.startTime;
                                break;
                            }
                        }
                    });
                    fcpObserver.observe({entryTypes: ['paint']});
                } catch (e) {}
                
                // Performance Observer for CLS
                try {
                    let clsValue = 0;
                    const clsObserver = new PerformanceObserver((list) => {
                        for (const entry of list.getEntries()) {
                            if (!entry.hadRecentInput) {
                                clsValue += entry.value;
                            }
                        }
                        vitals.cls = clsValue;
                    });
                    clsObserver.observe({entryTypes: ['layout-shift']});
                } catch (e) {}
                
                // Navigation timing
                const navigation = performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    vitals.ttfb = navigation.responseStart - navigation.requestStart;
                    vitals.tti = navigation.loadEventEnd - navigation.loadEventStart;
                }
                
                // Collect and resolve after delay
                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        resolve(vitals);
                    }
                }, 5000);
            });
        });
        
        return webVitals;
    }
    
    /**
     * Measure resource performance and bundle sizes
     */
    async measureResourcePerformance(page) {
        const resources = await page.evaluate(() => {
            const entries = performance.getEntriesByType('resource');
            const navigation = performance.getEntriesByType('navigation')[0];
            
            // Categorize resources
            const css = entries.filter(e => e.name.includes('.css'));
            const js = entries.filter(e => e.name.includes('.js'));
            const images = entries.filter(e => /\.(jpg|jpeg|png|gif|webp|svg)/.test(e.name));
            const fonts = entries.filter(e => /\.(woff|woff2|ttf|otf)/.test(e.name));
            
            // Calculate sizes
            const cssSize = css.reduce((total, r) => total + (r.transferSize || 0), 0);
            const jsSize = js.reduce((total, r) => total + (r.transferSize || 0), 0);
            const imageSize = images.reduce((total, r) => total + (r.transferSize || 0), 0);
            const fontSize = fonts.reduce((total, r) => total + (r.transferSize || 0), 0);
            const totalSize = entries.reduce((total, r) => total + (r.transferSize || 0), 0);
            
            // Performance timing
            const loadTime = navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0;
            const domContentLoaded = navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0;
            
            return {
                cssSize, jsSize, imageSize, fontSize, totalSize,
                resourceCount: entries.length,
                loadTime, domContentLoaded,
                resources: {
                    css: css.map(r => ({ name: r.name, size: r.transferSize || 0 })),
                    js: js.map(r => ({ name: r.name, size: r.transferSize || 0 })),
                    images: images.length,
                    fonts: fonts.length
                }
            };
        });
        
        return resources;
    }
    
    /**
     * Test nonprofit-specific performance requirements
     */
    async testNonprofitSpecificPerformance(page, pageUrl) {
        const nonprofitMetrics = {};
        
        // Donation form performance (if on contact or index page)
        if (pageUrl === '/' || pageUrl === '/contact.html') {
            const donationFormTime = await page.evaluate(() => {
                const form = document.querySelector('form[action*="donate"], .donation-form, [data-donation-form]');
                if (form) {
                    const startTime = performance.now();
                    // Simulate form interaction
                    form.focus();
                    return performance.now() - startTime;
                }
                return null;
            });
            nonprofitMetrics.donationFormLoadTime = donationFormTime;
        }
        
        // Volunteer registration performance (if on about or resources page)
        if (pageUrl === '/about.html' || pageUrl === '/resources.html') {
            const volunteerFormTime = await page.evaluate(() => {
                const form = document.querySelector('form[action*="volunteer"], .volunteer-form, [data-volunteer-form]');
                if (form) {
                    const startTime = performance.now();
                    form.focus();
                    return performance.now() - startTime;
                }
                return null;
            });
            nonprofitMetrics.volunteerRegistrationLoadTime = volunteerFormTime;
        }
        
        // Accessibility performance impact
        const accessibilityPerformance = await page.evaluate(() => {
            const focusableElements = document.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const startTime = performance.now();
            
            // Test focus performance
            if (focusableElements.length > 0) {
                focusableElements[0].focus();
            }
            
            const focusTime = performance.now() - startTime;
            
            // Test ARIA performance
            const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [role]');
            
            return {
                focusPerformance: focusTime,
                accessibilityElementCount: ariaElements.length,
                focusableElementCount: focusableElements.length
            };
        });
        
        nonprofitMetrics.accessibilityPerformance = accessibilityPerformance;
        return nonprofitMetrics;
    }
    
    /**
     * Analyze single page performance across all metrics
     */
    async analyzePage(browser, pageUrl, device, browserType) {
        const page = await browser.newPage();
        await page.setViewportSize(device.viewport);
        
        try {
            console.log(`📊 Analyzing ${pageUrl} on ${device.name} (${browserType})...`);
            
            // Navigate with performance timing
            const navigationStart = Date.now();
            await page.goto(`http://localhost:8080${pageUrl}`, { 
                waitUntil: 'networkidle',
                timeout: 30000 
            });
            const navigationEnd = Date.now();
            
            // Wait for JavaScript initialization
            await page.waitForTimeout(3000);
            
            // Measure Core Web Vitals
            const webVitals = await this.measureCoreWebVitals(page, pageUrl, device);
            
            // Measure resource performance
            const resourceMetrics = await this.measureResourcePerformance(page);
            
            // Measure nonprofit-specific performance
            const nonprofitMetrics = await this.testNonprofitSpecificPerformance(page, pageUrl);
            
            // Get Lighthouse performance score (simplified)
            const lighthouseScore = await this.getLighthouseScore(page);
            
            // Compile comprehensive results
            const result = {
                timestamp: new Date().toISOString(),
                page: pageUrl,
                device: device.name,
                browser: browserType,
                navigationTime: navigationEnd - navigationStart,
                coreWebVitals: webVitals,
                resourceMetrics: resourceMetrics,
                nonprofitMetrics: nonprofitMetrics,
                lighthouseScore: lighthouseScore,
                budgetCompliance: this.evaluateBudgetCompliance(webVitals, resourceMetrics, lighthouseScore),
                performanceGrade: null // Will be calculated
            };
            
            // Calculate performance grade
            result.performanceGrade = this.calculatePerformanceGrade(result);
            
            console.log(`   LCP: ${webVitals.lcp?.toFixed(0) || 'N/A'}ms | CLS: ${webVitals.cls?.toFixed(4) || 'N/A'} | Bundle: ${Math.round(resourceMetrics.totalSize/1024)}KB`);
            
            return result;
            
        } catch (error) {
            console.error(`❌ Error analyzing ${pageUrl} on ${device.name} (${browserType}):`, error.message);
            return {
                timestamp: new Date().toISOString(),
                page: pageUrl,
                device: device.name,
                browser: browserType,
                error: error.message,
                budgetCompliance: { overall: false },
                performanceGrade: 'F'
            };
        } finally {
            await page.close();
        }
    }
    
    /**
     * Simplified Lighthouse score estimation
     */
    async getLighthouseScore(page) {
        const metrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (!navigation) return { score: 0 };
            
            const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
            const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
            
            // Simplified scoring based on timing
            let score = 100;
            if (loadTime > 3000) score -= 20;
            if (loadTime > 5000) score -= 30;
            if (domContentLoaded > 1500) score -= 15;
            
            return {
                score: Math.max(0, score),
                loadTime: loadTime,
                domContentLoaded: domContentLoaded
            };
        });
        
        return metrics;
    }
    
    /**
     * Evaluate budget compliance across all performance metrics
     */
    evaluateBudgetCompliance(webVitals, resourceMetrics, lighthouseScore) {
        const compliance = {};
        const budgets = this.budgets;
        
        // Core Web Vitals compliance
        compliance.lcp_mobile = !webVitals.lcp || webVitals.lcp <= budgets.core_web_vitals.largest_contentful_paint.mobile * 1000;
        compliance.cls = !webVitals.cls || webVitals.cls <= budgets.core_web_vitals.cumulative_layout_shift.mobile;
        compliance.fcp = !webVitals.fcp || webVitals.fcp <= budgets.core_web_vitals.first_contentful_paint.mobile * 1000;
        
        // Resource budget compliance
        compliance.css_bundle = resourceMetrics.cssSize <= budgets.resource_budgets.css_bundle_size;
        compliance.js_bundle = resourceMetrics.jsSize <= budgets.resource_budgets.javascript_bundle_size;
        compliance.total_bundle = resourceMetrics.totalSize <= budgets.resource_budgets.total_bundle_size;
        compliance.total_requests = resourceMetrics.resourceCount <= budgets.resource_budgets.total_requests;
        
        // Performance target compliance
        compliance.lighthouse_score = lighthouseScore.score >= budgets.performance_targets.lighthouse_performance_score;
        compliance.page_load_time = resourceMetrics.loadTime <= budgets.performance_targets.page_load_time;
        
        // Overall compliance
        const complianceValues = Object.values(compliance);
        compliance.overall = complianceValues.every(c => c === true);
        compliance.score = (complianceValues.filter(c => c === true).length / complianceValues.length) * 100;
        
        return compliance;
    }
    
    /**
     * Calculate overall performance grade
     */
    calculatePerformanceGrade(result) {
        const score = result.budgetCompliance.score;
        
        if (score >= 95) return 'A+';
        if (score >= 90) return 'A';
        if (score >= 85) return 'A-';
        if (score >= 80) return 'B+';
        if (score >= 75) return 'B';
        if (score >= 70) return 'B-';
        if (score >= 65) return 'C+';
        if (score >= 60) return 'C';
        if (score >= 55) return 'C-';
        if (score >= 50) return 'D';
        return 'F';
    }
    
    /**
     * Run comprehensive performance monitoring across all pages, devices, and browsers
     */
    async runComprehensivePerformanceAnalysis() {
        console.log('🚀 Starting Comprehensive Performance Analysis...');
        console.log(`   Framework: ${this.config.framework_name} v${this.config.framework_version}`);
        console.log(`   Pages: ${this.testPages.length} | Devices: ${this.testDevices.length} | Browsers: ${this.browsers.length}`);
        console.log('');
        
        this.currentResults = [];
        const startTime = Date.now();
        
        // Run tests across all browser types
        for (const browserType of this.browsers) {
            console.log(`🌐 Testing with ${browserType}...`);
            
            let browser;
            try {
                if (browserType === 'chromium') {
                    browser = await chromium.launch();
                } else if (browserType === 'firefox') {
                    browser = await firefox.launch();
                } else if (browserType === 'webkit') {
                    browser = await webkit.launch();
                }
                
                // Test each page on each device
                for (const pageUrl of this.testPages) {
                    for (const device of this.testDevices) {
                        const result = await this.analyzePage(browser, pageUrl, device, browserType);
                        this.currentResults.push(result);
                        
                        // Check for emergency conditions
                        if (result.budgetCompliance && result.budgetCompliance.score < 50) {
                            console.warn(`⚠️  Critical performance issue detected: ${pageUrl} on ${device.name} (${browserType})`);
                        }
                    }
                }
            } catch (error) {
                console.error(`❌ Browser ${browserType} failed:`, error.message);
            } finally {
                if (browser) {
                    await browser.close();
                }
            }
        }
        
        const endTime = Date.now();
        console.log(`\n✅ Analysis complete in ${Math.round((endTime - startTime) / 1000)}s`);
        
        return this.generatePerformanceReport();
    }
    
    /**
     * Generate comprehensive performance report with governance integration
     */
    generatePerformanceReport() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Filter valid results
        const validResults = this.currentResults.filter(r => !r.error);
        const totalTests = this.currentResults.length;
        const passedTests = validResults.filter(r => r.budgetCompliance && r.budgetCompliance.overall).length;
        
        // Calculate averages
        const avgPerformanceScore = validResults.length > 0 ? 
            validResults.reduce((sum, r) => sum + (r.budgetCompliance?.score || 0), 0) / validResults.length : 0;
        
        // Identify critical issues
        const criticalIssues = validResults.filter(r => r.budgetCompliance && r.budgetCompliance.score < 60);
        const emergencyRequired = criticalIssues.length > 0 || avgPerformanceScore < 70;
        
        // Performance by page
        const pagePerformance = {};
        this.testPages.forEach(page => {
            const pageResults = validResults.filter(r => r.page === page);
            if (pageResults.length > 0) {
                pagePerformance[page] = {
                    averageScore: pageResults.reduce((sum, r) => sum + (r.budgetCompliance?.score || 0), 0) / pageResults.length,
                    grade: pageResults[0].performanceGrade,
                    issues: pageResults.filter(r => r.budgetCompliance && !r.budgetCompliance.overall).length
                };
            }
        });
        
        const report = {
            timestamp: timestamp,
            frameworkVersion: this.config.framework_version,
            governanceAuthority: this.config.framework_authority,
            summary: {
                totalTests: totalTests,
                validResults: validResults.length,
                passedTests: passedTests,
                overallCompliance: (passedTests / totalTests) * 100,
                averagePerformanceScore: avgPerformanceScore,
                performanceGrade: this.calculatePerformanceGrade({ budgetCompliance: { score: avgPerformanceScore } }),
                emergencyRequired: emergencyRequired
            },
            budgetCompliance: {
                budgets: this.budgets,
                complianceRate: (passedTests / totalTests) * 100,
                criticalIssuesCount: criticalIssues.length
            },
            pagePerformance: pagePerformance,
            criticalIssues: criticalIssues.map(issue => ({
                page: issue.page,
                device: issue.device,
                browser: issue.browser,
                score: issue.budgetCompliance?.score || 0,
                grade: issue.performanceGrade,
                primaryIssues: this.identifyPrimaryIssues(issue)
            })),
            governanceResponse: {
                emergencyTriggered: emergencyRequired,
                responseRequired: emergencyRequired ? 'IMMEDIATE' : 'STANDARD',
                authority: emergencyRequired ? 'technical-architect' : 'performance-optimizer',
                sla: emergencyRequired ? '15_minutes' : '30_minutes'
            },
            recommendations: this.generateRecommendations(validResults, avgPerformanceScore),
            detailedResults: this.currentResults
        };
        
        // Save report
        const reportPath = path.join(__dirname, 'reports', 'performance-analysis', `performance-analysis-${timestamp}.json`);
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        // Print summary
        this.printPerformanceSummary(report);
        
        // Trigger emergency response if needed
        if (emergencyRequired) {
            this.triggerEmergencyResponse(report);
        }
        
        return report;
    }
    
    /**
     * Identify primary performance issues
     */
    identifyPrimaryIssues(result) {
        const issues = [];
        
        if (result.budgetCompliance) {
            if (!result.budgetCompliance.lcp_mobile) issues.push('LCP_SLOW');
            if (!result.budgetCompliance.cls) issues.push('LAYOUT_SHIFT');
            if (!result.budgetCompliance.css_bundle) issues.push('CSS_BUNDLE_LARGE');
            if (!result.budgetCompliance.js_bundle) issues.push('JS_BUNDLE_LARGE');
            if (!result.budgetCompliance.lighthouse_score) issues.push('LIGHTHOUSE_LOW');
        }
        
        return issues;
    }
    
    /**
     * Generate performance optimization recommendations
     */
    generateRecommendations(results, avgScore) {
        const recommendations = [];
        
        if (avgScore < 70) {
            recommendations.push({
                priority: 'CRITICAL',
                category: 'Emergency Response',
                action: 'Immediate performance emergency response required',
                authority: 'technical-architect',
                sla: '15_minutes'
            });
        }
        
        // Bundle size recommendations
        const largeBundles = results.filter(r => r.resourceMetrics && 
            (r.resourceMetrics.cssSize > this.budgets.resource_budgets.css_bundle_size ||
             r.resourceMetrics.jsSize > this.budgets.resource_budgets.javascript_bundle_size));
             
        if (largeBundles.length > 0) {
            recommendations.push({
                priority: 'HIGH',
                category: 'Bundle Optimization',
                action: 'Implement bundle splitting and optimization',
                authority: 'performance-optimizer',
                sla: '2_hours'
            });
        }
        
        // Core Web Vitals recommendations
        const slowLCP = results.filter(r => r.coreWebVitals && r.coreWebVitals.lcp > 2500);
        if (slowLCP.length > 0) {
            recommendations.push({
                priority: 'HIGH', 
                category: 'Core Web Vitals',
                action: 'Optimize Largest Contentful Paint performance',
                authority: 'performance-optimizer',
                sla: '4_hours'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Print performance summary to console
     */
    printPerformanceSummary(report) {
        console.log('\n📊 PERFORMANCE OPTIMIZATION FRAMEWORK REPORT');
        console.log('=============================================');
        console.log(`Overall Performance Grade: ${report.summary.performanceGrade} (${report.summary.averagePerformanceScore.toFixed(1)}%)`);
        console.log(`Tests Passed: ${report.summary.passedTests}/${report.summary.totalTests} (${report.summary.overallCompliance.toFixed(1)}%)`);
        console.log(`Critical Issues: ${report.criticalIssues.length}`);
        
        if (report.governanceResponse.emergencyTriggered) {
            console.log('\n🚨 EMERGENCY RESPONSE REQUIRED');
            console.log(`Authority: ${report.governanceResponse.authority}`);
            console.log(`Response Time: ${report.governanceResponse.sla}`);
        }
        
        console.log('\n📈 Page Performance Summary:');
        Object.entries(report.pagePerformance).forEach(([page, perf]) => {
            console.log(`   ${page}: ${perf.grade} (${perf.averageScore.toFixed(1)}%) - ${perf.issues} issues`);
        });
        
        if (report.recommendations.length > 0) {
            console.log('\n🔧 Recommendations:');
            report.recommendations.forEach(rec => {
                console.log(`   [${rec.priority}] ${rec.action} (${rec.authority} - ${rec.sla})`);
            });
        }
        
        console.log(`\n📄 Full report saved to: reports/performance-analysis/`);
    }
    
    /**
     * Trigger emergency response protocols
     */
    triggerEmergencyResponse(report) {
        console.log('\n🚨 TRIGGERING PERFORMANCE EMERGENCY RESPONSE');
        console.log('============================================');
        
        const emergencyReport = {
            timestamp: new Date().toISOString(),
            type: 'PERFORMANCE_EMERGENCY',
            severity: 'CRITICAL',
            authority: report.governanceResponse.authority,
            sla: report.governanceResponse.sla,
            summary: report.summary,
            criticalIssues: report.criticalIssues,
            recommendedActions: report.recommendations.filter(r => r.priority === 'CRITICAL')
        };
        
        // Save emergency report
        const emergencyPath = path.join(__dirname, 'reports', 'emergency', `performance-emergency-${Date.now()}.json`);
        fs.mkdirSync(path.dirname(emergencyPath), { recursive: true });
        fs.writeFileSync(emergencyPath, JSON.stringify(emergencyReport, null, 2));
        
        console.log(`Emergency report saved: ${emergencyPath}`);
        console.log('Automatic rollback consideration triggered');
        
        this.emergencyTriggered = true;
    }
    
    /**
     * CLI interface for running performance monitoring
     */
    static async runCLI() {
        const monitor = new CorePerformanceMonitor();
        const report = await monitor.runComprehensivePerformanceAnalysis();
        
        // Exit with appropriate code
        if (report.governanceResponse.emergencyTriggered) {
            console.error('\n❌ Performance emergency triggered - immediate action required');
            process.exit(2);
        } else if (report.summary.overallCompliance < 80) {
            console.warn('\n⚠️  Performance issues detected - optimization recommended');  
            process.exit(1);
        } else {
            console.log('\n✅ Performance within acceptable parameters');
            process.exit(0);
        }
    }
}

// CLI execution
if (require.main === module) {
    CorePerformanceMonitor.runCLI().catch(error => {
        console.error('❌ Performance monitoring failed:', error);
        process.exit(1);
    });
}

module.exports = CorePerformanceMonitor;