/**
 * Environment Configuration Module
 * Centralizes all environment-specific settings
 * @module Environment
 */

// Vite automatically replaces import.meta.env variables during build
const env = import.meta?.env || {};

// Default values for missing environment variables
const defaults = {
  ENV: 'development',
  APP_NAME: 'Food-N-Force',
  APP_VERSION: '2.0.0',
  API_URL: 'http://localhost:3000/api',
  API_TIMEOUT: 30000,
  SENTRY_DSN: '',
  GA_MEASUREMENT_ID: '',
  LOGROCKET_APP_ID: '',
  FEATURE_NEWSLETTER: true,
  FEATURE_PARTICLES: true,
  FEATURE_ANIMATIONS: true,
  FEATURE_DEBUG_MODE: true,
  PERFORMANCE_SAMPLE_RATE: 1.0,
  ERROR_THROTTLE_MS: 1000,
  MAX_PARTICLE_COUNT: 10,
  MAILCHIMP_URL: '',
  RECAPTCHA_SITE_KEY: '',
  SOURCE_MAP: true,
  MINIFY: false,
  CSP_REPORT_URI: '',
  ALLOWED_ORIGINS: 'http://localhost:8080'
};

/**
 * Get environment variable with fallback
 */
function getEnvVar(key, defaultValue) {
  const envKey = `VITE_${key}`;
  const value = env[envKey];

  // Handle boolean strings
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Handle numbers
  if (!isNaN(value) && value !== '') return Number(value);

  return value || defaultValue;
}

/**
 * Environment Configuration Object
 */
const config = {
  // Core Settings
  env: getEnvVar('ENV', defaults.ENV),
  appName: getEnvVar('APP_NAME', defaults.APP_NAME),
  appVersion: getEnvVar('APP_VERSION', defaults.APP_VERSION),

  // API Configuration
  api: {
    url: getEnvVar('API_URL', defaults.API_URL),
    timeout: getEnvVar('API_TIMEOUT', defaults.API_TIMEOUT)
  },

  // Monitoring Services
  monitoring: {
    sentry: {
      dsn: getEnvVar('SENTRY_DSN', defaults.SENTRY_DSN),
      enabled: !!getEnvVar('SENTRY_DSN', defaults.SENTRY_DSN)
    },
    ga: {
      measurementId: getEnvVar('GA_MEASUREMENT_ID', defaults.GA_MEASUREMENT_ID),
      enabled: !!getEnvVar('GA_MEASUREMENT_ID', defaults.GA_MEASUREMENT_ID)
    },
    logRocket: {
      appId: getEnvVar('LOGROCKET_APP_ID', defaults.LOGROCKET_APP_ID),
      enabled: !!getEnvVar('LOGROCKET_APP_ID', defaults.LOGROCKET_APP_ID)
    }
  },

  // Feature Flags
  features: {
    newsletter: getEnvVar('FEATURE_NEWSLETTER', defaults.FEATURE_NEWSLETTER),
    particles: getEnvVar('FEATURE_PARTICLES', defaults.FEATURE_PARTICLES),
    animations: getEnvVar('FEATURE_ANIMATIONS', defaults.FEATURE_ANIMATIONS),
    debugMode: getEnvVar('FEATURE_DEBUG_MODE', defaults.FEATURE_DEBUG_MODE)
  },

  // Performance Settings
  performance: {
    sampleRate: getEnvVar('PERFORMANCE_SAMPLE_RATE', defaults.PERFORMANCE_SAMPLE_RATE),
    errorThrottleMs: getEnvVar('ERROR_THROTTLE_MS', defaults.ERROR_THROTTLE_MS),
    maxParticleCount: getEnvVar('MAX_PARTICLE_COUNT', defaults.MAX_PARTICLE_COUNT)
  },

  // Third-party Services
  services: {
    mailchimp: {
      url: getEnvVar('MAILCHIMP_URL', defaults.MAILCHIMP_URL),
      enabled: !!getEnvVar('MAILCHIMP_URL', defaults.MAILCHIMP_URL)
    },
    recaptcha: {
      siteKey: getEnvVar('RECAPTCHA_SITE_KEY', defaults.RECAPTCHA_SITE_KEY),
      enabled: !!getEnvVar('RECAPTCHA_SITE_KEY', defaults.RECAPTCHA_SITE_KEY)
    }
  },

  // Build Settings
  build: {
    sourceMap: getEnvVar('SOURCE_MAP', defaults.SOURCE_MAP),
    minify: getEnvVar('MINIFY', defaults.MINIFY)
  },

  // Security
  security: {
    cspReportUri: getEnvVar('CSP_REPORT_URI', defaults.CSP_REPORT_URI),
    allowedOrigins: getEnvVar('ALLOWED_ORIGINS', defaults.ALLOWED_ORIGINS).split(',')
  }
};

/**
 * Environment detection helpers
 */
config.isDevelopment = config.env === 'development';
config.isStaging = config.env === 'staging';
config.isProduction = config.env === 'production';
config.isTest = config.env === 'test';

/**
 * Debug logging helper
 */
config.log = function(...args) {
  if (config.features.debugMode) {
    console.log(`[${config.env}]`, ...args);
  }
};

/**
 * Validate required configuration
 */
config.validate = function() {
  const errors = [];

  // Check required production settings
  if (config.isProduction) {
    if (!config.monitoring.sentry.dsn) {
      console.warn('⚠️ Sentry DSN not configured for production');
    }
    if (!config.monitoring.ga.measurementId) {
      console.warn('⚠️ Google Analytics not configured for production');
    }
    if (config.features.debugMode) {
      console.warn('⚠️ Debug mode is enabled in production!');
    }
  }

  // Check API configuration
  if (!config.api.url) {
    errors.push('API URL is not configured');
  }

  if (errors.length > 0) {
    console.error('Configuration errors:', errors);
    return false;
  }

  return true;
};

/**
 * Get configuration summary
 */
config.getSummary = function() {
  return {
    environment: config.env,
    version: config.appVersion,
    api: config.api.url,
    features: Object.entries(config.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => feature),
    monitoring: Object.entries(config.monitoring)
      .filter(([_, service]) => service.enabled)
      .map(([service]) => service),
    performance: {
      sampleRate: `${config.performance.sampleRate * 100}%`,
      maxParticles: config.performance.maxParticleCount
    }
  };
};

// Log configuration in development
if (config.isDevelopment && config.features.debugMode) {
  console.group('🔧 Environment Configuration');
  console.log('Environment:', config.env);
  console.log('Version:', config.appVersion);
  console.log('Features:', config.features);
  console.log('API:', config.api.url);
  console.groupEnd();
}

// Validate configuration
config.validate();

// Freeze configuration to prevent modifications
Object.freeze(config);
Object.freeze(config.api);
Object.freeze(config.monitoring);
Object.freeze(config.features);
Object.freeze(config.performance);
Object.freeze(config.services);
Object.freeze(config.build);
Object.freeze(config.security);

export default config;