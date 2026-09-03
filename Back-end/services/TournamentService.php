<?php
if (!defined('SECURE_API_ACCESS')) {
    http_response_code(403);
    exit();
}

class TournamentService
{
    public static function getAll()
    {
        $sql = "SELECT * FROM tournaments ORDER BY created_at DESC";
        return database::ThucThiTraVe($sql);
    }

    public static function getDetail($id)
    {
        if (empty($id)) return null;

        $sql = "SELECT * FROM tournaments WHERE id = :id";
        $tournament = database::ThucThiTraVe($sql, ['id' => $id]);

        if (count($tournament) == 0) return null;

        // Lấy danh sách người chơi trong giải
        $sqlPlayers = "SELECT p.*, tp.placement, tp.points_awarded FROM players p 
                       JOIN tournament_players tp ON p.id = tp.player_id 
                       WHERE tp.tournament_id = :id";
        $players = database::ThucThiTraVe($sqlPlayers, ['id' => $id]);

        // Lấy danh sách groups và các trận đấu trong group
        $sqlGroups = "SELECT * FROM tournament_groups WHERE tournament_id = :id";
        $groupsData = database::ThucThiTraVe($sqlGroups, ['id' => $id]);
        $groups = [];
        foreach ($groupsData as $g) {
            $sqlMatches = "SELECT m.*, 
                p1a.name as t1_p1_name, p1a.nickname as t1_p1_nickname, p1a.avatar as t1_p1_avatar, p1a.points as t1_p1_points,
                p1b.name as t1_p2_name, p1b.nickname as t1_p2_nickname, p1b.avatar as t1_p2_avatar, p1b.points as t1_p2_points,
                p2a.name as t2_p1_name, p2a.nickname as t2_p1_nickname, p2a.avatar as t2_p1_avatar, p2a.points as t2_p1_points,
                p2b.name as t2_p2_name, p2b.nickname as t2_p2_nickname, p2b.avatar as t2_p2_avatar, p2b.points as t2_p2_points
                FROM matches m
                LEFT JOIN players p1a ON m.team1_p1_id = p1a.id
                LEFT JOIN players p1b ON m.team1_p2_id = p1b.id
                LEFT JOIN players p2a ON m.team2_p1_id = p2a.id
                LEFT JOIN players p2b ON m.team2_p2_id = p2b.id
                WHERE m.group_id = :gid";
            $g['matches'] = database::ThucThiTraVe($sqlMatches, ['gid' => $g['id']]);
            $groups[] = $g;
        }

        // Lấy danh sách tất cả Kèo đấu trong giải
        $sqlMatchups = "SELECT m.*, 
            p1a.name as t1_p1_name, p1a.nickname as t1_p1_nickname, p1a.avatar as t1_p1_avatar, p1a.points as t1_p1_points,
            p1b.name as t1_p2_name, p1b.nickname as t1_p2_nickname, p1b.avatar as t1_p2_avatar, p1b.points as t1_p2_points,
            p2a.name as t2_p1_name, p2a.nickname as t2_p1_nickname, p2a.avatar as t2_p1_avatar, p2a.points as t2_p1_points,
            p2b.name as t2_p2_name, p2b.nickname as t2_p2_nickname, p2b.avatar as t2_p2_avatar, p2b.points as t2_p2_points
            FROM matches m
            LEFT JOIN players p1a ON m.team1_p1_id = p1a.id
            LEFT JOIN players p1b ON m.team1_p2_id = p1b.id
            LEFT JOIN players p2a ON m.team2_p1_id = p2a.id
            LEFT JOIN players p2b ON m.team2_p2_id = p2b.id
            WHERE m.tournament_id = :id
            ORDER BY m.id ASC";
        $matchups = database::ThucThiTraVe($sqlMatchups, ['id' => $id]);

        // Lấy danh sách các Đội từ tournament_teams
        $sqlTeams = "SELECT tt.*, 
            tt.player1_id as p1_id, tt.player2_id as p2_id,
            p1.name as p1_name, p1.nickname as p1_nickname, p1.avatar as p1_avatar, p1.points as p1_points,
            p2.name as p2_name, p2.nickname as p2_nickname, p2.avatar as p2_avatar, p2.points as p2_points,
            tg.name as group_name
            FROM tournament_teams tt
            JOIN players p1 ON tt.player1_id = p1.id
            JOIN players p2 ON tt.player2_id = p2.id
            LEFT JOIN tournament_groups tg ON tt.group_id = tg.id
            WHERE tt.tournament_id = :id
            ORDER BY tt.id ASC";
        $teams = database::ThucThiTraVe($sqlTeams, ['id' => $id]);

        // Nếu bảng tournament_teams chưa có (giải cũ), tự động trích xuất từ matches
        if (empty($teams) && !empty($matchups)) {
            $groupNameMap = [];
            foreach ($groups as $g) {
                $groupNameMap[$g['id']] = $g['name'];
            }
            $teamKeys = [];
            foreach ($matchups as $m) {
                $k1 = $m['team1_p1_id'] . '_' . $m['team1_p2_id'];
                $k2 = $m['team2_p1_id'] . '_' . $m['team2_p2_id'];

                if (!empty($m['team1_p1_id']) && !isset($teamKeys[$k1])) {
                    $teamKeys[$k1] = true;
                    database::ThucThi("INSERT IGNORE INTO tournament_teams (tournament_id, player1_id, player2_id, status, group_id) VALUES (:tid, :p1, :p2, 'Chưa chuyển khoản', :gid)", [
                        'tid' => $id,
                        'p1' => $m['team1_p1_id'],
                        'p2' => $m['team1_p2_id'],
                        'gid' => $m['group_id']
                    ]);
                }
                if (!empty($m['team2_p1_id']) && !isset($teamKeys[$k2])) {
                    $teamKeys[$k2] = true;
                    database::ThucThi("INSERT IGNORE INTO tournament_teams (tournament_id, player1_id, player2_id, status, group_id) VALUES (:tid, :p1, :p2, 'Chưa chuyển khoản', :gid)", [
                        'tid' => $id,
                        'p1' => $m['team2_p1_id'],
                        'p2' => $m['team2_p2_id'],
                        'gid' => $m['group_id']
                    ]);
                }
            }
            $teams = database::ThucThiTraVe($sqlTeams, ['id' => $id]);
        }

        // Map team statuses to matchups and groups
        $teamStatusMap = [];
        foreach ($teams as $tm) {
            $p1 = min(intval($tm['player1_id'] ?? $tm['p1_id']), intval($tm['player2_id'] ?? $tm['p2_id']));
            $p2 = max(intval($tm['player1_id'] ?? $tm['p1_id']), intval($tm['player2_id'] ?? $tm['p2_id']));
            $teamStatusMap[$p1 . '_' . $p2] = $tm['status'] ?? 'Chưa chuyển khoản';
        }

        $groupNameMap = [];
        foreach ($groups as $g) {
            $groupNameMap[$g['id']] = $g['name'];
        }

        foreach ($matchups as &$m) {
            $k1 = min(intval($m['team1_p1_id']), intval($m['team1_p2_id'])) . '_' . max(intval($m['team1_p1_id']), intval($m['team1_p2_id']));
            $k2 = min(intval($m['team2_p1_id']), intval($m['team2_p2_id'])) . '_' . max(intval($m['team2_p1_id']), intval($m['team2_p2_id']));
            $m['t1_status'] = $teamStatusMap[$k1] ?? 'Chưa chuyển khoản';
            $m['t2_status'] = $teamStatusMap[$k2] ?? 'Chưa chuyển khoản';
            $m['group_name'] = !empty($m['group_id']) && isset($groupNameMap[$m['group_id']]) ? $groupNameMap[$m['group_id']] : '';
        }
        unset($m);

        foreach ($groups as &$g) {
            if (!empty($g['matches'])) {
                foreach ($g['matches'] as &$gm) {
                    $k1 = min(intval($gm['team1_p1_id']), intval($gm['team1_p2_id'])) . '_' . max(intval($gm['team1_p1_id']), intval($gm['team1_p2_id']));
                    $k2 = min(intval($gm['team2_p1_id']), intval($gm['team2_p2_id'])) . '_' . max(intval($gm['team2_p1_id']), intval($gm['team2_p2_id']));
                    $gm['t1_status'] = $teamStatusMap[$k1] ?? 'Chưa chuyển khoản';
                    $gm['t2_status'] = $teamStatusMap[$k2] ?? 'Chưa chuyển khoản';
                    $gm['group_name'] = $g['name'] ?? '';
                }
                unset($gm);
            }
        }
        unset($g);

        // Lấy danh sách brackets
        $sqlBrackets = "SELECT b.*, 
            p1a.name as t1_p1_name, p1a.nickname as t1_p1_nickname, p1a.avatar as t1_p1_avatar, p1a.points as t1_p1_points,
            p1b.name as t1_p2_name, p1b.nickname as t1_p2_nickname, p1b.avatar as t1_p2_avatar, p1b.points as t1_p2_points,
            p2a.name as t2_p1_name, p2a.nickname as t2_p1_nickname, p2a.avatar as t2_p1_avatar, p2a.points as t2_p1_points,
            p2b.name as t2_p2_name, p2b.nickname as t2_p2_nickname, p2b.avatar as t2_p2_avatar, p2b.points as t2_p2_points
            FROM tournament_brackets b
            LEFT JOIN players p1a ON b.team1_p1_id = p1a.id
            LEFT JOIN players p1b ON b.team1_p2_id = p1b.id
            LEFT JOIN players p2a ON b.team2_p1_id = p2a.id
            LEFT JOIN players p2b ON b.team2_p2_id = p2b.id
            WHERE b.tournament_id = :id
            ORDER BY b.id ASC";
        $brackets = database::ThucThiTraVe($sqlBrackets, ['id' => $id]);

        // Tự động khởi tạo sơ đồ knockout nếu chưa có
        if (empty($brackets)) {
            if (count($groups) >= 2 || count($matchups) >= 2) {
                database::ThucThi("INSERT INTO tournament_brackets (tournament_id, stage_name, match_order, status) VALUES (:tid, 'Bán kết', 1, 'pending')", ['tid' => $id]);
                database::ThucThi("INSERT INTO tournament_brackets (tournament_id, stage_name, match_order, status) VALUES (:tid, 'Bán kết', 2, 'pending')", ['tid' => $id]);
                database::ThucThi("INSERT INTO tournament_brackets (tournament_id, stage_name, match_order, status) VALUES (:tid, 'Chung kết', 1, 'pending')", ['tid' => $id]);
                $brackets = database::ThucThiTraVe($sqlBrackets, ['id' => $id]);
            }
        }

        return [
            "tournament" => $tournament[0],
            "players" => $players,
            "teams" => $teams,
            "groups" => $groups,
            "brackets" => $brackets,
            "matchups" => $matchups
        ];
    }

