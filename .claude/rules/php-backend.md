---
paths:
  - "public/api/**"
---

# PHP Backend Reference

## Infrastructure
- **Location**: `public/api/` (copied to `dist/api/` during build via rsync)
- **Deployment**: GitHub Actions → SSH/rsync to SiteGround `public_html/`
- **Stack**: nginx reverse proxy in front of Apache. Responses say `Server: nginx` but `public/.htaccess` (Apache mod_headers) is what sets all headers. There is no nginx config to edit.

## Endpoint Inventory (20 files)

### Form endpoints (3)
- `contact.php` — contact form submission
- `newsletter.php` — newsletter signup
- `csrf-token.php` — CSRF token dispenser

### Dashboard API proxies (10)
- `dashboard-bls.php` — BLS regional CPI data
- `dashboard-census.php` — Census poverty / SNAP / demographic data
- `dashboard-fred.php` — FRED item-level CPI series
- `dashboard-places.php` — CDC PLACES health data
- `dashboard-saipe.php` — Census SAIPE county-level poverty estimates
- `dashboard-sdoh.php` — Social Determinants of Health data
- `nonprofit-search.php` — ProPublica Nonprofit Explorer search
- `nonprofit-org.php` — ProPublica Nonprofit Explorer org detail
- `charity-navigator.php` — Charity Navigator org data
- `mapbox-geocode.php` — Mapbox geocoding (for "Find Help Near Me")

### Utilities (3)
- `rate-limit-status.php` — per-IP rate limit status check
- `cache-cleanup.php` — PHP cache pruner (runs as cron)
- (plus 5 shared helpers prefixed `_`: `_config.php`, `_config.example.php`, `_cors.php`, `_rate-limiter.php`, `_validation.php`)

Full cache TTL inventory: memory `project_dashboard.md`.

## Security Conventions
- **Rate limiting**: per-IP hash key (60s cooldown); see `_rate-limiter.php`
- **CSRF**: `hash_equals()` validation via `csrf-token.php`
- **Inputs**: `htmlspecialchars()` sanitization, `FILTER_VALIDATE_EMAIL` for emails
- **Headers**: CRLF injection prevention on all custom headers
- **Honeypot field** on contact + newsletter forms

## Recipient
All form submission emails → `hello@food-n-force.com`
