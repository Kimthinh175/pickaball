-- Pickaball Production Clean Database Dump
-- Generated: 2026-08-27 17:50:14

SET FOREIGN_KEY_CHECKS=0;

DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admins` (`id`, `username`, `password`) VALUES
('1', 'admin', '$2y$10$fqIf260TTwrKrsEuCVMYCuJz1TP/.5vFFuEVxpu9JdQkIK8z2QHIm');

DROP TABLE IF EXISTS `banners`;
CREATE TABLE `banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) NOT NULL,
  `order_num` int(11) DEFAULT 0,
  `image_position` varchar(50) DEFAULT '50% 50%',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `banners` (`id`, `title`, `image_url`, `order_num`, `image_position`, `is_active`, `created_at`, `updated_at`) VALUES
('1', 'Banner Trang Giải Đấu 1', 'public/banners/1.jpg', '1', '50% 50%', '1', '2026-08-27 22:50:14', '2026-08-27 22:50:14'),
('2', 'Banner Trang Giải Đấu 2', 'public/banners/2.jpg', '2', '50% 50%', '1', '2026-08-27 22:50:14', '2026-08-27 22:50:14'),
('3', 'Banner Trang Giải Đấu 3', 'public/banners/3.jpg', '3', '50% 50%', '1', '2026-08-27 22:50:14', '2026-08-27 22:50:14');

DROP TABLE IF EXISTS `matches`;
CREATE TABLE `matches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tournament_id` int(11) DEFAULT NULL,
  `team1_p1_id` int(11) NOT NULL,
  `team1_p2_id` int(11) NOT NULL,
  `team2_p1_id` int(11) NOT NULL,
  `team2_p2_id` int(11) NOT NULL,
  `winner_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(50) DEFAULT 'Chua chuy?n kho?n',
  `group_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tournament_id` (`tournament_id`),
  KEY `player_1_id` (`team1_p1_id`),
  KEY `player_2_id` (`team2_p1_id`),
  KEY `winner_id` (`winner_id`),
  CONSTRAINT `matches_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `matches_ibfk_2` FOREIGN KEY (`team1_p1_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
  CONSTRAINT `matches_ibfk_3` FOREIGN KEY (`team2_p1_id`) REFERENCES `players` (`id`) ON DELETE CASCADE,
  CONSTRAINT `matches_ibfk_4` FOREIGN KEY (`winner_id`) REFERENCES `players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `players`;
CREATE TABLE `players` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `points` decimal(10,2) DEFAULT 0.00,
  `gender` varchar(10) DEFAULT 'Nam',
  `profile` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tournament_banners`;
CREATE TABLE `tournament_banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `tournament_banners` (`id`, `title`, `image_url`, `created_at`) VALUES
('1', 'Banner Mẫu 1', 'public/banners/1.jpg', '2026-08-27 22:50:14'),
('2', 'Banner Mẫu 2', 'public/banners/2.jpg', '2026-08-27 22:50:14'),
('3', 'Banner Mẫu 3', 'public/banners/3.jpg', '2026-08-27 22:50:14');

DROP TABLE IF EXISTS `tournament_brackets`;
CREATE TABLE `tournament_brackets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tournament_id` int(11) DEFAULT NULL,
  `stage_name` varchar(100) NOT NULL,
  `match_order` int(11) DEFAULT 0,
  `team1_p1_id` int(11) DEFAULT NULL,
  `team1_p2_id` int(11) DEFAULT NULL,
  `team2_p1_id` int(11) DEFAULT NULL,
  `team2_p2_id` int(11) DEFAULT NULL,
  `slot_1_label` varchar(100) DEFAULT NULL,
  `slot_2_label` varchar(100) DEFAULT NULL,
  `winner_id` int(11) DEFAULT NULL,
  `score_1` int(11) DEFAULT 0,
  `score_2` int(11) DEFAULT 0,
  `status` varchar(50) DEFAULT 'pending',
  PRIMARY KEY (`id`),
  KEY `tournament_id` (`tournament_id`),
  KEY `player_1_id` (`team1_p1_id`),
  KEY `player_2_id` (`team2_p1_id`),
  KEY `winner_id` (`winner_id`),
  CONSTRAINT `tournament_brackets_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tournament_brackets_ibfk_2` FOREIGN KEY (`team1_p1_id`) REFERENCES `players` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tournament_brackets_ibfk_3` FOREIGN KEY (`team2_p1_id`) REFERENCES `players` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tournament_brackets_ibfk_4` FOREIGN KEY (`winner_id`) REFERENCES `players` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tournament_group_members`;
CREATE TABLE `tournament_group_members` (
  `group_id` int(11) NOT NULL,
  `player_id` int(11) NOT NULL,
  PRIMARY KEY (`group_id`,`player_id`),
  KEY `player_id` (`player_id`),
  CONSTRAINT `tournament_group_members_ibfk_1` FOREIGN KEY (`group_id`) REFERENCES `tournament_groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tournament_group_members_ibfk_2` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tournament_groups`;
CREATE TABLE `tournament_groups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tournament_id` int(11) DEFAULT NULL,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `tournament_id` (`tournament_id`),
  CONSTRAINT `tournament_groups_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tournament_players`;
CREATE TABLE `tournament_players` (
  `tournament_id` int(11) NOT NULL,
  `player_id` int(11) NOT NULL,
  `placement` varchar(50) DEFAULT NULL,
  `points_awarded` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`tournament_id`,`player_id`),
  KEY `player_id` (`player_id`),
  CONSTRAINT `tournament_players_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `tournaments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tournament_players_ibfk_2` FOREIGN KEY (`player_id`) REFERENCES `players` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tournament_teams`;
CREATE TABLE `tournament_teams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tournament_id` int(11) NOT NULL,
  `player1_id` int(11) NOT NULL,
  `player2_id` int(11) NOT NULL,
  `status` varchar(50) DEFAULT 'Chưa chuyển khoản',
  `group_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_team` (`tournament_id`,`player1_id`,`player2_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `tournaments`;
CREATE TABLE `tournaments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `banner` varchar(255) DEFAULT 'public/banners/1.jpg',
  `rules` text DEFAULT NULL,
  `prizes` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'S?p di?n ra',
  `banner_position` varchar(50) DEFAULT '50% 50%',
  `final_results` longtext DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;
