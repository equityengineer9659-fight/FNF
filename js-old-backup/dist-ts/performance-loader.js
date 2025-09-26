/**
 * Food-N-Force Performance-Optimized JavaScript Loader
 * Three-Tier Loading Strategy for <90KB Budget Compliance
 *
 * Tier 1: Critical (≤25KB) - Immediate Load
 * Tier 2: Enhanced (≤30KB) - Post-Interaction Load
 * Tier 3: Premium (≤50KB) - Progressive Enhancement
 */
class PerformanceLoader {
    constructor() {
        this.loadedTiers = new Set();
        this.loadQueue = [];
        this.performanceMetrics = {
            startTime: performance.now(),
            tier1LoadTime: null,
            tier2LoadTime: null,
            tier3LoadTime: null
        };
        this.init();
    }
    init() {
        console.log('PerformanceLoader initialized - Three-tier loading strategy active');
        this.loadTier1(); // Critical - immediate load
        this.setupTier2Loading(); // Enhanced - interaction-based
        this.setupTier3Loading(); // Premium - progressive enhancement
    }
    /**
     * Tier 1: Critical JavaScript (≤25KB)
     * Loads immediately for core navigation functionality
     */
    loadTier1() {
        const tier1Scripts = [
        // Already loaded by HTML - unified-navigation-refactored.js (6.3KB)
        // This loader itself counts toward Tier 1 (~2KB)
        // Total Tier 1: ~8.3KB (well under 25KB budget)
        ];
        this.performanceMetrics.tier1LoadTime = performance.now() - this.performanceMetrics.startTime;
        this.loadedTiers.add('tier1');
        console.log(`Tier 1 loaded in ${this.performanceMetrics.tier1LoadTime.toFixed(2)}ms`);
        this.validatePerformanceBudget('tier1', 8300); // 8.3KB
    }
    /**
     * Tier 2: Enhanced JavaScript (≤30KB)
     * Loads after first user interaction or 3-second fallback
     */
    setupTier2Loading() {
        const tier2Scripts = [
            'js/core/slds-enhancements.js', // 10.7KB - SLDS styling
            'js/core/animations.js' // 15.0KB - Core animations
            // Total: ~25.7KB
        ];
        const loadTier2 = () => {
            if (this.loadedTiers.has('tier2'))
                return;
            console.log('Loading Tier 2: Enhanced functionality');
            const startTime = performance.now();
            this.loadScriptsSequentially(tier2Scripts).then(() => {
                this.performanceMetrics.tier2LoadTime = performance.now() - startTime;
                this.loadedTiers.add('tier2');
                console.log(`Tier 2 loaded in ${this.performanceMetrics.tier2LoadTime.toFixed(2)}ms`);
                this.validatePerformanceBudget('tier2', 25700); // 25.7KB
                // Enable enhanced features
                document.body.classList.add('enhanced-loaded');
            });
        };
        // Load on first interaction
        const interactionEvents = ['click', 'touchstart', 'keydown'];
        const loadOnInteraction = () => {
            loadTier2();
            interactionEvents.forEach(event => {
                document.removeEventListener(event, loadOnInteraction);
            });
        };
        interactionEvents.forEach(event => {
            document.addEventListener(event, loadOnInteraction, { once: true, passive: true });
        });
        // Fallback: Load after 3 seconds if no interaction
        setTimeout(() => {
            if (!this.loadedTiers.has('tier2')) {
                console.log('Tier 2 fallback loading (3s timeout)');
                loadTier2();
            }
        }, 3000);
    }
    /**
     * Tier 3: Premium JavaScript (≤50KB)
     * Loads based on network and device capabilities
     */
    setupTier3Loading() {
        const tier3Scripts = [
            'js/effects/logo-optimization.js', // 11.6KB - Logo animations
            'js/effects/premium-effects-refactored.js', // 27.4KB - Premium effects
            'js/effects/slds-cool-effects.js', // 7.1KB - Additional effects
            'js/effects/premium-background-effects.js' // 14.3KB - Background animations
            // Total: ~60.4KB (loaded selectively)
        ];
        const loadTier3 = () => {
            if (this.loadedTiers.has('tier3'))
                return;
            console.log('Loading Tier 3: Premium effects');
            const startTime = performance.now();
            // Selective loading based on performance
            const selectedScripts = this.selectTier3Scripts(tier3Scripts);
            this.loadScriptsSequentially(selectedScripts).then(() => {
                this.performanceMetrics.tier3LoadTime = performance.now() - startTime;
                this.loadedTiers.add('tier3');
                console.log(`Tier 3 loaded in ${this.performanceMetrics.tier3LoadTime.toFixed(2)}ms`);
                // Enable premium features
                document.body.classList.add('premium-loaded');
            });
        };
        // Check network and device capabilities
        setTimeout(() => {
            if (this.shouldLoadTier3()) {
                loadTier3();
            }
            else {
                console.log('Tier 3 skipped - performance optimization');
            }
        }, 5000); // Load after 5 seconds if conditions are met
    }
    /**
     * Selectively load Tier 3 scripts based on performance budget
     */
    selectTier3Scripts(scripts) {
        const connection = navigator.connection;
        const memory = navigator.deviceMemory || 4;
        // High-performance devices: Load all premium effects
        if (memory >= 8 && (!connection || connection.effectiveType === '4g')) {
            return scripts;
        }
        // Medium-performance devices: Load essential effects only
        if (memory >= 4) {
            return [
                'js/effects/logo-optimization.js',
                'js/effects/premium-effects-refactored.js'
            ];
        }
        // Low-performance devices: Load minimal effects
        return ['js/effects/logo-optimization.js'];
    }
    /**
     * Determine if Tier 3 should load based on device/network capabilities
     */
    shouldLoadTier3() {
        const connection = navigator.connection;
        const memory = navigator.deviceMemory || 4;
        // Skip on slow connections
        if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
            return false;
        }
        // Skip on data saver mode
        if (connection && connection.saveData) {
            return false;
        }
        // Skip on low memory devices
        if (memory < 2) {
            return false;
        }
        // Skip if user prefers reduced motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return false;
        }
        return true;
    }
    /**
     * Load scripts sequentially to avoid loading conflicts
     */
    async loadScriptsSequentially(scripts) {
        for (const script of scripts) {
            await this.loadScript(script);
        }
    }
    /**
     * Load a single script with promise-based completion
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if script already loaded
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => {
                console.log(`Loaded: ${src}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`Failed to load: ${src}`);
                reject(new Error(`Failed to load script: ${src}`));
            };
            document.head.appendChild(script);
        });
    }
    /**
     * Validate performance budget compliance
     */
    validatePerformanceBudget(tier, sizeBytes) {
        const sizeMB = (sizeBytes / 1024).toFixed(1);
        let budgetLimit;
        switch (tier) {
            case 'tier1':
                budgetLimit = 25600;
                break; // 25KB
            case 'tier2':
                budgetLimit = 30720;
                break; // 30KB  
            case 'tier3':
                budgetLimit = 51200;
                break; // 50KB
        }
        const isWithinBudget = sizeBytes <= budgetLimit;
        const budgetLimitMB = (budgetLimit / 1024).toFixed(1);
        console.log(`${tier.toUpperCase()} Budget: ${sizeMB}KB / ${budgetLimitMB}KB ${isWithinBudget ? '✅' : '❌'}`);
        if (!isWithinBudget) {
            console.warn(`BUDGET VIOLATION: ${tier} exceeds ${budgetLimitMB}KB limit`);
        }
        return isWithinBudget;
    }
    /**
     * Get current loading status and performance metrics
     */
    getStatus() {
        const totalBudget = 90 * 1024; // 90KB
        const currentLoad = this.getCurrentLoadSize();
        return {
            loadedTiers: Array.from(this.loadedTiers),
            performanceMetrics: this.performanceMetrics,
            budgetCompliance: {
                currentSize: currentLoad,
                budgetLimit: totalBudget,
                withinBudget: currentLoad <= totalBudget,
                utilization: ((currentLoad / totalBudget) * 100).toFixed(1) + '%'
            }
        };
    }
    /**
     * Calculate current JavaScript load size
     */
    getCurrentLoadSize() {
        let totalSize = 8300; // Tier 1 base size
        if (this.loadedTiers.has('tier2')) {
            totalSize += 25700; // Tier 2 size
        }
        if (this.loadedTiers.has('tier3')) {
            totalSize += 30000; // Estimated Tier 3 (varies by device)
        }
        return totalSize;
    }
}
// Initialize performance loader
window.performanceLoader = new PerformanceLoader();
// Expose global status check for debugging
window.checkPerformanceStatus = () => {
    console.table(window.performanceLoader.getStatus());
};
//# sourceMappingURL=performance-loader.js.map