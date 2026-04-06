# Story Priority List

Prioritized backlog of all 55 To Do stories across 10 epics, organized into 5 execution tiers. Priorities are based on current project state: live site with strong content/dashboards, but no lead capture backend, no search engine visibility, and no admin tools.

> Last updated: 2026-04-06

---

## Tier 1 — Do Now (lead capture + discoverability)

The newsletter popup collects emails but sends them nowhere. The site is live but invisible to Google. Fix these first.

| # | Key | Story | Epic | Rationale |
|---|-----|-------|------|-----------|
| 1 | KAN-90 | Explore blog/newsletter architecture and integration strategy | Newsletter | Must inform ESP selection criteria before committing to a provider |
| 2 | KAN-29 | Select and integrate email service provider | Newsletter | Prerequisite for everything newsletter/marketing; popup exists, backend doesn't |
| 3 | KAN-30 | Connect signup form to ESP subscriber list | Newsletter | Direct follow-on — makes the popup functional |
| 4 | KAN-82 | Admin email notification for new subscribers | Newsletter | Know when leads arrive |
| 5 | KAN-92 | Configure GA4 conversion event tracking | SEO & Infrastructure | Measure ROI of newsletter and search engine work; GA4 is installed but has no conversion events |
| 6 | KAN-93 | SEO readiness audit before search engine submission | SEO & Infrastructure | Fix JSON-LD, meta descriptions, OG tags before Google's first crawl |
| 7 | KAN-52 | Submit sitemap to Google Search Console / Bing | Marketing Strategy | 53 articles + 8 dashboards generating zero organic traffic |
| 8 | KAN-97 | Set up Google Business Profile | Marketing Strategy | Business Profile appears above organic results for brand queries |
| 9 | KAN-84 | Evaluate HSDS referral tracking as Salesforce offering | Business Dev | Only High-priority story; unique service differentiator; research-only |

**Dependencies:**
- KAN-90 → KAN-29 → KAN-30 → KAN-82 (sequential chain)
- KAN-93 → KAN-52 (audit before submission)
- KAN-52 and KAN-97 can run in parallel
- KAN-92 is independent (can be done anytime in Tier 1)
- KAN-84 is independent research

---

## Tier 2 — Next Sprint (security + foundation for growth)

Before building more backend features, audit what's there. Also improve features prospects interact with and implement quick wins from completed strategy work.

| # | Key | Story | Epic | Rationale |
|---|-----|-------|------|-----------|
| 10 | KAN-91 | Implement caching optimizations from KAN-87 | SEO & Infrastructure | 7 PHP files, one constant each; ~85% reduction in unnecessary API calls |
| 11 | KAN-63 | PHP API security audit | Security | 13 PHP proxies + form endpoints need review before adding donation/admin systems |
| 12 | KAN-65 | npm dependency audit | Security | Dependabot runs but no formal audit has been done |
| 13 | KAN-64 | Content Security Policy review | Security | CSP is strict but a review ensures nothing slipped |
| 14 | KAN-96 | Security audit remediation | Security | Implement fixes from KAN-63/64/65; scope defined by audit findings |
| 15 | KAN-89 | Evaluate SiteGround database use cases | SEO & Infrastructure | Needed before admin dashboards, newsletter storage, form logging |
| 16 | KAN-88 | Improve Nonprofit Directory Search & Discovery | Dashboards | User-facing feature that prospects interact with; demonstrates competence |
| 17 | KAN-94 | Establish contact form lead management | Marketing Strategy | Every form submission currently disappears into an email inbox |

**Dependencies:**
- KAN-63, KAN-65, KAN-64 → KAN-96 (audit first, then remediate)
- KAN-91 is independent (quick win)
- KAN-89 informs Tier 4 admin dashboard stories
- KAN-88, KAN-94 are independent

---

## Tier 3 — Growth Phase (content distribution + monitoring)

Once ESP is live and search engines are indexing, build the content distribution engine and operational monitoring.

| # | Key | Story | Epic | Rationale |
|---|-----|-------|------|-----------|
| 18 | KAN-33 | Subscriber management and unsubscribe flow | Newsletter | CAN-SPAM/GDPR legal requirement once collecting emails |
| 19 | KAN-31 | Welcome email template | Newsletter | First impression for new subscribers |
| 20 | KAN-32 | Newsletter email template for content distribution | Newsletter | Distribute blog content to subscriber list |
| 21 | KAN-34 | Automate article notification emails | Newsletter | Leverage content pipeline + newsletter together |
| 22 | KAN-95 | Build data freshness monitoring script | Dashboards | Automate detection of stale data; runbook is purely manual without this |
| 23 | KAN-51 | SEO keyword strategy | Marketing Strategy | Focus content production on high-value search terms |
| 24 | KAN-53 | Content calendar | Marketing Strategy | Systematic content planning |
| 25 | KAN-58 | Lead magnet: Salesforce for Food Banks guide | Marketing Strategy | Conversion optimization — gives visitors a reason to subscribe |
| 26 | KAN-26 | Improve AI article generation quality | Scraper Tool | Better content drives more organic traffic |
| 27 | KAN-25 | Improve article search ranking / keyword targeting | Scraper Tool | SEO-optimized content production |
| 28 | KAN-98 | Research alternative data sources for food insecurity | Dashboards | USDA ERS discontinued after 2024; core dataset at risk long-term |

