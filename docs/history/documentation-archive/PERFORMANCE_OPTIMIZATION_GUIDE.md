# Food-N-Force Performance Optimization Guide
## Comprehensive Performance Architecture and Monitoring Framework

**Version**: 3.0  
**Target Performance**: Core Web Vitals Excellence  
**Last Updated**: 2025-08-18  

---

## Performance Architecture Overview

### 1. Performance Goals and Targets

#### Core Web Vitals Targets
| Metric | Good | Needs Improvement | Poor | Current Target |
|--------|------|-------------------|------|----------------|
| **Largest Contentful Paint (LCP)** | ≤ 2.5s | 2.5s - 4.0s | > 4.0s | **< 2.0s** |
| **First Input Delay (FID)** | ≤ 100ms | 100ms - 300ms | > 300ms | **< 75ms** |
| **Cumulative Layout Shift (CLS)** | ≤ 0.1 | 0.1 - 0.25 | > 0.25 | **< 0.05** |
| **First Contentful Paint (FCP)** | ≤ 1.8s | 1.8s - 3.0s | > 3.0s | **< 1.5s** |
| **Time to Interactive (TTI)** | ≤ 3.8s | 3.9s - 7.3s | > 7.3s | **< 3.0s** |

#### Additional Performance Metrics
- **Speed Index**: < 3.0s
- **Total Blocking Time**: < 200ms
- **Bundle Size**: CSS < 50KB, JS < 75KB (gzipped)
- **Image Optimization**: 90%+ size reduction from original

### 2. Performance Budget Framework

#### Asset Size Budgets
```javascript
const PERFORMANCE_BUDGETS = {
    // Network budgets
    totalPageWeight: 1500, // KB
    totalRequests: 50,
    
    // Asset-specific budgets
    css: {
        critical: 14,    // KB - inlined critical CSS
        external: 50,    // KB - external stylesheets
        total: 64        // KB - total CSS budget
    },
    
    javascript: {
        framework: 0,    // KB - no framework, vanilla JS
        application: 75, // KB - application code
        vendor: 25,      // KB - third-party libraries
        total: 100       // KB - total JS budget
    },
    
    images: {
        hero: 150,       // KB - hero section images
        content: 50,     // KB - per content image
        icons: 10,       // KB - per icon/logo
        total: 500       // KB - total images budget
    },
    
    fonts: {
        orbitron: 100,   // KB - Orbitron font family
        fallback: 0,     // KB - system fonts only
        total: 100       // KB - total fonts budget
    }
};
```

---

## Loading Strategy Architecture

### 1. Critical Path Optimization

#### Critical CSS Inlining
```html
<head>
    <!-- Critical CSS inlined for immediate rendering -->
    <style>
        /* Critical styles for above-the-fold content */
        :root {
            --slds-c-brand-primary: #16325C;
            --slds-c-text-default: #181818;
            --slds-c-spacing-large: 1rem;
        }
        
        .fnf-navbar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 9999;
            background: var(--slds-c-background-default);
            height: 64px;
        }
        
        .hero-section {
            padding-top: 64px;
            min-height: 60vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .fnf-logo-image {
            width: 56px;
            height: 56px;
            object-fit: contain;
        }
    </style>
    
    <!-- Preload critical resources -->
    <link rel="preload" as="image" href="images/logos/fnf-logo.svg">
    <link rel="preload" as="font" href="https://fonts.gstatic.com/s/orbitron/v25/yMJPMIlzdpvBhQQL_Qi7jgA7.woff2" crossorigin>
    
    <!-- Load non-critical CSS asynchronously -->
    <link rel="preload" href="css/styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="css/styles.css"></noscript>
</head>
```

#### Resource Prioritization Strategy
```javascript
class ResourcePrioritizer {
    constructor() {
        this.priorities = {
            critical: ['navigation-logo', 'hero-content', 'critical-css'],
            high: ['navigation-styles', 'hero-images', 'fonts'],
            medium: ['service-cards', 'content-images'],
            low: ['footer-content', 'analytics', 'additional-scripts']
        };
    }
    
    async loadResourcesInOrder() {
        // Critical resources (block rendering)
        await this.loadCriticalResources();
        
        // High priority (load immediately after critical)
        this.loadHighPriorityResources();
        
        // Medium/Low priority (load when idle)
        this.scheduleIdleLoading();
    }
    
    loadCriticalResources() {
        return Promise.all([
            this.preloadImage('images/logos/fnf-logo.svg'),
            this.preloadFont('Orbitron', 'woff2'),
            this.loadCriticalCSS()
        ]);
    }
    
    scheduleIdleLoading() {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                this.loadMediumPriorityResources();
            });
        } else {
            setTimeout(() => {
                this.loadMediumPriorityResources();
            }, 100);
        }
    }
}
```

