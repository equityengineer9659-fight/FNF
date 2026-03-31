# Security Implementation

## Overview
This document outlines the security measures implemented for the Food-N-Force website.

## Security Headers

### Production Headers (via `_headers` file)
- **X-Frame-Options**: DENY - Prevents clickjacking attacks
- **X-Content-Type-Options**: nosniff - Prevents MIME type sniffing
- **X-XSS-Protection**: 0 - Disabled (deprecated, CSP is preferred)
- **Referrer-Policy**: strict-origin-when-cross-origin - Controls referrer information
- **Strict-Transport-Security**: HSTS with 2-year max-age, includeSubDomains, and preload
- **Permissions-Policy**: Restricts access to browser features

### Content Security Policy (CSP)
Current implementation uses a strict CSP with **no `unsafe-inline`** for scripts or styles:
- `default-src 'self'` - Only allow resources from same origin by default
- `script-src 'self'` - Scripts from same origin only (no inline scripts)
- `style-src 'self' https://fonts.googleapis.com https://cdnjs.cloudflare.com` - Styles from same origin, Google Fonts, and SLDS CDN
- `font-src 'self' https://fonts.gstatic.com data:` - Fonts from Google and data URIs
- `img-src 'self' data: https:` - Images from same origin, data URIs, and HTTPS sources
- `connect-src 'self' https://*.ingest.us.sentry.io` - XHR/fetch to same origin and Sentry error reporting
- `frame-ancestors 'none'` - Prevents embedding in frames
- `base-uri 'self'` - Restricts `<base>` tag targets
- `form-action 'self'` - Restricts form submission targets
- `upgrade-insecure-requests` - Upgrades HTTP to HTTPS

## Form Security & PHP API Endpoints

### API Endpoints (`public/api/`)
The site uses PHP endpoints hosted on SiteGround for server-side form processing:
- `POST /api/contact.php` — contact form submissions
- `POST /api/newsletter.php` — newsletter subscriptions
- `GET /api/csrf-token.php` — CSRF token generation
- `GET /api/dashboard-census.php` — Census Bureau ACS data proxy (state/county poverty data)
- `GET /api/dashboard-bls.php` — BLS Consumer Price Index food price data proxy

**Dashboard API proxy security:**
- Read-only GET endpoints (no user input beyond query parameters)
- Query parameters validated and sanitized (`type` must be `states` or `county`, `state` FIPS limited to 2 digits via regex)
- File-based response caching (`_cache/dashboard/`) with TTL (24hr Census, 7-day BLS)
- Stale cache served if upstream API is unavailable (graceful degradation)
- No API keys stored server-side (Census API v1 and BLS API v1 are keyless)
- User-Agent header identifies requests as `FoodNForce-Dashboard/1.0`
- 15-second timeout on upstream API calls

### Rate Limiting
- Session-based 60-second cooldown per endpoint (`last_contact_submit`, `last_newsletter_submit`)
- Rate check runs BEFORE CSRF validation — rate-limited requests preserve the CSRF token for retry
- Timestamp set only on successful submission (failed validations don't trigger cooldown)
- Returns HTTP 429 with JSON error message

### CSRF Protection
- All forms request a single-use CSRF token from `/api/csrf-token.php` before submission
- Tokens are stored server-side in PHP `$_SESSION` and validated with `hash_equals()`
- Tokens are invalidated after use (single-use via `unset()`)
- **Client-side validation**: JS checks that the token was received before submitting — shows user-visible error if token fetch fails (prevents silent 403 rejections)

### Honeypot Spam Protection
- Both contact and newsletter forms include a hidden `bot-field` input
- The field is visually hidden via `slds-assistive-text` CSS class
- Server-side PHP rejects any submission where `bot-field` is non-empty (HTTP 403)

### Input Validation & Sanitization
- Email addresses validated with `filter_var(FILTER_VALIDATE_EMAIL)`
- All user input sanitized with `htmlspecialchars(ENT_QUOTES, 'UTF-8')` before use in email bodies
- Required fields enforced server-side (returns HTTP 422 with specific error messages)
- Length limits on all fields (firstName/lastName: 100, email: 254, organization: 200, message: 5000)

### Header Injection Prevention
- CRLF characters (`\r`, `\n`) stripped from all values used in email headers (From, Reply-To, Subject)
- Prevents attackers from injecting additional email headers via form input

### Client-Side Integration
- `src/js/effects/contact-form.js` handles contact form submission via `fetch()`
- `src/js/effects/newsletter-popup.js` handles newsletter form submission via `fetch()`
- Both fetch CSRF tokens before submitting and validate the token was received — forms are blocked with a user-visible error if token fetch fails
- Newsletter popup shows visible validation error for invalid email format

## Implementation Details

### Production Deployment
Security headers are defined in the `_headers` file and applied at the hosting level.

### Local Development
For local development, a CSP meta tag can be added to HTML files from `src/security/csp-meta.html`.

### Configuration
Security settings are documented in `config/security-config.json` for reference and monitoring.

## Future Improvements

### Priority 1: Enhanced Monitoring
- Implement CSP reporting endpoint
- Add Report-To header for violation reporting
- Set up security monitoring dashboard

### Priority 2: Additional Hardening
- ~~Implement Subresource Integrity (SRI) for external resources~~ ✅ Done — SLDS CDN has SRI via `build-components.js` (Google Fonts cannot use SRI — content varies by browser)
- Add security.txt file
- Implement CORS policies for API endpoints

## Testing Security Headers

### Online Tools
- https://securityheaders.com
- https://observatory.mozilla.org
- https://csp-evaluator.withgoogle.com

### Command Line
```bash
curl -I https://your-domain.com
```

## Incident Response

If security issues are discovered:
1. Assess the severity and impact
2. Implement immediate mitigation (e.g., tighten CSP)
3. Deploy fixes via standard deployment pipeline
4. Document the incident and response

## Compliance

Current implementation addresses:
- OWASP Top 10 recommendations
- Modern browser security best practices
- GDPR-compliant referrer policies
- Accessibility-friendly security measures