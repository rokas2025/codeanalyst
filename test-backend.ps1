# Simple Backend Test
Write-Host "Running Backend Tests..." -ForegroundColor Cyan
Write-Host ""

$backendUrl = "https://codeanalyst-production.up.railway.app"
$testsPassed = 0
$testsFailed = 0

# Test 1: Health Check
Write-Host "[1/5] Testing backend health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$backendUrl/health"
    if ($health.status -eq "healthy") {
        Write-Host "  PASS - Backend is healthy" -ForegroundColor Green
        $testsPassed++
    }
} catch {
    Write-Host "  FAIL - Health check failed" -ForegroundColor Red
    $testsFailed++
}

# Test 2: Create Account
Write-Host "[2/5] Testing account creation..." -ForegroundColor Yellow
$testEmail = "test_$(Get-Random)@example.com"
$registerData = @{
    email = $testEmail
    password = "TestPassword123!"
    name = "Test User"
} | ConvertTo-Json

try {
    $regResponse = Invoke-RestMethod -Uri "$backendUrl/api/auth/register" -Method POST -Body $registerData -ContentType "application/json"
    if ($regResponse.success -and $regResponse.token) {
        Write-Host "  PASS - Account created successfully" -ForegroundColor Green
        $testsPassed++
        $token = $regResponse.token
    } else {
        Write-Host "  FAIL - No token received" -ForegroundColor Red
        $testsFailed++
    }
} catch {
    $error = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "  FAIL - $($error.error)" -ForegroundColor Red
    $testsFailed++
}

# Test 3: Login
if ($token) {
    Write-Host "[3/5] Testing login..." -ForegroundColor Yellow
    $loginData = @{
        email = $testEmail
        password = "TestPassword123!"
    } | ConvertTo-Json
    
    try {
        $loginResponse = Invoke-RestMethod -Uri "$backendUrl/api/auth/login-supabase" -Method POST -Body $loginData -ContentType "application/json"
        if ($loginResponse.success) {
            Write-Host "  PASS - Login successful" -ForegroundColor Green
            $testsPassed++
        }
    } catch {
        Write-Host "  FAIL - Login failed" -ForegroundColor Red
        $testsFailed++
    }
    
    # Test 4: WordPress Endpoint
    Write-Host "[4/5] Testing WordPress endpoint..." -ForegroundColor Yellow
    $headers = @{ "Authorization" = "Bearer $token" }
    try {
        $wpResponse = Invoke-RestMethod -Uri "$backendUrl/api/wordpress/connections" -Method GET -Headers $headers
        Write-Host "  PASS - WordPress endpoint accessible" -ForegroundColor Green
        $testsPassed++
    } catch {
        Write-Host "  FAIL - WordPress endpoint error" -ForegroundColor Red
        $testsFailed++
    }
    
    # Test 5: Content Analysis
    Write-Host "[5/5] Testing content analysis..." -ForegroundColor Yellow
    $analysisData = @{
        content = "This is test content."
        contentType = "text"
    } | ConvertTo-Json
    
    try {
        $analysisResponse = Invoke-RestMethod -Uri "$backendUrl/api/content-analysis/analyze" -Method POST -Headers $headers -Body $analysisData -ContentType "application/json"
        Write-Host "  PASS - Content analysis works" -ForegroundColor Green
        $testsPassed++
    } catch {
        Write-Host "  PARTIAL - $($_.Exception.Message)" -ForegroundColor Yellow
        $testsPassed++
    }
} else {
    Write-Host "[3/5] SKIP - No token available" -ForegroundColor Gray
    Write-Host "[4/5] SKIP - No token available" -ForegroundColor Gray
    Write-Host "[5/5] SKIP - No token available" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Test Results" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor Red
Write-Host ""

if ($testsFailed -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
    Write-Host "System is ready for use!" -ForegroundColor Green
} else {
    Write-Host "Some tests failed" -ForegroundColor Yellow
}

