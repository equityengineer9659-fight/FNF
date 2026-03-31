/**
 * @fileoverview Blog category filter with load-more pagination
 * @description Filters article cards by category; limits "All" view to PAGE_SIZE
 *              cards with a Load More button to reveal subsequent batches.
 */

const PAGE_SIZE = 12;

export default class BlogFilter {
  constructor() {
    this.bar = document.querySelector('.blog-category-bar');
    if (!this.bar) return;

    this.pills = this.bar.querySelectorAll('.blog-category-pill');
    this.cards = document.querySelectorAll('.blog-card');
    this.loadMoreBtn = document.querySelector('.blog-load-more');
    this.abortController = new AbortController();

    this.visibleCount = PAGE_SIZE;
    this.currentCategory = 'All';

    this.init();
  }

  init() {
    const signal = this.abortController.signal;

    // Apply initial pagination on All view
    this.applyPagination();

    // Load More button
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => {
        this.visibleCount += PAGE_SIZE;
        this.applyPagination();
      }, { signal });
    }

    // Category pills
    this.pills.forEach(pill => {
      pill.addEventListener('click', () => this.filter(pill), { signal });
    });
  }

  // Show first `visibleCount` cards, hide the rest, toggle Load More button
  applyPagination() {
    const cols = Array.from(this.cards)
      .map(card => card.closest('.slds-col'))
      .filter(Boolean);

    let hasHidden = false;

    cols.forEach((col, index) => {
      if (index < this.visibleCount) {
        col.style.display = '';
      } else {
        col.style.display = 'none';
        hasHidden = true;
      }
    });

    if (this.loadMoreBtn) {
      this.loadMoreBtn.style.display = hasHidden ? '' : 'none';
    }
  }

  filter(activePill) {
    const category = activePill.textContent.trim();

    this.currentCategory = category;

    // Update active state on pills
    this.pills.forEach(pill => {
      const isActive = pill === activePill;
      pill.classList.toggle('blog-category-pill--active', isActive);
      pill.setAttribute('aria-pressed', String(isActive));
      pill.setAttribute('aria-current', isActive ? 'true' : 'false');
    });

    if (category === 'All') {
      // Reset to first page and apply pagination
      this.visibleCount = PAGE_SIZE;
      this.applyPagination();
      return;
    }

    // Category view: show all matching cards, no pagination
    this.cards.forEach(card => {
      const col = card.closest('.slds-col');
      if (!col) return;
      const cardCategory = card.querySelector('.blog-card__category');
      const matches = cardCategory && cardCategory.textContent.trim() === category;
      col.style.display = matches ? '' : 'none';
    });

    // Hide Load More when a specific category is active
    if (this.loadMoreBtn) {
      this.loadMoreBtn.style.display = 'none';
    }
  }

  destroy() {
    this.abortController.abort();
  }
}
