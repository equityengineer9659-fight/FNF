# Dimension 15 (Business) — Business Quality & Conversion

**Agent**: business-analyst
**Date**: 2026-04-09
**Note**: Agent could only read files; full findings captured from its report.

## Findings

**[P1] No above-fold CTA on any of the 8 dashboards**
Evidence: Every dashboard CTA uses `class="dashboard-narrative dashboard-cta scroll-reveal"` placed after all chart sections; hero/tab-nav have no CTA.
Recommendation: Add a lightweight inline CTA (one sentence + link to `/contact.html`) inside each dashboard's `dashboard-hero` alongside the 4 KPI stats.

**[P2] Dashboard CTA copy is generic and identical across 7/8 dashboards**
Evidence: `dashboards/food-insecurity.html:560`, `food-access.html:494`, `food-banks.html:339`, `food-prices.html:449`, `snap-safety-net.html:451`, `nonprofit-profile.html:453` all read "Talk With Us About Dashboard Strategy". `nonprofit-directory.html:255-257` uses thin generic copy with no Salesforce mention.
Recommendation: Differentiate CTA body per dashboard topic (Food Banks → inventory/volunteer; SNAP → outreach/referral; Nonprofit Directory → Salesforce CRM).

**[P2] index.html primary CTA vague**
Evidence: `index.html:165` — "Start Your Digital Journey" links to contact.html but names no specific offer. contact.html sidebar `contact.html:216` correctly names "Book a 30-minute consultation".
Recommendation: Change primary CTA text to "Schedule a Free 30-Minute Consultation".

**[P2] services.html service cards lack proof/outcome links**
Evidence: `services.html:170-372` — 6 service cards with single-sentence descriptions, no outcome metrics, no links to case studies or impact.
Recommendation: Add one outcome metric or "See it in action →" link to impact/case-studies on at least the top 3 cards.

**[P2] index.html impact stats lack source attribution**
Evidence: `index.html:394-396` — "200+ Food Banks Impacted," "2B+ Pounds Recovered," "38M+ Americans Reached," "60% Time Savings" annotated only with small italic text opacity:0.7.
Recommendation: Add linked footnote / tooltip with source or link to impact.html.

**[P3] services.html hero missing value proposition**
Evidence: `services.html:133-136` — H1 "Our Services" with generic subtitle.
Recommendation: Add a 2-line benefit statement with a specific outcome metric.

**[P3] contact.html submit button weak framing**
Evidence: `contact.html:192` — button says "Send Message"; page header is "Let's Connect"; sidebar references consultation.
Recommendation: Change to "Request My Free Consultation".

**[P3] impact.html testimonials lack named authors on 2/4 cards**
Evidence: `impact.html:170-178` ("Operations Leadership"), `impact.html:207` ("Chapter Leadership"). Feeding America card (line 192) correctly names Maryann Byrdak.
Recommendation: Add first/last names + titles or reframe as paraphrased outcomes.

**[P3] No Salesforce certification/credential signal in the conversion funnel**
Evidence: No mention of Salesforce certifications, NPSP expertise, or Nonprofit Cloud credentials anywhere in services.html, index.html, contact.html, impact.html.
Recommendation: Add a single credential line (e.g., "Salesforce Nonprofit Cloud Certified") near CTA section on services.html / contact.html.

## Consultation Path Assessment

| Page | Steps to contact form | Friction |
|------|----|----|
| index.html | 1 | CTA text vague |
| services.html | 1 | No above-fold CTA |
| impact.html | 1 | CTA easy to miss |
| Dashboards (all 8) | 1 | Bottom-only CTA |
| contact.html | 0 | Submit button weak |

## Passed Checks
Data source attributions clear and visible on all dashboards (credibility signal strong). Executive Summary CTA (lines 312-323) is the best-practice model. Contact sidebar correctly names the 30-minute consultation.
