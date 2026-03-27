#!/usr/bin/env node

/**
 * Performance Testing Script
 * Uses Puppeteer to test Core Web Vitals on all pages
 */

import puppeteer from 'puppeteer';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration
const CONFIG = {
  pages: [
    { name: 'Home', url: 'http://localhost:4173/' },
    { name: 'About', url: 'http://localhost:4173/about.html' },
    { name: 'Services', url: 'http://localhost:4173/services.html' },
    { name: 'Impact', url: 'http://localhost:4173/impact.html' },
    { name: 'Resources', url: 'http://localhost:4173/resources.html' },
    { name: 'Contact', url: 'http://localhost:4173/contact.html' }
  ],
  outputDir: path.join(__dirname, '../../performance-reports'),
  thresholds: {
    FCP: 2000,  // First Contentful Paint < 2s
    LCP: 2500,  // Largest Contentful Paint < 2.5s
    CLS: 0.1,   // Cumulative Layout Shift < 0.1
    TTFB: 600,  // Time to First Byte < 600ms
    TTI: 3800   // Time to Interactive < 3.8s
  }
};

// Color output
const log = {
  info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
  warning: (msg) => console.log(`\x1b[33m${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m${msg}\x1b[0m`)
};

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:4173/');
    return response.ok;
  } catch {
    return false;
  }
}

