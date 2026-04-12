# Dashboard Final Audit — Playbook (v4)

**Playbook location:** `C:/Users/luetk/.claude/plans/recursive-tinkering-summit.md` (this file). After approval, copy to `docs/current/dashboard-final-audit-playbook.md` as the canonical long-term reference so re-runs from any worktree or machine can find it.

**Wall-clock expectation:** 20–40 minutes from dispatch to synthesis. Playwright agents serialize through a single browser instance (see Dispatch section). Do not interrupt mid-run thinking it's stuck.

**Prompt size:** each sub-agent receives a ~3KB inlined slice (Context + Risk ranking + Prior-pattern priming + full Out-of-scope + Evidence rule + lane-specific sections). This is intentional — sub-agents have no shared context, no memory access, and no file this file is referenced from. Do not abbreviate to "save tokens." Repetition across 10 prompts is the cost of parallelism.

---

## Context

Final audit sweep on 8 dashboards before we stop auditing. Risk-weighted, evidence-required, role-scoped, serialized where MCP contention demands it.

---

## Risk ranking — weight effort 60/30/10

**HIGH (60%)** — recent large changes, cross-dataset coupling, complex state:
- `food-prices.html` — FRED (APU\*) swap, JSON clone gradient history
- `food-access.html` — single-instance map toggle (Deserts/Insecurity/SNAP), dual-mode Double Burden
- `food-insecurity.html` — 12 charts, cross-dataset loads, county drill-down
- `food-banks.html` — rank-norm heatmap, regression suppression at \|r\|<0.2
- `nonprofit-profile.html` — 6 charts + peer comparison, ProPublica dependency

**MEDIUM (30%)** — `snap-safety-net.html`, `nonprofit-directory.html`
**LOW (10%)** — `executive-summary.html`

---

## Prior-pattern priming (inlined — these are the failure shapes to prime your eye)

Prior audits have surfaced these patterns repeatedly. They are **not** an exclusion list — re-check them, but expect them:

- **Copy contradicting chart** after methodology/source swaps (text panel still claims the old framing)
- **Field-name drift** when swapping JSON sources — causes silent NaN downstream
- **Gradient loss** after JSON clone in toggle flows (gradient config not re-applied)
- **Hardcoded year strings** in labels drift out of sync with live data
- **Regression lines shown when \|r\| < 0.2** — visual noise masquerading as signal
- **Outlier compression in heatmaps** pre-rank-norm (one state swallows the gradient)
- **Blocking `await`s before first paint** — should be render-static → enrich-background via `getOrCreateChart()`
- **Duplicate chart instances** on toggles where a single instance should be reused
- **Cross-dataset feature reliance** — food-insecurity pulls from food-access + food-bank-summary; schema drift in dependency breaks downstream
- **Freshness label two-state logic** (`_static` → "Data: year"; else → "Live") wired inconsistently across charts
- **Counter animations ignoring `prefers-reduced-motion`**
- **Sankey data source correctness** (must load from `snap-participation.json`)
- **FRED vs BLS series ID confusion** — FRED uses `APU*`, not `CUUR*`
- **Tooltip / legend / z-index / overlap regressions** on responsive breakpoints

Prime your eye for these. Do not file them as findings unless you find a fresh instance.

---

## Hard out-of-scope (inlined — drop findings matching any bullet)

**Protected effects (CLAUDE.md):**
- Logo CSS animations, gradients, transforms
- Background mesh/iridescent spinning effects on index/services/resources/about
- Glassmorphism: `backdrop-filter`, `-webkit-backdrop-filter`, `rgba()` backgrounds on nav/hero/cards
- Blue circular gradients behind emoji icons
- Text content, emoji icons, or section order unless directly wrong

**Already-deferred P1 (each needs its own session):**
- CSS bundle split (PR 11), `renderMap()` split (PR 13), test suite overhaul (PR 15), Vite 6 upgrade (PR 21)

**Already-deferred P2:**
- Test bundle slimming (P2-17/19/20), Sentry Replay (P2-14), food-access refactor (P2-21/22 shipped), npm cache policy (P2-32), blog CTA migration (P2-40), GA4 infra verification (P2-43), P2-45

**Already-deferred UI/UX backlog:**
- Exec-summary gradient token extraction, SNAP year string hardcoded in 3 places, regional baseline legend swatch

