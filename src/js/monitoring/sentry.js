/**
 * Sentry Error Monitoring Integration
 * Initializes Sentry for production error tracking
 */

let _sentry = null;

/**
 * Initialize Sentry error monitoring
 * Only runs in production environment with valid DSN
 */
export async function initSentry() {
  // Get configuration from environment variables (guard for non-Vite environments)
  const env = import.meta.env || {};
  const dsn = env.VITE_SENTRY_DSN;
  const environment = env.VITE_ENV || 'development';
  const isProduction = environment === 'production';

  // Only initialize if DSN is configured and we're in production
  if (!dsn) {
    console.log('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  if (!isProduction) {
    console.log('[Sentry] Not in production environment, skipping initialization');
    return;
  }

  try {
    // Dynamic import to avoid issues in development
    const Sentry = await import('@sentry/browser');

    Sentry.init({
      dsn,
      environment,

      // Setting this option to true will send default PII data to Sentry
      // (like IP addresses for geolocation)
      sendDefaultPii: false,

      // Set sample rate for performance monitoring (10% of transactions)
      tracesSampleRate: 0.1,

      // Session Replay sample rate (10% of sessions)
      replaysSessionSampleRate: 0.1,
      // Session Replay on error (100% of sessions with errors)
      replaysOnErrorSampleRate: 1.0,

      // Filter out errors from browser extensions
      beforeSend(event, hint) {
        // Filter out errors from browser extensions
        const error = hint.originalException;
        if (
          error &&
          error.stack &&
          (error.stack.includes('chrome-extension://') ||
            error.stack.includes('moz-extension://'))
        ) {
          return null;
        }

        return event;
      },

      // Add custom context
      beforeBreadcrumb(breadcrumb) {
        // Don't capture console.log breadcrumbs
        if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
          return null;
        }
        return breadcrumb;
      },
    });

    console.log('[Sentry] Error monitoring initialized successfully');

    // Set user context (anonymous by default)
    Sentry.setUser({
      id: 'anonymous',
      ip_address: '{{auto}}', // Let Sentry auto-detect IP
    });

    // Set global tags
    Sentry.setTag('website', 'food-n-force');
    Sentry.setTag('version', '2.0.0');

    _sentry = Sentry;

  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Manually capture an exception
 * @param {Error} error - Error to capture
 * @param {Object} context - Additional context
 */
export function captureException(error, context = {}) {
  if (_sentry) {
    _sentry.captureException(error, {
      contexts: { custom: context }
    });
  }
}

/**
 * Manually capture a message
 * @param {string} message - Message to capture
 * @param {string} level - Severity level (info, warning, error)
 */
export function captureMessage(message, level = 'info') {
  if (_sentry) {
    _sentry.captureMessage(message, level);
  }
}

/**
 * Add breadcrumb for debugging
 * @param {string} message - Breadcrumb message
 * @param {Object} data - Additional data
 */
export function addBreadcrumb(message, data = {}) {
  if (_sentry) {
    _sentry.addBreadcrumb({
      message,
      data,
      level: 'info',
    });
  }
}
