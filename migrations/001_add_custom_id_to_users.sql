CREATE DATABASE markii_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'markii_db'@'localhost' IDENTIFIED BY '2503';
GRANT ALL PRIVILEGES ON markii_db.* TO 'markii_db'@'localhost';
FLUSH PRIVILEGES;