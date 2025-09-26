/**
 * Scroll-triggered Animations System
 * Clean, performant animations without conflicts
 */

class AnimationController {
  constructor(options = {}) {
    this.config = {
      threshold: options.threshold || 0.1,
      rootMargin: options.rootMargin || '0px 0px -50px 0px',
      once: options.once !== false, // Default to true
      ...options
    };

    this.observer = null;
    this.elements = new Set();
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    // Skip animations if reduced motion is preferred
    if (this.isReducedMotion) {
      this.showAllElements();
      return;
    }

    // Check for Intersection Observer support
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported, showing all elements');
      this.showAllElements();
      return;
    }

    this.setupObserver();
    this.findAnimationElements();
  }

  setupObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElement(entry.target);

          if (this.config.once) {
            this.observer.unobserve(entry.target);
            this.elements.delete(entry.target);
          }
        } else if (!this.config.once) {
          this.resetElement(entry.target);
        }
      });
    }, {
      threshold: this.config.threshold,
      rootMargin: this.config.rootMargin
    });
  }

  findAnimationElements() {
    const selectors = [
      '.fnf-fade-in',
      '.fnf-slide-in-left',
      '.fnf-slide-in-right',
      '.fnf-slide-in-up',
      '.fnf-slide-in-down',
      '.fnf-scale-in',
      '.fnf-rotate-in'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        this.addElement(element);
      });
    });
  }

  addElement(element) {
    if (this.isReducedMotion) {
      element.classList.add('fnf-visible');
      return;
    }

    this.elements.add(element);
    if (this.observer) {
      this.observer.observe(element);
    }
  }

  removeElement(element) {
    this.elements.delete(element);
    if (this.observer) {
      this.observer.unobserve(element);
    }
  }

  animateElement(element) {
    // Add visible class to trigger CSS animation
    element.classList.add('fnf-visible');

    // Add specific animation classes based on element type
    if (element.classList.contains('fnf-fade-in')) {
      element.style.animationName = 'fadeIn';
    } else if (element.classList.contains('fnf-slide-in-left')) {
      element.style.animationName = 'slideInLeft';
    } else if (element.classList.contains('fnf-slide-in-right')) {
      element.style.animationName = 'slideInRight';
    } else if (element.classList.contains('fnf-slide-in-up')) {
      element.style.animationName = 'slideInUp';
    } else if (element.classList.contains('fnf-slide-in-down')) {
      element.style.animationName = 'slideInDown';
    } else if (element.classList.contains('fnf-scale-in')) {
      element.style.animationName = 'scaleIn';
    } else if (element.classList.contains('fnf-rotate-in')) {
      element.style.animationName = 'rotateIn';
    }

    // Fire custom event for other scripts to listen to
    element.dispatchEvent(new CustomEvent('fnf:animated', {
      bubbles: true,
      detail: { element, animationType: this.getAnimationType(element) }
    }));
  }

  resetElement(element) {
    element.classList.remove('fnf-visible');
    element.style.animationName = '';
  }

  getAnimationType(element) {
    if (element.classList.contains('fnf-fade-in')) return 'fade-in';
    if (element.classList.contains('fnf-slide-in-left')) return 'slide-in-left';
    if (element.classList.contains('fnf-slide-in-right')) return 'slide-in-right';
    if (element.classList.contains('fnf-slide-in-up')) return 'slide-in-up';
    if (element.classList.contains('fnf-slide-in-down')) return 'slide-in-down';
    if (element.classList.contains('fnf-scale-in')) return 'scale-in';
    if (element.classList.contains('fnf-rotate-in')) return 'rotate-in';
    return 'unknown';
  }

  showAllElements() {
    // Fallback: show all elements immediately
    const selectors = [
      '.fnf-fade-in',
      '.fnf-slide-in-left',
      '.fnf-slide-in-right',
      '.fnf-slide-in-up',
      '.fnf-slide-in-down',
      '.fnf-scale-in',
      '.fnf-rotate-in'
    ];

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(element => {
        element.classList.add('fnf-visible');
        element.style.opacity = '1';
        element.style.transform = 'none';
      });
    });
  }

  // Public API methods
  refresh() {
    this.findAnimationElements();
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.elements.clear();
  }

  pause() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  resume() {
    if (this.observer && !this.isReducedMotion) {
      this.elements.forEach(element => {
        this.observer.observe(element);
      });
    }
  }
}

/**
 * Counter Animation for Statistics
 */
class CounterAnimation {
  constructor(element, options = {}) {
    this.element = element;
    this.config = {
      start: options.start || 0,
      end: options.end || parseInt(element.getAttribute('data-target'), 10) || 100,
      duration: options.duration || 2000,
      format: options.format || element.getAttribute('data-format') || 'number',
      separator: options.separator || ',',
      decimal: options.decimal || '.',
      ...options
    };

    this.current = this.config.start;
    this.increment = (this.config.end - this.config.start) / (this.config.duration / 16);
    this.isAnimating = false;
  }

  start() {
    if (this.isAnimating) return;

    this.isAnimating = true;
    this.current = this.config.start;
    this.animate();
  }

  animate() {
    this.current += this.increment;

    if (this.current >= this.config.end) {
      this.current = this.config.end;
      this.isAnimating = false;
    }

    this.updateDisplay();

    if (this.isAnimating) {
      requestAnimationFrame(() => this.animate());
    }
  }

  updateDisplay() {
    const value = Math.floor(this.current);
    let formattedValue = '';

    switch (this.config.format) {
    case 'percentage':
      formattedValue = `${value}%`;
      break;
    case 'plus':
      formattedValue = `${this.formatNumber(value)}+`;
      break;
    case 'million':
      formattedValue = `${this.formatNumber(value)}M+`;
      break;
    case 'thousand':
      formattedValue = `${this.formatNumber(value)}K+`;
      break;
    default:
      formattedValue = this.formatNumber(value);
    }

    this.element.textContent = formattedValue;
  }

  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, this.config.separator);
  }
}

/**
 * Initialize counters when they become visible
 */
function initCounters() {
  const counters = document.querySelectorAll('[data-target]');
  const counterMap = new Map();

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;

        if (!counterMap.has(element)) {
          const counter = new CounterAnimation(element);
          counterMap.set(element, counter);
          counter.start();
        }

        counterObserver.unobserve(element);
      }
    });
  }, {
    threshold: 0.5,
    rootMargin: '0px'
  });

  counters.forEach(counter => {
    counterObserver.observe(counter);
  });

  return counterMap;
}

// Export for use in other modules
export { AnimationController, CounterAnimation, initCounters };

// Auto-initialize animations
export function initAnimations() {
  const controller = new AnimationController();
  const counters = initCounters();

  // Return controller for external access if needed
  return { controller, counters };
}

export default AnimationController;