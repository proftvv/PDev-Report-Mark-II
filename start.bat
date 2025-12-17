@echo off
REM Report Mark II - Unified Startup Script (Windows)
REM Version: 2.0.0-alpha

title Report Mark II - Startup

echo ========================================
echo   Report Mark II - v2.0.0 Mars
echo ========================================
echo.

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js 18+
    pause
    exit /b 1
)

REM Check backend dependencies
if not exist "node_modules\" (
    echo [INFO] Installing backend dependencies...
    call npm install
)

REM Check frontend dependencies
if not exist "frontend\node_modules\" (
    echo [INFO] Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo Starting servers...
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:5173
echo.
echo Press Ctrl+C to stop all servers
echo.

REM Start backend in new window
start "Report Mark II - Backend" cmd /k "node src\app.js"

REM Wait for backend to start
timeout /t 2 /nobreak >nul

REM Start frontend in new window
start "Report Mark II - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo [SUCCESS] Servers started in separate windows
echo.
pause
