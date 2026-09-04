<?php
if (!defined('SECURE_API_ACCESS')) {
    http_response_code(403);
    exit();
}

class PopupService
{
    public static function ensureTableExists()
    {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS `popup_settings` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `is_active` tinyint(1) NOT NULL DEFAULT 1,
                `title` varchar(255) DEFAULT 'Cộng Đồng Pickleball PICKO 247',
                `description` text DEFAULT NULL,
                `image_url` varchar(255) NOT NULL DEFAULT 'public/pop-up.png',
                `target_url` text NOT NULL,
                `button_text` varchar(100) DEFAULT 'Tham gia nhóm ngay',
                `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
                `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
            database::ThucThi($sql);

            // Kiểm tra xem đã có bản ghi mặc định id=1 chưa, nếu chưa thì tạo
            $check = database::ThucThiTraVe("SELECT id FROM popup_settings WHERE id = 1");
            if (empty($check)) {
                $defaultTarget = 'https://www.facebook.com/picko247?mibextid=wwXIfr&rdid=SICBPNokIWV2uIAV&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1KZtciCpUK%2F%3Fmibextid%3DwwXIfr#';
                $defaultDesc = 'Gia nhập nhóm Facebook để giao lưu với hàng nghìn VĐV, cập nhật bảng xếp hạng, tìm bạn ghép đôi & săn giải đấu mới nhất!';
                
                $sqlInsert = "INSERT INTO popup_settings (id, is_active, title, description, image_url, target_url, button_text)
                              VALUES (1, 1, 'Cộng Đồng Pickleball PICKO 247', :desc, 'public/pop-up.png', :target, 'Tham gia nhóm ngay')";
                database::ThucThi($sqlInsert, [
                    'desc' => $defaultDesc,
                    'target' => $defaultTarget
                ]);
            }
        } catch (Exception $e) {
            error_log("PopupService::ensureTableExists error: " . $e->getMessage());
        }
    }

    public static function getSettings()
    {
        self::ensureTableExists();
        $sql = "SELECT * FROM popup_settings WHERE id = 1";
        $rows = database::ThucThiTraVe($sql);
        if (!empty($rows)) {
            return $rows[0];
        }

        // Fallback mặc định nếu chưa có
        return [
            'id' => 1,
            'is_active' => 1,
            'title' => 'Cộng Đồng Pickleball PICKO 247',
            'description' => 'Gia nhập nhóm Facebook để giao lưu với hàng nghìn VĐV, cập nhật bảng xếp hạng, tìm bạn ghép đôi & săn giải đấu mới nhất!',
            'image_url' => 'public/pop-up.png',
            'target_url' => 'https://www.facebook.com/picko247?mibextid=wwXIfr&rdid=SICBPNokIWV2uIAV&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1KZtciCpUK%2F%3Fmibextid%3DwwXIfr#',
            'button_text' => 'Tham gia nhóm ngay'
        ];
    }

    public static function updateSettings($isActive, $title, $description, $imageUrl, $targetUrl, $buttonText)
    {
        self::ensureTableExists();
        $sql = "UPDATE popup_settings SET 
                is_active = :is_active,
                title = :title,
                description = :description,
                image_url = :image_url,
                target_url = :target_url,
                button_text = :button_text
                WHERE id = 1";
        
        database::ThucThi($sql, [
            'is_active' => intval($isActive),
            'title' => $title,
            'description' => $description,
            'image_url' => $imageUrl,
            'target_url' => $targetUrl,
            'button_text' => $buttonText ?: 'Tham gia nhóm ngay'
        ]);

        return self::getSettings();
    }
}
