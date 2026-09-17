<?php
if (!defined('SECURE_API_ACCESS')) {
    http_response_code(403);
    exit();
}

class BracketService
{
    public static function createBrackets($tournament_id, $bracketsData, $groupsCount = 0, $matchupsCount = 0)
    {
        if (!empty($bracketsData)) {
            foreach ($bracketsData as $b) {
                $stgName = trim($b['stage_name'] ?? '');
                if (empty($stgName)) continue;
                $mOrder = intval($b['match_order'] ?? 1);
                $slot1 = trim($b['slot_1_label'] ?? '');
                $slot2 = trim($b['slot_2_label'] ?? '');

                $sqlBracket = "INSERT INTO tournament_brackets (tournament_id, stage_name, match_order, slot_1_label, slot_2_label, status) 
                               VALUES (:tid, :stage, :order, :s1, :s2, 'pending')";
                database::ThucThi($sqlBracket, [
                    'tid' => $tournament_id,
                    'stage' => $stgName,
                    'order' => $mOrder,
                    's1' => $slot1,
                    's2' => $slot2
                ]);
            }
        } else {
            if ($groupsCount >= 2 || $matchupsCount >= 2) {
                database::ThucThi("INSERT INTO tournament_brackets (tournament_id, stage_name, match_order, slot_1_label, slot_2_label, status) VALUES (:tid, 'Bán kết', 1, 'Nhất bảng A', 'Nhì bảng B', 'pending')", ['tid' => $tournament_id]);
                database::ThucThi("INSERT INTO tournament_brackets (tournament_id, stage_name, match_order, slot_1_label, slot_2_label, status) VALUES (:tid, 'Bán kết', 2, 'Nhất bảng B', 'Nhì bảng A', 'pending')", ['tid' => $tournament_id]);
                database::ThucThi("INSERT INTO tournament_brackets (tournament_id, stage_name, match_order, slot_1_label, slot_2_label, status) VALUES (:tid, 'Chung kết', 1, 'Thắng BK #1', 'Thắng BK #2', 'pending')", ['tid' => $tournament_id]);
            }
        }
    }

    public static function deleteByTournament($tournament_id)
    {
        database::ThucThi("DELETE FROM tournament_brackets WHERE tournament_id = :id", ['id' => $tournament_id]);
    }

