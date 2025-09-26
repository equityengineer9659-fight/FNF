/**
 * Food-N-Force Simple Performance Monitor - Phase 1 Simplified
 * Minimal performance tracking for navigation only
 * Reduced complexity for performance budget compliance
 */
class SimplePerformanceMonitor {
    constructor() {
        this.navigationMetrics = {
            openTime: 0,
            closeTime: 0,
            interactions: 0
        };
        this.init();
    }
    init() {
        // Track navigation performance only
        this.trackNavigationPerformance();
    }
    trackNavigationPerformance() {
        document.addEventListener('fnf:nav:start', (e) => {
            this.navigationMetrics[e.detail.action + 'Time'] = performance.now();
        });
        document.addEventListener('fnf:nav:end', (e) => {
            const startTime = this.navigationMetrics[e.detail.action + 'Time'];
            const duration = performance.now() - startTime;
            if (duration > 100) {
                console.warn(`Slow navigation ${e.detail.action}: ${duration.toFixed(2)}ms`);
            }
            this.navigationMetrics.interactions++;
        });
    }
    getMetrics() {
        return this.navigationMetrics;
    }
}
// Initialize simple performance monitoring
if (!window.fnfSimplePerformance) {
    window.fnfSimplePerformance = new SimplePerformanceMonitor();
}
//# sourceMappingURL=fnf-performance-simple.js.map