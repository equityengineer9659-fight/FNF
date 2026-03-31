/**
 * sync-blog.js
 *
 * Reads metadata from every article HTML file under blog/ and
 * rebuilds the blog card grid in blog.html between the injection markers:
 *   <!-- BLOG-CARDS-START -->  …  <!-- BLOG-CARDS-END -->
 *
 * Run:  node scripts/sync-blog.js
 * Also called automatically by:  npm run build
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BLOG_DIR = path.join(ROOT, 'blog');

const START_MARKER = '<!-- BLOG-CARDS-START -->';
const END_MARKER   = '<!-- BLOG-CARDS-END -->';
const CARD_INDENT  = '                    '; // 20 spaces — matches blog.html indentation

/* ─── Metadata extraction ──────────────────────────────────────────── */

function extractMeta(html, slug) {
  // Title: <h1 id="article-title" ...>TEXT</h1>
  const titleM = html.match(/<h1[^>]*id="article-title"[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleM
    ? titleM[1].trim() // keep HTML entities encoded for HTML output
    : slug.replace(/-/g, ' ');

  // Description: <meta name="description" content="...">
  const descM = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)
             || html.match(/<meta\s+content="([^"]+)"\s+name="description"/i);
  const description = descM ? descM[1] : '';

  // Category: <span class="article-category-badge article-category--SUFFIX">TEXT</span>
  const catM = html.match(/article-category-badge article-category--([\w-]+)"[^>]*>([\s\S]*?)<\/span>/i);
  const catClass = catM ? catM[1] : 'insights';
  const catText  = catM ? catM[2].trim() : 'Industry Insights'; // keep &amp; encoded for HTML output

  // Date attribute: <time datetime="YYYY-MM-DD">
  const dateAttrM = html.match(/<time\s+datetime="([^"]+)"/i);
  const datePublished = dateAttrM ? dateAttrM[1] : '';

  // Date display text: content inside <time>
  const dateTextM = html.match(/<time\s+datetime="[^"]*">([^<]+)<\/time>/i);
  const dateText = dateTextM ? dateTextM[1].trim() : datePublished;

  // Read time: <span> immediately following <time>...</time>
  const readTimeM = html.match(/<\/time>\s*<span>([\d]+ min read)<\/span>/i);
  const readTime = readTimeM ? readTimeM[1].trim() : '5 min read';

  return { slug, title, description, catClass, catText, datePublished, dateText, readTime };
}

/* ─── Card HTML builder ─────────────────────────────────────────────── */

function buildCard(a) {
  return [
    `${CARD_INDENT}<div class="slds-col slds-size_1-of-1 slds-medium-size_1-of-2 slds-large-size_1-of-3">`,
    `${CARD_INDENT}    <article class="blog-card">`,
    `${CARD_INDENT}        <span class="blog-card__category blog-card__category--${a.catClass}">${a.catText}</span>`,
    `${CARD_INDENT}        <h3 class="blog-card__title">${a.title}</h3>`,
    `${CARD_INDENT}        <p class="blog-card__excerpt">${a.description}</p>`,
    `${CARD_INDENT}        <div class="blog-card__meta">`,
    `${CARD_INDENT}            <span>${a.dateText}</span>`,
    `${CARD_INDENT}            <span>${a.readTime}</span>`,
    `${CARD_INDENT}        </div>`,
    `${CARD_INDENT}        <a href="blog/${a.slug}.html" class="resource-action">Read More</a>`,
    `${CARD_INDENT}    </article>`,
    `${CARD_INDENT}</div>`,
  ].join('\n');
}

/* ─── Main ──────────────────────────────────────────────────────────── */

function syncBlog() {
  // Discover all article HTML files under blog/
  const files = glob.sync('*.html', { cwd: BLOG_DIR });
  const articles = [];

  for (const file of files) {
    const slug = file.replace('.html', '');
    const html = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');

    // Skip files that don't look like article pages
    if (!html.includes('article-hero__title') && !html.includes('article-category-badge')) continue;

    articles.push(extractMeta(html, slug));
  }

  // Sort by datePublished descending; undated articles go last
  articles.sort((a, b) => {
    if (!a.datePublished && !b.datePublished) return 0;
    if (!a.datePublished) return 1;
    if (!b.datePublished) return -1;
    return b.datePublished.localeCompare(a.datePublished);
  });

  // Build the replacement block
  const cards = articles.map(buildCard).join('\n\n');

  // Read blog.html and replace between markers
  const blogPath = path.join(ROOT, 'blog.html');
  let blogHtml;
  try {
    blogHtml = fs.readFileSync(blogPath, 'utf-8');
  } catch (err) {
    console.error(`sync-blog: ERROR reading blog.html — ${err.message}`);
    process.exit(1);
  }

  const startIdx = blogHtml.indexOf(START_MARKER);
  const endIdx   = blogHtml.indexOf(END_MARKER);

  if (startIdx === -1 || endIdx === -1) {
    console.error('sync-blog: ERROR — could not find BLOG-CARDS-START/END markers in blog.html');
    process.exit(1);
  }

  const before = blogHtml.slice(0, startIdx + START_MARKER.length);
  const after  = blogHtml.slice(endIdx);
  try {
    fs.writeFileSync(blogPath, before + '\n' + cards + '\n' + CARD_INDENT + after, 'utf-8');
  } catch (err) {
    console.error(`sync-blog: ERROR writing blog.html — ${err.message}`);
    process.exit(1);
  }

  console.log(`sync-blog: ✓ wrote ${articles.length} article cards to blog.html`);
  for (const a of articles) {
    console.log(`  ${a.slug.padEnd(48)} [${a.catText}]  ${a.datePublished || '(no date)'}`);
  }
}

syncBlog();
