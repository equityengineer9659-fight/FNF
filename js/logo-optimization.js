/**
 * Food-N-Force Logo Optimization System
 * Advanced logo loading, fallback, and performance optimization
 * SLDS-compliant with full accessibility support
 */

class LogoOptimizer {
    constructor() {
        this.logoCache = new Map();
        this.loadingQueue = [];
        this.observers = [];
        this.performanceMetrics = {};
        
        this.init();
    }
    
    async init() {
        await this.detectCapabilities();
        this.setupIntersectionObserver();
        this.optimizeExistingLogos();
        this.setupResponsiveLoading();
        this.initializeCriticalPath();
    }
    
    async detectCapabilities() {
        // Detect browser capabilities for optimal format selection
        this.capabilities = {
            webp: await this.supportsFormat('webp'),
            avif: await this.supportsFormat('avif'),
            svg: true, // Universal support
            connectionSpeed: this.getConnectionSpeed(),
            devicePixelRatio: window.devicePixelRatio || 1,
            prefersReducedData: navigator.connection?.saveData || false
        };
        
        console.log('Logo optimization capabilities detected:', this.capabilities);
    }
    
    supportsFormat(format) {
        return new Promise((resolve) => {
            const testImages = {
                webp: 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA',
                avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A='
            };
            
            if (!testImages[format]) {
                resolve(false);
                return;
            }
            
            const img = new Image();
            img.onload = () => resolve(img.width === 2);
            img.onerror = () => resolve(false);
            img.src = testImages[format];
        });
    }
    
    getConnectionSpeed() {
        if (navigator.connection) {
            const connection = navigator.connection;
            
            // Effective connection type: slow-2g, 2g, 3g, 4g
            switch (connection.effectiveType) {
                case 'slow-2g':
                case '2g':
                    return 'slow';
                case '3g':
                    return 'medium';
                case '4g':
                default:
                    return 'fast';
            }
        }
        
        return 'unknown';
    }
    
    setupIntersectionObserver() {
        // Lazy loading observer for non-critical logos
        this.lazyObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadLogo(entry.target);
                    this.lazyObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        this.observers.push(this.lazyObserver);
    }
    
    optimizeExistingLogos() {
        // Find all logo images and optimize them
        const logos = document.querySelectorAll('img[src*="logo"], .logo-placeholder');
        
        logos.forEach(logo => {
            const priority = this.determinePriority(logo);
            
            if (priority === 'critical') {
                this.loadLogo(logo, true);
            } else {
                this.lazyObserver.observe(logo);
            }
        });
    }
    
    determinePriority(element) {
        // Determine loading priority based on element position and class
        const rect = element.getBoundingClientRect();
        const isAboveFold = rect.top < window.innerHeight;
        const isNavigation = element.closest('.navbar, nav');
        const isHero = element.closest('.hero-section, .hero');
        
        if (isNavigation || (isHero && isAboveFold)) {
            return 'critical';
        } else if (isAboveFold) {
            return 'high';
        } else {
            return 'low';
        }
    }
    
