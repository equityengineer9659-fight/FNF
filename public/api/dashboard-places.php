<?php
/**
 * CDC PLACES API Proxy — Food-N-Force Dashboard
 * Fetches census-tract health indicators from data.cdc.gov (Socrata/SODA API)
 * and aggregates to state or county level. Caches responses for 24 hours.
 *
 * Endpoints:
 *   GET /api/dashboard-places.php?type=food-insecurity           — state-level food insecurity
 *   GET /api/dashboard-places.php?type=food-insecurity-county&state=AL — county-level for a state
 *   GET /api/dashboard-places.php?type=health-indicators         — multiple health measures by state
 *   GET /api/dashboard-places.php?type=snap-receipt              — SNAP receipt rates by state
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

// Validate type parameter
$validTypes = ['food-insecurity', 'food-insecurity-county', 'health-indicators', 'snap-receipt'];
if (!in_array($type, $validTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid type. Use: ' . implode(', ', $validTypes)]);
    exit;
}

// Validate state for county queries
if ($type === 'food-insecurity-county') {
    if (strlen($stateAbbr) !== 2) {
        http_response_code(400);
        echo json_encode(['error' => 'State must be a 2-letter abbreviation (e.g., state=AL)']);
        exit;
    }
}

// SODA API base URL
$baseUrl = 'https://data.cdc.gov/resource/cwsq-ngmh.json';

// Measure mappings
$measures = [
    'food-insecurity'        => ['FOODINSECU'],
    'food-insecurity-county' => ['FOODINSECU'],
    'health-indicators'      => ['FOODINSECU', 'OBESITY', 'DIABETES', 'DEPRESSION', 'ACCESS2', 'HOUSINSEC'],
    'snap-receipt'           => ['FOODSTAMP']
];

$measureNames = [
    'FOODINSECU' => 'Food Insecurity',
    'FOODSTAMP'  => 'SNAP Receipt',
    'OBESITY'    => 'Obesity',
    'DIABETES'   => 'Diabetes',
    'DEPRESSION' => 'Depression',
    'ACCESS2'    => 'Lack of Health Insurance',
    'HOUSINSEC'  => 'Housing Insecurity'
];

// Cache key and TTL
$cacheKey = $type === 'food-insecurity-county'
    ? "places-{$type}-{$stateAbbr}"
    : "places-{$type}";
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

// Rate limit: CDC PLACES is public but throttled; 1000 requests/day is conservative
if (!rateLimitCheck('cdc-places', 'daily', 900)) {
    returnStaleOrError($cacheFile, 'CDC PLACES API rate limit reached');
}

// -- Helper: return stale cache or 502 --
function returnStaleOrError($cacheFile, $errorMsg) {
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
    echo json_encode(['error' => $errorMsg]);
    exit;
}

// -- Helper: fetch from SODA API --
function fetchSODA($baseUrl, $params) {
    $url = $baseUrl . '?' . http_build_query($params);

    $context = stream_context_create([
        'http' => [
            'timeout' => 20,
            'header' => "User-Agent: FoodNForce-Dashboard/1.0\r\nAccept: application/json\r\n"
        ]
    ]);

    $response = @file_get_contents($url, false, $context);
    return $response;
}

// Build and execute queries based on type
$records = [];

if ($type === 'food-insecurity-county') {
    // County-level query for a specific state
    $measureList = $measures[$type];
    $whereClause = "measure='" . $measureList[0] . "' AND stateabbr='" . $stateAbbr . "'";

    $params = [
        '$select' => 'countyfips,countyname,avg(data_value) as avg_value',
        '$where'  => $whereClause,
        '$group'  => 'countyfips,countyname',
        '$limit'  => 5000
    ];

    $response = fetchSODA($baseUrl, $params);
    if ($response === false) {
        returnStaleOrError($cacheFile, 'CDC PLACES API unavailable');
    }
    rateLimitIncrement('cdc-places');

    $rows = json_decode($response, true);
    if (!is_array($rows)) {
        returnStaleOrError($cacheFile, 'Invalid response from CDC PLACES API');
    }

    foreach ($rows as $row) {
        if (isset($row['countyfips']) && isset($row['avg_value'])) {
            $records[] = [
                'fips'   => $row['countyfips'],
                'name'   => isset($row['countyname']) ? $row['countyname'] : '',
                'value'  => round(floatval($row['avg_value']), 1)
            ];
        }
    }

    // Sort by FIPS
    usort($records, function($a, $b) {
        return strcmp($a['fips'], $b['fips']);
    });

} elseif ($type === 'health-indicators') {
    // Multiple measures aggregated to state level
    $measureList = $measures[$type];
    $measureIn = implode("','", $measureList);
    $whereClause = "measure in ('" . $measureIn . "')";

    $params = [
        '$select' => 'stateabbr,measure,avg(data_value) as avg_value',
        '$where'  => $whereClause,
        '$group'  => 'stateabbr,measure',
        '$limit'  => 500
    ];

    $response = fetchSODA($baseUrl, $params);
    if ($response === false) {
        returnStaleOrError($cacheFile, 'CDC PLACES API unavailable');
    }
    rateLimitIncrement('cdc-places');

    $rows = json_decode($response, true);
    if (!is_array($rows)) {
        returnStaleOrError($cacheFile, 'Invalid response from CDC PLACES API');
    }

    // Group by state, with each measure as a field
    $stateData = [];
    foreach ($rows as $row) {
        if (!isset($row['stateabbr']) || !isset($row['measure']) || !isset($row['avg_value'])) continue;

        $st = $row['stateabbr'];
        if (!isset($stateData[$st])) {
            $stateData[$st] = ['state' => $st];
        }

        // Use measure short code as key (lowercase)
        $key = strtolower($row['measure']);
        $stateData[$st][$key] = round(floatval($row['avg_value']), 1);
    }

    $records = array_values($stateData);

    // Sort by state abbreviation
    usort($records, function($a, $b) {
        return strcmp($a['state'], $b['state']);
    });

} else {
    // Single measure aggregated to state level (food-insecurity or snap-receipt)
    $measureList = $measures[$type];
    $whereClause = "measure='" . $measureList[0] . "'";

    $params = [
        '$select' => 'stateabbr,avg(data_value) as avg_value',
        '$where'  => $whereClause,
        '$group'  => 'stateabbr',
        '$limit'  => 60
    ];

    $response = fetchSODA($baseUrl, $params);
    if ($response === false) {
        returnStaleOrError($cacheFile, 'CDC PLACES API unavailable');
    }
    rateLimitIncrement('cdc-places');

    $rows = json_decode($response, true);
    if (!is_array($rows)) {
        returnStaleOrError($cacheFile, 'Invalid response from CDC PLACES API');
    }

    foreach ($rows as $row) {
        if (isset($row['stateabbr']) && isset($row['avg_value'])) {
            $records[] = [
                'state' => $row['stateabbr'],
                'value' => round(floatval($row['avg_value']), 1)
            ];
        }
    }

    // Sort by state abbreviation
    usort($records, function($a, $b) {
        return strcmp($a['state'], $b['state']);
    });
}

// Build response
$result = [
    'type'      => $type,
    'year'      => 2023,
    'source'    => 'CDC PLACES, Model-Based Small Area Estimates',
    'measures'  => array_map(function($m) use ($measureNames) {
        return isset($measureNames[$m]) ? $measureNames[$m] : $m;
    }, $measures[$type]),
    'count'     => count($records),
    'fetchedAt' => date('c'),
    'records'   => $records
];

// Include state in response for county queries
if ($type === 'food-insecurity-county') {
    $result['state'] = $stateAbbr;
}

// Write cache
file_put_contents($cacheFile, json_encode($result));

$result['_cached'] = false;
echo json_encode($result);
