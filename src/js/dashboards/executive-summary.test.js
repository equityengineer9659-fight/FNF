import { describe, it, expect, vi, beforeEach } from 'vitest';
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

import { computeVulnerabilityIndex } from './executive-summary.js';
import { getRegion } from './shared/dashboard-utils.js';

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
        const html = readFileSync(resolve(htmlDir, 'executive-summary.html'), 'utf-8');
        expect(html).toMatch(/SNAP.*national.*FY\d{4}|FY\d{4}.*national.*SNAP/i);
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
      const rootDir = resolve(__dirname, '../../..');
      for (const file of ['case-studies.html', 'templates-tools.html']) {
        const doc = new DOMParser().parseFromString(
          readFileSync(resolve(rootDir, file), 'utf-8'), 'text/html'
        );
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
});
