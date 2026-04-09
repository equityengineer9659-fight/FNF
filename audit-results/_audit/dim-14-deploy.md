# Dimension 14: Deployment & Caching Safety Audit
**Date**: 2026-04-09
**Auditor**: devops-engineer agent (read-only)

---

## Blockers

**[P0] _headers HTML cache policy contradicts .htaccess**
- Evidence: `_headers:19` sets `Cache-Control: public, max-age=3600, must-revalidate` for `/*.html`
- `public/.htaccess:5` correctly sets `no-store, no-cache, must-revalidate` for HTML
- `_headers` is a Netlify/Cloudflare Pages format file and has **no effect on SiteGround** (Apache/LiteSpeed). It is not deployed by rsync (not in `dist/`). But its existence is a documentation hazard — a future engineer may assume HTML is safely restricted to 1h cache when it is not enforced at the CDN/proxy layer.
- **Risk**: If SiteGround is ever fronted by Cloudflare (common upsell), `_headers` would activate at 1h TTL for HTML rather than no-cache. Combined with rsync --delete + Vite hashed assets, this breaks the site.
- **Recommendation**: Either delete `_headers` or add a comment clarifying it is inert on SiteGround. If Cloudflare is adopted, update `/*.html` to `no-store, no-cache`.

**[P0] Live API keys committed in public/api/_config.php**
- Evidence: `public/api/_config.php:13` — BLS key `553b34352...` hardcoded; `public/api/_config.php:20` — Mapbox public token hardcoded; `public/api/_config.php:25` — FRED key `74900dce...` hardcoded.
- The file is gitignored (`.gitignore:47`) so it is not in the repo history. However, it exists on disk and **rsync --delete will deploy it to `public_html/api/_config.php`** from the runner's working directory only if the runner checks it out. Since the deploy job uses `actions/download-artifact@v5` (not `checkout`), the file does NOT ship from CI. But any developer running `rsync` locally from the working directory would deploy the dev keys file, overwriting the CI-written one.
- The CI workflow correctly regenerates `_config.php` via `printf` + `scp` after rsync (`ci-cd.yml:127-130`). That path is safe.
- **Recommendation**: Rotate the BLS and FRED keys as a precaution given they are stored in plaintext on developer machines. Add a comment to `_config.php` warning against local rsync deploys.

---

## Warnings

**[P1] No `--exclude` guard on `_config.php` in rsync**
- Evidence: `ci-cd.yml:119-121` — `rsync -avz --delete dist/ ...public_html/` with no `--exclude` flags.
- `dist/api/_config.php` ships from CI and contains the correctly-written secrets. The rsync `--delete` will remove any file on the server not in `dist/`, including a manually placed `_config.php` if the CI scp step failed mid-deploy.
- **Risk**: If `scp` at line 130 fails silently (scp exit code is not checked), the server runs without `_config.php`, causing all dashboard API proxies to error 500.
- **Recommendation**: Add `|| { echo "scp _config.php failed"; exit 1; }` after the scp command. Consider also adding `--exclude 'api/_config.php'` to rsync and relying solely on the scp path for config delivery.

**[P1] `actions/checkout@v6` and `actions/setup-node@v5` — versions do not exist**
- Evidence: `ci-cd.yml:22` uses `actions/checkout@v6`; `ci-cd.yml:26` uses `actions/setup-node@v5`. As of 2026-04-09, latest stable is `checkout@v4` and `setup-node@v4`.
- **Risk**: GitHub Actions will fail to resolve these versions and the entire pipeline breaks.
- **Recommendation**: Pin to `actions/checkout@v4` and `actions/setup-node@v4`.

**[P1] `actions/upload-artifact@v5` and `actions/download-artifact@v5` — versions do not exist**
- Evidence: `ci-cd.yml:62` / `ci-cd.yml:80`. Latest stable artifact actions are `@v4`.
- Same risk as above — pipeline will break on runner resolution.
- **Recommendation**: Downgrade to `@v4`.

**[P2] Node modules cache disabled**
- Evidence: `ci-cd.yml:29` — `cache: ''` explicitly disables npm caching.
- **Risk**: Every CI run performs a full `npm install` (slow, bandwidth waste, potential rate-limit on npm registry).
- **Recommendation**: Set `cache: 'npm'` unless there is a deliberate reason to disable it.

**[P2] No `concurrency:` group on deploy job**
- Evidence: `ci-cd.yml` has no `concurrency:` block at workflow or job level.
- **Risk**: Two pushes in quick succession trigger two parallel deploys to `public_html/`. The second rsync `--delete` can delete files the first deploy just wrote while the post-deploy scp is in flight.
- **Recommendation**: Add `concurrency: { group: deploy-production, cancel-in-progress: false }` to the deploy job.

**[P2] Health check does not assert critical sub-pages**
- Evidence: `ci-cd.yml:147` — health check only GETs `https://food-n-force.com` (homepage).
- **Risk**: A broken PHP API or missing asset would not be caught. A deploy that wipes `api/` would still pass the health check.
- **Recommendation**: Add spot checks for `/dashboards/executive-summary.html` and `/api/csrf-token.php` (expect 200/non-500).

---

## Verified Safe

- `public/.htaccess` HTML caching: `no-store, no-cache, must-revalidate` — correct (`:5`)
- `public/.htaccess` hashed asset caching: `max-age=31536000, immutable` for `.css`/`.js` — correct (`:9`)
- `public/.htaccess` `_cache` deny rule: `RedirectMatch 403 ^/_cache/` — present (`:17`)
- `dist/` contains no `.map` files, no `.env*`, no dev tooling — clean artifact
- `_config.php` is gitignored (`.gitignore:47`) — not in VCS
- CI writes `_config.php` via `printf`+`scp` rather than echoing secrets into shell commands — secrets protected from process inspection
- All 4 API keys (BLS, MAPBOX, FRED, CHARITY_NAVIGATOR) are referenced as GitHub Secrets in the deploy env block (`ci-cd.yml:91-94`)
- Jira `in-progress` / `in-review` / `done` transitions are all present and use `continue-on-error: true` so Jira failures never block deploys
- Jira transitions correctly skip when no `KAN-` key found in branch/PR title
- `rsync --delete` is scoped to `dist/` only — no risk of deleting outside `public_html/`
- SSH key is loaded via ssh-agent and passphrase handled via temp askpass script (no secret in command args)

---

## Recommendations

1. Run a key rotation for BLS (`553b343...`) and FRED (`74900dc...`) — both are stored in plaintext on developer machines and in git history **if** the file was ever accidentally committed before the gitignore was added. Verify with `git log --all --full-history -- public/api/_config.php`.
2. Add a staging environment deploy job (trigger: push to `staging` branch) so production deploys are not the first real rsync test.
3. Add `fail-fast: true` behavior to the deploy by checking scp exit code explicitly.
