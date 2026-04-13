import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'url';
import dns from 'node:dns';
import autoprefixer from 'autoprefixer';
import { glob } from 'glob';

// Force IPv4 for outbound connections (fixes ECONNRESET on this machine)
dns.setDefaultResultOrder('ipv4first');

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Dynamically discover all HTML pages (root-level + blog/ subdirectory)
const htmlFiles = [
  ...glob.sync('*.html', { cwd: __dirname, ignore: ['node_modules/**', 'dist/**'] }),
  ...glob.sync('blog/*.html', { cwd: __dirname }),
  ...glob.sync('dashboards/*.html', { cwd: __dirname }),
];
const rollupInput = Object.fromEntries(
  htmlFiles.map(f => {
    const name = f.replace('.html', '').replace(/[\\/]/g, '_');
    return [name === 'index' ? 'main' : name, resolve(__dirname, f)];
  }),
);

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: '/', // Absolute paths required for pages in subdirectories (blog/)

  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      input: rollupInput,
      output: {
        // Function form required — Vite 8 / Rolldown removed the object form of manualChunks.
        manualChunks(id) {
          if (id.includes('src/js/effects/particles') || id.includes('src\\js\\effects\\particles')) {
            return 'effects';
          }
          if (id.includes('node_modules/echarts') || id.includes('node_modules\\echarts')) {
            return 'echarts';
          }
          if (/node_modules[\\/]d3-(hierarchy|selection|transition|scale|interpolate|format|color)/.test(id)) {
            return 'd3';
          }
        },
        assetFileNames: (assetInfo) => {
          // Vite 8 / Rolldown: assetInfo.names is an array; fall back to .name for plugin compat.
          const fileName = assetInfo.names?.[0] ?? assetInfo.name ?? '';
          const ext = fileName.split('.').pop() ?? '';
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
    clearScreen: false,
    proxy: {
      // Dashboard API proxies — forward to production PHP endpoints
      '/api/dashboard-census.php': {
        target: 'https://food-n-force.com',
        changeOrigin: true,
        secure: true
      },
      '/api/dashboard-bls.php': {
        target: 'https://food-n-force.com',
        changeOrigin: true,
        secure: true
      },
      '/api/dashboard-sdoh.php': {
        target: 'https://food-n-force.com',
        changeOrigin: true,
        secure: true
      },
      '/api/dashboard-fred.php': {
        target: 'https://food-n-force.com',
        changeOrigin: true,
        secure: true
      },
      '/api/dashboard-places.php': {
        target: 'https://food-n-force.com',
        changeOrigin: true,
        secure: true
      },
      '/api/dashboard-saipe.php': {
        target: 'https://food-n-force.com',
        changeOrigin: true,
        secure: true
      },
      '/api/mapbox-geocode.php': {
        target: 'https://food-n-force.com',
        changeOrigin: true,
        secure: true
      },
      '/api/charity-navigator.php': {
        target: 'https://food-n-force.com',
        changeOrigin: true,
        secure: true
      },
      // P2-31: Form endpoints (contact, newsletter, CSRF). Previously missing
      // so any local form interaction 404'd against the Vite dev server.
      '/api/csrf-token.php': {
        target: 'https://food-n-force.com',
        changeOrigin: true,
        secure: true
      },
      '/api/contact.php': {
        target: 'https://food-n-force.com',
        changeOrigin: true,
        secure: true
      },
      '/api/newsletter.php': {
        target: 'https://food-n-force.com',
        changeOrigin: true,
        secure: true
      },
      // Nonprofit proxies — rewrite to ProPublica API directly
      '/api/nonprofit-search.php': {
        target: 'https://projects.propublica.org',
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL(path, 'http://localhost');
          const q = url.searchParams.get('q') || '';
          const state = url.searchParams.get('state') || '';
          const page = url.searchParams.get('page') || '0';
          const params = new URLSearchParams();
          if (q) params.set('q', q);
          if (state) params.set('state[id]', state);
          params.set('page', page);
          return `/nonprofits/api/v2/search.json?${params.toString()}`;
        }
      },
      '/api/nonprofit-org.php': {
        target: 'https://projects.propublica.org',
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL(path, 'http://localhost');
          const ein = url.searchParams.get('ein') || '';
          return `/nonprofits/api/v2/organizations/${ein}.json`;
        }
      }
    }
  },

  preview: {
    port: 4173,
    host: 'localhost',
    strictPort: true,
    open: false
  }
});
