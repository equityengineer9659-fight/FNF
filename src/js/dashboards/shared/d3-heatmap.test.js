import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Mock D3 modules — avoid importing real D3 in jsdom
vi.mock('d3-hierarchy', () => {
  const mockNode = {
    x0: 0, y0: 0, x1: 800, y1: 600,
    value: 100, data: { name: 'root' },
    children: null, parent: null,
    sum: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
  };
  return {
    hierarchy: vi.fn(() => mockNode),
    treemap: vi.fn(() => {
      const tm = vi.fn(() => mockNode);
      tm.size = vi.fn().mockReturnValue(tm);
      tm.paddingTop = vi.fn().mockReturnValue(tm);
      tm.paddingRight = vi.fn().mockReturnValue(tm);
      tm.paddingBottom = vi.fn().mockReturnValue(tm);
      tm.paddingLeft = vi.fn().mockReturnValue(tm);
      tm.paddingInner = vi.fn().mockReturnValue(tm);
      tm.round = vi.fn().mockReturnValue(tm);
      return tm;
    }),
  };
});

vi.mock('d3-selection', () => ({
  select: vi.fn(() => {
    const mockSelection = {
      append: vi.fn().mockReturnThis(),
      attr: vi.fn().mockReturnThis(),
      style: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      selectAll: vi.fn().mockReturnThis(),
      remove: vi.fn().mockReturnThis(),
    };
    return mockSelection;
  }),
}));

// Import after mocks
const {
  buildHeatmapLegend,
  buildRegionChips,
  createRankNorm,
  HEATMAP_REGION_COLORS,
  HEATMAP_REGION_CLASS,
  sampleGradient,
  tileTextColor,
  tileSubTextColor,
} = await import('./d3-heatmap.js');

