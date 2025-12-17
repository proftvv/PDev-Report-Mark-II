#!/usr/bin/env pwsh
# Report Mark II - Unified Startup Script
# Version: 2.0.0-alpha
# Starts both backend and frontend servers

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Report Mark II - v2.0.0 Mars" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js detected: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found! Please install Node.js 18+ first." -ForegroundColor Red
    pause
    exit 1
}

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠ Backend dependencies not found. Installing..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "⚠ Frontend dependencies not found. Installing..." -ForegroundColor Yellow
    Push-Location frontend
    npm install
    Pop-Location
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Cyan
Write-Host "  → Backend:  http://localhost:3000" -ForegroundColor White
Write-Host "  → Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

# Start backend in background
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node src/app.js
}

# Wait a bit for backend to start
Start-Sleep -Seconds 2

# Start frontend in background
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PWD/frontend"
    npm run dev
}

# Monitor jobs
try {
    Write-Host "Servers are running. Logs:" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    
    while ($true) {
        # Get backend output
        $backendOutput = Receive-Job -Job $backendJob 2>&1
        if ($backendOutput) {
            $backendOutput | ForEach-Object {
                Write-Host "[Backend] $_" -ForegroundColor Blue
            }
        }
        
        # Get frontend output
        $frontendOutput = Receive-Job -Job $frontendJob 2>&1
        if ($frontendOutput) {
            $frontendOutput | ForEach-Object {
                Write-Host "[Frontend] $_" -ForegroundColor Magenta
            }
        }
        
        # Check if jobs are still running
        if ($backendJob.State -ne 'Running' -and $frontendJob.State -ne 'Running') {
            Write-Host "All servers stopped." -ForegroundColor Red
            break
        }
        
        Start-Sleep -Milliseconds 500
    }
} finally {
    # Cleanup on exit
    Write-Host ""
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Stop-Job -Job $frontendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -Force -ErrorAction SilentlyContinue
    Remove-Job -Job $frontendJob -Force -ErrorAction SilentlyContinue
    Write-Host "✓ All servers stopped." -ForegroundColor Green
}
