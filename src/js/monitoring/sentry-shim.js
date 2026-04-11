/**
 * Sentry tree-shaking shim — re-exports only the APIs we use.
 * Dynamic import of this file (instead of @sentry/browser directly) lets
 * Vite/Rollup tree-shake unused Sentry internals from the async chunk.
 */
export {
  init, setUser, setTag,
  captureException, captureMessage, addBreadcrumb,
  globalHandlersIntegration, linkedErrorsIntegration,
  dedupeIntegration, inboundFiltersIntegration
} from '@sentry/browser';
