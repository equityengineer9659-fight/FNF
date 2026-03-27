<?php
/**
 * CSRF Token Generator — Food-N-Force Website
 * Returns a single-use token stored in the PHP session.
 * Tokens are validated by contact.php and newsletter.php on form submission.
 */

session_start();

header('Content-Type: application/json');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$token = bin2hex(random_bytes(32));
$_SESSION['csrf_token'] = $token;

echo json_encode(['token' => $token]);
