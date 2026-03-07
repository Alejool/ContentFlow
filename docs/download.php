<?php
/**
 * ContentFlow API Documentation Download
 * 
 * Automatically serves the correct documentation version based on browser language
 * or explicit language parameter.
 * 
 * Usage:
 *   /docs/download.php?format=markdown
 *   /docs/download.php?format=openapi
 *   /docs/download.php?format=markdown&lang=es
 *   /docs/download.php?format=openapi&lang=en
 */

// Detect browser language
function detectLanguage() {
    $lang = 'en'; // Default to English
    
    if (isset($_GET['lang'])) {
        // Explicit language parameter
        $lang = $_GET['lang'] === 'es' ? 'es' : 'en';
    } elseif (isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
        // Detect from browser
        $browserLang = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
        $lang = $browserLang === 'es' ? 'es' : 'en';
    }
    
    return $lang;
}

// Get requested format
$format = $_GET['format'] ?? 'markdown';
$lang = detectLanguage();

// Define file mappings
$files = [
    'markdown' => [
        'es' => 'API_ENTERPRISE_V1.md',
        'en' => 'API_ENTERPRISE_V1.en.md'
    ],
    'openapi' => [
        'es' => 'api-auth-openapi.json',
        'en' => 'api-auth-openapi.en.json'
    ]
];

// Validate format
if (!isset($files[$format])) {
    http_response_code(400);
    die(json_encode([
        'error' => 'Invalid format. Use: markdown or openapi',
        'available_formats' => array_keys($files)
    ]));
}

// Get file path
$filename = $files[$format][$lang];
$filepath = __DIR__ . '/' . $filename;

// Check if file exists
if (!file_exists($filepath)) {
    http_response_code(404);
    die(json_encode([
        'error' => 'Documentation file not found',
        'requested' => $filename,
        'language' => $lang,
        'format' => $format
    ]));
}

// Set appropriate headers
$mimeTypes = [
    'markdown' => 'text/markdown',
    'openapi' => 'application/json'
];

$extensions = [
    'markdown' => 'md',
    'openapi' => 'json'
];

header('Content-Type: ' . $mimeTypes[$format]);
header('Content-Disposition: attachment; filename="' . $filename . '"');
header('Content-Length: ' . filesize($filepath));
header('Cache-Control: no-cache, must-revalidate');
header('Expires: 0');
header('X-Content-Language: ' . $lang);
header('X-Content-Format: ' . $format);

// Output file
readfile($filepath);
exit;