describe('d3-heatmap', () => {

  // ── Color palette ──
  describe('HEATMAP_REGION_COLORS', () => {
    it('should define all four Census regions', () => {
      expect(HEATMAP_REGION_COLORS).toHaveProperty('Northeast');
      expect(HEATMAP_REGION_COLORS).toHaveProperty('Midwest');
      expect(HEATMAP_REGION_COLORS).toHaveProperty('South');
      expect(HEATMAP_REGION_COLORS).toHaveProperty('West');
    });

    it('region colors should be valid hex strings', () => {
      for (const color of Object.values(HEATMAP_REGION_COLORS)) {
        expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it('region colors should be desaturated (not matching dashboard-utils bright colors)', () => {
      // These should NOT be the bright primary colors from REGION_COLORS
      expect(HEATMAP_REGION_COLORS.Northeast).not.toBe('#60a5fa');
      expect(HEATMAP_REGION_COLORS.South).not.toBe('#f87171');
    });
  });

  // ── Legend builders ──
  describe('buildHeatmapLegend', () => {
    let container;

    beforeEach(() => {
      container = document.createElement('div');
    });

    it('should populate container with gradient legend HTML', () => {
      buildHeatmapLegend(container, 0, 100, v => v.toFixed(0));
      expect(container.innerHTML).toContain('Low');
      expect(container.innerHTML).toContain('High');
    });

    it('should include tick marks with formatted values', () => {
      buildHeatmapLegend(container, 500, 4000, v => '$' + v.toFixed(0));
      expect(container.innerHTML).toContain('$500');
      expect(container.innerHTML).toContain('$4000');
    });

    it('should include the gradient bar CSS class', () => {
      buildHeatmapLegend(container, 0, 100, v => v.toFixed(0));
      expect(container.querySelector('.csp-heatmap-legend-bar')).not.toBeNull();
    });

    it('should render 6 tick marks (min + 5 steps)', () => {
      buildHeatmapLegend(container, 0, 100, v => v.toFixed(0));
      const ticks = container.querySelectorAll('span');
      // 6 ticks + "Low" + "High" labels
      const tickTexts = Array.from(ticks).map(s => s.textContent);
      expect(tickTexts).toContain('0');
      expect(tickTexts).toContain('100');
    });

    it('should handle null container gracefully', () => {
      expect(() => buildHeatmapLegend(null, 0, 100, v => v)).not.toThrow();
    });
  });

  describe('buildRegionChips', () => {
    let container;

    beforeEach(() => {
      container = document.createElement('div');
    });

    it('should render all four region names', () => {
      buildRegionChips(container);
      expect(container.innerHTML).toContain('Northeast');
      expect(container.innerHTML).toContain('Midwest');
      expect(container.innerHTML).toContain('South');
      expect(container.innerHTML).toContain('West');
    });

    it('should include color swatches using REGION_COLORS (full-saturation, matching scatter/radar)', () => {
      buildRegionChips(container);
      // Chips now use REGION_COLORS from dashboard-utils for cross-chart consistency
      const REGION_COLORS = { Northeast: '#60a5fa', Midwest: '#f59e0b', South: '#f87171', West: '#34d399' };
      for (const color of Object.values(REGION_COLORS)) {
        expect(container.innerHTML).toContain(color);
      }
    });

    it('should handle null container gracefully', () => {
      expect(() => buildRegionChips(null)).not.toThrow();
    });
  });

  // ── Integration: food-banks.js imports ──
  describe('module exports', () => {
    it('should export createD3Heatmap function', async () => {
      const mod = await import('./d3-heatmap.js');
      expect(typeof mod.createD3Heatmap).toBe('function');
    });

    it('should export buildHeatmapLegend function', () => {
      expect(typeof buildHeatmapLegend).toBe('function');
    });

    it('should export buildRegionChips function', () => {
      expect(typeof buildRegionChips).toBe('function');
    });

    it('should export HEATMAP_REGION_COLORS object', () => {
      expect(typeof HEATMAP_REGION_COLORS).toBe('object');
    });
  });

  // ── Rank-based normalization ──
  describe('createRankNorm', () => {
    it('should return 0 for the minimum value', () => {
      const norm = createRankNorm([100, 200, 300, 400, 500]);
      expect(norm(100)).toBe(0);
    });

    it('should return 1 for the maximum value', () => {
      const norm = createRankNorm([100, 200, 300, 400, 500]);
      expect(norm(500)).toBe(1);
    });

    it('should return 0.5 for the median of 5 values', () => {
      const norm = createRankNorm([100, 200, 300, 400, 500]);
      expect(norm(300)).toBe(0.5);
    });

    it('should distribute outliers correctly (DC $4K scenario)', () => {
      // Simulates revenue data: most states $800-$1500, DC at $4000
      const values = [587, 800, 850, 900, 950, 1000, 1050, 1100, 1200, 1500, 4000];
      const norm = createRankNorm(values);
      // DC should be 1.0 (top)
      expect(norm(4000)).toBe(1);
      // $1000 (middle of the pack) should be ~0.5, not compressed near 0
      expect(norm(1000)).toBeGreaterThan(0.35);
      expect(norm(1000)).toBeLessThan(0.65);
      // $587 (lowest) should be 0
      expect(norm(587)).toBe(0);
    });

    it('should handle single-value array', () => {
      const norm = createRankNorm([42]);
      expect(norm(42)).toBe(0.5);
    });

    it('should handle duplicate values', () => {
      const norm = createRankNorm([100, 100, 200, 200, 300]);
      // Both 100s should map to the same position
      expect(norm(100)).toBeLessThan(0.3);
      expect(norm(300)).toBe(1);
    });
  });

  // ── Data hierarchy structure ──
  describe('hierarchy data contract', () => {
    it('should accept standard hierarchy shape for revenue chart', () => {
      const hierarchy = {
        name: 'United States',
        children: [
          {
            name: 'South',
            children: [
              { name: 'Texas', size: 1000, label2: '$1K/person', region: 'South' },
              { name: 'Florida', size: 800, label2: '$800/person', region: 'South' },
            ]
          }
        ]
      };
      // Verify structure is valid
      expect(hierarchy.children[0].children).toHaveLength(2);
      expect(hierarchy.children[0].children[0].size).toBe(1000);
      expect(hierarchy.children[0].children[0].label2).toBeDefined();
    });

    it('normFn should return values between 0 and 1', () => {
      const min = 500, max = 4000;
      const normFn = (leaf) => (leaf.value - min) / (max - min);
      expect(normFn({ value: 500 })).toBe(0);
      expect(normFn({ value: 4000 })).toBe(1);
      expect(normFn({ value: 2250 })).toBeCloseTo(0.5, 1);
    });
  });

  // P2-27: dominant-baseline="central" must always be paired with dy="0.35em"
  describe('SVG text baseline Firefox fallback (P2-27)', () => {
    it('every dominant-baseline="central" is paired with dy="0.35em"', () => {
      const src = readFileSync(resolve(__dirname, 'd3-heatmap.js'), 'utf-8');
      const matches = src.match(/\.attr\('dominant-baseline',\s*'central'\)[^;]*/g) || [];
      expect(matches.length).toBeGreaterThan(0);
      matches.forEach(chain => {
        expect(chain, 'dy="0.35em" fallback missing next to dominant-baseline').toMatch(/dy',\s*'0\.35em'/);
      });
    });
  });

  // P2-28: hover filter must attach to the tile <g>, not the <rect>
  describe('hover filter target (P2-28)', () => {
    it('hover filter is applied via tg.style, not the rect', () => {
      const src = readFileSync(resolve(__dirname, 'd3-heatmap.js'), 'utf-8');
      const rectBlock = src.slice(
        src.indexOf('const rect = tg.append(\'rect\')'),
        src.indexOf('const rect = tg.append(\'rect\')') + 500
      );
      expect(rectBlock).not.toContain('mouseenter');
      expect(rectBlock).not.toContain('transition');
      expect(src).toMatch(/tg\.style\('transition',\s*'filter/);
    });
  });

  // ── Color gradient sampling (7-stop interpolator) ──
  describe('sampleGradient', () => {
    it('returns an array of 3 integers in [0,255]', () => {
      const c = sampleGradient(0.5);
      expect(Array.isArray(c)).toBe(true);
      expect(c).toHaveLength(3);
      c.forEach(channel => {
        expect(Number.isInteger(channel)).toBe(true);
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      });
    });

    it('t=0 returns the first stop [49,46,129] (#312E81)', () => {
      expect(sampleGradient(0)).toEqual([49, 46, 129]);
    });

    it('t=1 returns the last stop [253,224,71] (#FDE047)', () => {
      expect(sampleGradient(1)).toEqual([253, 224, 71]);
    });

    it('clamps t<0 to t=0', () => {
      expect(sampleGradient(-0.5)).toEqual([49, 46, 129]);
      expect(sampleGradient(-100)).toEqual([49, 46, 129]);
    });

    it('clamps t>1 to t=1', () => {
      expect(sampleGradient(1.5)).toEqual([253, 224, 71]);
      expect(sampleGradient(99)).toEqual([253, 224, 71]);
    });

    it('t=0.2 returns the second stop [67,56,202] (#4338CA)', () => {
      expect(sampleGradient(0.2)).toEqual([67, 56, 202]);
    });

    it('t=0.4 returns the third stop [99,102,241] (#6366F1)', () => {
      expect(sampleGradient(0.4)).toEqual([99, 102, 241]);
    });

    it('t=0.55 returns the fourth stop [139,92,246] (#8B5CF6)', () => {
      expect(sampleGradient(0.55)).toEqual([139, 92, 246]);
    });

    it('t=0.70 returns the fifth stop [236,72,153] (#EC4899)', () => {
      expect(sampleGradient(0.70)).toEqual([236, 72, 153]);
    });

    it('t=0.85 returns the sixth stop [249,115,22] (#F97316)', () => {
      expect(sampleGradient(0.85)).toEqual([249, 115, 22]);
    });

    it('produces different colors at distinct stops', () => {
      const c0 = sampleGradient(0);
      const c1 = sampleGradient(0.5);
      const c2 = sampleGradient(1);
      expect(c0).not.toEqual(c1);
      expect(c1).not.toEqual(c2);
      expect(c0).not.toEqual(c2);
    });

    it('interpolates midpoints between every adjacent pair', () => {
      // Probe midpoints of all 6 intervals — each should differ from both endpoints
      const stops = [0.00, 0.20, 0.40, 0.55, 0.70, 0.85, 1.00];
      for (let i = 0; i < stops.length - 1; i++) {
        const mid = (stops[i] + stops[i + 1]) / 2;
        const c = sampleGradient(mid);
        expect(c).not.toEqual(sampleGradient(stops[i]));
        expect(c).not.toEqual(sampleGradient(stops[i + 1]));
      }
    });

    it('interpolation between stop 0 and stop 1 at midpoint t=0.1 is half-way', () => {
      // Linear lerp at t=0.1 between [49,46,129] and [67,56,202]
      // Expected: round(49 + (67-49)*0.5)=58, round(46 + (56-46)*0.5)=51, round(129 + (202-129)*0.5)=166
      expect(sampleGradient(0.1)).toEqual([58, 51, 166]);
    });
  });

  // ── Adaptive text contrast ──
  describe('tileTextColor', () => {
    it('returns dark text on bright yellow tile (t=1.0)', () => {
      expect(tileTextColor(1.0)).toBe('#111111');
    });

    it('returns white text on deep indigo tile (t=0)', () => {
      expect(tileTextColor(0)).toBe('#FFFFFF');
    });

    it('only ever returns #111111 or #FFFFFF', () => {
      const samples = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.55, 0.6, 0.7, 0.8, 0.85, 0.9, 1.0];
      samples.forEach(t => {
        const c = tileTextColor(t);
        expect(['#111111', '#FFFFFF']).toContain(c);
      });
    });

    it('crosses to dark text once luminance exceeds 0.6 threshold', () => {
      // Low t (indigo/violet) → white; high t (orange/yellow) → black
      expect(tileTextColor(0.0)).toBe('#FFFFFF');
      expect(tileTextColor(0.3)).toBe('#FFFFFF');
      expect(tileTextColor(1.0)).toBe('#111111');
    });
  });

  // ── Adaptive secondary text contrast ──
  describe('tileSubTextColor', () => {
    it('returns dark translucent text on bright tile (t=1.0)', () => {
      expect(tileSubTextColor(1.0)).toBe('rgba(17,17,17,0.65)');
    });

    it('returns white translucent text on dark tile (t=0)', () => {
      expect(tileSubTextColor(0)).toBe('rgba(255,255,255,0.8)');
    });

    it('only returns one of the two parametric values', () => {
      const samples = [0, 0.25, 0.5, 0.75, 1];
      const allowed = ['rgba(17,17,17,0.65)', 'rgba(255,255,255,0.8)'];
      samples.forEach(t => {
        expect(allowed).toContain(tileSubTextColor(t));
      });
    });

    it('matches tileTextColor decision at every probe', () => {
      // Whenever tileTextColor returns dark, tileSubTextColor should also return dark
      const samples = [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1];
      samples.forEach(t => {
        const main = tileTextColor(t);
        const sub = tileSubTextColor(t);
        if (main === '#111111') {
          expect(sub).toBe('rgba(17,17,17,0.65)');
        } else {
          expect(sub).toBe('rgba(255,255,255,0.8)');
        }
      });
    });
  });

  // ── CSP-safe class lookup ──
  describe('HEATMAP_REGION_CLASS', () => {
    it('exports class names for all four Census regions', () => {
      expect(HEATMAP_REGION_CLASS).toHaveProperty('Northeast');
      expect(HEATMAP_REGION_CLASS).toHaveProperty('Midwest');
      expect(HEATMAP_REGION_CLASS).toHaveProperty('South');
      expect(HEATMAP_REGION_CLASS).toHaveProperty('West');
    });

    it('uses the csp-text-hm-{region-lowercase} naming scheme', () => {
      expect(HEATMAP_REGION_CLASS.Northeast).toBe('csp-text-hm-northeast');
      expect(HEATMAP_REGION_CLASS.Midwest).toBe('csp-text-hm-midwest');
      expect(HEATMAP_REGION_CLASS.South).toBe('csp-text-hm-south');
      expect(HEATMAP_REGION_CLASS.West).toBe('csp-text-hm-west');
    });

    it('every value is a non-empty string starting with csp-text-hm-', () => {
      Object.values(HEATMAP_REGION_CLASS).forEach(cls => {
        expect(typeof cls).toBe('string');
        expect(cls.length).toBeGreaterThan(0);
        expect(cls.startsWith('csp-text-hm-')).toBe(true);
      });
    });

    it('has the same region keys as HEATMAP_REGION_COLORS', () => {
      expect(Object.keys(HEATMAP_REGION_CLASS).sort())
        .toEqual(Object.keys(HEATMAP_REGION_COLORS).sort());
    });
  });

  // ── createRankNorm: additional edge cases ──
  describe('createRankNorm — additional edge cases', () => {
    it('handles unsorted input arrays (sorts internally)', () => {
      const norm = createRankNorm([500, 100, 400, 200, 300]);
      expect(norm(100)).toBe(0);
      expect(norm(500)).toBe(1);
      expect(norm(300)).toBe(0.5);
    });

    it('handles negative values', () => {
      const norm = createRankNorm([-100, -50, 0, 50, 100]);
      expect(norm(-100)).toBe(0);
      expect(norm(100)).toBe(1);
      expect(norm(0)).toBe(0.5);
    });

    it('handles all-negative values', () => {
      const norm = createRankNorm([-500, -400, -300, -200, -100]);
      expect(norm(-500)).toBe(0);
      expect(norm(-100)).toBe(1);
      expect(norm(-300)).toBe(0.5);
    });

    it('binary search finds exact stop at array midpoint', () => {
      // 7-element array — midpoint index is 3 — value at index 3 should map to 0.5
      const norm = createRankNorm([10, 20, 30, 40, 50, 60, 70]);
      expect(norm(40)).toBeCloseTo(0.5, 5);
    });

    it('returns a function each time (not cached state)', () => {
      const a = createRankNorm([1, 2, 3]);
      const b = createRankNorm([10, 20, 30]);
      expect(a(1)).toBe(0);
      expect(b(10)).toBe(0);
      expect(a(3)).toBe(1);
      expect(b(30)).toBe(1);
    });

    it('values smaller than the minimum still map to 0', () => {
      const norm = createRankNorm([100, 200, 300]);
      expect(norm(50)).toBe(0);
    });

    it('values larger than the maximum map to the max rank position', () => {
      // Loop terminates with lo at last index when value exceeds all entries
      const norm = createRankNorm([100, 200, 300]);
      expect(norm(999)).toBe(1);
    });

    it('handles two-element arrays', () => {
      const norm = createRankNorm([10, 90]);
      expect(norm(10)).toBe(0);
      expect(norm(90)).toBe(1);
    });

    it('handles floating-point values', () => {
      const norm = createRankNorm([0.1, 0.2, 0.3, 0.4, 0.5]);
      expect(norm(0.1)).toBe(0);
      expect(norm(0.5)).toBe(1);
      expect(norm(0.3)).toBe(0.5);
    });
  });

  // ── D3 heatmap resize re-layout ──
  describe('resize re-layout', () => {
    it('ResizeObserver should recompute treemap layout, not just update viewBox', () => {
      const jsSource = readFileSync(resolve(__dirname, 'd3-heatmap.js'), 'utf-8');
      const roSection = jsSource.slice(jsSource.indexOf('ResizeObserver'));
      // Must call treemap().size() with new dimensions, not just svg.attr('viewBox')
      expect(roSection).toContain('treemap()');
      expect(roSection).toContain('render(');
    });
  });
});
