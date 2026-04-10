import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SmartScroll from './smart-scroll.js';

describe('SmartScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    // Mock window.scrollTo
    window.scrollTo = vi.fn();
    // Reset scroll position
    Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  function createNavDOM() {
    document.body.innerHTML = `
      <nav class="fnf-nav">
        <a href="#section1" class="fnf-nav__link">Section 1</a>
        <a href="#section2" class="fnf-nav__link">Section 2</a>
        <a href="/about.html" class="fnf-nav__link">About</a>
        <input type="checkbox" id="nav-toggle">
      </nav>
      <section id="section1" style="height: 500px;">Section 1</section>
      <section id="section2" style="height: 500px;">Section 2</section>
    `;
  }

  describe('constructor', () => {
    it('should create with default options', () => {
      createNavDOM();
      const scroll = new SmartScroll();

      expect(scroll.config.hideOnScroll).toBe(true);
      expect(scroll.config.scrollThreshold).toBe(100);
      expect(scroll.config.offset).toBe(80);
    });

    it('should accept custom options', () => {
      createNavDOM();
      const scroll = new SmartScroll({
        hideOnScroll: false,
        scrollThreshold: 200,
        offset: 100
      });

      expect(scroll.config.hideOnScroll).toBe(false);
      expect(scroll.config.scrollThreshold).toBe(200);
      expect(scroll.config.offset).toBe(100);
    });
  });

  describe('findElements', () => {
    it('should find nav element, links, and sections', () => {
      createNavDOM();
      const scroll = new SmartScroll();

      expect(scroll.navElement).toBeTruthy();
      expect(scroll.navLinks.length).toBe(3);
      expect(scroll.sections.length).toBe(2);
    });

    it('should handle missing nav gracefully', () => {
      document.body.innerHTML = '<div>No nav here</div>';
      const scroll = new SmartScroll();

      expect(scroll.navElement).toBeNull();
      expect(scroll.navLinks.length).toBe(0);
    });
  });

  describe('handleNavAutoHide', () => {
    it('should hide nav when scrolling down past threshold', () => {
      createNavDOM();
      const scroll = new SmartScroll();
      scroll.lastScrollTop = 100;

      scroll.handleNavAutoHide(200);

      expect(scroll.navElement.classList.contains('fnf-nav--hidden')).toBe(true);
    });

    it('should show nav when scrolling up', () => {
      createNavDOM();
      const scroll = new SmartScroll();
      scroll.lastScrollTop = 200;
      scroll.navElement.classList.add('fnf-nav--hidden');

      scroll.handleNavAutoHide(150);

      expect(scroll.navElement.classList.contains('fnf-nav--hidden')).toBe(false);
    });

    it('should always show nav at top of page', () => {
      createNavDOM();
      const scroll = new SmartScroll();
      scroll.navElement.classList.add('fnf-nav--hidden');

      scroll.handleNavAutoHide(50);

      expect(scroll.navElement.classList.contains('fnf-nav--hidden')).toBe(false);
    });

    it('should ignore very small scroll deltas', () => {
      createNavDOM();
      const scroll = new SmartScroll();
      scroll.lastScrollTop = 200;

      scroll.handleNavAutoHide(203); // delta of 3, below threshold of 5

      // Should not have changed (no class added)
      expect(scroll.navElement.classList.contains('fnf-nav--hidden')).toBe(false);
    });

    it('should not throw if navElement is null', () => {
      document.body.innerHTML = '<div>No nav</div>';
      const scroll = new SmartScroll();

      expect(() => scroll.handleNavAutoHide(200)).not.toThrow();
    });
  });

  describe('updateActiveNavLink', () => {
    it('should set active class on matching nav link', () => {
      createNavDOM();
      const scroll = new SmartScroll();
      const section = document.getElementById('section1');

      scroll.updateActiveNavLink(section);

      const activeLink = document.querySelector('.fnf-nav__link--active');
      expect(activeLink).toBeTruthy();
      expect(activeLink.getAttribute('href')).toBe('#section1');
      expect(activeLink.getAttribute('aria-current')).toBe('page');
    });

    it('should set aria-current on the active link', () => {
      createNavDOM();
      const scroll = new SmartScroll();

      scroll.updateActiveNavLink(document.getElementById('section2'));

      const link = document.querySelector('a[href="#section2"]');
      expect(link.getAttribute('aria-current')).toBe('page');
      expect(link.classList.contains('fnf-nav__link--active')).toBe(true);
    });
  });

  describe('showNavigation / hideNavigation', () => {
    it('should show navigation by removing hidden class', () => {
      createNavDOM();
      const scroll = new SmartScroll();
      scroll.navElement.classList.add('fnf-nav--hidden');

      scroll.showNavigation();

      expect(scroll.navElement.classList.contains('fnf-nav--hidden')).toBe(false);
    });

    it('should hide navigation by adding hidden class', () => {
      createNavDOM();
      const scroll = new SmartScroll();

      scroll.hideNavigation();

      expect(scroll.navElement.classList.contains('fnf-nav--hidden')).toBe(true);
    });
  });

  describe('createScrollToTopButton', () => {
    it('should create a scroll-to-top button in the DOM', () => {
      createNavDOM();
      new SmartScroll();  

      const button = document.querySelector('.fnf-scroll-to-top');
      expect(button).toBeTruthy();
      expect(button.getAttribute('aria-label')).toBe('Scroll to top');
    });
  });

  describe('updateScrollToTopButton', () => {
    it('should show button when scrolled past threshold', () => {
      createNavDOM();
      const scroll = new SmartScroll({ scrollThreshold: 100 });

      scroll.updateScrollToTopButton(300);

      expect(scroll.scrollToTopButton.classList.contains('fnf-scroll-to-top--visible')).toBe(true);
    });

    it('should hide button near top of page', () => {
      createNavDOM();
      const scroll = new SmartScroll({ scrollThreshold: 100 });

      scroll.updateScrollToTopButton(50);

      expect(scroll.scrollToTopButton.classList.contains('fnf-scroll-to-top--visible')).toBe(false);
    });
  });

  describe('createScrollProgressBar', () => {
    it('should create progress bar elements in the DOM', () => {
      createNavDOM();
      new SmartScroll();  

      expect(document.querySelector('.scroll-progress-container')).toBeTruthy();
      expect(document.querySelector('.scroll-progress-bar')).toBeTruthy();
    });
  });

  describe('scrollToSection', () => {
    it('should scroll to an existing section', () => {
      createNavDOM();
      const scroll = new SmartScroll();
      vi.spyOn(scroll, 'smoothScrollTo');

      scroll.scrollToSection('section1');

      expect(scroll.smoothScrollTo).toHaveBeenCalled();
    });

    it('should do nothing for non-existent section', () => {
      createNavDOM();
      const scroll = new SmartScroll();
      vi.spyOn(scroll, 'smoothScrollTo');

      scroll.scrollToSection('nonexistent');

      expect(scroll.smoothScrollTo).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should remove scroll-to-top button and progress bar from DOM', () => {
      createNavDOM();
      const scroll = new SmartScroll();

      expect(document.querySelector('.fnf-scroll-to-top')).toBeTruthy();
      expect(document.querySelector('.scroll-progress-container')).toBeTruthy();

      scroll.destroy();

      expect(document.querySelector('.fnf-scroll-to-top')).toBeNull();
      expect(document.querySelector('.scroll-progress-container')).toBeNull();
    });
  });
});
