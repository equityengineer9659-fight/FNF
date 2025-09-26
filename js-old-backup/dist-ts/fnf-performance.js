/**
 * Food-N-Force Performance Module
 * Optimization, monitoring, and resource management
 * Provides centralized performance monitoring and optimization
 */
class FoodNForcePerformance {
    constructor() {
        this.isInitialized = false;
        this.metrics = {
            pageLoad: {},
            runtime: {},
            resources: {},
            interactions: {}
        };
        this.observers = [];
        this.resourceCache = new Map();
        this.performanceEntries = [];
        // Performance budgets (in milliseconds)
        this.budgets = {
            firstContentfulPaint: 1500,
            largestContentfulPaint: 2500,
            firstInputDelay: 100,
            cumulativeLayoutShift: 0.1,
            totalBlockingTime: 300
        };
        // Wait for core to be ready
        if (window.fnfCore?.isReady()) {
            this.init();
        }
        else {
            document.addEventListener('fnf:core:ready', () => this.init());
        }
    }
    init() {
        if (this.isInitialized)
            return;
        console.log('📊 Initializing Food-N-Force Performance Monitor...');
        try {
            this.capabilities = window.fnfCore.getCapabilities();
            this.setupPerformanceObservers();
            this.measurePageLoad();
            this.setupResourceOptimization();
            this.setupInteractionTracking();
            this.setupMemoryManagement();
            this.schedulePerformanceAudits();
            this.isInitialized = true;
            window.fnfCore.registerModule('performance', this);
            console.log('✅ Food-N-Force Performance Monitor initialized');
        }
        catch (error) {
            console.error('❌ Performance module initialization failed:', error);
        }
    }
    setupPerformanceObservers() {
        if (!('PerformanceObserver' in window)) {
            console.warn('PerformanceObserver not supported');
            return;
        }
        // Largest Contentful Paint
        try {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.pageLoad.largestContentfulPaint = lastEntry.startTime;
                this.checkBudget('largestContentfulPaint', lastEntry.startTime);
                console.log(`📏 LCP: ${lastEntry.startTime.toFixed(2)}ms`);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            this.observers.push(lcpObserver);
        }
        catch (e) {
            console.warn('LCP observer not supported');
        }
        // First Input Delay
        try {
            const fidObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    const fid = entry.processingStart - entry.startTime;
                    this.metrics.pageLoad.firstInputDelay = fid;
                    this.checkBudget('firstInputDelay', fid);
                    console.log(`⚡ FID: ${fid.toFixed(2)}ms`);
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
            this.observers.push(fidObserver);
        }
        catch (e) {
            console.warn('FID observer not supported');
        }
        // Cumulative Layout Shift
        try {
            const clsObserver = new PerformanceObserver((list) => {
                let clsValue = 0;
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                this.metrics.pageLoad.cumulativeLayoutShift = clsValue;
                this.checkBudget('cumulativeLayoutShift', clsValue);
                console.log(`📐 CLS: ${clsValue.toFixed(4)}`);
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
            this.observers.push(clsObserver);
        }
        catch (e) {
            console.warn('CLS observer not supported');
        }
        // Resource timing
        try {
            const resourceObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.analyzeResourceTiming(entry);
                });
            });
            resourceObserver.observe({ entryTypes: ['resource'] });
            this.observers.push(resourceObserver);
        }
        catch (e) {
            console.warn('Resource timing observer not supported');
        }
        // Long tasks
        try {
            const longTaskObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    this.metrics.runtime.longTasks = (this.metrics.runtime.longTasks || 0) + 1;
                    console.warn(`🐌 Long task detected: ${entry.duration.toFixed(2)}ms`);
                    // Track Total Blocking Time
                    const blockingTime = Math.max(0, entry.duration - 50);
                    this.metrics.runtime.totalBlockingTime = (this.metrics.runtime.totalBlockingTime || 0) + blockingTime;
                });
            });
            longTaskObserver.observe({ entryTypes: ['longtask'] });
            this.observers.push(longTaskObserver);
        }
        catch (e) {
            console.warn('Long task observer not supported');
        }
    }
    measurePageLoad() {
        // Use PerformanceNavigationTiming API
        if ('performance' in window && 'getEntriesByType' in performance) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const navigation = performance.getEntriesByType('navigation')[0];
                    if (navigation) {
                        this.metrics.pageLoad = {
                            ...this.metrics.pageLoad,
                            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                            loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                            domInteractive: navigation.domInteractive - navigation.fetchStart,
                            firstByte: navigation.responseStart - navigation.requestStart,
                            dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
                            tcpConnect: navigation.connectEnd - navigation.connectStart,
                            serverResponse: navigation.responseEnd - navigation.responseStart,
                            pageLoad: navigation.loadEventEnd - navigation.fetchStart
                        };
                        this.logPageLoadMetrics();
                        this.sendPageLoadAnalytics();
                    }
                }, 100);
            });
        }
        // Measure First Contentful Paint
        if ('PerformancePaintTiming' in window) {
            const paintObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach(entry => {
                    if (entry.name === 'first-contentful-paint') {
                        this.metrics.pageLoad.firstContentfulPaint = entry.startTime;
                        this.checkBudget('firstContentfulPaint', entry.startTime);
                        console.log(`🎨 FCP: ${entry.startTime.toFixed(2)}ms`);
                    }
                });
            });
            paintObserver.observe({ entryTypes: ['paint'] });
            this.observers.push(paintObserver);
        }
    }
    analyzeResourceTiming(entry) {
        const resourceType = this.getResourceType(entry.name);
        const loadTime = entry.responseEnd - entry.startTime;
        // Track resource performance
        if (!this.metrics.resources[resourceType]) {
            this.metrics.resources[resourceType] = {
                count: 0,
                totalSize: 0,
                totalTime: 0,
                slowest: 0
            };
        }
        const typeMetrics = this.metrics.resources[resourceType];
        typeMetrics.count++;
        typeMetrics.totalTime += loadTime;
        typeMetrics.totalSize += entry.transferSize || 0;
        typeMetrics.slowest = Math.max(typeMetrics.slowest, loadTime);
        // Check for slow resources
        const thresholds = {
            image: 1000,
            script: 500,
            style: 300,
            font: 800
        };
        if (loadTime > (thresholds[resourceType] || 1000)) {
            console.warn(`🐌 Slow ${resourceType} resource: ${entry.name} (${loadTime.toFixed(2)}ms)`);
            this.suggestOptimization(entry, resourceType, loadTime);
        }
    }
    getResourceType(url) {
        if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i))
            return 'image';
        if (url.match(/\.(js)$/i))
            return 'script';
        if (url.match(/\.(css)$/i))
            return 'style';
        if (url.match(/\.(woff|woff2|ttf|otf)$/i))
            return 'font';
        if (url.match(/\.(json|xml)$/i))
            return 'data';
        return 'other';
    }
    suggestOptimization(entry, type, loadTime) {
        const suggestions = {
            image: [
                'Consider using WebP format',
                'Implement lazy loading',
                'Optimize image compression',
                'Use responsive images with srcset'
            ],
            script: [
                'Minimize and compress JavaScript',
                'Use code splitting',
                'Defer non-critical scripts',
                'Consider bundling optimization'
            ],
            style: [
                'Minimize CSS',
                'Remove unused CSS',
                'Use critical CSS inline',
                'Consider CSS-in-JS for components'
            ],
            font: [
                'Use font-display: swap',
                'Preload critical fonts',
                'Use WOFF2 format',
                'Consider system font fallbacks'
            ]
        };
        const typeSuggestions = suggestions[type] || ['Optimize resource loading'];
        console.group(`💡 Optimization suggestions for ${type}:`);
        typeSuggestions.forEach(suggestion => console.log(`  • ${suggestion}`));
        console.groupEnd();
    }
    setupResourceOptimization() {
        // Implement lazy loading for images
        this.setupLazyImageLoading();
        // Optimize font loading
        this.optimizeFontLoading();
        // Setup resource prefetching
        this.setupResourcePrefetching();
        // Implement adaptive loading
        this.setupAdaptiveLoading();
    }
    setupLazyImageLoading() {
        if (!this.capabilities.intersectionObserver)
            return;
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        const startTime = performance.now();
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        img.onload = () => {
                            const loadTime = performance.now() - startTime;
                            img.classList.add('fnf-lazy-loaded');
                            console.log(`🖼️ Lazy loaded image in ${loadTime.toFixed(2)}ms`);
                        };
                        imageObserver.unobserve(img);
                    }
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        // Observe all images with data-src
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => imageObserver.observe(img));
        this.observers.push(imageObserver);
    }
    optimizeFontLoading() {
        // Add font-display: swap to font faces
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-family: 'Orbitron';
                font-display: swap;
            }
        `;
        document.head.appendChild(style);
        // Preload critical fonts
        const criticalFonts = [
            'https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap'
        ];
        criticalFonts.forEach(fontUrl => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'style';
            link.href = fontUrl;
            document.head.appendChild(link);
        });
    }
    setupResourcePrefetching() {
        // Prefetch likely next page resources
        const currentPage = window.location.pathname;
        const prefetchCandidates = this.getPrefetchCandidates(currentPage);
        // Use requestIdleCallback to prefetch during idle time
        if (this.capabilities.requestIdleCallback) {
            requestIdleCallback(() => {
                this.prefetchResources(prefetchCandidates);
            });
        }
        else {
            setTimeout(() => {
                this.prefetchResources(prefetchCandidates);
            }, 2000);
        }
    }
    getPrefetchCandidates(currentPage) {
        const candidates = [];
        // Define likely navigation patterns
        const navigationPatterns = {
            '/index.html': ['/services.html', '/about.html'],
            '/services.html': ['/contact.html', '/resources.html'],
            '/about.html': ['/contact.html'],
            '/resources.html': ['/services.html', '/impact.html'],
            '/impact.html': ['/contact.html'],
            '/contact.html': ['/services.html']
        };
        const nextPages = navigationPatterns[currentPage] || [];
        nextPages.forEach(page => {
            candidates.push({ url: page, priority: 'low' });
        });
        return candidates;
    }
    prefetchResources(candidates) {
        candidates.forEach(({ url, priority }) => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            if (priority === 'high') {
                link.rel = 'preload';
            }
            document.head.appendChild(link);
            console.log(`🔮 Prefetching: ${url}`);
        });
    }
    setupAdaptiveLoading() {
        // Adjust loading strategy based on connection
        if (navigator.connection) {
            const connection = navigator.connection;
            // Reduce quality for slow connections
            if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
                document.body.classList.add('fnf-slow-connection');
                this.enableDataSavingMode();
            }
            // Listen for connection changes
            connection.addEventListener('change', () => {
                this.handleConnectionChange(connection);
            });
        }
    }
    enableDataSavingMode() {
        console.log('📱 Data saving mode enabled');
        // Disable non-essential effects
        document.body.classList.add('fnf-data-saving');
        // Reduce image quality
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            if (img.src && !img.src.includes('low-quality')) {
                const lowQualitySrc = img.src.replace(/\.(jpg|jpeg|png)$/, '-lq.$1');
                img.src = lowQualitySrc;
            }
        });
        // Disable background effects
        if (window.fnfEffects) {
            window.fnfEffects.disableMotionEffects();
        }
    }
    handleConnectionChange(connection) {
        if (connection.effectiveType === '4g') {
            document.body.classList.remove('fnf-slow-connection', 'fnf-data-saving');
            console.log('🚀 Fast connection detected - enabling full experience');
        }
        else if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
            this.enableDataSavingMode();
        }
    }
    setupInteractionTracking() {
        // Track user interactions for performance insights
        const interactionTypes = ['click', 'scroll', 'keydown', 'input'];
        interactionTypes.forEach(type => {
            document.addEventListener(type, (e) => {
                this.trackInteraction(type, e);
            }, { passive: true, capture: true });
        });
        // Track navigation timing for SPA-like behavior
        this.trackNavigationPerformance();
    }
    trackInteraction(type, event) {
        const timestamp = performance.now();
        if (!this.metrics.interactions[type]) {
            this.metrics.interactions[type] = {
                count: 0,
                totalTime: 0,
                slowest: 0
            };
        }
        this.metrics.interactions[type].count++;
        // Measure response time for clicks
        if (type === 'click') {
            const target = event.target;
            const startTime = timestamp;
            // Use setTimeout to measure how long the interaction takes
            setTimeout(() => {
                const responseTime = performance.now() - startTime;
                this.metrics.interactions[type].totalTime += responseTime;
                this.metrics.interactions[type].slowest = Math.max(this.metrics.interactions[type].slowest, responseTime);
                if (responseTime > 100) {
                    console.warn(`🐌 Slow interaction: ${responseTime.toFixed(2)}ms`);
                }
            }, 0);
        }
    }
    trackNavigationPerformance() {
        // Track soft navigation performance
        let navigationStart = performance.now();
        document.addEventListener('fnf:nav:opened', () => {
            navigationStart = performance.now();
        });
        document.addEventListener('fnf:nav:closed', () => {
            const navigationTime = performance.now() - navigationStart;
            console.log(`🧭 Navigation interaction: ${navigationTime.toFixed(2)}ms`);
        });
    }
    setupMemoryManagement() {
        // Monitor memory usage
        this.monitorMemoryUsage();
        // Setup periodic cleanup
        this.setupPeriodicCleanup();
        // Handle page visibility changes
        this.setupVisibilityHandling();
    }
    monitorMemoryUsage() {
        if (!('memory' in performance))
            return;
        setInterval(() => {
            const memory = performance.memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
            const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
            const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
            console.log(`🧠 Memory: ${usedMB}MB / ${totalMB}MB (limit: ${limitMB}MB)`);
            // Warn if memory usage is high
            if (usedMB > limitMB * 0.8) {
                console.warn('⚠️ High memory usage detected');
                this.performMemoryCleanup();
            }
        }, 30000); // Check every 30 seconds
    }
    performMemoryCleanup() {
        console.log('🧹 Performing memory cleanup...');
        // Clear old performance entries
        if (performance.clearResourceTimings) {
            performance.clearResourceTimings();
        }
        // Clear resource cache
        this.resourceCache.clear();
        // Trim performance entries
        this.performanceEntries = this.performanceEntries.slice(-100);
        // Force garbage collection if available (Chrome DevTools)
        if (window.gc) {
            window.gc();
        }
    }
    setupPeriodicCleanup() {
        // Cleanup every 5 minutes
        setInterval(() => {
            this.performMemoryCleanup();
        }, 300000);
    }
    setupVisibilityHandling() {
        document.addEventListener('fnf:visibility:changed', (e) => {
            if (e.detail.hidden) {
                // Page is hidden - reduce activity
                this.pauseNonCriticalOperations();
            }
            else {
                // Page is visible - resume activity
                this.resumeNonCriticalOperations();
            }
        });
    }
    pauseNonCriticalOperations() {
        console.log('⏸️ Pausing non-critical operations');
        // Cancel pending prefetch operations
        const prefetchLinks = document.querySelectorAll('link[rel="prefetch"]');
        prefetchLinks.forEach(link => link.remove());
    }
    resumeNonCriticalOperations() {
        console.log('▶️ Resuming non-critical operations');
        // Restart prefetching if needed
        const currentPage = window.location.pathname;
        const prefetchCandidates = this.getPrefetchCandidates(currentPage);
        this.prefetchResources(prefetchCandidates);
    }
    schedulePerformanceAudits() {
        // Schedule regular performance audits
        setTimeout(() => {
            this.runPerformanceAudit();
        }, 10000); // First audit after 10 seconds
        // Then every 5 minutes
        setInterval(() => {
            this.runPerformanceAudit();
        }, 300000);
    }
    runPerformanceAudit() {
        console.group('📊 Performance Audit');
        // Check Core Web Vitals
        this.auditCoreWebVitals();
        // Check resource efficiency
        this.auditResourceEfficiency();
        // Check JavaScript performance
        this.auditJavaScriptPerformance();
        // Provide recommendations
        this.generateRecommendations();
        console.groupEnd();
    }
    auditCoreWebVitals() {
        const vitals = this.metrics.pageLoad;
        const scores = {};
        // Score each vital
        Object.entries(this.budgets).forEach(([metric, budget]) => {
            const value = vitals[metric];
            if (value !== undefined) {
                scores[metric] = value <= budget ? 'good' : value <= budget * 1.5 ? 'needs-improvement' : 'poor';
            }
        });
        console.log('Core Web Vitals:', scores);
        return scores;
    }
    auditResourceEfficiency() {
        const resources = this.metrics.resources;
        const efficiency = {};
        Object.entries(resources).forEach(([type, metrics]) => {
            const avgTime = metrics.totalTime / metrics.count;
            const avgSize = metrics.totalSize / metrics.count;
            efficiency[type] = {
                averageLoadTime: avgTime.toFixed(2) + 'ms',
                averageSize: this.formatBytes(avgSize),
                count: metrics.count,
                slowest: metrics.slowest.toFixed(2) + 'ms'
            };
        });
        console.log('Resource Efficiency:', efficiency);
        return efficiency;
    }
    auditJavaScriptPerformance() {
        const runtime = this.metrics.runtime;
        const performance = {
            longTasks: runtime.longTasks || 0,
            totalBlockingTime: runtime.totalBlockingTime || 0,
            memoryUsage: this.getMemoryUsage()
        };
        console.log('JavaScript Performance:', performance);
        return performance;
    }
    getMemoryUsage() {
        if ('memory' in performance) {
            return {
                used: this.formatBytes(performance.memory.usedJSHeapSize),
                total: this.formatBytes(performance.memory.totalJSHeapSize),
                limit: this.formatBytes(performance.memory.jsHeapSizeLimit)
            };
        }
        return 'Not available';
    }
    generateRecommendations() {
        const recommendations = [];
        // Check FCP
        if (this.metrics.pageLoad.firstContentfulPaint > this.budgets.firstContentfulPaint) {
            recommendations.push('Consider optimizing critical rendering path');
        }
        // Check LCP
        if (this.metrics.pageLoad.largestContentfulPaint > this.budgets.largestContentfulPaint) {
            recommendations.push('Optimize largest contentful paint (hero images, fonts)');
        }
        // Check TBT
        if (this.metrics.runtime.totalBlockingTime > this.budgets.totalBlockingTime) {
            recommendations.push('Reduce JavaScript execution time and long tasks');
        }
        // Check resource efficiency
        Object.entries(this.metrics.resources).forEach(([type, metrics]) => {
            const avgTime = metrics.totalTime / metrics.count;
            if (avgTime > 500) {
                recommendations.push(`Optimize ${type} loading (avg: ${avgTime.toFixed(2)}ms)`);
            }
        });
        if (recommendations.length > 0) {
            console.log('💡 Recommendations:');
            recommendations.forEach(rec => console.log(`  • ${rec}`));
        }
        else {
            console.log('✅ Performance looks good!');
        }
        return recommendations;
    }
    checkBudget(metric, value) {
        const budget = this.budgets[metric];
        if (budget && value > budget) {
            console.warn(`⚠️ ${metric} exceeded budget: ${value.toFixed(2)} > ${budget}`);
        }
    }
    logPageLoadMetrics() {
        console.group('📈 Page Load Metrics');
        Object.entries(this.metrics.pageLoad).forEach(([key, value]) => {
            if (typeof value === 'number') {
                console.log(`${key}: ${value.toFixed(2)}ms`);
            }
        });
        console.groupEnd();
    }
    sendPageLoadAnalytics() {
        // Send to analytics if available
        if (typeof gtag !== 'undefined') {
            const metrics = this.metrics.pageLoad;
            Object.entries(metrics).forEach(([metric, value]) => {
                if (typeof value === 'number' && value > 0) {
                    gtag('event', 'page_load_time', {
                        'event_category': 'performance',
                        'event_label': metric,
                        'value': Math.round(value),
                        'custom_map': {
                            'dimension1': window.location.pathname
                        }
                    });
                }
            });
        }
    }
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    // Public API methods
    getMetrics() {
        return {
            pageLoad: { ...this.metrics.pageLoad },
            runtime: { ...this.metrics.runtime },
            resources: { ...this.metrics.resources },
            interactions: { ...this.metrics.interactions }
        };
    }
    getPerformanceScore() {
        const vitals = this.auditCoreWebVitals();
        const scores = Object.values(vitals);
        const goodCount = scores.filter(score => score === 'good').length;
        return Math.round((goodCount / scores.length) * 100);
    }
    forceAudit() {
        return this.runPerformanceAudit();
    }
    // Cleanup method
    destroy() {
        // Disconnect all observers
        this.observers.forEach(observer => observer.disconnect());
        // Clear caches
        this.resourceCache.clear();
        this.performanceEntries = [];
        this.isInitialized = false;
        console.log('🧹 Food-N-Force Performance Monitor cleaned up');
    }
}
// Initialize performance monitor
const initPerformance = () => {
    if (!window.fnfPerformance) {
        window.fnfPerformance = new FoodNForcePerformance();
    }
};
// Initialize when core is ready or immediately if core already exists
if (window.fnfCore?.isReady()) {
    initPerformance();
}
else {
    document.addEventListener('fnf:core:ready', initPerformance);
}
// Fallback initialization
setTimeout(() => {
    if (!window.fnfPerformance) {
        initPerformance();
    }
}, 1000);
// Export for module usage
window.FoodNForcePerformance = FoodNForcePerformance;
//# sourceMappingURL=fnf-performance.js.map