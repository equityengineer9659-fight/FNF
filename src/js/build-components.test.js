/**
 * Accessibility regression tests for build-components.js
 *
 * Covers P1/P2 findings from the 2026-04-12 dashboard final audit
 * (cluster F — build-components.js injection) plus the 2026-04-13 code
 * review aria-current section-highlight extension (P1-8):
 *
 *   1. aria-current="page" fires on the link whose href matches the current
 *      page AND on the section's top-level link when the page is a recognised
 *      subpage of that section. Dashboard subpages highlight Dashboards;
 *      blog articles highlight Blog; case-studies + templates-tools highlight
 *      Resources. This matches the highlight rules in CLAUDE.md.
 *   2. `<div class="dashboard-hero__stats" aria-label="...">` needs
 *      `role="group"` — aria-label on a bare div is spec-invalid and silently
 *      ignored by assistive tech.
 *   3. `<button>` elements must have an explicit `type="button"` so they do
 *      not default to `type="submit"` when placed inside a form.
 *   4. The "SNAP & Safety Net" dashboard tab label must encode `&` as `&amp;`.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { components, postProcessA11y, blogSubpages } from '../../build-components.js';

// Tests exercise navigation() directly without running the full build, so we
// must seed blogSubpages with a representative slug. In production this set is
// populated by buildComponents() via filesystem glob before any HTML is processed.
beforeAll(() => {
  blogSubpages.add('food-banks-2026-trends');
  blogSubpages.add('salesforce-food-bank-operations');
});

const DASHBOARD_PAGES = [
  'executive-summary',
  'food-insecurity',
  'food-access',
  'snap-safety-net',
  'food-prices',
  'food-banks',
  'nonprofit-directory',
  'nonprofit-profile',
];

// Count occurrences of a substring in a string
function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

describe('build-components: main-nav aria-current section highlighting', () => {
  it('fires aria-current on exactly one section link per page (desktop + mobile = 2 occurrences)', () => {
    // Each page belongs to exactly one top-level section, so exactly one link
    // is marked across the desktop nav AND the mobile nav (2 occurrences total).
    const allPages = [
      'index',
      'services',
      'resources',
      'food-insecurity',
      'food-access',
      'food-prices',
      'food-banks',
      'snap-safety-net',
      'executive-summary',
      'nonprofit-directory',
      'nonprofit-profile',
      'impact',
      'contact',
      'blog',
      'about',
      'case-studies',
      'templates-tools',
      'food-banks-2026-trends',
      'salesforce-food-bank-operations',
    ];
    for (const page of allPages) {
      const html = components.navigation(page);
      const occurrences = count(html, 'aria-current="page"');
      expect(occurrences, `page=${page}`).toBe(2);
    }
  });

  it('on food-insecurity, only the Dashboards link is marked aria-current', () => {
    const html = components.navigation('food-insecurity');
    expect(html).toContain(
      '<a href="/dashboards/food-insecurity.html" class="fnf-nav__link" aria-current="page">Dashboards</a>'
    );
    expect(html).not.toContain('class="fnf-nav__link" aria-current="page">Home</a>');
    expect(html).not.toContain('class="fnf-nav__link" aria-current="page">Blog</a>');
  });

  it('on every dashboard subpage, the Dashboards link IS marked aria-current', () => {
    for (const page of DASHBOARD_PAGES) {
      const html = components.navigation(page);
      expect(
        html,
        `page=${page} should mark the Dashboards link as current`
      ).toContain(
        '<a href="/dashboards/food-insecurity.html" class="fnf-nav__link" aria-current="page">Dashboards</a>'
      );
      expect(
        html,
        `page=${page} mobile link should also mark Dashboards as current`
      ).toContain(
        '<a href="/dashboards/food-insecurity.html" class="fnf-nav__mobile-link" aria-current="page">Dashboards</a>'
      );
    }
  });

  it('on blog articles, the Blog link IS marked aria-current', () => {
    const html = components.navigation('food-banks-2026-trends');
    expect(html).toContain(
      '<a href="/blog.html" class="fnf-nav__link" aria-current="page">Blog</a>'
    );
    expect(html).toContain(
      '<a href="/blog.html" class="fnf-nav__mobile-link" aria-current="page">Blog</a>'
    );
  });

  it('on the blog hub itself, the Blog link IS marked aria-current', () => {
    const html = components.navigation('blog');
    expect(html).toContain(
      '<a href="/blog.html" class="fnf-nav__link" aria-current="page">Blog</a>'
    );
  });

  it('on resources hub subpages, the Resources link IS marked aria-current', () => {
    for (const page of ['case-studies', 'templates-tools']) {
      const html = components.navigation(page);
      expect(
        html,
        `page=${page} should mark the Resources link as current`
      ).toContain(
        '<a href="/resources.html" class="fnf-nav__link" aria-current="page">Resources</a>'
      );
      expect(
        html,
        `page=${page} mobile link should also mark Resources as current`
      ).toContain(
        '<a href="/resources.html" class="fnf-nav__mobile-link" aria-current="page">Resources</a>'
      );
    }
  });

  it('on resources.html itself, the Resources link IS marked aria-current', () => {
    const html = components.navigation('resources');
    expect(html).toContain(
      '<a href="/resources.html" class="fnf-nav__link" aria-current="page">Resources</a>'
    );
  });

  it('blog articles do NOT also mark the Dashboards or Resources link', () => {
    const html = components.navigation('food-banks-2026-trends');
    expect(html).not.toContain('class="fnf-nav__link" aria-current="page">Dashboards</a>');
    expect(html).not.toContain('class="fnf-nav__link" aria-current="page">Resources</a>');
  });
});

describe('build-components: dashboardTabs SNAP & Safety Net encoding (Bug 4)', () => {
  it('emits &amp; in the SNAP & Safety Net tab label, not a raw ampersand', () => {
    const html = components.dashboardTabs('food-insecurity');
    expect(html).toContain('SNAP &amp; Safety Net');
    expect(html).not.toContain('SNAP & Safety Net');
  });

  it('preserves correct per-tab aria-current across all dashboard pages', () => {
    for (const page of DASHBOARD_PAGES) {
      const html = components.dashboardTabs(page);
      // Dashboard tabs should have exactly one aria-current per page
      // (profile page highlights the Directory tab)
      const occurrences = count(html, 'aria-current="page"');
      expect(occurrences, `page=${page}`).toBe(1);
    }
  });
});

describe('build-components: postProcessA11y (Bugs 2 + 3)', () => {
  describe('Bug 2 — dashboard-hero__stats role="group"', () => {
    it('adds role="group" to dashboard-hero__stats divs with aria-label', () => {
      const input = '<div class="dashboard-hero__stats" aria-label="Key national statistics">';
      const output = postProcessA11y(input);
      expect(output).toContain(
        '<div class="dashboard-hero__stats" role="group" aria-label="Key national statistics">'
      );
    });

    it('is idempotent — does not double-apply role', () => {
      const input = '<div class="dashboard-hero__stats" role="group" aria-label="Key national statistics">';
      const output = postProcessA11y(input);
      // Should not be altered; role appears exactly once
      expect(count(output, 'role="group"')).toBe(1);
      expect(output).toContain('role="group" aria-label="Key national statistics"');
    });

    it('handles multiple dashboard-hero__stats divs in one document', () => {
      const input = [
        '<div class="dashboard-hero__stats" aria-label="Key national statistics">',
        '<div class="dashboard-hero__stats" aria-label="Directory statistics">',
      ].join('\n');
      const output = postProcessA11y(input);
      expect(count(output, 'role="group"')).toBe(2);
    });
  });

  describe('Bug 3 — button type="button"', () => {
    it('adds type="button" to buttons missing a type attribute', () => {
      const input = '<button class="dashboard-back-btn" aria-label="Back">Back</button>';
      const output = postProcessA11y(input);
      expect(output).toContain('type="button"');
      expect(output).toContain('class="dashboard-back-btn"');
      expect(output).toContain('aria-label="Back"');
    });

    it('leaves buttons that already have type=button alone', () => {
      const input = '<button type="button" class="directory-chip">Food Bank</button>';
      const output = postProcessA11y(input);
      expect(count(output, 'type="button"')).toBe(1);
    });

    it('leaves buttons with type=submit alone (form submits are legitimate)', () => {
      const input = '<button type="submit" class="contact-form-submit">Send</button>';
      const output = postProcessA11y(input);
      expect(output).toContain('type="submit"');
      expect(output).not.toContain('type="button"');
    });

    it('handles multiple untyped buttons in one document', () => {
      const input = [
        '<button class="a" aria-pressed="true">One</button>',
        '<button class="b" aria-pressed="false">Two</button>',
        '<button id="three">Three</button>',
      ].join('\n');
      const output = postProcessA11y(input);
      expect(count(output, 'type="button"')).toBe(3);
    });

    it('preserves all original attributes on the button', () => {
      const input = '<button class="dashboard-metric-btn dashboard-metric-btn--active" data-map-view="deserts" aria-pressed="true">Food Deserts</button>';
      const output = postProcessA11y(input);
      expect(output).toContain('type="button"');
      expect(output).toContain('class="dashboard-metric-btn dashboard-metric-btn--active"');
      expect(output).toContain('data-map-view="deserts"');
      expect(output).toContain('aria-pressed="true"');
      expect(output).toContain('>Food Deserts</button>');
    });
  });
});
