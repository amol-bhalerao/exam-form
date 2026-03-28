#!/usr/bin/env pwsh
<#
.SYNOPSIS
Backend Startup Diagnostics
.DESCRIPTION
Check what's causing the 503 error on backend
#>

Write-Host "🔍 BACKEND 503 DIAGNOSTIC CHECKER" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check .env file exists
Write-Host "1️⃣  Check .env File Exists" -ForegroundColor Yellow
Write-Host "   Path: /home/u441114691/nodejs/.env" -ForegroundColor Gray
Write-Host "   Action: In Hostinger File Manager → Check if .env exists" -ForegroundColor Cyan
Write-Host ""

# Test 2: Verify key environment variables
Write-Host "2️⃣  Verify .env Has Required Variables" -ForegroundColor Yellow
Write-Host "   Required in .env:" -ForegroundColor Gray
$required = @(
    "NODE_ENV=production",
    "DATABASE_URL=mysql://...",
    "CORS_ORIGIN=https://hsc-exam-form.hisofttechnology.com",
    "JWT_ACCESS_SECRET=...",
    "JWT_REFRESH_SECRET=...",
    "GOOGLE_CLIENT_ID=260515642590-..."
)
$required | ForEach-Object { Write-Host "     ✓ $_" -ForegroundColor Gray }
Write-Host ""

# Test 3: Check if MySQL is accessible
Write-Host "3️⃣  Test MySQL Connection" -ForegroundColor Yellow
Write-Host "   Database: u441114691_exam" -ForegroundColor Gray
Write-Host "   User: u441114691_exam" -ForegroundColor Gray
Write-Host "   Host: 127.0.0.1" -ForegroundColor Gray
Write-Host "   Action: Contact Hostinger support if database blocked" -ForegroundColor Cyan
Write-Host ""

# Test 4: Check Hostinger logs
Write-Host "4️⃣  CHECK HOSTINGER APP LOGS (MOST IMPORTANT)" -ForegroundColor Red
Write-Host "   Steps:" -ForegroundColor Yellow
Write-Host "     1. Go to Hostinger cPanel" -ForegroundColor Gray
Write-Host "     2. Go to Node.js section" -ForegroundColor Gray
Write-Host "     3. Click on your hsc-exam-api app" -ForegroundColor Gray
Write-Host "     4. Click 'View Logs' or 'Application Logs'" -ForegroundColor Gray
Write-Host "     5. Copy the last 50 lines of logs" -ForegroundColor Gray
Write-Host ""
Write-Host "   The logs will show:" -ForegroundColor Yellow
Write-Host "     - If DATABASE_URL is loaded" -ForegroundColor Gray
Write-Host "     - If Prisma client initialized" -ForegroundColor Gray
Write-Host "     - What error is causing 503" -ForegroundColor Gray
Write-Host ""

# Test 5: Restart procedure
Write-Host "5️⃣  Restart Node.js App" -ForegroundColor Yellow
Write-Host "   Steps:" -ForegroundColor Gray
Write-Host "     1. Hostinger cPanel → Node.js" -ForegroundColor Gray
Write-Host "     2. Find hsc-exam-api app" -ForegroundColor Gray
Write-Host "     3. Click 'Stop'" -ForegroundColor Gray
Write-Host "     4. Wait 10 seconds" -ForegroundColor Gray
Write-Host "     5. Click 'Start'" -ForegroundColor Gray
Write-Host "     6. Wait 30 seconds" -ForegroundColor Gray
Write-Host ""

# Test 6: File permissions
Write-Host "6️⃣  File Permissions Check" -ForegroundColor Yellow
Write-Host "   .env file must be readable by the Node.js process" -ForegroundColor Gray
Write-Host "   Action: In Hostinger File Manager:" -ForegroundColor Yellow
Write-Host "     1. Right-click .env file" -ForegroundColor Gray
Write-Host "     2. Change Permissions to: 644 (rw-r--r--)" -ForegroundColor Gray
Write-Host ""

# Test 7: App structure
Write-Host "7️⃣  Verify File Structure" -ForegroundColor Yellow
Write-Host "   /home/u441114691/nodejs/ should contain:" -ForegroundColor Gray
Write-Host "     ✓ .env (created by you)" -ForegroundColor Gray
Write-Host "     ✓ src/server.js" -ForegroundColor Gray
Write-Host "     ✓ src/env.js" -ForegroundColor Gray
Write-Host "     ✓ src/prisma.js" -ForegroundColor Gray
Write-Host "     ✓ package.json" -ForegroundColor Gray
Write-Host "     ✓ node_modules/@prisma/" -ForegroundColor Gray
Write-Host ""

Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "NEXT ACTION: Check Hostinger App Logs" -ForegroundColor Red
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""
Write-Host "The app logs will tell us exactly what's wrong." -ForegroundColor Yellow
Write-Host "Copy and paste the error message here." -ForegroundColor Yellow
Write-Host ""
