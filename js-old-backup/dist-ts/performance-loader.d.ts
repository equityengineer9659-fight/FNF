/**
 * Food-N-Force Performance-Optimized JavaScript Loader
 * Three-Tier Loading Strategy for <90KB Budget Compliance
 *
 * Tier 1: Critical (≤25KB) - Immediate Load
 * Tier 2: Enhanced (≤30KB) - Post-Interaction Load
 * Tier 3: Premium (≤50KB) - Progressive Enhancement
 */
declare class PerformanceLoader {
    loadedTiers: Set<any>;
    loadQueue: any[];
    performanceMetrics: {
        startTime: number;
        tier1LoadTime: any;
        tier2LoadTime: any;
        tier3LoadTime: any;
    };
    init(): void;
    /**
     * Tier 1: Critical JavaScript (≤25KB)
     * Loads immediately for core navigation functionality
     */
    loadTier1(): void;
    /**
     * Tier 2: Enhanced JavaScript (≤30KB)
     * Loads after first user interaction or 3-second fallback
     */
    setupTier2Loading(): void;
    /**
     * Tier 3: Premium JavaScript (≤50KB)
     * Loads based on network and device capabilities
     */
    setupTier3Loading(): void;
    /**
     * Selectively load Tier 3 scripts based on performance budget
     */
    selectTier3Scripts(scripts: any): any;
    /**
     * Determine if Tier 3 should load based on device/network capabilities
     */
    shouldLoadTier3(): boolean;
    /**
     * Load scripts sequentially to avoid loading conflicts
     */
    loadScriptsSequentially(scripts: any): Promise<void>;
    /**
     * Load a single script with promise-based completion
     */
    loadScript(src: any): Promise<any>;
    /**
     * Validate performance budget compliance
     */
    validatePerformanceBudget(tier: any, sizeBytes: any): boolean;
    /**
     * Get current loading status and performance metrics
     */
    getStatus(): {
        loadedTiers: any[];
        performanceMetrics: {
            startTime: number;
            tier1LoadTime: any;
            tier2LoadTime: any;
            tier3LoadTime: any;
        };
        budgetCompliance: {
            currentSize: number;
            budgetLimit: number;
            withinBudget: boolean;
            utilization: string;
        };
    };
    /**
     * Calculate current JavaScript load size
     */
    getCurrentLoadSize(): number;
}
//# sourceMappingURL=performance-loader.d.ts.map