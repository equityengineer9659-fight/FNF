import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CounterAnimator, initCounters } from './counters.js';

describe('Counter System', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  describe('initCounters', () => {
    it('should return a CounterAnimator instance when IntersectionObserver is available', () => {
      const result = initCounters();
      expect(result).toBeInstanceOf(CounterAnimator);
    });

    it('should return null when IntersectionObserver is not available', () => {
      const original = global.IntersectionObserver;
      delete global.IntersectionObserver;

      const result = initCounters();
      expect(result).toBeNull();

      global.IntersectionObserver = original;
    });
  });

  describe('CounterAnimator', () => {
    it('should create an instance with an observer', () => {
      const animator = new CounterAnimator();
      expect(animator.observer).toBeTruthy();
    });

    it('should find counter elements with data-target attribute', () => {
      document.body.innerHTML = `
        <span class="stat-number" data-target="50">0</span>
        <span class="fnf-stat-number" data-target="100">0</span>
        <span class="other-class" data-target="200">0</span>
      `;

      const observeSpy = vi.fn();
      global.IntersectionObserver = class {
        constructor() {}
        observe = observeSpy;
        disconnect() {}
        unobserve() {}
        takeRecords() { return []; }
      };

      const animator = new CounterAnimator();
      // Should observe 2 elements (stat-number and fnf-stat-number, not other-class)
      expect(observeSpy).toHaveBeenCalledTimes(2);
    });

    it('should format numbers with percentage suffix', () => {
      document.body.innerHTML = `
        <span class="stat-number" data-target="35" data-format="percentage">0</span>
      `;

      const animator = new CounterAnimator();
      const el = document.querySelector('.stat-number');

      // Mock requestAnimationFrame to execute immediately with a time far past duration
      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
        cb(performance.now() + 3000);
      });

      animator.animateCounter(el);
      expect(el.textContent).toBe('35%');
    });

    it('should format numbers with plus suffix', () => {
      document.body.innerHTML = `
        <span class="stat-number" data-target="15" data-format="plus">0</span>
      `;

      const animator = new CounterAnimator();
      const el = document.querySelector('.stat-number');

      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
        cb(performance.now() + 3000);
      });

      animator.animateCounter(el);
      expect(el.textContent).toBe('15+');
    });

    it('should format numbers with thousand suffix', () => {
      document.body.innerHTML = `
        <span class="stat-number" data-target="50" data-format="thousand">0</span>
      `;

      const animator = new CounterAnimator();
      const el = document.querySelector('.stat-number');

      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
        cb(performance.now() + 3000);
      });

      animator.animateCounter(el);
      expect(el.textContent).toBe('50K+');
    });

    it('should format numbers with million suffix', () => {
      document.body.innerHTML = `
        <span class="stat-number" data-target="2" data-format="million">0</span>
      `;

      const animator = new CounterAnimator();
      const el = document.querySelector('.stat-number');

      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
        cb(performance.now() + 3000);
      });

      animator.animateCounter(el);
      expect(el.textContent).toBe('2M+');
    });

    it('should use custom suffix when no format is specified', () => {
      document.body.innerHTML = `
        <span class="stat-number" data-target="100" data-suffix="!">0</span>
      `;

      const animator = new CounterAnimator();
      const el = document.querySelector('.stat-number');

      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
        cb(performance.now() + 3000);
      });

      animator.animateCounter(el);
      expect(el.textContent).toBe('100!');
    });

    it('should animate from 0 to target value', () => {
      document.body.innerHTML = `
        <span class="stat-number" data-target="100">0</span>
      `;

      const animator = new CounterAnimator();
      const el = document.querySelector('.stat-number');
      let callCount = 0;

      vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
        callCount++;
        if (callCount === 1) {
          // First frame — mid-animation
          cb(performance.now() + 1000);
        }
        // Don't call cb again to stop recursion
      });

      animator.animateCounter(el);
      const midValue = parseInt(el.textContent);
      expect(midValue).toBeGreaterThan(0);
      expect(midValue).toBeLessThanOrEqual(100);
    });

    it('should trigger counter manually via triggerCounter', () => {
      document.body.innerHTML = `
        <span class="stat-number" data-target="42">0</span>
      `;

      const animator = new CounterAnimator();
      const el = document.querySelector('.stat-number');
      const spy = vi.spyOn(animator, 'animateCounter');

      animator.triggerCounter(el);
      expect(spy).toHaveBeenCalledWith(el);
    });

    it('should not trigger counter for element without data-target', () => {
      document.body.innerHTML = `<span class="stat-number">0</span>`;

      const animator = new CounterAnimator();
      const el = document.querySelector('.stat-number');
      const spy = vi.spyOn(animator, 'animateCounter');

      animator.triggerCounter(el);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should disconnect observer on destroy', () => {
      const disconnectSpy = vi.fn();
      global.IntersectionObserver = class {
        constructor() {}
        observe() {}
        disconnect = disconnectSpy;
        unobserve() {}
        takeRecords() { return []; }
      };

      const animator = new CounterAnimator();
      animator.destroy();
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });
});
