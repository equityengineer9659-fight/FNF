# FNF Content Scraper Tool — Complete Build Prompt

> Use this prompt to recreate the entire scraper tool from scratch, including all features, UI components, server endpoints, and integrations.

---

## Overview

Build a **Content Scraper & AI Article Generator** tool for a nonprofit food bank consulting website (Food-N-Force). The tool is a standalone Express + vanilla JS application that:

1. **Scrapes** RSS feeds, Google News, and GDELT for article candidates
2. **Scores and filters** results by keyword relevance (1-5 scale)
3. **Generates original articles** using Claude AI from selected sources
4. **Saves articles directly** to the website's `blog/` directory with full nav/footer injection and blog listing update
5. **Manages published content** — list, delete articles with full cleanup (file removal, config deregistration, Read Next link repair)
6. **Tracks analytics** — session logging, feed/keyword performance, conversion funnel, actionable recommendations

The tool runs at `http://localhost:3001` via `npm run admin` and consists of two files: an Express server (`scraper-server.js`) and a single-page HTML app (`scraper-admin.html`).

---

## Tech Stack

- **Server**: Node.js + Express (ESM imports), port 3001
- **Client**: Single HTML file with inline CSS + vanilla JavaScript (no framework)
- **AI**: Anthropic Claude API (`@anthropic-ai/sdk`)
- **Excel**: SheetJS 0.18.5 (CDN, client-side) + ExcelJS (server-side via scrape engine)
- **RSS**: `rss-parser` npm package
- **Environment**: `.env` file with `ANTHROPIC_API_KEY`
- **Storage**: localStorage (settings), JSON file (analytics), Excel file (article candidates)

---

## File Structure

```
Blog and Article Content/
  scraper-admin.html          # Complete UI (5 tabs, sidebar, all JS/CSS inline)
  scraper-server.js           # Express server with 15 API endpoints
  Articles.xlsx               # Editorial research queue (created by tool)
  scraper-analytics.json      # Analytics data store (gitignored)
scripts/
  scrape-sources.js           # Core scraper engine module
  rss-feeds.json              # RSS feed configuration (30 feeds)
  sync-blog.js                # Rebuilds blog.html card grid from article metadata
build-components.js           # Injects shared nav/footer/scripts into all HTML pages
.env                          # ANTHROPIC_API_KEY (gitignored)
```

---

## Server Endpoints (scraper-server.js)

### Configuration & Status
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/` | Serve scraper-admin.html |
| GET | `/api/server-status` | Return `{ ok, hasApiKey }` for client mode detection |
| GET | `/api/feeds` | Return RSS feed config from `rss-feeds.json` |
| POST | `/api/feeds` | Save updated feed config |
| GET | `/api/categories` | Return category detection keyword rules |
| GET | `/api/excel-status` | Return Articles.xlsx path, row count, exists |

### Scraping
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/scrape` | Run scrape with SSE streaming progress events |

The scrape endpoint accepts a config object (feeds, lookbackDays, keywords, excludeKeywords, categoryRules) and streams Server-Sent Events as articles are found. Each event includes type (info, feed-start, feed-done, new, duplicate, skip, done, error) with article metadata.

### Article Generation & Publishing
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/generate-article` | Send 1-5 source articles to Claude, return structured article JSON |
| POST | `/api/check-slug` | Verify slug uniqueness (`{ taken: boolean }`) |
| POST | `/api/save-article` | Write HTML + optional SVG, auto-register in build pipeline |

**Save-article auto-registration pipeline:**
1. Write `blog/{slug}.html`
2. Write `src/assets/images/illustrations/{slug}.svg` (if SVG provided)
3. Patch `build-components.js` — insert slug into `resourcesSubpages` and `articlePages` arrays (bracket-bounded regex `[^\]]*` to prevent cross-array contamination)
4. Patch `scripts/generate-sitemap.js` — add sitemap entry
5. Patch `.pa11yci.json` — add accessibility test URL
6. Run `node build-components.js` (injects nav/footer)
7. Run `node scripts/sync-blog.js` (rebuilds blog card grid)

**Slug validation**: Both save and delete endpoints validate slugs with `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` to prevent path traversal.

### Content Management
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/articles` | List all published blog articles with metadata |
| POST | `/api/delete-articles` | Delete articles with full cleanup |

**Delete pipeline (4 phases):**
1. Gather info — read HTML to find SVG paths, categories, titles
2. Delete files — remove HTML + SVG, deregister from build-components.js, generate-sitemap.js, .pa11yci.json
3. Repair Read Next links — scan remaining articles, replace dead links (prefer same-category replacement, fallback to any article, last resort link to blog.html)
4. Rebuild — re-run build-components.js + sync-blog.js

