# Charity Navigator API Integration

Reference and troubleshooting guide for the Charity Navigator GraphQL integration that powers the rating gauge, mission, and badge on every nonprofit profile page.

**Wired up:** 2026-04-13 (the long way around). Initial scaffolding from session ~04-04 used incorrect endpoint, header, and query — none of which matched CN's actual API.

## What it does

On every `dashboards/nonprofit-profile.html?ein=XXXXXXXXX` page load, the JS at [src/js/dashboards/nonprofit-profile.js:28-109](../../src/js/dashboards/nonprofit-profile.js#L28) makes a non-blocking call to `/api/charity-navigator.php?ein=...` and renders:

- **ECharts gauge** — encompass score (0–100), color-coded green/yellow/orange/red
- **Star rating badge** — 1–4 stars (free tier doesn't expose Platinum/Gold/Silver/Bronze beacon levels)
- **Mission statement** — full text from CN

If the org isn't rated, the section stays hidden — no error UI.

## The four things that have to be exactly right

If this breaks in the future, it's almost certainly one of these four. They're listed in the order we got bitten by them, which is also the order to debug.

### 1. The endpoint URL

```
✅ https://api.charitynavigator.org/graphql
❌ https://data-api.charitynavigator.org/graphql   (does not resolve)
```

Find it in the developer portal under **APIs available in this product → Charity Navigator API → Description**. The "Listen path" there (`/graphql`) is appended to the base URL shown.

### 2. The auth header format

```
✅ Authorization: <TOKEN>
❌ Apikey: <TOKEN>
❌ Authorization: Bearer <TOKEN>
```

The gateway is **Tyk** (visible in the playground UI). Tyk's standard pattern is the raw token in the `Authorization` header with **no `Bearer` prefix**.

CN gives you two credentials in their developer portal:
- **TOKEN** — this is the API key. Use it.
- **TOKEN HASH** — *not* used for API calls. It's the secret for logging into Tyk's developer portal itself. Ignore it for anything API-related.

### 3. The query name

```
✅ publicSearchFaceted(ein: [$ein], result_size: 1) { ... }
❌ organizationByEIN(ein: $ein) { ... }   (does not exist)
```

There is no direct "get org by EIN" query on the free tier. Instead, use `publicSearchFaceted` with the EIN supplied as a single-element array filter and `result_size: 1`. The full list of available queries is in the developer portal **Documentation Explorer → Query**.

The schema returns a `PublicFacetedResponse` containing a `results: [PublicSearchResult!]!` array — pull `results[0]`.

### 4. The field names on `PublicSearchResult`

The actual fields available on the free tier are documented in [public/api/charity-navigator.php:71-94](../../public/api/charity-navigator.php#L71). Notable gotchas:

| What you might guess | What it actually is |
|---|---|
| `score` / `overallScore` | `encompass_score` (string, cast to float) |
| `rating` | `encompass_star_rating` |
| `streetAddress1`, `stateOrProvince`, `postalCode` | `street`, `state`, `zip` |
| `profileUrl` | `charity_navigator_url` |
| `beacon { level }` | **not exposed on free tier** |
| `alertLevel` | `highest_level_alert` (the field `highest_level_advisory` is deprecated) |

The PHP proxy at [public/api/charity-navigator.php:163-189](../../public/api/charity-navigator.php#L163) maps these into a legacy `organization { overallRating, beacon, address }` shape that the dashboard JS already expects, so frontend changes aren't needed if the upstream schema changes.

## Configuration

The API key is read from environment variables (intentionally not hardcoded so it doesn't sit in plaintext on disk):

- **Local dev**: Windows User Environment Variable `CHARITY_NAVIGATOR_API_KEY`. Restart your terminal after setting it. Read by [public/api/_config.php](../../public/api/_config.php) via `getenv()`.
- **Production**: GitHub Secret `CHARITY_NAVIGATOR_API_KEY`. Injected into `_config.php` by the CI pipeline at [.github/workflows/ci-cd.yml](../../.github/workflows/ci-cd.yml) on every deploy.

The PHP runtime caches successful responses for 7 days at `_cache/dashboard/cn-{ein}.json`. Failures are not cached.

## Verifying it's live

```bash
# Rated org — should return real data
curl -s "https://food-n-force.com/api/charity-navigator.php?ein=363673599" | python -m json.tool

# Unrated org — should return _notRated: true with no error
curl -s "https://food-n-force.com/api/charity-navigator.php?ein=521358938" | python -m json.tool
```

Feeding America (`363673599`) is the canonical test EIN — it has a high encompass score (~95) so it's easy to spot a regression in the score parsing.

## Common errors and what they mean

The PHP proxy uses cURL with full error capture, so failures return diagnostic fields. Always read these before assuming the network is broken.

### `_httpCode: 0`, `_curlError: "Could not resolve host"`
DNS failure — endpoint URL is wrong. Check item 1 above.

### `_httpCode: 200`, body says `{"error": "Authorization field missing"}`
Missing `Authorization` header in the cURL call. Check that `_config.php` has `CHARITY_NAVIGATOR_API_KEY` defined and not empty. On production, verify the GitHub Secret is set and the deploy pipeline wrote it correctly.

### `_httpCode: 200`, body says `{"error": "Access to this API has been disallowed"}`
The token value itself is wrong/revoked, or the wrong credential was used (e.g. TOKEN HASH instead of TOKEN). Rotate via the **ROTATE** button in the CN developer portal and update both env var locations.

### `_httpCode: 400`, body says `{"errors": [{"message": "field: X not defined on type: Query"}]}`
The query name is wrong — CN changed the schema or you're hitting a different tier than expected. Re-introspect via the **Documentation Explorer** in the CN developer portal (the playground itself does NOT execute custom queries reliably — it returns cached `__schema` data regardless of input).

### `_httpCode: 502` from our PHP, no `_curlError`
The upstream returned a non-2xx but the response body wasn't captured. SiteGround firewall blocking outbound to api.charitynavigator.org is the prime suspect. Check from the server, not from your laptop.

## The Tyk playground does not work for testing queries

This cost us hours. The CN developer portal's "Playground" UI returns the same cached `__schema` introspection result regardless of what query you put in the editor box. Do not trust it for verifying queries.

**Use this instead:**
1. **Documentation Explorer** (sidebar) — click `Query` to see available top-level queries, click any return type to drill into its fields. This is the only reliable way to inspect the schema in the CN portal.
2. **Direct cURL through our PHP proxy** — once the proxy is deployed, hit `?ein=XXXXXXXXX` and inspect the `_httpCode` / `_responseBody` fields if it fails. The proxy was temporarily extended with a `debug_q` query parameter (base64-encoded GraphQL) for one-off introspection during the initial integration; it was removed after the integration was verified working ([PR #170](https://github.com/equityengineer9659-fight/FNF/pull/170)). If you need it again, the pattern is in the git history of `public/api/charity-navigator.php`.

## Free tier limits

- **90,000 requests/day** (we cap at 90K; their actual limit is 100K). Enforced server-side via [public/api/_rate-limiter.php](../../public/api/_rate-limiter.php).
- **No beacon level data** (Platinum/Gold/Silver/Bronze). Only encompass score and 1–4 star rating.
- **No financial detail / 990 data** — that's all on ProPublica via [nonprofit-org.php](../../public/api/nonprofit-org.php).
- 7-day cache TTL on our side dramatically reduces upstream calls.

## Related code

| File | Purpose |
|---|---|
| [public/api/charity-navigator.php](../../public/api/charity-navigator.php) | PHP proxy: query, cache, response mapping |
| [public/api/_config.php](../../public/api/_config.php) | Reads `CHARITY_NAVIGATOR_API_KEY` from env var |
| [src/js/dashboards/nonprofit-profile.js](../../src/js/dashboards/nonprofit-profile.js) | `fetchCharityNavigator()` — non-blocking render |
| [dashboards/nonprofit-profile.html](../../dashboards/nonprofit-profile.html) | `cn-rating-section` — gauge / badge / mission DOM |
| [src/css/12-nonprofit-directory.css](../../src/css/12-nonprofit-directory.css) | `.profile-cn-rating__beacon--*` styling |
| [.github/workflows/ci-cd.yml](../../.github/workflows/ci-cd.yml) | Injects `CHARITY_NAVIGATOR_API_KEY` from GitHub Secrets into `_config.php` on deploy |

## PR history (the trail of pain)

For context on what was tried and why:

- **#164** — `fix(ci): allow workflow_dispatch to trigger SiteGround deploy` — the CI deploy job had `if: github.event_name == 'push'` so manual workflow runs always skipped deploy. Fixed.
- **#165** — `fix(api): correct Charity Navigator GraphQL endpoint URL` — `data-api.charitynavigator.org` → `api.charitynavigator.org`.
- **#167** — `fix(api): use Authorization header for Charity Navigator GraphQL` — `Apikey:` → `Authorization:`.
- **#168** — `debug(api): switch CN proxy to cURL with error capture` — `file_get_contents` returned generic failures; cURL exposes HTTP code + body so we could see "field organizationByEIN not defined".
- **#169** — `fix(api): use publicSearchFaceted for Charity Navigator free tier` — replaced the non-existent `organizationByEIN` query with `publicSearchFaceted`, mapped the new response shape into the legacy structure the JS expects.
- **#170** — `chore(api): remove debug_q schema introspection parameter` — removed the temporary debug parameter that allowed arbitrary GraphQL queries through our API key.
