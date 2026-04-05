<?php
/**
 * Census Bureau SAIPE API Proxy — Food-N-Force Dashboard
 * Fetches Small Area Income and Poverty Estimates from api.census.gov
 * More accurate poverty estimates for small counties than ACS.
 * Caches responses to JSON files for 24 hours.
 *
 * Endpoints:
 *   GET /api/dashboard-saipe.php?type=states          — all states poverty/income
 *   GET /api/dashboard-saipe.php?type=county&state=48  — counties for state FIPS
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/_rate-limiter.php';

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
$cacheKey = $type === 'states' ? 'saipe-states' : "saipe-county-{$stateFips}";
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

// Rate limit check (50/day without key, 500/day with key — use conservative limit)
if (!rateLimitCheck('census-saipe', 'daily', 45)) {
    // Over limit — return stale cache if available
    if (file_exists($cacheFile)) {
        $cached = file_get_contents($cacheFile);
        $data = json_decode($cached, true);
        if ($data) {
            $data['_cached'] = true;
            $data['_stale'] = true;
            $data['_rateLimited'] = true;
            $data['_cachedAt'] = date('c', filemtime($cacheFile));
            echo json_encode($data);
            exit;
        }
    }
    http_response_code(429);
    echo json_encode(['error' => 'Rate limit reached for Census SAIPE API']);
    exit;
}

// Build Census SAIPE API URL
$variables = 'SAEPOVRTALL_PT,SAEPOVRT0_17_PT,SAEMHI_PT,SAEPOVALL_PT,SAEPOV0_17_PT,NAME';

if ($type === 'states') {
    $url = "https://api.census.gov/data/timeseries/poverty/saipe?get={$variables}&for=state:*&time=2023";
} else {
    $url = "https://api.census.gov/data/timeseries/poverty/saipe?get={$variables}&for=county:*&in=state:{$stateFips}&time=2023";
}

// Fetch from Census SAIPE API
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
    echo json_encode(['error' => 'Census SAIPE API unavailable']);
    exit;
}

// Track successful API call
rateLimitIncrement('census-saipe');

$rows = json_decode($response, true);
if (!$rows || !is_array($rows) || count($rows) < 2) {
    http_response_code(502);
    echo json_encode(['error' => 'Invalid response from Census SAIPE API']);
    exit;
}

// Parse Census SAIPE response (first row is header)
// Expected columns: SAEPOVRTALL_PT, SAEPOVRT0_17_PT, SAEMHI_PT, SAEPOVALL_PT, SAEPOV0_17_PT, NAME, time, state [, county]
$header = $rows[0];

// Build column index map for resilient parsing
$colIndex = [];
for ($c = 0; $c < count($header); $c++) {
    $colIndex[$header[$c]] = $c;
}

$records = [];
for ($i = 1; $i < count($rows); $i++) {
    $row = $rows[$i];

    // Parse values — Census returns strings; "-" or null means suppressed data
    $povertyRate = _saipeParseFloat($row, $colIndex, 'SAEPOVRTALL_PT');
    $childPovertyRate = _saipeParseFloat($row, $colIndex, 'SAEPOVRT0_17_PT');
    $medianIncome = _saipeParseInt($row, $colIndex, 'SAEMHI_PT');
    $povertyCount = _saipeParseInt($row, $colIndex, 'SAEPOVALL_PT');
    $childPovertyCount = _saipeParseInt($row, $colIndex, 'SAEPOV0_17_PT');
    $name = isset($colIndex['NAME']) ? $row[$colIndex['NAME']] : '';

    // Strip state suffix from county names (e.g., "Autauga County, Alabama" → "Autauga County")
    if ($type === 'county') {
        $name = preg_replace('/, [A-Za-z ]+$/', '', $name);
    }

    // Build FIPS code
    if ($type === 'states') {
        $fips = isset($colIndex['state']) ? str_pad($row[$colIndex['state']], 2, '0', STR_PAD_LEFT) : '';
    } else {
        $stCode = isset($colIndex['state']) ? str_pad($row[$colIndex['state']], 2, '0', STR_PAD_LEFT) : '';
        $coCode = isset($colIndex['county']) ? str_pad($row[$colIndex['county']], 3, '0', STR_PAD_LEFT) : '';
        $fips = $stCode . $coCode;
    }

    $record = [
        'fips' => $fips,
        'name' => $name,
        'povertyRate' => $povertyRate,
        'childPovertyRate' => $childPovertyRate,
        'medianIncome' => $medianIncome,
        'povertyCount' => $povertyCount
    ];

    // Include child poverty count only if available
    if ($childPovertyCount !== null) {
        $record['childPovertyCount'] = $childPovertyCount;
    }

    $records[] = $record;
}

$result = [
    'type' => $type,
    'year' => 2023,
    'source' => 'Census Bureau, Small Area Income and Poverty Estimates (SAIPE)',
    'count' => count($records),
    'fetchedAt' => date('c'),
    'records' => $records
];

// Write cache
file_put_contents($cacheFile, json_encode($result));

$result['_cached'] = false;
echo json_encode($result);


// -- Helper functions --

/**
 * Parse a float value from a SAIPE row, returning null for suppressed/missing data.
 */
function _saipeParseFloat($row, $colIndex, $colName) {
    if (!isset($colIndex[$colName])) {
        return null;
    }
    $val = $row[$colIndex[$colName]];
    if ($val === null || $val === '' || $val === '-' || $val === '.' || $val === 'N/A') {
        return null;
    }
    return round(floatval($val), 1);
}

/**
 * Parse an integer value from a SAIPE row, returning null for suppressed/missing data.
 */
function _saipeParseInt($row, $colIndex, $colName) {
    if (!isset($colIndex[$colName])) {
        return null;
    }
    $val = $row[$colIndex[$colName]];
    if ($val === null || $val === '' || $val === '-' || $val === '.' || $val === 'N/A') {
        return null;
    }
    return intval($val);
}
