#!/usr/bin/env pwsh
# Diagnostic script to check backend API status

Write-Host "`n═══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Backend API Diagnostic" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$domain = "https://hsc-exam-form.hisofttechnology.com"

Write-Host "Testing backend endpoints...`n" -ForegroundColor Yellow

# Test 1: Health endpoint
Write-Host "1. Testing /api/health:" -ForegroundColor White
try {
  $response = Invoke-WebRequest -Uri "$domain/api/health" -UseBasicParsing -TimeoutSec 5
  $status = $response.StatusCode
  $content = $response.Content
  
  if ($status -eq 200) {
    Write-Host "   Status: $status ✅" -ForegroundColor Green
    Write-Host "   Response: $content" -ForegroundColor Gray
  } else {
    Write-Host "   Status: $status ❌" -ForegroundColor Red
    Write-Host "   Response: $content" -ForegroundColor Gray
  }
} catch {
  Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Public exams endpoint
Write-Host "`n2. Testing /api/public/exams:" -ForegroundColor White
try {
  $response = Invoke-WebRequest -Uri "$domain/api/public/exams" -UseBasicParsing -TimeoutSec 5
  $status = $response.StatusCode
  $content = $response.Content | ConvertFrom-Json
  
  if ($status -eq 200) {
    Write-Host "   Status: $status ✅" -ForegroundColor Green
    Write-Host "   Response: $($content | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
  } else {
    Write-Host "   Status: $status ❌" -ForegroundColor Red
  }
} catch {
  $statusCode = $_.Exception.Response.StatusCode.Value__
  Write-Host "   Status: $statusCode ❌" -ForegroundColor Red
  
  if ($statusCode -eq 404) {
    Write-Host "   Issue: 404 Not Found - Backend route not responding" -ForegroundColor Yellow
    Write-Host "   Possible causes:" -ForegroundColor Yellow
    Write-Host "     1. Backend server is not running" -ForegroundColor Gray
    Write-Host "     2. Backend wasn't redeployed with new routes" -ForegroundColor Gray
    Write-Host "     3. .htaccess is rewriting /api to index.html" -ForegroundColor Gray
  }
}

# Test 3: Root endpoint
Write-Host "`n3. Testing / (frontend):" -ForegroundColor White
try {
  $response = Invoke-WebRequest -Uri "$domain/" -UseBasicParsing -TimeoutSec 5
  $status = $response.StatusCode
  
  if ($status -eq 200) {
    Write-Host "   Status: $status ✅" -ForegroundColor Green
    Write-Host "   Frontend is responsive" -ForegroundColor Gray
  } else {
    Write-Host "   Status: $status ❌" -ForegroundColor Red
  }
} catch {
  Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n═══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
