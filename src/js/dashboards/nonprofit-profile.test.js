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

const htmlDir = resolve(__dirname, '../../../dashboards');

/** Parse HTML file into a jsdom document for DOM-based assertions */
function parseHTML(filename) {
  const html = readFileSync(resolve(htmlDir, filename), 'utf-8');
  const parser = new DOMParser();
  return parser.parseFromString(html, 'text/html');
}

describe('nonprofit-profile', () => {
  // ── hidden-class show/hide contract ──
  // All sections start hidden; JS uses classList.remove('hidden') to reveal them
  // after data loads. Regression introduced by CSP migration (PR #100) which added
  // hidden class to HTML but left JS using style.display = '' (which cannot override
  // a CSS class rule). Fixed in chore/fix-hidden-class-regression.
  describe('hidden-class reveal contract', () => {
    it('cn-rating-section starts with hidden class — JS must use classList.remove to reveal', () => {
      const doc = parseHTML('nonprofit-profile.html');
      const el = doc.getElementById('cn-rating-section');
      expect(el).not.toBeNull();
      expect(el.classList.contains('hidden')).toBe(true);
    });

    it('profile-summary starts with hidden class — JS must use classList.remove to reveal', () => {
      const doc = parseHTML('nonprofit-profile.html');
      const el = doc.getElementById('profile-summary');
      expect(el).not.toBeNull();
      expect(el.classList.contains('hidden')).toBe(true);
    });

    it('profile-error starts with hidden class — JS must use classList.remove to reveal on fetch failure', () => {
      const doc = parseHTML('nonprofit-profile.html');
      const el = doc.getElementById('profile-error');
      expect(el).not.toBeNull();
      expect(el.classList.contains('hidden')).toBe(true);
    });

    it('section-peer-comparison starts with hidden class — JS must use classList.remove to reveal', () => {
      const doc = parseHTML('nonprofit-profile.html');
      const el = doc.getElementById('section-peer-comparison');
      expect(el).not.toBeNull();
      expect(el.classList.contains('hidden')).toBe(true);
    });

    it('chart-compensation-gauge starts with hidden class — JS must use classList.remove to reveal', () => {
      const doc = parseHTML('nonprofit-profile.html');
      const el = doc.getElementById('chart-compensation-gauge');
      expect(el).not.toBeNull();
      expect(el.classList.contains('hidden')).toBe(true);
    });

    it('contact-person starts with hidden class — JS must use classList.remove to reveal', () => {
      const doc = parseHTML('nonprofit-profile.html');
      const el = doc.getElementById('contact-person');
      expect(el).not.toBeNull();
      expect(el.classList.contains('hidden')).toBe(true);
    });

    it('showAndCreateChart helper uses classList.remove to reveal chart sections', () => {
      // Verify the helper function in nonprofit-profile.js uses the correct pattern
      const source = readFileSync(
        resolve(__dirname, 'nonprofit-profile.js'),
        'utf-8'
      );
      expect(source).toContain('classList.remove(\'hidden\')');
      expect(source).not.toContain('section.style.display =');
    });

    it('showInsight helper uses classList.remove to reveal insight panels', () => {
      const source = readFileSync(
        resolve(__dirname, 'nonprofit-profile.js'),
        'utf-8'
      );
      expect(source).toContain('el.classList.remove(\'hidden\')');
      expect(source).not.toContain('el.style.display =');
    });
  });
});
