/**
 * FNF Content Scraper Admin Server
 * Run: node "Blog and Article Content/scraper-server.js"
 * Then open: http://localhost:3001
 *
 * AI generation requires ANTHROPIC_API_KEY in .env at project root
 */

import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first'); // Fixes APIConnectionError on Windows where IPv6 fails for api.anthropic.com

import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import Anthropic from '@anthropic-ai/sdk';
import { scrapeFeeds, DEFAULT_CATEGORIES, getExcelRowCount } from '../scripts/scrape-sources.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

const PORT = 3001;
const XLSX_PATH = path.join(__dirname, 'Articles.xlsx');
const FEEDS_CONFIG_PATH = path.join(PROJECT_ROOT, 'scripts', 'rss-feeds.json');
const BLOG_DIR = path.join(PROJECT_ROOT, 'blog');
const ILLUSTRATIONS_DIR = path.join(PROJECT_ROOT, 'src', 'assets', 'images', 'illustrations');
const BUILD_COMPONENTS_PATH = path.join(PROJECT_ROOT, 'build-components.js');
const SITEMAP_SCRIPT_PATH = path.join(PROJECT_ROOT, 'scripts', 'generate-sitemap.js');
const PA11YCI_PATH = path.join(PROJECT_ROOT, '.pa11yci.json');
const ANALYTICS_PATH = path.join(__dirname, 'scraper-analytics.json');

let anthropic = null;
try {
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your-api-key-here') {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
} catch (e) { console.error('Anthropic init failed:', e.message); }

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

// Serve the admin page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'scraper-admin.html'));
});

// GET /api/server-status — used by scraper-admin.html to detect server mode vs Live Server
app.get('/api/server-status', (req, res) => {
  res.json({ ok: true, hasApiKey: !!anthropic });
});

// GET /api/feeds — return current feeds config
app.get('/api/feeds', (req, res) => {
  try {
    const feeds = JSON.parse(readFileSync(FEEDS_CONFIG_PATH, 'utf-8'));
    res.json(feeds);
  } catch (err) {
    res.status(500).json({ error: `Could not load feeds config: ${err.message}` });
  }
});

// POST /api/feeds — save updated feeds config (persist custom feeds)
app.post('/api/feeds', (req, res) => {
  try {
    writeFileSync(FEEDS_CONFIG_PATH, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: `Could not save feeds config: ${err.message}` });
  }
});

// GET /api/categories — return default category detection rules
app.get('/api/categories', (req, res) => {
  res.json(DEFAULT_CATEGORIES);
});

// GET /api/excel-status — current row count and file existence
app.get('/api/excel-status', async (req, res) => {
  try {
    const rowCount = await getExcelRowCount(XLSX_PATH);
    res.json({ path: XLSX_PATH, rowCount, exists: existsSync(XLSX_PATH) });
  } catch (err) {
    res.json({ path: XLSX_PATH, rowCount: 0, exists: false, error: err.message });
  }
});

// POST /api/scrape — run scraper, stream events via SSE
app.post('/api/scrape', async (req, res) => {
  const config = { ...req.body, xlsxPath: XLSX_PATH };
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();
  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);
  try {
    await scrapeFeeds(config, send);
  } catch (err) {
    send({ type: 'error', message: err.message });
  }
  res.end();
});

