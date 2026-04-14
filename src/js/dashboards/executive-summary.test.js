import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Mock ECharts before importing.
// Tracks chart instances by DOM element so tests can introspect setOption calls
// after invoking exported render functions.
const __chartInstances = new Map();
function __makeMockChart() {
  return {
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
    getZr: vi.fn(() => ({ dom: document.createElement('div') })),
    on: vi.fn(),
    off: vi.fn(),
    dispatchAction: vi.fn(),
    getOption: vi.fn(() => ({})),
  };
}
vi.mock('echarts/core', () => ({
  use: vi.fn(),
  init: vi.fn((container) => {
    const chart = __makeMockChart();
    if (container) __chartInstances.set(container, chart);
    return chart;
  }),
  getInstanceByDom: vi.fn((el) => __chartInstances.get(el) || null),
  registerMap: vi.fn(),
  graphic: {
    LinearGradient: class {
      constructor(...args) { this.args = args; }
    },
  },
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

import { computeVulnerabilityIndex, renderPriceImpact } from './executive-summary.js';
import { getRegion } from './shared/dashboard-utils.js';

/** Helper: build a synthetic BLS "Food at Home" series with N consecutive monthly points starting Jan 2020. */
function buildFoodAtHomeSeries(numPoints, startValue = 250) {
  const data = [];
  for (let i = 0; i < numPoints; i++) {
    const year = 2020 + Math.floor(i / 12);
    const month = (i % 12) + 1;
    data.push({
      date: `${year}-${String(month).padStart(2, '0')}`,
      value: +(startValue + i * 0.5).toFixed(2),
    });
  }
  return { series: [{ name: 'Food at Home', data }] };
}

// -- Helpers --
const dataDir = resolve(__dirname, '../../../public/data');
const htmlDir = resolve(__dirname, '../../../dashboards');

function readJSON(filename) {
  return JSON.parse(readFileSync(resolve(dataDir, filename), 'utf-8'));
}

/** Parse HTML file from dashboards/ into a jsdom document for DOM-based assertions */
function parseHTML(filename) {
  const html = readFileSync(resolve(htmlDir, filename), 'utf-8');
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

/** Parse HTML file from the repo root into a jsdom document for DOM-based assertions */
function parseRootHTML(filename) {
  const rootDir = resolve(__dirname, '../../..');
  const html = readFileSync(resolve(rootDir, filename), 'utf-8');
  return new DOMParser().parseFromString(html, 'text/html');
}

describe('executive-summary', () => {
  // ── P0 #1: Vulnerability Index formula correctness ──
  describe('computeVulnerabilityIndex', () => {
    it('should weight meal cost at 0.3 (30%), not multiply by 30', () => {
      const states = [
        { name: 'TestState', rate: 15, povertyRate: 20, mealCost: 4.0 },
        { name: 'MaxCost', rate: 10, povertyRate: 10, mealCost: 5.0 },
      ];
      const result = computeVulnerabilityIndex(states);
      const testState = result.find(s => s.name === 'TestState');

      // Documented formula: (rate * 0.4) + (povertyRate * 0.3) + ((mealCost/maxMealCost) * 0.3)
      const expected = (15 * 0.4) + (20 * 0.3) + ((4.0 / 5.0) * 0.3);
      expect(testState.vulnerabilityIndex).toBeCloseTo(expected, 1);
    });

    it('should produce scores where no single component dominates', () => {
      const states = [
        { name: 'HighInsecurity', rate: 20, povertyRate: 25, mealCost: 3.0 },
        { name: 'HighMealCost', rate: 8, povertyRate: 8, mealCost: 5.5 },
        { name: 'MaxRef', rate: 5, povertyRate: 5, mealCost: 5.5 },
      ];
      const result = computeVulnerabilityIndex(states);
      const highInsecurity = result.find(s => s.name === 'HighInsecurity');
      const highMealCost = result.find(s => s.name === 'HighMealCost');

      expect(highInsecurity.vulnerabilityIndex).toBeGreaterThan(highMealCost.vulnerabilityIndex);
    });

    it('should handle empty states array', () => {
      const result = computeVulnerabilityIndex([]);
      expect(result).toEqual([]);
    });
  });

  // ── Data shape validation ──
  describe('data shape: food-insecurity-state.json', () => {
    let fiData;
    beforeEach(() => { fiData = readJSON('food-insecurity-state.json'); });

    it('should have national.foodInsecurityRate', () => {
      expect(fiData.national.foodInsecurityRate).toBeTypeOf('number');
    });

    it('should have states with required fields', () => {
      expect(fiData.states.length).toBeGreaterThan(0);
      for (const s of fiData.states) {
        expect(s).toHaveProperty('name');
        expect(s).toHaveProperty('rate');
        expect(s).toHaveProperty('povertyRate');
        expect(s).toHaveProperty('mealCost');
      }
    });
  });

  describe('data shape: bls-food-cpi.json', () => {
    let blsData;
    beforeEach(() => { blsData = readJSON('bls-food-cpi.json'); });

    it('should have a "Food at Home" series', () => {
      const foodHome = blsData.series.find(s => s.name === 'Food at Home');
      expect(foodHome).toBeDefined();
    });

    it('should have data entries with date and value', () => {
      const foodHome = blsData.series.find(s => s.name === 'Food at Home');
      expect(foodHome.data.length).toBeGreaterThan(12);
      for (const d of foodHome.data) {
        expect(d).toHaveProperty('date');
        expect(typeof d.value === 'number' || d.value === null).toBe(true);
      }
    });
  });

  // ── P0 #2: National insecurity KPI staleness ──
  describe('HTML KPI staleness checks', () => {
    it('should have insecurity KPI data-target matching JSON national rate', () => {
      const fiData = readJSON('food-insecurity-state.json');
      const doc = parseHTML('executive-summary.html');
      const kpiEl = doc.querySelector('#food-insecurity-kpi');
      expect(kpiEl).not.toBeNull();
      const htmlValue = parseFloat(kpiEl.getAttribute('data-target'));
      expect(htmlValue).toBeCloseTo(fiData.national.foodInsecurityRate, 0);
    });

    it('should not have "Data Year: 2022" labels when data year is 2024', () => {
      const fiData = readJSON('food-insecurity-state.json');
      const doc = parseHTML('executive-summary.html');
      if (fiData.national.year && fiData.national.year >= 2024) {
        const bodyText = doc.body.textContent;
        const staleCount = (bodyText.match(/Data Year:\s*2022/g) || []).length;
        expect(staleCount).toBe(0);
      }
    });
  });

  // ── P1 #8: BLS YoY null-hole alignment ──
  describe('BLS YoY computation', () => {
    it('should maintain correct 12-month lookback when nulls are present using date-keyed approach', () => {
      const data = [];
      for (let i = 0; i < 24; i++) {
        const year = 2023 + Math.floor(i / 12);
        const month = (i % 12) + 1;
        const date = `${year}-${String(month).padStart(2, '0')}`;
        data.push({ date, value: i === 14 ? null : 200 + i });
      }

      const validData = data.filter(d => d.value !== null);
      const dataByDate = {};
      validData.forEach(d => { dataByDate[d.date] = d.value; });

      const yoyData = validData.filter(d => {
        const [y, m] = d.date.split('-').map(Number);
        const priorDate = `${y - 1}-${String(m).padStart(2, '0')}`;
        return dataByDate[priorDate] !== undefined;
      }).map(d => {
        const [y, m] = d.date.split('-').map(Number);
        const priorDate = `${y - 1}-${String(m).padStart(2, '0')}`;
        return { date: d.date, lookbackDate: priorDate };
      });

      for (const entry of yoyData) {
        const [entryYear, entryMonth] = entry.date.split('-').map(Number);
        const [lookYear, lookMonth] = entry.lookbackDate.split('-').map(Number);
        const monthDiff = (entryYear - lookYear) * 12 + (entryMonth - lookMonth);
        expect(monthDiff).toBe(12);
      }

      const dates = yoyData.map(d => d.date);
      expect(dates).not.toContain('2024-03');
    });
  });

  // ── P1 #9: food-bank-orgs KPI element must exist with data-target ──
  describe('dynamic KPI elements', () => {
    it('food-bank-orgs-kpi element should exist with data-target attribute', () => {
      const doc = parseHTML('executive-summary.html');
      const kpiEl = doc.querySelector('#food-bank-orgs-kpi');
      expect(kpiEl).not.toBeNull();
      expect(kpiEl.getAttribute('data-target')).toBeTruthy();
    });

    it('food-bank-summary.json should have totalOrganizations for KPI update', () => {
      const bankData = readJSON('food-bank-summary.json');
      expect(bankData.national.totalOrganizations).toBeTypeOf('number');
      expect(bankData.national.totalOrganizations).toBeGreaterThan(0);
    });
  });

  // ── P1 #11: SNAP coverage KPI formula ──
  describe('SNAP coverage KPI', () => {
    it('should use participants / (participants + gap) formula, not participants / insecure', () => {
      const snapData = readJSON('snap-participation.json');
      const fiData = readJSON('food-insecurity-state.json');

      const snap = snapData.national.snapParticipants;
      const gap = snapData.national.coverageGap;
      const insecure = fiData.national.foodInsecurePersons;

      const participantBased = (snap / (snap + gap) * 100).toFixed(1);
      const insecureBased = (snap / insecure * 100).toFixed(1);

      expect(participantBased).not.toBe(insecureBased);
      expect(parseFloat(participantBased)).toBeCloseTo(83.7, 0);
    });
  });

  // ── Fix 6: Food Bank Orgs KPI needs an id ──
  describe('food-bank-orgs-kpi', () => {
    it('HTML should have id on the Food Bank Orgs stat element', () => {
      const doc = parseHTML('executive-summary.html');
      expect(doc.querySelector('#food-bank-orgs-kpi')).not.toBeNull();
    });
  });

  // ── Fix 13: Per-chart error handling ──
  describe('per-chart error isolation', () => {
    it('executive-summary.html should have dashboard-error element for per-chart error display', () => {
      const doc = parseHTML('executive-summary.html');
      const el = doc.querySelector('#dashboard-error, .dashboard-error');
      expect(el).not.toBeNull();
    });
  });

  // ── Audit 2026-04-07 #3: Dynamic insight containers need aria-live ──
  describe('aria-live on dynamic insights', () => {
    it('executive-summary: all dynamic insight containers should have aria-live', () => {
      const doc = parseHTML('executive-summary.html');
      const dynamicIds = ['vulnerability-map-insight', 'snap-gap-insight', 'price-impact-insight', 'worst-states-insight'];
      for (const id of dynamicIds) {
        const el = doc.getElementById(id);
        expect(el, `${id} should exist`).not.toBeNull();
        expect(el.getAttribute('aria-live'), `${id} should have aria-live`).toBeTruthy();
      }
    });

    it('food-access: all dynamic insight containers should have aria-live', () => {
      const doc = parseHTML('food-access.html');
      const dynamicIds = ['insecurity-map-insight', 'low-access-insight', 'snap-retailers-insight', 'sdoh-access-insight', 'access-insecurity-insight'];
      for (const id of dynamicIds) {
        const el = doc.getElementById(id);
        expect(el, `${id} should exist`).not.toBeNull();
        expect(el.getAttribute('aria-live'), `${id} should have aria-live`).toBeTruthy();
      }
    });

    it('snap-safety-net: all dynamic insight containers should have aria-live', () => {
      const doc = parseHTML('snap-safety-net.html');
      const dynamicIds = ['snap-map-insight', 'demographic-flow-insight'];
      for (const id of dynamicIds) {
        const el = doc.getElementById(id);
        expect(el, `${id} should exist`).not.toBeNull();
        expect(el.getAttribute('aria-live'), `${id} should have aria-live`).toBeTruthy();
      }
    });

    it('food-prices: all dynamic insight containers should have aria-live', () => {
      const doc = parseHTML('food-prices.html');
      const dynamicIds = ['yoy-insight', 'purchasing-power-insight'];
      for (const id of dynamicIds) {
        const el = doc.getElementById(id);
        expect(el, `${id} should exist`).not.toBeNull();
        expect(el.getAttribute('aria-live'), `${id} should have aria-live`).toBeTruthy();
      }
    });
  });

  // ── Fix 33: SNAP vintage disclosure ──
  describe('SNAP vintage disclosure', () => {
    it('methodology should disclose SNAP national vs state data year difference', () => {
      const snapData = readJSON('snap-participation.json');
      const doc = parseHTML('executive-summary.html');
      const natYear = snapData.national.year;
      const stateYear = snapData.stateCoverage?.year;
      if (natYear !== stateYear) {
        const bodyText = doc.body.textContent;
        expect(bodyText).toContain(String(natYear));
        expect(bodyText).toContain(String(stateYear));
        // Verify SNAP + national + FY year mentioned together in methodology
        expect(bodyText).toMatch(/SNAP.*national.*FY\d{4}|FY\d{4}.*national.*SNAP/i);
      }
    });
  });

  // ── P4: renderSnapGap data contract ──
  describe('renderSnapGap data contract', () => {
    it('fiStates and snapStates should have at least 15 joinable states', () => {
      const fiData = readJSON('food-insecurity-state.json');
      const snapData = readJSON('snap-participation.json');
      const fiNames = new Set(fiData.states.map(s => s.name));
      const snapNames = new Set(snapData.stateCoverage.states.map(s => s.name));
      const joinable = [...fiNames].filter(n => snapNames.has(n));
      expect(joinable.length).toBeGreaterThanOrEqual(15);
    });

    it('snap states should have snapParticipants field', () => {
      const snapData = readJSON('snap-participation.json');
      for (const s of snapData.stateCoverage.states) {
        expect(s).toHaveProperty('snapParticipants');
        expect(s.snapParticipants).toBeTypeOf('number');
      }
    });
  });

  // ── P4: renderPriceImpact YoY computation ──
  describe('renderPriceImpact data contract', () => {
    it('BLS data should have enough points for YoY computation (13+ months)', () => {
      const blsData = readJSON('bls-food-cpi.json');
      const foodHome = blsData.series.find(s => s.name === 'Food at Home');
      expect(foodHome).toBeDefined();
      const validPoints = foodHome.data.filter(d => d.value !== null);
      expect(validPoints.length).toBeGreaterThan(13);
    });
  });

  // ── P4: renderWorstStates data contract ──
  describe('renderWorstStates data contract', () => {
    it('vulnerability index should produce at least 10 states for ranking', () => {
      const fiData = readJSON('food-insecurity-state.json');
      const result = computeVulnerabilityIndex(fiData.states);
      expect(result.length).toBeGreaterThanOrEqual(10);
      const sorted = [...result].sort((a, b) => b.vulnerabilityIndex - a.vulnerabilityIndex);
      sorted.slice(0, 10).forEach(s => {
        expect(s.vulnerabilityIndex).toBeGreaterThan(0);
      });
    });

    it('top-10 vulnerable states should include Southern states', () => {
      const fiData = readJSON('food-insecurity-state.json');
      const result = computeVulnerabilityIndex(fiData.states);
      const sorted = [...result].sort((a, b) => b.vulnerabilityIndex - a.vulnerabilityIndex);
      const top10 = sorted.slice(0, 10);
      const southCount = top10.filter(s => getRegion(s.name) === 'South').length;
      // Food insecurity is concentrated in the South
      expect(southCount).toBeGreaterThanOrEqual(3);
    });
  });

  // ── P4: renderVulnerabilityMap driver analysis data contract ──
  describe('renderVulnerabilityMap data contract', () => {
    it('state data should support driver analysis (rate, povertyRate, mealCost)', () => {
      const fiData = readJSON('food-insecurity-state.json');
      for (const s of fiData.states) {
        expect(s.rate).toBeTypeOf('number');
        expect(s.povertyRate).toBeTypeOf('number');
        expect(s.mealCost).toBeTypeOf('number');
      }
    });

    it('vulnerability map container should exist in HTML', () => {
      const doc = parseHTML('executive-summary.html');
      expect(doc.querySelector('#chart-vulnerability-map, [id*="vulnerability-map"]')).not.toBeNull();
    });
  });

  // ── CODX: Error banner for production users ──
  describe('error banner for production users', () => {
    it('dashboard-error element should exist in HTML for error display', () => {
      const doc = parseHTML('executive-summary.html');
      const errorEl = doc.querySelector('#dashboard-error, .dashboard-error');
      expect(errorEl).not.toBeNull();
      expect(errorEl.getAttribute('role')).toBe('alert');
    });
  });

  // ── CODX: Main tabindex for skip-link ──
  describe('accessibility: main tabindex', () => {
    it('main#main-content should have tabindex="-1" for skip-link target', () => {
      const doc = parseHTML('executive-summary.html');
      const main = doc.querySelector('#main-content');
      expect(main).not.toBeNull();
      expect(main.getAttribute('tabindex')).toBe('-1');
    });
  });

  // ── CODX: No redundant Google Fonts links ──
  describe('redundant Google Fonts links', () => {
    it('no dashboard HTML should have the redundant single-weight Orbitron link', () => {
      const dashboards = [
        'executive-summary.html', 'food-insecurity.html', 'food-access.html',
        'snap-safety-net.html', 'food-prices.html', 'food-banks.html',
        'nonprofit-directory.html', 'nonprofit-profile.html'
      ];
      for (const file of dashboards) {
        const doc = parseHTML(file);
        const links = doc.querySelectorAll('link[href*="Orbitron:wght@700"]');
        expect(links.length, `${file} should not have redundant single-weight Orbitron`).toBe(0);
      }
    });
  });

  // ── CODX: Dashboard pages have cache-friendly meta structure ──
  describe('dashboard cache-friendly meta', () => {
    it('executive-summary.html should have canonical link for cache-friendly URL', () => {
      const doc = parseHTML('executive-summary.html');
      const canonical = doc.querySelector('link[rel="canonical"]');
      expect(canonical).not.toBeNull();
    });
  });

  // ── CODX #1: Methodology text must match code ──
  describe('methodology text accuracy', () => {
    it('should show "x 0.3" for meal cost weight, not "x 30"', () => {
      const doc = parseHTML('executive-summary.html');
      const bodyText = doc.body.textContent;
      expect(bodyText).toMatch(/normalized meal cost\s*×\s*0\.3/i);
      expect(bodyText).not.toMatch(/normalized meal cost\s*×\s*30\)/i);
    });
  });

  // ── UI/UX Audit: Legend/Label/Color Consistency ──
  describe('legend/label/color consistency', () => {
    it('price impact peak claim should say "above 11%" not "above 13%"', () => {
      const doc = parseHTML('executive-summary.html');
      const bodyText = doc.body.textContent;
      expect(bodyText).not.toContain('peaking above 13%');
      expect(bodyText).toContain('peaking above 11%');
    });

    it('BLS data should have Food at Home series for YoY price impact chart', () => {
      const data = readJSON('bls-food-cpi.json');
      const foodAtHome = data.series.find(s => s.name === 'Food at Home');
      expect(foodAtHome).toBeDefined();
      expect(foodAtHome.data.length).toBeGreaterThan(13);
    });

    it('food-insecurity-state.json states should each have rate for choropleth color', () => {
      const data = readJSON('food-insecurity-state.json');
      for (const s of data.states) {
        expect(s).toHaveProperty('rate');
        expect(s.rate).toBeTypeOf('number');
      }
    });
  });

  // ── Strategic Audit: Lighthouse CI + Author Meta ──
  describe('infrastructure quality', () => {
    it('all 6 dashboard HTML files should have title element for Lighthouse auditing', () => {
      const dashboards = [
        'executive-summary.html', 'food-insecurity.html', 'food-access.html',
        'snap-safety-net.html', 'food-prices.html', 'food-banks.html',
      ];
      for (const file of dashboards) {
        const doc = parseHTML(file);
        const title = doc.querySelector('title');
        expect(title, `${file} missing title`).not.toBeNull();
      }
    });

    it('case-studies.html and templates-tools.html meta author is consistent (P2-15)', () => {
      for (const file of ['case-studies.html', 'templates-tools.html']) {
        const doc = parseRootHTML(file);
        const authorMeta = doc.querySelector('meta[name="author"]');
        expect(authorMeta, `${file} missing author meta`).not.toBeNull();
        expect(authorMeta.getAttribute('content'), `${file} author meta`).toBe('Food-N-Force');
      }
    });

    it('meta descriptions across all 8 dashboards are <= 160 chars (P2-16)', () => {
      const files = [
        'executive-summary.html', 'food-insecurity.html', 'food-access.html',
        'snap-safety-net.html', 'food-prices.html', 'food-banks.html',
        'nonprofit-directory.html', 'nonprofit-profile.html',
      ];
      for (const file of files) {
        const doc = parseHTML(file);
        const descMeta = doc.querySelector('meta[name="description"]');
        expect(descMeta, `${file} missing meta description`).not.toBeNull();
        const content = descMeta.getAttribute('content');
        expect(content.length, `${file} desc is ${content.length} chars (over 160 SERP limit)`).toBeLessThanOrEqual(160);
      }
    });

    it('nonprofit-profile.html should have title and meta description (P2-18)', () => {
      const doc = parseHTML('nonprofit-profile.html');
      const title = doc.querySelector('title');
      const meta = doc.querySelector('meta[name="description"]');
      expect(title).not.toBeNull();
      expect(meta).not.toBeNull();
    });

    it('all dashboard HTML files should have consistent author meta', () => {
      const files = [
        'executive-summary.html', 'food-insecurity.html', 'food-access.html',
        'snap-safety-net.html', 'food-prices.html', 'food-banks.html',
        'nonprofit-directory.html', 'nonprofit-profile.html',
      ];
      for (const file of files) {
        const doc = parseHTML(file);
        const authorMeta = doc.querySelector('meta[name="author"]');
        expect(authorMeta, `${file} has no author meta`).not.toBeNull();
        expect(authorMeta.getAttribute('content'), `${file} has wrong author meta`).toBe('Food-N-Force');
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // P1-19 Phase B: Coverage tests for executive-summary.js exported functions
  // ──────────────────────────────────────────────────────────────────────────

  // ── computeVulnerabilityIndex deep tests ──
  describe('computeVulnerabilityIndex (deep)', () => {
    beforeEach(() => {
      __chartInstances.clear();
    });

    it('handles mealCost === 0 on every state without dividing by zero', () => {
      const states = [
        { name: 'A', rate: 12, povertyRate: 14, mealCost: 0 },
        { name: 'B', rate: 18, povertyRate: 20, mealCost: 0 },
        { name: 'C', rate: 9,  povertyRate: 11, mealCost: 0 },
      ];
      const result = computeVulnerabilityIndex(states);
      // The "|| 1" guard in the source must prevent NaN/Infinity even when every
      // mealCost is zero; meal-cost contribution should resolve to 0 not NaN.
      for (const s of result) {
        expect(Number.isFinite(s.vulnerabilityIndex)).toBe(true);
        expect(s.vulnerabilityIndex).not.toBeNaN();
      }
      // With mealCost contribution = 0, score = rate * 0.4 + povertyRate * 0.3
      const a = result.find(s => s.name === 'A');
      expect(a.vulnerabilityIndex).toBeCloseTo(12 * 0.4 + 14 * 0.3, 2);
    });

    it('rounds the vulnerability index to 2 decimal places', () => {
      const states = [
        { name: 'TestRound', rate: 13.7, povertyRate: 17.3, mealCost: 3.81 },
        { name: 'MaxCost', rate: 5, povertyRate: 5, mealCost: 5.99 },
      ];
      const result = computeVulnerabilityIndex(states);
      for (const s of result) {
        // Round-tripping through *100/100 means at most 2 decimal places
        const decimals = (s.vulnerabilityIndex.toString().split('.')[1] || '').length;
        expect(decimals).toBeLessThanOrEqual(2);
        expect(s.vulnerabilityIndex).toBe(Math.round(s.vulnerabilityIndex * 100) / 100);
      }
    });

    it('preserves all original state fields via spread', () => {
      const states = [
        { name: 'Maine', rate: 11.4, povertyRate: 10.9, mealCost: 3.55, persons: 152000, fips: '23', extra: 'keep-me' },
      ];
      const result = computeVulnerabilityIndex(states);
      const me = result[0];
      expect(me.name).toBe('Maine');
      expect(me.rate).toBe(11.4);
      expect(me.povertyRate).toBe(10.9);
      expect(me.mealCost).toBe(3.55);
      expect(me.persons).toBe(152000);
      expect(me.fips).toBe('23');
      expect(me.extra).toBe('keep-me');
      expect(me).toHaveProperty('vulnerabilityIndex');
    });

    it('produces a strictly higher index when all three risk factors are higher', () => {
      const states = [
        { name: 'Low',  rate: 8,  povertyRate: 9,  mealCost: 3.0 },
        { name: 'Mid',  rate: 14, povertyRate: 16, mealCost: 3.6 },
        { name: 'High', rate: 22, povertyRate: 25, mealCost: 4.5 },
      ];
      const result = computeVulnerabilityIndex(states);
      const low = result.find(s => s.name === 'Low');
      const mid = result.find(s => s.name === 'Mid');
      const high = result.find(s => s.name === 'High');
      expect(mid.vulnerabilityIndex).toBeGreaterThan(low.vulnerabilityIndex);
      expect(high.vulnerabilityIndex).toBeGreaterThan(mid.vulnerabilityIndex);
    });

    it('produces a non-zero index for a single-state array', () => {
      const states = [
        { name: 'Solo', rate: 15, povertyRate: 18, mealCost: 4.2 },
      ];
      const result = computeVulnerabilityIndex(states);
      expect(result).toHaveLength(1);
      // Single state: maxMealCost === its own mealCost, so meal-cost contribution = 0.3
      // Score = 15*0.4 + 18*0.3 + 1*0.3 = 6 + 5.4 + 0.3 = 11.7
      expect(result[0].vulnerabilityIndex).toBeCloseTo(11.7, 2);
      expect(result[0].vulnerabilityIndex).toBeGreaterThan(0);
    });
  });

  // ── renderPriceImpact() with DOM setup ──
  describe('renderPriceImpact (DOM exercising)', () => {
    beforeEach(() => {
      __chartInstances.clear();
      document.body.innerHTML = `
        <div id="chart-price-impact"></div>
        <div id="price-impact-insight" aria-live="polite"></div>
        <span id="kpi-cpi-yoy" data-target="0"></span>
      `;
    });

    it('returns early without throwing when blsData is null', () => {
      expect(() => renderPriceImpact(null)).not.toThrow();
      // createChart fires before the null guard, so the chart instance exists,
      // but setOption should only have been called once (the internal aria init)
      // and never with a `series` payload.
      const container = document.getElementById('chart-price-impact');
      const chart = __chartInstances.get(container);
      expect(chart).toBeDefined();
      expect(chart.setOption).toHaveBeenCalledTimes(1);
      const seriesCall = chart.setOption.mock.calls.find(c => c[0] && c[0].series);
      expect(seriesCall).toBeUndefined();
    });

    it('returns early without throwing when blsData has no series array', () => {
      expect(() => renderPriceImpact({})).not.toThrow();
      expect(() => renderPriceImpact({ series: undefined })).not.toThrow();
    });

    it('returns early without throwing when "Food at Home" series is missing', () => {
      const data = { series: [{ name: 'Food Away From Home', data: [{ date: '2024-01', value: 300 }] }] };
      expect(() => renderPriceImpact(data)).not.toThrow();
      // chart was created (createChart fires before the missing-series check), but
      // setOption should NOT have been called with a real options object since
      // the function returns early before chart.setOption(...).
      const container = document.getElementById('chart-price-impact');
      const chart = __chartInstances.get(container);
      // createChart calls setOption({ aria: ... }) once internally, so we expect
      // at most one setOption call (the aria init) and not the main render call.
      expect(chart).toBeDefined();
      expect(chart.setOption).toHaveBeenCalledTimes(1);
      expect(chart.setOption).toHaveBeenCalledWith(expect.objectContaining({ aria: expect.any(Object) }));
    });

    it('calls chart.setOption with line series when valid BLS data is provided', () => {
      const blsData = buildFoodAtHomeSeries(24); // 2 years -> enough for YoY
      renderPriceImpact(blsData);
      const container = document.getElementById('chart-price-impact');
      const chart = __chartInstances.get(container);
      expect(chart).toBeDefined();
      // First setOption is the aria init, second is the actual render.
      expect(chart.setOption.mock.calls.length).toBeGreaterThanOrEqual(2);
      const renderOptions = chart.setOption.mock.calls[1][0];
      expect(renderOptions).toHaveProperty('series');
      expect(Array.isArray(renderOptions.series)).toBe(true);
      expect(renderOptions.series[0].type).toBe('line');
      expect(renderOptions.series[0].name).toBe('Food at Home YoY');
      // Also confirm KPI element was updated
      const kpi = document.getElementById('kpi-cpi-yoy');
      expect(kpi.dataset.suffix).toBe('%');
      expect(parseFloat(kpi.dataset.target)).not.toBeNaN();
      // And insight text was populated
      const insight = document.getElementById('price-impact-insight');
      expect(insight.textContent).toMatch(/peaked|cooled/);
    });

    it('handles fewer than 13 data points gracefully (YoY needs prior year)', () => {
      const blsData = buildFoodAtHomeSeries(6); // not enough for any YoY pair
      expect(() => renderPriceImpact(blsData)).not.toThrow();
      const container = document.getElementById('chart-price-impact');
      const chart = __chartInstances.get(container);
      expect(chart).toBeDefined();
      // The render still executes setOption (with empty series data) — verify
      // it didn't crash and the series array still exists.
      const renderCall = chart.setOption.mock.calls.find(call =>
        call[0] && call[0].series && Array.isArray(call[0].series)
      );
      expect(renderCall).toBeDefined();
      expect(renderCall[0].series[0].data).toEqual([]);
    });
  });

  // ── SNAP coverage KPI formula edge cases (logic copied from source) ──
  describe('SNAP coverage KPI formula', () => {
    // Mirrors executive-summary.js:392
    //   coverage = (participants / (participants + gap)) * 100
    function computeSnapCoverage(participants, gap) {
      return parseFloat(((participants / (participants + gap)) * 100).toFixed(1));
    }

    it('returns 100% when the coverage gap is zero', () => {
      expect(computeSnapCoverage(40_000_000, 0)).toBe(100.0);
    });

    it('returns less than 100% when the coverage gap is positive', () => {
      const coverage = computeSnapCoverage(40_000_000, 10_000_000);
      expect(coverage).toBeLessThan(100);
      expect(coverage).toBeCloseTo(80.0, 1);
    });

    it('uses participants / (participants + gap), NOT participants / insecure', () => {
      // Different denominators: confirm the participants-based formula is the
      // one being exercised (regression guard for P1 #11).
      const participants = 41_000_000;
      const gap = 8_000_000;
      const insecurePersons = 47_000_000; // gap and insecure are NOT identical
      const participantBased = computeSnapCoverage(participants, gap);
      const insecureBased = parseFloat(((participants / insecurePersons) * 100).toFixed(1));
      expect(participantBased).not.toBe(insecureBased);
    });
  });

  // ── init() integration: exercise renderVulnerabilityMap / renderSnapGap /
  //    renderWorstStates / KPI updates by dynamically re-importing the module
  //    with fetch mocked to return real fixture JSON. ──
  describe('init() integration via dynamic import', () => {
    beforeEach(() => {
      __chartInstances.clear();
      // Provide every DOM element init() and the four render functions touch.
      document.body.innerHTML = `
        <main id="main-content" tabindex="-1">
          <div id="dashboard-error" role="alert" hidden></div>
          <span id="snap-coverage-kpi" data-target="0"></span>
          <span id="food-insecurity-kpi" data-target="0"></span>
          <span id="food-bank-orgs-kpi" data-target="0"></span>
          <span id="kpi-cpi-yoy" data-target="0"></span>
          <div id="chart-vulnerability-map"></div>
          <div id="vulnerability-map-insight" aria-live="polite"></div>
          <div id="chart-snap-gap"></div>
          <div id="snap-gap-insight" aria-live="polite"></div>
          <div id="chart-price-impact"></div>
          <div id="price-impact-insight" aria-live="polite"></div>
          <div id="chart-worst-states"></div>
          <div id="worst-states-insight" aria-live="polite"></div>
        </main>
      `;
    });

    it('runs init() end-to-end with mocked fetch and exercises all render functions', async () => {
      // Real fixture files used by the dashboard
      const fiData = readJSON('food-insecurity-state.json');
      const snapData = readJSON('snap-participation.json');
      const blsData = readJSON('bls-food-cpi.json');
      const bankData = readJSON('food-bank-summary.json');
      // Minimal valid GeoJSON FeatureCollection — registerMap is mocked, so
      // the actual feature contents don't matter, just the shape.
      const geoJSON = { type: 'FeatureCollection', features: [] };

      const fetchMap = {
        '/data/food-insecurity-state.json': fiData,
        '/data/snap-participation.json': snapData,
        '/data/bls-food-cpi.json': blsData,
        '/data/us-states-geo.json': geoJSON,
        '/data/food-bank-summary.json': bankData,
      };
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
        const body = fetchMap[url];
        if (!body) {
          return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) });
      });

      try {
        // Re-import the module so its top-level init() boot block re-runs
        // against the freshly populated DOM and mocked fetch.
        vi.resetModules();
        await import('./executive-summary.js');
        // Yield microtasks until init()'s Promise.all settles + render functions complete
        for (let i = 0; i < 5; i++) {
          await Promise.resolve();
        }
        // Wait one more tick for any dangling continuations
        await new Promise(r => setTimeout(r, 0));

        // Fetch was called for all 5 data URLs
        expect(fetchSpy).toHaveBeenCalledWith('/data/food-insecurity-state.json');
        expect(fetchSpy).toHaveBeenCalledWith('/data/snap-participation.json');
        expect(fetchSpy).toHaveBeenCalledWith('/data/bls-food-cpi.json');
        expect(fetchSpy).toHaveBeenCalledWith('/data/us-states-geo.json');
        expect(fetchSpy).toHaveBeenCalledWith('/data/food-bank-summary.json');

        // KPI elements were populated
        const snapKpi = document.getElementById('snap-coverage-kpi');
        const fiKpi = document.getElementById('food-insecurity-kpi');
        const bankKpi = document.getElementById('food-bank-orgs-kpi');
        expect(parseFloat(snapKpi.dataset.target)).toBeGreaterThan(0);
        expect(parseFloat(fiKpi.dataset.target)).toBeGreaterThan(0);
        expect(parseFloat(bankKpi.dataset.target)).toBeGreaterThan(0);

        // dashboard-error must remain hidden (happy path)
        expect(document.getElementById('dashboard-error').hidden).toBe(true);
      } finally {
        fetchSpy.mockRestore();
      }
    });

    it('shows the dashboard-error banner when fetch fails', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
        Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })
      );

      try {
        vi.resetModules();
        await import('./executive-summary.js');
        for (let i = 0; i < 5; i++) {
          await Promise.resolve();
        }
        await new Promise(r => setTimeout(r, 0));

        const errorEl = document.getElementById('dashboard-error');
        expect(errorEl).not.toBeNull();
        expect(errorEl.hidden).toBe(false);
        expect(errorEl.textContent).toMatch(/Unable to load/i);
      } finally {
        fetchSpy.mockRestore();
      }
    });
  });

  // ── Vulnerability map DOM smoke test (exercises init() top of pipeline) ──
  describe('vulnerability-map DOM container', () => {
    beforeEach(() => {
      __chartInstances.clear();
      document.body.innerHTML = `
        <div id="chart-vulnerability-map"></div>
        <div id="vulnerability-map-insight" aria-live="polite"></div>
      `;
    });

    it('renderPriceImpact does not interfere with an unrelated chart container in the same DOM', () => {
      // Add the price-impact container so renderPriceImpact has a target,
      // then verify the vulnerability-map container is left untouched.
      document.body.insertAdjacentHTML('beforeend', '<div id="chart-price-impact"></div>');
      const blsData = buildFoodAtHomeSeries(24);
      renderPriceImpact(blsData);
      const vulnContainer = document.getElementById('chart-vulnerability-map');
      expect(__chartInstances.get(vulnContainer)).toBeUndefined();
    });
  });
});
