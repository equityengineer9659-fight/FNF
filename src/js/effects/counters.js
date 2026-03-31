/**
 * Animated Counter System
 * Handles animated counting up of stat numbers when they come into view
 */

class CounterAnimator {
  constructor() {
    this.counters = [];
    this.observer = null;
    this.activeAnimations = new Map();
    this.init();
  }

  init() {
    this.setupIntersectionObserver();
    this.findCounters();
  }

  setupIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateCounter(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.5,
      rootMargin: '0px 0px -50px 0px'
    });
  }

  findCounters() {
    // Find both .fnf-stat-number and .stat-number elements with data-target
    const counterElements = document.querySelectorAll('.fnf-stat-number[data-target], .stat-number[data-target]');
    counterElements.forEach(counter => {
      this.observer.observe(counter);
    });
  }

  animateCounter(element) {
    const target = parseInt(element.dataset.target, 10);
    if (isNaN(target)) return;
    const format = element.dataset.format || '';
    const suffix = element.dataset.suffix || '';
    const duration = 2000; // 2 seconds
    const start = performance.now();

    const formatNumber = (value) => {
      switch (format) {
      case 'percentage':
        return value + '%';
      case 'plus':
        return value + '+';
      case 'million':
        return value + 'M+';
      case 'thousand':
        return value + 'K+';
      default:
        return value + suffix;
      }
    };

    // Suppress intermediate announcements; announce final value once
    element.setAttribute('aria-live', 'off');

    const updateCounter = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(target * easeOut);

      element.textContent = formatNumber(current);

      if (progress < 1) {
        this.activeAnimations.set(element, requestAnimationFrame(updateCounter));
      } else {
        element.textContent = formatNumber(target);
        element.setAttribute('role', 'status');
        element.setAttribute('aria-live', 'polite');
        this.activeAnimations.delete(element);
      }
    };

    this.activeAnimations.set(element, requestAnimationFrame(updateCounter));
  }

  // Public method to manually trigger counter animation
  triggerCounter(element) {
    if (element && element.dataset.target) {
      this.animateCounter(element);
    }
  }

  // Clean up observers
  destroy() {
    for (const [, id] of this.activeAnimations) {
      cancelAnimationFrame(id);
    }
    this.activeAnimations.clear();
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Initialize counter system
let counterAnimator;

function initCounters() {
  if (typeof IntersectionObserver !== 'undefined') {
    counterAnimator = new CounterAnimator();
    return counterAnimator;
  } else {
    // Fallback for browsers without IntersectionObserver
    console.warn('IntersectionObserver not supported, counters will not animate');
    return null;
  }
}

// Note: Auto-initialization removed - handled by main.js to prevent conflicts

export { CounterAnimator, initCounters };