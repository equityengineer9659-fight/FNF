import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock ECharts before importing dashboard-utils (it imports echarts at top level)
vi.mock('echarts/core', () => ({
  use: vi.fn(),
  init: vi.fn(() => ({ setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn() })),
  getInstanceByDom: vi.fn(),
}));
vi.mock('echarts/charts', () => ({
  BarChart: 'BarChart',
  LineChart: 'LineChart',
  PieChart: 'PieChart',
  MapChart: 'MapChart',
  ScatterChart: 'ScatterChart',
  RadarChart: 'RadarChart',
  SankeyChart: 'SankeyChart',
  SunburstChart: 'SunburstChart',
  TreemapChart: 'TreemapChart',
  GaugeChart: 'GaugeChart',
  ThemeRiverChart: 'ThemeRiverChart',
}));
vi.mock('echarts/components', () => ({
  TitleComponent: 'TitleComponent',
  TooltipComponent: 'TooltipComponent',
  GridComponent: 'GridComponent',
  LegendComponent: 'LegendComponent',
  DataZoomComponent: 'DataZoomComponent',
  VisualMapComponent: 'VisualMapComponent',
  GeoComponent: 'GeoComponent',
  RadarComponent: 'RadarComponent',
  MarkLineComponent: 'MarkLineComponent',
  MarkAreaComponent: 'MarkAreaComponent',
  SingleAxisComponent: 'SingleAxisComponent',
}));
vi.mock('echarts/renderers', () => ({
  CanvasRenderer: 'CanvasRenderer',
}));

import {
  linearRegression,
  fmtNum,
  getRegion,
  getNteeName,
  isFoodRelated,
  exportCSV,
  fetchWithFallback,
  updateFreshness,
  createChart,
  disposeAllCharts,
  REGIONS,
  US_STATES,
} from './dashboard-utils.js';