### 2. Progressive Enhancement Loading

#### Module Loading System
```javascript
class ModuleLoader {
    constructor() {
        this.loadedModules = new Set();
        this.loadingPromises = new Map();
        this.dependencies = {
            'fnf-core': [],
            'fnf-effects': ['fnf-core'],
            'fnf-performance': ['fnf-core'],
            'fnf-app': ['fnf-core', 'fnf-effects', 'fnf-performance']
        };
    }
    
    async loadModule(moduleName) {
        if (this.loadedModules.has(moduleName)) {
            return;
        }
        
        if (this.loadingPromises.has(moduleName)) {
            return this.loadingPromises.get(moduleName);
        }
        
        const loadPromise = this.loadModuleWithDependencies(moduleName);
        this.loadingPromises.set(moduleName, loadPromise);
        
        return loadPromise;
    }
    
    async loadModuleWithDependencies(moduleName) {
        // Load dependencies first
        const deps = this.dependencies[moduleName] || [];
        await Promise.all(deps.map(dep => this.loadModule(dep)));
        
        // Load the module
        const script = document.createElement('script');
        script.src = `js/${moduleName}.js`;
        script.defer = true;
        
        return new Promise((resolve, reject) => {
            script.onload = () => {
                this.loadedModules.add(moduleName);
                console.log(`✅ Module loaded: ${moduleName}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`❌ Failed to load module: ${moduleName}`);
                reject(new Error(`Module load failed: ${moduleName}`));
            };
            document.head.appendChild(script);
        });
    }
}
```

---

## Image Optimization System

### 1. Format Selection and Delivery

#### Automatic Format Detection
```javascript
class ImageOptimizer {
    constructor() {
        this.supportedFormats = new Map();
        this.sizeCache = new Map();
        this.loadingQueue = [];
    }
    
    async detectOptimalFormat() {
        const formats = ['avif', 'webp', 'jpg', 'png'];
        const results = {};
        
        for (const format of formats) {
            results[format] = await this.testFormatSupport(format);
        }
        
        return results;
    }
    
    testFormatSupport(format) {
        return new Promise((resolve) => {
            const testImages = {
                avif: 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=',
                webp: 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA',
                jpg: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7+HM/plrz2yIiLuJXQfvjpvT6SvOjYVUaX2jfQnLb4n1m1uxTMcU+XpuWPdXDJsBs2eY1DKw0nDEjZVeWPlgNpBSXo36Qh8jOhWEeOEvNJKCNr6o6cV8xkAy9KDaVx7HZXM47KS2I2Bc/cH3+1qr0DjJ5cI8YcFt3F/9k='
            };
            
            const img = new Image();
            img.onload = () => resolve(img.width === 2);
            img.onerror = () => resolve(false);
            img.src = testImages[format] || '';
        });
    }
    
    selectOptimalImage(imagePath, context) {
        const formats = this.getPreferredFormats();
        const sizes = this.getContextSizes(context);
        
        for (const format of formats) {
            const optimizedPath = this.buildImagePath(imagePath, format, sizes);
            if (this.imageExists(optimizedPath)) {
                return optimizedPath;
            }
        }
        
        return imagePath; // Fallback to original
    }
    
    getContextSizes(context) {
        const viewport = this.getViewportSize();
        const density = window.devicePixelRatio || 1;
        
        const sizeMap = {
            'hero': {
                mobile: 48 * density,
                tablet: 64 * density,
                desktop: 80 * density
            },
            'navigation': {
                mobile: 40 * density,
                tablet: 48 * density,
                desktop: 56 * density
            },
            'footer': {
                mobile: 28 * density,
                tablet: 32 * density,
                desktop: 32 * density
            }
        };
        
        const breakpoint = viewport.width <= 480 ? 'mobile' :
                          viewport.width <= 768 ? 'tablet' : 'desktop';
        
        return sizeMap[context]?.[breakpoint] || 56;
    }
}
```

### 2. Lazy Loading Implementation

#### Advanced Intersection Observer
```javascript
class AdvancedLazyLoader {
    constructor() {
        this.imageObserver = this.createImageObserver();
        this.loadingQueue = new Map();
        this.loadedCount = 0;
        this.totalImages = 0;
        this.progressCallback = null;
    }
    
