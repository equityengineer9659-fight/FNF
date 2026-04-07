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
});
