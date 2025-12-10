-- Yeni uygulama kullanici olusturmak icin
-- HeidiSQL'de root ile baglanip bu komutlari calistirin

-- Yeni kullanici olustur (mysql_native_password ile)
CREATE USER 'appuser'@'localhost' IDENTIFIED BY '2503';
ALTER USER 'appuser'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('2503');

-- Veritabani yetkilerini ver
GRANT ALL PRIVILEGES ON `Report-Mark2`.* TO 'appuser'@'localhost';
FLUSH PRIVILEGES;

-- Kontrol et
SELECT user, host, plugin FROM mysql.user WHERE user = 'appuser';

