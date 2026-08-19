<?php
if (!defined('SECURE_API_ACCESS')) {
    http_response_code(403);
    header("Location: /");
    exit();
}

ini_set('display_errors', 1);

require_once ROOT_DIR . "/Back-end/core/database.php";
require_once ROOT_DIR . "/Back-end/core/router.php";
require_once ROOT_DIR . '/vendor/autoload.php';

// Autoload Services
foreach (glob(ROOT_DIR . "/Back-end/services/*.php") as $serviceFile) {
    require_once $serviceFile;
}

$dotenv = Dotenv\Dotenv::createImmutable(ROOT_DIR);
$dotenv->load();
?>
