import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Reaches into public/api/ from this test file: ../../../../public/api/<name>
const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(__dirname, '../../../../public/api');

function loadApi(name) {
  return readFileSync(resolve(apiRoot, name), 'utf8');
}

// Cache-key construction reuses whatever the upstream query parameter looks like,
// so an unbounded 10KB alphanumeric blob from a hostile client produces a unique
// cache entry and a billed upstream API hit each request. A substr length cap
// before the cache key is computed is the minimal fix. See the 2026-04-12 final
// audit (php-sec P1/P2 findings).
describe('PHP proxy query-length caps (cache-spam / quota-depletion guard)', () => {
  it('dashboard-fred.php caps the FRED series ID at 30 characters', () => {
    const src = loadApi('dashboard-fred.php');
    // Real FRED IDs are ~14 chars (APUS0000701111, CUUR0000SEFV01). 30 is generous.
    const hasCap = /substr\(\s*\$seriesParam\s*,\s*0\s*,\s*30\s*\)/.test(src);
    expect(hasCap, 'Expected substr($seriesParam, 0, 30) in dashboard-fred.php').toBe(true);
  });

  it('mapbox-geocode.php caps the forward-geocode query at 200 characters', () => {
    const src = loadApi('mapbox-geocode.php');
    const hasCap = /substr\(\s*\$query\s*,\s*0\s*,\s*200\s*\)/.test(src);
    expect(hasCap, 'Expected substr($query, 0, 200) in mapbox-geocode.php').toBe(true);
  });

  it('nonprofit-search.php caps the ProPublica search query at 100 characters', () => {
    const src = loadApi('nonprofit-search.php');
    const hasCap = /substr\(\s*\$query\s*,\s*0\s*,\s*100\s*\)/.test(src);
    expect(hasCap, 'Expected substr($query, 0, 100) in nonprofit-search.php').toBe(true);
  });

  it('each cap lives before the cache-key hash so truncation affects the cache key', () => {
    const checks = [
      { file: 'dashboard-fred.php', capRe: /substr\(\s*\$seriesParam/, cacheKeyRe: /cacheKey\s*=|hash\(/ },
      { file: 'mapbox-geocode.php', capRe: /substr\(\s*\$query/, cacheKeyRe: /cacheKey\s*=|hash\(/ },
      { file: 'nonprofit-search.php', capRe: /substr\(\s*\$query/, cacheKeyRe: /cacheKey\s*=|hash\(/ }
    ];
    for (const { file, capRe, cacheKeyRe } of checks) {
      const src = loadApi(file);
      const capIdx = src.search(capRe);
      const cacheIdx = src.search(cacheKeyRe);
      expect(capIdx, `${file}: substr cap not found`).toBeGreaterThan(-1);
      expect(cacheIdx, `${file}: cache-key construction not found`).toBeGreaterThan(-1);
      expect(capIdx, `${file}: substr cap must appear before cache-key construction`).toBeLessThan(cacheIdx);
    }
  });
});
