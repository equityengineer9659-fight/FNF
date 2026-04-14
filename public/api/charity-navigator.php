<?php
/**
 * Charity Navigator GraphQL API Proxy — Food-N-Force Dashboard
 * Fetches charity ratings, mission, and Beacon scores by EIN.
 * Caches responses for 7 days (ratings change infrequently).
 *
 * Endpoint:
 *   GET /api/charity-navigator.php?ein={ein}
 *
 * Requires CHARITY_NAVIGATOR_API_KEY in _config.php
 * Free tier: https://developer.charitynavigator.org/
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

@include __DIR__ . '/_config.php';
require_once __DIR__ . '/_rate-limiter.php';

$cacheDir = __DIR__ . '/../_cache/dashboard';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}

// Rate limit: 90K/day (free tier = 100K)
if (!rateLimitCheck('charity-navigator', 'daily', 90000)) {
    http_response_code(429);
    echo json_encode(['error' => 'Charity Navigator daily quota reached', '_rateLimited' => true]);
    exit;
}

// Check API key configuration
if (!defined('CHARITY_NAVIGATOR_API_KEY') || CHARITY_NAVIGATOR_API_KEY === '' || CHARITY_NAVIGATOR_API_KEY === 'your-charity-navigator-key-here') {
    http_response_code(503);
    echo json_encode(['error' => 'Service temporarily unavailable', '_notConfigured' => true]);
    exit;
}

// Validate EIN — must be exactly 9 digits (matches nonprofit-org.php)
$ein = isset($_GET['ein']) ? preg_replace('/[^0-9]/', '', $_GET['ein']) : '';
if (strlen($ein) !== 9) {
    http_response_code(400);
    echo json_encode(['error' => 'Provide a valid 9-digit EIN parameter']);
    exit;
}

$cacheFile = "{$cacheDir}/cn-{$ein}.json";
$cacheTTL = 604800; // 7 days

// Check cache (skip for debug queries)
if (!isset($_GET['debug_q']) && file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTTL) {
    $cached = file_get_contents($cacheFile);
    $data = json_decode($cached, true);
    if ($data) {
        $data['_cached'] = true;
        $data['_cachedAt'] = date('c', filemtime($cacheFile));
        echo json_encode($data);
        exit;
    }
}

// GraphQL query — free tier uses publicSearchFaceted with EIN filter
$query = <<<'GRAPHQL'
query GetOrgByEIN($ein: String!) {
  publicSearchFaceted(ein: [$ein], result_size: 1) {
    result_count
    results {
      ein
      name
      acronym
      mission
      encompass_score
      encompass_star_rating
      encompass_publication_date
      charity_navigator_url
      cause
      highest_level_alert
      street
      street2
      city
      state
      zip
    }
  }
}
GRAPHQL;

// Debug: allow caller to override the query with a base64-encoded GraphQL string.
// Used to introspect the schema without going through the broken Tyk playground.
$payload = isset($_GET['debug_q'])
    ? json_encode(['query' => base64_decode($_GET['debug_q'])])
    : json_encode(['query' => $query, 'variables' => ['ein' => $ein]]);

// Charity Navigator GraphQL endpoint
$url = 'https://api.charitynavigator.org/graphql';

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'User-Agent: FoodNForce-Dashboard/1.0',
        'Authorization: ' . CHARITY_NAVIGATOR_API_KEY
    ],
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode >= 400) {
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
    echo json_encode([
        'error' => 'Charity Navigator API unavailable',
        '_httpCode' => $httpCode,
        '_curlError' => $curlError,
        '_responseBody' => is_string($response) ? substr($response, 0, 500) : null
    ]);
    exit;
}

// Debug mode: return raw upstream response without caching or post-processing
if (isset($_GET['debug_q'])) {
    echo $response;
    exit;
}

$raw = json_decode($response, true);

// Handle GraphQL errors
if (isset($raw['errors'])) {
    // Org not rated / not found is not a server error
    $result = [
        'source' => 'Charity Navigator GraphQL API',
        'fetchedAt' => date('c'),
        'organization' => null,
        '_notRated' => true
    ];
    file_put_contents($cacheFile, json_encode($result));
    echo json_encode($result);
    exit;
}

// Map publicSearchFaceted response into the shape the dashboard JS expects.
// The legacy shape used organizationByEIN with overallRating/beacon/address sub-objects.
$first = $raw['data']['publicSearchFaceted']['results'][0] ?? null;
$org = null;
if ($first) {
    $org = [
        'ein' => $first['ein'] ?? null,
        'name' => $first['name'] ?? null,
        'acronym' => $first['acronym'] ?? null,
        'mission' => $first['mission'] ?? null,
        'profileUrl' => $first['charity_navigator_url'] ?? null,
        'cause' => $first['cause'] ?? null,
        'alertLevel' => $first['highest_level_alert'] ?? null,
        'overallRating' => [
            'score' => isset($first['encompass_score']) ? (float) $first['encompass_score'] : null,
            'rating' => $first['encompass_star_rating'] ?? null
        ],
        'beacon' => null,
        'address' => [
            'streetAddress1' => $first['street'] ?? null,
            'streetAddress2' => $first['street2'] ?? null,
            'city' => $first['city'] ?? null,
            'stateOrProvince' => $first['state'] ?? null,
            'postalCode' => $first['zip'] ?? null
        ]
    ];
}

$result = [
    'source' => 'Charity Navigator GraphQL API',
    'fetchedAt' => date('c'),
    'organization' => $org,
    '_notRated' => ($org === null)
];

// Write cache
file_put_contents($cacheFile, json_encode($result));
rateLimitIncrement('charity-navigator');

$result['_cached'] = false;
echo json_encode($result);
