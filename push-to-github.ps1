#!/usr/bin/env pwsh
# v0.0.4
# GitHub Auto Push Script
# Kullanım: .\push-to-github.ps1 "commit message"

param(
  [string]$message = "Auto update from Report-Mark2"
)

Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan

# Ana dizine git
Push-Location ..

# Git staging
git add -A
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Git add failed" -ForegroundColor Red
  Pop-Location
  exit 1
}

# Commit
git commit -m $message
if ($LASTEXITCODE -ne 0) {
  Write-Host "⚠️  No changes to commit" -ForegroundColor Yellow
  Pop-Location
  exit 0
}

# Push to main branch
git push origin main
if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ Successfully pushed to GitHub (main branch)!" -ForegroundColor Green
} else {
  Write-Host "❌ Push failed" -ForegroundColor Red
  Pop-Location
  exit 1
}

Pop-Location
