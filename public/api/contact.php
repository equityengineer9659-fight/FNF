<?php
/**
 * Contact Form Handler — Food-N-Force Website
 * Receives POST submissions, validates, and sends email via PHP mail().
 * Deployed to SiteGround via Vite public/ → dist/ rsync pipeline.
 */

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

// Only allow POST
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

// Configurable recipient — change this to the actual inbox
$recipient = 'hello@food-n-force.com';
$subject_prefix = '[Food-N-Force Contact]';

// Read and validate fields
$firstName    = trim($_POST['firstName'] ?? '');
$lastName     = trim($_POST['lastName'] ?? '');
$email        = trim($_POST['email'] ?? '');
$organization = trim($_POST['organization'] ?? '');
$service      = trim($_POST['service'] ?? '');
$message      = trim($_POST['message'] ?? '');

$errors = [];
if ($firstName === '')    $errors[] = 'First name is required.';
if ($lastName === '')     $errors[] = 'Last name is required.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'A valid email address is required.';
if ($organization === '') $errors[] = 'Organization is required.';
if ($service === '')      $errors[] = 'Service interest is required.';
if (strlen($firstName) > 100)    $errors[] = 'First name is too long.';
if (strlen($lastName) > 100)     $errors[] = 'Last name is too long.';
if (strlen($email) > 254)        $errors[] = 'Email address is too long.';
if (strlen($organization) > 200) $errors[] = 'Organization name is too long.';
if (strlen($service) > 100)      $errors[] = 'Service field is too long.';
if (strlen($message) > 5000)     $errors[] = 'Message must be 5000 characters or fewer.';

if (count($errors) > 0) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => implode(' ', $errors)]);
    exit;
}

// Strip CRLF from any value used in mail headers to prevent header injection
$email     = str_replace(["\r", "\n"], '', $email);
$firstName = str_replace(["\r", "\n"], '', $firstName);
$lastName  = str_replace(["\r", "\n"], '', $lastName);
$service   = str_replace(["\r", "\n"], '', $service);

// Sanitize for email body
$safe = fn($v) => htmlspecialchars($v, ENT_QUOTES, 'UTF-8');

$body  = "New contact form submission\n";
$body .= "=========================\n\n";
$body .= "Name:         {$safe($firstName)} {$safe($lastName)}\n";
$body .= "Email:        {$safe($email)}\n";
$body .= "Organization: {$safe($organization)}\n";
$body .= "Service:      {$safe($service)}\n\n";
$body .= "Message:\n{$safe($message)}\n";

$subject = "{$subject_prefix} {$safe($service)} — {$safe($firstName)} {$safe($lastName)}";

$headers  = "From: noreply@food-n-force.com\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "X-Mailer: FNF-Contact/1.0\r\n";

$sent = mail($recipient, $subject, $body, $headers);

if ($sent) {
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to send message. Please try again later.']);
}
