/**
 * @fileoverview Article page visual enhancements
 * @description Scroll-reveal animations for article subpages using Intersection Observer
 */

export default class ArticleEnhancements {
  constructor() {
    this.observer = null;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!document.body.classList.contains('fnf-page--article')) return;
    if (this.prefersReducedMotion) {
      this.revealAll();
      return;
    }

    this.init();
  }

  init() {
    // Mark elements for reveal
    const selectors = [
      '.article-prose h2',
      '.article-prose p',
      '.article-pullquote',
      '.article-cta'
    ];

    const elements = document.querySelectorAll(selectors.join(','));
    elements.forEach(el => el.classList.add('article-reveal'));

    // Observe with staggered thresholds
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('article-reveal--visible');
            this.observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach(el => this.observer.observe(el));
  }

  revealAll() {
    document.querySelectorAll('.article-reveal').forEach(el => {
      el.classList.add('article-reveal--visible');
    });
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}
