<?php
if (!defined('SECURE_API_ACCESS')) {
    http_response_code(403);
    exit();
}

class tournament
{
    public function getAll($data)
    {
        $tournaments = TournamentService::getAll();
        echo json_encode(["status" => "success", "data" => $tournaments]);
    }

    public function getDetail($data)
    {
        $id = $data['id'] ?? 0;
        if (empty($id)) {
            echo json_encode(["status" => "error", "message" => "Thiếu id giải đấu"]);
            return;
        }

        $detail = TournamentService::getDetail($id);
        if (!$detail) {
            echo json_encode(["status" => "error", "message" => "Giải đấu không tồn tại"]);
            return;
        }

        echo json_encode(["status" => "success", "data" => $detail]);
    }

    public function create($data)
    {
        $title = $data['title'] ?? '';
        if (empty($title)) {
            echo json_encode(["status" => "error", "message" => "Tên giải đấu không được để trống"]);
            return;
        }

        database::beginTransaction();
        try {
            $tournament_id = TournamentService::createBasic($data);
            $match_id_map = MatchService::createMatchups($tournament_id, $data['matchups'] ?? []);
            GroupService::createGroups($tournament_id, $data['groups'] ?? [], $match_id_map);
            BracketService::createBrackets($tournament_id, $data['brackets'] ?? [], count($data['groups'] ?? []), count($data['matchups'] ?? []));

            // Lưu danh sách tournament_teams
            if (!empty($data['teams'])) {
                foreach ($data['teams'] as $tm) {
                    $p1 = min(intval($tm['player1_id'] ?? 0), intval($tm['player2_id'] ?? 0));
                    $p2 = max(intval($tm['player1_id'] ?? 0), intval($tm['player2_id'] ?? 0));
                    if ($p1 && $p2) {
                        database::ThucThi("INSERT IGNORE INTO tournament_teams (tournament_id, player1_id, player2_id, status, group_id) VALUES (:tid, :p1, :p2, :st, :gid)", [
                            'tid' => $tournament_id,
                            'p1' => $p1,
                            'p2' => $p2,
                            'st' => $tm['status'] ?? 'Chưa chuyển khoản',
                            'gid' => !empty($tm['group_id']) ? $tm['group_id'] : null
                        ]);
                    }
                }
            }

            database::commit();
            echo json_encode(["status" => "success", "message" => "Tạo giải đấu thành công", "tournament_id" => $tournament_id]);
        } catch (Exception $e) {
            database::rollBack();
            echo json_encode(["status" => "error", "message" => "Lỗi tạo giải: " . $e->getMessage()]);
        }
    }

    public function update($data)
    {
        $id = $data['id'] ?? 0;
        if (empty($id)) {
            echo json_encode(["status" => "error", "message" => "Thiếu id giải đấu"]);
            return;
        }

        try {
            $success = TournamentService::updateBasic($id, $data);
            if ($success) {
                echo json_encode(["status" => "success", "message" => "Cập nhật giải đấu thành công"]);
            } else {
                echo json_encode(["status" => "error", "message" => "Không có dữ liệu thay đổi"]);
            }
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Lỗi cập nhật: " . $e->getMessage()]);
        }
    }

    public function updateStructure($data)
    {
        $id = $data['id'] ?? 0;
        if (empty($id)) {
            echo json_encode(["status" => "error", "message" => "Thiếu id giải đấu"]);
            return;
        }

        TournamentService::updateBasic($id, $data);

        try {
            database::beginTransaction();

            MatchService::deleteByTournament($id);
            GroupService::deleteByTournament($id);
            BracketService::deleteByTournament($id);
            RatingService::deleteByTournament($id);
            database::ThucThi("DELETE FROM tournament_teams WHERE tournament_id = :tid", ['tid' => $id]);

            $match_id_map = MatchService::createMatchups($id, $data['matchups'] ?? []);
            GroupService::createGroups($id, $data['groups'] ?? [], $match_id_map);
            BracketService::createBrackets($id, $data['brackets'] ?? [], count($data['groups'] ?? []), count($data['matchups'] ?? []));

            // Lưu danh sách tournament_teams
            if (!empty($data['teams'])) {
                foreach ($data['teams'] as $tm) {
                    $p1 = min(intval($tm['player1_id'] ?? 0), intval($tm['player2_id'] ?? 0));
                    $p2 = max(intval($tm['player1_id'] ?? 0), intval($tm['player2_id'] ?? 0));
                    if ($p1 && $p2) {
                        database::ThucThi("INSERT IGNORE INTO tournament_teams (tournament_id, player1_id, player2_id, status, group_id) VALUES (:tid, :p1, :p2, :st, :gid)", [
                            'tid' => $id,
                            'p1' => $p1,
                            'p2' => $p2,
                            'st' => $tm['status'] ?? 'Chưa chuyển khoản',
                            'gid' => !empty($tm['group_id']) ? $tm['group_id'] : null
                        ]);
                    }
                }
            }

            database::commit();
            echo json_encode(["status" => "success", "message" => "Cập nhật giải đấu và sơ đồ thành công"]);
        } catch (Exception $e) {
            database::rollBack();
            echo json_encode(["status" => "error", "message" => "Lỗi cập nhật sơ đồ: " . $e->getMessage()]);
        }
    }

