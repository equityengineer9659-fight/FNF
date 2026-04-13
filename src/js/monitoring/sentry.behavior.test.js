/**
 * @fileoverview Behavioral tests for sentry.js — exercises initSentry() happy
 * path, DSN-missing skip, non-production skip, and the public capture helpers.
 *
 * PR 10 / P1-20: raise sentry.js coverage from 0% → covered.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ---- Mocks ------------------------------------------------------------------

// Sentry shim — replaces @sentry/browser lazy-loaded import path
const shimInit = vi.fn();
const shimSetUser = vi.fn();
const shimSetTag = vi.fn();
const shimCaptureException = vi.fn();
const shimCaptureMessage = vi.fn();
const shimAddBreadcrumb = vi.fn();

vi.mock('./sentry-shim.js', () => ({
  init: shimInit,
  setUser: shimSetUser,
  setTag: shimSetTag,
  captureException: shimCaptureException,
  captureMessage: shimCaptureMessage,
  addBreadcrumb: shimAddBreadcrumb,
  globalHandlersIntegration: vi.fn(() => 'globalHandlers'),
  linkedErrorsIntegration: vi.fn(() => 'linkedErrors'),
  dedupeIntegration: vi.fn(() => 'dedupe'),
  inboundFiltersIntegration: vi.fn(() => 'inboundFilters'),
}));

async function loadModule({ dsn = '', env = 'development' } = {}) {
  vi.resetModules();
  // Stub import.meta.env by overriding the env the module reads
  vi.stubEnv('VITE_SENTRY_DSN', dsn);
  vi.stubEnv('VITE_ENV', env);
  return import('./sentry.js');
}

// ---- Tests ------------------------------------------------------------------

describe('sentry.js — behavioral initSentry()', () => {
  beforeEach(() => {
    shimInit.mockClear();
    shimSetUser.mockClear();
    shimSetTag.mockClear();
    shimCaptureException.mockClear();
    shimCaptureMessage.mockClear();
    shimAddBreadcrumb.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('skips init when DSN is missing', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { initSentry } = await loadModule({ dsn: '', env: 'production' });
    await initSentry();

    expect(shimInit).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('DSN not configured'));
  });

  it('skips init when VITE_ENV is not production', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { initSentry } = await loadModule({ dsn: 'https://abc@host/1', env: 'development' });
    await initSentry();

    expect(shimInit).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Not in production'));
  });

  it('happy path: initializes shim with dsn, environment, integrations, tags', async () => {
    const { initSentry } = await loadModule({ dsn: 'https://abc@host/1', env: 'production' });
    await initSentry();

    expect(shimInit).toHaveBeenCalledTimes(1);
    const cfg = shimInit.mock.calls[0][0];
    expect(cfg.dsn).toBe('https://abc@host/1');
    expect(cfg.environment).toBe('production');
    expect(cfg.sendDefaultPii).toBe(false);
    expect(Array.isArray(cfg.integrations)).toBe(true);
    expect(cfg.integrations.length).toBe(4);
    expect(typeof cfg.beforeSend).toBe('function');
    expect(typeof cfg.beforeBreadcrumb).toBe('function');

    expect(shimSetUser).toHaveBeenCalledWith({ id: 'anonymous' });
    expect(shimSetTag).toHaveBeenCalledWith('website', 'food-n-force');
    expect(shimSetTag).toHaveBeenCalledWith('version', '2.0.0');
  });

  it('happy path: beforeSend drops events from browser extensions', async () => {
    const { initSentry } = await loadModule({ dsn: 'https://abc@host/1', env: 'production' });
    await initSentry();
    const cfg = shimInit.mock.calls[0][0];

    const extensionHint = { originalException: { stack: 'at chrome-extension://abcdef/content.js:1' } };
    expect(cfg.beforeSend({ event: 'ext' }, extensionHint)).toBeNull();

    const firefoxHint = { originalException: { stack: 'at moz-extension://xyz/mod.js:1' } };
    expect(cfg.beforeSend({ event: 'ext-ff' }, firefoxHint)).toBeNull();

    const normalHint = { originalException: { stack: 'at /src/app.js:42' } };
    expect(cfg.beforeSend({ event: 'normal' }, normalHint)).toEqual({ event: 'normal' });
  });

  it('happy path: beforeBreadcrumb drops console log breadcrumbs', async () => {
    const { initSentry } = await loadModule({ dsn: 'https://abc@host/1', env: 'production' });
    await initSentry();
    const cfg = shimInit.mock.calls[0][0];

    expect(cfg.beforeBreadcrumb({ category: 'console', level: 'log', message: 'noise' })).toBeNull();
    const kept = cfg.beforeBreadcrumb({ category: 'nav', level: 'info', message: 'keep' });
    expect(kept).toEqual({ category: 'nav', level: 'info', message: 'keep' });
  });

  it('captureException / captureMessage / addBreadcrumb are no-ops before init', async () => {
    const { captureException, captureMessage, addBreadcrumb } = await loadModule({ dsn: '', env: 'production' });

    // Module loaded but initSentry() never ran → _sentry is still null
    expect(() => captureException(new Error('boom'))).not.toThrow();
    expect(() => captureMessage('hello')).not.toThrow();
    expect(() => addBreadcrumb('crumb')).not.toThrow();

    expect(shimCaptureException).not.toHaveBeenCalled();
    expect(shimCaptureMessage).not.toHaveBeenCalled();
    expect(shimAddBreadcrumb).not.toHaveBeenCalled();
  });

  it('captureException / captureMessage / addBreadcrumb forward to shim after init', async () => {
    const { initSentry, captureException, captureMessage, addBreadcrumb } = await loadModule({
      dsn: 'https://abc@host/1', env: 'production',
    });
    await initSentry();

    const err = new Error('boom');
    captureException(err, { user: 'test' });
    expect(shimCaptureException).toHaveBeenCalledWith(err, {
      contexts: { custom: { user: 'test' } },
    });

    captureMessage('hello', 'warning');
    expect(shimCaptureMessage).toHaveBeenCalledWith('hello', 'warning');

    addBreadcrumb('nav', { path: '/home' });
    expect(shimAddBreadcrumb).toHaveBeenCalledWith({
      message: 'nav',
      data: { path: '/home' },
      level: 'info',
    });
  });

  it('swallows shim.init throwing and logs to console.error', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    shimInit.mockImplementationOnce(() => { throw new Error('init failed'); });

    const { initSentry, captureException } = await loadModule({ dsn: 'https://abc@host/1', env: 'production' });
    await initSentry();

    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Sentry] Failed to initialize'),
      expect.any(Error),
    );
    // captureException after failed init stays a no-op
    captureException(new Error('post'));
    expect(shimCaptureException).not.toHaveBeenCalled();
  });
});