// ---------------------------------------------------------------------------
// POST /api/generate-article — Claude AI article generation
// Body: { sources: [{title, url, summary, src, cat}], existingArticles: [...slugs], feedback?: string }
// ---------------------------------------------------------------------------
app.post('/api/generate-article', async (req, res) => {
  if (!anthropic) {
    return res.status(503).json({ error: 'No API key configured. Add ANTHROPIC_API_KEY to .env and restart the server.' });
  }

  const { sources, existingArticles = [], feedback = '' } = req.body;
  if (!sources || !sources.length) {
    return res.status(400).json({ error: 'At least one source is required.' });
  }

  const sourcesText = sources.map((s, i) =>
    `SOURCE ${i + 1}: ${s.title}\nURL: ${s.url}\nPublished by: ${s.src}\nCategory hint: ${s.cat}\nSummary: ${s.summary || '(no summary available)'}`
  ).join('\n\n');

  const existingList = existingArticles.slice(0, 40).join(', ');

  const feedbackLine = feedback
    ? `\n\nUSER FEEDBACK ON PREVIOUS DRAFT: ${feedback}\nRevise the article to address this feedback.`
    : '';

  const articleSchema = `{
  "title": "string — compelling 60-70 character headline",
  "slug": "string — kebab-case filename, 3-6 words, no numbers",
  "category": "one of: AI & Innovation | Technology Strategy | Case Studies | Implementation | Industry Insights",
  "description": "string — 140-160 character meta description and blog card excerpt",
  "readTime": "string — e.g. '6 min read'",
  "wordCount": number,
  "relatedArticles": [
    { "slug": "existing-slug-from-list", "title": "Article Title", "category": "category name" },
    { "slug": "existing-slug-from-list", "title": "Article Title", "category": "category name" },
    { "slug": "existing-slug-from-list", "title": "Article Title", "category": "category name" }
  ],
  "content": {
    "lead": "string — 2-3 sentence opening paragraph that hooks the reader",
    "sections": [
      {
        "heading": "string — H2 section heading",
        "body": "string — 2-4 paragraphs of prose separated by \\\\n\\\\n",
        "pullquote": "string or null — one memorable sentence for a callout aside"
      }
    ],
    "conclusion": "string — closing paragraph, forward-looking and action-oriented"
  }
}`;

  try {
    // --- Call 1: Generate article content ---
    const articleMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: `You are a professional content writer for Food-N-Force, a Salesforce consulting firm that helps nonprofit food banks and pantries modernize their operations. Your writing is authoritative, practical, and accessible — the tone of Harvard Business Review applied to the nonprofit technology sector.

Your articles synthesize insights from provided sources without plagiarizing. You add original analysis, professional advice, and FNF's perspective on Salesforce solutions for food banks. Your audience is nonprofit directors, food bank operations managers, and technology decision-makers.

Always respond with valid JSON only — no markdown code fences, no preamble, no explanation. Start your response with { and end with }.`,
      messages: [{
        role: 'user',
        content: `Write a professional blog article for Food-N-Force based on these sources:

${sourcesText}${feedbackLine}

Existing articles on the FNF blog (choose 3 most topically relevant for relatedArticles):
${existingList}

Requirements:
- Write 650-900 words of article body content across 3-5 H2 sections
- Do not plagiarize — synthesize and add original professional analysis
- Include at least one pullquote per section (set to null if none fits naturally)
- The description must work as both an SEO meta description and a blog card excerpt
- Choose slug that does not match any existing article in the list above
- Word count should reflect the actual body content length

Return ONLY valid JSON matching this exact schema:
${articleSchema}`
      }]
    });

    let articleData;
    try {
      articleData = JSON.parse(articleMsg.content[0].text);
    } catch {
      return res.status(500).json({ error: 'Claude returned invalid JSON for article. Try again.' });
    }

    // Auto-calculate read time from word count (200 wpm)
    if (articleData.wordCount && articleData.wordCount > 0) {
      articleData.readTime = `${Math.max(1, Math.round(articleData.wordCount / 200))} min read`;
    }

    res.json(articleData);

  } catch (err) {
    const msg = err.status === 401 ? 'Invalid API key — check your ANTHROPIC_API_KEY in .env'
      : err.status === 429 ? 'Rate limit hit — wait a moment and try again'
      : `Claude API error: ${err.message}`;
    res.status(err.status || 500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// POST /api/check-slug — check if a slug is already taken
// Body: { slug: string }
// ---------------------------------------------------------------------------
app.post('/api/check-slug', (req, res) => {
  const { slug } = req.body;
  if (!slug) return res.status(400).json({ error: 'slug required.' });
  const htmlPath = path.join(BLOG_DIR, `${slug}.html`);
  res.json({ taken: existsSync(htmlPath) });
});

// ---------------------------------------------------------------------------
// POST /api/save-article — write HTML + SVG to project, auto-register, and build
// Body: { slug, html, svgCode, autoRegister }
// ---------------------------------------------------------------------------
app.post('/api/save-article', (req, res) => {
  const { slug, html, svgCode, autoRegister = true } = req.body;
  if (!slug || !html) return res.status(400).json({ error: 'slug and html are required.' });
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return res.status(400).json({ error: 'Invalid slug format.' });

  const htmlPath = path.join(BLOG_DIR, `${slug}.html`);
  const svgPath = path.join(ILLUSTRATIONS_DIR, `${slug}.svg`);

  try {
    // Write HTML article
    if (!existsSync(BLOG_DIR)) mkdirSync(BLOG_DIR, { recursive: true });
    writeFileSync(htmlPath, html, 'utf-8');

    // Write SVG illustration
    if (svgCode) {
      if (!existsSync(ILLUSTRATIONS_DIR)) mkdirSync(ILLUSTRATIONS_DIR, { recursive: true });
      writeFileSync(svgPath, svgCode, 'utf-8');
    }

    const registered = [];

    if (autoRegister) {
      // 1. Patch build-components.js — update BOTH arrays: resourcesSubpages and articlePages
      // Uses bracket-bounded regex ([^\]]*) so it never escapes the target array,
      // even when the last entry has a trailing comma before ];
      if (existsSync(BUILD_COMPONENTS_PATH)) {
        let src = readFileSync(BUILD_COMPONENTS_PATH, 'utf-8');
        if (!src.includes(`'${slug}'`)) {
          // Helper: inserts slug before the closing ] of the named array
          const insertIntoArray = (source, arrayName) =>
            source.replace(
              new RegExp(`(const ${arrayName}\\s*=\\s*\\[)([^\\]]*)(`  + `\\])`),
              (m, open, content, close) =>
                `${open}${content.trimEnd()}\n  '${slug}',\n${close}`
            );

          src = insertIntoArray(src, 'resourcesSubpages');
          src = insertIntoArray(src, 'articlePages');
          writeFileSync(BUILD_COMPONENTS_PATH, src, 'utf-8');
          registered.push('build-components.js');
        }
      }

      // 2. Patch scripts/generate-sitemap.js
      if (existsSync(SITEMAP_SCRIPT_PATH)) {
        let src = readFileSync(SITEMAP_SCRIPT_PATH, 'utf-8');
        if (!src.includes(`'${slug}'`) && !src.includes(`"${slug}"`)) {
          src = src.replace(
            /('([a-z0-9-]+)',?\s*\/\/\s*last article[\s\S]*?\];)|('([a-z0-9-]+)'\s*\n(\s*\];))/,
            (match) => match.replace(/(\s*\];)$/, `,\n  '${slug}'$1`)
          );
          // Fallback: append before closing bracket if pattern didn't match
          if (!src.includes(`'${slug}'`)) {
            src = src.replace(
              /('([a-z0-9-]+)'\s*\n?([ \t]*)\];)/,
              `'$2'\n$3  '${slug}'\n$3];`
            );
          }
          if (src.includes(`'${slug}'`)) {
            writeFileSync(SITEMAP_SCRIPT_PATH, src, 'utf-8');
            registered.push('generate-sitemap.js');
          }
        }
      }

      // 3. Patch .pa11yci.json
      if (existsSync(PA11YCI_PATH)) {
        const pa11y = JSON.parse(readFileSync(PA11YCI_PATH, 'utf-8'));
        const newUrl = `http://localhost:4173/blog/${slug}.html`;
        if (pa11y.urls && !pa11y.urls.includes(newUrl)) {
          pa11y.urls.push(newUrl);
          writeFileSync(PA11YCI_PATH, JSON.stringify(pa11y, null, 2) + '\n', 'utf-8');
          registered.push('.pa11yci.json');
        }
      }

      // 4. Run build-components.js — injects nav/footer/scripts into the new article HTML
      try {
        execSync('node build-components.js', { cwd: PROJECT_ROOT, stdio: 'pipe' });
        registered.push('build-components (nav/footer injected)');
      } catch (buildErr) {
        console.error('build-components.js failed:', buildErr.message);
      }

      // 5. Run sync-blog.js — rebuilds blog.html card grid so new article appears in listing
      try {
        execSync('node scripts/sync-blog.js', { cwd: PROJECT_ROOT, stdio: 'pipe' });
        registered.push('sync-blog (blog listing updated)');
      } catch (syncErr) {
        console.error('sync-blog.js failed:', syncErr.message);
      }
    }

    res.json({
      saved: true,
      articlePath: `blog/${slug}.html`,
      svgPath: svgCode ? `src/assets/images/illustrations/${slug}.svg` : null,
      registered
    });

  } catch (err) {
    res.status(500).json({ error: `Save failed: ${err.message}` });
  }
});

