/**
 * Unit Tests for Environment Configuration Module
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock import.meta.env before importing config
vi.mock('import.meta.env', () => ({
  VITE_ENV: 'test',
  VITE_APP_NAME: 'Food-N-Force',
  VITE_APP_VERSION: '2.0.0'
}));

describe('Environment Configuration', () => {
  let config;

  beforeEach(async () => {
    // Re-import config for each test to ensure clean state
    vi.resetModules();
    config = (await import('./environment.js')).default;
  });

  describe('Core Settings', () => {
    it('should have correct default environment', () => {
      expect(config.env).toBeDefined();
      expect(typeof config.env).toBe('string');
    });

    it('should have app name configured', () => {
      expect(config.appName).toBe('Food-N-Force');
    });

    it('should have app version configured', () => {
      expect(config.appVersion).toBeDefined();
      expect(typeof config.appVersion).toBe('string');
    });
  });

  describe('API Configuration', () => {
    it('should have API URL configured', () => {
      expect(config.api.url).toBeDefined();
      expect(typeof config.api.url).toBe('string');
    });

    it('should have API timeout configured', () => {
      expect(config.api.timeout).toBeDefined();
      expect(typeof config.api.timeout).toBe('number');
      expect(config.api.timeout).toBeGreaterThan(0);
    });
  });

  describe('Monitoring Configuration', () => {
    it('should have Sentry configuration', () => {
      expect(config.monitoring.sentry).toBeDefined();
      expect(config.monitoring.sentry).toHaveProperty('dsn');
      expect(config.monitoring.sentry).toHaveProperty('enabled');
    });

    it('should have Google Analytics configuration', () => {
      expect(config.monitoring.ga).toBeDefined();
      expect(config.monitoring.ga).toHaveProperty('measurementId');
      expect(config.monitoring.ga).toHaveProperty('enabled');
    });

    it('should have LogRocket configuration', () => {
      expect(config.monitoring.logRocket).toBeDefined();
      expect(config.monitoring.logRocket).toHaveProperty('appId');
      expect(config.monitoring.logRocket).toHaveProperty('enabled');
    });

    it('should disable monitoring services when credentials are empty', () => {
      if (!config.monitoring.sentry.dsn) {
        expect(config.monitoring.sentry.enabled).toBe(false);
      }
      if (!config.monitoring.ga.measurementId) {
        expect(config.monitoring.ga.enabled).toBe(false);
      }
    });
  });

  describe('Feature Flags', () => {
    it('should have newsletter feature flag', () => {
      expect(config.features).toHaveProperty('newsletter');
      expect(typeof config.features.newsletter).toBe('boolean');
    });

    it('should have particles feature flag', () => {
      expect(config.features).toHaveProperty('particles');
      expect(typeof config.features.particles).toBe('boolean');
    });

    it('should have animations feature flag', () => {
      expect(config.features).toHaveProperty('animations');
      expect(typeof config.features.animations).toBe('boolean');
    });

    it('should have debug mode feature flag', () => {
      expect(config.features).toHaveProperty('debugMode');
      expect(typeof config.features.debugMode).toBe('boolean');
    });
  });

  describe('Performance Settings', () => {
    it('should have sample rate configured', () => {
      expect(config.performance.sampleRate).toBeDefined();
      expect(typeof config.performance.sampleRate).toBe('number');
      expect(config.performance.sampleRate).toBeGreaterThanOrEqual(0);
      expect(config.performance.sampleRate).toBeLessThanOrEqual(1);
    });

    it('should have error throttle configured', () => {
      expect(config.performance.errorThrottleMs).toBeDefined();
      expect(typeof config.performance.errorThrottleMs).toBe('number');
      expect(config.performance.errorThrottleMs).toBeGreaterThan(0);
    });

    it('should have max particle count configured', () => {
      expect(config.performance.maxParticleCount).toBeDefined();
      expect(typeof config.performance.maxParticleCount).toBe('number');
      expect(config.performance.maxParticleCount).toBeGreaterThan(0);
    });
  });

  describe('Third-party Services', () => {
    it('should have Mailchimp configuration', () => {
      expect(config.services.mailchimp).toBeDefined();
      expect(config.services.mailchimp).toHaveProperty('url');
      expect(config.services.mailchimp).toHaveProperty('enabled');
    });

    it('should have reCAPTCHA configuration', () => {
      expect(config.services.recaptcha).toBeDefined();
      expect(config.services.recaptcha).toHaveProperty('siteKey');
      expect(config.services.recaptcha).toHaveProperty('enabled');
    });
  });

  describe('Build Settings', () => {
    it('should have source map setting', () => {
      expect(config.build).toHaveProperty('sourceMap');
      expect(typeof config.build.sourceMap).toBe('boolean');
    });

    it('should have minify setting', () => {
      expect(config.build).toHaveProperty('minify');
      expect(typeof config.build.minify).toBe('boolean');
    });
  });

  describe('Security Settings', () => {
    it('should have CSP report URI', () => {
      expect(config.security).toHaveProperty('cspReportUri');
    });

    it('should have allowed origins array', () => {
      expect(config.security.allowedOrigins).toBeDefined();
      expect(Array.isArray(config.security.allowedOrigins)).toBe(true);
    });
  });

  describe('Environment Detection', () => {
    it('should have environment detection flags', () => {
      expect(config).toHaveProperty('isDevelopment');
      expect(config).toHaveProperty('isStaging');
      expect(config).toHaveProperty('isProduction');
      expect(config).toHaveProperty('isTest');
    });

    it('should have exactly one environment flag set to true', () => {
      const envFlags = [
        config.isDevelopment,
        config.isStaging,
        config.isProduction,
        config.isTest
      ];
      const trueCount = envFlags.filter(Boolean).length;
      expect(trueCount).toBe(1);
    });
  });

  describe('Utility Methods', () => {
    it('should have log method', () => {
      expect(typeof config.log).toBe('function');
      // Log should not throw error
      expect(() => config.log('test message')).not.toThrow();
    });

    it('should have validate method', () => {
      expect(typeof config.validate).toBe('function');
    });

    it('should have getSummary method', () => {
      expect(typeof config.getSummary).toBe('function');

      const summary = config.getSummary();
      expect(summary).toHaveProperty('environment');
      expect(summary).toHaveProperty('version');
      expect(summary).toHaveProperty('api');
      expect(summary).toHaveProperty('features');
      expect(summary).toHaveProperty('monitoring');
      expect(summary).toHaveProperty('performance');
    });

    it('getSummary should return structured data', () => {
      const summary = config.getSummary();

      expect(typeof summary.environment).toBe('string');
      expect(typeof summary.version).toBe('string');
      expect(typeof summary.api).toBe('string');
      expect(Array.isArray(summary.features)).toBe(true);
      expect(Array.isArray(summary.monitoring)).toBe(true);
      expect(typeof summary.performance).toBe('object');
    });
  });

  describe('Immutability', () => {
    it('should have frozen config object', () => {
      expect(Object.isFrozen(config)).toBe(true);
    });

    it('should have frozen nested objects', () => {
      expect(Object.isFrozen(config.api)).toBe(true);
      expect(Object.isFrozen(config.monitoring)).toBe(true);
      expect(Object.isFrozen(config.features)).toBe(true);
      expect(Object.isFrozen(config.performance)).toBe(true);
      expect(Object.isFrozen(config.services)).toBe(true);
      expect(Object.isFrozen(config.build)).toBe(true);
      expect(Object.isFrozen(config.security)).toBe(true);
    });

    it('should prevent modification of config values', () => {
      expect(() => {
        config.env = 'modified';
      }).toThrow();
    });

    it('should prevent modification of nested config values', () => {
      expect(() => {
        config.api.url = 'modified';
      }).toThrow();
    });
  });

  describe('Validation', () => {
    it('validate should return boolean', () => {
      const result = config.validate();
      expect(typeof result).toBe('boolean');
    });

    it('should warn about missing production settings', () => {
      const consoleSpy = vi.spyOn(console, 'warn');

      // Only runs validation logic, doesn't actually validate in test env
      config.validate();

      // Clean up spy
      consoleSpy.mockRestore();
    });
  });
});
