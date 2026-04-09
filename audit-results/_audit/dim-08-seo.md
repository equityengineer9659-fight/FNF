# Dimension 8: SEO & Structured Data Audit
**Date**: 2026-04-09  
**Scope**: dashboards/*.html, *.html (root), sitemap.xml, blog/*.html (spot check 5)

---

## Summary

| Check | Result |
|-------|--------|
| JSON-LD coverage (dashboards) | 7/8 — chart-preview excluded (noindex) |
| Author meta consistency | PARTIAL — 2 root pages diverge |
| Canonical domain | PASS — all use food-n-force.com |
| OG + Twitter Card tags | PASS — all 8 dashboard pages complete |
| Sitemap dashboard coverage | PASS — 7 indexable dashboards present; nonprofit-profile + chart-preview correctly excluded |
| H1 hierarchy (dashboards) | PASS — exactly 1 per page |
| Description length | PARTIAL — 2 dashboards exceed 160 chars |

---

## Findings

**[P2] Author meta inconsistency: "Food-N-Force" vs "Food-N-Force Team"**  
Evidence: `case-studies.html:11` and `templates-tools.html:11` use `content="Food-N-Force Team"`. All 7 root pages (index, about, services, resources, impact, contact, blog) use `content="Food-N-Force"`. All 53 blog articles use `content="Food-N-Force Team"`. All 8 dashboard pages use `content="Food-N-Force"`.  
Phase 15 standardized dashboards to "Food-N-Force" but did not propagate to `case-studies.html` or `templates-tools.html`.  
Recommendation: Standardize all pages to a single value — `"Food-N-Force"` is preferred for root/dashboard pages; update `case-studies.html:11` and `templates-tools.html:11` to match.

---

**[P2] Meta descriptions exceed 160 characters on 2 dashboard pages**  
Evidence:  
- `dashboards/executive-summary.html:9` — 183 chars: "One-page executive summary of food insecurity in America. Vulnerability map, SNAP coverage gaps, food price trends, and state rankings — built for grant writers and decision-makers."  
- `dashboards/food-insecurity.html:9` — 179 chars: "Interactive dashboard visualizing food insecurity across America. Explore state-level data, trends, and the meal gap with maps and charts powered by USDA and Feeding America data."  
Recommendation: Trim both to ≤160 chars. For executive-summary, remove "— built for grant writers and decision-makers." For food-insecurity, cut "with maps and charts powered by USDA and Feeding America data."

---

**[P3] Dashboard JSON-LD uses generic WebPage schema — no Dataset type**  
Evidence: All 8 dashboard JSON-LD blocks declare `"@type": "WebPage"` (e.g., `executive-summary.html:36`, `food-insecurity.html:36`). Pages presenting original statistical datasets (food-insecurity, food-access, snap-safety-net, food-prices, food-banks, executive-summary) would benefit from a secondary `Dataset` schema or `WebPage` subtype `DataCatalog`.  
Recommendation: P3/low-priority — add a second JSON-LD block with `@type: Dataset` on the 5 data-heavy dashboards for richer Google rich results eligibility.

---

**[P3] Title tags on 2 dashboard pages are short (under 40 chars)**  
Evidence:  
- `dashboards/nonprofit-directory.html:6` — 34 chars: "Nonprofit Directory - Food-N-Force"  
- `dashboards/nonprofit-profile.html:6` — 35 chars: "Organization Profile - Food-N-Force"  
Recommendation: Expand to 50–60 chars. Suggested: "Nonprofit Food Bank Directory - Food-N-Force" (44) and "Food Bank Organization Profile - Food-N-Force" (46).

---

## Passing Checks

- All canonical URLs use `food-n-force.com` (hyphenated) — no `foodnforce.com` references found anywhere
- `sitemap.xml` correctly includes all 7 indexable dashboard pages; `nonprofit-profile.html` (noindex) and `chart-preview.html` (noindex, nofollow) are both excluded
- All 8 dashboard pages have `og:title`, `og:description`, `og:url`, `og:type`, `og:image`, `twitter:card`, `twitter:title`, `twitter:description`
- All dashboard pages have exactly 1 `<h1>`
- Blog article spot-check (5 pages): author, canonical, og tags all consistent
- No `foodnforce.com` domain leaks in any HTML or sitemap
- `nonprofit-profile.html:11` correctly has `robots: noindex, follow`
- `chart-preview.html:7` correctly has `robots: noindex, nofollow`
