/**
 * Newsletter Popup Initialization - Non-module version
 * This ensures the newsletter popup works even if main.js fails to load
 */

console.log('📧 NEWSLETTER-INIT: Starting direct initialization...');

// ONE-TIME CLEANUP: Remove test localStorage data for clean deployment
// This ensures the popup works for new users after our testing
if (localStorage.getItem('fnf-newsletter-dismissed') === 'true' && !localStorage.getItem('fnf-newsletter-user-action')) {
  console.log('📧 CLEANUP: Removing test localStorage data for clean deployment');
  localStorage.removeItem('fnf-newsletter-dismissed');
  localStorage.removeItem('fnf-newsletter-subscribed');
}

// Check if we're on the about page
const isAboutPage = document.body.classList.contains('fnf-page--about');
console.log('📧 NEWSLETTER-INIT: Is about page?', isAboutPage);

if (!isAboutPage) {
  console.log('📧 NEWSLETTER-INIT: Not on about page, exiting');
} else {

  // Newsletter Popup Class - Inline version
  class DirectNewsletterPopup {
    constructor() {
      console.log('📧 DIRECT-POPUP: Constructor called');
      this.hasTriggered = false;
      this.scrollThreshold = 30; // 30% scroll trigger
      this.init();
    }

    init() {
      console.log('📧 DIRECT-POPUP: Initializing...');

      // Check conditions
      const hasSubscribed = localStorage.getItem('fnf-newsletter-subscribed');
      const hasDismissed = localStorage.getItem('fnf-newsletter-dismissed');

      console.log('📧 DIRECT-POPUP: Conditions check:', {
        isAboutPage: true,
        hasSubscribed: !!hasSubscribed,
        hasDismissed: !!hasDismissed
      });

      if (!hasSubscribed && !hasDismissed) {
        console.log('📧 DIRECT-POPUP: Conditions met - starting scroll listener');
        this.initScrollListener();
      } else {
        console.log('📧 DIRECT-POPUP: Conditions not met - popup blocked');
      }
    }

    initScrollListener() {
      console.log('📧 DIRECT-POPUP: Scroll listener initialized');

      const checkScroll = () => {
        if (this.hasTriggered) return;

        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPosition = window.scrollY;
        const scrollPercentage = (scrollPosition / scrollHeight) * 100;

        // Log scroll progress occasionally (every 10%)
        if (scrollPercentage % 10 < 1) {
          console.log(`📧 DIRECT-POPUP: Scroll progress: ${scrollPercentage.toFixed(1)}% (threshold: ${this.scrollThreshold}%)`);
        }

        if (scrollPercentage >= this.scrollThreshold) {
          console.log('📧 DIRECT-POPUP: Triggered at', scrollPercentage.toFixed(1), '% scroll');
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
      console.log('📧 DIRECT-POPUP: Creating modal...');

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
      <h2 style="
        color: #0176d3;
        margin-bottom: 1rem;
        font-size: 1.875rem;
        text-align: center;
      ">Stay Connected!</h2>
      <p style="
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: 2rem;
        text-align: center;
        line-height: 1.6;
      ">Sign up for our monthly newsletter and get the latest updates on food bank technology.</p>
      <form style="
        display: flex;
        gap: 1rem;
        flex-direction: column;
      ">
        <input
          type="email"
          placeholder="Enter your email address"
          required
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
    `;
      document.head.appendChild(style);

      // Setup close functionality
      const closeBtn = modal.querySelector('.fnf-close-btn');
      const form = modal.querySelector('form');

      const closeModal = () => {
        console.log('📧 DIRECT-POPUP: Closing modal');
        localStorage.setItem('fnf-newsletter-dismissed', 'true');
        localStorage.setItem('fnf-newsletter-user-action', 'true');
        modal.style.opacity = '0';
        setTimeout(() => {
          if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
          }
        }, 300);
      };

      closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });

      // Form submission
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        localStorage.setItem('fnf-newsletter-subscribed', 'true');
        localStorage.setItem('fnf-newsletter-user-action', 'true');
        console.log('📧 DIRECT-POPUP: User subscribed');
        closeModal();
      });

      console.log('📧 DIRECT-POPUP: Modal created and displayed');
    }

    // Debug methods
    reset() {
      localStorage.removeItem('fnf-newsletter-subscribed');
      localStorage.removeItem('fnf-newsletter-dismissed');
      this.hasTriggered = false;
      console.log('📧 DIRECT-POPUP: Reset completed');
    }

    trigger() {
      if (!this.hasTriggered) {
        this.hasTriggered = true;
        this.createSignupModal();
      }
    }
  }

  // Initialize immediately
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📧 NEWSLETTER-INIT: DOM ready, creating popup...');
    const popup = new DirectNewsletterPopup();

    // Expose for debugging
    window.fnfDirectNewsletterPopup = popup;
    console.log('📧 NEWSLETTER-INIT: Available as window.fnfDirectNewsletterPopup');
  });

} // Close the else block

console.log('📧 NEWSLETTER-INIT: Script loaded successfully');