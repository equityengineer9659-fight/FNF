# Blog Content Pipeline

**Last Updated**: 2026-03-30
**Status**: Active — 30 sources (16 enabled / 14 disabled), fully parallel fetching (RSS + web search), stop button, 6-proxy CORS chain, word-boundary keyword matching, bidirectional dedup. Full multi-agent audit completed 2026-03-30; all Tier 1–4 findings fixed (commit `1ea03e3`).

## Overview

The blog content pipeline has two parts:
1. **Scraper** (`scraper-admin.html`) — find and triage article candidates from RSS feeds and web search, save to `Articles.xlsx`
2. **Article Generator** (`scraper-admin.html` → New Article tab) — scaffold a complete HTML article file from a form, ready to drop into the project root
3. **Blog Sync** (`scripts/sync-blog.js`) — rebuild the blog card grid in `blog.html` from all article HTML files

The tool is **not part of the public website** and is never built or deployed by Vite.

---

## Files

| File | Purpose |
|------|---------|
| `Blog and Article Content/scraper-admin.html` | Complete standalone UI — Scraper + New Article tabs. Open in Live Server. |
| `Blog and Article Content/scraper-server.js` | Alternative Express server version (`npm run admin`) |
| `Blog and Article Content/Articles.xlsx` | Editorial research queue |
| `scripts/scrape-sources.js` | Core scraper module used by the server version |
| `scripts/rss-feeds.json` | Configurable RSS feed source list |
| `scripts/sync-blog.js` | Rebuilds `blog.html` card grid from all article HTML files |

---

## How to Open

**Recommended — VS Code Live Server (no server needed):**
1. Right-click `Blog and Article Content/scraper-admin.html` in VS Code Explorer
2. Select **Open with Live Server**
3. The scraper runs entirely in the browser using CORS proxies

**Alternative — Express server:**
```bash
npm run admin
# Opens at http://localhost:3001
```

---

## Full Workflow: Research → Write → Publish

```
1. Scraper tab: Select a preset (or enter custom keywords)
        ↓
2. Set date range (7 / 30 / 60 / 90 days)
        ↓
3. Toggle web search on/off → Start Scraping
        ↓
4. Review results → check articles to select → Connect Articles.xlsx → Save
        ↓
5. Open Articles.xlsx → review Selected articles → decide on a topic
        ↓
6. New Article tab: Fill in title, slug, category, description, date, related articles
        ↓
7. Click Generate & Download → {slug}.html downloads
        ↓
8. Move {slug}.html to the blog/ folder
        ↓
9. Write content in the HTML file (placeholder sections are marked)
        ↓
10. Run: node scripts/sync-blog.js
        ↓  (or just: npm run build — sync-blog runs automatically)
11. blog.html now shows the new card — done
```

---

## Tabs

### Scraper Tab (default)
Research tool for finding article candidates. See sections below.

### New Article Tab
Generates a complete, ready-to-edit HTML article file from a form.

**Form fields:**
| Field | Notes |
|-------|-------|
| Title | Required |
| Slug | Auto-generated from title (kebab-case), editable. Becomes the filename. |
| Category | Colored pill buttons — AI & Innovation / Tech Strategy / Case Studies / Implementation / Industry Insights |
| Date Published | Date picker, defaults to today |
| Description | Used in meta tags and blog card excerpt |
| Read Time | Defaults to "5 min read" |
| Related Articles (×3) | Title + slug pairs for the "Read Next" section |

**Load from scraper**: If the Results tab has articles from a scrape, a dropdown appears to pre-fill title, description, and category from a selected result.

**Generate & Download**: Creates `{slug}.html` with full navigation, hero, placeholder content sections, Read Next cards, CTA, and footer. Place in the `blog/` folder. Build-components.js will inject the live nav/footer on the next build. The generated canonical URL and og:url are correctly set to `foodnforce.com/blog/{slug}.html`.

---

## Search Presets

Five presets are pre-configured for FNF's five content pillars. Click a preset pill to load all keywords, date range, and web search settings instantly.