describe('dashboard-utils', () => {
  describe('linearRegression', () => {
    it('should return zeros for empty array', () => {
      const result = linearRegression([]);
      expect(result).toEqual({ slope: 0, intercept: 0, r: 0 });
    });

    it('should return zeros for single point', () => {
      const result = linearRegression([[1, 2]]);
      expect(result).toEqual({ slope: 0, intercept: 0, r: 0 });
    });

    it('should compute perfect positive correlation', () => {
      const result = linearRegression([[0, 0], [1, 1], [2, 2], [3, 3]]);
      expect(result.slope).toBeCloseTo(1);
      expect(result.intercept).toBeCloseTo(0);
      expect(result.r).toBeCloseTo(1);
    });

    it('should compute negative correlation', () => {
      const result = linearRegression([[0, 3], [1, 2], [2, 1], [3, 0]]);
      expect(result.slope).toBeCloseTo(-1);
      expect(result.r).toBeCloseTo(-1);
    });

    it('should handle horizontal line (zero slope)', () => {
      const result = linearRegression([[0, 5], [1, 5], [2, 5]]);
      expect(result.slope).toBeCloseTo(0);
      expect(result.r).toBeCloseTo(0);
    });
  });

  describe('fmtNum', () => {
    it('should format billions', () => {
      expect(fmtNum(1500000000)).toBe('1.5B');
    });

    it('should format millions', () => {
      expect(fmtNum(2300000)).toBe('2.3M');
    });

    it('should format thousands', () => {
      expect(fmtNum(45000)).toBe('45K');
    });

    it('should format small numbers with locale', () => {
      expect(fmtNum(999)).toBe('999');
    });

    it('should handle zero', () => {
      expect(fmtNum(0)).toBe('0');
    });

    it('should handle exact boundaries', () => {
      expect(fmtNum(1000)).toBe('1K');
      expect(fmtNum(1000000)).toBe('1.0M');
      expect(fmtNum(1000000000)).toBe('1.0B');
    });
  });

  describe('getRegion', () => {
    it('should return correct region for known states', () => {
      expect(getRegion('California')).toBe('West');
      expect(getRegion('New York')).toBe('Northeast');
      expect(getRegion('Texas')).toBe('South');
      expect(getRegion('Ohio')).toBe('Midwest');
    });

    it('should return South as default for unknown state', () => {
      expect(getRegion('Unknown State')).toBe('South');
    });

    it('should handle District of Columbia', () => {
      expect(getRegion('District of Columbia')).toBe('South');
    });
  });

  describe('getNteeName', () => {
    it('should return name for exact NTEE code', () => {
      expect(getNteeName('K31')).toBe('Food Banks & Food Pantries');
    });

    it('should fall back to prefix letter', () => {
      expect(getNteeName('K99')).toBe('Food, Agriculture & Nutrition');
    });

    it('should strip Z suffix', () => {
      expect(getNteeName('K31Z')).toBe('Food Banks & Food Pantries');
    });

    it('should return "Nonprofit" for null/undefined', () => {
      expect(getNteeName(null)).toBe('Nonprofit');
      expect(getNteeName(undefined)).toBe('Nonprofit');
      expect(getNteeName('')).toBe('Nonprofit');
    });

    it('should return raw code for unknown code', () => {
      expect(getNteeName('Z99')).toBe('Z99');
    });
  });

  describe('isFoodRelated', () => {
    it('should return true for K-prefixed codes', () => {
      expect(isFoodRelated('K31')).toBe(true);
      expect(isFoodRelated('K')).toBe(true);
    });

    it('should return false for non-K codes', () => {
      expect(isFoodRelated('P20')).toBe(false);
    });

    it('should return false for null/empty', () => {
      expect(isFoodRelated(null)).toBe(false);
      expect(isFoodRelated('')).toBe(false);
    });
  });

  describe('exportCSV', () => {
    it('should create and click a download link', () => {
      // jsdom in CI may not have URL.createObjectURL — polyfill before spying
      if (!URL.createObjectURL) URL.createObjectURL = () => '';
      if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {};

      const createSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
      const revokeSpy = vi.spyOn(URL, 'revokeObjectURL');
      const clickSpy = vi.fn();
      vi.spyOn(document, 'createElement').mockReturnValue({
        href: '',
        download: '',
        click: clickSpy,
      });

      exportCSV('test.csv', ['Name', 'Value'], [['Alice', 100], ['Bob', 200]]);

      expect(createSpy).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeSpy).toHaveBeenCalled();

      createSpy.mockRestore();
      revokeSpy.mockRestore();
      document.createElement.mockRestore();
    });
  });

  describe('fetchWithFallback', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should return live data when API succeeds', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ value: 42 }),
      });

      const result = await fetchWithFallback('/api/live', '/data/static.json');
      expect(result).toEqual({ data: { value: 42 }, source: 'live' });
    });

    it('should fall back to static when live API returns error in body', async () => {
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ error: 'rate limited' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ value: 'static' }),
        });

      const result = await fetchWithFallback('/api/live', '/data/static.json');
      expect(result).toEqual({ data: { value: 'static' }, source: 'static' });
    });

    it('should fall back to static when live API throws', async () => {
      globalThis.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ fallback: true }),
        });

      const result = await fetchWithFallback('/api/live', '/data/static.json');
      expect(result).toEqual({ data: { fallback: true }, source: 'static' });
    });

    it('should throw when both live and static fail', async () => {
      globalThis.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network'))
        .mockResolvedValueOnce({ ok: false, status: 404 });

      await expect(fetchWithFallback('/api/live', '/data/static.json'))
        .rejects.toThrow('Failed to load');
    });
  });

  describe('updateFreshness', () => {
    beforeEach(() => {
      document.body.innerHTML = '<span id="freshness-test"></span>';
    });

    it('should show static label for _static data', () => {
      updateFreshness('test', { _static: true, _dataYear: '2024' });
      const el = document.getElementById('freshness-test');
      expect(el.textContent).toBe('Data: 2024');
      expect(el.classList.contains('freshness--static')).toBe(true);
    });

    it('should show Live for non-static data', () => {
      updateFreshness('test', {});
      const el = document.getElementById('freshness-test');
      expect(el.textContent).toBe('Live');
      expect(el.classList.contains('freshness--live')).toBe(true);
    });

    it('should handle missing element gracefully', () => {
      expect(() => updateFreshness('nonexistent', {})).not.toThrow();
    });
  });

  describe('US_STATES', () => {
    it('should contain 51 entries (50 states + DC)', () => {
      expect(US_STATES.length).toBe(51);
    });

    it('should have [abbreviation, name] pairs', () => {
      const ca = US_STATES.find(s => s[0] === 'CA');
      expect(ca[1]).toBe('California');
    });
  });

  describe('REGIONS', () => {
    it('should cover all 50 states + DC', () => {
      const allStates = Object.values(REGIONS).flat();
      expect(allStates.length).toBe(51);
    });
  });

  describe('disposeAllCharts', () => {
    it('should call dispose on all chart instances and clear the array', () => {
      // Create mock chart containers
      const container1 = document.createElement('div');
      container1.id = 'chart-test-1';
      document.body.appendChild(container1);
      const container2 = document.createElement('div');
      container2.id = 'chart-test-2';
      document.body.appendChild(container2);

      // Create charts (uses mocked echarts.init)
      const chart1 = createChart('chart-test-1');
      const chart2 = createChart('chart-test-2');

      expect(chart1).not.toBeNull();
      expect(chart2).not.toBeNull();

      // Dispose all
      disposeAllCharts();

      // dispose() should have been called on each
      expect(chart1.dispose).toHaveBeenCalled();
      expect(chart2.dispose).toHaveBeenCalled();

      // Cleanup DOM
      container1.remove();
      container2.remove();
    });

    it('should not throw if charts array is empty', () => {
      expect(() => disposeAllCharts()).not.toThrow();
    });
  });

  // ── ECharts aria enabled on all charts ──
  describe('createChart aria support', () => {
    it('should call setOption with aria enabled immediately after init', () => {
      const container = document.createElement('div');
      container.id = 'chart-aria-test';
      document.body.appendChild(container);

      const chart = createChart('chart-aria-test');
      expect(chart).not.toBeNull();
      // setOption should have been called with aria config
      expect(chart.setOption).toHaveBeenCalledWith(
        expect.objectContaining({ aria: expect.objectContaining({ enabled: true }) })
      );

      container.remove();
    });
  });
});
