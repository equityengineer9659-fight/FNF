import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/js/test-setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/js/test-setup.js',
        'dist/',
        'tools/',
        '*.config.js',
        'scripts/',
        'src/js/expertise-accordion.js',
        'src/js/monitoring/sentry-shim.js'
      ],
      include: ['src/js/**/*.js'],
      all: true,
      thresholds: {
        lines: 48,
        functions: 47,
        branches: 30,
        statements: 46
      }
    },
    include: ['src/**/*.{test,spec}.{js,mjs,cjs}'],
    exclude: ['node_modules', 'dist', 'cypress', 'playwright-report'],
    testTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@js': resolve(__dirname, './src/js'),
      '@css': resolve(__dirname, './src/css'),
      '@assets': resolve(__dirname, './src/assets')
    }
  }
});
