<?php
/**
 * USDA Food Access Research Atlas Proxy — Food-N-Force Dashboard
 * Fetches food desert / food access data from USDA ERS ArcGIS REST services.
 * Endpoint migrated 2026-04: FARA/FARA_2019/MapServer/30 (was FoodAccess_2019/FeatureServer/1).
 * Caches responses for 7 days (data is 2019 vintage, does not change).
 *
 * Endpoints:
 *   GET /api/dashboard-fara.php?type=state-summary     — state-level aggregates via outStatistics
 *   GET /api/dashboard-fara.php?type=county&state=XX   — county-level aggregates for a state
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
$stateFips = isset($_GET['state']) ? preg_replace('/[^0-9]/', '', $_GET['state']) : '';

// Input validation
if ($type !== 'state-summary' && $type !== 'county') {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid type. Use ?type=state-summary or ?type=county&state=XX']);
    exit;
}

if ($type === 'county' && strlen($stateFips) !== 2) {
    http_response_code(400);
    echo json_encode(['error' => 'State FIPS must be 2 digits']);
    exit;
}

// Cache key and TTL
$cacheKey = $type === 'state-summary' ? 'fara-state-summary' : "fara-county-{$stateFips}";
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

// Rate limit check (ArcGIS has no hard auth limit, but be polite)
if (!rateLimitCheck('fara', 'daily', 500)) {
    // Return stale cache if available
    if (file_exists($cacheFile)) {
        $cached = file_get_contents($cacheFile);
        $data = json_decode($cached, true);
        if ($data) {
            $data['_cached'] = true;
            $data['_stale'] = true;
            $data['_rateLimited'] = true;
            echo json_encode($data);
            exit;
        }
    }
    http_response_code(429);
    echo json_encode(['error' => 'Rate limit reached for FARA API']);
    exit;
}

// ArcGIS REST base URL
$baseUrl = 'https://gisportal.ers.usda.gov/server/rest/services/FARA/FARA_2019/MapServer/30/query';

$context = stream_context_create([
    'http' => [
        'timeout' => 30,
        'header' => "User-Agent: FoodNForce-Dashboard/1.0\r\n"
    ]
]);

if ($type === 'state-summary') {
    $result = fetchStateSummary($baseUrl, $context);
} else {
    $result = fetchCountyData($baseUrl, $context, $stateFips);
}

if ($result === null) {
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
    echo json_encode(['error' => 'USDA FARA API unavailable']);
    exit;
}

// Increment rate limit counter
rateLimitIncrement('fara');

// Write cache
file_put_contents($cacheFile, json_encode($result));

$result['_cached'] = false;
echo json_encode($result);


// ---- State name → FIPS mapping ----
$STATE_FIPS = [
    'Alabama'=>'01','Alaska'=>'02','Arizona'=>'04','Arkansas'=>'05','California'=>'06',
    'Colorado'=>'08','Connecticut'=>'09','Delaware'=>'10','District of Columbia'=>'11',
    'Florida'=>'12','Georgia'=>'13','Hawaii'=>'15','Idaho'=>'16','Illinois'=>'17',
    'Indiana'=>'18','Iowa'=>'19','Kansas'=>'20','Kentucky'=>'21','Louisiana'=>'22',
    'Maine'=>'23','Maryland'=>'24','Massachusetts'=>'25','Michigan'=>'26','Minnesota'=>'27',
    'Mississippi'=>'28','Missouri'=>'29','Montana'=>'30','Nebraska'=>'31','Nevada'=>'32',
    'New Hampshire'=>'33','New Jersey'=>'34','New Mexico'=>'35','New York'=>'36',
    'North Carolina'=>'37','North Dakota'=>'38','Ohio'=>'39','Oklahoma'=>'40','Oregon'=>'41',
    'Pennsylvania'=>'42','Rhode Island'=>'44','South Carolina'=>'45','South Dakota'=>'46',
    'Tennessee'=>'47','Texas'=>'48','Utah'=>'49','Vermont'=>'50','Virginia'=>'51',
    'Washington'=>'53','West Virginia'=>'54','Wisconsin'=>'55','Wyoming'=>'56',
    'Puerto Rico'=>'72','Guam'=>'66','Virgin Islands'=>'78','American Samoa'=>'60',
    'Northern Mariana Islands'=>'69'
];

// ---- Query functions ----

/**
 * Fetch state-level summary using outStatistics (server-side aggregation).
 * Groups by St_Name and maps to FIPS codes for JS compatibility.
 */
