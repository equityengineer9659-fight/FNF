<?php
/**
 * USDA FNS SNAP Retailer Location Proxy — Food-N-Force Dashboard
 * Fetches current SNAP-authorized retailer counts from USDA FNS ArcGIS REST.
 * Aggregates by state or county + store type using outStatistics.
 * Caches responses for 7 days.
 *
 * Endpoints:
 *   GET /api/dashboard-fns-stores.php?type=state-summary    — state-level store counts
 *   GET /api/dashboard-fns-stores.php?type=county&state=TX  — county-level for a state (2-letter abbr)
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/_rate-limiter.php';

$cacheDir = __DIR__ . '/../_cache/dashboard';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}

$type = isset($_GET['type']) ? $_GET['type'] : '';
$stateAbbr = isset($_GET['state']) ? strtoupper(preg_replace('/[^A-Za-z]/', '', $_GET['state'])) : '';

// Input validation
if ($type !== 'state-summary' && $type !== 'county') {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid type. Use ?type=state-summary or ?type=county&state=XX']);
    exit;
}

if ($type === 'county' && strlen($stateAbbr) !== 2) {
    http_response_code(400);
    echo json_encode(['error' => 'State must be a 2-letter abbreviation (e.g., state=TX)']);
    exit;
}

// Cache key and TTL
$cacheKey = $type === 'state-summary' ? 'fns-stores-state' : "fns-stores-county-{$stateAbbr}";
$cacheFile = "{$cacheDir}/{$cacheKey}.json";
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

// Rate limit
if (!rateLimitCheck('fns-stores', 'daily', 300)) {
    returnStaleOrError($cacheFile, 'FNS store API rate limit reached');
}

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

// ArcGIS REST base URL
$baseUrl = 'https://services1.arcgis.com/RLQu0rK7h4kbsBq5/arcgis/rest/services/snap_retailer_location_data/FeatureServer/0/query';

$context = stream_context_create([
    'http' => [
        'timeout' => 30,
        'header' => "User-Agent: FoodNForce-Dashboard/1.0\r\n"
    ]
]);

// outStatistics definition: count stores
$stats = json_encode([
    ['statisticType' => 'count', 'onStatisticField' => 'ObjectId', 'outStatisticFieldName' => 'storeCount']
]);

if ($type === 'state-summary') {
    // Group by State + Store_Type
    $params = http_build_query([
        'where'                       => '1=1',
        'groupByFieldsForStatistics'  => 'State,Store_Type',
        'outStatistics'               => $stats,
        'f'                           => 'json',
        'resultRecordCount'           => 5000
    ]);

    $response = @file_get_contents("{$baseUrl}?{$params}", false, $context);
    if ($response === false) {
        returnStaleOrError($cacheFile, 'FNS ArcGIS unavailable');
    }
    rateLimitIncrement('fns-stores');

    $json = json_decode($response, true);
    if (!isset($json['features'])) {
        returnStaleOrError($cacheFile, 'Invalid response from FNS ArcGIS');
    }

    // Aggregate by state
    $states = [];
    foreach ($json['features'] as $f) {
        $a = $f['attributes'];
        $st = $a['State'];
        if (!isset($states[$st])) {
            $states[$st] = ['state' => $st, 'totalStores' => 0, 'types' => []];
        }
        $states[$st]['totalStores'] += $a['storeCount'];
        $states[$st]['types'][$a['Store_Type']] = $a['storeCount'];
    }

    $records = [];
    foreach ($states as $st => $data) {
        $t = $data['types'];
        $records[] = [
            'state'          => $st,
            'totalStores'    => $data['totalStores'],
            'supermarkets'   => ($t['Supermarket'] ?? 0),
            'superStores'    => ($t['Super Store'] ?? 0),
            'largeGrocery'   => ($t['Large Grocery Store'] ?? 0),
            'mediumGrocery'  => ($t['Medium Grocery Store'] ?? 0),
            'smallGrocery'   => ($t['Small Grocery Store'] ?? 0) + ($t['Grocery Store'] ?? 0),
            'convenience'    => ($t['Convenience Store'] ?? 0),
            'specialty'      => ($t['Specialty Store'] ?? 0) + ($t['Specialty Food Store'] ?? 0),
            'farmersMarkets' => ($t['Farmers Market'] ?? 0) + ($t["Farmers' Market"] ?? 0),
            'other'          => ($t['Other'] ?? 0)
        ];
    }

    usort($records, function($a, $b) { return strcmp($a['state'], $b['state']); });

    $result = [
        'type'      => 'state-summary',
        'source'    => 'USDA FNS SNAP Retailer Location Data via ArcGIS REST',
        'count'     => count($records),
        'fetchedAt' => date('c'),
        'records'   => $records
    ];

} else {
    // County-level: group by County + Store_Type for one state
    $params = http_build_query([
        'where'                       => "State='{$stateAbbr}'",
        'groupByFieldsForStatistics'  => 'County,Store_Type',
        'outStatistics'               => $stats,
        'f'                           => 'json',
        'resultRecordCount'           => 5000
    ]);

    $response = @file_get_contents("{$baseUrl}?{$params}", false, $context);
    if ($response === false) {
        returnStaleOrError($cacheFile, 'FNS ArcGIS unavailable');
    }
    rateLimitIncrement('fns-stores');

    $json = json_decode($response, true);
    if (!isset($json['features'])) {
        returnStaleOrError($cacheFile, 'Invalid response from FNS ArcGIS');
    }

    // Aggregate by county
    $counties = [];
    foreach ($json['features'] as $f) {
        $a = $f['attributes'];
        $county = $a['County'];
        if (!$county) continue;
        if (!isset($counties[$county])) {
            $counties[$county] = ['county' => $county, 'totalStores' => 0, 'types' => []];
        }
        $counties[$county]['totalStores'] += $a['storeCount'];
        $counties[$county]['types'][$a['Store_Type']] = $a['storeCount'];
    }

    $records = [];
    foreach ($counties as $name => $data) {
        $t = $data['types'];
        $fullService = ($t['Supermarket'] ?? 0) + ($t['Super Store'] ?? 0) + ($t['Large Grocery Store'] ?? 0);
        $total = $data['totalStores'];
        $records[] = [
            'county'         => ucwords(strtolower($name)),  // Normalize: "HARRIS" → "Harris"
            'totalStores'    => $total,
            'supermarkets'   => ($t['Supermarket'] ?? 0),
            'superStores'    => ($t['Super Store'] ?? 0),
            'largeGrocery'   => ($t['Large Grocery Store'] ?? 0),
            'convenience'    => ($t['Convenience Store'] ?? 0),
            'fullServicePct' => $total > 0 ? round($fullService / $total * 100, 1) : 0
        ];
    }

    usort($records, function($a, $b) { return strcmp($a['county'], $b['county']); });

    $result = [
        'type'      => 'county',
        'state'     => $stateAbbr,
        'source'    => 'USDA FNS SNAP Retailer Location Data via ArcGIS REST',
        'count'     => count($records),
        'fetchedAt' => date('c'),
        'records'   => $records
    ];
}

// Write cache
file_put_contents($cacheFile, json_encode($result));

$result['_cached'] = false;
echo json_encode($result);
