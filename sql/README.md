# MARK-II Veritabanı Kurulum Dosyaları

## Dosyalar

### `setup.sql` - Tam Kurulum (Önerilen)
**Tek dosya ile tüm kurulum:**
- Database oluşturma (`markii_db`)
- Kullanıcı oluşturma (`markii_db` / `2503`)
- Tüm tabloları oluşturma
- İlk admin kullanıcısı (`proftvv` / `admin123`)

**Kullanım:**
```powershell
# Windows PowerShell
cd Z:\inetpub\mark-ii
Get-Content sql\setup.sql | mysql -u root -p
```

```bash
# Linux/Mac
mysql -u root -p < sql/setup.sql
```

---

### `schema.sql` - Sadece Tablo Yapısı (Eski)
**Yalnızca tablo oluşturma (database ve user manuel yapılmalı)**

⚠️ **Not:** Artık `setup.sql` kullanmanız önerilir.

---

## Kurulum Sonrası

### 1. Veritabanı Kontrolü
```powershell
mysql -u markii_db -p2503 -e "SHOW DATABASES LIKE 'markii_db';"
mysql -u markii_db -p2503 -e "USE markii_db; SHOW TABLES;"
```

### 2. Admin Kullanıcı Kontrolü
```powershell
mysql -u markii_db -p2503 -e "USE markii_db; SELECT id, username FROM users;"
```

**Beklenen sonuç:**
```
+----+----------+
| id | username |
+----+----------+
|  1 | proftvv  |
+----+----------+
```

### 3. Giriş Bilgileri
- **Database:** `markii_db`
- **DB User:** `markii_db`
- **DB Password:** `2503`
- **Admin Username:** `proftvv`
- **Admin Password:** `admin123`

⚠️ **GÜVENLİK UYARISI:** Production ortamında mutlaka şifreleri değiştirin!

---

## Şifre Değiştirme

### Database Kullanıcı Şifresi
```sql
ALTER USER 'markii_db'@'localhost' IDENTIFIED BY 'yeni_sifre';
FLUSH PRIVILEGES;
```

### Admin Kullanıcı Şifresi
Uygulama içinden login olup profil ayarlarından değiştirebilirsiniz.

Veya bcrypt hash ile manuel:
```sql
-- Yeni şifrenin bcrypt hash'ini oluştur (Node.js ile):
-- const bcrypt = require('bcryptjs');
-- bcrypt.hashSync('yeni_sifre', 10);

UPDATE users 
SET password_hash = '$2a$10$...'  -- bcrypt hash buraya
WHERE username = 'proftvv';
```

---

## Sorun Giderme

### "Access denied for user" hatası
```powershell
# Root kullanıcı ile setup.sql'i çalıştırdığınızdan emin olun
Get-Content sql\setup.sql | mysql -u root -p
```

### "Database already exists" hatası
```sql
-- Eski veritabanını silmek için (DİKKAT: Tüm veri silinir!)
DROP DATABASE IF EXISTS markii_db;
DROP USER IF EXISTS 'markii_db'@'localhost';

-- Sonra setup.sql'i tekrar çalıştır
```

### Tablo eksik hatası
```powershell
# Tüm tabloları kontrol et
mysql -u markii_db -p2503 markii_db -e "SHOW TABLES;"

# 7 tablo görünmeli: customers, doc_counters, memory_bank, report_history, reports, templates, users
```

---

## Yedekleme

### Tam Yedek
```powershell
mysqldump -u markii_db -p2503 markii_db > backup_$(Get-Date -Format 'yyyy-MM-dd').sql
```

### Sadece Yapı (Data olmadan)
```powershell
mysqldump -u markii_db -p2503 --no-data markii_db > schema_backup.sql
```

---

Daha fazla bilgi için: [DEPLOYMENT_AAPANEL.md](../DEPLOYMENT_AAPANEL.md)
