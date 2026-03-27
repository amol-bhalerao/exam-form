@echo off
REM ============================================================================
REM HSC EXAM - HOSTINGER DEPLOYMENT SCRIPT (Windows Batch)
REM ============================================================================
REM Auto-deploys backend and frontend to Hostinger
REM Requires Git Bash or OpenSSH for Windows

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo HSC EXAM SYSTEM - HOSTINGER AUTOMATED DEPLOYMENT
echo ============================================================================
echo.
echo  Domain: https://hsc-exam-form.hisofttechnology.com
echo  Server: 45.130.228.77:65002
echo.

REM Configuration
set SSH_HOST=u441114691@45.130.228.77
set SSH_PORT=65002
set DOMAIN=hsc-exam-form.hisofttechnology.com
set BACKEND_PATH=/home/u441114691/domains/%DOMAIN%/nodejs
set FRONTEND_PATH=/home/u441114691/domains/%DOMAIN%/public_html

echo [Step 1] Testing SSH Connection...
ssh -p %SSH_PORT% %SSH_HOST% "echo Connected" >nul 2>&1

if errorlevel 1 (
    echo [ERROR] SSH connection failed
    echo Please verify:
    echo  - IP: 45.130.228.77
    echo  - Port: 65002
    echo  - Username: u441114691
    echo.
    pause
    exit /b 1
)

echo [OK] SSH connection successful
echo.

echo [Step 2] Building Frontend...
cd frontend
call npm run build
if errorlevel 1 (
    echo [ERROR] Frontend build failed
    cd ..
    pause
    exit /b 1
)
echo [OK] Frontend build successful
cd ..
echo.

echo [Step 3] Uploading Deployment Script...
scp -P %SSH_PORT% backend\complete-deploy.sh %SSH_HOST%:~/deploy.sh

if errorlevel 1 (
    echo [ERROR] Upload failed
    pause
    exit /b 1
)

echo [OK] Script uploaded
echo.

echo [Step 4] Executing Backend Deployment...
echo  ^(This will take 5-10 minutes - please wait...^)
echo.

REM Execute deployment on server
ssh -p %SSH_PORT% %SSH_HOST% "cd ~/ & chmod +x deploy.sh & ./deploy.sh"

if errorlevel 1 (
    echo.
    echo [WARNING] Deployment had an issue - checking status...
    ssh -p %SSH_PORT% %SSH_HOST% "pm2 list"
) else (
    echo.
    echo [OK] Backend deployment successful
)

echo.

echo [Step 5] Frontend Deployment Instructions
echo ============================================
echo.
echo Files to upload:
echo   Source: frontend\dist\exam-form\browser\*
echo   Target: %FRONTEND_PATH%
echo.
echo Option A - Using FTP Client (Easy):
echo   1. Open FileZilla
echo   2. Connect with Hostinger FTP credentials
echo   3. Navigate to /public_html/
echo   4. Drag and drop files from frontend\dist\exam-form\browser\
echo.
echo Option B - Using Command Line:
echo   scp -P %SSH_PORT% -r frontend\dist\exam-form\browser\* %SSH_HOST%:%FRONTEND_PATH%/
echo.
echo.

echo [Step 6] Verification
echo =======================
echo.
echo Test API:
echo   curl https://hsc-exam-form.hisofttechnology.com/api/health
echo.
echo Visit Website:
echo   https://hsc-exam-form.hisofttechnology.com/
echo.
echo Check Status:
echo   ssh -p %SSH_PORT% %SSH_HOST% "pm2 list"
echo.
echo View Logs:
echo   ssh -p %SSH_PORT% %SSH_HOST% "pm2 logs hsc-exam-api --nostream --lines 50"
echo.
echo Restart App:
echo   ssh -p %SSH_PORT% %SSH_HOST% "pm2 restart hsc-exam-api"
echo.
echo ============================================================================
echo DEPLOYMENT CHECKLIST COMPLETED
echo ============================================================================
echo.
echo Next: Upload frontend files via FTP to /public_html/
echo.

pause
