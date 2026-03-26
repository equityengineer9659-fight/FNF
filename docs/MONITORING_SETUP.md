# Monitoring & Analytics Setup Guide
**Food-N-Force Website - Error Tracking & User Analytics**

---

## Overview

This guide walks through setting up production monitoring with Sentry (error tracking) and Google Analytics 4 (user analytics).

---

## Part 1: Sentry Error Monitoring

### Step 1: Create Sentry Account
1. Go to [sentry.io](https://sentry.io/signup/)
2. Sign up with GitHub or email
3. Choose the **Free** plan (50K events/month)

### Step 2: Create Project
1. Click **"Create Project"**
2. Select platform: **JavaScript**
3. Set alert frequency: **On every new issue**
4. Project name: `food-n-force-website`
5. Click **"Create Project"**

### Step 3: Get DSN
1. After project creation, you'll see the DSN
2. Format: `https://YOUR_KEY@o123456.ingest.sentry.io/PROJECT_ID`
3. **Copy this DSN** - you'll need it for configuration

### Step 4: Configure Environment
1. Open `.env.production` in your project
2. Update the Sentry DSN:
   ```env
   VITE_SENTRY_DSN=https://YOUR_ACTUAL_KEY@o123456.ingest.sentry.io/YOUR_PROJECT_ID
   ```
3. Save the file

### Step 5: Test Error Tracking
1. Build your project: `npm run build`
2. Preview locally: `npm run preview`
3. Open browser console and run:
   ```javascript
   // Trigger test error
   throw new Error('Test error for Sentry');
   ```
4. Check Sentry dashboard - error should appear within seconds

### Step 6: Configure Alerts
1. In Sentry, go to **Alerts** → **Create Alert**
2. Choose: **Issues**
3. Conditions:
   - When: **A new issue is created**
   - Then: **Send a notification to me via email**
4. Save alert

### Step 7: Set Up Slack Integration (Optional)
1. Go to **Settings** → **Integrations**
2. Find **Slack** and click **Install**
3. Authorize Slack workspace
4. Choose channel: `#website-errors`
5. Configure alert routing

---

## Part 2: Google Analytics 4

### Step 1: Create GA4 Property
1. Go to [analytics.google.com](https://analytics.google.com/)
2. Click **Admin** (gear icon)
3. Click **Create Property**
4. Property name: `Food-N-Force Website`
5. Time zone: Your timezone
6. Currency: USD
7. Click **Next**

### Step 2: Configure Data Stream
1. Select platform: **Web**
2. Website URL: `https://foodnforce.com`
3. Stream name: `Production Website`
4. Click **Create stream**

### Step 3: Get Measurement ID
1. After stream creation, you'll see the **Measurement ID**
2. Format: `G-XXXXXXXXXX`
3. **Copy this ID** - you'll need it for configuration

### Step 4: Configure Environment
1. Open `.env.production` in your project
2. Update the GA measurement ID:
   ```env
   VITE_GA_MEASUREMENT_ID=G-YOUR_ACTUAL_ID
   ```
3. Save the file

### Step 5: Test Tracking
1. Build your project: `npm run build`
2. Preview locally: `npm run preview`
3. Visit pages and click around
4. Go to GA4 dashboard → **Reports** → **Realtime**
5. You should see your activity

### Step 6: Set Up Key Events
1. In GA4, go to **Admin** → **Events**
2. Click **Create event**
3. Create these events:
   - **newsletter_signup** - When users subscribe
   - **contact_form_submit** - When contact form submitted
   - **resource_download** - When resources downloaded

### Step 7: Enable Enhanced Measurement
1. Go to **Admin** → **Data Streams**
2. Click your web stream
3. Click **Enhanced measurement**
4. Enable:
   - ✅ Page views
   - ✅ Scrolls
   - ✅ Outbound clicks
   - ✅ Site search
   - ✅ Form interactions
   - ✅ File downloads

---

## Part 3: Netlify Deployment with Environment Variables

### Step 1: Access Netlify Site Settings
1. Log into [Netlify](https://app.netlify.com/)
2. Select your site
3. Go to **Site settings** → **Build & deploy** → **Environment variables**

### Step 2: Add Production Variables
Add these environment variables:

| Variable | Value | Source |
|----------|-------|--------|
| `VITE_ENV` | `production` | Manual |
| `VITE_SENTRY_DSN` | Your Sentry DSN | From Sentry Step 3 |
| `VITE_GA_MEASUREMENT_ID` | Your GA4 ID | From GA4 Step 3 |
| `VITE_FEATURE_DEBUG_MODE` | `false` | Manual |

### Step 3: Deploy to Production
1. Push changes to `main` branch
2. Netlify auto-deploys
3. Check deployment logs for errors
4. Visit production site

### Step 4: Verify Monitoring Works
1. **Sentry Check**:
   - Open production site in incognito
   - Open console: `throw new Error('Production test')`
   - Check Sentry dashboard

2. **GA4 Check**:
   - Visit production site
   - Navigate 2-3 pages
   - Check GA4 Realtime report
   - Should see 1 active user (you)

---

## Part 4: Dashboard Setup

### Sentry Dashboard

**Create Custom Dashboard:**
1. Go to **Dashboards** → **Create Dashboard**
2. Add widgets:
   - **Crash Free Sessions** - Shows reliability
   - **Error Frequency** - Trends over time
   - **Top Errors** - Most common issues
   - **Browser Breakdown** - Which browsers have issues
   - **Release Health** - Per-deployment metrics

**Set Up Discover Queries:**
1. Go to **Discover**
2. Useful queries:
   ```sql
   -- Errors in last 24 hours
   event.type:error timestamp:>-24h

   -- Errors by page
   event.type:error transaction:/services

   -- Errors by browser
   event.type:error browser.name:Chrome
   ```

### Google Analytics Dashboard

**Create Custom Report:**
1. Go to **Explore** → **Blank**
2. Add dimensions:
   - Page title
   - Page path
   - Event name
3. Add metrics:
   - Sessions
   - Users
   - Engagement rate
   - Average session duration
4. Save as: `Website Performance Overview`

**Key Metrics to Monitor:**
- **Realtime** - Current users
- **Acquisition** - Traffic sources
- **Engagement** - Page views, session duration
- **Events** - Custom events (newsletter, contact)
- **Tech** - Browser, device, OS breakdown

---

## Part 5: Monitoring Best Practices

### Sentry Best Practices

1. **Set Up Releases**:
   ```bash
   # Tag releases with version
   export SENTRY_RELEASE=$(git rev-parse HEAD)
   # Include in deployment
   ```

2. **Filter Out Noise**:
   - Ignore browser extensions
   - Filter 3rd-party script errors
   - Set up error grouping rules

3. **Performance Monitoring**:
   - Enable transaction sampling
   - Set sample rate: 10% (0.1)
   - Monitor page load times

4. **Alerting Strategy**:
   - Email: Critical errors only
   - Slack: All new issues
   - Weekly digest: Error trends

### Google Analytics Best Practices

1. **Data Retention**:
   - Go to **Admin** → **Data Settings** → **Data Retention**
   - Set to: **14 months**

2. **IP Exclusion**:
   - Exclude your office/home IP
   - Prevents skewing data with internal traffic

3. **Goals & Conversions**:
   - Newsletter signups
   - Contact form submissions
   - Resource downloads

4. **Custom Dimensions**:
   - User type (new vs returning)
   - Page category
   - Feature flags enabled

---

## Part 6: Troubleshooting

### Sentry Not Receiving Errors

**Check 1: DSN Configured**
```bash
# Verify environment variable set
echo $VITE_SENTRY_DSN
```

**Check 2: Build Includes Sentry**
- View source in browser
- Search for "sentry"
- Should find Sentry initialization code

**Check 3: CSP Allows Sentry**
- Check `_headers` file
- Ensure Sentry domains whitelisted:
  ```
  connect-src 'self' *.ingest.sentry.io
  ```

**Check 4: Test Locally**
```javascript
// Browser console
if (window.Sentry) {
  Sentry.captureException(new Error('Test'));
  console.log('Sentry loaded');
} else {
  console.error('Sentry not loaded');
}
```

### Google Analytics Not Tracking

**Check 1: Measurement ID Correct**
- Verify format: `G-XXXXXXXXXX`
- No spaces or extra characters

**Check 2: GA Script Loaded**
- View source in browser
- Search for "gtag"
- Should find Google tag script

**Check 3: Ad Blockers**
- Test in incognito mode
- Disable ad blockers
- Some blockers prevent GA tracking

**Check 4: DebugView**
- In GA4, go to **DebugView**
- Add `?debug_mode=true` to URL
- Should see events in real-time

### Performance Issues

**Monitoring Adds Load**
- Sentry: ~10KB gzipped
- GA4: ~17KB gzipped
- **Total**: ~27KB additional

**Optimization**:
- Load monitoring after page interactive
- Use `requestIdleCallback` if available
- Consider async loading

---

## Part 7: Monitoring Checklist

### Pre-Launch
- [ ] Sentry account created
- [ ] Sentry project configured
- [ ] Sentry DSN added to `.env.production`
- [ ] Test error sent to Sentry successfully
- [ ] GA4 property created
- [ ] GA4 measurement ID added to `.env.production`
- [ ] Test page view tracked in GA4
- [ ] Netlify environment variables set
- [ ] Production deployment tested
- [ ] Sentry alerts configured
- [ ] GA4 enhanced measurement enabled

### Post-Launch (Week 1)
- [ ] Review Sentry errors daily
- [ ] Check GA4 traffic daily
- [ ] Verify no monitoring-related errors
- [ ] Monitor performance impact
- [ ] Adjust alert thresholds
- [ ] Set up weekly reports

### Ongoing (Monthly)
- [ ] Review Sentry dashboard
- [ ] Analyze GA4 trends
- [ ] Update error filters
- [ ] Adjust sampling rates
- [ ] Review alert effectiveness
- [ ] Generate stakeholder reports

---

## Part 8: Cost Estimates

### Sentry
- **Free Tier**: 50K events/month, 7-day retention
- **Paid Tier**: Starts at $26/month (100K events, 90-day retention)
- **Recommended**: Start with Free, upgrade if needed

### Google Analytics 4
- **Cost**: FREE (no limits on standard features)
- **Enterprise**: GA360 ($150K/year) - not needed

### Estimated Monthly Cost
- **Sentry**: $0-26
- **GA4**: $0
- **Total**: **$0-26/month**

---

## Part 9: Quick Reference

### Environment Variables
```env
# Production
VITE_SENTRY_DSN=https://key@o123.ingest.sentry.io/456
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_FEATURE_DEBUG_MODE=false

# Staging
VITE_SENTRY_DSN=https://key@o123.ingest.sentry.io/789
VITE_GA_MEASUREMENT_ID=G-YYYYYYYYYY
VITE_FEATURE_DEBUG_MODE=true
```

### Useful Commands
```bash
# Test Sentry locally
npm run build
npm run preview
# Then trigger error in console

# Verify environment variables
npm run build
grep -r "VITE_SENTRY_DSN" dist/

# Check monitoring in production
curl -I https://foodnforce.com
```

### Important URLs
- **Sentry Dashboard**: https://sentry.io/organizations/your-org/issues/
- **GA4 Dashboard**: https://analytics.google.com/
- **Netlify Settings**: https://app.netlify.com/sites/your-site/settings

---

**Last Updated**: 2025-10-01
**Next Review**: After production launch
