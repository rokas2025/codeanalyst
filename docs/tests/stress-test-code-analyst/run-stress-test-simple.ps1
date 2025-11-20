# Code Analysis Module - Simplified Stress Test Runner
# Full flow testing: Upload ZIP -> Wait for analysis -> Check results

param(
    [int]$ConcurrentUsers = 5,
    [int]$TestDurationSeconds = 180,
    [string]$BackendUrl = "https://codeanalyst-production.up.railway.app/api"
)

$ErrorActionPreference = "Continue"

# Import helper functions
$helperPath = Join-Path $PSScriptRoot "test-helpers.ps1"
. $helperPath

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "     CODE ANALYSIS MODULE - STRESS TEST SUITE" -ForegroundColor Cyan
Write-Host "     ZIP Upload Full Flow Testing" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Configuration:" -ForegroundColor Yellow
Write-Host "  Concurrent Users: $ConcurrentUsers" -ForegroundColor White
Write-Host "  Test Duration: $TestDurationSeconds seconds" -ForegroundColor White
Write-Host "  Backend URL: $BackendUrl" -ForegroundColor White
Write-Host ""

# Set backend URL in helpers
$script:BackendUrl = $BackendUrl

# Phase 1: Setup
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "[PHASE 1/5] SETUP AND PREPARATION" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Check backend connectivity
Write-Host "[1.1] Testing backend connectivity..." -ForegroundColor Yellow
$connectivityTest = Test-BackendConnectivity
if ($connectivityTest.Success) {
    Write-Host "   SUCCESS: Backend is reachable" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Backend is not reachable: $($connectivityTest.Error)" -ForegroundColor Red
    exit 1
}

# Check sample ZIPs
Write-Host ""
Write-Host "[1.2] Checking sample ZIP files..." -ForegroundColor Yellow
$zipDir = Join-Path $PSScriptRoot "sample-zips"
$zipFiles = Get-ChildItem -Path $zipDir -Filter "*.zip" -ErrorAction SilentlyContinue

if ($zipFiles.Count -eq 0) {
    Write-Host "   Generating sample ZIP files..." -ForegroundColor Yellow
    $generateScript = Join-Path $PSScriptRoot "generate-sample-zips.ps1"
    & $generateScript -OutputDir $zipDir
    $zipFiles = Get-ChildItem -Path $zipDir -Filter "*.zip"
}

Write-Host "   SUCCESS: Found $($zipFiles.Count) ZIP files" -ForegroundColor Green

# Use demo account for testing (for now)
Write-Host ""
Write-Host "[1.3] Setting up test session..." -ForegroundColor Yellow
$testUsers = @()
$demoEmail = "test@demo.com"
$demoPassword = "test123"

Write-Host "   Using demo account for all workers: $demoEmail" -ForegroundColor Gray

