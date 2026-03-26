#!/usr/bin/env node

/**
 * Automated Dependency Updater
 * Safely updates dependencies with automatic testing
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Color output
const log = {
  info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
  warning: (msg) => console.log(`\x1b[33m${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m${msg}\x1b[0m`)
};

// Configuration
const CONFIG = {
  backupDir: path.join(__dirname, '../../.dependency-backup'),
  testCommands: [
    'npm run lint',
    'npm run build',
    'npm run test:performance'
  ],
  autoUpdateTypes: ['patch'], // Only auto-update patch versions by default
  requireApproval: ['minor', 'major'],
  maxRetries: 3
};

// Create backup of current state
async function createBackup() {
  log.info('📦 Creating backup...');

  await fs.mkdir(CONFIG.backupDir, { recursive: true });

  // Backup package.json and package-lock.json
  await fs.copyFile(
    path.join(__dirname, '../../package.json'),
    path.join(CONFIG.backupDir, 'package.json')
  );

  await fs.copyFile(
    path.join(__dirname, '../../package-lock.json'),
    path.join(CONFIG.backupDir, 'package-lock.json')
  );

  log.success('✅ Backup created');
}

// Restore from backup
async function restoreBackup() {
  log.warning('🔄 Restoring from backup...');

  await fs.copyFile(
    path.join(CONFIG.backupDir, 'package.json'),
    path.join(__dirname, '../../package.json')
  );

  await fs.copyFile(
    path.join(CONFIG.backupDir, 'package-lock.json'),
    path.join(__dirname, '../../package-lock.json')
  );

  // Reinstall dependencies
  await execAsync('npm ci');

  log.success('✅ Restored from backup');
}

// Run test suite
async function runTests() {
  log.info('🧪 Running test suite...');

  for (const command of CONFIG.testCommands) {
    try {
      log.info(`  Running: ${command}`);
      await execAsync(command);
      log.success(`  ✅ ${command} passed`);
    } catch (error) {
      log.error(`  ❌ ${command} failed`);
      return false;
    }
  }

  return true;
}

// Apply security updates
async function applySecurityUpdates() {
  log.info('🔒 Applying security updates...');

  try {
    const { stdout } = await execAsync('npm audit fix');
    log.success('✅ Security updates applied');
    return true;
  } catch (error) {
    log.error('❌ Security update failed');
    return false;
  }
}

// Update specific packages
async function updatePackages(packages, type) {
  log.info(`📦 Updating ${type} packages...`);

  if (packages.length === 0) {
    log.info('  No packages to update');
    return true;
  }

  const packageList = packages.map(p => `${p.name}@${p.latest}`).join(' ');

  try {
    await execAsync(`npm install ${packageList}`);
    log.success(`✅ Updated ${packages.length} ${type} packages`);
    return true;
  } catch (error) {
    log.error(`❌ Failed to update ${type} packages`);
    return false;
  }
}

// Get outdated packages
async function getOutdatedPackages() {
  try {
    const { stdout } = await execAsync('npm outdated --json');
    return JSON.parse(stdout || '{}');
  } catch (error) {
    if (error.stdout) {
      try {
        return JSON.parse(error.stdout);
      } catch {
        return {};
      }
    }
    return {};
  }
}

// Categorize packages by update type
function categorizePackages(outdated) {
  const packages = {
    patch: [],
    minor: [],
    major: []
  };

  for (const [name, info] of Object.entries(outdated)) {
    const current = info.current || '0.0.0';
    const latest = info.latest;

    const [currMajor, currMinor] = current.split('.');
    const [latestMajor, latestMinor] = latest.split('.');

    const pkg = { name, current, latest, wanted: info.wanted };

    if (currMajor !== latestMajor) {
      packages.major.push(pkg);
    } else if (currMinor !== latestMinor) {
      packages.minor.push(pkg);
    } else {
      packages.patch.push(pkg);
    }
  }

  return packages;
}

// Main update process
async function performUpdate(options = {}) {
  const {
    interactive = false,
    force = false,
    types = CONFIG.autoUpdateTypes
  } = options;

  log.info('\n🚀 Automated Dependency Update');
  log.info('=' .repeat(50));

  let success = true;

  try {
    // Create backup
    await createBackup();

    // Apply security updates first
    if (await applySecurityUpdates()) {
      if (!await runTests()) {
        log.error('❌ Tests failed after security updates');
        await restoreBackup();
        return false;
      }
    }

    // Get outdated packages
    const outdated = await getOutdatedPackages();
    const packages = categorizePackages(outdated);

    // Update packages by type
    for (const type of types) {
      if (packages[type].length === 0) continue;

      if (CONFIG.requireApproval.includes(type) && !force && !interactive) {
        log.warning(`⚠️  ${packages[type].length} ${type} updates require approval`);
        continue;
      }

      if (interactive) {
        // TODO: Add interactive prompts
        log.info(`Would update ${packages[type].length} ${type} packages`);
        continue;
      }

      // Apply updates
      if (await updatePackages(packages[type], type)) {
        // Run tests after each update type
        if (!await runTests()) {
          log.error(`❌ Tests failed after ${type} updates`);
          await restoreBackup();
          return false;
        }
      } else {
        log.error(`❌ Failed to apply ${type} updates`);
        await restoreBackup();
        return false;
      }
    }

    // Clean up backup on success
    await fs.rm(CONFIG.backupDir, { recursive: true, force: true });
    log.success('\n✅ All updates completed successfully!');

  } catch (error) {
    log.error(`\n❌ Update process failed: ${error.message}`);
    await restoreBackup();
    success = false;
  }

  return success;
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    interactive: args.includes('--interactive') || args.includes('-i'),
    force: args.includes('--force') || args.includes('-f'),
    types: []
  };

  // Parse update types
  if (args.includes('--all')) {
    options.types = ['patch', 'minor', 'major'];
  } else {
    if (args.includes('--patch')) options.types.push('patch');
    if (args.includes('--minor')) options.types.push('minor');
    if (args.includes('--major')) options.types.push('major');
  }

  // Default to patch updates only
  if (options.types.length === 0) {
    options.types = ['patch'];
  }

  // Show help
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Automated Dependency Updater

Usage:
  node auto-update.js [options]

Options:
  --patch         Update patch versions (default)
  --minor         Update minor versions
  --major         Update major versions
  --all           Update all types
  --force, -f     Skip approval for minor/major updates
  --interactive   Interactive mode (coming soon)
  --help, -h      Show this help

Examples:
  node auto-update.js                    # Update patch versions only
  node auto-update.js --patch --minor    # Update patch and minor
  node auto-update.js --all --force      # Update everything without approval
`);
    process.exit(0);
  }

  // Perform update
  const success = await performUpdate(options);
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}

export { performUpdate };