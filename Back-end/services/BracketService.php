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
}
