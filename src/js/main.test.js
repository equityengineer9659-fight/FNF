/**
 * Tests for FNFApp main orchestrator
 * Tests observable side effects after module initialization.
 * Note: initializeApp() orchestration is tested indirectly via
 * integration tests (Playwright). Unit tests here cover module-level
 * behavior and DOM-based features that work in jsdom.
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('./config/environment.js', () => ({
  default: {
    features: { debugMode: false, particles: true, animations: true, newsletter: true },
    performance: { throttleMs: 1000 },
  },
}));

const initSentryMock = vi.hoisted(() => vi.fn());
vi.mock('./monitoring/sentry.js', () => ({ initSentry: initSentryMock }));
vi.mock('./monitoring/error-tracker.js', () => ({
  default: { init: vi.fn(), captureException: vi.fn(), captureError: vi.fn() },
}));
vi.mock('./monitoring/performance-monitor.js', () => ({
  default: { init: vi.fn(), mark: vi.fn(), measure: vi.fn() },
}));
vi.mock('./effects/smart-scroll.js', () => ({
  default: vi.fn(function () { return { destroy: vi.fn() }; }),
}));
vi.mock('./effects/particles.js', () => ({
  initParticles: vi.fn().mockReturnValue({ destroy: vi.fn(), setParticleCount: vi.fn() }),
}));
vi.mock('./effects/gradient-icons.js', () => ({ hydrateGradientIcons: vi.fn() }));
vi.mock('./effects/newsletter-popup.js', () => ({
  default: vi.fn(function () { return { destroy: vi.fn() }; }),
}));
vi.mock('./effects/counters.js', () => ({ initCounters: vi.fn().mockReturnValue({}) }));
vi.mock('./expertise-accordion.js', () => ({}));

// Set up DOM before import
document.body.innerHTML = '<main id="main-content"><section></section></main>';

// Import triggers constructor + registers DOMContentLoaded listener
await import('./main.js');

describe('FNFApp module-level initialization', () => {
  it('should call initSentry at module level (before DOMContentLoaded)', () => {
    expect(initSentryMock).toHaveBeenCalled();
  });
});

describe('FNFApp accessibility features', () => {
  it('should expose fnfAnnounce function on window', () => {
    expect(typeof window.fnfAnnounce).toBe('function');
  });

  it('should add keyboard-user class on Tab key', () => {
    document.body.classList.remove('fnf-keyboard-user');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(document.body.classList.contains('fnf-keyboard-user')).toBe(true);
  });

  it('should remove keyboard-user class on mousedown', () => {
    document.body.classList.add('fnf-keyboard-user');
    document.dispatchEvent(new MouseEvent('mousedown'));
    expect(document.body.classList.contains('fnf-keyboard-user')).toBe(false);
  });
});

// Navigation tests (Escape-to-close, link-click-to-close) are covered by
// Playwright in critical-navigation-smoke-test.spec.js since they depend
// on initializeApp() which requires real DOMContentLoaded.
