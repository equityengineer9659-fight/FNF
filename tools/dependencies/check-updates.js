#!/usr/bin/env node

/**
 * Dependency Update Checker
 * Checks for outdated packages and security vulnerabilities
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Color output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}${msg}${colors.reset}`)
};

// Configuration
const CONFIG = {
  excludePatterns: [
    '@types/node', // Often has breaking changes
    'eslint-config-airbnb-base' // Strict about peer deps
  ],
  majorUpdateWhitelist: [
    // Packages safe for major updates
    'autoprefixer',
    'cssnano',
    'postcss'
  ],
  reportPath: path.join(__dirname, '../../dependency-report.html')
};

// Check for outdated packages
async function checkOutdated() {
  log.info('\n📦 Checking for outdated packages...\n');

  try {
    const { stdout } = await execAsync('npm outdated --json');
    const outdated = JSON.parse(stdout || '{}');

    const packages = {
      patch: [],
      minor: [],
      major: []
    };

    for (const [name, info] of Object.entries(outdated)) {
      const current = info.current || '0.0.0';
      const wanted = info.wanted;
      const latest = info.latest;

      // Skip excluded packages
      if (CONFIG.excludePatterns.some(pattern => name.includes(pattern))) {
        continue;
      }

      // Determine update type
      const [currMajor, currMinor] = current.split('.');
      const [latestMajor, latestMinor, latestPatch] = latest.split('.');

      if (currMajor !== latestMajor) {
        packages.major.push({
          name,
          current,
          latest,
          type: info.type
        });
      } else if (currMinor !== latestMinor) {
        packages.minor.push({
          name,
          current,
          latest,
          type: info.type
        });
      } else {
        packages.patch.push({
          name,
          current,
          latest,
          type: info.type
        });
      }
    }

    return packages;
  } catch (error) {
    // npm outdated returns non-zero exit code when packages are outdated
    if (error.stdout) {
      try {
        const outdated = JSON.parse(error.stdout);
        return processOutdated(outdated);
      } catch {
        return { patch: [], minor: [], major: [] };
      }
    }
    return { patch: [], minor: [], major: [] };
  }
}

// Process outdated packages
function processOutdated(outdated) {
  const packages = {
    patch: [],
    minor: [],
    major: []
  };

  for (const [name, info] of Object.entries(outdated)) {
    const current = info.current || '0.0.0';
    const latest = info.latest;

    // Skip excluded packages
    if (CONFIG.excludePatterns.some(pattern => name.includes(pattern))) {
      continue;
    }

    // Determine update type
    const currParts = current.split('.');
    const latestParts = latest.split('.');

    if (currParts[0] !== latestParts[0]) {
      packages.major.push({
        name,
        current,
        latest,
        type: info.type
      });
    } else if (currParts[1] !== latestParts[1]) {
      packages.minor.push({
        name,
        current,
        latest,
        type: info.type
      });
    } else if (currParts[2] !== latestParts[2]) {
      packages.patch.push({
        name,
        current,
        latest,
        type: info.type
      });
    }
  }

  return packages;
}

// Check for security vulnerabilities
async function checkSecurity() {
  log.info('\n🔒 Checking for security vulnerabilities...\n');

  try {
    const { stdout } = await execAsync('npm audit --json');
    const audit = JSON.parse(stdout);

    const vulnerabilities = {
      info: 0,
      low: 0,
      moderate: 0,
      high: 0,
      critical: 0,
      total: audit.metadata.vulnerabilities.total
    };

    // Count vulnerabilities by severity
    for (const [severity, count] of Object.entries(audit.metadata.vulnerabilities)) {
      if (severity !== 'total') {
        vulnerabilities[severity] = count;
      }
    }

    // Get vulnerability details
    const details = [];
    if (audit.vulnerabilities) {
      for (const [pkg, data] of Object.entries(audit.vulnerabilities)) {
        details.push({
          package: pkg,
          severity: data.severity,
          isDirect: data.isDirect,
          via: data.via,
          fixAvailable: data.fixAvailable
        });
      }
    }

    return { vulnerabilities, details };
  } catch (error) {
    // npm audit returns non-zero exit code when vulnerabilities exist
    if (error.stdout) {
      try {
        const audit = JSON.parse(error.stdout);
        return processAudit(audit);
      } catch {
        return { vulnerabilities: { total: 0 }, details: [] };
      }
    }
    return { vulnerabilities: { total: 0 }, details: [] };
  }
}

// Process audit results
function processAudit(audit) {
  const vulnerabilities = {
    info: 0,
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
    total: 0
  };

  if (audit.metadata && audit.metadata.vulnerabilities) {
    Object.assign(vulnerabilities, audit.metadata.vulnerabilities);
  }

  const details = [];
  if (audit.vulnerabilities) {
    for (const [pkg, data] of Object.entries(audit.vulnerabilities)) {
      details.push({
        package: pkg,
        severity: data.severity,
        isDirect: data.isDirect,
        via: Array.isArray(data.via) ? data.via[0] : data.via,
        fixAvailable: data.fixAvailable
      });
    }
  }

  return { vulnerabilities, details };
}

// Generate update commands
function generateCommands(packages) {
  const commands = [];

  // Safe patch updates
  if (packages.patch.length > 0) {
    const pkgs = packages.patch.map(p => `${p.name}@latest`).join(' ');
    commands.push({
      type: 'patch',
      command: `npm update ${packages.patch.map(p => p.name).join(' ')}`,
      description: 'Safe patch updates'
    });
  }

  // Minor updates
  if (packages.minor.length > 0) {
    const pkgs = packages.minor.map(p => `${p.name}@latest`).join(' ');
    commands.push({
      type: 'minor',
      command: `npm install ${pkgs}`,
      description: 'Minor version updates (usually safe)'
    });
  }

  // Major updates (requires review)
  if (packages.major.length > 0) {
    const safePackages = packages.major.filter(p =>
      CONFIG.majorUpdateWhitelist.some(safe => p.name.includes(safe))
    );

    if (safePackages.length > 0) {
      const pkgs = safePackages.map(p => `${p.name}@latest`).join(' ');
      commands.push({
        type: 'major-safe',
        command: `npm install ${pkgs}`,
        description: 'Major updates (pre-approved packages)'
      });
    }

    const riskyPackages = packages.major.filter(p =>
      !CONFIG.majorUpdateWhitelist.some(safe => p.name.includes(safe))
    );

    if (riskyPackages.length > 0) {
      riskyPackages.forEach(pkg => {
        commands.push({
          type: 'major-risky',
          command: `npm install ${pkg.name}@latest`,
          description: `Major update for ${pkg.name} (review needed)`
        });
      });
    }
  }

  return commands;
}

// Generate HTML report
async function generateReport(packages, security, commands) {
  const timestamp = new Date().toISOString();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dependency Update Report - ${timestamp}</title>
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
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }
    .card {
      background: #f7f9fc;
      padding: 1rem;
      border-radius: 8px;
      text-align: center;
    }
    .card-value {
      font-size: 2rem;
      font-weight: bold;
      margin: 0.5rem 0;
    }
    .patch { color: #10b981; }
    .minor { color: #3b82f6; }
    .major { color: #f59e0b; }
    .critical { color: #ef4444; }
    .high { color: #f97316; }
    .moderate { color: #eab308; }
    .low { color: #84cc16; }
    .info { color: #06b6d4; }
    .safe { color: #10b981; }
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
    .command {
      background: #1f2937;
      color: #10b981;
      padding: 1rem;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      margin: 0.5rem 0;
      overflow-x: auto;
    }
    .timestamp { color: #6b7280; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📦 Dependency Update Report</h1>
    <p class="timestamp">Generated: ${timestamp}</p>

    <h2>📊 Summary</h2>
    <div class="summary">
      <div class="card">
        <div>Patch Updates</div>
        <div class="card-value patch">${packages.patch.length}</div>
      </div>
      <div class="card">
        <div>Minor Updates</div>
        <div class="card-value minor">${packages.minor.length}</div>
      </div>
      <div class="card">
        <div>Major Updates</div>
        <div class="card-value major">${packages.major.length}</div>
      </div>
      <div class="card">
        <div>Vulnerabilities</div>
        <div class="card-value ${security.vulnerabilities.total > 0 ? 'critical' : 'safe'}">${security.vulnerabilities.total}</div>
      </div>
    </div>

    ${security.vulnerabilities.total > 0 ? `
    <h2>🔒 Security Vulnerabilities</h2>
    <div class="summary">
      ${security.vulnerabilities.critical > 0 ? `<div class="card"><div>Critical</div><div class="card-value critical">${security.vulnerabilities.critical}</div></div>` : ''}
      ${security.vulnerabilities.high > 0 ? `<div class="card"><div>High</div><div class="card-value high">${security.vulnerabilities.high}</div></div>` : ''}
      ${security.vulnerabilities.moderate > 0 ? `<div class="card"><div>Moderate</div><div class="card-value moderate">${security.vulnerabilities.moderate}</div></div>` : ''}
      ${security.vulnerabilities.low > 0 ? `<div class="card"><div>Low</div><div class="card-value low">${security.vulnerabilities.low}</div></div>` : ''}
    </div>
    ` : ''}

    <h2>📝 Update Commands</h2>
    ${commands.map(cmd => `
      <div>
        <p><strong>${cmd.description}</strong></p>
        <div class="command">${cmd.command}</div>
      </div>
    `).join('')}

    ${packages.patch.length > 0 ? `
    <h2>🟢 Patch Updates</h2>
    <table>
      <thead>
        <tr>
          <th>Package</th>
          <th>Current</th>
          <th>Latest</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        ${packages.patch.map(pkg => `
          <tr>
            <td><strong>${pkg.name}</strong></td>
            <td>${pkg.current}</td>
            <td>${pkg.latest}</td>
            <td>${pkg.type}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    ${packages.minor.length > 0 ? `
    <h2>🔵 Minor Updates</h2>
    <table>
      <thead>
        <tr>
          <th>Package</th>
          <th>Current</th>
          <th>Latest</th>
          <th>Type</th>
        </tr>
      </thead>
      <tbody>
        ${packages.minor.map(pkg => `
          <tr>
            <td><strong>${pkg.name}</strong></td>
            <td>${pkg.current}</td>
            <td>${pkg.latest}</td>
            <td>${pkg.type}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    ${packages.major.length > 0 ? `
    <h2>🟡 Major Updates</h2>
    <table>
      <thead>
        <tr>
          <th>Package</th>
          <th>Current</th>
          <th>Latest</th>
          <th>Type</th>
          <th>Safe?</th>
        </tr>
      </thead>
      <tbody>
        ${packages.major.map(pkg => `
          <tr>
            <td><strong>${pkg.name}</strong></td>
            <td>${pkg.current}</td>
            <td>${pkg.latest}</td>
            <td>${pkg.type}</td>
            <td>${CONFIG.majorUpdateWhitelist.some(safe => pkg.name.includes(safe)) ? '✅ Yes' : '⚠️ Review'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}

    ${security.details.length > 0 ? `
    <h2>🛡️ Vulnerability Details</h2>
    <table>
      <thead>
        <tr>
          <th>Package</th>
          <th>Severity</th>
          <th>Direct?</th>
          <th>Fix Available?</th>
        </tr>
      </thead>
      <tbody>
        ${security.details.map(vuln => `
          <tr>
            <td><strong>${vuln.package}</strong></td>
            <td class="${vuln.severity}">${vuln.severity}</td>
            <td>${vuln.isDirect ? 'Yes' : 'No'}</td>
            <td>${vuln.fixAvailable ? '✅ Yes' : '❌ No'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : ''}
  </div>
</body>
</html>`;

  await fs.writeFile(CONFIG.reportPath, html);
  return CONFIG.reportPath;
}

// Main execution
async function main() {
  log.info('\n🔍 Dependency Update Check');
  log.info('=' .repeat(50));

  try {
    // Check for outdated packages
    const packages = await checkOutdated();

    // Display outdated summary
    if (packages.patch.length > 0) {
      log.success(`\n✅ ${packages.patch.length} patch updates available`);
    }
    if (packages.minor.length > 0) {
      log.warning(`⚠️  ${packages.minor.length} minor updates available`);
    }
    if (packages.major.length > 0) {
      log.warning(`⚠️  ${packages.major.length} major updates available`);
    }

    // Check security
    const security = await checkSecurity();

    // Display security summary
    if (security.vulnerabilities.total === 0) {
      log.success('\n✅ No security vulnerabilities found!');
    } else {
      log.error(`\n❌ ${security.vulnerabilities.total} vulnerabilities found`);
      if (security.vulnerabilities.critical > 0) {
        log.error(`   Critical: ${security.vulnerabilities.critical}`);
      }
      if (security.vulnerabilities.high > 0) {
        log.error(`   High: ${security.vulnerabilities.high}`);
      }
      if (security.vulnerabilities.moderate > 0) {
        log.warning(`   Moderate: ${security.vulnerabilities.moderate}`);
      }
      if (security.vulnerabilities.low > 0) {
        log.warning(`   Low: ${security.vulnerabilities.low}`);
      }
    }

    // Generate update commands
    const commands = generateCommands(packages);

    // Generate report
    const reportPath = await generateReport(packages, security, commands);
    log.success(`\n📄 Report saved: ${reportPath}`);

    // Display recommended actions
    log.info('\n📋 Recommended Actions:');

    if (security.vulnerabilities.critical > 0 || security.vulnerabilities.high > 0) {
      log.error('1. Fix security vulnerabilities immediately:');
      log.info('   npm audit fix');
    }

    if (packages.patch.length > 0) {
      log.success('2. Apply patch updates (safe):');
      log.info(`   npm update ${packages.patch.map(p => p.name).join(' ')}`);
    }

    if (packages.minor.length > 0) {
      log.warning('3. Review and apply minor updates:');
      log.info(`   npm install ${packages.minor.map(p => p.name + '@latest').join(' ')}`);
    }

    if (packages.major.length > 0) {
      log.warning('4. Carefully review major updates before applying');
    }

    // Exit with appropriate code
    const hasIssues = security.vulnerabilities.total > 0 ||
                     packages.major.length > 0 ||
                     packages.minor.length > 0 ||
                     packages.patch.length > 0;

    process.exit(hasIssues ? 1 : 0);

  } catch (error) {
    log.error(`\n❌ Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}

export { checkOutdated, checkSecurity };