<?php
/**
 * ProPublica Nonprofit Search Proxy — Food-N-Force Dashboard
 * Searches the ProPublica Nonprofit Explorer API for organizations.
 * Caches responses for 24 hours.
 *
 * Endpoint:
 *   GET /api/nonprofit-search.php?q={query}&state={XX}&page={n}
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

$cacheDir = __DIR__ . '/../_cache/dashboard';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}

// Validate and sanitize parameters
$query = isset($_GET['q']) ? trim($_GET['q']) : '';
$state = isset($_GET['state']) ? strtoupper(trim($_GET['state'])) : '';
$page = isset($_GET['page']) ? intval($_GET['page']) : 0;

if ($query === '' && $state === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Provide at least a search query (q) or state filter (state)']);
    exit;
}

// Validate state as 2-letter code
$validStates = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA',
    'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC',
    'ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
if ($state !== '' && !in_array($state, $validStates)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid state code']);
    exit;
}

if ($page < 0) $page = 0;

// Cache key
$cacheKey = hash('sha256', $query . '|' . $state . '|' . $page);
$cacheFile = "{$cacheDir}/nonprofit-search-{$cacheKey}.json";
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

// Build ProPublica API URL
$params = ['page' => $page];
if ($query !== '') {
    $params['q'] = $query;
}
if ($state !== '') {
    $params['state[id]'] = $state;
}
$url = 'https://projects.propublica.org/nonprofits/api/v2/search.json?' . http_build_query($params);

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
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
            echo json_encode($data);
            exit;
        }
    }
    http_response_code(502);
    echo json_encode(['error' => 'ProPublica API unavailable']);
    exit;
}

$raw = json_decode($response, true);
if (!$raw || !isset($raw['organizations'])) {
    // Serve stale cache if available rather than hard 502
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
    echo json_encode(['error' => 'Invalid ProPublica response']);
    exit;
}

$result = [
    'source' => 'ProPublica Nonprofit Explorer (IRS 990 data)',
    'fetchedAt' => date('c'),
    'total_results' => $raw['total_results'],
    'num_pages' => $raw['num_pages'],
    'cur_page' => $raw['cur_page'],
    'per_page' => $raw['per_page'],
    'organizations' => $raw['organizations']
];

// Write cache
file_put_contents($cacheFile, json_encode($result));

$result['_cached'] = false;
echo json_encode($result);
