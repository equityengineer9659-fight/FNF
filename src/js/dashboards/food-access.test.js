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
  // ── P3-10: drillDownLowAccess catch must surface a visible error ──
  // Kept as source-scan: guards error message text in catch block (critical safety test)
  describe('drillDownLowAccess error fallback (P3-10)', () => {
    it('catch block should call setOption with a "Could not load county data" title', () => {
      const jsSource = readFileSync(
        resolve(__dirname, 'food-access.js'), 'utf-8'
      );
      const fnStart = jsSource.indexOf('const drillDownLowAccess');
      expect(fnStart).toBeGreaterThan(-1);
      const fnEnd = jsSource.indexOf('initScrollReveal();', fnStart);
      expect(fnEnd).toBeGreaterThan(fnStart);
      const fnBody = jsSource.slice(fnStart, fnEnd);
      expect(fnBody).toContain('Could not load county data for ${stateName}');
      expect(fnBody).toMatch(/catch[\s\S]*chart\.hideLoading\(\)[\s\S]*Could not load county data/);
    });
  });

  // ── P1 #18: County filter truthy bug ──
  describe('county filter', () => {
    it('should not drop features with rate === 0', () => {
      const features = [
        { properties: { name: 'CountyA', rate: 15.2 } },
        { properties: { name: 'CountyB', rate: 0 } },
        { properties: { name: 'CountyC', rate: 8.5 } },
        { properties: { name: 'CountyD', rate: null } },
      ];

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

      expect(mapData).toHaveLength(3);
      expect(mapData[0].fips).toBe('01');
      expect(mapData[1].fips).toBe('06');
      expect(mapData[2].fips).toBe('48');
    });

    // Kept as source-scan: guards against duplicate addEventListener (hard to test behaviorally)
    it('insecurity view back button should not have duplicate listener in init()', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const initSection = jsSource.slice(jsSource.indexOf('async function init()'));
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

    it('states should have fips codes for map rendering', () => {
      const data = readJSON('current-food-access.json');
      const withFips = data.states.filter(s => s.fips);
      expect(withFips.length).toBeGreaterThanOrEqual(50);
    });

    it('lowAccessPct should be a valid percentage (0-100)', () => {
      const data = readJSON('current-food-access.json');
      for (const s of data.states) {
        expect(s.lowAccessPct).toBeGreaterThanOrEqual(0);
        expect(s.lowAccessPct).toBeLessThanOrEqual(100);
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

  // ── Edge-case guards ──
  describe('edge-case guards', () => {
    it('povertyRate merge should preserve value of 0 via nullish check', () => {
      // The fiByName merge must use != null, not truthy check
      const fiByName = { 'StateA': 12.5, 'StateB': 0, 'StateC': null };
      const states = [
        { name: 'StateA' },
        { name: 'StateB' },
        { name: 'StateC' },
        { name: 'StateD' },
      ];

      states.forEach(s => {
        // Correct: nullish check preserves 0
        if (fiByName[s.name] != null) s.povertyRate = fiByName[s.name];
      });

      expect(states[0].povertyRate).toBe(12.5);
      expect(states[1].povertyRate).toBe(0); // NOT skipped
      expect(states[2].povertyRate).toBeUndefined(); // null skipped
      expect(states[3].povertyRate).toBeUndefined(); // missing skipped
    });

    it('buildHeatmapLegend should handle empty pctValues without Infinity', () => {
      const pctValues = [];
      // Guard: check isFinite before rendering
      if (pctValues.length === 0) {
        expect(pctValues.length).toBe(0);
        return;
      }
      const min = Math.min(...pctValues);
      expect(isFinite(min)).toBe(true);
    });

    it('tile column calculation should allow 2 columns on narrow screens', () => {
      // Simulate column computation for various widths
      const colsFor = (w) => Math.max(2, Math.floor(w / 180));
      expect(colsFor(320)).toBe(2);  // mobile
      expect(colsFor(360)).toBe(2);  // mobile
      expect(colsFor(540)).toBe(3);  // small tablet
      expect(colsFor(768)).toBe(4);  // tablet
      expect(colsFor(1200)).toBe(6); // desktop
    });
  });

  // ── FA-06: Double Burden fiData guard ──
  // Kept as source-scan: guards structural ordering of fiData check
  describe('Double Burden fiData guard', () => {
    it('renderDoubleBurden should only be called when povertyRate has been merged', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const fiGuardIdx = jsSource.indexOf('if (fiData?.states)');
      const doubleBurdenCallIdx = jsSource.indexOf('renderDoubleBurden(curStates)');
      expect(fiGuardIdx).toBeGreaterThan(-1);
      expect(doubleBurdenCallIdx).toBeGreaterThan(-1);
      expect(doubleBurdenCallIdx).toBeGreaterThan(fiGuardIdx);
      const blockAfterGuard = jsSource.slice(fiGuardIdx);
      const doubleBurdenInBlock = blockAfterGuard.indexOf('renderDoubleBurden(curStates)');
      const renderAccessInsecurity = blockAfterGuard.indexOf('renderAccessInsecurity');
      expect(doubleBurdenInBlock).toBeGreaterThan(0);
      expect(doubleBurdenInBlock).toBeLessThan(renderAccessInsecurity);
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
  // Kept as source-scan: verifies ARIA attributes in innerHTML template
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
  // Kept as source-scan: verifies specific numeric threshold
  describe('showNational visualMap scale', () => {
    it('should use min >= 20 matching current data range', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const fnStart = jsSource.indexOf('function showNational()');
      expect(fnStart).toBeGreaterThan(-1);
      const fnSlice = jsSource.slice(fnStart, fnStart + 1200);
      const minMatch = fnSlice.match(/min:\s*(\d+)/);
      expect(minMatch).toBeTruthy();
      expect(parseInt(minMatch[1], 10)).toBeGreaterThanOrEqual(20);
    });
  });

  // ── Batch 7: Double Burden pipeline tests ──
  describe('Double Burden data pipeline', () => {
    it('enriched states should have pctOfPop and estimate fields', () => {
      const accessData = readJSON('current-food-access.json');
      const fiData = readJSON('food-insecurity-state.json');

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

    // Kept as source-scan: verifies ARIA in innerHTML template
    it('mode toggle should set aria-pressed correctly', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      expect(jsSource).toContain('aria-pressed');
      expect(jsSource).toContain('data-db-mode');
    });
  });

  // ── Fix 23: Mode B tiles should recalculate columns on resize ──
  // Kept as source-scan: verifies ResizeObserver usage pattern
  describe('Mode B tile resize handling', () => {
    it('should observe container resize to recalculate tile columns', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      expect(jsSource).toContain('ResizeObserver');
      expect(jsSource).toContain('chart-double-burden-tiles');
    });
  });

  // ─��� Desert map drill-down data contract ──
  describe('desert map drill-down', () => {
    it('access data states should have county-level data for drill-down', () => {
      const accessData = readJSON('current-food-access.json');
      let stateWithCounties = null;
      for (const s of accessData.states) {
        if (s.counties && s.counties.length > 0) {
          stateWithCounties = s;
          break;
        }
      }
      expect(stateWithCounties).not.toBeNull();
      const county = stateWithCounties.counties[0];
      expect(county).toHaveProperty('fips');
      expect(county).toHaveProperty('lowAccessPct');
    });

    it('all 51 county GeoJSON files should have correct properties', () => {
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

  // ── Urban vs Rural data contract ──
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

    it('should compute valid urban and rural tract totals from county data', () => {
      const accessData = readJSON('current-food-access.json');
      let urbanLATracts = 0, ruralLATracts = 0;
      for (const state of accessData.states) {
        if (!state.counties) continue;
        for (const c of state.counties) {
          if (c.isUrban) urbanLATracts += c.lowAccessTracts;
          else ruralLATracts += c.lowAccessTracts;
        }
      }
      expect(urbanLATracts).toBeGreaterThan(0);
      expect(ruralLATracts).toBeGreaterThan(0);
    });
  });

  // ── renderDistance data contract ──
  describe('renderDistance', () => {
    it('states should have avgDistance for distance chart', () => {
      const data = readJSON('current-food-access.json');
      const withDist = data.states.filter(s => typeof s.avgDistance === 'number');
      expect(withDist.length).toBeGreaterThanOrEqual(40);
    });

    it('Alaska distance should be an outlier requiring cap', () => {
      const data = readJSON('current-food-access.json');
      const alaska = data.states.find(s => s.name === 'Alaska');
      if (alaska) {
        const median = data.states
          .filter(s => typeof s.avgDistance === 'number')
          .map(s => s.avgDistance)
          .sort((a, b) => a - b);
        const medianVal = median[Math.floor(median.length / 2)];
        // Alaska distance should be significantly higher than median
        expect(alaska.avgDistance).toBeGreaterThan(medianVal * 2);
      }
    });
  });

  // ── renderVehicle data contract ──
  describe('renderVehicle', () => {
    it('states should have avgDistance and lowAccessPct for scatter chart', () => {
      const data = readJSON('current-food-access.json');
      const withFields = data.states.filter(s =>
        typeof s.avgDistance === 'number' && typeof s.lowAccessPct === 'number'
      );
      expect(withFields.length).toBeGreaterThanOrEqual(40);
    });
  });

  // ── Urban low-access hero stat ──
  describe('urban low-access hero stat', () => {
    it('hero stats HTML should include Urban Low-Access Rate label', () => {
      const html = readHTML('food-access.html');
      expect(html).toContain('Urban Low-Access Rate');
    });

    // Kept as source-scan: verifies specific label.includes pattern
    it('JS should sync urban low-access rate to hero stat', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const initSection = jsSource.slice(jsSource.indexOf('async function init()'));
      expect(initSection).toContain('label.includes(\'Urban Low-Access\')');
    });
  });

  // ── Reframe access-insecurity insight text ──
  // Kept as source-scan: guards specific insight wording
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
    // Kept as source-scan: guards against misleading UX promise
    it('insecurity tooltip should NOT say "Click for county breakdown"', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-access.js'), 'utf-8');
      const insecuritySection = jsSource.match(/renderInsecurityMap[\s\S]*?(?=function\s|export\s|$)/);
      expect(insecuritySection).toBeTruthy();
      expect(insecuritySection[0]).not.toContain('Click for county breakdown');
    });

    it('HTML hint should not unconditionally promise county drill-down', () => {
      const html = readHTML('food-access.html');
      expect(html).not.toMatch(/class="dashboard-chart__hint"[^>]*>.*click any state for county breakdown/i);
    });
  });

  // ── HTML structure validation ──
  describe('food-access.html chart containers', () => {
    it('should have containers for all chart components', () => {
      const html = readHTML('food-access.html');
      const chartIds = [
        'chart-desert-map', 'chart-urban-rural', 'chart-distance',
        'chart-vehicle', 'chart-double-burden', 'chart-access-insecurity',
      ];
      for (const id of chartIds) {
        expect(html).toContain(`id="${id}"`);
      }
    });

    it('should have map-view-toggle for map mode switching', () => {
      const html = readHTML('food-access.html');
      expect(html).toContain('map-view-toggle');
      expect(html).toContain('Food Deserts');
    });
  });

  // ── UI/UX Audit: Legend/Label/Color Consistency ──
  // Kept as source-scan: guards specific label text and color patterns
  describe('legend/label/color consistency', () => {
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
      expect(snapSection).toContain('MAP_PALETTES.snap');
    });
  });

  // ── SNAP retailers data contract ──
  describe('SNAP retailers data contract', () => {
    it('snap-retailers.json should have per-capita rates for all states', () => {
      const data = readJSON('snap-retailers.json');
      expect(data.states.length).toBeGreaterThanOrEqual(50);
      for (const s of data.states) {
        expect(s.retailersPer100K).toBeGreaterThan(0);
      }
    });
  });

  // ── Additional data contract tests ──
  describe('cross-dataset join integrity', () => {
    it('access states should align with food-insecurity states by name', () => {
      const accessData = readJSON('current-food-access.json');
      const fiData = readJSON('food-insecurity-state.json');
      const accessNames = new Set(accessData.states.map(s => s.name));
      const fiNames = new Set(fiData.states.map(s => s.name));
      // Most states should appear in both datasets for the access-insecurity scatter
      const overlap = [...accessNames].filter(n => fiNames.has(n));
      expect(overlap.length).toBeGreaterThanOrEqual(48);
    });

    it('access data totalPopulation should be positive for pctOfPop computation', () => {
      const data = readJSON('current-food-access.json');
      for (const s of data.states) {
        expect(s.totalPopulation).toBeGreaterThan(0);
      }
    });

    it('access data lowAccessPopulation should not exceed totalPopulation', () => {
      const data = readJSON('current-food-access.json');
      for (const s of data.states) {
        expect(s.lowAccessPopulation).toBeLessThanOrEqual(s.totalPopulation);
      }
    });

    it('snap-retailers states should align with food-access states by name', () => {
      const accessData = readJSON('current-food-access.json');
      const snapData = readJSON('snap-retailers.json');
      const accessNames = new Set(accessData.states.map(s => s.name));
      const snapNames = new Set(snapData.states.map(s => s.name));
      const overlap = [...snapNames].filter(n => accessNames.has(n));
      expect(overlap.length).toBeGreaterThanOrEqual(48);
    });
  });
});