| Preset | Date Range | Web Search | Topic Keywords |
|--------|-----------|------------|----------------|
| **AI & Innovation** | 30 days | On | artificial intelligence · machine learning · Salesforce Einstein · generative AI · predictive analytics · AI nonprofit · automation nonprofit |
| **Tech Strategy** | 30 days | On | Salesforce · nonprofit CRM · nonprofit technology · donor management · Nonprofit Cloud · food bank technology · fundraising software |
| **Case Studies** | 60 days | On | food bank · food pantry · nonprofit Salesforce · nonprofit impact · case study · success story · implementation results |
| **Implementation** | 30 days | Off | Salesforce implementation · food bank workflow · volunteer management · nonprofit onboarding · CRM setup · nonprofit operations · digital transformation |
| **Industry Insights** | 14 days | On | food insecurity · food bank · hunger relief · SNAP · food pantry · charitable giving · food security · food assistance · nonprofit trends |

**Note on preset keyword design**: Keywords use 1–2 word phrases to maximize recall. The `kwPhrase()` matcher requires ALL words in a phrase to appear in the article text, so long phrases like "food bank trends" (3 words required) would reject most articles. Shorter phrases like "food bank" (2 words) and "SNAP" (1 word) match much more broadly. Custom presets follow the same rules — prefer short phrases.

Custom presets can be saved with the **"+ Save current as preset"** button.

---

## Configuration Options

### Topic Keywords
Order-independent word matching via `kwPhrase()`:
- **Single words** — substring match ("nonprofit" matches "nonprofits")
- **Multi-word phrases** — all component words must appear anywhere in the text, order-independent. "food bank AI" matches an article containing "AI" and "food bank" anywhere in the title or description, not just as an adjacent phrase.

Press Enter or comma after each keyword. Leave empty to include all articles from the date range.

### Exclude Keywords
Word-boundary match — more precise to avoid over-exclusion.

### Date Range
7 / 30 / 60 / 90 days, or a Custom date range.

### Web Search
When enabled, runs two searches in addition to RSS feeds:
- **Google News RSS** — primary; uses the same CORS proxy chain as RSS feeds
- **GDELT Project** — secondary global news index; deduplicates against Google News results

Web search results (`isWeb = true`) **skip the local keyword filter** — they are already pre-filtered by the search query, and re-filtering against sparse descriptions (GDELT returns `"From domain.com"` as description) would produce false negatives. Failures from Google News or GDELT are logged as warnings, not errors, since the RSS feeds already provide full coverage.

### Sources

The scraper supports three source types:
- **RSS** — standard RSS/Atom feed, fetched via the 6-proxy CORS chain
- **HTML** — blog/news listing page scraped directly; articles extracted via JSON-LD → `<article>` elements → heading+link fallback
- **Google News RSS** — targeted `site:` query against Google News RSS; bypasses bot protection by going through Google's index rather than the site directly

Sources show an **HTML** label in the feeds panel for HTML-type sources. Both appear in the Activity Log with `[HTML]` tag.

#### Default enabled (16 sources)

| Source | Type | Category | Focus |
|--------|------|----------|-------|
| NonProfit PRO | RSS | Technology Strategy | Nonprofit technology and operations |
| Nonprofit Tech for Good | RSS | Technology Strategy | Digital strategy for nonprofits |
| The Nonprofit Times | RSS | Industry Insights | Sector-wide news and management |
| NTEN | RSS | Technology Strategy | Nonprofit technology practitioners |
| Blue Avocado | RSS | Industry Insights | Practical nonprofit management |
| Food Research & Action Center | RSS | Industry Insights | Hunger policy and SNAP research |
| Nonprofit Hub | RSS | Industry Insights | Nonprofit leadership and strategy |
| Nonprofit Quarterly | RSS | Industry Insights | Sector news, social justice, governance |
| Food Bank News | RSS | Industry Insights | Purpose-built trade pub for food bank professionals |
| Food Tank | RSS | Industry Insights | Food systems, food security, SNAP policy, hunger relief innovation |
| WhyHunger | RSS | Industry Insights | Hunger advocacy, food sovereignty, community food systems |
| Bonterra Social Good Blog | RSS | Technology Strategy | Nonprofit CRM, case management, grant management, AI in nonprofits |
| Salesforce Ben | RSS | Technology Strategy | Salesforce platform news, Flow Builder, Einstein AI, Agentforce |
| Feeding America | HTML | Industry Insights | Hunger blog — food bank operations, food insecurity statistics |
| Salesforce Blog (via Google News) | Google News RSS | Technology Strategy | Salesforce.com blog articles via `site:salesforce.com` query — bypasses bot protection |
| Salesforce.org (via Google News) | Google News RSS | Technology Strategy | Salesforce nonprofit content via targeted brand query |

