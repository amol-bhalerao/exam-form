@echo off
REM Frontend Deployment Script for Hostinger
REM This script uploads the built frontend to Hostinger public_html

setlocal enabledelayedexpansion

echo.
echo ===================================================================
echo   HSC Exam Frontend Deployment Script
echo ===================================================================
echo.

REM Check if build exists
if not exist "frontend\dist\exam-form\browser" (
  echo ❌ Build directory not found!
  echo    Run: npm run build:frontend:local
  exit /b 1
)

echo ✓ Build directory found
echo   Source: frontend\dist\exam-form\browser
echo   Destination: u441114691@45.130.228.77:/home/u441114691/public_html
echo.

echo Files to deploy:
for /r "frontend\dist\exam-form\browser" %%F in (*) do (
  set "FILE=%%F"
  set "FILE=!FILE:frontend\dist\exam-form\browser\=!"
  echo   • !FILE!
)

echo.
echo Uploading files...
echo (Enter your SSH/Hostinger password when prompted)
echo.

REM Upload using SCP
scp -P 65002 -r "frontend\dist\exam-form\browser/*" u441114691@45.130.228.77:/home/u441114691/public_html/

if %ERRORLEVEL% EQU 0 (
  echo.
  echo ✓ Upload completed successfully!
  echo.
  echo Next steps:
  echo   1. Clear browser cache ^(Ctrl+Shift+Delete^)
  echo   2. Visit: https://hsc-exam-form.hisofttechnology.com/
  echo   3. Check browser console ^(F12^) for errors
  echo.
) else (
  echo.
  echo ❌ Upload failed with exit code !ERRORLEVEL!
  exit /b 1
)

endlocal
pause
