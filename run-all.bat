@echo off
REM Report Mark-II Başlatma Script'i
REM Backend ve Frontend'i concurrent olarak çalıştırır

cd /d %~dp0
npm run start:all