    createImageObserver() {
        const options = {
            root: null,
            rootMargin: '50px 0px',
            threshold: 0.01
        };
        
        return new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.imageObserver.unobserve(entry.target);
                }
            });
        }, options);
    }
    
    async loadImage(img) {
        const startTime = performance.now();
        
        try {
            // Show loading placeholder
            this.showLoadingState(img);
            
            // Determine optimal image source
            const optimizedSrc = this.selectOptimalSource(img);
            
            // Preload the image
            const preloadImg = new Image();
            preloadImg.src = optimizedSrc;
            
            await new Promise((resolve, reject) => {
                preloadImg.onload = resolve;
                preloadImg.onerror = reject;
                
                // Timeout after 10 seconds
                setTimeout(() => reject(new Error('Load timeout')), 10000);
            });
            
            // Apply loaded image with smooth transition
            this.applyLoadedImage(img, optimizedSrc);
            
            // Track performance
            const loadTime = performance.now() - startTime;
            this.trackImagePerformance(img, loadTime, optimizedSrc);
            
        } catch (error) {
            console.warn('Image loading failed:', img.dataset.src, error);
            this.applyFallback(img);
        }
    }
    
    showLoadingState(img) {
        img.style.backgroundColor = '#f3f2f2';
        img.style.backgroundImage = `
            linear-gradient(90deg, 
                rgba(255,255,255,0) 0%, 
                rgba(255,255,255,0.2) 50%, 
                rgba(255,255,255,0) 100%)
        `;
        img.style.backgroundSize = '200% 100%';
        img.style.animation = 'shimmer 1.5s ease-in-out infinite';
    }
    
    applyLoadedImage(img, src) {
        // Create fade-in effect
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease-in-out';
        
        // Set source
        img.src = src;
        
        // Remove lazy loading attributes
        delete img.dataset.src;
        delete img.dataset.srcset;
        
        // Fade in
        requestAnimationFrame(() => {
            img.style.opacity = '1';
            img.style.background = 'none';
            img.style.animation = 'none';
        });
        
        // Update progress
        this.loadedCount++;
        if (this.progressCallback) {
            this.progressCallback(this.loadedCount, this.totalImages);
        }
    }
}
```

---

## Caching Strategy

### 1. Browser Caching Configuration

#### Cache Headers Strategy
```javascript
// Netlify cache configuration (netlify.toml)
const CACHE_STRATEGY = {
    // Static assets - Long term caching
    staticAssets: {
        pattern: '/css/*, /js/*, /images/*',
        headers: {
            'Cache-Control': 'public, max-age=31536000, immutable',
            'ETag': 'strong',
            'Vary': 'Accept-Encoding'
        }
    },
    
    // HTML pages - Short term caching
    htmlPages: {
        pattern: '*.html',
        headers: {
            'Cache-Control': 'public, max-age=3600, must-revalidate',
            'ETag': 'weak',
            'Vary': 'Accept-Encoding'
        }
    },
    
    // Images - Medium term caching with optimization
    images: {
        pattern: '/images/*',
        headers: {
            'Cache-Control': 'public, max-age=2592000',
            'Vary': 'Accept, Accept-Encoding',
            'Content-Type': 'auto-detect'
        }
    }
};
```

### 2. Service Worker Implementation (Future Enhancement)

#### Basic Service Worker for Caching
```javascript
// sw.js - Service Worker for advanced caching
const CACHE_NAME = 'fnf-v1.0.0';
const STATIC_CACHE_URLS = [
    '/',
    '/css/styles.css',
    '/css/navigation-styles.css',
    '/js/fnf-core.js',
    '/js/fnf-app.js',
    '/images/logos/fnf-logo.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_CACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('fetch', (event) => {
    // Network first for HTML
    if (event.request.destination === 'document') {
        event.respondWith(networkFirstStrategy(event.request));
        return;
    }
    
    // Cache first for static assets
    if (isStaticAsset(event.request.url)) {
        event.respondWith(cacheFirstStrategy(event.request));
        return;
    }
    
    // Network only for API calls
    event.respondWith(fetch(event.request));
});

