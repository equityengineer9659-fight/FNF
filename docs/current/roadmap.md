# Food-N-Force Roadmap — 55 Stories, 18 Work Chunks

> Last updated: 2026-04-07
> Companion to: [story-priority-list.md](story-priority-list.md) (per-story tier detail)

## Context

The site is live with strong content (53 articles) and dashboards (8), but has three critical gaps: no lead capture backend (newsletter popup sends emails nowhere), no search engine visibility (not submitted to Google/Bing), and no admin tools. The 55 open stories in JIRA (KAN project) are organized into 5 execution tiers in `story-priority-list.md`. This roadmap breaks those tiers into concrete, shippable work chunks with dependency mapping, agent review requirements, effort estimates, and decision points.

## Structural Flags (Tier Adjustments)

Two stories need to move earlier than their current tier placement:

1. **KAN-33 (unsubscribe flow)** — Currently Tier 3, should move to Tier 1 (Chunk 2). CAN-SPAM requires an unsubscribe mechanism from the first commercial email. Cannot ship KAN-30 without KAN-33.
2. **KAN-70 (privacy policy)** — Currently Tier 4, should move to Chunk 3. PII collection begins at newsletter activation; a privacy policy must be live before GA4 conversion tracking.

---

## Architectural Context (Technical Architect Findings)

### SiteGround Constraints
- **PHP-only runtime** — No Node.js on server. Express admin (`npm run admin`) is local-only.
- **Request-scoped PHP** — No persistent processes, no queues, no WebSockets. Background work must use cron jobs or deferred HTTP.
- **MySQL available** but not currently used. Only becomes relevant at KAN-37 (admin dashboard, Tier 4).
- **Cron jobs** work — proven by existing `cache-cleanup.php` pattern.
- **SSH + rsync** for CI/CD — already in use via GitHub Actions.

### Blog-Newsletter Coupling: Minimal by Design
The blog pipeline and newsletter system touch at exactly **one point**: a deploy webhook writes a `pending-notification.json` file to the SiteGround filesystem; a cron job reads it and calls the ESP API. They share no code, no database, no PHP session.

```
BLOG PIPELINE                          NEWSLETTER SYSTEM
scraper -> blog/*.html -> build ->     newsletter popup -> newsletter.php
  sync-blog.js -> vite -> rsync          -> ESP REST API (add contact)
       |                                  -> mail() to admin (keep as log)
       v (post-deploy webhook)
  pending-notification.json             cron-notify.php (nightly)
                                          -> ESP campaign API -> send
                                          -> delete pending file
```

### ESP Integration Pattern
- Store subscribers **exclusively in the ESP** (Brevo, Mailchimp, or Kit) — no parallel MySQL
- Add ESP API call to existing `public/api/newsletter.php` after line 67 (~15 lines of PHP)
- Store ESP API key in existing `public/api/_config.php` (established secrets location)
- New `public/api/cron-notify.php` follows the `cache-cleanup.php` pattern exactly (CLI + HTTP with token)
- All three ESPs offer REST APIs callable via `curl_exec()` — no Composer SDK required

### Decoupling Confirmed
- **KAN-26/27** (scraper improvements) — purely local tooling, zero coupling to newsletter/ESP
- **KAN-39** (blog performance) — GA4 read-only data feed, no write dependencies
- **KAN-95** (data freshness) — dashboard-only concern, no newsletter coupling
- **KAN-37** (content management dashboard) — the only story that might force a MySQL decision; deferred to Tier 4

### WordPress: Not Recommended
WordPress conflicts with the Vite static site architecture and solves a problem this project doesn't have (non-technical editors). The AI scraper pipeline is already more capable for this workflow.

### Key Files for Newsletter Implementation
- `public/api/newsletter.php` — ESP call slots in at line 67
- `public/api/_config.php` — existing secrets location for ESP API key
- `public/api/cache-cleanup.php` — exact cron PHP pattern to copy for `cron-notify.php`

---

## Timeline Overview