function fetchStateSummary($baseUrl, $context) {
    global $STATE_FIPS;

    $stats = [
        ['statisticType' => 'count', 'onStatisticField' => 'LILATracts_1And10', 'outStatisticFieldName' => 'totalTracts'],
        ['statisticType' => 'sum',   'onStatisticField' => 'LILATracts_1And10', 'outStatisticFieldName' => 'lilaTracts'],
        ['statisticType' => 'avg',   'onStatisticField' => 'PovertyRate',       'outStatisticFieldName' => 'avgPovertyRate'],
        ['statisticType' => 'sum',   'onStatisticField' => 'lapop1',            'outStatisticFieldName' => 'lowAccessPop'],
        ['statisticType' => 'sum',   'onStatisticField' => 'lalowi1',           'outStatisticFieldName' => 'lowIncomeLowAccess'],
        ['statisticType' => 'sum',   'onStatisticField' => 'lahunv1',           'outStatisticFieldName' => 'noVehicleLowAccess'],
        ['statisticType' => 'sum',   'onStatisticField' => 'lasnap1',           'outStatisticFieldName' => 'snapLowAccess']
    ];

    $params = [
        'where'            => '1=1',
        'outStatistics'    => json_encode($stats),
        'groupByFieldsForStatistics' => 'St_Name',
        'f'                => 'json',
        'returnGeometry'   => 'false'
    ];

    $url = $baseUrl . '?' . http_build_query($params);
    $response = @file_get_contents($url, false, $context);

    if ($response === false) {
        return null;
    }

    $json = json_decode($response, true);
    if (!$json || isset($json['error']) || !isset($json['features'])) {
        return fetchStateSummaryFallback($baseUrl, $context, $stats);
    }

    $records = [];
    foreach ($json['features'] as $feature) {
        $attrs = $feature['attributes'];
        $stateName = $attrs['St_Name'] ?? null;
        if (!$stateName || !isset($STATE_FIPS[$stateName])) continue;
        $fips = $STATE_FIPS[$stateName];
        $records[] = [
            'state'              => $fips,
            'totalTracts'        => intval($attrs['totalTracts'] ?? 0),
            'lilaTracts'         => intval($attrs['lilaTracts'] ?? 0),
            'avgPovertyRate'     => round(floatval($attrs['avgPovertyRate'] ?? 0), 1),
            'lowAccessPop'       => intval($attrs['lowAccessPop'] ?? 0),
            'lowIncomeLowAccess' => intval($attrs['lowIncomeLowAccess'] ?? 0),
            'noVehicleLowAccess' => intval($attrs['noVehicleLowAccess'] ?? 0),
            'snapLowAccess'      => intval($attrs['snapLowAccess'] ?? 0)
        ];
    }

    usort($records, function($a, $b) { return strcmp($a['state'], $b['state']); });

    return [
        'type'      => 'state-summary',
        'year'      => 2019,
        'source'    => 'USDA ERS, Food Access Research Atlas via ArcGIS REST',
        'count'     => count($records),
        'fetchedAt' => date('c'),
        'records'   => $records
    ];
}

/**
 * Fallback: if 'State' field isn't available for groupBy, fetch all tracts with
 * outStatistics grouped by CensusTract prefix using a different approach.
 * This queries with outFields and aggregates in PHP.
 */
