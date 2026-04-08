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

  // ── P1-1: CDC PLACES field name contract ──
  describe('CDC PLACES field names', () => {
    it('dashboard-places.php should use measureid (not measure text) as record key', () => {
      const phpSource = readFileSync(
        resolve(__dirname, '../../../public/api/dashboard-places.php'), 'utf-8'
      );
      // Must use $row['measureid'] — not $row['measure'] — as the key
      // $row['measure'] returns long text like "Obesity among adults" which breaks JS field access
      expect(phpSource).toContain('$row[\'measureid\']');
      expect(phpSource).not.toMatch(/\$key\s*=\s*strtolower\s*\(\s*\$row\s*\[\s*['"]measure['"]\s*\]/);
    });

    it('food-insecurity.js should merge CDC records using short-form keys matching measureid', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      // The merge uses p.obesity, p.diabetes, p.depression, p.housinsec
      // These match the lowercase measureid values: obesity, diabetes, depression, housinsec
      expect(jsSource).toContain('p.obesity');
      expect(jsSource).toContain('p.diabetes');
      expect(jsSource).toContain('p.depression');
      expect(jsSource).toContain('p.housinsec');
    });

    it('CDC PLACES merge should produce short-key fields on sdoh state records', () => {
      // Simulate the merge logic with a mock CDC record using correct (short) keys
      const sdohState = { name: 'Alabama' };
      const cdcRecord = { obesity: 37.2, diabetes: 14.1, depression: 20.5, housinsec: 9.8 };

      // This is what fetchCDCPlacesData does after the fix:
      sdohState.obesity = cdcRecord.obesity;
      sdohState.diabetes = cdcRecord.diabetes;
      sdohState.depression = cdcRecord.depression;
      sdohState.housinsec = cdcRecord.housinsec;

      expect(sdohState.obesity).toBe(37.2);
      expect(sdohState.diabetes).toBe(14.1);
      expect(sdohState.depression).toBe(20.5);
      expect(sdohState.housinsec).toBe(9.8);
    });
  });

  // ── C-1: CDC PLACES merge must key by state abbreviation, not s.name ──
  describe('CDC PLACES merge key', () => {
    it('placesByName should be keyed by state abbreviation (s.state), not s.name', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      // The PHP API returns records with { state: "AL", obesity: ..., ... }
      // The merge must key on s.state (abbreviation), then look up full names via US_STATES
      const mergeBlock = jsSource.slice(
        jsSource.indexOf('// Merge CDC fields'),
        jsSource.indexOf('// Re-render buttons to include CDC')
      );
      // Must NOT key by s.name (which doesn't exist in the API response)
      expect(mergeBlock).not.toMatch(/placesByName\[s\.name\]\s*=\s*s/);
      // Must key by s.state (the abbreviation field from the API)
      expect(mergeBlock).toMatch(/placesByName\[s\.state\]\s*=\s*s/);
    });

    it('merge lookup should use abbreviation-to-name mapping for sdohData join', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      // sdohData.states use full names ("Alabama"), but placesByName is keyed by abbreviation ("AL")
      // Code must use a nameToAbbr mapping or US_STATES to bridge the join
      expect(jsSource).toContain('nameToAbbr');
    });
  });

  // ── Fix 18: Hero stats must be updated from JSON ──
  describe('hero stat dynamic updates', () => {
    it('init() should update hero data-target from national data', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      const initSection = jsSource.slice(jsSource.indexOf('async function init()'));
      // Should update at least the national rate and persons KPIs
      expect(initSection).toContain('foodInsecurityRate');
      expect(initSection).toContain('foodInsecurePersons');
      expect(initSection).toContain('dashboard-stat__number');
    });
  });

  // ── Fix 7: Meal cost insight percentage must match data ──
  describe('meal cost insight accuracy', () => {
    it('Hawaii premium over national average should be ~43%, not 28%', () => {
      const fiData = readJSON('food-insecurity-state.json');
      const html = readHTML('food-insecurity.html');
      const hawaii = fiData.states.find(s => s.name === 'Hawaii');
      const nationalAvg = fiData.national.averageMealCost;
      const actualPremium = Math.round((hawaii.mealCost / nationalAvg - 1) * 100);
      // HTML should contain the correct percentage
      expect(html).toContain(`${actualPremium}% above the national average`);
      // Should NOT contain stale 28%
      expect(html).not.toContain('28% above the national average');
    });
  });

  // ── Fix 8: Triple Burden empty array guard ──
  describe('Triple Burden accessVals guard', () => {
    it('should guard against Math.min/max on empty accessVals array', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      // Must check accessVals.length before Math.min/max to prevent Infinity/-Infinity
      const tripleBurdenSection = jsSource.slice(
        jsSource.indexOf('const accessVals'),
        jsSource.indexOf('const scored = data.states.map')
      );
      expect(tripleBurdenSection).toMatch(/accessVals\.length/);
    });
  });

  // ── Fix 15: Demographics tooltip divide-by-zero guard ──
  describe('demographics tooltip safety', () => {
    it('childRate/rate division should guard against rate === 0', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      // Should have a guard like s.rate > 0 before dividing
      expect(jsSource).toMatch(/s\.rate\s*>\s*0/);
    });
  });

  // ── Fix 16: County metric fallback must use ?? not || ──
  describe('county metric fallback operator', () => {
    it('should use nullish coalescing, not truthy fallback', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      // Must use ?? to preserve metric value of 0
      expect(jsSource).toContain('currentMetric] ??');
      expect(jsSource).not.toContain('currentMetric] ||');
    });
  });

  // ── Batch 7: Test coverage for critical untested functions ──
  describe('renderTripleBurden data contract', () => {
    it('should guard accessVals with length check before Math.min/max', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('const accessVals'));
      expect(section).toContain('accessVals.length');
    });

    it('norm function should clamp to 0-100 range', () => {
      // Test the norm function inline
      const norm = (val, min, max) => Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
      expect(norm(50, 0, 100)).toBe(50);
      expect(norm(-10, 0, 100)).toBe(0);
      expect(norm(200, 0, 100)).toBe(100);
      expect(norm(5, 5, 5)).toBeNaN(); // division by zero edge case
    });
  });

  describe('renderDemographics data contract', () => {
    it('tooltip should guard against rate=0 for child multiplier', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      expect(jsSource).toMatch(/s\.rate\s*>\s*0/);
    });
  });

  describe('renderIncomeRiver null handling', () => {
    it('should use nullish coalescing for income band values', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      expect(jsSource).toMatch(/income\[.*\]\s*\?\?\s*0/);
    });
  });

  describe('renderSDOH empty points guard', () => {
    it('should early-return when no SDOH data points exist', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      const sdohSection = jsSource.slice(jsSource.indexOf('function renderSDOH'));
      expect(sdohSection).toContain('points.length');
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

  // ── Audit 2026-04-07 #1: County filter must not use truthy check ──
  describe('county filter null-safety', () => {
    it('drillDown filter should use explicit null check, not truthy', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      // The filter on county GeoJSON features must NOT use truthy `.filter(f => f.properties.rate)`
      // because rate=0 is falsy but valid. Must use null/undefined check instead.
      const truthyFilterPattern = /\.filter\(f\s*=>\s*f\.properties\.rate\)/;
      expect(jsSource).not.toMatch(truthyFilterPattern);
    });
  });

  // ── Audit 2026-04-07 #2: SNAP legend vs series name consistency ──
  describe('SNAP legend/series name consistency', () => {
    it('all SNAP Coverage year references should be consistent', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      const yearRefs = [...jsSource.matchAll(/SNAP Coverage \(FY(\d{4})\)/g)].map(m => m[1]);
      // All year references for SNAP Coverage should be the same
      expect(yearRefs.length).toBeGreaterThan(0);
      const uniqueYears = [...new Set(yearRefs)];
      expect(uniqueYears).toHaveLength(1);
    });
  });

  // ── Fix 17: Map aria-label should update on metric change ──
  describe('map aria-label metric updates', () => {
    it('showNational should update chart-map aria-label with current metric name', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      const showNationalBody = jsSource.slice(
        jsSource.indexOf('function showNational()'),
        jsSource.indexOf('function showNational()') + 1200
      );
      expect(showNationalBody).toContain('aria-label');
      expect(showNationalBody).toContain('chart-map');
    });
  });

  // ── P4: renderSDOH data contract ──
  describe('renderSDOH scatter data contract', () => {
    it('SDOH state data should join with food-insecurity-state.json on name', () => {
      const fiData = readJSON('food-insecurity-state.json');
      // SDOH data comes from Census API at runtime, but the merge is by name
      const fiNames = new Set(fiData.states.map(s => s.name));
      expect(fiNames.size).toBeGreaterThanOrEqual(50);
    });

    it('SDOH metric keys should exist in source code', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      expect(jsSource).toContain('SDOH_METRICS');
      expect(jsSource).toContain('obesity');
      expect(jsSource).toContain('diabetes');
    });
  });

  // ── P4: renderStateDeepDive data contract ──
  describe('renderStateDeepDive data contract', () => {
    it('should render 6 KPI tiles per state', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      const deepDiveSection = jsSource.slice(jsSource.indexOf('function renderStateDeepDive'));
      // Should create KPI elements for multiple data points
      expect(deepDiveSection).toContain('kpi');
      expect(deepDiveSection).toContain('accessData');
      expect(deepDiveSection).toContain('bankData');
    });
  });

  // ── P4: renderIncomeRiver data contract ──
  describe('renderIncomeRiver data contract', () => {
    it('income river should use themeRiver chart type', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      expect(jsSource).toContain('themeRiver');
    });

    it('INCOME_BANDS should span full range from lowest to highest', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      expect(jsSource).toContain('Under $25K');
      expect(jsSource).toContain('$200K+');
    });
  });

  // ── P4: renderMap source contract ──
  describe('renderMap', () => {
    it('should support 6 metric modes via metricConfig', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      expect(jsSource).toContain('rate:');
      expect(jsSource).toContain('childRate:');
      expect(jsSource).toContain('persons:');
      expect(jsSource).toContain('mealGap:');
      expect(jsSource).toContain('mealCost:');
      expect(jsSource).toContain('snapCoverage:');
    });

    it('should have county drill-down with back button', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      expect(jsSource).toContain('map-back-btn');
      expect(jsSource).toContain('drillDown');
      expect(jsSource).toContain('showNational');
    });
  });

  // ── P4: renderTrend source contract ──
  describe('renderTrend', () => {
    it('should have markLine annotations for historic events', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function renderTrend'));
      expect(section).toContain('markLine');
    });
  });

  // ── P4: renderBar (meal cost horizontal bar) source contract ──
  describe('renderMealCost', () => {
    it('should render horizontal bar with national avg markLine', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function renderMealCost'));
      expect(section).toContain('bar');
      expect(section).toContain('markLine');
    });
  });

  // ── P4: renderScatter source contract ──
  describe('renderScatter', () => {
    it('should support adult and child poverty mode toggle', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      const section = jsSource.slice(
        jsSource.indexOf('function renderScatter'),
        jsSource.indexOf('function renderScatter') + 800
      );
      expect(section).toContain('scatter');
      expect(section).toContain('povertyRate');
      expect(section).toContain('childPovertyRate');
    });
  });

  // ── P4: renderSnap (SNAP coverage bars) source contract ──
  describe('renderSnap', () => {
    it('should compare SNAP participants vs food-insecure persons', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function renderSnap'));
      expect(section).toContain('snapParticipation');
      expect(section).toContain('persons');
    });
  });

  // ── P4: initCountySearch source contract ──
  describe('initCountySearch', () => {
    it('should lazy-load county index and use ARIA combobox', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function initCountySearch'));
      expect(section).toContain('county-index.json');
      expect(section).toContain('county-search-results');
    });
  });

  // ── P4: buildStateInsight source contract ──
  describe('buildStateInsight', () => {
    it('should compute cross-dataset KPIs for state narrative', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      const section = jsSource.slice(jsSource.indexOf('function buildStateInsight'));
      expect(section).toContain('bankData');
      expect(section).toContain('accessData');
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

  // ── Poverty-Insecurity Divergence chart ──
  describe('poverty-insecurity divergence chart', () => {
    it('food-insecurity.html should have chart-divergence container', () => {
      const html = readFileSync(resolve(__dirname, '../../../dashboards/food-insecurity.html'), 'utf-8');
      expect(html).toContain('chart-divergence');
    });

    it('renderDivergence function should exist', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      expect(jsSource).toContain('function renderDivergence');
    });

    it('init should call renderDivergence between demographics and meal cost', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      const initStart = jsSource.indexOf('async function init(');
      const initSection = jsSource.slice(initStart);
      const demoIdx = initSection.indexOf('renderDemographics(');
      const divIdx = initSection.indexOf('renderDivergence(');
      const mealIdx = initSection.indexOf('renderMealCost(');
      expect(divIdx).toBeGreaterThan(demoIdx);
      expect(divIdx).toBeLessThan(mealIdx);
    });

    it('divergence values should have both positive and negative states', () => {
      const data = JSON.parse(readFileSync(resolve(__dirname, '../../../public/data/food-insecurity-state.json'), 'utf-8'));
      const divergences = data.states.map(s => +(s.rate - s.povertyRate).toFixed(1));
      expect(divergences.filter(d => d > 0).length).toBeGreaterThan(0);
      expect(divergences.filter(d => d < 0).length).toBeGreaterThan(0);
    });

    it('renderDivergence should create a horizontal bar chart', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      const fnStart = jsSource.indexOf('function renderDivergence');
      const fnEnd = jsSource.indexOf('\nfunction', fnStart + 1);
      const section = jsSource.slice(fnStart, fnEnd > fnStart ? fnEnd : fnStart + 2000);
      expect(section).toContain('type: \'bar\'');
      expect(section).toContain('chart-divergence');
      expect(section).toContain('povertyRate');
    });
  });

  // ── CODX: Combobox ARIA completeness ──
  describe('combobox ARIA completeness', () => {
    it('keyboard handler should set aria-activedescendant', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      expect(jsSource).toContain('aria-activedescendant');
    });

    it('Escape key should set aria-expanded to false', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      const escapeIdx = jsSource.indexOf('e.key === \'Escape\'');
      expect(escapeIdx).toBeGreaterThan(-1);
      const escapeBlock = jsSource.slice(escapeIdx, escapeIdx + 250);
      expect(escapeBlock).toContain('aria-expanded');
    });

    it('outside-click handler should set aria-expanded to false', () => {
      const jsSource = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');
      const outsideIdx = jsSource.indexOf('Close on outside click');
      expect(outsideIdx).toBeGreaterThan(-1);
      const outsideBlock = jsSource.slice(outsideIdx, outsideIdx + 250);
      expect(outsideBlock).toContain('aria-expanded');
    });
  });
});
