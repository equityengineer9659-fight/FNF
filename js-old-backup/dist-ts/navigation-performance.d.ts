/**
 * Food-N-Force Navigation Performance - Phase 1 Simplified
 * Basic performance monitoring for CSS class toggles only
 * Removed competing inline style systems and complex monitoring
 */
declare class NavigationPerformanceOptimizer {
    metrics: {
        toggleCount: number;
        slowToggles: number;
        averageToggleTime: number;
    };
    init(): void;
    setupBasicMonitoring(): void;
    getMetrics(): {
        toggleCount: number;
        slowToggles: number;
        averageToggleTime: number;
    };
    getPerformanceReport(): {
        totalToggles: number;
        slowToggles: number;
        averageTime: string;
        performance: string;
    };
}
//# sourceMappingURL=navigation-performance.d.ts.map