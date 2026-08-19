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
        }
        return self::$onlyConn;
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
