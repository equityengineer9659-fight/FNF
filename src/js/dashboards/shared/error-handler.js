/**
 * @fileoverview Shared dashboard error handler.
 * Replaces empty `catch {}` blocks in dashboard modules with a visible,
 * logged error state so users can tell "broken" from "still loading".
 */

import errorTracker from '../../monitoring/error-tracker.js';

const DEFAULT_MESSAGE = 'Data unavailable. Please refresh to try again.';

/**
 * @typedef {Object} ChartLike
 * @property {() => void} [hideLoading]
 * @property {(opt: object, notMerge?: boolean) => void} [setOption]
 * @property {() => boolean} [isDisposed]
 */

/**
 * @typedef {Object} ErrorOptions
 * @property {string} context              required — short id like "food-access-county"
 * @property {string} [message]            user-facing message
 * @property {string} [insightSelector]    DOM element to update with the message
 */

/**
 * Handle a dashboard render/fetch failure visibly.
 * - Hides the chart's loading spinner
 * - Renders an ECharts graphic overlay with the error message
 * - Updates a related insight DOM element if requested
 * - Reports the error to the central error tracker
 *
 * @param {ChartLike|null|undefined} chart
 * @param {Error|unknown} err
 * @param {ErrorOptions} options
 */
export function handleDashboardError(chart, err, options) {
  const message = options?.message || DEFAULT_MESSAGE;
  const context = options?.context || 'dashboard';

  // Always report — even if the chart is gone we want telemetry.
  try {
    const error = err instanceof Error ? err : new Error(String(err));
    errorTracker.captureError({
      type: 'dashboard',
      context,
      message: error.message,
      stack: error.stack,
    });
  } catch {
    // Never let the error reporter itself crash the page.
  }

  // Update insight DOM element if requested.
  if (options?.insightSelector) {
    const el = document.querySelector(options.insightSelector);
    if (el) el.textContent = message;
  }

  // Bail before touching a missing or disposed chart.
  if (!chart) return;
  if (typeof chart.isDisposed === 'function' && chart.isDisposed()) return;

  if (typeof chart.hideLoading === 'function') {
    chart.hideLoading();
  }

  if (typeof chart.setOption === 'function') {
    chart.setOption({
      graphic: [
        {
          type: 'group',
          left: 'center',
          top: 'middle',
          children: [
            {
              type: 'rect',
              shape: { width: 320, height: 60, r: [8, 8, 8, 8] },
              left: 'center',
              top: 'middle',
              style: {
                fill: 'rgba(0,0,0,0.55)',
                stroke: 'rgba(255,107,53,0.7)',
                lineWidth: 1,
              },
            },
            {
              type: 'text',
              left: 'center',
              top: 'middle',
              style: {
                text: message,
                fill: '#ffffff',
                fontSize: 13,
                fontWeight: 500,
                textAlign: 'center',
              },
            },
          ],
        },
      ],
    });
  }
}
