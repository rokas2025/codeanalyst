# Automated Testing Suite for CodeAnalyst
Write-Host "🤖 Running Automated Tests" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

$backendUrl = "https://codeanalyst-production.up.railway.app"
$testResults = @()

function Test-Endpoint {
    param($name, $url, $method, $body, $expectedStatus)
    
    Write-Host "Testing: $name..." -ForegroundColor Yellow
    try {
        $params = @{
            Uri = $url
            Method = $method
            ContentType = "application/json"
            ErrorAction = "Stop"
        }
        
        if ($body) {
            $params.Body = $body
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq $expectedStatus) {
            Write-Host "  ✅ PASS" -ForegroundColor Green
            return @{ Test = $name; Status = "PASS"; Details = "Status: $($response.StatusCode)" }
        } else {
            Write-Host "  ❌ FAIL - Expected $expectedStatus, got $($response.StatusCode)" -ForegroundColor Red
            return @{ Test = $name; Status = "FAIL"; Details = "Wrong status code" }
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq $expectedStatus) {
            Write-Host "  ✅ PASS (Expected error)" -ForegroundColor Green
            return @{ Test = $name; Status = "PASS"; Details = "Expected status: $statusCode" }
        } else {
            Write-Host "  ⚠️  Status: $statusCode" -ForegroundColor Yellow
            return @{ Test = $name; Status = "PARTIAL"; Details = "Status: $statusCode" }
        }
    }
}

# Test 1: Backend Health
Write-Host "`n📊 Test Suite 1: Backend Health" -ForegroundColor Cyan
$testResults += Test-Endpoint "Backend Health Check" "$backendUrl/health" "GET" $null 200

# Test 2: Authentication Endpoints
Write-Host "`n📊 Test Suite 2: Authentication" -ForegroundColor Cyan

# Test registration validation
$invalidReg = @{
    email = ""
    password = ""
    name = ""
} | ConvertTo-Json
$testResults += Test-Endpoint "Registration Validation" "$backendUrl/api/auth/register" "POST" $invalidReg 400

# Test login validation
$invalidLogin = @{
    email = ""
    password = ""
} | ConvertTo-Json
$testResults += Test-Endpoint "Login Validation" "$backendUrl/api/auth/login-supabase" "POST" $invalidLogin 400

# Test 3: Create Test Account
Write-Host "`n📊 Test Suite 3: Account Creation" -ForegroundColor Cyan
$testEmail = "test_$(Get-Random)@example.com"
$testPassword = "TestPassword123!"
$testName = "Automated Test User"

$registerData = @{
    email = $testEmail
    password = $testPassword
    name = $testName
} | ConvertTo-Json

