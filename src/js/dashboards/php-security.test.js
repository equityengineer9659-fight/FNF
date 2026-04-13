/**
 * PHP Security Tests — Dashboard API Proxies
 * Validates security patterns across all PHP proxy files.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const apiDir = resolve(__dirname, '../../../public/api');

// All dashboard proxy files that serve external API data
const PROXY_FILES = [
  'dashboard-bls.php',
  'dashboard-census.php',
  'dashboard-fred.php',
  'dashboard-places.php',
  'dashboard-saipe.php',
  'dashboard-sdoh.php',
  'mapbox-geocode.php',
  'charity-navigator.php',
  'nonprofit-search.php',
  'nonprofit-org.php',
  'rate-limit-status.php',
];

function readPhp(filename) {
  return readFileSync(resolve(apiDir, filename), 'utf-8');
}

describe('PHP API Proxy Security', () => {
  // ── CORS ──
  describe('CORS policy', () => {
    it('no proxy file should have Access-Control-Allow-Origin: *', () => {
      for (const file of PROXY_FILES) {
        const src = readPhp(file);
        expect(src, `${file} still has wildcard CORS`).not.toMatch(
          /Access-Control-Allow-Origin:\s*\*/
        );
      }
    });

    it('all proxy files should require _cors.php', () => {
      for (const file of PROXY_FILES) {
        const src = readPhp(file);
        expect(src, `${file} missing _cors.php require`).toMatch(
          /require_once\s+.*_cors\.php/
        );
      }
    });
  });

  // ── HTTP Method Validation ──
  describe('HTTP method validation', () => {
    it('all proxy files should check REQUEST_METHOD', () => {
      for (const file of PROXY_FILES) {
        const src = readPhp(file);
        expect(src, `${file} missing method check`).toContain('REQUEST_METHOD');
      }
    });
  });

  // ── Error Message Sanitization ──
  describe('error message sanitization', () => {
    it('no proxy should expose "API key" or "not configured" in error responses', () => {
      for (const file of PROXY_FILES) {
        const src = readPhp(file);
        // Match json_encode lines containing sensitive phrases
        const errorLines = src.split('\n').filter(
          (line) => line.includes('json_encode') && line.includes('error')
        );
        for (const line of errorLines) {
          expect(line, `${file} exposes implementation detail`).not.toMatch(
            /API key|not configured|key not set/i
          );
        }
      }
    });

    it('no proxy should pass upstream error_message directly to client output', () => {
      for (const file of PROXY_FILES) {
        const src = readPhp(file);
        // Check that error_message is NOT used in echo/json_encode (server-side logging is OK)
        const lines = src.split('\n');
        for (const line of lines) {
          if (line.includes('error_message') && (line.includes('json_encode') || line.includes('echo'))) {
            expect.fail(`${file} passes upstream error_message to client: ${line.trim()}`);
          }
        }
      }
    });
  });

  // ── _cors.php shared helper ──
  describe('_cors.php helper', () => {
    it('should exist', () => {
      const src = readPhp('_cors.php');
      expect(src).toBeDefined();
    });

    it('should check HTTP_ORIGIN', () => {
      const src = readPhp('_cors.php');
      expect(src).toContain('HTTP_ORIGIN');
    });

    it('should set Vary: Origin header', () => {
      const src = readPhp('_cors.php');
      expect(src).toMatch(/Vary.*Origin/i);
    });

    it('should allow food-n-force.com', () => {
      const src = readPhp('_cors.php');
      expect(src).toContain('food-n-force.com');
    });

    it('should handle OPTIONS preflight', () => {
      const src = readPhp('_cors.php');
      expect(src).toContain('OPTIONS');
    });
  });

  // ── Cache hashing ──
  describe('cache key hashing', () => {
    it('no proxy should use md5() for cache keys', () => {
      for (const file of PROXY_FILES) {
        const src = readPhp(file);
        expect(src, `${file} still uses md5`).not.toMatch(/\bmd5\s*\(/);
      }
    });
  });

  // ── Upstream Error Handling (P2-19) ──
  describe('upstream error handling', () => {
    const DATA_PROXIES = [
      'dashboard-bls.php', 'dashboard-census.php', 'dashboard-fred.php',
      'dashboard-places.php', 'dashboard-saipe.php', 'dashboard-sdoh.php',
      'mapbox-geocode.php', 'nonprofit-org.php', 'nonprofit-search.php',
    ];

    it('all data proxies should return 502 on upstream failure', () => {
      for (const file of DATA_PROXIES) {
        const src = readPhp(file);
        expect(src, `${file} missing 502 error code`).toContain('http_response_code(502)');
      }
    });

    it('502 responses should include a JSON error key', () => {
      for (const file of DATA_PROXIES) {
        const src = readPhp(file);
        const lines = src.split('\n');
        const errorResponseLines = lines.filter(
          l => l.includes('http_response_code(502)') ||
            (l.includes('json_encode') && l.includes('\'error\'') && !l.includes('error_message'))
        );
        expect(errorResponseLines.length, `${file} missing JSON error response near 502`).toBeGreaterThan(0);
      }
    });

    it('proxies with returnStaleOrError should check file_exists before returning 502', () => {
      const staleProxies = ['dashboard-bls.php', 'dashboard-places.php', 'dashboard-fred.php'];
      for (const file of staleProxies) {
        const src = readPhp(file);
        expect(src, `${file} missing returnStaleOrError`).toContain('function returnStaleOrError(');
        // returnStaleOrError should check file_exists for cache fallback
        const fnBody = src.slice(src.indexOf('function returnStaleOrError'));
        expect(fnBody, `${file} returnStaleOrError missing file_exists check`).toContain('file_exists(');
      }
    });

    it('returnStaleOrError should set _stale and _cached flags on stale responses', () => {
      const staleProxies = ['dashboard-bls.php', 'dashboard-places.php', 'dashboard-fred.php'];
      for (const file of staleProxies) {
        const src = readPhp(file);
        const fnBody = src.slice(src.indexOf('function returnStaleOrError'));
        expect(fnBody, `${file} missing _stale flag`).toContain('\'_stale\'');
        expect(fnBody, `${file} missing _cached flag`).toContain('\'_cached\'');
      }
    });

    it('proxies without returnStaleOrError should still return 502 with json_encode error', () => {
      const directErrorProxies = [
        'dashboard-census.php', 'dashboard-saipe.php', 'dashboard-sdoh.php',
        'nonprofit-org.php', 'nonprofit-search.php',
      ];
      for (const file of directErrorProxies) {
        const src = readPhp(file);
        expect(src, `${file} missing 502`).toContain('http_response_code(502)');
        const errorLines = src.split('\n').filter(
          l => l.includes('json_encode') && l.includes('\'error\'')
        );
        expect(errorLines.length, `${file} missing json error response`).toBeGreaterThan(0);
      }
    });
  });

  // ── Rate Limit Guards (P2-19) ──
  describe('rate limit guards', () => {
    const RATE_LIMITED_PROXIES = [
      'dashboard-bls.php', 'dashboard-fred.php', 'dashboard-places.php',
      'dashboard-saipe.php', 'mapbox-geocode.php', 'charity-navigator.php',
    ];

    it('rate-limited proxies should require _rate-limiter.php', () => {
      for (const file of RATE_LIMITED_PROXIES) {
        const src = readPhp(file);
        expect(src, `${file} missing rate limiter require`).toMatch(
          /require_once.*_rate-limiter\.php/
        );
      }
    });

    it('rate-limited proxies should call rateLimitCheck before API calls', () => {
      for (const file of RATE_LIMITED_PROXIES) {
        const src = readPhp(file);
        expect(src, `${file} missing rateLimitCheck`).toContain('rateLimitCheck(');
      }
    });

    it('rate-limited proxies should call rateLimitIncrement after successful API calls', () => {
      for (const file of RATE_LIMITED_PROXIES) {
        const src = readPhp(file);
        expect(src, `${file} missing rateLimitIncrement`).toContain('rateLimitIncrement(');
      }
    });

    it('rate limit failure should return an error code or fall back to stale cache', () => {
      for (const file of RATE_LIMITED_PROXIES) {
        const src = readPhp(file);
        const hasStale = src.includes('returnStaleOrError');
        const has503 = src.includes('http_response_code(503)');
        const has429 = src.includes('http_response_code(429)');
        expect(
          hasStale || has503 || has429,
          `${file} has no fallback path for rate limit exhaustion`
        ).toBe(true);
      }
    });

    it('_rate-limiter.php should use file locking for atomic increments', () => {
      const src = readPhp('_rate-limiter.php');
      expect(src).toContain('flock(');
      expect(src).toContain('LOCK_EX');
    });

    it('_rate-limiter.php rateLimitCheck should handle missing counter file gracefully', () => {
      const src = readPhp('_rate-limiter.php');
      const fnBody = src.slice(
        src.indexOf('function rateLimitCheck('),
        src.indexOf('function rateLimitCount(')
      );
      expect(fnBody).toContain('file_exists');
      // Missing file should return true (within limit)
      expect(fnBody).toMatch(/if\s*\(\s*!file_exists[\s\S]*?return\s+true/);
    });
  });

  // ── Input validation ──
  describe('input validation', () => {
    it('dashboard-places.php should validate state against allowlist', () => {
      const src = readPhp('dashboard-places.php');
      expect(src).toContain('VALID_STATE_ABBRS');
    });

    // P2-05: EIN validation must be exactly 9 digits (matches nonprofit-org.php)
    it('charity-navigator.php EIN validation requires exactly 9 digits (P2-05)', () => {
      const src = readPhp('charity-navigator.php');
      expect(src).toMatch(/strlen\(\$ein\)\s*!==?\s*9/);
      expect(src).not.toMatch(/strlen\(\$ein\)\s*<\s*2/);
    });

    // P2-41: Mapbox proxy must not persist raw query string in cache payload
    it('mapbox-geocode.php cache payload omits raw query (P2-41)', () => {
      const src = readPhp('mapbox-geocode.php');
      const cachedBlock = src.slice(
        src.indexOf('$cachedPayload'),
        src.indexOf('file_put_contents($cacheFile, json_encode($cachedPayload))') + 80
      );
      expect(cachedBlock).not.toMatch(/'query'\s*=>/);
      // But the outbound (non-cached) response still carries the current query
      expect(src).toMatch(/\$result\['query'\]\s*=\s*\$query/);
    });

    it('contact.php and newsletter.php set rate-limit session before mail() (P1-5)', () => {
      for (const { file, rateKey } of [
        { file: 'contact.php', rateKey: 'last_contact_submit' },
        { file: 'newsletter.php', rateKey: 'last_newsletter_submit' }
      ]) {
        const src = readPhp(file);
        const rateLimitWriteIdx = src.search(/\$_SESSION\[(\$rateKey|['"]last_\w+_submit['"])\]\s*=\s*time\(\)/);
        const mailCallIdx = src.indexOf('$sent = mail(');
        expect(rateLimitWriteIdx, `${file}: rate-limit write must exist (key=${rateKey})`).toBeGreaterThan(-1);
        expect(mailCallIdx, `${file}: mail() call must exist`).toBeGreaterThan(-1);
        expect(rateLimitWriteIdx, `${file}: rate-limit write must precede mail()`).toBeLessThan(mailCallIdx);
      }
    });

    it('_validation.php should exist with 51 state abbreviations', () => {
      const src = readPhp('_validation.php');
      expect(src).toBeDefined();
      // All 50 states + DC
      const abbrs = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
        'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
        'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
        'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
        'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];
      for (const abbr of abbrs) {
        expect(src, `Missing state: ${abbr}`).toContain(`'${abbr}'`);
      }
    });
  });
});
