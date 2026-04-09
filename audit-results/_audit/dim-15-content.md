# Dimension 15 — Content Quality Audit
**Date:** 2026-04-09
**Scope:** dashboards/*.html (insight cards, descriptions, data notices), blog/ (spot check 5 articles), impact.html, about.html

---

## Issues (Blockers)

### **[P1] Dead links in "Read Next" cards — ai-data-strategy-crm-food-banks.html**
- `blog/ai-data-strategy-crm-food-banks.html:205` — card title "How AI Is Reshaping Food Bank Operations" links to `ai-reshaping-food-banks.html` but the actual article title in that file is "How AI Is Reshaping Food Bank Operations in 2026" — title mismatch.
- **Recommendation:** Update card title to match the h1 of the target article exactly, or confirm the target file title is accurate.

---

## Issues (Non-blocking)

### **[P2] "Get in Touch" CTA used across all 53 blog articles — lacks specificity**
- Evidence: All 53 articles use `<a href="/contact.html" class="resource-action">Get in Touch</a>` (confirmed: 53 matches).
- The checklist standard calls for "Schedule a Consultation" path; "Get in Touch" is a vague CTA that doesn't communicate value.
- `blog/agentforce-nonprofits-guide.html:272`, `blog/snap-cuts-ice-fears-food-bank-response.html:229`, `blog/barrie-food-bank-crm-transformation.html:289` (representative).
- **Recommendation:** Change primary CTA to "Schedule a Consultation" or "Talk With Us About [Topic]" — consistent with the dashboard CTA pattern.

### **[P2] Inconsistent methodology section headings across dashboards**
- Three dashboards use "Methodology & Data Sources": `dashboards/food-insecurity.html:572`, `dashboards/executive-summary.html:330`, `dashboards/nonprofit-profile.html`.
- Five dashboards use just "Data Sources": `dashboards/snap-safety-net.html:463`, `dashboards/food-banks.html:351`, `dashboards/food-prices.html:461`, `dashboards/food-access.html:506`.
- **Recommendation:** Standardize to "Methodology & Data Sources" — the fuller heading is more informative for the audience and consistent with the most data-rich dashboards.

### **[P2] "How Organizations Use These Insights" cards are identical across 4 dashboards**
- The three cards ("Who This Helps", "Decisions It Supports", "How Food-N-Force Helps") use verbatim identical text in `food-insecurity.html`, `snap-safety-net.html`, `food-prices.html`, and `food-banks.html`.
- Each dashboard serves a different audience use case; the generic text misses an opportunity to show dashboard-specific value.
- **Recommendation:** Customize at least the "Decisions It Supports" card per dashboard (e.g., food-banks: "Fund-raising strategy, infrastructure investment planning, operational benchmarking").

### **[P2] "2026 computed" is unclear jargon in data notices**
- `dashboards/food-insecurity.html:499` — "Food Access data (2026 computed)" and `dashboards/food-insecurity.html:525` — "Food Access (2026 computed)".
- A director or grant writer reading these notices will not understand what "computed" means as a data year.
- **Recommendation:** Replace with "Food Access data (computed 2026 from current USDA FNS retailer data)" or similar plain-language phrasing.

### **[P3] Word count vs. stated read time: all spot-checked articles overclaim**
- Articles state "4 min read" or "5 min read" (at ~200 wpm = ~800–1000 words for article body).
- Raw file word counts (includes HTML tags/boilerplate): agentforce ~2,626, snap-cuts ~2,763, barrie ~2,740, ai-data-strategy ~2,752. Stripping nav/footer/head boilerplate (estimated ~700–900 words), article body is ~1,700–2,000 words — closer to 8–10 min read at 200 wpm.
- However, ~200–250 wpm is a conservative estimate; 250–300 wpm is more typical for engaged readers. At 250 wpm, 1,800 words ≈ 7 min — still above the stated 4–5 min.
- **Recommendation:** Either adjust stated read times upward (7–8 min) to match actual body length, or reduce article body length to ~800–1,000 words to match the badge. The current mismatch could undermine reader trust.

### **[P3] food-insecurity.html trend insight uses static text without aria-live**
- `dashboards/food-insecurity.html:263` — "Food insecurity has risen for three consecutive years (2022-2024)…" is rendered as a static `<div class="dashboard-info__insight">` (no `aria-live`), while other panels on the same page use `aria-live="polite"` and are populated dynamically.
- Static insight is fine if it is always accurate, but inconsistency with adjacent panels creates visual inconsistency if dynamic insights render differently.
- **Recommendation:** Low priority; verify intent — if this is permanently static, that is acceptable. If it should update dynamically, add `id` and `aria-live`.

### **[P3] Tone in food-access.html "Double Burden" insight is hedged to the point of vagueness**
- `dashboards/food-access.html:382` — "Millions of Americans face overlapping low access and low income — these communities face the greatest compounded access and affordability constraints."
- "Compounded access and affordability constraints" is bureaucratic. The rest of the page prose is sharp and direct.
- **Recommendation:** Sharpen: "…these are the communities where both barriers hit at once — far from food and unable to afford what is available."

### **[P3] About.html expertise descriptions are terse relative to brand voice**
- `about.html:180` — "Certified in Nonprofit Cloud with proven implementations of Program Management Module, Case Management, and Grants Management." Feature list, not a benefit statement.
- `about.html:195` — "We architect solutions around real food distribution workflows—intake, inventory, client services, distribution, and impact reporting." Good specificity, but the em-dash usage here vs. other pages is inconsistent (some pages use ` — ` with spaces, this uses `—` without).
- **Recommendation:** P3 — minor polish; align em-dash spacing to site standard and consider converting the Salesforce credential list into a benefit statement.

---

## Findings (Positive)

- Dashboard brand voice is strong throughout: specific, data-grounded, mission-focused. The executive-summary.html insight panels are particularly well-written for the grant-writer audience.
- Blog article prose quality is high across all five spot-checked articles. No lorem ipsum, no placeholder text. All articles include: category badge, H1, read time badge, lead paragraph, 4+ body sections with h2 subheadings, at least one pullquote, CTA section, and Read Next cards.
- Read Next cards in all spot-checked articles link to real, existing files (verified for agentforce, snap-cuts, barrie, ai-data-strategy).
- CTA paragraphs in dashboard sections are correctly differentiated per dashboard (food-banks CTA references inventory/volunteer/operations; food-prices CTA references procurement/demand forecasting; SNAP CTA references outreach/referrals). No boilerplate detected in dashboard CTAs.
- Data notice language on food-insecurity.html (line 163) is authoritative and accurate — correctly explains the 47.9M vs 41.8M discrepancy.
- "methodology" usage in inline meta labels is consistent (bold `<strong>Methodology</strong>` pattern used uniformly across inline meta items).

---

## Verdict

**No blockers to publishing.** The P1 item (Read Next title mismatch in ai-data-strategy) should be fixed before that article is promoted. The P2 items — CTA vagueness across all blog articles and inconsistent methodology headings — are site-wide patterns worth addressing in a single pass.

