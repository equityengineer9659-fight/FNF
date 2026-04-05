#!/usr/bin/env node
/**
 * import-chr-data.js
 *
 * Imports County Health Rankings (CHR) food insecurity data into the project's
 * county GeoJSON files, replacing modeled rates with actual Feeding America
 * food insecurity rates published by CHR.
 *
 * Data source: County Health Rankings 2025 analytic CSV
 * https://www.countyhealthrankings.org/health-data/methodology-and-sources/data-documentation
 *
 * Usage:
 *   node scripts/import-chr-data.js [path-to-chr-csv]
 *
 * If no path is given, defaults to C:\tmp\chr_analytic_2025.csv
 */

const fs = require('fs');
const path = require('path');

// --- Configuration ---
const PROJECT_ROOT = path.resolve(__dirname, '..');
const COUNTIES_DIR = path.join(PROJECT_ROOT, 'public', 'data', 'counties');
const DEFAULT_CSV = path.join('C:', 'tmp', 'chr_analytic_2025.csv');

// --- Simple CSV line parser (handles quoted fields) ---
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

// --- Main ---
function main() {
  const csvPath = process.argv[2] || DEFAULT_CSV;

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found: ${csvPath}`);
    console.error('Download from: https://www.countyhealthrankings.org/health-data/methodology-and-sources/data-documentation');
    process.exit(1);
  }

  console.log(`Reading CHR CSV: ${csvPath}`);
  const raw = fs.readFileSync(csvPath, 'utf8');
  const lines = raw.split('\n').filter(l => l.trim());

  // First row = human-readable headers, second row = variable codes
  const headers = parseCSVLine(lines[0]);
  const varCodes = parseCSVLine(lines[1]);

  // Build column index from human-readable headers
  const colIndex = {};
  headers.forEach((h, i) => { colIndex[h.trim()] = i; });

  // Also index by variable code (second row)
  const varIndex = {};
  varCodes.forEach((v, i) => { varIndex[v.trim()] = i; });

  // Column positions for the fields we need
  const COL_FIPS = colIndex['5-digit FIPS Code'];
  const COL_STATE_FIPS = colIndex['State FIPS Code'];
  const COL_FOOD_INSEC = colIndex['Food Insecurity raw value'];
  const COL_FOOD_ENV = colIndex['Food Environment Index raw value'];
  const COL_LIMITED_ACCESS = colIndex['Limited Access to Healthy Foods raw value'];

  if (COL_FIPS === undefined || COL_FOOD_INSEC === undefined) {
    console.error('Could not find required columns in CSV. Found headers:', Object.keys(colIndex).slice(0, 10));
    process.exit(1);
  }

  console.log('Column positions:', {
    fips: COL_FIPS,
    foodInsecurity: COL_FOOD_INSEC,
    foodEnvironment: COL_FOOD_ENV,
    limitedAccess: COL_LIMITED_ACCESS
  });

  // Parse all county rows (skip header rows 0 and 1, skip state-level rows ending in 000)
  const chrData = new Map(); // fips5 -> { rate, foodEnvIndex, limitedAccess }
  let parsed = 0;
  let skippedState = 0;
  let skippedEmpty = 0;

  for (let i = 2; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const fips = (cols[COL_FIPS] || '').trim();

    // Skip state-level summary rows (county FIPS = 000)
    if (!fips || fips.endsWith('000')) {
      skippedState++;
      continue;
    }

    const foodInsecStr = (cols[COL_FOOD_INSEC] || '').trim();
    const foodEnvStr = (cols[COL_FOOD_ENV] || '').trim();
    const limitedAccessStr = (cols[COL_LIMITED_ACCESS] || '').trim();

    // Food insecurity is stored as decimal (0.151 = 15.1%)
    const foodInsecRate = foodInsecStr ? parseFloat(foodInsecStr) : null;
    // Food Environment Index is 0-10 scale
    const foodEnvIndex = foodEnvStr ? parseFloat(foodEnvStr) : null;
    // Limited access is stored as decimal (0.13 = 13%)
    const limitedAccess = limitedAccessStr ? parseFloat(limitedAccessStr) : null;

    if (foodInsecRate === null && foodEnvIndex === null && limitedAccess === null) {
      skippedEmpty++;
      continue;
    }

    chrData.set(fips, {
      rate: foodInsecRate !== null ? Math.round(foodInsecRate * 1000) / 10 : null, // Convert to percentage with 1 decimal
      foodEnvIndex: foodEnvIndex !== null ? Math.round(foodEnvIndex * 10) / 10 : null,
      limitedAccess: limitedAccess !== null ? Math.round(limitedAccess * 1000) / 10 : null // Convert to percentage with 1 decimal
    });
    parsed++;
  }

  console.log(`Parsed ${parsed} county records from CHR (skipped ${skippedState} state-level, ${skippedEmpty} empty)`);

  // Process each state GeoJSON file
  const stateFiles = fs.readdirSync(COUNTIES_DIR).filter(f => f.endsWith('.json'));
  let totalUpdated = 0;
  let totalKept = 0;
  let totalCounties = 0;

  for (const file of stateFiles) {
    const filePath = path.join(COUNTIES_DIR, file);
    const geojson = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    let fileUpdated = 0;
    let fileKept = 0;

    for (const feature of geojson.features) {
      totalCounties++;
      const fips = feature.properties.fips || feature.id;

      if (!fips) {
        fileKept++;
        continue;
      }

      const chr = chrData.get(fips);

      if (chr) {
        // Update rate if CHR has data
        if (chr.rate !== null) {
          feature.properties.rate = chr.rate;
          fileUpdated++;
        } else {
          fileKept++;
        }

        // Add new fields from CHR
        if (chr.foodEnvIndex !== null) {
          feature.properties.foodEnvIndex = chr.foodEnvIndex;
        }
        if (chr.limitedAccess !== null) {
          feature.properties.limitedAccess = chr.limitedAccess;
        }

        // Mark data source
        feature.properties.dataSource = 'CHR2025';
      } else {
        // No CHR data for this county — keep existing modeled rate
        feature.properties.dataSource = 'modeled';
        fileKept++;
      }
    }

    // Write updated GeoJSON (compact, no extra whitespace to keep files small)
    fs.writeFileSync(filePath, JSON.stringify(geojson));

    totalUpdated += fileUpdated;
    totalKept += fileKept;

    const stateFips = file.replace('.json', '');
    if (fileUpdated > 0) {
      console.log(`  ${stateFips}.json: ${fileUpdated} updated, ${fileKept} kept`);
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Total counties in GeoJSON: ${totalCounties}`);
  console.log(`Updated with CHR data:     ${totalUpdated}`);
  console.log(`Kept existing (no CHR):    ${totalKept}`);
  console.log(`CHR records available:     ${chrData.size}`);

  // Spot-check: show a few updated values
  console.log('\n--- Spot check (first 5 CHR entries) ---');
  let spotCount = 0;
  for (const [fips, data] of chrData) {
    if (spotCount >= 5) break;
    console.log(`  ${fips}: rate=${data.rate}%, foodEnvIndex=${data.foodEnvIndex}, limitedAccess=${data.limitedAccess}%`);
    spotCount++;
  }
}

main();
