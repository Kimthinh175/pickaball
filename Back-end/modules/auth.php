<?php
use Firebase\JWT\JWT;

class auth
{
    public function login($data)
    {
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';

        if (empty($username) || empty($password)) {
            echo json_encode(["status" => "error", "message" => "Vui lòng nhập đầy đủ username và password"]);
            return;
        }

        $sql = "SELECT * FROM admins WHERE username = :username";
        $result = database::ThucThiTraVe($sql, ['username' => $username]);

        if (count($result) > 0) {
            $admin = $result[0];
            if (password_verify($password, $admin['password'])) {
                $payload = [
                    'iss' => 'pickaball',
                    'iat' => time(),
                    'exp' => time() + (60 * 60 * 24 * 7), // 7 days
                    'data' => [
                        'id' => $admin['id'],
                        'username' => $admin['username']
                    ]
                ];
                $jwt = JWT::encode($payload, $_ENV['JWT_SECRET'], 'HS256');
                
                echo json_encode([
                    "status" => "success", 
                    "message" => "Đăng nhập thành công", 
                    "token" => $jwt
                ]);
            } else {
                echo json_encode(["status" => "error", "message" => "Mật khẩu không chính xác"]);
            }
        } else {
            echo json_encode(["status" => "error", "message" => "Tài khoản không tồn tại"]);
        }
    }

    public function changePassword($data)
    {
        // Require auth middleware beforehand, which sets $_SESSION['admin'] or similar?
        // Wait, the router handles auth middleware, but we need to know WHICH admin is logged in.
        // Actually, the middleware just checks if token is valid. 
        // We can get the admin ID from the JWT token passed in the Authorization header.
        
        $headers = getallheaders();
        $token = '';
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '');
        if (!empty($authHeader)) {
            $matches = [];
            if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
                $token = $matches[1];
            }
        }
        
        if (empty($token)) {
            echo json_encode(["status" => "error", "message" => "Không có quyền truy cập"]);
            return;
        }

        try {
            $decoded = JWT::decode($token, new Firebase\JWT\Key($_ENV['JWT_SECRET'], 'HS256'));
            $admin_id = $decoded->data->id;
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Token không hợp lệ"]);
            return;
        }

        $old_password = $data['old_password'] ?? '';
        $new_password = $data['new_password'] ?? '';

        if (empty($old_password) || empty($new_password)) {
            echo json_encode(["status" => "error", "message" => "Vui lòng nhập đầy đủ mật khẩu cũ và mới"]);
            return;
        }

        // Verify old password
        $sql = "SELECT * FROM admins WHERE id = :id";
        $result = database::ThucThiTraVe($sql, ['id' => $admin_id]);

        if (count($result) > 0) {
            $admin = $result[0];
            if (password_verify($old_password, $admin['password'])) {
                // Update new password
                $new_hash = password_hash($new_password, PASSWORD_DEFAULT);
                $update_sql = "UPDATE admins SET password = :password WHERE id = :id";
                database::ThucThi($update_sql, ['password' => $new_hash, 'id' => $admin_id]);
                
                echo json_encode(["status" => "success", "message" => "Đổi mật khẩu thành công"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Mật khẩu cũ không chính xác"]);
            }
        } else {
            echo json_encode(["status" => "error", "message" => "Không tìm thấy thông tin tài khoản"]);
        }
    }

    public function check()
    {
        echo json_encode([
            "status" => "success",
            "message" => "Authenticated",
            "data" => [
                "admin_id" => $_SESSION['admin_id'] ?? null
            ]
        ]);
    }

    public function logout()
    {
        if (isset($_SESSION['admin_id'])) {
            unset($_SESSION['admin_id']);
        }
        echo json_encode([
            "status" => "success",
            "message" => "Đăng xuất thành công"
        ]);
    }
}
?>
