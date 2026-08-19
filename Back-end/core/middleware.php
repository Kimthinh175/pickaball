<?php
if (!defined('SECURE_API_ACCESS')) {
    http_response_code(403);
    header("Location: /");
    exit();
}

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class AuthMiddleware
{
    public static function checkAdmin()
    {
        $headers = function_exists('apache_request_headers') ? apache_request_headers() : (function_exists('getallheaders') ? getallheaders() : []);
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        
        if (!$authHeader || !preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Unauthorized - Missing Token"]);
            exit();
        }

        $token = $matches[1];

        try {
            $secretKey = $_ENV['JWT_SECRET'];
            $decoded = JWT::decode($token, new Key($secretKey, 'HS256'));
            
            // Có thể truyền thêm info user vào session hoặc biến toàn cục nếu cần
            $_SESSION['admin_id'] = $decoded->data->id;
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Unauthorized - Invalid Token"]);
            exit();
        }
    }
}
?>
