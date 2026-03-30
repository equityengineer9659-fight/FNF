/**
 * Dynamic Sitemap Generator
 * Generates sitemap.xml with current dates
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'https://foodnforce.com';
const OUTPUT_FILE = join(__dirname, '..', 'sitemap.xml');

const pages = [
  // Core pages
  { path: '', priority: '1.0', changefreq: 'weekly' },
  { path: 'about.html', priority: '0.9', changefreq: 'monthly' },
  { path: 'services.html', priority: '0.9', changefreq: 'monthly' },
  { path: 'resources.html', priority: '0.8', changefreq: 'weekly' },
  { path: 'impact.html', priority: '0.8', changefreq: 'monthly' },
  { path: 'contact.html', priority: '0.7', changefreq: 'monthly' },
  // Blog hub + hub pages
  { path: 'blog.html', priority: '0.8', changefreq: 'weekly' },
  { path: 'case-studies.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'templates-tools.html', priority: '0.7', changefreq: 'monthly' },
  // Articles (all under blog/)
  { path: 'blog/ai-reshaping-food-banks.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/salesforce-food-bank-operations.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/donor-relationships-nonprofit-cloud.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/data-driven-food-banks.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/food-bank-workflow-automation.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/securing-technology-grants.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/ai-inventory-management.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/agentforce-nonprofits-guide.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/ai-ethics-nonprofit-governance.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/centralized-food-hub-case-study.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/client-choice-food-pantry-technology.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/community-food-center-model.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/data-privacy-food-bank-clients.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/digital-transformation-small-food-banks.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/donor-prospecting-salesforce.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/food-bank-client-services-technology.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/food-bank-crisis-response-planning.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/food-bank-kitchen-operations.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/food-bank-strategic-partnerships.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/food-bank-technology-stack.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/food-banks-healthcare-social-determinants.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/food-is-medicine-food-banks.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/future-food-banking-trends.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/grant-management-food-banks.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/impact-measurement-food-banks.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/measuring-hunger-relief-outcomes.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/nonprofit-cloud-vs-sales-cloud.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/nutrition-first-food-bank-strategy.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/rapid-technology-implementation.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/salesforce-flow-builder-nonprofits.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/salesforce-reports-dashboards-food-banks.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/salesforce-security-nonprofits.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/salesforce-spring-2026-nonprofits.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/snap-policy-changes-food-banks.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/tax-policy-nonprofit-fundraising.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/volunteer-management-technology.html', priority: '0.7', changefreq: 'monthly' },
  { path: 'blog/volunteer-recruitment-retention-digital.html', priority: '0.7', changefreq: 'monthly' },
];

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

  fs.writeFileSync(OUTPUT_FILE, sitemap.trim());
  console.log(`✅ Sitemap generated successfully: ${OUTPUT_FILE}`);
  console.log(`📅 Last modified: ${now}`);
  console.log(`📄 Pages: ${pages.length}`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSitemap();
}

export default generateSitemap;
