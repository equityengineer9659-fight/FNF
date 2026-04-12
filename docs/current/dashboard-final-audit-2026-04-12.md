# Dashboard Final Audit — Synthesis Report

**Date:** 2026-04-12
**Playbook:** [docs/current/dashboard-final-audit-playbook.md](dashboard-final-audit-playbook.md)
**Method:** 10 specialized agents, 2 waves (5 parallel non-browser + 5 serialized browser), ~45 min wall clock
**Verification:** 3/3 top findings reproduced against source before synthesis

---

## P0 — Ship-blocking

### P0-1. nonprofit-profile Peer Comparison is permanently dead for every organization
- **Source:** journey-auditor; reproduced against [src/js/dashboards/nonprofit-profile.js:1386](../../src/js/dashboards/nonprofit-profile.js#L1386) and [public/api/nonprofit-search.php](../../public/api/nonprofit-search.php)
- **Bug:** Line 1386 filters `p.total_revenue > 0`. ProPublica search endpoint never returns `total_revenue` (grepped — zero references in the proxy). Every peer is dropped → `peers.length < 3` → section stays `hidden`. The page `<title>` literally says "Peer Comparison" but it fires for zero orgs.
- **Why it matters:** The headline feature of the page is advertised to donors and silently missing on 100% of visits. This is exactly the "field-name drift → silent failure" pattern from prior audits. The test-engineer flagged item 12 as PARTIAL coverage; no test caught this because existing tests only check `hidden` class removal paths.
- **Fix:** Hydrate peer revenues via a second pass — fetch `/api/nonprofit-org.php?ein=X` for the top 10 search hits and derive revenue from the filings array. Slower but correct. Alternative: build a static state-peer-median JSON at build time.

### P0-2. food-access mode toggle collides with state drill-down
- **Source:** journey-auditor; reproduced against [src/js/dashboards/food-access.js:1537,1543](../../src/js/dashboards/food-access.js#L1537)
- **Bug:** Clicking any map-mode button calls `mapCtrl.setDrillDown(false)` unconditionally, wiping the current state focus back to national. But the state dropdown retains its value, so the UI reads "Texas" while the map shows US. Re-selecting TX then flips the mode via the dropdown's change handler. State and mode are coupled where they should be orthogonal axes.
- **Why it matters:** A mobile-pantry operator drilled into TX cannot view SNAP retailer density for TX counties — the act of switching modes destroys their context. Only 1 of 6 viable mode×state combinations works reliably.
- **Fix:** Decouple. Preserve `currentStateFips` across mode toggles; re-apply the drill-down after rendering the new mode. Test matrix: {Deserts, Insecurity, Retailers} × {National, any state}.

---

## P1 — Fix soon

### Cluster A — `createChart` vs `getOrCreateChart` inconsistency (root cause for 3+ agent findings)
- **Sources:** red-team runtime evidence (2 ECharts duplicate-init warnings on food-insecurity, 5 on food-prices), tech-architect static analysis, test-engineer coverage gap (item 8 partial)
- **Runtime proof:** Red-team captured `[ECharts] There is a chart instance already initialized on the dom` from `_trySAIPE → fetchSAIPEPoverty` at [src/js/dashboards/food-insecurity.js:1809](../../src/js/dashboards/food-insecurity.js#L1809) and `fetchBLSData` at [src/js/dashboards/food-insecurity.js:1770](../../src/js/dashboards/food-insecurity.js#L1770)
- **Bug:** food-prices, food-insecurity, food-banks use raw `createChart()` inside re-renderable functions. Live-data upgrade paths (`fetchLiveBLS`, `_trySAIPE`) re-call those renders, double-initializing ECharts and leaking instances into the shared `charts[]` array. `handleResize` then fires on dead copies.
- **Control group:** food-access is clean — uses `getOrCreateChart()` consistently. The helper already exists and is tested.
- **Fix:** Replace `createChart(id)` → `getOrCreateChart(id)` in every `renderXxx()` that can be called >1 time. ~20-line change across 4 files.

### Cluster B — Silent hang on slow/no network (4 HIGH-risk dashboards)
- **Source:** red-team; reproduced against food-access.js — grepped `AbortController|signal:` → **zero matches**
- **Bug:** `init()` wraps `Promise.all([fetch static JSON])` in try/catch with **no deadline**. A never-resolving fetch (or a network stall) leaves the try block hanging forever; catch never fires; no loading UI visible. User sees the page header and empty chart containers indefinitely. food-banks is worst — blank black columns with no text at all.
- **Fix:** Wrap initial `Promise.all` with `AbortController` + 15s `setTimeout(() => abort())`. Add a "Loading dashboard data…" placeholder in each chart container that converts to error UI on timeout.

### Cluster C — Copy-vs-chart contradictions (5 instances, systemic pattern)
The signature failure pattern from prior audits surfaced again. All 5 from data-scientist:

- **P1** food-insecurity county tooltip hint attributes modeled estimates to "County Health Rankings 2025" — actually derived from internal `fiRate = 0.75 * povertyRate + 2.5` formula. False credibility on a figure grant writers will cite. [src/js/dashboards/food-insecurity.js:203](../../src/js/dashboards/food-insecurity.js#L203)
- **P2** food-prices static HTML narrative at [dashboards/food-prices.html:399](../../dashboards/food-prices.html#L399) asserts "SNAP +55% vs food +37%" and concludes SNAP outpaced food — directly contradicted by the dynamic `purchasing-power-insight` element below it when `gap > 0`
- **P2** food-insecurity HTML hardcodes `r ≈ 0.92` and "#1 predictor" in `#scatter-insight` at [dashboards/food-insecurity.html:329](../../dashboards/food-insecurity.html#L329) — JS overwrites it on load but the static value survives JS failure
- **P2** food-banks "correlation is weak — infrastructure follows wealth" insight at [dashboards/food-banks.html:230](../../dashboards/food-banks.html#L230) is attached to the diverging-bar Resource Gap chart, which computes no correlation at all. The claim belongs on Chart 6 where the scatter lives
- **P2** food-access Chart 4 title "Distance Is the Primary Food Access Barrier" plots `avgDistance` vs `lowAccessPct` — but `lowAccessPct` is defined by a distance threshold, so the correlation is mathematically forced, not empirical. A domain expert would dismiss this instantly

**Fix:** Sweep all static HTML insight text on HIGH dashboards; either replace with dynamic population or remove specific numbers. Consider a CI lint that flags numeric claims in dashboard HTML.

### P1 — Other
- **nonprofit-profile empty-state h1 mismatch** — uiux + red-team. On `?ein=` or missing EIN, h1 reads "Loading organization..." while the error panel says "No organization specified." [src/js/dashboards/nonprofit-profile.js:1361](../../src/js/dashboards/nonprofit-profile.js#L1361) `showError()` never updates `#org-name`
- **food-insecurity CSV export ignores county drill-down** — always exports 51 state rows even when user is viewing CA counties
- **food-insecurity county-search combobox appears non-functional** — journey-auditor typed "imperial county" and got no dropdown; needs handler debug
- **food-insecurity county insight surfaces only #1 county** — grant writers asking "top 3 counties" have no ranked list path
- **FRED proxy unbounded series-ID length** (php-sec P1) — [public/api/dashboard-fred.php:56](../../public/api/dashboard-fred.php#L56) — cache spam + quota depletion via 10K-char alphanumeric injection. One-line fix: cap at 30 chars

---

## P2 — Defer or batch

### Accessibility (cluster F — build-components.js injection)
- `aria-current="page"` on main-nav Dashboards link always points to food-insecurity.html — **factually wrong on 7 of 8 dashboard pages**. Screen readers announce "current page" for a link that navigates away. Fix in [build-components.js](../../build-components.js): use `aria-current="true"` for in-section indicator or match per-page href
- `<div class="dashboard-hero__stats" aria-label="...">` pattern — `aria-label` on plain div with no role is spec-invalid and silently ignored by AT. 8 instances, all injected by build-components.js. Add `role="group"`
- `<button>` missing `type="button"` — multiple dashboards
- `&` not encoded as `&amp;` in "SNAP & Safety Net" tab label — injected by build-components.js
- food-access Double Burden tiles (`role="listitem"`) have no `tabindex`/keyboard handlers — browse-only via mouse hover, unreadable to keyboard/SR users
- `.directory-chip` buttons have no `:focus-visible` rule in [src/css/12-nonprofit-directory.css](../../src/css/12-nonprofit-directory.css)

### Visual polish (cluster E — 375px breakpoint)
- food-access map-mode toggle wraps 2+1 at 375px, making "SNAP Retailers" look disconnected
- food-prices FRED toggle row tight at 375px, breaks at sub-360px
- food-banks heatmap tiles risk clipping at right edge due to card `overflow: hidden`
- food-insecurity drill-down back button layout tight at 375px

### Security (php-sec)
- Mapbox query uncapped length — cache spam risk
- nonprofit-search query uncapped length — cache spam risk
- Rate limiter is global not per-IP — one abusive client can exhaust daily FRED/PLACES/BLS/SAIPE quota for all visitors

### Journey — scope findings (pick-one resolution per playbook)
- **food-access "nearest SNAP retailers"** — resolution (a): rewrite SNAP Retailers mode copy to say "state-level density only; for retailer locations see USDA SNAP Retailer Locator"
- **food-banks "Decisions It Supports" copy** — resolution (a): rewrite from "Peer benchmarking against regional food banks" to "State-level revenue-per-insecure-person across regions"; add CTA to nonprofit-profile for org-level

### Performance
- **food-prices CLS 0.056** (fails 0.0000 target, all other dashboards 0.000) — likely a late-loading element without reserved min-height
- **food-access (43.5KB), food-insecurity (40.9KB), nonprofit-profile (35.7KB) over 25KB dashboard chunk budget** — cluster with deferred P2-22 refactor
- **ECharts chunk +14% over budget** (737KB raw / 239KB gzip) — already in deferred P1 queue
- food-prices sunburst legend fires 5 warnings per render (wrong `legend.data` config)

### Analytical
- food-banks DC outlier compresses revenue heatmap gradient — candidate for `createRankNorm()` application
- food-insecurity county tooltip should append `(est.)` suffix to FI rate line

---

## Contradictions between agents

- **Red-team vs Tech-architect on food-prices gradient restoration:** tech-architect flagged the `ppBaseOption` shallow-copy as a potential risk; red-team ran 25× rapid FRED toggles and got zero console errors. Resolution: the gradient restoration code *works* in the current execution order; the architectural risk is real but not currently triggered. Keep the fix but not P0.
- **Data-analytics vs Data-scientist on food-insecurity county tooltip:** data-analytics said "append (est.) suffix" (P2), data-scientist said "the text attributes the source to the wrong institution" (P1). Both are correct — different aspects of the same tooltip. Fix together.
- **Perf scores:** Lighthouse scores 31-52 on localhost are not production-representative. Ignore the absolute scores; TBT and CLS are the environment-neutral metrics worth acting on.

---

## Fix sequence

**Ship first (this week):**
1. **P0-1** nonprofit-profile Peer Comparison — swap to filings-based peer fetch
2. **P0-2** food-access mode × state collision — decouple axes
3. **Cluster A** `createChart` → `getOrCreateChart` in 3 modules (~20 lines)
4. **P1** FRED series-ID length cap (one line in dashboard-fred.php)
5. **P1** food-insecurity county tooltip source attribution

**Fix soon (this sprint):**

6. **Cluster B** AbortController + 15s timeout + loading skeleton (4 dashboards)
7. **Cluster C** Sweep all static HTML insight copy for dynamic contradictions
8. **P1** nonprofit-profile h1 empty-state + CSV drill-down + county search combobox
9. **aria-current="page"** fix in build-components.js + aria-label-misuse cleanup
10. **food-access Double Burden keyboard access**

**Defer:**

- Responsive 375px polish (cluster E) — batch into one small PR
- Perf bundle over-budget — already in deferred queue
- php-sec P2 length caps + global rate-limiter → per-IP → own security session
- Two journey scope findings (copy rewrites) — product/design call

---

## Honest state of the dashboards

The dashboards are **mostly solid but have one dead headline feature and one broken primary interaction**. Those two P0s alone justify one more shipping round. The copy-vs-chart contradictions are the same systemic pattern we've been burned by 4+ times — the fact that 5 fresh instances surfaced in one audit means the current "sweep at ship time" discipline isn't working; either add a CI check that greps HTML for specific numeric claims, or adopt a rule that all insight copy must be JS-populated. The `createChart`/`getOrCreateChart` inconsistency is a one-afternoon cleanup that closes a real runtime leak. Everything else is polish and can wait.

### Verdict per HIGH-risk dashboard (consolidated across all agents)

- **food-prices** — YELLOW. CLS 0.056, duplicate-init warnings, static/dynamic SNAP contradiction, 5 sunburst legend warnings per render. Functional but noisy.
- **food-access** — **RED** (downgraded from individual agent consensus). P0 mode-state collision + silent hang make core journeys impossible. Everything else on this dashboard is actually clean — uses `getOrCreateChart`, passed 60× rapid-toggle test, Double Burden works. One bug is killing an otherwise GREEN dashboard.
- **food-insecurity** — YELLOW. County workflow is the biggest pain point (CSV, top-N ranking, combobox). Static r=0.92 contradiction. Duplicate-init warnings.
- **food-banks** — YELLOW. Correlation-on-wrong-chart insight, DC heatmap compression, blank black column on slow network.
- **nonprofit-profile** — **RED**. Dead Peer Comparison for every org. Empty-state h1 mismatch. Fundraising radar 70% benchmark statistically unjustified across 3 of 4 axes.

---

## P3 raw list (appended, not discussed — 14 items)

1. food-prices absolute-vs-relative category framing (data-sci)
2. food-insecurity SNAP coverage >100% explanation imprecise (data-sci)
3. nonprofit-profile 70% benchmark across all radar axes (data-sci)
4. food-insecurity createChart on renderMap — hygiene only (tech-arch)
5. executive-summary double `animateCounters()` call (tech-arch)
6. Global rate limiter not per-IP (php-sec)
7. dashboard-places SoQL string interpolation (safe but fragile) (php-sec)
8. food-insecurity radar axis labels tight at 375px (uiux)
9. food-prices dual-axis cramped at 375px (uiux)
10. nonprofit-directory pagination buttons missing `aria-current` + Prev/Next aria-label (a11y)
11. Popular search chips no `aria-pressed` (a11y)
12. food-insecurity combobox `prefer-native-element` lint advisory (a11y)
13. food-prices eggs toggle discoverability (buried in SNAP chart) (journey)
14. No URL state for drill-down / map not keyboard-drillable (red-team)

---

## Summary

- **2 P0s** (both RED verdict dashboards: nonprofit-profile peer comparison dead; food-access mode/state collision)
- **~10 P1s** clustered around 3 root causes: createChart/getOrCreateChart inconsistency, no-timeout init pattern, static/dynamic copy drift
- **~25 P2s** mostly a11y, responsive polish, and php-sec hardening
- **14 P3s** appended raw

Cluster A (`createChart` → `getOrCreateChart`) and Cluster B (AbortController + timeout) together are the highest-leverage fixes — one root cause each, 4+ agents converging on the same issues. Start there after the two P0s.