    public static function getTeamDisplayName($teamId)
    {
        if (empty($teamId)) return '';
        $rows = database::ThucThiTraVe("SELECT t.*, 
            p1.name as p1_name, p1.nickname as p1_nickname,
            p2.name as p2_name, p2.nickname as p2_nickname
            FROM tournament_teams t
            LEFT JOIN players p1 ON t.player1_id = p1.id
            LEFT JOIN players p2 ON t.player2_id = p2.id
            WHERE t.id = :id", ['id' => $teamId]);
        if (empty($rows)) return '';
        $r = $rows[0];
        $n1 = !empty($r['p1_nickname']) ? trim($r['p1_nickname']) : trim($r['p1_name'] ?? '');
        $n2 = !empty($r['p2_nickname']) ? trim($r['p2_nickname']) : trim($r['p2_name'] ?? '');
        if (!empty($n1) && !empty($n2)) return "{$n1} & {$n2}";
        return $n1 ?: $n2 ?: "Đội #{$teamId}";
    }

    public static function getOrderedStages($tournamentId)
    {
        $all = database::ThucThiTraVe("SELECT id, stage_name, match_order FROM tournament_brackets WHERE tournament_id = :tid ORDER BY id ASC", ['tid' => $tournamentId]);
        $stages = [];
        foreach ($all as $m) {
            $stg = trim($m['stage_name']);
            if (!isset($stages[$stg])) $stages[$stg] = [];
            $stages[$stg][] = $m;
        }

        $priority = [
            'vòng 1/64' => 0,
            'vòng 1/32' => 1,
            'vòng 1/16' => 2,
            'vòng 1/8'  => 3,
            'tứ kết'    => 4,
            'bán kết'   => 5,
            'chung kết' => 6,
            'tranh hạng 3' => 7,
            'tranh hạng ba' => 7
        ];

        $stageNames = array_keys($stages);
        usort($stageNames, function($a, $b) use ($priority, $stages) {
            $lowerA = mb_strtolower(trim($a), 'UTF-8');
            $lowerB = mb_strtolower(trim($b), 'UTF-8');
            $pA = $priority[$lowerA] ?? (100 - count($stages[$a]));
            $pB = $priority[$lowerB] ?? (100 - count($stages[$b]));
            return $pA - $pB;
        });

        return $stageNames;
    }

    public static function updateMatch($tournamentId, $matchId, $data)
    {
        $match = database::ThucThiTraVe("SELECT * FROM tournament_brackets WHERE id = :id AND tournament_id = :tid", [
            'id' => $matchId,
            'tid' => $tournamentId
        ]);
        if (empty($match)) {
            return ['status' => 'error', 'message' => 'Trận đấu không tồn tại'];
        }
        $currentMatch = $match[0];

        $team1Id = array_key_exists('team1_id', $data) ? (!empty($data['team1_id']) ? intval($data['team1_id']) : null) : $currentMatch['team1_id'];
        $team2Id = array_key_exists('team2_id', $data) ? (!empty($data['team2_id']) ? intval($data['team2_id']) : null) : $currentMatch['team2_id'];

        $slot1Label = trim($data['slot_1_label'] ?? $currentMatch['slot_1_label'] ?? '');
        $slot2Label = trim($data['slot_2_label'] ?? $currentMatch['slot_2_label'] ?? '');

        // Resolve players & label for Team 1
        $t1_p1 = $currentMatch['team1_p1_id'];
        $t1_p2 = $currentMatch['team1_p2_id'];
        if ($team1Id) {
            $t1 = database::ThucThiTraVe("SELECT player1_id, player2_id FROM tournament_teams WHERE id = :tid", ['tid' => $team1Id]);
            if (!empty($t1)) {
                $t1_p1 = $t1[0]['player1_id'];
                $t1_p2 = $t1[0]['player2_id'];
                $autoLabel = self::getTeamDisplayName($team1Id);
                if (!empty($autoLabel)) $slot1Label = $autoLabel;
            }
        } else if (array_key_exists('team1_id', $data) && empty($data['team1_id'])) {
            $t1_p1 = null;
            $t1_p2 = null;
        }

        // Resolve players & label for Team 2
        $t2_p1 = $currentMatch['team2_p1_id'];
        $t2_p2 = $currentMatch['team2_p2_id'];
        if ($team2Id) {
            $t2 = database::ThucThiTraVe("SELECT player1_id, player2_id FROM tournament_teams WHERE id = :tid", ['tid' => $team2Id]);
            if (!empty($t2)) {
                $t2_p1 = $t2[0]['player1_id'];
                $t2_p2 = $t2[0]['player2_id'];
                $autoLabel = self::getTeamDisplayName($team2Id);
                if (!empty($autoLabel)) $slot2Label = $autoLabel;
            }
        } else if (array_key_exists('team2_id', $data) && empty($data['team2_id'])) {
            $t2_p1 = null;
            $t2_p2 = null;
        }

        $score1 = isset($data['score_1']) ? intval($data['score_1']) : intval($currentMatch['score_1'] ?? 0);
        $score2 = isset($data['score_2']) ? intval($data['score_2']) : intval($currentMatch['score_2'] ?? 0);
        $scoreDetail = trim($data['score_detail'] ?? $currentMatch['score_detail'] ?? '');
        $status = trim($data['status'] ?? $currentMatch['status'] ?? 'pending');

        $winnerSlot = null;
        if (isset($data['winner_slot']) && ($data['winner_slot'] == 1 || $data['winner_slot'] == 2)) {
            $winnerSlot = intval($data['winner_slot']);
        } else if (isset($data['winner_id']) && ($data['winner_id'] == 1 || $data['winner_id'] == 2)) {
            $winnerSlot = intval($data['winner_id']);
        }

        // Gợi ý đội thắng tự động theo tỉ số nếu kết thúc mà chưa chọn
        if ($status === 'finished' && empty($winnerSlot)) {
            if ($score1 > $score2) $winnerSlot = 1;
            else if ($score2 > $score1) $winnerSlot = 2;
        }

        // Cập nhật trận đấu hiện tại
        database::ThucThi("UPDATE tournament_brackets SET 
            team1_id = :t1_id,
            team1_p1_id = :t1_p1,
            team1_p2_id = :t1_p2,
            slot_1_label = :s1_label,
            team2_id = :t2_id,
            team2_p1_id = :t2_p1,
            team2_p2_id = :t2_p2,
            slot_2_label = :s2_label,
            score_1 = :s1,
            score_2 = :s2,
            score_detail = :s_detail,
            status = :status,
            winner_slot = :w_slot,
            winner_id = :w_id
            WHERE id = :id", [
            't1_id' => $team1Id,
            't1_p1' => $t1_p1,
            't1_p2' => $t1_p2,
            's1_label' => $slot1Label,
            't2_id' => $team2Id,
            't2_p1' => $t2_p1,
            't2_p2' => $t2_p2,
            's2_label' => $slot2Label,
            's1' => $score1,
            's2' => $score2,
            's_detail' => $scoreDetail,
            'status' => $status,
            'w_slot' => $winnerSlot,
            'w_id' => $winnerSlot,
            'id' => $matchId
        ]);

        // Auto Progression lên vòng sau
        self::progressWinner($tournamentId, $currentMatch, $winnerSlot, [
            'team1_id' => $team1Id,
            'team1_p1' => $t1_p1,
            'team1_p2' => $t1_p2,
            'slot_1_label' => $slot1Label,
            'team2_id' => $team2Id,
            'team2_p1' => $t2_p1,
            'team2_p2' => $t2_p2,
            'slot_2_label' => $slot2Label,
            'status' => $status
        ]);

        return ['status' => 'success', 'message' => 'Cập nhật kết quả trận đấu thành công'];
    }