    public function delete($data)
    {
        $id = intval($data['id'] ?? ($_GET['id'] ?? 0));
        if (empty($id)) {
            echo json_encode(["status" => "error", "message" => "Thiếu id giải đấu"]);
            return;
        }

        try {
            database::beginTransaction();
            MatchService::deleteByTournament($id);
            BracketService::deleteByTournament($id);
            GroupService::deleteByTournament($id);
            RatingService::deleteByTournament($id);
            TournamentService::delete($id);

            database::commit();
            echo json_encode(["status" => "success", "message" => "Đã xoá giải đấu thành công"]);
        } catch (Exception $e) {
            database::rollBack();
            echo json_encode(["status" => "error", "message" => "Lỗi xoá giải: " . $e->getMessage()]);
        }
    }

    public function updateMatchStatus($data)
    {
        $match_id = $data['match_id'] ?? 0;
        $status = $data['status'] ?? 'Chưa chuyển khoản';

        if (empty($match_id)) {
            echo json_encode(["status" => "error", "message" => "Thiếu ID trận đấu"]);
            return;
        }

        MatchService::updateStatus($match_id, $status);
        echo json_encode(["status" => "success", "message" => "Cập nhật trạng thái chuyển tiền thành công", "new_status" => $status]);
    }

    public function finishTournament($data)
    {
        $id = intval($data['id'] ?? ($_GET['id'] ?? 0));
        if (empty($id)) {
            echo json_encode(["status" => "error", "message" => "Thiếu ID giải đấu"]);
            return;
        }

        $apply_points = isset($data['apply_points']) ? filter_var($data['apply_points'], FILTER_VALIDATE_BOOLEAN) : true;

        try {
            database::beginTransaction();
            RatingService::finishTournament($id, $data['final_results'] ?? [], $apply_points);
            database::commit();
            echo json_encode(["status" => "success", "message" => "Đã kết thúc giải đấu, lưu kết quả chung cuộc và tự động cập nhật điểm trình thành công!"]);
        } catch (Exception $e) {
            database::rollBack();
            echo json_encode(["status" => "error", "message" => "Lỗi kết thúc giải: " . $e->getMessage()]);
        }
    }

    public function addPlayer($data)
    {
        $tournament_id = $data['tournament_id'] ?? 0;
        $player_id = $data['player_id'] ?? 0;

        if (empty($tournament_id) || empty($player_id)) {
            echo json_encode(["status" => "error", "message" => "Thiếu ID giải đấu hoặc ID người chơi"]);
            return;
        }

        try {
            RatingService::addPlayer($tournament_id, $player_id);
            echo json_encode(["status" => "success", "message" => "Thêm người chơi vào giải đấu thành công"]);
        } catch (Exception $e) {
            echo json_encode(["status" => "error", "message" => "Người chơi này đã có trong giải đấu"]);
        }
    }

    public function removePlayer($data)
    {
        $tournament_id = $data['tournament_id'] ?? 0;
        $player_id = $data['player_id'] ?? 0;

        if (empty($tournament_id) || empty($player_id)) {
            echo json_encode(["status" => "error", "message" => "Thiếu ID giải đấu hoặc ID người chơi"]);
            return;
        }

        RatingService::removePlayer($tournament_id, $player_id);
        echo json_encode(["status" => "success", "message" => "Xóa người chơi khỏi giải đấu thành công"]);
    }

    public function updatePlacement($data)
    {
        $tournament_id = $data['tournament_id'] ?? 0;
        $player_id = $data['player_id'] ?? 0;
        $placement = $data['placement'] ?? '';

        if (empty($tournament_id) || empty($player_id) || empty($placement)) {
            echo json_encode(["status" => "error", "message" => "Thiếu thông tin cập nhật"]);
            return;
        }

        try {
            database::beginTransaction();
            RatingService::updatePlacement($tournament_id, $player_id, $placement);
            database::commit();
            echo json_encode(["status" => "success", "message" => "Cập nhật thành tích thành công."]);
        } catch (Exception $e) {
            database::rollBack();
            echo json_encode(["status" => "error", "message" => "Lỗi: " . $e->getMessage()]);
        }
    }

