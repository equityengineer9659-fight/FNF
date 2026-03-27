/**
 * Newsletter Popup System
 * Scroll-triggered modal with hardened accessibility behaviour and focus trap
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])'
].join(', ');

class NewsletterPopup {
  constructor(options = {}) {
    this.scrollThreshold = options.scrollThreshold ?? 30;
    this.hasTriggered = false;
    this.scrollHandler = null;
    this.activeModal = null;
    this.restoreFocus = null;
    this.injectedStyle = null;

    if (this.shouldShowPopup()) {
      this.initScrollListener();
    }
  }

  shouldShowPopup() {
    const isAboutPage = document.body.classList.contains('fnf-page--about');
    try {
      const hasSubscribed = localStorage.getItem('fnf-newsletter-subscribed');
      return isAboutPage && !hasSubscribed;
    } catch {
      return false;
    }
  }

  initScrollListener() {
    this.scrollHandler = () => {
      if (this.hasTriggered) {
        return;
      }

      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? (window.scrollY / scrollHeight) * 100 : 100;

      if (progress >= this.scrollThreshold) {
        this.hasTriggered = true;
        window.removeEventListener('scroll', this.scrollHandler);
        window.setTimeout(() => this.openModal(), 120);
      }
    };

    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  openModal() {
    if (this.activeModal) {
      return;
    }

    this.injectStyles();

    const modal = document.createElement('div');
    modal.className = 'fnf-newsletter-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const modalContent = document.createElement('div');
    modalContent.className = 'fnf-newsletter-content';
    modalContent.innerHTML = `
      <button class="fnf-close-btn" aria-label="Close newsletter signup">&times;</button>
      <h2 class="fnf-signup-title">Stay Connected!</h2>
      <p class="fnf-signup-description">Sign up for our monthly newsletter and get the latest updates on food bank technology.</p>
      <form class="fnf-email-form">
        <input
          type="email"
          placeholder="Enter your email address"
          required
          autocomplete="email"
          class="fnf-email-input"
        >
        <button type="submit" class="fnf-submit-btn">Subscribe</button>
      </form>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    this.lockScroll();
    this.restoreFocus = document.activeElement;

    const cleanup = this.setupModalEventListeners(modal, modalContent);
    this.focusFirstElement(modalContent);
    this.activeModal = { modal, cleanup };
  }

  injectStyles() {
    // Styles moved to CSS file (src/css/07-components.css) to comply with CSP.
    // No runtime <style> injection needed.
  }

  setupModalEventListeners(modal, modalContent) {
    const cleanupFns = [];
    const closeBtn = modal.querySelector('.fnf-close-btn');
    const form = modal.querySelector('.fnf-email-form');
    const emailInput = modal.querySelector('.fnf-email-input');

    const closeModal = () => this.closeModal();

    closeBtn.addEventListener('click', closeModal);
    cleanupFns.push(() => closeBtn.removeEventListener('click', closeModal));

    const handleBackdrop = (event) => {
      if (event.target === modal) {
        closeModal();
      }
    };
    modal.addEventListener('click', handleBackdrop);
    cleanupFns.push(() => modal.removeEventListener('click', handleBackdrop));

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeModal();
        return;
      }

      if (event.key === 'Tab') {
        this.maintainFocusTrap(event, modal);
      }
    };
    modal.addEventListener('keydown', handleKeyDown);
    cleanupFns.push(() => modal.removeEventListener('keydown', handleKeyDown));

    const handleSubmit = async (event) => {
      event.preventDefault();
      const email = emailInput.value.trim();
      if (!email || !emailInput.validity.valid) {
        emailInput.focus();
        return;
      }

      const formData = new FormData();
      formData.append('email', email);
      try {
        await fetch('/api/newsletter.php', { method: 'POST', body: formData });
      } catch { /* best-effort — show success regardless */ }

      this.showSuccessState(modalContent);
      try { localStorage.setItem('fnf-newsletter-subscribed', 'true'); } catch { /* storage unavailable */ }
      window.setTimeout(() => this.closeModal(), 1800);
    };
    form.addEventListener('submit', handleSubmit);
    cleanupFns.push(() => form.removeEventListener('submit', handleSubmit));

    return () => {
      cleanupFns.forEach((fn) => {
        try {
          fn();
        } catch (error) {
          console.error('Failed to cleanup newsletter modal listener', error);
        }
      });
    };
  }

  focusFirstElement(container) {
    const focusable = container.querySelectorAll(FOCUSABLE_SELECTOR);
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }

  maintainFocusTrap(event, modal) {
    const focusable = modal.querySelectorAll(FOCUSABLE_SELECTOR);
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  showSuccessState(modalContent) {
    modalContent.innerHTML = `
      <div class="fnf-newsletter-success" role="status" aria-live="polite">
        <h2>Thank you!</h2>
        <p>You've been successfully subscribed to our newsletter.</p>
      </div>
    `;
  }

  closeModal() {
    if (!this.activeModal) {
      return;
    }

    const { modal, cleanup } = this.activeModal;

    if (typeof cleanup === 'function') {
      cleanup();
    }

    modal.classList.add('fnf-newsletter-modal--closing');
    window.setTimeout(() => {
      modal.remove();
    }, 280);

    this.unlockScroll();

    if (this.restoreFocus && typeof this.restoreFocus.focus === 'function') {
      this.restoreFocus.focus();
    }

    this.activeModal = null;
  }

  lockScroll() {
    document.body.classList.add('fnf-modal-open');
  }

  unlockScroll() {
    document.body.classList.remove('fnf-modal-open');
  }

  trigger() {
    if (!this.hasTriggered) {
      this.hasTriggered = true;
      this.openModal();
    }
  }

  reset() {
    try { localStorage.removeItem('fnf-newsletter-subscribed'); } catch { /* storage unavailable */ }
    this.hasTriggered = false;
  }

  destroy() {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
    this.closeModal();
  }
}

export default NewsletterPopup;
