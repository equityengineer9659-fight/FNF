import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Structural guards for two audit findings from 2026-04-12:
//
// Cluster A (narrowed scope): ECharts render functions that are re-called
// after live-data fetches must use getOrCreateChart(), not createChart(), to
// avoid double-init warnings and leaked chart instances. Audit named 7 sites
// across 2 files (food-banks was cleared — no live-refetch path exists there,
// all its createChart calls are one-shot init and stay as-is).
//
// Cluster B (silent-hang guard): every HIGH-risk dashboard's init() must wrap
// its initial Promise.all(fetch, ...) with an AbortController + 15 000ms
// timeout so a never-resolving fetch on a bad network falls into the existing
// catch handler instead of hanging the page indefinitely.

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

function loadDashboard(name) {
  return readFileSync(resolve(root, `src/js/dashboards/${name}.js`), 'utf8');
}

// Pull a function body by its JS name — lets per-function assertions stay
// precise instead of grepping the whole file.
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

describe('Cluster A — render functions called from live-data fetches use getOrCreateChart', () => {
  const sites = [
    { file: 'food-insecurity', fn: 'renderScatter' },
    { file: 'food-insecurity', fn: 'renderFoodPrices' },
    { file: 'food-prices', fn: 'renderCategories' },
    { file: 'food-prices', fn: 'renderRegions' },
    { file: 'food-prices', fn: 'renderHomeVsAway' },
    { file: 'food-prices', fn: 'renderYoYInflation' },
    { file: 'food-prices', fn: 'renderPurchasingPower' }
  ];

  for (const { file, fn } of sites) {
    it(`${file}.js ${fn}() uses getOrCreateChart`, () => {
      const src = loadDashboard(file);
      const body = extractFunction(src, fn);
      expect(body, `function ${fn} not found in ${file}.js`).not.toBeNull();
      const usesGetOrCreate = /getOrCreateChart\s*\(/.test(body);
      const usesBareCreate = /\bcreateChart\s*\(/.test(body);
      expect(usesGetOrCreate, `${fn} should call getOrCreateChart`).toBe(true);
      expect(usesBareCreate, `${fn} must not call createChart directly`).toBe(false);
    });
  }
});

describe('Cluster B — init() has AbortController + 15s timeout around initial fetches', () => {
  const files = ['food-prices', 'food-insecurity', 'food-banks', 'food-access', 'snap-safety-net'];

  for (const file of files) {
    it(`${file}.js init() wraps initial Promise.all with AbortController + 15000ms timeout`, () => {
      const src = loadDashboard(file);
      const body = extractFunction(src, 'init');
      expect(body, `init() not found in ${file}.js`).not.toBeNull();

      const hasAbortCtrl = /new\s+AbortController\s*\(/.test(body);
      const has15sTimeout = /setTimeout\([^,]+,\s*15\s*000\s*\)/.test(body) || /setTimeout\([^,]+,\s*15000\s*\)/.test(body);
      const hasAbortCall = /\.abort\s*\(/.test(body);
      const hasClearTimeout = /clearTimeout\s*\(/.test(body);

      expect(hasAbortCtrl, `${file} init() must instantiate AbortController`).toBe(true);
      expect(has15sTimeout, `${file} init() must schedule a 15000ms timeout`).toBe(true);
      expect(hasAbortCall, `${file} init() must call abort() on timeout`).toBe(true);
      expect(hasClearTimeout, `${file} init() must clearTimeout on success or catch`).toBe(true);
    });
  }
});
