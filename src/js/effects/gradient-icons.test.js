/**
 * Unit Tests for Gradient Icon System
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { hydrateGradientIcons } from './gradient-icons.js';

describe('Gradient Icon System', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('hydrateGradientIcons', () => {
    it('should hydrate a single icon with correct classes', () => {
      document.body.innerHTML = '<div data-icon="focus-innovation"></div>';

      hydrateGradientIcons(document.body);

      const icon = document.querySelector('[data-icon="focus-innovation"]');
      expect(icon.classList.contains('fnf-icon-gradient')).toBe(true);
      expect(icon.classList.contains('fnf-icon-gradient--cobalt')).toBe(true);
    });

    it('should add proper ARIA attributes for accessibility', () => {
      document.body.innerHTML = '<div data-icon="focus-innovation"></div>';

      hydrateGradientIcons(document.body);

      const icon = document.querySelector('[data-icon="focus-innovation"]');
      expect(icon.getAttribute('role')).toBe('img');
      expect(icon.getAttribute('aria-label')).toBe('Innovation & Empowerment');
    });

    it('should create glyph span with correct text', () => {
      document.body.innerHTML = '<div data-icon="focus-innovation"></div>';

      hydrateGradientIcons(document.body);

      const glyph = document.querySelector('.fnf-icon-glyph');
      expect(glyph).toBeTruthy();
      expect(glyph.textContent).toBe('IN');
      expect(glyph.getAttribute('aria-hidden')).toBe('true');
    });

    it('should create screen reader text', () => {
      document.body.innerHTML = '<div data-icon="focus-innovation"></div>';

      hydrateGradientIcons(document.body);

      const srText = document.querySelector('.slds-assistive-text');
      expect(srText).toBeTruthy();
      expect(srText.textContent).toBe('Innovation & Empowerment');
    });

    it('should mark icon as hydrated', () => {
      document.body.innerHTML = '<div data-icon="focus-innovation"></div>';

      hydrateGradientIcons(document.body);

      const icon = document.querySelector('[data-icon="focus-innovation"]');
      expect(icon.dataset.iconHydrated).toBe('true');
    });

    it('should not hydrate already hydrated icons', () => {
      document.body.innerHTML = '<div data-icon="focus-innovation" data-icon-hydrated="true"></div>';

      const icon = document.querySelector('[data-icon="focus-innovation"]');
      const initialHTML = icon.innerHTML;

      hydrateGradientIcons(document.body);

      expect(icon.innerHTML).toBe(initialHTML);
    });

    it('should handle multiple icons', () => {
      document.body.innerHTML = `
        <div data-icon="focus-innovation"></div>
        <div data-icon="focus-community"></div>
        <div data-icon="focus-tools"></div>
      `;

      hydrateGradientIcons(document.body);

      const icons = document.querySelectorAll('.fnf-icon-gradient');
      expect(icons.length).toBe(3);
    });

    it('should apply correct gradient variant for services', () => {
      document.body.innerHTML = '<div data-icon="service-strategy"></div>';

      hydrateGradientIcons(document.body);

      const icon = document.querySelector('[data-icon="service-strategy"]');
      expect(icon.classList.contains('fnf-icon-gradient--violet')).toBe(true);
    });

    it('should apply correct gradient variant for resources', () => {
      document.body.innerHTML = '<div data-icon="resource-blog"></div>';

      hydrateGradientIcons(document.body);

      const icon = document.querySelector('[data-icon="resource-blog"]');
      expect(icon.classList.contains('fnf-icon-gradient--emerald')).toBe(true);
    });

    it('should apply correct gradient variant for expertise', () => {
      document.body.innerHTML = '<div data-icon="expertise-salesforce"></div>';

      hydrateGradientIcons(document.body);

      const icon = document.querySelector('[data-icon="expertise-salesforce"]');
      expect(icon.classList.contains('fnf-icon-gradient--teal')).toBe(true);
    });

    it('should apply correct gradient variant for values', () => {
      document.body.innerHTML = '<div data-icon="value-equity"></div>';

      hydrateGradientIcons(document.body);

      const icon = document.querySelector('[data-icon="value-equity"]');
      expect(icon.classList.contains('fnf-icon-gradient--sunrise')).toBe(true);
    });

    it('should handle unknown icon keys gracefully', () => {
      document.body.innerHTML = '<div data-icon="unknown-icon"></div>';

      // Should not throw error
      expect(() => hydrateGradientIcons(document.body)).not.toThrow();

      const icon = document.querySelector('[data-icon="unknown-icon"]');
      // Should still have some default behavior
      expect(icon.classList.contains('fnf-icon-gradient')).toBe(true);
    });

    it('should work with custom root element', () => {
      const container = document.createElement('div');
      container.innerHTML = '<div data-icon="focus-innovation"></div>';
      document.body.appendChild(container);

      hydrateGradientIcons(container);

      const icon = container.querySelector('[data-icon="focus-innovation"]');
      expect(icon.classList.contains('fnf-icon-gradient')).toBe(true);
    });

    it('should preserve existing classes on icon element', () => {
      document.body.innerHTML = '<div class="existing-class" data-icon="focus-innovation"></div>';

      hydrateGradientIcons(document.body);

      const icon = document.querySelector('[data-icon="focus-innovation"]');
      expect(icon.classList.contains('existing-class')).toBe(true);
      expect(icon.classList.contains('fnf-icon-gradient')).toBe(true);
    });

    it('should handle empty document gracefully', () => {
      expect(() => hydrateGradientIcons(document.body)).not.toThrow();
    });

    it('should create correctly structured DOM', () => {
      document.body.innerHTML = '<div data-icon="focus-innovation"></div>';

      hydrateGradientIcons(document.body);

      const icon = document.querySelector('[data-icon="focus-innovation"]');
      const glyph = icon.querySelector('.fnf-icon-glyph');
      const srText = icon.querySelector('.slds-assistive-text');

      expect(icon.children.length).toBe(2); // glyph + sr-text
      expect(glyph.parentElement).toBe(icon);
      expect(srText.parentElement).toBe(icon);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle all icon types on index page', () => {
      document.body.innerHTML = `
        <div data-icon="focus-innovation"></div>
        <div data-icon="focus-community"></div>
        <div data-icon="focus-tools"></div>
        <div data-icon="focus-excellence"></div>
        <div data-icon="focus-families"></div>
        <div data-icon="focus-security"></div>
      `;

      hydrateGradientIcons(document.body);

      const icons = document.querySelectorAll('.fnf-icon-gradient');
      expect(icons.length).toBe(6);

      // All should have cobalt variant (focus category)
      icons.forEach(icon => {
        expect(icon.classList.contains('fnf-icon-gradient--cobalt')).toBe(true);
      });
    });

    it('should handle mixed icon categories', () => {
      document.body.innerHTML = `
        <div data-icon="focus-innovation"></div>
        <div data-icon="service-strategy"></div>
        <div data-icon="resource-blog"></div>
        <div data-icon="expertise-salesforce"></div>
        <div data-icon="value-equity"></div>
      `;

      hydrateGradientIcons(document.body);

      expect(document.querySelector('[data-icon="focus-innovation"]').classList.contains('fnf-icon-gradient--cobalt')).toBe(true);
      expect(document.querySelector('[data-icon="service-strategy"]').classList.contains('fnf-icon-gradient--violet')).toBe(true);
      expect(document.querySelector('[data-icon="resource-blog"]').classList.contains('fnf-icon-gradient--emerald')).toBe(true);
      expect(document.querySelector('[data-icon="expertise-salesforce"]').classList.contains('fnf-icon-gradient--teal')).toBe(true);
      expect(document.querySelector('[data-icon="value-equity"]').classList.contains('fnf-icon-gradient--sunrise')).toBe(true);
    });
  });
});
