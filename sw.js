/**
 * Food-N-Force Service Worker - Phase 2 Performance
 * Caching strategy for improved performance and offline experience
 * Target: 90% cache hit rate, <100ms cached resource delivery
 */

const CACHE_NAME = 'fnf-v2-performance';
const CACHE_VERSION = '2.0.0';

// Critical assets to cache immediately
const CRITICAL_ASSETS = [
    '/',
    '/index.html',
    '/index-optimized.html',
    '/css/critical.css',
    '/css/navigation-unified.css',
    '/css/responsive-enhancements.css',
    '/js/core/critical.js',
    '/js/core/enhanced.js',
    '/js/mobile-navigation-simple.js'
];

// Runtime cache patterns
const RUNTIME_CACHE_PATTERNS = {
    // Cache HTML pages
    pages: /\.html$/,
    // Cache CSS files
    styles: /\.css$/,
    // Cache JavaScript files
    scripts: /\.js$/,
    // Cache images
    images: /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
    // Cache fonts
    fonts: /\.(woff|woff2|ttf|eot)$/
};

// External resources to cache
const EXTERNAL_RESOURCES = [
    'https://cdnjs.cloudflare.com/ajax/libs/design-system/2.22.2/styles/salesforce-lightning-design-system.min.css',
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap'
];

/**
 * Service Worker Installation
 * Pre-cache critical assets for immediate availability
 */
self.addEventListener('install', function(event) {
    console.log('💾 Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('📦 Caching critical assets');
                
                // Cache critical assets
                const cachePromises = CRITICAL_ASSETS.map(function(url) {
                    return cache.add(url).catch(function(error) {
                        console.warn('⚠️ Failed to cache:', url, error);
                    });
                });
                
                // Cache external resources
                const externalPromises = EXTERNAL_RESOURCES.map(function(url) {
                    return cache.add(url).catch(function(error) {
                        console.warn('⚠️ Failed to cache external:', url, error);
                    });
                });
                
                return Promise.all([...cachePromises, ...externalPromises]);
            })
            .then(function() {
                console.log('✅ Critical assets cached');
                // Skip waiting to activate immediately
                self.skipWaiting();
            })
            .catch(function(error) {
                console.error('❌ Cache installation failed:', error);
            })
    );
});

/**
 * Service Worker Activation
 * Clean up old caches and take control
 */
self.addEventListener('activate', function(event) {
    console.log('🔄 Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then(function(cacheNames) {
                // Delete old caches
                const deletePromises = cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME && cacheName.startsWith('fnf-')) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                });
                
                return Promise.all(deletePromises);
            })
            .then(function() {
                console.log('✅ Service Worker activated');
                // Take control of all pages immediately
                return self.clients.claim();
            })
    );
});

/**
 * Fetch Event Handler
 * Implement caching strategies for different resource types
 */
self.addEventListener('fetch', function(event) {
    const request = event.request;
    const url = new URL(request.url);
    
    // Only handle GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        getCachedResponse(request)
    );
});

/**
 * Get cached response with appropriate strategy
 */
async function getCachedResponse(request) {
    const url = new URL(request.url);
    const isExternal = url.origin !== location.origin;
    
    try {
        // Strategy 1: Critical assets - Cache First (immediate response)
        if (CRITICAL_ASSETS.some(asset => request.url.endsWith(asset))) {
            return cacheFirst(request);
        }
        
        // Strategy 2: HTML pages - Network First (fresh content preferred)
        if (RUNTIME_CACHE_PATTERNS.pages.test(url.pathname)) {
            return networkFirst(request);
        }
        
        // Strategy 3: Static assets - Cache First (performance)
        if (RUNTIME_CACHE_PATTERNS.styles.test(url.pathname) ||
            RUNTIME_CACHE_PATTERNS.scripts.test(url.pathname) ||
            RUNTIME_CACHE_PATTERNS.images.test(url.pathname) ||
            RUNTIME_CACHE_PATTERNS.fonts.test(url.pathname)) {
            return cacheFirst(request);
        }
        
        // Strategy 4: External resources - Stale While Revalidate
        if (isExternal) {
            return staleWhileRevalidate(request);
        }
        
        // Default: Network first for other requests
        return networkFirst(request);
        
    } catch (error) {
        console.error('❌ Fetch error:', error);
        return fetch(request);
    }
}

/**
 * Cache First Strategy
 * Best for static assets that rarely change
 */
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
        // Return cached version immediately
        return cached;
    }
    
    // If not in cache, fetch and cache
    try {
        const response = await fetch(request);
        
        if (response.ok) {
            // Cache successful responses
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.warn('⚠️ Network failed for:', request.url);
        throw error;
    }
}

/**
 * Network First Strategy
 * Best for dynamic content like HTML pages
 */
async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    
    try {
        // Try network first
        const response = await fetch(request);
        
        if (response.ok) {
            // Cache successful responses
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        // Fall back to cache if network fails
        const cached = await cache.match(request);
        
        if (cached) {
            console.log('📱 Serving from cache (offline):', request.url);
            return cached;
        }
        
        // No cache available, re-throw error
        throw error;
    }
}

/**
 * Stale While Revalidate Strategy
 * Best for external resources - serve cached, update in background
 */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    // Fetch in background (don't await)
    const fetchPromise = fetch(request)
        .then(function(response) {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(function(error) {
            console.warn('⚠️ Background fetch failed:', request.url, error);
        });
    
    // Return cached version if available, otherwise wait for network
    if (cached) {
        return cached;
    }
    
    return fetchPromise;
}

/**
 * Performance Monitoring
 * Track cache performance for optimization
 */
self.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'GET_CACHE_STATS') {
        getCacheStats().then(function(stats) {
            event.ports[0].postMessage(stats);
        });
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(function() {
            event.ports[0].postMessage({ success: true });
        });
    }
});

/**
 * Get cache statistics for monitoring
 */
async function getCacheStats() {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    
    const stats = {
        cacheSize: requests.length,
        cacheName: CACHE_NAME,
        version: CACHE_VERSION,
        critical: CRITICAL_ASSETS.length,
        timestamp: Date.now()
    };
    
    return stats;
}

/**
 * Error Handling
 */
self.addEventListener('error', function(event) {
    console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', function(event) {
    console.error('❌ Unhandled promise rejection:', event.reason);
});

console.log('🚀 Service Worker initialized - Version:', CACHE_VERSION);