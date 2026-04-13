<?php
/**
 * API Rate Limiter — Food-N-Force Dashboard
 * Tracks daily/monthly API call counts per service, keyed by hashed client IP.
 * Returns cached/stale data instead of making API calls when approaching limits.
 *
 * Per-IP keying (added 2026-04-12, audit P2 Security): one abusive client
 * cannot exhaust the daily FRED/PLACES/BLS/SAIPE/Mapbox quota for every
 * other visitor. The cache filename is versioned `ratelimit-v2-...` so old
 * global buckets from before this change are simply orphaned and cleaned up
 * by cache-cleanup.php on its next run.
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
 * Check if a service is within its rate limit for the current client IP.
 *
 * @param string $service   Service name (e.g., 'bls', 'mapbox', 'charity-navigator')
 * @param string $period    'daily' or 'monthly'
 * @param int    $maxCalls  Maximum calls allowed in the period
 * @return bool  True if within limit, false if over
 */
function rateLimitCheck($service, $period, $maxCalls) {
    $ipHash = _rateLimitIpHash();
    $counterFile = _rateLimitFile($service, $period, $ipHash);

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
 * Get the current count for a service for the current client IP.
 *
 * @param string $service
 * @param string $period
 * @return int
 */
function rateLimitCount($service, $period) {
    $ipHash = _rateLimitIpHash();
    $counterFile = _rateLimitFile($service, $period, $ipHash);

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
 * Increment the call counter for the current client IP after a successful API call.
 *
 * @param string $service
 */
function rateLimitIncrement($service) {
    $ipHash = _rateLimitIpHash();
    $periods = ['daily', 'monthly'];

    foreach ($periods as $period) {
        $counterFile = _rateLimitFile($service, $period, $ipHash);

        // Use flock() for atomic read-modify-write to prevent race conditions
        $fp = fopen($counterFile, 'c+');
        if (!$fp) continue;

        flock($fp, LOCK_EX);
        $raw = stream_get_contents($fp);
        $data = $raw ? json_decode($raw, true) : null;

        if (!$data || _rateLimitExpired($data, $period)) {
            $data = [
                'service' => $service,
                'period' => $period,
                'started' => date('c'),
                'date_key' => $period === 'daily' ? date('Y-m-d') : date('Y-m'),
                'count' => 0,
                'ip_hash' => $ipHash
            ];
        }

        $data['count']++;
        $data['last_call'] = date('c');
        $data['ip_hash'] = $ipHash;

        ftruncate($fp, 0);
        rewind($fp);
        fwrite($fp, json_encode($data));
        flock($fp, LOCK_UN);
        fclose($fp);
    }
}

/**
 * Get a summary of all rate limit counters across every per-IP bucket
 * (for monitoring). Aggregates the v2 per-IP files back into a single
 * (service, period) total so the existing monitoring contract is preserved.
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
        'fred'               => ['daily' => 500, 'monthly' => null]
    ];

    foreach ($limits as $service => $serviceLimits) {
        foreach (['daily', 'monthly'] as $period) {
            // Glob every per-IP bucket for this (service, period) and sum the
            // active (non-expired) counts. Pattern: ratelimit-v2-{service}-{period}-{iphash}.json
            $pattern = "{$cacheDir}/ratelimit-v2-{$service}-{$period}-*.json";
            $files = glob($pattern) ?: [];
            $total = 0;
            foreach ($files as $file) {
                $raw = @file_get_contents($file);
                if (!$raw) continue;
                $data = json_decode($raw, true);
                if (!$data || _rateLimitExpired($data, $period)) continue;
                $total += $data['count'] ?? 0;
            }

            $max = $serviceLimits[$period];
            if ($max !== null || $total > 0) {
                $summary[$service][$period] = [
                    'count' => $total,
                    'limit' => $max,
                    'pct' => $max ? round($total / $max * 100, 1) : null
                ];
            }
        }
    }

    return $summary;
}

/**
 * Returns a short hashed tag for the current client IP. Suitable for
 * inclusion in error_log lines from proxies — never logs the raw IP.
 *
 * @return string
 */
function rateLimitDebugTag() {
    return 'ip:' . _rateLimitIpHash();
}

// -- Internal helpers --

function _rateLimitFile($service, $period, $ipHash = null) {
    $cacheDir = __DIR__ . '/../_cache/dashboard';
    if (!is_dir($cacheDir)) {
        mkdir($cacheDir, 0755, true);
    }
    if ($ipHash === null) {
        $ipHash = _rateLimitIpHash();
    }
    return "{$cacheDir}/ratelimit-v2-{$service}-{$period}-{$ipHash}.json";
}

function _rateLimitExpired($data, $period) {
    if (!isset($data['date_key'])) {
        return true;
    }
    $currentKey = $period === 'daily' ? date('Y-m-d') : date('Y-m');
    return $data['date_key'] !== $currentKey;
}

/**
 * Determine the client IP. Source of truth is REMOTE_ADDR (set by Apache
 * from the SiteGround nginx → Apache reverse proxy hop). When REMOTE_ADDR
 * is itself a private/loopback hop (i.e., we're behind a reverse proxy on
 * the same network), trust the first *public* entry in X-Forwarded-For.
 * Never blindly trust client-supplied headers — XFF entries that are
 * private, reserved, or unparseable are skipped.
 *
 * Returns 'cli' if no REMOTE_ADDR is set (CLI / unit test context).
 *
 * @return string
 */
function _rateLimitClientIp() {
    $remote = $_SERVER['REMOTE_ADDR'] ?? '';
    if ($remote === '') {
        return 'cli';
    }

    // If REMOTE_ADDR is a public IP, that's our answer — no XFF trust.
    $remoteIsPublic = filter_var(
        $remote,
        FILTER_VALIDATE_IP,
        FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
    );
    if ($remoteIsPublic) {
        return $remote;
    }

    // REMOTE_ADDR is private/loopback — likely the reverse-proxy hop. Walk
    // X-Forwarded-For left → right and pick the first public IP.
    $xff = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($xff !== '') {
        $parts = array_map('trim', explode(',', $xff));
        foreach ($parts as $candidate) {
            $isPublic = filter_var(
                $candidate,
                FILTER_VALIDATE_IP,
                FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
            );
            if ($isPublic) {
                return $candidate;
            }
        }
    }

    // Nothing else trustworthy — fall back to raw REMOTE_ADDR (the proxy
    // hop). Buckets keyed on this collapse to a single shared bucket per
    // proxy, which is the same behaviour as before this refactor.
    return $remote;
}

/**
 * SHA-256 hash of the current client IP, truncated to 16 hex chars (64 bits).
 * Sufficient bucket isolation across plausible visitor counts; short enough
 * to keep cache filenames manageable; meets the audit constraint that no raw
 * IPs are written to disk.
 *
 * @param string|null $ip Optional explicit IP (for testing); defaults to current client.
 * @return string
 */
function _rateLimitIpHash($ip = null) {
    $source = $ip ?? _rateLimitClientIp();
    return substr(hash('sha256', $source), 0, 16);
}
