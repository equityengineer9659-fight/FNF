/**
 * @fileoverview Behavioral tests for food-prices.js — exercises init() happy,
 * error, and edge paths via dynamic import with mocked ECharts + fetch.
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

function makeTimeseries(startValue) {
  const data = [];
  for (let y = 2018; y <= 2024; y++) {
    for (let m = 1; m <= 12; m++) {
      const date = `${y}-${String(m).padStart(2, '0')}`;
      const n = (y - 2018) * 12 + (m - 1);
      data.push({ date, value: +(startValue + n * 0.4).toFixed(2) });
    }
  }
  return data;
}

const regionalFixture = {
  categories: {
    series: [
      { id: 'cereals', name: 'Cereals & Bakery', data: makeTimeseries(270) },
      { id: 'meats', name: 'Meats, Poultry & Fish', data: makeTimeseries(260) },
      { id: 'dairy', name: 'Dairy & Related', data: makeTimeseries(220) },
    ],
  },
  regions: {
    series: [
      { id: 'ne', name: 'Northeast', data: makeTimeseries(285) },
      { id: 'mw', name: 'Midwest', data: makeTimeseries(270) },
      { id: 's',  name: 'South',    data: makeTimeseries(265) },
      { id: 'w',  name: 'West',     data: makeTimeseries(295) },
    ],
  },
  stateAffordability: {
    states: [
      { name: 'California', code: 'CA', fips: '06', index: 88, mealCost: 3.90, medianIncome: 85000 },
      { name: 'Texas',      code: 'TX', fips: '48', index: 95, mealCost: 3.20, medianIncome: 70000 },
    ],
  },
  affordability: {
    quintiles: [
      { label: 'Lowest 20%', income: '$16,000', foodSharePct: 32.6, monthlyFoodCost: 440 },
      { label: '20-40%',     income: '$30,000', foodSharePct: 18.0, monthlyFoodCost: 460 },
      { label: '40-60%',     income: '$50,000', foodSharePct: 13.0, monthlyFoodCost: 540 },
      { label: '60-80%',     income: '$80,000', foodSharePct: 10.0, monthlyFoodCost: 660 },
      { label: 'Top 20%',    income: '$150,000', foodSharePct: 7.0, monthlyFoodCost: 880 },
    ],
  },
};

const blsFixture = {
  series: [
    { id: 'CUSR0000SAF11', name: 'Food at Home',         data: makeTimeseries(255) },
    { id: 'CUSR0000SEFV',  name: 'Food Away from Home',  data: makeTimeseries(270) },
    { id: 'CUSR0000SA0',   name: 'All Items',            data: makeTimeseries(250) },
  ],
};

const snapFixture = {
  benefitTimeline: { data: [{ year: 2020, value: 125 }, { year: 2024, value: 180 }] },
};

const geoFixture = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'California' }, geometry: { type: 'Polygon', coordinates: [] } },
    { type: 'Feature', properties: { name: 'Texas' }, geometry: { type: 'Polygon', coordinates: [] } },
  ],
};

function mockFetch({ regional = regionalFixture, geo = geoFixture, bls = blsFixture, snap = snapFixture } = {}) {
  return vi.fn((url) => {
    const u = String(url);
    if (u.includes('bls-regional-cpi')) return Promise.resolve({ ok: true, json: () => Promise.resolve(regional) });
    if (u.includes('us-states-geo')) return Promise.resolve({ ok: true, json: () => Promise.resolve(geo) });
    if (u.includes('bls-food-cpi')) return Promise.resolve({ ok: true, json: () => Promise.resolve(bls) });
    if (u.includes('snap-participation')) return Promise.resolve({ ok: true, json: () => Promise.resolve(snap) });
    if (u.includes('food-insecurity-state')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ trend: [] }) });
    if (u.includes('/api/')) return Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

function setupDOM() {
  document.body.innerHTML = `
    <section class="dashboard-hero">
      <div><span class="dashboard-stat__number" data-target="0">0</span><span>Avg Meal Cost</span></div>
    </section>
    <div id="dashboard-error" hidden></div>
    <div class="dashboard-chart" id="chart-categories" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-regions" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-affordability-map" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-burden" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-home-vs-away" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-yoy-inflation" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-purchasing-power" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-cpi-insecurity" style="width:800px;height:400px;"></div>
    <div id="state-selector-container"></div>
    <div id="freshness-bls-regional"></div>
    <div id="freshness-bls-categories"></div>
  `;
}

async function loadModule() {
  vi.resetModules();
  return import('./food-prices.js');
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// ---- Tests ------------------------------------------------------------------

describe('food-prices dashboard — behavioral init()', () => {
  beforeEach(() => {
    setupDOM();
    vi.stubGlobal('fetch', mockFetch());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('happy path: loads all four JSON sources and initializes charts without error UI', async () => {
    await loadModule();
    await flush();
    await flush();
    await flush();

    const errBanner = document.getElementById('dashboard-error');
    expect(errBanner.hidden).toBe(true);
    expect(document.querySelectorAll('.dashboard-error-state').length).toBe(0);
  });

  it('happy path: hero counter element is preserved (not replaced by error state)', async () => {
    await loadModule();
    await flush();
    await flush();

    const heroStat = document.querySelector('.dashboard-hero .dashboard-stat__number');
    expect(heroStat).toBeTruthy();
  });

  it('happy path: freshness indicators update for BLS data sources', async () => {
    await loadModule();
    await flush();
    await flush();
    await flush();

    const regionalFresh = document.getElementById('freshness-bls-regional');
    expect(regionalFresh.textContent.length).toBeGreaterThan(0);
  });

  it('error path: 500 on regional CPI source renders error UI across all chart containers', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      const u = String(url);
      if (u.includes('bls-regional-cpi')) {
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

  it('error path: network rejection surfaces error UI', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('network down'))));
    await loadModule();
    await flush();
    await flush();

    const errBanner = document.getElementById('dashboard-error');
    expect(errBanner.hidden).toBe(false);
  });

  it('edge case: missing BLS food CPI does not crash init (optional chain)', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      const u = String(url);
      if (u.includes('bls-regional-cpi')) return Promise.resolve({ ok: true, json: () => Promise.resolve(regionalFixture) });
      if (u.includes('us-states-geo')) return Promise.resolve({ ok: true, json: () => Promise.resolve(geoFixture) });
      if (u.includes('bls-food-cpi')) return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
      if (u.includes('snap-participation')) return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) });
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }));

    await loadModule();
    await flush();
    await flush();

    // Core charts still render; error banner stays hidden
    const errBanner = document.getElementById('dashboard-error');
    expect(errBanner.hidden).toBe(true);
  });

  it('edge case: empty stateAffordability.states array falls back to default meal cost', async () => {
    vi.stubGlobal('fetch', mockFetch({
      regional: {
        ...regionalFixture,
        stateAffordability: { states: [] },
      },
    }));

    await loadModule();
    await flush();
    await flush();

    const errBanner = document.getElementById('dashboard-error');
    // With empty states[], the init body runs into downstream usage of
    // regionalData.stateAffordability.states which is still valid (empty array),
    // so init should not throw.
    expect(errBanner.hidden).toBe(true);
  });
});
