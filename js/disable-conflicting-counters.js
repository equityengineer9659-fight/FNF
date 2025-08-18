/**
 * Disable Conflicting Counter Animations
 * This file should be loaded AFTER all other scripts to disable conflicting counter implementations
 * keeping only stats-counter-fix.js active
 */

document.addEventListener('DOMContentLoaded', function() {
    // Disable counter animations from other files
    
    // 1. Prevent slds-enhancements.js counter from running
    if (window.initStatsCounter) {
        window.initStatsCounter = function() {
            console.log('slds-enhancements counter disabled in favor of stats-counter-fix.js');
        };
    }
    
    // 2. Prevent animations.js EnhancedStatsCounter from initializing
    if (window.EnhancedStatsCounter) {
        window.EnhancedStatsCounter = function() {
            console.log('animations.js counter disabled in favor of stats-counter-fix.js');
        };
    }
    
    // 3. Override unified-navigation animateStats methods
    if (window.foodNForceNav) {
        window.foodNForceNav.animateStats = function() {
            console.log('unified-navigation counter disabled in favor of stats-counter-fix.js');
        };
        window.foodNForceNav.animateNumber = function() {
            console.log('unified-navigation counter disabled in favor of stats-counter-fix.js');
        };
        window.foodNForceNav.animateToNumber = function() {
            console.log('unified-navigation counter disabled in favor of stats-counter-fix.js');
        };
    }
    
    // 4. Remove any existing observers for stat elements from other scripts
    const statElements = document.querySelectorAll('.stat-number, .stat-item');
    statElements.forEach(element => {
        // Remove classes that might have been added by other scripts
        element.classList.remove('counted', 'animated', 'counting');
    });
    
    console.log('Counter animation conflicts resolved - using stats-counter-fix.js exclusively');
});