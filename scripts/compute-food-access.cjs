#!/usr/bin/env node
/**
 * Compute Current Food Access — Local Build Script
 *
 * Downloads USDA FNS SNAP retailer locations + Census 2020 tract centroids,
 * computes haversine distance from each tract to nearest qualifying store,
 * flags low-access tracts, and aggregates to county + state level.
 *
 * Output: public/data/current-food-access.json
 *
 * USDA threshold: >1 mile urban / >10 miles rural to nearest supermarket/super store/large grocery
 *
 * Usage: node scripts/compute-food-access.cjs
 * Runtime: ~2-5 minutes (downloads ~260K retailers + ~85K tract centroids)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'data', 'current-food-access.json');

// USDA FARA thresholds
const URBAN_THRESHOLD_MILES = 1;
const RURAL_THRESHOLD_MILES = 10;

// Store types that count as meaningful grocery access
const QUALIFYING_TYPES = new Set([
  'Supermarket', 'Super Store', 'Large Grocery Store'
]);

// State FIPS → abbreviation mapping
const FIPS_TO_ABBR = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE',
  '11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL','18':'IN','19':'IA',
  '20':'KS','21':'KY','22':'LA','23':'ME','24':'MD','25':'MA','26':'MI','27':'MN',
  '28':'MS','29':'MO','30':'MT','31':'NE','32':'NV','33':'NH','34':'NJ','35':'NM',
  '36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR','42':'PA','44':'RI',
  '45':'SC','46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA',
  '54':'WV','55':'WI','56':'WY'
};

const STATE_NAMES = {
  'AL':'Alabama','AK':'Alaska','AZ':'Arizona','AR':'Arkansas','CA':'California',
  'CO':'Colorado','CT':'Connecticut','DE':'Delaware','DC':'District of Columbia',
  'FL':'Florida','GA':'Georgia','HI':'Hawaii','ID':'Idaho','IL':'Illinois',
  'IN':'Indiana','IA':'Iowa','KS':'Kansas','KY':'Kentucky','LA':'Louisiana',
  'ME':'Maine','MD':'Maryland','MA':'Massachusetts','MI':'Michigan','MN':'Minnesota',
  'MS':'Mississippi','MO':'Missouri','MT':'Montana','NE':'Nebraska','NV':'Nevada',
  'NH':'New Hampshire','NJ':'New Jersey','NM':'New Mexico','NY':'New York',
  'NC':'North Carolina','ND':'North Dakota','OH':'Ohio','OK':'Oklahoma','OR':'Oregon',
  'PA':'Pennsylvania','RI':'Rhode Island','SC':'South Carolina','SD':'South Dakota',
  'TN':'Tennessee','TX':'Texas','UT':'Utah','VT':'Vermont','VA':'Virginia',
  'WA':'Washington','WV':'West Virginia','WI':'Wisconsin','WY':'Wyoming'
};

// -- HTTP fetch helper --
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { headers: { 'User-Agent': 'FoodNForce-AccessCompute/1.0' } }, (res) => {
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

// -- Haversine distance in miles --
function haversine(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// -- Simple KD-tree for nearest-neighbor queries --
class KDTree {
  constructor(points) {
    // points: [{lat, lon, ...}]
    this.root = this._build(points.slice(), 0);
  }

  _build(pts, depth) {
    if (pts.length === 0) return null;
    const axis = depth % 2 === 0 ? 'lat' : 'lon';
    pts.sort((a, b) => a[axis] - b[axis]);
    const mid = Math.floor(pts.length / 2);
    return {
      point: pts[mid],
      left: this._build(pts.slice(0, mid), depth + 1),
      right: this._build(pts.slice(mid + 1), depth + 1),
      axis
    };
  }

  nearest(target) {
    let best = { dist: Infinity, point: null };
    this._search(this.root, target, best, 0);
    return best;
  }

  _search(node, target, best, depth) {
    if (!node) return;
    const d = haversine(target.lat, target.lon, node.point.lat, node.point.lon);
    if (d < best.dist) {
      best.dist = d;
      best.point = node.point;
    }
    const axis = depth % 2 === 0 ? 'lat' : 'lon';
    const diff = target[axis] - node.point[axis];
    const close = diff < 0 ? node.left : node.right;
    const far = diff < 0 ? node.right : node.left;

    this._search(close, target, best, depth + 1);

    // Only search far side if it could contain a closer point
    // Convert axis diff to approximate miles (1 deg lat ≈ 69 mi, 1 deg lon ≈ varies)
    const approxMiles = Math.abs(diff) * (axis === 'lat' ? 69 : 69 * Math.cos(target.lat * Math.PI / 180));
    if (approxMiles < best.dist) {
      this._search(far, target, best, depth + 1);
    }
  }
}

// -- Step 1: Download FNS SNAP retailer locations --
async function downloadRetailers() {
  console.log('Downloading FNS SNAP retailer locations...');
  const baseUrl = 'https://services1.arcgis.com/RLQu0rK7h4kbsBq5/arcgis/rest/services/snap_retailer_location_data/FeatureServer/0/query';
  const stores = [];
  let offset = 0;
  const batchSize = 1000; // ArcGIS maxRecordCount is 1000

  while (true) {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: 'Store_Type,Latitude,Longitude,State',
      resultRecordCount: String(batchSize),
      resultOffset: String(offset),
      f: 'json'
    });

    const url = `${baseUrl}?${params}`;
    const resp = await fetchUrl(url);
    const json = JSON.parse(resp);

    if (!json.features || json.features.length === 0) break;

    for (const f of json.features) {
      const a = f.attributes;
      if (a.Latitude && a.Longitude) {
        stores.push({
          lat: a.Latitude,
          lon: a.Longitude,
          type: a.Store_Type,
          state: a.State,
          qualifying: QUALIFYING_TYPES.has(a.Store_Type)
        });
      }
    }

    process.stdout.write(`  ${stores.length} retailers downloaded...\r`);
    offset += batchSize;

    if (json.features.length < batchSize) break;
  }

  console.log(`  ${stores.length} retailers downloaded total`);
  console.log(`  ${stores.filter(s => s.qualifying).length} qualifying (supermarket/super store/large grocery)`);
  return stores;
}

// -- Step 2: Download Census 2020 tract centroids --
async function downloadTractCentroids() {
  console.log('Downloading Census 2020 tract centroids...');
  const url = 'https://www2.census.gov/geo/docs/reference/cenpop2020/tract/CenPop2020_Mean_TR.txt';
  const raw = await fetchUrl(url);

  // Parse CSV (has BOM)
  const lines = raw.replace(/^\uFEFF/, '').trim().split('\n');
  const tracts = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 6) continue;
    const stateFips = parts[0].trim();
    const countyFips = parts[1].trim();
    const tractCe = parts[2].trim();
    const population = parseInt(parts[3].trim(), 10) || 0;
    const lat = parseFloat(parts[4].trim());
    const lon = parseFloat(parts[5].trim());

    if (isNaN(lat) || isNaN(lon)) continue;
    if (!FIPS_TO_ABBR[stateFips]) continue; // Skip territories

    tracts.push({
      stateFips,
      countyFips: stateFips + countyFips,
      tractId: stateFips + countyFips + tractCe,
      population,
      lat, lon
    });
  }

  console.log(`  ${tracts.length} tract centroids loaded`);
  return tracts;
}

// -- Step 3: Determine urban/rural per county --
function classifyUrbanRural(tracts) {
  // Use population density heuristic: counties with >500 people per tract on average = urban
  // This approximates USDA's urbanized area classification
  const countyPop = {};
  const countyTracts = {};
  for (const t of tracts) {
    if (!countyPop[t.countyFips]) { countyPop[t.countyFips] = 0; countyTracts[t.countyFips] = 0; }
    countyPop[t.countyFips] += t.population;
    countyTracts[t.countyFips]++;
  }

  const urbanCounties = new Set();
  for (const [fips, pop] of Object.entries(countyPop)) {
    const avgPopPerTract = pop / (countyTracts[fips] || 1);
    // Census tracts typically contain 1,200-8,000 people
    // Urban areas have higher density tracts; rural have fewer people per tract
    // Threshold: average tract pop > 3,000 = urban (roughly matches urbanized area definition)
    if (avgPopPerTract > 3000) urbanCounties.add(fips);
  }

  console.log(`  ${urbanCounties.size} urban counties, ${Object.keys(countyPop).length - urbanCounties.size} rural counties`);
  return urbanCounties;
}

// -- Step 4: Compute nearest qualifying store for each tract --
function computeAccess(tracts, stores, urbanCounties) {
  console.log('Building KD-tree of qualifying stores...');
  const qualifyingStores = stores.filter(s => s.qualifying);
  const tree = new KDTree(qualifyingStores);

  console.log('Computing nearest qualifying store for each tract...');
  let processed = 0;
  const total = tracts.length;

  for (const tract of tracts) {
    const nearest = tree.nearest({ lat: tract.lat, lon: tract.lon });
    tract.distanceToStore = Math.round(nearest.dist * 100) / 100;
    tract.isUrban = urbanCounties.has(tract.countyFips);
    const threshold = tract.isUrban ? URBAN_THRESHOLD_MILES : RURAL_THRESHOLD_MILES;
    tract.isLowAccess = tract.distanceToStore > threshold;

    processed++;
    if (processed % 5000 === 0) {
      process.stdout.write(`  ${processed}/${total} tracts processed...\r`);
    }
  }
  console.log(`  ${total} tracts processed`);

  const lowAccess = tracts.filter(t => t.isLowAccess);
  console.log(`  ${lowAccess.length} low-access tracts (${(lowAccess.length / total * 100).toFixed(1)}%)`);
  return tracts;
}

// -- Step 5: Aggregate to county and state --
function aggregate(tracts, stores) {
  // Count all stores (not just qualifying) per county
  const storesByCounty = {};
  for (const s of stores) {
    // We don't have county FIPS for stores, so skip county store counts here
    // The PHP proxy handles that via outStatistics
  }

  // County aggregation
  const counties = {};
  for (const t of tracts) {
    if (!counties[t.countyFips]) {
      counties[t.countyFips] = {
        fips: t.countyFips,
        stateFips: t.stateFips,
        totalTracts: 0,
        lowAccessTracts: 0,
        totalPopulation: 0,
        lowAccessPopulation: 0,
        totalDistance: 0,
        isUrban: t.isUrban
      };
    }
    const c = counties[t.countyFips];
    c.totalTracts++;
    c.totalPopulation += t.population;
    c.totalDistance += t.distanceToStore;
    if (t.isLowAccess) {
      c.lowAccessTracts++;
      c.lowAccessPopulation += t.population;
    }
  }

  // Finalize county records
  const countyRecords = Object.values(counties).map(c => ({
    fips: c.fips,
    stateFips: c.stateFips,
    totalTracts: c.totalTracts,
    lowAccessTracts: c.lowAccessTracts,
    lowAccessPct: c.totalTracts > 0 ? Math.round((c.lowAccessTracts / c.totalTracts) * 1000) / 10 : 0,
    totalPopulation: c.totalPopulation,
    lowAccessPopulation: c.lowAccessPopulation,
    avgDistance: c.totalTracts > 0 ? Math.round((c.totalDistance / c.totalTracts) * 100) / 100 : 0,
    isUrban: c.isUrban
  }));

  // State aggregation
  const stateMap = {};
  for (const c of countyRecords) {
    const sf = c.stateFips;
    if (!stateMap[sf]) {
      stateMap[sf] = {
        fips: sf,
        state: FIPS_TO_ABBR[sf],
        name: STATE_NAMES[FIPS_TO_ABBR[sf]] || FIPS_TO_ABBR[sf],
        totalTracts: 0,
        lowAccessTracts: 0,
        totalPopulation: 0,
        lowAccessPopulation: 0,
        totalDistance: 0,
        counties: []
      };
    }
    const s = stateMap[sf];
    s.totalTracts += c.totalTracts;
    s.lowAccessTracts += c.lowAccessTracts;
    s.totalPopulation += c.totalPopulation;
    s.lowAccessPopulation += c.lowAccessPopulation;
    s.totalDistance += c.avgDistance * c.totalTracts;
    s.counties.push(c);
  }

  const stateRecords = Object.values(stateMap).map(s => ({
    fips: s.fips,
    state: s.state,
    name: s.name,
    totalTracts: s.totalTracts,
    lowAccessTracts: s.lowAccessTracts,
    lowAccessPct: s.totalTracts > 0 ? Math.round((s.lowAccessTracts / s.totalTracts) * 1000) / 10 : 0,
    totalPopulation: s.totalPopulation,
    lowAccessPopulation: s.lowAccessPopulation,
    avgDistance: s.totalTracts > 0 ? Math.round((s.totalDistance / s.totalTracts) * 100) / 100 : 0,
    counties: s.counties
  }));

  stateRecords.sort((a, b) => a.name.localeCompare(b.name));
  return stateRecords;
}

// -- Main --
async function main() {
  console.log('=== Computing Current Food Access ===\n');
  const startTime = Date.now();

  const stores = await downloadRetailers();
  const tracts = await downloadTractCentroids();
  const urbanCounties = classifyUrbanRural(tracts);
  const processedTracts = computeAccess(tracts, stores, urbanCounties);
  const stateData = aggregate(processedTracts, stores);

  // National summary
  const totalTracts = stateData.reduce((s, st) => s + st.totalTracts, 0);
  const lowAccessTracts = stateData.reduce((s, st) => s + st.lowAccessTracts, 0);
  const totalPop = stateData.reduce((s, st) => s + st.totalPopulation, 0);
  const lowAccessPop = stateData.reduce((s, st) => s + st.lowAccessPopulation, 0);
  const avgDist = totalTracts > 0 ? Math.round((stateData.reduce((s, st) => s + st.avgDistance * st.totalTracts, 0) / totalTracts) * 100) / 100 : 0;

  const output = {
    meta: {
      title: 'Current Food Access — Computed from Live Data Sources',
      description: 'Low-access tracts computed from current USDA FNS SNAP retailer locations + Census 2020 tract centroids. Qualifying stores: Supermarket, Super Store, Large Grocery Store. Thresholds: >1mi urban, >10mi rural.',
      sources: [
        'USDA FNS SNAP Retailer Location Data (current, via ArcGIS REST)',
        'U.S. Census Bureau, Centers of Population for Census Tracts: 2020'
      ],
      methodology: {
        qualifyingStores: 'Supermarket, Super Store, Large Grocery Store',
        urbanThreshold: '1 mile (straight-line distance)',
        ruralThreshold: '10 miles (straight-line distance)',
        urbanClassification: 'Counties with average tract population > 3,000 classified as urban',
        distanceMethod: 'Haversine (great-circle) distance from population-weighted tract centroid to nearest qualifying store'
      },
      computed: new Date().toISOString(),
      retailerCount: stores.length,
      qualifyingRetailerCount: stores.filter(s => s.qualifying).length,
      tractCount: totalTracts
    },
    national: {
      totalTracts,
      lowAccessTracts,
      lowAccessPct: Math.round((lowAccessTracts / totalTracts) * 1000) / 10,
      totalPopulation: totalPop,
      lowAccessPopulation: lowAccessPop,
      avgDistance: avgDist
    },
    states: stateData
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== Complete in ${elapsed}s ===`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log(`National: ${lowAccessTracts}/${totalTracts} tracts low-access (${output.national.lowAccessPct}%)`);
  console.log(`Low-access population: ${(lowAccessPop / 1e6).toFixed(1)}M of ${(totalPop / 1e6).toFixed(1)}M`);
  console.log(`Average distance to store: ${avgDist} miles`);

  // Top 5 worst states
  const worst = [...stateData].sort((a, b) => b.lowAccessPct - a.lowAccessPct).slice(0, 5);
  console.log('\nTop 5 worst states by low-access %:');
  worst.forEach(s => console.log(`  ${s.name}: ${s.lowAccessPct}% (${s.lowAccessTracts}/${s.totalTracts} tracts)`));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
