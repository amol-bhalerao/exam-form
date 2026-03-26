# API Testing Script for HSC Exam Application
$baseUrl = "http://localhost:3000/api"

Write-Host "========== HSC EXAM API Testing ==========" -ForegroundColor Cyan
Write-Host "Testing Backend APIs at $baseUrl" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "[1/10] Testing Health Check..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Health Check: OK" -ForegroundColor Green
    Write-Host "  Service: $($data.service)" -ForegroundColor Gray
    Write-Host "  Version: $($data.version)" -ForegroundColor Gray
} else {
    Write-Host "✗ Health Check Failed" -ForegroundColor Red
}

# Test 2: Master Data - Boards
Write-Host ""
Write-Host "[2/10] Testing Master Data - Boards..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/public/boards" -Method GET -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Boards Endpoint: OK" -ForegroundColor Green
    Write-Host "  Boards found: $($data.boards.Count)" -ForegroundColor Gray
} else {
    Write-Host "✗ Boards Endpoint Failed: $($response.StatusCode)" -ForegroundColor Red
}

# Test 3: Master Data - Streams
Write-Host ""
Write-Host "[3/10] Testing Master Data - Streams..." -ForegroundColor Yellow  
$response = Invoke-WebRequest -Uri "$baseUrl/public/streams" -Method GET -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Streams Endpoint: OK" -ForegroundColor Green
    Write-Host "  Streams found: $($data.streams.Count)" -ForegroundColor Gray
} else {
    Write-Host "✗ Streams Endpoint Failed: $($response.StatusCode)" -ForegroundColor Red
}

# Test 4: Master Data - Subjects
Write-Host ""
Write-Host "[4/10] Testing Master Data - Subjects..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/public/subjects" -Method GET -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Subjects Endpoint: OK" -ForegroundColor Green
    Write-Host "  Subjects found: $($data.subjects.Count)" -ForegroundColor Gray
} else {
    Write-Host "✗ Subjects Endpoint Failed: $($response.StatusCode)" -ForegroundColor Red
}

# Test 5: Institutes Listing
Write-Host ""
Write-Host "[5/10] Testing Institutes Listing..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/institutes?limit=10" -Method GET -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Institutes Endpoint: OK" -ForegroundColor Green
    Write-Host "  Institutes found: $($data.institutes.Count)" -ForegroundColor Gray
} else {
    Write-Host "✗ Institutes Endpoint Failed: $($response.StatusCode)" -ForegroundColor Red
}

# Test 6: Exams Listing
Write-Host ""
Write-Host "[6/10] Testing Exams Listing..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/exams?limit=10" -Method GET -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Exams Endpoint: OK" -ForegroundColor Green
    Write-Host "  Exams found: $($data.exams.Count)" -ForegroundColor Gray
} else {
    Write-Host "✗ Exams Endpoint Failed: $($response.StatusCode)" -ForegroundColor Red
}

# Test 7: News Listing
Write-Host ""
Write-Host "[7/10] Testing News..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/news?limit=5" -Method GET -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ News Endpoint: OK" -ForegroundColor Green
    Write-Host "  News items found: $($data.news.Count)" -ForegroundColor Gray
} else {
    Write-Host "✗ News Endpoint Failed: $($response.StatusCode)" -ForegroundColor Red
}

# Test 8: Teachers Listing
Write-Host ""
Write-Host "[8/10] Testing Teachers..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/public/teachers?limit=5" -Method GET -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✓ Teachers Endpoint: OK" -ForegroundColor Green
    Write-Host "  Teachers found: $($data.teachers.Count)" -ForegroundColor Gray
} elseif ($response.StatusCode -eq 404) {
    Write-Host "⚠ Teachers Endpoint: 404 (not found)" -ForegroundColor Yellow
} else {
    Write-Host "✗ Teachers Endpoint Failed: $($response.StatusCode)" -ForegroundColor Red
}

# Test 9: Database Check
Write-Host ""
Write-Host "[9/10] Testing Database Connection..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/public/boards" -Method GET -ErrorAction SilentlyContinue
if ($response.StatusCode -eq 200) {
    $data = $response.Content | ConvertFrom-Json
    if ($data.boards.Count -gt 0) {
        Write-Host "✓ Database: Connected & Data Present" -ForegroundColor Green
    } else {
        Write-Host "⚠ Database: Connected but No Data" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ Database: Connection Failed" -ForegroundColor Red
}

# Test 10: API Response Headers
Write-Host ""
Write-Host "[10/10] Testing API Response Headers..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -ErrorAction SilentlyContinue
if ($response.Headers) {
    Write-Host "✓ API Headers: Present" -ForegroundColor Green
    Write-Host "  Content-Type: $($response.Headers['Content-Type'])" -ForegroundColor Gray
    Write-Host "  Server: $($response.Headers['Server'])" -ForegroundColor Gray
    if ($response.Headers['X-Request-Id']) {
        Write-Host "  Request-ID: $($response.Headers['X-Request-Id'])" -ForegroundColor Gray
    }
} else {
    Write-Host "✗ API Headers: Missing" -ForegroundColor Red
}

Write-Host ""
Write-Host "========== API Testing Complete ==========" -ForegroundColor Cyan
Write-Host "All critical endpoints tested." -ForegroundColor Green
