-- citgo_AppearanceV2 Database Schema
-- Run this on a fresh server or if tables don't already exist.
-- These are the same tables used by illenium-appearance, so if you're
-- migrating from illenium your data will carry over automatically.

CREATE TABLE IF NOT EXISTS `playerskins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `citizenid` VARCHAR(50) NOT NULL,
  `model` VARCHAR(50) NOT NULL,
  `skin` LONGTEXT NOT NULL,
  `active` TINYINT NOT NULL DEFAULT 1,
  INDEX (`citizenid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `player_outfits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `citizenid` VARCHAR(50) NOT NULL,
  `outfitname` VARCHAR(100) NOT NULL,
  `model` VARCHAR(50) NOT NULL,
  `components` LONGTEXT NOT NULL,
  `props` LONGTEXT NOT NULL,
  INDEX (`citizenid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `player_outfit_codes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `outfitid` INT NOT NULL,
  `code` VARCHAR(50) NOT NULL,
  UNIQUE INDEX (`code`),
  INDEX (`outfitid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `management_outfits` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `job_name` VARCHAR(50) NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'Job',
  `minrank` INT NOT NULL DEFAULT 0,
  `name` VARCHAR(100) NOT NULL,
  `gender` VARCHAR(10) NOT NULL DEFAULT 'Male',
  `model` VARCHAR(50) NOT NULL,
  `components` LONGTEXT NOT NULL,
  `props` LONGTEXT NOT NULL,
  INDEX (`job_name`, `type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
