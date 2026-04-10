/**
 * Tests for state-selector module — extracted from dashboard-utils per audit P3-12.
 * Verifies the relocation preserves behavior: getSelectedState reads URL,
 * initStateSelector renders the dropdown, fires the callback, and updates the URL.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock ECharts before importing — state-selector imports US_STATES from
// dashboard-utils which pulls in echarts at module load.
vi.mock('echarts/core', () => ({
  use: vi.fn(),
  init: vi.fn(() => ({ setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn() })),
  getInstanceByDom: vi.fn(),
}));
vi.mock('echarts/charts', () => ({
  BarChart: 'B', LineChart: 'L', PieChart: 'P', MapChart: 'M',
  ScatterChart: 'S', RadarChart: 'R', SankeyChart: 'Sk',
  SunburstChart: 'Sb', TreemapChart: 'T', GaugeChart: 'G', ThemeRiverChart: 'Tr',
}));
vi.mock('echarts/components', () => ({
  TitleComponent: 'T', TooltipComponent: 'Tt', GridComponent: 'G',
  LegendComponent: 'L', DataZoomComponent: 'D', VisualMapComponent: 'V',
  GeoComponent: 'Ge', RadarComponent: 'R', MarkLineComponent: 'Ml',
  MarkAreaComponent: 'Ma', SingleAxisComponent: 'Sa',
}));
vi.mock('echarts/renderers', () => ({ CanvasRenderer: 'CanvasRenderer' }));

import { getSelectedState, initStateSelector } from './state-selector.js';

describe('state-selector (P3-12 extraction)', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="host"></div>';
    // jsdom location is configurable; rewrite via history API
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('getSelectedState', () => {
    it('returns empty string when ?state= is missing', () => {
      window.history.replaceState({}, '', '/dashboards/food-insecurity.html');
      expect(getSelectedState()).toBe('');
    });

    it('returns the state code when ?state=CA is present', () => {
      window.history.replaceState({}, '', '/dashboards/food-insecurity.html?state=CA');
      expect(getSelectedState()).toBe('CA');
    });
  });

  describe('initStateSelector', () => {
    it('returns silently when the container id does not exist', () => {
      expect(() => initStateSelector('does-not-exist', vi.fn())).not.toThrow();
    });

    it('mounts a select element with US states inside the container', () => {
      initStateSelector('host', vi.fn());
      const select = document.querySelector('#host select#state-deep-dive');
      expect(select).toBeTruthy();
      // First option is "All States", followed by 50+ state options
      expect(select.options.length).toBeGreaterThan(50);
      expect(select.options[0].value).toBe('');
      expect(select.options[0].textContent).toBe('All States');
    });

    it('pre-selects the state from the URL on mount', () => {
      window.history.replaceState({}, '', '/dashboards/food-insecurity.html?state=TX');
      initStateSelector('host', vi.fn());
      const select = document.querySelector('#host select#state-deep-dive');
      expect(select.value).toBe('TX');
    });

    it('invokes the callback once on mount when URL already has a state', () => {
      window.history.replaceState({}, '', '/dashboards/food-insecurity.html?state=NY');
      const cb = vi.fn();
      initStateSelector('host', cb);
      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith('NY');
    });

    it('does not invoke the callback on mount when URL has no state', () => {
      const cb = vi.fn();
      initStateSelector('host', cb);
      expect(cb).not.toHaveBeenCalled();
    });

    it('fires the callback and updates the URL when the user selects a state', () => {
      const cb = vi.fn();
      initStateSelector('host', cb);
      const select = document.querySelector('#host select#state-deep-dive');
      select.value = 'CA';
      select.dispatchEvent(new Event('change'));
      expect(cb).toHaveBeenCalledWith('CA');
      expect(new URL(window.location.href).searchParams.get('state')).toBe('CA');
    });

    it('removes the state param from the URL when the user picks "All States"', () => {
      window.history.replaceState({}, '', '/dashboards/food-insecurity.html?state=CA');
      const cb = vi.fn();
      initStateSelector('host', cb);
      const select = document.querySelector('#host select#state-deep-dive');
      select.value = '';
      select.dispatchEvent(new Event('change'));
      expect(new URL(window.location.href).searchParams.has('state')).toBe(false);
    });
  });
});

describe('dashboard-utils backward-compat re-export (P3-12)', () => {
  it('still exports initStateSelector and getSelectedState from dashboard-utils', async () => {
    const utils = await import('./dashboard-utils.js');
    expect(typeof utils.initStateSelector).toBe('function');
    expect(typeof utils.getSelectedState).toBe('function');
  });

  it('exports LEGEND_TEXT_STYLE constant with the expected shape (P3-05)', async () => {
    const utils = await import('./dashboard-utils.js');
    expect(utils.LEGEND_TEXT_STYLE).toEqual({
      color: '#ffffff',
      fontSize: 11,
    });
  });
});
