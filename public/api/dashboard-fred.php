<?php
/**
 * FRED API Proxy — Food-N-Force Dashboard
 * Fetches economic data from the Federal Reserve Economic Data (FRED) API.
 * Caches responses for 7 days.
 *
 * Endpoints:
 *   GET /api/dashboard-fred.php?type=snap-county&fips=06037  — County SNAP participation
 *   GET /api/dashboard-fred.php?type=cpi-item&series=CUUR0000SEFG01  — Item-level CPI
 *   GET /api/dashboard-fred.php?type=county-econ&fips=06037  — County unemployment rate
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');

// API key required for FRED
@include __DIR__ . '/_config.php';
require_once __DIR__ . '/_rate-limiter.php';

if (!defined('FRED_API_KEY') || FRED_API_KEY === '' || FRED_API_KEY === 'your-fred-api-key-here') {
    http_response_code(503);
    echo json_encode(['error' => 'FRED API key not configured']);
    exit;
}

$cacheDir = __DIR__ . '/../_cache/dashboard';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}

$type = isset($_GET['type']) ? $_GET['type'] : '';
$cacheTTL = 604800; // 7 days

// -- Input validation --

// Validate type parameter
$validTypes = ['snap-county', 'cpi-item', 'county-econ'];
if (!in_array($type, $validTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid type. Use snap-county, cpi-item, or county-econ']);
    exit;
}

// Sanitize FIPS (5 digits only)
$fips = isset($_GET['fips']) ? preg_replace('/[^0-9]/', '', $_GET['fips']) : '';

// Sanitize series ID (alphanumeric only)
$seriesParam = isset($_GET['series']) ? preg_replace('/[^A-Za-z0-9]/', '', $_GET['series']) : '';

// Validate required parameters per type
if (($type === 'snap-county' || $type === 'county-econ') && strlen($fips) !== 5) {
    http_response_code(400);
    echo json_encode(['error' => 'FIPS must be exactly 5 digits']);
    exit;
}

if ($type === 'cpi-item' && $seriesParam === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Series ID is required for cpi-item type']);
    exit;
}

// -- Build FRED series ID from type --

// State FIPS-to-abbreviation map for SNAP county series
$stateAbbrev = [
    '01'=>'AL','02'=>'AK','04'=>'AZ','05'=>'AR','06'=>'CA','08'=>'CO','09'=>'CT','10'=>'DE',
    '11'=>'DC','12'=>'FL','13'=>'GA','15'=>'HI','16'=>'ID','17'=>'IL','18'=>'IN','19'=>'IA',
    '20'=>'KS','21'=>'KY','22'=>'LA','23'=>'ME','24'=>'MD','25'=>'MA','26'=>'MI','27'=>'MN',
    '28'=>'MS','29'=>'MO','30'=>'MT','31'=>'NE','32'=>'NV','33'=>'NH','34'=>'NJ','35'=>'NM',
    '36'=>'NY','37'=>'NC','38'=>'ND','39'=>'OH','40'=>'OK','41'=>'OR','42'=>'PA','44'=>'RI',
    '45'=>'SC','46'=>'SD','47'=>'TN','48'=>'TX','49'=>'UT','50'=>'VT','51'=>'VA','53'=>'WA',
    '54'=>'WV','55'=>'WI','56'=>'WY'
];

$seriesId = '';
switch ($type) {
    case 'snap-county':
        $stateFips = substr($fips, 0, 2);
        $stateCode = isset($stateAbbrev[$stateFips]) ? $stateAbbrev[$stateFips] : '';
        if ($stateCode === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid state FIPS in county code']);
            exit;
        }
        // FRED SNAP county series: CBR{5-digit FIPS}{2-letter state}A647NCEN
        $seriesId = 'CBR' . $fips . $stateCode . 'A647NCEN';
        break;

    case 'cpi-item':
        $seriesId = $seriesParam;
        break;

    case 'county-econ':
        // FRED county unemployment: LAUCN{5-digit FIPS}0000000003
        $seriesId = 'LAUCN' . $fips . '0000000003';
        break;
}

// -- Cache check --
$cacheKey = 'fred-' . md5($type . '|' . $seriesId);
$cacheFile = "{$cacheDir}/{$cacheKey}.json";

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

// -- Rate limit check (FRED allows 120 requests/minute) --
if (!rateLimitCheck('fred', 'daily', 500)) {
    returnStaleOrError($cacheFile, 'FRED daily rate limit reached');
}

// -- Fetch from FRED API --
$url = 'https://api.stlouisfed.org/fred/series/observations?'
     . 'series_id=' . urlencode($seriesId)
     . '&api_key=' . urlencode(FRED_API_KEY)
     . '&file_type=json';

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 15,
        'header' => "User-Agent: FoodNForce-Dashboard/1.0\r\n"
    ]
]);

$response = @file_get_contents($url, false, $context);

if ($response === false) {
    returnStaleOrError($cacheFile, 'FRED API unavailable');
}

rateLimitIncrement('fred');

$raw = json_decode($response, true);
if (!$raw || !isset($raw['observations'])) {
    // FRED returns error_code for invalid series
    $errMsg = isset($raw['error_message']) ? $raw['error_message'] : 'Invalid FRED response';
    returnStaleOrError($cacheFile, $errMsg);
}

// -- Parse observations --
$observations = [];
foreach ($raw['observations'] as $obs) {
    // FRED uses "." for missing values
    if ($obs['value'] === '.') continue;
    $observations[] = [
        'date' => $obs['date'],
        'value' => floatval($obs['value'])
    ];
}

$result = [
    'type' => $type,
    'series' => $seriesId,
    'source' => 'FRED, Federal Reserve Bank of St. Louis',
    'fetchedAt' => date('c'),
    'observations' => $observations
];

// Write cache
file_put_contents($cacheFile, json_encode($result));

$result['_cached'] = false;
echo json_encode($result);
exit;

// -- Helper: return stale cache or error --
function returnStaleOrError($cacheFile, $errorMsg) {
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
    echo json_encode(['error' => $errorMsg]);
    exit;
}