async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        return cachedResponse || new Response('Offline', { status: 503 });
    }
}

async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        return new Response('Asset not available', { status: 404 });
    }
}
```

---

## Monitoring System

### 1. Real User Monitoring (RUM)

#### Performance Metrics Collection
```javascript
class PerformanceMonitor {
    constructor() {
        this.metrics = new Map();
        this.observers = new Map();
        this.sessionId = this.generateSessionId();
        this.startTime = performance.now();
        
        this.initializeObservers();
        this.setupPerformanceAPI();
    }
    
    initializeObservers() {
        // Largest Contentful Paint
        this.observeLCP();
        
        // First Input Delay
        this.observeFID();
        
        // Cumulative Layout Shift
        this.observeCLS();
        
        // Long Tasks
        this.observeLongTasks();
        
        // Navigation Timing
        this.observeNavigationTiming();
    }
    
    observeLCP() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                this.metrics.set('LCP', {
                    value: entry.startTime,
                    element: entry.element?.tagName,
                    url: entry.url,
                    timestamp: Date.now()
                });
                
                this.evaluateMetric('LCP', entry.startTime);
            });
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('LCP', observer);
    }
    
    observeFID() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                this.metrics.set('FID', {
                    value: entry.processingStart - entry.startTime,
                    inputType: entry.name,
                    timestamp: Date.now()
                });
                
                this.evaluateMetric('FID', entry.processingStart - entry.startTime);
            });
        });
        
        observer.observe({ entryTypes: ['first-input'] });
        this.observers.set('FID', observer);
    }
    
    observeCLS() {
        let clsValue = 0;
        let sessionValue = 0;
        let sessionEntries = [];
        
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (!entry.hadRecentInput) {
                    const firstSessionEntry = sessionEntries[0];
                    const lastSessionEntry = sessionEntries[sessionEntries.length - 1];
                    
                    if (sessionValue &&
                        entry.startTime - lastSessionEntry.startTime < 1000 &&
                        entry.startTime - firstSessionEntry.startTime < 5000) {
                        sessionValue += entry.value;
                        sessionEntries.push(entry);
                    } else {
                        sessionValue = entry.value;
                        sessionEntries = [entry];
                    }
                    
                    if (sessionValue > clsValue) {
                        clsValue = sessionValue;
                        this.metrics.set('CLS', {
                            value: clsValue,
                            entries: sessionEntries.map(e => ({
                                value: e.value,
                                element: e.sources?.[0]?.node?.tagName,
                                timestamp: e.startTime
                            })),
                            timestamp: Date.now()
                        });
                        
                        this.evaluateMetric('CLS', clsValue);
                    }
                }
            });
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('CLS', observer);
    }
    
    evaluateMetric(name, value) {
        const thresholds = {
            LCP: { good: 2500, poor: 4000 },
            FID: { good: 100, poor: 300 },
            CLS: { good: 0.1, poor: 0.25 }
        };
        
        const threshold = thresholds[name];
        let rating;
        
        if (value <= threshold.good) {
            rating = 'good';
        } else if (value <= threshold.poor) {
            rating = 'needs-improvement';
        } else {
            rating = 'poor';
        }
        
        console.log(`📊 ${name}: ${value}${name === 'CLS' ? '' : 'ms'} (${rating})`);
        
        // Send to analytics
        this.sendToAnalytics(name, value, rating);
        
        // Alert if poor performance
        if (rating === 'poor') {
            this.handlePoorPerformance(name, value);
        }
    }
    
    sendToAnalytics(metric, value, rating) {
        // Integration with analytics service
        if (typeof gtag !== 'undefined') {
            gtag('event', 'web_vitals', {
                metric_name: metric,
                metric_value: value,
                metric_rating: rating,
                session_id: this.sessionId
            });
        }
        
        // Custom analytics endpoint
        fetch('/api/performance-metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                metric,
                value,
                rating,
                sessionId: this.sessionId,
                userAgent: navigator.userAgent,
                timestamp: Date.now(),
                url: window.location.href
            })
        }).catch(error => console.warn('Analytics send failed:', error));
    }
}
```

### 2. Automated Performance Testing

#### Lighthouse CI Integration
```javascript
// lighthouserc.js - Lighthouse CI configuration
module.exports = {
    ci: {
        collect: {
            url: [
                'http://localhost:8080/',
                'http://localhost:8080/about.html',
                'http://localhost:8080/services.html',
                'http://localhost:8080/impact.html',
                'http://localhost:8080/contact.html'
            ],
            numberOfRuns: 3,
            settings: {
                preset: 'desktop',
                chromeFlags: '--no-sandbox --disable-dev-shm-usage',
                emulatedFormFactor: 'desktop',
                throttling: {
                    rttMs: 40,
                    throughputKbps: 10240,
                    cpuSlowdownMultiplier: 1
                }
            }
        },
        assert: {
            assertions: {
                'categories:performance': ['error', { minScore: 0.85 }],
                'categories:accessibility': ['error', { minScore: 0.95 }],
                'categories:best-practices': ['error', { minScore: 0.90 }],
                'categories:seo': ['error', { minScore: 0.90 }],
                'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
                'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
                'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
                'total-blocking-time': ['error', { maxNumericValue: 200 }]
            }
        },
        upload: {
            target: 'temporary-public-storage'
        }
    }
};
```

#### Performance Budget Monitoring
```javascript
class PerformanceBudgetMonitor {
    constructor() {
        this.budgets = PERFORMANCE_BUDGETS;
        this.violations = [];
        this.monitoringInterval = null;
    }
    
