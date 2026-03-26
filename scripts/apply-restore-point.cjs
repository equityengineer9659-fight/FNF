#!/usr/bin/env node

/**
 * Apply Restore Point Script
 * Restores all backed-up files from a previous restore point
 *
 * Usage:
 *   npm run restore:apply <backup-name>       # Restore everything
 *   npm run restore:apply <backup-name> css    # Restore CSS only
 *   npm run restore:apply <backup-name> js     # Restore JS only
 *   npm run restore:apply <backup-name> html   # Restore HTML only
 *   npm run restore:apply                      # List available restore points
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const backupsDir = 'backups';

// Helper to prompt user
function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Get list of restore points
function getRestorePoints() {
  try {
    const dirs = fs.readdirSync(backupsDir);
    const restorePoints = [];

    for (const dir of dirs) {
      if (!dir.startsWith('restore_')) continue;
      const metadataPath = path.join(backupsDir, dir, 'metadata.json');
      if (fs.existsSync(metadataPath)) {
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        restorePoints.push({ name: dir, ...metadata });
      }
    }

    return restorePoints.sort((a, b) => new Date(b.created) - new Date(a.created));
  } catch (err) {
    console.error('Error reading restore points:', err.message);
    return [];
  }
}

// Create a safety backup of current state before restoring
function createSafetyBackup() {
  const safetyDir = path.join(backupsDir, `safety_${Date.now()}`);
  fs.mkdirSync(safetyDir, { recursive: true });

  // Back up src/css
  const cssSrc = path.join('src', 'css');
  if (fs.existsSync(cssSrc)) {
    fs.cpSync(cssSrc, path.join(safetyDir, 'css'), { recursive: true });
  }

  // Back up src/js
  const jsSrc = path.join('src', 'js');
  if (fs.existsSync(jsSrc)) {
    fs.cpSync(jsSrc, path.join(safetyDir, 'js'), { recursive: true });
  }

  // Back up HTML pages
  const htmlPages = ['index.html', 'about.html', 'services.html', 'resources.html', 'impact.html', 'contact.html'];
  const htmlDir = path.join(safetyDir, 'html');
  fs.mkdirSync(htmlDir, { recursive: true });
  for (const page of htmlPages) {
    if (fs.existsSync(page)) {
      fs.copyFileSync(page, path.join(htmlDir, page));
    }
  }

  // Back up root configs
  const rootConfigs = ['vite.config.js', 'netlify.toml', 'package.json', 'tsconfig.json', '.stylelintrc.json', '.eslintrc.cjs', '.htmlhintrc'];
  const configDir = path.join(safetyDir, 'root-configs');
  fs.mkdirSync(configDir, { recursive: true });
  for (const file of rootConfigs) {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(configDir, file));
    }
  }

  // Back up config/
  if (fs.existsSync('config')) {
    fs.cpSync('config', path.join(safetyDir, 'config'), { recursive: true });
  }

  // Back up workflows
  const workflowsSrc = path.join('.github', 'workflows');
  if (fs.existsSync(workflowsSrc)) {
    fs.cpSync(workflowsSrc, path.join(safetyDir, 'workflows'), { recursive: true });
  }

  return safetyDir;
}

// Restore a specific component
function restoreComponent(backupPath, component) {
  const restored = [];

  if (component === 'all' || component === 'css') {
    const src = path.join(backupPath, 'css');
    const dest = path.join('src', 'css');
    if (fs.existsSync(src)) {
      fs.rmSync(dest, { recursive: true, force: true });
      fs.cpSync(src, dest, { recursive: true });
      restored.push('CSS');
    }
  }

  if (component === 'all' || component === 'js') {
    const src = path.join(backupPath, 'js');
    const dest = path.join('src', 'js');
    if (fs.existsSync(src)) {
      fs.rmSync(dest, { recursive: true, force: true });
      fs.cpSync(src, dest, { recursive: true });
      restored.push('JavaScript');
    }
  }

  if (component === 'all' || component === 'html') {
    const src = path.join(backupPath, 'html');
    if (fs.existsSync(src)) {
      const pages = fs.readdirSync(src).filter(f => f.endsWith('.html'));
      for (const page of pages) {
        fs.copyFileSync(path.join(src, page), page);
      }
      restored.push(`HTML (${pages.length} pages)`);
    }
  }

  if (component === 'all' || component === 'config') {
    // Root config files
    const rootConfigSrc = path.join(backupPath, 'root-configs');
    if (fs.existsSync(rootConfigSrc)) {
      const files = fs.readdirSync(rootConfigSrc);
      for (const file of files) {
        fs.copyFileSync(path.join(rootConfigSrc, file), file);
      }
      restored.push(`Root configs (${files.length} files)`);
    }

    // config/ directory
    const configSrc = path.join(backupPath, 'config');
    if (fs.existsSync(configSrc)) {
      fs.cpSync(configSrc, 'config', { recursive: true });
      restored.push('Config directory');
    }

    // CI/CD workflows
    const workflowSrc = path.join(backupPath, 'workflows');
    const workflowDest = path.join('.github', 'workflows');
    if (fs.existsSync(workflowSrc)) {
      fs.mkdirSync(workflowDest, { recursive: true });
      fs.cpSync(workflowSrc, workflowDest, { recursive: true });
      restored.push('CI/CD Workflows');
    }
  }

  return restored;
}

// Apply a restore point
function applyRestore(backupName, component) {
  const backupPath = path.join(backupsDir, backupName);

  if (!fs.existsSync(backupPath)) {
    console.error(`Restore point not found: ${backupName}`);
    return false;
  }

  try {
    // Create safety backup first
    const safetyDir = createSafetyBackup();

    // Perform restore
    const restored = restoreComponent(backupPath, component);

    if (restored.length === 0) {
      console.log(`Nothing to restore for component "${component}" in ${backupName}`);
      // Clean up empty safety backup
      fs.rmSync(safetyDir, { recursive: true, force: true });
      return false;
    }

    // Read metadata
    const metadataPath = path.join(backupPath, 'metadata.json');
    let metadata = {};
    if (fs.existsSync(metadataPath)) {
      metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    }

    console.log(`
Restore Point Applied Successfully!
====================================
Restored from: ${backupName}
Description:   ${metadata.description || 'No description'}
Created:       ${metadata.created || 'Unknown date'}
Component:     ${component === 'all' ? 'Everything' : component}
Safety backup: ${safetyDir}

Restored:
${restored.map(r => `  - ${r}`).join('\n')}

Next steps:
  1. Run: npm run build
  2. Test the site visually
  3. If issues, undo with:
     npm run restore:apply ${path.basename(safetyDir)}
====================================
`);
    return true;
  } catch (error) {
    console.error('Failed to apply restore point:', error.message);
    return false;
  }
}

// Main function
async function main() {
  const backupName = process.argv[2];
  const component = process.argv[3] || 'all'; // all, css, js, html, config

  if (backupName) {
    applyRestore(backupName, component);
  } else {
    // Show list
    const restorePoints = getRestorePoints();

    if (restorePoints.length === 0) {
      console.log('No restore points found. Create one with: npm run restore:create "description"');
      return;
    }

    console.log('\nAvailable Restore Points:\n');
    console.log('=========================================================================');

    restorePoints.forEach((point, index) => {
      const dateStr = new Date(point.created).toLocaleString();
      const isV2 = point.version === 2;
      const htmlCount = isV2 ? (point.backup.htmlPages || []).length : 0;
      const configCount = isV2 ? (point.backup.rootConfigs || []).length : 0;
      const sizeStr = point.backup ? point.backup.totalSize : 'unknown';

      console.log(`${index + 1}. ${point.description || 'No description'}`);
      console.log(`   Date: ${dateStr}`);
      console.log(`   Name: ${point.name}`);
      if (isV2) {
        console.log(`   Contents: HTML:${htmlCount} pages | Configs:${configCount} | Size:${sizeStr}`);
      } else {
        console.log(`   Contents: CSS+JS only (v1 backup) | Size:${sizeStr}`);
      }
      console.log('');
    });

    console.log('=========================================================================');
    console.log('\nUsage:');
    console.log('  npm run restore:apply <name>          # Restore everything');
    console.log('  npm run restore:apply <name> css      # Restore CSS only');
    console.log('  npm run restore:apply <name> js       # Restore JS only');
    console.log('  npm run restore:apply <name> html     # Restore HTML only');
    console.log('  npm run restore:apply <name> config   # Restore configs only');

    const choice = await prompt('\nEnter number to restore (or 0 to cancel): ');
    const index = parseInt(choice) - 1;

    if (index >= 0 && index < restorePoints.length) {
      const confirmed = await prompt(`\nThis will replace files from the backup. Continue? (y/n): `);
      if (confirmed.toLowerCase() === 'y') {
        const componentChoice = await prompt('Restore [a]ll, [c]ss, [j]s, [h]tml, or con[f]ig? (a): ');
        const componentMap = { a: 'all', c: 'css', j: 'js', h: 'html', f: 'config', '': 'all' };
        const selectedComponent = componentMap[componentChoice.toLowerCase()] || 'all';
        applyRestore(restorePoints[index].name, selectedComponent);
      } else {
        console.log('Restore cancelled.');
      }
    } else if (choice !== '0') {
      console.log('Invalid selection.');
    } else {
      console.log('Restore cancelled.');
    }
  }
}

main();
