@echo off
REM ---------------------------------------------------------------------------
REM  HSC / SSC Exam Portal - one-time setup on a Windows PC with XAMPP.
REM  1. Start Apache and MySQL in the XAMPP Control Panel.
REM  2. Double-click this file.
REM  3. Open http://localhost/HSC-exam
REM ---------------------------------------------------------------------------
setlocal
chcp 65001 >nul
cd /d "%~dp0"

set "PHP=C:\xampp\php\php.exe"
set "MYSQL=C:\xampp\mysql\bin\mysql.exe"

if not exist "%PHP%" (
    echo Could not find XAMPP PHP at %PHP%
    echo Edit the PHP= line at the top of this file to point to php.exe.
    pause & exit /b 1
)

if not exist "vendor\autoload.php" (
    echo [1/5] Unpacking libraries from vendor.zip ...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Force -LiteralPath 'vendor.zip' -DestinationPath '.'" || (echo Could not unpack vendor.zip & pause & exit /b 1)
) else (
    echo [1/5] Libraries already unpacked.
)

if not exist ".env" (
    echo [2/5] Creating .env for local testing ...
    powershell -NoProfile -ExecutionPolicy Bypass -Command ^
      "$l = Get-Content '.env.example' -Encoding UTF8;" ^
      "$l = $l -replace '^APP_ENV=.*','APP_ENV=local' -replace '^APP_DEBUG=.*','APP_DEBUG=true' -replace '^ALLOW_TEST_PAYMENTS=.*','ALLOW_TEST_PAYMENTS=true' -replace '^ALLOW_DEMO_STUDENT_LOGIN=.*','ALLOW_DEMO_STUDENT_LOGIN=true';" ^
      "[IO.File]::WriteAllLines((Join-Path (Get-Location) '.env'), $l)"
    "%PHP%" artisan key:generate --force
) else (
    echo [2/5] .env already exists - keeping it.
)

echo [3/5] Creating database hsc_exam ...
"%MYSQL%" -u root -e "CREATE DATABASE IF NOT EXISTS hsc_exam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci" || (echo MySQL is not running. Start it in the XAMPP Control Panel and run this file again. & pause & exit /b 1)

echo [4/5] Creating tables and loading colleges, schools and subjects ...
"%PHP%" artisan migrate --seed --force || (pause & exit /b 1)

echo [5/5] Linking upload folder ...
"%PHP%" artisan storage:link
"%PHP%" artisan optimize:clear >nul

echo.
echo  Done!  Website:        http://localhost/HSC-exam
echo         Super admin:    http://localhost/HSC-exam/control-room-7k2   (superadmin / Password@123)
echo         Board:          http://localhost/HSC-exam/board-desk-4m9     (board2 / Password@123)
echo         Institute:      http://localhost/HSC-exam/college-desk-8p3   (INSTITUTE1 / Password@123)
echo         Student:        http://localhost/HSC-exam/login  (use the demo student button)
echo.
pause
