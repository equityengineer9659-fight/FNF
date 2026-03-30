/**
 * FNF Content Scraper Admin Server
 * Run: node "Blog and Article Content/scraper-server.js"
 * Then open: http://localhost:3001
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { scrapeFeeds, DEFAULT_CATEGORIES, getExcelRowCount } from '../scripts/scrape-sources.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;
const XLSX_PATH = path.join(__dirname, 'Articles.xlsx');
const FEEDS_CONFIG_PATH = path.join(__dirname, '..', 'scripts', 'rss-feeds.json');

const app = express();
app.use(express.json());

// Serve static files from this directory (for any assets)
app.use(express.static(__dirname));

// Serve the admin page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'scraper-admin.html'));
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
    res.json({
      path: XLSX_PATH,
      rowCount,
      exists: existsSync(XLSX_PATH)
    });
  } catch (err) {
    res.json({ path: XLSX_PATH, rowCount: 0, exists: false, error: err.message });
  }
});

// POST /api/scrape — run scraper, stream events via SSE
app.post('/api/scrape', async (req, res) => {
  const config = {
    ...req.body,
    xlsxPath: XLSX_PATH
  };

  // Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    await scrapeFeeds(config, send);
  } catch (err) {
    send({ type: 'error', message: err.message });
  }

  res.end();
});

// Handle client disconnect gracefully
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  if (!res.headersSent) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   FNF Content Scraper Admin                ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`\n  Open in browser: http://localhost:${PORT}`);
  console.log(`  Articles.xlsx:   ${XLSX_PATH}`);
  console.log(`  Feeds config:    ${FEEDS_CONFIG_PATH}`);
  console.log('\n  Press Ctrl+C to stop the server\n');
});
