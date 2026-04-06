# Data Monitoring Strategy

How we detect stale data, when human action is needed, and caching optimization analysis for the Food-N-Force dashboard platform.

> **Related docs:** [Data Source Inventory](data-source-inventory.md) (complete source list) | [Data Refresh Runbook](data-refresh-runbook.md) (step-by-step procedures) | [Data Quality](data-quality.md) (quality ratings)

Last updated: 2026-04-06

---

## Data Freshness Monitoring

### Freshness Thresholds

Each static JSON file has a timestamp field that indicates when it was last updated. The thresholds below define when data should be considered stale (needs attention) vs critical (overdue).

| File | Freshness Field | Expected Cadence | Stale Threshold | Critical Threshold |
|---|---|---|---|---|
| `bls-food-cpi.json` | `fetchedAt` | Monthly | 45 days | 60 days |
| `bls-regional-cpi.json` | `fetchedAt` | Monthly | 45 days | 60 days |
| `snap-participation.json` | `fetchedAt` | Monthly (national) | 45 days | 60 days |
| `current-food-access.json` | `meta.computed` | Quarterly | 120 days | 180 days |
| `snap-retailers.json` | `meta.updated` | Quarterly | 120 days | 180 days |
| `food-insecurity-state.json` | `meta.updated` | Annual | 14 months | 18 months |
| `food-bank-summary.json` | `fetchedAt` | Annual | 14 months | 18 months |

**Excluded from monitoring** (rarely change): `county-index.json`, `us-states-geo.json`, `counties/*.json`

### How to Check Freshness

**Manual check:** Open each JSON file and inspect the timestamp field listed above.

**Recommended future automation:** A Node.js script that reads each file, extracts the timestamp, compares against today's date, and outputs a status table. This could be:
1. Run locally as part of a periodic maintenance review
2. Added as a GitHub Action that runs monthly and opens an issue if any file exceeds its stale threshold
3. Added as a SiteGround cron job for production cache monitoring

### Dashboard Freshness Badges

The dashboards already display freshness status via `updateFreshness()` in `dashboard-utils.js`. This function shows either:
- **Static mode** (`_static: true`): displays "Data: {year}" -- indicates data from the static JSON file
- **Live mode**: displays "Live" with a green indicator -- indicates successful API proxy refresh

These badges are user-facing but not monitored server-side. A stale static file will still show "Data: 2024" without any warning.

---

## API Health Monitoring

### Current Coverage

The `rate-limit-status.php` endpoint tracks API call counts for services with rate limits:

| Service | Tracked Limit | Period |
|---|---|---|
| BLS | 450/day | Daily |
| Census SAIPE | 45/day | Daily |
| CDC PLACES | 900/day | Daily |
| FRED | 500/day | Daily |
| Mapbox | 90,000/month | Monthly |
| Charity Navigator | 90,000/day | Daily |

**Access:** `GET https://food-n-force.com/api/rate-limit-status.php`

### Monitoring Gaps

1. **No cache age visibility.** The rate-limit endpoint shows call counts but not how old the cached responses are. When proxies serve stale cache (because the upstream API failed), this is invisible.

2. **Silent fallback to stale cache.** All proxies gracefully return cached data when upstream APIs fail. This is correct behavior for user experience but means broken upstream APIs can go undetected for days.

3. **Untracked services.** Census ACS (`dashboard-census.php`) and Census SDOH (`dashboard-sdoh.php`) have no rate limit tracking and no rate limiter integration. ProPublica search and org endpoints are also untracked.

### Recommended Improvements (Future Stories)

- Add a "cache freshness" section to `rate-limit-status.php` that reports the modification time of the most important cached files
- Log when a proxy serves stale cache (e.g., write a `_stale_log.json` file with timestamps and service names)
- Add Census ACS and SDOH to rate limit tracking as a precaution, even without hard limits

---

## Alerting Recommendations

Conditions that require human action, ordered by priority.

