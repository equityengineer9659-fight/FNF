import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// P1 "other" fixes from the 2026-04-12 dashboard final audit.
//
// Both of these are source-level structural guards rather than behavioral
// tests, because the surface area needed to run the real functions (init
// chains, DOM wiring, ECharts instances) would bloat the test beyond the
// value. The regex assertions fail loudly on regression.

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

function load(rel) {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('P1 fix: nonprofit-profile showError updates the h1 (empty-state mismatch)', () => {
  it('showError() touches #org-name so h1 no longer contradicts the error panel', () => {
    const src = load('src/js/dashboards/nonprofit-profile.js');

    // Extract showError body
    const match = src.match(/function\s+showError\s*\(msg\)\s*\{([\s\S]*?)^\}/m);
    expect(match, 'showError function not found').not.toBeNull();
    const body = match[1];

    const touchesOrgName = /getElementById\(['"]org-name['"]\)/.test(body);
    expect(touchesOrgName, 'showError must update #org-name').toBe(true);
  });
});

describe('P1 fix: food-insecurity county search strips "county" suffix', () => {
  it('input handler normalizes the query via replace(/\\s+county$/i, "")', () => {
    const src = load('src/js/dashboards/food-insecurity.js');

    // Find initCountySearch function and extract its input handler block
    const idx = src.indexOf('function initCountySearch');
    expect(idx, 'initCountySearch not found').toBeGreaterThan(-1);
    const slice = src.slice(idx, idx + 4000);

    const stripsCountySuffix = /replace\(\/\\s\+county\$\/i\s*,\s*['"][\s]*['"]\)/.test(slice);
    expect(stripsCountySuffix, 'county search must strip a trailing " county" suffix').toBe(true);
  });
});
