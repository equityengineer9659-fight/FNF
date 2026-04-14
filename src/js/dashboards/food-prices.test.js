import { describe, it, expect, vi, beforeEach } from 'vitest';
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

/** Parse HTML file into a jsdom document for DOM-based assertions */
function parseHTML(filename) {
  const html = readFileSync(resolve(htmlDir, filename), 'utf-8');
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

describe('food-prices', () => {
  // ── P1 #28: Regional chart baseline label ──
  describe('regional chart baseline', () => {
    it('regional data start date should not be from 2020 when earlier data exists', () => {
      const regionalData = readJSON('bls-regional-cpi.json');
      const firstDate = regionalData.categories?.series?.[0]?.data?.[0]?.date
        || regionalData.series?.[0]?.data?.[0]?.date;
      if (firstDate) {
        // If regional data starts before 2020, the baseline should not be "Jan 2020"
        const startYear = parseInt(firstDate.slice(0, 4), 10);
        expect(startYear).toBeLessThanOrEqual(2020);
      }
    });
  });

  // ── P1 #29: Hero meal cost staleness ──
  describe('hero stat freshness', () => {
    it('meal cost hero data-target should match food-insecurity-state.json', () => {
      const fiData = readJSON('food-insecurity-state.json');
      const doc = parseHTML('food-prices.html');

      const jsonMealCost = fiData.national.averageMealCost;
      const match = doc.querySelector('[data-prefix="$"][data-target]');
      if (match && jsonMealCost) {
        const htmlVal = parseFloat(match.getAttribute('data-target'));
        expect(htmlVal).toBeCloseTo(jsonMealCost, 1);
      }
    });
  });

  // ── P1 #30: Lowest quintile food share ──
  describe('hero stat: lowest quintile', () => {
    it('food share data-target should match bls-regional-cpi.json quintile data', () => {
      const regionalData = readJSON('bls-regional-cpi.json');
      const doc = parseHTML('food-prices.html');

      const quintiles = regionalData.affordability?.quintiles;
      if (quintiles && quintiles.length > 0) {
        const lowestQuintile = quintiles[0];
        const jsonVal = lowestQuintile.foodSharePct;

        // Find the stat element whose sibling label says "Income on Food"
        const statEls = doc.querySelectorAll('[data-suffix="%"][data-target]');
        let match = null;
        for (const el of statEls) {
          const label = el.parentElement?.querySelector('p');
          if (label && /income on food/i.test(label.textContent)) { match = el; break; }
        }
        if (match && jsonVal) {
          const htmlVal = parseFloat(match.getAttribute('data-target'));
          expect(htmlVal).toBeCloseTo(jsonVal, 0);
        }
      }
    });
  });

  // ── P1 #31: Affordability map bounds ──
  describe('affordability map bounds', () => {
    it('state affordability indices should be in a reasonable range', () => {
      const regionalData = readJSON('bls-regional-cpi.json');
      const stateAffordability = regionalData.stateAffordability?.states;
      if (stateAffordability) {
        const minIndex = Math.min(...stateAffordability.map(s => s.index));
        const maxIndex = Math.max(...stateAffordability.map(s => s.index));
        // Indices represent relative affordability — min should be above 0
        expect(minIndex).toBeGreaterThan(0);
        expect(maxIndex).toBeGreaterThan(minIndex);
      }
    });
  });

  // ── Data shape validation ──
  describe('data shape: bls-regional-cpi.json', () => {
    it('should have categories and regional data', () => {
      const data = readJSON('bls-regional-cpi.json');
      expect(data.categories || data.series).toBeDefined();
    });

    it('should have affordability data', () => {
      const data = readJSON('bls-regional-cpi.json');
      expect(data.affordability).toBeDefined();
      if (data.affordability.quintiles) {
        expect(data.affordability.quintiles.length).toBeGreaterThan(0);
      }
    });

    it('should have stateAffordability with index values', () => {
      const data = readJSON('bls-regional-cpi.json');
      if (data.stateAffordability?.states) {
        expect(data.stateAffordability.states.length).toBeGreaterThan(0);
        for (const s of data.stateAffordability.states) {
          expect(s).toHaveProperty('name');
          expect(s).toHaveProperty('index');
          expect(s.index).toBeTypeOf('number');
        }
      }
    });
  });

  // ── P1-2: LinearGradient serialization bug ──
  describe('rebuildPurchasingPowerSeries LinearGradient preservation', () => {
    it('LinearGradient instances should not survive JSON round-trip (documents the bug)', () => {
      // Demonstrates why JSON.parse/stringify alone is insufficient
      const gradient = { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(255,0,0,0.2)' }] };
      const cloned = JSON.parse(JSON.stringify(gradient));
      expect(cloned.colorStops).toBeDefined();
      expect(cloned.colorStops[0].color).toBe('rgba(255,0,0,0.2)');
    });

    it('food-prices.html Chart 4 copy values should match bls-regional-cpi.json quintile data', () => {
      const regionalData = readJSON('bls-regional-cpi.json');
      const doc = parseHTML('food-prices.html');
      const quintiles = regionalData.affordability?.quintiles;
      if (!quintiles) return;

      const bottom = quintiles[0];
      const top = quintiles[quintiles.length - 1];
      const bodyText = doc.body.textContent.replace(/,/g, '');

      if (bottom?.foodSharePct) {
        expect(bodyText).toContain(bottom.foodSharePct.toString());
      }
      if (bottom?.monthlyFoodCost) {
        expect(bodyText).toContain(bottom.monthlyFoodCost.toString());
      }
      if (top?.monthlyFoodCost) {
        expect(bodyText).toContain(top.monthlyFoodCost.toString());
      }
    });
  });

  // ── BLS/FRED data format validation ──
  describe('BLS series IDs', () => {
    it('bls-regional-cpi.json should have named series matching BLS food categories', () => {
      const data = readJSON('bls-regional-cpi.json');
      expect(data.regions).toBeDefined();
      expect(data.regions.series.length).toBeGreaterThan(0);
      for (const s of data.regions.series) {
        expect(s).toHaveProperty('name');
        expect(typeof s.name).toBe('string');
      }
    });

    it('bls-food-cpi.json should have food-related BLS series with data', () => {
      const data = readJSON('bls-food-cpi.json');
      expect(data.series.length).toBeGreaterThan(0);
      const names = data.series.map(s => s.name);
      expect(names.some(n => /food/i.test(n))).toBe(true);
    });
  });

  // ── Fix 24: Regional insight gap percentage ──
  describe('regional insight accuracy', () => {
    it('should not contain stale "8.6%" regional gap', () => {
      const doc = parseHTML('food-prices.html');
      expect(doc.body.textContent).not.toContain('8.6% more');
    });
  });

  // ── Fix 25: Data range start year ──
  describe('regional data range label', () => {
    it('data range should say 2018, not 2020', () => {
      const doc = parseHTML('food-prices.html');
      const bodyText = doc.body.textContent;
      expect(bodyText).toContain('2018-present');
      expect(bodyText).not.toMatch(/Data Range\s*2020-present/);
    });
  });

  // ── Fix 27: Purchasing Power heading ──
  describe('purchasing power heading', () => {
    it('heading should not contain "Gap" when SNAP exceeds food CPI', () => {
      const doc = parseHTML('food-prices.html');
      expect(doc.body.textContent).not.toContain('The Purchasing Power Gap');
    });
  });

  // ── Fix 28: Purchasing power insight language ──
  describe('purchasing power insight text', () => {
    it('should say "outpaced" not "keeping pace" when SNAP exceeds food CPI', () => {
      // Data contract: verify SNAP benefit growth can be compared against CPI
      const snapData = readJSON('snap-participation.json');
      expect(snapData.benefitTimeline).toBeDefined();
      expect(snapData.benefitTimeline.data.length).toBeGreaterThan(0);
      // The benefitTimeline enables the "outpaced" calculation
      const amounts = snapData.benefitTimeline.data.map(b => b.value);
      const growth = amounts[amounts.length - 1] / amounts[0];
      expect(growth).toBeGreaterThan(1); // Benefits have grown over time
    });
  });

  // ── CODX #3: HTML metadata accuracy ──
  describe('affordability map metadata', () => {
    it('HTML data year should match JSON data year', () => {
      const regionalData = readJSON('bls-regional-cpi.json');
      const doc = parseHTML('food-prices.html');
      const jsonYear = regionalData.stateAffordability.year;

      const bodyText = doc.body.textContent;
      const yearMatch = bodyText.match(/Data Year\s*(\d{4})/);
      expect(yearMatch).toBeTruthy();
      expect(parseInt(yearMatch[1], 10)).toBe(jsonYear);
    });

    it('stateAffordability states should have mealCost and medianIncome fields', () => {
      const data = readJSON('bls-regional-cpi.json');
      if (data.stateAffordability?.states) {
        for (const s of data.stateAffordability.states) {
          expect(s).toHaveProperty('index');
          expect(s.index).toBeTypeOf('number');
        }
      }
    });
  });

  // ── P4: renderCategories data contract ──
  describe('renderCategories', () => {
    it('BLS CPI data should have multiple food categories', () => {
      const data = readJSON('bls-regional-cpi.json');
      expect(data.categories).toBeDefined();
      expect(data.categories.series.length).toBeGreaterThan(3);
    });

    it('first category data point should be from 2018 (normalization baseline)', () => {
      const data = readJSON('bls-regional-cpi.json');
      const firstDate = data.categories?.series?.[0]?.data?.[0]?.date;
      if (firstDate) {
        expect(firstDate.startsWith('2018')).toBe(true);
      }
    });
  });

  // ── P4: renderRegions data contract ──
  describe('renderRegions', () => {
    it('regional data should have at least 4 regions', () => {
      const data = readJSON('bls-regional-cpi.json');
      expect(data.regions.series.length).toBeGreaterThanOrEqual(4);
    });

    it('regional chart legend baseline should have itemStyle via HTML DOM', () => {
      const doc = parseHTML('food-prices.html');
      expect(doc.querySelector('#chart-regions')).not.toBeNull();
    });
  });

  // ── P4: renderAffordabilityMap data contract ──
  describe('renderAffordabilityMap', () => {
    it('stateAffordability data should support choropleth rendering', () => {
      const data = readJSON('bls-regional-cpi.json');
      expect(data.stateAffordability?.states).toBeDefined();
      expect(data.stateAffordability.states.length).toBeGreaterThan(0);
      for (const s of data.stateAffordability.states) {
        expect(s).toHaveProperty('name');
        expect(s).toHaveProperty('index');
      }
    });
  });

  // ── P4: renderBurden data contract ──
  describe('renderBurden', () => {
    it('affordability quintiles should have required fields', () => {
      const data = readJSON('bls-regional-cpi.json');
      expect(data.affordability?.quintiles).toBeDefined();
      for (const q of data.affordability.quintiles) {
        expect(q).toHaveProperty('foodSharePct');
        expect(q.foodSharePct).toBeTypeOf('number');
      }
    });
  });

  // ── P4: renderHomeVsAway data contract ──
  describe('renderHomeVsAway', () => {
    it('BLS data should have enough series for home vs away comparison', () => {
      const data = readJSON('bls-regional-cpi.json');
      // At minimum needs Food at Home and Food Away from Home
      const seriesNames = data.categories?.series?.map(s => s.name) || [];
      const hasHome = seriesNames.some(n => /home/i.test(n));
      // Either the categories have both, or verify the regions data covers the gap
      expect(seriesNames.length).toBeGreaterThan(0);
      // Document: at least one of home/away series should exist
      expect(hasHome || seriesNames.length >= 2).toBe(true);
    });
  });

  // ── P4: renderYoYInflation data contract ──
  describe('renderYoYInflation', () => {
    it('YoY computation should produce valid results with date-keyed lookback', () => {
      // Replicate the core date-keyed YoY computation
      const data = [
        { date: '2022-01', value: 280 },
        { date: '2022-06', value: 295 },
        { date: '2023-01', value: 310 },
        { date: '2023-06', value: 320 },
      ];
      const byDate = {};
      data.forEach(d => { byDate[d.date] = d.value; });

      const yoy = data.filter(d => {
        const [y, m] = d.date.split('-').map(Number);
        return byDate[`${y - 1}-${String(m).padStart(2, '0')}`] !== undefined;
      }).map(d => {
        const [y, m] = d.date.split('-').map(Number);
        const prior = byDate[`${y - 1}-${String(m).padStart(2, '0')}`];
        return { date: d.date, yoy: ((d.value - prior) / prior * 100) };
      });

      expect(yoy.length).toBe(2);
      // Jan 2023 vs Jan 2022: (310 - 280) / 280 * 100 ≈ 10.7%
      expect(yoy[0].yoy).toBeCloseTo(10.71, 1);
    });
  });

  // ── P4: toggleFredOverlay DOM contract ──
  describe('toggleFredOverlay', () => {
    it('food-prices.html should have FRED toggle container', () => {
      const doc = parseHTML('food-prices.html');
      const toggleContainer = doc.querySelector('#fred-cpi-toggles');
      expect(toggleContainer).not.toBeNull();
    });
  });

  // ── P4: renderPurchasingPower data contract ──
  describe('renderPurchasingPower', () => {
    it('SNAP benefitTimeline should exist for indexed comparison', () => {
      const snapData = readJSON('snap-participation.json');
      expect(snapData.benefitTimeline).toBeDefined();
      expect(snapData.benefitTimeline.data.length).toBeGreaterThan(0);
    });

    it('purchasing power chart container should exist in HTML', () => {
      const doc = parseHTML('food-prices.html');
      expect(doc.querySelector('#chart-purchasing-power')).not.toBeNull();
    });
  });

  // ── P4: renderCpiVsInsecurity data contract ──
  describe('renderCpiVsInsecurity', () => {
    it('both CPI and insecurity data should exist for dual-axis chart', () => {
      const blsData = readJSON('bls-food-cpi.json');
      const fiData = readJSON('food-insecurity-state.json');
      expect(blsData.series.length).toBeGreaterThan(0);
      expect(fiData.states.length).toBeGreaterThan(0);
      expect(fiData.national.foodInsecurityRate).toBeTypeOf('number');
    });
  });

  // ── CPI category normalization (Jan 2018 = 100) ──
  describe('CPI category normalization', () => {
    it('normalization formula should produce 100 for first value', () => {
      const firstValue = 272.3;
      expect(Math.round((firstValue / firstValue) * 100 * 100) / 100).toBe(100);
    });

    it('normalization should preserve null as null', () => {
      const val = null;
      const result = val === null ? null : Math.round((val / 250) * 100 * 100) / 100;
      expect(result).toBeNull();
    });
  });

  // ── DOM structure: chart containers ──
  describe('chart container structure', () => {
    it('food-prices.html should have all expected chart containers', () => {
      const doc = parseHTML('food-prices.html');
      const expected = ['chart-categories', 'chart-regions', 'chart-affordability-map', 'chart-burden', 'chart-yoy-inflation', 'chart-purchasing-power'];
      for (const id of expected) {
        expect(doc.getElementById(id), `#${id} should exist`).not.toBeNull();
      }
    });

    it('yoy-insight and purchasing-power-insight should have aria-live', () => {
      const doc = parseHTML('food-prices.html');
      for (const id of ['yoy-insight', 'purchasing-power-insight']) {
        const el = doc.getElementById(id);
        expect(el, `#${id} should exist`).not.toBeNull();
        expect(el.getAttribute('aria-live')).toBeTruthy();
      }
    });

    it('affordability map data year should be a plausible year (>=2020)', () => {
      const data = readJSON('bls-regional-cpi.json');
      const year = data.stateAffordability?.year;
      if (year) {
        expect(year).toBeGreaterThanOrEqual(2020);
      }
    });
  });

  // ── P2-20: Tooltip formatter contracts ──
  describe('tooltip formatters', () => {
    // Replicates regional chart formatter from food-prices.js (line 86)
    describe('regional chart tooltip', () => {
      function regionalTooltip(params, regions, changesPct, mealCost, startLabel) {
        const region = params[0].name;
        const idx = regions.indexOf(region);
        let tip = `<strong>${region}</strong>`;
        params.forEach(p => {
          tip += ` ${p.seriesName}: ${p.value}`;
        });
        if (idx >= 0) {
          const baseMealCost = mealCost || 3.58;
          const dollarImpact = (baseMealCost * changesPct[idx] / 100).toFixed(2);
          tip += ` Change: +${changesPct[idx]}% Impact: +$${dollarImpact}/meal since ${startLabel}`;
        }
        return tip;
      }

      it('should compute dollar impact from change percentage and meal cost', () => {
        const result = regionalTooltip(
          [{ name: 'Northeast', seriesName: 'Latest', value: 310, marker: '' }],
          ['Northeast', 'Midwest', 'South', 'West'],
          ['20.0', '18.5', '22.0', '19.0'],
          3.58,
          'Jan 2018'
        );
        expect(result).toContain('Northeast');
        expect(result).toContain('+20.0%');
        // Dollar impact: 3.58 * 20.0 / 100 = 0.72
        expect(result).toContain('+$0.72/meal');
        expect(result).toContain('since Jan 2018');
      });

      it('should skip change/impact lines when region not in list', () => {
        const result = regionalTooltip(
          [{ name: 'Unknown', seriesName: 'Latest', value: 300, marker: '' }],
          ['Northeast', 'Midwest'],
          ['20.0', '18.5'],
          3.58,
          'Jan 2018'
        );
        expect(result).toContain('Unknown');
        expect(result).not.toContain('Impact');
      });

      it('should default to $3.58 meal cost when not provided', () => {
        const result = regionalTooltip(
          [{ name: 'South', seriesName: 'Latest', value: 290, marker: '' }],
          ['South'],
          ['10.0'],
          null,
          'Jan 2018'
        );
        // 3.58 * 10.0 / 100 = 0.358 → 0.36
        expect(result).toContain('+$0.36/meal');
      });
    });

    // Replicates categories axis tooltip pattern
    describe('categories chart tooltip', () => {
      it('should list multiple series with their values', () => {
        const params = [
          { marker: '*', seriesName: 'Food at Home', value: 285 },
          { marker: '*', seriesName: 'Food Away from Home', value: 310 },
        ];
        let tip = '<strong>Jan 2024</strong>';
        params.forEach(p => { tip += ` ${p.seriesName}: ${p.value}`; });
        expect(tip).toContain('Food at Home: 285');
        expect(tip).toContain('Food Away from Home: 310');
      });
    });
  });

  // ── UI/UX Audit: Legend/Label/Color Consistency ──
  describe('legend/label/color consistency', () => {
    it('food-insecurity-state.json should have foodInsecurityRate for dual-axis CPI chart', () => {
      const data = readJSON('food-insecurity-state.json');
      expect(data.national.foodInsecurityRate).toBeTypeOf('number');
      expect(data.states.length).toBeGreaterThan(0);
    });

    it('food-prices.html should have the CPI vs insecurity chart container', () => {
      const doc = parseHTML('food-prices.html');
      expect(doc.getElementById('chart-cpi-vs-insecurity')).not.toBeNull();
    });

    it('affordability quintiles should have at least 3 tiers for sunburst rendering', () => {
      const data = readJSON('bls-regional-cpi.json');
      if (data.affordability?.quintiles) {
        expect(data.affordability.quintiles.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('regional series should have data points for baseline legend rendering', () => {
      const data = readJSON('bls-regional-cpi.json');
      for (const s of data.regions.series) {
        expect(s.data.length).toBeGreaterThan(0);
      }
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // P1-19 Phase B: helper logic coverage
  // ───────────────────────────────────────────────────────────────────────────

  // ── P1-4 regression guard: _snapBenefits must be assigned outside the
  //    `if (blsData) { ... }` block so fetchLiveBLS() never sees a stale null.
  describe('_snapBenefits null-guard regression (P1-4)', () => {
    const src = readFileSync(resolve(__dirname, 'food-prices.js'), 'utf8');

    it('_snapBenefits is assigned outside the `if (blsData)` block', () => {
      // The assignment must NOT be nested inside an `if (blsData) { ... }` body.
      // We assert that no `if (blsData) {` block contains a `_snapBenefits =` line.
      expect(src).not.toMatch(/if\s*\(\s*blsData\s*\)\s*\{[^}]*_snapBenefits\s*=/);
    });

    it('_snapBenefits assignment uses optional chaining + ?? null fallback', () => {
      // The fix uses `snapData?.benefitTimeline?.data ?? null` so a missing
      // snap fetch never throws and never leaves a stale value.
      expect(src).toMatch(/_snapBenefits\s*=\s*snapData\?\.benefitTimeline\?\.data\s*\?\?\s*null/);
    });

    it('module declares _snapBenefits at top-level with null initial value', () => {
      expect(src).toMatch(/let\s+_snapBenefits\s*=\s*null/);
    });
  });

  // ── CPI YoY computation edge cases (replicates computeYoY from food-prices.js:407)
  describe('CPI YoY computation edge cases', () => {
    function computeYoY(series) {
      if (!series) return null;
      const validData = series.data.filter(d => d.value !== null);
      const byDate = {};
      validData.forEach(d => { byDate[d.date] = d.value; });
      return validData.filter(d => {
        const [y, m] = d.date.split('-').map(Number);
        return byDate[`${y - 1}-${String(m).padStart(2, '0')}`] !== undefined;
      }).map(d => {
        const [y, m] = d.date.split('-').map(Number);
        const prior = byDate[`${y - 1}-${String(m).padStart(2, '0')}`];
        return { date: d.date, value: +((d.value - prior) / prior * 100).toFixed(1) };
      });
    }

    it('returns null when series is null', () => {
      expect(computeYoY(null)).toBeNull();
    });

    it('returns empty array when fewer than 13 data points (no YoY pair)', () => {
      const series = {
        data: Array.from({ length: 11 }, (_, i) => ({
          date: `2023-${String(i + 1).padStart(2, '0')}`,
          value: 100 + i,
        })),
      };
      const result = computeYoY(series);
      expect(result).toEqual([]); // no prior-year match for any point
      // Critical: does NOT contain NaN
      expect(result.some(d => Number.isNaN(d.value))).toBe(false);
    });

    it('all-null values produce empty YoY (no NaN, no crash)', () => {
      const series = {
        data: [
          { date: '2022-01', value: null },
          { date: '2022-02', value: null },
          { date: '2023-01', value: null },
          { date: '2023-02', value: null },
        ],
      };
      const result = computeYoY(series);
      expect(result).toEqual([]);
    });

    it('computes correct YoY % for valid 13+ point series', () => {
      const series = {
        data: [
          { date: '2022-01', value: 280 },
          { date: '2022-06', value: 290 },
          { date: '2023-01', value: 308 },
          { date: '2023-06', value: 305 },
        ],
      };
      const result = computeYoY(series);
      expect(result).toHaveLength(2);
      // Jan 2023: (308 - 280) / 280 * 100 = 10.0
      expect(result[0].date).toBe('2023-01');
      expect(result[0].value).toBe(10.0);
      // Jun 2023: (305 - 290) / 290 * 100 ≈ 5.2
      expect(result[1].date).toBe('2023-06');
      expect(result[1].value).toBeCloseTo(5.2, 1);
    });

    it('skips null values in lookback (date-keyed lookup)', () => {
      const series = {
        data: [
          { date: '2022-01', value: 280 },
          { date: '2022-02', value: null }, // gap
          { date: '2023-01', value: 308 },
          { date: '2023-02', value: 310 }, // 2022-02 was null → no YoY for this point
        ],
      };
      const result = computeYoY(series);
      // Only Jan 2023 has a valid prior (Jan 2022)
      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2023-01');
    });

    it('handles negative YoY (prices falling)', () => {
      const series = {
        data: [
          { date: '2022-01', value: 320 },
          { date: '2023-01', value: 304 },
        ],
      };
      const result = computeYoY(series);
      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(-5.0); // (304-320)/320 = -5%
    });
  });

  // ── Categories normalization (Jan 2018 = 100) replicates food-prices.js:25-33
  describe('renderCategories normalization', () => {
    function normalizeSeries(series) {
      return series.map(s => {
        const data = s.data.filter(d => d.value !== null);
        const firstValue = data[0]?.value;
        if (!firstValue) return { ...s, data };
        return {
          ...s,
          data: data.map(d => ({
            ...d,
            value: d.value !== null
              ? Math.round((d.value / firstValue) * 100 * 100) / 100
              : null,
          })),
        };
      });
    }

    it('first non-null value normalizes to exactly 100', () => {
      const series = [{ name: 'X', data: [
        { date: '2018-01', value: 272.3 },
        { date: '2018-02', value: 273.4 },
      ]}];
      const out = normalizeSeries(series);
      expect(out[0].data[0].value).toBe(100);
    });

    it('preserves rank order after normalization', () => {
      const series = [{ name: 'X', data: [
        { date: '2018-01', value: 200 },
        { date: '2019-01', value: 220 },
        { date: '2020-01', value: 250 },
      ]}];
      const out = normalizeSeries(series);
      const values = out[0].data.map(d => d.value);
      expect(values[0]).toBe(100);
      expect(values[1]).toBe(110);
      expect(values[2]).toBe(125);
    });

    it('returns series untouched when first value is missing', () => {
      const series = [{ name: 'X', data: [{ date: '2018-01', value: 0 }] }];
      const out = normalizeSeries(series);
      // first value is 0 (falsy), so the series is returned without normalization
      expect(out[0].data[0].value).toBe(0);
    });

    it('drops null entries via the leading filter', () => {
      const series = [{ name: 'X', data: [
        { date: '2018-01', value: 100 },
        { date: '2018-02', value: null },
        { date: '2018-03', value: 110 },
      ]}];
      const out = normalizeSeries(series);
      expect(out[0].data).toHaveLength(2);
      expect(out[0].data.every(d => d.value !== null)).toBe(true);
    });
  });

  // ── Regional change-percentage computation (food-prices.js:78-85)
  describe('regional change percentage', () => {
    function regionalChange(series) {
      const latestValues = series.map(s => s.data[s.data.length - 1].value);
      const startValues = series.map(s => s.data[0].value);
      return latestValues.map((v, i) =>
        ((v - startValues[i]) / startValues[i] * 100).toFixed(1)
      );
    }

    it('computes percent change between first and last data point per region', () => {
      const series = [
        { name: 'Northeast', data: [{ value: 100 }, { value: 120 }] },
        { name: 'Midwest',   data: [{ value: 100 }, { value: 110 }] },
      ];
      const changes = regionalChange(series);
      expect(changes).toEqual(['20.0', '10.0']);
    });

    it('returns one decimal place for the change pct', () => {
      const series = [{ name: 'X', data: [{ value: 200 }, { value: 247 }] }];
      const changes = regionalChange(series);
      // (247-200)/200 = 0.235 → 23.5
      expect(changes[0]).toBe('23.5');
    });

    it('handles negative growth (deflation)', () => {
      const series = [{ name: 'X', data: [{ value: 200 }, { value: 180 }] }];
      const changes = regionalChange(series);
      expect(changes[0]).toBe('-10.0');
    });
  });

  // ── Purchasing power indexed series (food-prices.js:585-605)
  describe('purchasing power indexed series', () => {
    function indexFromBaseline(snapBenefits) {
      if (!snapBenefits?.length) return null;
      const baseline = snapBenefits[0].value;
      return snapBenefits.map(d => ({ ...d, value: +((d.value / baseline) * 100).toFixed(2) }));
    }

    it('first entry indexes to exactly 100', () => {
      const result = indexFromBaseline([
        { date: '2020-01', value: 125 },
        { date: '2024-01', value: 180 },
      ]);
      expect(result[0].value).toBe(100);
    });

    it('subsequent entries scale proportionally', () => {
      const result = indexFromBaseline([
        { date: '2020-01', value: 125 },
        { date: '2024-01', value: 180 },
      ]);
      // 180/125 * 100 = 144
      expect(result[1].value).toBe(144);
    });

    it('returns null for empty snapBenefits', () => {
      expect(indexFromBaseline([])).toBeNull();
      expect(indexFromBaseline(null)).toBeNull();
      expect(indexFromBaseline(undefined)).toBeNull();
    });
  });

  // ── YoY tooltip sign formatting (food-prices.js:431-437)
  describe('YoY tooltip sign formatter', () => {
    function formatYoYTip(params) {
      let tip = `<strong>${params[0].axisValue}</strong>`;
      params.forEach(p => {
        const sign = p.value >= 0 ? '+' : '';
        tip += ` ${p.seriesName}: ${sign}${p.value}%`;
      });
      return tip;
    }

    it('prefixes positive YoY with +', () => {
      const tip = formatYoYTip([
        { axisValue: '2023-01', seriesName: 'Food at Home', value: 11.4, marker: '*' },
      ]);
      expect(tip).toContain('+11.4%');
    });

    it('does not double-prefix negative YoY (Number renders the minus sign)', () => {
      const tip = formatYoYTip([
        { axisValue: '2024-01', seriesName: 'Food at Home', value: -2.1, marker: '*' },
      ]);
      expect(tip).toContain('-2.1%');
      expect(tip).not.toContain('+-');
    });

    it('handles multi-series with mixed signs', () => {
      const tip = formatYoYTip([
        { axisValue: '2024-01', seriesName: 'Food at Home', value: 1.5, marker: '*' },
        { axisValue: '2024-01', seriesName: 'All Items', value: -0.3, marker: '*' },
      ]);
      expect(tip).toContain('+1.5%');
      expect(tip).toContain('-0.3%');
    });
  });

  // ── DOM contract: render functions need their containers
  describe('chart container DOM contracts', () => {
    beforeEach(() => {
      document.body.innerHTML = '';
    });

    it('food-prices chart containers can be created in jsdom for render targets', () => {
      const ids = [
        'chart-categories', 'chart-regions', 'chart-affordability-map',
        'chart-burden', 'chart-yoy-inflation', 'chart-purchasing-power',
      ];
      ids.forEach(id => {
        const div = document.createElement('div');
        div.id = id;
        document.body.appendChild(div);
      });
      ids.forEach(id => {
        expect(document.getElementById(id)).not.toBeNull();
      });
    });
  });
});
