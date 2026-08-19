<?php
if (!defined('SECURE_API_ACCESS')) {
    http_response_code(403);
    header("Location: /");
    exit();
}

class Router
{
    private $routes = [];

    public function get($endpoint, $module, $action)
    {
        $this->routes['GET'][$endpoint] = ['module' => $module, 'action' => $action];
    }
    public function post($endpoint, $module, $action)
    {
        $this->routes['POST'][$endpoint] = ['module' => $module, 'action' => $action];
    }
    public function put($endpoint, $module, $action)
    {
        $this->routes['PUT'][$endpoint] = ['module' => $module, 'action' => $action];
    }
    public function delete($endpoint, $module, $action)
    {
        $this->routes['DELETE'][$endpoint] = ['module' => $module, 'action' => $action];
    }
    public function patch($endpoint, $module, $action)
    {
        $this->routes['PATCH'][$endpoint] = ['module' => $module, 'action' => $action];
    }

    public function dispatch($method, $endpoint)
    {
        $endpoint = trim($endpoint, '/'); 

        if (isset($this->routes[$method][$endpoint])) {
            require_once ROOT_DIR . "/Back-end/core/middleware.php";

            // Chặn api admin (yêu cầu auth trừ lúc login)
            if (strpos($endpoint, 'api/admin/') === 0 && $endpoint !== 'api/admin/auth/login') {
                AuthMiddleware::checkAdmin();
            }

            $route = $this->routes[$method][$endpoint];
            $moduleName = $route['module'];
            $actionName = $route['action'];

            require_once ROOT_DIR . "/Back-end/modules/$moduleName.php";
            $module = new $moduleName();
            
            // Xử lý request body JSON cho POST/PUT/DELETE/PATCH
            $data = $_GET;
            if ($method === 'POST' || $method === 'PUT' || $method === 'DELETE' || $method === 'PATCH') {
                $input = json_decode(file_get_contents('php://input'), true);
                if (is_array($input)) {
                    $data = array_merge($data, $input);
                } else if (!empty($_POST)) {
                    $data = array_merge($data, $_POST);
                }
            }
            
            $module->$actionName($data);
            return;
        }

        http_response_code(404);
        echo json_encode(["status" => "404", "message" => "API NOT FOUND"]);
    }
}
?>
