import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Cluster C regression guard from the 2026-04-12 dashboard final audit.
//
// Static numeric claims in dashboard HTML have a habit of drifting out of
// sync with the chart data they describe — the chart updates when the data
// refreshes, the paragraph next to it does not. Past audits have caught this
// pattern 4+ times. The fix is to either (a) have the JS populate the
// paragraph at runtime, or (b) remove the specific number from the HTML so
// there is nothing to drift.
//
// This guard scans every dashboard HTML file AND every dashboard JS file
// (not just HTML — some stale claims live in JS tooltips) for a blacklist
// of phrases the audit flagged. If any reappears, the test fails with a
// direct pointer to the offending file + phrase.
//
// 70% is intentionally NOT on this list — the nonprofit-profile radar
// benchmark lives in P3 and is explicitly out of scope for this pass.

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');

const BLACKLIST = [
  {
    phrase: 'r ≈ 0.92',
    why: 'food-insecurity.html scatter-insight drift — JS overwrites at runtime but the HTML fallback is stale'
  },
  {
    phrase: 'r=0.92',
    why: 'same as above, compressed form'
  },
  {
    phrase: '#1 predictor',
    why: 'food-insecurity.html — overstated claim. The scatter shows correlation, not causality or ranked predictive power'
  },
  {
    phrase: 'SNAP +55%',
    why: 'food-prices.html — hardcoded narrative that contradicts the dynamic purchasing-power-insight when gap > 0'
  },
  {
    phrase: 'food +37%',
    why: 'food-prices.html — same paragraph as SNAP +55%; both sides of the false framing'
  },
  {
    phrase: 'infrastructure often follows wealth',
    why: 'food-banks.html vs-insecurity-insight — makes a correlation claim on a diverging-bar chart that computes no correlation'
  },
  {
    phrase: 'Distance Is the Primary',
    why: 'food-access.html Chart 4 title — plots distance against a metric defined using distance, so the correlation is mathematically forced, not empirical'
  },
  {
    phrase: 'County Health Rankings 2025',
    why: 'food-insecurity.js county tooltip — falsely attributes modeled estimate to a non-source; real source is internal formula fiRate ≈ 0.75 * povertyRate + 2.5'
  }
];

const htmlDir = resolve(root, 'dashboards');
const jsDir = resolve(root, 'src/js/dashboards');

function listDashboardHtml() {
  return readdirSync(htmlDir)
    .filter(f => f.endsWith('.html'))
    .map(f => ({ path: resolve(htmlDir, f), label: `dashboards/${f}` }));
}

function listDashboardJs() {
  const top = readdirSync(jsDir, { withFileTypes: true })
    .filter(d => d.isFile() && d.name.endsWith('.js') && !d.name.endsWith('.test.js'))
    .map(d => ({ path: resolve(jsDir, d.name), label: `src/js/dashboards/${d.name}` }));
  return top;
}

describe('Cluster C — static-insight phrase blacklist', () => {
  const files = [...listDashboardHtml(), ...listDashboardJs()];

  for (const { phrase, why } of BLACKLIST) {
    it(`blacklisted phrase is absent: "${phrase}" (${why})`, () => {
      const hits = [];
      for (const { path, label } of files) {
        const src = readFileSync(path, 'utf8');
        if (src.includes(phrase)) {
          const line = src.slice(0, src.indexOf(phrase)).split('\n').length;
          hits.push(`${label}:${line}`);
        }
      }
      expect(hits, `banned phrase "${phrase}" appears at: ${hits.join(', ')}`).toEqual([]);
    });
  }
});
