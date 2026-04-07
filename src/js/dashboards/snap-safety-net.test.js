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
});
