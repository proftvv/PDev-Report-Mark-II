CREATE DATABASE IF NOT EXISTS `Report-Mark2` DEFAULT CHARACTER SET utf8mb4;
USE `Report-Mark2`;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500) NOT NULL,
  field_map_json JSON,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(created_at),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(255),
  address TEXT,
  extra_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doc_counters (
  date_key DATE PRIMARY KEY,
  last_seq INT NOT NULL
);

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
  FOREIGN KEY (template_id) REFERENCES templates(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS report_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  version INT NOT NULL,
  doc_number VARCHAR(64) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  diff_json JSON,
  updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id),
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS memory_bank (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT,
  field_key VARCHAR(255),
  field_value TEXT,
  confidence DECIMAL(5,2) DEFAULT 1.00,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Ornek admin kullanici eklemek icin:
-- INSERT INTO users (username, password_hash) VALUES ('admin', '<bcrypt hash>');