// ---------------------------------------------------------------------------
// GET /api/articles — list all blog articles with metadata
// ---------------------------------------------------------------------------
app.get('/api/articles', (req, res) => {
  try {
    if (!existsSync(BLOG_DIR)) return res.json({ articles: [] });
    const files = readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'));
    const articles = files.map(f => {
      const slug = f.replace(/\.html$/, '');
      const filePath = path.join(BLOG_DIR, f);
      const html = readFileSync(filePath, 'utf-8');

      const titleM = html.match(/<h1[^>]*(?:id="article-title"|class="[^"]*article-hero__title[^"]*")[^>]*>([\s\S]*?)<\/h1>/);
      const title = titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : slug.replace(/-/g, ' ');

      const dateM = html.match(/<time\s+datetime="([^"]+)"/);
      const publishedDate = dateM ? dateM[1] : '';

      const catM = html.match(/article-category-badge[^"]*"[^>]*>([\s\S]*?)<\/span>/);
      const category = catM ? catM[1].replace(/<[^>]+>/g, '').trim() : '';

      const svgM = html.match(/<img\s+[^>]*src="([^"]*illustrations\/[^"]+\.svg)"/);
      const svgPath = svgM ? svgM[1] : null;

      const rtM = html.match(/<\/time>\s*<span[^>]*>([\d]+ min read)<\/span>/);
      const readTime = rtM ? rtM[1] : '';

      let fileCreated = '';
      try { fileCreated = statSync(filePath).birthtime.toISOString().slice(0, 10); } catch {}

      return { slug, title, publishedDate, category, svgPath, readTime, fileCreated };
    });

    articles.sort((a, b) => (b.publishedDate || '').localeCompare(a.publishedDate || ''));
    res.json({ articles });
  } catch (err) {
    res.status(500).json({ error: `Failed to list articles: ${err.message}` });
  }
});

