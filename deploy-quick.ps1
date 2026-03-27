# HSC Exam - Quick Deployment Script (PowerShell)
# Run this on Windows to deploy to Hostinger
# Requirements: Git Bash or OpenSSH for Windows installed

param(
    [switch]$UploadScript,
    [switch]$DeployNow,
    [switch]$TestConnection,
    [switch]$ViewLogs,
    [switch]$RestartApp
)

# Configuration
$SSH_HOST = "u441114691@45.130.228.77"
$SSH_PORT = "65002"
$BACKEND_PATH = "/home/u441114691/domains/hsc-exam-form.hisofttechnology.com/nodejs"

function Test-Connection-To-Server {
    Write-Host "`n[TEST] Checking SSH connection..." -ForegroundColor Yellow
    
    $output = ssh -p $SSH_PORT $SSH_HOST "echo 'Connection OK'" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] SSH connection successful!" -ForegroundColor Green
        Write-Host "Connected to: $SSH_HOST on port $SSH_PORT" -ForegroundColor Green
        return $true
    } else {
        Write-Host "[ERROR] SSH connection failed!" -ForegroundColor Red
        Write-Host "Please check:" -ForegroundColor Yellow
        Write-Host "  - SSH host/port: $SSH_HOST on $SSH_PORT" -ForegroundColor Yellow
        Write-Host "  - Network connection" -ForegroundColor Yellow
        Write-Host "  - Credentials" -ForegroundColor Yellow
        return $false
    }
}

function Upload-Deployment-Script {
    Write-Host "`n[UPLOAD] Uploading deployment script..." -ForegroundColor Yellow
    
    $scriptPath = ".\deploy-production.sh"
    
    if (-not (Test-Path $scriptPath)) {
        Write-Host "[ERROR] deploy-production.sh not found!" -ForegroundColor Red
        Write-Host "Make sure you're in the project root directory" -ForegroundColor Red
        return $false
    }
    
    Write-Host "Uploading to $SSH_HOST..." -ForegroundColor Cyan
    scp -P $SSH_PORT $scriptPath "${SSH_HOST}:~/deploy.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Script uploaded successfully!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "[ERROR] Upload failed" -ForegroundColor Red
        return $false
    }
}

function Start-Deployment {
    Write-Host "`n[DEPLOY] Starting automated deployment..." -ForegroundColor Yellow
    Write-Host "This will take 3-5 minutes..." -ForegroundColor Cyan
    Write-Host ""
    
    # Run the deployment script via SSH
    ssh -p $SSH_PORT $SSH_HOST "cd ~/ && chmod +x deploy.sh && ./deploy.sh"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n[OK] Deployment completed!" -ForegroundColor Green
        Write-Host "`nNext step: Upload frontend build to /public_html/" -ForegroundColor Cyan
    } else {
        Write-Host "`n[ERROR] Deployment failed" -ForegroundColor Red
        Write-Host "Check the logs above for details" -ForegroundColor Yellow
    }
}

function View-Application-Logs {
    Write-Host "`n[LOGS] Connecting to view application logs..." -ForegroundColor Yellow
    Write-Host "Press Ctrl+C to exit" -ForegroundColor Cyan
    Write-Host ""
    
    ssh -p $SSH_PORT $SSH_HOST "pm2 logs hsc-exam-api"
}

function Restart-Application {
    Write-Host "`n[RESTART] Restarting application..." -ForegroundColor Yellow
    
    ssh -p $SSH_PORT $SSH_HOST "pm2 restart hsc-exam-api"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Application restarted" -ForegroundColor Green
        Write-Host "Waiting for startup..." -ForegroundColor Cyan
        Start-Sleep -Seconds 3
        
        ssh -p $SSH_PORT $SSH_HOST "pm2 list | grep hsc-exam-api"
    } else {
        Write-Host "[ERROR] Restart failed" -ForegroundColor Red
    }
}

function Show-Status {
    Write-Host "`n[STATUS] Checking application status..." -ForegroundColor Yellow
    
    ssh -p $SSH_PORT $SSH_HOST "pm2 list"
}

function Show-Menu {
    Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Blue
    Write-Host "║  HSC Exam - Quick Deployment Menu                      ║" -ForegroundColor Blue
    Write-Host "║  Target: https://hsc-exam-form.hisofttechnology.com    ║" -ForegroundColor Blue
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  1. Test SSH Connection" -ForegroundColor White
    Write-Host "  2. Upload Deployment Script" -ForegroundColor White
    Write-Host "  3. Run Full Deployment" -ForegroundColor White
    Write-Host "  4. View Application Logs" -ForegroundColor White
    Write-Host "  5. Check Application Status" -ForegroundColor White
    Write-Host "  6. Restart Application" -ForegroundColor White
    Write-Host "  7. Exit" -ForegroundColor White
    Write-Host ""
}

# Main execution
if ($TestConnection) {
    Test-Connection-To-Server
} elseif ($UploadScript) {
    if (Test-Connection-To-Server) {
        Upload-Deployment-Script
    }
} elseif ($DeployNow) {
    if (Test-Connection-To-Server) {
        if (Upload-Deployment-Script) {
            Start-Deployment
        }
    }
} elseif ($ViewLogs) {
    View-Application-Logs
} elseif ($RestartApp) {
    Restart-Application
} else {
    # Interactive menu
    while ($true) {
        Show-Menu
        $choice = Read-Host "Enter choice [1-7]"
        
        switch ($choice) {
            "1" {
                Test-Connection-To-Server
            }
            "2" {
                if (Test-Connection-To-Server) {
                    Upload-Deployment-Script
                }
            }
            "3" {
                if (Test-Connection-To-Server) {
                    $confirm = Read-Host "Start deployment? (yes/no)"
                    if ($confirm -eq "yes") {
                        if (Upload-Deployment-Script) {
                            Start-Deployment
                        }
                    }
                }
            }
            "4" {
                View-Application-Logs
            }
            "5" {
                Show-Status
            }
            "6" {
                $confirm = Read-Host "Restart application? (yes/no)"
                if ($confirm -eq "yes") {
                    Restart-Application
                }
            }
            "7" {
                Write-Host "`nExiting..." -ForegroundColor Green
                exit
            }
            default {
                Write-Host "Invalid choice. Please try again." -ForegroundColor Red
            }
        }
    }
}
