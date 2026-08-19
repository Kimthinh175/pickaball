<?php
if (!defined('SECURE_API_ACCESS')) {
    http_response_code(403);
    exit();
}

class GroupService
{
    public static function createGroups($tournament_id, $groups, $match_id_map)
    {
        foreach ($groups as $g) {
            $gName = trim($g['name'] ?? '');
            if (empty($gName)) continue;
            $sqlGroup = "INSERT INTO tournament_groups (tournament_id, name) VALUES (:tid, :name)";
            database::ThucThi($sqlGroup, ['tid' => $tournament_id, 'name' => $gName]);
            $groupId = database::lastInsertId();

            // Gán matches vào group
            $selected_match_indices = $g['match_indices'] ?? [];
            foreach ($selected_match_indices as $mIdx) {
                if (isset($match_id_map[$mIdx])) {
                    $mId = $match_id_map[$mIdx];
                    database::ThucThi("UPDATE matches SET group_id = :gid WHERE id = :mid", [
                        'gid' => $groupId,
                        'mid' => $mId
                    ]);
                }
            }
        }
    }

    public static function deleteByTournament($tournament_id)
    {
        database::ThucThi("DELETE FROM tournament_groups WHERE tournament_id = :id", ['id' => $tournament_id]);
    }
}
