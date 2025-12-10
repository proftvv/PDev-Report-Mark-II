-- Root kullanici authentication plugin'ini duzeltmek icin
-- HeidiSQL'de root ile baglanip bu komutlari calistirin

-- Root kullanici plugin'ini kontrol et
SELECT user, host, plugin FROM mysql.user WHERE user = 'root' AND host = 'localhost';

-- Root kullanici plugin'ini mysql_native_password olarak ayarla
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('2503');

-- Eger yukaridaki calismazsa, bu alternatifi deneyin:
-- SET PASSWORD FOR 'root'@'localhost' = PASSWORD('2503');

-- Yetkileri aktif et
FLUSH PRIVILEGES;

-- Tekrar kontrol et - plugin 'mysql_native_password' olmali
SELECT user, host, plugin FROM mysql.user WHERE user = 'root' AND host = 'localhost';