### Analytics
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/analytics/session` | Log a scrape session |
| POST | `/api/analytics/action` | Log user action (excel-save, generate, publish) |
| GET | `/api/analytics/summary?days=30` | Return pre-computed dashboard data |

**Analytics summary computes:**
- Feed leaderboard (yield, new, picked, pickRate, avgScore, errors)
- Keyword report (matches, titleHits, picked, pickRate)
- Score distribution with pick rates per score level
- Content funnel (scraped → new → selected → generated → published)
- Session history (last 20)
- Recommendations (7 rules: dead feeds, error-prone feeds, hot keywords, noisy keywords, low avg score, unused web search, scoring miscalibration)

---

## Claude AI Article Generation

**System prompt**: Professional content writer for Food-N-Force, a Salesforce consulting firm helping nonprofit food banks. Tone: Harvard Business Review applied to nonprofit tech sector. Original synthesis (no plagiarism).

**JSON response schema:**
```json
{
  "title": "60-70 char headline",
  "slug": "kebab-case-3-6-words",
  "category": "AI & Innovation | Technology Strategy | Case Studies | Implementation | Industry Insights",
  "description": "140-160 char meta description",
  "readTime": "e.g. '6 min read'",
  "wordCount": 1200,
  "relatedArticles": [{ "slug": "...", "title": "...", "category": "..." }],
  "content": {
    "lead": "2-3 sentence opening paragraph",
    "sections": [{ "heading": "H2 heading", "body": "2-4 paragraphs (\\n\\n separated)", "pullquote": "string or null" }],
    "conclusion": "closing paragraph with CTA"
  }
}
```

---

## UI Architecture (scraper-admin.html)

### Layout
- **Header**: FNF logo, Connect Excel button, Clear Log, Start/Stop Scraping
- **Sidebar** (355px): Presets, date range, keyword tags, exclude tags, feed list, web search config, quality filters, category rules
- **Output panel**: 5-tab interface

### Tab 1: Activity Log
Real-time monospace log with timestamped color-coded entries (info, feed, new, skip, done, warn, err). ARIA live region for screen readers.

### Tab 2: Results
Table with columns: checkbox, title (linked), source, category pill, score badge (1-5), published date, status (New/Dupe). Expandable detail rows with summary + keywords. Toolbar: Select All New, Clear, Sort by Relevance. Save banner for Excel export.

### Tab 3: New Article
**Step 1 — Source Selection** with filter toolbar:
- Dynamic category filter pills (All + categories from results)
- Score minimum buttons (Any ★, ★3+, ★4+, ★5)
- "Showing X of Y" counter
- Redesigned source cards:
  - Score-based left border color (green=5, blue=4, yellow=3, dim=1-2)
  - Category badge (colored pill) + score stars at top
  - Title (2-line clamp)
  - Source name + formatted date + Web badge
  - Summary preview (1-line, faded)
  - Checkbox selection (max 5, others disabled at limit)
  - Selections persist across filter changes (tracked in Set by index)

**Step 2 — Generate**: Button triggers Claude API, progress bar, cancel button, refinement textarea for iterating

**Step 3 — Edit**: Pre-populated form fields (title, slug, category pills, date, description, read time, 3 related articles)

**Step 4 — Save/Download**: Save to blog/ (with auto-registration) or download HTML

### Tab 4: Content Management
- Article inventory table (title, category, published date, file created, SVG status)
- Checkbox selection with Select All/Clear/header checkbox
- Delete Selected button (with confirmation dialog listing titles)
- Status bar showing results of deletion

### Tab 5: Analytics
- Date range selector (7d/30d/90d/All) + Refresh button
- **Recommendations** — colored notice boxes (warning=red, positive=green, info=blue)
- **Content Funnel** — visual bars: Scraped → New → Selected → Generated → Published
- **Score Distribution** — table with bar visualization + pick rates per score
- **Feed Leaderboard** — table: Feed, Yield, New, Picked, Pick%, Avg★, Errors
- **Keyword Effectiveness** — table: Keyword, Matches, Title Hits, Picked, Pick% (with "noisy" flag)
- **Session History** — table: Date, Preset, Found, New, Avg★

---

## Keyword Matching & Scoring

### `kwPhrase(searchLow, phrase)` — returns 0-1 (fractional match)
- **Single word**: word-boundary regex match (prevents "AI" matching "availability")
- **Multi-word phrases**: returns fraction of words found. `"nonprofit digital transformation 2026"` against text with 3 of 4 words → 0.75

### Filter threshold
Articles pass the keyword filter if ANY keyword phrase matches at ≥ 50% of its words. This is more forgiving than requiring all words.

### `scoreArticle(title, summary, keywords)` — returns 1-5
- For each keyword: compute `titleMatch * 2` or `summaryMatch * 1` (take best)
- Track `bestKwScore` (best single keyword, 0-2) and `totalHits` (count of keywords with any match)
- `breadth` bonus = min(totalHits / 3, 1)
- Final ratio = (bestKwScore + breadth) / 3
- Thresholds: ≥0.75→5, ≥0.55→4, ≥0.35→3, ≥0.15→2, else 1

This rewards the **best keyword match** rather than penalizing for unmatched keywords. A perfect title match on one keyword = score 4-5 regardless of how many other keywords don't match.

---

## Built-in Search Presets (5)

| Preset | Keywords | Period | Web |
|--------|----------|--------|-----|
| AI & Innovation | AI nonprofit, generative AI, Einstein AI, artificial intelligence, machine learning, Agentforce, ChatGPT, Salesforce Einstein | 30d | Yes |
| Tech Strategy | Salesforce nonprofit, Nonprofit Cloud, nonprofit technology, digital transformation, fundraising platform, donor management, volunteer management | 30d | Yes |
| Case Studies | nonprofit impact, nonprofit success, case study, food bank, food pantry, nonprofit Salesforce | 60d | Yes |
| Implementation | process automation, volunteer management, digital transformation, Salesforce nonprofit, donor management | 30d | Yes |
| Industry Insights | SNAP, food bank, food pantry, food insecurity, hunger relief, charitable giving, food security | 30d | Yes |

Each preset also has `wskws` (web search keywords) for targeted Google News/GDELT queries.

---

## Analytics Session Tracking

### Client-side collection (during scrape):
- `_aFeedStats` — per-feed: raw, matched, new, duplicate, totalScore, errors
- `_aKwHits` — per-keyword: title hits, summary hits
- `_aScores` — distribution: {1:n, 2:n, 3:n, 4:n, 5:n}
- `_aCats` — per-category count
- Google News + GDELT stats

POST to `/api/analytics/session` at scrape end (fire-and-forget).

### Action hooks (3 points):
1. After Excel save → `logAction('excel-save', { articles })`
2. After Claude generate → `logAction('generate', { sources, slug })`
3. After save to blog → `logAction('publish', { slug, category })`

### Recommendation rules (7):
| Condition | Severity |
|-----------|----------|
| Feed: 0 matched in 5+ sessions | warning |
| Feed: errors >50% of sessions | warning |
| Keyword: pick rate >60% with 10+ matches | positive |
| Keyword: pick rate <10% with 20+ matches | info |
| Avg score <2.5 over 5 sessions | info |
| Web search pick rate <5% over 5 sessions | info |
| >40% of picks have score <3 | info |

---

## CSS Design System

Dark theme (GitHub-inspired):
- Background: `#0d1117`, Cards: `#161b22`, Text: `#c9d1d9`
- Accent: `#58a6ff` (blue), Green: `#3fb950`, Red: `#f85149`, Yellow: `#d29922`, Purple: `#a78bfa`
- Category pills with colored backgrounds (AI=purple, Tech=blue, Impl=green, Cases=yellow, Industry=orange)
- Score badges with colored circles (5=green, 4=blue, 3=yellow, 2-1=dim)
- Monospace font for logs, slugs, code
- Glassmorphism-lite card surfaces
- Collapsible sidebar sections with arrow toggles

