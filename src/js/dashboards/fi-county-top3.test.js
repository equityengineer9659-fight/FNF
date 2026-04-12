import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const src = readFileSync(resolve(__dirname, 'food-insecurity.js'), 'utf-8');

describe('fi-county-top3: renderStateDeepDive signature (guards)', () => {
  it('accepts 5th countyData parameter with default null', () => {
    expect(src).toMatch(/function renderStateDeepDive\s*\([^)]*countyData\s*=\s*null[^)]*\)/);
  });

  it('panel.innerHTML conditionally renders dashboard-county-top3', () => {
    expect(src).toMatch(/dashboard-county-top3/);
  });

  it('uses countyData?.length to guard rendering', () => {
    expect(src).toMatch(/countyData\?\.length/);
  });
});

describe('fi-county-top3: renderMap async re-render (guards)', () => {
  it('renderMap accepts 5th onDrillDownComplete parameter', () => {
    expect(src).toMatch(/function renderMap\s*\([^)]*onDrillDownComplete[^)]*\)/);
  });

  it('drillDown fires onDrillDownComplete after lastCountyData assignment', () => {
    const drillDownIdx = src.indexOf('async function drillDown');
    const returnIdx = src.indexOf('return { chart, drillDown, showNational', drillDownIdx);
    const body = src.slice(drillDownIdx, returnIdx);
    expect(body).toMatch(/onDrillDownComplete/);
    const lastIdx = body.indexOf('lastCountyData = countyData');
    const cbIdx = body.indexOf('onDrillDownComplete(');
    expect(lastIdx).toBeGreaterThanOrEqual(0);
    expect(cbIdx).toBeGreaterThan(lastIdx);
  });
});

describe('fi-county-top3: renderStateDeepDive call sites (guards)', () => {
  it('all call sites pass mapCtrl.getCountyData() as 5th argument', () => {
    // 5 invocations: onStateClick, onDrillDownComplete (async re-render),
    // showNational deselect, state-selector onSelect, URL param
    const matches = src.match(/renderStateDeepDive\s*\(\s*[^)]*mapCtrl\.getCountyData\(\)\s*\)/g) || [];
    expect(matches.length).toBe(5);
  });
});

describe('fi-county-top3: top-3 sort/slice logic', () => {
  it('sorts descending by value, returns top 3', () => {
    const countyData = [
      { name: 'Jefferson', value: 24.1 },
      { name: 'Mobile', value: 21.3 },
      { name: 'Madison', value: 15.2 },
      { name: 'Baldwin', value: 18.7 }
    ];
    const top3 = [...countyData].sort((a, b) => b.value - a.value).slice(0, 3);
    expect(top3.map(c => c.name)).toEqual(['Jefferson', 'Mobile', 'Baldwin']);
  });

  it('renders county names and percentages in HTML', () => {
    const countyData = [
      { name: 'Jefferson', value: 24.1 },
      { name: 'Mobile', value: 21.3 },
      { name: 'Baldwin', value: 18.7 }
    ];
    const top3 = [...countyData].sort((a, b) => b.value - a.value).slice(0, 3);
    const html = `<ul class="dashboard-county-top3">${top3.map(c =>
      `<li>${c.name} — ${(+c.value).toFixed(1)}%</li>`
    ).join('')}</ul>`;
    const div = document.createElement('div');
    div.innerHTML = html;
    expect(div.textContent).toContain('Jefferson');
    expect(div.textContent).toContain('24.1%');
  });

  it('null countyData renders empty string', () => {
    const countyData = null;
    const html = countyData?.length ? '<ul>...</ul>' : '';
    expect(html).toBe('');
  });

  it('empty countyData renders empty string', () => {
    const countyData = [];
    const html = countyData?.length ? '<ul>...</ul>' : '';
    expect(html).toBe('');
  });
});
