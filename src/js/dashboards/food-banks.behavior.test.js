/**
 * @fileoverview Behavioral tests for food-banks.js — exercises init() and key
 * render paths via dynamic import with mocked ECharts + fetch.
 *
 * PR 10 / P1-20: raise dashboard statement coverage above the baseline.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ---- ECharts mocks (shared by all tests in this file) -----------------------

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

// Stub D3 heatmap module — its side effects would need a real container graph
vi.mock('./shared/d3-heatmap.js', () => ({
  createD3Heatmap: vi.fn(),
  buildHeatmapLegend: vi.fn(),
  buildRegionChips: vi.fn(),
  createRankNorm: vi.fn(() => (v) => v),
  sampleGradient: vi.fn(() => '#000'),
  tileTextColor: vi.fn(() => '#fff'),
  tileSubTextColor: vi.fn(() => '#ccc'),
  HEATMAP_REGION_COLORS: {},
  HEATMAP_REGION_CLASS: {},
}));

// ---- Fixtures ---------------------------------------------------------------

const bankFixture = {
  national: {
    totalOrganizations: 42000,
    combinedRevenue: 12_500_000_000,
    avgEfficiencyRatio: 92,
    _reconciliationNote: 'Reconciliation note for test',
  },
  states: [
    {
      name: 'California', code: 'CA', region: 'West', fips: '06',
      orgCount: 1200, perCapitaOrgs: 3.1, totalRevenue: 800_000_000,
      programExpenseRatio: 93, foodInsecurityRate: 11.2, population: 39_000_000,
    },
    {
      name: 'Texas', code: 'TX', region: 'South', fips: '48',
      orgCount: 900, perCapitaOrgs: 3.2, totalRevenue: 600_000_000,
      programExpenseRatio: 91, foodInsecurityRate: 14.0, population: 29_000_000,
    },
    {
      name: 'Wyoming', code: 'WY', region: 'West', fips: '56',
      orgCount: 20, perCapitaOrgs: 3.5, totalRevenue: 5_000_000,
      programExpenseRatio: 89, foodInsecurityRate: 10.5, population: 580_000,
    },
  ],
};

const geoFixture = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { name: 'California' }, geometry: { type: 'Polygon', coordinates: [] } },
    { type: 'Feature', properties: { name: 'Texas' }, geometry: { type: 'Polygon', coordinates: [] } },
    { type: 'Feature', properties: { name: 'Wyoming' }, geometry: { type: 'Polygon', coordinates: [] } },
  ],
};

function mockFetch({ bank = bankFixture, geo = geoFixture, ok = true } = {}) {
  return vi.fn((url) => {
    if (!ok) {
      return Promise.resolve({ ok: false, status: 500, json: () => Promise.reject(new Error('bad')) });
    }
    if (String(url).includes('food-bank-summary')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(bank) });
    }
    if (String(url).includes('us-states-geo')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(geo) });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
}

function setupDOM() {
  document.body.innerHTML = `
    <section class="dashboard-hero">
      <div><span class="dashboard-stat__number" data-target="0">0</span><span>Assistance Orgs</span></div>
      <div><span class="dashboard-stat__number" data-target="0">0</span><span>Combined Revenue ($B)</span></div>
      <div><span class="dashboard-stat__number" data-target="0">0</span><span>Program Efficiency</span></div>
      <div><span class="dashboard-stat__number" data-target="0">0</span><span>Worst 10 Revenue/Insecure</span></div>
    </section>
    <div id="dashboard-error" hidden></div>
    <div class="dashboard-chart" id="chart-density-map" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-vs-insecurity" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-revenue" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-efficiency" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-distribution" style="width:800px;height:400px;"></div>
    <div class="dashboard-chart" id="chart-capacity-gap" style="width:800px;height:400px;"></div>
    <div id="density-reconciliation" class="hidden"></div>
    <div id="state-selector-container"></div>
    <div id="freshness-banks"></div>
  `;
}

async function loadModule() {
  vi.resetModules();
  return import('./food-banks.js');
}

// Wait for all pending microtasks so init()'s Promise.all resolves
function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// ---- Tests ------------------------------------------------------------------

describe('food-banks dashboard — behavioral init()', () => {
  beforeEach(() => {
    setupDOM();
    vi.stubGlobal('fetch', mockFetch());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('happy path: loads data, hydrates hero counters from national totals', async () => {
    await loadModule();
    await flush();
    await flush();

    const orgStat = document.querySelector('.dashboard-hero .dashboard-stat__number');
    expect(orgStat.dataset.target).toBe('42000');

    const revenueStat = document.querySelectorAll('.dashboard-hero .dashboard-stat__number')[1];
    // 12.5B → "12.5"
    expect(revenueStat.dataset.target).toBe('12.5');

    const effStat = document.querySelectorAll('.dashboard-hero .dashboard-stat__number')[2];
    expect(effStat.dataset.target).toBe('92');
  });

  it('happy path: reveals reconciliation note when present in data', async () => {
    await loadModule();
    await flush();
    await flush();

    const note = document.getElementById('density-reconciliation');
    expect(note.textContent).toBe('Reconciliation note for test');
    expect(note.classList.contains('hidden')).toBe(false);
  });

  it('happy path: renders without throwing and initializes ECharts for chart containers', async () => {
    const { init } = await import('echarts/core');
    await loadModule();
    await flush();
    await flush();

    // At least one chart container was handed to echarts.init
    expect(init).toHaveBeenCalled();
    // Error banner stays hidden
    const err = document.getElementById('dashboard-error');
    expect(err.hidden).toBe(true);
  });

  it('error path: fetch failure renders dashboard-error-state and shows banner', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) })));
    await loadModule();
    await flush();
    await flush();

    const errBanner = document.getElementById('dashboard-error');
    expect(errBanner.hidden).toBe(false);
    expect(errBanner.textContent).toMatch(/Unable to load/);

    const errorStates = document.querySelectorAll('.dashboard-error-state');
    expect(errorStates.length).toBeGreaterThan(0);
  });

  it('error path: network rejection surfaces error UI', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('network down'))));
    await loadModule();
    await flush();
    await flush();

    const errBanner = document.getElementById('dashboard-error');
    expect(errBanner.hidden).toBe(false);
  });

  it('edge case: empty states array does not crash init', async () => {
    vi.stubGlobal('fetch', mockFetch({
      bank: { national: bankFixture.national, states: [] },
    }));
    await loadModule();
    await flush();
    await flush();

    // Should not have triggered error UI
    const errBanner = document.getElementById('dashboard-error');
    expect(errBanner.hidden).toBe(true);
  });

  it('edge case: null _reconciliationNote leaves note element hidden', async () => {
    vi.stubGlobal('fetch', mockFetch({
      bank: {
        national: { ...bankFixture.national, _reconciliationNote: undefined },
        states: bankFixture.states,
      },
    }));
    await loadModule();
    await flush();
    await flush();

    const note = document.getElementById('density-reconciliation');
    expect(note.classList.contains('hidden')).toBe(true);
  });
});
