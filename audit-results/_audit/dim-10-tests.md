# Dimension 10: Test Coverage and Quality Audit
Date: 2026-04-09
Baseline: 521 unit tests (21 files), 868 Playwright tests

## 1. Exported Render Functions

Five dashboard source files export zero callable functions (all render logic is module-private):
food-insecurity.js, food-access.js, food-banks.js, food-prices.js, chart-preview.js, nonprofit-directory.js, nonprofit-profile.js

Tested exports:
- snap-safety-net.js: SNAP_MAP_DEFAULT_INSIGHT + formatCdcAdminGap() both tested
- executive-summary.js: computeVulnerabilityIndex() tested behaviorally; renderPriceImpact() source-scan only (P1 gap)

Untested exported functions:
- renderPriceImpact (executive-summary.js:205) no behavioral test, source-scan only

## 2. Vacuous Tests

[P1] Source-scan negative-string assertions always pass once the bug is fixed

food-insecurity.test.js:83 - checks hardcoded Mississippi string is absent; trivially passes post-fix, misses future hardcoding
food-access.test.js:145 - checks exact comment is absent; passes if comment is renamed but bug reintroduced
food-banks.test.js:163 - negative regex on _dataYear; passes silently if field is renamed

## 3. Source-Scan-Only Tests

[P1] High concentration cannot catch runtime regressions

readFileSync + jsSource counts per test file:
- food-insecurity.test.js: 119 occurrences in 649 lines
- food-access.test.js: 79 in 547 lines
- snap-safety-net.test.js: 61 in 547 lines
- food-prices.test.js: 66 in 475 lines
- food-banks.test.js: 57 in 449 lines

These assert code was written a certain way, not that it behaves correctly.
A minifier, refactor, or renamed variable silently keeps tests green despite regression.

High-risk examples:
- food-insecurity.test.js:267 - toContain('currentMetric] ??') passes if ?? appears anywhere
- food-insecurity.test.js:309 - toContain('points.length') does not verify early-return is correct
- food-prices.test.js:343-350 - entire renderHomeVsAway suite is 2 toContain calls on raw source
- food-banks.test.js:172-174 - confirms tabindex/role/keydown strings exist; does not verify accessibility

[P1] renderPriceImpact (executive-summary.js:205) has no behavioral test

food-prices.test.js:337 describes a renderPriceImpact data contract but only reads source.
No test calls renderPriceImpact(blsData) and asserts on output.

## 4. Playwright Interactive Feature Gaps

[P1] networkidle still present in 3 Playwright specs (banned pattern)

Per memory project_mobile_playwright_failures.md, networkidle caused 146 CI failures.
- tools/testing/tests/dashboard-smoke.spec.js:68
- tools/testing/tests/critical-navigation-smoke-test.spec.js
- tools/testing/tests/contact-form.spec.js
Recommendation: Replace all with page.waitForSelector() or expect(locator).toBeVisible()

[P2] No toggle, drill-down, or selector interaction tests

dashboard-smoke.spec.js covers: page load 200, tab nav, card count, chart dimensions, JS errors only.
Zero tests exercise:
- Food Access map-view-toggle (Deserts / Insecurity / SNAP Retailers)
- Food Access Double Burden mode toggle
- Food Insecurity county drill-down and back button
- SNAP gauge selector
- Food Banks heatmap drill-down
- Export CSV buttons
Evidence: grep for map-view-toggle, double-burden, aria-pressed in tools/testing/tests/ returns zero results.

[P2] Nonprofit Profile missing from Playwright smoke matrix

dashboard-smoke.spec.js:9-17 lists 7 dashboards; nonprofit-profile.html is absent.
6 ECharts and dynamic descriptions with zero browser-level smoke coverage.

## 5. PHP Proxy Error Path Coverage

[P2] Zero tests for upstream API failure responses

php-security.test.js validates CORS, method checks, input sanitization only.
Not covered:
- Upstream API non-200 responses (BLS, Census, FRED, ProPublica, Mapbox)
- Rate-limit trip behavior (60s cooldown; rate-limit-status.php response shape untested)
- Cache stale-fallback when upstream fails and cache expired
- Charity Navigator proxy with missing API key

## 6. Tooltip Formatter Coverage

[P2] All formatter tests are source-scan or absent

food-insecurity.test.js:604-611 - SNAP tooltip checks 'formatter' and '%' as strings; does not execute formatter(params)
food-access.test.js, food-banks.test.js, food-prices.test.js: no tooltip formatter tests at all
stateTooltip at food-insecurity.js:50 has null-guard; branch has no unit test

## 7. Edge Cases

[P1] Cross-dataset null path (bankData/accessData) untested

food-insecurity.js:1670-1680 - both cross-dataset fetches use .catch(() => null)
renderTripleBurden(data, null) and renderStateDeepDive(..., null, null) are callable with null
No test passes null as second argument to either function.

[P2] norm() divide-by-zero documented but unguarded

food-insecurity.test.js:286 - expect(norm(5,5,5)).toBeNaN() documents the NaN edge case with a comment
but does not verify production code handles it. No guard confirmed.

[P2] Single-state result edge cases untested

linearRegression (dashboard-utils.js:99) with 1-element array untested.
food-banks.js mean computation with empty stateRevPerInsecure array untested (divide-by-zero).

## 8. Mobile Rendering

[P3] No mobile-specific rendering assertions

playwright.config.js includes chromium-mobile (iPhone 14 Pro Max) in CI.
dashboard-smoke.spec.js has no viewport-conditional assertions.
Mobile chart height collapse or D3 tile overflow surfaces only if it causes a JS error.

## Summary

P1 (5): networkidle in 3 specs, source-scan dominance, renderPriceImpact untested, cross-dataset null untested
P2 (6): No interactive Playwright tests, no PHP error-path tests, no tooltip behavioral tests, nonprofit-profile missing from smoke, NaN unguarded, single-state edge cases
P3 (1): Mobile rendering not asserted
