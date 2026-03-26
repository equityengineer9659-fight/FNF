/**
 * CSS Duplicate Detection Script
 * Scans CSS files for duplicate selectors and property declarations
 */

const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const CSS_DIR = path.join(__dirname, '..', 'src', 'css');
const REPORT_FILE = path.join(__dirname, '..', 'css-duplicates-report.txt');

/**
 * Parse CSS file and extract rules
 */
async function parseCSSFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const result = await postcss().process(content, { from: filePath });

  const rules = [];
  result.root.walkRules((rule) => {
    const selector = rule.selector;
    const declarations = [];

    rule.walkDecls((decl) => {
      declarations.push({
        property: decl.prop,
        value: decl.value,
        important: decl.important
      });
    });

    if (declarations.length > 0) {
      rules.push({
        selector,
        declarations,
        file: path.basename(filePath),
        line: rule.source.start.line
      });
    }
  });

  return rules;
}

/**
 * Find duplicate selectors across files
 */
function findDuplicateSelectors(allRules) {
  const selectorMap = new Map();

  allRules.forEach((rule) => {
    const key = rule.selector;
    if (!selectorMap.has(key)) {
      selectorMap.set(key, []);
    }
    selectorMap.get(key).push(rule);
  });

  const duplicates = [];
  selectorMap.forEach((rules, selector) => {
    if (rules.length > 1) {
      duplicates.push({ selector, occurrences: rules });
    }
  });

  return duplicates.sort((a, b) => b.occurrences.length - a.occurrences.length);
}

/**
 * Find duplicate property declarations within same selector
 */
function findDuplicateProperties(allRules) {
  const duplicates = [];

  allRules.forEach((rule) => {
    const propertyMap = new Map();

    rule.declarations.forEach((decl) => {
      const key = decl.property;
      if (!propertyMap.has(key)) {
        propertyMap.set(key, []);
      }
      propertyMap.get(key).push(decl);
    });

    propertyMap.forEach((decls, property) => {
      if (decls.length > 1) {
        duplicates.push({
          selector: rule.selector,
          property,
          file: rule.file,
          line: rule.line,
          declarations: decls
        });
      }
    });
  });

  return duplicates;
}

/**
 * Generate report
 */
function generateReport(duplicateSelectors, duplicateProperties) {
  let report = '═══════════════════════════════════════════════════════════════\n';
  report += '              CSS DUPLICATE DETECTION REPORT\n';
  report += '═══════════════════════════════════════════════════════════════\n';
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Directory: ${CSS_DIR}\n\n`;

  // Duplicate Selectors Section
  report += '───────────────────────────────────────────────────────────────\n';
  report += `DUPLICATE SELECTORS: ${duplicateSelectors.length} found\n`;
  report += '───────────────────────────────────────────────────────────────\n\n';

  if (duplicateSelectors.length === 0) {
    report += '✅ No duplicate selectors found!\n\n';
  } else {
    duplicateSelectors.forEach((dup, index) => {
      report += `${index + 1}. Selector: "${dup.selector}"\n`;
      report += `   Occurrences: ${dup.occurrences.length}\n`;
      dup.occurrences.forEach((occ) => {
        report += `   - ${occ.file}:${occ.line} (${occ.declarations.length} declarations)\n`;
      });
      report += '\n';
    });
  }

  // Duplicate Properties Section
  report += '───────────────────────────────────────────────────────────────\n';
  report += `DUPLICATE PROPERTIES: ${duplicateProperties.length} found\n`;
  report += '───────────────────────────────────────────────────────────────\n\n';

  if (duplicateProperties.length === 0) {
    report += '✅ No duplicate properties within selectors found!\n\n';
  } else {
    duplicateProperties.forEach((dup, index) => {
      report += `${index + 1}. Selector: "${dup.selector}" (${dup.file}:${dup.line})\n`;
      report += `   Property: "${dup.property}" declared ${dup.declarations.length} times:\n`;
      dup.declarations.forEach((decl) => {
        const important = decl.important ? ' !important' : '';
        report += `   - ${decl.value}${important}\n`;
      });
      report += '\n';
    });
  }

  // Summary
  report += '═══════════════════════════════════════════════════════════════\n';
  report += 'SUMMARY\n';
  report += '═══════════════════════════════════════════════════════════════\n';
  report += `Duplicate Selectors: ${duplicateSelectors.length}\n`;
  report += `Duplicate Properties: ${duplicateProperties.length}\n`;

  const totalIssues = duplicateSelectors.length + duplicateProperties.length;
  if (totalIssues === 0) {
    report += '\n✅ No CSS duplicates detected! Code is clean.\n';
  } else {
    report += `\n⚠️  Total Issues: ${totalIssues}\n`;
    report += '\nRecommendations:\n';
    report += '- Consolidate duplicate selectors into single declarations\n';
    report += '- Remove duplicate properties (last declaration wins)\n';
    report += '- Consider using CSS custom properties for repeated values\n';
  }

  report += '═══════════════════════════════════════════════════════════════\n';

  return report;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔍 Scanning CSS files for duplicates...\n');

    // Get all CSS files
    const files = fs.readdirSync(CSS_DIR)
      .filter((file) => file.endsWith('.css'))
      .map((file) => path.join(CSS_DIR, file));

    console.log(`📁 Found ${files.length} CSS files\n`);

    // Parse all files
    const allRules = [];
    for (const file of files) {
      console.log(`   Parsing ${path.basename(file)}...`);
      const rules = await parseCSSFile(file);
      allRules.push(...rules);
    }

    console.log(`\n✅ Parsed ${allRules.length} CSS rules\n`);

    // Find duplicates
    console.log('🔎 Analyzing for duplicates...\n');
    const duplicateSelectors = findDuplicateSelectors(allRules);
    const duplicateProperties = findDuplicateProperties(allRules);

    // Generate report
    const report = generateReport(duplicateSelectors, duplicateProperties);

    // Write to file
    fs.writeFileSync(REPORT_FILE, report);

    // Print to console
    console.log(report);
    console.log(`\n💾 Report saved to: ${REPORT_FILE}\n`);

  } catch (error) {
    console.error('❌ Error during CSS duplicate detection:', error);
    process.exit(1);
  }
}

main();
