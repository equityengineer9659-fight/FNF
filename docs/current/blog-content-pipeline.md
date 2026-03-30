# Blog Content Pipeline

**Last Updated**: 2026-03-30
**Status**: Active — tool is operational, New Article tab added

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
8. Move {slug}.html to the project root
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

**Generate & Download**: Creates `{slug}.html` with full navigation, hero, placeholder content sections, Read Next cards, CTA, and footer. Place in project root. Build-components.js will inject the live nav/footer on the next build.

---

## Search Presets

Five presets are pre-configured for FNF's five content pillars. Click a preset pill to load all keywords, date range, and web search settings instantly.

| Preset | Date Range | Web Search | Topic Keywords |
|--------|-----------|------------|----------------|
| **AI & Innovation** | 30 days | On | food bank AI · predictive analytics nonprofit · machine learning hunger · Salesforce Einstein · generative AI nonprofit |
| **Tech Strategy** | 30 days | On | Salesforce nonprofit cloud · nonprofit CRM · food bank software · donor management system · nonprofit technology |
| **Case Studies** | 60 days | On | food bank case study · nonprofit Salesforce success · food pantry technology results · nonprofit impact story |
| **Implementation** | 30 days | Off | Salesforce implementation nonprofit · food bank workflow · volunteer management nonprofit · nonprofit onboarding · CRM setup food bank |
| **Industry Insights** | 14 days | On | food insecurity · food bank trends · hunger relief · SNAP benefits · food pantry statistics · charitable giving |

Custom presets can be saved with the **"+ Save current as preset"** button.

---

## Configuration Options

### Topic Keywords
Substring match — "nonprofit" matches "nonprofits". Press Enter or comma after each keyword. Leave empty to include all articles from the date range.

### Exclude Keywords
Word-boundary match — more precise to avoid over-exclusion.

### Date Range
7 / 30 / 60 / 90 days, or a Custom date range.

### Web Search
When enabled, runs two searches in addition to RSS feeds:
- **Google News RSS** — primary; uses the same CORS proxy chain as RSS feeds
- **GDELT Project** — secondary global news index; deduplicates against Google News results

### RSS Feeds
Default enabled feeds (confirmed working):

| Feed | Category |
|------|----------|
| NonProfit PRO | Technology Strategy |
| Nonprofit Tech for Good | Technology Strategy |
| The Nonprofit Times | Industry Insights |
| NTEN | Technology Strategy |
| Blue Avocado | Industry Insights |
| Food Research & Action Center | Industry Insights |
| Nonprofit Hub | Industry Insights |
| Candid Blog | Industry Insights |

Default disabled (CORS-blocked or uncertain — enable to try):
- Stanford Social Innovation Review
- Idealist Blog
- Charity Navigator Blog

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
| RSS fetching from browser | Three-tier CORS proxy fallback: direct → allorigins.win → corsproxy.io → codetabs.com |
| RSS/Atom XML parsing | `DOMParser` (browser-native) |
| Excel read/write | SheetJS 0.18.5 from cdnjs CDN |
| File write-back | File System Access API (`showOpenFilePicker` + `createWritable()`) |
| Settings persistence | `localStorage` (feeds, categories, blocklist, custom presets) |
| Article generation | Template literal → Blob → `<a download>` click |

### Critical implementation notes for future development

**`<\/body>` and `<\/html>` in template literals**: The `buildArticleHTML` function returns a full HTML page as a template literal. VS Code Live Server injects its livereload script by searching for the first `</body>` in the file. Raw `</body>` or `</html>` inside a template literal would be found first, corrupting the JavaScript. Always escape these as `<\/body>` and `<\/html>` inside template literals. Same applies to `<\/script>`.

**Init pattern**: The init function (`_doInit`) uses `document.readyState !== 'loading'` check rather than `window.addEventListener('load', ...)`. The inline script is at the bottom of `<body>` so the DOM is ready, but `DOMContentLoaded` hasn't fired yet — the readyState pattern handles both cases reliably.

**`scraper-admin.html` is untracked in git** — changes are not versioned. Consider committing it if making significant improvements.

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
