#!/usr/bin/env pwsh
# GitHub Auto Push Script
# Kullanım: .\push-to-github.ps1 "commit message"

param(
  [string]$message = "Auto update from Report-Mark2"
)

Write-Host "🚀 Pushing to GitHub..." -ForegroundColor Cyan

# Git staging
git add -A
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Git add failed" -ForegroundColor Red
  exit 1
}

# Commit
git commit -m $message
if ($LASTEXITCODE -ne 0) {
  Write-Host "⚠️  No changes to commit" -ForegroundColor Yellow
  exit 0
}

# Push
git push origin main
if ($LASTEXITCODE -eq 0) {
  Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
} else {
  Write-Host "❌ Push failed" -ForegroundColor Red
  exit 1
}
