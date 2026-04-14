/**
 * Contact Form Handler
 * Intercepts form submission, sends via fetch to PHP backend,
 * and manages success/error UI states.
 */

class ContactForm {
  constructor(formEl) {
    this.form = formEl;
    this.successMessage = document.getElementById('success-message');
    this.submitBtn = this.form.querySelector('button[type="submit"]');
    this.errorEl = null;

    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
  }

  async handleSubmit(event) {
    event.preventDefault();
    this.clearError();

    if (!this.form.checkValidity()) {
      this.form.reportValidity();
      return;
    }

    this.setLoading(true);

    try {
      const formData = new FormData(this.form);

      // Fetch CSRF token — abort submission if token unavailable
      let csrfToken = null;
      try {
        const tokenRes = await fetch('/api/csrf-token.php');
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          csrfToken = tokenData?.token ?? null;
        }
      } catch { /* network failure handled below */ }

      if (!csrfToken) {
        this.showError('Unable to verify security token. Please refresh the page and try again.');
        return;
      }
      formData.append('csrf_token', csrfToken);

      const response = await fetch(this.form.action, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        this.showError('Unable to send your message right now. Please try again in a moment.');
        return;
      }

      const data = await response.json();

      if (data.success) {
        this.showSuccess();
      } else {
        this.showError(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      this.showError('Unable to send your message. Please check your connection and try again.');
    } finally {
      this.setLoading(false);
    }
  }

  showSuccess() {
    this.form.style.display = 'none';
    if (this.successMessage) {
      this.successMessage.classList.add('show');
    }
  }

  showError(message) {
    this.clearError();
    this.errorEl = document.createElement('p');
    this.errorEl.className = 'contact-form-error';
    this.errorEl.setAttribute('role', 'alert');
    this.errorEl.textContent = message;
    this.submitBtn.insertAdjacentElement('afterend', this.errorEl);
  }

  clearError() {
    if (this.errorEl) {
      this.errorEl.remove();
      this.errorEl = null;
    }
  }

  setLoading(loading) {
    this.submitBtn.disabled = loading;
    this.submitBtn.textContent = loading ? 'Sending...' : 'Send Message';
  }
}

export default ContactForm;
