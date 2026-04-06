import { describe, it, expect, beforeEach, vi } from 'vitest';
import ContactForm from './contact-form.js';

describe('ContactForm', () => {
  let form, successMessage;

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="contact-form" action="/api/contact.php">
        <input type="text" name="name" required value="Test User">
        <input type="email" name="email" required value="test@example.com">
        <textarea name="message" required>Hello</textarea>
        <button type="submit">Send Message</button>
      </form>
      <div id="success-message"></div>
    `;
    form = document.getElementById('contact-form');
    successMessage = document.getElementById('success-message');
    vi.restoreAllMocks();
  });

  it('should bind to form element', () => {
    const cf = new ContactForm(form);
    expect(cf.form).toBe(form);
    expect(cf.submitBtn).toBe(form.querySelector('button[type="submit"]'));
  });

  describe('handleSubmit', () => {
    it('should fetch CSRF token before submission', async () => {
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: 'csrf-123' }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) });

      const cf = new ContactForm(form);
      await cf.handleSubmit(new Event('submit', { cancelable: true }));

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(1, '/api/csrf-token.php');
    });

    it('should show success state on successful submission', async () => {
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: 'csrf-123' }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) });

      const cf = new ContactForm(form);
      await cf.handleSubmit(new Event('submit', { cancelable: true }));

      expect(form.style.display).toBe('none');
      expect(successMessage.classList.contains('show')).toBe(true);
    });

    it('should show error when CSRF token fetch fails', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network'));

      const cf = new ContactForm(form);
      await cf.handleSubmit(new Event('submit', { cancelable: true }));

      const errorEl = document.querySelector('.contact-form-error');
      expect(errorEl).not.toBeNull();
      expect(errorEl.textContent).toContain('security token');
    });

    it('should show error when server returns error', async () => {
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: 'csrf' }) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: false, error: 'Bad input' }) });

      const cf = new ContactForm(form);
      await cf.handleSubmit(new Event('submit', { cancelable: true }));

      const errorEl = document.querySelector('.contact-form-error');
      expect(errorEl).not.toBeNull();
      expect(errorEl.textContent).toBe('Bad input');
    });

    it('should show generic error on network failure during submission', async () => {
      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ token: 'csrf' }) })
        .mockRejectedValueOnce(new Error('Network'));

      const cf = new ContactForm(form);
      await cf.handleSubmit(new Event('submit', { cancelable: true }));

      const errorEl = document.querySelector('.contact-form-error');
      expect(errorEl).not.toBeNull();
      expect(errorEl.textContent).toContain('check your connection');
    });
  });

  describe('setLoading', () => {
    it('should disable button and change text during loading', () => {
      const cf = new ContactForm(form);
      cf.setLoading(true);
      expect(cf.submitBtn.disabled).toBe(true);
      expect(cf.submitBtn.textContent).toBe('Sending...');
    });

    it('should re-enable button after loading', () => {
      const cf = new ContactForm(form);
      cf.setLoading(true);
      cf.setLoading(false);
      expect(cf.submitBtn.disabled).toBe(false);
      expect(cf.submitBtn.textContent).toBe('Send Message');
    });
  });

  describe('clearError', () => {
    it('should remove error element', () => {
      const cf = new ContactForm(form);
      cf.showError('Test error');
      expect(document.querySelector('.contact-form-error')).not.toBeNull();
      cf.clearError();
      expect(document.querySelector('.contact-form-error')).toBeNull();
    });
  });

  describe('form validation', () => {
    it('should not submit if form is invalid', async () => {
      globalThis.fetch = vi.fn();
      // Make the form invalid by clearing required field
      form.querySelector('[name="name"]').value = '';
      // Mock checkValidity to return false (jsdom doesn't validate)
      form.checkValidity = vi.fn().mockReturnValue(false);
      form.reportValidity = vi.fn();

      const cf = new ContactForm(form);
      await cf.handleSubmit(new Event('submit', { cancelable: true }));

      expect(fetch).not.toHaveBeenCalled();
      expect(form.reportValidity).toHaveBeenCalled();
    });
  });
});
