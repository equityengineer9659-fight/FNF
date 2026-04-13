import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Source-introspection tests for public/api/_rate-limiter.php — same pattern
// as php-length-caps.test.js. We assert structural invariants of the PHP file
// rather than executing PHP, because the project does not require PHP on the
// dev machine and the existing test suite already follows this pattern.
//
// Background: the 2026-04-12 dashboard final audit (P2 Security) flagged the
// rate limiter as global rather than per-IP — one abusive client could exhaust
// the daily FRED/PLACES/BLS/SAIPE quota for every other visitor. This file
// proves the structural fix: bucket key derived from a hashed client IP, with
// a versioned filename so old global buckets cannot collide.

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(__dirname, '../../../../public/api');
const RATE_LIMITER_SRC = readFileSync(resolve(apiRoot, '_rate-limiter.php'), 'utf8');

// Extract the body of a PHP function by name. Brace-matching from the first
// `{` after the signature. Good enough for the small, well-formed helper file.
function functionBody(src, name) {
  const sigRe = new RegExp(`function\\s+${name}\\s*\\([^)]*\\)\\s*\\{`);
  const sigMatch = sigRe.exec(src);
  if (!sigMatch) return null;
  let depth = 1;
  let i = sigMatch.index + sigMatch[0].length;
  const start = i;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  return src.slice(start, i - 1);
}

describe('public/api/_rate-limiter.php — per-IP bucket key (audit P2 Security)', () => {
  it('defines a _rateLimitClientIp helper', () => {
    expect(/function\s+_rateLimitClientIp\s*\(/.test(RATE_LIMITER_SRC)).toBe(true);
  });

  it('uses $_SERVER[REMOTE_ADDR] as the source of truth for client IP', () => {
    const body = functionBody(RATE_LIMITER_SRC, '_rateLimitClientIp');
    expect(body, '_rateLimitClientIp body not found').not.toBeNull();
    expect(/\$_SERVER\[\s*['"]REMOTE_ADDR['"]\s*\]/.test(body)).toBe(true);
  });

  it('parses X-Forwarded-For with FILTER_VALIDATE_IP and rejects private/reserved ranges', () => {
    // Standard "trust the nearest non-private hop" heuristic — never blindly
    // trust client-supplied headers.
    const body = functionBody(RATE_LIMITER_SRC, '_rateLimitClientIp');
    expect(body, '_rateLimitClientIp body not found').not.toBeNull();
    expect(/FILTER_VALIDATE_IP/.test(body)).toBe(true);
    expect(/FILTER_FLAG_NO_PRIV_RANGE/.test(body)).toBe(true);
    expect(/FILTER_FLAG_NO_RES_RANGE/.test(body)).toBe(true);
  });

  it('hashes the client IP via SHA-256 for log hygiene (no raw IPs on disk)', () => {
    expect(/function\s+_rateLimitIpHash\s*\(/.test(RATE_LIMITER_SRC)).toBe(true);
    const body = functionBody(RATE_LIMITER_SRC, '_rateLimitIpHash');
    expect(body, '_rateLimitIpHash body not found').not.toBeNull();
    expect(/hash\(\s*['"]sha256['"]/.test(body)).toBe(true);
  });

  it('cache file path uses the ratelimit-v2- prefix so old global buckets cannot collide', () => {
    const body = functionBody(RATE_LIMITER_SRC, '_rateLimitFile');
    expect(body, '_rateLimitFile body not found').not.toBeNull();
    expect(/ratelimit-v2-/.test(body)).toBe(true);
  });

  it('cache file path interpolates the IP hash so buckets are per-IP', () => {
    const body = functionBody(RATE_LIMITER_SRC, '_rateLimitFile');
    expect(body, '_rateLimitFile body not found').not.toBeNull();
    // The path must reference the hash variable inside the returned string.
    expect(/ratelimit-v2-[^"']*\$\{?ipHash/.test(body) || /\$ipHash/.test(body)).toBe(true);
  });

  it('_rateLimitFile never interpolates raw REMOTE_ADDR into the path', () => {
    const body = functionBody(RATE_LIMITER_SRC, '_rateLimitFile');
    expect(body, '_rateLimitFile body not found').not.toBeNull();
    expect(/REMOTE_ADDR/.test(body)).toBe(false);
  });

  it('rateLimitCheck derives an IP hash before computing the cache file', () => {
    const body = functionBody(RATE_LIMITER_SRC, 'rateLimitCheck');
    expect(body, 'rateLimitCheck body not found').not.toBeNull();
    const hashIdx = body.search(/_rateLimitIpHash\s*\(/);
    const fileIdx = body.search(/_rateLimitFile\s*\(/);
    expect(hashIdx, 'rateLimitCheck must call _rateLimitIpHash').toBeGreaterThan(-1);
    expect(fileIdx, 'rateLimitCheck must call _rateLimitFile').toBeGreaterThan(-1);
    expect(hashIdx).toBeLessThan(fileIdx);
  });

  it('rateLimitCount derives an IP hash before computing the cache file', () => {
    const body = functionBody(RATE_LIMITER_SRC, 'rateLimitCount');
    expect(body, 'rateLimitCount body not found').not.toBeNull();
    const hashIdx = body.search(/_rateLimitIpHash\s*\(/);
    const fileIdx = body.search(/_rateLimitFile\s*\(/);
    expect(hashIdx).toBeGreaterThan(-1);
    expect(fileIdx).toBeGreaterThan(-1);
    expect(hashIdx).toBeLessThan(fileIdx);
  });

  it('rateLimitIncrement derives an IP hash before computing the cache file', () => {
    const body = functionBody(RATE_LIMITER_SRC, 'rateLimitIncrement');
    expect(body, 'rateLimitIncrement body not found').not.toBeNull();
    const hashIdx = body.search(/_rateLimitIpHash\s*\(/);
    const fileIdx = body.search(/_rateLimitFile\s*\(/);
    expect(hashIdx).toBeGreaterThan(-1);
    expect(fileIdx).toBeGreaterThan(-1);
    expect(hashIdx).toBeLessThan(fileIdx);
  });

  it('rateLimitIncrement still uses flock() for atomic read-modify-write', () => {
    // Regression guard — the per-IP refactor must not accidentally drop the
    // existing concurrency safety.
    const body = functionBody(RATE_LIMITER_SRC, 'rateLimitIncrement');
    expect(body, 'rateLimitIncrement body not found').not.toBeNull();
    expect(/flock\s*\(/.test(body)).toBe(true);
    expect(/LOCK_EX/.test(body)).toBe(true);
  });

  it('rateLimitSummary aggregates across the v2 per-IP buckets via glob()', () => {
    // Per-IP buckets fragment the count across N files per service. The
    // monitoring/admin contract still expects a per-(service, period) total,
    // so the summary must glob and sum the v2 files.
    const body = functionBody(RATE_LIMITER_SRC, 'rateLimitSummary');
    expect(body, 'rateLimitSummary body not found').not.toBeNull();
    expect(/glob\s*\(/.test(body)).toBe(true);
    expect(/ratelimit-v2-/.test(body)).toBe(true);
  });
});