| Condition | Priority | Detection Method | Action |
|---|---|---|---|
| API rate limit >95% of daily cap | **Critical** | Check `rate-limit-status.php` | Investigate unexpected traffic; temporarily increase cache TTLs |
| API rate limit >80% of daily cap | **High** | Check `rate-limit-status.php` | Monitor; consider extending cache TTL for affected service |
| USDA ERS publishes new food security report | **High** | Manual check (December) | Update `food-insecurity-state.json` per [runbook 3A](data-refresh-runbook.md#3a-food-insecurity-state-data) |
| BLS CPI file >45 days old | **Medium** | Check `fetchedAt` field | Run `refresh-bls-regional.js` per [runbook 1A](data-refresh-runbook.md#1a-bls-food-cpi-data) |
| SNAP participation file >45 days old | **Medium** | Check `fetchedAt` field | Check FNS website per [runbook 1B](data-refresh-runbook.md#1b-snap-national-participation-update) |
| Census ACS new vintage available | **Medium** | Check Census release schedule (September/December) | Coordinated update per [runbook 3D](data-refresh-runbook.md#3d-census-acs-year-update-coordinated) |
| CHR publishes new rankings | **Medium** | Check CHR website (March) | Import per [runbook 3C](data-refresh-runbook.md#3c-county-health-rankings-import) |
| Food access file >120 days old | **Low** | Check `meta.computed` field | Re-run per [runbook 2A](data-refresh-runbook.md#2a-food-access-recompute) |
| API key approaching expiration | **Low** | Provider notification | Rotate per [runbook 4B](data-refresh-runbook.md#4b-api-key-rotation) |

### Structural Risks

| Risk | Impact | Mitigation |
|---|---|---|
| USDA ERS food security report discontinued | Core dataset (`food-insecurity-state.json`) cannot be updated with official federal data | Monitor for program resumption; Feeding America and Columbia University provide alternative estimates; label data as "last official: 2024" if no update by end of 2026 |
| Census year hardcoded in PHP proxies | 4 PHP files + 1 script all reference `2023`; forgetting one causes data inconsistency | Treat as a single coordinated task in the runbook; test all SDOH charts after update |
| BLS CPI Oct 2025 null | Chart gap bridged with `connectNulls` | Self-resolving; subsequent months fill in. Remove workaround note when 2025 data is complete |
| ProPublica IRS 990 lag | 12-18 months behind actual filings | Structural limitation; no mitigation possible. Document clearly in UI |

---

## Caching Optimization

### Current State & Recommendations

| Proxy | Current TTL | Upstream Update Freq | Recommendation | Rationale | API Call Reduction |
|---|---|---|---|---|---|
| `dashboard-census.php` | 86,400s (24h) | Annual | **Increase to 604,800s (7 days)** | ACS data changes once per year. 24h cache causes ~365 unnecessary refreshes. | ~85% |
| `dashboard-saipe.php` | 86,400s (24h) | Annual | **Increase to 604,800s (7 days)** | Same as Census ACS. | ~85% |
| `dashboard-sdoh.php` | 86,400s (24h) | Annual | **Increase to 604,800s (7 days)** | Same as Census ACS. SDOH makes 2 API calls per cache miss (50-var limit), so savings are doubled. | ~85% |
| `dashboard-places.php` | 86,400s (24h) | Annual | **Increase to 604,800s (7 days)** | CDC PLACES updates annually. Also reduces pressure on the 900/day rate limit. | ~85% |
| `nonprofit-search.php` | 86,400s (24h) | Annual (IRS lag) | **Increase to 259,200s (3 days)** | Search results don't change hourly. 3 days keeps results reasonably fresh for active users. | ~66% |
| `nonprofit-org.php` | 604,800s (7d) | Annual (IRS lag) | **Increase to 1,209,600s (14 days)** | Individual org IRS 990 data changes at most annually. 14 days is still conservative. | ~50% |
| `dashboard-bls.php` | 604,800s (7d) | Monthly | **Keep 604,800s (7 days)** | Appropriate. Monthly BLS release + 3-week lag means 7-day cache catches updates within 1 week. | -- |
| `dashboard-fred.php` | 604,800s (7d) | Varies | **Keep 604,800s (7 days)** | Mix of monthly and annual series; 7 days is a good balance. | -- |
| `charity-navigator.php` | 604,800s (7d) | Infrequent | **Keep 604,800s (7 days)** | Ratings update a few times per year. | -- |
| `mapbox-geocode.php` | 2,592,000s (30d) | Static addresses | **Keep 2,592,000s (30 days)** | Appropriate for geocoding results. | -- |

### Cache Cleanup Optimization

**Current:** `cache-cleanup.php` deletes files older than 30 days (`$maxAge = 30 * 86400`).

**Issue:** Mapbox geocoding cache has a 30-day TTL, meaning files are cleaned up at exactly the moment they expire. A visitor requesting the same geocode result on day 31 gets a cache miss unnecessarily.

**Recommendation:** Increase cleanup threshold to **45 days** (`$maxAge = 45 * 86400`) to provide a buffer beyond the longest cache TTL.

### Implementation Priority

These caching changes are low-risk (only affect how long cached API responses are served) and can be applied independently:

1. **High value, easy:** Census ACS/SAIPE/SDOH + CDC PLACES (4 files, change one constant each)
2. **Medium value:** ProPublica search + org (2 files)
3. **Low priority:** Cache cleanup threshold (1 file)

These changes should be tracked as a separate Jira story since KAN-87 is a documentation/strategy story.
