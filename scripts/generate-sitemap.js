/**
 * Dynamic Sitemap Generator
 * Generates sitemap.xml with current dates
 */

import fs from 'fs';
import { statSync } from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'https://food-n-force.com';
const ROOT_DIR = join(__dirname, '..');
const OUTPUT_FILE = join(ROOT_DIR, 'sitemap.xml');

/**
 * Get lastmod date (YYYY-MM-DD) from a file's mtime.
 * Falls back to the current date if the file is missing or stat fails.
 */
function getLastmod(filePath) {
  try {
    return statSync(filePath).mtime.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

// Core + hub pages (static — different priorities, change rarely)
const staticPages = [
  { path: '', priority: '1.0', changefreq: 'weekly' },
  { path: 'about.html', priority: '0.9', changefreq: 'monthly' },
  { path: 'services.html', priority: '0.9', changefreq: 'monthly' },
  { path: 'resources.html', priority: '0.8', changefreq: 'weekly' },
  { path: 'impact.html', priority: '0.8', changefreq: 'monthly' },
  { path: 'contact.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog.html', priority: '0.8', changefreq: 'weekly' },
  { path: 'case-studies.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'templates-tools.html', priority: '0.7', changefreq: 'monthly' },
];

// Blog articles — auto-discovered from blog/ directory
const blogArticles = glob.sync('*.html', { cwd: join(__dirname, '..', 'blog') })
  .map(f => ({ path: `blog/${f}`, priority: '0.7', changefreq: 'monthly' }));

// Dashboard pages (static — different priorities)
// P2-29: nonprofit-profile.html is intentionally excluded — it renders noindex
// (dynamic, loads a single org from ProPublica by query param). Do not add it.
const dashboardPages = [
  { path: 'dashboards/executive-summary.html', priority: '0.9', changefreq: 'monthly' },
  { path: 'dashboards/food-insecurity.html', priority: '0.8', changefreq: 'monthly' },
  { path: 'dashboards/food-access.html', priority: '0.8', changefreq: 'monthly' },
  { path: 'dashboards/snap-safety-net.html', priority: '0.8', changefreq: 'monthly' },
  { path: 'dashboards/food-prices.html', priority: '0.8', changefreq: 'monthly' },
  { path: 'dashboards/food-banks.html', priority: '0.8', changefreq: 'monthly' },
  { path: 'dashboards/nonprofit-directory.html', priority: '0.8', changefreq: 'monthly' },
];

const pages = [...staticPages, ...blogArticles, ...dashboardPages];

function generateSitemap() {
  const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const urlEntries = pages.map(page => {
    // Resolve file path — empty path maps to index.html
    const relPath = page.path === '' ? 'index.html' : page.path;
    const htmlPath = join(ROOT_DIR, relPath);
    const lastmod = getLastmod(htmlPath);
    return `
  <url>
    <loc>${BASE_URL}/${page.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

  try {
    fs.writeFileSync(OUTPUT_FILE, sitemap.trim());
  } catch (err) {
    console.error(`❌ ERROR writing sitemap: ${err.message}`);
    process.exit(1);
  }
  console.log(`✅ Sitemap generated successfully: ${OUTPUT_FILE}`);
  console.log(`📅 Last modified: ${now}`);
  console.log(`📄 Pages: ${pages.length}`);
}

// Run if executed directly (cross-platform: compare resolved file URLs)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateSitemap();
}

export default generateSitemap;