    startMonitoring() {
        this.checkBudgets();
        this.monitoringInterval = setInterval(() => {
            this.checkBudgets();
        }, 30000); // Check every 30 seconds
    }
    
    async checkBudgets() {
        const results = {
            bundles: await this.checkBundleSizes(),
            images: await this.checkImageSizes(),
            requests: await this.checkRequestCount(),
            timing: await this.checkTimingBudgets()
        };
        
        this.evaluateBudgets(results);
    }
    
    async checkBundleSizes() {
        const bundleChecks = [
            { name: 'styles.css', budget: this.budgets.css.total },
            { name: 'fnf-core.js', budget: this.budgets.javascript.application },
            { name: 'all-js', budget: this.budgets.javascript.total }
        ];
        
        const results = [];
        
        for (const check of bundleChecks) {
            try {
                const response = await fetch(`/${check.name}`, { method: 'HEAD' });
                const size = parseInt(response.headers.get('content-length'), 10) || 0;
                const gzipSize = size * 0.3; // Estimate gzip compression
                
                results.push({
                    name: check.name,
                    size: gzipSize,
                    budget: check.budget * 1024,
                    status: gzipSize <= (check.budget * 1024) ? 'pass' : 'fail'
                });
            } catch (error) {
                console.warn(`Bundle size check failed for ${check.name}:`, error);
            }
        }
        
        return results;
    }
    
    evaluateBudgets(results) {
        const violations = [];
        
        // Check each budget category
        Object.entries(results).forEach(([category, checks]) => {
            checks.forEach(check => {
                if (check.status === 'fail') {
                    violations.push({
                        category,
                        check: check.name,
                        actual: check.size,
                        budget: check.budget,
                        overage: check.size - check.budget
                    });
                }
            });
        });
        
        if (violations.length > 0) {
            this.handleBudgetViolations(violations);
        }
    }
    
    handleBudgetViolations(violations) {
        console.warn('🚨 Performance Budget Violations:', violations);
        
        // Send alerts
        violations.forEach(violation => {
            console.warn(
                `Budget exceeded: ${violation.check} ` +
                `(${(violation.actual / 1024).toFixed(1)}KB / ${(violation.budget / 1024).toFixed(1)}KB) ` +
                `+${(violation.overage / 1024).toFixed(1)}KB over`
            );
        });
        
        // Integrate with monitoring service
        this.sendBudgetAlert(violations);
    }
}
```

---

## Optimization Techniques

### 1. Code Splitting and Tree Shaking

#### Dynamic Module Loading
```javascript
class ModuleManager {
    constructor() {
        this.loadedModules = new Map();
        this.loadingPromises = new Map();
    }
    
