/**
 * CSS Variable Replacement Script
 * Safely replaces hard-coded values with CSS variables
 */

const fs = require('fs');
const path = require('path');

// Replacement mappings - ordered by priority (most specific first)
const replacements = [
  // Colors - specific rgba values first
  { from: /rgba\(255,\s*255,\s*255,\s*0\.95\)/g, to: 'var(--color-white-95)' },
  { from: /rgba\(255,\s*255,\s*255,\s*0\.9\)/g, to: 'var(--color-white-90)' },
  { from: /rgba\(255,\s*255,\s*255,\s*\.9\)/g, to: 'var(--color-white-90)' },
  { from: /rgba\(255,\s*255,\s*255,\s*0\.6\)/g, to: 'var(--color-white-60)' },
  { from: /rgba\(255,\s*255,\s*255,\s*0\.3\)/g, to: 'var(--color-white-30)' },
  { from: /rgba\(255,\s*255,\s*255,\s*0\.2\)/g, to: 'var(--color-white-20)' },
  { from: /rgba\(255,\s*255,\s*255,\s*\.2\)/g, to: 'var(--color-white-20)' },
  { from: /rgba\(255,\s*255,\s*255,\s*0\.15\)/g, to: 'var(--color-white-15)' },
  { from: /rgba\(255,\s*255,\s*255,\s*0\.1\)/g, to: 'var(--color-white-10)' },
  { from: /rgba\(255,\s*255,\s*255,\s*\.1\)/g, to: 'var(--color-white-10)' },
  { from: /rgba\(255,\s*255,\s*255,\s*0\.05\)/g, to: 'var(--color-white-05)' },
  { from: /rgba\(255,\s*255,\s*255,\s*0\.03\)/g, to: 'var(--color-white-03)' },

  { from: /rgba\(0,\s*0,\s*0,\s*0\.95\)/g, to: 'var(--color-black-95)' },
  { from: /rgba\(0,\s*0,\s*0,\s*0\.7\)/g, to: 'var(--color-black-70)' },
  { from: /rgba\(0,\s*0,\s*0,\s*0\.3\)/g, to: 'var(--color-black-30)' },
  { from: /rgba\(0,\s*0,\s*0,\s*0\.2\)/g, to: 'var(--color-black-20)' },

  // Hex colors - careful not to replace in gradients
  { from: /#fff(?![a-fA-F0-9])/g, to: 'var(--color-white)' },
  { from: /#000(?![a-fA-F0-9])/g, to: 'var(--color-black)' },
  { from: /#ccc(?![a-fA-F0-9])/g, to: 'var(--color-gray-light)' },
  { from: /#0176d3/g, to: 'var(--color-primary-dark)' },
  { from: /#00d4ff/g, to: 'var(--color-primary-light)' },
  { from: /#16325C/g, to: 'var(--color-primary-darkest)' },

  // Common padding values
  { from: /padding:\s*2rem\s+1rem/g, to: 'padding: var(--spacing-2xl) var(--spacing-lg)' },
  { from: /padding:\s*4rem\s+2rem/g, to: 'padding: var(--spacing-section)' },
  { from: /padding:\s*0\.75rem\s+1\.5rem/g, to: 'padding: var(--spacing-button)' },
  { from: /padding:\s*2rem(?!\s)/g, to: 'padding: var(--spacing-2xl)' },
  { from: /padding:\s*1rem/g, to: 'padding: var(--spacing-lg)' },
  { from: /padding:\s*1\.5rem/g, to: 'padding: var(--spacing-xl)' },
  { from: /padding:\s*0\.5rem/g, to: 'padding: var(--spacing-sm)' },

  // Common margin values
  { from: /margin:\s*2rem/g, to: 'margin: var(--spacing-2xl)' },
  { from: /margin:\s*1rem/g, to: 'margin: var(--spacing-lg)' },
  { from: /margin:\s*1\.5rem/g, to: 'margin: var(--spacing-xl)' },
  { from: /margin:\s*0\.5rem/g, to: 'margin: var(--spacing-sm)' },
  { from: /margin-bottom:\s*1rem/g, to: 'margin-bottom: var(--spacing-lg)' },
  { from: /margin-bottom:\s*1\.5rem/g, to: 'margin-bottom: var(--spacing-xl)' },
  { from: /margin-bottom:\s*2rem/g, to: 'margin-bottom: var(--spacing-2xl)' },

  // Border radius
  { from: /border-radius:\s*0\.5rem/g, to: 'border-radius: var(--radius-md)' },
  { from: /border-radius:\s*1rem/g, to: 'border-radius: var(--radius-lg)' },
  { from: /border-radius:\s*0\.25rem/g, to: 'border-radius: var(--radius-sm)' },

  // Transitions
  { from: /transition:\s*all\s+0\.3s\s+ease/g, to: 'transition: all var(--transition-base)' },
  { from: /transition:\s*all\s+0\.15s\s+ease/g, to: 'transition: all var(--transition-fast)' },
  { from: /transition:\s*all\s+0\.5s\s+ease/g, to: 'transition: all var(--transition-slow)' },

  // Blur effects
  { from: /blur\(20px\)/g, to: 'blur(var(--blur-md))' },
  { from: /blur\(10px\)/g, to: 'blur(var(--blur-sm))' },
  { from: /blur\(30px\)/g, to: 'blur(var(--blur-lg))' },
];

// Files to process (excluding the variables file itself)
const cssFiles = [
  '03-navigation.css',
  '04-typography.css',
  '05-layout.css',
  '06-effects.css',
  '07-components.css'
];

function processFile(fileName) {
  const filePath = path.join(__dirname, 'src', 'css', fileName);

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${fileName}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf-8');
  let changeCount = 0;

  replacements.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      changeCount += matches.length;
      content = content.replace(from, to);
    }
  });

  if (changeCount > 0) {
    // Create backup
    const backupPath = filePath + '.backup-before-variables';
    fs.writeFileSync(backupPath, fs.readFileSync(filePath, 'utf-8'));

    // Write updated content
    fs.writeFileSync(filePath, content);
    console.log(`✅ ${fileName}: ${changeCount} replacements made (backup created)`);
  } else {
    console.log(`ℹ️  ${fileName}: No changes needed`);
  }
}

// Main execution
console.log('🔧 Starting CSS variable replacement...\n');

cssFiles.forEach(processFile);

console.log('\n✨ CSS variable replacement complete!');
console.log('📝 Remember to test all pages for visual regressions');