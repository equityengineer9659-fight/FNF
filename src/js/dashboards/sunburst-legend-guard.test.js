import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Guard for audit 2026-04-12 finding: renderBurden() in food-prices.js was
// passing a top-level legend config to an ECharts sunburst, which fired 5
// "legend data not found" warnings per render (one per quintile). Sunburst
// series do not bind to top-level legends the way bar/line/pie do — the
// quintile labels are already shown directly in the inner ring arcs via
// levels[1].label config, so removing the legend block costs no information.

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

function loadDashboard(name) {
  return readFileSync(resolve(root, `src/js/dashboards/${name}.js`), 'utf8');
}

function extractFunction(src, name) {
  const re = new RegExp(
    `(?:async\\s+)?function\\s+${name}\\s*\\([^)]*\\)\\s*\\{`,
    'g'
  );
  const m = re.exec(src);
  if (!m) return null;
  let depth = 1;
  let i = m.index + m[0].length;
  while (i < src.length && depth > 0) {
    const ch = src[i++];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
  }
  return src.slice(m.index, i);
}

describe('food-prices renderBurden: no legend config on sunburst', () => {
  const src = loadDashboard('food-prices');
  const body = extractFunction(src, 'renderBurden');

  it('renderBurden function exists', () => {
    expect(body).not.toBeNull();
  });

  it('renderBurden sets series type to sunburst', () => {
    expect(body).toMatch(/type:\s*'sunburst'/);
  });

  it('renderBurden does not include a top-level legend config', () => {
    // Match "legend:" as a property (preceded by whitespace or `{` and
    // followed by `{` or value) to avoid false positives on `series.legend`
    // if it ever appeared. Any occurrence of `legend:` inside renderBurden
    // would re-introduce the 5 warnings.
    expect(body).not.toMatch(/\blegend\s*:/);
  });
});
