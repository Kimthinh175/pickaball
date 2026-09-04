<?php
if (!defined('SECURE_API_ACCESS')) {
    http_response_code(403);
    exit();
}

class popup
{
    /**
     * Public API - Lấy thông tin popup cho client
     */
    public function getPublic($data)
    {
        $settings = PopupService::getSettings();
        echo json_encode([
            "status" => "success",
            "data" => $settings
        ]);
    }

    /**
     * Admin API - Lấy thông tin popup cho trang quản trị
     */
    public function getAdmin($data)
    {
        $settings = PopupService::getSettings();
        echo json_encode([
            "status" => "success",
            "data" => $settings
        ]);
    }

    /**
     * Admin API - Cập nhật thông tin popup, bật/tắt, thay ảnh, thay link
     */
    public function update($data)
    {
        $current = PopupService::getSettings();

        $isActive = isset($_POST['is_active']) ? intval($_POST['is_active']) : (isset($data['is_active']) ? intval($data['is_active']) : $current['is_active']);
        $title = isset($_POST['title']) ? trim($_POST['title']) : (isset($data['title']) ? trim($data['title']) : $current['title']);
        $description = isset($_POST['description']) ? trim($_POST['description']) : (isset($data['description']) ? trim($data['description']) : $current['description']);
        $targetUrl = isset($_POST['target_url']) ? trim($_POST['target_url']) : (isset($data['target_url']) ? trim($data['target_url']) : $current['target_url']);
        $buttonText = isset($_POST['button_text']) ? trim($_POST['button_text']) : (isset($data['button_text']) ? trim($data['button_text']) : $current['button_text']);
        
        $imageUrl = isset($_POST['image_url']) ? trim($_POST['image_url']) : (isset($data['image_url']) ? trim($data['image_url']) : $current['image_url']);

        // Xử lý upload ảnh mới nếu có
        $fileKey = null;
        if (isset($_FILES['popup_file']) && $_FILES['popup_file']['error'] === UPLOAD_ERR_OK) {
            $fileKey = 'popup_file';
        } else if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] === UPLOAD_ERR_OK) {
            $fileKey = 'image_file';
        }

        if ($fileKey) {
            $uploadedPath = $this->saveOptimizedPopupImage($_FILES[$fileKey]);
            if ($uploadedPath) {
                $imageUrl = $uploadedPath;
            }
        }

        if (empty($targetUrl)) {
            $targetUrl = $current['target_url'];
        }

        $updated = PopupService::updateSettings($isActive, $title, $description, $imageUrl, $targetUrl, $buttonText);

        echo json_encode([
            "status" => "success",
            "message" => "Cập nhật cấu hình popup thành công!",
            "data" => $updated
        ]);
    }

    /**
     * Tự động nén và tối ưu hoá kích thước ảnh popup (hỗ trợ JPG, PNG, WEBP)
     */
    private function saveOptimizedPopupImage($file)
    {
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        if (!in_array($ext, $allowed)) {
            return null;
        }

        $uploadDir = ROOT_DIR . '/Front-end/public/uploads/popups/';
        $rootPublicDir = ROOT_DIR . '/public/uploads/popups/';
        if (!is_dir($uploadDir)) @mkdir($uploadDir, 0777, true);
        if (!is_dir($rootPublicDir)) @mkdir($rootPublicDir, 0777, true);

        $filename = 'popup_' . time() . '_' . rand(100, 999) . '.' . ($ext === 'jpeg' ? 'jpg' : $ext);
        $destPath = $uploadDir . $filename;
        $rootDestPath = $rootPublicDir . $filename;

        // Nếu GD không hỗ trợ, lưu file gốc
        if (!extension_loaded('gd')) {
            if (move_uploaded_file($file['tmp_name'], $destPath)) {
                @copy($destPath, $rootDestPath);
                return 'public/uploads/popups/' . $filename;
            }
            return null;
        }

        $tmpFile = $file['tmp_name'];
        list($origWidth, $origHeight, $imageType) = @getimagesize($tmpFile);
        if (!$origWidth || !$origHeight) {
            if (move_uploaded_file($tmpFile, $destPath)) {
                @copy($destPath, $rootDestPath);
                return 'public/uploads/popups/' . $filename;
            }
            return null;
        }

        // Tối đa 1200px chiều rộng/cao cho popup sắc nét và nhẹ
        $maxDimension = 1200;
        $width = $origWidth;
        $height = $origHeight;

        if ($width > $maxDimension || $height > $maxDimension) {
            $ratio = min($maxDimension / $width, $maxDimension / $height);
            $width = (int)round($width * $ratio);
            $height = (int)round($height * $ratio);
        }

        // Đọc ảnh nguồn
        $srcImg = null;
        switch ($imageType) {
            case IMAGETYPE_JPEG:
                $srcImg = @imagecreatefromjpeg($tmpFile);
                break;
            case IMAGETYPE_PNG:
                $srcImg = @imagecreatefrompng($tmpFile);
                break;
            case IMAGETYPE_WEBP:
                if (function_exists('imagecreatefromwebp')) {
                    $srcImg = @imagecreatefromwebp($tmpFile);
                }
                break;
        }

        if (!$srcImg) {
            if (move_uploaded_file($tmpFile, $destPath)) {
                @copy($destPath, $rootDestPath);
                return 'public/uploads/popups/' . $filename;
            }
            return null;
        }

        // Xoay ảnh theo EXIF nếu có (cho ảnh chụp từ điện thoại)
        if ($imageType === IMAGETYPE_JPEG && function_exists('exif_read_data')) {
            $exif = @exif_read_data($tmpFile);
            if (!empty($exif['Orientation'])) {
                switch ($exif['Orientation']) {
                    case 3:
                        $srcImg = imagerotate($srcImg, 180, 0);
                        break;
                    case 6:
                        $srcImg = imagerotate($srcImg, -90, 0);
                        list($width, $height) = [$height, $width];
                        break;
                    case 8:
                        $srcImg = imagerotate($srcImg, 90, 0);
                        list($width, $height) = [$height, $width];
                        break;
                }
            }
        }

        // Tạo ảnh đích đã resize
        $dstImg = imagecreatetruecolor($width, $height);

        // Bảo tồn độ trong suốt cho PNG / WEBP
        if ($imageType === IMAGETYPE_PNG || $imageType === IMAGETYPE_WEBP) {
            imagealphablending($dstImg, false);
            imagesavealpha($dstImg, true);
            $transparent = imagecolorallocatealpha($dstImg, 255, 255, 255, 127);
            imagefilledrectangle($dstImg, 0, 0, $width, $height, $transparent);
        }

        imagecopyresampled($dstImg, $srcImg, 0, 0, 0, 0, $width, $height, imagesx($srcImg), imagesy($srcImg));

        // Xuất file chất lượng cao (quality 85)
        $saved = false;
        switch ($imageType) {
            case IMAGETYPE_PNG:
                $saved = @imagepng($dstImg, $destPath, 6);
                break;
            case IMAGETYPE_WEBP:
                if (function_exists('imagewebp')) {
                    $saved = @imagewebp($dstImg, $destPath, 85);
                } else {
                    $saved = @imagejpeg($dstImg, $destPath, 85);
                }
                break;
            default:
                $saved = @imagejpeg($dstImg, $destPath, 85);
                break;
        }

        imagedestroy($srcImg);
        imagedestroy($dstImg);

        if ($saved) {
            @copy($destPath, $rootDestPath);
            return 'public/uploads/popups/' . $filename;
        }

        // Fallback lưu trực tiếp nếu GD lỗi
        if (move_uploaded_file($tmpFile, $destPath)) {
            @copy($destPath, $rootDestPath);
            return 'public/uploads/popups/' . $filename;
        }

        return null;
    }
}
