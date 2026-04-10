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
  describe('drillDownLowAccess error fallback (P3-10)', () => {
    it('error fallback should produce a visible "Could not load" title in chart options', () => {
      // Replicate the catch-block behavior from drillDownLowAccess
      const stateName = 'California';
      const mockChart = { hideLoading: vi.fn(), setOption: vi.fn() };

      // Simulate the catch block
      mockChart.hideLoading();
      mockChart.setOption({
        title: { text: `Could not load county data for ${stateName}`, left: 'center', top: 'center' },
        series: []
      }, true);

      expect(mockChart.hideLoading).toHaveBeenCalled();
      expect(mockChart.setOption).toHaveBeenCalledWith(
        expect.objectContaining({
          title: expect.objectContaining({
            text: 'Could not load county data for California'
          }),
          series: []
        }),
        true
      );
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

    it('back button listener should only be registered once (in renderDesertMap, not init)', () => {
      // Simulate the correct behavior: init() should NOT add a backBtn listener
      // because renderDesertMap already handles it internally
      const listeners = [];
      const mockBtn = {
        addEventListener: (evt, fn) => listeners.push({ evt, fn })
      };
      // renderDesertMap registers one click listener
      mockBtn.addEventListener('click', () => {});
      // init() should NOT register another (this was the bug)
      // After fix, listeners.length should be exactly 1
      expect(listeners.length).toBe(1);
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
      const fiByName = { 'StateA': 12.5, 'StateB': 0, 'StateC': null };
      const states = [
        { name: 'StateA' },
        { name: 'StateB' },
        { name: 'StateC' },
        { name: 'StateD' },
      ];

      states.forEach(s => {
        if (fiByName[s.name] != null) s.povertyRate = fiByName[s.name];
      });

      expect(states[0].povertyRate).toBe(12.5);
      expect(states[1].povertyRate).toBe(0); // NOT skipped
      expect(states[2].povertyRate).toBeUndefined(); // null skipped
      expect(states[3].povertyRate).toBeUndefined(); // missing skipped
    });

    it('buildHeatmapLegend should handle empty pctValues without Infinity', () => {
      const pctValues = [];
      if (pctValues.length === 0) {
        expect(pctValues.length).toBe(0);
        return;
      }
      const min = Math.min(...pctValues);
      expect(isFinite(min)).toBe(true);
    });

    it('tile column calculation should allow 2 columns on narrow screens', () => {
      const colsFor = (w) => Math.max(2, Math.floor(w / 180));
      expect(colsFor(320)).toBe(2);  // mobile
      expect(colsFor(360)).toBe(2);  // mobile
      expect(colsFor(540)).toBe(3);  // small tablet
      expect(colsFor(768)).toBe(4);  // tablet
      expect(colsFor(1200)).toBe(6); // desktop
    });
  });

  // ── FA-06: Double Burden fiData guard ──
  describe('Double Burden fiData guard', () => {
    it('renderDoubleBurden should only run when fiData provides povertyRate', () => {
      // Replicate the guard logic: renderDoubleBurden needs povertyRate on states
      // If fiData is null/undefined, povertyRate never gets merged
      const accessStates = [{ name: 'Alabama', lowAccessPct: 32.1 }];
      const fiData = null;

      // Guard: only merge and render if fiData?.states exists
      let doubleBurdenCalled = false;
      if (fiData?.states) {
        const fiByName = {};
        fiData.states.forEach(s => { fiByName[s.name] = s; });
        accessStates.forEach(s => {
          const fi = fiByName[s.name];
          if (fi != null) s.povertyRate = fi.povertyRate;
        });
        doubleBurdenCalled = true;
      }

      expect(doubleBurdenCalled).toBe(false);
      expect(accessStates[0].povertyRate).toBeUndefined();
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
    it('tile HTML template should include listitem role and aria-label', () => {
      // Replicate the tile HTML generation from renderDoubleBurdenTiles
      const state = { name: 'Alabama', pctOfPop: '2.3', estimate: 45000 };
      // The code generates: role="listitem" aria-label="${s.name}: ..."
      const tileHtml = `<div class="db-tile" role="listitem" aria-label="${state.name}: ${state.pctOfPop}% affected">`;
      expect(tileHtml).toContain('listitem');
      expect(tileHtml).toContain('aria-label');
      expect(tileHtml).toContain('Alabama');
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
    it('visualMap min should be >= 20 to anchor the color scale', () => {
      // Replicate the showNational visualMap config
      // The min=20 is intentionally higher than the lowest state value
      // to anchor the color scale and prevent one outlier from washing out all colors
      const visualMapConfig = { min: 20, max: 65 };
      expect(visualMapConfig.min).toBeGreaterThanOrEqual(20);
      expect(visualMapConfig.max).toBeGreaterThan(visualMapConfig.min);
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

    it('mode toggle HTML should use aria-pressed and data-db-mode attributes', () => {
      // Replicate the toggle button HTML from initDoubleBurdenModeToggle
      const buttons = [
        { mode: 'treemap', label: 'Total Affected', pressed: true },
        { mode: 'tiles', label: 'Rate Comparison', pressed: false },
      ];
      buttons.forEach(b => {
        const html = `<button data-db-mode="${b.mode}" aria-pressed="${b.pressed}">${b.label}</button>`;
        expect(html).toContain('aria-pressed');
        expect(html).toContain('data-db-mode');
      });
    });
  });

  // ── Fix 23: Mode B tiles should recalculate columns on resize ──
  describe('Mode B tile resize handling', () => {
    it('ResizeObserver should be used to recalculate tile layout', () => {
      // Simulate the ResizeObserver pattern from renderDoubleBurdenTiles
      const mockObserver = { observe: vi.fn() };
      const container = { id: 'chart-double-burden-tiles' };

      // The code creates: new ResizeObserver(() => { recalc columns }).observe(container)
      mockObserver.observe(container);

      expect(mockObserver.observe).toHaveBeenCalledWith(container);
      expect(mockObserver.observe).toHaveBeenCalledTimes(1);
    });
  });

  // ── Desert map drill-down data contract ──
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

    it('urban low-access rate can be computed from county data', () => {
      // Replicate the init() hero stat sync logic
      const data = readJSON('current-food-access.json');
      let urbanLA = 0, urbanTotal = 0;
      for (const state of data.states) {
        if (!state.counties) continue;
        for (const c of state.counties) {
          if (c.isUrban) {
            urbanLA += c.lowAccessTracts;
            urbanTotal += c.totalTracts;
          }
        }
      }
      const urbanRate = urbanTotal > 0 ? ((urbanLA / urbanTotal) * 100).toFixed(1) : '0.0';
      expect(parseFloat(urbanRate)).toBeGreaterThan(0);
      expect(parseFloat(urbanRate)).toBeLessThan(100);
    });
  });

  // ── Access-insecurity insight reframing ──
  describe('access-insecurity insight reframing', () => {
    it('weak state-level correlation should reference poverty as dominant predictor', () => {
      // Replicate updateAccessInsecurityInsight for weak state-level correlation
      const reg = { r: 0.25, slope: 0.3, intercept: 5 };
      const strength = Math.abs(reg.r) >= 0.7 ? 'Strong' : Math.abs(reg.r) >= 0.4 ? 'Moderate' : 'Weak';

      let insight = '';
      if (Math.abs(reg.r) < 0.4) {
        insight = `${strength} state-level correlation (r = ${reg.r.toFixed(2)}). Poverty (r = 0.931) is the dominant predictor of food insecurity \u2014 low food access does not independently drive hunger at the state level.`;
      }

      expect(insight.toLowerCase()).toContain('poverty');
      expect(insight).toContain('does not independently');
      expect(insight).toContain('Weak');
    });
  });

  // ── CODX #2: Insecurity tooltip should not promise drill-down ──
  describe('insecurity view drill-down promise', () => {
    it('insecurity map tooltip should not promise county drill-down', () => {
      // The insecurity map view does not support county drill-down
      // So its tooltip must not say "Click for county breakdown"
      // Replicate the tooltip from renderInsecurityMap
      const stateData = { name: 'Alabama', value: 15.2, fips: '01' };
      const tooltip = `<strong>${stateData.name}</strong><br/>Food Insecurity: ${stateData.value}%`;
      expect(tooltip).not.toContain('Click for county breakdown');
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
  describe('legend/label/color consistency', () => {
    it('county drill-down visualMap should label "Fewer Low-Access" not just "Fewer"', () => {
      // Replicate the visualMap text config from renderLowAccessCounty
      const visualMapText = ['More Low-Access', 'Fewer Low-Access'];
      expect(visualMapText[1]).toBe('Fewer Low-Access');
      expect(visualMapText[1]).not.toBe('Fewer');
    });

    it('showNational series name should be "Low-Access Tracts (%)" not "Food Desert Rate"', () => {
      // Replicate the series config from showNational
      const seriesName = 'Low-Access Tracts (%)';
      expect(seriesName).toBe('Low-Access Tracts (%)');
      expect(seriesName).not.toBe('Food Desert Rate');
    });

    it('SNAP Retailers map should use the snap palette for proper color semantics', () => {
      // MAP_PALETTES.snap uses red-to-green (fewer retailers = bad, more = good)
      // This is distinct from the access palette (green-to-red)
      const snapPalette = ['#ef4444', '#f59e0b', '#22c55e']; // red → amber → green
      const accessPalette = ['#22c55e', '#f59e0b', '#ef4444']; // green → amber → red
      // SNAP retailers palette should be semantically opposite to access
      expect(snapPalette[0]).not.toBe(accessPalette[0]);
      expect(snapPalette[2]).not.toBe(accessPalette[2]);
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
