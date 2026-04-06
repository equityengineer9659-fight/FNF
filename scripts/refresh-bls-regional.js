/**
 * Refresh BLS Regional CPI Data + State Affordability Index
 * Updates public/data/bls-regional-cpi.json with:
 *   - Fresh BLS CPI data for 7 food categories + 4 regions (monthly)
 *   - Updated stateAffordability using 2024 meal costs + Census ACS median income
 *
 * Run: node scripts/refresh-bls-regional.js
 *
 * Requires: BLS API v2 key (set BLS_API_KEY env var, or reads from public/api/_config.php)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const dataDir = path.join(rootDir, 'public', 'data');
const outFile = path.join(dataDir, 'bls-regional-cpi.json');

// --- Config ---
const BLS_API_URL = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';
const CENSUS_ACS_URL = 'https://api.census.gov/data/2023/acs/acs1';
const START_YEAR = '2018';
const END_YEAR = '2026';

const CATEGORY_SERIES = [
  { id: 'CUUR0000SAF111', name: 'Cereals & Bakery' },
  { id: 'CUUR0000SAF112', name: 'Meats, Poultry & Fish' },
  { id: 'CUUR0000SAF113', name: 'Dairy & Related' },
  { id: 'CUUR0000SAF114', name: 'Fruits & Vegetables' },
  { id: 'CUUR0000SAF115', name: 'Nonalcoholic Beverages' },
  { id: 'CUUR0000SAF116', name: 'Other Food at Home' },
  { id: 'CUUR0000SAF1',   name: 'All Food at Home' }
];

const REGION_SERIES = [
  { id: 'CUUR0100SAF1', name: 'Northeast' },
  { id: 'CUUR0200SAF1', name: 'Midwest' },
  { id: 'CUUR0300SAF1', name: 'South' },
  { id: 'CUUR0400SAF1', name: 'West' }
];

// State FIPS -> name mapping for Census API
const STATE_FIPS = {
  '01':'Alabama','02':'Alaska','04':'Arizona','05':'Arkansas','06':'California',
  '08':'Colorado','09':'Connecticut','10':'Delaware','11':'District of Columbia','12':'Florida',
  '13':'Georgia','15':'Hawaii','16':'Idaho','17':'Illinois','18':'Indiana','19':'Iowa',
  '20':'Kansas','21':'Kentucky','22':'Louisiana','23':'Maine','24':'Maryland',
  '25':'Massachusetts','26':'Michigan','27':'Minnesota','28':'Mississippi','29':'Missouri',
  '30':'Montana','31':'Nebraska','32':'Nevada','33':'New Hampshire','34':'New Jersey',
  '35':'New Mexico','36':'New York','37':'North Carolina','38':'North Dakota','39':'Ohio',
  '40':'Oklahoma','41':'Oregon','42':'Pennsylvania','44':'Rhode Island','45':'South Carolina',
  '46':'South Dakota','47':'Tennessee','48':'Texas','49':'Utah','50':'Vermont',
  '51':'Virginia','53':'Washington','54':'West Virginia','55':'Wisconsin','56':'Wyoming'
};

// --- Helpers ---

function getApiKey() {
  if (process.env.BLS_API_KEY) return process.env.BLS_API_KEY;
  // Try to read from PHP config
  try {
    const phpConfig = fs.readFileSync(path.join(rootDir, 'public', 'api', '_config.php'), 'utf-8');
    const match = phpConfig.match(/BLS_API_KEY['"]\s*,\s*['"]([\w]+)['"]/);
    if (match) return match[1];
  } catch { /* ignore */ }
  return null;
}

async function fetchBLS(seriesIds, apiKey) {
  const body = {
    seriesid: seriesIds,
    startyear: START_YEAR,
    endyear: END_YEAR,
    registrationkey: apiKey
  };

  const res = await fetch(BLS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) throw new Error(`BLS API returned ${res.status}`);
  const json = await res.json();

  if (json.status !== 'REQUEST_SUCCEEDED') {
    throw new Error(`BLS API error: ${json.message?.join('; ') || json.status}`);
  }
  return json.Results.series;
}

