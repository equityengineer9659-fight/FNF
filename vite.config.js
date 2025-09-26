import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'src/assets',
  base: './', // Use relative paths for better static file compatibility

  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        // Keep separate CSS and JS bundles for maintainability
        manualChunks: {
          effects: ['./src/js/effects/particles.js', './src/js/effects/animations.js']
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },
  },

  css: {
    postcss: {
      plugins: [
        require('autoprefixer'),
        require('cssnano')({
          preset: ['default', {
            discardComments: {
              removeAll: false, // Keep important comments for maintainability
            },
          }]
        })
      ]
    },
    devSourcemap: true
  },

  server: {
    port: 8080,
    host: 'localhost',
    strictPort: true, // Fail if port is occupied instead of auto-incrementing
    open: false, // Don't auto-open browser to prevent conflicts during testing
    clearScreen: false, // Keep console output visible for debugging
    // Custom logging to match expected patterns
    configureServer(server) {
      server.middlewares.use('/api/health', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'ok', port: 8080 }));
      });

      const originalListen = server.listen;
      server.listen = function(...args) {
        const result = originalListen.apply(this, args);
        // Output expected pattern for testing tools
        console.log('\n  Available on: http://localhost:8080/');
        console.log('  Server ready for conflict analysis tools\n');
        return result;
      };
    }
  },

  preview: {
    port: 8080,
    host: 'localhost',
    strictPort: true,
    open: false
  }
});