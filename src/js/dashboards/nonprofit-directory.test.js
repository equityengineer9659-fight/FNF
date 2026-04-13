import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(resolve(__dirname, 'nonprofit-directory.js'), 'utf8');

describe('nonprofit-directory initFindHelp XSS safety', () => {
  it('escapes org name, city, state and encodes ein in result cards', () => {
    // Find the innerHTML block for initFindHelp results
    const match = src.match(/results\.innerHTML = orgs\.slice\(0, 20\)\.map\(org => \{[\s\S]*?\}\)\.join\(''\);/);
    expect(match, 'initFindHelp results block must exist').toBeTruthy();
    const block = match[0];
    expect(block).toMatch(/escapeHtml\(name\)/);
    expect(block).toMatch(/escapeHtml\(city\)/);
    expect(block).toMatch(/escapeHtml\(state\)/);
    expect(block).toMatch(/encodeURIComponent\(ein\)/);
  });
});

describe('nonprofit-directory handleSearch AbortController + history guard', () => {
  it('declares a module-scope searchAbortController', () => {
    expect(src).toMatch(/let\s+searchAbortController\s*=\s*null/);
  });

  it('aborts a prior controller and creates a new one per handleSearch call', () => {
    const fnMatch = src.match(/async function handleSearch\([^)]*\)\s*\{[\s\S]*?\n\}/);
    expect(fnMatch, 'handleSearch must exist').toBeTruthy();
    const body = fnMatch[0];
    expect(body).toMatch(/if\s*\(\s*searchAbortController\s*\)\s*searchAbortController\.abort\(\)/);
    expect(body).toMatch(/searchAbortController\s*=\s*new\s+AbortController\(\)/);
    expect(body).toMatch(/fetch\([\s\S]*?\{\s*signal\s*\}/);
    expect(body).toMatch(/AbortError/);
  });

  it('wraps history.replaceState in try/catch for quota safety', () => {
    const fnMatch = src.match(/async function handleSearch\([^)]*\)\s*\{[\s\S]*?\n\}/);
    const body = fnMatch[0];
    // match a try { history.replaceState(...) } catch block
    expect(body).toMatch(/try\s*\{\s*history\.replaceState\([^)]*\);?\s*\}\s*catch/);
  });
});
