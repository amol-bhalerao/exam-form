@echo off
REM HSC Exam - Complete Fix Script (Windows)
REM Run this from the backend folder: .\fix-all.bat

setlocal enabledelayedexpansion

cls
echo.
echo ===============================================
echo   HSC Exam - Complete System Fix Script
echo ===============================================
echo.

REM Check if Node is installed
echo [1/7] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo OK
echo.

REM Check if MySQL is running (optional)
echo [2/7] Checking MySQL...
mysql -u root -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo WARNING: MySQL does not appear to be running
    echo Before testing, ensure MySQL is started:
    echo   net start MySQL80  (or your service name)
    echo.
) else (
    echo OK - MySQL is running
    echo.
)

REM Clean old dependencies
echo [3/7] Cleaning old dependencies...
if exist node_modules (
    echo Removing old node_modules...
    rmdir /s /q node_modules >nul 2>&1
)
echo OK
echo.

REM Clear npm cache
echo [4/7] Clearing npm cache...
call npm cache clean --force >nul 2>&1
echo OK
echo.

REM Install dependencies
echo [5/7] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    pause
    exit /b 1
)
echo OK
echo.

REM Generate Prisma
echo [6/7] Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo WARNING: Prisma generation failed (non-critical)
)
echo OK
echo.

REM Fix schema
echo [7/7] Applying database schema fixes...
call node fix-schema.js
if errorlevel 1 (
    echo WARNING: Schema fix failed (MySQL may not be running)
    echo Make sure MySQL is running and try again
)
echo.

REM Build
echo [BUILD] Building backend...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    echo Check the error messages above
    pause
    exit /b 1
)
echo.

echo.
echo ===============================================
echo   ✓ Setup Complete!
echo ===============================================
echo.
echo NEXT STEPS:
echo 1. Make sure MySQL is running:  net start MySQL80
echo 2. Start backend:               npm start
echo 3. In another terminal:         cd ..\frontend && npm start
echo 4. Open http://localhost:4200 in your browser
echo.
echo ===============================================
echo.
pause
