#!/usr/bin/env pwsh
<#
.DESCRIPTION
  Comprehensive end-to-end testing with multiple users and roles
  Tests frontend UI, backend APIs, and full user flows
#>

param(
  [string]$Domain = "https://hsc-exam-form.hisofttechnology.com",
  [int]$Delay = 2000  # Delay between requests in ms
)

$ErrorActionPreference = "SilentlyContinue"
$Results = @()
$UserTests = @()

function Write-Section($Title, $Number) {
  Write-Host "`n[$Number/8] $Title" -ForegroundColor Magenta
  Write-Host ("-" * 70)
}

function Test-Endpoint($Method, $Path, $Description, $Body = $null, $Headers = @{}) {
  $url = "$Domain$Path"
  
  try {
    $params = @{
      Uri              = $url
      Method           = $Method
      TimeoutSec       = 10
      SkipHttpErrorCheck = $true
      ContentType      = "application/json"
    }

    if ($Body) {
      $params["Body"] = ($Body | ConvertTo-Json)
    }

    if ($Headers.Count -gt 0) {
      $params["Headers"] = $Headers
    }

    $response = Invoke-WebRequest @params
    $statusCode = $response.StatusCode

    $status = if ($statusCode -eq 200 -or $statusCode -eq 201) { "✓" }
              elseif ($statusCode -eq 401 -or $statusCode -eq 403) { "⚠" }
              else { "✗" }

    Write-Host "$status $Method $Path → $statusCode"

    $content = $null
    try {
      $content = $response.Content | ConvertFrom-Json
    } catch {
      $content = $response.Content.Substring(0, [Math]::Min(100, $response.Content.Length))
    }

    $Results += @{
      Test   = $Description
      Path   = $Path
      Method = $Method
      Status = $statusCode
      Body   = $content
    }

    return @{ Code = $statusCode; Body = $content }
  } catch {
    Write-Host "✗ $Method $Path → ERROR: $($_.Exception.Message)"
    $Results += @{
      Test   = $Description
      Path   = $Path
      Status = "ERROR"
      Error  = $_.Exception.Message
    }
    return @{ Code = 0; Body = $null }
  }
}

function Test-Login($Email, $Password, $Description) {
  Write-Host "`n  Testing: $Description"
  Write-Host "  Email: $Email" -ForegroundColor Gray

  $body = @{
    email    = $Email
    password = $Password
  }

  $result = Test-Endpoint "POST" "/api/auth/login" "Login: $Description" $body
  
  if ($result.Code -eq 200) {
    Write-Host "  ✓ Login successful" -ForegroundColor Green
    if ($result.Body.token) {
      Write-Host "  Token: $($result.Body.token.Substring(0, 20))..." -ForegroundColor Gray
      $UserTests += @{
        Description = $Description
        Email       = $Email
        Token       = $result.Body.token
        Status      = "SUCCESS"
      }
      return $result.Body.token
    }
  } else {
    Write-Host "  ✗ Login failed (Status: $($result.Code))" -ForegroundColor Red
    $UserTests += @{
      Description = $Description
      Email       = $Email
      Status      = "FAILED"
    }
  }
  
  return $null
}

function Test-AuthenticatedEndpoint($Token, $Method, $Path, $Description) {
  $headers = @{ "Authorization" = "Bearer $Token" }
  return Test-Endpoint $Method $Path $Description $null $headers
}

