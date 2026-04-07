# Food Prices & Affordability Dashboard Audit

**Date**: 2026-04-07 (fresh re-audit)
**Scope**: 8 charts, 2 PHP proxies (`dashboard-bls.php`, `dashboard-fred.php`), 4 static JSON files
**Files**: `dashboards/food-prices.html`, `src/js/dashboards/food-prices.js`, `src/js/dashboards/__tests__/food-prices.test.js`, `public/api/dashboard-bls.php`

---

## Prior Audit Fix Verification

| Prior Finding | Status |
|---|---|
| P1-2: LinearGradient serialization bug | FIXED — restore loop at food-prices.js:537-541 checks `.colorStops` and re-assigns original instance |
| P1-5: Chart 4 stale numbers (31.2%, $407, $1028, $3.99) | FIXED — now 32.6%, $440, $1,416, $3.58 |
| P1-15: YoY insight "returned below 2%" | FIXED — now "the rate at 3.1% as of early 2026" |
| P2-1: Purchasing power narrative contradicts data | FIXED — copy now states "SNAP +55% vs. food +37%" |
| Affordability map min=45 clips Utah 42.8 | FIXED — min now 40 |

**All 5 prior critical/major findings confirmed resolved.**

---

## 1. Data Freshness

| Dataset | Source | Data Year | Last Updated | Status |
|---------|--------|-----------|--------------|--------|
| bls-regional-cpi.json | BLS CPI | 2018–2026-02 | 2026-04-06 | PASS |
| bls-food-cpi.json | BLS CPI | 2018–2026-02 | 2026-03-31 | PASS |
| snap-participation.json | USDA FNS | 2015–2025-11 | 2026-04-05 | PASS |
| food-insecurity-state.json | USDA ERS / Feeding America | 2024 | 2026-04-04 | PASS |

All files within 7 days. National `averageMealCost = $3.58`, year = 2024.

---

## 2. Calculation Spot-Checks (all pass)

| Formula | Expected | Actual | Status |
|---------|----------|--------|--------|
| Food inflation 2020–2024 hero stat | ~28% | 261.057 → 333.566 = 27.8% ≈ 28% | PASS |
| YoY Feb 2026 food-at-home | ~3.1% | (346.564 - 336.274) / 336.274 = 3.1% | PASS |
| Affordability index: Louisiana | 65.4 | (3.48 × 3 × 365 / 58229) × 1000 = 65.4 | PASS |
| Affordability index: Utah | 42.8 | (3.65 × 3 × 365 / 93421) × 1000 = 42.8 | PASS |
| SNAP purchasing power Feb 2026 | SNAP ahead | food=137.3, SNAP=154.8, gap=-17.4 | PASS |
| Chart 4: 10% × $440 = $44/month | $44 | Correct | PASS |
| Chart 4: $44 / $3.58 meals missed | ~12 | 12.3, stated as 12 | PASS |
| BLS series IDs (CUUR*) | CUUR prefix | All 11 correct | PASS |
| FRED series IDs (APU*) | APU prefix | All 4 correct | PASS |
| BLS M13 annual averages filtered | Filtered | Month 13 > 12 → skipped | PASS |

---

## 3. Hardcoded Bounds Audit

| Chart | Bound | Data Range | Clipping Risk |
|-------|-------|------------|---------------|
| Affordability map | min=40, max=75 | 42.8–65.4 | None — adequate margins |
| Categories area chart | dynamic | 250–380+ | None |
| YoY inflation | dynamic | computed | None |
| Purchasing power | dynamic | computed | None |

---

## 4. PHP Proxy Health

| Check | Result |
|-------|--------|
| BLS default series IDs | Correct (CUUR0000SAF1, SEFV, SA0) |
| BLS regional series IDs | Correct (CUUR0100-0400SAF1) |
| BLS M13 filtering | Yes — skips month > 12 |
| Cache TTL | 7 days (604800s) |
| Stale fallback | Yes — `_stale: true` on failure |
| BLS v1 rate limit | 20/day — regional fetches 4 chunks per miss, adequate at ≤5 misses/day |

---

## 5. Findings

### Warning

**W1: Regional chart insight text hardcodes "8.6% more" — actual gap is now 6.7%**
- **File**: `food-prices.html:246`
- West Feb-2026 = 363.578, South = 340.877, gap = 6.7%
- Overstates regional gap by ~2 percentage points
- **Test**: Compute actual West/South gap from JSON, assert HTML does not contain "8.6%"
- **Fix**: Update copy to "approximately 7%" or compute dynamically
- **Effort**: Trivial

**W2: Regional data range stated as "2020-present" — data starts Jan 2018**
- **File**: `food-prices.html:242`, `dashboard-bls.php:198` (`startYear => 2020`)
- Chart renders full 2018–2026 correctly; sidebar label and PHP meta misstate start year
- **Fix**: Update HTML to "2018–present", PHP meta to `startYear => 2018`
- **Effort**: Trivial

**W3: SNAP benefit timeline ends 2025-12, forward-filled to 2026-02 with no annotation**
- **File**: `food-prices.js:596-599`
- SNAP line extends 2 months past last known data at $195/person
- Users may interpret flat SNAP line in Jan–Feb 2026 as confirmed data
- **Fix**: Add markArea or vertical line at 2025-12 labeled "SNAP data through Dec 2025"
- **Effort**: S

**W4: "The Purchasing Power Gap" heading stale when SNAP is now ahead**
- **File**: `food-prices.html:386`
- SNAP +55% vs food +37% — no gap, SNAP ahead by 17.4 points. Body copy correct but heading misleading
- **Fix**: Rename to "SNAP vs. Food Prices: A Purchasing Power Index"
- **Effort**: Trivial

**W5: Dynamic insight "keeping pace" understates SNAP advantage**
- **File**: `food-prices.js:706`
- When `gap <= 0`, says "keeping pace" — actual gap is 17.4 points in SNAP's favor
- **Fix**: Change to "outpaced" language with gap magnitude
- **Effort**: S

### Info

**I1**: Series null-count divergence guard absent in `renderCategories` — all 7 series currently aligned (97 points each). Fragile if BLS reports gaps.

**I2**: Chart 4 rounding ($44 exact, 12 meals rounds down from 12.3) — acceptable for narrative copy.

**I3**: Government shutdown markArea 2025-10/11 matches actual null data positions.

**I4**: Affordability map `max=75` provides 9.6pt headroom above Louisiana 65.4 max. Compresses gradient.

**I5**: All 12 existing unit tests pass. Covers: series IDs, LinearGradient restore, affordability bounds, hero freshness, data shape, Chart 4 values.

---

## 6. Summary

| Severity | Count | Key Findings |
|----------|-------|-------------|
| Warning | 5 | W1 (stale 8.6% gap), W2 (wrong start year), W3 (SNAP forward-fill), W4 (stale heading), W5 (understated insight) |
| Info | 5 | I1-I5 |

**No critical or major findings.** All prior critical bugs confirmed fixed. Dashboard is in strong shape. Remaining issues are stale copy (W1, W2, W4) and minor analytical framing (W3, W5).
