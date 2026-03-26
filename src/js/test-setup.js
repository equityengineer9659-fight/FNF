/**
 * Vitest Setup File
 * Runs before all tests to configure the test environment
 */

import { expect, afterEach, vi } from 'vitest';

// Extend expect with custom matchers if needed
expect.extend({
  toBeInDocument(received) {
    const pass = document.body.contains(received);
    return {
      pass,
      message: () =>
        pass
          ? 'expected element not to be in the document'
          : 'expected element to be in the document',
    };
  },
});

// Cleanup after each test
afterEach(() => {
  // Manual DOM cleanup instead of @testing-library/dom
  document.body.innerHTML = '';
  document.head.innerHTML = '';

  vi.clearAllMocks();

  // Reset localStorage
  localStorage.clear();

  // Reset sessionStorage
  sessionStorage.clear();
});

// Mock window.matchMedia (used by responsive utilities)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver (used by lazy loading)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() { return []; }
  unobserve() {}
};

// Mock console methods to reduce noise in tests (optional)
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
};
