<?php
/**
 * API Rate Limiter — Food-N-Force Dashboard
 * Tracks daily/monthly API call counts per service.
 * Returns cached/stale data instead of making API calls when approaching limits.
 *
 * Usage in proxy files:
 *   require_once __DIR__ . '/_rate-limiter.php';
 *   if (!rateLimitCheck('mapbox', 'monthly', 90000)) {
 *       // Over limit — return error or stale cache
 *   }
 *   // ... make API call ...
 *   rateLimitIncrement('mapbox');
 */

/**
 * Check if a service is within its rate limit.
 *
 * @param string $service   Service name (e.g., 'bls', 'mapbox', 'charity-navigator')
 * @param string $period    'daily' or 'monthly'
 * @param int    $maxCalls  Maximum calls allowed in the period
 * @return bool  True if within limit, false if over
 */
function rateLimitCheck($service, $period, $maxCalls) {
    $counterFile = _rateLimitFile($service, $period);

    if (!file_exists($counterFile)) {
        return true;
    }

    $data = json_decode(file_get_contents($counterFile), true);
    if (!$data || !isset($data['count'])) {
        return true;
    }

    // Check if counter has expired (new day/month)
    if (_rateLimitExpired($data, $period)) {
        return true;
    }

    return $data['count'] < $maxCalls;
}

/**
 * Get the current count for a service.
 *
 * @param string $service
 * @param string $period
 * @return int
 */
function rateLimitCount($service, $period) {
    $counterFile = _rateLimitFile($service, $period);

    if (!file_exists($counterFile)) {
        return 0;
    }

    $data = json_decode(file_get_contents($counterFile), true);
    if (!$data || _rateLimitExpired($data, $period)) {
        return 0;
    }

    return $data['count'] ?? 0;
}

/**
 * Increment the call counter after a successful API call.
 *
 * @param string $service
 */
function rateLimitIncrement($service) {
    $periods = ['daily', 'monthly'];

    foreach ($periods as $period) {
        $counterFile = _rateLimitFile($service, $period);
        $data = null;

        if (file_exists($counterFile)) {
            $data = json_decode(file_get_contents($counterFile), true);
        }

        if (!$data || _rateLimitExpired($data, $period)) {
            $data = [
                'service' => $service,
                'period' => $period,
                'started' => date('c'),
                'date_key' => $period === 'daily' ? date('Y-m-d') : date('Y-m'),
                'count' => 0
            ];
        }

        $data['count']++;
        $data['last_call'] = date('c');

        file_put_contents($counterFile, json_encode($data));
    }
}

/**
 * Get a summary of all rate limit counters (for monitoring).
 *
 * @return array
 */
function rateLimitSummary() {
    $cacheDir = __DIR__ . '/../_cache/dashboard';
    $summary = [];

    $limits = [
        'bls'                => ['daily' => 450, 'monthly' => null],
        'mapbox'             => ['daily' => null, 'monthly' => 90000],
        'charity-navigator'  => ['daily' => 90000, 'monthly' => null],
        'census-sdoh'        => ['daily' => null, 'monthly' => null],
        'propublica-search'  => ['daily' => null, 'monthly' => null],
        'propublica-org'     => ['daily' => null, 'monthly' => null],
        'cdc-places'         => ['daily' => 900, 'monthly' => null],
        'fara'               => ['daily' => 500, 'monthly' => null],
        'fred'               => ['daily' => 500, 'monthly' => null]
    ];

    foreach ($limits as $service => $serviceLimits) {
        foreach (['daily', 'monthly'] as $period) {
            $count = rateLimitCount($service, $period);
            $max = $serviceLimits[$period];
            if ($max !== null || $count > 0) {
                $summary[$service][$period] = [
                    'count' => $count,
                    'limit' => $max,
                    'pct' => $max ? round($count / $max * 100, 1) : null
                ];
            }
        }
    }

    return $summary;
}

// -- Internal helpers --

function _rateLimitFile($service, $period) {
    $cacheDir = __DIR__ . '/../_cache/dashboard';
    if (!is_dir($cacheDir)) {
        mkdir($cacheDir, 0755, true);
    }
    return "{$cacheDir}/ratelimit-{$service}-{$period}.json";
}

function _rateLimitExpired($data, $period) {
    if (!isset($data['date_key'])) {
        return true;
    }
    $currentKey = $period === 'daily' ? date('Y-m-d') : date('Y-m');
    return $data['date_key'] !== $currentKey;
}
