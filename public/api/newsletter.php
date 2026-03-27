<?php
/**
 * Newsletter Subscription Handler — Food-N-Force Website
 * Receives email, sends notification to hello@food-n-force.com.
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// CSRF validation
session_start();
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

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'A valid email address is required.']);
    exit;
}

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
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to process subscription. Please try again later.']);
}
