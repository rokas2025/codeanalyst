# Bot Protection Test Script
# Tests website analysis with stealth plugin against various sites

Write-Host "Testing Bot Protection Bypass with Stealth Plugin" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

$backendUrl = "https://codeanalyst-production.up.railway.app"
$testResults = @()

# Test sites
$testSites = @(
    @{ url = "https://www.zerosum.lt"; name = "ZeroSum (Previously Blocked)"; critical = $true },
    @{ url = "https://www.delfi.lt"; name = "Delfi.lt (Lithuanian News)"; critical = $false },
    @{ url = "https://www.15min.lt"; name = "15min.lt (Lithuanian News)"; critical = $false },
    @{ url = "https://www.google.com"; name = "Google (Regular Site)"; critical = $false }
)

# Get auth token (you'll need to replace this with actual token)
Write-Host "Note: You need a valid auth token to run these tests" -ForegroundColor Yellow
Write-Host "Run the backend test script first to get a token, or login via the frontend" -ForegroundColor Yellow
Write-Host ""
$token = Read-Host "Enter your auth token (or press Enter to skip authenticated tests)"

Write-Host ""
Write-Host "Starting tests..." -ForegroundColor Green
Write-Host ""

foreach ($site in $testSites) {
    Write-Host "[$($testSites.IndexOf($site) + 1)/$($testSites.Count)] Testing: $($site.name)" -ForegroundColor Yellow
    Write-Host "URL: $($site.url)" -ForegroundColor Gray
    
    try {
        $analysisData = @{
            url = $site.url
            aiProfile = "technical"
        } | ConvertTo-Json
        
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($token) {
            $headers["Authorization"] = "Bearer $token"
        }
        
        $startTime = Get-Date
        
        try {
            $response = Invoke-RestMethod -Uri "$backendUrl/api/url-analysis/analyze" -Method POST -Body $analysisData -Headers $headers -ContentType "application/json" -TimeoutSec 120
            
            $duration = ((Get-Date) - $startTime).TotalSeconds
            
            if ($response.success) {
                Write-Host "  PASS - Analysis completed in $([math]::Round($duration, 2))s" -ForegroundColor Green
                Write-Host "  Method: $($response.data.basicData.analysisMethod)" -ForegroundColor Gray
                Write-Host "  Title: $($response.data.basicData.title.Substring(0, [Math]::Min(50, $response.data.basicData.title.Length)))..." -ForegroundColor Gray
                
                $testResults += @{
                    site = $site.name
                    url = $site.url
                    status = "PASS"
                    duration = $duration
                    method = $response.data.basicData.analysisMethod
                    critical = $site.critical
                }
            } else {
                Write-Host "  FAIL - Analysis returned success=false" -ForegroundColor Red
                Write-Host "  Error: $($response.error)" -ForegroundColor Red
                
                $testResults += @{
                    site = $site.name
                    url = $site.url
                    status = "FAIL"
                    error = $response.error
                    critical = $site.critical
                }
            }
        } catch {
            $errorDetails = $_.ErrorDetails.Message
            if ($errorDetails) {
                try {
                    $errorJson = $errorDetails | ConvertFrom-Json
                    $errorMessage = $errorJson.error
                    $errorType = $errorJson.errorDetails.debug_category
                    
                    if ($errorType -eq "navigation" -or $errorType -eq "script_blocked") {
                        Write-Host "  BLOCKED - Bot detection still active" -ForegroundColor Red
                        Write-Host "  Error: $errorMessage" -ForegroundColor Red
                        Write-Host "  Stealth Used: $($errorJson.errorDetails.stealth_mode_used)" -ForegroundColor Gray
                    } else {
                        Write-Host "  ERROR - $errorMessage" -ForegroundColor Red
                    }
                    
                    $testResults += @{
                        site = $site.name
                        url = $site.url
                        status = "BLOCKED"
                        error = $errorMessage
                        errorType = $errorType
                        critical = $site.critical
                    }
                } catch {
                    Write-Host "  ERROR - $errorDetails" -ForegroundColor Red
                    $testResults += @{
                        site = $site.name
                        url = $site.url
                        status = "ERROR"
                        error = $errorDetails
                        critical = $site.critical
                    }
                }
            } else {
                Write-Host "  ERROR - $($_.Exception.Message)" -ForegroundColor Red
                $testResults += @{
                    site = $site.name
                    url = $site.url
                    status = "ERROR"
                    error = $_.Exception.Message
                    critical = $site.critical
                }
            }
        }
    } catch {
        Write-Host "  ERROR - Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{
            site = $site.name
            url = $site.url
            status = "ERROR"
            error = $_.Exception.Message
            critical = $site.critical
        }
    }
    
    Write-Host ""
    Start-Sleep -Seconds 2  # Delay between tests
}

# Summary
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

$passed = ($testResults | Where-Object { $_.status -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.status -eq "FAIL" -or $_.status -eq "BLOCKED" -or $_.status -eq "ERROR" }).Count
$criticalFailed = ($testResults | Where-Object { $_.critical -and ($_.status -ne "PASS") }).Count

Write-Host "Total Tests: $($testResults.Count)" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })
Write-Host "Critical Failures: $criticalFailed" -ForegroundColor $(if ($criticalFailed -gt 0) { "Red" } else { "Green" })
Write-Host ""

# Detailed results
Write-Host "Detailed Results:" -ForegroundColor Cyan
foreach ($result in $testResults) {
    $statusColor = switch ($result.status) {
        "PASS" { "Green" }
        "BLOCKED" { "Yellow" }
        default { "Red" }
    }
    
    Write-Host "  $($result.site): " -NoNewline
    Write-Host "$($result.status)" -ForegroundColor $statusColor
    
    if ($result.method) {
        Write-Host "    Method: $($result.method)" -ForegroundColor Gray
    }
    if ($result.error) {
        Write-Host "    Error: $($result.error)" -ForegroundColor Gray
    }
    if ($result.duration) {
        Write-Host "    Duration: $([math]::Round($result.duration, 2))s" -ForegroundColor Gray
    }
}

Write-Host ""

if ($criticalFailed -eq 0) {
    Write-Host "SUCCESS: All critical tests passed!" -ForegroundColor Green
    Write-Host "The stealth plugin is working effectively." -ForegroundColor Green
} else {
    Write-Host "ATTENTION: Critical test(s) failed" -ForegroundColor Red
    Write-Host "ZeroSum.lt may still be blocking despite stealth mode." -ForegroundColor Yellow
    Write-Host "Consider implementing proxy rotation or additional evasion techniques." -ForegroundColor Yellow
}

