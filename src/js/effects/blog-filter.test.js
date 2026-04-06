import { describe, it, expect, beforeEach } from 'vitest';
import BlogFilter from './blog-filter.js';

function createBlogDom(cardCount = 15) {
  const categories = ['Technology', 'Operations', 'Case Studies', 'Strategy'];
  let html = '<div class="blog-category-bar">';
  html += '<button class="blog-category-pill blog-category-pill--active" aria-pressed="true">All</button>';
  categories.forEach(cat => {
    html += `<button class="blog-category-pill" aria-pressed="false">${cat}</button>`;
  });
  html += '</div><div class="slds-grid">';
  for (let i = 0; i < cardCount; i++) {
    const cat = categories[i % categories.length];
    html += `<div class="slds-col"><div class="blog-card"><span class="blog-card__category">${cat}</span><h3>Article ${i}</h3></div></div>`;
  }
  html += '</div>';
  html += '<button class="blog-load-more">Load More</button>';
  return html;
}

describe('BlogFilter', () => {
  beforeEach(() => {
    document.body.innerHTML = createBlogDom(15);
  });

  it('should initialize with PAGE_SIZE visible cards', () => {
    new BlogFilter();
    const cols = document.querySelectorAll('.slds-col');
    const visible = Array.from(cols).filter(c => c.style.display !== 'none');
    expect(visible.length).toBe(12); // PAGE_SIZE
  });

  it('should show Load More button when more cards exist', () => {
    new BlogFilter();
    const btn = document.querySelector('.blog-load-more');
    expect(btn.style.display).not.toBe('none');
  });

  it('should hide Load More when all cards visible', () => {
    document.body.innerHTML = createBlogDom(5);
    new BlogFilter();
    const btn = document.querySelector('.blog-load-more');
    expect(btn.style.display).toBe('none');
  });

  it('should show more cards on Load More click', () => {
    new BlogFilter();
    const btn = document.querySelector('.blog-load-more');
    btn.click();
    const cols = document.querySelectorAll('.slds-col');
    const visible = Array.from(cols).filter(c => c.style.display !== 'none');
    expect(visible.length).toBe(15); // All 15
  });

  describe('category filtering', () => {
    it('should filter cards by category', () => {
      new BlogFilter();
      const techPill = Array.from(document.querySelectorAll('.blog-category-pill'))
        .find(p => p.textContent === 'Technology');
      techPill.click();

      const visibleCards = Array.from(document.querySelectorAll('.blog-card'))
        .filter(c => c.closest('.slds-col').style.display !== 'none');
      visibleCards.forEach(card => {
        expect(card.querySelector('.blog-card__category').textContent).toBe('Technology');
      });
    });

    it('should set aria-pressed on active pill', () => {
      new BlogFilter();
      const pills = document.querySelectorAll('.blog-category-pill');
      pills[1].click(); // Click first category

      expect(pills[1].getAttribute('aria-pressed')).toBe('true');
      expect(pills[0].getAttribute('aria-pressed')).toBe('false');
    });

    it('should reset to All view when All pill clicked', () => {
      new BlogFilter();
      const pills = document.querySelectorAll('.blog-category-pill');
      pills[1].click(); // Filter by category
      pills[0].click(); // Back to All

      const cols = document.querySelectorAll('.slds-col');
      const visible = Array.from(cols).filter(c => c.style.display !== 'none');
      expect(visible.length).toBe(12); // PAGE_SIZE
    });

    it('should paginate within category view', () => {
      // Create enough cards to trigger category pagination (CATEGORY_PAGE_SIZE = 6)
      document.body.innerHTML = createBlogDom(30);
      new BlogFilter();

      const techPill = Array.from(document.querySelectorAll('.blog-category-pill'))
        .find(p => p.textContent === 'Technology');
      techPill.click();

      // Should show at most CATEGORY_PAGE_SIZE matching cards
      const visible = Array.from(document.querySelectorAll('.blog-card'))
        .filter(c => c.closest('.slds-col').style.display !== 'none');
      expect(visible.length).toBeLessThanOrEqual(6);
    });
  });

  describe('destroy', () => {
    it('should abort event listeners', () => {
      const filter = new BlogFilter();
      filter.destroy();
      // After destroy, clicking should not change state
      const pills = document.querySelectorAll('.blog-category-pill');
      pills[1].click();
      // The pill should not get the active class
      expect(pills[1].classList.contains('blog-category-pill--active')).toBe(false);
    });
  });

  it('should gracefully handle missing category bar', () => {
    document.body.innerHTML = '<div>No blog here</div>';
    expect(() => new BlogFilter()).not.toThrow();
  });
});