#### Default disabled (14 sources — enable as needed)

| Source | Type | Category | Notes |
|--------|------|----------|-------|
| Bloomerang Blog | RSS | Technology Strategy | Donor CRM, retention, fundraising data |
| Annie E. Casey Foundation | RSS | Industry Insights | Child welfare, poverty research — low frequency |
| WildApricot Blog | RSS | Technology Strategy | Membership/volunteer management |
| Candid Blog | RSS | Industry Insights | Cloudflare-protected — RSS2JSON proxy handles it |
| Stanford Social Innovation Review | RSS | Industry Insights | Cloudflare-protected — RSS2JSON proxy handles it |
| Idealist Blog | RSS | Industry Insights | Cloudflare-protected — RSS2JSON proxy handles it |
| Charity Navigator Blog | RSS | Industry Insights | Cloudflare-protected — RSS2JSON proxy handles it |
| TechSoup Blog | HTML | Technology Strategy | **JS-rendered** — static proxy cannot extract article list; disabled by default |
| Bread for the World | HTML | Industry Insights | Hunger policy and advocacy |
| Urban Institute: Food & Nutrition | HTML | Industry Insights | **JS-rendered** — static proxy cannot extract article list; disabled by default |
| Center for American Progress | HTML | Industry Insights | **JS-rendered** — static proxy cannot extract article list; disabled by default |
| Council of Nonprofits | HTML | Industry Insights | **JS-rendered** — static proxy cannot extract article list; disabled by default |
| Ctr on Budget & Policy Priorities | HTML | Industry Insights | **JS-rendered** — static proxy cannot extract article list; disabled by default |
| AFP Global | HTML | Industry Insights | Association of Fundraising Professionals news |

