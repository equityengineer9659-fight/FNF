/**
 * Simple HTML Component Builder
 * Reduces HTML duplication by extracting common components
 * Run this as a pre-build step to generate HTML from components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pages that are part of the Dashboards section — Dashboards nav link gets
// aria-current on any of these. The "Overview" tab (food-insecurity) is the
// canonical landing slug, so the Dashboards link href points there.
const dashboardSubpages = new Set([
  'executive-summary',
  'food-insecurity',
  'food-access',
  'snap-safety-net',
  'food-prices',
  'food-banks',
  'nonprofit-directory',
  'nonprofit-profile',
]);

// Pages that are part of the Resources section — Resources nav link gets
// aria-current on the resources hub itself + these hub subpages.
const resourcesSubpages = new Set([
  'case-studies',
  'templates-tools',
]);

// Blog article slugs are auto-discovered from blog/*.html in buildComponents().
// Populated before any HTML is processed so navigation() can query it.
const blogSubpages = new Set();

// Component definitions — all hrefs use absolute paths so they work from any subdirectory.
// aria-current="page" is emitted on the link whose href matches the CURRENT page,
// AND on the section's top-level link when the page is a recognised subpage of
// that section (Dashboards, Resources, Blog). This matches the highlight rules
// documented in CLAUDE.md.
const components = {
  navigation: (currentPage) => {
    const isDashboard = dashboardSubpages.has(currentPage);
    const isResources = currentPage === 'resources' || resourcesSubpages.has(currentPage);
    const isBlog = currentPage === 'blog' || blogSubpages.has(currentPage);
    const ac = (cond) => (cond ? ' aria-current="page"' : '');
    return `    <!-- Navigation -->
    <nav class="fnf-nav" aria-label="Main navigation">
        <!-- Hidden checkbox for CSS-only mobile toggle -->
        <input type="checkbox" id="nav-toggle" class="fnf-nav__toggle-input" tabindex="-1">

        <div class="fnf-nav__container">
            <!-- Header Row: Logo, Company Name, Mobile Toggle -->
            <div class="fnf-nav__top-row">
                <!-- Logo Section -->
                <div class="fnf-nav__logo">
                    <a href="/index.html" class="fnf-nav__brand" aria-label="Food-N-Force Home">
                        FNF
                    </a>
                </div>

                <!-- Company Name (Center) -->
                <div class="fnf-nav__title">
                    Food-N-Force
                </div>

                <!-- Mobile Toggle Button -->
                <label for="nav-toggle" class="fnf-nav__toggle" aria-label="Toggle mobile menu">
                    <svg class="hamburger-svg" width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <rect y="0" width="24" height="2" fill="#ffffff"/>
                        <rect y="8" width="24" height="2" fill="#ffffff"/>
                        <rect y="16" width="24" height="2" fill="#ffffff"/>
                    </svg>
                </label>
            </div>

            <!-- Desktop Navigation Menu - Inside container -->
            <ul class="fnf-nav__menu">
            <li class="fnf-nav__item">
                <a href="/index.html" class="fnf-nav__link"${ac(currentPage === 'index')}>Home</a>
            </li>
            <li class="fnf-nav__item">
                <a href="/services.html" class="fnf-nav__link"${ac(currentPage === 'services')}>Services</a>
            </li>
            <li class="fnf-nav__item">
                <a href="/resources.html" class="fnf-nav__link"${ac(isResources)}>Resources</a>
            </li>
            <li class="fnf-nav__item">
                <a href="/dashboards/food-insecurity.html" class="fnf-nav__link"${ac(isDashboard)}>Dashboards</a>
            </li>
            <li class="fnf-nav__item">
                <a href="/impact.html" class="fnf-nav__link"${ac(currentPage === 'impact')}>Impact</a>
            </li>
            <li class="fnf-nav__item">
                <a href="/contact.html" class="fnf-nav__link"${ac(currentPage === 'contact')}>Contact</a>
            </li>
            <li class="fnf-nav__item">
                <a href="/blog.html" class="fnf-nav__link"${ac(isBlog)}>Blog</a>
            </li>
            <li class="fnf-nav__item">
                <a href="/about.html" class="fnf-nav__link"${ac(currentPage === 'about')}>About Us</a>
            </li>
        </ul>
        </div>

        <!-- Mobile Menu -->
        <div class="fnf-nav__mobile">
            <ul class="fnf-nav__mobile-menu">
                <li><a href="/index.html" class="fnf-nav__mobile-link"${ac(currentPage === 'index')}>Home</a></li>
                <li><a href="/services.html" class="fnf-nav__mobile-link"${ac(currentPage === 'services')}>Services</a></li>
                <li><a href="/resources.html" class="fnf-nav__mobile-link"${ac(isResources)}>Resources</a></li>
                <li><a href="/dashboards/food-insecurity.html" class="fnf-nav__mobile-link"${ac(isDashboard)}>Dashboards</a></li>
                <li><a href="/impact.html" class="fnf-nav__mobile-link"${ac(currentPage === 'impact')}>Impact</a></li>
                <li><a href="/contact.html" class="fnf-nav__mobile-link"${ac(currentPage === 'contact')}>Contact</a></li>
                <li><a href="/blog.html" class="fnf-nav__mobile-link"${ac(isBlog)}>Blog</a></li>
                <li><a href="/about.html" class="fnf-nav__mobile-link"${ac(currentPage === 'about')}>About Us</a></li>
            </ul>
        </div>
    </nav>`;
  },

  footer: () => `    <!-- Footer -->
    <footer class="fnf-footer">
        <div class="slds-container_large slds-container_center slds-p-vertical_large slds-p-horizontal_medium">
            <nav class="slds-text-align_center slds-m-bottom_medium" aria-label="Footer navigation">
                <a href="/services.html" class="fnf-footer__link">Services</a>
                <span class="fnf-footer__separator">&middot;</span>
                <a href="/resources.html" class="fnf-footer__link">Resources</a>
                <span class="fnf-footer__separator">&middot;</span>
                <a href="/dashboards/food-insecurity.html" class="fnf-footer__link">Dashboards</a>
                <span class="fnf-footer__separator">&middot;</span>
                <a href="/blog.html" class="fnf-footer__link">Blog</a>
                <span class="fnf-footer__separator">&middot;</span>
                <a href="/contact.html" class="fnf-footer__link">Contact</a>
            </nav>
            <p class="slds-text-align_center slds-m-bottom_x-small">
                <a href="mailto:hello@food-n-force.com" class="fnf-footer__link">hello@food-n-force.com</a>
            </p>
            <p class="slds-text-body_small slds-text-align_center fnf-footer__copyright">&copy; 2026 Food-N-Force. All rights reserved.</p>
        </div>
    </footer>`,

  scripts: (pageName) => {
    let scripts = `    <!-- JavaScript Modules - Deferred for performance -->
    <script type="module" src="/src/js/main.js" defer></script>`;
    // Dashboard pages get their own entry point
    const dashboardJsMap = {
      'executive-summary': 'executive-summary',
      'food-insecurity': 'food-insecurity',
      'food-access': 'food-access',
      'snap-safety-net': 'snap-safety-net',
      'food-prices': 'food-prices',
      'food-banks': 'food-banks',
      'nonprofit-directory': 'nonprofit-directory',
      'nonprofit-profile': 'nonprofit-profile',
    };
    if (dashboardJsMap[pageName]) {
      scripts += `\n    <script type="module" src="/src/js/dashboards/${dashboardJsMap[pageName]}.js" defer></script>`;
    }
    return scripts;
  },

  blogCta: (categorySlug) => {
    const ctaMap = {
      tech: {
        title: 'Ready to Build Your Technology Roadmap?',
        text: 'Food-N-Force helps food banks and pantries select, implement, and optimize the right technology stack — from Salesforce to custom integrations — so your team can focus on the mission.'
      },
      ai: {
        title: 'Ready to Put AI to Work for Your Mission?',
        text: 'Food-N-Force helps food banks and pantries adopt AI responsibly — from demand forecasting to donor engagement — with implementations grounded in your data and your community\'s needs.'
      },
      implementation: {
        title: 'Ready to Streamline Your Operations?',
        text: 'Food-N-Force helps food banks and pantries implement proven workflows and systems that reduce manual effort, improve accuracy, and free your team to serve more families.'
      },
      insights: {
        title: 'Ready to Stay Ahead of What\'s Coming?',
        text: 'Food-N-Force tracks policy changes, funding shifts, and industry trends so food banks and pantries can plan proactively — not reactively — for the communities they serve.'
      },
      'case-studies': {
        title: 'Ready to See Results Like These?',
        text: 'Food-N-Force has helped food banks and pantries across the country transform their operations with Salesforce. Let\'s talk about what\'s possible for your organization.'
      }
    };
    const cta = ctaMap[categorySlug] || ctaMap.tech;
    return `        <!-- Article CTA -->
        <section class="article-cta-section" aria-label="Next steps">
            <div class="article-cta">
                <h2 class="article-cta__title">${cta.title}</h2>
                <p class="article-cta__text">
                    ${cta.text}
                </p>
                <div class="article-cta__actions">
                    <a href="/contact.html" class="resource-action">Get in Touch</a>
                    <a href="/blog.html" class="article-cta__secondary">Explore More Articles</a>
                </div>
            </div>
        </section>`;
  },

  dashboardTabs: (currentPage) => {
    const tabs = [
      { slug: 'food-insecurity', label: 'Overview' },
      { slug: 'food-access', label: 'Food Access' },
      { slug: 'snap-safety-net', label: 'SNAP &amp; Safety Net' },
      { slug: 'food-prices', label: 'Food Prices' },
      { slug: 'food-banks', label: 'Food Banks' },
      { slug: 'nonprofit-directory', label: 'Nonprofit Directory' },
      { slug: 'executive-summary', label: 'Summary' },
    ];
    // Profile page highlights the Directory tab
    const activeTab = currentPage === 'nonprofit-profile' ? 'nonprofit-directory' : currentPage;
    const items = tabs.map(t =>
      `            <li><a href="/dashboards/${t.slug}.html" class="dashboard-tabs__tab"${t.slug === activeTab ? ' aria-current="page"' : ''}>${t.label}</a></li>`
    ).join('\n');
    return `    <!-- Dashboard Tabs -->
    <nav class="dashboard-tabs" aria-label="Dashboard navigation">
        <div class="dashboard-tabs__container">
            <ul class="dashboard-tabs__list">
${items}
            </ul>
        </div>
    </nav>`;
  }
};

/**
 * Apply accessibility fixups to arbitrary HTML. Run on every processed page
 * so that hand-authored source HTML cannot regress on these specific a11y bugs:
 *   - Bug 2: `<div class="dashboard-hero__stats" aria-label="...">` is spec-invalid
 *            without a role; add `role="group"`.
 *   - Bug 3: `<button>` without an explicit `type` defaults to `submit`;
 *            add `type="button"`.
 * Intended to be idempotent — re-running on already-fixed HTML is a no-op.
 */
