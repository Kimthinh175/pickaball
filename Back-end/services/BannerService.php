<?php
if (!defined('SECURE_API_ACCESS')) {
    http_response_code(403);
    exit();
}

class BannerService
{
    private static function ensureTableExists()
    {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS `banners` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `title` varchar(255) DEFAULT NULL,
                `image_url` varchar(255) NOT NULL,
                `order_num` int(11) DEFAULT 0,
                `image_position` varchar(50) DEFAULT '50% 50%',
                `is_active` tinyint(1) DEFAULT 1,
                `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
                `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
            database::ThucThi($sql);
        } catch (Exception $e) {}
    }

    public static function getActiveBanners()
    {
        self::ensureTableExists();
        $sql = "SELECT * FROM banners WHERE is_active = 1 ORDER BY order_num ASC, id ASC";
        return database::ThucThiTraVe($sql);
    }

    public static function getAllBanners()
    {
        self::ensureTableExists();
        $sql = "SELECT * FROM banners ORDER BY order_num ASC, id ASC";
        return database::ThucThiTraVe($sql);
    }

    public static function getById($id)
    {
        $sql = "SELECT * FROM banners WHERE id = :id";
        $res = database::ThucThiTraVe($sql, ['id' => $id]);
        return count($res) > 0 ? $res[0] : null;
    }

    public static function createBanner($title, $imageUrl, $orderNum = 0, $imagePosition = '50% 50%', $isActive = 1)
    {
        $sql = "INSERT INTO banners (title, image_url, order_num, image_position, is_active) 
                VALUES (:title, :image_url, :order_num, :image_position, :is_active)";
        
        database::ThucThi($sql, [
            'title' => $title,
            'image_url' => $imageUrl,
            'order_num' => intval($orderNum),
            'image_position' => $imagePosition ?: '50% 50%',
            'is_active' => intval($isActive)
        ]);

        return database::lastInsertId();
    }

    public static function updateBanner($id, $title, $imageUrl, $orderNum = 0, $imagePosition = '50% 50%', $isActive = 1)
    {
        $sql = "UPDATE banners 
                SET title = :title, 
                    image_url = :image_url, 
                    order_num = :order_num, 
                    image_position = :image_position, 
                    is_active = :is_active 
                WHERE id = :id";
        
        return database::ThucThi($sql, [
            'id' => $id,
            'title' => $title,
            'image_url' => $imageUrl,
            'order_num' => intval($orderNum),
            'image_position' => $imagePosition ?: '50% 50%',
            'is_active' => intval($isActive)
        ]);
    }

    public static function toggleActive($id)
    {
        $sql = "UPDATE banners SET is_active = IF(is_active = 1, 0, 1) WHERE id = :id";
        return database::ThucThi($sql, ['id' => $id]);
    }

    public static function deleteBanner($id)
    {
        $banner = self::getById($id);
        if ($banner && !empty($banner['image_url'])) {
            $img = $banner['image_url'];
            // Xóa file nếu nằm trong public/banners/ và không phải file mẫu gốc (1.jpg, 2.jpg, 3.jpg)
            if (strpos($img, 'public/banners/') === 0) {
                $basename = basename($img);
                if (!in_array($basename, ['1.jpg', '2.jpg', '3.jpg'])) {
                    $filePath = ROOT_DIR . '/Front-end/' . $img;
                    if (file_exists($filePath)) {
                        @unlink($filePath);
                    }
                    $publicFilePath = ROOT_DIR . '/' . $img;
                    if (file_exists($publicFilePath)) {
                        @unlink($publicFilePath);
                    }
                }
            }
        }

        $sql = "DELETE FROM banners WHERE id = :id";
        return database::ThucThi($sql, ['id' => $id]);
    }
}
