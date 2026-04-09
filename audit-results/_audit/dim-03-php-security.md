# Dimension 3: PHP Security & API Contracts
**Date**: 2026-04-09
**Files reviewed**: 19 PHP files in `public/api/`
**Overall risk**: Low — one P2 gap, two P3 hardening items

---

## Findings

**[P2] charity-navigator.php:49 — EIN validation accepts any length ≥ 2 digits**
Evidence: `public/api/charity-navigator.php:49` — `strlen($ein) < 2` (minimum 2, not exactly 9)
Risk: Malformed EINs forwarded to Charity Navigator API; may trigger unexpected upstream behavior or cache poisoning via 2–8 digit keys.
Recommendation: Change to `strlen($ein) !== 9` to match the 9-digit EIN format enforced by `nonprofit-org.php:29`.

**[P3] contact.php / newsletter.php / csrf-token.php — no `require_once _cors.php`**
Evidence: Grep of all three form endpoints returns zero `_cors` includes.
Risk: CORS is not enforced on form endpoints. Any origin can submit forms cross-origin. CSRF + same-site session cookies mitigate exploitation, but defense-in-depth is missing.
Recommendation: Add `require_once __DIR__ . '/_cors.php';` to all three form endpoints (after the `header()` calls, before method check) and remove the hardcoded `Access-Control-Allow-Methods: GET, OPTIONS` from `_cors.php` OPTIONS response so POST is permitted for form endpoints (or extend `_cors.php` to accept a `$methods` param).

**[P3] cache-cleanup.php — no CORS header, no method restriction**
Evidence: `public/api/cache-cleanup.php` has no `_cors.php` include and no GET-only guard.
Risk: Any HTTP method triggers the token check, and if `CLEANUP_TOKEN` is undefined (line 19: `$expected = defined('CLEANUP_TOKEN') ? CLEANUP_TOKEN : ''`), an empty token comparison via `hash_equals('', '')` returns `true`, granting unrestricted cache deletion.
Recommendation: (a) Add a guard: `if ($expected === '') { http_response_code(503); exit; }` so unconfigured deployments fail closed. (b) Add GET-only method guard for HTTP-triggered path.

---

## Passed Checks

- All 11 proxy endpoints require `_cors.php` — no wildcard `*` origin (confirmed)
- All 11 proxy endpoints enforce GET-only with 405 on other methods (confirmed)
- No `md5()` calls anywhere in `public/api/` — cache keys use `hash('sha256', ...)` (confirmed)
- No error messages leak "API key", upstream URLs, or stack traces to clients — FRED logs upstream errors server-side via `error_log()` only (`dashboard-fred.php:156`)
- EIN validated as 9 digits in `nonprofit-org.php:29` (P2 gap only in `charity-navigator.php`)
- State validated against `VALID_STATE_ABBRS` allowlist in `_validation.php` (used by `dashboard-places.php`)
- FIPS sanitized with `preg_replace('/[^0-9]/', '', ...)` in `dashboard-census.php`, `dashboard-saipe.php`, `dashboard-fred.php`
- Session-based 60s rate limiting on `contact.php` and `newsletter.php`
- CSRF: `random_bytes(32)` generation, `hash_equals()` validation, single-use `unset()` in both form endpoints
- Honeypot check in both form endpoints before email send
- `_config.php` gitignored at `.gitignore:47`
- Cache directory blocked: `public/.htaccess:17` — `RedirectMatch 403 ^/_cache/`
- No `md5()` — all cache keys use `hash('sha256', ...)`
- JS CSRF flow: `contact-form.js:34` fetches `/api/csrf-token.php`, appends `csrf_token` to FormData before POST
- CSP `_headers:13`: `form-action 'self'` and `connect-src 'self' ...` both present

---

## Recommendations

- **Standardize EIN validation** to `strlen($ein) !== 9` across all endpoints (currently inconsistent between `nonprofit-org.php` and `charity-navigator.php`)
- **Add _cors.php to form endpoints** for defence-in-depth even though CSRF tokens provide the primary protection
- **Fail closed on unconfigured CLEANUP_TOKEN** — `hash_equals('', '')` is `true` in PHP
