# MARK-II Windows Server Deployment Guide

## Windows Server Deployment
Bu guide, MARK-II projesini Windows Server üzerinde deploy etmek için hazırlanmıştır. Node.js, MySQL ve IIS/Express kullanarak production ortamı kurulumu yapılacaktır.

**Sistem Gereksinimleri:**
- Windows Server 2016/2019/2022 veya Windows 10/11
- Node.js 18+ 
- MySQL 5.7+ veya MariaDB 10.5+
- PM2 (Node.js process manager)
- IIS (opsiyonel - reverse proxy için)

---

## Ön Gereksinimler

### 1. Node.js Kurulumu
1. [nodejs.org](https://nodejs.org/) adresinden **LTS version** indir
2. İndirilen `.msi` dosyasını çalıştır
3. Kurulum tamamlandığında PowerShell'de kontrol et:
```powershell
node -v
npm -v
```

### 2. MySQL Kurulumu
1. [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) indir
2. MySQL Installer ile kur
3. Root şifresini ayarla
4. MySQL Workbench (opsiyonel) kur
5. MySQL servisini başlat:
```powershell
Start-Service MySQL
Get-Service MySQL
```

### 3. PM2 Global Kurulum
```powershell
npm install -g pm2
npm install -g pm2-windows-service
pm2 -v
```

### 4. Git Kurulumu (Opsiyonel)
[Git for Windows](https://git-scm.com/download/win) indir ve kur

---

## 1. Proje Dizini Hazırlama

### 1.1 Proje Klasörü Oluştur
```powershell
# Proje dizini oluştur
New-Item -Path "Z:\inetpub\mark-ii" -ItemType Directory -Force
cd Z:\inetpub\mark-ii
```

### 1.2 MySQL Veritabanı ve Tüm Yapı Kurulumu

**Tek komutla tüm kurulum (Önerilen):**
```powershell
# Root kullanıcı ile setup.sql'i çalıştır (database, user, tablolar, admin)
cd Z:\inetpub\mark-ii
Get-Content sql\setup.sql | mysql -u root -p
# Root şifresi istendiğinde gir
```

Bu komut şunları yapar:
- ✅ `markii_db` veritabanını oluşturur
- ✅ `markii_db` kullanıcısını oluşturur (şifre: 2503)
- ✅ Tüm tabloları oluşturur (users, templates, reports, vb.)
- ✅ İlk admin kullanıcısını ekler (proftvv / admin123)

**Manuel kurulum (alternatif):**

<details>
<summary>MySQL Workbench ile adım adım kurulum</summary>

1. MySQL Workbench'i aç
2. Local instance'a bağlan (root kullanıcı)
3. **File** > **Run SQL Script**
4. `Z:\inetpub\mark-ii\sql\setup.sql` dosyasını seç
5. **Run** ile çalıştır

</details>

### 1.3 Windows Firewall Ayarları
```powProje Dosyalarını Yükleme

### 2.1 Dosya Yükleme

**Yöntem A: Git ile (Önerilen)**
```powershell
cd Z:\inetpub\mark-ii
git clone https://github.com/proftvv/PDev-Report-Mark-II .
# Veya mevcut repoyu güncelle
git pull origin main
```

**Yöntem B: Manuel Dosya Kopyalama**
1. Yerel bilgisayardan `Z:\MARK-II\` klasörünü kopyala
2. `Z:\inetpub\mark-ii\` dizinine yapıştır
3. Veya WinSCP/FTP ile sunucuya yükle

### 2.2 Environment Variables (.env) Oluşturma
```powinetpub\mark-ii
notepad .env
```

**.env içeriği:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=markii_db
DB_PASSWORD=2503
DB_NAME=markii_db

# Server Configuration
PORT=3000
NODE_ENV=production

# Session Secret
SESSION_SECRET=Proftvv25*3.

# File Upload Paths (Windows paths)
STORAGE_ROOT=Z:\inetpub\mark-ii\raporlar
UPLOAD_DIR=Z:\inetpub\mark-ii\temp_uploads
REPORTS_DIR=Z:\inetpub\mark-ii\raporlar
TEMPLATES_DIR=Z:\inetpub\mark-iiaporlar
TEMPLATES_DIR=Z:\MARK-II\raporlar\templates
```

**Dosyayı kaydet:** `Ctrl+S`, notepad'i kapat

### 2.3 Gerekli Klasörleri Oluştur
```powershell
New-Item -Path "Z:\inetpub\mark-ii\temp_uploads" -ItemType Directory -Force
New-Item -Path "Z:\inetpub\mark-ii\raporlar" -ItemType Directory -Force
New-Item -Path "Z:\inetpub\mark-ii\raporlar\templates" -ItemType Directory -Force
New-Item -Path "Z:\inetpub\mark-ii\raporlar\generated" -ItemType Directory -Force
New-Item -Path "Z:\inetpub\mark-ii\logs" -ItemType Directory -Force
```

### 2.4 Dependencies Kurulumu
```powershell
# Backend dependencies
cd Z:\inetpub\mark-ii
npm install

# Frontend dependencies
cd frontend
npm install
cd ..
```

---

## 3. Veritabanı Kontrolü ve Test

### 3.1 Kurulum Kontrolü
```powershell
# Veritabanı ve tabloların oluştuğunu kontrol et
mysql -u markii_db -p2503 -e "USE markii_db; SHOW TABLES;"
```

**Beklenen çıktı:**
```
+---------------------+
| Tables_in_markii_db |
+---------------------+
| customers           |
| doc_counters        |
| memory_bank         |
| report_history      |
| reports             |
| templates           |
| users               |
+---------------------+
```

### 3.2 Admin Kullanıcı Kontrolü
```powershell
# Admin kullanıcının oluştuğunu kontrol et
mysql -u markii_db -p2503 -e "USE markii_db; SELECT id, username, created_at FROM users;"
```

**Beklenen çıktı:**
```
+----+----------+---------------------+
| id | username | created_at          |
+----+----------+---------------------+
|  1 | proftvv  | 2025-12-17 10:30:00 |
+----+----------+---------------------+
```

**🔐 Giriş Bilgileri:**
- Kullanıcı adı: `proftvv`
- Şifre: `admin123`
- ⚠️ **ÖNEMLİ:** Production'a geçmeden önce şifreyi değiştirin!

---

## 4. Frontend Build

### 4.1 Production Build Oluşturma
```powershell
cd Z:\inetpub\mark-ii\frontend
npm run build
```

Bu komut `frontend\dist\` klasörü oluşturur (static HTML/CSS/JS dosyaları).

### 4.2 Build Kontrolü
```powershell
Get-ChildItem .\dist\
# index.html, assets\ klasörü, vite.svg görünmeli
```

---

## 4. Frontend Build

### 4.1 Production Build Oluşturma
```bash
cd /www/wwwroot/mark-ii/frontend
npm run build
```

Bu komut `frontend/dist/` klasörü oluşturur (static HTML/CSS/JS dosyaları).

### 4.2 Build Kontrolü
```basIIS Reverse Proxy Yapılandırması (Opsiyonel)

### 5.1 IIS ve URL Rewrite Kurulumu

**IIS Kurulumu:**
```powershell
# IIS'i kur
Install-WindowsFeature -Name Web-Server -IncludeManagementTools
```

**URL Rewrite ve ARR Kurulumu:**
1. [URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite) indir ve kur
2. [Application Request Routing (ARR)](https://www.iis.net/downloads/microsoft/application-request-routing) indir ve kur

### 5.2 IIS Site Oluşturma

1. **IIS Manager** aç (Start > inetmgr)
2. **Sites** sağ tık > **Add Website**
3. Site ayarları:
   - **Site name:** MARK-II
   - **Physical path:** `Z:\MARK-II\frontend\dist`
   - **Binding:** HTTP, Port 80
   - **Host name:** marks.example.com (opsiyonel)
4. **OK** ile oluştur

### 5.3 Reverse Proxy için web.config

`Z:\MARK-II\frontend\dist\` dizininde `web.config` oluştur:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <!-- API requests proxy to Node.js -->
                <rule name="API Proxy" stopProcessing="true">
                    <match url="^api/(.*)" />
                    <action type="Rewrite" url="http://localhost:3000/api/{R:1}" />
                </rule>
                
                <!-- SPA fallback - all other requests to index.html -->
                <rule name="SPA Fallback" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/index.html" />
                </rule>
            </rules>
        </rewrite>
        
        <!-- MIME types -->
        <staticContent>
            <mimeMap fileExtension=".json" mimeType="application/json" />
        </staticContent>
    </system.webServer>
</configuration>
```

### 5.4 Alternatif: IIS Olmadan (Sadece Node.js)

IIS kullanmak istemiyorsan, Node.js backend'i direkt 80 portunda çalıştır:
Windows Service Kurulumu
```powershell
# PM2 Windows service'ini kur
pm2-service-install

# Servis ayarları:
# - PM2_HOME: C:\ProgramData\pm2\home
# - PM2_SERVICE_SCRIPTS: Z:\MARK-II
# - Service name: PM2
```

### 6.2 PM2 Ecosystem Dosyası Oluştur
```powershell
cd Z:\MARK-II
notepad ecosystem.config.js
```

**ecosystem.config.js içeriği:**
```javascript
module.exports = {
  apps: [{
    name: 'mark-ii-backend',
    script: './src/app.js',
    cwd: 'Z:\\MARK-II',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'Z:\\MARK-II\\logs\\error.log',
    out_file: 'Z:\\MARK-II\\logs\\out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    // Windows'a özel
    windowsHide: true
  }]
};
```

### 6.3 PM2 ile Başlatma
```powershell
# PM2 ile uygulamayı başlat
pm2 start ecosystem.config.js

# Durum kontrolü
pm2 status

# Logları görüntüle
pm2 logs mark-ii-backend

# Yapılandırmayı kaydet (Windows Service için)
pm2 save

# PM2 service'ini başlat
Start-Service PM2
```

### 6.4 PM2 Komutları (Yönetim)
```powershell
# Uygulamayı durdur - Opsiyonel

### 7.1 IIS ile SSL Sertifikası

**Self-Signed Certificate (Test için):**
```powershell
# Self-signed sertifika oluştur
New-SelfSignedCertificate -DnsName "marks.example.com" -CertStoreLocation "cert:\LocalMachine\My"

# IIS Manager'da:
# 1. Site > Bindings > Add
# 2. Type: https, Port: 443
# 3. SSL certificate: Oluşturduğun sertifikayı seç
```

**Let's Encrypt (Production için):**
1. [Win-ACME](https://www.win-acme.com/) indir
2. Kurulum ve sertifika oluşturma:
```powershell
# Win-ACME çalıştır
wacs.exe

# Menüden seçim:
# N: Create new certificate
# 1: Single binding of an IIS site
# MARK-II sitesini seç
```

**IIS_IUSRS kullanıcısına izin ver:**
```powershell
# Proje dizini için read/execute izni
icacls "Z:\MARK-II" /grant "IIS_IUSRS:(OI)(CI)RX" /T

# Upload dizinleri için write izni
icacls "Z:\MARK-II\temp_uploads" /grant "IIS_IUSRS:(OI)(CI)M" /T
icacls "Z:\MARK-II\raporlar" /grant "IIS_IUSRS:(OI)(CI)M" /T
icacls "Z:\MARK-II\logs" /grant "IIS_IUSRS:(OI)(CI)M" /T

# Node.js için NT AUTHORITY\NETWORK SERVICE izni
icacls "Z:\MARK-II" /grant "NT AUTHORITY\NETWORK SERVICE:(OI)(CI)RX" /T
icacls "Z:\MARK-II\temp_uploads" /grant "NT AUTHORITY\NETWORK SERVICE:(OI)(CI)M" /T
icacls "Z:\MARK-II\raporlar" /grant "NT AUTHORITY\NETWORK SERVICE:(OI)(CI)M" /T
```

### 8.2 .env Dosyasını Gizle
```powershell
# .env dosyasını gizli yap
Set-ItemProperty -Path "Z:\MARK-II\.env" -Name Attributes -Value Hidden

# Sadece administrators için erişilebilir yap
icacls "Z:\MARK-II\.env" /inheritance:r /grant:r "Administrators:(F)" "SYSTEM:(F)"
```

### 8.3 Windows Defender Exceptions (Performans için)
```powershell
# Node.js ve PM2 için exception ekle
Add-MpPreference -ExclusionPath "Z:\MARK-II\node_modules"
Add-MpPreference -ExclusionProcess "node.exe"l
pm2 delete mark-ii-backend

# Logları temizle
pm2 flush
```

---

## 7. SSL Sertifikası (HTTPS)

### 7.1 Let's Encrypt SSL Kurulumu
1. aaPanel > **Website** > `marks.example.com` > **Settings**
2. **SSL** tab'ına git
3. **Let's Encrypt** seç
4. Domain'i doğrula: `marks.example.com` ve `www.marks.example.com`
5. powershell
# Backend'in çalıştığını kontrol et
Invoke-WebRequest -Uri "http://localhost:3000/api/auth/me" -Method GET
# Beklenen: {"error": "No session"} veya authentication hatası

# Veya tarayıcıda direkt aç:
start http://localhost:3000/api/auth/me
```

### 9.2 Frontend Test
Tarayıcıda aç: `http://localhost` (veya `https://marks.example.com`)
- ✅ Login sayfası görünmeli
- ✅ CSS ve JavaScript yüklenmeli
- ✅ Console'da hata olmamalı

### 9.3 API Test
```powershell
# PowerShell ile login test
$body = @{
    identifier = "proftvv"
    password = "yourpassword"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```Windows Task Manager ve Performance Monitor
```powershell
# Task Manager'da node.exe işlemini izle
tasklist /FI "IMAGENAME eq node.exe"

# Performance Monitor
perfmon
```

### 10.2 PM2 Monitoring
```powershell
# PM2 dashboard
pm2 monit

# Memory kullanımı
pm2 describe mark-ii-backend

# Detaylı bilgi
pm2 show mark-ii-backend
```

### 10.3 Log Yönetimi
```powershell
# Application logs
Get-Content Z:\MARK-II\logs\out.log -Tail 50 -Wait

# Error logs
Get-Content Z:\MARK-II\logs\error.log -Tail 50 -Wait

# PM2 logs
pm2 logs mark-ii-backend --lines 100

# IIS logs (varsa)
Get-Content C:\inetpub\logs\LogFiles\W3SVC1\*.log -Tail 50
```

### 10.4 Otomatik Backup (Windows Task Scheduler)

**Backup Script Oluştur** (`Z:\MARK-II\backup.ps1`):
```powershell
# Backup script
$BackupPath = "C:\Backups\mark-ii"
$Date = Get-Date -Format "yyyy-MM-dd_HHmmss"

# Klasör oluştur
New-Item -Path "$BackupPath\$Date" -ItemType Directory -Force

# Database backup
mysqldump -u markii_db -p2503 markii_db > "$BackupPath\$Date\database.sql"

# Files backup
Copy-Item -Path "Z:\MARK-II\raporlar" -Destination "$BackupPath\$Date\raporlar" -Recurse

Write-Host "Backup completed: $BackupPath\$Date"
```

**Task Scheduler ile Günlük Backup:**
```powershell
# Scheduled task oluştur (Her gün saat 02:00)
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File Z:\MARK-II\backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName "MARK-II Database Backup" -Action $action -Trigger $trigger -Principal $principal
```

---

## 11. Güncelleme ve Deployment

### 11.1 Git ile Güncelleme
```powershell
cd Z:\MARK-II

# PM2'yi durdur
pm2 stop mark-ii-backend

# Değişiklikleri çek
git pull origin main

# Backend dependencies güncelle
npm install

# Frontend build yenile
cd frontend
npm install
npm run build
cd ..

# PM2 restart
pm2 restart mark-ii-backend

# Durum kontrolü
pm2 status
```

### 11.2 Manuel Güncelleme
```powershell
# 1. Dosyaları kopyala (WinSCP, RDP, vs.)
# 2. Dependencies yükle
cd Z:\MARK-II
npm install
cd frontend
npm run build
cd ..

# 3. PM2 restart
pm2 restart mark-ii-backend
```

### 11.3 Hızlı Restart Script

**restart.ps1 oluştur:**
```powershell
# Quick restart script
cd Z:\MARK-II
# PM2 loglarına bak
pm2 logs mark-ii-backend --lines 100

# Port kontrolü
netstat -ano | findstr :3000

# PM2 service durumu
Get-Service PM2

# Manuel başlatma testi
cd Z:\MARK-II
node src\app.js
```

**Yaygın Hatalar:**
- **Port zaten kullanımda:** `netstat -ano | findstr :3000` ile process ID'yi bul, `taskkill /PID <PID> /F` ile kapat
- **Module not found:** `npm install` eksik
- **.env bulunamadı:** Dosya yolunu kontrol et

### 12.2 Frontend Görünmüyor
```powershell
# Build dosyaları var mı?
Get-ChildItem Z:\MARK-II\frontend\dist\

# Frontend yeniden build
cd Z:\MARK-II\frontend
npm run build

# IIS site durumu
Get-IISSite -Name "MARK-II"

# IIS restart
iisreset
```

### 12.3 Database Bağlantı Hatası
```powershell
# MySQL servisi çalışıyor mu?
Get-Service MySQL

# Servis başlat
Start-Service MySQL

# Database bağlantı testi
mysql -u markii_db -p2503 -e "USE markii_db; SHOW TABLES;"

# MySQL error log
Get-Content "C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err" -Tail 50
```

**Yaygın Hatalar:**
- **Access denied:** Kullanıcı adı/şifre yanlış veya `GRANT PRIVILEGES` eksik
- **Can't connect:** MySQL servisi çalışmıyor veya port 3306 kapalı
- **Database not found:** `CREATE DATABASE markii_db` eksik

### 12.4 File Upload Hatası
```powershell
# İzinleri kontrol et
icacls Z:\MARK-II\temp_uploads
icacls Z:\MARK-II\raporlar

# Klasörleri yeniden oluştur
New-Item -Path "Z:\MARK-II\temp_uploads" -ItemType Directory -Force
New-Item -Path "Z:\MARK-II\raporlar\templates" -ItemType Directory -Force

# Write izni ver
icacls "Z:\MARK-II\temp_uploads" /grant "IIS_IUSRS:(OI)(CI)M" /T
icacls "Z:\MARK-II\raporlar" /grant "IIS_IUSRS:(OI)(CI)M" /T
```

### 12.5 PM2 Windows Service Sorunları
```powershell
# PM2 service'i sil ve yeniden kur
pm2-service-uninstall
pm2-service-install

# PM2 hOtomatik Deployment Scriptleri

### 14.1 Tam Kurulum Scripti

**deploy.ps1 oluştur:**
```powershell
# MARK-II Windows Auto Deploy Script
param(
    [string]$ProjectPath = "Z:\MARK-II"
)

Write-Host "=== MARK-II Deployment Script ===" -ForegroundColor Cyan

# 1. Dependencies
Write-Host "`n1. Installing dependencies..." -ForegroundColor Yellow
cd $ProjectPath
npm install
cd frontend
npm install
npm run build
cd ..

# 2. Database setup
Write-Host "`n2. Setting up database..." -ForegroundColor Yellow
Get-Content sql\setup.sql | mysql -u root -p

# 3. Create directories
Write-Host "`n3. Creating directories..." -ForegroundColor Yellow
New-Item -Path "$ProjectPath\temp_uploads" -ItemType Directory -Force
New-Item -Path "$ProjectPath\raporlar\templates" -ItemType Directory -Force
New-Item -Path "$ProjectPath\logs" -ItemType Directory -Force

# 4. Set permissions
Write-Host "`n4. Setting permissions..." -ForegroundColor Yellow
icacls "$ProjectPath\temp_uploads" /grant "IIS_IUSRS:(OI)(CI)M" /T
icacls "$ProjectPath\raporlar" /grant "IIS_IUSRS:(OI)(CI)M" /T
icacls "$ProjectPath\logs" /grant "IIS_IUSRS:(OI)(CI)M" /T

# 5. Start PM2
Write-Host "`n5. Starting PM2..." -ForegroundColor Yellow
pm2 start ecosystem.config.js
pm2 save

# 6. Verify ve Kaynaklar

Bu guide'ı takip ederek MARK-II projesini Windows Server üzerinde başarıyla deploy edebilirsiniz.

### Önemli Notlar
- ✅ Production'da mutlaka güçlü şifreler kullanın (.env dosyası)
- ✅ Firewall kurallarını doğru yapılandırın
- ✅ Düzenli backup alın (Task Scheduler ile otomatik)
- ✅ PM2 Windows Service'i aktif tutun
- ✅ Logları düzenli kontrol edin
- ✅ Windows Update'leri düzenli yapın
- ✅ SSL sertifikası kullanın (Let's Encrypt veya commercial)

### Performans İyileştirmeleri
```powershell
# Node.js process priority yükselt
pm2 start ecosystem.config.js --node-args="--max-old-space-size=1024"

# Windows Server için TCP optimization
netsh int tcp set global autotuninglevel=normal

# IIS compression aktif
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpCompressionStatic
Enable-WindowsOptionalFeature -Online -FeatureName IIS-HttpCompressionDynamic
```

### Kaynaklar ve Destek
- **Node.js Docs:** https://nodejs.org/docs/
- **PM2 Windows Service:** https://www.npmjs.com/package/pm2-windows-service
- **IIS URL Rewrite:** https://www.iis.net/downloads/microsoft/url-rewrite
- **Win-ACME (SSL):** https://www.win-acme.com/
- **MySQL Windows:** https://dev.mysql.com/doc/mysql-windows-excerpt/
- **MARK-II GitHub:** https://github.com/proftvv/PDev-Report-Mark-II

### Hızlı Komutlar Özeti
```powershell
# Servis durumları
Get-Service PM2, MySQL, W3SVC

# PM2 yönetimi
pm2 status
pm2 restart mark-ii-backend
pm2 logs mark-ii-backend

# Deployment
.\deploy.ps1
.\update.ps1
.\backup.ps1

# Port kontrolü
netstat -ano | findstr :3000

# Test
Invoke-WebRequest http://localhost:3000/api/auth/me
```

---

**Son Güncelleme:** 2025-12-17  
**Proje Versiyonu:** v2.0.0 - Mars  
**Platform:** Windows Server 2016/2019/2022, Windows 10/11." -ForegroundColor Yellow
pm2 stop mark-ii-backend

Write-Host "Pulling latest changes..." -ForegroundColor Yellow
git pull origin main

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Building frontend..." -ForegroundColor Yellow
cd frontend
npm run build
cd ..

Write-Host "Restarting application..." -ForegroundColor Green
pm2 restart mark-ii-backend

pm2 status
Write-Host "✅ Update complete!" -ForegroundColor Green
```

### 14.3 Backup Script

**backup.ps1 oluştur:**
```powershell
# Backup script
$BackupPath = "C:\Backups\mark-ii"
$Date = Get-Date -Format "yyyy-MM-dd_HHmmss"
$BackupDir = "$BackupPath\$Date"

Write-Host "Creating backup: $BackupDir" -ForegroundColor Yellow
New-Item -Path $BackupDir -ItemType Directory -Force

# Database backup
Write-Host "Backing up database..." -ForegroundColor Yellow
mysqldump -u markii_db -p2503 markii_db > "$BackupDir\database.sql"

# Files backup
Write-Host "Backing up files..." -ForegroundColor Yellow
Copy-Item -Path "Z:\MARK-II\raporlar" -Destination "$BackupDir\raporlar" -Recurse
Copy-Item -Path "Z:\MARK-II\.env" -Destination "$BackupDir\.env"

# Compress
Write-Host "Compressing..." -ForegroundColor Yellow
Compress-Archive -Path $BackupDir -DestinationPath "$BackupPath\mark-ii_$Date.zip"
Remove-Item -Path $BackupDir -Recurse -Force

Write-Host "✅ Backup completed: mark-ii_$Date.zip" -ForegroundColor Greenst
curl -X POST https://marks.example.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"proftvv","password":"yourpassword"}'
```

---

## 10. Monitoring ve Bakım

### 10.1 aaPanel Monitor
1. aaPanel > **Monitor** > Resource monitoring açık olmalı
2. **System Status** > CPU, RAM, Disk kullanımını izle

### 10.2 PM2 Monitoring
```bash
# PM2 dashboard
pm2 monit

# Memory kullanımı
pm2 describe mark-ii-backend
```

### 10.3 Log Yönetimi
```bash
# Application logs
tail -f /www/wwwlogs/mark-ii-out.log
tail -f /www/wwwlogs/mark-ii-error.log

# Nginx logs
tail -f /www/wwwlogs/mark-ii-access.log
tail -f /www/wwwlogs/mark-ii-error.log

# PM2 logs
pm2 logs mark-ii-backend --lines 100
```

### 10.4 Otomatik Backup (aaPanel)
1. aaPanel > **Cron** > **Add Cron**
2. Backup ayarları:
   - **Type:** Backup Database
   - **Database:** `markii_db`
   - **Backup Directory:** `/www/backup/`
   - **Execution Cycle:** Daily 2:00 AM
3. **Add** ile kaydet

---

## 11. Güncelleme ve Deployment

### 11.1 Git ile Güncelleme
```bash
cd /www/wwwroot/mark-ii

# Değişiklikleri çek
git pull origin main

# Backend dependencies güncelle
npm install

# Frontend build yenile
cd frontend
npm install
npm run build
cd ..

# PM2 restart
pm2 restart mark-ii-backend
```

### 11.2 Manuel Güncelleme
1. Yerel bilgisayarda değişiklikleri yap
2. aaPanel File Manager ile dosyaları yükle
3. Backend için PM2 restart yap
4. Frontend için `npm run build` çalıştır

---

## 12. Troubleshooting

### 12.1 Backend Çalışmıyor
```bash
# PM2 loglarına bak
pm2 logs mark-ii-backend

# Port kontrolü
netstat -tuln | grep 3000

# Manuel başlatma testi
node src/app.js
```

### 12.2 Frontend Görünmüyor
```bash
# Nginx config kontrol
nginx -t

# Build dosyaları var mı?
ls -la /www/wwwroot/mark-ii/frontend/dist/

# Frontend yeniden build
cd frontend && npm run build
```

### 12.3 Database Bağlantı Hatası
```bash
# MySQL servisi çalışıyor mu?
systemctl status mysql

# Database var mı?
mysql -u markii_db -p
USE markii_db;
SHOW TABLES;
```

### 12.4 File Upload Hatası
```bash
# İzinleri kontrol et
ls -la temp_uploads/
ls -la raporlar/

# Klasörleri yeniden oluştur
mkdir -p temp_uploads raporlar/templates
chmod 755 temp_uploads raporlar raporlar/templates
chown www:www temp_uploads raporlar raporlar/templates
```

---

## 13. Production Checklist

### Deployment Öncesi
- [ ] `.env` dosyası doğru mu?
- [ ] MySQL database oluşturuldu mu?
- [ ] Schema import edildi mi?
- [ ] Admin kullanıcı oluşturuldu mu?
- [ ] Frontend build başarılı mı?
- [ ] Nginx config doğru mu?
- [ ] SSL sertifikası kurulu mu?

### Deployment Sırasında
- [ ] Dependencies kuruldu mu? (`npm install`)
- [ ] PM2 ile backend başlatıldı mı?
- [ ] PM2 autorestart aktif mi? (`pm2 startup`)
- [ ] Nginx restart yapıldı mı?
- [ ] Loglar kontrol edildi mi?

### Deployment Sonrası
- [ ] Frontend erişilebilir mi? (https://marks.example.com)
- [ ] API çalışıyor mu? (`/api/auth/me`)
- [ ] Login çalışıyor mu?
- [ ] PDF upload çalışıyor mu?
- [ ] Rapor oluşturma çalışıyor mu?
- [ ] Admin paneli erişilebilir mi?
- [ ] Backup ayarları yapıldı mı?

---

## 14. Yedek Komutlar

### Tam Kurulum Scripti
```bash
#!/bin/bash
# MARK-II aaPanel Auto Deploy Script

cd /www/wwwroot/mark-ii

# Install dependencies
npm install
cd frontend && npm install && npm run build && cd ..

# Setup database
mysql -u markii_db -p markii_db < sql/schema.sql

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Nginx reload
nginx -s reload

echo "✅ MARK-II deployment complete!"
echo "🌐 Visit: https://marks.example.com"
```

### Hızlı Restart
```bash
#!/bin/bash
# Quick restart script

cd /www/wwwroot/mark-ii
git pull origin main
npm install
cd frontend && npm run build && cd ..
pm2 restart mark-ii-backend
echo "✅ Restart complete!"
```

---

## 15. Sonuç

Bu guide'ı takip ederek MARK-II projesini aaPanel üzerinde başarıyla deploy edebilirsiniz.

**Önemli Notlar:**
- Production'da mutlaka güçlü şifreler kullanın
- SSL sertifikası zorunlu (HTTPS)
- Düzenli backup alın
- Logları düzenli kontrol edin
- Güvenlik güncellemelerini takip edin

**Destek:**
- aaPanel Dokümantasyon: https://doc.aapanel.com/
- MARK-II GitHub: https://github.com/proftvv/PDev-Report-Mark-II

---

**Son Güncelleme:** 2025-12-17
**Proje Versiyonu:** v2.0.0 - Mars
