<?php
/**
 * BLS Food Price API Proxy — Food-N-Force Dashboard
 * Fetches Consumer Price Index data for food from api.bls.gov
 * Caches responses for 7 days (CPI is monthly).
 *
 * Endpoints:
 *   GET /api/dashboard-bls.php              — monthly food CPI (3 series: 2018-present)
 *   GET /api/dashboard-bls.php?type=regional — category + regional CPI (9 series)
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
require_once __DIR__ . '/_cors.php';

// Only allow GET requests
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Optional API key for BLS v2 (higher rate limits)
@include __DIR__ . '/_config.php';
require_once __DIR__ . '/_rate-limiter.php';

$cacheDir = __DIR__ . '/../_cache/dashboard';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}

$type = isset($_GET['type']) ? $_GET['type'] : 'default';
$cacheTTL = 604800; // 7 days

// -- Helper: fetch series from BLS API --
function fetchBLSSeries($seriesIds, $startYear, $endYear) {
    $useV2 = defined('BLS_API_KEY') && BLS_API_KEY !== '';
    $url = $useV2
        ? 'https://api.bls.gov/publicAPI/v2/timeseries/data/'
        : 'https://api.bls.gov/publicAPI/v1/timeseries/data/';

    // v2 supports 50 series per request; v1 supports only 3
    $maxPerRequest = $useV2 ? 50 : 3;
    $chunks = array_chunk($seriesIds, $maxPerRequest);
    $allSeries = [];

    foreach ($chunks as $chunk) {
        // Rate limit: 450/day (free tier = 500 for v2, 25 for v1)
        $dailyLimit = $useV2 ? 450 : 20;
        if (!rateLimitCheck('bls', 'daily', $dailyLimit)) {
            return false; // will fall back to stale cache
        }

        $payload = [
            'seriesid' => $chunk,
            'startyear' => strval($startYear),
            'endyear' => strval($endYear)
        ];
        if ($useV2) {
            $payload['registrationkey'] = BLS_API_KEY;
        }

        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'timeout' => 15,
                'header' => "Content-Type: application/json\r\nUser-Agent: FoodNForce-Dashboard/1.0\r\n",
                'content' => json_encode($payload)
            ]
        ]);

        $response = @file_get_contents($url, false, $context);
        if ($response === false) return false;
        rateLimitIncrement('bls');

        $raw = json_decode($response, true);
        if (!$raw || $raw['status'] !== 'REQUEST_SUCCEEDED') return false;

        foreach ($raw['Results']['series'] as $s) {
            $allSeries[] = $s;
        }
    }

    return $allSeries;
}

// -- Helper: parse BLS series data into clean points --
function parseSeries($blsSeries, $nameMap) {
    $result = [];
    foreach ($blsSeries as $s) {
        $id = $s['seriesID'];
        $name = isset($nameMap[$id]) ? $nameMap[$id] : $id;
        $points = [];

        foreach ($s['data'] as $d) {
            $period = $d['period'];
            if (substr($period, 0, 1) !== 'M') continue;
            $month = intval(substr($period, 1));
            if ($month < 1 || $month > 12) continue;

            $points[] = [
                'date' => sprintf('%d-%02d', $d['year'], $month),
                'value' => floatval($d['value'])
            ];
        }

        usort($points, function($a, $b) {
            return strcmp($a['date'], $b['date']);
        });

        $result[] = [
            'id' => $id,
            'name' => $name,
            'data' => $points
        ];
    }
    return $result;
}

// -- Helper: return stale cache or 502 --
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

// ============================================================
// Route: ?type=regional — Category + Regional CPI
// ============================================================
if ($type === 'regional') {
    $cacheFile = "{$cacheDir}/bls-regional-cpi.json";

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

    // Series IDs
    $categoryIds = ['CUUR0000SAF111', 'CUUR0000SAF112', 'CUUR0000SAF113', 'CUUR0000SAF114', 'CUUR0000SAF115', 'CUUR0000SAF116', 'CUUR0000SAF1'];
    $regionIds = ['CUUR0100SAF1', 'CUUR0200SAF1', 'CUUR0300SAF1', 'CUUR0400SAF1'];
    $allIds = array_merge($categoryIds, $regionIds);

    $startYear = 2018;
    $endYear = intval(date('Y'));

    $blsSeries = fetchBLSSeries($allIds, $startYear, $endYear);
    if ($blsSeries === false) {
        returnStaleOrError($cacheFile, 'BLS API unavailable');
    }

    $nameMap = [
        'CUUR0000SAF111' => 'Cereals & Bakery',
        'CUUR0000SAF112' => 'Meats, Poultry & Fish',
        'CUUR0000SAF113' => 'Dairy & Related',
        'CUUR0000SAF114' => 'Fruits & Vegetables',
        'CUUR0000SAF115' => 'Nonalcoholic Beverages',
        'CUUR0000SAF116' => 'Other Food at Home',
        'CUUR0000SAF1'   => 'All Food at Home',
        'CUUR0100SAF1'   => 'Northeast',
        'CUUR0200SAF1'   => 'Midwest',
        'CUUR0300SAF1'   => 'South',
        'CUUR0400SAF1'   => 'West'
    ];

    $parsed = parseSeries($blsSeries, $nameMap);

    // Split into categories and regions
    $catSeries = [];
    $regSeries = [];
    foreach ($parsed as $s) {
        if (in_array($s['id'], $categoryIds)) {
            $catSeries[] = $s;
        } else {
            $regSeries[] = $s;
        }
    }

    $result = [
        'source' => 'Bureau of Labor Statistics, Consumer Price Index',
        'description' => 'Food CPI by category and region',
        'fetchedAt' => date('c'),
        'categories' => [
            'meta' => ['startYear' => $startYear, 'endYear' => $endYear, 'baseline' => '1982-84 = 100'],
            'series' => $catSeries
        ],
        'regions' => [
            'meta' => ['startYear' => 2018, 'endYear' => $endYear, 'series' => 'Food at Home CPI by region'],
            'series' => $regSeries
        ]
    ];

    file_put_contents($cacheFile, json_encode($result));
    $result['_cached'] = false;
    echo json_encode($result);
    exit;
}

// ============================================================
// Route: default — Core Food CPI (3 series)
// ============================================================
$cacheFile = "{$cacheDir}/bls-food-cpi.json";

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

$seriesIds = ['CUUR0000SAF1', 'CUUR0000SEFV', 'CUUR0000SA0'];
$startYear = 2018;
$endYear = intval(date('Y'));

$blsSeries = fetchBLSSeries($seriesIds, $startYear, $endYear);
if ($blsSeries === false) {
    returnStaleOrError($cacheFile, 'BLS API unavailable');
}

$nameMap = [
    'CUUR0000SAF1' => 'Food at Home',
    'CUUR0000SEFV' => 'Food Away from Home',
    'CUUR0000SA0'  => 'All Items'
];

$parsed = parseSeries($blsSeries, $nameMap);

// Default route uses {year, month, date, value} format for backward compatibility
$series = [];
foreach ($parsed as $s) {
    $points = [];
    foreach ($s['data'] as $p) {
        $parts = explode('-', $p['date']);
        $points[] = [
            'year' => intval($parts[0]),
            'month' => intval($parts[1]),
            'date' => $p['date'],
            'value' => $p['value']
        ];
    }
    $series[] = [
        'id' => $s['id'],
        'name' => $s['name'],
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

file_put_contents($cacheFile, json_encode($result));
$result['_cached'] = false;
echo json_encode($result);
