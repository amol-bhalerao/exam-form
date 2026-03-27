# Windows PowerShell Deployment Script
# Run as Administrator: Right-click PowerShell → Run as Administrator
# Then: Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

param(
    [string]$Environment = "production",
    [switch]$CleanFirst = $false,
    [switch]$NoMigrations = $false
)

# ════════════════════════════════════════════════════════════════════════════
# Colors and utilities
# ════════════════════════════════════════════════════════════════════════════

function Write-Header {
    param([string]$Message)
    Write-Host "`n" -ForegroundColor Yellow
    Write-Host "═" * 70 -ForegroundColor Yellow
    Write-Host $Message -ForegroundColor Yellow
    Write-Host "═" * 70 -ForegroundColor Yellow
}

function Write-Step {
    param([string]$Message, [int]$Step, [int]$Total)
    Write-Host "`n[STEP $Step/$Total] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

# ════════════════════════════════════════════════════════════════════════════
# Main Script
# ════════════════════════════════════════════════════════════════════════════

Write-Header "HSC Exam System - Production Deployment ($Environment)"

# Step 1: Cleanup
if ($CleanFirst) {
    Write-Step "Cleaning up previous builds" 1 5
    
    Write-Host "  Removing frontend artifacts..."
    Remove-Item -Force -Recurse -Path "frontend/dist" -ErrorAction SilentlyContinue
    Remove-Item -Force -Recurse -Path "frontend/node_modules" -ErrorAction SilentlyContinue
    Remove-Item -Force -Recurse -Path "frontend/.angular" -ErrorAction SilentlyContinue
    
    Write-Host "  Removing backend artifacts..."
    Remove-Item -Force -Recurse -Path "backend/.prisma" -ErrorAction SilentlyContinue
    
    Write-Success "Cleanup complete"
}

# Step 2: Install Backend Dependencies
Write-Step "Installing backend dependencies" 2 5

try {
    Push-Location "backend"
    Write-Host "  Installing npm packages..."
    npm install --production
    
    Write-Host "  Building Prisma client for Linux..."
    npm run build
    
    Write-Success "Backend dependencies installed"
    Pop-Location
}
catch {
    Write-Error "Backend installation failed: $_"
    exit 1
}

# Step 3: Install Frontend Dependencies
Write-Step "Installing frontend dependencies" 3 5

try {
    Push-Location "frontend"
    Write-Host "  Installing npm packages..."
    npm install
    
    Write-Success "Frontend dependencies installed"
    Pop-Location
}
catch {
    Write-Error "Frontend installation failed: $_"
    exit 1
}

# Step 4: Build Frontend
Write-Step "Building frontend for production" 4 5

try {
    Push-Location "frontend"
    Write-Host "  Running production build..."
    npm run build
    Write-Success "Frontend build complete"
    Pop-Location
}
catch {
    Write-Error "Frontend build failed: $_"
    exit 1
}

# Step 5: Verify Installation
Write-Step "Verifying installation" 5 5

# Check Node version
$NodeVersion = node --version
Write-Host "  Node version: $NodeVersion"

# Check NPM version
$NpmVersion = npm --version
Write-Host "  NPM version: $NpmVersion"

# Check frontend build
if (Test-Path "frontend/dist") {
    $FrontendSize = (Get-ChildItem -Path "frontend/dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "  Frontend bundle size: $([math]::Round($FrontendSize, 2)) MB"
    Write-Success "Frontend build verified"
}
else {
    Write-Error "Frontend build not found!"
    exit 1
}

# Check backend build
if ((Test-Path "backend/node_modules/@prisma/client") -or (Test-Path "backend/.prisma")) {
    Write-Success "Backend dependencies verified"
}

# ════════════════════════════════════════════════════════════════════════════
# Summary
# ════════════════════════════════════════════════════════════════════════════

Write-Header "✓ Deployment Setup Complete!"

Write-Host @"

Next Steps for Hostinger Deployment:

1. Update Configuration
   ✓ Set backend/.env.production with actual values
   ✓ Update frontend/src/environments/environment.prod.ts with domain

2. Prepare for Upload
   ✓ Run cleanup script: .\CLEANUP_GUIDE.md
   ✓ Create logs directory on Hostinger
   ✓ Verify database exists on Hostinger

3. Deploy to Hostinger
   ✓ Use SFTP or Hostinger file manager to upload:
     - backend/
     - frontend/dist/
     - ecosystem.config.cjs
     - backend/.env.production

4. Start Application
   ✓ SSH into Hostinger: ssh -p 65002 u441114691@45.130.228.77
   ✓ Navigate to application: cd ~/public_html/hsc-exam
   ✓ Install PM2: npm install -g pm2
   ✓ Start app: pm2 start ecosystem.config.cjs
   ✓ Save config: pm2 save
   ✓ Setup auto-startup: pm2 startup

5. Verify Deployment
   ✓ Check PM2 status: pm2 status
   ✓ View logs: pm2 logs
   ✓ Test API: curl http://localhost:3000/health
   ✓ Check frontend: http://your-domain.com

Documentation Files Created:
  - HOSTINGER_PRODUCTION_SETUP.md    - Complete deployment guide
  - ENV_VARIABLES_GUIDE.md           - Environment variable reference
  - CLEANUP_GUIDE.md                 - Cleanup and optimization guide
  - deploy.sh                        - Linux deployment script
  - deploy.ps1                       - Windows deployment script
  - ecosystem.config.cjs             - PM2 configuration

Questions? See ENV_VARIABLES_GUIDE.md for detailed instructions.

"@ -ForegroundColor Green

Write-Host "═" * 70 -ForegroundColor Yellow
