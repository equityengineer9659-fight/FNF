/**
 * PWA Icon Generation Script
 * Generates required PWA icons and favicon from a source logo
 *
 * Usage:
 *   npm run generate:icons
 *
 * Requirements:
 *   - Source logo file at: src/assets/logo.svg (or .png)
 *   - sharp package installed: npm install sharp --save-dev
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SOURCE_LOGO = path.join(__dirname, '..', 'src', 'assets', 'logo.svg');
const OUTPUT_DIR = path.join(__dirname, '..');
const ASSETS_DIR = path.join(__dirname, '..', 'src', 'assets');

const ICON_SIZES = [
  { size: 192, name: 'icon-192x192.png', purpose: 'PWA minimum size' },
  { size: 512, name: 'icon-512x512.png', purpose: 'PWA maximum size' },
  { size: 180, name: 'apple-touch-icon.png', purpose: 'Apple iOS' },
  { size: 32, name: 'favicon-32x32.png', purpose: 'Standard favicon' },
  { size: 16, name: 'favicon-16x16.png', purpose: 'Small favicon' }
];

const OG_IMAGE_SIZE = { width: 1200, height: 630, name: 'og-image.png', purpose: 'Social media preview' };

console.log('═══════════════════════════════════════════════════════════');
console.log('           PWA ICON GENERATION SCRIPT');
console.log('═══════════════════════════════════════════════════════════\n');

/**
 * Check if sharp is available
 */
