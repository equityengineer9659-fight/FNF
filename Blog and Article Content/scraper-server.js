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
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
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

const anthropic = process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your-api-key-here'
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

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
// POST /api/generate-article — Claude AI article + SVG generation
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
  },
  "svgPrompt": "string — 2-3 sentences describing an abstract geometric diagram representing this article's theme, suitable for an SVG data visualization"
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

    // --- Call 2: Generate SVG illustration ---
    const svgMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: `You are an SVG illustration designer creating thematic geometric data visualizations for a tech consulting blog. Generate clean, professional, accessible SVG code only.`,
      messages: [{
        role: 'user',
        content: `Create an SVG illustration for this concept: ${articleData.svgPrompt}

Requirements:
- viewBox="0 0 800 400" — no fixed width or height attributes
- Add role="img" and a descriptive aria-label attribute
- Dark background using a linear gradient from #0a0e1a to #1a1040
- Color palette: purples (#8b5cf6), Salesforce blue (#0176D3), cyan (#06b6d4), green (#10b981), amber (#f59e0b)
- Include <defs> with 2-4 named gradients; prefix all IDs with a unique 3-letter code (e.g. "fnf")
- Add a feGaussianBlur glow filter (stdDeviation="6") applied to key focal elements
- Style: geometric/abstract — nodes, flows, network diagrams, data patterns (not literal drawings)
- No text elements — visual only
- Keep total SVG under 15KB

Return ONLY the SVG markup. Start with <svg and end with </svg>. No explanation, no markdown.`
      }]
    });

    let svgCode = svgMsg.content[0].text.trim();
    // Strip any accidental markdown fences
    svgCode = svgCode.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();

    if (!svgCode.startsWith('<svg')) {
      return res.status(500).json({ error: 'Claude returned invalid SVG. Try regenerating the illustration.' });
    }

    res.json({ ...articleData, svgCode });

  } catch (err) {
    const msg = err.status === 401 ? 'Invalid API key — check your ANTHROPIC_API_KEY in .env'
      : err.status === 429 ? 'Rate limit hit — wait a moment and try again'
      : `Claude API error: ${err.message}`;
    res.status(err.status || 500).json({ error: msg });
  }
});

// ---------------------------------------------------------------------------
// POST /api/regenerate-svg — regenerate illustration only
// Body: { svgPrompt: string, slug: string }
// ---------------------------------------------------------------------------
app.post('/api/regenerate-svg', async (req, res) => {
  if (!anthropic) {
    return res.status(503).json({ error: 'No API key configured.' });
  }
  const { svgPrompt } = req.body;
  if (!svgPrompt) return res.status(400).json({ error: 'svgPrompt required.' });

  try {
    const svgMsg = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: `You are an SVG illustration designer creating thematic geometric data visualizations for a tech consulting blog. Generate clean, professional, accessible SVG code only.`,
      messages: [{
        role: 'user',
        content: `Create an SVG illustration for this concept: ${svgPrompt}

Requirements:
- viewBox="0 0 800 400" — no fixed width or height attributes
- Add role="img" and a descriptive aria-label attribute
- Dark background using a linear gradient from #0a0e1a to #1a1040
- Color palette: purples (#8b5cf6), Salesforce blue (#0176D3), cyan (#06b6d4), green (#10b981), amber (#f59e0b)
- Include <defs> with 2-4 named gradients; prefix all IDs with a unique 3-letter code
- Add a feGaussianBlur glow filter (stdDeviation="6") applied to key focal elements
- Style: geometric/abstract — nodes, flows, network diagrams, data patterns (not literal drawings)
- No text elements — visual only
- Keep total SVG under 15KB

Return ONLY the SVG markup. Start with <svg and end with </svg>. No explanation, no markdown.`
      }]
    });

    let svgCode = svgMsg.content[0].text.trim();
    svgCode = svgCode.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    if (!svgCode.startsWith('<svg')) {
      return res.status(500).json({ error: 'Claude returned invalid SVG. Try again.' });
    }
    res.json({ svgCode });
  } catch (err) {
    res.status(err.status || 500).json({ error: `SVG generation error: ${err.message}` });
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
// POST /api/save-article — write HTML + SVG to project, optionally auto-register
// Body: { slug, html, svgCode, autoRegister }
// ---------------------------------------------------------------------------
app.post('/api/save-article', (req, res) => {
  const { slug, html, svgCode, autoRegister = true } = req.body;
  if (!slug || !html) return res.status(400).json({ error: 'slug and html are required.' });

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
      // 1. Patch build-components.js articlePages array
      if (existsSync(BUILD_COMPONENTS_PATH)) {
        let src = readFileSync(BUILD_COMPONENTS_PATH, 'utf-8');
        if (!src.includes(`'${slug}'`)) {
          // Find last slug in the array and insert after it
          src = src.replace(
            /(const articlePages\s*=\s*\[[\s\S]*?)'([a-z0-9-]+)'(\s*\];)/,
            (match, before, lastSlug, after) =>
              `${before}'${lastSlug}',\n  '${slug}'${after}`
          );
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
