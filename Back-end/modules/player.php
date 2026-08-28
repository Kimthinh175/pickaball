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

        // Handle File Upload with Auto-Resize & Optimization (supports 4K/high-res)
        if (isset($_FILES['avatar_file']) && $_FILES['avatar_file']['error'] === UPLOAD_ERR_OK) {
            $uploadedPath = $this->saveOptimizedAvatar($_FILES['avatar_file']['tmp_name'], $_FILES['avatar_file']['name']);
            if ($uploadedPath) {
                $avatar = $uploadedPath;
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

        // Handle File Upload with Auto-Resize & Optimization (supports 4K/high-res)
        if (isset($_FILES['avatar_file']) && $_FILES['avatar_file']['error'] === UPLOAD_ERR_OK) {
            $uploadedPath = $this->saveOptimizedAvatar($_FILES['avatar_file']['tmp_name'], $_FILES['avatar_file']['name']);
            if ($uploadedPath) {
                $avatar = $uploadedPath;
                
                // Delete old avatar if it exists and is an uploaded file
                if (!empty($old_avatar) && strpos($old_avatar, 'public/uploads/') === 0) {
                    $old_path = ROOT_DIR . '/' . $old_avatar;
                    if (file_exists($old_path)) {
                        @unlink($old_path);
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
                    @unlink($old_path);
                }
            }
        }

        $sql = "DELETE FROM players WHERE id = :id";
        database::ThucThi($sql, ['id' => $id]);

        echo json_encode(["status" => "success", "message" => "Xóa người chơi thành công"]);
    }

    /**
     * Tự động nén và resize ảnh Avatar (Hỗ trợ ảnh 4K/gốc từ điện thoại, giảm từ ~10MB về ~100KB mà vẫn nét)
     */
    private function saveOptimizedAvatar($fileTmp, $originalName, $maxDim = 800, $quality = 85)
    {
        $uploadDir = ROOT_DIR . '/public/uploads/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        $cleanName = preg_replace("/[^a-zA-Z0-9.]/", "_", basename($originalName));
        $fileName = time() . '_' . $cleanName;
        $destPath = $uploadDir . $fileName;

        // Nếu không có GD library -> fallback lưu file gốc
        if (!extension_loaded('gd')) {
            return move_uploaded_file($fileTmp, $destPath) ? 'public/uploads/' . $fileName : null;
        }

        $imageInfo = @getimagesize($fileTmp);
        if (!$imageInfo) {
            return move_uploaded_file($fileTmp, $destPath) ? 'public/uploads/' . $fileName : null;
        }

        $mime = $imageInfo['mime'];
        $srcImg = null;

        switch ($mime) {
            case 'image/jpeg':
            case 'image/jpg':
                $srcImg = @imagecreatefromjpeg($fileTmp);
                break;
            case 'image/png':
                $srcImg = @imagecreatefrompng($fileTmp);
                break;
            case 'image/webp':
                $srcImg = @imagecreatefromwebp($fileTmp);
                break;
            case 'image/gif':
                $srcImg = @imagecreatefromgif($fileTmp);
                break;
            default:
                return move_uploaded_file($fileTmp, $destPath) ? 'public/uploads/' . $fileName : null;
        }

        if (!$srcImg) {
            return move_uploaded_file($fileTmp, $destPath) ? 'public/uploads/' . $fileName : null;
        }

        // Tự động xoay ảnh theo EXIF (chống bị quay ngang/ngược khi chụp từ điện thoại)
        if (function_exists('exif_read_data') && ($mime === 'image/jpeg' || $mime === 'image/jpg')) {
            $exif = @exif_read_data($fileTmp);
            if (!empty($exif['Orientation'])) {
                switch ($exif['Orientation']) {
                    case 3:
                        $srcImg = imagerotate($srcImg, 180, 0);
                        break;
                    case 6:
                        $srcImg = imagerotate($srcImg, -90, 0);
                        break;
                    case 8:
                        $srcImg = imagerotate($srcImg, 90, 0);
                        break;
                }
            }
        }

        $origW = imagesx($srcImg);
        $origH = imagesy($srcImg);

        // Tính toán kích thước mới (tối đa maxDim px cạnh dài nhất)
        $newW = $origW;
        $newH = $origH;

        if ($origW > $maxDim || $origH > $maxDim) {
            if ($origW >= $origH) {
                $newW = $maxDim;
                $newH = (int)round(($origH * $maxDim) / $origW);
            } else {
                $newH = $maxDim;
                $newW = (int)round(($origW * $maxDim) / $origH);
            }
        }

        $destImg = imagecreatetruecolor($newW, $newH);

        // Giữ nền trong suốt cho PNG / WEBP / GIF
        if ($mime === 'image/png' || $mime === 'image/webp' || $mime === 'image/gif') {
            imagealphablending($destImg, false);
            imagesavealpha($destImg, true);
            $transparent = imagecolorallocatealpha($destImg, 255, 255, 255, 127);
            imagefilledrectangle($destImg, 0, 0, $newW, $newH, $transparent);
        }

        imagecopyresampled($destImg, $srcImg, 0, 0, 0, 0, $newW, $newH, $origW, $origH);

        $ext = strtolower(pathinfo($destPath, PATHINFO_EXTENSION));
        $saved = false;

        if ($ext === 'png') {
            $saved = imagepng($destImg, $destPath, 8);
        } elseif ($ext === 'webp') {
            $saved = imagewebp($destImg, $destPath, $quality);
        } else {
            $saved = imagejpeg($destImg, $destPath, $quality);
        }

        imagedestroy($srcImg);
        imagedestroy($destImg);

        return $saved ? 'public/uploads/' . $fileName : (move_uploaded_file($fileTmp, $destPath) ? 'public/uploads/' . $fileName : null);
    }
}
?>
