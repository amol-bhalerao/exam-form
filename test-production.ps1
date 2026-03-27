#!/usr/bin/env pwsh
<#
.DESCRIPTION
  Comprehensive end-to-end testing of the HSC Exam System on production
  Tests frontend loading, backend connectivity, API responses, and basic flows
#>

param(
  [string]$Domain = "https://hsc-exam-form.hisofttechnology.com"
)

$Results = @()

function Test-Http($url, $description) {
  Write-Host "Testing: $description" -ForegroundColor Cyan
  Write-Host "  URL: $url"
  
  try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -SkipHttpErrorCheck
    $statusCode = $response.StatusCode
    $statusDesc = [System.Net.HttpStatusCode]$statusCode
    
    if ($statusCode -eq 200) {
      Write-Host "  ✓ Status: $statusCode $statusDesc" -ForegroundColor Green
      $Results += @{ Test = $description; Status = "PASS"; Code = $statusCode }
      return $true
    } elseif ($statusCode -ge 400 -and $statusCode -lt 500) {
      Write-Host "  ✗ Status: $statusCode $statusDesc (Client Error)" -ForegroundColor Red
      $Results += @{ Test = $description; Status = "FAIL"; Code = $statusCode }
      return $false
    } else {
      Write-Host "  ⚠ Status: $statusCode $statusDesc" -ForegroundColor Yellow
      $Results += @{ Test = $description; Status = "WARN"; Code = $statusCode }
      return $false
    }
  } catch {
    Write-Host "  ✗ Connection Error: $($_.Exception.Message)" -ForegroundColor Red
    $Results += @{ Test = $description; Status = "ERROR"; Message = $_.Exception.Message }
    return $false
  }
}

function Test-Json($url, $description) {
  Write-Host "Testing: $description" -ForegroundColor Cyan
  Write-Host "  URL: $url"
  
  try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -SkipHttpErrorCheck
    $statusCode = $response.StatusCode
    
    if ($statusCode -eq 200) {
      try {
        $json = $response.Content | ConvertFrom-Json
        Write-Host "  ✓ Status: $statusCode (Valid JSON)" -ForegroundColor Green
        Write-Host "  Response: $($json | ConvertTo-Json -Compress)" -ForegroundColor Gray
        $Results += @{ Test = $description; Status = "PASS"; Code = $statusCode }
        return $true
      } catch {
        Write-Host "  ✗ Invalid JSON response" -ForegroundColor Red
        Write-Host "  Response: $($response.Content.Substring(0, [Math]::Min(200, $response.Content.Length)))" -ForegroundColor Gray
        $Results += @{ Test = $description; Status = "FAIL"; Code = $statusCode; Message = "Invalid JSON" }
        return $false
      }
    } else {
      Write-Host "  ✗ Status: $statusCode" -ForegroundColor Red
      $Results += @{ Test = $description; Status = "FAIL"; Code = $statusCode }
      return $false
    }
  } catch {
    Write-Host "  ✗ Connection Error: $($_.Exception.Message)" -ForegroundColor Red
    $Results += @{ Test = $description; Status = "ERROR"; Message = $_.Exception.Message }
    return $false
  }
}

Write-Host "`n" + "=" * 70 -ForegroundColor Cyan
Write-Host "HSC EXAM SYSTEM - END-TO-END PRODUCTION TEST" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "Domain: $Domain`n" -ForegroundColor Yellow

# Test 1: Frontend Loading
Write-Host "`n[1/6] FRONTEND TESTS" -ForegroundColor Magenta
Write-Host "-" * 70

Test-Http "$Domain/" "Frontend Home Page" | Out-Null
Test-Http "$Domain/index.html" "Frontend Index" | Out-Null

# Test 2: Static Assets
Write-Host "`n[2/6] STATIC ASSETS" -ForegroundColor Magenta
Write-Host "-" * 70