# Main Testing
Write-Host "`n" + "=" * 70 -ForegroundColor Cyan
Write-Host "  HSC EXAM SYSTEM - COMPREHENSIVE E2E TEST" -ForegroundColor Cyan
Write-Host "  Frontend + Backend + Multiple Users" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Domain: $Domain`n" -ForegroundColor Yellow

# Section 1: Frontend
Write-Section "FRONTEND LOADING" 1

Write-Host "Testing HTML delivery..."
Test-Endpoint "GET" "/" "Frontend Home" | Out-Null
Start-Sleep -Milliseconds $Delay

# Section 2: Static Assets
Write-Section "STATIC ASSETS" 2

Write-Host "Testing CSS and JavaScript bundles..."
$response = Invoke-WebRequest -Uri "$Domain/" -SkipHttpErrorCheck
$html = $response.Content

$cssMatches = [regex]::Matches($html, 'href="([^"]*\.css)"')
$jsMatches = [regex]::Matches($html, 'src="([^"]*\.js)"')

Write-Host "Found CSS files: $($cssMatches.Count)"
Write-Host "Found JS files: $($jsMatches.Count)"

# Test a few bundles
if ($cssMatches.Count -gt 0) {
  $cssFile = $cssMatches[0].Groups[1].Value
  Write-Host "Testing CSS: $cssFile"
  Test-Endpoint "GET" $cssFile "CSS Bundle" | Out-Null
  Start-Sleep -Milliseconds $Delay
}

if ($jsMatches.Count -gt 0) {
  $jsFile = $jsMatches[0].Groups[1].Value
  Write-Host "Testing JS: $jsFile"
  Test-Endpoint "GET" $jsFile "JS Bundle" | Out-Null
  Start-Sleep -Milliseconds $Delay
}

# Section 3: Backend Health
Write-Section "BACKEND HEALTH CHECK" 3

Write-Host "Checking backend service status..."
$health = Test-Endpoint "GET" "/api/health" "Backend Health"
if ($health.Code -eq 200) {
  Write-Host "  Service: $($health.Body.service)" -ForegroundColor Gray
  Write-Host "  Version: $($health.Body.version)" -ForegroundColor Gray
  Write-Host "  Uptime: $($health.Body.uptimeSeconds)s" -ForegroundColor Gray
}
Start-Sleep -Milliseconds $Delay

# Section 4: Public APIs
Write-Section "PUBLIC APIs (No Auth Required)" 4

Write-Host "Testing public endpoints..."
Test-Endpoint "GET" "/api/public/exams" "Get Exams" | Out-Null
Start-Sleep -Milliseconds $Delay

Test-Endpoint "GET" "/api/public/colleges" "Get Colleges" | Out-Null
Start-Sleep -Milliseconds $Delay

Test-Endpoint "GET" "/api/public/streams" "Get Streams" | Out-Null
Start-Sleep -Milliseconds $Delay

# Section 5: Authentication
Write-Section "AUTHENTICATION & LOGIN" 5

Write-Host "Testing user authentication..."
Write-Host ""

# Test Student Login
$studentToken = Test-Login "student@example.com" "password123" "Student Account"
Start-Sleep -Milliseconds $Delay

# Test Admin Login
$adminToken = Test-Login "admin@hisofttechnology.com" "admin123" "Admin Account"
Start-Sleep -Milliseconds $Delay

# Test College Admin Login
$collegeAdminToken = Test-Login "college@example.com" "password123" "College Admin Account"
Start-Sleep -Milliseconds $Delay

# Section 6: Authenticated Endpoints - Student
if ($studentToken) {
  Write-Section "STUDENT AUTHENTICATED ENDPOINTS" 6

  Write-Host "Testing student-specific endpoints..."
  Test-AuthenticatedEndpoint $studentToken "GET" "/api/me" "Get Student Profile" | Out-Null
  Start-Sleep -Milliseconds $Delay

  Test-AuthenticatedEndpoint $studentToken "GET" "/api/applications" "Get Applications" | Out-Null
  Start-Sleep -Milliseconds $Delay

  Test-AuthenticatedEndpoint $studentToken "GET" "/api/exams" "Get Exams (Auth)" | Out-Null
  Start-Sleep -Milliseconds $Delay
} else {
  Write-Section "STUDENT AUTHENTICATED ENDPOINTS" 6
  Write-Host "⚠ Skipped: Student login failed" -ForegroundColor Yellow
}

# Section 7: Authenticated Endpoints - Admin
if ($adminToken) {
  Write-Section "ADMIN AUTHENTICATED ENDPOINTS" 7

  Write-Host "Testing admin-specific endpoints..."
  Test-AuthenticatedEndpoint $adminToken "GET" "/api/me" "Get Admin Profile" | Out-Null
  Start-Sleep -Milliseconds $Delay

  Test-AuthenticatedEndpoint $adminToken "GET" "/api/institutes" "Get Institutes" | Out-Null
  Start-Sleep -Milliseconds $Delay

  Test-AuthenticatedEndpoint $adminToken "GET" "/api/news" "Get News" | Out-Null
  Start-Sleep -Milliseconds $Delay
} else {
  Write-Section "ADMIN AUTHENTICATED ENDPOINTS" 7
  Write-Host "⚠ Skipped: Admin login failed" -ForegroundColor Yellow
}

# Section 8: Summary
Write-Section "TEST SUMMARY" 8

$successfulAPIs = @($Results | Where-Object { $_.Status -eq 200 }).Count
$unauthAPIs = @($Results | Where-Object { $_.Status -eq 401 }).Count
$failedAPIs = @($Results | Where-Object { $_.Status -ge 400 -and $_.Status -ne 401 }).Count
$errorAPIs = @($Results | Where-Object { $_.Status -eq "ERROR" }).Count

Write-Host "`nAPI Results:" -ForegroundColor Cyan
Write-Host "  ✓ Successful: $successfulAPIs" -ForegroundColor Green
Write-Host "  ⚠ Unauthorized: $unauthAPIs" -ForegroundColor Yellow
Write-Host "  ✗ Failed: $failedAPIs" -ForegroundColor Red
Write-Host "  ◉ Errors: $errorAPIs" -ForegroundColor DarkRed

Write-Host "`nUser Authentication Results:" -ForegroundColor Cyan
$UserTests | ForEach-Object {
  $icon = if ($_.Status -eq "SUCCESS") { "✓" } else { "✗" }
  $color = if ($_.Status -eq "SUCCESS") { "Green" } else { "Red" }
  Write-Host "  $icon $($_.Description): $($_.Status)" -ForegroundColor $color
}

# Overall Summary
Write-Host "`n" + "=" * 70
if ($failedAPIs -eq 0 -and $errorAPIs -eq 0 -and $successfulAPIs -gt 10) {
  Write-Host "✓ SYSTEM READY FOR PRODUCTION" -ForegroundColor Green
  Write-Host "All critical endpoints working with proper authentication" -ForegroundColor Green
} elseif ($errorAPIs -gt 0) {
  Write-Host "⚠ CRITICAL ISSUES FOUND" -ForegroundColor Red
  Write-Host "Fix returned errors before using in production" -ForegroundColor Red
} else {
  Write-Host "⚠ SOME ISSUES FOUND" -ForegroundColor Yellow
  Write-Host "Review failed endpoints above" -ForegroundColor Yellow
}
Write-Host "=" * 70 + "`n"
