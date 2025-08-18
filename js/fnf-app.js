/**
 * Food-N-Force Application Loader
 * Master integration file that orchestrates all modules
 * Load order: Core → Effects → Performance
 */

class FoodNForceApp {
    constructor() {
        this.modules = {
            core: null,
            effects: null,
            performance: null
        };
        this.loadingSteps = [
            'Initializing core foundation...',
            'Loading visual effects system...',
            'Setting up performance monitoring...',
            'Finalizing application...'
        ];
        this.currentStep = 0;
        
        console.log('🚀 Starting Food-N-Force Application...');
        this.init();
    }

    async init() {
        try {
            // Show loading indicator
            this.showLoadingIndicator();
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }
            
            // Load modules in sequence
            await this.loadCoreModule();
            await this.loadEffectsModule();
            await this.loadPerformanceModule();
            
            // Finalize application
            this.finalizeApp();
            
            console.log('✅ Food-N-Force Application fully loaded and ready!');
            
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            this.handleInitializationError(error);
        }
    }

    showLoadingIndicator() {
        // Create minimal loading indicator
        const indicator = document.createElement('div');
        indicator.id = 'fnf-loading-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 3px;
            background: linear-gradient(90deg, #0176d3, #1ab3e8);
            z-index: 99999;
            transform: scaleX(0);
            transform-origin: left;
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(indicator);
        
        // Animate progress
        this.updateProgress(0);
    }

    updateProgress(step) {
        this.currentStep = step;
        const progress = (step / this.loadingSteps.length) * 100;
        
        const indicator = document.getElementById('fnf-loading-indicator');
        if (indicator) {
            indicator.style.transform = `scaleX(${progress / 100})`;
        }
        
        console.log(`📋 ${this.loadingSteps[step] || 'Completing...'}`);
    }

    async loadCoreModule() {
        this.updateProgress(0);
        
        // Core module should already be loaded by now, but ensure it's ready
        return new Promise((resolve) => {
            if (window.fnfCore?.isReady()) {
                this.modules.core = window.fnfCore;
                resolve();
            } else {
                document.addEventListener('fnf:core:ready', (e) => {
                    this.modules.core = e.detail.core;
                    resolve();
                });
                
                // Timeout fallback
                setTimeout(() => {
                    if (window.fnfCore) {
                        this.modules.core = window.fnfCore;
                        resolve();
                    } else {
                        throw new Error('Core module failed to load');
                    }
                }, 5000);
            }
        });
    }

    async loadEffectsModule() {
        this.updateProgress(1);
        
        // Effects module should auto-initialize after core
        return new Promise((resolve) => {
            const checkEffects = () => {
                if (window.fnfEffects?.isInitialized) {
                    this.modules.effects = window.fnfEffects;
                    resolve();
                } else {
                    setTimeout(checkEffects, 100);
                }
            };
            
            checkEffects();
            
            // Timeout fallback
            setTimeout(() => {
                if (window.fnfEffects) {
                    this.modules.effects = window.fnfEffects;
                    resolve();
                } else {
                    console.warn('⚠️ Effects module failed to load properly');
                    resolve(); // Continue without effects
                }
            }, 3000);
        });
    }

    async loadPerformanceModule() {
        this.updateProgress(2);
        
        // Performance module should auto-initialize after core
        return new Promise((resolve) => {
            const checkPerformance = () => {
                if (window.fnfPerformance?.isInitialized) {
                    this.modules.performance = window.fnfPerformance;
                    resolve();
                } else {
                    setTimeout(checkPerformance, 100);
                }
            };
            
            checkPerformance();
            
            // Timeout fallback
            setTimeout(() => {
                if (window.fnfPerformance) {
                    this.modules.performance = window.fnfPerformance;
                    resolve();
                } else {
                    console.warn('⚠️ Performance module failed to load properly');
                    resolve(); // Continue without performance monitoring
                }
            }, 2000);
        });
    }

    finalizeApp() {
        this.updateProgress(3);
        
        // Setup global error handling
        this.setupErrorHandling();
        
        // Setup module communication
        this.setupModuleCommunication();
        
        // Setup global APIs
        this.setupGlobalAPIs();
        
        // Remove loading indicator
        setTimeout(() => {
            const indicator = document.getElementById('fnf-loading-indicator');
            if (indicator) {
                indicator.style.opacity = '0';
                setTimeout(() => indicator.remove(), 300);
            }
        }, 500);
        
        // Mark app as ready
        document.body.classList.add('fnf-app-ready');
        
        // Dispatch ready event
        document.dispatchEvent(new CustomEvent('fnf:app:ready', {
            detail: {
                modules: this.modules,
                app: this
            }
        }));
        
        // Run initial health check
        setTimeout(() => {
            this.runHealthCheck();
        }, 1000);
    }

    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (e) => {
            console.error('🚨 JavaScript Error:', e.error);
            this.handleGlobalError(e.error);
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (e) => {
            console.error('🚨 Unhandled Promise Rejection:', e.reason);
            this.handleGlobalError(e.reason);
        });
    }

    handleGlobalError(error) {
        // Log error details
        console.group('🚨 Error Details');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        console.error('Modules Status:', this.getModulesStatus());
        console.groupEnd();
        
        // Attempt graceful degradation
        this.attemptGracefulDegradation(error);
    }

    attemptGracefulDegradation(error) {
        // Disable non-essential features on errors
        if (error.message?.includes('effects') || error.message?.includes('animation')) {
            console.log('🔧 Disabling effects due to error');
            document.body.classList.add('fnf-effects-disabled');
            
            if (this.modules.effects?.destroy) {
                this.modules.effects.destroy();
            }
        }
        
        // Ensure core functionality remains
        if (this.modules.core?.isReady()) {
            console.log('✅ Core functionality preserved');
        } else {
            console.error('❌ Critical: Core functionality compromised');
        }
    }

    setupModuleCommunication() {
        // Create event bus for module communication
        this.eventBus = {
            emit: (event, data) => {
                document.dispatchEvent(new CustomEvent(`fnf:${event}`, { detail: data }));
            },
            on: (event, callback) => {
                document.addEventListener(`fnf:${event}`, callback);
            },
            off: (event, callback) => {
                document.removeEventListener(`fnf:${event}`, callback);
            }
        };
        
        // Make event bus available globally
        window.fnfEventBus = this.eventBus;
        
        // Setup inter-module communication
        this.setupPerformanceIntegration();
        this.setupEffectsIntegration();
    }

    setupPerformanceIntegration() {
        // Connect performance monitoring to effects
        if (this.modules.performance && this.modules.effects) {
            this.eventBus.on('performance:low-fps', () => {
                this.modules.effects.reduceEffectsQuality();
            });
            
            this.eventBus.on('performance:high-memory', () => {
                this.modules.effects.disableMotionEffects();
            });
        }
    }

    setupEffectsIntegration() {
        // Connect effects to core events
        if (this.modules.core && this.modules.effects) {
            this.eventBus.on('core:navigation-opened', () => {
                // Could trigger specific effects
            });
            
            this.eventBus.on('core:form-submitted', (data) => {
                // Could trigger success animations
            });
        }
    }

    setupGlobalAPIs() {
        // Create unified API object
        window.FNF = {
            // Module access
            core: this.modules.core,
            effects: this.modules.effects,
            performance: this.modules.performance,
            
            // Utility functions
            isReady: () => this.isReady(),
            getStatus: () => this.getStatus(),
            runHealthCheck: () => this.runHealthCheck(),
            
            // Event bus
            on: this.eventBus.on,
            off: this.eventBus.off,
            emit: this.eventBus.emit,
            
            // Configuration
            config: {
                version: '2.0.0',
                build: 'consolidated',
                modules: Object.keys(this.modules)
            }
        };
        
        console.log('🌐 Global FNF API available');
    }

    runHealthCheck() {
        console.group('🏥 Food-N-Force Health Check');
        
        const health = {
            overall: 'healthy',
            modules: {},
            performance: {},
            errors: []
        };
        
        // Check each module
        Object.entries(this.modules).forEach(([name, module]) => {
            if (module) {
                health.modules[name] = module.isReady ? module.isReady() : true;
            } else {
                health.modules[name] = false;
                health.errors.push(`${name} module not loaded`);
            }
        });
        
        // Check performance metrics
        if (this.modules.performance) {
            const metrics = this.modules.performance.getMetrics();
            health.performance = {
                score: this.modules.performance.getPerformanceScore(),
                issues: []
            };
            
            // Check for performance issues
            if (metrics.pageLoad.firstContentfulPaint > 2000) {
                health.performance.issues.push('Slow First Contentful Paint');
            }
            
            if (metrics.runtime.longTasks > 5) {
                health.performance.issues.push('Too many long tasks');
            }
        }
        
        // Determine overall health
        const moduleFailures = Object.values(health.modules).filter(status => !status).length;
        if (moduleFailures > 1 || health.errors.length > 0) {
            health.overall = 'critical';
        } else if (moduleFailures > 0 || health.performance.issues?.length > 0) {
            health.overall = 'warning';
        }
        
        // Log results
        console.log('Overall Status:', health.overall);
        console.log('Modules:', health.modules);
        console.log('Performance:', health.performance);
        
        if (health.errors.length > 0) {
            console.warn('Errors:', health.errors);
        }
        
        console.groupEnd();
        
        return health;
    }

    getModulesStatus() {
        return Object.entries(this.modules).reduce((status, [name, module]) => {
            status[name] = {
                loaded: !!module,
                ready: module?.isReady ? module.isReady() : !!module
            };
            return status;
        }, {});
    }

    getStatus() {
        return {
            ready: this.isReady(),
            modules: this.getModulesStatus(),
            health: this.runHealthCheck()
        };
    }

    isReady() {
        return Object.values(this.modules).every(module => module !== null);
    }

    handleInitializationError(error) {
        console.error('🚨 Application failed to initialize:', error);
        
        // Show error message to user
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            background: #d32f2f;
            color: white;
            padding: 1rem;
            text-align: center;
            z-index: 99999;
            font-family: Arial, sans-serif;
        `;
        errorDiv.innerHTML = `
            <strong>Application Error:</strong> 
            Some features may not work properly. Please refresh the page.
            <button onclick="this.parentElement.remove()" style="margin-left: 1rem; background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.25rem 0.5rem; cursor: pointer;">✕</button>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 10000);
    }

    // Cleanup method
    destroy() {
        // Destroy all modules
        Object.values(this.modules).forEach(module => {
            if (module?.destroy) {
                module.destroy();
            }
        });
        
        // Remove global APIs
        delete window.FNF;
        delete window.fnfEventBus;
        
        // Remove loading indicator
        const indicator = document.getElementById('fnf-loading-indicator');
        if (indicator) {
            indicator.remove();
        }
        
        console.log('🧹 Food-N-Force Application cleaned up');
    }
}

// Initialize application immediately
window.fnfApp = new FoodNForceApp();

// Export for module usage
window.FoodNForceApp = FoodNForceApp;