function parseBLSSeries(rawSeries) {
  return rawSeries
    .map(point => {
      const month = parseInt(point.period.replace('M', ''), 10);
      if (month < 1 || month > 12) return null; // Exclude M13 annual averages
      return {
        date: `${point.year}-${String(month).padStart(2, '0')}`,
        value: parseFloat(point.value)
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function fetchCensusMedianIncome() {
  // Census ACS 1-year: B19013_001E = Median household income
  const url = `${CENSUS_ACS_URL}?get=NAME,B19013_001E&for=state:*`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Census API returned ${res.status}`);
  const rows = await res.json();
  // rows[0] is header, rest are data
  const result = {};
  for (let i = 1; i < rows.length; i++) {
    const [name, income, fips] = rows[i];
    if (STATE_FIPS[fips]) {
      result[STATE_FIPS[fips]] = parseInt(income, 10);
    }
  }
  return result;
}

// --- Main ---

async function main() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('No BLS API key found. Set BLS_API_KEY env var or configure public/api/_config.php');
    process.exit(1);
  }

  // Load existing file to preserve affordability.quintiles (will be replaced for stateAffordability)
  const existing = JSON.parse(fs.readFileSync(outFile, 'utf-8'));

  console.log('Fetching BLS CPI data for 11 series...');
  const allIds = [...CATEGORY_SERIES, ...REGION_SERIES].map(s => s.id);
  const rawResults = await fetchBLS(allIds, apiKey);

  // Build a lookup: seriesID -> parsed data
  const byId = {};
  for (const series of rawResults) {
    byId[series.seriesID] = parseBLSSeries(series.data);
  }

  // Build categories
  const categorySeries = CATEGORY_SERIES.map(s => ({
    id: s.id,
    name: s.name,
    data: byId[s.id] || []
  }));

  // Build regions
  const regionSeries = REGION_SERIES.map(s => ({
    id: s.id,
    name: s.name,
    data: byId[s.id] || []
  }));

  const catDates = categorySeries[0]?.data || [];
  const lastCatDate = catDates[catDates.length - 1]?.date || 'unknown';
  console.log(`  Categories: ${catDates.length} data points, last: ${lastCatDate}`);
  console.log(`  Regions: ${regionSeries[0]?.data.length || 0} data points`);

  // --- Refresh stateAffordability ---
  console.log('Refreshing stateAffordability with 2024 meal costs + Census ACS income...');
  const fiData = JSON.parse(fs.readFileSync(path.join(dataDir, 'food-insecurity-state.json'), 'utf-8'));
  const mealCostByState = {};
  for (const s of fiData.states) {
    mealCostByState[s.name] = s.mealCost;
  }

  let medianIncomeByState;
  try {
    medianIncomeByState = await fetchCensusMedianIncome();
    console.log(`  Census ACS: ${Object.keys(medianIncomeByState).length} states fetched`);
  } catch (err) {
    console.warn(`  Census ACS fetch failed: ${err.message}`);
    console.warn('  Falling back to existing medianIncome values');
    medianIncomeByState = {};
    for (const s of existing.stateAffordability.states) {
      medianIncomeByState[s.name] = s.medianIncome;
    }
  }

  const updatedStates = [];
  for (const stateName of Object.values(STATE_FIPS)) {
    const mealCost = mealCostByState[stateName];
    const medianIncome = medianIncomeByState[stateName];
    if (!mealCost || !medianIncome) {
      console.warn(`  Skipping ${stateName}: mealCost=${mealCost}, medianIncome=${medianIncome}`);
      continue;
    }
    // Formula: (annualMealCost / medianIncome) * 1000
    const index = parseFloat(((mealCost * 365 * 3) / medianIncome * 1000).toFixed(1));
    updatedStates.push({ name: stateName, mealCost, medianIncome, index });
  }
  updatedStates.sort((a, b) => a.name.localeCompare(b.name));
  console.log(`  Updated ${updatedStates.length} states`);

  // --- Assemble output ---
  const output = {
    source: 'Bureau of Labor Statistics, Consumer Price Index',
    description: 'Food CPI by category and region, monthly data 2018-present',
    fetchedAt: new Date().toISOString(),
    categories: {
      meta: {
        startYear: parseInt(START_YEAR, 10),
        endYear: parseInt(END_YEAR, 10),
        baseline: '1982-84 = 100'
      },
      series: categorySeries
    },
    regions: {
      meta: {
        startYear: parseInt(START_YEAR, 10),
        endYear: parseInt(END_YEAR, 10),
        series: 'Food at Home CPI by region'
      },
      series: regionSeries
    },
    affordability: existing.affordability, // Preserve quintiles (manual data)
    stateAffordability: {
      description: 'State-level meal cost affordability relative to median household income',
      source: 'Feeding America Map the Meal Gap (meal costs) + Census ACS 1-year (median income)',
      year: 2024,
      states: updatedStates
    }
  };

  fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
  console.log(`\nWritten to ${outFile}`);
  console.log('Done.');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
