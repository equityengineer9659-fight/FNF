/**
 * @fileoverview Regression test for P0-1: nonprofit-profile Peer Comparison
 * was dead for every organization because the ProPublica search endpoint does
 * not return `total_revenue` on org records. Fix: hydrate peers from the org
 * endpoint's `filings_with_data[0].totrevenue`.
 *
 * NOTE ON PATH: the remediation prompt specified
 * `tests/unit/nonprofit-profile-peer-hydration.test.js`, but vitest.config.js
 * `include` pattern is `src/**` only. Placing the file outside `src/` would
 * mean it never runs. Modifying vitest.config.js is out of scope for this
 * remediation, so the test lives next to nonprofit-profile.test.js. Deviation
 * documented in the return report.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock ECharts (same pattern used by nonprofit-profile.test.js — importing the
// SUT transitively loads dashboard-utils which imports echarts).
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

// Import the SUT (named export added by the fix).
import { hydratePeerRevenues } from './nonprofit-profile.js';

describe('nonprofit-profile peer hydration (P0-1)', () => {
  const OWN_EIN = '363673599'; // Feeding America

  /**
   * Canned search response: 10 peers + the target org, none carrying
   * `total_revenue` — matching what ProPublica /search.json actually returns.
   */
  function buildSearchResponse() {
    const organizations = [];
    // Target org (should be filtered out)
    organizations.push({ ein: OWN_EIN, strein: OWN_EIN, name: 'FEEDING AMERICA' });
    // 10 peers with no total_revenue field whatsoever
    for (let i = 1; i <= 10; i++) {
      organizations.push({
        ein: `12345678${i}`,
        strein: `12-345678${i}`,
        name: `PEER FOOD BANK ${i}`
      });
    }
    return { organizations };
  }

  /**
   * Canned org-endpoint response: filings_with_data[0].totrevenue set.
   * Deterministic: peer i → revenue = i * 10_000_000.
   */
  function buildOrgResponse(ein) {
    const tail = parseInt(ein.slice(-1), 10) || 0;
    return {
      organization: { ein, name: `PEER ${tail}` },
      filings_with_data: [
        { tax_prd_yr: 2023, totrevenue: tail * 10_000_000 }
      ]
    };
  }

  beforeEach(() => {
    const searchPayload = buildSearchResponse();
    const fetchMock = vi.fn((url) => {
      if (typeof url !== 'string') url = String(url);
      if (url.includes('/api/nonprofit-search.php')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(searchPayload)
        });
      }
      if (url.includes('/api/nonprofit-org.php')) {
        const match = url.match(/ein=([^&]+)/);
        const ein = match ? match[1] : '';
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(buildOrgResponse(ein))
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns at least 3 peers with totrevenue > 0 after hydration', async () => {
    const searchRes = await fetch('/api/nonprofit-search.php?q=food+bank&state=IL');
    const searchData = await searchRes.json();

    const t0 = performance.now();
    const peers = await hydratePeerRevenues(searchData, OWN_EIN);
    const elapsed = performance.now() - t0;

    // Core assertion — the bug (filtering on missing total_revenue) drops all peers.
    expect(peers.length).toBeGreaterThanOrEqual(3);
    // Every returned peer must have a positive totrevenue.
    for (const peer of peers) {
      expect(peer.totrevenue).toBeGreaterThan(0);
    }
    // Own EIN must never appear in hydrated peers.
    for (const peer of peers) {
      expect(peer.ein).not.toBe(OWN_EIN);
      expect(peer.strein).not.toBe(OWN_EIN);
    }

    // Guardrail: hydration must complete in < 8000ms. Mocked fetch is
    // essentially instant — this mostly catches accidental sequential awaits.
    expect(elapsed).toBeLessThan(8000);
    // Expose measurement to the test runner for the return report.
    // (console.warn is not intercepted by test-setup.js, unlike console.log)
    console.warn(`[peer-hydration] elapsed=${elapsed.toFixed(2)}ms peers=${peers.length}`);
  });

  it('excludes the own EIN from peers before hydration', async () => {
    const searchRes = await fetch('/api/nonprofit-search.php?q=food+bank&state=IL');
    const searchData = await searchRes.json();
    const peers = await hydratePeerRevenues(searchData, OWN_EIN);
    expect(peers.find(p => p.ein === OWN_EIN || p.strein === OWN_EIN)).toBeUndefined();
  });

  it('tolerates individual org-endpoint failures without losing the whole batch', async () => {
    // Override fetch: make exactly one org call reject.
    const searchPayload = buildSearchResponse();
    const failingEin = '123456783';
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (typeof url !== 'string') url = String(url);
      if (url.includes('/api/nonprofit-search.php')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(searchPayload)
        });
      }
      if (url.includes('/api/nonprofit-org.php')) {
        const match = url.match(/ein=([^&]+)/);
        const ein = match ? match[1] : '';
        if (ein === failingEin) return Promise.reject(new Error('network'));
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(buildOrgResponse(ein))
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    }));

    const searchRes = await fetch('/api/nonprofit-search.php?q=food+bank&state=IL');
    const searchData = await searchRes.json();
    const peers = await hydratePeerRevenues(searchData, OWN_EIN);

    // At least 3 peers survive even with one rejection.
    expect(peers.length).toBeGreaterThanOrEqual(3);
    // The failing EIN must not appear.
    expect(peers.find(p => p.ein === failingEin || p.strein === failingEin)).toBeUndefined();
  });
});
