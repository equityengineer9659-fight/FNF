<?php
/**
 * BLS Food Price API Proxy — Food-N-Force Dashboard
 * Fetches Consumer Price Index data for food from api.bls.gov
 * Caches responses for 7 days (CPI is monthly).
 *
 * Endpoint:
 *   GET /api/dashboard-bls.php — returns monthly food CPI data (2018-present)
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');

$cacheDir = __DIR__ . '/../_cache/dashboard';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}

$cacheFile = "{$cacheDir}/bls-food-cpi.json";
$cacheTTL = 604800; // 7 days

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

// BLS API v1 (no key required)
// Series IDs:
//   CUUR0000SAF1  = Food at home (all urban consumers, US average)
//   CUUR0000SEFV  = Food away from home
//   CUUR0000SA0   = All items (for comparison)
$seriesIds = ['CUUR0000SAF1', 'CUUR0000SEFV', 'CUUR0000SA0'];
$startYear = 2018;
$endYear = intval(date('Y'));

$url = 'https://api.bls.gov/publicAPI/v1/timeseries/data/';

$postData = json_encode([
    'seriesid' => $seriesIds,
    'startyear' => strval($startYear),
    'endyear' => strval($endYear)
]);

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'timeout' => 15,
        'header' => "Content-Type: application/json\r\nUser-Agent: FoodNForce-Dashboard/1.0\r\n",
        'content' => $postData
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
    echo json_encode(['error' => 'BLS API unavailable']);
    exit;
}

$raw = json_decode($response, true);
if (!$raw || $raw['status'] !== 'REQUEST_SUCCEEDED') {
    http_response_code(502);
    echo json_encode(['error' => 'Invalid BLS response', 'details' => $raw['message'] ?? '']);
    exit;
}

// Parse BLS response into clean time series
$seriesNames = [
    'CUUR0000SAF1' => 'Food at Home',
    'CUUR0000SEFV' => 'Food Away from Home',
    'CUUR0000SA0'  => 'All Items'
];

$series = [];
foreach ($raw['Results']['series'] as $s) {
    $id = $s['seriesID'];
    $name = isset($seriesNames[$id]) ? $seriesNames[$id] : $id;
    $points = [];

    foreach ($s['data'] as $d) {
        // Only use annual averages (period M13) or monthly data
        $period = $d['period'];
        if (substr($period, 0, 1) !== 'M') continue;
        $month = intval(substr($period, 1));
        if ($month < 1 || $month > 12) continue;

        $points[] = [
            'year' => intval($d['year']),
            'month' => $month,
            'date' => sprintf('%d-%02d', $d['year'], $month),
            'value' => floatval($d['value'])
        ];
    }

    // Sort chronologically
    usort($points, function($a, $b) {
        return strcmp($a['date'], $b['date']);
    });

    $series[] = [
        'id' => $id,
        'name' => $name,
        'data' => $points
    ];
}

$result = [
    'source' => 'Bureau of Labor Statistics, Consumer Price Index',
    'startYear' => $startYear,
    'endYear' => $endYear,
    'fetchedAt' => date('c'),
    'series' => $series
];

// Write cache
file_put_contents($cacheFile, json_encode($result));

$result['_cached'] = false;
echo json_encode($result);
