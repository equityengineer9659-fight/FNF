import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Guard for audit 2026-04-12 finding: food-insecurity county tooltip shows a
// Food Insecurity rate derived from internal formula (0.75 * povertyRate + 2.5),
// not a direct survey. PR #129 already fixed the *attribution* on the map hint
// text ("internal estimates derived from state poverty data"). This test
// covers the follow-up *value-marking*: append "(est.)" to the FI rate line
// inside the tooltip itself so the derived nature is visible at the point of
// reading.

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

describe('food-insecurity county tooltip marks FI rate as estimate', () => {
  const src = loadDashboard('food-insecurity');
  const body = extractFunction(src, 'countyTooltip');

  it('countyTooltip function exists', () => {
    expect(body).not.toBeNull();
  });

  it('countyTooltip appends an (est.) marker to the Food Insecurity rate line', () => {
    // The line currently reads: `Food Insecurity:</span> ${d.rate}%<br/>`.
    // After the fix the rate should be followed by a muted (est.) suffix on
    // the same line. Match the pattern loosely to survive whitespace /
    // template-literal formatting changes, but require the FI rate
    // interpolation and the (est.) marker to be adjacent (no intervening
    // <br/> — i.e. still on the same tooltip row).
    expect(body).toMatch(
      /Food Insecurity:<\/span>\s*\$\{d\.rate\}%[^<]*<span[^>]*>\(est\.\)<\/span>/
    );
  });

  it('tooltip still uses the fnf-tooltip-muted class for the estimate marker (visual consistency with "(state avg)")', () => {
    // fnf-tooltip-muted is already used on the meal-cost line for "(state avg)".
    // Re-using it keeps the two muted notes visually consistent.
    expect(body).toMatch(/fnf-tooltip-muted[^>]*>\(est\.\)/);
  });
});
