/**
 * Food-N-Force Simple App Loader - Phase 1 Simplified
 * Removed complex module orchestration - rely on CSS for navigation
 */

class FoodNForceApp {
    constructor() {
        console.log('🚀 Food-N-Force Navigation Ready');
        this.init();
    }

    init() {
        // Simple initialization - navigation handled by CSS classes
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('✅ Food-N-Force Application ready');
            });
        } else {
            console.log('✅ Food-N-Force Application ready');
        }
    }




}

// Initialize application immediately
window.fnfApp = new FoodNForceApp();

// Export for module usage
window.FoodNForceApp = FoodNForceApp;