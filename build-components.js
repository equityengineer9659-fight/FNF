/**
 * Simple HTML Component Builder
 * Reduces HTML duplication by extracting common components
 * Run this as a pre-build step to generate HTML from components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pages that should highlight "Dashboards" in navigation
const dashboardSubpages = [
  'food-insecurity', 'food-access', 'snap-safety-net', 'food-prices', 'food-banks',
  'nonprofit-directory', 'nonprofit-profile',
];

// Pages that should highlight "Blog" in navigation
const blogSubpages = [
  'blog',
  'ai-reshaping-food-banks', 'salesforce-food-bank-operations', 'donor-relationships-nonprofit-cloud',
  'data-driven-food-banks', 'food-bank-workflow-automation', 'securing-technology-grants',
  'ai-inventory-management',
  'agentforce-nonprofits-guide', 'ai-ethics-nonprofit-governance', 'centralized-food-hub-case-study',
  'client-choice-food-pantry-technology', 'community-food-center-model', 'data-privacy-food-bank-clients',
  'digital-transformation-small-food-banks', 'donor-prospecting-salesforce', 'food-bank-client-services-technology',
  'food-bank-crisis-response-planning', 'food-bank-kitchen-operations', 'food-bank-strategic-partnerships',
  'food-bank-technology-stack', 'food-banks-healthcare-social-determinants', 'food-is-medicine-food-banks',
  'future-food-banking-trends', 'grant-management-food-banks', 'impact-measurement-food-banks',
  'measuring-hunger-relief-outcomes', 'nonprofit-cloud-vs-sales-cloud', 'nutrition-first-food-bank-strategy',
  'rapid-technology-implementation', 'salesforce-flow-builder-nonprofits', 'salesforce-reports-dashboards-food-banks',
  'salesforce-security-nonprofits', 'salesforce-spring-2026-nonprofits', 'snap-policy-changes-food-banks',
  'tax-policy-nonprofit-fundraising', 'volunteer-management-technology', 'volunteer-recruitment-retention-digital',
  'purpose-driven-ai-food-banks', 'salesforce-nonprofit-cloud-ai-automation',
  'snap-cuts-ice-fears-food-bank-response',
  'grant-writing-nonprofit-sustainability',
  'ai-data-strategy-crm-food-banks',
  'data-migration-food-bank-modernization',
  'central-pennsylvania-food-bank-salesforce',
  'barrie-food-bank-crm-transformation',
  'last-mile-food-rescue-salesforce',
  'food-bank-of-alaska-snap-management',
  'san-antonio-food-bank-salesforce',
  'second-harvest-silicon-valley-crm',
  'second-harvest-process-automation',
  'roadrunner-food-bank-salesforce',
  'food-bank-salesforce-use-cases',
  'food-bank-digital-supply-chain',
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
        <div class="slds-container_large slds-container_center slds-p-around_large">
            <div class="slds-text-align_center">
                <p class="slds-text-body_small slds-text-color_inverse">&copy; 2026 Food-N-Force. All rights reserved.</p>
            </div>
        </div>
    </footer>`,

  scripts: (pageName) => {
    let scripts = `    <!-- JavaScript Modules - Deferred for performance -->
    <script type="module" src="/src/js/main.js" defer></script>`;
    // Dashboard pages get their own entry point
    const dashboardJsMap = {
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
    ];
    // Profile page highlights the Directory tab
    const activeTab = currentPage === 'nonprofit-profile' ? 'nonprofit-directory' : currentPage;
    const items = tabs.map(t =>
      `            <li role="presentation"><a href="/dashboards/${t.slug}.html" class="dashboard-tabs__tab" role="tab"${t.slug === activeTab ? ' aria-current="page"' : ''}>${t.label}</a></li>`
    ).join('\n');
    return `    <!-- Dashboard Tabs -->
    <nav class="dashboard-tabs" aria-label="Dashboard navigation">
        <div class="dashboard-tabs__container">
            <ul class="dashboard-tabs__list" role="tablist">
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
  const dashboardSlugs = ['food-insecurity', 'food-access', 'snap-safety-net', 'food-prices', 'food-banks', 'nonprofit-directory', 'nonprofit-profile'];
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

  // Write back the processed HTML
  try {
    fs.writeFileSync(filePath, html);
  } catch (err) {
    console.error(`❌ ERROR writing ${pageName}: ${err.message}`);
  }
}

// Main execution
function buildComponents() {
  console.log('🔨 Building HTML components...\n');

  // Core pages at root
  const corePages = ['index', 'about', 'services', 'resources', 'impact', 'contact', 'blog'];

  // Hub pages at root (not articles, not core)
  const hubPages = ['case-studies', 'templates-tools'];

  // Article pages under blog/
  const articlePages = [
    'ai-reshaping-food-banks', 'salesforce-food-bank-operations', 'donor-relationships-nonprofit-cloud',
    'data-driven-food-banks', 'food-bank-workflow-automation', 'securing-technology-grants',
    'ai-inventory-management',
    'agentforce-nonprofits-guide', 'ai-ethics-nonprofit-governance', 'centralized-food-hub-case-study',
    'client-choice-food-pantry-technology', 'community-food-center-model', 'data-privacy-food-bank-clients',
    'digital-transformation-small-food-banks', 'donor-prospecting-salesforce', 'food-bank-client-services-technology',
    'food-bank-crisis-response-planning', 'food-bank-kitchen-operations', 'food-bank-strategic-partnerships',
    'food-bank-technology-stack', 'food-banks-healthcare-social-determinants', 'food-is-medicine-food-banks',
    'future-food-banking-trends', 'grant-management-food-banks', 'impact-measurement-food-banks',
    'measuring-hunger-relief-outcomes', 'nonprofit-cloud-vs-sales-cloud', 'nutrition-first-food-bank-strategy',
    'rapid-technology-implementation', 'salesforce-flow-builder-nonprofits', 'salesforce-reports-dashboards-food-banks',
    'salesforce-security-nonprofits', 'salesforce-spring-2026-nonprofits', 'snap-policy-changes-food-banks',
    'tax-policy-nonprofit-fundraising', 'volunteer-management-technology', 'volunteer-recruitment-retention-digital',
    'purpose-driven-ai-food-banks', 'salesforce-nonprofit-cloud-ai-automation',
    'snap-cuts-ice-fears-food-bank-response',
  'grant-writing-nonprofit-sustainability',
  'ai-data-strategy-crm-food-banks',
  'data-migration-food-bank-modernization',
  'central-pennsylvania-food-bank-salesforce',
  'barrie-food-bank-crm-transformation',
  'last-mile-food-rescue-salesforce',
  'food-bank-of-alaska-snap-management',
  'san-antonio-food-bank-salesforce',
  'second-harvest-silicon-valley-crm',
  'second-harvest-process-automation',
  'roadrunner-food-bank-salesforce',
  'food-bank-salesforce-use-cases',
  'food-bank-digital-supply-chain',
];

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
  const dashboardPages = ['food-insecurity', 'food-access', 'snap-safety-net', 'food-prices', 'food-banks', 'nonprofit-directory', 'nonprofit-profile'];

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
