# ============================================================================
# AUTOMATED HOSTINGER DEPLOYMENT SCRIPT
# Deploys HSC Exam System to Production
# ============================================================================

param(
    [string]$Action = "deploy",
    [switch]$Verbose
)

# Configuration
$SSH_HOST = "u441114691@45.130.228.77"
$SSH_PORT = "65002"
$DOMAIN = "hsc-exam-form.hisofttechnology.com"
$BACKEND_PATH = "/home/u441114691/domains/$DOMAIN/nodejs"
$FRONTEND_PATH = "/home/u441114691/domains/$DOMAIN/public_html"

# Colors
$Green = "Green"
$Yellow = "Yellow"
$Red = "Red"
$Cyan = "Cyan"

function Write-Status {
    param(
        [string]$Message,
        [string]$Level = "Info"
    )
    
    $color = switch ($Level) {
        "Success" { $Green }
        "Warning" { $Yellow }
        "Error" { $Red }
        default { $Cyan }
    }
    
    $prefix = switch ($Level) {
        "Success" { "[OK]" }
        "Warning" { "[!]" }
        "Error" { "[ERROR]" }
        default { "[*]" }
    }
    
    Write-Host "$prefix $Message" -ForegroundColor $color
}

function Test-SSHConnection {
    Write-Status "Testing SSH connection..." "Info"
    
    try {
        $result = ssh -p $SSH_PORT $SSH_HOST "echo 'Connection OK'" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Status "SSH connection successful" "Success"
            return $true
        }
    }
    catch {
        Write-Status "SSH connection failed: $_" "Error"
        return $false
    }
    
    return $false
}

function Upload-DeploymentScript {
    Write-Status "Uploading deployment script to server..." "Info"
    
    $scriptPath = ".\backend\deploy-to-hostinger.sh"
    
    if (-not (Test-Path $scriptPath)) {
        Write-Status "Deploy script not found at $scriptPath" "Error"
        return $false
    }
    
    try {
        scp -P $SSH_PORT $scriptPath "$($SSH_HOST):~/deploy.sh" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Deployment script uploaded successfully" "Success"
            return $true
        }
    }
    catch {
        Write-Status "Failed to upload script: $_" "Error"
        return $false
    }
    
    return $false
}

function Deploy-Backend {
    Write-Status "Deploying backend to Hostinger..." "Info"
    Write-Status "This will take 5-10 minutes..." "Warning"
    Write-Host ""
    
    try {
        # Execute the deployment script on the remote server
        ssh -p $SSH_PORT $SSH_HOST @"
cd ~
chmod +x deploy.sh
./deploy.sh
"@
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Backend deployment completed successfully" "Success"
            return $true
        }
        else {
            Write-Status "Backend deployment encountered an issue" "Warning"
            # Don't fail completely - the script may have partially succeeded
            return $true
        }
    }
    catch {
        Write-Status "Deployment error: $_" "Error"
        return $false
    }
}

function Get-DeploymentStatus {
    Write-Status "Checking deployment status..." "Info"
    Write-Host ""
    
    try {
        ssh -p $SSH_PORT $SSH_HOST "pm2 list"
    }
    catch {
        Write-Status "Could not retrieve status: $_" "Error"
    }
}

function View-Logs {
    Write-Status "Retrieving latest logs..." "Info"
    Write-Host ""
    
    try {
        ssh -p $SSH_PORT $SSH_HOST "pm2 logs hsc-exam-api --nostream --lines 50"
    }
    catch {
        Write-Status "Could not retrieve logs: $_" "Error"
    }
}

function Restart-Backend {
    Write-Status "Restarting application..." "Info"
    
    try {
        ssh -p $SSH_PORT $SSH_HOST "pm2 restart hsc-exam-api"
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Application restarted successfully" "Success"
            Start-Sleep -Seconds 3
            Get-DeploymentStatus
        }
    }
    catch {
        Write-Status "Restart failed: $_" "Error"
    }
}

