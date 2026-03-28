#!/usr/bin/env pwsh
<#
.SYNOPSIS
Complete Backend API Test Suite
.DESCRIPTION
Tests all critical endpoints to verify backend is working correctly
#>

$BACKEND_URL = "https://hsc-api.hisofttechnology.com"
$FRONTEND_URL = "https://hsc-exam-form.hisofttechnology.com"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "🧪 HSC EXAM BACKEND TEST SUITE" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  $BACKEND_URL" -ForegroundColor Yellow
Write-Host "Frontend: $FRONTEND_URL" -ForegroundColor Yellow
Write-Host ""
Write-Host "Testing at $(Get-Date)" -ForegroundColor Gray
Write-Host ""

# Test counter
$passed = 0
$failed = 0

function Test-API {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [string]$Description,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int[]]$ExpectedStatus = @(200)
    )
    
    $url = "$BACKEND_URL$Endpoint"
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📍 $Name" -ForegroundColor Cyan
    Write-Host "   $Method $Endpoint" -ForegroundColor Gray
    Write-Host "   $Description" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $url
            Method = $Method
            Headers = $Headers
            TimeoutSec = 15
            SkipHttpErrorCheck = $true
            SkipCertificateCheck = $true
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        $statusCode = $response.StatusCode
        
        if ($statusCode -in $ExpectedStatus) {
            Write-Host "   ✅ Status: $statusCode" -ForegroundColor Green
            $global:passed++
            
            try {
                $content = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
                if ($content) {
                    Write-Host "   Response:" -ForegroundColor Green
                    if ($content.PSObject.Properties.Count -le 5) {
                        Write-Host "   $(($content | ConvertTo-Json -Depth 1) -replace '^', '   ')" -ForegroundColor Gray
                    } else {
                        Write-Host "   {" -ForegroundColor Gray
                        $content.PSObject.Properties | Select-Object -First 3 | ForEach-Object {
                            Write-Host "     $($_.Name): $($_.Value)" -ForegroundColor Gray
                        }
                        Write-Host "     ... (more properties)" -ForegroundColor Gray
                        Write-Host "   }" -ForegroundColor Gray
                    }
                }
            } catch {}
        } else {
            Write-Host "   ❌ Status: $statusCode (expected $($ExpectedStatus -join ', '))" -ForegroundColor Red
            $global:failed++
        }
    } catch {
        Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        $global:failed++
    }
    
    Write-Host ""
}

# Initialize counters
$global:passed = 0
$global:failed = 0

# ============================================================================
# CRITICAL TESTS
# ============================================================================

Write-Host "🔴 CRITICAL TESTS (Must Pass)" -ForegroundColor Red
Write-Host ""

Test-API `
    -Name "Root Endpoint" `
    -Method "GET" `
    -Endpoint "/" `
    -Description "Backend root - verifies server is running" `
    -ExpectedStatus @(200)

Test-API `
    -Name "Health Check" `
    -Method "GET" `
    -Endpoint "/api/health" `
    -Description "Health status endpoint - critical for monitoring" `
    -ExpectedStatus @(200)

# ============================================================================
# PUBLIC APIs (No Auth Required)
# ============================================================================

Write-Host ""
Write-Host "🟢 PUBLIC APIs (No Authentication)" -ForegroundColor Green
Write-Host ""

Test-API `
    -Name "Get Public Exams" `
    -Method "GET" `
    -Endpoint "/api/public/exams" `
    -Description "List all public exams - tests database connectivity" `
    -ExpectedStatus @(200)

Test-API `
    -Name "Get Masters - States" `
    -Method "GET" `
    -Endpoint "/api/masters/states" `
    -Description "Get state master data - tests database queries" `
    -ExpectedStatus @(200)

Test-API `
    -Name "Get Masters - Boards" `
    -Method "GET" `
    -Endpoint "/api/masters/boards" `
    -Description "Get exam boards master data" `
    -ExpectedStatus @(200)

# ============================================================================
# CORS TESTS
# ============================================================================

Write-Host ""
Write-Host "🔒 CORS & SECURITY" -ForegroundColor Magenta
Write-Host ""

Write-Host "📍 CORS Preflight Check" -ForegroundColor Cyan
Write-Host "   OPTIONS /api/health" -ForegroundColor Gray
Write-Host "   Testing CORS headers for frontend" -ForegroundColor Gray

try {
    $corsHeaders = @{
        "Origin" = $FRONTEND_URL
        "Access-Control-Request-Method" = "POST"
    }
    
    $response = Invoke-WebRequest `
        -Uri "$BACKEND_URL/api/health" `
        -Method OPTIONS `
        -Headers $corsHeaders `
        -TimeoutSec 10 `
        -SkipHttpErrorCheck `
        -SkipCertificateCheck
    
    $allowOrigin = $response.Headers["Access-Control-Allow-Origin"]
    $allowMethods = $response.Headers["Access-Control-Allow-Methods"]
    $allowHeaders = $response.Headers["Access-Control-Allow-Headers"]
    
    if ($allowOrigin -eq $FRONTEND_URL) {
        Write-Host "   ✅ CORS Origin: $allowOrigin" -ForegroundColor Green
        $global:passed++
    } else {
        Write-Host "   ⚠️  CORS Origin: $allowOrigin (expected: $FRONTEND_URL)" -ForegroundColor Yellow
    }
    
    if ($allowMethods) {
        Write-Host "   ✅ CORS Methods: $allowMethods" -ForegroundColor Green
    }
    
} catch {
    Write-Host "   ⚠️  CORS check failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# SUMMARY
# ============================================================================

Write-Host "================================" -ForegroundColor Cyan
Write-Host "📊 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor Red
Write-Host ""

if ($failed -eq 0) {
    Write-Host "🎉 ALL TESTS PASSED! Backend is working correctly." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Test Google Login on frontend" -ForegroundColor Gray
    Write-Host "  2. Test Student Registration" -ForegroundColor Gray
    Write-Host "  3. Test Exam Application" -ForegroundColor Gray
    Write-Host "  4. Test Payment Gateway" -ForegroundColor Gray
} else {
    Write-Host "⚠️  Some tests failed. Check the errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Cyan
    Write-Host "  1. Make sure .env file is in /home/u441114691/nodejs/" -ForegroundColor Gray
    Write-Host "  2. Restart Node.js app in Hostinger cPanel" -ForegroundColor Gray
    Write-Host "  3. Wait 30 seconds for app to fully start" -ForegroundColor Gray
    Write-Host "  4. Check MySQL database is accessible" -ForegroundColor Gray
    Write-Host "  5. Verify DATABASE_URL in .env file" -ForegroundColor Gray
}

Write-Host ""
