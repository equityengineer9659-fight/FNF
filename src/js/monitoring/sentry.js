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
    console.warn('[Sentry] DSN not configured, skipping initialization');
    return;
  }

  if (!isProduction) {
    console.warn('[Sentry] Not in production environment, skipping initialization');
    return;
  }

  try {
    // Import via shim for tree-shaking — only re-exported APIs are bundled
    const {
      init, setUser, setTag,
      captureException: _captureException,
      captureMessage: _captureMessage,
      addBreadcrumb: _addBreadcrumb,
      globalHandlersIntegration, linkedErrorsIntegration,
      dedupeIntegration, inboundFiltersIntegration
    } = await import('./sentry-shim.js');

    init({
      dsn,
      environment,
      sendDefaultPii: false,

      // Only load integrations we actually need — skip BrowserApiErrors,
      // Breadcrumbs, FunctionToString, HttpContext to reduce bundle
      integrations: [
        globalHandlersIntegration(),
        linkedErrorsIntegration(),
        dedupeIntegration(),
        inboundFiltersIntegration()
      ],

      beforeSend(event, hint) {
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

      beforeBreadcrumb(breadcrumb) {
        if (breadcrumb.category === 'console' && breadcrumb.level === 'log') {
          return null;
        }
        return breadcrumb;
      },
    });

    // ip_address intentionally omitted — sendDefaultPii: false enforces no IP collection
    setUser({ id: 'anonymous' });
    setTag('website', 'food-n-force');
    setTag('version', '2.0.0');

    _sentry = { captureException: _captureException, captureMessage: _captureMessage, addBreadcrumb: _addBreadcrumb };

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
