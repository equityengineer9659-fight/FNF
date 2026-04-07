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

  // ── P1-2: LinearGradient serialization bug ──
  describe('rebuildPurchasingPowerSeries LinearGradient preservation', () => {
    it('rebuildPurchasingPowerSeries should not use bare JSON.parse(JSON.stringify()) for option clone', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-prices.js'), 'utf-8');
      // Extract the rebuildPurchasingPowerSeries function body
      const fnStart = jsSource.indexOf('function rebuildPurchasingPowerSeries');
      const fnBody = jsSource.slice(fnStart, fnStart + 600);

      // If JSON.parse(JSON.stringify(ppBaseOption)) exists, gradient restoration must also exist
      if (fnBody.includes('JSON.parse(JSON.stringify(ppBaseOption))')) {
        // The fix: gradients must be restored after cloning
        const hasGradientRestore = fnBody.includes('.colorStops') || fnBody.includes('areaStyle.color = ');
        expect(hasGradientRestore).toBe(true);
      }
    });

    it('LinearGradient instances should not survive JSON round-trip (documents the bug)', () => {
      // Demonstrates why JSON.parse/stringify alone is insufficient
      const gradient = { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(255,0,0,0.2)' }] };
      const cloned = JSON.parse(JSON.stringify(gradient));
      // After cloning, the colorStops are preserved in plain objects
      expect(cloned.colorStops).toBeDefined();
      expect(cloned.colorStops[0].color).toBe('rgba(255,0,0,0.2)');
      // BUT ECharts LinearGradient class instances lose their prototype
      // This test documents why class instances need special handling
    });

    it('food-prices.html Chart 4 copy values should match bls-regional-cpi.json quintile data', () => {
      const regionalData = readJSON('bls-regional-cpi.json');
      const html = readHTML('food-prices.html');
      const quintiles = regionalData.affordability?.quintiles;
      if (!quintiles) return;

      const bottom = quintiles[0];
      const top = quintiles[quintiles.length - 1];

      // Helper: strip commas for matching (HTML may format 1416 as 1,416)
      const htmlStripped = html.replace(/,/g, '');

      // Bottom quintile food share (32.6%)
      if (bottom?.foodSharePct) {
        expect(html).toContain(bottom.foodSharePct.toString());
      }
      // Bottom quintile monthly cost ($440)
      if (bottom?.monthlyFoodCost) {
        expect(htmlStripped).toContain(bottom.monthlyFoodCost.toString());
      }
      // Top quintile monthly cost ($1,416)
      if (top?.monthlyFoodCost) {
        expect(htmlStripped).toContain(top.monthlyFoodCost.toString());
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

  // ── Fix 24: Regional insight gap percentage ──
  describe('regional insight accuracy', () => {
    it('should not contain stale "8.6%" regional gap', () => {
      const html = readHTML('food-prices.html');
      expect(html).not.toContain('8.6% more');
    });
  });

  // ── Fix 25: Data range start year ──
  describe('regional data range label', () => {
    it('data range should say 2018, not 2020', () => {
      const html = readHTML('food-prices.html');
      expect(html).toContain('2018-present');
      expect(html).not.toMatch(/Data Range<\/strong>\s*2020-present/);
    });
  });

  // ── Fix 27: Purchasing Power heading ──
  describe('purchasing power heading', () => {
    it('heading should not contain "Gap" when SNAP exceeds food CPI', () => {
      const html = readHTML('food-prices.html');
      expect(html).not.toContain('The Purchasing Power Gap');
    });
  });

  // ── Fix 28: Purchasing power insight language ──
  describe('purchasing power insight text', () => {
    it('should say "outpaced" not "keeping pace" when SNAP exceeds food CPI', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-prices.js'), 'utf-8');
      expect(jsSource).toContain('outpaced');
      expect(jsSource).not.toContain('keeping pace');
    });
  });

  // ── CODX #3: HTML metadata accuracy ──
  describe('affordability map metadata', () => {
    it('HTML data year should match JSON data year', () => {
      const regionalData = readJSON('bls-regional-cpi.json');
      const html = readHTML('food-prices.html');
      const jsonYear = regionalData.stateAffordability.year;

      const yearMatch = html.match(/Data Year<\/strong>\s*(\d{4})/);
      expect(yearMatch).toBeTruthy();
      expect(parseInt(yearMatch[1], 10)).toBe(jsonYear);
    });

    it('HTML formula should not claim multiplier is 1,000,000', () => {
      const html = readHTML('food-prices.html');
      expect(html).not.toMatch(/x\s*1,000,000/i);
    });
  });

  // ── P4: renderCategories source contract ──
  describe('renderCategories', () => {
    it('should render multi-series CPI line chart with area gradients', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-prices.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderCategories'),
        jsSource.indexOf('function renderRegions')
      );
      expect(section).toContain('LinearGradient');
      expect(section).toContain('areaStyle');
      expect(section).toContain('series.map');
    });

    it('BLS CPI data should have multiple food categories', () => {
      const data = readJSON('bls-regional-cpi.json');
      expect(data.categories).toBeDefined();
      expect(data.categories.series.length).toBeGreaterThan(3);
    });
  });

  // ── P4: renderRegions source contract ──
  describe('renderRegions', () => {
    it('should render grouped bar chart with regional CPI comparison', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-prices.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderRegions'),
        jsSource.indexOf('function renderAffordabilityMap')
      );
      expect(section).toContain('bar');
      expect(section).toContain('mealCost');
    });

    it('regional data should have at least 4 regions', () => {
      const data = readJSON('bls-regional-cpi.json');
      expect(data.regions.series.length).toBeGreaterThanOrEqual(4);
    });
  });

  // ── P4: renderAffordabilityMap source contract ──
  describe('renderAffordabilityMap', () => {
    it('should use affordability index formula in tooltip', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-prices.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderAffordabilityMap'),
        jsSource.indexOf('function renderBurden')
      );
      expect(section).toContain('Affordability Index');
      expect(section).toContain('mealCost');
      expect(section).toContain('medianIncome');
    });
  });

  // ── P4: renderBurden source contract ──
  describe('renderBurden', () => {
    it('should render sunburst chart from quintile data', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-prices.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderBurden'),
        jsSource.indexOf('function renderHomeVsAway')
      );
      expect(section).toContain('sunburst');
      expect(section).toContain('quintiles');
    });
  });

  // ── P4: renderHomeVsAway source contract ──
  describe('renderHomeVsAway', () => {
    it('should have connectNulls and government shutdown markArea', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-prices.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderHomeVsAway'),
        jsSource.indexOf('function renderYoYInflation')
      );
      expect(section).toContain('connectNulls');
      expect(section).toContain('markArea');
    });
  });

  // ── P4: renderYoYInflation source contract ──
  describe('renderYoYInflation', () => {
    it('should use date-keyed lookback for YoY computation', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-prices.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderYoYInflation'),
        jsSource.indexOf('function toggleFredOverlay')
      );
      expect(section).toContain('byDate');
      expect(section).toContain('computeYoY');
    });
  });

  // ── P4: toggleFredOverlay source contract ──
  describe('toggleFredOverlay', () => {
    it('should use FRED API for item-level prices', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-prices.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function toggleFredOverlay'));
      expect(section).toContain('fetchFredCpiItem');
      expect(section).toContain('aria-pressed');
    });
  });

  // ── P4: renderPurchasingPower source contract ──
  describe('renderPurchasingPower', () => {
    it('should show SNAP vs food CPI index comparison', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-prices.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderPurchasingPower'),
        jsSource.indexOf('function renderCpiVsInsecurity')
      );
      expect(section).toContain('SNAP Benefits');
      expect(section).toContain('Food Prices (CPI)');
      expect(section).toContain('snapIndexed');
    });

    it('should have markLine at last benefitTimeline date', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-prices.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function renderPurchasingPower'));
      expect(section).toContain('markLine');
      expect(section).toContain('benefitTimeline');
    });
  });

  // ── P4: renderCpiVsInsecurity source contract ──
  describe('renderCpiVsInsecurity', () => {
    it('should be a dual-axis chart with CPI and food insecurity', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-prices.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function renderCpiVsInsecurity'));
      expect(section).toContain('Food Insecurity');
      expect(section).toContain('yAxis');
    });
  });
});
