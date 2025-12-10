-- ============================================
-- MariaDB kullanici authentication sorununu cozmek icin
-- ============================================
-- ONEMLI: HeidiSQL'de ROOT kullanici ile baglanin!
-- Report-Mark2 veritabani secili olabilir ama komutlar mysql.user tablosuna erisim gerektirir

-- 1. ONCE MEVCUT KULLANICIYI KONTROL ET
SELECT user, host, plugin FROM mysql.user WHERE user = 'proftvv';

-- 2. MEVCUT KULLANICIYI SIL
DROP USER IF EXISTS 'proftvv'@'localhost';

-- 3. YENI KULLANICI OLUSTUR (mysql_native_password ile)
-- MariaDB 10.4+ icin:
CREATE USER 'proftvv'@'localhost' IDENTIFIED BY '2503';
ALTER USER 'proftvv'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('2503');

-- Eger yukaridaki ALTER USER calismazsa, bu alternatifi deneyin:
-- ALTER USER 'proftvv'@'localhost' IDENTIFIED WITH mysql_native_password BY '2503';

-- 4. VERITABANI YETKILERINI VER
GRANT ALL PRIVILEGES ON `Report-Mark2`.* TO 'proftvv'@'localhost';

-- 5. YETKILERI AKTIF ET
FLUSH PRIVILEGES;

-- 6. KONTROL ET - plugin kolonunda 'mysql_native_password' gorunmeli
SELECT user, host, plugin FROM mysql.user WHERE user = 'proftvv';

-- Eger hala 'auth_gssapi_client' veya NULL gorunuyorsa:
-- MariaDB'yi yeniden baslatin veya su komutu tekrar calistirin:
-- ALTER USER 'proftvv'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('2503');