Cloudflare-protected RSS feeds are disabled by default to reduce scrape time, not because they are unreachable. The 6-proxy chain (RSS2JSON as proxy #6) fetches all four successfully when enabled.

**JS-rendered HTML sources**: TechSoup, Urban Institute, Center for American Progress, Council of Nonprofits, and CBPP render their article listings via JavaScript — the static HTML returned by the CORS proxy is a bare shell with no article links. `fetchHTMLArticles()` returns 0 results for these sites. They are disabled by default; leave them off unless a headless-browser proxy becomes available.

**New default feed merge**: When new default sources are added to `DF`, they are automatically merged into a user's saved feed list on the next page load (by URL match). On/off states for existing feeds are preserved; custom feeds are never removed.

Custom feeds can be added via **"+ Add custom source"**.

### Quality Filters
Domain blocklist that silently drops low-quality sources. Default: `blogspot.com`, `tumblr.com`, `wix.com`, `weebly.com`, `sites.google.com`.

### Category Detection Rules
Editable keyword lists for each category. Detection order: AI & Innovation → Technology Strategy → Case Studies → Implementation → Industry Insights. First match wins.

---

## Results Table

| Column | Description |
|--------|-------------|
| Checkbox | Check to mark as "Selected" in Excel export |
| Title | Linked article title — click to open |
| Source | Feed name or web domain |
| Category | Auto-detected FNF category |
| Score | 1–5 relevance score (title match = 2×, description = 1×). Green = strong, red = weak |
| Published | Article publication date |
| Status | New (not in xlsx) or Dupe (already in xlsx) |

**Click any row** to expand and see the full summary and article link.
**↓ Relevance** sorts by score descending (also auto-sorts at scrape completion).
**Empty state**: If a scrape completes with 0 results matching the keyword filter, a message is shown in the table ("No results matched. Try clearing keywords, expanding the date range, or enabling Web Search.") rather than a blank table.

---

## Excel Integration

### Connecting Articles.xlsx
1. Click **Connect Articles.xlsx** in the header
2. Select the file — existing URLs are loaded for duplicate detection
3. After scraping, new articles are appended automatically

### Status Values in Excel
- `Selected` — article was checked in the results table
- `New` — article was found but not explicitly selected
- `Reviewed`, `Skipped`, `Published` — fill in manually as you work the queue

### Excel Columns
| Column | Description |
|--------|-------------|
| Source URL | Clickable link to the original article |
| Title | Article title |
| Source Name | Feed or domain name |
| Published Date | Original publication date |
| Date Scraped | Date the scraper found it |
| Suggested Category | Auto-detected FNF category |
| Summary | First ~400 chars of description |
| Keywords Found | Which category keywords matched |
| Status | New / Selected / Reviewed / Skipped / Published |
| Notes | Free text for editorial notes |
| Article Slug | Fill in the FNF slug when an article is published |

---

## sync-blog.js

Reads metadata from every article HTML file in the project root and rebuilds the blog card grid in `blog.html` between `<!-- BLOG-CARDS-START -->` and `<!-- BLOG-CARDS-END -->` markers.

```bash
node scripts/sync-blog.js        # run manually
npm run build                    # runs automatically as part of build pipeline
```

**What it extracts from each article:**
- Title — from `<h1 id="article-title">`
- Description — from `<meta name="description">`
- Category — from `article-category-badge article-category--XX` class
- Date — from `<time datetime="YYYY-MM-DD">`
- Read time — from `<span>` after `</time>`

Cards are sorted newest → oldest. Articles without a date go last.

---

## Technical Architecture (Standalone Version)

The standalone HTML file runs entirely in the browser with no backend:

| Concern | Solution |
|---------|---------|
| RSS fetching from browser | 6-proxy CORS chain: direct → allorigins JSON → corsproxy.io → codetabs → allorigins raw → RSS2JSON |
| Cloudflare-protected RSS feeds | RSS2JSON (proxy #6) — dedicated RSS service, bypasses bot protection |
| Bot-protected sites with no RSS | Google News RSS with targeted `site:` queries — Google crawls the site normally; we query Google's index |
| HTML page scraping | `fetchHTMLArticles()` — fetches via proxy chain, parses with DOMParser using 3-strategy fallback (JSON-LD → `<article>` → heading+link) |
| Concurrent fetching | `Promise.all` over all active sources (RSS + HTML + web search) — all start simultaneously, results stream into DOM as each completes |
| Scrape cancellation | `AbortController` per scrape; `AbortSignal.any([timeout, scrapeSignal])` for per-request cancellation |
| RSS/Atom XML parsing | `DOMParser` (browser-native); RSS2JSON responses synthesized into RSS XML before parsing |
| Excel read/write | SheetJS 0.18.5 from cdnjs CDN |
| File write-back | File System Access API (`showOpenFilePicker` + `createWritable()`) |
| Settings persistence | `localStorage` (feeds, categories, blocklist, custom presets) |
| Article generation | Template literal → Blob → `<a download>` click |
| Result IDs | Sequential `_resultSeq` counter (`_id: ++_resultSeq`) — replaces `btoa(url)` which throws on non-ASCII URLs |

### Critical implementation notes for future development

**`<\/body>` and `<\/html>` in template literals**: The `buildArticleHTML` function returns a full HTML page as a template literal. VS Code Live Server injects its livereload script by searching for the first `</body>` in the file. Raw `</body>` or `</html>` inside a template literal would be found first, corrupting the JavaScript. Always escape these as `<\/body>` and `<\/html>` inside template literals. Same applies to `<\/script>`.

**Keyword filter bypassed for web results**: `processItem()` skips the local keyword filter when `isWeb === true`. Do not remove this bypass — Google News and GDELT results arrive pre-filtered by the query and often have no usable description text (GDELT returns `"From domain.com"`), making re-filtering unreliable.

**RSS2JSON response synthesis**: `api.rss2json.com` returns JSON, not XML. The code synthesizes a minimal RSS XML string from the JSON response (escaping `&`, `<`, `>`) so the existing `parseXML()` (DOMParser-based) can handle it unchanged. If RSS2JSON's response shape changes, look for `json.items` and `json.feed`.

**Stop button dispatcher pattern**: The scrape button uses a permanent HTML `onclick` attribute: `onclick="isRunning ? stopScrape() : startScrape()"`. Do NOT replace this with `btn.onclick = stopScrape` in JavaScript — the HTML attribute takes precedence and the JS assignment gets ignored, meaning the stop button never appears.

**`AbortSignal.any()` availability**: `mkFetchSignal(ms)` falls back gracefully if `AbortSignal.any` is not available (Chrome < 116). In that case, only the per-request timeout applies; the Stop button still aborts via the `aborted` check in the feed loop.

**Date timezone fix**: `new Date('YYYY-MM-DD')` parses as UTC midnight and displays one day early in US timezones. Always use `new Date(dateStr + 'T00:00:00')` to force local-time parsing when displaying dates.

**Init pattern**: The init function (`_doInit`) uses `document.readyState !== 'loading'` check rather than `window.addEventListener('load', ...)`. The inline script is at the bottom of `<body>` so the DOM is ready, but `DOMContentLoaded` hasn't fired yet — the readyState pattern handles both cases reliably.

**HTML scraper parsing strategies**: `fetchHTMLArticles()` tries three strategies in order — (1) JSON-LD `<script type="application/ld+json">` for `Article`, `NewsArticle`, `BlogPosting`, `ItemList`, and `CollectionPage` types; (2) `<article>` HTML5 semantic elements with heading + link + optional `<time>`; (3) `h2 a` / `h3 a` patterns scoped to content containers (`main`, `[role="main"]`, `#content`, `.posts`, `.news-list`, `article`, etc.) — scoped to avoid nav/sidebar noise. If all three return fewer than 3 items, the next strategy is tried. If the page returns 0 articles after all strategies, an error is logged for that source.

**Google News RSS as bot-protection bypass**: For sites with no RSS and aggressive bot protection (Salesforce.com, Salesforce.org), targeted Google News RSS queries using `site:domain.com` operators are used. These are standard RSS feeds in the system — no special code path. Results may include articles *about* the site from other sources alongside the site's own content, but keyword filtering handles the noise.

**HTML source type flag**: Feed entries with `type:'html'` call `fetchHTMLArticles()` instead of `fetchFeed()` + `parseXML()`. The feeds panel shows a small "HTML" label next to these source names. The Activity Log shows `[HTML]` for these sources. All other processing (keyword filter, date filter, dedup, scoring, Excel export) is identical to RSS sources.

**`kwPhrase()` word boundary rule**: Single-word keywords use a non-alphanumeric boundary pattern (`(?:^|[^a-z0-9])word(?:[^a-z0-9]|$)`) rather than `String.includes()`. This means "SNAP" no longer matches "snapshot", but "AI" still matches "AI-powered". Multi-word phrases still use the all-words-present logic unchanged. Keep preset keywords short (1–2 words) — three-word phrases require all three words present, which is too strict for most articles.

**Parallelization**: RSS feeds, Google News, and GDELT all run in a single `Promise.all([rssTask, gnTask, gdeltTask])`. Google News and GDELT no longer wait for RSS feeds to finish. The shared `seenWebUrls` Set provides bidirectional deduplication between Google News and GDELT results.

**Empty feed logging**: When a feed is fetched successfully but returns 0 items for the date window, the Activity Log shows `"Feed OK but no articles in last X days"` — distinguishable from keyword filtering (`"X filtered by keywords"`) and fetch errors (`"Feed unreachable…"`).

**localStorage key versioning**: The feed on/off state is stored under `fnf2_feeds_vN`. Bump `N` whenever default `on` states change in the `DF` array — the merge logic only adds new feeds, it does not update existing feeds' on/off state. Current key: `fnf2_feeds_v6`.

**Custom date range validation**: `getLB()` returns `null` when custom From/To fields are empty or invalid (instead of silently returning NaN). `startScrape()` guards for null and exits cleanly. Any future caller of `getLB()` must also handle the null return.

**Excel formula injection protection**: In `saveToExcel()`, article titles starting with `=`, `+`, `-`, or `@` are prefixed with a `'` character before writing. This prevents Excel from interpreting scraped titles as formula cells. The stored title string in `allResults` is unchanged — only the Excel row value is sanitized.

**Blob URL memory management**: `downloadExcel()` and `generateArticle()` both call `URL.revokeObjectURL(href)` in a 100ms `setTimeout` after triggering the download click. Without revocation, each download creates a permanent memory leak in the browser session.

**JSON-LD newline escaping in `j()`**: The `j()` function inside `buildArticleHTML()` now escapes `\n`, `\r`, `\t`, U+2028, and U+2029 in addition to `\` and `"`. Multi-line descriptions entered in the form no longer break the `<script type="application/ld+json">` structured data block.

**Tab ARIA pattern**: The tabs use `role="tablist"` / `role="tab"` / `role="tabpanel"`. The `showTab()` function keeps `aria-selected` and `tabindex` in sync. The log panel has `aria-live="polite"` so new log entries are announced by screen readers. An additional hidden `role="alert" aria-live="assertive"` region (`#err-live`) announces errors immediately.

**`saveLS()` quota handling**: `saveLS()` now logs a visible `[WARN]` entry in the Activity Log when `localStorage.setItem` throws a `QuotaExceededError`, instead of silently discarding the write.

---

## Recommended Cadence

| Schedule | Settings | Purpose |
|----------|---------|---------|
| Weekly | 7-day lookback · Web search on · Industry Insights preset | Catch breaking news to comment on |
| Monthly | 60-day lookback · Web search on · rotate through all 5 presets | Deep research for evergreen articles |
| On-demand | Custom keywords · 90 days | Research for a specific planned article |

---

## Content Strategy Notes

The scraper surfaces article candidates — it does not generate content. The intended workflow is:

1. Run a preset search → review results by relevance score
2. Open the 5–10 highest-scoring articles
3. Identify a topic your clients ask about that these articles address
4. Write your version with Food-N-Force's specific Salesforce + food bank angle

**What the scraper is NOT for**: Finding articles to republish or summarize. It's a research tool to understand what's being written so your original articles are better positioned.

**Content angle that differentiates FNF**: Most nonprofit tech content is generic. FNF's edge is the intersection of food bank operations + Salesforce implementation specifics.

---

## Committing Scraper Improvements

`scraper-admin.html` is tracked in git. Every meaningful improvement should be committed so you can iterate, compare versions, and roll back if something breaks.

### What to commit after making changes

```bash
git add "Blog and Article Content/scraper-admin.html"
git add docs/current/blog-content-pipeline.md   # if docs were updated
git commit -m "Scraper: brief description of what changed"
git push
```

### What counts as a commit-worthy change
- Adding or removing a source from the `DF` array
- Changing keyword presets (`BUILTIN_PRESETS`) or category detection rules (`DC`)
- Any change to fetch logic, proxy chain, or parsing strategies
- Bug fixes to keyword matching, dedup, scoring, or date handling
- UI changes (new tabs, log improvements, result table columns)
- Bumping the localStorage key (`fnf2_feeds_vN`)

### What does NOT need a commit
- Manually toggling sources on/off in the feeds panel (saved to localStorage, not the file)
- Saving a custom preset via the UI (also localStorage only)
- Connecting an Excel file

### Rolling back to a previous version

```bash
# See recent scraper commits
git log --oneline -- "Blog and Article Content/scraper-admin.html"

# Restore a specific version (replace <hash> with the commit hash)
git checkout <hash> -- "Blog and Article Content/scraper-admin.html"

# Then commit the rollback
git add "Blog and Article Content/scraper-admin.html"
git commit -m "Scraper: roll back to <hash> — reason"
git push
```

### Pushing to GitHub does NOT deploy to SiteGround

The scraper tool (`Blog and Article Content/`) is never included in the Vite build output. Pushing to `master` triggers the CI/CD pipeline which deploys the public website — the scraper files are invisible to that process. Git is used here purely for version history.
