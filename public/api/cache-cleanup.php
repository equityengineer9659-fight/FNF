<?php
/**
 * Cache Cleanup — Food-N-Force Dashboard
 * Removes stale dashboard cache files older than 30 days.
 *
 * Usage:
 *   CLI (SiteGround cron):  php /path/to/cache-cleanup.php
 *   HTTP (with token):      GET /api/cache-cleanup.php?token=YOUR_TOKEN
 */

// Tolerate a missing _config.php in dev (no credentials) but never silence
// parse/runtime errors from a present one — the @ suppression form would.
if (file_exists(__DIR__ . '/_config.php')) {
    include __DIR__ . '/_config.php';
}

// Security: require token for HTTP access
if (php_sapi_name() !== 'cli') {
    header('Content-Type: application/json');
    header('X-Content-Type-Options: nosniff');

    $token = isset($_GET['token']) ? $_GET['token'] : '';
    $expected = defined('CLEANUP_TOKEN') ? CLEANUP_TOKEN : '';
    if (!$expected || !hash_equals($expected, $token)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }
}

$cacheDir = __DIR__ . '/../_cache/dashboard';
$maxAge = 30 * 86400; // 30 days
$deleted = 0;

if (is_dir($cacheDir)) {
    $files = glob("{$cacheDir}/*.json");
    if ($files) {
        foreach ($files as $file) {
            if (time() - filemtime($file) > $maxAge) {
                unlink($file);
                $deleted++;
            }
        }
    }
}

$result = ['deleted' => $deleted, 'timestamp' => date('c')];

if (php_sapi_name() === 'cli') {
    echo "Deleted {$deleted} stale cache files.\n";
} else {
    echo json_encode($result);
}