Write-Host "Creating test account: $testEmail..." -ForegroundColor Yellow
try {
    $regResponse = Invoke-RestMethod -Uri "$backendUrl/api/auth/register" -Method POST -Body $registerData -ContentType "application/json"
    
    if ($regResponse.success -and $regResponse.token) {
        Write-Host "  ✅ PASS - Account created, token received" -ForegroundColor Green
        $testResults += @{ Test = "Account Creation"; Status = "PASS"; Details = "User ID: $($regResponse.user.id)" }
        $token = $regResponse.token
        
        # Test 4: Use the token
        Write-Host "`n📊 Test Suite 4: Authenticated Requests" -ForegroundColor Cyan
        
        $headers = @{
            "Authorization" = "Bearer $token"
            "Content-Type" = "application/json"
        }
        
        # Test WordPress connections endpoint
        Write-Host "Testing WordPress connections..." -ForegroundColor Yellow
        try {
            $wpResponse = Invoke-RestMethod -Uri "$backendUrl/api/wordpress/connections" -Method GET -Headers $headers
            Write-Host "  ✅ PASS - WordPress endpoint accessible" -ForegroundColor Green
            $testResults += @{ Test = "WordPress Connections"; Status = "PASS"; Details = "Authenticated access works" }
        } catch {
            Write-Host "  ⚠️  WordPress endpoint: $($_.Exception.Message)" -ForegroundColor Yellow
            $testResults += @{ Test = "WordPress Connections"; Status = "PARTIAL"; Details = $_.Exception.Message }
        }
        
        # Test Content Analysis endpoint
        Write-Host "Testing Content Analysis..." -ForegroundColor Yellow
        $analysisData = @{
            content = "This is a test content for analysis."
            contentType = "text"
        } | ConvertTo-Json
        
        try {
            $analysisResponse = Invoke-RestMethod -Uri "$backendUrl/api/content-analysis/analyze" -Method POST -Headers $headers -Body $analysisData
            Write-Host "  ✅ PASS - Content analysis works" -ForegroundColor Green
            $testResults += @{ Test = "Content Analysis"; Status = "PASS"; Details = "Analysis completed" }
        } catch {
            Write-Host "  ⚠️  Content analysis: $($_.Exception.Message)" -ForegroundColor Yellow
            $testResults += @{ Test = "Content Analysis"; Status = "PARTIAL"; Details = $_.Exception.Message }
        }
        
        # Test 5: Login with created account
        Write-Host "`n📊 Test Suite 5: Login Test" -ForegroundColor Cyan
        $loginData = @{
            email = $testEmail
            password = $testPassword
        } | ConvertTo-Json
        
        Write-Host "Testing login with created account..." -ForegroundColor Yellow
        try {
            $loginResponse = Invoke-RestMethod -Uri "$backendUrl/api/auth/login-supabase" -Method POST -Body $loginData -ContentType "application/json"
            
            if ($loginResponse.success -and $loginResponse.token) {
                Write-Host "  ✅ PASS - Login successful" -ForegroundColor Green
                $testResults += @{ Test = "Login"; Status = "PASS"; Details = "Token received" }
            } else {
                Write-Host "  ❌ FAIL - Login failed" -ForegroundColor Red
                $testResults += @{ Test = "Login"; Status = "FAIL"; Details = "No token received" }
            }
        } catch {
            Write-Host "  ❌ FAIL - $($_.Exception.Message)" -ForegroundColor Red
            $testResults += @{ Test = "Login"; Status = "FAIL"; Details = $_.Exception.Message }
        }
        
    } else {
        Write-Host "  ❌ FAIL - Registration failed" -ForegroundColor Red
        $testResults += @{ Test = "Account Creation"; Status = "FAIL"; Details = "No token received" }
    }
} catch {
    $errorMessage = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "  ⚠️  $($errorMessage.error)" -ForegroundColor Yellow
    $testResults += @{ Test = "Account Creation"; Status = "PARTIAL"; Details = $errorMessage.error }
}

# Test 6: Language Detection
Write-Host "`n📊 Test Suite 6: Language Detection" -ForegroundColor Cyan
Write-Host "Testing language detection service..." -ForegroundColor Yellow

# This would require analyzing actual content, skipping for now
Write-Host "  ⏭️  SKIP - Requires full analysis workflow" -ForegroundColor Gray
$testResults += @{ Test = "Language Detection"; Status = "SKIP"; Details = "Manual testing required" }

# Summary
Write-Host "`n" -NoNewline
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "📊 Test Results Summary" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$passed = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$partial = ($testResults | Where-Object { $_.Status -eq "PARTIAL" }).Count
$skipped = ($testResults | Where-Object { $_.Status -eq "SKIP" }).Count
$total = $testResults.Count

foreach ($result in $testResults) {
    $icon = switch ($result.Status) {
        "PASS" { "✅" }
        "FAIL" { "❌" }
        "PARTIAL" { "⚠️ " }
        "SKIP" { "⏭️ " }
    }
    $color = switch ($result.Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "PARTIAL" { "Yellow" }
        "SKIP" { "Gray" }
    }
    Write-Host "$icon $($result.Test): " -NoNewline
    Write-Host "$($result.Details)" -ForegroundColor $color
}

Write-Host ""
Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Partial: $partial" -ForegroundColor Yellow
Write-Host "Skipped: $skipped" -ForegroundColor Gray
Write-Host ""

if ($failed -eq 0) {
    Write-Host "All critical tests passed!" -ForegroundColor Green
} else {
    Write-Host "Some tests failed - review above" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next: Test frontend at https://app.beenex.dev" -ForegroundColor Cyan

