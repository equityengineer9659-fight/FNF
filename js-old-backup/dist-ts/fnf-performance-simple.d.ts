/**
 * Food-N-Force Simple Performance Monitor - Phase 1 Simplified
 * Minimal performance tracking for navigation only
 * Reduced complexity for performance budget compliance
 */
declare class SimplePerformanceMonitor {
    navigationMetrics: {
        openTime: number;
        closeTime: number;
        interactions: number;
    };
    init(): void;
    trackNavigationPerformance(): void;
    getMetrics(): {
        openTime: number;
        closeTime: number;
        interactions: number;
    };
}
//# sourceMappingURL=fnf-performance-simple.d.ts.map