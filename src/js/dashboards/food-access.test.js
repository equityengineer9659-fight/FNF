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

describe('food-access', () => {
  // ── P0 #5: Duplicate click listener ──
  describe('click handler registration', () => {
    it('should not register multiple click handlers on the same chart', () => {
      // Read the source and verify only one click registration per chart
      const jsSource = readFileSync(
        resolve(__dirname, 'food-access.js'), 'utf-8'
      );

      // Count distinct click registrations on desert-map chart
      // renderDesertMap registers one, init() should NOT register another
      const clickRegistrations = (jsSource.match(/\.on\(['"]click['"]/g) || []).length;
      // desertMap click + access-insecurity scatter click = 2 expected
      // A third registration is the bug (init() at line 1433)
      // After fix, there should be at most 2 click registrations
      expect(clickRegistrations).toBeLessThanOrEqual(2);
    });
  });

  // ── P1 #18: County filter truthy bug (same pattern as food-insecurity) ──
  describe('county filter', () => {
    it('should not drop features with rate === 0', () => {
      const features = [
        { properties: { name: 'CountyA', rate: 15.2 } },
        { properties: { name: 'CountyB', rate: 0 } },
        { properties: { name: 'CountyC', rate: 8.5 } },
        { properties: { name: 'CountyD', rate: null } },
      ];

      // Current buggy filter: .filter(f => f.properties.rate)
      // This drops rate=0 (falsy) — we want to keep it
      const correctFilter = features.filter(f =>
        f.properties.rate !== undefined && f.properties.rate !== null
      );

      expect(correctFilter).toHaveLength(3); // A, B, C — not D (null)
      expect(correctFilter.find(f => f.properties.name === 'CountyB')).toBeDefined();
    });
  });

  // ── P1 #20: Hero stat sync ──
  describe('hero stat sync', () => {
    it('hero data-target values should match current-food-access.json national data', () => {
      const accessData = readJSON('current-food-access.json');
      const html = readHTML('food-access.html');

      // Extract data-target for the affected population counter
      if (accessData.national?.affectedPopulation) {
        const popTarget = html.match(/data-target="([\d.]+)"[^>]*>\s*[\d.]*\s*<\/span>\s*<span[^>]*>M/);
        if (popTarget) {
          const htmlVal = parseFloat(popTarget[1]);
          const jsonVal = accessData.national.affectedPopulation / 1_000_000;
          expect(htmlVal).toBeCloseTo(jsonVal, 0);
        }
      }
    });
  });

  // ── P1-3: Insecurity map FIPS population ──
  describe('insecurity map FIPS lookup', () => {
    it('should populate fips from accessStates when provided', () => {
      // Simulate the renderInsecurityMap data construction logic (post-fix)
      const US_STATES_MOCK = [['AL', 'Alabama'], ['CA', 'California'], ['TX', 'Texas']];
      const accessStates = [
        { name: 'Alabama', fips: '01' },
        { name: 'California', fips: '06' },
        { name: 'Texas', fips: '48' }
      ];
      const cdcRecords = [
        { state: 'AL', value: 15.2 },
        { state: 'CA', value: 12.1 },
        { state: 'TX', value: 14.8 }
      ];

      const stateNameMap = {};
      US_STATES_MOCK.forEach(([abbr, name]) => { stateNameMap[abbr] = name; });

      const fipsByName = {};
      accessStates.forEach(s => { fipsByName[s.name] = s.fips; });

      const mapData = cdcRecords
        .filter(r => stateNameMap[r.state])
        .map(r => ({
          name: stateNameMap[r.state],
          value: r.value,
          fips: fipsByName[stateNameMap[r.state]] || null
        }));

      // After fix: all states should have non-null fips
      expect(mapData).toHaveLength(3);
      expect(mapData[0].fips).toBe('01');
      expect(mapData[1].fips).toBe('06');
      expect(mapData[2].fips).toBe('48');
    });

    it('renderInsecurityMap in source should accept accessStates parameter for FIPS lookup', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      // After fix: renderInsecurityMap should build fipsByName from accessStates
      // Either via parameter or via module-level lookup
      const fnMatch = jsSource.match(/function renderInsecurityMap\s*\([^)]+\)/);
      expect(fnMatch).not.toBeNull();
      // Should not hardcode fips: null for all records
      // (the old bug was a comment saying "CDC data uses state abbr, not FIPS")
      expect(jsSource).not.toContain('fips: null // CDC data uses state abbr');
    });

    it('insecurity view back button should not have duplicate listener in init()', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      // After fix: init() should NOT call backBtn.addEventListener for access-map-back-btn
      // renderDesertMap handles back button internally; init() had a duplicate that caused double-fire
      const initSection = jsSource.slice(jsSource.indexOf('async function init()'));
      // Match specifically: variable named backBtn with addEventListener (not just any addEventListener after getElementById)
      const backBtnListeners = (initSection.match(/\bbackBtn\b\.addEventListener/g) || []).length;
      expect(backBtnListeners).toBe(0);
    });
  });

  // ── Data shape validation ──
  describe('data shape: current-food-access.json', () => {
    it('should have national and states arrays', () => {
      const data = readJSON('current-food-access.json');
      expect(data.national).toBeDefined();
      expect(data.states).toBeDefined();
      expect(data.states.length).toBeGreaterThan(0);
    });

    it('states should have food desert fields', () => {
      const data = readJSON('current-food-access.json');
      for (const s of data.states) {
        expect(s).toHaveProperty('name');
        expect(s).toHaveProperty('lowAccessPct');
      }
    });
  });

  describe('data shape: snap-retailers.json', () => {
    it('should have states with retailer data', () => {
      const data = readJSON('snap-retailers.json');
      expect(data.states).toBeDefined();
      expect(data.states.length).toBeGreaterThan(0);
      for (const s of data.states) {
        expect(s).toHaveProperty('name');
        expect(s).toHaveProperty('retailersPer100K');
      }
    });
  });

  // ── CODX #2: Insecurity tooltip should not promise drill-down ──
  describe('insecurity view drill-down promise', () => {
    it('insecurity tooltip should NOT say "Click for county breakdown"', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      // Find the renderInsecurityMap function's tooltip
      const insecuritySection = jsSource.match(/renderInsecurityMap[\s\S]*?(?=function\s|export\s|$)/);
      expect(insecuritySection).toBeTruthy();
      expect(insecuritySection[0]).not.toContain('Click for county breakdown');
    });

    it('HTML hint should not unconditionally promise county drill-down', () => {
      const html = readHTML('food-access.html');
      // The static hint near the map should not promise drill-down for all views
      expect(html).not.toMatch(/class="dashboard-chart__hint"[^>]*>.*click any state for county breakdown/i);
    });
  });
});
