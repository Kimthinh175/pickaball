<?php
class match
{
    public function recordResult($data)
    {
        $tournament_id = $data['tournament_id'] ?? 0;
        $player_1_id = $data['player_1_id'] ?? 0;
        $player_2_id = $data['player_2_id'] ?? 0;
        $winner_id = $data['winner_id'] ?? 0;

        if (empty($tournament_id) || empty($player_1_id) || empty($player_2_id) || empty($winner_id)) {
            echo json_encode(["status" => "error", "message" => "Vui lòng cung cấp đủ thông tin trận đấu"]);
            return;
        }

        if ($player_1_id == $player_2_id) {
            echo json_encode(["status" => "error", "message" => "Người chơi 1 và người chơi 2 phải khác nhau"]);
            return;
        }

        if ($winner_id != $player_1_id && $winner_id != $player_2_id) {
            echo json_encode(["status" => "error", "message" => "Người chiến thắng phải là một trong hai người chơi"]);
            return;
        }

        try {
            database::beginTransaction();

            // 1. Ghi nhận trận đấu
            $sqlInsert = "INSERT INTO matches (tournament_id, player_1_id, player_2_id, winner_id) 
                          VALUES (:t_id, :p1, :p2, :w)";
            database::ThucThi($sqlInsert, [
                't_id' => $tournament_id,
                'p1' => $player_1_id,
                'p2' => $player_2_id,
                'w' => $winner_id
            ]);

            // 2. Cập nhật điểm trình (Thắng +10, Thua -10)
            $loser_id = ($winner_id == $player_1_id) ? $player_2_id : $player_1_id;

            $sqlUpdateWinner = "UPDATE players SET points = points + 10 WHERE id = :winner_id";
            database::ThucThi($sqlUpdateWinner, ['winner_id' => $winner_id]);

            $sqlUpdateLoser = "UPDATE players SET points = GREATEST(0, points - 10) WHERE id = :loser_id";
            database::ThucThi($sqlUpdateLoser, ['loser_id' => $loser_id]);

            database::commit();

            echo json_encode(["status" => "success", "message" => "Cập nhật kết quả trận đấu thành công. Thắng +10, Thua -10."]);
        } catch (Exception $e) {
            database::rollBack();
            echo json_encode(["status" => "error", "message" => "Lỗi: " . $e->getMessage()]);
        }
    }
}
?>
