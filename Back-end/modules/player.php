<?php
class player
{
    public function getAll($data)
    {
        // Lấy danh sách sắp xếp theo điểm (Ranking)
        $sql = "SELECT * FROM players ORDER BY points DESC, name ASC";
        $players = database::ThucThiTraVe($sql);
        echo json_encode(["status" => "success", "data" => $players]);
    }

    public function create($data)
    {
        $name = $data['name'] ?? '';
        $avatar = $data['avatar'] ?? '';
        $gender = $data['gender'] ?? 'Nam';
        $defaultPoints = ($gender === 'Nữ') ? 2.10 : 2.60;
        $points = isset($data['points']) && $data['points'] !== '' && is_numeric($data['points']) ? floatval($data['points']) : $defaultPoints;
        $profile = $data['profile'] ?? '';

        // Handle File Upload
        if (isset($_FILES['avatar_file']) && $_FILES['avatar_file']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = ROOT_DIR . '/public/uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            $fileTmp = $_FILES['avatar_file']['tmp_name'];
            $fileName = time() . '_' . preg_replace("/[^a-zA-Z0-9.]/", "_", basename($_FILES['avatar_file']['name']));
            $dest = $uploadDir . $fileName;
            
            if (move_uploaded_file($fileTmp, $dest)) {
                $avatar = 'public/uploads/' . $fileName;
            }
        }

        if (empty($name)) {
            echo json_encode(["status" => "error", "message" => "Tên người chơi không được để trống"]);
            return;
        }

        $sql = "INSERT INTO players (name, avatar, gender, points, profile) VALUES (:name, :avatar, :gender, :points, :profile)";
        database::ThucThi($sql, [
            'name' => $name,
            'avatar' => $avatar,
            'gender' => $gender,
            'points' => $points,
            'profile' => $profile
        ]);

        echo json_encode(["status" => "success", "message" => "Thêm người chơi thành công"]);
    }

    public function update($data)
    {
        $id = $_POST['id'] ?? ($data['id'] ?? 0);
        $name = $_POST['name'] ?? ($data['name'] ?? '');
        $gender = $_POST['gender'] ?? ($data['gender'] ?? 'Nam');
        $points = $_POST['points'] ?? ($data['points'] ?? 0);
        $profile = $_POST['profile'] ?? ($data['profile'] ?? '');
        $avatar = $_POST['avatar'] ?? ($data['avatar'] ?? '');

        if (empty($id) || empty($name)) {
            echo json_encode(["status" => "error", "message" => "Thiếu thông tin bắt buộc"]);
            return;
        }

        // Fetch old avatar
        $old_sql = "SELECT avatar FROM players WHERE id = :id";
        $old_player = database::ThucThiTraVe($old_sql, ['id' => $id]);
        $old_avatar = (count($old_player) > 0) ? $old_player[0]['avatar'] : '';

        // Handle File Upload
        if (isset($_FILES['avatar_file']) && $_FILES['avatar_file']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = ROOT_DIR . '/public/uploads/';
            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }
            
            $fileTmp = $_FILES['avatar_file']['tmp_name'];
            $fileName = time() . '_' . preg_replace("/[^a-zA-Z0-9.]/", "_", basename($_FILES['avatar_file']['name']));
            $dest = $uploadDir . $fileName;
            
            if (move_uploaded_file($fileTmp, $dest)) {
                $avatar = 'public/uploads/' . $fileName;
                
                // Delete old avatar if it exists and is an uploaded file
                if (!empty($old_avatar) && strpos($old_avatar, 'public/uploads/') === 0) {
                    $old_path = ROOT_DIR . '/' . $old_avatar;
                    if (file_exists($old_path)) {
                        unlink($old_path);
                    }
                }
            }
        } elseif (empty($avatar)) {
            $avatar = $old_avatar; // Keep old avatar if no new one is provided and no string avatar provided
        }

        $sql = "UPDATE players SET name = :name, avatar = :avatar, gender = :gender, points = :points, profile = :profile WHERE id = :id";
        database::ThucThi($sql, [
            'id' => $id,
            'name' => $name,
            'avatar' => $avatar,
            'gender' => $gender,
            'points' => $points,
            'profile' => $profile
        ]);

        echo json_encode(["status" => "success", "message" => "Cập nhật người chơi thành công"]);
    }

    public function delete($data)
    {
        $id = $data['id'] ?? 0;
        if (empty($id)) {
            echo json_encode(["status" => "error", "message" => "Thiếu id người chơi"]);
            return;
        }

        // Fetch old avatar to delete it
        $old_sql = "SELECT avatar FROM players WHERE id = :id";
        $old_player = database::ThucThiTraVe($old_sql, ['id' => $id]);
        if (count($old_player) > 0) {
            $old_avatar = $old_player[0]['avatar'];
            if (!empty($old_avatar) && strpos($old_avatar, 'public/uploads/') === 0) {
                $old_path = ROOT_DIR . '/' . $old_avatar;
                if (file_exists($old_path)) {
                    unlink($old_path);
                }
            }
        }

        $sql = "DELETE FROM players WHERE id = :id";
        database::ThucThi($sql, ['id' => $id]);

        echo json_encode(["status" => "success", "message" => "Xóa người chơi thành công"]);
    }
}
?>
