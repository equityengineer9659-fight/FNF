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
        // Keep separate CSS and JS bundles for maintainability
        manualChunks: {
          effects: ['./src/js/effects/particles.js'],
          echarts: ['echarts/core', 'echarts/charts', 'echarts/components', 'echarts/renderers']
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
    clearScreen: false,
    proxy: {
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
