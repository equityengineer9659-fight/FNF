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
