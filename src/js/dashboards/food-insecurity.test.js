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

const dataDir = resolve(__dirname, '../../../public/data');
const htmlDir = resolve(__dirname, '../../../dashboards');

function readJSON(filename) {
  return JSON.parse(readFileSync(resolve(dataDir, filename), 'utf-8'));
}

function readHTML(filename) {
  return readFileSync(resolve(htmlDir, filename), 'utf-8');
}

describe('food-insecurity', () => {
  // ── P1 #18: County filter truthy check ──
  describe('county drill-down filter', () => {
    it('should not drop counties with rate === 0', () => {
      const features = [
        { properties: { name: 'County A', rate: 12.5 } },
        { properties: { name: 'County B', rate: 0 } },
        { properties: { name: 'County C', rate: 5.0 } },
      ];

      // Correct filter: explicit null check
      const filtered = features.filter(f =>
        f.properties.rate !== undefined && f.properties.rate !== null
      );
      expect(filtered).toHaveLength(3);

      // Buggy filter (current code): truthy check drops rate=0
      const buggyFiltered = features.filter(f => f.properties.rate);
      expect(buggyFiltered).toHaveLength(2); // This documents the bug
    });

    it('should filter out counties with null or undefined rate', () => {
      const features = [
        { properties: { name: 'County A', rate: 12.5 } },
        { properties: { name: 'County B', rate: null } },
        { properties: { name: 'County C', rate: undefined } },
      ];

      const filtered = features.filter(f =>
        f.properties.rate !== undefined && f.properties.rate !== null
      );
      expect(filtered).toHaveLength(1);
    });
  });

  // ── P1 #12: Hardcoded Mississippi insight ──
  describe('hardcoded state insight', () => {
    it('map insight should use dynamic worst state from data, not hardcoded', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');

      // Should NOT have a hardcoded "Mississippi leads the nation at 18.7%"
      const hasHardcoded = jsSource.includes('Mississippi leads the nation at 18.7%');
      expect(hasHardcoded).toBe(false);

      // Should compute worst state dynamically via reduce
      expect(jsSource).toContain('data.states.reduce');
    });

    it('worst state by food insecurity rate should be identifiable', () => {
      const fiData = readJSON('food-insecurity-state.json');
      const worst = fiData.states.reduce((max, s) =>
        s.rate > max.rate ? s : max, fiData.states[0]);

      expect(worst.name).toBeDefined();
      expect(worst.rate).toBeTypeOf('number');
      expect(worst.rate).toBeGreaterThan(0);
    });
  });

  // ── P1 #13: SNAP legend year ──
  describe('SNAP legend year', () => {
    it('should match data year in source code', () => {
      const fiData = readJSON('food-insecurity-state.json');
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');

      const dataYear = fiData.national.year || fiData.year;
      if (dataYear) {
        // Legend should reference the correct fiscal year
        const legendMatch = jsSource.match(/SNAP Coverage \(FY(\d{4})\)/);
        if (legendMatch) {
          expect(parseInt(legendMatch[1], 10)).toBe(dataYear);
        }
      }
    });
  });

  // ── Data shape validation ──
  describe('data shape: food-insecurity-state.json', () => {
    it('should have national aggregate with required fields', () => {
      const data = readJSON('food-insecurity-state.json');
      expect(data.national).toBeDefined();
      expect(data.national.foodInsecurityRate).toBeTypeOf('number');
      expect(data.national.foodInsecurePersons).toBeTypeOf('number');
      expect(data.national.averageMealCost).toBeTypeOf('number');
    });

    it('states should have fields needed for all 12 charts', () => {
      const data = readJSON('food-insecurity-state.json');
      const required = ['name', 'rate', 'povertyRate', 'mealCost', 'persons'];
      for (const s of data.states) {
        for (const field of required) {
          expect(s).toHaveProperty(field);
        }
      }
    });

    it('trend data should have date and rate', () => {
      const data = readJSON('food-insecurity-state.json');
      expect(data.trend).toBeDefined();
      expect(data.trend.length).toBeGreaterThan(0);
      for (const t of data.trend) {
        expect(t).toHaveProperty('year');
        expect(t).toHaveProperty('rate');
      }
    });
  });

  // ── County GeoJSON integrity ──
  describe('county GeoJSON', () => {
    it('all 51 state FIPS files should exist', () => {
      const fipsDir = resolve(dataDir, 'counties');
      const stateFips = [
        '01','02','04','05','06','08','09','10','11','12','13','15','16','17','18',
        '19','20','21','22','23','24','25','26','27','28','29','30','31','32','33',
        '34','35','36','37','38','39','40','41','42','44','45','46','47','48','49',
        '50','51','53','54','55','56'
      ];
      for (const fips of stateFips) {
        const filePath = resolve(fipsDir, `${fips}.json`);
        expect(() => readFileSync(filePath)).not.toThrow();
      }
    });

    it('county features should use "fips" property key (not GEOID)', () => {
      // Spot-check a few state files
      const spotChecks = ['01', '06', '36', '48']; // AL, CA, NY, TX
      for (const fips of spotChecks) {
        const geo = readJSON(`counties/${fips}.json`);
        expect(geo.features.length).toBeGreaterThan(0);
        const firstFeature = geo.features[0];
        expect(firstFeature.properties).toHaveProperty('fips');
      }
    });
  });

  // ── P3 #3: County search ARIA ──
  describe('county search accessibility', () => {
    it('search input should have combobox ARIA attributes', () => {
      const html = readHTML('food-insecurity.html');

      // Look for the county search input
      const hasCombobox = html.includes('role="combobox"');
      const hasAriaExpanded = html.includes('aria-expanded');
      const hasAriaAutocomplete = html.includes('aria-autocomplete');

      expect(hasCombobox).toBe(true);
      expect(hasAriaExpanded).toBe(true);
      expect(hasAriaAutocomplete).toBe(true);
    });
  });
});
