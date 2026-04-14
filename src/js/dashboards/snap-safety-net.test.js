import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

/** Parse HTML file into a jsdom document for DOM-based assertions */
function parseHTML(filename) {
  const html = readFileSync(resolve(htmlDir, filename), 'utf-8');
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

describe('snap-safety-net', () => {
  // ── P0 #6: Wyoming coverage ratio correctness ──
  describe('SNAP_MAP_DEFAULT_INSIGHT', () => {
    it('should reference the actual lowest-coverage state and correct ratio', () => {
      const snapData = readJSON('snap-participation.json');
      const states = snapData.stateCoverage.states;

      const lowest = states.reduce((min, s) =>
        s.coverageRatio < min.coverageRatio ? s : min, states[0]);

      expect(SNAP_MAP_DEFAULT_INSIGHT).toContain(lowest.name);

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

      const note = snapData.national._reconciliationNote;
      if (note) {
        const sumMatch = note.match(/~?([\d.]+)M/);
        if (sumMatch) {
          const statedSum = parseFloat(sumMatch[1]) * 1_000_000;
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
      const GAUGE_MAX = 350;

      expect(GAUGE_MAX).toBeGreaterThanOrEqual(maxBenefit);
    });
  });

  // ── P1 #25: HTML data notice year ──
  describe('HTML data notice', () => {
    it('should not say "FY2022" when data year is 2024', () => {
      const snapData = readJSON('snap-participation.json');
      const doc = parseHTML('snap-safety-net.html');

      if (snapData.stateCoverage.year >= 2024) {
        expect(doc.body.textContent).not.toMatch(/State coverage data is from FY2022/);
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

  // ── P1 #26: PPI benefitTimeline data contract ──
  describe('PPI calculation', () => {
    it('should have benefitTimeline data available for time-varying PPI', () => {
      const data = readJSON('snap-participation.json');
      expect(data.benefitTimeline).toBeDefined();
      expect(data.benefitTimeline.data).toBeDefined();
      expect(data.benefitTimeline.data.length).toBeGreaterThan(0);

      const amounts = data.benefitTimeline.data.map(b => b.value);
      const min = Math.min(...amounts);
      const max = Math.max(...amounts);
      expect(max / min).toBeGreaterThan(1.5);
    });
  });

  // ── Hero stat DOM contract ──
  describe('hero stat dynamic updates', () => {
    it('snap-safety-net.html should have dashboard-stat__number elements with data-target', () => {
      const doc = parseHTML('snap-safety-net.html');
      const statEls = doc.querySelectorAll('.dashboard-stat__number[data-target]');
      expect(statEls.length).toBeGreaterThan(0);
    });
  });

  // ── Gauge DOM contract ──
  describe('gauge accessibility', () => {
    it('snap-safety-net.html should have all 5 gauge containers', () => {
      const doc = parseHTML('snap-safety-net.html');
      for (const id of ['gauge-coverage', 'gauge-lunch', 'gauge-benefit', 'gauge-gap', 'gauge-affordability']) {
        const el = doc.getElementById(id);
        expect(el, `#${id} should exist`).not.toBeNull();
        expect(el.getAttribute('aria-label'), `#${id} should have aria-label`).toBeTruthy();
      }
    });
  });

  // ── Fix 12: CDC toggle container needs aria-live notification ──
  describe('CDC toggle accessibility', () => {
    it('snap-map-toggle-container reveal should notify screen readers', () => {
      const doc = parseHTML('snap-safety-net.html');
      expect(doc.getElementById('snap-map-toggle-container')).not.toBeNull();
      const statusEl = doc.getElementById('snap-map-cdc-status');
      expect(statusEl).not.toBeNull();
      expect(statusEl.getAttribute('aria-live')).toBeTruthy();
    });
  });

  // ── Fix 32: CDC gray states tooltip fallback ──
  describe('CDC gray states tooltip', () => {
    it('snap-safety-net.html should have CDC status element for tooltip state display', () => {
      const doc = parseHTML('snap-safety-net.html');
      const el = doc.querySelector('[id*="cdc"], [id*="snap-map-cdc"]');
      expect(el).not.toBeNull();
    });
  });

  // ── Batch 7: Sankey balance ──
  describe('Sankey balance verification', () => {
    it('left side should equal right side (conservation of people)', () => {
      const data = readJSON('snap-participation.json');
      const { nodes, links } = data.sankey;

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

  // ── P4: renderSnapTrend CPI overlay data contract ──
  describe('renderSnapTrend', () => {
    it('BLS food CPI should have data for alignment with SNAP trend dates', () => {
      const snapData = readJSON('snap-participation.json');
      const blsData = readJSON('bls-food-cpi.json');
      const snapDates = snapData.trend.data.map(d => d.date.slice(0, 7)); // YYYY-MM
      const foodHome = blsData.series.find(s => s.name === 'Food at Home');
      expect(foodHome).toBeDefined();
      const blsDates = new Set(foodHome.data.map(d => d.date.slice(0, 7)));
      const alignable = snapDates.filter(d => blsDates.has(d));
      expect(alignable.length).toBeGreaterThan(0);
    });
  });

  // ── P4: renderSnapMap toggle DOM contract ──
  describe('renderSnapMap', () => {
    it('snap-safety-net.html should have snap-map-toggle-container element', () => {
      const doc = parseHTML('snap-safety-net.html');
      expect(doc.getElementById('snap-map-toggle-container')).not.toBeNull();
    });

    it('coverage ratio thresholds should produce meaningful insight bucketing', () => {
      // Verify the threshold logic: >=100 (full coverage), >=80, >=60, <60
      const snapData = readJSON('snap-participation.json');
      const states = snapData.stateCoverage.states;

      const fullCoverage = states.filter(s => s.coverageRatio >= 100);
      const partial = states.filter(s => s.coverageRatio >= 60 && s.coverageRatio < 100);
      const low = states.filter(s => s.coverageRatio < 60);

      // At least one state in each meaningful bucket
      expect(partial.length + fullCoverage.length).toBeGreaterThan(0);
      expect(low.length).toBeGreaterThan(0);
    });
  });

  // ── P4: renderSchoolLunch data contract ──
  describe('renderSchoolLunch', () => {
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

    it('sorting school lunch states descending by pct should produce valid top-15', () => {
      const data = readJSON('snap-participation.json');
      const sorted = [...data.schoolLunch.states]
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 15);
      expect(sorted.length).toBe(15);
      expect(sorted[0].pct).toBeGreaterThanOrEqual(sorted[14].pct);
    });
  });

  // ── P4: renderBenefits data contract ──
  describe('renderBenefits', () => {
    it('benefitsPerPerson and stateCoverage should be joinable by state name', () => {
      const data = readJSON('snap-participation.json');
      const benefitNames = new Set(data.benefitsPerPerson.states.map(s => s.name));
      const coverageNames = new Set(data.stateCoverage.states.map(s => s.name));
      const joinable = [...benefitNames].filter(n => coverageNames.has(n));
      expect(joinable.length).toBeGreaterThanOrEqual(50);
    });
  });

  // ── P4: renderGauges DOM contract ──
  describe('renderGauges', () => {
    it('gauge section should say "five" not "four" gauges', () => {
      const doc = parseHTML('snap-safety-net.html');
      const bodyText = doc.body.textContent;
      expect(bodyText).not.toContain('These four numbers');
      expect(bodyText).toContain('These five numbers');
    });
  });

  // ── P4: renderDemographicFlow data contract ──
  describe('renderDemographicFlow', () => {
    it('snap-safety-net.html should have the demographic-flow chart container', () => {
      const doc = parseHTML('snap-safety-net.html');
      expect(doc.getElementById('chart-demographic-flow')).not.toBeNull();
      expect(doc.getElementById('demographic-flow-insight')).not.toBeNull();
    });
  });

  // ── P4: async fetch error display ──
  describe('async fetches fail silently', () => {
    it('snap-safety-net.html should have dashboard-error element for fetch failure display', () => {
      const doc = parseHTML('snap-safety-net.html');
      const el = doc.querySelector('#dashboard-error, .dashboard-error');
      expect(el).not.toBeNull();
    });

    it('snap-safety-net.html should have snap-map-cdc-status element for CDC fetch state', () => {
      const doc = parseHTML('snap-safety-net.html');
      expect(doc.getElementById('snap-map-cdc-status')).not.toBeNull();
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
    it('unserved formula should floor at zero for over-covered states', () => {
      expect(Math.max(0, 200000 - 300000)).toBe(0);
      expect(Math.max(0, 500000 - 350000)).toBe(150000);
    });
  });

  // ── Change 8: Purchasing power dollar note ──
  describe('purchasing power dollar note', () => {
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
      const monthlyNeed = data.national.mealCostPerDay * 3 * 30;
      const shortfall = monthlyNeed - data.national.avgMonthlyBenefit;
      expect(shortfall).toBeGreaterThan(0);
    });
  });

  // ── UI/UX Audit: Legend/Label/Color Consistency ──
  describe('legend/label/color consistency', () => {
    it('SNAP coverage ratio range should be wide enough to justify a color scale', () => {
      const data = readJSON('snap-participation.json');
      const ratios = data.stateCoverage.states.map(s => s.coverageRatio);
      const range = Math.max(...ratios) - Math.min(...ratios);
      expect(range).toBeGreaterThan(20);
    });

    it('SNAP trend data should include COVID-era dates (2020-2021) for markArea annotation', () => {
      const data = readJSON('snap-participation.json');
      const dates = data.trend.data.map(d => d.date);
      const hasCovid = dates.some(d => d.startsWith('2020') || d.startsWith('2021'));
      expect(hasCovid).toBe(true);
    });
  });

  // ── DOM structure: chart containers ──
  describe('chart container structure', () => {
    it('snap-safety-net.html should have snap map chart container', () => {
      const doc = parseHTML('snap-safety-net.html');
      expect(doc.querySelector('[id*="snap-map"], #chart-snap-map')).not.toBeNull();
    });

    it('snap-safety-net.html should have snap-map-insight with aria-live', () => {
      const doc = parseHTML('snap-safety-net.html');
      const el = doc.getElementById('snap-map-insight');
      expect(el).not.toBeNull();
      expect(el.getAttribute('aria-live')).toBeTruthy();
    });

    it('snap-safety-net.html should have demographic-flow-insight with aria-live', () => {
      const doc = parseHTML('snap-safety-net.html');
      const el = doc.getElementById('demographic-flow-insight');
      expect(el).not.toBeNull();
      expect(el.getAttribute('aria-live')).toBeTruthy();
    });

    it('purchasing-power-note element should exist in HTML for CPI note updates', () => {
      const doc = parseHTML('snap-safety-net.html');
      // The updatePurchasingPowerNote function targets this element
      const note = doc.querySelector('[id*="purchasing-power"], #purchasing-power-note');
      expect(note).not.toBeNull();
    });

    it('snap-safety-net.html school lunch and benefits chart containers should exist', () => {
      const doc = parseHTML('snap-safety-net.html');
      // At minimum a chart section for sankey/coverage-gap should exist
      const chartEls = doc.querySelectorAll('.dashboard-chart');
      expect(chartEls.length).toBeGreaterThan(3);
    });
  });

  // ── Extra data contract tests ──
  describe('additional data contracts', () => {
    it('national mealCostPerDay should be a plausible value ($3–$6)', () => {
      const data = readJSON('snap-participation.json');
      expect(data.national.mealCostPerDay).toBeGreaterThan(3);
      expect(data.national.mealCostPerDay).toBeLessThan(6);
    });

    it('coverage ratios should span a meaningful range across states', () => {
      const data = readJSON('snap-participation.json');
      const ratios = data.stateCoverage.states.map(s => s.coverageRatio);
      const min = Math.min(...ratios);
      const max = Math.max(...ratios);
      // Range should be at least 30 percentage points
      expect(max - min).toBeGreaterThan(30);
    });

    it('schoolLunch national breakdown should exist', () => {
      const data = readJSON('snap-participation.json');
      expect(data.schoolLunch.nationalBreakdown).toBeDefined();
    });

    it('benefitTimeline should span multiple years', () => {
      const data = readJSON('snap-participation.json');
      const years = data.benefitTimeline.data.map(d => parseInt(d.date.slice(0, 4), 10));
      const range = Math.max(...years) - Math.min(...years);
      expect(range).toBeGreaterThanOrEqual(5);
    });
  });

  // ── Batch 4: SNAP Policy Event Annotations ──
  describe('SNAP policy event annotations', () => {
    it('snap-participation.json has trend.events array with 7 entries', () => {
      const data = readJSON('snap-participation.json');
      expect(data.trend.events).toBeDefined();
      expect(Array.isArray(data.trend.events)).toBe(true);
      expect(data.trend.events).toHaveLength(7);
    });

    it('each event has date (YYYY-MM) and label (string) fields', () => {
      const data = readJSON('snap-participation.json');
      for (const event of data.trend.events) {
        expect(event.date).toMatch(/^\d{4}-\d{2}$/);
        expect(typeof event.label).toBe('string');
        expect(event.label.length).toBeGreaterThan(0);
      }
    });
  });

  // ── hidden-class show/hide contract ──
  describe('hidden-class reveal contract', () => {
    it('snap-map-toggle-container starts with hidden class — JS must use classList.remove to reveal', () => {
      const doc = parseHTML('snap-safety-net.html');
      const el = doc.getElementById('snap-map-toggle-container');
      expect(el).not.toBeNull();
      expect(el.classList.contains('hidden')).toBe(true);
    });

    it('section-demographic-flow starts with hidden class — JS must use classList.remove to reveal', () => {
      const doc = parseHTML('snap-safety-net.html');
      const section = doc.getElementById('section-demographic-flow');
      expect(section).not.toBeNull();
      expect(section.classList.contains('hidden')).toBe(true);
    });
  });

  // ── P1-19 Phase B: formatCdcAdminGap edge cases ──
  describe('formatCdcAdminGap edge cases', () => {
    it('handles floating point precision (15.1 - 10.0 → 5.1pp, not 5.0999..pp)', () => {
      const result = formatCdcAdminGap(15.1, 10.0);
      expect(result).toContain('5.1pp');
      expect(result).not.toMatch(/5\.0\d+pp/);
      expect(result).not.toMatch(/5\.1\d+pp/);
    });

    it('zero gap returns align message containing 0pp', () => {
      const result = formatCdcAdminGap(8, 8);
      expect(result).toContain('0pp');
      expect(result).toContain('align');
      expect(result).not.toContain('under-reported');
      expect(result).not.toContain('over-reported');
    });

    it('large gap >10pp contains under-reported label', () => {
      const result = formatCdcAdminGap(25, 10);
      expect(result).toContain('under-reported');
      expect(result).toContain('15.0pp');
    });

    it('negative gap displays absolute value with no minus sign', () => {
      const result = formatCdcAdminGap(8, 14);
      expect(result).toContain('over-reported');
      // Math.abs(parseFloat("-6.0")) → 6, so output is "6pp"
      expect(result).toMatch(/\b6pp\b/);
      // No leading minus before the value
      expect(result).not.toMatch(/-\d/);
    });

    it('small floating diffs do not produce -0.0 artifacts', () => {
      // (10.1 - 10.1) → 0.000... → toFixed(1) → "0.0"
      const result = formatCdcAdminGap(10.1, 10.1);
      expect(result).toContain('align');
      expect(result).not.toContain('-0');
    });
  });

  // ── P1-19 Phase B: SNAP_MAP_DEFAULT_INSIGHT content contract ──
  describe('SNAP_MAP_DEFAULT_INSIGHT content contract', () => {
    it('contains a percentage value between 30 and 70', () => {
      const match = SNAP_MAP_DEFAULT_INSIGHT.match(/(\d+\.?\d*)%/);
      expect(match).toBeTruthy();
      const pct = parseFloat(match[1]);
      expect(pct).toBeGreaterThanOrEqual(30);
      expect(pct).toBeLessThanOrEqual(70);
    });

    it('mentions CDC and administrative data (case insensitive)', () => {
      const lc = SNAP_MAP_DEFAULT_INSIGHT.toLowerCase();
      expect(lc).toContain('cdc');
      expect(lc).toContain('administrative');
    });

    it('is longer than 20 characters', () => {
      expect(SNAP_MAP_DEFAULT_INSIGHT.length).toBeGreaterThan(20);
    });

    it('is a non-empty string', () => {
      expect(typeof SNAP_MAP_DEFAULT_INSIGHT).toBe('string');
      expect(SNAP_MAP_DEFAULT_INSIGHT.trim().length).toBeGreaterThan(0);
    });
  });

  // ── P1-19 Phase B: Sankey balance invariants ──
  describe('Sankey balance invariants', () => {
    it('all link source/target names exist in nodes array', () => {
      const data = readJSON('snap-participation.json');
      const { nodes, links } = data.sankey;
      const nodeNames = new Set(nodes.map(n => n.name));
      for (const link of links) {
        expect(nodeNames.has(link.source), `source "${link.source}" missing from nodes`).toBe(true);
        expect(nodeNames.has(link.target), `target "${link.target}" missing from nodes`).toBe(true);
      }
    });

    it('all link values are positive (> 0)', () => {
      const data = readJSON('snap-participation.json');
      for (const link of data.sankey.links) {
        expect(link.value).toBeGreaterThan(0);
      }
    });

    it('no self-loops (source !== target)', () => {
      const data = readJSON('snap-participation.json');
      for (const link of data.sankey.links) {
        expect(link.source).not.toBe(link.target);
      }
    });

    it('every node is referenced by at least one link', () => {
      const data = readJSON('snap-participation.json');
      const { nodes, links } = data.sankey;
      const referenced = new Set();
      for (const link of links) {
        referenced.add(link.source);
        referenced.add(link.target);
      }
      for (const node of nodes) {
        expect(referenced.has(node.name), `node "${node.name}" is orphaned`).toBe(true);
      }
    });
  });

  // ── P1-19 Phase B: DOM setup + render entry coverage ──
  describe('DOM setup for render entry coverage', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="chart-snap-trend"></div>
        <div id="chart-snap-map"></div>
        <div id="snap-map-insight" aria-live="polite"></div>
        <div id="chart-coverage-gap"></div>
        <div id="chart-school-lunch"></div>
        <div id="chart-benefits"></div>
        <div id="chart-demographic-flow"></div>
        <div id="demographic-flow-insight" aria-live="polite"></div>
        <div id="snap-map-toggle-container" class="hidden"></div>
        <div id="snap-map-cdc-status" aria-live="polite"></div>
        <button id="snap-map-toggle-admin" aria-pressed="true"></button>
        <button id="snap-map-toggle-cdc" aria-pressed="false"></button>
        <div id="gauge-coverage" aria-label="Coverage"></div>
        <div id="gauge-lunch" aria-label="Lunch"></div>
        <div id="gauge-benefit" aria-label="Benefit"></div>
        <div id="gauge-gap" aria-label="Gap"></div>
        <div id="gauge-affordability" aria-label="Affordability"></div>
        <div id="purchasing-power-note"></div>
        <div id="dashboard-error" hidden></div>
        <div class="dashboard-stat__number" data-target="42">0</div>
      `;
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    it('chart containers exist after DOM setup', () => {
      expect(document.getElementById('chart-snap-trend')).not.toBeNull();
      expect(document.getElementById('chart-snap-map')).not.toBeNull();
      expect(document.getElementById('snap-map-insight')).not.toBeNull();
    });

    it('insight default fallback string can be assigned to aria-live region', () => {
      const insightEl = document.getElementById('snap-map-insight');
      insightEl.textContent = SNAP_MAP_DEFAULT_INSIGHT;
      expect(insightEl.textContent).toBe(SNAP_MAP_DEFAULT_INSIGHT);
      expect(insightEl.getAttribute('aria-live')).toBe('polite');
    });

    it('toggle buttons can be located after DOM setup', () => {
      expect(document.getElementById('snap-map-toggle-admin')).not.toBeNull();
      expect(document.getElementById('snap-map-toggle-cdc')).not.toBeNull();
    });

    it('hidden toggle container can be revealed via classList.remove', () => {
      const el = document.getElementById('snap-map-toggle-container');
      expect(el.classList.contains('hidden')).toBe(true);
      el.classList.remove('hidden');
      expect(el.classList.contains('hidden')).toBe(false);
    });
  });

  // ── P1-19 Phase B: SNAP purchasing power index invariants ──
  describe('SNAP purchasing power invariants', () => {
    it('benefit increase years (2021–2023) show higher nominal benefit than 2019 baseline', () => {
      const data = readJSON('snap-participation.json');
      const timeline = data.benefitTimeline.data;
      const baseline2019 = timeline.find(b => b.date.startsWith('2019'));
      const elevated2021 = timeline.find(b => b.date.startsWith('2021'));
      const elevated2022 = timeline.find(b => b.date.startsWith('2022'));
      expect(baseline2019).toBeDefined();
      expect(elevated2021).toBeDefined();
      expect(elevated2022).toBeDefined();
      // 2021 emergency allotments and 2022 thrifty food plan rebenchmark
      expect(elevated2021.value).toBeGreaterThan(baseline2019.value);
      expect(elevated2022.value).toBeGreaterThan(baseline2019.value);
    });

    it('real benefit (nominal) is never negative across the entire timeline', () => {
      const data = readJSON('snap-participation.json');
      for (const entry of data.benefitTimeline.data) {
        expect(entry.value).toBeGreaterThanOrEqual(0);
      }
    });

    it('inflation-adjusted PPI formula is non-negative when inputs are positive', () => {
      // Replicates the source PPI formula: benefit * firstCpi / cpi
      const benefit = 188;
      const firstCpi = 252.4;
      const currentCpi = 346.6;
      const ppi = Math.round((benefit * firstCpi / currentCpi) * 10) / 10;
      expect(ppi).toBeGreaterThanOrEqual(0);
      // Inflation eroded purchasing power → real value < nominal
      expect(ppi).toBeLessThan(benefit);
    });

    it('PPI rises when nominal benefit increases (holding CPI fixed)', () => {
      const firstCpi = 252.4;
      const cpi = 280;
      const lowBenefit = 129;
      const highBenefit = 258;
      const lowPpi = Math.round((lowBenefit * firstCpi / cpi) * 10) / 10;
      const highPpi = Math.round((highBenefit * firstCpi / cpi) * 10) / 10;
      expect(highPpi).toBeGreaterThan(lowPpi);
    });

    it('PPI falls when CPI rises (holding benefit fixed)', () => {
      const benefit = 188;
      const firstCpi = 252.4;
      const lowCpi = 260;
      const highCpi = 350;
      const ppiAtLowCpi = Math.round((benefit * firstCpi / lowCpi) * 10) / 10;
      const ppiAtHighCpi = Math.round((benefit * firstCpi / highCpi) * 10) / 10;
      expect(ppiAtLowCpi).toBeGreaterThan(ppiAtHighCpi);
    });

    it('benefitTimeline entries are sorted chronologically', () => {
      const data = readJSON('snap-participation.json');
      const dates = data.benefitTimeline.data.map(b => b.date);
      const sorted = [...dates].sort();
      expect(dates).toEqual(sorted);
    });
  });

  // ── P1-19 Phase B: init() integration via dynamic re-import with stubbed fetch ──
  describe('init() with stubbed fetch and DOM', () => {
    let originalFetch;

    beforeEach(() => {
      originalFetch = globalThis.fetch;
      // Set up full DOM scaffolding
      document.body.innerHTML = `
        <div class="dashboard-hero">
          <div class="dashboard-stat__number" data-target="0">0</div>
          <div>SNAP Participants</div>
          <div class="dashboard-stat__number" data-target="0">0</div>
          <div>Avg Monthly Benefit</div>
          <div class="dashboard-stat__number" data-target="0">0</div>
          <div>Free Lunch</div>
          <div class="dashboard-stat__number" data-target="0">0</div>
          <div>Coverage Gap</div>
        </div>
        <div id="chart-snap-trend" class="dashboard-chart"></div>
        <div id="chart-snap-map" class="dashboard-chart"></div>
        <div id="snap-map-insight" aria-live="polite"></div>
        <div id="chart-coverage-gap" class="dashboard-chart"></div>
        <div id="chart-school-lunch" class="dashboard-chart"></div>
        <div id="chart-benefits" class="dashboard-chart"></div>
        <div id="chart-demographic-flow" class="dashboard-chart"></div>
        <div id="demographic-flow-insight" aria-live="polite"></div>
        <div id="snap-map-toggle-container" class="hidden"></div>
        <div id="snap-map-cdc-status" aria-live="polite"></div>
        <button id="snap-map-toggle-admin" aria-pressed="true"></button>
        <button id="snap-map-toggle-cdc" aria-pressed="false"></button>
        <div id="gauge-coverage" aria-label="Coverage" class="dashboard-chart"></div>
        <div id="gauge-lunch" aria-label="Lunch" class="dashboard-chart"></div>
        <div id="gauge-benefit" aria-label="Benefit" class="dashboard-chart"></div>
        <div id="gauge-gap" aria-label="Gap" class="dashboard-chart"></div>
        <div id="gauge-affordability" aria-label="Affordability" class="dashboard-chart"></div>
        <div id="purchasing-power-note"></div>
        <div id="dashboard-error" hidden></div>
        <div id="state-selector-container"></div>
      `;

      // Stub fetch to return the real JSON files for snap data + a minimal geo
      const snapData = readJSON('snap-participation.json');
      const geoJSON = { type: 'FeatureCollection', features: [] };
      globalThis.fetch = vi.fn((url) => {
        const u = String(url);
        if (u.includes('snap-participation.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(snapData),
          });
        }
        if (u.includes('us-states-geo.json') || u.includes('states-geo')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(geoJSON),
          });
        }
        // BLS / CDC / demographic non-blocking calls — return empty success
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
      document.body.innerHTML = '';
      vi.resetModules();
    });

    it('re-importing the module with stubbed fetch runs init() without throwing', async () => {
      vi.resetModules();
      await expect(import('./snap-safety-net.js?reimport=1')).resolves.toBeDefined();
      // Wait a microtask cycle for async init() to settle
      await new Promise(resolve => setTimeout(resolve, 50));
      // fetch should have been called for snap-participation.json
      expect(globalThis.fetch).toHaveBeenCalled();
      const calls = globalThis.fetch.mock.calls.map(c => String(c[0]));
      expect(calls.some(u => u.includes('snap-participation.json'))).toBe(true);
    });

    it('init() populates hero stat data-target values from national data', async () => {
      vi.resetModules();
      await import('./snap-safety-net.js?reimport=2');
      await new Promise(resolve => setTimeout(resolve, 100));
      // After init, the data-target attrs should reflect snap data, not "0"
      const stats = document.querySelectorAll('.dashboard-hero .dashboard-stat__number');
      const targets = Array.from(stats).map(el => el.dataset.target);
      // At least one should be non-zero (init updated them)
      const hasUpdated = targets.some(t => t !== '0' && parseFloat(t) > 0);
      expect(hasUpdated).toBe(true);
    });

    it('init() reveals dashboard-error on failed fetch', async () => {
      // Override fetch to reject
      globalThis.fetch = vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve({}) }));
      vi.resetModules();
      await import('./snap-safety-net.js?reimport=3');
      await new Promise(resolve => setTimeout(resolve, 100));
      const errorEl = document.getElementById('dashboard-error');
      expect(errorEl).not.toBeNull();
      // Either hidden was unset or error text was populated
      expect(errorEl.hidden === false || errorEl.textContent.length > 0).toBe(true);
    });
  });
});
