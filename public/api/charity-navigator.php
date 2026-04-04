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
header('Access-Control-Allow-Origin: *');

@include __DIR__ . '/_config.php';

$cacheDir = __DIR__ . '/../_cache/dashboard';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}

// Check API key configuration
if (!defined('CHARITY_NAVIGATOR_API_KEY') || CHARITY_NAVIGATOR_API_KEY === '') {
    http_response_code(503);
    echo json_encode(['error' => 'Charity Navigator API not configured', '_notConfigured' => true]);
    exit;
}

// Validate EIN — digits only
$ein = isset($_GET['ein']) ? preg_replace('/[^0-9]/', '', $_GET['ein']) : '';
if ($ein === '' || strlen($ein) < 2) {
    http_response_code(400);
    echo json_encode(['error' => 'Provide a valid EIN parameter']);
    exit;
}

$cacheFile = "{$cacheDir}/cn-{$ein}.json";
$cacheTTL = 604800; // 7 days

// Check cache
if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTTL) {
    $cached = file_get_contents($cacheFile);
    $data = json_decode($cached, true);
    if ($data) {
        $data['_cached'] = true;
        $data['_cachedAt'] = date('c', filemtime($cacheFile));
        echo json_encode($data);
        exit;
    }
}

// GraphQL query — free tier fields
$query = <<<'GRAPHQL'
query GetOrgByEIN($ein: String!) {
  organizationByEIN(ein: $ein) {
    ein
    name
    acronym
    mission
    alertLevel
    overallRating {
      score
      rating
    }
    beacon {
      score
      level
      eligibility
    }
    profileUrl
    address {
      streetAddress1
      streetAddress2
      city
      stateOrProvince
      postalCode
    }
  }
}
GRAPHQL;

$payload = json_encode([
    'query' => $query,
    'variables' => ['ein' => $ein]
]);

// Charity Navigator GraphQL endpoint
$url = 'https://data-api.charitynavigator.org/graphql';

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'timeout' => 15,
        'header' => implode("\r\n", [
            'Content-Type: application/json',
            'User-Agent: FoodNForce-Dashboard/1.0',
            'Apikey: ' . CHARITY_NAVIGATOR_API_KEY
        ]),
        'content' => $payload
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
    echo json_encode(['error' => 'Charity Navigator API unavailable']);
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

$org = $raw['data']['organizationByEIN'] ?? null;

$result = [
    'source' => 'Charity Navigator GraphQL API',
    'fetchedAt' => date('c'),
    'organization' => $org,
    '_notRated' => ($org === null)
];

// Write cache
file_put_contents($cacheFile, json_encode($result));

$result['_cached'] = false;
echo json_encode($result);
