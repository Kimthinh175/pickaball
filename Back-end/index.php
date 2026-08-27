<?php
define('SECURE_API_ACCESS', true);
define('ROOT_DIR', dirname(__DIR__));
date_default_timezone_set('Asia/Ho_Chi_Minh');

session_start();

header('Content-Type: application/json; charset=utf-8');
header("Access-Control-Allow-Origin: *"); // Cho phép request từ mọi nơi (Nên giới hạn lại lúc deploy)
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Xử lý preflight request của CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once ROOT_DIR . "/Back-end/init.php";

$router = new Router();

// ===================
// KKHAI BÁO ROUTES
// ===================

// Public API
$router->get('api/players', 'player', 'getAll');
$router->get('api/tournaments', 'tournament', 'getAll');
$router->get('api/tournaments/detail', 'tournament', 'getDetail');
$router->get('api/banners', 'banner', 'getActive');
$router->get('api/tournament-banners', 'tournament', 'getBanners');

// Admin Auth
$router->post('api/admin/auth/login', 'auth', 'login');
$router->get('api/admin/auth/check', 'auth', 'check');
$router->post('api/admin/auth/logout', 'auth', 'logout');
$router->post('api/admin/settings/password', 'auth', 'changePassword');

// Admin API
$router->post('api/admin/players', 'player', 'create');
$router->post('api/admin/players/update', 'player', 'update');
$router->delete('api/admin/players', 'player', 'delete');

$router->post('api/admin/tournaments', 'tournament', 'create');
$router->put('api/admin/tournaments', 'tournament', 'updateStructure');
$router->patch('api/admin/tournaments', 'tournament', 'update');
$router->delete('api/admin/tournaments', 'tournament', 'delete');

$router->post('api/admin/tournaments/add-player', 'tournament', 'addPlayer');
$router->post('api/admin/tournaments/remove-player', 'tournament', 'removePlayer');
$router->post('api/admin/tournaments/placement', 'tournament', 'updatePlacement');
$router->post('api/admin/matches/status', 'tournament', 'updateMatchStatus');
$router->post('api/admin/tournaments/team-payment', 'tournament', 'updateTeamPaymentStatus');
$router->post('api/admin/tournaments/finish', 'tournament', 'finishTournament');

$router->get('api/admin/banners', 'banner', 'getAll');
$router->post('api/admin/banners', 'banner', 'create');
$router->post('api/admin/banners/update', 'banner', 'update');
$router->post('api/admin/banners/toggle', 'banner', 'toggleStatus');
$router->delete('api/admin/banners', 'banner', 'delete');
$router->post('api/admin/banners/upload', 'tournament', 'uploadBanner');

// ===================
// DISPATCH ROUTER
// ===================
$method = $_SERVER['REQUEST_METHOD'];
$endpoint = isset($_GET['endpoint']) ? $_GET['endpoint'] : '';

$router->dispatch($method, $endpoint);
session_write_close();
?>
