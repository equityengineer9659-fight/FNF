import { describe, it, expect, beforeEach, vi } from 'vitest';
import ArticleEnhancements from './article-enhancements.js';

describe('ArticleEnhancements', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.className = '';
    vi.restoreAllMocks();
  });

  it('should not initialize on non-article pages', () => {
    document.body.classList.add('fnf-page--index');
    const ae = new ArticleEnhancements();
    expect(ae.observer).toBeNull();
  });

  it('should initialize observer on article pages', () => {
    document.body.classList.add('fnf-page--article');
    document.body.innerHTML = `
      <div class="article-prose"><h2>Section</h2><p>Content</p></div>
    `;
    const ae = new ArticleEnhancements();
    expect(ae.observer).not.toBeNull();
    ae.destroy();
  });

  it('should add article-reveal class to matching elements', () => {
    document.body.classList.add('fnf-page--article');
    document.body.innerHTML = `
      <div class="article-prose">
        <h2>Title</h2>
        <p>Paragraph</p>
      </div>
      <div class="article-pullquote">Quote</div>
      <div class="article-cta">CTA</div>
    `;
    const ae = new ArticleEnhancements();
    const revealed = document.querySelectorAll('.article-reveal');
    expect(revealed.length).toBe(4);
    ae.destroy();
  });

  it('should skip animation and reveal all when reduced motion is preferred', () => {
    // Mock matchMedia to return reduced-motion: true
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    document.body.classList.add('fnf-page--article');
    document.body.innerHTML = `
      <div class="article-prose"><h2>Title</h2></div>
      <div class="article-reveal">Already marked</div>
    `;
    const ae = new ArticleEnhancements();
    // Observer should NOT be created
    expect(ae.observer).toBeNull();
    // Pre-existing article-reveal elements should get visible class
    const visible = document.querySelectorAll('.article-reveal--visible');
    expect(visible.length).toBeGreaterThanOrEqual(1);
  });

  describe('destroy', () => {
    it('should disconnect observer and set to null', () => {
      document.body.classList.add('fnf-page--article');
      document.body.innerHTML = '<div class="article-prose"><h2>T</h2></div>';
      const ae = new ArticleEnhancements();
      ae.destroy();
      expect(ae.observer).toBeNull();
    });

    it('should not throw if observer is already null', () => {
      document.body.classList.add('fnf-page--index');
      const ae = new ArticleEnhancements();
      expect(() => ae.destroy()).not.toThrow();
    });
  });
});
