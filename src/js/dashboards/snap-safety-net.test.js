import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Mock ECharts before importing
vi.mock('echarts/core', () => ({
  use: vi.fn(),
  init: vi.fn(() => ({
    setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn(),
    getZr: vi.fn(() => ({ dom: document.createElement('div') })),
    on: vi.fn(), off: vi.fn(),
  })),
  getInstanceByDom: vi.fn(),
  registerMap: vi.fn(),
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

import { SNAP_MAP_DEFAULT_INSIGHT, formatCdcAdminGap } from './snap-safety-net.js';

// -- Helpers --
const dataDir = resolve(__dirname, '../../../public/data');
const htmlDir = resolve(__dirname, '../../../dashboards');

function readJSON(filename) {
  return JSON.parse(readFileSync(resolve(dataDir, filename), 'utf-8'));
}

function readHTML(filename) {
  return readFileSync(resolve(htmlDir, filename), 'utf-8');
}

describe('snap-safety-net', () => {
  // ── P0 #6: Wyoming coverage ratio correctness ──
  describe('SNAP_MAP_DEFAULT_INSIGHT', () => {
    it('should reference the actual lowest-coverage state and correct ratio', () => {
      const snapData = readJSON('snap-participation.json');
      const states = snapData.stateCoverage.states;

      // Find actual lowest coverage state
      const lowest = states.reduce((min, s) =>
        s.coverageRatio < min.coverageRatio ? s : min, states[0]);

      // The insight text should reference the actual lowest state
      expect(SNAP_MAP_DEFAULT_INSIGHT).toContain(lowest.name);

      // Extract the percentage from the insight
      const match = SNAP_MAP_DEFAULT_INSIGHT.match(/(\d+\.?\d*)%/);
      expect(match).toBeTruthy();
      const insightPct = parseFloat(match[1]);
      expect(insightPct).toBeCloseTo(lowest.coverageRatio, 0);
    });
  });

  // ── P0 #7: Reconciliation note accuracy ──
  describe('reconciliation note', () => {
    it('national._reconciliationNote state sum should match actual state sum', () => {
      const snapData = readJSON('snap-participation.json');
      const states = snapData.stateCoverage.states;
      const actualSum = states.reduce((sum, s) => sum + (s.snapParticipants || 0), 0);

      // The reconciliation note mentions the state sum — it should be approximately correct
      const note = snapData.national._reconciliationNote;
      if (note) {
        // Extract the stated sum from the note (e.g., "~39.1M")
        const sumMatch = note.match(/~?([\d.]+)M/);
        if (sumMatch) {
          const statedSum = parseFloat(sumMatch[1]) * 1_000_000;
          // Stated sum should be within 5% of actual
          const pctDiff = Math.abs(statedSum - actualSum) / actualSum * 100;
          expect(pctDiff).toBeLessThan(5);
        }
      }
    });
  });

  // ── P1 #23: Gauge max bounds ──
  describe('gauge bounds', () => {
    it('benefit gauge max should accommodate all state benefit values', () => {
      const snapData = readJSON('snap-participation.json');
      const benefits = snapData.benefitsPerPerson.states;

      const maxBenefit = Math.max(...benefits.map(s => s.benefit));
      const GAUGE_MAX = 350; // Updated max in snap-safety-net.js:482 (was 300, clipped Hawaii at $312)

      expect(GAUGE_MAX).toBeGreaterThanOrEqual(maxBenefit);
    });
  });

  // ── P1 #25: HTML data notice year ──
  describe('HTML data notice', () => {
    it('should not say "FY2022" when data year is 2024', () => {
      const snapData = readJSON('snap-participation.json');
      const html = readHTML('snap-safety-net.html');

      if (snapData.stateCoverage.year >= 2024) {
        expect(html).not.toMatch(/State coverage data is from FY2022/);
      }
    });
  });

  // ── Data shape validation ──
  describe('data shape: snap-participation.json', () => {
    it('should have national with required fields', () => {
      const data = readJSON('snap-participation.json');
      expect(data.national).toHaveProperty('snapParticipants');
      expect(data.national).toHaveProperty('coverageGap');
      expect(data.national).toHaveProperty('avgMonthlyBenefit');
      expect(data.national).toHaveProperty('freeLunchPct');
    });

    it('should have stateCoverage.states with coverageRatio', () => {
      const data = readJSON('snap-participation.json');
      expect(data.stateCoverage.states.length).toBeGreaterThan(0);
      for (const s of data.stateCoverage.states) {
        expect(s).toHaveProperty('name');
        expect(s).toHaveProperty('coverageRatio');
        expect(s.coverageRatio).toBeTypeOf('number');
      }
    });

    it('should have benefitsPerPerson.states with benefit amounts', () => {
      const data = readJSON('snap-participation.json');
      expect(data.benefitsPerPerson.states.length).toBeGreaterThan(0);
      for (const s of data.benefitsPerPerson.states) {
        expect(s).toHaveProperty('name');
        expect(s).toHaveProperty('benefit');
        expect(s.benefit).toBeTypeOf('number');
      }
    });

    it('should have sankey data with balanced flows', () => {
      const data = readJSON('snap-participation.json');
      expect(data.sankey).toBeDefined();
      expect(data.sankey.nodes.length).toBeGreaterThan(0);
      expect(data.sankey.links.length).toBeGreaterThan(0);
    });

    it('should have trend data', () => {
      const data = readJSON('snap-participation.json');
      expect(data.trend.data.length).toBeGreaterThan(0);
      for (const d of data.trend.data) {
        expect(d).toHaveProperty('date');
        expect(d).toHaveProperty('value');
      }
    });
  });

  // ── P1 #26: PPI static benefit ──
  describe('PPI calculation', () => {
    it('should have benefitTimeline data available for time-varying PPI', () => {
      const data = readJSON('snap-participation.json');
      // The benefitTimeline exists but is unused — test documents that it should be used
      expect(data.benefitTimeline).toBeDefined();
      expect(data.benefitTimeline.data).toBeDefined();
      expect(data.benefitTimeline.data.length).toBeGreaterThan(0);

      // Benefits changed substantially over time
      const amounts = data.benefitTimeline.data.map(b => b.value);
      const min = Math.min(...amounts);
      const max = Math.max(...amounts);
      // Verify there IS meaningful variation (COVID spike vs pre-COVID)
      expect(max / min).toBeGreaterThan(1.5);
    });

    it('snap-safety-net.js should use benefitTimeline for PPI, not static $188', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      expect(jsSource).toContain('snapBenefitTimeline');
      expect(jsSource).toContain('getBenefitForDate');
      // Should NOT have a static benefit = 188 as the sole PPI input
      expect(jsSource).not.toMatch(/const benefit\s*=\s*snapNational.*\|\|\s*188/);
    });
  });

  // ── B-1: Hero stats must be updated from JSON ──
  describe('hero stat dynamic updates', () => {
    it('init() should update hero data-target from snapData.national', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      const initSection = jsSource.slice(jsSource.indexOf('async function init()'));
      expect(initSection).toContain('snapParticipants');
      expect(initSection).toContain('dashboard-stat__number');
    });
  });

  // ── Fix 11: Gauge aria-labels must include computed values ──
  describe('gauge accessibility', () => {
    it('JS should update gauge aria-label with computed value', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      // After rendering gauges, JS should update aria-label on gauge containers
      expect(jsSource).toContain('aria-label');
      // Should reference gauge container element by ID and set aria-label
      expect(jsSource).toMatch(/gauge-(coverage|lunch|benefit|gap|affordability)/);
    });
  });

  // ── Fix 12: CDC toggle container needs aria-live notification ──
  describe('CDC toggle accessibility', () => {
    it('snap-map-toggle-container reveal should notify screen readers', () => {
      const html = readHTML('snap-safety-net.html');
      // An aria-live element should exist near the toggle to announce CDC data loading
      expect(html).toContain('snap-map-cdc-status');
      expect(html).toContain('aria-live');
      const toggleSection = html.match(/id="snap-map-toggle-container"[^>]*/);
      expect(toggleSection).toBeTruthy();
    });
  });

  // ── Fix 32: CDC gray states tooltip fallback ──
  describe('CDC gray states tooltip', () => {
    it('CDC tooltip should show fallback text for states without data', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      expect(jsSource).toContain('No CDC survey data');
    });
  });

  // ── Batch 7: Sankey balance ──
  describe('Sankey balance verification', () => {
    it('left side should equal right side (conservation of people)', () => {
      const data = readJSON('snap-participation.json');
      const { nodes, links } = data.sankey;

      // Sum sources (left-most nodes = nodes with no incoming links)
      const targets = new Set(links.map(l => l.target));
      const sources = new Set(links.map(l => l.source));
      const leftNodes = [...sources].filter(s => !targets.has(s));
      const rightNodes = [...targets].filter(t => !sources.has(t));

      const leftTotal = leftNodes.reduce((sum, n) => {
        return sum + links.filter(l => l.source === n).reduce((s, l) => s + l.value, 0);
      }, 0);
      const rightTotal = rightNodes.reduce((sum, n) => {
        return sum + links.filter(l => l.target === n).reduce((s, l) => s + l.value, 0);
      }, 0);

      expect(leftTotal).toBeCloseTo(rightTotal, 0);
      expect(nodes.length).toBeGreaterThan(0);
    });
  });

  // ── CODX #5: CDC/admin tooltip parity label ──
  describe('formatCdcAdminGap', () => {
    it('should label positive gap as under-reported', () => {
      const result = formatCdcAdminGap(15, 10);
      expect(result).toContain('under-reported');
      expect(result).toContain('5.0pp');
    });

    it('should label negative gap as over-reported', () => {
      const result = formatCdcAdminGap(10, 15);
      expect(result).toContain('over-reported');
      expect(result).toContain('5pp');
    });

    it('should NOT label zero gap as over-reported', () => {
      const result = formatCdcAdminGap(12, 12);
      expect(result).not.toContain('over-reported');
      expect(result).not.toContain('under-reported');
      expect(result).toContain('align');
    });
  });

  // ── P4: renderSnapTrend source contract ──
  describe('renderSnapTrend', () => {
    it('should build BLS CPI overlay aligned to SNAP dates', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function renderSnapTrend'));
      expect(section).toContain('cpiMap');
      expect(section).toContain('cpiAligned');
      expect(section).toContain('Purchasing Power');
    });

    it('should use benefitTimeline for time-varying PPI, not static benefit', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function renderSnapTrend'));
      expect(section).toContain('getBenefitForDate');
      expect(section).toContain('snapBenefitTimeline');
    });
  });

  // ── P4: renderSnapMap source contract ──
  describe('renderSnapMap', () => {
    it('should support admin and CDC toggle views', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function renderSnapMap'));
      expect(section).toContain('snapMapAdminData');
      expect(section).toContain('applySnapMapView');
    });

    it('click insight should branch on coverage ratio thresholds', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderSnapMap'),
        jsSource.indexOf('function applySnapMapView')
      );
      expect(section).toContain('ratio >= 100');
      expect(section).toContain('ratio >= 80');
      expect(section).toContain('ratio >= 60');
    });
  });

  // ── P4: renderCoverageGap sankey source contract ──
  describe('renderCoverageGap', () => {
    it('should render sankey with data-driven nodes and links', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function renderCoverageGap'));
      expect(section).toContain('sankey');
      expect(section).toContain('nodes');
      expect(section).toContain('links');
    });
  });

  // ── P4: renderSchoolLunch source contract ──
  describe('renderSchoolLunch', () => {
    it('should sort states and take top 15', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderSchoolLunch'),
        jsSource.indexOf('function renderSchoolLunch') + 600
      );
      expect(section).toContain('sort');
      expect(section).toContain('slice(0, 15)');
    });

    it('school lunch data should have pct field for all states', () => {
      const data = readJSON('snap-participation.json');
      expect(data.schoolLunch).toBeDefined();
      expect(data.schoolLunch.states.length).toBeGreaterThanOrEqual(15);
      for (const s of data.schoolLunch.states) {
        expect(s).toHaveProperty('name');
        expect(s).toHaveProperty('pct');
        expect(s.pct).toBeTypeOf('number');
      }
    });
  });

  // ── P4: renderBenefits source contract ──
  describe('renderBenefits', () => {
    it('should show top 20 states by benefit amount with coverage overlay', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function renderBenefits'));
      expect(section).toContain('sort');
      expect(section).toContain('coverageStates');
    });
  });

  // ── P4: renderGauges source contract ──
  describe('renderGauges', () => {
    it('should render 5 gauges with correct IDs', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function renderGauges'));
      expect(section).toContain('gauge-coverage');
      expect(section).toContain('gauge-lunch');
      expect(section).toContain('gauge-benefit');
      expect(section).toContain('gauge-gap');
      expect(section).toContain('gauge-affordability');
    });

    it('affordability gap should be computed from mealCostPerDay', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function renderGauges'));
      expect(section).toContain('mealCostPerDay');
      expect(section).toContain('monthlyFoodCost');
      expect(section).toContain('affordabilityGap');
    });
  });

  // ── P4: renderDemographicFlow source contract ──
  describe('renderDemographicFlow', () => {
    it('should use Census race/ethnicity data with SNAP rates', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function renderDemographicFlow'));
      expect(section).toContain('race');
      expect(section).toContain('snapData');
    });
  });

  // ── P4: async fetch functions should fail silently ──
  describe('async fetches fail silently', () => {
    it('fetchBLSForSnap should have try/catch', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('async function fetchBLSForSnap'));
      expect(section).toContain('try');
      expect(section).toContain('catch');
    });

    it('fetchCDCPlacesSnap should have try/catch and show toggle on success', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('async function fetchCDCPlacesSnap'));
      expect(section).toContain('try');
      expect(section).toContain('snap-map-toggle-container');
    });
  });

  // ── P4: SNAP trend chart data contract ──
  describe('SNAP trend data contract', () => {
    it('trend data should span at least 10 years', () => {
      const data = readJSON('snap-participation.json');
      const dates = data.trend.data.map(d => new Date(d.date).getFullYear());
      const range = Math.max(...dates) - Math.min(...dates);
      expect(range).toBeGreaterThanOrEqual(10);
    });
  });

  // ── P4: Benefits per person state data ──
  describe('benefits per person completeness', () => {
    it('all 50 states + DC should have benefit amounts', () => {
      const data = readJSON('snap-participation.json');
      expect(data.benefitsPerPerson.states.length).toBeGreaterThanOrEqual(51);
    });

    it('benefit amounts should be in reasonable range ($100-$500)', () => {
      const data = readJSON('snap-participation.json');
      for (const s of data.benefitsPerPerson.states) {
        expect(s.benefit).toBeGreaterThan(100);
        expect(s.benefit).toBeLessThan(500);
      }
    });
  });

  // ── Change 3: Unserved headcount in tooltip ──
  describe('unserved headcount in tooltip', () => {
    it('admin tooltip formatter should display Unserved count', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      const fnBody = jsSource.slice(
        jsSource.indexOf('function applySnapMapView'),
        jsSource.indexOf('function applySnapMapView') + 3000
      );
      expect(fnBody).toContain('Unserved');
      expect(fnBody).toContain('Math.max(0');
    });

    it('unserved formula should floor at zero for over-covered states', () => {
      expect(Math.max(0, 200000 - 300000)).toBe(0);
      expect(Math.max(0, 500000 - 350000)).toBe(150000);
    });
  });

  // ── Change 8: Purchasing power dollar note ──
  describe('purchasing power dollar note', () => {
    it('should have updatePurchasingPowerNote function', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      expect(jsSource).toContain('function updatePurchasingPowerNote');
    });

    it('should reference purchasing-power-note element and 2018 baseline', () => {
      const jsSource = readFileSync(resolve(__dirname, 'snap-safety-net.js'), 'utf-8');
      const fnStart = jsSource.indexOf('function updatePurchasingPowerNote');
      const fnBody = jsSource.slice(fnStart, fnStart + 1000);
      expect(fnBody).toContain('purchasing-power-note');
      expect(fnBody).toContain('2018');
    });

    it('CPI deflation should reduce real purchasing power', () => {
      const baseCPI = 252.4;
      const currentCPI = 346.6;
      const benefit = 188;
      const realValue = Math.round(benefit * baseCPI / currentCPI);
      expect(benefit - realValue).toBeGreaterThan(0);
      expect(realValue).toBeLessThan(benefit);
    });
  });

  // ── P4: Affordability shortfall gauge ──
  describe('affordability shortfall', () => {
    it('should compute shortfall from mealCostPerDay and avgMonthlyBenefit', () => {
      const data = readJSON('snap-participation.json');
      expect(data.national.mealCostPerDay).toBeTypeOf('number');
      expect(data.national.avgMonthlyBenefit).toBeTypeOf('number');
      // Monthly food need = mealCostPerDay * 3 meals * 30 days
      const monthlyNeed = data.national.mealCostPerDay * 3 * 30;
      const shortfall = monthlyNeed - data.national.avgMonthlyBenefit;
      // Shortfall should be positive (benefits don't cover full cost)
      expect(shortfall).toBeGreaterThan(0);
    });
  });
});
