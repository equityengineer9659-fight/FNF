# Monitoring & Error Tracking

## Overview

The Food-N-Force website includes built-in error tracking and performance monitoring via `src/js/monitoring/`:
- **error-tracker.js** — Global error handler, unhandled promise rejections, console.error capture, network errors, throttling, localStorage persistence
- **performance-monitor.js** — Core Web Vitals (FCP, LCP, FID, CLS, INP), navigation timing, resource timing, long task detection
- **sentry.js** — Sentry integration bridge (imports `captureException` for external reporting)

Both modules auto-initialize in `main.js`. No setup needed for local development.

---

## Sentry Error Monitoring (Production)

### Setup
1. Create account at [sentry.io](https://sentry.io/signup/) (Free: 50K events/month)
2. Create project → Platform: **JavaScript** → Name: `food-n-force-website`
3. Copy the DSN (`https://KEY@o123456.ingest.us.sentry.io/PROJECT_ID`)
4. Add to `.env.production`:
   ```env
   VITE_SENTRY_DSN=https://YOUR_KEY@o123456.ingest.us.sentry.io/YOUR_PROJECT_ID
   ```
5. Add `VITE_SENTRY_DSN` as a GitHub Actions secret for CI/CD builds
6. Configure alerts: **Alerts** → **Create Alert** → When new issue → Email notification

### Verify
```bash
npm run build && npm run preview
# Open console: throw new Error('Test error for Sentry')
# Check Sentry dashboard — error should appear within seconds
```

### CSP Note
`_headers` already allows Sentry: `connect-src 'self' https://*.ingest.us.sentry.io`

---

## Google Analytics 4 (Production)

### Setup
1. Create property at [analytics.google.com](https://analytics.google.com/)
2. Add web stream → URL: `https://food-n-force.com`
3. Copy Measurement ID (`G-XXXXXXXXXX`)
4. Add to `.env.production`:
   ```env
   VITE_GA_MEASUREMENT_ID=G-YOUR_ID
   ```
5. Enable Enhanced Measurement: page views, scrolls, outbound clicks, form interactions

### Key Events to Track
- `newsletter_signup` — newsletter form submissions
- `contact_form_submit` — contact form submissions

---

## Environment Variables

```env
# Production
VITE_SENTRY_DSN=https://key@o123.ingest.us.sentry.io/456
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FEATURE_DEBUG_MODE=false

# Staging
VITE_FEATURE_DEBUG_MODE=true
```

Set these as GitHub Actions secrets for CI/CD builds (`VITE_ENV` and `VITE_FEATURE_DEBUG_MODE` are set directly in the workflow).

---

## Troubleshooting

### Sentry Not Receiving Errors
1. Verify `VITE_SENTRY_DSN` is set in `.env.production`
2. Check `_headers` CSP allows `*.ingest.sentry.io` in `connect-src`
3. Build and test locally: `npm run build && npm run preview`
4. Console: `throw new Error('Test')` → check Sentry dashboard

### GA4 Not Tracking
1. Verify Measurement ID format: `G-XXXXXXXXXX`
2. Test in incognito (ad blockers prevent GA tracking)
3. Check GA4 → **Realtime** report for your visit
4. Use `?debug_mode=true` URL parameter for DebugView

### Performance Monitoring Not Working
- FID/INP require user interaction to trigger
- CLS accumulates throughout page lifetime
- Check browser support for `PerformanceObserver`

---

## Cost

- **Sentry**: Free tier (50K events/month, 7-day retention). Paid starts $26/month.
- **GA4**: Free (no limits on standard features)

---

**Last Updated**: 2026-04-01