    async loadLogo(logoElement, isCritical = false) {
        const startTime = performance.now();
        
        try {
            // Determine optimal source
            const optimalSrc = await this.getOptimalLogoSource(logoElement);
            
            // Create new image for preloading
            const img = new Image();
            
            // Set up loading states
            logoElement.classList.add('logo-loading');
            
            // Promise-based loading
            const loadPromise = new Promise((resolve, reject) => {
                img.onload = () => {
                    logoElement.src = optimalSrc;
                    logoElement.classList.remove('logo-loading');
                    logoElement.classList.add('logo-fade-in');
                    
                    // Performance tracking
                    const loadTime = performance.now() - startTime;
                    this.trackPerformance(logoElement, loadTime, optimalSrc);
                    
                    resolve(optimalSrc);
                };
                
                img.onerror = () => {
                    this.handleLoadingError(logoElement, optimalSrc);
                    reject(new Error(`Failed to load logo: ${optimalSrc}`));\n                };\n            });\n            \n            // Start loading\n            img.src = optimalSrc;\n            \n            // Timeout for slow connections\n            const timeoutMs = this.capabilities.connectionSpeed === 'slow' ? 5000 : 3000;\n            const timeoutPromise = new Promise((_, reject) => {\n                setTimeout(() => reject(new Error('Logo loading timeout')), timeoutMs);\n            });\n            \n            // Race between loading and timeout\n            await Promise.race([loadPromise, timeoutPromise]);\n            \n        } catch (error) {\n            console.warn('Logo optimization failed:', error);\n            this.handleLoadingError(logoElement, logoElement.src);\n        }\n    }\n    \n    async getOptimalLogoSource(logoElement) {\n        const baseSrc = logoElement.src || logoElement.dataset.src;\n        const size = this.determineOptimalSize(logoElement);\n        \n        // Build optimal source based on capabilities\n        let optimalSrc = baseSrc;\n        \n        // Format optimization\n        if (this.capabilities.webp && !this.capabilities.prefersReducedData) {\n            optimalSrc = optimalSrc.replace(/\\.(png|jpg|jpeg)$/, '.webp');\n        } else if (this.capabilities.avif && this.capabilities.connectionSpeed === 'fast') {\n            optimalSrc = optimalSrc.replace(/\\.(png|jpg|jpeg|webp)$/, '.avif');\n        }\n        \n        // Size optimization\n        if (size && this.capabilities.connectionSpeed !== 'fast') {\n            optimalSrc = optimalSrc.replace(/\\.([a-z]+)$/, `-${size}.$1`);\n        }\n        \n        // High DPI optimization\n        if (this.capabilities.devicePixelRatio > 1 && this.capabilities.connectionSpeed === 'fast') {\n            const dprSuffix = this.capabilities.devicePixelRatio >= 3 ? '@3x' : '@2x';\n            optimalSrc = optimalSrc.replace(/\\.([a-z]+)$/, `${dprSuffix}.$1`);\n        }\n        \n        return optimalSrc;\n    }\n    \n    determineOptimalSize(logoElement) {\n        const rect = logoElement.getBoundingClientRect();\n        const maxDimension = Math.max(rect.width, rect.height);\n        \n        // Round up to nearest standard size\n        if (maxDimension <= 32) return '32';\n        if (maxDimension <= 48) return '48';\n        if (maxDimension <= 56) return '56';\n        if (maxDimension <= 80) return '80';\n        \n        return null; // Use original size\n    }\n    \n    handleLoadingError(logoElement, failedSrc) {\n        console.warn(`Logo loading failed for: ${failedSrc}`);\n        \n        // Progressive fallback\n        let fallbackSrc = failedSrc;\n        \n        if (failedSrc.includes('.webp')) {\n            fallbackSrc = failedSrc.replace('.webp', '.svg');\n        } else if (failedSrc.includes('.avif')) {\n            fallbackSrc = failedSrc.replace('.avif', '.png');\n        } else if (failedSrc.includes('.svg')) {\n            fallbackSrc = failedSrc.replace('.svg', '.png');\n        } else {\n            // Final fallback: CSS logo\n            this.createCSSFallback(logoElement);\n            return;\n        }\n        \n        // Retry with fallback\n        logoElement.src = fallbackSrc;\n        logoElement.classList.add('logo-error');\n    }\n    \n    createCSSFallback(logoElement) {\n        const fallback = document.createElement('div');\n        fallback.className = 'fnf-logo-css-fallback';\n        fallback.innerHTML = '<div class=\"fnf-inner\"><span class=\"fnf-wordmark\">F-n-F</span></div>';\n        fallback.setAttribute('role', 'img');\n        fallback.setAttribute('aria-label', 'Food-N-Force Logo');\n        \n        // Copy dimensions\n        const rect = logoElement.getBoundingClientRect();\n        fallback.style.width = `${rect.width}px`;\n        fallback.style.height = `${rect.height}px`;\n        \n        logoElement.parentNode.replaceChild(fallback, logoElement);\n    }\n    \n    trackPerformance(logoElement, loadTime, src) {\n        const elementId = logoElement.id || logoElement.className || 'unknown';\n        \n        this.performanceMetrics[elementId] = {\n            loadTime,\n            src,\n            timestamp: Date.now(),\n            size: logoElement.naturalWidth * logoElement.naturalHeight\n        };\n        \n        // Log slow loading\n        if (loadTime > 1000) {\n            console.warn(`Slow logo loading: ${elementId} took ${loadTime}ms`);\n        }\n        \n        // Analytics tracking\n        if (typeof gtag !== 'undefined') {\n            gtag('event', 'logo_load_time', {\n                'event_category': 'performance',\n                'value': Math.round(loadTime),\n                'custom_map': {\n                    'dimension1': elementId,\n                    'dimension2': src\n                }\n            });\n        }\n    }\n    \n    setupResponsiveLoading() {\n        // Handle responsive logo loading on resize\n        let resizeTimeout;\n        \n        window.addEventListener('resize', () => {\n            clearTimeout(resizeTimeout);\n            resizeTimeout = setTimeout(() => {\n                this.updateLogosForNewViewport();\n            }, 250);\n        });\n    }\n    \n    updateLogosForNewViewport() {\n        const logos = document.querySelectorAll('.fnf-logo-image, .hero-logo-large, .footer-logo');\n        \n        logos.forEach(logo => {\n            const newOptimalSrc = this.getOptimalLogoSource(logo);\n            \n            if (newOptimalSrc !== logo.src) {\n                this.loadLogo(logo);\n            }\n        });\n    }\n    \n    initializeCriticalPath() {\n        // Preload critical logo assets\n        const criticalLogos = [\n            'images/logos/fnf-logo.svg',\n            'images/logos/fnf-logo.png'\n        ];\n        \n        if (this.capabilities.webp) {\n            criticalLogos.unshift('images/logos/fnf-logo.webp');\n        }\n        \n        criticalLogos.forEach(src => {\n            const link = document.createElement('link');\n            link.rel = 'preload';\n            link.as = 'image';\n            link.href = src;\n            link.crossOrigin = 'anonymous';\n            document.head.appendChild(link);\n        });\n    }\n    \n    // Public API for manual logo optimization\n    optimizeLogo(logoElement) {\n        return this.loadLogo(logoElement, true);\n    }\n    \n    // Get performance metrics\n    getPerformanceReport() {\n        return {\n            capabilities: this.capabilities,\n            metrics: this.performanceMetrics,\n            averageLoadTime: this.calculateAverageLoadTime()\n        };\n    }\n    \n    calculateAverageLoadTime() {\n        const times = Object.values(this.performanceMetrics).map(m => m.loadTime);\n        return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;\n    }\n    \n    // Cleanup method\n    destroy() {\n        this.observers.forEach(observer => observer.disconnect());\n        this.logoCache.clear();\n        this.loadingQueue = [];\n    }\n}\n\n// Initialize logo optimizer when DOM is ready\nif (document.readyState === 'loading') {\n    document.addEventListener('DOMContentLoaded', () => {\n        window.logoOptimizer = new LogoOptimizer();\n    });\n} else {\n    window.logoOptimizer = new LogoOptimizer();\n}\n\n// Export for module usage\nif (typeof module !== 'undefined' && module.exports) {\n    module.exports = LogoOptimizer;\n}