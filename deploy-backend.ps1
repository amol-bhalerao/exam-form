#!/usr/bin/env pwsh
# Backend Deployment Script for Hostinger
# Deploys the built backend to ~/app/ directory on Hostinger

$sshPort = "65002"
$sshUser = "u441114691"
$sshHost = "45.130.228.77"
$remotePath = "/home/u441114691/app"

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Backend Deployment to Hostinger" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Step 1: Verify build exists
$backendPath = "backend"
if (-not (Test-Path $backendPath)) {
  Write-Host "❌ Backend directory not found: $backendPath" -ForegroundColor Red
  exit 1
}

Write-Host "✓ Backend directory found" -ForegroundColor Green
Write-Host "  Source: $backendPath" -ForegroundColor Gray
Write-Host "  Destination: $sshUser@$sshHost`:$remotePath" -ForegroundColor Gray
Write-Host ""

# Step 2: Show what will be uploaded
Write-Host "Uploading:" -ForegroundColor Yellow
Write-Host "  • src/ (source code)" -ForegroundColor Gray
Write-Host "  • package.json (dependencies)" -ForegroundColor Gray
Write-Host "  • .env (if exists)" -ForegroundColor Gray
Write-Host ""

Write-Host "Uploading files..." -ForegroundColor Cyan
Write-Host "(Using SSH key authentication)" -ForegroundColor Yellow
Write-Host ""

# Step 3: Upload using SCP with SSH key
$sshKeyPath = "$env:USERPROFILE\.ssh\hostinger"
& scp -i $sshKeyPath -P $sshPort -r "$backendPath" "$sshUser@$sshHost`:$remotePath/"

if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "✓ Backend files uploaded successfully!" -ForegroundColor Green
  Write-Host ""
  Write-Host "Next steps on Hostinger:" -ForegroundColor Cyan
  Write-Host "  1. SSH into Hostinger: ssh -p 65002 u441114691@45.130.228.77" -ForegroundColor Gray
  Write-Host "  2. Go to app: cd ~/app" -ForegroundColor Gray
  Write-Host "  3. Install deps: npm install --production=false" -ForegroundColor Gray
  Write-Host "  4. Generate Prisma: npx prisma generate" -ForegroundColor Gray
  Write-Host "  5. Restart app: pm2 restart app (if using PM2)" -ForegroundColor Gray
  Write-Host ""
  Write-Host "Or Hostinger may auto-rebuild on push (check deployment settings)" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Then test: https://hsc-exam-form.hisofttechnology.com/api/health" -ForegroundColor Cyan
} else {
  Write-Host ""
  Write-Host "❌ Upload failed with exit code: $LASTEXITCODE" -ForegroundColor Red
  exit 1
}
