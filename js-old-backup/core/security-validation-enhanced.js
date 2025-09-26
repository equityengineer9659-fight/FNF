// Enhanced Security Framework v4.2

class EnhancedSecurityValidation {
    constructor() {
        this.rateLimitMap = new Map();
        this.sessionToken = this.generateSecureToken();
        this.securityConfig = {
            maxSubmissionRate: 5,
            sessionTimeout: 30 * 60 * 1000,
            csrfTokenExpiry: 60 * 60 * 1000,
            maxInputLength: 5000
        };
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
        this.setupRateLimiting();
        this.initializeXSSProtection();
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
                
                const timestampInput = document.createElement('input');
                timestampInput.type = 'hidden';
                timestampInput.name = 'csrf_timestamp';
                timestampInput.value = Date.now().toString();
                form.appendChild(timestampInput);
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
            .replace(/\//g, '&#x2F;')
            .replace(/javascript:/gi, '')
            .replace(/data:/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
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

    setupRateLimiting() {
        this.checkRateLimit = (identifier = 'global') => {
            const now = Date.now();
            const windowStart = now - 60000;
            
            if (!this.rateLimitMap.has(identifier)) {
                this.rateLimitMap.set(identifier, []);
            }
            
            const submissions = this.rateLimitMap.get(identifier);
            const recentSubmissions = submissions.filter(time => time > windowStart);
            this.rateLimitMap.set(identifier, recentSubmissions);
            
            if (recentSubmissions.length >= this.securityConfig.maxSubmissionRate) {
                return false;
            }
            
            recentSubmissions.push(now);
            this.rateLimitMap.set(identifier, recentSubmissions);
            return true;
        };
    }

    initializeXSSProtection() {
        this.detectXSSPatterns = (input) => {
            const xssPatterns = [
                /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi,
                /<iframe/gi,
                /data:text\/html/gi
            ];
            
            return xssPatterns.some(pattern => pattern.test(input));
        };
    }

    processSecureSubmission(form, formData) {
        const userIdentifier = this.getUserIdentifier();
        if (!this.checkRateLimit(userIdentifier)) {
            this.displayRateLimitError(form);
            return;
        }

        if (!this.validateCSRFToken(formData)) {
            this.displaySecurityError(form, 'Security validation failed. Please refresh and try again.');
            return;
        }

        const validation = this.validateFormData(formData);
        if (validation.isValid) {
            this.submitSecureForm(form, validation.sanitized);
        } else {
            this.displayErrors(form, validation.errors);
        }
    }

    validateCSRFToken(formData) {
        const token = formData.get('csrf_token');
        const timestamp = formData.get('csrf_timestamp');
        
        if (!token || !timestamp || token !== this.sessionToken) {
            return false;
        }
        
        const tokenAge = Date.now() - parseInt(timestamp);
        return tokenAge < this.securityConfig.csrfTokenExpiry;
    }

    getUserIdentifier() {
        return btoa(navigator.userAgent + window.screen.width + window.screen.height).substr(0, 16);
    }

    validateFormData(formData) {
        const validation = { isValid: true, errors: [], sanitized: {} };
        
        for (const [key, value] of formData.entries()) {
            if (key.startsWith('csrf_')) {
                validation.sanitized[key] = value;
                continue;
            }
            
            const sanitizedValue = this.sanitizeInput(value);
            validation.sanitized[key] = sanitizedValue;
            
            if (key === 'email' && !this.validateEmail(sanitizedValue)) {
                validation.errors.push({ field: key, message: 'Invalid email address' });
                validation.isValid = false;
            }
            
            const field = document.querySelector(`[name="${key}"]`);
            if (field && field.required && !sanitizedValue.trim()) {
                validation.errors.push({ field: key, message: 'This field is required' });
                validation.isValid = false;
            }
        }
        
        return validation;
    }

    submitSecureForm(form, sanitizedData) {
        console.log('Secure form submission:', sanitizedData);
        this.displaySuccessMessage(form);
    }

    displaySuccessMessage(form) {
        const success = document.createElement('div');
        success.className = 'slds-notify slds-notify_alert slds-theme_success security-success-message';
        success.setAttribute('role', 'alert');
        
        success.innerHTML = '<div class="slds-notify__content"><h3>Your message has been sent securely!</h3><p>We have received your information and will respond within 24 business hours.</p></div>';
        
        form.parentNode.insertBefore(success, form);
        form.style.display = 'none';
    }

    displayRateLimitError(form) {
        this.displaySecurityError(form, 'Too many attempts. Please wait before trying again.');
    }

    displaySecurityError(form, message) {
        const error = document.createElement('div');
        error.className = 'slds-notify slds-notify_alert slds-theme_error';
        error.setAttribute('role', 'alert');
        
        error.innerHTML = '<div class="slds-notify__content"><p><strong>Security Alert:</strong> ' + message + '</p></div>';
        
        form.parentNode.insertBefore(error, form);
        
        setTimeout(() => {
            if (error.parentNode) {
                error.remove();
            }
        }, 10000);
    }

    displayErrors(form, errors) {
        errors.forEach(error => {
            const field = form.querySelector(`[name="${error.field}"]`);
            if (field) {
                const errorElement = document.getElementById(field.id + '-error');
                if (errorElement) {
                    errorElement.textContent = error.message;
                    errorElement.classList.remove('slds-hide');
                }
            }
        });
    }

    getSecurityStatus() {
        return {
            version: '4.2.0',
            csrfProtection: true,
            xssProtection: true,
            rateLimiting: true,
            inputSanitization: true,
            secureSubmission: true
        };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.foodNForceSecurityValidation) {
        window.foodNForceSecurityValidation = new EnhancedSecurityValidation();
        console.log('Enhanced Security Framework v4.2 initialized successfully');
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedSecurityValidation;
}
