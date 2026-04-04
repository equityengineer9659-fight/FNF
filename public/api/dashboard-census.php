<?php
/**
 * Census Bureau API Proxy — Food-N-Force Dashboard
 * Fetches state and county poverty/income data from api.census.gov
 * Caches responses to JSON files for 24 hours.
 *
 * Endpoints:
 *   GET /api/dashboard-census.php?type=states        — all states poverty data
 *   GET /api/dashboard-census.php?type=county&state=48 — counties for state FIPS
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');

// Cache directory (writable by PHP on SiteGround)
$cacheDir = __DIR__ . '/../_cache/dashboard';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}

$type = isset($_GET['type']) ? $_GET['type'] : '';
$stateFips = isset($_GET['state']) ? preg_replace('/[^0-9]/', '', $_GET['state']) : '';

if ($type !== 'states' && $type !== 'county') {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid type. Use ?type=states or ?type=county&state=XX']);
    exit;
}

if ($type === 'county' && (strlen($stateFips) < 2 || strlen($stateFips) > 2)) {
    http_response_code(400);
    echo json_encode(['error' => 'State FIPS must be 2 digits']);
    exit;
}

// Cache key and TTL
$cacheKey = $type === 'states' ? 'census-states' : "census-county-{$stateFips}";
$cacheFile = "{$cacheDir}/{$cacheKey}.json";
$cacheTTL = 86400; // 24 hours

// Check cache
if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTTL) {
    $cached = file_get_contents($cacheFile);
    $data = json_decode($cached, true);
    if ($data) {
        $data['_cached'] = true;
        $data['_cachedAt'] = date('c', filemtime($cacheFile));
        $data['_expiresAt'] = date('c', filemtime($cacheFile) + $cacheTTL);
        echo json_encode($data);
        exit;
    }
}

// Build Census API URL
// ACS 5-year: B17001_002E = poverty population, B01003_001E = total population
if ($type === 'states') {
    $url = 'https://api.census.gov/data/2023/acs/acs5?get=NAME,B17001_002E,B01003_001E&for=state:*';
} else {
    $url = "https://api.census.gov/data/2023/acs/acs5?get=NAME,B17001_002E,B01003_001E&for=county:*&in=state:{$stateFips}";
}

// Fetch from Census API
$context = stream_context_create([
    'http' => [
        'timeout' => 15,
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
            $data['_cachedAt'] = date('c', filemtime($cacheFile));
            echo json_encode($data);
            exit;
        }
    }
    http_response_code(502);
    echo json_encode(['error' => 'Census API unavailable']);
    exit;
}

$rows = json_decode($response, true);
if (!$rows || !is_array($rows) || count($rows) < 2) {
    http_response_code(502);
    echo json_encode(['error' => 'Invalid response from Census API']);
    exit;
}

// Parse Census response (first row is header)
$header = $rows[0];
$records = [];
for ($i = 1; $i < count($rows); $i++) {
    $row = $rows[$i];
    $name = preg_replace('/, [A-Za-z ]+$/', '', $row[0]); // Strip state suffix
    $povertyPop = intval($row[1]);
    $totalPop = max(intval($row[2]), 1);
    $povertyRate = round(($povertyPop / $totalPop) * 100, 1);

    // Model food insecurity from poverty (regression: ~0.75 * poverty + 2.5)
    // Note: county-level FI rates are modeled estimates, not official USDA survey data.
    $fiRate = round(min(35, max(3, 0.75 * $povertyRate + 2.5)), 1);
    // Child rate uses national child-to-adult FI ratio (1.4x) from Feeding America state data.
    $childRate = round(min(40, $fiRate * 1.4), 1);

    if ($type === 'states') {
        $fips = str_pad($row[3], 2, '0', STR_PAD_LEFT);
        $records[] = [
            'fips' => $fips,
            'name' => $name,
            'population' => $totalPop,
            'povertyRate' => $povertyRate,
            'rate' => $fiRate,
            'childRate' => $childRate,
            'persons' => round($totalPop * $fiRate / 100)
        ];
    } else {
        $fips = str_pad($row[3], 2, '0', STR_PAD_LEFT) . str_pad($row[4], 3, '0', STR_PAD_LEFT);
        $records[] = [
            'fips' => $fips,
            'name' => $name,
            'population' => $totalPop,
            'povertyRate' => $povertyRate,
            'rate' => $fiRate,
            'childRate' => $childRate,
            'persons' => round($totalPop * $fiRate / 100)
        ];
    }
}

$result = [
    'type' => $type,
    'year' => 2023,
    'source' => 'Census Bureau ACS 5-Year Estimates',
    'count' => count($records),
    'fetchedAt' => date('c'),
    'records' => $records
];

// Write cache
file_put_contents($cacheFile, json_encode($result));

$result['_cached'] = false;
echo json_encode($result);
