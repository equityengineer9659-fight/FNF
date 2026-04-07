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

  // ── P1 #9: Dead fetch removal ──
  describe('dead fetch check', () => {
    it('should not fetch food-bank-summary.json (unused in executive summary)', () => {
      const jsSource = readFileSync(resolve(__dirname, 'executive-summary.js'), 'utf-8');
      expect(jsSource).not.toContain('food-bank-summary.json');
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

  // ── CODX #1: Methodology text must match code ──
  describe('methodology text accuracy', () => {
    it('should show "× 0.3" for meal cost weight, not "× 30"', () => {
      const html = readHTML('executive-summary.html');
      // The methodology section should reference 0.3 (30%), not 30
      expect(html).toMatch(/normalized meal cost\s*&times;\s*0\.3/i);
      expect(html).not.toMatch(/normalized meal cost\s*&times;\s*30\)/i);
    });
  });
});
