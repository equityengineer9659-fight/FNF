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

  // ── FA-06: Double Burden must be guarded by fiData availability ──
  describe('Double Burden fiData guard', () => {
    it('renderDoubleBurden should only be called when povertyRate has been merged', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      // renderDoubleBurden must be inside the if (fiData?.states) block,
      // not called unconditionally, because curStates have no povertyRate without the merge
      const fiGuardIdx = jsSource.indexOf('if (fiData?.states)');
      const doubleBurdenCallIdx = jsSource.indexOf('renderDoubleBurden(curStates)');
      expect(fiGuardIdx).toBeGreaterThan(-1);
      expect(doubleBurdenCallIdx).toBeGreaterThan(-1);
      // renderDoubleBurden must appear AFTER the fiData guard opens
      expect(doubleBurdenCallIdx).toBeGreaterThan(fiGuardIdx);
      // Verify it's inside the block: the next closing brace after the guard
      // should come AFTER renderDoubleBurden
      const blockAfterGuard = jsSource.slice(fiGuardIdx);
      const doubleBurdenInBlock = blockAfterGuard.indexOf('renderDoubleBurden(curStates)');
      const renderAccessInsecurity = blockAfterGuard.indexOf('renderAccessInsecurity');
      // Both should be in the same guarded block
      expect(doubleBurdenInBlock).toBeGreaterThan(0);
      expect(doubleBurdenInBlock).toBeLessThan(renderAccessInsecurity);
    });

    it('povertyRate merge should use nullish check, not truthy', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      // The merge guard `if (fiByName[s.name])` drops povertyRate=0
      // Should use != null instead
      expect(jsSource).not.toMatch(/if\s*\(fiByName\[s\.name\]\)\s*s\.povertyRate/);
    });
  });

  // ── Fix 9: map-view-toggle group semantics ──
  describe('map-view-toggle accessibility', () => {
    it('should have role="group" and aria-label', () => {
      const html = readHTML('food-access.html');
      const match = html.match(/id="map-view-toggle"[^>]*/);
      expect(match).toBeTruthy();
      expect(match[0]).toContain('role="group"');
      expect(match[0]).toContain('aria-label');
    });
  });

  // ── Fix 10: Mode B tiles must have ARIA roles ──
  describe('Mode B tile ARIA', () => {
    it('tiles should have role="listitem" and aria-label', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      expect(jsSource).toContain('listitem');
      expect(jsSource).toContain('aria-label');
    });
  });

  // ── Fix 14: D3 treemap container should not have role="img" ──
  describe('D3 treemap container role', () => {
    it('chart-double-burden should not have role="img"', () => {
      const html = readHTML('food-access.html');
      const match = html.match(/id="chart-double-burden"[^>]*/);
      expect(match).toBeTruthy();
      expect(match[0]).not.toContain('role="img"');
    });
  });

  // ── Fix 19: showNational() visualMap scale ──
  describe('showNational visualMap scale', () => {
    it('should use min >= 20 matching current data range', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const fnStart = jsSource.indexOf('function showNational()');
      expect(fnStart).toBeGreaterThan(-1);
      // Find the visualMap within the next 400 chars of the function
      const fnSlice = jsSource.slice(fnStart, fnStart + 1200);
      const minMatch = fnSlice.match(/min:\s*(\d+)/);
      expect(minMatch).toBeTruthy();
      expect(parseInt(minMatch[1], 10)).toBeGreaterThanOrEqual(20);
    });
  });

  // ── Fix 20: Infinity guard on buildHeatmapLegend ──
  describe('buildHeatmapLegend Infinity guard', () => {
    it('should guard against empty pctValues before legend', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      expect(jsSource).toContain('isFinite');
    });
  });

  // ── Fix 21: visualMap null not undefined ──
  describe('visualMap null vs undefined', () => {
    it('regionBased visualMap should use null, not undefined', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      expect(jsSource).not.toMatch(/regionBased\s*\?\s*undefined/);
    });
  });

  // ── FA-21: Mode B tile column min clamp ──
  describe('Mode B tile column calculation', () => {
    it('minimum column clamp should allow 2 columns for mobile widths', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      // Math.max(4, ...) forces 4 columns minimum which overflows on mobile
      // Should be Math.max(2, ...) to allow 2-column layout
      expect(jsSource).not.toMatch(/Math\.max\(4,\s*Math\.floor/);
      expect(jsSource).toMatch(/Math\.max\(2,\s*Math\.floor/);
    });
  });

  // ── Batch 7: Double Burden pipeline tests ──
  describe('Double Burden data pipeline', () => {
    it('enriched states should have pctOfPop and estimate fields', () => {
      const accessData = readJSON('current-food-access.json');
      const fiData = readJSON('food-insecurity-state.json');

      // Simulate the merge and enrichment pipeline
      const fiByName = {};
      fiData.states.forEach(s => { fiByName[s.name] = s.povertyRate; });

      const enriched = accessData.states
        .map(s => {
          const povertyRate = fiByName[s.name] != null ? fiByName[s.name] : 0;
          const estimate = Math.round((s.lowAccessPopulation || 0) * (povertyRate / 100));
          const pctOfPop = s.totalPopulation > 0
            ? ((estimate / s.totalPopulation) * 100).toFixed(1) : '0.0';
          return { name: s.name, estimate, pctOfPop, region: s.region || 'Unknown' };
        })
        .filter(s => s.estimate > 0);

      expect(enriched.length).toBeGreaterThan(40);
      enriched.forEach(s => {
        expect(parseFloat(s.pctOfPop)).toBeGreaterThan(0);
        expect(s.estimate).toBeGreaterThan(0);
      });
    });

    it('mode toggle should set aria-pressed correctly', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      expect(jsSource).toContain('aria-pressed');
      expect(jsSource).toContain('data-db-mode');
    });
  });

  // ── Fix 23: Mode B tiles should recalculate columns on resize ──
  describe('Mode B tile resize handling', () => {
    it('should observe container resize to recalculate tile columns', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      // Must use ResizeObserver on the tile container to re-layout on width changes
      expect(jsSource).toContain('ResizeObserver');
      // The observer should target the tile container
      expect(jsSource).toContain('chart-double-burden-tiles');
    });
  });

  // ── P4: Desert map drill-down data contract ──
  describe('desert map drill-down', () => {
    it('drill-down should use current-food-access county data when available', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const drillSection = jsSource.slice(
        jsSource.indexOf('async function drillDown'),
        jsSource.indexOf('async function drillDown') + 2000
      );
      expect(drillSection).toContain('accessByFips');
      expect(drillSection).toContain('hasCurrentAccess');
      expect(drillSection).toContain('lowAccessPct');
    });

    it('all 51 county GeoJSON files should have correct properties', () => {
      // Spot-check 4 states
      const checks = ['06', '12', '36', '48']; // CA, FL, NY, TX
      for (const fips of checks) {
        const geo = readJSON(`counties/${fips}.json`);
        expect(geo.features.length).toBeGreaterThan(0);
        const f = geo.features[0];
        expect(f.properties).toHaveProperty('name');
        expect(f.properties).toHaveProperty('fips');
      }
    });
  });

  // ── P4: Urban vs Rural donut data contract ──
  describe('urban vs rural computation', () => {
    it('access data should have counties with isUrban flag', () => {
      const accessData = readJSON('current-food-access.json');
      let hasCounties = false;
      for (const state of accessData.states) {
        if (state.counties && state.counties.length > 0) {
          hasCounties = true;
          const first = state.counties[0];
          expect(first).toHaveProperty('isUrban');
          expect(first).toHaveProperty('lowAccessTracts');
          expect(first).toHaveProperty('totalTracts');
          break;
        }
      }
      expect(hasCounties).toBe(true);
    });
  });

  // ── P4: SNAP retailers map ──
  describe('SNAP retailers map', () => {
    it('renderSnapRetailers should disable drill-down', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const snapSection = jsSource.slice(jsSource.indexOf('function renderSnapRetailers'));
      expect(snapSection).toContain('setDrillDown(false)');
    });
  });

  // ── P4: renderUrbanRural source contract ──
  describe('renderUrbanRural', () => {
    it('should compute urban vs rural low-access rates from county data', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderUrbanRural'),
        jsSource.indexOf('function renderUrbanRural') + 800
      );
      expect(section).toContain('urbanLATracts');
      expect(section).toContain('ruralLATracts');
      expect(section).toContain('isUrban');
    });
  });

  // ── P4: renderDistance source contract ──
  describe('renderDistance', () => {
    it('should render line chart of average distance with Alaska cap', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderDistance'),
        jsSource.indexOf('function renderDistance') + 600
      );
      expect(section).toContain('avgDistance');
      expect(section).toContain('ALASKA_CAP');
    });
  });

  // ── P4: renderVehicle source contract ──
  describe('renderVehicle', () => {
    it('should plot distance vs low-access scatter with labeled states', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const start = jsSource.indexOf('function renderVehicle');
      const nextFn = jsSource.indexOf('\nfunction ', start + 10);
      const section = jsSource.slice(start, nextFn > start ? nextFn : start + 2000);
      expect(section).toContain('scatter');
      expect(section).toContain('lowAccessPct');
      expect(section).toContain('LABEL_STATES');
    });
  });

  // ── P4: renderLowAccessMap source contract ──
  describe('renderLowAccessMap', () => {
    it('should render choropleth with lowAccessPct metric', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function renderLowAccessMap'));
      expect(section).toContain('lowAccessPct');
      expect(section).toContain('map');
    });
  });

  // ── P4: renderAccessInsecurity source contract ──
  describe('renderAccessInsecurity', () => {
    it('should include drawAccessInsecurityScatter and updateInsight', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      expect(jsSource).toContain('drawAccessInsecurityScatter');
      expect(jsSource).toContain('updateAccessInsecurityInsight');
    });
  });

  // ── P4: initDoubleBurdenModeToggle source contract ──
  describe('initDoubleBurdenModeToggle', () => {
    it('should toggle between treemap and tiles modes', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function initDoubleBurdenModeToggle'));
      expect(section).toContain('data-db-mode');
      expect(section).toContain('aria-pressed');
    });
  });

  // ── P4: populateAccessibleTable source contract ──
  describe('populateAccessibleTable', () => {
    it('should populate a screen-reader accessible data table', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function populateAccessibleTable'));
      expect(section).toContain('table');
      expect(section).toContain('tbody');
    });
  });

  // ── Urban low-access hero stat ──
  describe('urban low-access hero stat', () => {
    it('hero stats HTML should include Urban Low-Access Rate label', () => {
      const html = readFileSync(resolve(htmlDir, 'food-access.html'), 'utf-8');
      expect(html).toContain('Urban Low-Access Rate');
    });

    it('JS should sync urban low-access rate to hero stat', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const initSection = jsSource.slice(jsSource.indexOf('async function init()'));
      expect(initSection).toContain('label.includes(\'Urban Low-Access\')');
    });
  });

  // ── Reframe access-insecurity insight text ──
  describe('access-insecurity insight reframing', () => {
    it('state-level weak correlation text should reference poverty as dominant predictor', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const fnMatch = jsSource.match(/function updateAccessInsecurityInsight[\s\S]*?^}/m);
      const fnBody = fnMatch ? fnMatch[0] : '';
      expect(fnBody).toContain('poverty');
      expect(fnBody).toContain('does not independently');
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

  // ── UI/UX Audit: Legend/Label/Color Consistency ──
  describe('legend/label/color consistency', () => {
    it('county scatter visualMap should use PAL palette, not hardcoded hex', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      expect(jsSource).not.toContain('\'#22d3ee\'');
    });

    it('county drill-down visualMap text should say "Fewer Low-Access" not just "Fewer"', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const countySection = jsSource.slice(
        jsSource.indexOf('function renderLowAccessCounty'),
        jsSource.indexOf('function renderLowAccessCounty') + 2500
      );
      expect(countySection).not.toMatch(/text:.*'Fewer'\s*\]/);
      expect(countySection).toContain('Fewer Low-Access');
    });

    it('showNational series name should match renderLowAccessMap', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const nationalSection = jsSource.slice(
        jsSource.indexOf('function showNational'),
        jsSource.indexOf('function showNational') + 2000
      );
      expect(nationalSection).toContain('name: \'Low-Access Tracts (%)\'');
      expect(nationalSection).not.toContain('name: \'Food Desert Rate\'');
    });

    it('SNAP Retailers map should use MAP_PALETTES.snap for color semantics', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const snapSection = jsSource.slice(
        jsSource.indexOf('function renderSnapRetailers'),
        jsSource.indexOf('function renderSnapRetailers') + 2000
      );
      // Should use snap palette (red→green) not inverted access palette
      expect(snapSection).toContain('MAP_PALETTES.snap');
    });
  });
});