```
MONTHS 1-2: Foundation (Chunks 1-5)
  Chunk 1:  Newsletter architecture decision         [KAN-90]
  Chunk 2:  Newsletter activation                    [KAN-29, 30, 33*, 82]
  Chunk 3:  GA4 + privacy policy                     [KAN-92, 70*]
  Chunk 4:  SEO audit + search submission            [KAN-93, 52, 97]
  Chunk 5:  HSDS research (parallel filler)          [KAN-84]

MONTHS 2-3: Security + Foundation (Chunks 6-8)
  Chunk 6:  Security audits + caching               [KAN-91, 63, 64, 65]
  Chunk 7:  Security remediation + DB eval           [KAN-96, 89]
  Chunk 8:  Directory UX + lead management           [KAN-88, 94]

MONTHS 3-5: Content Engine (Chunks 9-12)
  Chunk 9:  Email content pipeline                   [KAN-31, 32, 34]
  Chunk 10: Data freshness + USDA ERS research       [KAN-95, 98]
  Chunk 11: SEO strategy + lead magnet               [KAN-51, 53, 58]
  Chunk 12: Scraper improvements                     [KAN-26, 25]

MONTHS 5-8: Admin Tooling (Chunks 13-16)
  Chunk 13: Auth system                              [KAN-67, 68]
  Chunk 14: Admin dashboards                         [KAN-40, 37, 38, 39, 41]
  Chunk 15: UTM + security logging                   [KAN-60, 61, 66, 72]
  Chunk 16: Scraper quality-of-life                  [KAN-24, 27]

MONTHS 8-14: Scale (Chunks 17-18)
  Chunk 17: Donation system                          [KAN-71, 43, 44, 45, 46, 47, 48, 49]
  Chunk 18: Marketing execution                      [KAN-54, 55, 56, 57, 59]

* = moved from a later tier for compliance reasons
```

---

## Work Chunks (Detail)

### CHUNK 1 — Architecture Decision: Newsletter
- **Stories:** KAN-90
- **Effort:** Small (1 session) — reduced scope since technical architect has already resolved the architecture questions (see above)
- **Agents:** business-analyst (ESP comparison for nonprofit use case)
- **Deliverable:** ESP selection decision. Architecture is already decided: REST API via curl, subscriber storage in ESP only, blog-newsletter coupling via pending-notification.json + cron. Remaining decision: which ESP (Brevo vs Mailchimp vs Kit) based on free tier, nonprofit discounts, and feature fit.
- **Decision point:** User must choose the ESP (billing/brand implications).

### CHUNK 2 — Newsletter Activation
- **Stories:** KAN-29 -> KAN-30 -> KAN-33 -> KAN-82 (sequential)
- **Effort:** Medium (2-3 sessions)
- **Agents:** php-security-reviewer, accessibility-auditor
- **Deliverable:** Popup -> ESP -> admin notification -> unsubscribe all working end-to-end.
- **Done when:** Test subscriber flows through entire pipeline. php-security-reviewer sign-off.

### CHUNK 3 — GA4 + Privacy Foundation
- **Stories:** KAN-70 (first), KAN-92
- **Effort:** Small-Medium (1-2 sessions)
- **Agents:** seo-auditor, accessibility-auditor
- **Deliverable:** Privacy policy page live. GA4 conversion events for newsletter signup + contact form firing in DebugView.

### CHUNK 4 — SEO Readiness + Search Submission
- **Stories:** KAN-93 -> KAN-52, KAN-97 (parallel)
- **Effort:** Medium (2 sessions)
- **Agents:** seo-auditor, content-reviewer
- **Deliverable:** JSON-LD/OG/meta fixed on all 72 pages. Sitemap submitted to Google/Bing. Business Profile live.
- **Hard constraint:** KAN-93 before KAN-52 — don't waste Google's first impression.

### CHUNK 5 — HSDS Research
- **Stories:** KAN-84
- **Effort:** Small (1 session)
- **Agents:** business-analyst
- **Deliverable:** Written assessment of HSDS/Open Referral consulting opportunity. Pursue/defer/drop decision.
- **Scheduling:** Fully independent — ideal filler when blocked on another chunk.

### CHUNK 6 — Security Audit (Tier 2, Batch 1)
- **Stories:** KAN-91 (independent quick win), KAN-63 + KAN-64 + KAN-65 (three parallel audits)
- **Effort:** Medium (2 sessions)
- **Agents:** php-security-reviewer, technical-architect
- **Deliverable:** Caching TTLs updated. Three audit reports defining KAN-96 scope.

### CHUNK 7 — Security Remediation + Database Evaluation
- **Stories:** KAN-96, KAN-89
- **Effort:** Medium (2-3 sessions, scope-dependent on audit findings)
- **Agents:** php-security-reviewer, technical-architect
- **Deliverable:** All audit findings remediated. Database evaluation document (need/no-need decision for admin dashboards).

### CHUNK 8 — User-Facing Improvements
- **Stories:** KAN-88, KAN-94
- **Effort:** Medium (2 sessions)
- **Agents:** accessibility-auditor, business-analyst, php-security-reviewer
- **Deliverable:** Improved Nonprofit Directory search UX. Contact form lead management process defined and implemented.