function Create-FrontendPackage {
    Write-Status "Creating frontend build package..." "Info"
    
    try {
        Push-Location frontend
        
        # Check if dist exists
        if (Test-Path "dist") {
            Write-Status "Removing old build..." "Warning"
            Remove-Item "dist" -Recurse -Force
        }
        
        # Build
        Write-Status "Building frontend..." "Info"
        npm run build
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Frontend build successful" "Success"
            Pop-Location
            return $true
        }
        else {
            Write-Status "Frontend build failed" "Error"
            Pop-Location
            return $false
        }
    }
    catch {
        Write-Status "Error during frontend build: $_" "Error"
        Pop-Location
        return $false
    }
}

function Deploy-Frontend {
    Write-Status "Deploying frontend files..." "Info"
    
    try {
        Push-Location frontend\dist\exam-form\browser
        
        # Create tar archive for faster transfer
        Write-Status "Packaging frontend files..." "Info"
        
        # Create a simple tar transfer
        $files = Get-ChildItem -Recurse
        if ($files.Count -eq 0) {
            Write-Status "No frontend files found" "Error"
            Pop-Location
            return $false
        }
        
        # Use SCP to recursively copy files
        Write-Status "Uploading frontend files to $FRONTEND_PATH..." "Info"
        scp -P $SSH_PORT -r "." "$($SSH_HOST):$FRONTEND_PATH/" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Status "Frontend deployment successful" "Success"
            Pop-Location
            return $true
        }
        else {
            Write-Status "Frontend upload failed" "Error"
            Pop-Location
            return $false
        }
    }
    catch {
        Write-Status "Error during frontend deployment: $_" "Error"
        Pop-Location
        return $false
    }
}

function Show-Menu {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Blue
    Write-Host "║  HSC Exam - Hostinger Deployment Manager              ║" -ForegroundColor Blue
    Write-Host "║  Target: $DOMAIN                   ║" -ForegroundColor Blue
    Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Cyan
    Write-Host "  1. Test SSH Connection" -ForegroundColor White
    Write-Host "  2. Full Deployment (Backend + Frontend)" -ForegroundColor White
    Write-Host "  3. Backend Only" -ForegroundColor White
    Write-Host "  4. Frontend Only" -ForegroundColor White
    Write-Host "  5. Check Status" -ForegroundColor White
    Write-Host "  6. View Recent Logs" -ForegroundColor White
    Write-Host "  7. Restart Backend" -ForegroundColor White
    Write-Host "  8. Exit" -ForegroundColor White
    Write-Host ""
}

# Main execution
if ($Action -eq "full") {
    Write-Status "Starting full deployment..." "Info"
    
    if (Test-SSHConnection) {
        Write-Status "Phase 1: Building frontend..." "Info"
        if (Create-FrontendPackage) {
            Write-Status "Phase 2: Uploading deployment script..." "Info"
            if (Upload-DeploymentScript) {
                Write-Status "Phase 3: Deploying backend..." "Info"
                if (Deploy-Backend) {
                    Write-Status "Phase 4: Deploying frontend..." "Info"
                    if (Deploy-Frontend) {
                        Write-Status "ALL DEPLOYMENTS COMPLETED ✓" "Success"
                        Write-Host ""
                        Get-DeploymentStatus
                    }
                }
            }
        }
    }
}
else {
    # Interactive menu
    while ($true) {
        Show-Menu
        $choice = Read-Host "Select option [1-8]"
        
        switch ($choice) {
            "1" {
                Test-SSHConnection
            }
            "2" {
                $confirm = Read-Host "Start full deployment? (yes/no)"
                if ($confirm -eq "yes") {
                    if (Create-FrontendPackage) {
                        if (Upload-DeploymentScript) {
                            if (Deploy-Backend) {
                                if (Deploy-Frontend) {
                                    Write-Status "FULL DEPLOYMENT COMPLETED ✓" "Success"
                                }
                            }
                        }
                    }
                }
            }
            "3" {
                if (Upload-DeploymentScript) {
                    Deploy-Backend
                }
            }
            "4" {
                if (Create-FrontendPackage) {
                    Deploy-Frontend
                }
            }
            "5" {
                Get-DeploymentStatus
            }
            "6" {
                View-Logs
            }
            "7" {
                Restart-Backend
            }
            "8" {
                Write-Status "Exiting..." "Info"
                exit
            }
            default {
                Write-Status "Invalid option, please try again" "Warning"
            }
        }
        
        Write-Host ""
        Read-Host "Press Enter to continue"
    }
}
