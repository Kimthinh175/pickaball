<?php
if (!defined('SECURE_API_ACCESS')) {
    http_response_code(403);
    exit();
}

class RatingService
{
    public static function finishTournament($id, $final_results_raw, $apply_points = true)
    {
        $final_results = is_string($final_results_raw) ? $final_results_raw : json_encode($final_results_raw, JSON_UNESCAPED_UNICODE);
        $resultsArr = is_string($final_results_raw) ? json_decode($final_results_raw, true) : $final_results_raw;
        if (!is_array($resultsArr)) $resultsArr = [];

        // 1. Update tournament end_date & final results
        $sql = "UPDATE tournaments SET end_date = CURRENT_DATE(), final_results = :results WHERE id = :id";
        database::ThucThi($sql, [
            'id' => $id,
            'results' => $final_results
        ]);

        if ($apply_points) {
            // 2. Revert previous points awarded in this tournament (if any)
            $prevAwards = database::ThucThiTraVe("SELECT player_id, points_awarded FROM tournament_players WHERE tournament_id = :tid AND points_awarded != 0", ['tid' => $id]);
            foreach ($prevAwards as $pa) {
                database::ThucThi("UPDATE players SET points = ROUND(points - :pts, 2) WHERE id = :pid", [
                    'pts' => floatval($pa['points_awarded']),
                    'pid' => $pa['player_id']
                ]);
            }

            // 3. Ensure all players from tournament_teams & matches are in tournament_players
            $teamPlayers = database::ThucThiTraVe("SELECT DISTINCT player1_id as pid FROM tournament_teams WHERE tournament_id = :tid AND player1_id IS NOT NULL
                                                  UNION
                                                  SELECT DISTINCT player2_id as pid FROM tournament_teams WHERE tournament_id = :tid AND player2_id IS NOT NULL
                                                  UNION
                                                  SELECT DISTINCT team1_p1_id as pid FROM matches WHERE tournament_id = :tid AND team1_p1_id IS NOT NULL 
                                                  UNION 
                                                  SELECT DISTINCT team1_p2_id as pid FROM matches WHERE tournament_id = :tid AND team1_p2_id IS NOT NULL
                                                  UNION
                                                  SELECT DISTINCT team2_p1_id as pid FROM matches WHERE tournament_id = :tid AND team2_p1_id IS NOT NULL
                                                  UNION
                                                  SELECT DISTINCT team2_p2_id as pid FROM matches WHERE tournament_id = :tid AND team2_p2_id IS NOT NULL", ['tid' => $id]);
            foreach ($teamPlayers as $tp) {
                if (!empty($tp['pid'])) {
                    database::ThucThi("INSERT IGNORE INTO tournament_players (tournament_id, player_id) VALUES (:tid, :pid)", [
                        'tid' => $id,
                        'pid' => $tp['pid']
                    ]);
                }
            }

            $allTourPlayers = database::ThucThiTraVe("SELECT tp.player_id, p.name FROM tournament_players tp JOIN players p ON tp.player_id = p.id WHERE tp.tournament_id = :tid", ['tid' => $id]);

            // Map player name (normalized lowercase) -> player_id
            $playerNameToId = [];
            foreach ($allTourPlayers as $tp) {
                $playerNameToId[mb_strtolower(trim($tp['name']), 'UTF-8')] = $tp['player_id'];
            }

            $awardedPlayerIds = [];

            // 4. Calculate points for prize winners from final_results
            foreach ($resultsArr as $resItem) {
                $rankStr = mb_strtolower($resItem['rank'] ?? '', 'UTF-8');
                $teamName = trim($resItem['team_name'] ?? '');
                $placementLabel = $resItem['rank'] ?? 'Giải thưởng';

                // Điểm cộng: Lấy trực tiếp từ ô điểm Admin nhập, nếu không có thì lấy mặc định theo từ khóa hạng giải
                $pts = 0.0;
                if (isset($resItem['points']) && is_numeric($resItem['points'])) {
                    $pts = floatval($resItem['points']);
                } else {
                    if (strpos($rankStr, 'nhất') !== false || strpos($rankStr, 'vô địch') !== false) {
                        $pts = 0.15;
                    } else if (strpos($rankStr, 'nhì') !== false || strpos($rankStr, 'á quân') !== false) {
                        $pts = 0.10;
                    } else if (strpos($rankStr, 'ba') !== false || strpos($rankStr, 'đồng hạng ba') !== false) {
                        $pts = 0.05;
                    } else if (strpos($rankStr, 'khuyến khích') !== false) {
                        $pts = 0.05;
                    }
                }

                // Thu thập danh sách Player IDs đoạt giải
                $targetPlayerIds = [];
                if (!empty($resItem['p1_id'])) $targetPlayerIds[] = intval($resItem['p1_id']);
                if (!empty($resItem['p2_id'])) $targetPlayerIds[] = intval($resItem['p2_id']);
                if (!empty($resItem['player_ids']) && is_array($resItem['player_ids'])) {
                    foreach ($resItem['player_ids'] as $pid) {
                        $targetPlayerIds[] = intval($pid);
                    }
                }

                // Nếu không có ID sẵn thì fallback tách theo tên đội
                if (empty($targetPlayerIds) && !empty($teamName)) {
                    $names = preg_split('/\s*(\/|&|\+|,)\s*/', $teamName);
                    foreach ($names as $name) {
                        $cleanName = mb_strtolower(trim($name), 'UTF-8');
                        if (isset($playerNameToId[$cleanName])) {
                            $targetPlayerIds[] = $playerNameToId[$cleanName];
                        }
                    }
                }

                $targetPlayerIds = array_unique($targetPlayerIds);

                foreach ($targetPlayerIds as $pid) {
                    if (!empty($pid)) {
                        $awardedPlayerIds[$pid] = true;

                        // Cập nhật điểm cho từng Player
                        database::ThucThi("UPDATE players SET points = ROUND(points + :pts, 2) WHERE id = :pid", [
                            'pts' => $pts,
                            'pid' => $pid
                        ]);
                        database::ThucThi("UPDATE tournament_players SET placement = :placement, points_awarded = :pts WHERE tournament_id = :tid AND player_id = :pid", [
                            'placement' => $placementLabel,
                            'pts' => $pts,
                            'tid' => $id,
                            'pid' => $pid
                        ]);
                    }
                }
            }

            // 5. Cập nhật thành tích "Tham gia" cho các VĐV còn lại (không trừ điểm bừa bãi)
            foreach ($allTourPlayers as $tp) {
                $pid = $tp['player_id'];
                if (!isset($awardedPlayerIds[$pid])) {
                    database::ThucThi("UPDATE tournament_players SET placement = 'Tham gia', points_awarded = 0 WHERE tournament_id = :tid AND player_id = :pid", [
                        'tid' => $id,
                        'pid' => $pid
                    ]);
                }
            }
        }
    }

    public static function addPlayer($tournament_id, $player_id)
    {
        $sql = "INSERT INTO tournament_players (tournament_id, player_id) VALUES (:tournament_id, :player_id)";
        database::ThucThi($sql, [
            'tournament_id' => $tournament_id,
            'player_id' => $player_id
        ]);
    }

    public static function removePlayer($tournament_id, $player_id)
    {
        $sql = "DELETE FROM tournament_players WHERE tournament_id = :tournament_id AND player_id = :player_id";
        database::ThucThi($sql, [
            'tournament_id' => $tournament_id,
            'player_id' => $player_id
        ]);
    }

    public static function updatePlacement($tournament_id, $player_id, $placement)
    {
        $points_to_add = 0;
        switch($placement) {
            case 'vodich': $points_to_add = 0.15; break;
            case 'hangnhi': $points_to_add = 0.10; break;
            case 'hangba': $points_to_add = 0.05; break;
            case 'vongbang': $points_to_add = -0.05; break;
            case 'khac': $points_to_add = 0; break;
            default: $points_to_add = 0; break;
        }

        $sqlCheck = "SELECT points_awarded FROM tournament_players WHERE tournament_id = :t_id AND player_id = :p_id";
        $current_record = database::ThucThiTraVe($sqlCheck, ['t_id' => $tournament_id, 'p_id' => $player_id]);
        $old_points_awarded = 0;
        if (count($current_record) > 0) {
            $old_points_awarded = $current_record[0]['points_awarded'];
        }

        if ($old_points_awarded != 0) {
            $sqlRevert = "UPDATE players SET points = points - :old_points WHERE id = :p_id";
            database::ThucThi($sqlRevert, ['old_points' => $old_points_awarded, 'p_id' => $player_id]);
        }

        if ($points_to_add != 0) {
            $sqlAdd = "UPDATE players SET points = points + :new_points WHERE id = :p_id";
            database::ThucThi($sqlAdd, ['new_points' => $points_to_add, 'p_id' => $player_id]);
        }

        $sqlUpdate = "UPDATE tournament_players SET placement = :placement, points_awarded = :points_awarded WHERE tournament_id = :t_id AND player_id = :p_id";
        database::ThucThi($sqlUpdate, [
            'placement' => $placement,
            'points_awarded' => $points_to_add,
            't_id' => $tournament_id,
            'p_id' => $player_id
        ]);
    }

    public static function deleteByTournament($tournament_id)
    {
        database::ThucThi("DELETE FROM tournament_players WHERE tournament_id = :id", ['id' => $tournament_id]);
    }
}
