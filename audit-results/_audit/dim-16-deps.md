# Dimension 16 — Dependency Supply Chain Audit
**Date**: 2026-04-09
**Tool**: npm audit + npm outdated + lockfile inspection
**Total deps**: 14 runtime + 29 dev (1,250 total incl. transitive)
**Advisories**: 0 critical, 8 high, 6 moderate, 7 low (21 total)

---

## Must Fix (runtime, high/critical)

None of the high-severity advisories affect direct **runtime** dependencies. All high-severity findings are in dev/build-tool transitive paths.

---

## Should Fix — Dev High Severity

**[P1] basic-ftp@5.2.0 — FTP Command Injection via CRLF** (GHSA-chqc-8p9q-pq6q, CVSS 8.6)
- Path: transitive dep (via puppeteer or playwright)
- No production exposure (dev-only tooling)
- Fix: wait for upstream to patch; no direct package.json entry

**[P1] braces — Uncontrolled resource consumption** (GHSA-grv7-fg5c-xmjg)
- Path: transitive via live-server/chokidar; live-server@1.2.2 unmaintained since 2020
- Fix: replace live-server with vite preview

**[P1] picomatch <=2.3.1 / 4.0.0-4.0.3 — ReDoS + Method Injection** (GHSA-c2c7-rcm5-vvqj, GHSA-3v7f-55p6-f55p, CVSS 7.5)
- Path: transitive via tinyglobby (inside vite). Partially resolved by upgrading Vite.

---

## Should Fix — Runtime Moderate

**[P2] @anthropic-ai/sdk@0.80.0 — Memory Tool Path Traversal / Sandbox Escape** (GHSA-5474-4w2j-mq4c)
- Declared in dependencies (package.json:121) but used only by dev-only blog scraper
- Affected range: >=0.79.0 <0.81.0; fix at 0.86.1
- Run: npm install --save-dev @anthropic-ai/sdk@^0.86.1 and move to devDependencies

**[P2] vite@5.4.21 — Path Traversal in Optimized Deps .map Handling** (GHSA-4w7w-66w2-5vf9)
- Direct dev dep (package.json:101); not in production bundle
- Fix at vite@6.4.2; Dependabot ignores major bumps (.github/dependabot.yml:26-28), so manual branch test required
- Do NOT use npm audit fix --force (would jump to vite@8, 3 majors ahead, untested)

---

## Should Fix — Dev Moderate

**[P2] brace-expansion <1.1.13 / >=2.0.0 <2.0.3 — ReDoS** (GHSA-f886-m6hf-6m8v, CVSS 6.5)
- Transitive via glob, htmlhint, test-exclude. Dev-only.
- npm update brace-expansion should resolve most instances.

**[P3] esbuild — Permissive CORS**: transitive inside vite, dev server only.
**[P3] @lhci/cli — inquirer + tmp symlink** (GHSA-52f5-9888-hmc6): low exploitability, accept or await upstream patch.

---

## Lockfile Health

- lockfileVersion: 3 (current), committed
- All direct deps present in lockfile — no drift
- All resolved URLs: registry.npmjs.org — no registry hijack risk
- npm ls --depth=0: no UNMET DEPENDENCY or extraneous warnings

---

## Outdated Packages (Significantly Behind)

| Package | Installed | Latest | Risk |
|---|---|---|---|
| vite | 5.4.21 | 8.0.8 | High — 3 majors behind; active CVE. Test v6 manually. |
| eslint | 8.57.1 | 10.2.0 | Medium — flat config migration required. Defer. |
| glob | 10.5.0 | 13.0.6 | Low — safe within v10 for brace-expansion fix. |
| html-validate | 8.29.0 | 10.11.3 | Low — dev tool; review changelog first. |
| cssnano | 6.1.2 | 7.1.4 | Low — test build output before deploying. |
| vitest + @vitest/* | 3.2.4 | 4.1.4 | Medium — run full test suite after upgrade. |
| @anthropic-ai/sdk | 0.80.0 | 0.86.1 | Active CVE. Upgrade required. |
| @sentry/browser | 10.17.0 | 10.48.0 | Low — same major; safe to update. |
| typescript | 5.9.3 | 6.0.2 | package.json declares ^5.9.2; commit 8c04895 bumped installed but not the range. |

Minor/Patch behind (routine): autoprefixer, postcss, stylelint, terser, dotenv, htmlhint, @playwright/test (1.55.1->1.59.1), jsdom.

---

## D3 Sub-Packages

All seven at current latest for their declared major. No advisories. No action needed.

| Package | Installed | Status |
|---|---|---|
| d3-color | 3.1.0 | Current |
| d3-format | 3.1.2 | Current |
| d3-hierarchy | 3.1.2 | Current |
| d3-interpolate | 3.0.1 | Current |
| d3-scale | 4.0.2 | Current |
| d3-selection | 3.0.0 | Current |
| d3-transition | 3.0.1 | Current |

---

## ECharts / Sentry Currency

- **echarts@6.0.0**: Current v6 stable. No advisories. Bundle budget unchanged (~645KB chunk).
- **@sentry/browser@10.17.0**: Latest is 10.48.0 (same major). No advisories. Safe to bump.

---

## Dependabot Config (.github/dependabot.yml)

1. **[P3] Line 19 — reviewer placeholder not updated**: @your-github-username never replaced; PRs cannot assign reviewers.
2. Vite major-version block is correct per regression history, but means active CVE needs a manual branch test.
3. @anthropic-ai/sdk not in ignore list — Dependabot will auto-propose the CVE fix (good).

---

## Supply Chain Concerns

- **live-server@1.2.2**: Unmaintained since 2020. Carries braces/micromatch vuln chain with no fix path. Replace with vite preview.
- **@anthropic-ai/sdk in dependencies not devDependencies**: Dev-only scraper incorrectly in runtime deps (package.json:121). Move to devDependencies.
- No ownership-transfer red flags; no suspicious postinstall scripts in direct deps.

---

## License Compliance

All direct deps: MIT, ISC, Apache-2.0, or BSD-3-Clause. No GPL/AGPL. No missing license fields.

---

## Bundle Impact

No budget violations. @anthropic-ai/sdk is in dependencies but not Vite-processed — zero bundle impact. All budgets within spec.

---

## Recommendations

1. **Immediate**: npm install --save-dev @anthropic-ai/sdk@^0.86.1 and move to devDependencies (resolves P2 CVE + wrong dep section)
2. **Short-term**: Manually test vite@6.4.2 on a branch; update Dependabot to allow 5.x->6.x after green. Do NOT use npm audit fix --force.
3. **Short-term**: npm install @sentry/browser@^10.48.0 — same major, low regression risk.
4. **Short-term**: Fix .github/dependabot.yml:19 — replace @your-github-username with actual handle.
5. **Deferred**: Replace live-server with vite preview; remove from devDependencies.
6. **Deferred**: Plan ESLint 9 flat config migration.
7. **Process**: Raise CI security script (package.json:39) from --audit-level critical to --audit-level high.