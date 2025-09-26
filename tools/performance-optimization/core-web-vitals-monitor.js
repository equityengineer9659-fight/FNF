/**
 * Core Web Vitals Real-Time Monitoring System
 * Food-N-Force Performance Optimization Framework v1.0
 * 
 * Real-time Core Web Vitals monitoring with automated alerts
 * Authority: performance-optimizer + technical-architect
 * 
 * Features:
 * - Real User Monitoring (RUM) simulation
 * - Continuous Core Web Vitals tracking
 * - Automated alert system for threshold violations
 * - Trend analysis and regression detection
 * - Integration with governance emergency response
 * - Nonprofit-specific performance tracking
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class CoreWebVitalsMonitor extends EventEmitter {
    constructor(configPath = null) {
        super();
        
        // Load configuration
        const defaultConfig = path.join(__dirname, 'performance-framework-config.json');
        const configFile = configPath || defaultConfig;
        this.config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        
        // Initialize monitoring state
        this.isMonitoring = false;
        this.monitoringInterval = null;
        this.currentMetrics = {};
        this.historicalData = [];
        this.alertThresholds = this.config.performance_budgets.core_web_vitals;
        this.alertHistory = [];
        
        // Monitoring configuration
        this.monitoringConfig = {
            interval: 30000, // 30 seconds
            samplingDuration: 10000, // 10 seconds per sample
            maxHistoryLength: 288, // 24 hours at 30-second intervals
            alertCooldown: 300000 // 5 minutes between identical alerts
        };
        
        // Pages to monitor (high-traffic nonprofit pages)
        this.monitoringPages = [
            { url: '/', name: 'Homepage', priority: 'CRITICAL' },
            { url: '/about.html', name: 'About', priority: 'HIGH' },
            { url: '/services.html', name: 'Services', priority: 'HIGH' },
            { url: '/contact.html', name: 'Contact/Donate', priority: 'CRITICAL' },
            { url: '/resources.html', name: 'Resources', priority: 'MEDIUM' },
            { url: '/impact.html', name: 'Impact', priority: 'MEDIUM' }
        ];
        
        // Device profiles for monitoring
        this.deviceProfiles = [
            {
                name: 'Mobile',
                viewport: { width: 375, height: 667 },
                userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
                networkThrottling: '3G',
                weight: 0.6 // 60% of users on mobile
            },
            {
                name: 'Desktop',
                viewport: { width: 1920, height: 1080 },
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                networkThrottling: 'FAST_3G',
                weight: 0.4 // 40% of users on desktop
            }
        ];
        
        console.log('📊 Core Web Vitals Monitor initialized');
        console.log(`   Monitoring Pages: ${this.monitoringPages.length}`);
        console.log(`   Sampling Interval: ${this.monitoringConfig.interval / 1000}s`);
    }
    
    /**
     * Start real-time monitoring
     */
    async startMonitoring() {
        if (this.isMonitoring) {
            console.warn('⚠️  Monitoring already active');
            return;
        }
        
        console.log('🚀 Starting Core Web Vitals real-time monitoring...');
        this.isMonitoring = true;
        
        // Initial baseline measurement
        await this.collectInitialBaseline();
        
        // Start continuous monitoring
        this.monitoringInterval = setInterval(async () => {
            try {
                await this.performMonitoringCycle();
            } catch (error) {
                console.error('❌ Monitoring cycle failed:', error.message);
                this.emit('monitoringError', error);
            }
        }, this.monitoringConfig.interval);
        
        console.log('✅ Real-time monitoring started');
        this.emit('monitoringStarted');
    }
    
    /**
     * Stop real-time monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            console.warn('⚠️  Monitoring not active');
            return;
        }
        
        console.log('🛑 Stopping Core Web Vitals monitoring...');
        this.isMonitoring = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        console.log('✅ Monitoring stopped');
        this.emit('monitoringStopped');
    }
    
    /**
     * Collect initial baseline measurements
     */
    async collectInitialBaseline() {
        console.log('📏 Collecting initial baseline measurements...');
        
        const baselineData = [];
        const browser = await chromium.launch({ headless: true });
        
        try {
            // Measure each page on each device profile
            for (const page of this.monitoringPages) {
                for (const device of this.deviceProfiles) {
                    const measurement = await this.measureCoreWebVitals(browser, page, device);
                    baselineData.push({
                        ...measurement,
                        timestamp: new Date().toISOString(),
                        type: 'BASELINE'
                    });
                }
            }
        } finally {
            await browser.close();
        }
        
        // Store baseline
        this.historicalData.push(...baselineData);
        this.saveHistoricalData();
        
        console.log(`📊 Baseline collected: ${baselineData.length} measurements`);
    }
    
    /**
     * Perform single monitoring cycle
     */
    async performMonitoringCycle() {
        const cycleStart = Date.now();
        const measurements = [];
        
        const browser = await chromium.launch({ headless: true });
        
        try {
            // Sample a subset of pages for this cycle (rotate for efficiency)
            const pagesToMeasure = this.selectPagesForCycle();
            
            for (const page of pagesToMeasure) {
                for (const device of this.deviceProfiles) {
                    const measurement = await this.measureCoreWebVitals(browser, page, device);
                    measurements.push({
                        ...measurement,
                        timestamp: new Date().toISOString(),
                        type: 'MONITORING'
                    });
                }
            }
        } finally {
            await browser.close();
        }
        
        // Process measurements
        this.processMonitoringData(measurements);
        
        // Check for alerts
        await this.checkAlertConditions(measurements);
        
        const cycleTime = Date.now() - cycleStart;
        console.log(`📊 Monitoring cycle complete (${cycleTime}ms) - ${measurements.length} measurements`);
    }
    
    /**
     * Select pages for current monitoring cycle (intelligent rotation)
     */
    selectPagesForCycle() {
        const cycleNumber = Math.floor(Date.now() / this.monitoringConfig.interval);
        
        // Always monitor critical pages
        const criticalPages = this.monitoringPages.filter(p => p.priority === 'CRITICAL');
        
        // Rotate through high/medium priority pages
        const otherPages = this.monitoringPages.filter(p => p.priority !== 'CRITICAL');
        const selectedOtherPages = otherPages.filter((_, index) => (index + cycleNumber) % 3 === 0);
        
        return [...criticalPages, ...selectedOtherPages];
    }
    
    /**
     * Measure Core Web Vitals for specific page and device
     */
    async measureCoreWebVitals(browser, pageConfig, deviceProfile) {
        const page = await browser.newPage();
        
        try {
            // Configure page for device profile
            await page.setViewportSize(deviceProfile.viewport);
            await page.setUserAgent(deviceProfile.userAgent);
            
            // Apply network throttling if supported
            if (deviceProfile.networkThrottling === '3G') {
                await page.route('**/*', async route => {
                    // Simulate slow 3G
                    await new Promise(resolve => setTimeout(resolve, 100));
                    await route.continue();
                });
            }
            
            // Navigate and collect Web Vitals
            const navigationStart = Date.now();
            await page.goto(`http://localhost:8080${pageConfig.url}`, {
                waitUntil: 'networkidle',
                timeout: 30000
            });
            const navigationTime = Date.now() - navigationStart;
            
            // Wait for page to settle
            await page.waitForTimeout(2000);
            
            // Collect Core Web Vitals using browser APIs
            const webVitals = await page.evaluate(() => {
                return new Promise((resolve) => {
                    const vitals = {
                        lcp: null,
                        fid: null,
                        cls: null,
                        fcp: null,
                        ttfb: null
                    };
                    
                    let observersCount = 0;
                    const maxObservers = 3;
                    
                    const checkComplete = () => {
                        observersCount++;
                        if (observersCount >= maxObservers) {
                            resolve(vitals);
                        }
                    };
                    
                    // Timeout fallback
                    setTimeout(() => resolve(vitals), 8000);
                    
                    // LCP Observer
                    try {
                        const lcpObserver = new PerformanceObserver((list) => {
                            const entries = list.getEntries();
                            if (entries.length > 0) {
                                vitals.lcp = entries[entries.length - 1].startTime;
                            }
                        });
                        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                        setTimeout(() => {
                            lcpObserver.disconnect();
                            checkComplete();
                        }, 5000);
                    } catch (e) {
                        checkComplete();
                    }
                    
                    // FCP Observer
                    try {
                        const fcpObserver = new PerformanceObserver((list) => {
                            for (const entry of list.getEntries()) {
                                if (entry.name === 'first-contentful-paint') {
                                    vitals.fcp = entry.startTime;
                                    break;
                                }
                            }
                        });
                        fcpObserver.observe({ entryTypes: ['paint'] });
                        setTimeout(() => {
                            fcpObserver.disconnect();
                            checkComplete();
                        }, 3000);
                    } catch (e) {
                        checkComplete();
                    }
                    
                    // CLS Observer
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
                        clsObserver.observe({ entryTypes: ['layout-shift'] });
                        setTimeout(() => {
                            clsObserver.disconnect();
                            checkComplete();
                        }, 6000);
                    } catch (e) {
                        checkComplete();
                    }
                    
                    // Get TTFB from navigation timing
                    const navigation = performance.getEntriesByType('navigation')[0];
                    if (navigation) {
                        vitals.ttfb = navigation.responseStart - navigation.requestStart;
                    }
                });
            });
            
            // Test nonprofit-specific interactions
            const nonprofitMetrics = await this.testNonprofitInteractions(page, pageConfig);
            
            return {
                page: pageConfig.name,
                url: pageConfig.url,
                priority: pageConfig.priority,
                device: deviceProfile.name,
                deviceWeight: deviceProfile.weight,
                navigationTime: navigationTime,
                webVitals: webVitals,
                nonprofitMetrics: nonprofitMetrics,
                qualityScore: this.calculateQualityScore(webVitals, pageConfig.priority)
            };
            
        } catch (error) {
            console.warn(`⚠️  Failed to measure ${pageConfig.name} on ${deviceProfile.name}: ${error.message}`);
            return {
                page: pageConfig.name,
                url: pageConfig.url,
                priority: pageConfig.priority,
                device: deviceProfile.name,
                deviceWeight: deviceProfile.weight,
                error: error.message,
                webVitals: null,
                nonprofitMetrics: null,
                qualityScore: 0
            };
        } finally {
            await page.close();
        }
    }
    
    /**
     * Test nonprofit-specific user interactions
     */
    async testNonprofitInteractions(page, pageConfig) {
        const interactions = {};
        
        try {
            // Test donation form interaction (if present)
            if (pageConfig.url === '/' || pageConfig.url === '/contact.html') {
                const donationTest = await page.evaluate(() => {
                    const donationForm = document.querySelector('form[action*="donate"], .donation-form, [data-donation-form]');
                    if (donationForm) {
                        const startTime = performance.now();
                        donationForm.focus();
                        const focusTime = performance.now() - startTime;
                        return { found: true, focusTime: focusTime };
                    }
                    return { found: false, focusTime: null };
                });
                interactions.donationForm = donationTest;
            }
            
            // Test volunteer registration interaction
            if (pageConfig.url === '/about.html' || pageConfig.url === '/resources.html') {
                const volunteerTest = await page.evaluate(() => {
                    const volunteerForm = document.querySelector('form[action*="volunteer"], .volunteer-form, [data-volunteer-form]');
                    if (volunteerForm) {
                        const startTime = performance.now();
                        volunteerForm.focus();
                        const focusTime = performance.now() - startTime;
                        return { found: true, focusTime: focusTime };
                    }
                    return { found: false, focusTime: null };
                });
                interactions.volunteerForm = volunteerTest;
            }
            
            // Test critical navigation elements
            const navigationTest = await page.evaluate(() => {
                const mobileMenu = document.querySelector('[data-mobile-menu-toggle], .mobile-menu-toggle');
                const mainNav = document.querySelector('nav, .navigation, .main-nav');
                const criticalLinks = document.querySelectorAll('a[href*="donate"], a[href*="volunteer"], a[href*="help"]');
                
                return {
                    mobileMenuFound: !!mobileMenu,
                    mainNavFound: !!mainNav,
                    criticalLinksCount: criticalLinks.length
                };
            });
            interactions.navigation = navigationTest;
            
        } catch (error) {
            console.warn(`⚠️  Nonprofit interaction test failed: ${error.message}`);
        }
        
        return interactions;
    }
    
    /**
     * Calculate quality score based on Web Vitals and page priority
     */
    calculateQualityScore(webVitals, priority) {
        if (!webVitals || webVitals.lcp === null) return 0;
        
        let score = 100;
        
        // LCP scoring
        if (webVitals.lcp > 4000) score -= 40;
        else if (webVitals.lcp > 2500) score -= 20;
        
        // FCP scoring
        if (webVitals.fcp > 3000) score -= 20;
        else if (webVitals.fcp > 1800) score -= 10;
        
        // CLS scoring
        if (webVitals.cls > 0.25) score -= 30;
        else if (webVitals.cls > 0.1) score -= 15;
        
        // Priority weighting
        if (priority === 'CRITICAL') {
            score = score * 1.2; // 20% bonus for critical pages meeting targets
        }
        
        return Math.max(0, Math.min(100, score));
    }
    
    /**
     * Process monitoring data and update historical records
     */
    processMonitoringData(measurements) {
        // Add to historical data
        this.historicalData.push(...measurements);
        
        // Trim historical data to max length
        if (this.historicalData.length > this.monitoringConfig.maxHistoryLength) {
            this.historicalData = this.historicalData.slice(-this.monitoringConfig.maxHistoryLength);
        }
        
        // Update current metrics
        this.updateCurrentMetrics(measurements);
        
        // Save data
        this.saveHistoricalData();
        
        // Emit monitoring data event
        this.emit('monitoringData', {
            measurements: measurements,
            currentMetrics: this.currentMetrics,
            historicalCount: this.historicalData.length
        });
    }
    
    /**
     * Update current metrics with latest measurements
     */
    updateCurrentMetrics(measurements) {
        const validMeasurements = measurements.filter(m => m.webVitals && !m.error);
        
        if (validMeasurements.length === 0) return;
        
        // Calculate weighted averages by device usage
        const metrics = {
            lcp: 0,
            fcp: 0,
            cls: 0,
            ttfb: 0,
            qualityScore: 0,
            totalWeight: 0
        };
        
        validMeasurements.forEach(measurement => {
            const weight = measurement.deviceWeight;
            metrics.totalWeight += weight;
            
            if (measurement.webVitals.lcp) metrics.lcp += measurement.webVitals.lcp * weight;
            if (measurement.webVitals.fcp) metrics.fcp += measurement.webVitals.fcp * weight;
            if (measurement.webVitals.cls) metrics.cls += measurement.webVitals.cls * weight;
            if (measurement.webVitals.ttfb) metrics.ttfb += measurement.webVitals.ttfb * weight;
            metrics.qualityScore += measurement.qualityScore * weight;
        });
        
        // Calculate final averages
        if (metrics.totalWeight > 0) {
            this.currentMetrics = {
                lcp: metrics.lcp / metrics.totalWeight,
                fcp: metrics.fcp / metrics.totalWeight,
                cls: metrics.cls / metrics.totalWeight,
                ttfb: metrics.ttfb / metrics.totalWeight,
                qualityScore: metrics.qualityScore / metrics.totalWeight,
                timestamp: new Date().toISOString(),
                measurementCount: validMeasurements.length
            };
        }
    }
    
    /**
     * Check alert conditions and trigger notifications
     */
    async checkAlertConditions(measurements) {
        const alerts = [];
        
        // Check Core Web Vitals thresholds
        if (this.currentMetrics.lcp > this.alertThresholds.largest_contentful_paint.mobile * 1000) {
            alerts.push({
                type: 'LCP_THRESHOLD_EXCEEDED',
                severity: 'HIGH',
                current: this.currentMetrics.lcp,
                threshold: this.alertThresholds.largest_contentful_paint.mobile * 1000,
                message: `LCP ${(this.currentMetrics.lcp / 1000).toFixed(2)}s exceeds ${this.alertThresholds.largest_contentful_paint.mobile}s threshold`
            });
        }
        
        if (this.currentMetrics.cls > this.alertThresholds.cumulative_layout_shift.mobile) {
            alerts.push({
                type: 'CLS_THRESHOLD_EXCEEDED',
                severity: 'MEDIUM',
                current: this.currentMetrics.cls,
                threshold: this.alertThresholds.cumulative_layout_shift.mobile,
                message: `CLS ${this.currentMetrics.cls.toFixed(4)} exceeds ${this.alertThresholds.cumulative_layout_shift.mobile} threshold`
            });
        }
        
        // Check for sudden quality degradation
        const recentQualityScores = this.getRecentQualityScores(5); // Last 5 measurements
        if (recentQualityScores.length >= 3) {
            const currentAvg = recentQualityScores.slice(-3).reduce((sum, score) => sum + score, 0) / 3;
            const previousAvg = recentQualityScores.slice(0, 2).reduce((sum, score) => sum + score, 0) / 2;
            
            if (currentAvg < previousAvg * 0.8) { // 20% degradation
                alerts.push({
                    type: 'PERFORMANCE_DEGRADATION',
                    severity: 'CRITICAL',
                    current: currentAvg,
                    previous: previousAvg,
                    message: `Performance quality degraded by ${((previousAvg - currentAvg) / previousAvg * 100).toFixed(1)}%`
                });
            }
        }
        
        // Process alerts
        for (const alert of alerts) {
            await this.processAlert(alert);
        }
    }
    
    /**
     * Get recent quality scores from historical data
     */
    getRecentQualityScores(count) {
        return this.historicalData
            .filter(data => data.qualityScore !== undefined)
            .slice(-count)
            .map(data => data.qualityScore);
    }
    
    /**
     * Process and handle alerts
     */
    async processAlert(alert) {
        // Check alert cooldown
        const recentAlert = this.alertHistory.find(a => 
            a.type === alert.type && 
            Date.now() - new Date(a.timestamp).getTime() < this.monitoringConfig.alertCooldown
        );
        
        if (recentAlert) {
            return; // Skip duplicate alert within cooldown period
        }
        
        // Add timestamp
        alert.timestamp = new Date().toISOString();
        
        // Add to alert history
        this.alertHistory.push(alert);
        
        // Log alert
        console.log(`🚨 ALERT: ${alert.message} (${alert.severity})`);
        
        // Save alert
        this.saveAlert(alert);
        
        // Emit alert event
        this.emit('alert', alert);
        
        // Trigger governance response for critical alerts
        if (alert.severity === 'CRITICAL') {
            await this.triggerGovernanceAlert(alert);
        }
    }
    
    /**
     * Trigger governance alert for critical performance issues
     */
    async triggerGovernanceAlert(alert) {
        console.log('🚨 TRIGGERING GOVERNANCE ALERT');
        
        const governanceAlert = {
            timestamp: alert.timestamp,
            type: 'CORE_WEB_VITALS_EMERGENCY',
            severity: alert.severity,
            authority: 'performance-optimizer',
            escalation: 'technical-architect',
            sla: '15_minutes',
            alert: alert,
            currentMetrics: this.currentMetrics,
            recommendedActions: [
                'Investigate performance regression',
                'Check recent deployments for issues',
                'Consider emergency rollback if necessary',
                'Analyze user impact metrics'
            ]
        };
        
        // Save governance alert
        const alertPath = path.join(__dirname, 'reports', 'governance-alerts', `governance-alert-${Date.now()}.json`);
        fs.mkdirSync(path.dirname(alertPath), { recursive: true });
        fs.writeFileSync(alertPath, JSON.stringify(governanceAlert, null, 2));
        
        console.log(`Governance alert saved: ${alertPath}`);
        
        // Emit governance alert event
        this.emit('governanceAlert', governanceAlert);
    }
    
    /**
     * Save historical data to file
     */
    saveHistoricalData() {
        try {
            const dataPath = path.join(__dirname, 'reports', 'monitoring-data', `monitoring-${new Date().toISOString().split('T')[0]}.json`);
            fs.mkdirSync(path.dirname(dataPath), { recursive: true });
            fs.writeFileSync(dataPath, JSON.stringify({
                lastUpdated: new Date().toISOString(),
                currentMetrics: this.currentMetrics,
                historicalData: this.historicalData,
                alertHistory: this.alertHistory.slice(-50) // Keep last 50 alerts
            }, null, 2));
        } catch (error) {
            console.warn(`⚠️  Could not save historical data: ${error.message}`);
        }
    }
    
    /**
     * Save individual alert
     */
    saveAlert(alert) {
        try {
            const alertPath = path.join(__dirname, 'reports', 'alerts', `alert-${Date.now()}.json`);
            fs.mkdirSync(path.dirname(alertPath), { recursive: true });
            fs.writeFileSync(alertPath, JSON.stringify(alert, null, 2));
        } catch (error) {
            console.warn(`⚠️  Could not save alert: ${error.message}`);
        }
    }
    
    /**
     * Generate monitoring status report
     */
    generateStatusReport() {
        const report = {
            timestamp: new Date().toISOString(),
            monitoringActive: this.isMonitoring,
            currentMetrics: this.currentMetrics,
            dataPoints: this.historicalData.length,
            recentAlerts: this.alertHistory.slice(-10),
            thresholds: this.alertThresholds,
            recommendations: []
        };
        
        // Add recommendations based on current state
        if (this.currentMetrics.qualityScore < 70) {
            report.recommendations.push('Performance quality below optimal - investigate recent changes');
        }
        
        if (this.alertHistory.length > 0) {
            const recentCriticalAlerts = this.alertHistory.filter(a => 
                a.severity === 'CRITICAL' && 
                Date.now() - new Date(a.timestamp).getTime() < 3600000 // Last hour
            );
            
            if (recentCriticalAlerts.length > 0) {
                report.recommendations.push('Critical alerts in last hour - immediate attention required');
            }
        }
        
        return report;
    }
    
    /**
     * CLI interface for Core Web Vitals monitoring
     */
    static async runCLI() {
        const args = process.argv.slice(2);
        const monitor = new CoreWebVitalsMonitor();
        
        if (args[0] === 'start') {
            // Start monitoring
            monitor.on('alert', (alert) => {
                console.log(`🚨 ${alert.severity}: ${alert.message}`);
            });
            
            monitor.on('governanceAlert', (alert) => {
                console.log(`🚨 GOVERNANCE: ${alert.type} - ${alert.authority} response required`);
            });
            
            await monitor.startMonitoring();
            
            // Keep process alive
            process.on('SIGINT', () => {
                monitor.stopMonitoring();
                process.exit(0);
            });
            
            // Generate status reports every 5 minutes
            setInterval(() => {
                const report = monitor.generateStatusReport();
                console.log(`📊 Status: Quality ${report.currentMetrics.qualityScore?.toFixed(1) || 'N/A'} | LCP ${(report.currentMetrics.lcp / 1000).toFixed(2) || 'N/A'}s | CLS ${report.currentMetrics.cls?.toFixed(4) || 'N/A'}`);
            }, 300000);
            
        } else if (args[0] === 'status') {
            // Generate status report
            const report = monitor.generateStatusReport();
            console.log('📊 Core Web Vitals Monitoring Status:');
            console.log(JSON.stringify(report, null, 2));
            
        } else {
            // Default: single measurement run
            console.log('🏃 Running single Core Web Vitals measurement...');
            await monitor.collectInitialBaseline();
            const report = monitor.generateStatusReport();
            console.log(`Quality Score: ${report.currentMetrics.qualityScore?.toFixed(1) || 'N/A'}`);
        }
    }
}

// CLI execution
if (require.main === module) {
    CoreWebVitalsMonitor.runCLI().catch(error => {
        console.error('❌ Core Web Vitals monitoring failed:', error);
        process.exit(1);
    });
}

module.exports = CoreWebVitalsMonitor;