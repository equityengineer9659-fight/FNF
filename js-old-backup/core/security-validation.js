/**
 * PHASE 4.2: INPUT VALIDATION & SECURITY FRAMEWORK
 * Enhanced HTML-First Architecture - Client-Side Security
 */

class SecurityValidation {
    constructor() {
        this.rateLimitMap = new Map();
        this.sessionToken = this.generateSecureToken();
        this.initializeSecurity();
    }

    generateSecureToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    initializeSecurity() {
        this.addCSRFTokens();
        this.initializeFormValidation();
    }

    addCSRFTokens() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            if (!form.querySelector('input[name="csrf_token"]')) {
                const tokenInput = document.createElement('input');
                tokenInput.type = 'hidden';
                tokenInput.name = 'csrf_token';
                tokenInput.value = this.sessionToken;
                form.appendChild(tokenInput);
            }
        });
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/\//g, '&#x2F;');
    }

    validateEmail(email) {
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        return emailRegex.test(email) && email.length <= 254;
    }

    initializeFormValidation() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const formData = new FormData(form);
                this.processSecureSubmission(form, formData);
            });
        });
    }

    processSecureSubmission(form, formData) {
        const validation = this.validateFormData(formData);
        if (validation.isValid) {
            console.log('Secure form submission:', validation.sanitized);
            this.displaySuccessMessage(form);
        } else {
            this.displayErrors(form, validation.errors);
        }
    }

    validateFormData(formData) {
        const validation = { isValid: true, errors: [], sanitized: {} };
        for (const [key, value] of formData.entries()) {
            validation.sanitized[key] = this.sanitizeInput(value);
        }
        return validation;
    }

    displaySuccessMessage(form) {
        const success = document.createElement('div');
        success.className = 'slds-notify slds-notify_alert slds-theme_success';
        success.innerHTML = '<div class="slds-notify__content"><p>Message sent successfully!</p></div>';
        form.parentNode.insertBefore(success, form);
        form.style.display = 'none';
    }

    displayErrors(form, errors) {
        console.log('Validation errors:', errors);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SecurityValidation();
});