    public static function createBasic($data)
    {
        $title = $data['title'] ?? '';
        $description = $data['description'] ?? '';
        $status = 'Sắp diễn ra';
        $banner = $data['banner'] ?? 'public/banners/1.jpg';
        $banner_position = $data['banner_position'] ?? '50% 50%';
        $rules = $data['rules'] ?? '';
        $prizes = is_array($data['prizes'] ?? null) ? json_encode($data['prizes'], JSON_UNESCAPED_UNICODE) : ($data['prizes'] ?? '');
        $start_date = !empty($data['start_date']) ? $data['start_date'] : null;
        $end_date = null;

        $sql = "INSERT INTO tournaments (title, description, status, banner, banner_position, rules, prizes, start_date, end_date) 
                VALUES (:title, :description, :status, :banner, :banner_position, :rules, :prizes, :start_date, :end_date)";
        database::ThucThi($sql, [
            'title' => $title,
            'description' => $description,
            'status' => $status,
            'banner' => $banner,
            'banner_position' => $banner_position,
            'rules' => $rules,
            'prizes' => $prizes,
            'start_date' => $start_date,
            'end_date' => $end_date
        ]);
        return database::lastInsertId();
    }

    public static function updateBasic($id, $data)
    {
        $fields = [];
        $params = ['id' => $id];
        $allowedFields = ['title', 'description', 'banner', 'banner_position', 'rules', 'start_date'];

        foreach ($allowedFields as $f) {
            if (isset($data[$f])) {
                $fields[] = "$f = :$f";
                $params[$f] = $data[$f] !== '' ? $data[$f] : null;
            }
        }

        if (isset($data['prizes'])) {
            $fields[] = "prizes = :prizes";
            $params['prizes'] = is_string($data['prizes']) ? $data['prizes'] : json_encode($data['prizes'], JSON_UNESCAPED_UNICODE);
        }

        if (empty($fields)) return false;

        $sql = "UPDATE tournaments SET " . implode(', ', $fields) . " WHERE id = :id";
        database::ThucThi($sql, $params);
        return true;
    }

    public static function delete($id)
    {
        database::ThucThi("DELETE FROM tournaments WHERE id = :id", ['id' => $id]);
    }

    public static function getBanners()
    {
        $sql = "SELECT * FROM tournament_banners ORDER BY id DESC";
        return database::ThucThiTraVe($sql);
    }

    public static function saveBanner($title, $imageUrl)
    {
        $sql = "INSERT INTO tournament_banners (title, image_url) VALUES (:title, :url)";
        database::ThucThi($sql, ['title' => $title, 'url' => $imageUrl]);
        return database::lastInsertId();
    }
}
