import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Mock ECharts
vi.mock('echarts/core', () => ({
  use: vi.fn(),
  init: vi.fn(() => ({
    setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn(),
    on: vi.fn(), off: vi.fn(),
  })),
  getInstanceByDom: vi.fn(), registerMap: vi.fn(),
}));
vi.mock('echarts/charts', () => ({
  BarChart: 'BarChart', LineChart: 'LineChart', PieChart: 'PieChart',
  MapChart: 'MapChart', ScatterChart: 'ScatterChart', RadarChart: 'RadarChart',
  SankeyChart: 'SankeyChart', SunburstChart: 'SunburstChart',
  TreemapChart: 'TreemapChart', GaugeChart: 'GaugeChart',
  ThemeRiverChart: 'ThemeRiverChart',
}));
vi.mock('echarts/components', () => ({
  TitleComponent: 'TitleComponent', TooltipComponent: 'TooltipComponent',
  GridComponent: 'GridComponent', LegendComponent: 'LegendComponent',
  DataZoomComponent: 'DataZoomComponent', VisualMapComponent: 'VisualMapComponent',
  GeoComponent: 'GeoComponent', RadarComponent: 'RadarComponent',
  MarkLineComponent: 'MarkLineComponent', MarkAreaComponent: 'MarkAreaComponent',
  SingleAxisComponent: 'SingleAxisComponent',
}));
vi.mock('echarts/renderers', () => ({ CanvasRenderer: 'CanvasRenderer' }));

const dataDir = resolve(__dirname, '../../../public/data');
const htmlDir = resolve(__dirname, '../../../dashboards');

function readJSON(filename) {
  return JSON.parse(readFileSync(resolve(dataDir, filename), 'utf-8'));
}

function readHTML(filename) {
  return readFileSync(resolve(htmlDir, filename), 'utf-8');
}

describe('food-prices', () => {
  // ── P1 #28: Regional chart baseline label ──
  describe('regional chart baseline', () => {
    it('source JS should not hardcode "Jan 2020" when data starts earlier', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-prices.js'), 'utf-8');
      const regionalData = readJSON('bls-regional-cpi.json');

      // Find the actual start date of regional data
      const firstDate = regionalData.categories?.series?.[0]?.data?.[0]?.date
        || regionalData.series?.[0]?.data?.[0]?.date;

      if (firstDate && !firstDate.startsWith('2020')) {
        // The label should NOT say "Jan 2020" if data starts at a different year
        const hasHardcodedLabel = jsSource.includes('\'Jan 2020\'') || jsSource.includes('"Jan 2020"');
        expect(hasHardcodedLabel).toBe(false);
      }
    });
  });

  // ── P1 #29: Hero meal cost staleness ──
  describe('hero stat freshness', () => {
    it('meal cost hero data-target should match food-insecurity-state.json', () => {
      const fiData = readJSON('food-insecurity-state.json');
      const html = readHTML('food-prices.html');

      const jsonMealCost = fiData.national.averageMealCost;
      // Look for the meal cost data-target in the hero section
      // Format: <span ... data-target="3.99" ...>$3.99</span>\n<p ...>Avg Meal Cost</p>
      const match = html.match(/data-target="([\d.]+)"[^>]*data-prefix="\$"[^>]*>/);
      if (match) {
        const htmlVal = parseFloat(match[1]);
        expect(htmlVal).toBeCloseTo(jsonMealCost, 1);
      }
    });
  });

  // ── P1 #30: Lowest quintile food share ──
  describe('hero stat: lowest quintile', () => {
    it('food share data-target should match bls-regional-cpi.json quintile data', () => {
      const regionalData = readJSON('bls-regional-cpi.json');
      const html = readHTML('food-prices.html');

      const quintiles = regionalData.affordability?.quintiles;
      if (quintiles && quintiles.length > 0) {
        const lowestQuintile = quintiles[0]; // lowest 20%
        const jsonVal = lowestQuintile.foodSharePct;

        // Format: <span ... data-target="31.2" data-suffix="%">31.2%</span>\n<p>Income on Food (Lowest 20%)</p>
        const match = html.match(/data-target="([\d.]+)"[^>]*data-suffix="%"[^>]*>[\d.]+%<\/span>\s*<p[^>]*>Income on Food/);
        if (match && jsonVal) {
          const htmlVal = parseFloat(match[1]);
          expect(htmlVal).toBeCloseTo(jsonVal, 0);
        }
      }
    });
  });

  // ── P1 #31: Affordability map bounds ──
  describe('affordability map bounds', () => {
    it('visualMap min should be <= minimum state affordability index', () => {
      const regionalData = readJSON('bls-regional-cpi.json');
      const jsSource = readFileSync(resolve(__dirname, 'food-prices.js'), 'utf-8');

      const stateAffordability = regionalData.stateAffordability?.states;
      if (stateAffordability) {
        const minIndex = Math.min(...stateAffordability.map(s => s.index));

        // Extract the hardcoded visualMap min from the JS
        const match = jsSource.match(/visualMap[\s\S]*?min:\s*(\d+)/);
        if (match) {
          const vmMin = parseInt(match[1], 10);
          expect(vmMin).toBeLessThanOrEqual(minIndex);
        }
      }
    });
  });

  // ── Data shape validation ──
  describe('data shape: bls-regional-cpi.json', () => {
    it('should have categories and regional data', () => {
      const data = readJSON('bls-regional-cpi.json');
      expect(data.categories || data.series).toBeDefined();
    });

    it('should have affordability data', () => {
      const data = readJSON('bls-regional-cpi.json');
      expect(data.affordability).toBeDefined();
      if (data.affordability.quintiles) {
        expect(data.affordability.quintiles.length).toBeGreaterThan(0);
      }
    });

    it('should have stateAffordability with index values', () => {
      const data = readJSON('bls-regional-cpi.json');
      if (data.stateAffordability?.states) {
        expect(data.stateAffordability.states.length).toBeGreaterThan(0);
        for (const s of data.stateAffordability.states) {
          expect(s).toHaveProperty('name');
          expect(s).toHaveProperty('index');
          expect(s.index).toBeTypeOf('number');
        }
      }
    });
  });

  // ── PHP proxy series ID validation ──
  describe('BLS series IDs', () => {
    it('dashboard-bls.php should use CUUR* format (not APU*)', () => {
      const phpSource = readFileSync(
        resolve(__dirname, '../../../public/api/dashboard-bls.php'), 'utf-8'
      );
      // BLS CPI series should use CUUR format
      const cuurMatches = phpSource.match(/CUUR\w+/g) || [];
      expect(cuurMatches.length).toBeGreaterThan(0);

      // Should NOT have APU series in BLS proxy (those belong in FRED proxy)
      const apuMatches = phpSource.match(/APU\w+/g) || [];
      expect(apuMatches.length).toBe(0);
    });

    it('food-prices.js should pass APU* series IDs to FRED proxy', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-prices.js'), 'utf-8');
      const apuMatches = jsSource.match(/APU\w+/g) || [];
      expect(apuMatches.length).toBeGreaterThan(0);
    });
  });
});
