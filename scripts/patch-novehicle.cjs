#!/usr/bin/env node
/**
 * Patch noVehiclePct in current-food-access.json
 *
 * The original compute script used B08141 (workers without vehicle — worker universe).
 * This script replaces noVehiclePct with household-level data from B25044:
 *   B25044_001E = total occupied housing units
 *   B25044_003E = owner-occupied, no vehicles available
 *   B25044_010E = renter-occupied, no vehicles available
 *
 * Usage: node scripts/patch-novehicle.cjs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'data', 'current-food-access.json');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'FoodNForce-AccessCompute/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Patching noVehiclePct in current-food-access.json...');
  console.log('Fetching Census ACS 2023 B25044 (household vehicle availability)...');

  const url = 'https://api.census.gov/data/2023/acs/acs5?get=NAME,B25044_001E,B25044_003E,B25044_010E&for=state:*';
  const raw = await fetchUrl(url);
  const rows = JSON.parse(raw);
  const header = rows[0];

  // Build FIPS → noVehiclePct map
  const vehicleMap = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const stateFips = row[header.indexOf('state')];
    const totalHouseholds = parseInt(row[header.indexOf('B25044_001E')], 10) || 0;
    const ownerNoVeh = parseInt(row[header.indexOf('B25044_003E')], 10) || 0;
    const renterNoVeh = parseInt(row[header.indexOf('B25044_010E')], 10) || 0;
    const noVehiclePct = totalHouseholds > 0
      ? Math.round(((ownerNoVeh + renterNoVeh) / totalHouseholds) * 1000) / 10
      : 0;
    vehicleMap[stateFips] = noVehiclePct;
    console.log(`  FIPS ${stateFips}: ${noVehiclePct}% households without vehicle`);
  }

  const data = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
  let updated = 0;

  for (const state of data.states) {
    if (vehicleMap[state.fips] !== undefined) {
      state.noVehiclePct = vehicleMap[state.fips];
      updated++;
    }
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
  console.log(`\nDone. Updated noVehiclePct for ${updated} states.`);
  console.log(`Output: ${OUTPUT_FILE}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
