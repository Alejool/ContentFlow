-- Script para completar la estructura de base de datos
-- Este script crea las tablas faltantes y asegura que todo esté correcto

-- Verificar y crear tabla campaigns (nueva, para agrupar publicaciones)
CREATE TABLE IF NOT EXISTS `campaigns` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `status` ENUM('active', 'paused', 'completed', 'draft') DEFAULT 'draft',
  `start_date` DATE,
  `end_date` DATE,
  `goal` VARCHAR(255),
  `budget` DECIMAL(10, 2),
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  `deleted_at` TIMESTAMP NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_status` (`user_id`, `status`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla pivot campaign_publication
CREATE TABLE IF NOT EXISTS `campaign_publication` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `campaign_id` BIGINT UNSIGNED NOT NULL,
  `publication_id` BIGINT UNSIGNED NOT NULL,
  `order` INT DEFAULT 0 COMMENT 'Order of publication within campaign',
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  UNIQUE KEY `unique_campaign_publication` (`campaign_id`, `publication_id`),
  INDEX `idx_campaign` (`campaign_id`),
  INDEX `idx_publication` (`publication_id`),
  INDEX `idx_campaign_order` (`campaign_id`, `order`),
  FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`publication_id`) REFERENCES `publications`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar que media_derivatives existe
CREATE TABLE IF NOT EXISTS `media_derivatives` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `media_file_id` BIGINT UNSIGNED NOT NULL,
  `derivative_type` ENUM('thumbnail', 'platform_variant', 'watermarked', 'compressed', 'preview') NOT NULL COMMENT 'Type of derivative file',
  `file_path` VARCHAR(255) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `mime_type` VARCHAR(255),
  `size` INT NOT NULL COMMENT 'File size in bytes',
  `width` INT COMMENT 'Image/video width in pixels',
  `height` INT COMMENT 'Image/video height in pixels',
  `platform` VARCHAR(255) COMMENT 'Platform-specific variant (youtube, instagram, etc.)',
  `metadata` JSON COMMENT 'Additional derivative-specific data',
  `created_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP NULL,
  FOREIGN KEY (`media_file_id`) REFERENCES `media_files`(`id`) ON DELETE CASCADE,
  INDEX `idx_media_derivative` (`media_file_id`, `derivative_type`),
  INDEX `idx_derivative_platform` (`derivative_type`, `platform`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
