/**
 * Food-N-Force Performance Module
 * Optimization, monitoring, and resource management
 * Provides centralized performance monitoring and optimization
 */
declare class FoodNForcePerformance {
    isInitialized: boolean;
    metrics: {
        pageLoad: {};
        runtime: {};
        resources: {};
        interactions: {};
    };
    observers: any[];
    resourceCache: Map<any, any>;
    performanceEntries: any[];
    budgets: {
        firstContentfulPaint: number;
        largestContentfulPaint: number;
        firstInputDelay: number;
        cumulativeLayoutShift: number;
        totalBlockingTime: number;
    };
    init(): void;
    capabilities: any;
    setupPerformanceObservers(): void;
    measurePageLoad(): void;
    analyzeResourceTiming(entry: any): void;
    getResourceType(url: any): "script" | "image" | "style" | "font" | "data" | "other";
    suggestOptimization(entry: any, type: any, loadTime: any): void;
    setupResourceOptimization(): void;
    setupLazyImageLoading(): void;
    optimizeFontLoading(): void;
    setupResourcePrefetching(): void;
    getPrefetchCandidates(currentPage: any): any[];
    prefetchResources(candidates: any): void;
    setupAdaptiveLoading(): void;
    enableDataSavingMode(): void;
    handleConnectionChange(connection: any): void;
    setupInteractionTracking(): void;
    trackInteraction(type: any, event: any): void;
    trackNavigationPerformance(): void;
    setupMemoryManagement(): void;
    monitorMemoryUsage(): void;
    performMemoryCleanup(): void;
    setupPeriodicCleanup(): void;
    setupVisibilityHandling(): void;
    pauseNonCriticalOperations(): void;
    resumeNonCriticalOperations(): void;
    schedulePerformanceAudits(): void;
    runPerformanceAudit(): void;
    auditCoreWebVitals(): {};
    auditResourceEfficiency(): {};
    auditJavaScriptPerformance(): {
        longTasks: any;
        totalBlockingTime: any;
        memoryUsage: string | {
            used: string;
            total: string;
            limit: string;
        };
    };
    getMemoryUsage(): "Not available" | {
        used: string;
        total: string;
        limit: string;
    };
    generateRecommendations(): string[];
    checkBudget(metric: any, value: any): void;
    logPageLoadMetrics(): void;
    sendPageLoadAnalytics(): void;
    formatBytes(bytes: any): string;
    getMetrics(): {
        pageLoad: {};
        runtime: {};
        resources: {};
        interactions: {};
    };
    getPerformanceScore(): number;
    forceAudit(): void;
    destroy(): void;
}
declare function initPerformance(): void;
//# sourceMappingURL=fnf-performance.d.ts.map