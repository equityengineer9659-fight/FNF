# API Integration Action Plan

> Step-by-step instructions for activating the free API integrations built on 2026-04-04.
> All code is already written and merged — these steps activate the features.

---

## Step 1: Register for BLS API v2 Key (5 minutes)

### What You Do
1. Go to https://data.bls.gov/registrationEngine/
2. Fill in your name, email, organization ("Food-N-Force")
3. You'll receive an API key by email (usually instant)
4. Copy the key

### What to Tell Claude
> "Paste this BLS API v2 key into _config.php: [YOUR_KEY]"

### What Changes
- Food Prices dashboard goes from 25 requests/day to 500
- Can fetch 50 data series per request instead of 3
- Enables deeper historical data (20 years vs 10)
- Cache refreshes more reliably

---

## Step 2: Register for Charity Navigator API (10 minutes + wait for approval)

### What You Do
1. Go to https://developer.charitynavigator.org/
2. Create a developer account
3. Browse the API catalog and request access to the GraphQL API
4. Wait for approval (may take hours to days)
5. Once approved, create an "App" in the portal to get your API key

### What to Tell Claude
> "Paste this Charity Navigator API key into _config.php: [YOUR_KEY]. Then test it by loading a nonprofit profile page."

### What Changes
- Nonprofit Profile pages show a Charity Navigator score gauge (0-100)
- Beacon level badge appears (Platinum/Gold/Silver/Bronze)
- Organization mission statement displays from CN data
- All hidden gracefully if org isn't rated by CN

### How to Verify
- Go to any nonprofit profile page (e.g., `/dashboards/nonprofit-profile.html?ein=363673599` for Feeding America)
- You should see a rating gauge between the org name and the financial stats
- If the org isn't rated by CN, nothing shows (by design)

---

## Step 3: Verify SDOH Integration Works (2 minutes)

### What You Do
This is already live — no registration needed. The Census ACS API is free and keyless.

### What to Tell Claude
> "Start the dev server and verify the SDOH scatter plots work on the Food Insecurity and Food Access dashboards."

### What Changes
- Food Insecurity dashboard: new "Social Determinants of Food Insecurity" section appears below the poverty scatter plot. Four toggle buttons let you switch between: Uninsured Rate, College Education, No Vehicle, Housing Burden — each showing correlation with food insecurity.
- Food Access dashboard: new "Housing Cost Burden & Food Access" scatter appears after the Double Burden treemap. Shows 2023 Census housing data overlaid on 2019 food desert data.

### How to Verify
- Run `npm run dev`
- Load `/dashboards/food-insecurity.html` — scroll past "Poverty vs Food Insecurity" and look for "Social Determinants of Food Insecurity"
- Click the 4 buttons to toggle metrics
- Load `/dashboards/food-access.html` — scroll to bottom and look for "Housing Cost Burden & Food Access"
- Both sections show r-values and dynamic insights

---

## Step 4: ~~Apply for ESRI Nonprofit Program~~ (COMPLETED — different approach)

> **Status: No longer needed for food desert data.** We computed our own food desert data (2026-04-06) from USDA FNS SNAP retailer locations (ArcGIS REST, no auth) + Census 2020 tract centroids. Output: `public/data/current-food-access.json`. All Food Access dashboard charts now use this data. Re-run via `node scripts/compute-food-access.cjs`.
>
> ESRI Nonprofit Program may still be worth pursuing for geocoding credits (20K/month free) or future Living Atlas integrations — but the food desert mapping problem is solved.

---

## Step 5: Contact Feeding America Research Team (10 minutes)

### What You Do
Send this email:

**To:** research@feedingamerica.org
**Subject:** Data Partnership Request — Food-N-Force (Nonprofit Food Bank Consulting)

