#!/usr/bin/env node

/**
 * Create Restore Point Script
 * Creates timestamped backups of all source files for easy rollback
 *
 * Usage: npm run restore:create "description of changes"
 *
 * Backs up:
 *   - src/css/     (stylesheets)
 *   - src/js/      (javascript)
 *   - *.html       (all 6 pages in project root)
 *   - vite.config.js, netlify.toml, package.json, tsconfig.json
 *   - config/      (project configuration)
 *   - .github/workflows/ (CI/CD pipelines)
 */

const fs = require('fs');
const path = require('path');

// Get description from command line or use default
const description = process.argv[2] || 'manual_backup';

// Sanitize description for filename
const safeDescription = description.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

// Create timestamp
const date = new Date();
const timestamp = date.toISOString().slice(0, 19).replace(/[T:]/g, '-');

// Create backup directory name
const backupDir = path.join('backups', `restore_${timestamp}_${safeDescription}`);

// Root-level HTML pages to back up
const HTML_PAGES = ['index.html', 'about.html', 'services.html', 'resources.html', 'impact.html', 'contact.html'];

// Root-level config files to back up
const ROOT_CONFIGS = ['vite.config.js', 'netlify.toml', 'package.json', 'tsconfig.json', '.stylelintrc.json', '.eslintrc.cjs', '.htmlhintrc'];

// Directories to back up (relative to project root)
const BACKUP_DIRS = [
  { src: path.join('src', 'css'), dest: 'css', label: 'CSS' },
  { src: path.join('src', 'js'), dest: 'js', label: 'JavaScript' },
  { src: 'config', dest: 'config', label: 'Config' },
  { src: path.join('.github', 'workflows'), dest: 'workflows', label: 'CI/CD Workflows' }
];

// Helper function to get directory size
function getDirectorySize(dir) {
  let size = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        size += getDirectorySize(fullPath);
      } else {
        size += fs.statSync(fullPath).size;
      }
    }
  } catch (err) {
    // Directory doesn't exist, that's fine
  }
  return size;
}

// Helper to count files recursively
function countFiles(dir, ext) {
  let count = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        count += countFiles(fullPath, ext);
      } else if (!ext || entry.name.endsWith(ext)) {
        count++;
      }
    }
  } catch (err) {
    // Directory doesn't exist
  }
  return count;
}

// Helper function to count !important declarations
function countImportant(dir) {
  let count = 0;
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        count += countImportant(fullPath);
      } else if (entry.name.endsWith('.css')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const matches = content.match(/!important/g);
        if (matches) count += matches.length;
      }
    }
  } catch (err) {
    // Directory doesn't exist
  }
  return count;
}

// Create backup
try {
  fs.mkdirSync(backupDir, { recursive: true });

  const backedUp = { dirs: [], files: [], skipped: [] };

  // 1. Back up directories
  for (const dir of BACKUP_DIRS) {
    if (fs.existsSync(dir.src)) {
      const destPath = path.join(backupDir, dir.dest);
      fs.cpSync(dir.src, destPath, { recursive: true });
      const fileCount = countFiles(dir.src);
      backedUp.dirs.push({ ...dir, fileCount });
    } else {
      backedUp.skipped.push(dir.label);
    }
  }

  // 2. Back up HTML pages
  const htmlDir = path.join(backupDir, 'html');
  fs.mkdirSync(htmlDir, { recursive: true });
  const htmlBacked = [];
  for (const page of HTML_PAGES) {
    if (fs.existsSync(page)) {
      fs.copyFileSync(page, path.join(htmlDir, page));
      htmlBacked.push(page);
    }
  }

  // 3. Back up root config files
  const configDir = path.join(backupDir, 'root-configs');
  fs.mkdirSync(configDir, { recursive: true });
  const configBacked = [];
  for (const file of ROOT_CONFIGS) {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(configDir, file));
      configBacked.push(file);
    }
  }

  // Calculate metrics
  const cssSize = getDirectorySize(path.join('src', 'css'));
  const jsSize = getDirectorySize(path.join('src', 'js'));
  const importantCount = countImportant(path.join('src', 'css'));
  const totalBackupSize = getDirectorySize(backupDir);

  // Create metadata
  const metadata = {
    version: 2,
    created: date.toISOString(),
    description: description,
    safeDescription: safeDescription,
    backup: {
      directory: backupDir,
      directories: backedUp.dirs.map(d => ({ label: d.label, dest: d.dest, files: d.fileCount })),
      htmlPages: htmlBacked,
      rootConfigs: configBacked,
      skipped: backedUp.skipped,
      cssSize: `${(cssSize / 1024).toFixed(2)} KB`,
      jsSize: `${(jsSize / 1024).toFixed(2)} KB`,
      totalSize: `${(totalBackupSize / 1024).toFixed(2)} KB`,
      importantCount: importantCount
    },
    restore: {
      command: `npm run restore:apply ${path.basename(backupDir)}`,
      manual: {
        css: `xcopy /E /I /Y "${backupDir}\\css" "src\\css"`,
        js: `xcopy /E /I /Y "${backupDir}\\js" "src\\js"`,
        html: htmlBacked.map(f => `copy /Y "${backupDir}\\html\\${f}" ".\\${f}"`).join(' && '),
        configs: `xcopy /E /I /Y "${backupDir}\\root-configs\\*" "."`
      }
    }
  };

  // Write metadata
  fs.writeFileSync(
    path.join(backupDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  // Success message
  const dirSummary = backedUp.dirs.map(d => `  ${d.label}: ${d.fileCount} files`).join('\n');
  const skippedMsg = backedUp.skipped.length > 0
    ? `\nSkipped (not found): ${backedUp.skipped.join(', ')}`
    : '';

  console.log(`
Restore Point Created Successfully!
====================================
Location:    ${backupDir}
Description: ${description}
Created:     ${date.toISOString()}

Backed up:
  HTML pages: ${htmlBacked.length} (${htmlBacked.join(', ')})
  Root configs: ${configBacked.length} (${configBacked.join(', ')})
${dirSummary}
  CSS size: ${(cssSize / 1024).toFixed(2)} KB
  JS size: ${(jsSize / 1024).toFixed(2)} KB
  Total backup size: ${(totalBackupSize / 1024).toFixed(2)} KB
  !important count: ${importantCount}${skippedMsg}

To restore from this point:
  npm run restore:apply ${path.basename(backupDir)}
====================================
`);

} catch (error) {
  console.error('Failed to create restore point:', error.message);
  process.exit(1);
}
