<?php
if (!defined('SECURE_API_ACCESS')) {
    http_response_code(403);
    exit();
}

class MatchService
{
    public static function createMatchups($tournament_id, $matchups)
    {
        $match_id_map = [];
        $all_player_ids = [];

        foreach ($matchups as $idx => $m) {
            $t1_p1 = (int)($m['team1_p1_id'] ?? 0);
            $t1_p2 = (int)($m['team1_p2_id'] ?? 0);
            $t2_p1 = (int)($m['team2_p1_id'] ?? 0);
            $t2_p2 = (int)($m['team2_p2_id'] ?? 0);
            
            $t1_p1 = $t1_p1 > 0 ? $t1_p1 : null;
            $t1_p2 = $t1_p2 > 0 ? $t1_p2 : null;
            $t2_p1 = $t2_p1 > 0 ? $t2_p1 : null;
            $t2_p2 = $t2_p2 > 0 ? $t2_p2 : null;
            
            $st = $m['status'] ?? 'Chưa chuyển khoản';
            if ($t1_p1) $all_player_ids[$t1_p1] = true;
            if ($t1_p2) $all_player_ids[$t1_p2] = true;
            if ($t2_p1) $all_player_ids[$t2_p1] = true;
            if ($t2_p2) $all_player_ids[$t2_p2] = true;

            $sqlMatch = "INSERT INTO matches (tournament_id, team1_p1_id, team1_p2_id, team2_p1_id, team2_p2_id, status) 
                         VALUES (:tid, :t1p1, :t1p2, :t2p1, :t2p2, :st)";
            database::ThucThi($sqlMatch, [
                'tid' => $tournament_id,
                't1p1' => $t1_p1,
                't1p2' => $t1_p2,
                't2p1' => $t2_p1,
                't2p2' => $t2_p2,
                'st' => $st
            ]);
            $match_id_map[$idx] = database::lastInsertId();
        }

        // Register players in tournament_players
        foreach (array_keys($all_player_ids) as $pid) {
            database::ThucThi("INSERT IGNORE INTO tournament_players (tournament_id, player_id) VALUES (:tid, :pid)", [
                'tid' => $tournament_id,
                'pid' => $pid
            ]);
        }

        return $match_id_map;
    }

    public static function updateStatus($match_id, $status)
    {
        $sql = "UPDATE matches SET status = :status WHERE id = :id";
        database::ThucThi($sql, [
            'id' => $match_id,
            'status' => $status
        ]);
    }

    public static function deleteByTournament($tournament_id)
    {
        database::ThucThi("DELETE FROM matches WHERE tournament_id = :id", ['id' => $tournament_id]);
    }
}
