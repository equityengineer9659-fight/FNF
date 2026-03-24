import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'url';
import autoprefixer from 'autoprefixer';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: './', // Use relative paths for better static file compatibility

  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        services: resolve(__dirname, 'services.html'),
        resources: resolve(__dirname, 'resources.html'),
        impact: resolve(__dirname, 'impact.html'),
        contact: resolve(__dirname, 'contact.html')
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
        autoprefixer()
      ]
    },
    devSourcemap: true
  },

  server: {
    port: 4173,
    host: 'localhost',
    strictPort: true,
    open: false,
    clearScreen: false
  },

  preview: {
    port: 4174,
    host: 'localhost',
    strictPort: true,
    open: false
  }
});