### CHUNK 9 — Email Content Pipeline
- **Stories:** KAN-31 -> KAN-32 -> KAN-34 (sequential)
- **Effort:** Medium (2-3 sessions)
- **Agents:** content-reviewer, business-analyst
- **Hard dependency:** Chunks 1+2 complete
- **Deliverable:** Welcome email on signup. Newsletter email on article publish. Full automation.

### CHUNK 10 — Data Freshness Automation
- **Stories:** KAN-95, KAN-98
- **Effort:** Medium (2 sessions)
- **Agents:** data-scientist, technical-architect
- **Deliverable:** Automated data freshness monitoring (GitHub Action or cron). USDA ERS migration plan with 2 alternatives ranked.

### CHUNK 11 — SEO Content Strategy
- **Stories:** KAN-51 -> KAN-53, KAN-58
- **Effort:** Medium (2-3 sessions)
- **Agents:** business-analyst, content-reviewer, seo-auditor
- **Deliverable:** 20+ target keywords. Quarterly content calendar. "Salesforce for Food Banks" lead magnet live.

### CHUNK 12 — Scraper Improvements
- **Stories:** KAN-26, KAN-25
- **Effort:** Small-Medium (1-2 sessions)
- **Agents:** content-reviewer, seo-auditor
- **Soft dependency:** KAN-51 keyword strategy informs KAN-25
- **Deliverable:** Better article generation quality and keyword targeting.

### CHUNK 13 — Admin Auth System
- **Stories:** KAN-67 -> KAN-68
- **Effort:** Large (3-4 sessions)
- **Agents:** php-security-reviewer (mandatory), technical-architect
- **Hard dependencies:** KAN-89 (DB decision), KAN-96 (security remediation)
- **Decision point:** Custom PHP auth vs. lightweight library (Firebase Auth, etc.)
- **Deliverable:** Login page, session management, RBAC with 3 roles enforced on /admin/ routes.

### CHUNK 14 — Admin Dashboards
- **Stories:** KAN-40 -> KAN-41 -> KAN-37 -> KAN-38 -> KAN-39
- **Effort:** Large (4-5 sessions)
- **Agents:** php-security-reviewer, accessibility-auditor, technical-architect
- **Hard dependency:** Chunk 13 (auth)
- **Deliverable:** 5 admin dashboards: form submissions, system health, content management, site analytics, blog performance.

### CHUNK 15 — UTM + Marketing Reporting
- **Stories:** KAN-60 -> KAN-61, KAN-66, KAN-72
- **Effort:** Medium (2 sessions)
- **Agents:** seo-auditor, php-security-reviewer
- **Deliverable:** UTM naming convention. Monthly report template. Rate limits reviewed. Security event logging.

### CHUNK 16 — Scraper Quality-of-Life
- **Stories:** KAN-24, KAN-27
- **Effort:** Small (1 session)
- **Agents:** content-reviewer
- **Deliverable:** Better RSS source search. 2+ new article templates.

### CHUNK 17 — Donation System
- **Stories:** KAN-71 -> KAN-43 -> KAN-44/45 -> KAN-46/47/48/49
- **Effort:** Large (6-8 sessions)
- **Agents:** php-security-reviewer, technical-architect, business-analyst
- **Decision points:** Stripe vs. alternatives. Hosted Checkout vs. custom Stripe.js. Donor portal at launch or deferred.
- **Deliverable:** End-to-end donation flow: form -> payment -> confirmation email -> admin reporting.

### CHUNK 18 — Marketing Execution
- **Stories:** KAN-54, KAN-55, KAN-56, KAN-57, KAN-59
- **Effort:** Large (4-6 sessions, mostly human effort)
- **Agents:** business-analyst, content-reviewer
- **Deliverable:** LinkedIn page, AppExchange engagement, Feeding America inquiry, Google Ads campaign, email drip sequence.

---

## Dependency Map

```
Newsletter chain:   KAN-90 -> KAN-29 -> KAN-30 -> KAN-33 -> KAN-82
                                              -> KAN-31 -> KAN-32 -> KAN-34 -> KAN-59

SEO chain:          KAN-93 -> KAN-52 -> KAN-57
                    KAN-92 (independent, enables KAN-57)

Security chain:     KAN-63 + KAN-64 + KAN-65 -> KAN-96
                    KAN-89 (informs) -> KAN-37/38/39/40/41

Auth chain:         KAN-67 -> KAN-68 -> KAN-37/38/39/40/41/49

Donation chain:     KAN-71 -> KAN-43 -> KAN-44/45 -> KAN-46/47/48/49

Marketing chain:    KAN-51 -> KAN-53 -> KAN-59
                    KAN-60 -> KAN-61
```

---

## Decision Points (User Action Required)

