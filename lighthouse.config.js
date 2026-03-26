/**
 * Lighthouse CI Configuration
 * Performance testing setup for all 6 pages
 */

export default {
  ci: {
    collect: {
      // Test all 6 pages
      url: [
        'http://localhost:4173/',
        'http://localhost:4173/about.html',
        'http://localhost:4173/services.html',
        'http://localhost:4173/impact.html',
        'http://localhost:4173/resources.html',
        'http://localhost:4173/contact.html'
      ],
      // Use preview server instead of dev server
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:',
      startServerReadyTimeout: 30000,
      numberOfRuns: 1, // Reduced for faster testing
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1
        },
        screenEmulation: {
          mobile: false,
          width: 1920,
          height: 1080,
          deviceScaleFactor: 1,
          disabled: false
        }
      }
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Core Web Vitals
        'categories:performance': ['warn', { minScore: 0.80 }],
        'categories:accessibility': ['error', { minScore: 0.90 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.85 }],
        'categories:pwa': 'off',

        // Performance Metrics (relaxed for development)
        'first-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.15 }],
        'total-blocking-time': ['warn', { maxNumericValue: 500 }],
        'speed-index': ['warn', { maxNumericValue: 4000 }],
        'interactive': ['warn', { maxNumericValue: 5000 }],

        // Critical Accessibility
        'color-contrast': 'error',
        'heading-order': 'warn',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'meta-description': 'warn',
        'meta-viewport': 'error',
        'document-title': 'error',

        // Best Practices
        'charset': 'error',
        'crawlable-anchors': 'warn',
        'font-display': 'warn',
        'uses-responsive-images': 'warn',
        'efficient-animated-content': 'warn',
        'unused-css-rules': 'off', // Too noisy
        'uses-text-compression': 'warn',
        'render-blocking-resources': 'off' // Expected with our CSS
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-reports',
      reportFilenamePattern: '%%PATHNAME%%-%%DATETIME%%-report.%%EXTENSION%%'
    }
  }
};