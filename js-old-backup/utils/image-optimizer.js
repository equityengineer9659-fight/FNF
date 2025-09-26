/**
 * Food-N-Force Image Optimization Utility
 * Lazy loading, WebP support, and progressive enhancement
 * Target: 60% reduction in image payload, 40% faster loading
 */

(function() {
    'use strict';

    /**
     * Image Optimization Manager
     */
    const ImageOptimizer = {
        // Configuration
        config: {
            rootMargin: '50px 0px',
            threshold: 0.1,
            webpSupport: null,
            quality: {
                high: 85,
                medium: 70,
                low: 50
            }
        },

        // Initialize image optimization
        init: function() {
            this.detectWebPSupport()
                .then(() => {
                    this.setupLazyLoading();
                    this.optimizeExistingImages();
                    console.log('🖼️ Image optimization initialized');
                });
        },

        /**
         * Detect WebP support
         */
        detectWebPSupport: function() {
            return new Promise((resolve) => {
                if (this.config.webpSupport !== null) {
                    resolve(this.config.webpSupport);
                    return;
                }

                const webP = new Image();
                webP.onload = webP.onerror = () => {
                    this.config.webpSupport = (webP.height === 2);
                    document.documentElement.classList.add(
                        this.config.webpSupport ? 'webp' : 'no-webp'
                    );
                    resolve(this.config.webpSupport);
                };
                webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
            });
        },

        /**
         * Setup lazy loading with Intersection Observer
         */
        setupLazyLoading: function() {
            if (!('IntersectionObserver' in window)) {
                // Fallback for older browsers
                this.loadAllImages();
                return;
            }

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            }, this.config);

            // Observe all lazy images
            const lazyImages = document.querySelectorAll('img[data-src], picture[data-src]');
            lazyImages.forEach(img => observer.observe(img));

            // Store observer for later use
            window.fnfImageObserver = observer;
        },

        /**
         * Load individual image with optimization
         */
        loadImage: function(img) {
            const startTime = performance.now();

            // Handle picture elements
            if (img.tagName === 'PICTURE') {
                this.loadPicture(img);
                return;
            }

            // Handle regular images
            if (img.dataset.src) {
                const optimizedSrc = this.getOptimizedSrc(img.dataset.src, img);
                
                // Create new image for preloading
                const imageLoader = new Image();
                imageLoader.onload = () => {
                    img.src = optimizedSrc;
                    img.classList.add('loaded');
                    img.removeAttribute('data-src');
                    
                    // Log loading performance
                    const loadTime = performance.now() - startTime;
                    if (window.location.hostname === 'localhost') {
                        console.log(`📸 Image loaded in ${Math.round(loadTime)}ms:`, img.src);
                    }
                };
                imageLoader.onerror = () => {
                    // Fallback to original src
                    img.src = img.dataset.src;
                    img.classList.add('error');
                };
                imageLoader.src = optimizedSrc;
            }

            // Handle srcset
            if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
                img.removeAttribute('data-srcset');
            }
        },

        /**
         * Load picture element with WebP support
         */
        loadPicture: function(picture) {
            const sources = picture.querySelectorAll('source[data-srcset]');
            const img = picture.querySelector('img[data-src]');

            // Load sources
            sources.forEach(source => {
                if (source.dataset.srcset) {
                    source.srcset = source.dataset.srcset;
                    source.removeAttribute('data-srcset');
                }
            });

            // Load img
            if (img && img.dataset.src) {
                this.loadImage(img);
            }

            picture.classList.add('loaded');
        },

        /**
         * Get optimized image source
         */
        getOptimizedSrc: function(src, img) {
            // Check if we should use WebP
            if (this.config.webpSupport && !src.includes('.webp')) {
                const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                // In a real implementation, you'd check if WebP version exists
                // For now, return original src
                return src;
            }

            // Apply quality optimization based on image size
            if (img.dataset.quality) {
                const quality = img.dataset.quality;
                return this.addQualityParam(src, quality);
            }

            // Auto-detect quality based on image dimensions
            const width = parseInt(img.dataset.width) || img.width || 0;
            let quality = this.config.quality.medium;

            if (width > 1200) {
                quality = this.config.quality.high;
            } else if (width < 400) {
                quality = this.config.quality.low;
            }

            return this.addQualityParam(src, quality);
        },

        /**
         * Add quality parameter to image URL (for services that support it)
         */
        addQualityParam: function(src, quality) {
            // This would work with image optimization services
            // For static images, return as-is
            return src;
        },

        /**
         * Optimize existing images in the DOM
         */
        optimizeExistingImages: function() {
            const images = document.querySelectorAll('img:not([data-src])');
            
            images.forEach(img => {
                // Add loading attribute for native lazy loading
                if ('loading' in HTMLImageElement.prototype) {
                    img.loading = 'lazy';
                }

                // Add decode hint
                if ('decoding' in img) {
                    img.decoding = 'async';
                }
            });
        },

        /**
         * Fallback for browsers without Intersection Observer
         */
        loadAllImages: function() {
            const lazyImages = document.querySelectorAll('img[data-src], picture[data-src]');
            lazyImages.forEach(img => this.loadImage(img));
        },

        /**
         * Create responsive image HTML
         */
        createResponsiveImage: function(config) {
            const {
                src,
                alt = '',
                width,
                height,
                sizes = '100vw',
                quality = 'medium',
                lazy = true
            } = config;

            const img = document.createElement('img');
            img.alt = alt;
            img.width = width;
            img.height = height;
            
            if (lazy) {
                img.setAttribute('data-src', src);
                img.loading = 'lazy';
                img.classList.add('lazy-image');
            } else {
                img.src = src;
            }

            // Add quality hint
            img.setAttribute('data-quality', this.config.quality[quality]);

            return img;
        },

        /**
         * Create picture element with WebP support
         */
        createPicture: function(config) {
            const {
                src,
                webpSrc,
                alt = '',
                width,
                height,
                sizes = '100vw',
                lazy = true
            } = config;

            const picture = document.createElement('picture');
            
            // WebP source
            if (webpSrc) {
                const webpSource = document.createElement('source');
                webpSource.type = 'image/webp';
                if (lazy) {
                    webpSource.setAttribute('data-srcset', webpSrc);
                } else {
                    webpSource.srcset = webpSrc;
                }
                webpSource.sizes = sizes;
                picture.appendChild(webpSource);
            }

            // Fallback image
            const img = this.createResponsiveImage({
                src, alt, width, height, sizes, lazy
            });
            picture.appendChild(img);

            return picture;
        }
    };

    /**
     * Auto-initialize when DOM is ready
     */
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => ImageOptimizer.init());
        } else {
            ImageOptimizer.init();
        }
    }

    // Make available globally
    window.ImageOptimizer = ImageOptimizer;

    // Auto-initialize
    init();

})();