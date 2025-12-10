@echo off
REM v0.0.1
setlocal enabledelayedexpansion

REM Proje kok dizini
set ROOT=%~dp0
set MARK_II=%ROOT%Mark-II
set LOG_DIR=%MARK_II%\logs
set LOG_SUBDIR=%LOG_DIR%\log
set ERROR_SUBDIR=%LOG_DIR%\error

REM Log klasorlerini olustur
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "%LOG_SUBDIR%" mkdir "%LOG_SUBDIR%"
if not exist "%ERROR_SUBDIR%" mkdir "%ERROR_SUBDIR%"

REM PowerShell ile tarih/saat al ve log dosya adini olustur
for /f "delims=" %%I in ('powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd_HHmmss'"') do set datetime=%%I
set LOG_FILE=%LOG_SUBDIR%\app_%datetime%.log
set ERROR_LOG=%ERROR_SUBDIR%\errors_%datetime%.log

echo ========================================
echo Report-Mark2 Baslatiliyor...
echo Log Dosyasi: %LOG_FILE%
echo Hata Logu: %ERROR_LOG%
echo ========================================
echo.

REM Mark-II dizinine gec
cd /d %MARK_II%

REM Port kontrolu - 3000 portu kullaniliyorsa uyari ver
powershell -NoProfile -Command "$port = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue; if ($port) { Write-Host 'UYARI: Port 3000 zaten kullaniliyor! Lutfen eski servisi kapatin veya farkli bir port kullanin.' -ForegroundColor Yellow }"

REM PowerShell ile loglama yaparak concurrently'yi calistir
REM Tum ciktiyi hem ekrana hem log dosyasina yazar, hatalari ayri dosyaya yazar
powershell -NoProfile -Command "$ErrorActionPreference='Continue'; $logFile='%LOG_FILE%'; $errorLog='%ERROR_LOG%'; npm run start:all 2>&1 | ForEach-Object { $line = $_.ToString(); Write-Host $line; Add-Content -Path $logFile -Value $line; if ($line -match '(?i)(error|failed|exception|fatal|EADDRINUSE)') { Add-Content -Path $errorLog -Value \"[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $line\" } }"

REM Eger hata olursa
if errorlevel 1 (
    echo.
    echo HATA: Servisler baslatilamadi. Hata logunu kontrol edin: %ERROR_LOG%
    pause
)

REM Git otomatik push (opsiyonel - servis kapaninca devreye girer)
echo.
echo ========================================
echo GitHub'a otomatik yükleme baslatiliyor...
echo ========================================
cd /d %ROOT%
git add -A
git commit -m "Auto-update from run-all.bat - %datetime%"
git push origin main

endlocal