    public function updatePaymentStatus($data)
    {
        $this->updateMatchStatus($data);
    }

    public function updateTeamPaymentStatus($data)
    {
        $team_id = intval($data['team_id'] ?? 0);
        $tournament_id = intval($data['tournament_id'] ?? 0);
        $p1_id = intval($data['p1_id'] ?? ($data['player1_id'] ?? 0));
        $p2_id = intval($data['p2_id'] ?? ($data['player2_id'] ?? 0));
        $status = $data['status'] ?? 'Chưa chuyển khoản';

        if (!empty($team_id)) {
            database::ThucThi("UPDATE tournament_teams SET status = :status WHERE id = :team_id", [
                'team_id' => $team_id,
                'status' => $status
            ]);
            echo json_encode(["status" => "success", "message" => "Cập nhật trạng thái đóng tiền của đội thành công", "new_status" => $status]);
            return;
        }

        if (empty($tournament_id) || empty($p1_id) || empty($p2_id)) {
            echo json_encode(["status" => "error", "message" => "Thiếu thông tin giải đấu hoặc đội"]);
            return;
        }

        $minP = min($p1_id, $p2_id);
        $maxP = max($p1_id, $p2_id);

        // Cập nhật trạng thái chỉ cho riêng ĐỘI ĐÓ trong tournament_teams
        $sql = "UPDATE tournament_teams SET status = :status 
                WHERE tournament_id = :tid 
                  AND player1_id = :p1 AND player2_id = :p2";
        database::ThucThi($sql, [
            'tid' => $tournament_id,
            'p1' => $minP,
            'p2' => $maxP,
            'status' => $status
        ]);

        echo json_encode(["status" => "success", "message" => "Cập nhật trạng thái đóng tiền của đội thành công", "new_status" => $status]);
    }

    public function getBanners($data)
    {
        $banners = TournamentService::getBanners();
        echo json_encode(["status" => "success", "data" => $banners]);
    }

    public function uploadBanner($data)
    {
        $uploadDir = ROOT_DIR . '/Front-end/public/banners/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }

        if (!empty($_FILES['banner'])) {
            $file = $_FILES['banner'];
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
            if (!in_array($ext, $allowed)) {
                echo json_encode(["status" => "error", "message" => "Định dạng ảnh không hợp lệ (chỉ hỗ trợ jpg, png, webp, gif)"]);
                return;
            }

            $filename = 'banner_' . time() . '_' . rand(100, 999) . '.' . $ext;
            $destination = $uploadDir . $filename;

            if (move_uploaded_file($file['tmp_name'], $destination)) {
                $imageUrl = 'public/banners/' . $filename;
                $title = $data['title'] ?? pathinfo($file['name'], PATHINFO_FILENAME);
                $bannerId = TournamentService::saveBanner($title, $imageUrl);

                echo json_encode([
                    "status" => "success",
                    "message" => "Tải lên banner thành công",
                    "data" => ["id" => $bannerId, "title" => $title, "image_url" => $imageUrl]
                ]);
                return;
            } else {
                echo json_encode(["status" => "error", "message" => "Không thể lưu file tải lên"]);
                return;
            }
        }

        $base64 = $data['image_base64'] ?? '';
        if (!empty($base64)) {
            if (preg_match('/^data:image\/(\w+);base64,/', $base64, $type)) {
                $base64 = substr($base64, strpos($base64, ',') + 1);
                $ext = strtolower($type[1]);
                if ($ext === 'jpeg') $ext = 'jpg';
            } else {
                $ext = 'jpg';
            }

            $decodedData = base64_decode($base64);
            if ($decodedData === false) {
                echo json_encode(["status" => "error", "message" => "Dữ liệu base64 không hợp lệ"]);
                return;
            }

            $filename = 'banner_' . time() . '_' . rand(100, 999) . '.' . $ext;
            $destination = $uploadDir . $filename;

            if (file_put_contents($destination, $decodedData)) {
                $imageUrl = 'public/banners/' . $filename;
                $title = $data['title'] ?? 'Banner Tải Lên';
                $bannerId = TournamentService::saveBanner($title, $imageUrl);

                echo json_encode([
                    "status" => "success",
                    "message" => "Tải lên banner thành công",
                    "data" => ["id" => $bannerId, "title" => $title, "image_url" => $imageUrl]
                ]);
                return;
            }
        }

        echo json_encode(["status" => "error", "message" => "Vui lòng chọn file ảnh để tải lên"]);
    }
}
?>