// ---------------------------------------------------------------------------
// POST /api/delete-articles — delete articles and clean up all references
// Body: { slugs: ['slug1', 'slug2'] }
// ---------------------------------------------------------------------------
app.post('/api/delete-articles', (req, res) => {
  const { slugs } = req.body;
  if (!Array.isArray(slugs) || !slugs.length) {
    return res.status(400).json({ error: 'slugs array is required.' });
  }
  if (!slugs.every(s => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s))) {
    return res.status(400).json({ error: 'Invalid slug format.' });
  }

  const deletedSet = new Set(slugs);
  const warnings = [];
  let htmlRemoved = 0;
  let svgRemoved = 0;

  try {
    // Phase 1 — Gather info before deleting
    const doomedInfo = {};  // slug → { svgAbsPath, category, title, readTime }
    for (const slug of slugs) {
      const htmlPath = path.join(BLOG_DIR, `${slug}.html`);
      if (!existsSync(htmlPath)) {
        warnings.push(`${slug}.html not found — skipped`);
        continue;
      }
      const html = readFileSync(htmlPath, 'utf-8');
      const svgM = html.match(/<img\s+[^>]*src="([^"]*illustrations\/[^"]+\.svg)"/);
      const svgRelPath = svgM ? svgM[1] : null;
      const svgAbsPath = svgRelPath
        ? path.join(PROJECT_ROOT, svgRelPath.replace(/^\//, ''))
        : null;
      const catM = html.match(/article-category-badge[^"]*"[^>]*>([\s\S]*?)<\/span>/);
      const titleM = html.match(/<h1[^>]*(?:id="article-title"|class="[^"]*article-hero__title[^"]*")[^>]*>([\s\S]*?)<\/h1>/);
      const rtM = html.match(/<\/time>\s*<span[^>]*>([\d]+ min read)<\/span>/);
      doomedInfo[slug] = {
        svgAbsPath,
        category: catM ? catM[1].replace(/<[^>]+>/g, '').trim() : '',
        title: titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : slug,
        readTime: rtM ? rtM[1] : '4 min read'
      };
    }

    // Build remaining-articles catalog (for Read Next repairs)
    const remainingCatalog = [];
    if (existsSync(BLOG_DIR)) {
      for (const f of readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'))) {
        const s = f.replace(/\.html$/, '');
        if (deletedSet.has(s)) continue;
        const html = readFileSync(path.join(BLOG_DIR, f), 'utf-8');
        const titleM = html.match(/<h1[^>]*(?:id="article-title"|class="[^"]*article-hero__title[^"]*")[^>]*>([\s\S]*?)<\/h1>/);
        const catM = html.match(/article-category-badge[^"]*"[^>]*>([\s\S]*?)<\/span>/);
        const rtM = html.match(/<\/time>\s*<span[^>]*>([\d]+ min read)<\/span>/);
        remainingCatalog.push({
          slug: s,
          title: titleM ? titleM[1].replace(/<[^>]+>/g, '').trim() : s.replace(/-/g, ' '),
          category: catM ? catM[1].replace(/<[^>]+>/g, '').trim() : 'Industry Insights',
          readTime: rtM ? rtM[1] : '4 min read'
        });
      }
    }

    // Phase 2 — Delete files
    for (const slug of slugs) {
      const htmlPath = path.join(BLOG_DIR, `${slug}.html`);
      try { unlinkSync(htmlPath); htmlRemoved++; } catch { warnings.push(`Could not delete ${slug}.html`); }

      const info = doomedInfo[slug];
      if (info && info.svgAbsPath && existsSync(info.svgAbsPath)) {
        try { unlinkSync(info.svgAbsPath); svgRemoved++; } catch { warnings.push(`Could not delete SVG for ${slug}`); }
      }
    }

    // Phase 2b — Deregister from config files
    const configsPatched = [];

    // Patch build-components.js
    if (existsSync(BUILD_COMPONENTS_PATH)) {
      let src = readFileSync(BUILD_COMPONENTS_PATH, 'utf-8');
      let changed = false;
      for (const slug of slugs) {
        const before = src;
        src = src.replace(new RegExp(`\\s*'${slug}',?\\n?`, 'g'), '\n');
        if (src !== before) changed = true;
      }
      if (changed) {
        // Clean up any blank lines that result from removal
        src = src.replace(/\n{3,}/g, '\n\n');
        writeFileSync(BUILD_COMPONENTS_PATH, src, 'utf-8');
        configsPatched.push('build-components.js');
      }
    }

    // Patch generate-sitemap.js
    if (existsSync(SITEMAP_SCRIPT_PATH)) {
      let src = readFileSync(SITEMAP_SCRIPT_PATH, 'utf-8');
      let changed = false;
      for (const slug of slugs) {
        const before = src;
        src = src.replace(new RegExp(`\\s*\\{\\s*path:\\s*'blog/${slug}\\.html'[^}]*\\},?\\n?`), '\n');
        if (src !== before) changed = true;
      }
      if (changed) {
        src = src.replace(/\n{3,}/g, '\n\n');
        writeFileSync(SITEMAP_SCRIPT_PATH, src, 'utf-8');
        configsPatched.push('generate-sitemap.js');
      }
    }

    // Patch .pa11yci.json
    if (existsSync(PA11YCI_PATH)) {
      const pa11y = JSON.parse(readFileSync(PA11YCI_PATH, 'utf-8'));
      const before = pa11y.urls.length;
      pa11y.urls = pa11y.urls.filter(u => {
        for (const slug of slugs) {
          if (u.includes(`/blog/${slug}.html`)) return false;
        }
        return true;
      });
      if (pa11y.urls.length < before) {
        writeFileSync(PA11YCI_PATH, JSON.stringify(pa11y, null, 2) + '\n', 'utf-8');
        configsPatched.push('.pa11yci.json');
      }
    }

    // Phase 3 — Repair Read Next links in remaining articles
    const readNextRepairs = [];

    for (const f of readdirSync(BLOG_DIR).filter(f => f.endsWith('.html'))) {
      const articleSlug = f.replace(/\.html$/, '');
      const filePath = path.join(BLOG_DIR, f);
      let html = readFileSync(filePath, 'utf-8');

      // Find all Read Next hrefs in this article
      const readNextRe = /<a\s+href="([^"]+\.html)"\s+class="article-read-next__card">([\s\S]*?)<\/a>/g;
      let repairCount = 0;
      const currentHrefs = new Set();
      // First pass: collect current hrefs
      let m;
      const tempRe = /href="([^"]+\.html)"\s+class="article-read-next__card"/g;
      while ((m = tempRe.exec(html)) !== null) {
        currentHrefs.add(m[1].replace(/\.html$/, ''));
      }

      // Second pass: replace dead links
      html = html.replace(readNextRe, (match, href) => {
        const linkedSlug = href.replace(/\.html$/, '');
        if (!deletedSet.has(linkedSlug)) return match;

        // Find replacement: prefer same category
        const deadCategory = match.match(/article-read-next__card-category">([\s\S]*?)<\/span>/);
        const deadCat = deadCategory ? deadCategory[1].replace(/&amp;/g, '&').trim() : '';

        let replacement = null;
        // Same category, not already linked, not self
        replacement = remainingCatalog.find(r =>
          r.slug !== articleSlug &&
          !currentHrefs.has(r.slug) &&
          r.category === deadCat
        );
        // Fallback: any category, not already linked, not self
        if (!replacement) {
          replacement = remainingCatalog.find(r =>
            r.slug !== articleSlug &&
            !currentHrefs.has(r.slug)
          );
        }

        if (replacement) {
          currentHrefs.add(replacement.slug); // prevent duplicate in next replacement
          repairCount++;
          const catEsc = replacement.category.replace(/&/g, '&amp;');
          return `<a href="${replacement.slug}.html" class="article-read-next__card">` +
            `\n                    <span class="article-read-next__card-category">${catEsc}</span>` +
            `\n                    <span class="article-read-next__card-title">${replacement.title}</span>` +
            `\n                    <span class="article-read-next__card-meta">${replacement.readTime}</span>` +
            `\n                </a>`;
        }

        // Last resort: link to blog listing
        repairCount++;
        return `<a href="../blog.html" class="article-read-next__card">` +
          `\n                    <span class="article-read-next__card-category">All Articles</span>` +
          `\n                    <span class="article-read-next__card-title">Explore More Articles</span>` +
          `\n                    <span class="article-read-next__card-meta">Browse all</span>` +
          `\n                </a>`;
      });

      if (repairCount > 0) {
        writeFileSync(filePath, html, 'utf-8');
        readNextRepairs.push({ article: articleSlug, replacements: repairCount });
      }
    }

    // Phase 4 — Rebuild
    const rebuilt = [];
    try {
      execSync('node build-components.js', { cwd: PROJECT_ROOT, stdio: 'pipe' });
      rebuilt.push('build-components');
    } catch (e) { warnings.push(`build-components.js failed: ${e.message}`); }

    try {
      execSync('node scripts/sync-blog.js', { cwd: PROJECT_ROOT, stdio: 'pipe' });
      rebuilt.push('sync-blog');
    } catch (e) { warnings.push(`sync-blog.js failed: ${e.message}`); }

    res.json({
      deleted: slugs,
      filesRemoved: { html: htmlRemoved, svg: svgRemoved },
      configsPatched,
      readNextRepairs,
      rebuilt,
      warnings
    });

  } catch (err) {
    res.status(500).json({ error: `Delete failed: ${err.message}` });
  }
});

