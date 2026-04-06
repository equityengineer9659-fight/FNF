<?php
/**
 * ProPublica Nonprofit Organization Proxy — Food-N-Force Dashboard
 * Fetches detailed organization profile + IRS 990 filing data.
 * Caches responses for 7 days (IRS data changes infrequently).
 *
 * Endpoint:
 *   GET /api/nonprofit-org.php?ein={ein}
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');

$cacheDir = __DIR__ . '/../_cache/dashboard';
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}

// Validate EIN — digits only
$ein = isset($_GET['ein']) ? preg_replace('/[^0-9]/', '', $_GET['ein']) : '';
if ($ein === '' || strlen($ein) !== 9) {
    http_response_code(400);
    echo json_encode(['error' => 'Provide a valid EIN parameter']);
    exit;
}

$cacheFile = "{$cacheDir}/nonprofit-org-{$ein}.json";
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

// Fetch from ProPublica
$url = "https://projects.propublica.org/nonprofits/api/v2/organizations/{$ein}.json";

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
if (!$raw || !isset($raw['organization'])) {
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
    echo json_encode(['error' => 'Invalid ProPublica response or organization not found']);
    exit;
}

$result = [
    'source' => 'ProPublica Nonprofit Explorer (IRS 990 data)',
    'fetchedAt' => date('c'),
    'organization' => $raw['organization'],
    'filings_with_data' => $raw['filings_with_data'] ?? [],
    'filings_without_data' => $raw['filings_without_data'] ?? []
];

// Write cache
file_put_contents($cacheFile, json_encode($result));

$result['_cached'] = false;
echo json_encode($result);
