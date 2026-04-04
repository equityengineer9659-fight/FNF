<?php
/**
 * Rate Limit Status — Food-N-Force Dashboard
 * Returns current API usage counts and remaining quota.
 *
 * Endpoint:
 *   GET /api/rate-limit-status.php
 *
 * No authentication required — only exposes call counts, not keys.
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/_rate-limiter.php';

$limits = [
    'bls' => [
        'daily' => ['limit' => 450, 'free_tier' => 500, 'note' => 'BLS API v2 (v1 = 25/day)']
    ],
    'mapbox' => [
        'monthly' => ['limit' => 90000, 'free_tier' => 100000, 'note' => 'Mapbox Geocoding']
    ],
    'charity-navigator' => [
        'daily' => ['limit' => 90000, 'free_tier' => 100000, 'note' => 'Charity Navigator GraphQL']
    ]
];

$status = [];
foreach ($limits as $service => $periods) {
    foreach ($periods as $period => $config) {
        $count = rateLimitCount($service, $period);
        $pct = round($count / $config['limit'] * 100, 1);
        $status[$service] = [
            'period' => $period,
            'calls' => $count,
            'limit' => $config['limit'],
            'free_tier' => $config['free_tier'],
            'remaining' => $config['limit'] - $count,
            'usage_pct' => $pct,
            'status' => $pct >= 90 ? 'critical' : ($pct >= 70 ? 'warning' : 'ok'),
            'note' => $config['note']
        ];
    }
}

echo json_encode([
    'timestamp' => date('c'),
    'services' => $status
], JSON_PRETTY_PRINT);
