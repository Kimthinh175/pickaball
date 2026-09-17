<?php
if (!defined('SECURE_API_ACCESS')) {
    http_response_code(403);
    header("Location: /");
    exit();
}

class database
{
    private static $onlyConn;
    private $conn;
    private $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
    ];

    private function __construct()
    {
        try {
            $dsn = "mysql:host="
                . $_ENV['DB_HOST']
                . ";port="
                . $_ENV['DB_PORT']
                . ";dbname="
                . $_ENV['DB_NAME']
                . ";charset=utf8mb4";

            $this->conn = new PDO(
                $dsn,
                $_ENV['DB_USER'],
                $_ENV['DB_PASS'],
                $this->options
            );

        } catch (PDOException $e) {
            die(json_encode([
                "status" => "error",
                "message" => "Database connection failed! Chi tiết: " . $e->getMessage()
            ]));
        }
    }
    
    private static function getInstance()
    {
        if (!self::$onlyConn) {
            self::$onlyConn = new database();
            self::ensureSchema();
        }
        return self::$onlyConn;
    }

    public static function ensureSchema()
    {
        static $checked = false;
        if ($checked) return;
        $checked = true;

        try {
            $cols = self::ThucThiTraVe("SHOW COLUMNS FROM tournament_brackets LIKE 'winner_slot'");
            if (empty($cols)) {
                @self::ThucThi("ALTER TABLE tournament_brackets ADD COLUMN team1_id INT NULL AFTER match_order");
                @self::ThucThi("ALTER TABLE tournament_brackets ADD COLUMN team2_id INT NULL AFTER team1_p2_id");
                @self::ThucThi("ALTER TABLE tournament_brackets ADD COLUMN winner_slot TINYINT NULL AFTER winner_id");
                @self::ThucThi("ALTER TABLE tournament_brackets ADD COLUMN score_detail VARCHAR(100) NULL AFTER score_2");
            }
        } catch (Exception $e) {}

        try {
            @self::ThucThi("ALTER TABLE tournament_brackets DROP FOREIGN KEY tournament_brackets_ibfk_6");
        } catch (Exception $e) {}

        try {
            $pCols = self::ThucThiTraVe("SHOW COLUMNS FROM players LIKE 'points_diff'");
            if (empty($pCols)) {
                @self::ThucThi("ALTER TABLE players ADD COLUMN points_diff DECIMAL(5,2) DEFAULT 0.00 AFTER points");
            }
        } catch (Exception $e) {}

        try {
            @self::ThucThi("CREATE TABLE IF NOT EXISTS player_rating_logs (
                id int(11) NOT NULL AUTO_INCREMENT,
                player_id int(11) NOT NULL,
                tournament_id int(11) DEFAULT NULL,
                match_id int(11) DEFAULT NULL,
                bracket_id int(11) DEFAULT NULL,
                old_points decimal(5,2) NOT NULL DEFAULT 0.00,
                new_points decimal(5,2) NOT NULL DEFAULT 0.00,
                points_diff decimal(5,2) NOT NULL DEFAULT 0.00,
                reason varchar(255) DEFAULT '',
                created_at timestamp NOT NULL DEFAULT current_timestamp(),
                PRIMARY KEY (id),
                KEY player_id (player_id),
                KEY tournament_id (tournament_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        } catch (Exception $e) {}
    }

    public static function ThucThiTraVe($sql, $params = [])
    {
        $db = self::getInstance();
        $stmt = $db->conn->prepare($sql);
        if (count($params) > 0) {
            foreach ($params as $key => $value) {
                $stmt->bindValue(':' . $key, $value);
            }
        }
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public static function ThucThi($sql, $params = [])
    {
        $db = self::getInstance();
        $stmt = $db->conn->prepare($sql);
        if (count($params) > 0) {
            foreach ($params as $key => $value) {
                $stmt->bindValue(':' . $key, $value);
            }
        }
        return $stmt->execute();
    }
    
    public static function lastInsertId()
    {
        return self::getInstance()->conn->lastInsertId();
    }

    public static function beginTransaction()
    {
        self::getInstance()->conn->beginTransaction();
    }

    public static function commit()
    {
        self::getInstance()->conn->commit();
    }

    public static function rollBack()
    {
        self::getInstance()->conn->rollBack();
    }
}
?>