    async loadPageSpecificModules(pageName) {
        const moduleMap = {
            'index': ['fnf-core', 'fnf-effects'],
            'about': ['fnf-core', 'about-page-unified'],
            'services': ['fnf-core', 'services-diagnostic'],
            'contact': ['fnf-core', 'form-validation'],
            'impact': ['fnf-core', 'impact-numbers-style']
        };
        
        const requiredModules = moduleMap[pageName] || ['fnf-core'];
        
        return Promise.all(
            requiredModules.map(module => this.loadModule(module))
        );
    }
    
    async loadModule(moduleName) {
        if (this.loadedModules.has(moduleName)) {
            return this.loadedModules.get(moduleName);
        }
        
        if (this.loadingPromises.has(moduleName)) {
            return this.loadingPromises.get(moduleName);
        }
        
        const loadPromise = this.importModule(moduleName);
        this.loadingPromises.set(moduleName, loadPromise);
        
        try {
            const module = await loadPromise;
            this.loadedModules.set(moduleName, module);
            return module;
        } catch (error) {
            this.loadingPromises.delete(moduleName);
            throw error;
        }
    }
    
    async importModule(moduleName) {
        // Dynamic import with fallback
        try {
            return await import(`/js/${moduleName}.js`);
        } catch (error) {
            console.warn(`Dynamic import failed for ${moduleName}, falling back to script tag`);
            return this.loadModuleWithScript(moduleName);
        }
    }
    
    loadModuleWithScript(moduleName) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `/js/${moduleName}.js`;
            script.defer = true;
            
            script.onload = () => {
                // Module should expose itself on window
                const module = window[this.getModuleGlobalName(moduleName)];
                if (module) {
                    resolve(module);
                } else {
                    reject(new Error(`Module ${moduleName} not found on window`));
                }
            };
            
            script.onerror = () => reject(new Error(`Failed to load ${moduleName}`));
            document.head.appendChild(script);
        });
    }
}
```

### 2. Memory Management

#### Cleanup and Garbage Collection
```javascript
class MemoryManager {
    constructor() {
        this.observers = new Set();
        this.eventListeners = new Set();
        this.timers = new Set();
        this.cleanupTasks = new Set();
    }
    
    registerObserver(observer, cleanup) {
        this.observers.add({ observer, cleanup });
        return observer;
    }
    
    registerEventListener(element, event, handler, options) {
        element.addEventListener(event, handler, options);
        this.eventListeners.add({ element, event, handler, options });
    }
    
    registerTimer(timerId, type = 'timeout') {
        this.timers.add({ id: timerId, type });
        return timerId;
    }
    
    registerCleanupTask(task) {
        this.cleanupTasks.add(task);
    }
    
    cleanup() {
        console.log('🧹 Starting memory cleanup...');
        
        // Disconnect observers
        this.observers.forEach(({ observer, cleanup }) => {
            if (cleanup && typeof cleanup === 'function') {
                cleanup(observer);
            } else if (observer.disconnect) {
                observer.disconnect();
            }
        });
        this.observers.clear();
        
        // Remove event listeners
        this.eventListeners.forEach(({ element, event, handler, options }) => {
            try {
                element.removeEventListener(event, handler, options);
            } catch (error) {
                console.warn('Failed to remove event listener:', error);
            }
        });
        this.eventListeners.clear();
        
        // Clear timers
        this.timers.forEach(({ id, type }) => {
            if (type === 'timeout') {
                clearTimeout(id);
            } else if (type === 'interval') {
                clearInterval(id);
            }
        });
        this.timers.clear();
        
        // Run custom cleanup tasks
        this.cleanupTasks.forEach(task => {
            try {
                task();
            } catch (error) {
                console.warn('Cleanup task failed:', error);
            }
        });
        this.cleanupTasks.clear();
        
        console.log('✅ Memory cleanup completed');
    }
    
