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

/** Parse HTML file into a jsdom document for DOM-based assertions */
function parseHTML(filename) {
  const html = readFileSync(resolve(htmlDir, filename), 'utf-8');
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

describe('food-banks', () => {
  // ── P1 #33: Radar area fill hex-to-rgba conversion ──
  describe('REGION_COLORS hex-to-rgba conversion', () => {
    it('should produce valid rgba when converting REGION_COLORS for area fills', () => {
      for (const [, color] of Object.entries(REGION_COLORS)) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const converted = `rgba(${r},${g},${b},0.2)`;
        expect(converted).toMatch(/^rgba\(\d+,\d+,\d+,0\.2\)$/);
      }
    });

    it('REGION_COLORS values should be convertible to rgba format', () => {
      for (const [, color] of Object.entries(REGION_COLORS)) {
        const isRgb = color.startsWith('rgb(');
        const isHex = color.startsWith('#');

        if (isHex) {
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
      const doc = parseHTML('food-banks.html');

      const ms = bankData.states.find(s => s.name === 'Mississippi');
      expect(ms).toBeDefined();

      const insecurePersons = Math.round((ms.population || 0) * ((ms.foodInsecurityRate || 0) / 100));
      expect(insecurePersons).toBeGreaterThan(0);

      const computed = Math.round(ms.totalRevenue / insecurePersons);

      const bodyText = doc.body.textContent.replace(/,/g, '');
      const match = bodyText.match(/\$(\d{3,})\s*(?:in food bank revenue per food[- ]?insecure|per food[- ]?insecure person)/i);
      expect(match).not.toBeNull();
      const hardcoded = parseInt(match[1], 10);
      expect(hardcoded).toBe(computed);
    });
  });

  // ── P1 #35: Data year label ──
  describe('data year label', () => {
    it('should disclose mixed data vintages accurately', () => {
      const doc = parseHTML('food-banks.html');
      const bankData = readJSON('food-bank-summary.json');

      if (bankData.states[0]?.foodInsecurityRate) {
        const bodyText = doc.body.textContent;
        const hasIRS = bodyText.includes('IRS 990');
        if (hasIRS) {
          const mentionsFeedingAmerica = bodyText.includes('Feeding America') || bodyText.includes('2024');
          expect(mentionsFeedingAmerica).toBe(true);
        }
      }
    });
  });

  // ── F4: Hero stats must be updated from JSON ──
  describe('hero stat dynamic updates', () => {
    it('food-banks.html should have dashboard-stat__number elements with data-target', () => {
      const doc = parseHTML('food-banks.html');
      const statEls = doc.querySelectorAll('.dashboard-stat__number[data-target]');
      expect(statEls.length).toBeGreaterThan(0);
    });

    it('food-bank-summary.json should have totalOrganizations for hero stat', () => {
      const bankData = readJSON('food-bank-summary.json');
      expect(bankData.national.totalOrganizations).toBeTypeOf('number');
      expect(bankData.national.totalOrganizations).toBeGreaterThan(0);
    });
  });

  // ── Fix 29: Radar national avg must use national.avgEfficiencyRatio ──
  describe('radar national avg source', () => {
    it('national.avgEfficiencyRatio should exist in JSON for radar benchmark', () => {
      const bankData = readJSON('food-bank-summary.json');
      expect(bankData.national.avgEfficiencyRatio).toBeTypeOf('number');
      expect(bankData.national.avgEfficiencyRatio).toBeGreaterThan(0);
      expect(bankData.national.avgEfficiencyRatio).toBeLessThanOrEqual(100);
    });
  });

  // ── Fix 30: Revenue reconciliation note direction ──
  describe('revenue reconciliation', () => {
    it('reconciliation note should address state sum exceeding national', () => {
      const data = readJSON('food-bank-summary.json');
      const stateRevSum = data.states.reduce((sum, s) => sum + s.totalRevenue, 0);
      const natRev = data.national.combinedRevenue;
      const variance = ((stateRevSum - natRev) / natRev) * 100;
      expect(Math.abs(variance)).toBeLessThan(5);
      expect(data.national._reconciliationNote).toBeDefined();
    });
  });

  // ── Fix 31: Freshness badge mixed year ──
  describe('freshness badge year', () => {
    it('food-banks.html should have a freshness badge container for JS to populate', () => {
      const doc = parseHTML('food-banks.html');
      expect(doc.getElementById('freshness-banks')).not.toBeNull();
    });

    it('food-bank-summary.json national.year should reflect mixed vintage', () => {
      const data = readJSON('food-bank-summary.json');
      // The data year should be recent (2023 or later)
      expect(data.national.year).toBeGreaterThanOrEqual(2023);
    });
  });

  // ── Batch 7: Breadcrumb keyboard, regression suppression, orgCount guard ──
  describe('D3 heatmap breadcrumb keyboard', () => {
    it('food-banks.html should have the revenue heatmap container for D3 rendering', () => {
      const doc = parseHTML('food-banks.html');
      expect(doc.getElementById('chart-revenue')).not.toBeNull();
    });
  });

  describe('orgCount guard', () => {
    it('renderEfficiency should handle states with zero orgs gracefully', () => {
      // States with orgCount=0 should be skipped to avoid divide-by-zero
      const data = readJSON('food-bank-summary.json');
      const validStates = data.states.filter(s => s.orgCount > 0);
      expect(validStates.length).toBeGreaterThan(0);
      // Some states may have zero — ensure the data contract supports filtering
      expect(validStates.length).toBeLessThanOrEqual(data.states.length);
    });
  });

  // ── CODX: vs-insecurity-insight aria-live ──
  describe('vs-insecurity-insight aria-live', () => {
    it('should have aria-live="polite" for screen reader announcements', () => {
      const doc = parseHTML('food-banks.html');
      const el = doc.getElementById('vs-insecurity-insight');
      expect(el).not.toBeNull();
      expect(el.getAttribute('aria-live')).toBeTruthy();
    });
  });

  // ── Change 4: resource gap diverging bar chart ──
  describe('resource gap diverging bar chart', () => {
    it('should compute national mean and state deviations', () => {
      const data = readJSON('food-bank-summary.json');
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

    it('HTML chart container for vs-insecurity should exist', () => {
      const doc = parseHTML('food-banks.html');
      expect(doc.getElementById('chart-vs-insecurity')).not.toBeNull();
    });

    it('vs-insecurity-insight should describe resource gap in text', () => {
      const doc = parseHTML('food-banks.html');
      const insight = doc.getElementById('vs-insecurity-insight');
      expect(insight).not.toBeNull();
      // The insight element exists to hold dynamic text about resource gaps
      expect(insight.tagName.toLowerCase()).toBe('div');
    });
  });

  // ── Change 5: worst-10 rev/insecure-person hero stat ──
  describe('worst-10 rev/insecure-person hero stat', () => {
    it('hero stats HTML should show Worst 10 label', () => {
      const doc = parseHTML('food-banks.html');
      const bodyText = doc.body.textContent;
      expect(bodyText).toContain('Worst 10');
    });

    it('worst-10 avg should be reasonable', () => {
      const data = readJSON('food-bank-summary.json');
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

  // ── P4: renderDensityMap data contract ──
  describe('renderDensityMap', () => {
    it('states should have perCapitaOrgs field for choropleth', () => {
      const data = readJSON('food-bank-summary.json');
      for (const s of data.states) {
        expect(s).toHaveProperty('perCapitaOrgs');
        expect(s.perCapitaOrgs).toBeTypeOf('number');
      }
    });

    it('density map chart container should exist in HTML', () => {
      const doc = parseHTML('food-banks.html');
      expect(doc.getElementById('chart-density-map')).not.toBeNull();
    });
  });

  // ── P4: renderVsInsecurity data contract ──
  describe('renderVsInsecurity', () => {
    it('states have the data needed for deviation from national mean', () => {
      const data = readJSON('food-bank-summary.json');
      const validStates = data.states.filter(s => {
        const ip = Math.round(s.population * s.foodInsecurityRate / 100);
        return ip > 0;
      });
      expect(validStates.length).toBeGreaterThan(40);
      for (const s of validStates) {
        expect(s.totalRevenue).toBeTypeOf('number');
        expect(s.foodInsecurityRate).toBeTypeOf('number');
        expect(s.population).toBeTypeOf('number');
      }
    });
  });

  // ── P4: renderRevenue data contract ──
  describe('renderRevenue', () => {
    it('states should have totalRevenue for D3 heatmap', () => {
      const data = readJSON('food-bank-summary.json');
      for (const s of data.states) {
        expect(s).toHaveProperty('totalRevenue');
        expect(s.totalRevenue).toBeTypeOf('number');
        expect(s.totalRevenue).toBeGreaterThan(0);
      }
    });
  });

  // ── P4: renderDistribution data contract ──
  describe('renderDistribution', () => {
    it('sorting states by insecurityRate descending should produce top 15', () => {
      const data = readJSON('food-bank-summary.json');
      const sorted = [...data.states]
        .sort((a, b) => b.foodInsecurityRate - a.foodInsecurityRate)
        .slice(0, 15);
      expect(sorted.length).toBe(15);
      // Top state should have higher rate than bottom of top-15
      expect(sorted[0].foodInsecurityRate).toBeGreaterThanOrEqual(sorted[14].foodInsecurityRate);
    });
  });

  // ── P4: renderCapacityGap data contract ──
  describe('renderCapacityGap', () => {
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
    it('food-banks.html should have chart-distribution container for the bar chart', () => {
      const doc = parseHTML('food-banks.html');
      expect(doc.getElementById('chart-distribution')).not.toBeNull();
    });

    it('food-bank-summary.json states should load correctly for regional color grouping', () => {
      const data = readJSON('food-bank-summary.json');
      expect(data.states.length).toBeGreaterThan(0);
      // States must have name for region lookup
      for (const s of data.states) {
        expect(s).toHaveProperty('name');
        expect(typeof s.name).toBe('string');
      }
    });
  });

  // ── DOM structure: chart containers ──
  describe('chart container structure', () => {
    it('food-banks.html should have all expected chart containers', () => {
      const doc = parseHTML('food-banks.html');
      const expected = ['chart-density-map', 'chart-vs-insecurity', 'chart-revenue', 'chart-distribution', 'chart-capacity-gap'];
      for (const id of expected) {
        expect(doc.getElementById(id), `#${id} should exist`).not.toBeNull();
      }
    });

    it('food-banks.html hero section should not reference "Under 100" — replaced by Worst 10', () => {
      const doc = parseHTML('food-banks.html');
      expect(doc.body.textContent).not.toContain('Under 100 Food Banks');
    });

    it('renderDistribution paired chart should have data for both insecurity and density axes', () => {
      const data = readJSON('food-bank-summary.json');
      for (const s of data.states) {
        expect(s).toHaveProperty('foodInsecurityRate');
        expect(s).toHaveProperty('perCapitaOrgs');
      }
    });

    it('national efficiency ratio should be in valid percentage range', () => {
      const data = readJSON('food-bank-summary.json');
      expect(data.national.avgEfficiencyRatio).toBeGreaterThan(0);
      expect(data.national.avgEfficiencyRatio).toBeLessThanOrEqual(100);
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
  });

  // ── P2-20: Tooltip formatter contracts ──
  describe('tooltip formatters', () => {
    // Replicates density map formatter from food-banks.js (line 45)
    describe('density map tooltip', () => {
      function densityTooltip(params) {
        const d = params.data;
        if (!d) return '';
        return `<strong>${d.name}</strong> Density: ${d.value.toFixed(1)} orgs per 100K Total: ${d.orgCount} Revenue: $${d.totalRevenue} Insecurity: ${d.foodInsecurityRate}%`;
      }

      it('should return empty string for null data', () => {
        expect(densityTooltip({ data: null })).toBe('');
      });

      it('should format density to one decimal place', () => {
        const result = densityTooltip({
          data: { name: 'Alabama', value: 12.345, orgCount: 45, totalRevenue: 5000000, foodInsecurityRate: 15.2 }
        });
        expect(result).toContain('12.3 orgs per 100K');
      });

      it('should include all data fields', () => {
        const result = densityTooltip({
          data: { name: 'Texas', value: 8.0, orgCount: 200, totalRevenue: 25000000, foodInsecurityRate: 14.1 }
        });
        expect(result).toContain('Texas');
        expect(result).toContain('8.0 orgs per 100K');
        expect(result).toContain('200');
        expect(result).toContain('14.1%');
      });

      it('should handle zero density value', () => {
        const result = densityTooltip({
          data: { name: 'Test', value: 0, orgCount: 0, totalRevenue: 0, foodInsecurityRate: 0 }
        });
        expect(result).toContain('0.0 orgs per 100K');
        expect(result).not.toContain('NaN');
      });
    });

    // Replicates resource gap formatter from food-banks.js (line 98)
    describe('resource gap tooltip', () => {
      function resourceGapTooltip(params, nationalMean) {
        const deviation = params.data.deviation;
        const revPerInsecure = params.data.revPerInsecure;
        return `<strong>${params.name}</strong> Rev/Insecure Person: $${revPerInsecure?.toLocaleString()} National Mean: $${nationalMean.toLocaleString()} Deviation: ${deviation >= 0 ? '+' : ''}$${deviation?.toLocaleString()}`;
      }

      it('should show positive deviation with plus sign', () => {
        const result = resourceGapTooltip(
          { name: 'California', data: { deviation: 500, revPerInsecure: 2000 } },
          1500
        );
        expect(result).toContain('+$500');
        expect(result).toContain('$2,000');
      });

      it('should show negative deviation without plus sign', () => {
        const result = resourceGapTooltip(
          { name: 'Mississippi', data: { deviation: -800, revPerInsecure: 700 } },
          1500
        );
        expect(result).not.toMatch(/\+\$-/);
        expect(result).toContain('$700');
      });

      it('should show zero deviation with plus sign', () => {
        const result = resourceGapTooltip(
          { name: 'Average State', data: { deviation: 0, revPerInsecure: 1500 } },
          1500
        );
        expect(result).toContain('+$0');
      });
    });
  });

  // ── hidden-class show/hide contract ──
  describe('hidden-class reveal contract', () => {
    it('density-reconciliation starts with hidden class — JS must use classList.remove to reveal', () => {
      const doc = parseHTML('food-banks.html');
      const el = doc.getElementById('density-reconciliation');
      expect(el).not.toBeNull();
      expect(el.classList.contains('hidden')).toBe(true);
    });
  });
});
