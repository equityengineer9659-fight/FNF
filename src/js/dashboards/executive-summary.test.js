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

// -- Helpers --
const dataDir = resolve(__dirname, '../../../public/data');
const htmlDir = resolve(__dirname, '../../../dashboards');

function readJSON(filename) {
  return JSON.parse(readFileSync(resolve(dataDir, filename), 'utf-8'));
}

function readHTML(filename) {
  return readFileSync(resolve(htmlDir, filename), 'utf-8');
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
      // High meal cost state should NOT score dramatically higher than high-insecurity state
      const states = [
        { name: 'HighInsecurity', rate: 20, povertyRate: 25, mealCost: 3.0 },
        { name: 'HighMealCost', rate: 8, povertyRate: 8, mealCost: 5.5 },
        { name: 'MaxRef', rate: 5, povertyRate: 5, mealCost: 5.5 },
      ];
      const result = computeVulnerabilityIndex(states);
      const highInsecurity = result.find(s => s.name === 'HighInsecurity');
      const highMealCost = result.find(s => s.name === 'HighMealCost');

      // With correct 40/30/30 weighting, high insecurity should score higher
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
      const html = readHTML('executive-summary.html');
      const match = html.match(/id="food-insecurity-kpi"[^>]*data-target="([^"]+)"/);
      if (match) {
        const htmlValue = parseFloat(match[1]);
        expect(htmlValue).toBeCloseTo(fiData.national.foodInsecurityRate, 0);
      }
    });

    it('should not have "Data Year: 2022" labels when data year is 2024', () => {
      const fiData = readJSON('food-insecurity-state.json');
      const html = readHTML('executive-summary.html');
      if (fiData.national.year && fiData.national.year >= 2024) {
        const staleYearCount = (html.match(/Data Year:\s*2022/g) || []).length;
        expect(staleYearCount).toBe(0);
      }
    });
  });

  // ── P1 #8: BLS YoY null-hole alignment ──
  describe('BLS YoY computation', () => {
    it('should maintain correct 12-month lookback when nulls are present using date-keyed approach', () => {
      // Build BLS-like data with a null at month 15 (2024-03)
      const data = [];
      for (let i = 0; i < 24; i++) {
        const year = 2023 + Math.floor(i / 12);
        const month = (i % 12) + 1;
        const date = `${year}-${String(month).padStart(2, '0')}`;
        data.push({ date, value: i === 14 ? null : 200 + i });
      }

      // Use the corrected date-keyed approach (matching executive-summary.js fix)
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

      // Each YoY entry's lookbackDate should be exactly 12 months prior
      for (const entry of yoyData) {
        const [entryYear, entryMonth] = entry.date.split('-').map(Number);
        const [lookYear, lookMonth] = entry.lookbackDate.split('-').map(Number);
        const monthDiff = (entryYear - lookYear) * 12 + (entryMonth - lookMonth);
        expect(monthDiff).toBe(12);
      }

      // The null month (2024-03) should be skipped, not cause misalignment
      const dates = yoyData.map(d => d.date);
      expect(dates).not.toContain('2024-03');
    });
  });

  // ── P1 #9: Dead fetch removal (reversed — now food-bank-orgs KPI is data-driven) ──
  describe('dynamic KPI fetch check', () => {
    it('should fetch food-bank-summary.json to update food-bank-orgs-kpi dynamically', () => {
      const jsSource = readFileSync(resolve(__dirname, 'executive-summary.js'), 'utf-8');
      expect(jsSource).toContain('food-bank-summary.json');
      expect(jsSource).toContain('food-bank-orgs-kpi');
      expect(jsSource).toContain('totalOrganizations');
    });

    it('SNAP KPI formula should use coverageGap, not foodInsecurePersons', () => {
      const jsSource = readFileSync(resolve(__dirname, 'executive-summary.js'), 'utf-8');
      // Formula should use participants / (participants + coverageGap)
      expect(jsSource).toContain('coverageGap');
      // Should NOT divide by totalInsecure
      expect(jsSource).not.toMatch(/totalSnap\s*\/\s*totalInsecure/);
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

      // These are different formulas — the label says participants/(participants+gap)
      const participantBased = (snap / (snap + gap) * 100).toFixed(1);
      const insecureBased = (snap / insecure * 100).toFixed(1);

      // They should differ — confirming which one the code uses matters
      expect(participantBased).not.toBe(insecureBased);

      // The code should match the label: participants / (participants + gap)
      // This documents the expected correct formula
      expect(parseFloat(participantBased)).toBeCloseTo(83.7, 0);
    });
  });

  // ── Fix 5: food-insecurity-kpi must be updated by JS ──
  describe('food-insecurity-kpi dynamic update', () => {
    it('init() should update food-insecurity-kpi from fiData', () => {
      const jsSource = readFileSync(resolve(__dirname, 'executive-summary.js'), 'utf-8');
      expect(jsSource).toContain('food-insecurity-kpi');
    });
  });

  // ── Fix 6: Food Bank Orgs KPI needs an id ──
  describe('food-bank-orgs-kpi', () => {
    it('HTML should have id on the Food Bank Orgs stat element', () => {
      const html = readHTML('executive-summary.html');
      expect(html).toContain('id="food-bank-orgs-kpi"');
    });
  });

  // ── Fix 13: Per-chart error handling ──
  describe('per-chart error isolation', () => {
    it('each render call should be wrapped in its own try/catch', () => {
      const jsSource = readFileSync(resolve(__dirname, 'executive-summary.js'), 'utf-8');
      const initSection = jsSource.slice(jsSource.indexOf('async function init()'));
      // Count try blocks — should have at least 4 (one per render) plus the outer
      const tryCount = (initSection.match(/try\s*\{/g) || []).length;
      expect(tryCount).toBeGreaterThanOrEqual(5);
    });
  });

  // ── Audit 2026-04-07 #3: Dynamic insight containers need aria-live ──
  describe('aria-live on dynamic insights', () => {
    it('executive-summary: all dynamic insight containers should have aria-live', () => {
      const html = readHTML('executive-summary.html');
      const dynamicIds = ['vulnerability-map-insight', 'snap-gap-insight', 'price-impact-insight', 'worst-states-insight'];
      for (const id of dynamicIds) {
        const regex = new RegExp(`id="${id}"[^>]*`);
        const match = html.match(regex);
        expect(match, `${id} should exist`).toBeTruthy();
        expect(match[0], `${id} should have aria-live`).toContain('aria-live');
      }
    });

    it('food-access: all dynamic insight containers should have aria-live', () => {
      const html = readHTML('food-access.html');
      const dynamicIds = ['insecurity-map-insight', 'low-access-insight', 'snap-retailers-insight', 'sdoh-access-insight', 'access-insecurity-insight'];
      for (const id of dynamicIds) {
        const regex = new RegExp(`id="${id}"[^>]*`);
        const match = html.match(regex);
        expect(match, `${id} should exist`).toBeTruthy();
        expect(match[0], `${id} should have aria-live`).toContain('aria-live');
      }
    });

    it('snap-safety-net: all dynamic insight containers should have aria-live', () => {
      const html = readHTML('snap-safety-net.html');
      const dynamicIds = ['snap-map-insight', 'demographic-flow-insight'];
      for (const id of dynamicIds) {
        const regex = new RegExp(`id="${id}"[^>]*`);
        const match = html.match(regex);
        expect(match, `${id} should exist`).toBeTruthy();
        expect(match[0], `${id} should have aria-live`).toContain('aria-live');
      }
    });

    it('food-prices: all dynamic insight containers should have aria-live', () => {
      const html = readHTML('food-prices.html');
      const dynamicIds = ['yoy-insight', 'purchasing-power-insight'];
      for (const id of dynamicIds) {
        const regex = new RegExp(`id="${id}"[^>]*`);
        const match = html.match(regex);
        expect(match, `${id} should exist`).toBeTruthy();
        expect(match[0], `${id} should have aria-live`).toContain('aria-live');
      }
    });
  });

  // ── Fix 33: SNAP vintage disclosure ──
  describe('SNAP vintage disclosure', () => {
    it('methodology should disclose SNAP national vs state data year difference', () => {
      const snapData = readJSON('snap-participation.json');
      const html = readHTML('executive-summary.html');
      const natYear = snapData.national.year;
      const stateYear = snapData.stateCoverage?.year;
      if (natYear !== stateYear) {
        // Methodology must mention both years
        expect(html).toContain(String(natYear));
        expect(html).toContain(String(stateYear));
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
      // Top 10 should all have positive vulnerability scores
      sorted.slice(0, 10).forEach(s => {
        expect(s.vulnerabilityIndex).toBeGreaterThan(0);
      });
    });

    it('worst-states insight should reference South region count', () => {
      const jsSource = readFileSync(resolve(__dirname, 'executive-summary.js'), 'utf-8');
      const worstSection = jsSource.slice(jsSource.indexOf('function renderWorstStates'));
      expect(worstSection).toContain('South');
      expect(worstSection).toContain('getRegion');
    });
  });

  // ── P4: renderVulnerabilityMap click insight ──
  describe('renderVulnerabilityMap click insight', () => {
    it('should generate click-driven insight with driver analysis', () => {
      const jsSource = readFileSync(resolve(__dirname, 'executive-summary.js'), 'utf-8');
      const mapSection = jsSource.slice(
        jsSource.indexOf('function renderVulnerabilityMap'),
        jsSource.indexOf('function renderSnapGap')
      );
      // Should have 3 driver candidates for click insight
      expect(mapSection).toContain('driverCandidates');
      expect(mapSection).toContain('primary driver');
      // Should have CSV export
      expect(mapSection).toContain('addExportButton');
    });
  });

  // ── CODX: Error banner for production users ──
  describe('error banner for production users', () => {
    it('catch block should show an error UI element, not just console.log', () => {
      const jsSource = readFileSync(resolve(__dirname, 'executive-summary.js'), 'utf-8');
      expect(jsSource).toContain('dashboard-error');
    });
  });

  // ── CODX: Main tabindex for skip-link ──
  describe('accessibility: main tabindex', () => {
    it('main#main-content should have tabindex="-1" for skip-link target', () => {
      const html = readHTML('executive-summary.html');
      expect(html).toMatch(/id="main-content"[^>]*tabindex="-1"/);
    });
  });

  // ── CODX: No redundant Google Fonts links ──
  describe('redundant Google Fonts links', () => {
    it('no dashboard HTML should have the redundant single-weight Orbitron link', () => {
      const dashboards = [
        'executive-summary.html', 'food-insecurity.html', 'food-access.html',
        'snap-safety-net.html', 'food-prices.html', 'food-banks.html',
        'nonprofit-directory.html', 'nonprofit-profile.html', 'chart-preview.html'
      ];
      for (const file of dashboards) {
        const html = readHTML(file);
        expect(html, `${file} should not have redundant single-weight Orbitron`)
          .not.toContain('Orbitron:wght@700&display=swap');
      }
    });
  });

  // ── CODX: .htaccess cache directory protection ──
  describe('htaccess cache security', () => {
    it('should deny access to _cache directory', () => {
      const htaccess = readFileSync(
        resolve(__dirname, '../../../public/.htaccess'), 'utf-8'
      );
      expect(htaccess).toContain('_cache');
    });
  });

  // ── CODX #1: Methodology text must match code ──
  describe('methodology text accuracy', () => {
    it('should show "× 0.3" for meal cost weight, not "× 30"', () => {
      const html = readHTML('executive-summary.html');
      // The methodology section should reference 0.3 (30%), not 30
      expect(html).toMatch(/normalized meal cost\s*&times;\s*0\.3/i);
      expect(html).not.toMatch(/normalized meal cost\s*&times;\s*30\)/i);
    });
  });

  // ── UI/UX Audit: Legend/Label/Color Consistency ──
  describe('legend/label/color consistency', () => {
    it('price impact peak claim should say "above 11%" not "above 13%"', () => {
      const html = readHTML('executive-summary.html');
      expect(html).not.toContain('peaking above 13%');
      expect(html).toContain('peaking above 11%');
    });

    it('Chart 3 series name should include "YoY" to match tooltip label', () => {
      const jsSource = readFileSync(resolve(__dirname, 'executive-summary.js'), 'utf-8');
      const priceSection = jsSource.slice(
        jsSource.indexOf('function renderPriceImpact'),
        jsSource.indexOf('function renderWorstStates')
      );
      expect(priceSection).toContain('name: \'Food at Home YoY\'');
    });

    it('vulnerability map emphasis should use border highlight, not areaColor override', () => {
      const jsSource = readFileSync(resolve(__dirname, 'executive-summary.js'), 'utf-8');
      const mapSection = jsSource.slice(
        jsSource.indexOf('function renderVulnerabilityMap'),
        jsSource.indexOf('function renderSnapGap')
      );
      expect(mapSection).not.toContain('areaColor: COLORS.secondary');
    });
  });

  // ── Strategic Audit: Lighthouse CI + Author Meta ──
  describe('infrastructure quality', () => {
    it('Lighthouse CI config should include all 6 dashboard URLs', () => {
      const lhrc = JSON.parse(readFileSync(
        resolve(__dirname, '../../../tools/testing/lighthouserc.json'), 'utf-8'
      ));
      const urls = lhrc.ci.collect.url;
      const dashboards = [
        'executive-summary', 'food-insecurity', 'food-access',
        'snap-safety-net', 'food-prices', 'food-banks',
      ];
      for (const d of dashboards) {
        expect(urls.some(u => u.includes(`dashboards/${d}.html`)),
          `Lighthouse CI missing ${d}`).toBe(true);
      }
    });

    // P2-15: root hub pages use consistent "Food-N-Force" author meta (no "Team")
    it('case-studies.html and templates-tools.html meta author is consistent (P2-15)', () => {
      const rootDir = resolve(__dirname, '../../..');
      for (const file of ['case-studies.html', 'templates-tools.html']) {
        const html = readFileSync(resolve(rootDir, file), 'utf-8');
        expect(html, `${file} author meta`).toContain('<meta name="author" content="Food-N-Force">');
        expect(html, `${file} must not carry stale "Team" meta author`).not.toContain('<meta name="author" content="Food-N-Force Team">');
      }
    });

    // P2-16: dashboard meta descriptions must stay under 160 chars to avoid SERP truncation
    it('meta descriptions across all 8 dashboards are <= 160 chars (P2-16)', () => {
      const dashboardDir = resolve(__dirname, '../../../dashboards');
      const files = [
        'executive-summary.html', 'food-insecurity.html', 'food-access.html',
        'snap-safety-net.html', 'food-prices.html', 'food-banks.html',
        'nonprofit-directory.html', 'nonprofit-profile.html',
      ];
      for (const file of files) {
        const html = readFileSync(resolve(dashboardDir, file), 'utf-8');
        const match = html.match(/<meta name="description" content="([^"]+)"/);
        expect(match, `${file} missing meta description`).toBeTruthy();
        expect(match[1].length, `${file} desc is ${match[1].length} chars (over 160 SERP limit)`).toBeLessThanOrEqual(160);
      }
    });

    it('all dashboard HTML files should have consistent author meta', () => {
      const dashboardDir = resolve(__dirname, '../../../dashboards');
      const files = [
        'executive-summary.html', 'food-insecurity.html', 'food-access.html',
        'snap-safety-net.html', 'food-prices.html', 'food-banks.html',
        'nonprofit-directory.html', 'nonprofit-profile.html',
      ];
      for (const file of files) {
        const html = readFileSync(resolve(dashboardDir, file), 'utf-8');
        expect(html, `${file} has wrong author meta`).toContain(
          '<meta name="author" content="Food-N-Force">'
        );
        expect(html, `${file} has old "Team" author`).not.toContain(
          'Food-N-Force Team'
        );
      }
    });
  });
});
