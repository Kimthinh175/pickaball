<?php
// PHP Built-in Server Router for Pickaball

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = rawurldecode($uri);
$rootDir = __DIR__;

// Helper to send correct content type for static files
function serveFile($filePath) {
    if (!file_exists($filePath) || !is_file($filePath)) {
        return false;
    }
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

// 2. Trailing slash redirects for sub-apps to ensure relative paths work
if ($uri === '/admin') {
    header("Location: /admin/", true, 301);
    exit;
}
if ($uri === '/minigame') {
    header("Location: /minigame/", true, 301);
    exit;
}

// 3. Minigame Routing
if ($uri === '/minigame/' || $uri === '/minigame/index.html') {
    serveFile($rootDir . '/Front-end/minigame/index.html');
}
if (preg_match('#^/minigame/(.*)$#', $uri, $m)) {
    $target = $rootDir . '/Front-end/minigame/' . $m[1];
    if (file_exists($target) && is_file($target)) {
        serveFile($target);
    }
}

// 4. Admin Routing
if ($uri === '/admin/' || $uri === '/admin/index.html' || preg_match('#^/admin/tournaments/?$#', $uri)) {
    serveFile($rootDir . '/Front-end/admin/index.html');
}
if (preg_match('#^/admin/rankings/?$#', $uri)) {
    serveFile($rootDir . '/Front-end/admin/rankings.html');
}
if (preg_match('#^/admin/banners/?$#', $uri)) {
    serveFile($rootDir . '/Front-end/admin/banners.html');
}
if (preg_match('#^/admin/(.*)$#', $uri, $m)) {
    $target = $rootDir . '/Front-end/admin/' . $m[1];
    if (file_exists($target) && is_file($target)) {
        serveFile($target);
    }
}

// 5. Client Pretty URLs
if ($uri === '/' || $uri === '' || $uri === '/index.html' || preg_match('#^/rankings/?$#', $uri)) {
    serveFile($rootDir . '/Front-end/index.html');
}
if (preg_match('#^/tournaments/?$#', $uri)) {
    serveFile($rootDir . '/Front-end/tournaments.html');
}
if (preg_match('#^/tournament/?$#', $uri)) {
    serveFile($rootDir . '/Front-end/tournament.html');
}

// 6. Direct file checks
$directFile = $rootDir . $uri;
if (file_exists($directFile) && is_file($directFile)) {
    serveFile($directFile);
}

// 7. Check if file exists under Front-end
$frontEndFile = $rootDir . '/Front-end' . $uri;
if (file_exists($frontEndFile) && is_file($frontEndFile)) {
    serveFile($frontEndFile);
}
if (is_dir($frontEndFile) && file_exists($frontEndFile . '/index.html')) {
    serveFile($frontEndFile . '/index.html');
}

// 8. Check if file exists under public
$publicFile = $rootDir . '/public' . $uri;
if (file_exists($publicFile) && is_file($publicFile)) {
    serveFile($publicFile);
}

// 9. Check Front-end/public
$fePublicFile = $rootDir . '/Front-end/public' . $uri;
if (file_exists($fePublicFile) && is_file($fePublicFile)) {
    serveFile($fePublicFile);
}

// 10. Check uploads
$uploadsFile = $rootDir . '/uploads' . $uri;
if (file_exists($uploadsFile) && is_file($uploadsFile)) {
    serveFile($uploadsFile);
}

// 404 fallback
http_response_code(404);
echo "404 Not Found";
