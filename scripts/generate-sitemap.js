/**
 * Dynamic Sitemap Generator
 * Generates sitemap.xml with current dates
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'https://food-n-force.com';
const OUTPUT_FILE = join(__dirname, '..', 'sitemap.xml');

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

  const urlEntries = pages.map(page => `
  <url>
    <loc>${BASE_URL}/${page.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('');

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

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSitemap();
}

export default generateSitemap;