| When | Decision | Blocks |
|------|----------|--------|
| Before Chunk 1 | Which ESP (Mailchimp, ConvertKit, Brevo, SendGrid) | Chunk 2 |
| Before Chunk 3 | Privacy policy scope (1-pager vs. full legal) | GA4 tracking |
| Before Chunk 13 | Auth approach (custom PHP vs. library) | All admin stories |
| Before Chunk 17 | Payment processor + integration style | Entire donation epic |
| Before Chunk 17 | Donor portal at launch or deferred | Chunk 17 scope |

---

## Agent Review Matrix

| Chunk | Required Agent Reviews |
|-------|----------------------|
| 1 | business-analyst, technical-architect |
| 2 | php-security-reviewer, accessibility-auditor |
| 3 | seo-auditor, accessibility-auditor |
| 4 | seo-auditor, content-reviewer |
| 5 | business-analyst |
| 6 | php-security-reviewer, technical-architect |
| 7 | php-security-reviewer, technical-architect |
| 8 | accessibility-auditor, business-analyst, php-security-reviewer |
| 9 | content-reviewer, business-analyst |
| 10 | data-scientist, technical-architect |
| 11 | business-analyst, content-reviewer, seo-auditor |
| 12 | content-reviewer, seo-auditor |
| 13 | php-security-reviewer, technical-architect |
| 14 | php-security-reviewer, accessibility-auditor, technical-architect |
| 15 | seo-auditor, php-security-reviewer |
| 16 | content-reviewer |
| 17 | php-security-reviewer, technical-architect, business-analyst |
| 18 | business-analyst, content-reviewer |

---

## Empty Epic Population Schedule

| Epic | Key | When to Populate |
|------|-----|-----------------|
| CRM / Sales Pipeline | KAN-77 | After Chunks 4+8 — once leads flow in |
| Accessibility Program | KAN-81 | After Chunk 4 — SEO audit will surface a11y issues |
| Mobile / PWA | KAN-79 | After Chunk 14 — once admin dashboards give users a reason to return |
| Salesforce Managed Package | KAN-75 | After Chunk 17 or Chunk 5 if HSDS is pursued |
| Training & Education | KAN-76 | After KAN-55/56 — needs live consulting practice |
| Client Portal | KAN-74 | After Chunk 13 + first 2-3 paying clients |
| Partnerships & Integrations | KAN-78 | After Chunk 18 — needs brand credibility |
| Community / User Forum | KAN-80 | Last — revisit at 5,000+ monthly sessions |

---

## Risk Register

| Risk | Chunks | Severity | Mitigation |
|------|--------|----------|------------|
| ESP selection delayed | 2, 9 | High | Time-box KAN-90 to 1 session; all major ESPs are interchangeable at this scale |
| KAN-96 scope expands | 7 | Medium | Cap per session; create separate stories for architectural fixes |
| USDA ERS data discontinued | 10 | Medium | KAN-98 research produces migration plan before urgency hits |
| Auth complexity on SiteGround | 13 | Medium | technical-architect review before any auth code |
| Privacy policy deferred too long | 2-3 | Medium | Moved KAN-70 to Chunk 3; no emails without policy |
| Donation PCI scope | 17 | High | Use Stripe Checkout (hosted) for SAQ-A compliance |

---

## Summary Table

| Chunk | Stories | Effort | Key Outcome |
|-------|---------|--------|-------------|
| 1 | KAN-90 | Small | ESP decision |
| 2 | KAN-29/30/33/82 | Medium | Newsletter functional |
| 3 | KAN-92/70 | Small-Med | GA4 + privacy live |
| 4 | KAN-93/52/97 | Medium | Google indexing |
| 5 | KAN-84 | Small | HSDS assessed |
| 6 | KAN-91/63/64/65 | Medium | Audits complete |
| 7 | KAN-96/89 | Medium | Remediation + DB decision |
| 8 | KAN-88/94 | Medium | UX + lead tracking |
| 9 | KAN-31/32/34 | Medium | Email automation |
| 10 | KAN-95/98 | Medium | Data monitoring automated |
| 11 | KAN-51/53/58 | Medium | SEO strategy + lead magnet |
| 12 | KAN-26/25 | Small-Med | Better content generation |
| 13 | KAN-67/68 | Large | Auth system |
| 14 | KAN-40/37/38/39/41 | Large | Admin dashboards |
| 15 | KAN-60/61/66/72 | Medium | UTM + logging |
| 16 | KAN-24/27 | Small | Scraper QoL |
| 17 | KAN-71/43-49 | Large | Donations live |
| 18 | KAN-54-57/59 | Large | Marketing channels |

**Total: 55 stories, 18 chunks, ~14 months at solo-developer + Claude pace**
