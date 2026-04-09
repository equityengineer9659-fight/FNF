<?php
/**
 * CORS Helper — Food-N-Force API
 * Shared origin-restricted CORS handler for all API proxies.
 * Replaces wildcard Access-Control-Allow-Origin: * with domain allowlist.
 */

$_corsAllowedOrigins = [
    'https://food-n-force.com',
    'https://www.food-n-force.com',
];

// Allow localhost in development (any port)
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';

$allowed = false;
if (in_array($origin, $_corsAllowedOrigins, true)) {
    $allowed = true;
} elseif (preg_match('#^https?://localhost(:\d+)?$#', $origin)) {
    $allowed = true;
}

if ($allowed) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // No CORS header = browser blocks cross-origin request (safe default)
    // Same-origin requests still work fine without this header
}

header('Vary: Origin');

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 86400');
    http_response_code(204);
    exit;
}
