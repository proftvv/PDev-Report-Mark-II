-- ============================================
-- MARK-II Complete Database Setup Script
-- ============================================
-- Bu dosya tüm veritabanı kurulumunu tek seferde yapar:
-- 1. Database ve kullanıcı oluşturma
-- 2. Tablo yapısını oluşturma
-- 3. İlk admin kullanıcısı ekleme
--
-- Kullanım:
-- MySQL Root ile: mysql -u root -p < setup.sql
-- Veya: Get-Content sql\setup.sql | mysql -u root -p
-- ============================================

-- 1. VERİTABANI VE KULLANICI OLUŞTURMA
-- ============================================
CREATE DATABASE IF NOT EXISTS `markii_db` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

-- Kullanıcı oluştur (varsa önce sil)
DROP USER IF EXISTS 'markii_db'@'localhost';
CREATE USER 'markii_db'@'localhost' IDENTIFIED BY '2503';

-- Yetkileri ver
GRANT ALL PRIVILEGES ON markii_db.* TO 'markii_db'@'localhost';
FLUSH PRIVILEGES;

-- Veritabanını seç
USE `markii_db`;

-- 2. TABLO YAPISI
-- ============================================

-- Users tablosu
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Templates tablosu
CREATE TABLE IF NOT EXISTS templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500) NOT NULL,
  field_map_json JSON,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at),
  INDEX idx_created_by (created_by),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Customers tablosu
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(255),
  address TEXT,
  extra_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Document Counters tablosu
CREATE TABLE IF NOT EXISTS doc_counters (
  date_key DATE PRIMARY KEY,
  last_seq INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reports tablosu
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT NOT NULL,
  customer_id INT,
  version INT NOT NULL DEFAULT 1,
  doc_number VARCHAR(64) NOT NULL UNIQUE,
  file_path VARCHAR(500) NOT NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  status ENUM('draft','final') DEFAULT 'final',
  filled_json JSON,
  INDEX idx_template (template_id),
  INDEX idx_customer (customer_id),
  INDEX idx_created_by (created_by),
  INDEX idx_doc_number (doc_number),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE RESTRICT,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report History tablosu
CREATE TABLE IF NOT EXISTS report_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  version INT NOT NULL,
  doc_number VARCHAR(64) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  diff_json JSON,
  updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_report (report_id),
  INDEX idx_updated_at (updated_at),
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Memory Bank tablosu
CREATE TABLE IF NOT EXISTS memory_bank (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  field_key VARCHAR(255),
  field_value TEXT,
  confidence DECIMAL(5,2) DEFAULT 1.00,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer (customer_id),
  INDEX idx_field_key (field_key),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. İLK ADMIN KULLANICISI
-- ============================================
-- Kullanıcı adı: proftvv
-- Şifre: admin123 (değiştirmeyi unutma!)
-- Password hash: bcrypt ile hashlenmiş şifre

INSERT INTO users (id, username, password_hash) VALUES 
(1, 'proftvv', '$2a$10$XqWZN4HqT5YZKvNJJZ9tmuP3zJvH4UEX.3kMH8xpYQJ8vYmLHqK4W');
-- Şifre: admin123 (Production'da mutlaka değiştirin!)

-- 4. BAŞLANGIÇ VERİLERİ (Opsiyonel)
-- ============================================
-- Örnek müşteri (test için)
-- INSERT INTO customers (name, contact, address) VALUES 
-- ('Örnek Firma', 'info@ornek.com', 'İstanbul, Türkiye');

-- ============================================
-- KURULUM TAMAMLANDI
-- ============================================
-- Veritabanı: markii_db
-- Kullanıcı: markii_db
-- Şifre: 2503
-- Admin: proftvv / admin123
-- 
-- Sonraki adım: Node.js uygulamasını başlat
-- cd Z:\inetpub\mark-ii
-- pm2 start ecosystem.config.js
-- ============================================

SELECT 'Database setup completed successfully!' AS Status;
SELECT CONCAT('Database: ', DATABASE()) AS Info;
SELECT COUNT(*) AS 'Total Tables' FROM information_schema.tables WHERE table_schema = 'markii_db';
SELECT username, created_at FROM users WHERE id = 1;
