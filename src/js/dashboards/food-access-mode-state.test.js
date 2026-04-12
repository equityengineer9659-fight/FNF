/**
 * @fileoverview P0-2 regression: Food Access map mode toggle must not leave
 * the "Focus on state" dropdown out of sync with what the map displays.
 *
 * Bug (audit 2026-04-12): in Food Deserts mode, picking "Texas" in the
 * dropdown drills the map to TX counties. Toggling to Food Insecurity or
 * SNAP Retailers mode then snaps the map back to national view — but the
 * dropdown still read "Texas", coupling state focus and map mode where
 * they should be orthogonal. Fix: on user-initiated mode change, reset
 * the dropdown so it can never disagree with the rendered map.
 *
 * These tests exercise the `resetStateFocusDropdown` helper directly
 * (imported from food-access.js) and verify the three-mode transition
 * sequence called out in the audit.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock ECharts before importing food-access.js (same pattern as food-access.test.js)
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

import { resetStateFocusDropdown } from './food-access.js';

describe('food-access P0-2: state dropdown / map mode invariant', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <select id="state-deep-dive">
        <option value="">All States</option>
        <option value="TX">Texas</option>
        <option value="CA">California</option>
      </select>
    `;
    // Reset URL to a clean state so ?state= assertions are deterministic
    window.history.replaceState({}, '', '/dashboards/food-access.html');
  });

  describe('resetStateFocusDropdown', () => {
    it('returns false and does not throw when dropdown is absent', () => {
      document.body.innerHTML = '';
      expect(() => resetStateFocusDropdown()).not.toThrow();
      expect(resetStateFocusDropdown()).toBe(false);
    });

    it('returns false when dropdown is already at "All States"', () => {
      expect(resetStateFocusDropdown()).toBe(false);
    });

    it('resets a Texas selection back to "All States"', () => {
      const select = document.getElementById('state-deep-dive');
      select.value = 'TX';
      expect(select.value).toBe('TX');

      expect(resetStateFocusDropdown()).toBe(true);
      expect(select.value).toBe('');
    });

    it('clears the ?state= query parameter from the URL', () => {
      window.history.replaceState({}, '', '/dashboards/food-access.html?state=TX');
      const select = document.getElementById('state-deep-dive');
      select.value = 'TX';

      resetStateFocusDropdown();

      expect(new URL(window.location.href).searchParams.has('state')).toBe(false);
    });

    it('leaves unrelated query parameters alone', () => {
      window.history.replaceState({}, '', '/dashboards/food-access.html?state=TX&tab=map');
      const select = document.getElementById('state-deep-dive');
      select.value = 'TX';

      resetStateFocusDropdown();

      const params = new URL(window.location.href).searchParams;
      expect(params.has('state')).toBe(false);
      expect(params.get('tab')).toBe('map');
    });
  });

  describe('mode-toggle invariant (Deserts -> Insecurity -> SNAP -> Deserts)', () => {
    // This simulates the click handler added at food-access.js:1565-1580
    // in isolation: when the user picks a new mode while the dropdown holds
    // a state, the dropdown must be reset. We model the handler without
    // importing the full initFoodAccessDashboard flow (which requires
    // network + GeoJSON data not available in unit test env).
    function simulateModeClick({ currentMapView, newView }) {
      if (newView === currentMapView) return currentMapView;
      resetStateFocusDropdown();
      // switchMapView() internals are not under test here — callers are
      // responsible for verifying the map-render side effects. What we
      // assert is that the dropdown is reset before mode change.
      return newView;
    }

    it('resets dropdown when user toggles from Deserts (with TX drilled) to Insecurity', () => {
      const select = document.getElementById('state-deep-dive');
      select.value = 'TX'; // User drilled into Texas in Food Deserts mode

      const next = simulateModeClick({ currentMapView: 'deserts', newView: 'insecurity' });

      expect(next).toBe('insecurity');
      expect(select.value).toBe('');
    });

    it('resets dropdown when user toggles from Deserts (with TX drilled) to SNAP Retailers', () => {
      const select = document.getElementById('state-deep-dive');
      select.value = 'TX';

      const next = simulateModeClick({ currentMapView: 'deserts', newView: 'snap' });

      expect(next).toBe('snap');
      expect(select.value).toBe('');
    });

    it('resets dropdown when user toggles from Insecurity back to Deserts', () => {
      // Divergence could also accumulate going the other direction —
      // if a state were somehow selected in a non-deserts mode, switching
      // back to Deserts should still start clean.
      const select = document.getElementById('state-deep-dive');
      select.value = 'CA';

      const next = simulateModeClick({ currentMapView: 'insecurity', newView: 'deserts' });

      expect(next).toBe('deserts');
      expect(select.value).toBe('');
    });

    it('sequence: Deserts(TX) -> Insecurity -> SNAP -> Deserts leaves dropdown at All States', () => {
      const select = document.getElementById('state-deep-dive');
      select.value = 'TX'; // Start: user drilled into Texas in Deserts mode

      let view = 'deserts';
      view = simulateModeClick({ currentMapView: view, newView: 'insecurity' });
      expect(select.value).toBe('');

      view = simulateModeClick({ currentMapView: view, newView: 'snap' });
      expect(select.value).toBe('');

      // Attempt to simulate a drift: nothing should re-select TX mid-sequence
      view = simulateModeClick({ currentMapView: view, newView: 'deserts' });
      expect(view).toBe('deserts');
      expect(select.value).toBe('');
    });

    it('no-ops cleanly when user clicks the already-active mode', () => {
      const select = document.getElementById('state-deep-dive');
      select.value = 'TX';

      // Click handler short-circuits: `if (view === currentMapView) return;`
      // — reset must NOT fire in that path.
      const next = simulateModeClick({ currentMapView: 'deserts', newView: 'deserts' });

      expect(next).toBe('deserts');
      // Dropdown remains as the user left it when there is no mode change
      expect(select.value).toBe('TX');
    });
  });
});
