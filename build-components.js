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

// Pages that should highlight "Dashboards" in navigation
const dashboardSubpages = [
  'executive-summary', 'food-insecurity', 'food-access', 'snap-safety-net', 'food-prices', 'food-banks',
  'nonprofit-directory', 'nonprofit-profile',
];

// Pages that should highlight "Blog" in navigation — auto-discovered from blog/ directory
const blogSubpages = [
  'blog',
  ...glob.sync('*.html', { cwd: path.join(__dirname, 'blog') })
    .map(f => f.replace('.html', '')),
];

// Pages that should highlight "Resources" in navigation
// Only the resources page itself and hub pages — NOT blog articles or dashboards
const resourcesSubpages = [
  'resources',
  // Hub pages
  'case-studies', 'templates-tools',
];

// Component definitions — all hrefs use absolute paths so they work from any subdirectory
const components = {
  navigation: (currentPage) => `    <!-- Navigation -->
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
                <a href="/index.html" class="fnf-nav__link"${currentPage === 'index' ? ' aria-current="page"' : ''}>Home</a>
            </li>
            <li class="fnf-nav__item">
                <a href="/services.html" class="fnf-nav__link"${currentPage === 'services' ? ' aria-current="page"' : ''}>Services</a>
            </li>
            <li class="fnf-nav__item">
                <a href="/resources.html" class="fnf-nav__link"${resourcesSubpages.includes(currentPage) ? ' aria-current="page"' : ''}>Resources</a>
            </li>
            <li class="fnf-nav__item">
                <a href="/dashboards/food-insecurity.html" class="fnf-nav__link"${dashboardSubpages.includes(currentPage) ? ' aria-current="page"' : ''}>Dashboards</a>
            </li>
            <li class="fnf-nav__item">
                <a href="/impact.html" class="fnf-nav__link"${currentPage === 'impact' ? ' aria-current="page"' : ''}>Impact</a>
            </li>
            <li class="fnf-nav__item">
                <a href="/contact.html" class="fnf-nav__link"${currentPage === 'contact' ? ' aria-current="page"' : ''}>Contact</a>
            </li>
            <li class="fnf-nav__item">
                <a href="/blog.html" class="fnf-nav__link"${blogSubpages.includes(currentPage) ? ' aria-current="page"' : ''}>Blog</a>
            </li>
            <li class="fnf-nav__item">
                <a href="/about.html" class="fnf-nav__link"${currentPage === 'about' ? ' aria-current="page"' : ''}>About Us</a>
            </li>
        </ul>
        </div>

        <!-- Mobile Menu -->
        <div class="fnf-nav__mobile">
            <ul class="fnf-nav__mobile-menu">
                <li><a href="/index.html" class="fnf-nav__mobile-link"${currentPage === 'index' ? ' aria-current="page"' : ''}>Home</a></li>
                <li><a href="/services.html" class="fnf-nav__mobile-link"${currentPage === 'services' ? ' aria-current="page"' : ''}>Services</a></li>
                <li><a href="/resources.html" class="fnf-nav__mobile-link"${resourcesSubpages.includes(currentPage) ? ' aria-current="page"' : ''}>Resources</a></li>
                <li><a href="/dashboards/food-insecurity.html" class="fnf-nav__mobile-link"${dashboardSubpages.includes(currentPage) ? ' aria-current="page"' : ''}>Dashboards</a></li>
                <li><a href="/impact.html" class="fnf-nav__mobile-link"${currentPage === 'impact' ? ' aria-current="page"' : ''}>Impact</a></li>
                <li><a href="/contact.html" class="fnf-nav__mobile-link"${currentPage === 'contact' ? ' aria-current="page"' : ''}>Contact</a></li>
                <li><a href="/blog.html" class="fnf-nav__mobile-link"${blogSubpages.includes(currentPage) ? ' aria-current="page"' : ''}>Blog</a></li>
                <li><a href="/about.html" class="fnf-nav__mobile-link"${currentPage === 'about' ? ' aria-current="page"' : ''}>About Us</a></li>
            </ul>
        </div>
    </nav>`,

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

  dashboardTabs: (currentPage) => {
    const tabs = [
      { slug: 'food-insecurity', label: 'Overview' },
      { slug: 'food-access', label: 'Food Access' },
      { slug: 'snap-safety-net', label: 'SNAP & Safety Net' },
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

// Process HTML files
function processHtmlFile(filePath, pageName) {
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
      processHtmlFile(filePath, page);
    } else {
      console.warn(`⚠️  File not found: blog/${page}.html`);
    }
  });

  // Dashboard pages under dashboards/
  // P2-30: dashboards/chart-preview.html is INTENTIONALLY omitted — it is a
  // developer-only harness used to preview individual ECharts configurations.
  // Vite builds it and pa11y excludes it, but nav/footer/script injection are
  // intentionally stale (it has no production nav).
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

// Run if called directly
buildComponents();

export { buildComponents };
