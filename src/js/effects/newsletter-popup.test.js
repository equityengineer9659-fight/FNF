import { describe, it, expect, beforeEach, vi } from 'vitest';
import NewsletterPopup from './newsletter-popup.js';

describe('NewsletterPopup', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.body.className = '';
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('shouldShowPopup', () => {
    it('should return true on about page without prior subscription', () => {
      document.body.classList.add('fnf-page--about');
      const popup = new NewsletterPopup();
      expect(popup.shouldShowPopup()).toBe(true);
      popup.destroy();
    });

    it('should return false on non-about pages', () => {
      document.body.classList.add('fnf-page--index');
      const popup = new NewsletterPopup();
      expect(popup.shouldShowPopup()).toBe(false);
    });

    it('should return false if user already subscribed', () => {
      document.body.classList.add('fnf-page--about');
      localStorage.setItem('fnf-newsletter-subscribed', 'true');
      const popup = new NewsletterPopup();
      expect(popup.shouldShowPopup()).toBe(false);
    });
  });

  describe('scroll listener', () => {
    it('should attach scroll listener on about page', () => {
      document.body.classList.add('fnf-page--about');
      const addSpy = vi.spyOn(window, 'addEventListener');
      const popup = new NewsletterPopup();
      expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
      popup.destroy();
    });

    it('should not attach scroll listener on other pages', () => {
      document.body.classList.add('fnf-page--index');
      const addSpy = vi.spyOn(window, 'addEventListener');
      new NewsletterPopup();
      const scrollCalls = addSpy.mock.calls.filter(c => c[0] === 'scroll');
      expect(scrollCalls.length).toBe(0);
    });
  });

  describe('openModal', () => {
    it('should create modal DOM elements', () => {
      document.body.classList.add('fnf-page--about');
      const popup = new NewsletterPopup();
      popup.openModal();

      const modal = document.querySelector('.fnf-newsletter-modal');
      expect(modal).not.toBeNull();
      expect(modal.getAttribute('role')).toBe('dialog');
      expect(modal.getAttribute('aria-modal')).toBe('true');

      popup.destroy();
    });

    it('should not open a second modal', () => {
      document.body.classList.add('fnf-page--about');
      const popup = new NewsletterPopup();
      popup.openModal();
      popup.openModal();

      const modals = document.querySelectorAll('.fnf-newsletter-modal');
      expect(modals.length).toBe(1);

      popup.destroy();
    });

    it('should lock scroll when opened', () => {
      document.body.classList.add('fnf-page--about');
      const popup = new NewsletterPopup();
      popup.openModal();

      expect(document.body.style.overflow).toBe('hidden');
      expect(document.body.classList.contains('fnf-modal-open')).toBe(true);

      popup.destroy();
    });

    it('should inject keyframe styles', () => {
      document.body.classList.add('fnf-page--about');
      const popup = new NewsletterPopup();
      popup.openModal();

      const styles = document.querySelectorAll('style');
      const hasKeyframes = Array.from(styles).some(s => s.textContent.includes('fadeIn'));
      expect(hasKeyframes).toBe(true);

      popup.destroy();
    });
  });

  describe('closeModal', () => {
    it('should remove modal after animation', () => {
      vi.useFakeTimers();
      document.body.classList.add('fnf-page--about');
      const popup = new NewsletterPopup();
      popup.openModal();

      popup.closeModal();
      vi.advanceTimersByTime(300);

      const modal = document.querySelector('.fnf-newsletter-modal');
      expect(modal).toBeNull();

      vi.useRealTimers();
    });

    it('should unlock scroll', () => {
      document.body.classList.add('fnf-page--about');
      const popup = new NewsletterPopup();
      popup.openModal();
      popup.closeModal();

      expect(document.body.classList.contains('fnf-modal-open')).toBe(false);
    });

    it('should not throw if no modal is active', () => {
      const popup = new NewsletterPopup();
      expect(() => popup.closeModal()).not.toThrow();
    });
  });

  describe('form submission', () => {
    it('should set localStorage on valid submission', () => {
      vi.useFakeTimers();
      document.body.classList.add('fnf-page--about');
      const popup = new NewsletterPopup();
      popup.openModal();

      const input = document.querySelector('.fnf-email-input');
      const form = document.querySelector('.fnf-email-form');
      input.value = 'test@example.com';
      form.dispatchEvent(new Event('submit', { cancelable: true }));

      expect(localStorage.getItem('fnf-newsletter-subscribed')).toBe('true');

      vi.advanceTimersByTime(2000);
      vi.useRealTimers();
    });

    it('should show success state after submission', () => {
      vi.useFakeTimers();
      document.body.classList.add('fnf-page--about');
      const popup = new NewsletterPopup();
      popup.openModal();

      const input = document.querySelector('.fnf-email-input');
      const form = document.querySelector('.fnf-email-form');
      input.value = 'test@example.com';
      form.dispatchEvent(new Event('submit', { cancelable: true }));

      const successText = document.querySelector('.fnf-newsletter-content');
      expect(successText.textContent).toContain('Thank you');

      vi.advanceTimersByTime(2000);
      vi.useRealTimers();
    });

    it('should not submit with empty email', () => {
      document.body.classList.add('fnf-page--about');
      const popup = new NewsletterPopup();
      popup.openModal();

      const input = document.querySelector('.fnf-email-input');
      const form = document.querySelector('.fnf-email-form');
      input.value = '';
      form.dispatchEvent(new Event('submit', { cancelable: true }));

      expect(localStorage.getItem('fnf-newsletter-subscribed')).toBeNull();
      popup.destroy();
    });
  });

  describe('keyboard interaction', () => {
    it('should close on Escape key', () => {
      vi.useFakeTimers();
      document.body.classList.add('fnf-page--about');
      const popup = new NewsletterPopup();
      popup.openModal();

      const modal = document.querySelector('.fnf-newsletter-modal');
      modal.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      vi.advanceTimersByTime(300);
      expect(document.querySelector('.fnf-newsletter-modal')).toBeNull();
      vi.useRealTimers();
    });
  });

  describe('backdrop click', () => {
    it('should close when clicking backdrop', () => {
      vi.useFakeTimers();
      document.body.classList.add('fnf-page--about');
      const popup = new NewsletterPopup();
      popup.openModal();

      const modal = document.querySelector('.fnf-newsletter-modal');
      modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      vi.advanceTimersByTime(300);
      expect(document.querySelector('.fnf-newsletter-modal')).toBeNull();
      vi.useRealTimers();
    });
  });

  describe('trigger', () => {
    it('should open modal via trigger()', () => {
      document.body.classList.add('fnf-page--about');
      const popup = new NewsletterPopup();
      popup.trigger();

      expect(document.querySelector('.fnf-newsletter-modal')).not.toBeNull();
      popup.destroy();
    });

    it('should only trigger once', () => {
      document.body.classList.add('fnf-page--about');
      const popup = new NewsletterPopup();
      const openSpy = vi.spyOn(popup, 'openModal');
      popup.trigger();
      popup.trigger();

      expect(openSpy).toHaveBeenCalledTimes(1);
      popup.destroy();
    });
  });

  describe('reset', () => {
    it('should clear subscription and allow re-trigger', () => {
      document.body.classList.add('fnf-page--about');
      localStorage.setItem('fnf-newsletter-subscribed', 'true');

      const popup = new NewsletterPopup();
      popup.reset();

      expect(localStorage.getItem('fnf-newsletter-subscribed')).toBeNull();
      expect(popup.hasTriggered).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should remove scroll listener and close modal', () => {
      document.body.classList.add('fnf-page--about');
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const popup = new NewsletterPopup();
      popup.openModal();
      popup.destroy();

      expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    });
  });
});
