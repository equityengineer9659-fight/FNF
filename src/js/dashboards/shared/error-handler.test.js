import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../monitoring/error-tracker.js', () => ({
  default: { captureError: vi.fn() },
}));

import errorTracker from '../../monitoring/error-tracker.js';
import { handleDashboardError } from './error-handler.js';

function makeChart() {
  return {
    hideLoading: vi.fn(),
    setOption: vi.fn(),
    isDisposed: vi.fn(() => false),
  };
}

describe('handleDashboardError', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('calls hideLoading on the chart', () => {
    const chart = makeChart();
    handleDashboardError(chart, new Error('boom'), { context: 'test-ctx' });
    expect(chart.hideLoading).toHaveBeenCalledTimes(1);
  });

  it('renders an ECharts graphic overlay with the error message', () => {
    const chart = makeChart();
    handleDashboardError(chart, new Error('network'), {
      context: 'food-access-county',
      message: 'Data unavailable. Please retry.',
    });
    expect(chart.setOption).toHaveBeenCalledTimes(1);
    const opt = chart.setOption.mock.calls[0][0];
    expect(opt).toHaveProperty('graphic');
    const overlay = JSON.stringify(opt.graphic);
    expect(overlay).toContain('Data unavailable');
  });

  it('updates the insight DOM element when insightSelector is provided', () => {
    document.body.innerHTML = '<p id="map-insight">old</p>';
    const chart = makeChart();
    handleDashboardError(chart, new Error('boom'), {
      context: 'food-insecurity-drilldown',
      insightSelector: '#map-insight',
      message: 'County data unavailable.',
    });
    expect(document.getElementById('map-insight').textContent).toBe('County data unavailable.');
  });

  it('reports the error to errorTracker with context', () => {
    const chart = makeChart();
    const err = new Error('fetch failed');
    handleDashboardError(chart, err, { context: 'exec-summary-vuln-map' });
    expect(errorTracker.captureError).toHaveBeenCalledTimes(1);
    const payload = errorTracker.captureError.mock.calls[0][0];
    expect(payload.message).toBe('fetch failed');
    expect(payload.context).toBe('exec-summary-vuln-map');
    expect(payload.type).toBe('dashboard');
  });

  it('is a no-op when chart is null', () => {
    expect(() =>
      handleDashboardError(null, new Error('boom'), { context: 'test' }),
    ).not.toThrow();
    expect(errorTracker.captureError).toHaveBeenCalledTimes(1);
  });

  it('skips chart calls when chart is already disposed', () => {
    const chart = makeChart();
    chart.isDisposed = vi.fn(() => true);
    handleDashboardError(chart, new Error('boom'), { context: 'test' });
    expect(chart.hideLoading).not.toHaveBeenCalled();
    expect(chart.setOption).not.toHaveBeenCalled();
  });

  it('uses a default message when none is provided', () => {
    const chart = makeChart();
    handleDashboardError(chart, new Error('boom'), { context: 'test' });
    const opt = chart.setOption.mock.calls[0][0];
    expect(JSON.stringify(opt.graphic)).toMatch(/unavailable/i);
  });
});