# Login once to get token
try {
    $loginBody = @{
        email = $demoEmail
        password = $demoPassword
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$BackendUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    
    # Create multiple "virtual" users with same token for concurrent testing
    for ($i = 1; $i -le $ConcurrentUsers; $i++) {
        $testUsers += @{
            Email = $demoEmail
            Password = $demoPassword
            Name = "Demo User Worker $i"
            Token = $token
            UserId = $loginResponse.user.id
        }
    }
    
    Write-Host "      SUCCESS: Logged in, created $ConcurrentUsers virtual workers" -ForegroundColor Green
} catch {
    Write-Host "      ERROR: Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "      Please ensure demo account exists with correct credentials" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "   SUCCESS: $($testUsers.Count) test users ready" -ForegroundColor Green

# Phase 2: Warmup
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "[PHASE 2/5] WARMUP TEST" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$warmupUser = $testUsers[0]
$warmupZip = $zipFiles[0]

Write-Host "[2.1] Uploading test file: $($warmupZip.Name)" -ForegroundColor Yellow
$uploadResult = Upload-ZipFile -Token $warmupUser.Token -ZipFilePath $warmupZip.FullName

if ($uploadResult.Success) {
    Write-Host "   SUCCESS: Upload successful ($(Format-Duration $uploadResult.UploadTime))" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "[2.2] Waiting for analysis to complete..." -ForegroundColor Yellow
    $analysisResult = Poll-AnalysisStatus -Token $warmupUser.Token -AnalysisId $uploadResult.AnalysisId -MaxAttempts 40
    
    if ($analysisResult.Success) {
        Write-Host "   SUCCESS: Analysis completed ($(Format-Duration $analysisResult.TotalTime))" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: Analysis failed: $($analysisResult.Error)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ERROR: Upload failed: $($uploadResult.Error)" -ForegroundColor Red
    exit 1
}

# Phase 3: Stress Test
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "[PHASE 3/5] STRESS TEST EXECUTION" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting $ConcurrentUsers concurrent test workers..." -ForegroundColor Yellow
Write-Host ""

$stressTestStartTime = Get-Date
$jobs = @()

# Worker script
$workerScript = {
    param($UserData, $ZipFiles, $TestDuration, $BackendUrl, $HelperPath)
    
    . $HelperPath
    $script:BackendUrl = $BackendUrl
    
    $results = @()
    $endTime = (Get-Date).AddSeconds($TestDuration)
    $iteration = 0
    
    while ((Get-Date) -lt $endTime) {
        $iteration++
        $iterationStart = Get-Date
        
        $randomZip = Get-Random -InputObject $ZipFiles
        $uploadResult = Upload-ZipFile -Token $UserData.Token -ZipFilePath $randomZip.FullName
        
        if ($uploadResult.Success) {
            $analysisResult = Poll-AnalysisStatus -Token $UserData.Token -AnalysisId $uploadResult.AnalysisId -MaxAttempts 40
            
            $iterationEnd = Get-Date
            $totalTime = ($iterationEnd - $iterationStart).TotalMilliseconds
            
            $results += @{
                Iteration = $iteration
                User = $UserData.Email
                ZipFile = $randomZip.Name
                ZipSize = $randomZip.Length
                UploadSuccess = $true
                UploadTime = $uploadResult.UploadTime
                AnalysisId = $uploadResult.AnalysisId
                AnalysisSuccess = $analysisResult.Success
                AnalysisTime = $analysisResult.TotalTime
                AnalysisStatus = $analysisResult.Status
                TotalTime = $totalTime
                Timestamp = $iterationStart
                Error = $analysisResult.Error
            }
        } else {
            $iterationEnd = Get-Date
            $totalTime = ($iterationEnd - $iterationStart).TotalMilliseconds
            
            $results += @{
                Iteration = $iteration
                User = $UserData.Email
                ZipFile = $randomZip.Name
                ZipSize = $randomZip.Length
                UploadSuccess = $false
                UploadTime = $uploadResult.UploadTime
                AnalysisId = $null
                AnalysisSuccess = $false
                AnalysisTime = 0
                AnalysisStatus = "failed"
                TotalTime = $totalTime
                Timestamp = $iterationStart
                Error = $uploadResult.Error
            }
        }
        
        Start-Sleep -Milliseconds 500
    }
    
    return $results
}

# Start workers
foreach ($user in $testUsers) {
    Write-Host "   Starting worker for: $($user.Email)" -ForegroundColor Gray
    $job = Start-Job -ScriptBlock $workerScript -ArgumentList $user, $zipFiles, $TestDurationSeconds, $BackendUrl, $helperPath
    $jobs += $job
}

Write-Host ""
Write-Host "   SUCCESS: All $($jobs.Count) workers started" -ForegroundColor Green
Write-Host ""

# Monitor progress
Write-Host "Monitoring test progress..." -ForegroundColor Yellow
$progressInterval = 10
$elapsed = 0

while ($elapsed -lt $TestDurationSeconds) {
    Start-Sleep -Seconds $progressInterval
    $elapsed += $progressInterval
    
    $runningJobs = ($jobs | Where-Object { $_.State -eq "Running" }).Count
    $progress = [Math]::Min(100, [Math]::Round(($elapsed / $TestDurationSeconds) * 100, 0))
    Write-Host "   Progress: ${progress}% | Running: $runningJobs | Elapsed: ${elapsed}s / ${TestDurationSeconds}s" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Waiting for all workers to complete..." -ForegroundColor Yellow
$jobs | Wait-Job -Timeout 30 | Out-Null
Write-Host "   SUCCESS: All workers finished" -ForegroundColor Green

# Phase 4: Collect Results
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "[PHASE 4/5] COLLECTING AND ANALYZING RESULTS" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$allResults = @()
foreach ($job in $jobs) {
    if ($job.State -eq "Completed") {
        $jobResults = Receive-Job -Job $job
        $allResults += $jobResults
    }
    Remove-Job -Job $job
}

$stressTestEndTime = Get-Date

Write-Host "Collected $($allResults.Count) test results" -ForegroundColor Green

# Calculate metrics
$testReport = New-TestReport -TestConfig @{
    ConcurrentUsers = $ConcurrentUsers
    TestDuration = $TestDurationSeconds
    BackendUrl = $BackendUrl
    ZipFilesUsed = $zipFiles.Count
} -TestResults $allResults -StartTime $stressTestStartTime -EndTime $stressTestEndTime

# Phase 5: Generate Report
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "[PHASE 5/5] GENERATING REPORTS" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$reportsDir = Join-Path $PSScriptRoot "reports"
if (!(Test-Path $reportsDir)) {
    New-Item -ItemType Directory -Path $reportsDir | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$jsonFile = Join-Path $reportsDir "stress-test-data-$timestamp.json"
$txtFile = Join-Path $reportsDir "stress-test-report-$timestamp.txt"

# Save JSON data
$testReport | ConvertTo-Json -Depth 10 | Out-File $jsonFile -Encoding UTF8
Write-Host "   SUCCESS: Saved JSON data: $jsonFile" -ForegroundColor Green

# Generate text report
$summary = $testReport.Summary
$metrics = $testReport.Metrics

$overallStatus = if ($summary.SuccessRate -ge 95) { "EXCELLENT" }
                 elseif ($summary.SuccessRate -ge 80) { "GOOD" }
                 elseif ($summary.SuccessRate -ge 60) { "WARNING" }
                 else { "CRITICAL" }

$txtReport = @"
================================================================
CODE ANALYSIS STRESS TEST REPORT
================================================================

Generated: $($summary.StartTime)
Overall Status: $overallStatus

================================================================
SUMMARY
================================================================

Total Requests:        $($summary.TotalRequests)
Successful Uploads:    $($summary.SuccessfulUploads)
Successful Analyses:   $($summary.SuccessfulAnalyses)
Failed Requests:       $($summary.FailedRequests)

Success Rate:          $($summary.SuccessRate)%
Error Rate:            $($summary.ErrorRate)%
Throughput:            $($summary.RequestsPerSecond) requests/second
Test Duration:         $($summary.Duration) seconds

================================================================
PERFORMANCE METRICS
================================================================

Upload Time:
  Average:  $([Math]::Round($metrics.Upload.Average, 0)) ms
  P50:      $([Math]::Round($metrics.Upload.P50, 0)) ms
  P95:      $([Math]::Round($metrics.Upload.P95, 0)) ms
  P99:      $([Math]::Round($metrics.Upload.P99, 0)) ms

Analysis Time:
  Average:  $([Math]::Round($metrics.Analysis.Average / 1000, 2)) seconds
  P50:      $([Math]::Round($metrics.Analysis.P50 / 1000, 2)) seconds
  P95:      $([Math]::Round($metrics.Analysis.P95 / 1000, 2)) seconds
  P99:      $([Math]::Round($metrics.Analysis.P99 / 1000, 2)) seconds

Total Time:
  Average:  $([Math]::Round($metrics.Total.Average / 1000, 2)) seconds
  P50:      $([Math]::Round($metrics.Total.P50 / 1000, 2)) seconds
  P95:      $([Math]::Round($metrics.Total.P95 / 1000, 2)) seconds
  P99:      $([Math]::Round($metrics.Total.P99 / 1000, 2)) seconds

================================================================
TEST CONFIGURATION
================================================================

Concurrent Users:      $ConcurrentUsers
Test Duration:         $TestDurationSeconds seconds
Backend URL:           $BackendUrl
ZIP Files Used:        $($zipFiles.Count) files

Start Time:            $($summary.StartTime)
End Time:              $($summary.EndTime)

================================================================
TEST USERS
================================================================

Email Pattern:         stress_test_user_XXX@codeanalyst.test
Password:              StressTest2024!
Count:                 $($testUsers.Count) users

================================================================
"@

$txtReport | Out-File $txtFile -Encoding UTF8
Write-Host "   SUCCESS: Saved text report: $txtFile" -ForegroundColor Green

# Display summary
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "                   TEST COMPLETE" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "RESULTS SUMMARY:" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Overall Status: $overallStatus" -ForegroundColor $(if($overallStatus -eq "EXCELLENT" -or $overallStatus -eq "GOOD"){"Green"}elseif($overallStatus -eq "WARNING"){"Yellow"}else{"Red"})
Write-Host ""
Write-Host "Total Requests:        $($summary.TotalRequests)" -ForegroundColor White
Write-Host "Successful Analyses:   $($summary.SuccessfulAnalyses)" -ForegroundColor Green
Write-Host "Failed Requests:       $($summary.FailedRequests)" -ForegroundColor $(if($summary.FailedRequests -eq 0){"Green"}else{"Red"})
Write-Host ""
Write-Host "Success Rate:          $($summary.SuccessRate)%" -ForegroundColor $(if($summary.SuccessRate -ge 95){"Green"}elseif($summary.SuccessRate -ge 80){"Yellow"}else{"Red"})
Write-Host "Throughput:            $($summary.RequestsPerSecond) requests/second" -ForegroundColor White
Write-Host ""
Write-Host "Avg Upload Time:       $(Format-Duration $metrics.Upload.Average)" -ForegroundColor White
Write-Host "Avg Analysis Time:     $(Format-Duration $metrics.Analysis.Average)" -ForegroundColor White
Write-Host "Avg Total Time:        $(Format-Duration $metrics.Total.Average)" -ForegroundColor White
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Reports Generated:" -ForegroundColor Cyan
Write-Host "  JSON Data:   $jsonFile" -ForegroundColor White
Write-Host "  Text Report: $txtFile" -ForegroundColor White
Write-Host ""
Write-Host "Test Users: stress_test_user_XXX@codeanalyst.test (Password: StressTest2024!)" -ForegroundColor Yellow
Write-Host ""

