/**
 * Build Dashboard Data
 * Converts TopoJSON boundary data to GeoJSON for ECharts consumption.
 * Run: node scripts/build-dashboard-data.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { feature } from 'topojson-client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const dataDir = path.join(rootDir, 'src', 'data');

// Convert US states TopoJSON → GeoJSON for ECharts
function buildStatesGeoJSON() {
  const topoPath = path.join(rootDir, 'node_modules', 'us-atlas', 'states-albers-10m.json');
  let topo;
  try {
    topo = JSON.parse(fs.readFileSync(topoPath, 'utf-8'));
  } catch (err) {
    console.error(`ERROR reading TopoJSON: ${err.message}`);
    process.exit(1);
  }

  const geo = feature(topo, topo.objects.states);

  // Add state names from FIPS lookup
  const fipsToName = {
    '01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas',
    '06': 'California', '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware',
    '11': 'District of Columbia', '12': 'Florida', '13': 'Georgia', '15': 'Hawaii',
    '16': 'Idaho', '17': 'Illinois', '18': 'Indiana', '19': 'Iowa',
    '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana', '23': 'Maine',
    '24': 'Maryland', '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota',
    '28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska',
    '32': 'Nevada', '33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico',
    '36': 'New York', '37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio',
    '40': 'Oklahoma', '41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island',
    '45': 'South Carolina', '46': 'South Dakota', '47': 'Tennessee', '48': 'Texas',
    '49': 'Utah', '50': 'Vermont', '51': 'Virginia', '53': 'Washington',
    '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming', '72': 'Puerto Rico'
  };

  geo.features.forEach(f => {
    const fips = f.id.toString().padStart(2, '0');
    f.properties.name = fipsToName[fips] || `Unknown (${fips})`;
    f.properties.fips = fips;
  });

  const outPath = path.join(dataDir, 'us-states-geo.json');
  try {
    fs.writeFileSync(outPath, JSON.stringify(geo));
    console.log(`✅ Built ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(0)}KB)`);
  } catch (err) {
    console.error(`ERROR writing GeoJSON: ${err.message}`);
    process.exit(1);
  }
}

// Convert US counties TopoJSON → per-state GeoJSON files for lazy loading
function buildCountyGeoJSON() {
  const topoPath = path.join(rootDir, 'node_modules', 'us-atlas', 'counties-albers-10m.json');
  let topo;
  try {
    topo = JSON.parse(fs.readFileSync(topoPath, 'utf-8'));
  } catch (err) {
    console.error(`ERROR reading counties TopoJSON: ${err.message}`);
    process.exit(1);
  }

  const geo = feature(topo, topo.objects.counties);

  // FIPS: first 2 digits = state, remaining = county
  const fipsToState = {
    '01': 'Alabama', '02': 'Alaska', '04': 'Arizona', '05': 'Arkansas',
    '06': 'California', '08': 'Colorado', '09': 'Connecticut', '10': 'Delaware',
    '11': 'District of Columbia', '12': 'Florida', '13': 'Georgia', '15': 'Hawaii',
    '16': 'Idaho', '17': 'Illinois', '18': 'Indiana', '19': 'Iowa',
    '20': 'Kansas', '21': 'Kentucky', '22': 'Louisiana', '23': 'Maine',
    '24': 'Maryland', '25': 'Massachusetts', '26': 'Michigan', '27': 'Minnesota',
    '28': 'Mississippi', '29': 'Missouri', '30': 'Montana', '31': 'Nebraska',
    '32': 'Nevada', '33': 'New Hampshire', '34': 'New Jersey', '35': 'New Mexico',
    '36': 'New York', '37': 'North Carolina', '38': 'North Dakota', '39': 'Ohio',
    '40': 'Oklahoma', '41': 'Oregon', '42': 'Pennsylvania', '44': 'Rhode Island',
    '45': 'South Carolina', '46': 'South Dakota', '47': 'Tennessee', '48': 'Texas',
    '49': 'Utah', '50': 'Vermont', '51': 'Virginia', '53': 'Washington',
    '54': 'West Virginia', '55': 'Wisconsin', '56': 'Wyoming', '72': 'Puerto Rico'
  };

  // Group features by state FIPS
  const byState = {};
  geo.features.forEach(f => {
    const fips = f.id.toString().padStart(5, '0');
    const stateFips = fips.slice(0, 2);
    if (!byState[stateFips]) byState[stateFips] = [];
    f.properties.fips = fips;
    f.properties.stateFips = stateFips;
    f.properties.name = f.properties.name || `County ${fips}`;
    byState[stateFips].push(f);
  });

  // Write per-state files
  const countyDir = path.join(rootDir, 'public', 'data', 'counties');
  if (!fs.existsSync(countyDir)) fs.mkdirSync(countyDir, { recursive: true });

  let totalCounties = 0;
  Object.entries(byState).forEach(([stateFips, features]) => {
    const stateGeo = { type: 'FeatureCollection', features };
    const outPath = path.join(countyDir, `${stateFips}.json`);
    try {
      fs.writeFileSync(outPath, JSON.stringify(stateGeo));
      totalCounties += features.length;
    } catch (err) {
      console.error(`ERROR writing county file ${stateFips}: ${err.message}`);
    }
  });

  console.log(`✅ Built ${Object.keys(byState).length} state county files (${totalCounties} counties total) in ${countyDir}`);
}

buildStatesGeoJSON();
buildCountyGeoJSON();
console.log('✨ Dashboard data build complete!');
