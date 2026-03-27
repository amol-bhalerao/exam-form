#!/usr/bin/env pwsh
# Frontend Deployment Script for Hostinger
# Run this script to upload the built frontend to Hostinger

$ErrorActionPreference = 'Stop'

$buildPath = "frontend/dist/exam-form/browser"
$sshPort = "65002"
$sshUser = "u441114691"
$sshHost = "45.130.228.77"
$remotePath = "/home/u441114691/public_html"

Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  HSC Exam Frontend Deployment Script" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if build exists
if (-not (Test-Path $buildPath)) {
  Write-Host "❌ Build directory not found: $buildPath" -ForegroundColor Red
  Write-Host "   Run: npm run build:frontend:local" -ForegroundColor Yellow
  exit 1
}

Write-Host "✓ Build directory found" -ForegroundColor Green
Write-Host "  Source: $buildPath" -ForegroundColor Gray
Write-Host "  Destination: $sshUser@$sshHost`:$remotePath" -ForegroundColor Gray
Write-Host ""

# List files
Write-Host "Files to deploy:" -ForegroundColor Yellow
Get-ChildItem -Path $buildPath -Recurse -File | ForEach-Object {
  $relativePath = $_.FullName.Replace($buildPath, "").TrimStart('\/')
  Write-Host "  • $relativePath" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Uploading files..." -ForegroundColor Cyan
Write-Host "(Enter your Hostinger SSH password when prompted)" -ForegroundColor Yellow
Write-Host ""

# Upload using SCP
& scp -P $sshPort -r "$buildPath/*" "$sshUser@$sshHost:$remotePath/"

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "✓ Upload completed successfully!" -ForegroundColor Green
  Write-Host ""
  Write-Host "Next steps:" -ForegroundColor Cyan
  Write-Host "  1. Clear browser cache (Ctrl+Shift+Delete)" -ForegroundColor Gray
  Write-Host "  2. Visit: https://hsc-exam-form.hisofttechnology.com/" -ForegroundColor Gray
  Write-Host "  3. Check browser console (F12) for errors" -ForegroundColor Gray
  Write-Host ""
} else {
  Write-Host ""
  Write-Host "❌ Upload failed with exit code: $LASTEXITCODE" -ForegroundColor Red
  exit 1
}
