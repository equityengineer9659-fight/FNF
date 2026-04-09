# Dim-16 Privacy & Compliance Audit
**Date**: 2026-04-09
**Auditor**: php-security-reviewer agent

---

## Findings

**[P1] Sentry IP address auto-detection enabled**
- Evidence: `src/js/monitoring/sentry.js:79` — `ip_address: '{{auto}}'` in `setUser()` call
- Risk: Sentry collects real visitor IPs, constituting personal data under GDPR. No consent gate exists before Sentry initialises.
- Recommendation: Remove the `ip_address` field entirely, or gate Sentry init behind a consent cookie check. `sendDefaultPii: false` (line 40) is correctly set but the explicit `{{auto}}` override on line 79 nullifies it for IP specifically.

**[P2] No GA4 / analytics consent mechanism found**
- Evidence: No `gtag`, `googletagmanager`, or `analytics.js` references detected in any HTML or JS file.
- Status: GA4 appears absent from the codebase. If it is injected at the hosting layer (SiteGround) or via a tag manager not in this repo, there is no consent banner — which would be a GDPR violation for EU visitors. Confirm with SiteGround panel.

**[P2] Mapbox geocode proxy echoes raw user query in response**
- Evidence: `public/api/mapbox-geocode.php:133` — `'query' => $query` is written to the JSON response and to the on-disk cache file.
- Risk: If a user types a home address into "Find Help Near Me", that address string is cached to disk (`_cache/dashboard/mapbox-*.json`) for 30 days. The cache directory is inside `public_html`; if web-accessible, cached addresses could be enumerated.
- Recommendation: Remove `query` from the cached payload (strip before `file_put_contents`), and verify `_cache/` is blocked by `.htaccess` or placed outside `public_html`.

**[P2] Newsletter popup stores subscription state in `localStorage` without consent notice**
- Evidence: `src/js/effects/newsletter-popup.js:189` — `localStorage.setItem('fnf-newsletter-subscribed', 'true')`
- Risk: Under ePrivacy Directive / GDPR, storing any data in `localStorage` for purposes beyond strict technical necessity requires consent or at minimum a disclosure. The popup itself collects an email address; the `localStorage` flag is functional, but no privacy policy link or consent language is shown in the modal (`openModal()`, lines 80–96).
- Recommendation: Add a brief "We'll email you our newsletter. See our Privacy Policy." line with a link inside the modal.

**[P3] CSP `connect-src` permits all `*.ingest.us.sentry.io` subdomains**
- Evidence: `_headers:13` — `connect-src 'self' https://*.ingest.us.sentry.io`
- Risk: Wildcard subdomain allows exfiltration to any `*.ingest.us.sentry.io` host, not just the project DSN host. Low practical risk but violates least-privilege principle.
- Recommendation: Pin to exact DSN ingest host, e.g. `https://o<id>.ingest.us.sentry.io`.

**[P3] No `report-uri` / `report-to` CSP directive**
- Evidence: `_headers:13` — comment acknowledges absence; no reporting endpoint configured.
- Risk: CSP violations are silent; injection attempts go undetected.
- Recommendation: Add a `report-uri` once a CSP reporting endpoint is available (noted as future work in the comment).

---

## Passed Checks

- `sendDefaultPii: false` set in Sentry init (`sentry.js:40`)
- SLDS CDN link has correct SRI hash (`sha384-ucbUkoN…`) injected by `build-components.js:230-231`
- CORS origin allowlist restricts API proxies to `food-n-force.com` only (`_cors.php:8-11`)
- `Referrer-Policy: strict-origin-when-cross-origin` set in `_headers:6`
- `Permissions-Policy` restricts camera, geolocation, microphone, payment (`_headers:7`)
- `HSTS` with `preload` flag present (`_headers:8`)
- `form-action 'self'` in CSP (`_headers:13`)
- `X-Frame-Options: DENY` + `frame-ancestors 'none'` double-lock framing (`_headers:3`, `_headers:13`)
- Contact and newsletter forms collect minimum necessary fields; no SSN, DOB, or financial data
- Rate limiter uses aggregate counters only — no IP addresses stored in `_cache/` files (`_rate-limiter.php`)
- `error_log()` call in `dashboard-fred.php:156` logs upstream error strings only, not user input or IPs
- `Cache-Control: no-store` on all form endpoint responses (`contact.php:10`, `newsletter.php:9`)
- CSRF tokens are single-use (`unset($_SESSION['csrf_token'])`) — no token leakage in responses

---

## Summary

Overall privacy posture is **good**. The one actionable P1 is the Sentry IP override at `sentry.js:79`; it directly contradicts the `sendDefaultPii: false` setting and constitutes unconsented personal data collection. The P2 Mapbox cache issue is a data minimisation gap. No GA4 tracking was found in source — confirm it is not injected at the server layer.
