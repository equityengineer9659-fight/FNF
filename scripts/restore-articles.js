/**
 * One-time script: restores 30 new article source HTML files and their SVG
 * illustrations from the local dist/ build output into the project source tree.
 *
 * Run: node scripts/restore-articles.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// ── Step 1: Copy SVG illustrations ───────────────────────────────────────────

const distImagesDir = path.join(DIST, 'assets', 'images');
const srcIllustDir = path.join(ROOT, 'src', 'assets', 'images', 'illustrations');

const existingSlugs = new Set([
  'ai-inventory', 'case-study-results', 'data-analytics', 'donor-relationships',
  'salesforce-dashboard', 'technology-grants', 'workflow-automation',
]);

const distImages = fs.readdirSync(distImagesDir).filter(f => f.endsWith('.svg'));
let svgCount = 0;

for (const distFile of distImages) {
  // Strip vite 8-char hash: "agentforce-nonprofits-guide-BkZRBXGf.svg" → "agentforce-nonprofits-guide.svg"
  // Vite hashes are exactly 8 chars of URL-safe base64 (A-Za-z0-9_-)
  const sourceName = distFile.replace(/-[A-Za-z0-9_-]{8}\.svg$/, '.svg');
  const slug = sourceName.replace('.svg', '');

  if (existingSlugs.has(slug)) continue; // already exists

  const destPath = path.join(srcIllustDir, sourceName);
  if (!fs.existsSync(destPath)) {
    fs.copyFileSync(path.join(distImagesDir, distFile), destPath);
    console.log(`  📄 Copied illustration: ${sourceName}`);
    svgCount++;
  }
}
console.log(`\n✅ ${svgCount} SVG illustrations copied to src/assets/images/illustrations/\n`);

// ── Step 2: Convert dist HTML → source HTML for 30 new articles ──────────────

const newArticles = [
  'agentforce-nonprofits-guide',
  'ai-ethics-nonprofit-governance',
  'centralized-food-hub-case-study',
  'client-choice-food-pantry-technology',
  'community-food-center-model',
  'data-privacy-food-bank-clients',
  'digital-transformation-small-food-banks',
  'donor-prospecting-salesforce',
  'food-bank-client-services-technology',
  'food-bank-crisis-response-planning',
  'food-bank-kitchen-operations',
  'food-bank-strategic-partnerships',
  'food-bank-technology-stack',
  'food-banks-healthcare-social-determinants',
  'food-is-medicine-food-banks',
  'future-food-banking-trends',
  'grant-management-food-banks',
  'impact-measurement-food-banks',
  'measuring-hunger-relief-outcomes',
  'nonprofit-cloud-vs-sales-cloud',
  'nutrition-first-food-bank-strategy',
  'rapid-technology-implementation',
  'salesforce-flow-builder-nonprofits',
  'salesforce-reports-dashboards-food-banks',
  'salesforce-security-nonprofits',
  'salesforce-spring-2026-nonprofits',
  'snap-policy-changes-food-banks',
  'tax-policy-nonprofit-fundraising',
  'volunteer-management-technology',
  'volunteer-recruitment-retention-digital',
];

let htmlCount = 0;

for (const slug of newArticles) {
  const distFile = path.join(DIST, `${slug}.html`);
  if (!fs.existsSync(distFile)) {
    console.warn(`⚠️  dist/${slug}.html not found — skipping`);
    continue;
  }

  let html = fs.readFileSync(distFile, 'utf-8');

  // 1. Fix favicon/icon paths (vite converts /foo.svg → ./foo.svg)
  html = html.replace(/href="\.\/favicon\.svg"/g, 'href="/favicon.svg"');
  html = html.replace(/href="\.\/icon-32x32\.png"/g, 'href="/icon-32x32.png"');

  // 2. Fix SVG illustration paths in body:
  //    ./assets/images/[name]-[8charHash].svg  →  src/assets/images/illustrations/[name].svg
  html = html.replace(
    /src="\.\/assets\/images\/(.+?)-[A-Za-z0-9_-]{8}\.svg"/g,
    'src="src/assets/images/illustrations/$1.svg"',
  );

  // 3. Remove vite-injected module scripts from <head>
  html = html.replace(
    /\n[ \t]*<script type="module" crossorigin src="\.\/assets\/[^"]+"><\/script>/g,
    '',
  );

  // 4. Remove vite-injected stylesheet from <head>
  html = html.replace(
    /\n[ \t]*<link rel="stylesheet" crossorigin href="\.\/assets\/[^"]+">/g,
    '',
  );

  // 5. Restore critical-inline.css link (vite strips it during bundling)
  html = html.replace(
    '<!-- Critical CSS for fastest above-fold rendering (single source: src/css/critical-inline.css) -->',
    '<!-- Critical CSS for fastest above-fold rendering (single source: src/css/critical-inline.css) -->\n    <link rel="stylesheet" href="src/css/critical-inline.css">',
  );

  // 6. Restore main.css link after <!-- Custom CSS --> comment
  html = html.replace(
    '<!-- Custom CSS -->',
    '<!-- Custom CSS -->\n    <link rel="stylesheet" href="src/css/main.css">',
  );

  // 7. Restore main.js script before </body>
  //    vite removes the src/js/main.js script tag; the comment stays but script is gone
  html = html.replace(
    /(\s*<!-- JavaScript Modules - Deferred for performance -->)\s*\n<\/body>/,
    '$1\n    <script type="module" src="src/js/main.js" defer></script>\n</body>',
  );

  const destFile = path.join(ROOT, `${slug}.html`);
  fs.writeFileSync(destFile, html);
  console.log(`  ✅ Created ${slug}.html`);
  htmlCount++;
}

console.log(`\n✅ ${htmlCount} article HTML files written to project root\n`);
console.log('Next steps:');
console.log('  1. Update vite.config.js to use glob for dynamic inputs');
console.log('  2. Update build-components.js pages list and resourcesSubpages');
console.log('  3. Update blog.html with all 37 article cards');
console.log('  4. npm run build && git add && git push');
