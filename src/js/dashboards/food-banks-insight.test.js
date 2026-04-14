import { describe, it, expect } from 'vitest';
import { buildVsInsecurityInsight } from './food-banks-insight.js';

describe('buildVsInsecurityInsight', () => {
  it('returns a fallback message when no states have positive revenue per insecure person', () => {
    const result = buildVsInsecurityInsight([]);
    expect(result.text).toMatch(/no state-level data/i);
    expect(result.deviation).toEqual([]);
  });

  it('handles a single state without throwing', () => {
    const states = [
      { name: 'Wyoming', population: 580_000, foodInsecurityRate: 12, totalRevenue: 5_000_000 },
    ];
    const result = buildVsInsecurityInsight(states);
    expect(result.deviation).toHaveLength(1);
    expect(result.text).toContain('Wyoming');
    expect(result.text).not.toContain('undefined');
  });

  it('computes worst/best correctly across multiple states', () => {
    const states = [
      { name: 'A', population: 1_000_000, foodInsecurityRate: 10, totalRevenue: 100_000_000 }, // $1000/insecure
      { name: 'B', population: 1_000_000, foodInsecurityRate: 10, totalRevenue: 10_000_000 },  //  $100/insecure
      { name: 'C', population: 1_000_000, foodInsecurityRate: 10, totalRevenue: 50_000_000 },  //  $500/insecure
    ];
    const result = buildVsInsecurityInsight(states);
    // sorted ascending by deviation: B (worst, lowest) → C → A (best, highest)
    expect(result.deviation[0].name).toBe('B');
    expect(result.deviation.at(-1).name).toBe('A');
    expect(result.text).toContain('B');
    expect(result.text).toContain('A');
    expect(result.nationalMean).toBeGreaterThan(0);
  });

  it('filters out states with zero or missing insecure population', () => {
    const states = [
      { name: 'A', population: 0, foodInsecurityRate: 10, totalRevenue: 5_000_000 }, // 0 insecure
      { name: 'B', population: 1_000_000, foodInsecurityRate: 10, totalRevenue: 10_000_000 },
    ];
    const result = buildVsInsecurityInsight(states);
    expect(result.deviation).toHaveLength(1);
    expect(result.deviation[0].name).toBe('B');
  });
});
