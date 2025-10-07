# CodeAnalyst Comprehensive Module Testing Script
# Tests all backend endpoints and features

$BaseURL = "https://codeanalyst-production.up.railway.app/api"
$TestResults = @()

Write-Host "=== CodeAnalyst Module Testing ===" -ForegroundColor Cyan
Write-Host "API Base: $BaseURL" -ForegroundColor Gray
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseURL/health" -Method GET -ErrorAction Stop
    if ($response.status -eq "healthy") {
        Write-Host "✅ Health check passed" -ForegroundColor Green
        $TestResults += @{Test="Health Check"; Status="PASS"; Details=$response.status}
    } else {
        Write-Host "⚠️ Health check returned unexpected status" -ForegroundColor Yellow
        $TestResults += @{Test="Health Check"; Status="WARN"; Details=$response.status}
    }
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    $TestResults += @{Test="Health Check"; Status="FAIL"; Details=$_.Exception.Message}
}

# Test 2: Templates Endpoint (requires auth)
Write-Host "`nTest 2: Content Templates" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BaseURL/templates" -Method GET -ErrorAction Stop
    if ($response.success) {
        Write-Host "✅ Templates endpoint accessible" -ForegroundColor Green
        Write-Host "   Found $($response.templates.Count) templates" -ForegroundColor Gray
        $TestResults += @{Test="Templates"; Status="PASS"; Details="$($response.templates.Count) templates"}
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "⚠️ Templates requires authentication (expected)" -ForegroundColor Yellow
        $TestResults += @{Test="Templates"; Status="AUTH_REQUIRED"; Details="401 Unauthorized"}
    } else {
        Write-Host "❌ Templates failed: $($_.Exception.Message)" -ForegroundColor Red
        $TestResults += @{Test="Templates"; Status="FAIL"; Details=$_.Exception.Message}
    }
}

