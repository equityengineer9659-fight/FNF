---
paths:
  - "**/*.test.js"
  - "**/*.spec.js"
  - "tools/testing/**"
  - "lighthouse.config.js"
  - ".pa11yci.json"
---

# Testing & Performance Reference

## Test Suite
- **Unit tests (vitest)**: ~569 assertions across 42 test files (`src/js/**/*.test.js`)
  - Includes "guard" tests named after audit phases (`p1-other-fixes.test.js`, `p2-a11y-remainder.test.js`, etc.) — these are regression safety nets, not orphans
- **Browser tests (Playwright)**: full 9-project matrix in CI; local runs chromium-desktop only (~2 min); avoid `networkidle` in tests
- **Accessibility (pa11y)**: sample mode on push (non-blog pages + 5 random articles); full sweep weekly via scheduled workflow
- **Coverage threshold**: 65%

## Lighthouse Configs — Intentional Split
- `lighthouse.config.js` (root) — **relaxed thresholds for local dev**
- `tools/testing/lighthouserc.json` — **strict thresholds for CI/CD**
These are NOT duplicates; they serve different audiences.

## Performance Budgets (actual shipped sizes, 2026-04-12 final audit)
Use these as a reality reference, not a refactor target. The ECharts chunk is the real lever — further tree-shaking is fragile and deferred to P1.

| Asset | Minified | Gzipped |
|---|---|---|
| CSS total | ~150KB | ~25KB |
| JS core (main + effects) | ~54KB | ~16KB |
| Dashboard chunks (8 dashboards) | 8–45KB each | 3–13KB each |
| ECharts shared chunk | ~755KB | ~245KB |

**Largest dashboards**: food-access (~45KB / ~12KB gz), food-insecurity (~43KB / ~13KB gz), nonprofit-profile (~37KB / ~11KB gz).
**Smallest**: nonprofit-directory (~8KB), executive-summary (~10KB).

## Pa11y CI Config
`.pa11yci.json` is auto-generated — run `npm run generate:pa11y` to regenerate from filesystem. Do not hand-edit it.

## Special Effects Validation
- Glassmorphism fallbacks work across all supported browsers
- Background animations maintain >60fps
- Logo effects readable at all zoom levels (including 25% — client requirement)
- `prefers-reduced-motion` respected in particle system and animated counters
