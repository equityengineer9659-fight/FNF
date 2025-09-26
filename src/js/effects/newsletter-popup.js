/**
 * Newsletter Popup System
 * Triggers a newsletter signup modal after 30% scroll
 */

class NewsletterPopup {
  constructor() {
    console.log('🎯 NEWSLETTER-POPUP: Constructor called');
    this.hasTriggered = false;
    this.scrollThreshold = 30; // 30% scroll trigger
    this.init();
  }

  init() {
    console.log('Newsletter popup initializing...');

    // Only run on pages where we want the popup
    if (this.shouldShowPopup()) {
      console.log('Newsletter popup conditions met - starting scroll listener');
      this.initScrollListener();
    } else {
      console.log('Newsletter popup conditions not met:', {
        isAboutPage: document.body.classList.contains('fnf-page--about'),
        hasSubscribed: !!localStorage.getItem('fnf-newsletter-subscribed'),
        hasDismissed: !!localStorage.getItem('fnf-newsletter-dismissed')
      });
    }
  }

  shouldShowPopup() {
    // Only show on about page and if user hasn't already subscribed or dismissed
    const isAboutPage = document.body.classList.contains('fnf-page--about');
    const hasSubscribed = localStorage.getItem('fnf-newsletter-subscribed');
    const hasDismissed = localStorage.getItem('fnf-newsletter-dismissed');

    return isAboutPage && !hasSubscribed && !hasDismissed;
  }

  initScrollListener() {
    console.log('Newsletter popup scroll listener initialized');

    const checkScroll = () => {
      if (this.hasTriggered) return;

      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPosition = window.scrollY;
      const scrollPercentage = (scrollPosition / scrollHeight) * 100;

      // Log scroll progress occasionally (every 10%)
      if (scrollPercentage % 10 < 1) {
        console.log(`Scroll progress: ${scrollPercentage.toFixed(1)}% (threshold: ${this.scrollThreshold}%)`);
      }

      if (scrollPercentage >= this.scrollThreshold) {
        console.log('Newsletter popup triggered at', scrollPercentage.toFixed(1), '% scroll');
        this.hasTriggered = true;
        setTimeout(() => {
          this.createSignupModal();
        }, 100);
        window.removeEventListener('scroll', checkScroll);
      }
    };

    window.addEventListener('scroll', checkScroll);
  }

