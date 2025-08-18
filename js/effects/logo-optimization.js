/**
 * Food-N-Force Logo Optimization System
 * Advanced logo loading, fallback, and performance optimization
 * SLDS-compliant with full accessibility support
 */

class LogoOptimizer {
    constructor() {
        this.logoCache = new Map();
        this.loadingQueue = [];
        this.performanceMetrics = {};
        this.observers = [];
        
        this.capabilities = this.detectCapabilities();
        this.setupIntersectionObserver();
        this.setupResponsiveLoading();
        this.initializeCriticalPath();
    }
    
    detectCapabilities() {
        return {
            webp: this.supportsFormat('webp'),
            avif: this.supportsFormat('avif'),
            connectionSpeed: this.getConnectionSpeed(),
            devicePixelRatio: window.devicePixelRatio || 1,
            prefersReducedData: this.prefersReducedData()
        };
    }
    
    supportsFormat(format) {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        
        try {
            return canvas.toDataURL(`image/${format}`).indexOf(`data:image/${format}`) === 0;
        } catch (e) {
            return false;
        }
    }
    
    getConnectionSpeed() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            if (connection.effectiveType) {
                return connection.effectiveType.includes('4g') ? 'fast' : 
                       connection.effectiveType.includes('3g') ? 'medium' : 'slow';
            }
        }
        return 'medium'; // Default assumption
    }
    
    prefersReducedData() {
        return 'connection' in navigator && navigator.connection.saveData === true;
    }
    
    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadLogo(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, { rootMargin: '50px' });
            
            this.observers.push(observer);
            
            // Observe all logo elements
            const logos = document.querySelectorAll('.fnf-logo-image[data-lazy], .hero-logo-large[data-lazy], .footer-logo[data-lazy]');
            logos.forEach(logo => observer.observe(logo));
        }
    }
    
    async loadLogo(logoElement, force = false) {
        if (!logoElement || (!force && logoElement.complete)) return;
        
        const startTime = performance.now();
        
        try {
            const optimalSrc = await this.getOptimalLogoSource(logoElement);
            
            // Check cache first
            if (this.logoCache.has(optimalSrc) && !force) {
                logoElement.src = optimalSrc;
                return;
            }
            
            // Load with promise for better error handling
            const loadPromise = new Promise((resolve, reject) => {
                const img = new Image();
                
                img.onload = () => {
                    logoElement.src = optimalSrc;
                    logoElement.classList.add('logo-loaded');
                    logoElement.classList.remove('logo-loading', 'logo-error');
                    
                    this.logoCache.set(optimalSrc, true);
                    this.trackPerformance(logoElement, performance.now() - startTime, optimalSrc);
                    
                    resolve(optimalSrc);
                };
                
                img.onerror = () => {
                    this.handleLoadingError(logoElement, optimalSrc);
                    reject(new Error(`Failed to load logo: ${optimalSrc}`));
                };
                
                img.src = optimalSrc;
            });
            
            // Timeout for slow connections
            const timeoutMs = this.capabilities.connectionSpeed === 'slow' ? 5000 : 3000;
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Logo loading timeout')), timeoutMs);
            });
            
            // Race between loading and timeout
            await Promise.race([loadPromise, timeoutPromise]);
            
        } catch (error) {
            console.warn('Logo optimization failed:', error);
            this.handleLoadingError(logoElement, logoElement.src);
        }
    }
    
    async getOptimalLogoSource(logoElement) {
        const baseSrc = logoElement.src || logoElement.dataset.src;
        const size = this.determineOptimalSize(logoElement);
        
        // Build optimal source based on capabilities
        let optimalSrc = baseSrc;
        
        // Format optimization
        if (this.capabilities.webp && !this.capabilities.prefersReducedData) {
            optimalSrc = optimalSrc.replace(/\.(png|jpg|jpeg)$/, '.webp');
        } else if (this.capabilities.avif && this.capabilities.connectionSpeed === 'fast') {
            optimalSrc = optimalSrc.replace(/\.(png|jpg|jpeg|webp)$/, '.avif');
        }
        
        // Size optimization
        if (size && this.capabilities.connectionSpeed !== 'fast') {
            optimalSrc = optimalSrc.replace(/\.([a-z]+)$/, `-${size}.$1`);
        }
        
        // High DPI optimization
        if (this.capabilities.devicePixelRatio > 1 && this.capabilities.connectionSpeed === 'fast') {
            const dprSuffix = this.capabilities.devicePixelRatio >= 3 ? '@3x' : '@2x';
            optimalSrc = optimalSrc.replace(/\.([a-z]+)$/, `${dprSuffix}.$1`);
        }
        
        return optimalSrc;
    }
    
    determineOptimalSize(logoElement) {
        const rect = logoElement.getBoundingClientRect();
        const maxDimension = Math.max(rect.width, rect.height);
        
        // Round up to nearest standard size
        if (maxDimension <= 32) return '32';
        if (maxDimension <= 48) return '48';
        if (maxDimension <= 56) return '56';
        if (maxDimension <= 80) return '80';
        
        return null; // Use original size
    }
    
    handleLoadingError(logoElement, failedSrc) {
        console.warn(`Logo loading failed for: ${failedSrc}`);
        
        // Progressive fallback
        let fallbackSrc = failedSrc;
        
        if (failedSrc.includes('.webp')) {
            fallbackSrc = failedSrc.replace('.webp', '.svg');
        } else if (failedSrc.includes('.avif')) {
            fallbackSrc = failedSrc.replace('.avif', '.png');
        } else if (failedSrc.includes('.svg')) {
            fallbackSrc = failedSrc.replace('.svg', '.png');
        } else {
            // Final fallback: CSS logo
            this.createCSSFallback(logoElement);
            return;
        }
        
        // Retry with fallback
        logoElement.src = fallbackSrc;
        logoElement.classList.add('logo-error');
    }
    
    createCSSFallback(logoElement) {
        const fallback = document.createElement('div');
        fallback.className = 'fnf-logo-css-fallback';
        fallback.innerHTML = '<div class="fnf-inner"><span class="fnf-wordmark">F-n-F</span></div>';
        fallback.setAttribute('role', 'img');
        fallback.setAttribute('aria-label', 'Food-N-Force Logo');
        
        // Copy dimensions
        const rect = logoElement.getBoundingClientRect();
        fallback.style.width = `${rect.width}px`;
        fallback.style.height = `${rect.height}px`;
        
        logoElement.parentNode.replaceChild(fallback, logoElement);
    }
    
    trackPerformance(logoElement, loadTime, src) {
        const elementId = logoElement.id || logoElement.className || 'unknown';
        
        this.performanceMetrics[elementId] = {
            loadTime,
            src,
            timestamp: Date.now(),
            size: logoElement.naturalWidth * logoElement.naturalHeight
        };
        
        // Log slow loading
        if (loadTime > 1000) {
            console.warn(`Slow logo loading: ${elementId} took ${loadTime}ms`);
        }
        
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'logo_load_time', {
                'event_category': 'performance',
                'value': Math.round(loadTime),
                'custom_map': {
                    'dimension1': elementId,
                    'dimension2': src
                }
            });
        }
    }
    
    setupResponsiveLoading() {
        // Handle responsive logo loading on resize
        let resizeTimeout;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.updateLogosForNewViewport();
            }, 250);
        });
    }
    
    updateLogosForNewViewport() {
        const logos = document.querySelectorAll('.fnf-logo-image, .hero-logo-large, .footer-logo');
        
        logos.forEach(logo => {
            const newOptimalSrc = this.getOptimalLogoSource(logo);
            
            if (newOptimalSrc !== logo.src) {
                this.loadLogo(logo);
            }
        });
    }
    
    initializeCriticalPath() {
        // Note: Skipping preload links to avoid CORS issues in file:// protocol
        // This will be enabled when served via HTTP/HTTPS
        if (location.protocol !== 'file:') {
            const criticalLogos = [
                'images/logos/fnf-logo.svg',
                'images/logos/fnf-logo.png'
            ];
            
            if (this.capabilities.webp) {
                criticalLogos.unshift('images/logos/fnf-logo.webp');
            }
            
            criticalLogos.forEach(src => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'image';
                link.href = src;
                link.crossOrigin = 'anonymous';
                document.head.appendChild(link);
            });
        }
    }
    
    // Public API for manual logo optimization
    optimizeLogo(logoElement) {
        return this.loadLogo(logoElement, true);
    }
    
    // Get performance metrics
    getPerformanceReport() {
        return {
            capabilities: this.capabilities,
            metrics: this.performanceMetrics,
            averageLoadTime: this.calculateAverageLoadTime()
        };
    }
    
    calculateAverageLoadTime() {
        const times = Object.values(this.performanceMetrics).map(m => m.loadTime);
        return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    }
    
    // Cleanup method
    destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.logoCache.clear();
        this.loadingQueue = [];
    }
}

// Initialize logo optimizer when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.logoOptimizer = new LogoOptimizer();
    });
} else {
    window.logoOptimizer = new LogoOptimizer();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogoOptimizer;
}