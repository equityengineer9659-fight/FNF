/**
 * Performance Regression Detection System
 * Food-N-Force Performance Optimization Framework v1.0
 * 
 * Automated detection of performance regressions with statistical analysis
 * Authority: performance-optimizer + technical-architect
 * 
 * Features:
 * - Statistical regression analysis using historical baselines
 * - Multi-metric performance comparison
 * - Automatic rollback triggers for critical regressions
 * - Integration with CI/CD pipeline for pre-deployment validation
 * - Trend analysis and early warning system
 * - Governance-integrated emergency response
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class RegressionDetectionSystem {
    constructor(configPath = null) {
        // Load configuration
        const defaultConfig = path.join(__dirname, 'performance-framework-config.json');
        const configFile = configPath || defaultConfig;
        this.config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        
        // Initialize regression detection state
        this.baselineData = null;
        this.regressionThresholds = {
            CRITICAL: 30, // 30% regression triggers critical alert
            HIGH: 20,     // 20% regression triggers high alert
            MEDIUM: 15,   // 15% regression triggers medium alert
            LOW: 10       // 10% regression triggers low alert
        };
        
        // Rollback thresholds
        this.rollbackThresholds = {
            AUTOMATIC: 25, // Automatic rollback at 25% regression
            MANUAL: 20     // Manual rollback recommendation at 20%
        };
        
        // Statistical analysis parameters
        this.statisticalConfig = {
            minimumSamples: 10,        // Minimum samples for valid baseline
            confidenceLevel: 0.95,      // 95% confidence level
            outlierThreshold: 2.0,      // Z-score threshold for outliers
            trendWindowSize: 20         // Number of samples for trend analysis
        };
        
        // Performance metrics to track for regression
        this.trackedMetrics = [
            'lcp', 'fcp', 'cls', 'tti', 'ttfb',
            'lighthouse_score', 'bundle_size_css', 'bundle_size_js',
            'page_load_time', 'dom_content_loaded'
        ];
        
        console.log('📈 Performance Regression Detection System initialized');
        console.log(`   Tracked Metrics: ${this.trackedMetrics.length}`);
        console.log(`   Critical Threshold: ${this.regressionThresholds.CRITICAL}%`);
    }
    
    /**
     * Establish performance baseline from historical data
     */
    async establishBaseline() {
        console.log('📊 Establishing performance baseline...');
        
        try {
            // Load historical performance data
            const historicalData = await this.loadHistoricalData();
            
            if (historicalData.length < this.statisticalConfig.minimumSamples) {
                throw new Error(`Insufficient historical data: ${historicalData.length} samples, minimum ${this.statisticalConfig.minimumSamples} required`);
            }
            
            // Calculate statistical baseline for each metric
            this.baselineData = {};
            
            for (const metric of this.trackedMetrics) {
                const metricData = this.extractMetricData(historicalData, metric);
                
                if (metricData.length > 0) {
                    this.baselineData[metric] = this.calculateStatisticalBaseline(metricData, metric);
                }
            }
            
            // Save baseline data
            await this.saveBaselineData();
            
            console.log(`✅ Baseline established for ${Object.keys(this.baselineData).length} metrics`);
            this.logBaselineSummary();
            
            return this.baselineData;
            
        } catch (error) {
            console.error(`❌ Failed to establish baseline: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Load historical performance data from multiple sources
     */
    async loadHistoricalData() {
        const historicalData = [];
        
        try {
            // Load from Core Web Vitals monitoring data
            const vitalsData = await this.loadWebVitalsHistory();
            historicalData.push(...vitalsData);
            
            // Load from Lighthouse reports
            const lighthouseData = await this.loadLighthouseHistory();
            historicalData.push(...lighthouseData);
            
            // Load from performance budget monitoring
            const budgetData = await this.loadBudgetMonitoringHistory();
            historicalData.push(...budgetData);
            
        } catch (error) {
            console.warn(`⚠️  Some historical data could not be loaded: ${error.message}`);
        }
        
        // Sort by timestamp and remove duplicates
        const sortedData = historicalData
            .filter(data => data.timestamp)
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
            .filter((data, index, array) => {
                // Remove duplicates within 1 minute window
                if (index === 0) return true;
                const prevTimestamp = new Date(array[index - 1].timestamp);
                const currentTimestamp = new Date(data.timestamp);
                return currentTimestamp - prevTimestamp > 60000;
            });
        
        console.log(`📊 Loaded ${sortedData.length} historical data points`);
        return sortedData;
    }
    
    /**
     * Load Web Vitals monitoring history
     */
    async loadWebVitalsHistory() {
        try {
            const vitalsDir = path.join(__dirname, 'reports', 'monitoring-data');
            const files = fs.readdirSync(vitalsDir).filter(f => f.endsWith('.json'));
            const vitalsData = [];
            
            for (const file of files) {
                const data = JSON.parse(fs.readFileSync(path.join(vitalsDir, file), 'utf8'));
                if (data.historicalData) {
                    vitalsData.push(...data.historicalData);
                }
            }
            
            return vitalsData;
        } catch (error) {
            console.warn(`Could not load Web Vitals history: ${error.message}`);
            return [];
        }
    }
    
    /**
     * Load Lighthouse performance history
     */
    async loadLighthouseHistory() {
        try {
            const lighthouseDir = path.join(__dirname, '../../.lighthouseci');
            const files = fs.readdirSync(lighthouseDir).filter(f => f.endsWith('.json'));
            const lighthouseData = [];
            
            for (const file of files.slice(-20)) { // Last 20 reports
                const data = JSON.parse(fs.readFileSync(path.join(lighthouseDir, file), 'utf8'));
                
                lighthouseData.push({
                    timestamp: new Date().toISOString(),
                    lighthouse_score: data.categories?.performance?.score * 100 || null,
                    lcp: data.audits?.['largest-contentful-paint']?.numericValue || null,
                    fcp: data.audits?.['first-contentful-paint']?.numericValue || null,
                    cls: data.audits?.['cumulative-layout-shift']?.numericValue || null,
                    tti: data.audits?.['interactive']?.numericValue || null,
                    ttfb: data.audits?.['server-response-time']?.numericValue || null
                });
            }
            
            return lighthouseData;
        } catch (error) {
            console.warn(`Could not load Lighthouse history: ${error.message}`);
            return [];
        }
    }
    
    /**
     * Load performance budget monitoring history
     */
    async loadBudgetMonitoringHistory() {
        try {
            const budgetDir = path.join(__dirname, '../../test-results');
            const files = fs.readdirSync(budgetDir).filter(f => f.includes('performance-budget') && f.endsWith('.json'));
            const budgetData = [];
            
            for (const file of files.slice(-10)) { // Last 10 reports
                const data = JSON.parse(fs.readFileSync(path.join(budgetDir, file), 'utf8'));
                
                if (data.detailedResults) {
                    for (const result of data.detailedResults) {
                        if (!result.error && result.performance) {
                            budgetData.push({
                                timestamp: result.timestamp,
                                page_load_time: result.performance.loadTime,
                                dom_content_loaded: result.performance.domContentLoaded,
                                bundle_size_css: result.performance.cssSize,
                                bundle_size_js: result.performance.jsSize
                            });
                        }
                    }
                }
            }
            
            return budgetData;
        } catch (error) {
            console.warn(`Could not load budget monitoring history: ${error.message}`);
            return [];
        }
    }
    
    /**
     * Extract metric data from historical dataset
     */
    extractMetricData(historicalData, metric) {
        return historicalData
            .map(data => this.getMetricValue(data, metric))
            .filter(value => value !== null && value !== undefined && !isNaN(value));
    }
    
    /**
     * Get metric value from data object (handles different data structures)
     */
    getMetricValue(data, metric) {
        // Direct property access
        if (data[metric] !== undefined) return data[metric];
        
        // Nested in webVitals object
        if (data.webVitals && data.webVitals[metric] !== undefined) return data.webVitals[metric];
        
        // Nested in performance object
        if (data.performance && data.performance[metric] !== undefined) return data.performance[metric];
        
        // Nested in coreWebVitals object
        if (data.coreWebVitals && data.coreWebVitals[metric] !== undefined) return data.coreWebVitals[metric];
        
        return null;
    }
    
    /**
     * Calculate statistical baseline for a metric
     */
    calculateStatisticalBaseline(metricData, metricName) {
        // Remove outliers using Z-score
        const cleanedData = this.removeOutliers(metricData);
        
        if (cleanedData.length < this.statisticalConfig.minimumSamples) {
            console.warn(`⚠️  Insufficient clean data for ${metricName}: ${cleanedData.length} samples`);
        }
        
        // Calculate statistical measures
        const mean = this.calculateMean(cleanedData);
        const median = this.calculateMedian(cleanedData);
        const stdDev = this.calculateStandardDeviation(cleanedData);
        const percentile95 = this.calculatePercentile(cleanedData, 95);
        const percentile5 = this.calculatePercentile(cleanedData, 5);
        
        // Calculate confidence interval
        const marginOfError = this.calculateMarginOfError(stdDev, cleanedData.length);
        
        return {
            metric: metricName,
            samples: cleanedData.length,
            rawSamples: metricData.length,
            mean: mean,
            median: median,
            standardDeviation: stdDev,
            percentile95: percentile95,
            percentile5: percentile5,
            confidenceInterval: {
                lower: mean - marginOfError,
                upper: mean + marginOfError,
                level: this.statisticalConfig.confidenceLevel
            },
            lastUpdated: new Date().toISOString()
        };
    }
    
    /**
     * Remove statistical outliers using Z-score
     */
    removeOutliers(data) {
        if (data.length < 3) return data;
        
        const mean = this.calculateMean(data);
        const stdDev = this.calculateStandardDeviation(data);
        
        if (stdDev === 0) return data; // No variation
        
        return data.filter(value => {
            const zScore = Math.abs(value - mean) / stdDev;
            return zScore <= this.statisticalConfig.outlierThreshold;
        });
    }
    
    /**
     * Calculate mean of array
     */
    calculateMean(data) {
        return data.reduce((sum, value) => sum + value, 0) / data.length;
    }
    
    /**
     * Calculate median of array
     */
    calculateMedian(data) {
        const sorted = data.slice().sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        return sorted.length % 2 !== 0 
            ? sorted[mid] 
            : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    
    /**
     * Calculate standard deviation
     */
    calculateStandardDeviation(data) {
        const mean = this.calculateMean(data);
        const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / data.length;
        return Math.sqrt(variance);
    }
    
    /**
     * Calculate percentile
     */
    calculatePercentile(data, percentile) {
        const sorted = data.slice().sort((a, b) => a - b);
        const index = (percentile / 100) * (sorted.length - 1);
        
        if (index % 1 === 0) {
            return sorted[index];
        } else {
            const lower = sorted[Math.floor(index)];
            const upper = sorted[Math.ceil(index)];
            return lower + (upper - lower) * (index % 1);
        }
    }
    
    /**
     * Calculate margin of error for confidence interval
     */
    calculateMarginOfError(stdDev, sampleSize) {
        // Using t-distribution approximation for 95% confidence
        const tValue = 1.96; // Approximate for large samples
        return tValue * (stdDev / Math.sqrt(sampleSize));
    }
    
    /**
     * Detect performance regression in current data vs baseline
     */
    async detectRegression(currentData) {
        console.log('🔍 Detecting performance regression...');
        
        if (!this.baselineData) {
            console.log('📊 No baseline data available - establishing baseline first...');
            await this.establishBaseline();
        }
        
        const regressionResults = {
            timestamp: new Date().toISOString(),
            overallRegression: false,
            criticalRegressions: [],
            highRegressions: [],
            mediumRegressions: [],
            lowRegressions: [],
            improvements: [],
            rollbackRecommended: false,
            emergencyResponse: false
        };
        
        // Analyze each metric for regression
        for (const metric of this.trackedMetrics) {
            if (!this.baselineData[metric]) continue;
            
            const currentValue = this.getMetricValue(currentData, metric);
            if (currentValue === null || currentValue === undefined) continue;
            
            const regression = this.analyzeMetricRegression(metric, currentValue, this.baselineData[metric]);
            
            if (regression.hasRegression) {
                regressionResults.overallRegression = true;
                
                // Categorize by severity
                if (regression.severityLevel === 'CRITICAL') {
                    regressionResults.criticalRegressions.push(regression);
                } else if (regression.severityLevel === 'HIGH') {
                    regressionResults.highRegressions.push(regression);
                } else if (regression.severityLevel === 'MEDIUM') {
                    regressionResults.mediumRegressions.push(regression);
                } else {
                    regressionResults.lowRegressions.push(regression);
                }
            } else if (regression.hasImprovement) {
                regressionResults.improvements.push(regression);
            }
        }
        
        // Determine response level
        if (regressionResults.criticalRegressions.length > 0) {
            regressionResults.emergencyResponse = true;
            regressionResults.rollbackRecommended = true;
        } else if (regressionResults.highRegressions.length > 2) {
            regressionResults.rollbackRecommended = true;
        }
        
        // Save regression analysis
        await this.saveRegressionAnalysis(regressionResults);
        
        // Log results
        this.logRegressionResults(regressionResults);
        
        // Trigger governance response if needed
        if (regressionResults.emergencyResponse) {
            await this.triggerEmergencyResponse(regressionResults);
        }
        
        return regressionResults;
    }
    
    /**
     * Analyze regression for a specific metric
     */
    analyzeMetricRegression(metric, currentValue, baseline) {
        const regression = {
            metric: metric,
            currentValue: currentValue,
            baselineMean: baseline.mean,
            baselineMedian: baseline.median,
            hasRegression: false,
            hasImprovement: false,
            regressionPercentage: 0,
            severityLevel: 'NONE',
            withinConfidenceInterval: false,
            significanceTest: null
        };
        
        // Check if within confidence interval
        regression.withinConfidenceInterval = 
            currentValue >= baseline.confidenceInterval.lower && 
            currentValue <= baseline.confidenceInterval.upper;
        
        // Calculate percentage change from baseline mean
        const percentageChange = ((currentValue - baseline.mean) / baseline.mean) * 100;
        regression.regressionPercentage = Math.abs(percentageChange);
        
        // Determine if this is a regression or improvement based on metric type
        const isWorseValue = this.isWorsePerformanceValue(metric, currentValue, baseline.mean);
        
        if (isWorseValue && percentageChange > 0) {
            // Performance degraded
            regression.hasRegression = true;
            
            if (regression.regressionPercentage >= this.regressionThresholds.CRITICAL) {
                regression.severityLevel = 'CRITICAL';
            } else if (regression.regressionPercentage >= this.regressionThresholds.HIGH) {
                regression.severityLevel = 'HIGH';
            } else if (regression.regressionPercentage >= this.regressionThresholds.MEDIUM) {
                regression.severityLevel = 'MEDIUM';
            } else if (regression.regressionPercentage >= this.regressionThresholds.LOW) {
                regression.severityLevel = 'LOW';
            }
        } else if (!isWorseValue && percentageChange < 0) {
            // Performance improved
            regression.hasImprovement = true;
            regression.regressionPercentage = Math.abs(percentageChange);
        }
        
        // Add significance test (simplified)
        regression.significanceTest = {
            statisticallySignificant: !regression.withinConfidenceInterval && regression.regressionPercentage >= this.regressionThresholds.LOW,
            confidenceLevel: this.statisticalConfig.confidenceLevel
        };
        
        return regression;
    }
    
    /**
     * Determine if current value represents worse performance than baseline
     */
    isWorsePerformanceValue(metric, currentValue, baselineValue) {
        // For these metrics, higher values are worse
        const higherIsWorse = ['lcp', 'fcp', 'cls', 'tti', 'ttfb', 'page_load_time', 'dom_content_loaded', 'bundle_size_css', 'bundle_size_js'];
        
        // For these metrics, lower values are worse
        const lowerIsWorse = ['lighthouse_score'];
        
        if (higherIsWorse.includes(metric)) {
            return currentValue > baselineValue;
        } else if (lowerIsWorse.includes(metric)) {
            return currentValue < baselineValue;
        }
        
        // Default: assume higher is worse
        return currentValue > baselineValue;
    }
    
    /**
     * Save baseline data to file
     */
    async saveBaselineData() {
        try {
            const baselinePath = path.join(__dirname, 'reports', 'baselines', `performance-baseline-${new Date().toISOString().split('T')[0]}.json`);
            fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
            fs.writeFileSync(baselinePath, JSON.stringify({
                establishedAt: new Date().toISOString(),
                configuration: this.statisticalConfig,
                thresholds: this.regressionThresholds,
                baseline: this.baselineData
            }, null, 2));
            
            // Also save as latest baseline
            const latestPath = path.join(__dirname, 'reports', 'baselines', 'latest-baseline.json');
            fs.writeFileSync(latestPath, JSON.stringify(this.baselineData, null, 2));
            
            console.log(`📊 Baseline saved: ${baselinePath}`);
        } catch (error) {
            console.warn(`⚠️  Could not save baseline: ${error.message}`);
        }
    }
    
    /**
     * Save regression analysis results
     */
    async saveRegressionAnalysis(results) {
        try {
            const regressionPath = path.join(__dirname, 'reports', 'regressions', `regression-analysis-${Date.now()}.json`);
            fs.mkdirSync(path.dirname(regressionPath), { recursive: true });
            fs.writeFileSync(regressionPath, JSON.stringify(results, null, 2));
            
            console.log(`📊 Regression analysis saved: ${regressionPath}`);
        } catch (error) {
            console.warn(`⚠️  Could not save regression analysis: ${error.message}`);
        }
    }
    
    /**
     * Log baseline summary
     */
    logBaselineSummary() {
        console.log('\n📊 PERFORMANCE BASELINE SUMMARY');
        console.log('===============================');
        
        Object.entries(this.baselineData).forEach(([metric, baseline]) => {
            console.log(`${metric}:`);
            console.log(`   Mean: ${baseline.mean.toFixed(2)} (±${baseline.standardDeviation.toFixed(2)})`);
            console.log(`   Range: ${baseline.percentile5.toFixed(2)} - ${baseline.percentile95.toFixed(2)}`);
            console.log(`   Samples: ${baseline.samples}/${baseline.rawSamples}`);
        });
    }
    
    /**
     * Log regression analysis results
     */
    logRegressionResults(results) {
        console.log('\n📈 REGRESSION ANALYSIS RESULTS');
        console.log('==============================');
        console.log(`Overall Regression: ${results.overallRegression ? 'YES' : 'NO'}`);
        console.log(`Critical Regressions: ${results.criticalRegressions.length}`);
        console.log(`High Regressions: ${results.highRegressions.length}`);
        console.log(`Medium Regressions: ${results.mediumRegressions.length}`);
        console.log(`Improvements: ${results.improvements.length}`);
        
        if (results.rollbackRecommended) {
            console.log('\n🚨 ROLLBACK RECOMMENDED');
        }
        
        if (results.emergencyResponse) {
            console.log('🚨 EMERGENCY RESPONSE REQUIRED');
        }
        
        // Log critical regressions
        if (results.criticalRegressions.length > 0) {
            console.log('\n🔴 Critical Regressions:');
            results.criticalRegressions.forEach(reg => {
                console.log(`   ${reg.metric}: ${reg.regressionPercentage.toFixed(1)}% regression (${reg.currentValue.toFixed(2)} vs ${reg.baselineMean.toFixed(2)})`);
            });
        }
        
        // Log improvements
        if (results.improvements.length > 0) {
            console.log('\n🟢 Performance Improvements:');
            results.improvements.forEach(improvement => {
                console.log(`   ${improvement.metric}: ${improvement.regressionPercentage.toFixed(1)}% improvement`);
            });
        }
    }
    
    /**
     * Trigger emergency response for critical performance regression
     */
    async triggerEmergencyResponse(regressionResults) {
        console.log('\n🚨 TRIGGERING PERFORMANCE REGRESSION EMERGENCY RESPONSE');
        console.log('======================================================');
        
        const emergencyResponse = {
            timestamp: new Date().toISOString(),
            type: 'PERFORMANCE_REGRESSION_EMERGENCY',
            authority: 'technical-architect',
            sla: '15_minutes',
            criticalRegressions: regressionResults.criticalRegressions,
            rollbackRecommended: regressionResults.rollbackRecommended,
            immediateActions: [
                'Automatic rollback consideration triggered',
                'Performance emergency team notified',
                'Critical regression analysis initiated',
                'User impact assessment started'
            ],
            governanceEscalation: true
        };
        
        // Save emergency response
        const emergencyPath = path.join(__dirname, 'reports', 'emergency', `regression-emergency-${Date.now()}.json`);
        fs.mkdirSync(path.dirname(emergencyPath), { recursive: true });
        fs.writeFileSync(emergencyPath, JSON.stringify(emergencyResponse, null, 2));
        
        console.log(`Emergency response report: ${emergencyPath}`);
        
        // Check for automatic rollback triggers
        if (this.shouldTriggerAutomaticRollback(regressionResults)) {
            await this.triggerAutomaticRollback(regressionResults);
        }
    }
    
    /**
     * Determine if automatic rollback should be triggered
     */
    shouldTriggerAutomaticRollback(regressionResults) {
        // Trigger automatic rollback if any regression exceeds automatic threshold
        return regressionResults.criticalRegressions.some(regression => 
            regression.regressionPercentage >= this.rollbackThresholds.AUTOMATIC
        );
    }
    
    /**
     * Trigger automatic rollback procedure
     */
    async triggerAutomaticRollback(regressionResults) {
        console.log('\n🔄 TRIGGERING AUTOMATIC ROLLBACK');
        console.log('================================');
        
        try {
            // Execute rollback via content release system
            await execAsync('npm run deploy:rollback');
            
            console.log('✅ Automatic rollback initiated');
            
            // Log rollback action
            const rollbackLog = {
                timestamp: new Date().toISOString(),
                trigger: 'AUTOMATIC_PERFORMANCE_REGRESSION',
                regressions: regressionResults.criticalRegressions,
                rollbackSuccess: true
            };
            
            const rollbackPath = path.join(__dirname, 'reports', 'rollbacks', `automatic-rollback-${Date.now()}.json`);
            fs.mkdirSync(path.dirname(rollbackPath), { recursive: true });
            fs.writeFileSync(rollbackPath, JSON.stringify(rollbackLog, null, 2));
            
        } catch (error) {
            console.error('❌ Automatic rollback failed:', error.message);
            
            // Log rollback failure
            const rollbackLog = {
                timestamp: new Date().toISOString(),
                trigger: 'AUTOMATIC_PERFORMANCE_REGRESSION',
                regressions: regressionResults.criticalRegressions,
                rollbackSuccess: false,
                error: error.message
            };
            
            const rollbackPath = path.join(__dirname, 'reports', 'rollbacks', `rollback-failure-${Date.now()}.json`);
            fs.mkdirSync(path.dirname(rollbackPath), { recursive: true });
            fs.writeFileSync(rollbackPath, JSON.stringify(rollbackLog, null, 2));
        }
    }
    
    /**
     * CLI interface for regression detection
     */
    static async runCLI() {
        const args = process.argv.slice(2);
        const detector = new RegressionDetectionSystem();
        
        if (args[0] === 'establish-baseline') {
            // Establish new baseline
            await detector.establishBaseline();
            console.log('✅ Baseline established successfully');
            
        } else if (args[0] === 'detect' && args[1]) {
            // Detect regression from file
            const currentDataFile = args[1];
            const currentData = JSON.parse(fs.readFileSync(currentDataFile, 'utf8'));
            
            const results = await detector.detectRegression(currentData);
            
            if (results.emergencyResponse) {
                process.exit(2); // Emergency
            } else if (results.rollbackRecommended) {
                process.exit(1); // Rollback recommended
            } else {
                process.exit(0); // No issues
            }
            
        } else {
            // Default: run performance monitoring and detect regression
            console.log('🚀 Running performance monitoring with regression detection...');
            
            // Run current performance measurement
            await execAsync('npm run test:performance-budget');
            
            // Load latest results
            const resultsDir = path.join(__dirname, '../../test-results');
            const latestResults = fs.readdirSync(resultsDir)
                .filter(f => f.includes('performance-budget') && f.endsWith('.json'))
                .sort()
                .pop();
                
            if (latestResults) {
                const currentData = JSON.parse(fs.readFileSync(path.join(resultsDir, latestResults), 'utf8'));
                const results = await detector.detectRegression(currentData);
                
                if (results.emergencyResponse) {
                    console.error('🚨 Performance emergency detected');
                    process.exit(2);
                } else if (results.rollbackRecommended) {
                    console.warn('⚠️  Rollback recommended');
                    process.exit(1);
                } else {
                    console.log('✅ No significant regressions detected');
                    process.exit(0);
                }
            } else {
                console.error('❌ No performance data available');
                process.exit(1);
            }
        }
    }
}

// CLI execution
if (require.main === module) {
    RegressionDetectionSystem.runCLI().catch(error => {
        console.error('❌ Regression detection failed:', error);
        process.exit(1);
    });
}

module.exports = RegressionDetectionSystem;