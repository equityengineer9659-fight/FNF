<?php
/**
 * Mapbox Geocoding API Proxy — Food-N-Force Dashboard
 * Forward geocoding: address/place name → lat/lng coordinates.
 * Caches responses for 30 days (addresses don't move).
 *
 * Endpoint:
 *   GET /api/mapbox-geocode.php?q={query}
 *   GET /api/mapbox-geocode.php?q={query}&limit=5
 *
 * Requires MAPBOX_ACCESS_TOKEN in _config.php
 * Free tier: 100K requests/month
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');

@include __DIR__ . '/_config.php';
require_once __DIR__ . '/_rate-limiter.php';

$cacheDir = __DIR__ . '/../_cache/dashboard';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}

// Rate limit: 90K/month (free tier = 100K)
if (!rateLimitCheck('mapbox', 'monthly', 90000)) {
    http_response_code(429);
    echo json_encode(['error' => 'Mapbox monthly quota reached — serving cached data only', '_rateLimited' => true]);
    exit;
}

// Check configuration
if (!defined('MAPBOX_ACCESS_TOKEN') || MAPBOX_ACCESS_TOKEN === '') {
    http_response_code(503);
    echo json_encode(['error' => 'Mapbox API not configured', '_notConfigured' => true]);
    exit;
}

// Validate query
$query = isset($_GET['q']) ? trim($_GET['q']) : '';
if ($query === '' || strlen($query) < 2) {
    http_response_code(400);
    echo json_encode(['error' => 'Provide a search query (q) of at least 2 characters']);
    exit;
}

$limit = isset($_GET['limit']) ? min(10, max(1, intval($_GET['limit']))) : 5;

// Cache key from query (normalized)
$cacheKey = 'mapbox-' . md5(strtolower($query) . '-' . $limit);
$cacheFile = "{$cacheDir}/{$cacheKey}.json";
$cacheTTL = 2592000; // 30 days

// Check cache
if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTTL) {
    $cached = file_get_contents($cacheFile);
    $data = json_decode($cached, true);
    if ($data) {
        $data['_cached'] = true;
        echo json_encode($data);
        exit;
    }
}

// Mapbox Geocoding API v6
$encodedQuery = urlencode($query);
$url = "https://api.mapbox.com/search/geocode/v6/forward?q={$encodedQuery}"
     . "&access_token=" . MAPBOX_ACCESS_TOKEN
     . "&country=us"
     . "&limit={$limit}"
     . "&types=address,place,locality,neighborhood,postcode";

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 10,
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
    echo json_encode(['error' => 'Mapbox API unavailable']);
    exit;
}

$raw = json_decode($response, true);
if (!$raw || !isset($raw['features'])) {
    http_response_code(502);
    echo json_encode(['error' => 'Invalid Mapbox response']);
    exit;
}

// Simplify response — only return what the dashboard needs
$results = array_map(function($f) {
    $coords = $f['geometry']['coordinates'] ?? [null, null];
    $props = $f['properties'] ?? [];
    return [
        'name' => $props['full_address'] ?? $props['name'] ?? '',
        'place' => $props['name'] ?? '',
        'city' => $props['context']['place']['name'] ?? '',
        'state' => $props['context']['region']['region_code'] ?? '',
        'lng' => $coords[0],
        'lat' => $coords[1]
    ];
}, $raw['features']);

$result = [
    'source' => 'Mapbox Geocoding API v6',
    'fetchedAt' => date('c'),
    'query' => $query,
    'results' => $results
];

// Write cache
file_put_contents($cacheFile, json_encode($result));
rateLimitIncrement('mapbox');

$result['_cached'] = false;
echo json_encode($result);