function fetchStateSummaryFallback($baseUrl, $context, $stats) {
    // Try using CAST/SUBSTRING expression — ArcGIS SQL varies by backend
    // If the first approach failed, try fetching minimal fields and aggregating in PHP
    $allRecords = [];
    $offset = 0;
    $batchSize = 5000;

    do {
        $params = [
            'where'             => '1=1',
            'outFields'         => 'CensusTract,LILATracts_1And10,PovertyRate,lapop1,lalowi1,lahunv1,lasnap1',
            'f'                 => 'json',
            'returnGeometry'    => 'false',
            'resultRecordCount' => $batchSize,
            'resultOffset'      => $offset
        ];

        $url = $baseUrl . '?' . http_build_query($params);
        $response = @file_get_contents($url, false, $context);

        if ($response === false) {
            return null;
        }

        $json = json_decode($response, true);
        if (!$json || isset($json['error']) || !isset($json['features'])) {
            return null;
        }

        foreach ($json['features'] as $feature) {
            $allRecords[] = $feature['attributes'];
        }

        $offset += $batchSize;
        $hasMore = isset($json['exceededTransferLimit']) && $json['exceededTransferLimit'] === true;
    } while ($hasMore);

    // Aggregate by state (first 2 digits of CensusTract)
    $states = [];
    foreach ($allRecords as $row) {
        $tract = strval($row['CensusTract']);
        $state = str_pad(substr($tract, 0, strlen($tract) - 9), 2, '0', STR_PAD_LEFT);

        if (!isset($states[$state])) {
            $states[$state] = [
                'totalTracts' => 0, 'lilaTracts' => 0, 'povertySum' => 0,
                'lowAccessPop' => 0, 'lowIncomeLowAccess' => 0,
                'noVehicleLowAccess' => 0, 'snapLowAccess' => 0
            ];
        }

        $s = &$states[$state];
        $s['totalTracts']++;
        $s['lilaTracts'] += intval($row['LILATracts_1And10'] ?? 0);
        $s['povertySum'] += floatval($row['PovertyRate'] ?? 0);
        $s['lowAccessPop'] += intval($row['lapop1'] ?? 0);
        $s['lowIncomeLowAccess'] += intval($row['lalowi1'] ?? 0);
        $s['noVehicleLowAccess'] += intval($row['lahunv1'] ?? 0);
        $s['snapLowAccess'] += intval($row['lasnap1'] ?? 0);
    }

    $records = [];
    foreach ($states as $state => $s) {
        $records[] = [
            'state'              => $state,
            'totalTracts'        => $s['totalTracts'],
            'lilaTracts'         => $s['lilaTracts'],
            'avgPovertyRate'     => $s['totalTracts'] > 0 ? round($s['povertySum'] / $s['totalTracts'], 1) : 0,
            'lowAccessPop'       => $s['lowAccessPop'],
            'lowIncomeLowAccess' => $s['lowIncomeLowAccess'],
            'noVehicleLowAccess' => $s['noVehicleLowAccess'],
            'snapLowAccess'      => $s['snapLowAccess']
        ];
    }

    usort($records, function($a, $b) { return strcmp($a['state'], $b['state']); });

    return [
        'type'      => 'state-summary',
        'year'      => 2019,
        'source'    => 'USDA ERS, Food Access Research Atlas via ArcGIS REST',
        'count'     => count($records),
        'fetchedAt' => date('c'),
        'records'   => $records
    ];
}

/**
 * Fetch tract-level data for a state, aggregate to county level in PHP.
 * County FIPS = first 5 digits of the 11-digit CensusTract.
 */