Test-Http "$Domain/styles-4HEWXP42.css" "CSS Bundle" | Out-Null
Test-Http "$Domain/main-KZJZLDTO.js" "JavaScript Bundle" | Out-Null

# Test 3: API Health Check
Write-Host "`n[3/6] API HEALTH" -ForegroundColor Magenta
Write-Host "-" * 70

$apiHealth = Test-Json "$Domain/api/health" "API Health Check"

# Test 4: Public API Endpoints
Write-Host "`n[4/6] PUBLIC API ENDPOINTS" -ForegroundColor Magenta
Write-Host "-" * 70

$examsEndpoint = Test-Json "$Domain/api/public/exams" "Get All Exams (Public)"

# Test 5: Authentication
Write-Host "`n[5/6] AUTHENTICATION" -ForegroundColor Magenta
Write-Host "-" * 70

Write-Host "Testing: Auth Route Accessible" -ForegroundColor Cyan
Write-Host "  URL: $Domain/api/auth/login"
try {
  $response = Invoke-WebRequest -Uri "$Domain/api/auth/login" -Method POST -TimeoutSec 10 -SkipHttpErrorCheck -Body @{} -ContentType "application/json"
  Write-Host "  ✓ Auth endpoint responds" -ForegroundColor Green
  $Results += @{ Test = "Auth Route"; Status = "PASS" }
} catch {
  Write-Host "  ⚠ Auth endpoint not responding or requires data: $($_.Exception.Message)" -ForegroundColor Yellow
  $Results += @{ Test = "Auth Route"; Status = "WARN"; Message = $_.Exception.Message }
}

# Test 6: Summary
Write-Host "`n[6/6] TEST SUMMARY" -ForegroundColor Magenta
Write-Host "-" * 70

$passed = @($Results | Where-Object { $_.Status -eq "PASS" }).Count
$failed = @($Results | Where-Object { $_.Status -eq "FAIL" }).Count
$errors = @($Results | Where-Object { $_.Status -eq "ERROR" }).Count
$warns = @($Results | Where-Object { $_.Status -eq "WARN" }).Count
$total = $Results.Count

Write-Host "`nResults:" -ForegroundColor Cyan
Write-Host "  ✓ Passed:  $passed" -ForegroundColor Green
Write-Host "  ✗ Failed:  $failed" -ForegroundColor Red
Write-Host "  ⚠ Warnings: $warns" -ForegroundColor Yellow
Write-Host "  ◉ Errors:  $errors" -ForegroundColor Red

Write-Host "`nDetailed Results:" -ForegroundColor Cyan
$Results | Format-Table @{ Label = "Test"; Expression = { $_.Test } }, @{ Label = "Status"; Expression = { $_.Status }; FormatString = "[0;97m{0}[0m" } -AutoSize

# Overall Status
Write-Host "`n" + "=" * 70
if ($failed -eq 0 -and $errors -eq 0) {
  Write-Host "✓ ALL TESTS PASSED" -ForegroundColor Green
  Write-Host "=" * 70 + "`n"
  exit 0
} elseif ($errors -gt 0) {
  Write-Host "✗ CRITICAL ERRORS - System Not Accessible" -ForegroundColor Red
  Write-Host "=" * 70 + "`n"
  Write-Host "ISSUES FOUND:" -ForegroundColor Red
  @($Results | Where-Object { $_.Status -eq "ERROR" }) | ForEach-Object {
    Write-Host "  • $($_.Test): $($_.Message)" -ForegroundColor Red
  }
  Write-Host ""
  exit 1
} else {
  Write-Host "⚠ TESTS FAILED - Issues Found" -ForegroundColor Yellow
  Write-Host "=" * 70 + "`n"
  Write-Host "FAILED TESTS:" -ForegroundColor Red
  @($Results | Where-Object { $_.Status -eq "FAIL" }) | ForEach-Object {
    Write-Host "  • $($_.Test) (Status: $($_.Code ?? 'N/A'))" -ForegroundColor Red
  }
  Write-Host ""
  exit 1
}
