<?php
/**
 * Newsletter Subscription Handler — Food-N-Force Website
 * Receives email, sends notification to hello@food-n-force.com.
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

// Origin-restricted CORS (audit P3-02). Form accepts POST.
$_corsAllowedMethods = 'POST, OPTIONS';
require_once __DIR__ . '/_cors.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Rate limiting — 60-second cooldown per session (preserves CSRF token for retry)
session_start();
$rateKey = 'last_newsletter_submit';
if (isset($_SESSION[$rateKey]) && (time() - $_SESSION[$rateKey]) < 60) {
    http_response_code(429);
    echo json_encode(['success' => false, 'error' => 'Please wait before submitting again.']);
    exit;
}

// CSRF validation
$csrfToken = $_POST['csrf_token'] ?? '';
if (!hash_equals($_SESSION['csrf_token'] ?? '', $csrfToken)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Invalid or missing security token. Please refresh and try again.']);
    exit;
}
unset($_SESSION['csrf_token']); // single-use

// Honeypot — reject if bot-field was filled
if (!empty($_POST['bot-field'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Spam detected.']);
    exit;
}

$recipient = 'hello@food-n-force.com';

$email = trim($_POST['email'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'A valid email address is required.']);
    exit;
}

// Strip CRLF to prevent header injection via Reply-To
$email = str_replace(["\r", "\n"], '', $email);

$safe = fn($v) => htmlspecialchars($v, ENT_QUOTES, 'UTF-8');

$subject = '[Food-N-Force] Newsletter Request';

$body  = "Newsletter Request\n";
$body .= "==================\n\n";
$body .= "Email: {$safe($email)}\n";

$headers  = "From: noreply@food-n-force.com\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "X-Mailer: FNF-Newsletter/1.0\r\n";

$sent = mail($recipient, $subject, $body, $headers);

if ($sent) {
    $_SESSION['last_newsletter_submit'] = time();
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to process subscription. Please try again later.']);
}