function fetchCountyData($baseUrl, $context, $stateFips) {
    $allRecords = [];
    $offset = 0;
    $batchSize = 5000;

    $outFields = 'CensusTract,PovertyRate,MedianFamilyIncome,LILATracts_1And10,lapop1,lalowi1,lahunv1,lasnap1,TractSNAP';

    do {
        $params = [
            'where'             => "CensusTract LIKE '{$stateFips}%'",
            'outFields'         => $outFields,
            'f'                 => 'json',
            'returnGeometry'    => 'false',
            'resultRecordCount' => $batchSize,
            'resultOffset'      => $offset
        ];

        $url = $baseUrl . '?' . http_build_query($params);
        $response = @file_get_contents($url, false, $context);

        if ($response === false) {
            return null;
        }

        $json = json_decode($response, true);
        if (!$json || isset($json['error']) || !isset($json['features'])) {
            return null;
        }

        foreach ($json['features'] as $feature) {
            $allRecords[] = $feature['attributes'];
        }

        $offset += $batchSize;
        $hasMore = isset($json['exceededTransferLimit']) && $json['exceededTransferLimit'] === true;
    } while ($hasMore);

    if (empty($allRecords)) {
        return [
            'type'      => 'county',
            'state'     => $stateFips,
            'year'      => 2019,
            'source'    => 'USDA ERS, Food Access Research Atlas via ArcGIS REST',
            'count'     => 0,
            'fetchedAt' => date('c'),
            'records'   => []
        ];
    }

    // Aggregate tracts to county level (first 5 digits of CensusTract)
    $counties = [];
    foreach ($allRecords as $row) {
        $tract = strval($row['CensusTract']);
        $countyFips = substr($tract, 0, 5);

        if (!isset($counties[$countyFips])) {
            $counties[$countyFips] = [
                'tractCount' => 0, 'lilaTracts' => 0,
                'povertySum' => 0, 'incomeSum' => 0, 'incomeCount' => 0,
                'lowAccessPop' => 0, 'lowIncomeLowAccess' => 0,
                'noVehicleLowAccess' => 0, 'snapLowAccess' => 0, 'tractSNAP' => 0
            ];
        }

        $c = &$counties[$countyFips];
        $c['tractCount']++;
        $c['lilaTracts'] += intval($row['LILATracts_1And10'] ?? 0);
        $c['povertySum'] += floatval($row['PovertyRate'] ?? 0);
        if (!empty($row['MedianFamilyIncome'])) {
            $c['incomeSum'] += floatval($row['MedianFamilyIncome']);
            $c['incomeCount']++;
        }
        $c['lowAccessPop'] += intval($row['lapop1'] ?? 0);
        $c['lowIncomeLowAccess'] += intval($row['lalowi1'] ?? 0);
        $c['noVehicleLowAccess'] += intval($row['lahunv1'] ?? 0);
        $c['snapLowAccess'] += intval($row['lasnap1'] ?? 0);
        $c['tractSNAP'] += floatval($row['TractSNAP'] ?? 0);
    }

    $records = [];
    foreach ($counties as $fips => $c) {
        $records[] = [
            'county'             => $fips,
            'tractCount'         => $c['tractCount'],
            'lilaTracts'         => $c['lilaTracts'],
            'avgPovertyRate'     => $c['tractCount'] > 0 ? round($c['povertySum'] / $c['tractCount'], 1) : 0,
            'avgMedianIncome'    => $c['incomeCount'] > 0 ? round($c['incomeSum'] / $c['incomeCount'], 0) : null,
            'lowAccessPop'       => $c['lowAccessPop'],
            'lowIncomeLowAccess' => $c['lowIncomeLowAccess'],
            'noVehicleLowAccess' => $c['noVehicleLowAccess'],
            'snapLowAccess'      => $c['snapLowAccess'],
            'avgTractSNAP'       => $c['tractCount'] > 0 ? round($c['tractSNAP'] / $c['tractCount'], 1) : 0
        ];
    }

    // Sort by county FIPS
    usort($records, function($a, $b) { return strcmp($a['county'], $b['county']); });

    return [
        'type'      => 'county',
        'state'     => $stateFips,
        'year'      => 2019,
        'source'    => 'USDA ERS, Food Access Research Atlas via ArcGIS REST',
        'count'     => count($records),
        'fetchedAt' => date('c'),
        'records'   => $records
    ];
}
