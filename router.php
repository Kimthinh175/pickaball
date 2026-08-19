<?php
// PHP Built-in Server Router for Pickaball

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rawurldecode($uri);
$rootDir = __DIR__;

// Helper to send correct content type for static files
function serveFile($filePath) {
    $ext = pathinfo($filePath, PATHINFO_EXTENSION);
    $mimes = [
        'html' => 'text/html; charset=utf-8',
        'htm'  => 'text/html; charset=utf-8',
        'css'  => 'text/css; charset=utf-8',
        'js'   => 'application/javascript; charset=utf-8',
        'mjs'  => 'application/javascript; charset=utf-8',
        'json' => 'application/json; charset=utf-8',
        'png'  => 'image/png',
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif'  => 'image/gif',
        'svg'  => 'image/svg+xml',
        'ico'  => 'image/x-icon',
        'webp' => 'image/webp',
        'woff' => 'font/woff',
        'woff2'=> 'font/woff2',
        'ttf'  => 'font/ttf',
        'eot'  => 'application/vnd.ms-fontobject'
    ];
    $contentType = $mimes[strtolower($ext)] ?? mime_content_type($filePath) ?: 'application/octet-stream';
    header("Content-Type: $contentType");
    readfile($filePath);
    exit;
}

// 1. API Routing
if (preg_match('#^/api/(.*)$#', $uri, $matches)) {
    $_GET['endpoint'] = 'api/' . $matches[1];
    require $rootDir . '/Back-end/index.php';
    exit;
}

// 2. Admin Pretty URLs
if (preg_match('#^/admin/?$#', $uri) || preg_match('#^/admin/tournaments/?$#', $uri)) {
    serveFile($rootDir . '/Front-end/admin/index.html');
}
if (preg_match('#^/admin/rankings/?$#', $uri)) {
    serveFile($rootDir . '/Front-end/admin/rankings.html');
}

// 3. Admin Assets (css, js)
if (preg_match('#^/admin/(css|js)/(.*)$#', $uri, $m)) {
    $target = $rootDir . '/Front-end/admin/' . $m[1] . '/' . $m[2];
    if (file_exists($target) && is_file($target)) {
        serveFile($target);
    }
}

// 4. Client Pretty URLs
if ($uri === '/' || $uri === '' || preg_match('#^/rankings/?$#', $uri)) {
    serveFile($rootDir . '/Front-end/index.html');
}
if (preg_match('#^/tournaments/?$#', $uri)) {
    serveFile($rootDir . '/Front-end/tournaments.html');
}
if (preg_match('#^/tournament/?$#', $uri)) {
    serveFile($rootDir . '/Front-end/tournament.html');
}

// 5. Check if file exists directly under root
$directFile = $rootDir . $uri;
if (file_exists($directFile) && is_file($directFile)) {
    serveFile($directFile);
}

// 6. Check if file exists under Front-end
$frontEndFile = $rootDir . '/Front-end' . $uri;
if (file_exists($frontEndFile) && is_file($frontEndFile)) {
    serveFile($frontEndFile);
}

// 7. Check if file exists under public
$publicFile = $rootDir . '/public' . $uri;
if (file_exists($publicFile) && is_file($publicFile)) {
    serveFile($publicFile);
}

// 8. Check uploads
$uploadsFile = $rootDir . '/uploads' . $uri;
if (file_exists($uploadsFile) && is_file($uploadsFile)) {
    serveFile($uploadsFile);
}

// 404 fallback
http_response_code(404);
echo "404 Not Found";
