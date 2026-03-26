# Security Implementation

## Overview
This document outlines the security measures implemented for the Food-N-Force website.

## Security Headers

### Production Headers (via `_headers` file)
- **X-Frame-Options**: DENY - Prevents clickjacking attacks
- **X-Content-Type-Options**: nosniff - Prevents MIME type sniffing
- **X-XSS-Protection**: 0 - Disabled (deprecated, CSP is preferred)
- **Referrer-Policy**: strict-origin-when-cross-origin - Controls referrer information
- **Strict-Transport-Security**: HSTS with 2-year max-age, includeSubDomains, and preload
- **Permissions-Policy**: Restricts access to browser features

### Content Security Policy (CSP)
Current implementation uses a restrictive CSP with the following directives:
- `default-src 'self'` - Only allow resources from same origin by default
- `script-src 'self' 'unsafe-inline'` - Scripts from same origin and inline scripts
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` - Styles with Google Fonts
- `font-src 'self' https://fonts.gstatic.com data:` - Fonts from Google and data URIs
- `img-src 'self' data: https:` - Images from same origin, data URIs, and HTTPS sources
- `frame-ancestors 'none'` - Prevents embedding in frames
- `upgrade-insecure-requests` - Upgrades HTTP to HTTPS

## Implementation Details

### Netlify Deployment
Security headers are automatically applied via the `_headers` file when deployed to Netlify.

### Local Development
For local development, a CSP meta tag can be added to HTML files from `src/security/csp-meta.html`.

### Configuration
Security settings are documented in `config/security-config.json` for reference and monitoring.

## Future Improvements

### Priority 1: Remove Unsafe Inline
- Move inline scripts to external files
- Move inline styles to external files
- Implement CSP nonces or hashes for necessary inline content

### Priority 2: Enhanced Monitoring
- Implement CSP reporting endpoint
- Add Report-To header for violation reporting
- Set up security monitoring dashboard

### Priority 3: Additional Hardening
- Implement Subresource Integrity (SRI) for external resources
- Add security.txt file
- Implement CORS policies for API endpoints

## Testing Security Headers

### Online Tools
- https://securityheaders.com
- https://observatory.mozilla.org
- https://csp-evaluator.withgoogle.com

### Command Line
```bash
curl -I https://your-domain.com
```

## Incident Response

If security issues are discovered:
1. Assess the severity and impact
2. Implement immediate mitigation (e.g., tighten CSP)
3. Deploy fixes via standard deployment pipeline
4. Document the incident and response

## Compliance

Current implementation addresses:
- OWASP Top 10 recommendations
- Modern browser security best practices
- GDPR-compliant referrer policies
- Accessibility-friendly security measures