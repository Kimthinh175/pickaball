<?php
class banner
{
    public function getActive($data)
    {
        $banners = BannerService::getActiveBanners();
        echo json_encode(["status" => "success", "data" => $banners]);
    }

    public function getAll($data)
    {
        $banners = BannerService::getAllBanners();
        echo json_encode(["status" => "success", "data" => $banners]);
    }

    public function create($data)
    {
        $title = $data['title'] ?? ($_POST['title'] ?? '');
        $imageUrl = $data['image_url'] ?? ($_POST['image_url'] ?? '');
        $orderNum = isset($_POST['order_num']) ? intval($_POST['order_num']) : (isset($data['order_num']) ? intval($data['order_num']) : 0);
        $imagePosition = $data['image_position'] ?? ($_POST['image_position'] ?? '50% 50%');
        $isActive = isset($_POST['is_active']) ? intval($_POST['is_active']) : (isset($data['is_active']) ? intval($data['is_active']) : 1);

        // Handle Banner File Upload
        if (isset($_FILES['banner_file']) && $_FILES['banner_file']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = ROOT_DIR . '/Front-end/public/banners/';
            $rootPublicDir = ROOT_DIR . '/public/banners/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            if (!is_dir($rootPublicDir)) mkdir($rootPublicDir, 0777, true);

            $ext = pathinfo($_FILES['banner_file']['name'], PATHINFO_EXTENSION);
            $filename = 'banner_' . time() . '_' . rand(100, 999) . '.' . $ext;
            $dest = $uploadDir . $filename;

            if (move_uploaded_file($_FILES['banner_file']['tmp_name'], $dest)) {
                @copy($dest, $rootPublicDir . $filename);
                $imageUrl = 'public/banners/' . $filename;
            }
        }

        if (empty($imageUrl)) {
            echo json_encode(["status" => "error", "message" => "Vui lòng chọn hoặc tải lên ảnh banner"]);
            return;
        }

        $id = BannerService::createBanner($title, $imageUrl, $orderNum, $imagePosition, $isActive);

        echo json_encode([
            "status" => "success",
            "message" => "Thêm banner thành công",
            "data" => [
                "id" => $id,
                "title" => $title,
                "image_url" => $imageUrl,
                "order_num" => $orderNum,
                "image_position" => $imagePosition,
                "is_active" => $isActive
            ]
        ]);
    }

    public function update($data)
    {
        $id = $_POST['id'] ?? ($data['id'] ?? 0);
        if (empty($id)) {
            echo json_encode(["status" => "error", "message" => "Thiếu mã banner"]);
            return;
        }

        $current = BannerService::getById($id);
        if (!$current) {
            echo json_encode(["status" => "error", "message" => "Không tìm thấy banner"]);
            return;
        }

        $title = $_POST['title'] ?? ($data['title'] ?? $current['title']);
        $imageUrl = $_POST['image_url'] ?? ($data['image_url'] ?? $current['image_url']);
        $orderNum = isset($_POST['order_num']) ? intval($_POST['order_num']) : (isset($data['order_num']) ? intval($data['order_num']) : $current['order_num']);
        $imagePosition = $_POST['image_position'] ?? ($data['image_position'] ?? $current['image_position']);
        $isActive = isset($_POST['is_active']) ? intval($_POST['is_active']) : (isset($data['is_active']) ? intval($data['is_active']) : $current['is_active']);

        // Handle New File Upload
        if (isset($_FILES['banner_file']) && $_FILES['banner_file']['error'] === UPLOAD_ERR_OK) {
            $uploadDir = ROOT_DIR . '/Front-end/public/banners/';
            $rootPublicDir = ROOT_DIR . '/public/banners/';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            if (!is_dir($rootPublicDir)) mkdir($rootPublicDir, 0777, true);

            $ext = pathinfo($_FILES['banner_file']['name'], PATHINFO_EXTENSION);
            $filename = 'banner_' . time() . '_' . rand(100, 999) . '.' . $ext;
            $dest = $uploadDir . $filename;

            if (move_uploaded_file($_FILES['banner_file']['tmp_name'], $dest)) {
                @copy($dest, $rootPublicDir . $filename);
                $imageUrl = 'public/banners/' . $filename;
            }
        }

        BannerService::updateBanner($id, $title, $imageUrl, $orderNum, $imagePosition, $isActive);

        echo json_encode([
            "status" => "success",
            "message" => "Cập nhật banner thành công",
            "data" => [
                "id" => $id,
                "title" => $title,
                "image_url" => $imageUrl,
                "order_num" => $orderNum,
                "image_position" => $imagePosition,
                "is_active" => $isActive
            ]
        ]);
    }

    public function toggleStatus($data)
    {
        $id = $data['id'] ?? ($_POST['id'] ?? 0);
        if (empty($id)) {
            echo json_encode(["status" => "error", "message" => "Thiếu mã banner"]);
            return;
        }

        BannerService::toggleActive($id);
        $updated = BannerService::getById($id);

        echo json_encode([
            "status" => "success",
            "message" => "Thay đổi trạng thái hiển thị thành công",
            "data" => $updated
        ]);
    }

    public function delete($data)
    {
        $id = $data['id'] ?? 0;
        if (empty($id)) {
            echo json_encode(["status" => "error", "message" => "Thiếu mã banner"]);
            return;
        }

        BannerService::deleteBanner($id);
        echo json_encode(["status" => "success", "message" => "Xóa banner thành công"]);
    }
}