**Dependencies:**
- KAN-33 should be done alongside or soon after KAN-30 (legal compliance)
- KAN-31 → KAN-32 → KAN-34 (sequential email template chain)
- KAN-95 is independent
- KAN-51 → KAN-53 (strategy before calendar)
- KAN-98 is independent research (Low priority, not time-sensitive until 2027)

---

## Tier 4 — Scale Phase (admin tools + analytics)

Build internal tooling once there's traffic and leads to manage.

| # | Key | Story | Epic | Rationale |
|---|-----|-------|------|-----------|
| 29 | KAN-67 | Admin authentication system | Security | Prerequisite for all admin dashboards |
| 30 | KAN-68 | Role-based access control (RBAC) | Security | Prerequisite for all admin dashboards |
| 31 | KAN-40 | Form submission / lead tracking | Admin Dashboards | Know who's contacting you |
| 32 | KAN-37 | User/content management dashboard | Admin Dashboards | Manage blog + subscribers in one place |
| 33 | KAN-38 | Site analytics dashboard | Admin Dashboards | Internal analytics beyond GA4 |
| 34 | KAN-39 | Blog performance tracking | Admin Dashboards | Measure content ROI |
| 35 | KAN-41 | System health / error monitoring | Admin Dashboards | Operational visibility |
| 36 | KAN-60 | UTM tracking framework | Marketing Strategy | Attribution for marketing channels |
| 37 | KAN-61 | Monthly marketing performance report | Marketing Strategy | Depends on UTM tracking |
| 38 | KAN-66 | Rate limiting review | Security | Strengthen before more traffic |
| 39 | KAN-70 | Privacy policy page | Security | Needed before collecting significant PII |
| 40 | KAN-72 | Security event logging | Security | Operational security visibility |
| 41 | KAN-24 | Optimize RSS source search | Scraper Tool | Quality-of-life for content production |
| 42 | KAN-27 | Article generation templates | Scraper Tool | More content variety |

**Dependencies:**
- KAN-67 → KAN-68 → KAN-37/38/39/40/41 (auth before any admin dashboard)
- KAN-89 (Tier 2) informs database needs for admin dashboards
- KAN-60 → KAN-61 (tracking before reporting)
- KAN-24, KAN-27 are independent

---

## Tier 5 — Deferred (heavy infrastructure, requires earlier tiers)

Donation system needs Stripe + PCI compliance + significant backend work. Marketing execution needs established traffic baseline and budget.

| # | Key | Story | Epic | Rationale |
|---|-----|-------|------|-----------|
| 43 | KAN-43 | Payment processor integration (Stripe) | Donation System | Heavy lift; needs PCI compliance first |
| 44 | KAN-44 | One-time donation flow | Donation System | Depends on KAN-43 |
| 45 | KAN-45 | Recurring donation subscriptions | Donation System | Depends on KAN-43 |
| 46 | KAN-46 | Donor confirmation email / tax receipt | Donation System | Depends on KAN-44/45 |
| 47 | KAN-47 | Embeddable donation widget | Donation System | Depends on KAN-44 |
| 48 | KAN-48 | Donor portal | Donation System | Depends on KAN-44/45 |
| 49 | KAN-49 | Admin donation reporting | Donation System | Depends on KAN-67 (auth) + KAN-44 |
| 50 | KAN-71 | PCI compliance review | Security | Prerequisite for donation system |
| 51 | KAN-54 | LinkedIn presence | Marketing Strategy | Needs established brand + content first |
| 52 | KAN-55 | Salesforce AppExchange engagement | Marketing Strategy | Needs case studies + traffic baseline |
| 53 | KAN-56 | Partner with Feeding America | Marketing Strategy | Needs demonstrated platform value |
| 54 | KAN-57 | Google Ads campaign | Marketing Strategy | Needs conversion tracking + landing pages |
| 55 | KAN-59 | Email drip campaign | Marketing Strategy | Needs ESP + subscriber base + content calendar |

**Dependencies:**
- KAN-71 → KAN-43 → KAN-44/45 → KAN-46/47/48/49 (full donation chain)
- KAN-57 depends on KAN-92 (GA4 conversion tracking)
- KAN-59 depends on KAN-29 (ESP) + KAN-32 (newsletter template)

---

## Summary

| Tier | Stories | Theme | Key Outcome |
|------|---------|-------|-------------|
| 1 | 9 | Lead capture + discoverability | Newsletter works, Google indexes the site |
| 2 | 8 | Security + foundation | Audited codebase, optimized caching, lead tracking |
| 3 | 11 | Content distribution + monitoring | Email campaigns, SEO strategy, data freshness automation |
| 4 | 14 | Admin tools + analytics | Internal dashboards, UTM tracking, privacy compliance |
| 5 | 13 | Donation system + marketing execution | Stripe payments, paid ads, partnerships |
| **Total** | **55** | | |

### New stories created 2026-04-06
| Key | Story | Epic |
|-----|-------|------|
| KAN-90 | Explore blog/newsletter architecture and integration strategy | Newsletter |
| KAN-91 | Implement caching optimizations from KAN-87 | SEO & Infrastructure |
| KAN-92 | Configure GA4 conversion event tracking | SEO & Infrastructure |
| KAN-93 | SEO readiness audit before search engine submission | SEO & Infrastructure |
| KAN-94 | Establish contact form lead management | Marketing Strategy |
| KAN-95 | Build data freshness monitoring script | Dashboards |
| KAN-96 | Security audit remediation | Security |
| KAN-97 | Set up Google Business Profile | Marketing Strategy |
| KAN-98 | Research alternative data sources for food insecurity | Dashboards |