function postProcessA11y(html) {
  // Bug 2: add role="group" to `<div class="dashboard-hero__stats" aria-label=...>`
  // that do not already have a role attribute. Matches the common tag shape used
  // across all 8 dashboard pages. Idempotent — a div that already carries
  // role="group" is skipped by the negative lookahead.
  html = html.replace(
    /<div class="dashboard-hero__stats"(?! role=)(?![^>]*\srole=)( aria-label=)/g,
    '<div class="dashboard-hero__stats" role="group"$1'
  );

  // Bug 3: add type="button" to <button> tags that don't already declare a type.
  // We scan the full start-tag `<button ...>` and inject `type="button"` right
  // after the word `button` if no `type=` is present. Idempotent — buttons that
  // already have type="button" or type="submit" are left alone.
  html = html.replace(
    /<button\b([^>]*)>/g,
    (match, attrs) => {
      if (/\btype\s*=/.test(attrs)) return match;
      return `<button type="button"${attrs}>`;
    }
  );

  return html;
}

// Process HTML files — isBlogArticle controls CTA injection (blog/ articles only)
function processHtmlFile(filePath, pageName, isBlogArticle = false) {
  let html;
  try {
    html = fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    console.error(`❌ ERROR reading ${pageName}: ${err.message}`);
    return;
  }

  // Replace navigation component
  const navPattern = /    <!-- Navigation -->[\s\S]*?<\/nav>/;
  if (navPattern.test(html)) {
    html = html.replace(navPattern, components.navigation(pageName));
    console.log(`✅ Updated navigation in ${pageName}`);
  }

  // Inject or replace dashboard tabs on dashboard pages (between </nav> and <main>)
  const dashboardSlugs = ['executive-summary', 'food-insecurity', 'food-access', 'snap-safety-net', 'food-prices', 'food-banks', 'nonprofit-directory', 'nonprofit-profile'];
  if (dashboardSlugs.includes(pageName)) {
    const existingTabsPattern = /    <!-- Dashboard Tabs -->[\s\S]*?<\/nav>\n?/;
    if (existingTabsPattern.test(html)) {
      html = html.replace(existingTabsPattern, components.dashboardTabs(pageName) + '\n');
    } else {
      // First injection: insert after main nav closing tag, before <main>
      html = html.replace(/(    <\/nav>\n)(\n    <!-- Main Content -->)/, `$1\n${components.dashboardTabs(pageName)}\n$2`);
    }
    console.log(`✅ Updated dashboard tabs in ${pageName}`);
  }

  // Replace footer component
  const footerPattern = /    <!-- Footer -->[\s\S]*?<\/footer>/;
  if (footerPattern.test(html)) {
    html = html.replace(footerPattern, components.footer());
    console.log(`✅ Updated footer in ${pageName}`);
  }

  // Replace blog article CTA with category-aware template (blog articles only)
  const ctaPattern = /        <!-- Article CTA -->[\s\S]*?<\/section>/;
  if (isBlogArticle && ctaPattern.test(html)) {
    // Extract category from article-category--SUFFIX class
    const catMatch = html.match(/article-category--([\w-]+)/);
    const categorySlug = catMatch ? catMatch[1] : 'tech';
    html = html.replace(ctaPattern, components.blogCta(categorySlug));
    console.log(`✅ Updated CTA in ${pageName} (category: ${categorySlug})`);
  }

  // Remove all existing script sections and duplicates first
  const scriptSectionPattern = /    <!-- JavaScript Modules[\s\S]*?(?=<\/body>)/;
  const fallbackScriptPattern = /    <!-- Fallback Particle System[\s\S]*?<\/script>\n?/g;

  // Remove all fallback scripts first
  html = html.replace(fallbackScriptPattern, '');

  // Then replace the entire script section
  if (scriptSectionPattern.test(html)) {
    html = html.replace(scriptSectionPattern, components.scripts(pageName) + '\n');
    console.log(`✅ Updated scripts in ${pageName}`);
  }

  // Apply accessibility fixups to the full document (runs after structural
  // replacements so injected components also get the treatment).
  html = postProcessA11y(html);

  // Ensure SLDS CDN link has correct SRI hash
  const sldsUrl = 'https://cdnjs.cloudflare.com/ajax/libs/design-system/2.22.2/styles/salesforce-lightning-design-system.min.css';
  const sldsSri = 'sha384-ucbUkoNV4qcPSHz6TOzBUkDEMV/BBBcr7t59dWtuKS6itUk+yR7fYMkvjGgF1qlG';
  const sldsWithSri = `<link rel="stylesheet" href="${sldsUrl}" integrity="${sldsSri}" crossorigin="anonymous">`;
  if (html.includes(sldsUrl)) {
    // Replace any existing SLDS link (with or without SRI) with the correct version
    html = html.replace(/<link rel="stylesheet" href="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/design-system\/2\.22\.2\/styles\/salesforce-lightning-design-system\.min\.css"[^>]*>/, sldsWithSri);
  }

  // Write back the processed HTML (atomic: write temp file, then rename)
  try {
    const tmpPath = filePath + '.tmp';
    fs.writeFileSync(tmpPath, html);
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.error(`❌ ERROR writing ${pageName}: ${err.message}`);
  }
}

