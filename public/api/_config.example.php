<?php
/**
 * API Configuration — Food-N-Force Dashboard (EXAMPLE / TEMPLATE)
 *
 * ⚠ NEVER commit the real _config.php. It is gitignored at .gitignore:47.
 *
 * Source of truth: GitHub repo Secrets. The CI pipeline generates the real
 * _config.php from those secrets on every deploy — see
 * .github/workflows/ci-cd.yml (the "Write API config" block in the deploy job).
 *
 * Local development: copy this file to _config.php and fill in your own keys.
 * Audit 2026-04-09, P0-3.
 *
 * BLS API v2 key (free): https://data.bls.gov/registrationEngine/
 *   - Increases rate limit from 25/day (v1) to 500/day (v2)
 *   - Allows 50 series per request instead of 3
 *
 * Cache cleanup token: any random string for HTTP-triggered cleanup
 */

define('BLS_API_KEY', 'your-bls-api-key-here');

// Charity Navigator GraphQL API (free): https://developer.charitynavigator.org/
define('CHARITY_NAVIGATOR_API_KEY', 'your-charity-navigator-key-here');

// Mapbox (free tier): https://www.mapbox.com/pricing
define('MAPBOX_ACCESS_TOKEN', 'your-mapbox-access-token-here');

// FRED API key (free): https://fred.stlouisfed.org/docs/api/api_key.html
//   - Required for county SNAP, item-level CPI, and county unemployment data
//   - 120 requests per minute
define('FRED_API_KEY', 'your-fred-api-key-here');

// Token for cache-cleanup.php HTTP access (use a random string)
// define('CLEANUP_TOKEN', 'your-random-token-here');
