---
paths:
  - "blog/**"
  - "Blog and Article Content/**"
  - "scripts/sync-blog.js"
  - "scripts/generate-sitemap.js"
---

# Blog Content Pipeline

## Article Structure
- **53 articles** in `blog/` (HTML files)
- 10 articles are categorized as "Case Studies" (appear on `blog.html` + `case-studies.html`)
- All articles auto-discovered by `build-components.js`, `sync-blog.js`, and `generate-sitemap.js` via glob — no config edits needed when adding articles

## Adding Articles via Scraper Tool (recommended)
1. `npm run admin` (starts Express at http://localhost:3001) — requires `ANTHROPIC_API_KEY` in `.env`
2. **Scraper tab** → select RSS sources → fetch articles
3. **New Article tab** → select a scraped article → Generate with Claude → Preview → Save to blog/
4. Build scripts (`build-components.js` + `sync-blog.js`) run automatically on Save
5. Run `/create-illustration {slug}` in Claude Code to generate the SVG illustration (done separately for quality)

See `docs/current/blog-content-pipeline.md` for full workflow including RSS source management and known gotchas (also in memory: `project_scraper_tool.md` — 7 critical technical gotchas).

## Adding Articles Manually
1. Create HTML file in `blog/` following existing article structure
2. Run `/register-article {slug}` (skill auto-runs build scripts)
   - Or manually: `node build-components.js && node scripts/sync-blog.js`
3. Run `/create-illustration {slug}` for the SVG illustration
4. Verify: `npm run build` → inspect `blog.html` card grid and sitemap.xml

## Build Script Responsibilities
- `build-components.js` — injects nav/footer/dashboard-tabs/script tags into all 71 pages (auto-discovers blog articles)
- `scripts/sync-blog.js` — rebuilds `blog.html` card grid from article frontmatter/metadata
- `scripts/generate-sitemap.js` — writes `sitemap.xml` (auto-discovers all pages)
- `scripts/generate-pa11y-config.js` — writes `.pa11yci.json`; use `--mode=full` for all pages or `--mode=sample` for push CI

## Blog and Article Content/ Directory
Active workspace for the scraper/AI pipeline — **not deployed** (excluded from Vite build and rsync). Contains scraper server, editorial artifacts, and generated outputs. Do not delete.
