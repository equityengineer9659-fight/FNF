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

import { REGION_COLORS } from './shared/dashboard-utils.js';

const dataDir = resolve(__dirname, '../../../public/data');
const htmlDir = resolve(__dirname, '../../../dashboards');

function readJSON(filename) {
  return JSON.parse(readFileSync(resolve(dataDir, filename), 'utf-8'));
}

function readHTML(filename) {
  return readFileSync(resolve(htmlDir, filename), 'utf-8');
}

describe('food-banks', () => {
  // ── P1 #33: Radar area fill hex-to-rgba conversion ──
  describe('REGION_COLORS hex-to-rgba conversion', () => {
    it('should produce valid rgba when converting REGION_COLORS for area fills', () => {
      // hexToRgba is now used in food-banks.js instead of the old .replace() approach
      for (const [, color] of Object.entries(REGION_COLORS)) {
        // Verify the hex-to-rgba conversion produces valid output
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const converted = `rgba(${r},${g},${b},0.2)`;
        expect(converted).toMatch(/^rgba\(\d+,\d+,\d+,0\.2\)$/);
      }
    });

    it('REGION_COLORS values should be convertible to rgba format', () => {
      for (const [, color] of Object.entries(REGION_COLORS)) {
        // Verify the color format — hex won't work with the current .replace approach
        const isRgb = color.startsWith('rgb(');
        const isHex = color.startsWith('#');

        if (isHex) {
          // Hex colors need a different conversion method — this documents the bug
          const hexToRgba = (hex, alpha) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r},${g},${b},${alpha})`;
          };
          const result = hexToRgba(color, 0.2);
          expect(result).toMatch(/^rgba\(\d+,\d+,\d+,0\.2\)$/);
        } else {
          expect(isRgb).toBe(true);
        }
      }
    });
  });

  // ── P1 #34: Mississippi insight accuracy ──
  describe('Mississippi insight', () => {
    it('hardcoded revenue-per-insecure should match computed value from data', () => {
      const bankData = readJSON('food-bank-summary.json');
      const html = readHTML('food-banks.html');

      const ms = bankData.states.find(s => s.name === 'Mississippi');
      expect(ms).toBeDefined();

      // Derive insecure persons the same way food-banks.js does (population × insecurity rate)
      const insecurePersons = Math.round((ms.population || 0) * ((ms.foodInsecurityRate || 0) / 100));
      expect(insecurePersons).toBeGreaterThan(0);

      const computed = Math.round(ms.totalRevenue / insecurePersons);

      // Extract the hardcoded dollar-per-person value from HTML insight text
      const match = html.match(/\$(\d{3,})\s*(?:in food bank revenue per food[- ]?insecure|per food[- ]?insecure person)/i);
      expect(match).not.toBeNull();
      const hardcoded = parseInt(match[1], 10);
      expect(hardcoded).toBe(computed);
    });
  });

  // ── P1 #35: Data year label ──
  describe('data year label', () => {
    it('should disclose mixed data vintages accurately', () => {
      const html = readHTML('food-banks.html');
      const bankData = readJSON('food-bank-summary.json');

      // If food insecurity rates are 2024 data, the label should mention it
      if (bankData.states[0]?.foodInsecurityRate) {
        // Check that the page doesn't ONLY say "2023 IRS 990" without mentioning
        // that insecurity rates come from a different year
        const hasIRS = html.includes('2023 IRS 990') || html.includes('IRS 990');
        if (hasIRS) {
          // Should also mention the insecurity data source/year
          const mentionsFeedingAmerica = html.includes('Feeding America') || html.includes('2024');
          expect(mentionsFeedingAmerica).toBe(true);
        }
      }
    });
  });

  // ── F4: Hero stats must be updated from JSON ──
  describe('hero stat dynamic updates', () => {
    it('init() should update hero data-target from bankData.national', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-banks.js'), 'utf-8');
      const initSection = jsSource.slice(jsSource.indexOf('async function init()'));
      expect(initSection).toContain('totalOrganizations');
      expect(initSection).toContain('dashboard-stat__number');
    });
  });

  // ── Fix 29: Radar national avg must use national.avgEfficiencyRatio ──
  describe('radar national avg source', () => {
    it('should use national.avgEfficiencyRatio, not recomputed state mean', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-banks.js'), 'utf-8');
      // The radar National Avg benchmark should reference the JSON national value
      // not a states.reduce(...) / states.length recomputed average
      expect(jsSource).toContain('avgEfficiencyRatio');
    });
  });

  // ── Fix 30: Revenue reconciliation note direction ──
  describe('revenue reconciliation', () => {
    it('reconciliation note should address state sum exceeding national', () => {
      const data = readJSON('food-bank-summary.json');
      const stateRevSum = data.states.reduce((sum, s) => sum + s.totalRevenue, 0);
      const natRev = data.national.combinedRevenue;
      // State sum should be close but may exceed national
      const variance = ((stateRevSum - natRev) / natRev) * 100;
      expect(Math.abs(variance)).toBeLessThan(5);
      // Reconciliation note should exist
      expect(data.national._reconciliationNote).toBeDefined();
    });
  });

  // ── Fix 31: Freshness badge mixed year ──
  describe('freshness badge year', () => {
    it('should show mixed data year, not just 2023', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-banks.js'), 'utf-8');
      expect(jsSource).toContain('2023/2024');
      expect(jsSource).not.toMatch(/_dataYear:\s*2023\b(?!\/)/);
    });
  });

  // ── Batch 7: Breadcrumb keyboard, regression suppression, orgCount guard ──
  describe('D3 heatmap breadcrumb keyboard', () => {
    it('breadcrumb spans should have tabindex and role=button', () => {
      const d3Source = readFileSync(resolve(__dirname, 'shared/d3-heatmap.js'), 'utf-8');
      expect(d3Source).toContain('tabindex');
      expect(d3Source).toContain('role');
      expect(d3Source).toContain('keydown');
    });
  });

  describe('diverging bar replaces scatter', () => {
    it('renderVsInsecurity should use bar chart, not scatter', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-banks.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderVsInsecurity'),
        jsSource.indexOf('function renderRevenue')
      );
      expect(section).toContain('type: \'bar\'');
      expect(section).not.toContain('type: \'scatter\'');
    });
  });

  describe('orgCount guard', () => {
    it('renderEfficiency should guard against orgCount === 0', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-banks.js'), 'utf-8');
      expect(jsSource).toContain('orgCount > 0');
    });
  });

  // ── CODX: vs-insecurity-insight aria-live ──
  describe('vs-insecurity-insight aria-live', () => {
    it('should have aria-live="polite" for screen reader announcements', () => {
      const html = readHTML('food-banks.html');
      const match = html.match(/id="vs-insecurity-insight"[^>]*/);
      expect(match).toBeTruthy();
      expect(match[0]).toContain('aria-live');
    });
  });

  // ── Change 4: resource gap diverging bar chart ──
  describe('resource gap diverging bar chart', () => {
    it('renderVsInsecurity should create a bar chart with deviation data', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-banks.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderVsInsecurity'),
        jsSource.indexOf('function renderRevenue')
      );
      expect(section).toContain('type: \'bar\'');
      expect(section).toContain('deviation');
      expect(section).toContain('chart-vs-insecurity');
    });

    it('should compute national mean and state deviations', () => {
      const data = JSON.parse(readFileSync(resolve(__dirname, '../../../public/data/food-bank-summary.json'), 'utf-8'));
      const stateRevPerInsecure = data.states
        .map(s => {
          const ip = Math.round(s.population * s.foodInsecurityRate / 100);
          return { name: s.name, val: ip > 0 ? s.totalRevenue / ip : 0 };
        })
        .filter(s => s.val > 0);
      const mean = stateRevPerInsecure.reduce((s, st) => s + st.val, 0) / stateRevPerInsecure.length;
      const above = stateRevPerInsecure.filter(s => s.val > mean);
      const below = stateRevPerInsecure.filter(s => s.val < mean);
      expect(above.length).toBeGreaterThan(0);
      expect(below.length).toBeGreaterThan(0);
      expect(mean).toBeGreaterThan(500);
    });

    it('HTML should describe Resource Gap', () => {
      const html = readFileSync(resolve(__dirname, '../../../dashboards/food-banks.html'), 'utf-8');
      const chartSection = html.slice(html.indexOf('chart-vs-insecurity') - 500, html.indexOf('chart-vs-insecurity') + 500);
      expect(chartSection.toLowerCase()).toContain('resource gap');
    });
  });

  // ── Change 5: worst-10 rev/insecure-person hero stat ──
  describe('worst-10 rev/insecure-person hero stat', () => {
    it('hero stats HTML should show Worst 10 instead of Under 100', () => {
      const html = readFileSync(resolve(__dirname, '../../../dashboards/food-banks.html'), 'utf-8');
      expect(html).toContain('Worst 10');
      expect(html).not.toContain('Under 100 Food Banks');
    });

    it('JS should compute worst-10 rev per insecure person', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-banks.js'), 'utf-8');
      const initSection = jsSource.slice(jsSource.indexOf('async function init()'));
      expect(initSection).toContain('Worst 10');
    });

    it('worst-10 avg should be reasonable', () => {
      const data = JSON.parse(readFileSync(resolve(__dirname, '../../../public/data/food-bank-summary.json'), 'utf-8'));
      const revPerInsecure = data.states
        .map(s => {
          const ip = Math.round(s.population * s.foodInsecurityRate / 100);
          return ip > 0 ? s.totalRevenue / ip : Infinity;
        })
        .filter(v => v < Infinity)
        .sort((a, b) => a - b)
        .slice(0, 10);
      const avg = Math.round(revPerInsecure.reduce((s, v) => s + v, 0) / revPerInsecure.length);
      expect(avg).toBeGreaterThan(0);
      expect(avg).toBeLessThan(2000);
    });
  });

  // ── Data shape validation ──
  describe('data shape: food-bank-summary.json', () => {
    it('should have national aggregate and states array', () => {
      const data = readJSON('food-bank-summary.json');
      expect(data.national).toBeDefined();
      expect(data.states).toBeDefined();
      expect(data.states.length).toBeGreaterThan(0);
    });

    it('states should have required fields for all charts', () => {
      const data = readJSON('food-bank-summary.json');
      for (const s of data.states) {
        expect(s).toHaveProperty('name');
        expect(s).toHaveProperty('orgCount');
        expect(s).toHaveProperty('totalRevenue');
        expect(s).toHaveProperty('foodInsecurityRate');
      }
    });
  });

  // ── P4: renderDensityMap source contract ──
  describe('renderDensityMap', () => {
    it('should render choropleth with perCapitaOrgs metric', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-banks.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderDensityMap'),
        jsSource.indexOf('function renderVsInsecurity')
      );
      expect(section).toContain('perCapitaOrgs');
      expect(section).toContain('map');
    });

    it('states should have perCapitaOrgs field', () => {
      const data = readJSON('food-bank-summary.json');
      for (const s of data.states) {
        expect(s).toHaveProperty('perCapitaOrgs');
        expect(s.perCapitaOrgs).toBeTypeOf('number');
      }
    });
  });

  // ── P4: renderVsInsecurity source contract (diverging bar) ──
  describe('renderVsInsecurity', () => {
    it('should compute deviation from national mean for diverging bar', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-banks.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderVsInsecurity'),
        jsSource.indexOf('function renderRevenue')
      );
      expect(section).toContain('deviation');
      expect(section).toContain('nationalMean');
      expect(section).toContain('type: \'bar\'');
    });

    it('should update vs-insecurity-insight with dynamic range text', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-banks.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderVsInsecurity'),
        jsSource.indexOf('function renderRevenue')
      );
      expect(section).toContain('vs-insecurity-insight');
      expect(section).toContain('revPerInsecure');
    });
  });

  // ── P4: renderRevenue source contract ──
  describe('renderRevenue', () => {
    it('should use D3 heatmap with rank normalization', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-banks.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderRevenue'),
        jsSource.indexOf('function renderEfficiency')
      );
      expect(section).toContain('createD3Heatmap');
      expect(section).toContain('createRankNorm');
    });
  });

  // ── P4: renderDistribution source contract ──
  describe('renderDistribution', () => {
    it('should render bar chart of top 15 states by insecurity with density overlay', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-banks.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderDistribution'),
        jsSource.indexOf('function renderCapacityGap')
      );
      expect(section).toContain('foodInsecurityRate');
      expect(section).toContain('perCapitaOrgs');
      expect(section).toContain('slice(0, 15)');
    });
  });

  // ── P4: renderCapacityGap source contract ──
  describe('renderCapacityGap', () => {
    it('should plot revenue per insecure person vs insecurity rate', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-banks.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function renderCapacityGap'));
      expect(section).toContain('scatter');
      expect(section).toContain('foodInsecurityRate');
      expect(section).toContain('totalRevenue');
    });

    it('states should have population for bubble sizing', () => {
      const data = readJSON('food-bank-summary.json');
      for (const s of data.states) {
        expect(s).toHaveProperty('population');
        expect(s.population).toBeTypeOf('number');
        expect(s.population).toBeGreaterThan(0);
      }
    });
  });

  // ── UI/UX Audit: Legend/Label/Color Consistency ──
  describe('legend/label/color consistency', () => {
    it('distribution chart sidebar should not mention "orange bar" if series uses teal/blue', () => {
      const html = readHTML('food-banks.html');
      const jsSource = readFileSync(resolve(__dirname, 'food-banks.js'), 'utf-8');
      const distSection = jsSource.slice(
        jsSource.indexOf('function renderDistribution'),
        jsSource.indexOf('function renderCapacityGap')
      );
      // If HTML says "orange bar", the JS must use an orange-family color
      if (html.includes('orange bar')) {
        const hasOrange = distSection.includes('COLORS.accent') || distSection.includes('#ff6b35') || distSection.includes('#f59e0b');
        expect(hasOrange).toBe(true);
      }
    });

    it('region chips should use same colors as REGION_COLORS for scatter/radar', () => {
      const d3Source = readFileSync(resolve(__dirname, 'shared/d3-heatmap.js'), 'utf-8');
      const chipFn = d3Source.slice(
        d3Source.indexOf('export function buildRegionChips'),
        d3Source.indexOf('export function buildRegionChips') + 500
      );
      // Chips must NOT use desaturated HEATMAP_REGION_COLORS
      expect(chipFn).not.toContain('#93B8DE');
      expect(chipFn).not.toContain('#D1B862');
    });
  });

  // ── Batch 5: Operating Reserves in Revenue Heatmap ──
  describe('operating reserves', () => {
    it('all states in food-bank-summary.json should have totalExpenses as a positive number', () => {
      const data = readJSON('food-bank-summary.json');
      for (const s of data.states) {
        expect(s).toHaveProperty('totalExpenses');
        expect(s.totalExpenses).toBeTypeOf('number');
        expect(s.totalExpenses).toBeGreaterThan(0);
      }
    });

    it('operating reserve calculation should be correct for Alabama', () => {
      const data = readJSON('food-bank-summary.json');
      const al = data.states.find(s => s.name === 'Alabama');
      const reserve = ((al.totalRevenue - al.totalExpenses) / al.totalRevenue * 100).toFixed(1);
      expect(Number(reserve)).toBeCloseTo(5.4, 0);
    });

    it('revenue heatmap should include totalExpenses in hierarchy data', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-banks.js'), 'utf-8');
      const revenueSection = jsSource.slice(
        jsSource.indexOf('function renderRevenue'),
        jsSource.indexOf('function renderEfficiency')
      );
      expect(revenueSection).toContain('totalExpenses');
    });

    it('revenue heatmap tooltip should show operating reserve', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-banks.js'), 'utf-8');
      const revenueSection = jsSource.slice(
        jsSource.indexOf('function renderRevenue'),
        jsSource.indexOf('function renderEfficiency')
      );
      expect(revenueSection).toMatch(/[Oo]perating [Rr]eserve/);
    });
  });
});
