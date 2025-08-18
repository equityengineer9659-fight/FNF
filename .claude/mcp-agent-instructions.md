# MCP Tool Usage Instructions by Agent

## 🎨 CSS Design Systems Expert & HTML Expert
### Primary MCP Tools: `browser`, `lighthouse`

**Usage Scenarios:**
- Use `browser` MCP to open live website and visually verify SLDS compliance
- Test responsive behavior across different viewport sizes
- Validate logo spinning effects and iridescent backgrounds are preserved
- Use `lighthouse` MCP to audit performance impact of premium effects

**Commands:**
```javascript
// Open browser to test current page
await browser.navigate("file:///C:/Users/luetk/Desktop/Website/Website Next Version/index.html");

// Test responsive breakpoints
await browser.setViewport(768, 1024); // Tablet
await browser.setViewport(375, 667);  // Mobile

// Run Lighthouse audit while preserving effects
await lighthouse.audit(url, {categories: ["performance", "accessibility"]});
```

## ⚙️ JavaScript Behavior Expert
### Primary MCP Tools: `browser`, `playwright`

**Usage Scenarios:**
- Test JavaScript consolidation doesn't break logo animations
- Validate iridescent background spinning effects work correctly
- Automate testing of premium visual effects across browsers
- Monitor JavaScript performance after consolidation

**Commands:**
```javascript
// Test logo spinning animation
await browser.evaluate(() => {
    const logo = document.querySelector('.fnf-logo');
    return getComputedStyle(logo, '::before').animation;
});

// Test iridescent background effects
await playwright.waitForSelector('.iridescent-background');
await playwright.screenshot({path: 'effects-test.png'});
```

## 🛡️ SLDS Compliance Enforcer  
### Primary MCP Tools: `browser`, `lighthouse`

**Usage Scenarios:**
- Automated SLDS compliance checking without breaking premium effects
- Visual regression testing for protected elements
- Accessibility auditing of enhanced components
- Performance validation of SLDS + premium effects combination

**Commands:**
```javascript
// Check SLDS compliance while preserving effects
await browser.evaluate(() => {
    return Array.from(document.querySelectorAll('[class*="slds-"]')).length;
});

// Accessibility audit with premium effects
await lighthouse.audit(url, {categories: ["accessibility"], onlyCategories: true});
```

## 📋 Project Manager & Technical Architect
### Primary MCP Tools: `filesystem`, `github`

**Usage Scenarios:**
- Advanced file operations for project organization
- Repository management and PR automation
- Build process monitoring and optimization
- Performance tracking and reporting

**Commands:**
```javascript
// Project file analysis
await filesystem.listFiles("C:/Users/luetk/Desktop/Website/Website Next Version");

// GitHub integration for PR management
await github.createPullRequest({
    title: "SLDS Compliance Improvements - Protected Effects Preserved",
    body: "Automated improvements while maintaining logo spinning and iridescent backgrounds"
});
```

## 🔧 Configuration Notes

### Protected Elements Testing Protocol
When using any MCP tool, agents MUST:
1. ✅ Verify logo spinning animation is working (fnf-spin keyframes)
2. ✅ Confirm iridescent backgrounds are rendering correctly
3. ✅ Test premium effects performance impact
4. ✅ Report findings without suggesting removal

### Performance Baselines
- Logo animation should complete 360° rotation in 8 seconds
- Iridescent backgrounds should maintain 60fps on desktop
- Premium effects should not increase page load time beyond 2.5s
- SLDS compliance score should reach 80%+ while preserving all effects

### Error Handling
If MCP tools encounter issues with protected elements:
- Document the issue without suggesting removal
- Propose optimization alternatives that preserve visual impact
- Test fallback scenarios (e.g., reduced motion preferences)
- Report compatibility findings for different browsers/devices