**Body:**
> Hi,
>
> I'm reaching out from Food-N-Force, a Salesforce consulting firm that serves food banks and food pantries. We've built free public dashboards visualizing food insecurity, SNAP participation, food access, and food bank capacity across all 50 states (food-n-force.com).
>
> With the USDA ERS discontinuing its Household Food Security report, we're looking to partner with Feeding America to access Map the Meal Gap data for our dashboards — specifically county-level food insecurity estimates, meal costs, and food budget shortfalls.
>
> Our dashboards are freely accessible and help food bank directors and funders understand community needs. We'd be happy to credit Feeding America as the data source and link to your resources.
>
> Would it be possible to discuss a data sharing arrangement? We're flexible on format (API, CSV, or bulk download).
>
> Thank you,
> [Your Name]
> Food-N-Force
> food-n-force.com

### What to Tell Claude (if they respond with data)
> "Feeding America sent us Map the Meal Gap county-level data as a CSV. Here's the file: [path]. Integrate this into the Food Insecurity dashboard to replace the modeled county estimates."

### What This Enables
- Replaces the modeled formula (`fiRate = 0.75 * povertyRate + 2.5`) with actual Feeding America estimates
- Adds confidence intervals and demographic breakdowns
- County drill-down becomes authoritative data instead of estimates

---

## Step 6: Sign Up for Mapbox Free Tier (5 minutes)

### What You Do
1. Go to https://www.mapbox.com/pricing
2. Click "Start building for free"
3. Create account, get your access token
4. Free tier: 100K geocodes/month + 50K map loads/month

### What to Tell Claude
> "Here's my Mapbox access token: [TOKEN]. Build a geocoding proxy and add food bank location markers to the Food Access dashboard."

### What This Enables
- Distance calculations from underserved areas to nearest food sources
- Food bank location markers overlaid on the food desert map
- Foundation for a future "Find Food Help Near You" feature

---

## Step 7: Explore Open Referral / 211 APIs (research phase)

### What You Do
1. Go to https://openreferral.org/
2. Check which regions near your target clients have HSDS-compliant 211 APIs
3. Test a few endpoints to see data quality and coverage

### What to Tell Claude
> "I found these Open Referral / 211 API endpoints that have food pantry data: [URLs]. Build a community resource locator on the Resources page."

### What This Enables
- "Find Food Help Near You" feature listing nearby pantries, meal programs, SNAP offices
- Real community resource data with hours, addresses, eligibility requirements

---

## Quick Reference: What's Already Built (No Action Needed)

| Feature | Status | Files |
|---------|--------|-------|
| Charity Navigator PHP proxy | Ready (needs API key) | `public/api/charity-navigator.php` |
| CN score gauge on nonprofit profiles | Ready (needs API key) | `src/js/dashboards/nonprofit-profile.js` |
| CN rating CSS styles | Done | `src/css/12-nonprofit-directory.css` |
| Census SDOH proxy (5 variables) | Live (no key needed) | `public/api/dashboard-sdoh.php` |
| SDOH scatter on Food Insecurity | Live | `src/js/dashboards/food-insecurity.js` |
| Housing burden scatter on Food Access | Live | `src/js/dashboards/food-access.js` |
| BLS v2 support in proxy | Ready (needs key) | `public/api/dashboard-bls.php` + `_config.php` |
| Data scientist agent | Ready | `.claude/agents/data-scientist.md` |
| Config key slots | Ready | `public/api/_config.php` |

---

## Priority Order

| Priority | Step | Time | Effort | Impact |
|----------|------|------|--------|--------|
| 1 | Step 3: Verify SDOH (already live) | 2 min | None | 2 new chart sections on 2 dashboards |
| 2 | Step 1: BLS v2 key | 5 min | None | Unlocks Food Prices dashboard potential |
| 3 | Step 2: Charity Navigator | 10 min + wait | None | Rating badges on nonprofit profiles |
| 4 | Step 5: Email Feeding America | 10 min | None | Best possible data quality upgrade |
| 5 | Step 4: ESRI application | 15 min | None | Updated food desert data |
| 6 | Step 6: Mapbox signup | 5 min | None | Geocoding + distance calculations |
| 7 | Step 7: Open Referral research | 30 min | None | Community resource locator |
