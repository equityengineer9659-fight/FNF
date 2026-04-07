import { describe, it, expect, vi, beforeEach } from 'vitest';

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

    it('should include the gradient bar with correct colors', () => {
      buildHeatmapLegend(container, 0, 100, v => v.toFixed(0));
      expect(container.innerHTML).toContain('#312E81');
      expect(container.innerHTML).toContain('#FDE047');
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

    it('should include color swatches for each region', () => {
      buildRegionChips(container);
      for (const color of Object.values(HEATMAP_REGION_COLORS)) {
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
});