**Already-tracked (don't re-file):**
- CSP `'unsafe-inline'` safety net — Session 7 removes it
- `_headers` file is dead code pending deletion
- P3-13 waits on CSP enforcement; P3-19/20 pending user input
- Dashboard HTML no-cache rule enforced via `.htaccess`

**Out-of-scope topics:** anything in `blog/`, core pages, admin/scraper tools.

---

## Evidence rule

No evidence → not a finding. Every reported issue includes AT LEAST ONE of: `file:line`, Playwright screenshot path, `curl`/network log, console error text, failing test assertion. Main agent rejects evidence-less findings during synthesis.

---

## Agent lane table

| Agent | Owns | Does NOT own | Tools | Checkpoint at |
|---|---|---|---|---|
| **data-analytics-auditor** | JSON schema, field mappings, freshness, API source authority (FRED `APU*` vs BLS `CUUR*`), calculation correctness — **what the number IS** | What the number MEANS | Read, Grep, Bash (curl) | 30 calls |
| **data-scientist** | Copy-vs-chart integrity (re-read every subtitle/insight/tooltip against rendered chart), statistical validity, baseline honesty — **what the number MEANS** | Data source correctness, a11y | Read, Grep | 30 calls |
| **uiux-reviewer** | Visual: legends, tooltips, z-index, overlap, responsive, empty/loading/error states, contrast on data tiles. **Baseline: 15 screenshots (5 HIGH dashboards × 3 breakpoints) before investigation** | WCAG semantics, copy | Playwright MCP, Read | 80 calls |
| **accessibility-auditor** | WCAG 2.2 AA: keyboard walkthrough, aria-live, focus order/trap, reduced-motion, screen reader labels, Lighthouse a11y | Visual polish unrelated to a11y | Playwright MCP, Lighthouse MCP, Read | 50 calls |
| **performance-budget-monitor** | Bundle sizes vs budgets, chart init cost, TTI | Code quality | Lighthouse MCP, Bash | 20 calls |
| **technical-architect** | Non-blocking API pattern, cross-dashboard consistency, SLDS CDN constraints, `getOrCreateChart()` usage, gradient-after-clone preservation, build pipeline | Security, a11y | Read, Grep | 30 calls |
| **php-security-reviewer** | All 10 proxies in `public/api/` — CORS, rate limits, validation, CSRF, header injection | Front-end | Read, Grep | 20 calls |
| **test-engineer** | Per-dashboard coverage gaps against regression checklist | Finding new bugs | Read, Grep, Bash | 20 calls |
| **red-team** (general-purpose) | Break each dashboard — run all 11 scenarios below | Passive review | Playwright MCP | 70 calls |
| **journey-auditor** (general-purpose) | End-to-end task completion; authorized to issue "Wrong job" verdict | Component nitpicks | Playwright MCP, Read | 40 calls |

**Checkpoint semantics** (not a hard cap): at the listed call count, the agent pauses, decides whether to continue, and notes why in the report. Continuation is the default when active investigation has yield. Stopping is the default when diminishing returns have set in.

**Boundary tiebreaker:** data-analytics-auditor owns **what the number IS** (source, field, calculation). data-scientist owns **what the number MEANS** (framing, copy, statistical honesty).

---

## Regression checklist — proof-of-fix or ABSENT

Responsible agent cites `file:line` implementing the fix, OR marks **ABSENT** and flags severity. No ticking without citation.

1. Data field names normalized at JSON intake — normalization function
2. FRED series use `APU*` IDs — series-ID constant
3. No hardcoded years in SNAP coverage labels — grep current year
4. `updateFreshness()` two-state logic wired per chart — each call site
5. `animateCounters()` respects `prefers-reduced-motion` — media query check
6. Regression lines suppressed at `|r| < 0.2` with dynamic insight copy — threshold constant
7. Heatmaps use `createRankNorm()` — each usage
8. Food-access map toggle reuses one chart instance — `getOrCreateChart()` call
9. Double Burden treemap/grid toggle — mode switch
10. FRED JSON clone preserves gradient after toggle — gradient restoration
11. Sankey loads from `snap-participation.json` — fetch site
12. Nonprofit Profile 6-chart set + peer comparison — each chart init
13. Non-blocking API pattern on every dashboard — pattern per module
14. **No `await` before first paint** — technical-architect traces the init path per dashboard module (**trace, not grep** — `await` is legitimate after first paint; only pre-paint awaits count). Report: init function name, first-paint line, any awaits before it.

---

## Red-team scenarios (all 11, HIGH-risk dashboards only)

1. Disconnect network mid-load
2. Throttle to slow 3G for first paint
3. API returns `[]`
4. API returns `{}` / `null`
5. API returns HTTP 500
6. Rapid-fire toggle clicks (race conditions)
7. Browser back/forward after drill-down
8. Deep-link directly to drilled-down state
9. Resize 1440px → 375px with chart already rendered
10. Keyboard-only traversal through every interactive element
11. URL param fuzzing (bogus state in query string)

Each scenario: pass/fail per HIGH-risk dashboard, screenshot evidence on fail.

---

## Journey audit (HIGH-risk dashboards)

Seed questions (not a fixed script):
- **food-insecurity**: grant writer wants 3 worst-insecurity counties + SNAP coverage gap in their state
- **food-prices**: report writer wants eggs vs overall food CPI since 2020
- **food-access**: mobile-pantry operator wants worst food deserts + nearest SNAP retailers
- **food-banks**: board member wants revenue-per-insecure-person vs peers
- **snap-safety-net**: analyst wants to know how much SNAP closes the meal gap
- **nonprofit-profile**: donor wants financial health vs peers

**Three verdicts per dashboard:**
1. **Job completed** — path works (list friction)
2. **Path broken** — dashboard was designed for this job but the path fails → P0/P1 finding with fix-the-path recommendation
3. **Wrong job** — dashboard genuinely not designed to answer this question → **P2 finding tagged `scope`**, with one suggested resolution from: **(a)** rewrite the dashboard's stated purpose / header copy so the visitor's expectation matches, **(b)** add the missing view/chart/filter, or **(c)** remove this journey from audit expectations (out of scope). Pick one; do not hedge.

---

## Brainstorm meta-prompts (final ~10% of each agent's budget)

- What would a **first-time visitor** misread on this chart?
- What breaks if the **API returns empty**?
- What assumption does the copy make that the data doesn't support?
- What's the **worst reading** a hostile reader could extract?
- Where is it **technically correct but rhetorically misleading**?
- What would a **domain expert** (food bank director, epidemiologist, public health analyst) immediately dismiss as naive?
- What **default state** is showing, and is it the most useful one?

---

## Per-agent output format

**Deep-review agents** (data-analytics-auditor, data-scientist, uiux-reviewer, technical-architect, red-team, journey-auditor):
- Findings list: severity (P0/P1/P2/P3), dashboard, evidence citation, what's wrong, why it matters, suggested fix
- Verdict per HIGH-risk dashboard: GREEN / YELLOW / RED + one-line justification
- **"Checked and found clean" — max 5 bullets**. Each bullet is one specific thing you deliberately examined and dismissed. Not a scope recap, not a summary of coverage. If you can't name 5 specific dismissals, write fewer.
- "Could not verify" — explicit tooling/context gaps

**php-security-reviewer**: per-endpoint table — endpoint / CORS / rate limit / validation / CSRF / verdict
**test-engineer**: per-module table — regression item / test exists Y/N / file:line
**performance-budget-monitor**: per-bundle table — path / budget / actual / delta / status
**accessibility-auditor**: per-dashboard — Lighthouse a11y score, keyboard pass/fail, aria-live pass/fail, reduced-motion pass/fail, specific violations with evidence

---

## Dispatch procedure — two waves (MCP contention fix)

**The parallel dispatch is a lie if all 10 agents run at once.** Playwright MCP drives a single browser instance; 4 agents contending for it (uiux, a11y, red-team, journey) will serialize invisibly or time out. Lighthouse MCP has the same contention across a11y and perf-budget. Fix by staging:

### Wave 1 — 5 agents in parallel (no browser, no Lighthouse)
Dispatch in a single message, 5 `Agent` tool calls:
1. data-analytics-auditor
2. data-scientist
3. technical-architect
4. php-security-reviewer
5. test-engineer

Wait for all 5 to return. ~5–15 min wall clock.

### Wave 2 — 5 agents serialized (browser-dependent, one at a time)
Dispatch sequentially, one `Agent` call at a time, waiting for each to complete before the next:
1. **uiux-reviewer** (Playwright) — runs first because its 15-screenshot baseline is the largest browser workload and its findings inform later agents' framing
2. **accessibility-auditor** (Playwright + Lighthouse) — keyboard walkthrough + Lighthouse a11y
3. **red-team** (Playwright) — break scenarios
4. **journey-auditor** (Playwright) — end-to-end task attempts
5. **performance-budget-monitor** (Lighthouse) — bundle sizes, TTI, runs last so Lighthouse isn't fighting a11y

~15–25 min wall clock for Wave 2.

### Each Agent call prompt (~3KB, inlined — do not abbreviate)
Construct each `Agent` tool call's `prompt` parameter to include:
1. Context + Risk ranking (full)
2. Prior-pattern priming (full — inlined bullets, no file references)
3. Hard out-of-scope (full — inlined bullets)
4. Evidence rule (full)
5. That agent's row from the lane table + checkpoint semantics + boundary tiebreaker
6. Lane-relevant sections: regression checklist (auditor/architect/test-engineer), red-team scenarios (red-team), journey section (journey-auditor), brainstorm prompts (all)
7. Role-specific output format for that agent

Repetition across 10 prompts is intentional. Sub-agents have no shared context.

---

## Main-agent synthesis

1. **De-duplicate** across agents; cluster by root cause
2. **Reproduce P0s — targeted, non-optional:**
   - Pick one P0 each from **data-scientist**, **red-team**, **journey-auditor** (the three most hallucination-prone lanes)
   - If fewer than 3 P0s exist in those lanes → substitute most-expensive-to-fix-if-wrong P0 from any lane
   - **If zero P0s exist across all 10 agents → reproduce 3 P1s instead.** Zero-P0 is exactly when hallucination is most likely; the step is non-optional.
   - Can't reproduce → demote or drop
3. **Cross-reference** against the inlined out-of-scope list. Drop known-deferred duplicates.
4. **Rank** by severity × blast radius. P0/P1/P2 discussed individually.
5. **P3 findings** appended as raw list at the end of the report, not discussed inline.
6. **Call out contradictions** between agent reports — interesting bugs hide there
7. **Fix sequence**: ship-first / fix-soon / defer, one-sentence rationale each
8. **Honest state paragraph** — solid → one line; broken → spend the words there. No victory lap.
