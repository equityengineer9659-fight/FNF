/**
 * Food-N-Force Navigation Performance - Phase 1 Simplified
 * Basic performance monitoring for CSS class toggles only
 * Removed competing inline style systems and complex monitoring
 */
class NavigationPerformanceOptimizer {
    constructor() {
        // Minimal metrics for CSS class toggle performance
        this.metrics = {
            toggleCount: 0,
            slowToggles: 0,
            averageToggleTime: 0
        };
        this.init();
    }
    init() {
        // Simple toggle performance monitoring
        this.setupBasicMonitoring();
    }
    setupBasicMonitoring() {
        // Track CSS class toggle performance only
        let totalToggleTime = 0;
        document.addEventListener('click', (e) => {
            if (e.target.closest('.mobile-nav-toggle')) {
                const startTime = performance.now();
                // Measure CSS class toggle performance
                setTimeout(() => {
                    const duration = performance.now() - startTime;
                    this.metrics.toggleCount++;
                    totalToggleTime += duration;
                    this.metrics.averageToggleTime = totalToggleTime / this.metrics.toggleCount;
                    if (duration > 50) {
                        this.metrics.slowToggles++;
                        console.warn(`Slow navigation toggle: ${duration.toFixed(2)}ms`);
                    }
                }, 0);
            }
        });
    }
    getMetrics() {
        return this.metrics;
    }
    getPerformanceReport() {
        return {
            totalToggles: this.metrics.toggleCount,
            slowToggles: this.metrics.slowToggles,
            averageTime: this.metrics.averageToggleTime.toFixed(2) + 'ms',
            performance: this.metrics.slowToggles === 0 ? 'Good' : 'Needs Improvement'
        };
    }
}
// Initialize simplified performance monitoring
if (!window.navigationPerformanceOptimizer) {
    window.navigationPerformanceOptimizer = new NavigationPerformanceOptimizer();
}
//# sourceMappingURL=navigation-performance.js.map