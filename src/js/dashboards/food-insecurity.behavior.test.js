/**
 * @fileoverview Behavioral tests for food-insecurity.js — exercises init()
 * happy, error, and edge paths via dynamic import with mocked ECharts + fetch.
 *
 * PR 10 / P1-20: raise dashboard statement coverage above the baseline.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

function makeChart() {
  return {
    setOption: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    dispatchAction: vi.fn(),
    getOption: vi.fn(() => ({})),
  };
}

vi.mock('echarts/core', () => {
  const chartInstances = new Map();
  return {
    use: vi.fn(),
    init: vi.fn((container) => {
      const chart = makeChart();
      if (container) chartInstances.set(container, chart);
      return chart;
    }),
    getInstanceByDom: vi.fn((el) => chartInstances.get(el) || null),
    registerMap: vi.fn(),
    graphic: {
      LinearGradient: class {
        constructor(...args) { this.args = args; }
      },
    },
  };
});

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

// ---- Fixtures ---------------------------------------------------------------

const nationalFixture = {
  foodInsecurityRate: 13.5,
  foodInsecurePersons: 44_200_000,
  childFoodInsecurityRate: 17.0,
  foodInsecureChildren: 13_000_000,
  annualMealGap: 6_800_000_000,
  averageMealCost: 3.58,
  snapParticipation: 78,
  year: 2023,
};

function makeState(name, fips, rate) {
  return {
    name, fips, code: name.slice(0, 2).toUpperCase(),
    rate, childRate: rate + 4, persons: 1_000_000,
    mealGap: 200_000_000, mealCost: 3.5,
    povertyRate: rate, childPovertyRate: rate + 3,
    medianIncome: 65000, snapParticipation: 70,
    population: 10_000_000,
    demographics: { white: 60, black: 15, hispanic: 15, asian: 5, other: 5 },
    sdoh: { housingCost: 25, transportation: 15, education: 30 },
  };
}

const stateFixture = {
  meta: { year: 2023 },
  national: nationalFixture,
  trend: [
    { year: 2018, rate: 11.1 },
    { year: 2019, rate: 10.5 },
    { year: 2020, rate: 12.8 },
    { year: 2021, rate: 10.2 },
    { year: 2022, rate: 12.6 },
    { year: 2023, rate: 13.5 },
  ],
  states: [
    makeState('Alabama',    '01', 15.1),
    makeState('California', '06', 11.2),
    makeState('Mississippi','28', 17.6),
    makeState('Texas',      '48', 14.0),
    makeState('Wyoming',    '56', 10.5),
  ],
};

const geoFixture = {
  type: 'FeatureCollection',
  features: stateFixture.states.map(s => ({
    type: 'Feature',
    properties: { name: s.name },
    geometry: { type: 'Polygon', coordinates: [] },
  })),
};

function mockFetch({ state = stateFixture, geo = geoFixture } = {}) {
  return vi.fn((url) => {
    const u = String(url);
    if (u.includes('food-insecurity-state')) return Promise.resolve({ ok: true, json: () => Promise.resolve(state) });
    if (u.includes('us-states-geo')) return Promise.resolve({ ok: true, json: () => Promise.resolve(geo) });
    if (u.includes('current-food-access')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ states: [] }) });
    if (u.includes('food-bank-summary')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ national: {}, states: [] }) });
    if (u.includes('bls-food-cpi')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ series: [] }) });
    if (u.includes('/api/')) return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

function setupDOM() {
  document.body.innerHTML = `
    <section class="dashboard-hero">
      <div><span class="dashboard-stat__number" data-target="0">0</span><span>Food Insecure Rate</span></div>
      <div><span class="dashboard-stat__number" data-target="0">0</span><span>Americans Affected</span></div>
      <div><span class="dashboard-stat__number" data-target="0">0</span><span>Children Affected</span></div>
      <div><span class="dashboard-stat__number" data-target="0">0</span><span>Annual Meals Gap</span></div>
    </section>

    <div id="dashboard-error" hidden></div>

    <!-- Map + controls -->
    <div class="dashboard-chart" id="chart-map" style="width:800px;height:500px;"></div>
    <span class="dashboard-chart__hint"></span>
    <button id="map-back-btn" hidden>Back</button>
    <span id="map-state-label"></span>
    <p id="map-insight"></p>
    <select id="map-metric">
      <option value="rate">Rate</option>
      <option value="snapCoverage">SNAP Coverage</option>
    </select>
    <input id="county-search" type="text" />
    <ul id="county-search-results"></ul>

    <!-- All other chart containers -->
    <div class="dashboard-chart" id="chart-trend" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-radar" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-scatter" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-demographics" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-divergence" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-meal-cost" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-snap" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-sdoh" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-food-prices" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-triple-burden" style="width:800px;height:400px;"></div>

    <!-- Insight + ancillary elements -->
    <p id="scatter-insight"></p>
    <div id="scatter-toggle-buttons"></div>
    <p id="divergence-insight"></p>
    <table><tbody id="accessible-data-table"></tbody></table>
    <section id="section-sdoh"></section>
    <p id="sdoh-insight"></p>
    <div id="sdoh-metric-buttons"></div>
    <p id="demographics-insight"></p>
    <section id="section-income-river"></section>
    <p id="income-river-insight"></p>
    <p id="triple-burden-insight"></p>
    <section id="section-state-deepdive"></section>
    <div id="state-deepdive-panel"></div>
    <div id="state-selector-container"></div>
    <div id="freshness-bls"></div>
    <div id="freshness-census"></div>
  `;
}

async function loadModule() {
  vi.resetModules();
  return import('./food-insecurity.js');
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// ---- Tests ------------------------------------------------------------------

describe('food-insecurity dashboard — behavioral init()', () => {
  beforeEach(() => {
    setupDOM();
    vi.stubGlobal('fetch', mockFetch());
    // Silence error tracker — not under test
    vi.stubGlobal('__errorTrackerStub', true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('happy path: hero counters hydrate from national totals', async () => {
    await loadModule();
    await flush();
    await flush();
    await flush();

    const heroStats = document.querySelectorAll('.dashboard-hero .dashboard-stat__number');
    // Rate → first stat (label contains "Rate")
    expect(heroStats[0].dataset.target).toBe('13.5');
    // Americans → 44.2M
    expect(heroStats[1].dataset.target).toBe('44.2');
    // Children → 13.0M
    expect(heroStats[2].dataset.target).toBe('13.0');
    // Meals → 6.8B
    expect(heroStats[3].dataset.target).toBe('6.8');
  });

  it('happy path: does not render error UI when fetch succeeds', async () => {
    await loadModule();
    await flush();
    await flush();
    await flush();

    const errBanner = document.getElementById('dashboard-error');
    expect(errBanner.hidden).toBe(true);
    expect(document.querySelectorAll('.dashboard-error-state').length).toBe(0);
  });

  it('happy path: initializes ECharts chart instances for container elements', async () => {
    const { init } = await import('echarts/core');
    await loadModule();
    await flush();
    await flush();

    expect(init).toHaveBeenCalled();
  });

  it('error path: 500 response on state data triggers error UI across all chart containers', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (String(url).includes('food-insecurity-state')) {
        return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    await loadModule();
    await flush();
    await flush();

    const errBanner = document.getElementById('dashboard-error');
    expect(errBanner.hidden).toBe(false);
    expect(errBanner.textContent).toMatch(/Unable to load/);
    expect(document.querySelectorAll('.dashboard-error-state').length).toBeGreaterThan(0);
  });

  it('error path: network TypeError surfaces error UI', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('network down'))));
    await loadModule();
    await flush();
    await flush();

    const errBanner = document.getElementById('dashboard-error');
    expect(errBanner.hidden).toBe(false);
  });

  it('edge case: AbortError from signal-carrying fetch produces AbortError error message', async () => {
    vi.stubGlobal('fetch', vi.fn(() => {
      const err = new Error('Aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    }));
    await loadModule();
    await flush();
    await flush();

    const errBanner = document.getElementById('dashboard-error');
    expect(errBanner.hidden).toBe(false);
    expect(errBanner.textContent).toMatch(/took too long/);
  });

  it('edge case: empty states array is handled (either succeeds or surfaces error UI, not a silent crash)', async () => {
    vi.stubGlobal('fetch', mockFetch({
      state: { ...stateFixture, states: [] },
    }));
    await loadModule();
    await flush();
    await flush();

    // init must not have left the page in an indeterminate state.
    // Either the happy path renders (hero counters hydrated from national),
    // or the render chain throws and the catch block shows error UI.
    const errBanner = document.getElementById('dashboard-error');
    const heroStats = document.querySelectorAll('.dashboard-hero .dashboard-stat__number');
    const hydrated = heroStats[0].dataset.target === '13.5';
    const errorVisible = !errBanner.hidden;
    expect(hydrated || errorVisible).toBe(true);
  });

  it('edge case: triple burden enrichment fetch failure is caught by catch block', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      const u = String(url);
      if (u.includes('food-insecurity-state')) return Promise.resolve({ ok: true, json: () => Promise.resolve(stateFixture) });
      if (u.includes('us-states-geo')) return Promise.resolve({ ok: true, json: () => Promise.resolve(geoFixture) });
      if (u.includes('current-food-access') || u.includes('food-bank-summary')) {
        return Promise.reject(new TypeError('enrichment failed'));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    await loadModule();
    await flush();
    await flush();
    await flush();

    // Core dashboard still renders despite the non-blocking enrichment failure
    const errBanner = document.getElementById('dashboard-error');
    expect(errBanner.hidden).toBe(true);
  });
});
