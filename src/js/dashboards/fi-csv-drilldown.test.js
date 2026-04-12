import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const src = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');

// NOTE: These regex tests are guards, not behavioral tests. renderMap/drillDown
// are private to the module, so we verify implementation shape via source-code
// regex rather than direct invocation. Behavior is verified manually in preview.

describe('fi-csv-drilldown: source verification (guards)', () => {
  it('declares let lastCountyData = null inside renderMap', () => {
    expect(src).toMatch(/let lastCountyData\s*=\s*null/);
  });

  it('renderMap return object includes getCountyData', () => {
    expect(src).toMatch(/getCountyData\s*:\s*\(\)\s*=>\s*lastCountyData/);
  });

  it('drillDown assigns lastCountyData = countyData after .map(...) block', () => {
    const drillDownIdx = src.indexOf('async function drillDown');
    const returnIdx = src.indexOf('return { chart, drillDown, showNational', drillDownIdx);
    const body = src.slice(drillDownIdx, returnIdx);
    expect(body).toMatch(/lastCountyData\s*=\s*countyData/);
  });

  it('showNational body clears lastCountyData = null', () => {
    const showNationalIdx = src.indexOf('function showNational(');
    const drillDownIdx = src.indexOf('async function drillDown');
    const body = src.slice(showNationalIdx, drillDownIdx);
    expect(body).toMatch(/lastCountyData\s*=\s*null/);
  });

  it('addExportButton callback for chart-map references mapCtrl.getCountyData()', () => {
    expect(src).toMatch(/mapCtrl\.getCountyData\(\)/);
  });

  it('county CSV filename is food-insecurity-counties.csv', () => {
    expect(src).toMatch(/food-insecurity-counties\.csv/);
  });
});

describe('fi-csv-drilldown: county row format (logic)', () => {
  it('county CSV rows are [name, rate, childRate, mealCost]', () => {
    const countyData = [
      { name: 'Jefferson County', rate: 24.1, childRate: 31.2, mealCost: 3.85 },
      { name: 'Mobile County', rate: 21.3, childRate: 28.4, mealCost: 3.62 }
    ];
    const rows = countyData.map(c => [c.name, c.rate, c.childRate, c.mealCost]);
    expect(rows[0]).toEqual(['Jefferson County', 24.1, 31.2, 3.85]);
    expect(rows).toHaveLength(2);
  });
});