# Test 3: Readability Service (POST requires auth)
Write-Host "`nTest 3: Readability Analysis" -ForegroundColor Yellow
try {
    $testBody = @{
        content = "This is a test sentence for readability analysis. It should provide some basic metrics."
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BaseURL/readability/analyze" -Method POST -Body $testBody -ContentType "application/json" -ErrorAction Stop
    if ($response.success) {
        Write-Host "✅ Readability analysis works" -ForegroundColor Green
        Write-Host "   Flesch Score: $($response.scores.fleschReadingEase.score)" -ForegroundColor Gray
        $TestResults += @{Test="Readability"; Status="PASS"; Details="Flesch: $($response.scores.fleschReadingEase.score)"}
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "⚠️ Readability requires authentication" -ForegroundColor Yellow
        $TestResults += @{Test="Readability"; Status="AUTH_REQUIRED"; Details="401 Unauthorized"}
    } else {
        Write-Host "❌ Readability failed: $($_.Exception.Message)" -ForegroundColor Red
        $TestResults += @{Test="Readability"; Status="FAIL"; Details=$_.Exception.Message}
    }
}

# Test 4: PageSpeed Service
Write-Host "`nTest 4: PageSpeed Analysis" -ForegroundColor Yellow
try {
    $testBody = @{
        url = "https://example.com"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BaseURL/url-analysis/pagespeed" -Method POST -Body $testBody -ContentType "application/json" -ErrorAction Stop
    if ($response.success) {
        Write-Host "✅ PageSpeed analysis works" -ForegroundColor Green
        $TestResults += @{Test="PageSpeed"; Status="PASS"; Details="Analysis completed"}
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "⚠️ PageSpeed requires authentication" -ForegroundColor Yellow
        $TestResults += @{Test="PageSpeed"; Status="AUTH_REQUIRED"; Details="401 Unauthorized"}
    } else {
        Write-Host "❌ PageSpeed failed: $($_.Exception.Message)" -ForegroundColor Red
        $TestResults += @{Test="PageSpeed"; Status="FAIL"; Details=$_.Exception.Message}
    }
}

# Test 5: Chat Endpoint
Write-Host "`nTest 5: AI Chat" -ForegroundColor Yellow
try {
    $testBody = @{
        messages = @(
            @{role="user"; content="Hello, test message"}
        )
    } | ConvertTo-Json -Depth 3
    
    $response = Invoke-RestMethod -Uri "$BaseURL/chat" -Method POST -Body $testBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "✅ Chat endpoint works" -ForegroundColor Green
    $TestResults += @{Test="Chat"; Status="PASS"; Details="Response received"}
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "⚠️ Chat requires authentication" -ForegroundColor Yellow
        $TestResults += @{Test="Chat"; Status="AUTH_REQUIRED"; Details="401 Unauthorized"}
    } else {
        Write-Host "❌ Chat failed: $($_.Exception.Message)" -ForegroundColor Red
        $TestResults += @{Test="Chat"; Status="FAIL"; Details=$_.Exception.Message}
    }
}

# Test 6: URL Analysis
Write-Host "`nTest 6: URL Analysis" -ForegroundColor Yellow
try {
    $testBody = @{
        url = "https://example.com"
        options = @{
            deepAnalysis = $false
        }
    } | ConvertTo-Json -Depth 3
    
    $response = Invoke-RestMethod -Uri "$BaseURL/url-analysis/analyze" -Method POST -Body $testBody -ContentType "application/json" -ErrorAction Stop
    if ($response.success) {
        Write-Host "✅ URL Analysis works" -ForegroundColor Green
        $TestResults += @{Test="URL Analysis"; Status="PASS"; Details="Analysis started"}
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "⚠️ URL Analysis requires authentication" -ForegroundColor Yellow
        $TestResults += @{Test="URL Analysis"; Status="AUTH_REQUIRED"; Details="401 Unauthorized"}
    } elseif ($_.Exception.Response.StatusCode -eq 500) {
        Write-Host "❌ URL Analysis returned 500 error (server issue)" -ForegroundColor Red
        $TestResults += @{Test="URL Analysis"; Status="FAIL"; Details="500 Internal Server Error"}
    } else {
        Write-Host "❌ URL Analysis failed: $($_.Exception.Message)" -ForegroundColor Red
        $TestResults += @{Test="URL Analysis"; Status="FAIL"; Details=$_.Exception.Message}
    }
}

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
$PassCount = ($TestResults | Where-Object {$_.Status -eq "PASS"}).Count
$FailCount = ($TestResults | Where-Object {$_.Status -eq "FAIL"}).Count
$AuthCount = ($TestResults | Where-Object {$_.Status -eq "AUTH_REQUIRED"}).Count
$WarnCount = ($TestResults | Where-Object {$_.Status -eq "WARN"}).Count

Write-Host "Total Tests: $($TestResults.Count)" -ForegroundColor Gray
Write-Host "✅ Passed: $PassCount" -ForegroundColor Green
Write-Host "❌ Failed: $FailCount" -ForegroundColor Red
Write-Host "🔐 Auth Required: $AuthCount" -ForegroundColor Yellow
Write-Host "⚠️  Warnings: $WarnCount" -ForegroundColor Yellow

Write-Host "`nDetailed Results:" -ForegroundColor Cyan
foreach ($result in $TestResults) {
    $color = switch ($result.Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "AUTH_REQUIRED" { "Yellow" }
        "WARN" { "Yellow" }
        default { "Gray" }
    }
    Write-Host "  $($result.Test): $($result.Status) - $($result.Details)" -ForegroundColor $color
}

Write-Host "`n=== Frontend Console Errors ===" -ForegroundColor Cyan
Write-Host "1. Backend URL analysis failed: 500 error" -ForegroundColor Red
Write-Host "   - Likely authentication or database issue" -ForegroundColor Gray
Write-Host "2. Failed to load repositories: Authentication failed" -ForegroundColor Red
Write-Host "   - GitHub auth token may be missing or invalid" -ForegroundColor Gray

Write-Host "`n=== Recommendations ===" -ForegroundColor Cyan
if ($FailCount -gt 0) {
    Write-Host "⚠️  Some tests failed. Check Railway logs:" -ForegroundColor Yellow
    Write-Host "   railway logs" -ForegroundColor Gray
}
if ($AuthCount -gt 0) {
    Write-Host "🔐 Most endpoints require authentication" -ForegroundColor Yellow
    Write-Host "   Test with valid JWT token for full testing" -ForegroundColor Gray
}

Write-Host "`n✅ Testing complete! Check results above." -ForegroundColor Green