// ---------------------------------------------------------------------------
// ANALYTICS — session logging, action tracking, and summary computation
// ---------------------------------------------------------------------------
function readAnalytics() {
  try {
    if (existsSync(ANALYTICS_PATH)) return JSON.parse(readFileSync(ANALYTICS_PATH, 'utf-8'));
  } catch { /* corrupt file — start fresh */ }
  return { sessions: [], actions: [] };
}
function writeAnalytics(data) {
  writeFileSync(ANALYTICS_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

app.post('/api/analytics/session', (req, res) => {
  try {
    const data = readAnalytics();
    data.sessions.push(req.body);
    writeAnalytics(data);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/analytics/action', (req, res) => {
  try {
    const data = readAnalytics();
    data.actions.push(req.body);
    writeAnalytics(data);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/analytics/summary', (req, res) => {
  try {
    const data = readAnalytics();
    const days = parseInt(req.query.days) || 30;
    const cutoff = days > 0 ? new Date(Date.now() - days * 86400000).toISOString() : '';
    const sessions = cutoff ? data.sessions.filter(s => s.ts >= cutoff) : data.sessions;
    const actions = cutoff ? data.actions.filter(a => a.ts >= cutoff) : data.actions;

    // Build picked-article index: source name → count, keyword → count, score → count
    const pickedBySource = {};
    const pickedByKeyword = {};
    const pickedByScore = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalPicked = 0;
    for (const a of actions) {
      const arts = a.articles || a.sources || [];
      for (const art of arts) {
        totalPicked++;
        const src = art.source || '';
        pickedBySource[src] = (pickedBySource[src] || 0) + 1;
        if (art.score >= 1 && art.score <= 5) pickedByScore[art.score]++;
        for (const kw of (art.keywords || [])) {
          pickedByKeyword[kw] = (pickedByKeyword[kw] || 0) + 1;
        }
      }
    }

    // Feed leaderboard
    const feedAgg = {};
    for (const s of sessions) {
      for (const f of (s.feeds || [])) {
        if (!feedAgg[f.name]) feedAgg[f.name] = { yield: 0, new: 0, totalScore: 0, scored: 0, errors: 0, sessions: 0 };
        const fa = feedAgg[f.name];
        fa.yield += (f.matched || 0);
        fa.new += (f.new || 0);
        if (f.avgScore && f.matched) { fa.totalScore += f.avgScore * f.matched; fa.scored += f.matched; }
        if (f.error) fa.errors++;
        fa.sessions++;
      }
    }
    const feedLeaderboard = Object.entries(feedAgg).map(([name, fa]) => ({
      name,
      yield: fa.yield,
      new: fa.new,
      picked: pickedBySource[name] || 0,
      pickRate: fa.new > 0 ? Math.round(((pickedBySource[name] || 0) / fa.new) * 100) / 100 : 0,
      avgScore: fa.scored > 0 ? Math.round((fa.totalScore / fa.scored) * 10) / 10 : 0,
      errors: fa.errors,
      sessions: fa.sessions
    })).sort((a, b) => b.pickRate - a.pickRate || b.yield - a.yield);

    // Keyword report
    const kwAgg = {};
    for (const s of sessions) {
      for (const [kw, hits] of Object.entries(s.keywordHits || {})) {
        if (!kwAgg[kw]) kwAgg[kw] = { matches: 0, titleHits: 0, summaryHits: 0 };
        kwAgg[kw].matches += (hits.title || 0) + (hits.summary || 0);
        kwAgg[kw].titleHits += (hits.title || 0);
        kwAgg[kw].summaryHits += (hits.summary || 0);
      }
    }
    const keywordReport = Object.entries(kwAgg).map(([keyword, ka]) => ({
      keyword,
      matches: ka.matches,
      titleHits: ka.titleHits,
      picked: pickedByKeyword[keyword] || 0,
      pickRate: ka.matches > 0 ? Math.round(((pickedByKeyword[keyword] || 0) / ka.matches) * 100) / 100 : 0,
    })).sort((a, b) => b.pickRate - a.pickRate || b.matches - a.matches);

    // Score distribution
    const scores = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let scoreTotal = 0, scoreCount = 0;
    for (const s of sessions) {
      for (const [sc, n] of Object.entries(s.scores || {})) {
        const k = parseInt(sc);
        if (k >= 1 && k <= 5) { scores[k] += n; scoreTotal += k * n; scoreCount += n; }
      }
    }
    const scorePickRates = {};
    for (let i = 1; i <= 5; i++) {
      scorePickRates[i] = scores[i] > 0 ? Math.round((pickedByScore[i] / scores[i]) * 100) / 100 : 0;
    }

    // Funnel
    let scraped = 0, newCount = 0;
    for (const s of sessions) {
      scraped += (s.totals?.matched || 0);
      newCount += (s.totals?.new || 0);
    }
    const generated = actions.filter(a => a.type === 'generate').length;
    const published = actions.filter(a => a.type === 'publish').length;

    // Session history
    const sessionHistory = sessions.slice(-20).reverse().map(s => ({
      ts: s.ts,
      preset: s.config?.preset || '—',
      found: s.totals?.matched || 0,
      new: s.totals?.new || 0,
      avgScore: (() => {
        let t = 0, c = 0;
        for (const [sc, n] of Object.entries(s.scores || {})) { t += parseInt(sc) * n; c += n; }
        return c > 0 ? Math.round((t / c) * 10) / 10 : 0;
      })()
    }));

    // Recommendations
    const recommendations = [];
    for (const fl of feedLeaderboard) {
      if (fl.sessions >= 5 && fl.yield === 0) {
        recommendations.push({ severity: 'warning', message: `Feed "${fl.name}" hasn't produced results in ${fl.sessions} sessions \u2014 consider disabling` });
      }
      if (fl.sessions >= 3 && fl.errors / fl.sessions > 0.5) {
        recommendations.push({ severity: 'warning', message: `Feed "${fl.name}" fails in ${Math.round(fl.errors / fl.sessions * 100)}% of sessions \u2014 URL may have changed` });
      }
    }
    for (const kr of keywordReport) {
      if (kr.matches >= 10 && kr.pickRate >= 0.6) {
        recommendations.push({ severity: 'positive', message: `Keyword "${kr.keyword}" has a ${Math.round(kr.pickRate * 100)}% pick rate \u2014 promote to other presets` });
      }
      if (kr.matches >= 20 && kr.pickRate < 0.1) {
        recommendations.push({ severity: 'info', message: `Keyword "${kr.keyword}" produces many matches but is rarely picked \u2014 consider narrowing` });
      }
    }
    if (sessions.length >= 5 && scoreCount > 0 && scoreTotal / scoreCount < 2.5) {
      recommendations.push({ severity: 'info', message: `Average score is ${(scoreTotal / scoreCount).toFixed(1)} \u2014 try more specific keywords` });
    }
    if (totalPicked > 0 && (pickedByScore[1] + pickedByScore[2]) / totalPicked > 0.4) {
      recommendations.push({ severity: 'info', message: `${Math.round((pickedByScore[1] + pickedByScore[2]) / totalPicked * 100)}% of your picks are low-scoring \u2014 scoring algorithm may need tuning` });
    }

    res.json({
      period: { days, sessions: sessions.length },
      feedLeaderboard,
      keywordReport,
      scores: { ...scores, avg: scoreCount > 0 ? Math.round((scoreTotal / scoreCount) * 10) / 10 : 0, pickRates: scorePickRates },
      funnel: { scraped, new: newCount, selected: totalPicked, generated, published },
      sessions: sessionHistory,
      recommendations
    });
  } catch (err) {
    res.status(500).json({ error: `Analytics failed: ${err.message}` });
  }
});

// Serve project root LAST — only handles unmatched paths like /src/css/main.css for preview iframe
app.use(express.static(PROJECT_ROOT));

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  if (!res.headersSent) res.status(500).json({ error: err.message });
});

app.listen(PORT, () => {
  const hasKey = !!anthropic;
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   FNF Content Scraper Admin                ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`\n  Open in browser: http://localhost:${PORT}`);
  console.log(`  Articles.xlsx:   ${XLSX_PATH}`);
  console.log(`  Feeds config:    ${FEEDS_CONFIG_PATH}`);
  console.log(`  Claude AI:       ${hasKey ? '✓ Ready' : '✗ No API key — add ANTHROPIC_API_KEY to .env'}`);
  console.log('\n  Press Ctrl+C to stop the server\n');
});