---

## Integration with Website Build Pipeline

When an article is saved, the tool automatically:
1. Patches `build-components.js` arrays (resourcesSubpages + articlePages)
2. Patches `scripts/generate-sitemap.js` URL list
3. Patches `.pa11yci.json` accessibility test URLs
4. Runs `build-components.js` → injects nav/footer/scripts
5. Runs `scripts/sync-blog.js` → rebuilds blog.html card grid

When articles are deleted, all of the above is reversed, plus Read Next links in surviving articles are repaired with valid alternatives.

---

## Important Implementation Notes

- **`<\/body>` escaping**: All `</body>`, `</html>`, `</script>` inside JS template literals in the HTML file must be escaped as `<\/body>` etc. to prevent the browser from prematurely closing the script tag.
- **Regex safety**: Use bracket-bounded regex `[^\]]*` (not `[\s\S]*?`) when patching JavaScript arrays to prevent cross-array contamination.
- **No `.test()` before `.replace()` with `g` flag**: The `g` flag advances `lastIndex` after `.test()`, causing `.replace()` to miss matches. Compare before/after string instead.
- **Slug validation**: Always validate with `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` before using in file paths or regexes.
- **Fire-and-forget analytics**: Analytics POST calls should never block or break the primary scraping/save flow.
- **SVG naming**: Article SVG filenames don't always match the slug. When deleting, parse the actual `<img src="...">` tag from the HTML to find the correct SVG path.
- **DNS IPv4**: On Windows with Node 22, add `--dns-result-order=ipv4first` to the CLI command (not just programmatic `dns.setDefaultResultOrder`) because `undici` (native fetch) ignores the programmatic setting.