// Main execution
function buildComponents() {
  console.log('🔨 Building HTML components...\n');

  // Core pages at root
  const corePages = ['index', 'about', 'services', 'resources', 'impact', 'contact', 'blog', '404'];

  // Hub pages at root (not articles, not core)
  const hubPages = ['case-studies', 'templates-tools'];

  // Article pages under blog/ — auto-discovered from filesystem
  const articlePages = glob.sync('*.html', { cwd: path.join(__dirname, 'blog') })
    .map(f => f.replace('.html', ''));

  // Populate the blog-subpages set BEFORE any HTML is processed so that the
  // navigation component can mark the Blog top-level link as the current
  // section on every article page.
  blogSubpages.clear();
  articlePages.forEach(slug => blogSubpages.add(slug));

  [...corePages, ...hubPages].forEach(page => {
    const filePath = path.join(__dirname, `${page}.html`);
    if (fs.existsSync(filePath)) {
      processHtmlFile(filePath, page);
    } else {
      console.warn(`⚠️  File not found: ${page}.html`);
    }
  });

  articlePages.forEach(page => {
    const filePath = path.join(__dirname, 'blog', `${page}.html`);
    if (fs.existsSync(filePath)) {
      processHtmlFile(filePath, page, true);
    } else {
      console.warn(`⚠️  File not found: blog/${page}.html`);
    }
  });

  // Dashboard pages under dashboards/
  const dashboardPages = ['executive-summary', 'food-insecurity', 'food-access', 'snap-safety-net', 'food-prices', 'food-banks', 'nonprofit-directory', 'nonprofit-profile'];

  dashboardPages.forEach(page => {
    const filePath = path.join(__dirname, 'dashboards', `${page}.html`);
    if (fs.existsSync(filePath)) {
      processHtmlFile(filePath, page);
    } else {
      console.warn(`⚠️  File not found: dashboards/${page}.html`);
    }
  });

  console.log('\n✨ Component build complete!');
}

// Run if called directly (not when imported as a module, e.g., by tests)
const isMainModule = (() => {
  try {
    return import.meta.url === `file://${process.argv[1]}`
      || fileURLToPath(import.meta.url) === path.resolve(process.argv[1] || '');
  } catch {
    return false;
  }
})();

if (isMainModule) {
  buildComponents();
}

export { buildComponents, components, postProcessA11y, dashboardSubpages, resourcesSubpages, blogSubpages };
