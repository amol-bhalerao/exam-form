# SSH Tunnel Setup for Hostinger MySQL
# This script creates a secure tunnel to access Hostinger's MySQL from your local machine

# Configuration
$SSH_HOST = "45.130.228.77"  # Your Hostinger SSH host
$SSH_PORT = "65002"            # Your Hostinger SSH port
$SSH_USER = "u441114691"       # Your Hostinger username
$MYSQL_HOST = "127.0.0.1"      # MySQL on Hostinger server (localhost from server)
$MYSQL_PORT = "3306"
$LOCAL_PORT = "3307"           # Local port to bind (won't conflict with local MySQL if running)

Write-Host "🔐 Starting SSH Tunnel to Hostinger MySQL..." -ForegroundColor Cyan
Write-Host "SSH: $SSH_USER@$SSH_HOST:$SSH_PORT"
Write-Host "MySQL Forward: localhost:$LOCAL_PORT -> $MYSQL_HOST:$MYSQL_PORT"
Write-Host ""
Write-Host "Tunnel is now active. Use this connection string:" -ForegroundColor Green
Write-Host "mysql://u441114691_exam:ExamHSC1234567890@localhost:$LOCAL_PORT/u441114691_exam" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to close the tunnel" -ForegroundColor Gray

# Create the SSH tunnel
# Format: ssh -N -L <local_port>:<remote_host>:<remote_port> <user>@<ssh_host> -p <ssh_port>
$cmd = "ssh -N -L ${LOCAL_PORT}:${MYSQL_HOST}:${MYSQL_PORT} ${SSH_USER}@${SSH_HOST} -p ${SSH_PORT}"

Write-Host "Executing: $cmd`n" -ForegroundColor Gray
Invoke-Expression $cmd
