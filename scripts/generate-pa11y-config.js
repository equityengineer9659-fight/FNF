/**
 * Pa11y Config Generator
 * Auto-generates .pa11yci.json from the filesystem instead of maintaining a hardcoded list.
 *
 * Modes:
 *   --mode=full    (default) Test all pages — used in weekly scheduled sweep
 *   --mode=sample  Test all non-blog pages + 5 random blog articles — used in per-push CI
 *
 * Run:  node scripts/generate-pa11y-config.js [--mode=full|sample]
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { glob } from 'glob';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUTPUT_FILE = join(ROOT, '.pa11yci.json');
const BASE_URL = 'http://localhost:4173';
const BLOG_SAMPLE_SIZE = 5;

const mode = process.argv.includes('--mode=sample') ? 'sample' : 'full';

// Core + hub pages (always tested)
const coreUrls = [
  'index.html',
  'about.html',
  'services.html',
  'resources.html',
  'impact.html',
  'contact.html',
  'blog.html',
  'case-studies.html',
  'templates-tools.html',
];

// Dashboard pages (always tested)
const dashboardUrls = glob.sync('*.html', { cwd: join(ROOT, 'dashboards') })
  .map(f => `dashboards/${f}`);

// Blog articles — auto-discovered
const allBlogUrls = glob.sync('*.html', { cwd: join(ROOT, 'blog') })
  .map(f => `blog/${f}`);

// In sample mode, pick a random subset of blog articles
let blogUrls;
if (mode === 'sample') {
  const shuffled = [...allBlogUrls].sort(() => Math.random() - 0.5);
  blogUrls = shuffled.slice(0, Math.min(BLOG_SAMPLE_SIZE, shuffled.length));
  console.log(`pa11y-config: sample mode — testing ${blogUrls.length} of ${allBlogUrls.length} blog articles`);
} else {
  blogUrls = allBlogUrls;
  console.log(`pa11y-config: full mode — testing all ${allBlogUrls.length} blog articles`);
}

const urls = [...coreUrls, ...blogUrls, ...dashboardUrls]
  .map(p => `${BASE_URL}/${p}`);

const config = {
  defaults: {
    standard: 'WCAG2AA',
    timeout: 30000,
    wait: 2000,
    chromeLaunchConfig: {
      args: ['--no-sandbox'],
    },
  },
  urls,
};

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(config, null, 2) + '\n');
console.log(`pa11y-config: wrote ${urls.length} URLs to .pa11yci.json (mode: ${mode})`);
