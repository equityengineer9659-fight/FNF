<?php
/**
 * Census SDOH Variables Proxy — Food-N-Force Dashboard
 * Fetches Social Determinants of Health data from Census ACS 5-year API.
 * Variables cover: education, health insurance, vehicle access, housing cost burden.
 * Caches responses for 24 hours.
 *
 * Endpoint:
 *   GET /api/dashboard-sdoh.php  — all states SDOH indicators
 *
 * Census ACS 5-Year Variables Used:
 *   B15003_001E  — Total population 25+ (education universe)
 *   B15003_017E  — High school diploma
 *   B15003_022E  — Bachelor's degree
 *   B15003_023E  — Master's degree
 *   B15003_024E  — Professional degree
 *   B15003_025E  — Doctorate degree
 *   B27001_001E  — Total population (health insurance universe)
 *   B27001_005E  — Male 6-17 no insurance
 *   B27001_008E  — Male 18-24 no insurance
 *   B27001_011E  — Male 25-34 no insurance
 *   B27001_014E  — Male 35-44 no insurance
 *   B27001_017E  — Male 45-54 no insurance
 *   B27001_020E  — Male 55-64 no insurance
 *   B27001_023E  — Male 65-74 no insurance
 *   B27001_033E  — Female 6-17 no insurance
 *   B27001_036E  — Female 18-24 no insurance
 *   B27001_039E  — Female 25-34 no insurance
 *   B27001_042E  — Female 35-44 no insurance
 *   B27001_045E  — Female 45-54 no insurance
 *   B27001_048E  — Female 55-64 no insurance
 *   B27001_051E  — Female 65-74 no insurance
 *   B08141_001E  — Workers 16+ (commute universe)
 *   B08141_002E  — Workers with no vehicle
 *   B25070_001E  — Renter-occupied units (housing cost universe)
 *   B25070_010E  — Renters paying 50%+ income on housing
 *   B01003_001E  — Total population
 *   B17001_002E  — Population below poverty level
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');

$cacheDir = __DIR__ . '/../_cache/dashboard';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}

$cacheFile = "{$cacheDir}/sdoh-states.json";
$cacheTTL = 86400; // 24 hours

// Check cache
if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTTL) {
    $cached = file_get_contents($cacheFile);
    $data = json_decode($cached, true);
    if ($data) {
        $data['_cached'] = true;
        $data['_cachedAt'] = date('c', filemtime($cacheFile));
        echo json_encode($data);
        exit;
    }
}

// Census ACS 5-year variables
$vars = implode(',', [
    'NAME',
    'B01003_001E',  // total population
    'B17001_002E',  // below poverty
    'B15003_001E',  // education universe (25+)
    'B15003_017E',  // HS diploma
    'B15003_022E',  // bachelor's
    'B15003_023E',  // master's
    'B15003_024E',  // professional
    'B15003_025E',  // doctorate
    'B27001_001E',  // insurance universe
    'B27001_005E','B27001_008E','B27001_011E','B27001_014E',
    'B27001_017E','B27001_020E','B27001_023E',  // male uninsured by age
    'B27001_033E','B27001_036E','B27001_039E','B27001_042E',
    'B27001_045E','B27001_048E','B27001_051E',  // female uninsured by age
    'B08141_001E',  // commute universe
    'B08141_002E',  // no vehicle workers
    'B25070_001E',  // renter universe
    'B25070_010E'   // severe housing cost burden (50%+)
]);

$url = "https://api.census.gov/data/2023/acs/acs5?get={$vars}&for=state:*";

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 20,
        'header' => "User-Agent: FoodNForce-Dashboard/1.0\r\n"
    ]
]);

$response = @file_get_contents($url, false, $context);

if ($response === false) {
    // Return stale cache if available
    if (file_exists($cacheFile)) {
        $cached = file_get_contents($cacheFile);
        $data = json_decode($cached, true);
        if ($data) {
            $data['_cached'] = true;
            $data['_stale'] = true;
            echo json_encode($data);
            exit;
        }
    }
    http_response_code(502);
    echo json_encode(['error' => 'Census API unavailable']);
    exit;
}

$raw = json_decode($response, true);
if (!$raw || count($raw) < 2) {
    http_response_code(502);
    echo json_encode(['error' => 'Invalid Census response']);
    exit;
}

// Parse — first row is headers, rest is data
$headers = $raw[0];
$states = [];

for ($i = 1; $i < count($raw); $i++) {
    $row = $raw[$i];
    $name = $row[0];
    $fips = $row[count($row) - 1]; // state FIPS is last column

    $pop     = intval($row[1]);
    $poverty = intval($row[2]);

    // Education: % with bachelor's or higher
    $eduUniverse = intval($row[3]);
    $bachelors   = intval($row[5]);
    $masters     = intval($row[6]);
    $professional = intval($row[7]);
    $doctorate   = intval($row[8]);
    $collegeEdu  = $bachelors + $masters + $professional + $doctorate;
    $collegePct  = $eduUniverse > 0 ? round($collegeEdu / $eduUniverse * 100, 1) : 0;

    // Health insurance: % uninsured
    $insUniverse = intval($row[9]);
    $uninsured = 0;
    for ($j = 10; $j <= 23; $j++) {
        $uninsured += intval($row[$j]);
    }
    $uninsuredPct = $insUniverse > 0 ? round($uninsured / $insUniverse * 100, 1) : 0;

    // Transportation: % workers with no vehicle
    $commuteUniverse = intval($row[24]);
    $noVehicle       = intval($row[25]);
    $noVehiclePct    = $commuteUniverse > 0 ? round($noVehicle / $commuteUniverse * 100, 1) : 0;

    // Housing: % renters with severe cost burden (50%+ income)
    $renterUniverse  = intval($row[26]);
    $severeBurden    = intval($row[27]);
    $housingBurdenPct = $renterUniverse > 0 ? round($severeBurden / $renterUniverse * 100, 1) : 0;

    // Poverty rate
    $povertyRate = $pop > 0 ? round($poverty / $pop * 100, 1) : 0;

    $states[] = [
        'name'             => $name,
        'fips'             => $fips,
        'population'       => $pop,
        'povertyRate'      => $povertyRate,
        'collegePct'       => $collegePct,
        'uninsuredPct'     => $uninsuredPct,
        'noVehiclePct'     => $noVehiclePct,
        'housingBurdenPct' => $housingBurdenPct
    ];
}

$result = [
    'source' => 'U.S. Census Bureau, American Community Survey 5-Year Estimates (2023)',
    'description' => 'Social determinants of health indicators by state: poverty, education, insurance, transportation, housing',
    'fetchedAt' => date('c'),
    'year' => 2023,
    'states' => $states
];

// Write cache
file_put_contents($cacheFile, json_encode($result));

$result['_cached'] = false;
echo json_encode($result);
