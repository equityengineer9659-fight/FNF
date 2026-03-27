/**
 * @fileoverview Blog category filter
 * @description Filters article cards by category when filter pills are clicked
 */

export default class BlogFilter {
  constructor() {
    this.bar = document.querySelector('.blog-category-bar');
    if (!this.bar) return;

    this.pills = this.bar.querySelectorAll('.blog-category-pill');
    this.cards = document.querySelectorAll('.blog-card');
    this.abortController = new AbortController();

    this.init();
  }

  init() {
    const signal = this.abortController.signal;

    this.pills.forEach(pill => {
      pill.addEventListener('click', () => this.filter(pill), { signal });
    });
  }

  filter(activePill) {
    const category = activePill.textContent.trim();

    // Update active state on pills
    this.pills.forEach(pill => {
      const isActive = pill === activePill;
      pill.classList.toggle('blog-category-pill--active', isActive);
      pill.setAttribute('aria-pressed', String(isActive));
    });

    // Show/hide cards
    this.cards.forEach(card => {
      const col = card.closest('.slds-col');
      if (!col) return;

      if (category === 'All') {
        col.style.display = '';
        card.style.opacity = '1';
        return;
      }

      const cardCategory = card.querySelector('.blog-card__category');
      const matches = cardCategory && cardCategory.textContent.trim() === category;
      col.style.display = matches ? '' : 'none';
    });
  }

  destroy() {
    this.abortController.abort();
  }
}
