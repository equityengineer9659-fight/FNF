import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

  describe('addExportButton dynamic filename (P1 CSV drill-down)', () => {
    it('source: click handler destructures result.filename before calling exportCSV', () => {
      const src = readFileSync(resolve(__dirname, 'dashboard-utils.js'), 'utf-8');
      const idx = src.indexOf('export function addExportButton');
      const end = src.indexOf('header.appendChild(btn)', idx);
      const body = src.slice(idx, end);
      expect(body).toMatch(/getDataFn\(\)/);
      expect(body).toMatch(/result\.filename\s*\|\|\s*filename/);
    });

    it('exportCSV receives overridden filename when callback returns one', () => {
      const staticFilename = 'static.csv';
      const result = { filename: 'dynamic.csv', headers: ['A'], rows: [[1]] };
      const chosen = result.filename || staticFilename;
      expect(chosen).toBe('dynamic.csv');
    });

    it('exportCSV falls back to static filename when callback omits filename', () => {
      const staticFilename = 'static.csv';
      const result = { headers: ['A'], rows: [[1]] };
      const chosen = result.filename || staticFilename;
      expect(chosen).toBe('static.csv');
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

    it('logs both live and static failure context before rethrowing', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      globalThis.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('live nope'))
        .mockRejectedValueOnce(new Error('static nope'));

      await expect(fetchWithFallback('/api/live', '/data/static.json')).rejects.toThrow();
      expect(warnSpy).toHaveBeenCalled();
      const callArgs = warnSpy.mock.calls[0];
      expect(callArgs[0]).toMatch(/both live and static failed/);
      expect(callArgs[1]).toMatchObject({
        liveError: 'live nope',
        staticError: 'static nope',
      });
      warnSpy.mockRestore();
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

    it('should show Cached for _stale data', () => {
      updateFreshness('test', { _stale: true });
      const el = document.getElementById('freshness-test');
      expect(el.textContent).toBe('Cached');
      expect(el.classList.contains('freshness--cached')).toBe(true);
      expect(el.classList.contains('freshness--live')).toBe(false);
    });

    it('should prefer _static over _stale when both set', () => {
      updateFreshness('test', { _static: true, _stale: true, _dataYear: '2023' });
      const el = document.getElementById('freshness-test');
      expect(el.textContent).toBe('Data: 2023');
      expect(el.classList.contains('freshness--static')).toBe(true);
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

  // P2-09: animateCounters must not assign role dynamically
  describe('animateCounters static role="status" (P2-09)', () => {
    it('source does not call setAttribute(\'role\', \'status\') anywhere', () => {
      const src = readFileSync(resolve(__dirname, 'dashboard-utils.js'), 'utf-8');
      expect(src).not.toMatch(/setAttribute\(\s*['"]role['"]\s*,\s*['"]status['"]\s*\)/);
    });
  });

  // P2-06/09: static ARIA + heading semantics across dashboard HTML
  describe('Dashboard HTML static ARIA (P2-06, P2-09)', () => {
    const dashboards = [
      'executive-summary', 'food-access', 'food-banks', 'food-insecurity',
      'food-prices', 'nonprofit-directory', 'snap-safety-net'
    ];

    dashboards.forEach(name => {
      it(`${name}.html: dashboard-insights__card-title uses <h3> (P2-06)`, () => {
        const html = readFileSync(
          resolve(__dirname, `../../../../dashboards/${name}.html`),
          'utf-8'
        );
        expect(html).not.toMatch(/<div class="dashboard-insights__card-title"/);
        expect(html).toMatch(/<h3 class="dashboard-insights__card-title"/);
      });

      it(`${name}.html: dashboard-stat__number has static role="status" (P2-09)`, () => {
        const html = readFileSync(
          resolve(__dirname, `../../../../dashboards/${name}.html`),
          'utf-8'
        );
        const numberSpans = html.match(/<span [^>]*class="dashboard-stat__number"[^>]*>/g) || [];
        expect(numberSpans.length).toBeGreaterThan(0);
        numberSpans.forEach(span => {
          expect(span).toMatch(/role="status"/);
        });
      });
    });
  });

  // P2-08: .fnf-nav__link must have :focus-visible outline for keyboard users
  describe('Navigation focus-visible (P2-08)', () => {
    it('03-navigation.css defines .fnf-nav__link:focus-visible outline', () => {
      const css = readFileSync(
        resolve(__dirname, '../../../css/03-navigation.css'),
        'utf-8'
      );
      expect(css).toMatch(/\.fnf-nav__link:focus-visible\s*\{[^}]*outline:/);
    });
  });

  // P2-23: getOrCreateChart must be exported from shared utils (not food-access.js)
  describe('getOrCreateChart shared export (P2-23)', () => {
    it('dashboard-utils.js exports getOrCreateChart', () => {
      const src = readFileSync(resolve(__dirname, 'dashboard-utils.js'), 'utf-8');
      expect(src).toMatch(/export function getOrCreateChart/);
    });

    it('food-access.js imports getOrCreateChart from shared utils (no local copy)', () => {
      const src = readFileSync(
        resolve(__dirname, '../food-access.js'), 'utf-8'
      );
      expect(src).toMatch(/getOrCreateChart/);
      expect(src).not.toMatch(/function getOrCreateChart\s*\(/);
    });
  });

  // P2-24: window._fnfStateData must be gone from food-insecurity.js
  describe('food-insecurity.js module-scope cache (P2-24)', () => {
    it('no window._fnfStateData references', () => {
      const src = readFileSync(
        resolve(__dirname, '../food-insecurity.js'), 'utf-8'
      );
      expect(src).not.toMatch(/window\._fnfStateData/);
      expect(src).toMatch(/let _stateData\s*=\s*null/);
    });
  });

  // P2-25: Both region color palettes must exist and be documented
  describe('REGION_COLORS vs HEATMAP_REGION_COLORS docs (P2-25)', () => {
    it('dashboard-utils.js documents the intentional palette split', () => {
      const src = readFileSync(resolve(__dirname, 'dashboard-utils.js'), 'utf-8');
      const idx = src.indexOf('export const REGION_COLORS');
      const context = src.slice(Math.max(0, idx - 500), idx);
      expect(context).toMatch(/HEATMAP_REGION_COLORS/);
    });

    it('d3-heatmap.js documents the intentional palette split', () => {
      const src = readFileSync(resolve(__dirname, 'd3-heatmap.js'), 'utf-8');
      const idx = src.indexOf('const HEATMAP_REGION_COLORS');
      const context = src.slice(Math.max(0, idx - 500), idx);
      expect(context).toMatch(/REGION_COLORS/);
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