// Collect Core Web Vitals
async function collectMetrics(page, url) {
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Wait a bit for everything to settle
  await new Promise(r => setTimeout(r, 2000));

  // Inject performance monitoring
  const metrics = await page.evaluate(() => {
    return new Promise((resolve) => {
      const data = {
        FCP: 0,
        LCP: 0,
        CLS: 0,
        TTFB: 0,
        TTI: 0,
        FID: 0,
        domContentLoaded: 0,
        loadComplete: 0
      };

      // Get navigation timing
      const navTiming = performance.getEntriesByType('navigation')[0];
      if (navTiming) {
        data.TTFB = Math.round(navTiming.responseStart - navTiming.fetchStart);
        data.domContentLoaded = Math.round(navTiming.domContentLoadedEventEnd - navTiming.fetchStart);
        data.loadComplete = Math.round(navTiming.loadEventEnd - navTiming.fetchStart);
      }

      // Observe paint timing
      const paintEntries = performance.getEntriesByType('paint');
      paintEntries.forEach(entry => {
        if (entry.name === 'first-contentful-paint') {
          data.FCP = Math.round(entry.startTime);
        }
      });

      // Set up observers for other metrics
      let clsScore = 0;
      let lcpTime = 0;

      // Observe LCP
      if (PerformanceObserver.supportedEntryTypes?.includes('largest-contentful-paint')) {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          lcpTime = Math.round(lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      }

      // Observe CLS
      if (PerformanceObserver.supportedEntryTypes?.includes('layout-shift')) {
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      }

      // Estimate TTI (simplified)
      data.TTI = data.domContentLoaded + 500; // Rough estimate

      // Wait for metrics to be collected
      setTimeout(() => {
        data.LCP = lcpTime;
        data.CLS = Number(clsScore.toFixed(4));
        resolve(data);
      }, 3000);
    });
  });

  // Check for JavaScript errors
  const jsErrors = await page.evaluate(() => {
    return window.__errors || [];
  });

  // Get page size info
  const pageInfo = await page.evaluate(() => {
    const images = document.querySelectorAll('img');
    const scripts = document.querySelectorAll('script');
    const styles = document.querySelectorAll('link[rel="stylesheet"]');

    return {
      imageCount: images.length,
      scriptCount: scripts.length,
      styleCount: styles.length,
      domNodes: document.querySelectorAll('*').length
    };
  });

  return { metrics, jsErrors, pageInfo };
}

// Analyze metrics against thresholds
function analyzeMetrics(metrics) {
  const results = {
    passed: [],
    warnings: [],
    failures: []
  };

  Object.entries(CONFIG.thresholds).forEach(([metric, threshold]) => {
    const value = metrics[metric];
    if (value === undefined || value === 0) return;

    const isTime = metric !== 'CLS';
    const displayValue = isTime ? `${value}ms` : value.toFixed(3);
    const displayThreshold = isTime ? `${threshold}ms` : threshold.toFixed(3);

    if ((isTime && value <= threshold) || (!isTime && value <= threshold)) {
      results.passed.push(`${metric}: ${displayValue} ✓`);
    } else if ((isTime && value <= threshold * 1.5) || (!isTime && value <= threshold * 1.5)) {
      results.warnings.push(`${metric}: ${displayValue} (threshold: ${displayThreshold})`);
    } else {
      results.failures.push(`${metric}: ${displayValue} (threshold: ${displayThreshold})`);
    }
  });

  return results;
}

// Generate HTML report
async function generateReport(allResults) {
  const timestamp = new Date().toISOString();
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Performance Report - ${timestamp}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #333;
      padding: 2rem;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
    }
    h1 { color: #764ba2; margin-bottom: 1rem; }
    h2 { color: #667eea; margin: 2rem 0 1rem; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }
    .metric-card {
      background: #f7f9fc;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
    }
    .metric-value {
      font-size: 2rem;
      font-weight: bold;
      margin: 0.5rem 0;
    }
    .good { color: #10b981; }
    .warning { color: #f59e0b; }
    .poor { color: #ef4444; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }
    th, td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th { background: #f3f4f6; }
    .timestamp { color: #6b7280; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Performance Test Report</h1>
    <p class="timestamp">Generated: ${timestamp}</p>

    <h2>📊 Summary</h2>
    <div class="summary">
      ${Object.entries(CONFIG.thresholds).map(([metric, threshold]) => {
        const values = allResults.filter(r => r.data).map(r => r.data.metrics[metric]).filter(v => v > 0);
        const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        const isTime = metric !== 'CLS';
        const displayValue = isTime ? Math.round(avg) + 'ms' : avg.toFixed(3);
        const status = avg <= threshold ? 'good' : avg <= threshold * 1.5 ? 'warning' : 'poor';

        return `
          <div class="metric-card">
            <div>${metric}</div>
            <div class="metric-value ${status}">${displayValue}</div>
            <div>Target: ${isTime ? threshold + 'ms' : threshold}</div>
          </div>
        `;
      }).join('')}
    </div>

    <h2>📄 Page Results</h2>
    <table>
      <thead>
        <tr>
          <th>Page</th>
          <th>FCP</th>
          <th>LCP</th>
          <th>CLS</th>
          <th>TTFB</th>
          <th>TTI</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${allResults.map(result => result.data ? `
          <tr>
            <td><strong>${result.page}</strong></td>
            <td>${result.data.metrics.FCP}ms</td>
            <td>${result.data.metrics.LCP}ms</td>
            <td>${result.data.metrics.CLS.toFixed(3)}</td>
            <td>${result.data.metrics.TTFB}ms</td>
            <td>${result.data.metrics.TTI}ms</td>
            <td>${result.analysis.failures.length === 0 ?
              '<span class="good">✓ Passed</span>' :
              `<span class="poor">⚠ ${result.analysis.failures.length} issues</span>`
            }</td>
          </tr>
        ` : `
          <tr>
            <td><strong>${result.page}</strong></td>
            <td colspan="5"><span class="poor">Error: ${result.analysis.failures[0]}</span></td>
            <td><span class="poor">⚠ Error</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>📈 Detailed Results</h2>
    ${allResults.map(result => `
      <div style="margin: 2rem 0; padding: 1rem; background: #f9fafb; border-radius: 8px;">
        <h3>${result.page}</h3>
        ${result.analysis.failures.length > 0 ? `
          <p style="color: #ef4444; margin: 0.5rem 0;">
            <strong>Failed:</strong> ${result.analysis.failures.join(', ')}
          </p>
        ` : ''}
        ${result.analysis.warnings.length > 0 ? `
          <p style="color: #f59e0b; margin: 0.5rem 0;">
            <strong>Warnings:</strong> ${result.analysis.warnings.join(', ')}
          </p>
        ` : ''}
        <p style="color: #10b981; margin: 0.5rem 0;">
          <strong>Passed:</strong> ${result.analysis.passed.join(', ')}
        </p>
        ${result.data ? `
        <p style="color: #6b7280; margin: 0.5rem 0; font-size: 0.875rem;">
          Page info: ${result.data.pageInfo.imageCount} images,
          ${result.data.pageInfo.scriptCount} scripts,
          ${result.data.pageInfo.domNodes} DOM nodes
        </p>
        ` : ''}
      </div>
    `).join('')}
  </div>
</body>
</html>`;

  const reportPath = path.join(CONFIG.outputDir, `performance-report-${Date.now()}.html`);
  await fs.mkdir(CONFIG.outputDir, { recursive: true });
  await fs.writeFile(reportPath, html);

  return reportPath;
}

// Main execution
async function main() {
  log.info('\n🚀 Performance Testing Suite');
  log.info('=' .repeat(50));

  const allResults = [];
  let browser = null;

  try {
    // Check server
    if (!await checkServer()) {
      log.error('❌ Server is not running on http://localhost:4173');
      log.info('💡 Run "npm run build && npm run preview" first');
      process.exit(1);
    }

    // Launch browser
    log.info('🌐 Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    // Test each page
    for (const pageConfig of CONFIG.pages) {
      log.info(`\n📄 Testing ${pageConfig.name}...`);

      const page = await browser.newPage();

      // Set up error tracking
      await page.evaluateOnNewDocument(() => {
        window.__errors = [];
        window.addEventListener('error', (e) => {
          window.__errors.push(e.message);
        });
      });

      try {
        const data = await collectMetrics(page, pageConfig.url);
        const analysis = analyzeMetrics(data.metrics);

        // Display results
        if (analysis.failures.length > 0) {
          log.error(`  ❌ Failed: ${analysis.failures.join(', ')}`);
        }
        if (analysis.warnings.length > 0) {
          log.warning(`  ⚠️  Warning: ${analysis.warnings.join(', ')}`);
        }
        if (analysis.passed.length > 0) {
          log.success(`  ✓ Passed: ${analysis.passed.join(', ')}`);
        }

        allResults.push({
          page: pageConfig.name,
          url: pageConfig.url,
          data,
          analysis
        });

      } catch (error) {
        log.error(`  ❌ Error: ${error.message}`);
        allResults.push({
          page: pageConfig.name,
          url: pageConfig.url,
          data: null,
          analysis: { failures: [`Runtime error: ${error.message}`], warnings: [], passed: [] }
        });
      } finally {
        await page.close();
      }
    }

    // Generate report
    const reportPath = await generateReport(allResults);
    log.success(`\n✅ Report saved: ${reportPath}`);

    // Summary
    const totalFailures = allResults.reduce((sum, r) => sum + r.analysis.failures.length, 0);
    const totalWarnings = allResults.reduce((sum, r) => sum + r.analysis.warnings.length, 0);

    log.info('\n' + '=' .repeat(50));
    log.info('📊 Overall Summary:');

    if (totalFailures === 0) {
      log.success(`  ✅ All pages passed performance thresholds!`);
    } else {
      log.error(`  ❌ ${totalFailures} performance issues found`);
    }

    if (totalWarnings > 0) {
      log.warning(`  ⚠️  ${totalWarnings} warnings`);
    }

    process.exit(totalFailures > 0 ? 1 : 0);

  } catch (error) {
    log.error(`\n❌ Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}