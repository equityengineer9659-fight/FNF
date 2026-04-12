import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// P2 accessibility remainder from the 2026-04-12 dashboard final audit.
// Guards both fixes at source-text level so a casual revert fails CI.

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

function load(rel) {
  return readFileSync(resolve(root, rel), 'utf8');
}

describe('P2 a11y: Double Burden tiles are keyboard + SR reachable', () => {
  const src = load('src/js/dashboards/food-access.js');

  it('createDoubleBurdenTile sets tabindex="0" on every tile', () => {
    // Extract the function body
    const match = src.match(/function\s+createDoubleBurdenTile\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/);
    expect(match, 'createDoubleBurdenTile not found').not.toBeNull();
    const body = match[1];
    const setsTabindex = /setAttribute\(['"]tabindex['"]\s*,\s*['"]0['"]\)/.test(body);
    expect(setsTabindex, 'tile must call setAttribute("tabindex", "0")').toBe(true);
  });

  it('createDoubleBurdenTile wires focus and blur handlers for SR parity with hover', () => {
    const match = src.match(/function\s+createDoubleBurdenTile\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/);
    const body = match[1];
    const hasFocus = /addEventListener\(['"]focus['"]/.test(body);
    const hasBlur = /addEventListener\(['"]blur['"]/.test(body);
    expect(hasFocus, 'tile must register a focus listener').toBe(true);
    expect(hasBlur, 'tile must register a blur listener').toBe(true);
  });

  it('aria-label on the tile includes the population + low-access detail (not just headline)', () => {
    const match = src.match(/function\s+createDoubleBurdenTile\s*\([^)]*\)\s*\{([\s\S]*?)\n\}/);
    const body = match[1];
    // The aria-label string should reference d.population and d.lowAccessPct so
    // the SR announcement carries the same info the hover tooltip shows.
    const hasPopulation = /aria-label[\s\S]{0,400}d\.population/.test(body);
    const hasLowAccess = /aria-label[\s\S]{0,400}d\.lowAccessPct/.test(body);
    expect(hasPopulation, 'aria-label must reference d.population').toBe(true);
    expect(hasLowAccess, 'aria-label must reference d.lowAccessPct').toBe(true);
  });
});

describe('P2 a11y: .directory-chip has a visible :focus-visible state', () => {
  const css = load('src/css/12-nonprofit-directory.css');

  it('.directory-chip:focus-visible rule exists', () => {
    const hasRule = /\.directory-chip:focus-visible\s*\{/.test(css);
    expect(hasRule, '.directory-chip:focus-visible selector not found').toBe(true);
  });

  it('the focus-visible rule provides a visible outline or box-shadow', () => {
    const match = css.match(/\.directory-chip:focus-visible\s*\{([\s\S]*?)\n\}/);
    expect(match, '.directory-chip:focus-visible block not found').not.toBeNull();
    const block = match[1];
    const hasOutlineOrShadow = /box-shadow|outline/.test(block);
    expect(hasOutlineOrShadow, 'focus-visible must set an outline or box-shadow').toBe(true);
  });
});
