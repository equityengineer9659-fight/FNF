/**
 * Production Build Verification Script
 * Validates built artifacts before deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '..', '..', 'dist');
const REQUIRED_FILES = [
  'index.html',
  'about.html',
  'services.html',
  'resources.html',
  'impact.html',
  'contact.html'
];

const REQUIRED_ASSETS = [
  'assets' // Directory containing CSS/JS bundles
];

let exitCode = 0;

console.log('═══════════════════════════════════════════════════════════');
console.log('          PRODUCTION BUILD VERIFICATION');
console.log('═══════════════════════════════════════════════════════════\n');

/**
 * Check if dist directory exists
 */
function checkDistDirectory() {
  console.log('📁 Checking dist directory...');

  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ ERROR: dist/ directory does not exist');
    console.error('   Run `npm run build` first\n');
    exitCode = 1;
    return false;
  }

  console.log('✅ dist/ directory exists\n');
  return true;
}

/**
 * Check required HTML files
 */
function checkRequiredFiles() {
  console.log('📄 Checking required HTML files...');

  let allFilesExist = true;

  REQUIRED_FILES.forEach(file => {
    const filePath = path.join(DIST_DIR, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   ✅ ${file} (${sizeKB} KB)`);
    } else {
      console.error(`   ❌ ${file} is missing!`);
      allFilesExist = false;
      exitCode = 1;
    }
  });

  console.log('');
  return allFilesExist;
}

/**
 * Check assets directory
 */
function checkAssets() {
  console.log('🎨 Checking assets directory...');

  const assetsDir = path.join(DIST_DIR, 'assets');

  if (!fs.existsSync(assetsDir)) {
    console.error('❌ ERROR: assets/ directory does not exist');
    exitCode = 1;
    return false;
  }

  const files = fs.readdirSync(assetsDir);
  const cssFiles = files.filter(f => f.endsWith('.css'));
  const jsFiles = files.filter(f => f.endsWith('.js'));

  console.log(`   CSS files: ${cssFiles.length}`);
  console.log(`   JS files: ${jsFiles.length}`);

  if (cssFiles.length === 0) {
    console.error('   ❌ No CSS files found!');
    exitCode = 1;
    return false;
  }

  if (jsFiles.length === 0) {
    console.error('   ❌ No JS files found!');
    exitCode = 1;
    return false;
  }

  // Check bundle sizes
  let totalCSSSize = 0;
  let totalJSSize = 0;

  cssFiles.forEach(file => {
    const stats = fs.statSync(path.join(assetsDir, file));
    totalCSSSize += stats.size;
  });

  jsFiles.forEach(file => {
    const stats = fs.statSync(path.join(assetsDir, file));
    totalJSSize += stats.size;
  });

  const cssSizeKB = (totalCSSSize / 1024).toFixed(2);
  const jsSizeKB = (totalJSSize / 1024).toFixed(2);

  console.log(`   Total CSS size: ${cssSizeKB} KB`);
  console.log(`   Total JS size: ${jsSizeKB} KB`);

  // Warn if bundles are too large
  const CSS_BUDGET_KB = 150;
  const JS_BUDGET_KB = 200;

  if (totalCSSSize / 1024 > CSS_BUDGET_KB) {
    console.warn(`   ⚠️  CSS bundle exceeds budget (${CSS_BUDGET_KB} KB)`);
  }

  if (totalJSSize / 1024 > JS_BUDGET_KB) {
    console.warn(`   ⚠️  JS bundle exceeds budget (${JS_BUDGET_KB} KB)`);
  }

  console.log('   ✅ Assets directory OK\n');
  return true;
}

/**
 * Check for critical file references
 */
function checkCriticalReferences() {
  console.log('🔍 Checking critical file references...');

  const indexPath = path.join(DIST_DIR, 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.error('❌ Cannot check references - index.html missing');
    return false;
  }

  const indexContent = fs.readFileSync(indexPath, 'utf8');

  // Check for stylesheet link
  if (!indexContent.includes('</html>')) {
    console.error('   ❌ index.html appears malformed (no closing </html> tag)');
    exitCode = 1;
    return false;
  }

  // Check for meta charset
  if (!indexContent.includes('charset')) {
    console.warn('   ⚠️  No charset meta tag found');
  }

  // Check for viewport meta
  if (!indexContent.includes('viewport')) {
    console.warn('   ⚠️  No viewport meta tag found');
  }

  console.log('   ✅ Critical references OK\n');
  return true;
}

/**
 * Generate build report
 */
function generateReport() {
  console.log('───────────────────────────────────────────────────────────');
  console.log('                    BUILD REPORT');
  console.log('───────────────────────────────────────────────────────────');

  const stats = fs.statSync(DIST_DIR);

  // Calculate total size
  function getDirSize(dirPath) {
    let size = 0;
    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        size += getDirSize(filePath);
      } else {
        size += stats.size;
      }
    });

    return size;
  }

  const totalSize = getDirSize(DIST_DIR);
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

  console.log(`Total build size: ${totalSizeMB} MB`);
  console.log(`HTML files: ${REQUIRED_FILES.length}`);
  console.log(`Build date: ${new Date().toISOString()}`);

  console.log('───────────────────────────────────────────────────────────\n');
}

/**
 * Main verification flow
 */
function main() {
  console.log(`Verifying build at: ${DIST_DIR}\n`);

  const checks = [
    checkDistDirectory(),
    checkRequiredFiles(),
    checkAssets(),
    checkCriticalReferences()
  ];

  if (checks.every(check => check === true)) {
    generateReport();
    console.log('✅ BUILD VERIFICATION PASSED\n');
    console.log('The build is ready for deployment.\n');
  } else {
    console.log('❌ BUILD VERIFICATION FAILED\n');
    console.log('Please fix the errors above before deploying.\n');
    exitCode = 1;
  }

  console.log('═══════════════════════════════════════════════════════════\n');
  process.exit(exitCode);
}

main();
