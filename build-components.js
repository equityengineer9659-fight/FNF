/**
 * Simple HTML Component Builder
 * Reduces HTML duplication by extracting common components
 * Run this as a pre-build step to generate HTML from components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Pages that should highlight "Resources" in navigation
const resourcesSubpages = [
  'resources', 'blog',
  // Original 7 articles
  'ai-reshaping-food-banks', 'salesforce-food-bank-operations', 'donor-relationships-nonprofit-cloud',
  'data-driven-food-banks', 'food-bank-workflow-automation', 'securing-technology-grants',
  'ai-inventory-management', 'case-studies', 'templates-tools',
  // 30 new articles
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
];

// Component definitions
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
                    <a href="index.html" class="fnf-nav__brand" aria-label="Food-N-Force Home">
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
                <a href="index.html" class="fnf-nav__link"${currentPage === 'index' ? ' aria-current="page"' : ''}>Home</a>
            </li>
            <li class="fnf-nav__item">
                <a href="services.html" class="fnf-nav__link"${currentPage === 'services' ? ' aria-current="page"' : ''}>Services</a>
            </li>
            <li class="fnf-nav__item">
                <a href="resources.html" class="fnf-nav__link"${resourcesSubpages.includes(currentPage) ? ' aria-current="page"' : ''}>Resources</a>
            </li>
            <li class="fnf-nav__item">
                <a href="impact.html" class="fnf-nav__link"${currentPage === 'impact' ? ' aria-current="page"' : ''}>Impact</a>
            </li>
            <li class="fnf-nav__item">
                <a href="contact.html" class="fnf-nav__link"${currentPage === 'contact' ? ' aria-current="page"' : ''}>Contact</a>
            </li>
            <li class="fnf-nav__item">
                <a href="about.html" class="fnf-nav__link"${currentPage === 'about' ? ' aria-current="page"' : ''}>About Us</a>
            </li>
        </ul>
        </div>

        <!-- Mobile Menu -->
        <div class="fnf-nav__mobile">
            <ul class="fnf-nav__mobile-menu">
                <li><a href="index.html" class="fnf-nav__mobile-link"${currentPage === 'index' ? ' aria-current="page"' : ''}>Home</a></li>
                <li><a href="services.html" class="fnf-nav__mobile-link"${currentPage === 'services' ? ' aria-current="page"' : ''}>Services</a></li>
                <li><a href="resources.html" class="fnf-nav__mobile-link"${resourcesSubpages.includes(currentPage) ? ' aria-current="page"' : ''}>Resources</a></li>
                <li><a href="impact.html" class="fnf-nav__mobile-link"${currentPage === 'impact' ? ' aria-current="page"' : ''}>Impact</a></li>
                <li><a href="contact.html" class="fnf-nav__mobile-link"${currentPage === 'contact' ? ' aria-current="page"' : ''}>Contact</a></li>
                <li><a href="about.html" class="fnf-nav__mobile-link"${currentPage === 'about' ? ' aria-current="page"' : ''}>About Us</a></li>
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

  scripts: () => {
    return `    <!-- JavaScript Modules - Deferred for performance -->
    <script type="module" src="src/js/main.js" defer></script>`;
  }
};

// Process HTML files
function processHtmlFile(filePath, pageName) {
  let html = fs.readFileSync(filePath, 'utf-8');

  // Replace navigation component
  const navPattern = /    <!-- Navigation -->[\s\S]*?<\/nav>/;
  if (navPattern.test(html)) {
    html = html.replace(navPattern, components.navigation(pageName));
    console.log(`✅ Updated navigation in ${pageName}.html`);
  }

  // Replace footer component
  const footerPattern = /    <!-- Footer -->[\s\S]*?<\/footer>/;
  if (footerPattern.test(html)) {
    html = html.replace(footerPattern, components.footer());
    console.log(`✅ Updated footer in ${pageName}.html`);
  }

  // Remove all existing script sections and duplicates first
  const scriptSectionPattern = /    <!-- JavaScript Modules[\s\S]*?(?=<\/body>)/;
  const fallbackScriptPattern = /    <!-- Fallback Particle System[\s\S]*?<\/script>\n?/g;

  // Remove all fallback scripts first
  html = html.replace(fallbackScriptPattern, '');

  // Then replace the entire script section
  if (scriptSectionPattern.test(html)) {
    html = html.replace(scriptSectionPattern, components.scripts(pageName) + '\n');
    console.log(`✅ Updated scripts in ${pageName}.html`);
  }

  // Write back the processed HTML
  fs.writeFileSync(filePath, html);
}

// Main execution
function buildComponents() {
  console.log('🔨 Building HTML components...\n');

  const pages = [
    // Core pages
    'index', 'about', 'services', 'resources', 'impact', 'contact', 'blog',
    // Original 7 articles
    'ai-reshaping-food-banks', 'salesforce-food-bank-operations', 'donor-relationships-nonprofit-cloud',
    'data-driven-food-banks', 'food-bank-workflow-automation', 'securing-technology-grants',
    'ai-inventory-management', 'case-studies', 'templates-tools',
    // 30 new articles
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
  ];

  pages.forEach(page => {
    const filePath = path.join(__dirname, `${page}.html`);
    if (fs.existsSync(filePath)) {
      processHtmlFile(filePath, page);
    } else {
      console.warn(`⚠️  File not found: ${page}.html`);
    }
  });

  console.log('\n✨ Component build complete!');
}

// Run if called directly
buildComponents();

export { buildComponents };