    // Monitor memory usage
    startMemoryMonitoring() {
        if (performance.memory) {
            const logMemoryUsage = () => {
                const memory = performance.memory;
                const used = (memory.usedJSHeapSize / 1048576).toFixed(2);
                const total = (memory.totalJSHeapSize / 1048576).toFixed(2);
                const limit = (memory.jsHeapSizeLimit / 1048576).toFixed(2);
                
                console.log(`💾 Memory: ${used}MB / ${total}MB (limit: ${limit}MB)`);
                
                // Alert if memory usage is high
                if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.9) {
                    console.warn('🚨 High memory usage detected');
                    this.suggestCleanup();
                }
            };
            
            const intervalId = setInterval(logMemoryUsage, 30000);
            this.registerTimer(intervalId, 'interval');
        }
    }
    
    suggestCleanup() {
        // Force garbage collection if available (dev mode)
        if (window.gc && typeof window.gc === 'function') {
            window.gc();
        }
        
        // Run partial cleanup
        this.cleanup();
    }
}
```

---

## Performance Testing Framework

### 1. Automated Performance Testing

#### Core Web Vitals Testing Suite
```javascript
// tests/performance.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Performance Tests', () => {
    test('Core Web Vitals meet targets', async ({ page }) => {
        // Set up performance monitoring
        await page.addInitScript(() => {
            window.performanceMetrics = {};
            
            // Monitor LCP
            new PerformanceObserver((list) => {
                const entry = list.getEntries().pop();
                window.performanceMetrics.LCP = entry.startTime;
            }).observe({ entryTypes: ['largest-contentful-paint'] });
            
            // Monitor FID
            new PerformanceObserver((list) => {
                const entry = list.getEntries().pop();
                window.performanceMetrics.FID = entry.processingStart - entry.startTime;
            }).observe({ entryTypes: ['first-input'] });
            
            // Monitor CLS
            let clsValue = 0;
            new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                });
                window.performanceMetrics.CLS = clsValue;
            }).observe({ entryTypes: ['layout-shift'] });
        });
        
        // Navigate to page
        await page.goto('/');
        
        // Wait for page to be interactive
        await page.waitForLoadState('networkidle');
        
        // Trigger user interaction to measure FID
        await page.click('a[href="#get-started"]');
        
        // Wait for metrics to be collected
        await page.waitForTimeout(3000);
        
        // Evaluate metrics
        const metrics = await page.evaluate(() => window.performanceMetrics);
        
        // Assert Core Web Vitals targets
        expect(metrics.LCP).toBeLessThan(2500);
        expect(metrics.FID).toBeLessThan(100);
        expect(metrics.CLS).toBeLessThan(0.1);
    });
    
    test('Page load performance meets targets', async ({ page }) => {
        const startTime = Date.now();
        
        await page.goto('/');
        
        // Wait for key content to be visible
        await page.waitForSelector('.hero-title', { state: 'visible' });
        await page.waitForSelector('.fnf-logo-image', { state: 'visible' });
        
        const loadTime = Date.now() - startTime;
        
        // Assert load time target
        expect(loadTime).toBeLessThan(3000);
        
        // Check critical resources loaded
        const logoLoaded = await page.isVisible('.fnf-logo-image');
        const heroVisible = await page.isVisible('.hero-title');
        const navigationVisible = await page.isVisible('.fnf-navbar');
        
        expect(logoLoaded).toBe(true);
        expect(heroVisible).toBe(true);
        expect(navigationVisible).toBe(true);
    });
    
    test('Bundle sizes within budget', async ({ page }) => {
        const response = await page.goto('/');
        
        // Get response headers to check content length
        const headers = response.headers();
        const contentLength = parseInt(headers['content-length'] || '0', 10);
        
        // HTML should be under 50KB
        expect(contentLength).toBeLessThan(50 * 1024);
        
        // Check CSS bundle size
        const cssResponse = await page.request.get('/css/styles.css');
        const cssSize = parseInt(cssResponse.headers()['content-length'] || '0', 10);
        expect(cssSize).toBeLessThan(50 * 1024);
        
        // Check JS bundle size
        const jsResponse = await page.request.get('/js/fnf-core.js');
        const jsSize = parseInt(jsResponse.headers()['content-length'] || '0', 10);
        expect(jsSize).toBeLessThan(75 * 1024);
    });
});
```

---

This comprehensive performance optimization guide provides the framework for maintaining excellent performance across the Food-N-Force website, with specific targets, monitoring systems, and optimization techniques that ensure fast, responsive user experiences while maintaining SLDS compliance and accessibility standards.