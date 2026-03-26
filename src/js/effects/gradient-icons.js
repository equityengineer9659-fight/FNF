/**
 * Gradient Icon System
 * Hydrates data-icon attributes with gradient badge icons
 *
 * Usage:
 * <div data-icon="focus-innovation"></div>
 * Will be hydrated to professional gradient badge with "IN" glyph
 */

const ICON_META = {
  // Index page - Focus Areas
  'focus-innovation': { label: 'Innovation & Empowerment', glyph: 'IN' },
  'focus-community': { label: 'Community Connection', glyph: 'CO' },
  'focus-tools': { label: 'Smart Digital Tools', glyph: 'TL' },

  // Index page - Measurable Growth
  'focus-excellence': { label: 'Nonprofit Excellence', glyph: 'EX' },
  'focus-families': { label: 'Families Better Served', glyph: 'FB' },
  'focus-security': { label: 'Food Security Focus', glyph: 'FS' },

  // Services page
  'service-strategy': { label: 'Digital Strategy & Roadmapping', glyph: 'DS' },
  'service-inventory': { label: 'Inventory & Client Management', glyph: 'IM' },
  'service-automation': { label: 'Workflow Automation', glyph: 'WA' },
  'service-analytics': { label: 'Data Analytics & Reporting', glyph: 'DA' },
  'service-engagement': { label: 'Community Engagement Tools', glyph: 'CE' },
  'service-training': { label: 'Staff Training & Support', glyph: 'ST' },

  // Resources page
  'resource-blog': { label: 'Blog & Thought Leadership', glyph: 'BL' },
  'resource-guides': { label: 'Implementation Guides', glyph: 'IG' },
  'resource-funding': { label: 'Grants & Funding Tips', glyph: 'GF' },
  'resource-templates': { label: 'Templates & Tools', glyph: 'TT' },
  'resource-webinars': { label: 'Webinars & Training', glyph: 'WB' },
  'resource-case-studies': { label: 'Case Studies', glyph: 'CS' },

  // About page - Expertise
  'expertise-salesforce': { label: 'Salesforce for Nonprofits Expertise', glyph: 'SF' },
  'expertise-workflows': { label: 'Food Relief Workflow Expertise', glyph: 'FW' },
  'expertise-human': { label: 'Human-Centered Consulting', glyph: 'HC' },
  'expertise-scalable': { label: 'Scalable Solutions', glyph: 'SC' },

  // About page - Values
  'value-equity': { label: 'Equity', glyph: 'EQ' },
  'value-efficiency': { label: 'Efficiency', glyph: 'EF' },
  'value-empathy': { label: 'Empathy', glyph: 'EM' },
  'value-innovation': { label: 'Innovation', glyph: 'IN' }
};

/**
 * Category to gradient variant mapping
 */
const CATEGORY_VARIANTS = {
  focus: 'fnf-icon-gradient--cobalt',
  service: 'fnf-icon-gradient--violet',
  resource: 'fnf-icon-gradient--emerald',
  expertise: 'fnf-icon-gradient--teal',
  value: 'fnf-icon-gradient--sunrise'
};

/**
 * Convert hyphenated string to title case
 * @param {string} key - The icon key
 * @returns {string} Title cased string
 */
function titleCase(key) {
  return key
    .split(/[-_]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Generate initials from label
 * @param {string} label - The label text
 * @returns {string} Uppercase initials (up to 3 characters)
 */
function initials(label) {
  const matches = label.match(/\b\p{L}/gu);
  if (!matches || matches.length === 0) {
    return label.slice(0, 2).toUpperCase();
  }
  return matches.join('').slice(0, 3).toUpperCase();
}

/**
 * Resolve metadata for an icon key
 * @param {string} iconKey - The data-icon value
 * @returns {Object} Icon metadata {label, glyph, variant}
 */
function resolveMeta(iconKey) {
  const base = ICON_META[iconKey] ?? {};
  const prefix = iconKey.split('-')[0];
  const variant = base.variant ?? CATEGORY_VARIANTS[prefix] ?? 'fnf-icon-gradient--cobalt';
  const label = base.label ?? titleCase(iconKey);
  const glyph = base.glyph ?? initials(label);
  return { label, glyph, variant };
}

/**
 * Hydrate all [data-icon] elements within root
 * @param {HTMLElement} root - The root element to search within
 */
export function hydrateGradientIcons(root = document) {
  if (!root) {
    return;
  }

  const nodes = root.querySelectorAll('[data-icon]');
  nodes.forEach((node) => {
    // Skip if already hydrated
    if (node.dataset.iconHydrated === 'true') {
      return;
    }

    const key = node.dataset.icon?.trim();
    if (!key) {
      return;
    }

    // Skip if SVG icon is already embedded in HTML (progressive enhancement)
    if (node.querySelector('svg')) {
      node.dataset.iconHydrated = 'true';
      return;
    }

    const { label, glyph, variant } = resolveMeta(key);

    // Apply styling classes
    node.classList.add('fnf-icon-gradient', variant);
    node.setAttribute('role', 'img');
    node.setAttribute('aria-label', label);

    // Create glyph element as fallback
    const glyphEl = document.createElement('span');
    glyphEl.className = 'fnf-icon-glyph';
    glyphEl.textContent = glyph;
    glyphEl.setAttribute('aria-hidden', 'true');

    // Create screen reader text
    const srText = document.createElement('span');
    srText.className = 'slds-assistive-text';
    srText.textContent = label;

    // Clear node and append fallback elements
    node.textContent = '';
    node.appendChild(glyphEl);
    node.appendChild(srText);

    // Mark as hydrated
    node.dataset.iconHydrated = 'true';
  });
}

export default hydrateGradientIcons;
