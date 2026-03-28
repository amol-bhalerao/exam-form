#!/usr/bin/env pwsh
# Comprehensive API Test Suite
# Tests all backend endpoints

$baseUrl = "https://hsc-api.hisofttechnology.com/api"
$pass = @()
$fail = @()

function Test-Endpoint {
    param(
        [string]$name,
        [string]$method = "GET",
        [string]$path = "",
        [hashtable]$headers = @{},
        [object]$body = $null
    )
    
    $url = "$baseUrl$path"
    
    try {
        $params = @{
            Uri = $url
            Method = $method
            SkipCertificateCheck = $true
            TimeoutSec = 10
            Headers = $headers
        }
        
        if ($body) {
            $params["Body"] = $body | ConvertTo-Json
            $params["ContentType"] = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $status = $response.StatusCode
        
        if ($status -ge 200 -and $status -lt 300) {
            Write-Host "✅ $name" -ForegroundColor Green
            $pass += $name
            return $true
        } else {
            Write-Host "⚠️ $name (Status: $status)" -ForegroundColor Yellow
            $fail += $name
            return $false
        }
    } catch {
        Write-Host "❌ $name - $($_.Exception.Message)" -ForegroundColor Red
        $fail += $name
        return $false
    }
}

Write-Host "`n📋 Testing All Backend APIs`n" -ForegroundColor Cyan

# ===== PUBLIC HEALTH & SYSTEM =====
Write-Host "🏥 Health & System Endpoints:" -ForegroundColor Yellow
Test-Endpoint "Health Check" -path "/health"
Test-Endpoint "Exam Status" -path "/exams/status"

# ===== PUBLIC DATA (No Auth Required) =====
Write-Host "`n📚 Public Data Endpoints (No Auth Required):" -ForegroundColor Yellow
Test-Endpoint "Get Public Exams" -path "/public/exams"
Test-Endpoint "Get Public News" -path "/public/news"
Test-Endpoint "Get Documentation (Swagger)" -path "/docs"

# ===== AUTH ENDPOINTS =====
Write-Host "`n🔐 Authentication Endpoints:" -ForegroundColor Yellow
Test-Endpoint "Check Email Exists" -method "POST" -path "/auth/check-email" `
    -body @{email = "test@example.com"}

# ===== PRIVATE ENDPOINTS (Will fail without auth, but that's expected) =====
Write-Host "`n🔒 Protected Endpoints (Expected 401/403):" -ForegroundColor Yellow
Test-Endpoint "Get Current User" -path "/me" -headers @{"Authorization" = "Bearer invalid"}
Test-Endpoint "Get Applications" -path "/applications" -headers @{"Authorization" = "Bearer invalid"}
Test-Endpoint "Get Students" -path "/students" -headers @{"Authorization" = "Bearer invalid"}
Test-Endpoint "Get Institutes" -path "/institutes" -headers @{"Authorization" = "Bearer invalid"}

# ===== SUMMARY =====
Write-Host "`n" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "TEST SUMMARY" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════════" -ForegroundColor Cyan

$totalPass = $pass.Count
$totalFail = $fail.Count
$totalTests = $totalPass + $totalFail

Write-Host "`n✅ Passed: $totalPass" -ForegroundColor Green
Write-Host "❌ Failed: $totalFail" -ForegroundColor Red
Write-Host "📊 Total: $totalTests`n" -ForegroundColor Cyan

if ($totalFail -gt 0) {
    Write-Host "Failed Tests:" -ForegroundColor Red
    $fail | ForEach-Object { Write-Host "  - $_" }
}

if ($totalPass -eq $totalTests) {
    Write-Host "✅ All APIs are working correctly!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️ Some APIs are not responding as expected" -ForegroundColor Yellow
    exit 1
}
