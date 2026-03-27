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
        contact: resolve(__dirname, 'contact.html'),
        blog: resolve(__dirname, 'blog.html'),
        articleAiFoodBanks: resolve(__dirname, 'ai-reshaping-food-banks.html'),
        articleSalesforce: resolve(__dirname, 'salesforce-food-bank-operations.html'),
        articleDonor: resolve(__dirname, 'donor-relationships-nonprofit-cloud.html'),
        articleDataDriven: resolve(__dirname, 'data-driven-food-banks.html'),
        articleWorkflow: resolve(__dirname, 'food-bank-workflow-automation.html'),
        articleGrants: resolve(__dirname, 'securing-technology-grants.html'),
        articleAiInventory: resolve(__dirname, 'ai-inventory-management.html'),
        caseStudies: resolve(__dirname, 'case-studies.html'),
        templatesTools: resolve(__dirname, 'templates-tools.html'),
        notfound: resolve(__dirname, '404.html')
      },
      output: {
        // Keep separate CSS and JS bundles for maintainability
        manualChunks: {
          effects: ['./src/js/effects/particles.js']
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
    port: 4173,
    host: 'localhost',
    strictPort: true,
    open: false
  }
});