  createSignupModal() {
    // Prevent multiple modals
    if (document.querySelector('.fnf-newsletter-modal')) {
      return;
    }

    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'fnf-newsletter-modal';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      animation: fadeIn 0.3s ease-out;
    `;

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'fnf-newsletter-content';
    modalContent.style.cssText = `
      background: #2d3748;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      position: relative;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
      animation: slideIn 0.3s ease-out;
    `;

    modalContent.innerHTML = `
      <button class="fnf-close-btn" style="
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: rgba(255, 255, 255, 0.7);
        padding: 0.5rem;
        line-height: 1;
      ">&times;</button>
      <h2 class="fnf-signup-title" style="
        color: #0176d3;
        margin-bottom: 1rem;
        font-size: 1.875rem;
        text-align: center;
      ">Stay Connected!</h2>
      <p class="fnf-signup-description" style="
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 2rem;
        text-align: center;
        line-height: 1.6;
      ">Sign up for our monthly newsletter and get the latest updates on food bank technology.</p>
      <form class="fnf-email-form" style="
        display: flex;
        gap: 1rem;
        flex-direction: column;
      ">
        <input
          type="email"
          placeholder="Enter your email address"
          required
          class="fnf-email-input"
          style="
            padding: 0.75rem;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            font-size: 1rem;
            outline: none;
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
          "
        >
        <button
          type="submit"
          class="fnf-submit-btn"
          style="
            background: #0176d3;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.3s ease;
          "
        >Subscribe</button>
      </form>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes slideIn {
        from { transform: translateY(-50px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .fnf-close-btn:hover {
        color: #00d4ff !important;
      }
      .fnf-submit-btn:hover {
        background: #015395 !important;
      }
      .fnf-email-input:focus {
        border-color: #0176d3 !important;
        box-shadow: 0 0 0 3px rgba(1, 118, 211, 0.3) !important;
      }
      .fnf-email-input::placeholder {
        color: rgba(255, 255, 255, 0.5) !important;
      }
    `;
    document.head.appendChild(style);

    // Setup event listeners
    this.setupModalEventListeners(modal, modalContent);
  }

  setupModalEventListeners(modal, modalContent) {
    const closeBtn = modal.querySelector('.fnf-close-btn');
    const form = modal.querySelector('.fnf-email-form');
    const emailInput = modal.querySelector('.fnf-email-input');
    const submitBtn = modal.querySelector('.fnf-submit-btn');

    // Close modal function
    const closeModal = () => {
      // Prevent multiple close attempts
      if (modal.classList.contains('closing')) return;
      modal.classList.add('closing');

      // Mark as dismissed (user closed without subscribing)
      localStorage.setItem('fnf-newsletter-dismissed', 'true');

      // Apply fade out animation
      modal.style.opacity = '0';
      modal.style.transition = 'opacity 0.3s ease-out';
      modalContent.style.transform = 'translateY(-50px)';
      modalContent.style.transition = 'transform 0.3s ease-out';

      setTimeout(() => {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal);
        }
      }, 300);
    };

    // Close button
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeModal();
    });

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
      }
    });

    // Escape key to close
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        document.removeEventListener('keydown', handleEscape);
        closeModal();
      }
    };
    document.addEventListener('keydown', handleEscape);

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();
      if (!email) return;

      // Update button state
      submitBtn.textContent = 'Subscribing...';
      submitBtn.disabled = true;

      // Simulate subscription process
      setTimeout(() => {
        modalContent.innerHTML = `
          <div style="text-align: center; padding: 2rem;">
            <h2 style="color: #0176d3; margin-bottom: 1rem; font-size: 1.875rem;">Thank You!</h2>
            <p style="color: rgba(255, 255, 255, 0.9); font-size: 1.125rem;">You've been successfully subscribed to our newsletter.</p>
          </div>
        `;

        // Mark as subscribed
        localStorage.setItem('fnf-newsletter-subscribed', 'true');

        // Close modal after 2 seconds
        setTimeout(closeModal, 2000);
      }, 1500);
    });

    // Focus email input
    setTimeout(() => emailInput.focus(), 100);
  }

  // Public API for manual trigger (debugging)
  trigger() {
    if (!this.hasTriggered) {
      this.hasTriggered = true;
      this.createSignupModal();
    }
  }

  // Reset subscription status (for testing)
  reset() {
    localStorage.removeItem('fnf-newsletter-subscribed');
    localStorage.removeItem('fnf-newsletter-dismissed');
    this.hasTriggered = false;
    console.log('Newsletter popup reset - cleared localStorage flags');
  }

  // Debug method to check status
  status() {
    const isAboutPage = document.body.classList.contains('fnf-page--about');
    const hasSubscribed = localStorage.getItem('fnf-newsletter-subscribed');
    const hasDismissed = localStorage.getItem('fnf-newsletter-dismissed');

    console.log('Newsletter Popup Status:');
    console.log('- Is About Page:', isAboutPage);
    console.log('- Has Subscribed:', hasSubscribed);
    console.log('- Has Dismissed:', hasDismissed);
    console.log('- Has Triggered:', this.hasTriggered);
    console.log('- Should Show:', this.shouldShowPopup());

    return {
      isAboutPage,
      hasSubscribed: !!hasSubscribed,
      hasDismissed: !!hasDismissed,
      hasTriggered: this.hasTriggered,
      shouldShow: this.shouldShowPopup()
    };
  }
}

// Remove auto-initialization to prevent double instantiation
// The popup is initialized by main.js

// Expose for debugging (will be set by main.js)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Debug access will be available via window.fnfApp.newsletterPopup
  console.log('📧 NEWSLETTER-POPUP: Development mode - adding fallback initialization');

  // Fallback initialization if main.js fails
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (!window.fnfApp || !window.fnfApp.newsletterPopup) {
        console.log('📧 FALLBACK: Main app not initialized, creating newsletter popup directly');
        window.fnfNewsletterPopup = new NewsletterPopup();
      } else {
        console.log('📧 FALLBACK: Main app already initialized newsletter popup');
      }
    }, 2000);
  });
}

export default NewsletterPopup;