async function checkSharpAvailable() {
  try {
    await import('sharp');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Check if source logo exists
 */
function checkSourceLogo() {
  console.log('📁 Checking source logo...');

  // Try SVG first
  if (fs.existsSync(SOURCE_LOGO)) {
    console.log(`✅ Found source logo: ${path.basename(SOURCE_LOGO)}\n`);
    return SOURCE_LOGO;
  }

  // Try PNG
  const pngSource = SOURCE_LOGO.replace('.svg', '.png');
  if (fs.existsSync(pngSource)) {
    console.log(`✅ Found source logo: ${path.basename(pngSource)}\n`);
    return pngSource;
  }

  console.error('❌ No source logo found!');
  console.error(`   Expected: ${SOURCE_LOGO}`);
  console.error(`   Or: ${pngSource}\n`);
  return null;
}

/**
 * Generate icons using sharp (if available)
 */
async function generateIconsWithSharp(sourceLogo) {
  console.log('🎨 Generating icons with sharp...\n');

  const sharp = await import('sharp');
  let successCount = 0;

  // Generate standard icons
  for (const icon of ICON_SIZES) {
    try {
      const outputPath = path.join(OUTPUT_DIR, icon.name);

      await sharp.default(sourceLogo)
        .resize(icon.size, icon.size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated ${icon.name} (${icon.size}x${icon.size}) - ${icon.purpose}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to generate ${icon.name}: ${error.message}`);
    }
  }

  // Generate OG image
  try {
    const ogPath = path.join(OUTPUT_DIR, OG_IMAGE_SIZE.name);

    await sharp.default(sourceLogo)
      .resize(OG_IMAGE_SIZE.width, OG_IMAGE_SIZE.height, {
        fit: 'contain',
        background: { r: 1, g: 118, b: 211, alpha: 1 } // FnF primary blue
      })
      .png()
      .toFile(ogPath);

    console.log(`✅ Generated ${OG_IMAGE_SIZE.name} (${OG_IMAGE_SIZE.width}x${OG_IMAGE_SIZE.height}) - ${OG_IMAGE_SIZE.purpose}`);
    successCount++;
  } catch (error) {
    console.error(`❌ Failed to generate og-image.png: ${error.message}`);
  }

  // Generate favicon.ico (multi-size)
  try {
    const faviconPath = path.join(OUTPUT_DIR, 'favicon.ico');

    // Generate 16x16 and 32x32 versions
    const sizes = [16, 32];
    const buffers = await Promise.all(
      sizes.map(size =>
        sharp.default(sourceLogo)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 0 }
          })
          .png()
          .toBuffer()
      )
    );

    // Note: sharp doesn't support ICO format directly
    // We'll create the largest PNG as a fallback
    await sharp.default(sourceLogo)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(faviconPath.replace('.ico', '.png'));

    console.log(`✅ Generated favicon.png (32x32) - Use online converter for .ico`);
    console.log(`   Recommended: https://favicon.io/favicon-converter/`);
    successCount++;
  } catch (error) {
    console.error(`❌ Failed to generate favicon: ${error.message}`);
  }

  // Copy favicon.svg if source is SVG
  if (sourceLogo.endsWith('.svg')) {
    try {
      const faviconSvgPath = path.join(OUTPUT_DIR, 'favicon.svg');
      fs.copyFileSync(sourceLogo, faviconSvgPath);
      console.log(`✅ Copied favicon.svg`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to copy favicon.svg: ${error.message}`);
    }
  }

  return successCount;
}

/**
 * Generate manual instructions if sharp not available
 */
function generateManualInstructions(sourceLogo) {
  console.log('📋 Sharp not installed. Manual icon generation required.\n');
  console.log('OPTION 1: Install sharp and run again');
  console.log('  npm install sharp --save-dev');
  console.log('  npm run generate:icons\n');

  console.log('OPTION 2: Use online tools');
  console.log('  PWA Icons: https://www.pwabuilder.com/imageGenerator');
  console.log('  Favicon: https://favicon.io/favicon-converter/');
  console.log('  OG Image: https://www.canva.com/ (1200x630 template)\n');

  console.log('OPTION 3: Use CLI tools');
  console.log('  Install ImageMagick: https://imagemagick.org/');
  console.log('  Then run:');

  ICON_SIZES.forEach(icon => {
    console.log(`  convert ${path.basename(sourceLogo)} -resize ${icon.size}x${icon.size} ${icon.name}`);
  });

  console.log('\nREQUIRED FILES:');
  console.log('  ✓ icon-192x192.png (PWA minimum)');
  console.log('  ✓ icon-512x512.png (PWA maximum)');
  console.log('  ✓ apple-touch-icon.png (iOS)');
  console.log('  ✓ favicon-32x32.png (Standard)');
  console.log('  ✓ favicon-16x16.png (Small)');
  console.log('  ✓ favicon.ico (Multi-size, use converter)');
  console.log('  ✓ favicon.svg (Vector, if source is SVG)');
  console.log('  ✓ og-image.png (1200x630, social media)');
}

/**
 * Verify generated icons
 */
function verifyGeneratedIcons() {
  console.log('\n───────────────────────────────────────────────────────────');
  console.log('VERIFICATION');
  console.log('───────────────────────────────────────────────────────────\n');

  const requiredFiles = [
    'icon-192x192.png',
    'icon-512x512.png',
    'apple-touch-icon.png',
    'favicon-32x32.png',
    'favicon-16x16.png',
    'og-image.png'
  ];

  const existingFiles = [];
  const missingFiles = [];

  requiredFiles.forEach(file => {
    const filePath = path.join(OUTPUT_DIR, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`✅ ${file} (${sizeKB} KB)`);
      existingFiles.push(file);
    } else {
      console.log(`❌ ${file} (missing)`);
      missingFiles.push(file);
    }
  });

  console.log(`\nStatus: ${existingFiles.length}/${requiredFiles.length} files generated`);

  if (missingFiles.length > 0) {
    console.log(`\nMissing files: ${missingFiles.join(', ')}`);
  }

  return existingFiles.length === requiredFiles.length;
}

/**
 * Update manifest.json with generated icons
 */
function updateManifest() {
  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.log('\n⚠️  manifest.json not found, skipping update');
    return;
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    // Update icons array
    manifest.icons = [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ];

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('\n✅ Updated manifest.json with icon references');
  } catch (error) {
    console.error(`\n❌ Failed to update manifest.json: ${error.message}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('Starting PWA icon generation...\n');

  // Check source logo
  const sourceLogo = checkSourceLogo();
  if (!sourceLogo) {
    console.log('Please add a logo file to:');
    console.log(`  ${SOURCE_LOGO}`);
    console.log('  OR');
    console.log(`  ${SOURCE_LOGO.replace('.svg', '.png')}\n`);
    process.exit(1);
  }

  // Check if sharp is available
  const hasSharp = await checkSharpAvailable();

  if (hasSharp) {
    const successCount = await generateIconsWithSharp(sourceLogo);
    console.log(`\n✅ Generated ${successCount} icon files`);
    updateManifest();
  } else {
    generateManualInstructions(sourceLogo);
  }

  // Verify generated icons
  const allGenerated = verifyGeneratedIcons();

  console.log('\n═══════════════════════════════════════════════════════════');

  if (allGenerated) {
    console.log('✅ PWA ICON GENERATION COMPLETE\n');
    console.log('Next steps:');
    console.log('1. Test PWA installation in Chrome DevTools');
    console.log('2. Verify icons in Application > Manifest');
    console.log('3. Test social media preview with og-image.png');
  } else {
    console.log('⚠️  PWA ICON GENERATION INCOMPLETE\n');
    console.log('Next steps:');
    console.log('1. Install sharp: npm install sharp --save-dev');
    console.log('2. Re-run: npm run generate:icons');
    console.log('3. Or follow manual instructions above');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