    public static function progressWinner($tournamentId, $currentMatch, $winnerSlot, $updatedData)
    {
        $stageNames = self::getOrderedStages($tournamentId);
        $curStage = trim($currentMatch['stage_name']);
        $curIdx = -1;
        foreach ($stageNames as $idx => $s) {
            if (mb_strtolower(trim($s), 'UTF-8') === mb_strtolower($curStage, 'UTF-8')) {
                $curIdx = $idx;
                break;
            }
        }

        if ($curIdx === -1 || $curIdx >= count($stageNames) - 1) {
            // Đã là vòng chung kết hoặc không tìm thấy vòng kế tiếp
            return;
        }

        // Vòng kế tiếp cho người thắng
        $nextStage = null;
        for ($i = $curIdx + 1; $i < count($stageNames); $i++) {
            $cand = $stageNames[$i];
            $candLower = mb_strtolower(trim($cand), 'UTF-8');
            // Bỏ qua trận Tranh hạng 3 khi tìm nhánh thắng
            if (strpos($candLower, 'hạng 3') === false && strpos($candLower, 'hạng ba') === false) {
                $nextStage = $cand;
                break;
            }
        }

        if (!$nextStage) return;

        $curOrder = intval($currentMatch['match_order'] ?? 1);
        $targetOrder = intval(ceil($curOrder / 2));
        $targetSlot = ($curOrder % 2 !== 0) ? 1 : 2;

        $isFinished = ($updatedData['status'] === 'finished') && ($winnerSlot === 1 || $winnerSlot === 2);

        // Tìm trận đích ở vòng tiếp theo
        $targetMatch = database::ThucThiTraVe("SELECT id FROM tournament_brackets WHERE tournament_id = :tid AND stage_name = :stage AND match_order = :ord", [
            'tid' => $tournamentId,
            'stage' => $nextStage,
            'ord' => $targetOrder
        ]);

        if (!empty($targetMatch)) {
            $targetId = $targetMatch[0]['id'];
            if ($isFinished) {
                $winTeamId = ($winnerSlot === 1) ? $updatedData['team1_id'] : $updatedData['team2_id'];
                $winP1 = ($winnerSlot === 1) ? $updatedData['team1_p1'] : $updatedData['team2_p1'];
                $winP2 = ($winnerSlot === 1) ? $updatedData['team1_p2'] : $updatedData['team2_p2'];
                $winLabel = ($winnerSlot === 1) ? $updatedData['slot_1_label'] : $updatedData['slot_2_label'];

                if ($targetSlot === 1) {
                    database::ThucThi("UPDATE tournament_brackets SET team1_id = :tid, team1_p1_id = :p1, team1_p2_id = :p2, slot_1_label = :lbl WHERE id = :id", [
                        'tid' => $winTeamId,
                        'p1' => $winP1,
                        'p2' => $winP2,
                        'lbl' => $winLabel,
                        'id' => $targetId
                    ]);
                } else {
                    database::ThucThi("UPDATE tournament_brackets SET team2_id = :tid, team2_p1_id = :p1, team2_p2_id = :p2, slot_2_label = :lbl WHERE id = :id", [
                        'tid' => $winTeamId,
                        'p1' => $winP1,
                        'p2' => $winP2,
                        'lbl' => $winLabel,
                        'id' => $targetId
                    ]);
                }
            } else {
                // Nếu hủy trạng thái kết thúc thì xóa slot tương ứng ở vòng kế tiếp
                if ($targetSlot === 1) {
                    database::ThucThi("UPDATE tournament_brackets SET team1_id = NULL, team1_p1_id = NULL, team1_p2_id = NULL WHERE id = :id", ['id' => $targetId]);
                } else {
                    database::ThucThi("UPDATE tournament_brackets SET team2_id = NULL, team2_p1_id = NULL, team2_p2_id = NULL WHERE id = :id", ['id' => $targetId]);
                }
            }
        }

        // Xử lý nhánh Đội thua cho trận Tranh hạng 3 (nếu hiện tại là Bán kết)
        $curLower = mb_strtolower($curStage, 'UTF-8');
        if (strpos($curLower, 'bán kết') !== false || strpos($curLower, 'semi') !== false) {
            $tpMatches = database::ThucThiTraVe("SELECT id FROM tournament_brackets WHERE tournament_id = :tid AND (stage_name LIKE '%hạng 3%' OR stage_name LIKE '%hạng ba%')", [
                'tid' => $tournamentId
            ]);
            if (!empty($tpMatches)) {
                $tpId = $tpMatches[0]['id'];
                if ($isFinished) {
                    $loseTeamId = ($winnerSlot === 1) ? $updatedData['team2_id'] : $updatedData['team1_id'];
                    $loseP1 = ($winnerSlot === 1) ? $updatedData['team2_p1'] : $updatedData['team1_p1'];
                    $loseP2 = ($winnerSlot === 1) ? $updatedData['team2_p2'] : $updatedData['team1_p2'];
                    $loseLabel = ($winnerSlot === 1) ? $updatedData['slot_2_label'] : $updatedData['slot_1_label'];

                    if ($curOrder === 1) {
                        database::ThucThi("UPDATE tournament_brackets SET team1_id = :tid, team1_p1_id = :p1, team1_p2_id = :p2, slot_1_label = :lbl WHERE id = :id", [
                            'tid' => $loseTeamId,
                            'p1' => $loseP1,
                            'p2' => $loseP2,
                            'lbl' => $loseLabel,
                            'id' => $tpId
                        ]);
                    } else {
                        database::ThucThi("UPDATE tournament_brackets SET team2_id = :tid, team2_p1_id = :p1, team2_p2_id = :p2, slot_2_label = :lbl WHERE id = :id", [
                            'tid' => $loseTeamId,
                            'p1' => $loseP1,
                            'p2' => $loseP2,
                            'lbl' => $loseLabel,
                            'id' => $tpId
                        ]);
                    }
                } else {
                    if ($curOrder === 1) {
                        database::ThucThi("UPDATE tournament_brackets SET team1_id = NULL, team1_p1_id = NULL, team1_p2_id = NULL WHERE id = :id", ['id' => $tpId]);
                    } else {
                        database::ThucThi("UPDATE tournament_brackets SET team2_id = NULL, team2_p1_id = NULL, team2_p2_id = NULL WHERE id = :id", ['id' => $tpId]);
                    }
                }
            }
        }
    }
}
