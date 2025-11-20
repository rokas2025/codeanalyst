# Code Analysis Module - Stress Test Runner
# Full flow testing: Upload ZIP ā†’ Wait for analysis ā†’ Check results

param(
    [int]$ConcurrentUsers = 5,
    [int]$TestDurationSeconds = 180,
    [int]$WarmupDurationSeconds = 30,
    [string]$BackendUrl = "https://codeanalyst-production.up.railway.app/api",
    [switch]$SkipUserCreation,
    [switch]$GenerateZips
)

$ErrorActionPreference = "Continue"
$script:TestStartTime = Get-Date

# Import helper functions
$helperPath = Join-Path $PSScriptRoot "test-helpers.ps1"
. $helperPath

Write-Host "ā•”ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•—" -ForegroundColor Cyan
Write-Host "ā•‘     CODE ANALYSIS MODULE - STRESS TEST SUITE               ā•‘" -ForegroundColor Cyan
Write-Host "ā•‘     ZIP Upload Full Flow Testing                           ā•‘" -ForegroundColor Cyan
Write-Host "ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•¯" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Configuration:" -ForegroundColor Yellow
Write-Host "  ā€¢ Concurrent Users: $ConcurrentUsers" -ForegroundColor White
Write-Host "  ā€¢ Test Duration: $TestDurationSeconds seconds" -ForegroundColor White
Write-Host "  ā€¢ Warmup Duration: $WarmupDurationSeconds seconds" -ForegroundColor White
Write-Host "  ā€¢ Backend URL: $BackendUrl" -ForegroundColor White
Write-Host ""

# Set backend URL in helpers
$script:BackendUrl = $BackendUrl

# Phase 1: Setup
Write-Host "ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•" -ForegroundColor Cyan
Write-Host "[PHASE 1/5] SETUP AND PREPARATION" -ForegroundColor Cyan
Write-Host "ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•" -ForegroundColor Cyan
Write-Host ""

# Check backend connectivity
Write-Host "[1.1] Testing backend connectivity..." -ForegroundColor Yellow
$connectivityTest = Test-BackendConnectivity
if ($connectivityTest.Success) {
    Write-Host "   ā… Backend is reachable" -ForegroundColor Green
} else {
    Write-Host "   ā¯ Backend is not reachable: $($connectivityTest.Error)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  ā€¢ Backend URL is correct" -ForegroundColor White
    Write-Host "  ā€¢ Backend service is running" -ForegroundColor White
    Write-Host "  ā€¢ Network connection is available" -ForegroundColor White
    exit 1
}

# Generate sample ZIPs if needed
Write-Host ""
Write-Host "[1.2] Checking sample ZIP files..." -ForegroundColor Yellow
$zipDir = Join-Path $PSScriptRoot "sample-zips"
$zipFiles = Get-ChildItem -Path $zipDir -Filter "*.zip" -ErrorAction SilentlyContinue

if ($zipFiles.Count -eq 0 -or $GenerateZips) {
    Write-Host "   Generating sample ZIP files..." -ForegroundColor Yellow
    $generateScript = Join-Path $PSScriptRoot "generate-sample-zips.ps1"
    & $generateScript -OutputDir $zipDir
    $zipFiles = Get-ChildItem -Path $zipDir -Filter "*.zip"
}

Write-Host "   ā… Found $($zipFiles.Count) ZIP files" -ForegroundColor Green
foreach ($zip in $zipFiles) {
    $sizeKB = [Math]::Round($zip.Length / 1KB, 1)
    Write-Host "      ā€¢ $($zip.Name) (${sizeKB} KB)" -ForegroundColor Gray
}

# Create test users
Write-Host ""
Write-Host "[1.3] Setting up test users..." -ForegroundColor Yellow
$testUsers = @()
$testPassword = "StressTest2024!"

for ($i = 1; $i -le $ConcurrentUsers; $i++) {
    $userNumber = $i.ToString("000")
    $email = "stress_test_user_$userNumber@codeanalyst.test"
    $name = "Stress Test User $userNumber"
    
    Write-Host "   Creating user $i/$ConcurrentUsers : $email" -ForegroundColor Gray
    
    if (-not $SkipUserCreation) {
        $result = Create-TestUser -Email $email -Password $testPassword -Name $name
        
        if ($result.Success) {
            $testUsers += @{
                Email = $email
                Password = $testPassword
                Name = $name
                Token = $result.Token
                UserId = $result.User.id
            }
            Write-Host "      ā… User ready" -ForegroundColor Green
        } else {
            Write-Host "      ā ļø¸  Using existing user" -ForegroundColor Yellow
            # Try to login
            $loginResult = Login-TestUser -Email $email -Password $testPassword
            if ($loginResult.Success) {
                $testUsers += @{
                    Email = $email
                    Password = $testPassword
                    Name = $name
                    Token = $loginResult.Token
                    UserId = $loginResult.User.id
                }
                Write-Host "      ā… Logged in successfully" -ForegroundColor Green
            } else {
                Write-Host "      ā¯ Failed to login: $($loginResult.Error)" -ForegroundColor Red
            }
        }
    } else {
        # Skip creation, just login
        $loginResult = Login-TestUser -Email $email -Password $testPassword
        if ($loginResult.Success) {
            $testUsers += @{
                Email = $email
                Password = $testPassword
                Name = $name
                Token = $loginResult.Token
                UserId = $loginResult.User.id
            }
            Write-Host "      ā… Logged in" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "   ā… $($testUsers.Count) test users ready" -ForegroundColor Green

# Phase 2: Warmup
Write-Host ""
Write-Host "ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•" -ForegroundColor Cyan
Write-Host "[PHASE 2/5] WARMUP TEST" -ForegroundColor Cyan
Write-Host "ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•" -ForegroundColor Cyan
Write-Host ""
Write-Host "Running warmup test to verify end-to-end flow..." -ForegroundColor Yellow
Write-Host ""

$warmupUser = $testUsers[0]
$warmupZip = $zipFiles[0]

Write-Host "[2.1] Uploading test file: $($warmupZip.Name)" -ForegroundColor Yellow
$uploadResult = Upload-ZipFile -Token $warmupUser.Token -ZipFilePath $warmupZip.FullName

if ($uploadResult.Success) {
    Write-Host "   ā… Upload successful ($(Format-Duration $uploadResult.UploadTime))" -ForegroundColor Green
    Write-Host "   Analysis ID: $($uploadResult.AnalysisId)" -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "[2.2] Waiting for analysis to complete..." -ForegroundColor Yellow
    $analysisResult = Poll-AnalysisStatus -Token $warmupUser.Token -AnalysisId $uploadResult.AnalysisId -MaxAttempts 40
    
    if ($analysisResult.Success) {
        Write-Host "   ā… Analysis completed ($(Format-Duration $analysisResult.TotalTime))" -ForegroundColor Green
        Write-Host "   Status: $($analysisResult.Status)" -ForegroundColor Gray
        Write-Host "   Polling attempts: $($analysisResult.Attempts)" -ForegroundColor Gray
    } else {
        Write-Host "   ā¯ Analysis failed: $($analysisResult.Error)" -ForegroundColor Red
        Write-Host ""
        Write-Host "Warmup test failed. Please check backend logs." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "   ā¯ Upload failed: $($uploadResult.Error)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Warmup test failed. Cannot proceed with stress test." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "   ā… Warmup test passed! System is ready." -ForegroundColor Green

# Phase 3: Stress Test
Write-Host ""
Write-Host "ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•" -ForegroundColor Cyan
Write-Host "[PHASE 3/5] STRESS TEST EXECUTION" -ForegroundColor Cyan
Write-Host "ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting $ConcurrentUsers concurrent test workers..." -ForegroundColor Yellow
Write-Host "Test will run for $TestDurationSeconds seconds" -ForegroundColor Yellow
Write-Host ""

$stressTestStartTime = Get-Date
$jobs = @()

# Create worker script block
$workerScript = {
    param($UserData, $ZipFiles, $TestDuration, $BackendUrl, $HelperPath)
    
    # Import helpers in job context
    . $HelperPath
    $script:BackendUrl = $BackendUrl
    
    $results = @()
    $endTime = (Get-Date).AddSeconds($TestDuration)
    $iteration = 0
    
    while ((Get-Date) -lt $endTime) {
        $iteration++
        $iterationStart = Get-Date
        
        # Select random ZIP file
        $randomZip = Get-Random -InputObject $ZipFiles
        
        # Upload ZIP
        $uploadResult = Upload-ZipFile -Token $UserData.Token -ZipFilePath $randomZip.FullName
        
        if ($uploadResult.Success) {
            # Poll for completion
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
        
        # Small delay between iterations
        Start-Sleep -Milliseconds 500
    }
    
    return $results
}

# Start worker jobs
foreach ($user in $testUsers) {
    Write-Host "   Starting worker for: $($user.Email)" -ForegroundColor Gray
    $job = Start-Job -ScriptBlock $workerScript -ArgumentList $user, $zipFiles, $TestDurationSeconds, $BackendUrl, $helperPath
    $jobs += $job
}

Write-Host ""
Write-Host "   ā… All $($jobs.Count) workers started" -ForegroundColor Green
Write-Host ""

# Monitor progress
Write-Host "Monitoring test progress..." -ForegroundColor Yellow
$progressInterval = 10
$elapsed = 0

while ($elapsed -lt $TestDurationSeconds) {
    Start-Sleep -Seconds $progressInterval
    $elapsed += $progressInterval
    
    $runningJobs = ($jobs | Where-Object { $_.State -eq "Running" }).Count
    $completedJobs = ($jobs | Where-Object { $_.State -eq "Completed" }).Count
    $failedJobs = ($jobs | Where-Object { $_.State -eq "Failed" }).Count
    
    $progress = [Math]::Min(100, [Math]::Round(($elapsed / $TestDurationSeconds) * 100, 0))
    Write-Host "   Progress: $progress% | Running: $runningJobs | Completed: $completedJobs | Failed: $failedJobs | Elapsed: ${elapsed}s / ${TestDurationSeconds}s" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Waiting for all workers to complete..." -ForegroundColor Yellow
$jobs | Wait-Job -Timeout 30 | Out-Null

Write-Host "   ā… All workers finished" -ForegroundColor Green

# Phase 4: Collect Results
Write-Host ""
Write-Host "ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•" -ForegroundColor Cyan
Write-Host "[PHASE 4/5] COLLECTING AND ANALYZING RESULTS" -ForegroundColor Cyan
Write-Host "ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•" -ForegroundColor Cyan
Write-Host ""

$allResults = @()
foreach ($job in $jobs) {
    if ($job.State -eq "Completed") {
        $jobResults = Receive-Job -Job $job
        $allResults += $jobResults
    } else {
        Write-Host "   ā ļø¸  Job $($job.Id) did not complete successfully (State: $($job.State))" -ForegroundColor Yellow
    }
    Remove-Job -Job $job
}

$stressTestEndTime = Get-Date

Write-Host "Collected $($allResults.Count) test results" -ForegroundColor Green
Write-Host ""

# Calculate metrics
Write-Host "Calculating metrics..." -ForegroundColor Yellow

$testReport = New-TestReport -TestConfig @{
    ConcurrentUsers = $ConcurrentUsers
    TestDuration = $TestDurationSeconds
    WarmupDuration = $WarmupDurationSeconds
    BackendUrl = $BackendUrl
    ZipFilesUsed = $zipFiles.Count
} -TestResults $allResults -StartTime $stressTestStartTime -EndTime $stressTestEndTime

Write-Host "   ā… Metrics calculated" -ForegroundColor Green

# Phase 5: Generate Report
Write-Host ""
Write-Host "ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•" -ForegroundColor Cyan
Write-Host "[PHASE 5/5] GENERATING REPORTS" -ForegroundColor Cyan
Write-Host "ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•" -ForegroundColor Cyan
Write-Host ""

# Create reports directory
$reportsDir = Join-Path $PSScriptRoot "reports"
if (!(Test-Path $reportsDir)) {
    New-Item -ItemType Directory -Path $reportsDir | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportFile = Join-Path $reportsDir "stress-test-report-$timestamp.html"
$jsonFile = Join-Path $reportsDir "stress-test-data-$timestamp.json"

# Save JSON data
Write-Host "[5.1] Saving raw data..." -ForegroundColor Yellow
$testReport | ConvertTo-Json -Depth 10 | Out-File $jsonFile -Encoding UTF8
Write-Host "   ā… Saved: $jsonFile" -ForegroundColor Green

# Generate HTML report
Write-Host ""
Write-Host "[5.2] Generating HTML report..." -ForegroundColor Yellow

$summary = $testReport.Summary
$metrics = $testReport.Metrics

# Determine overall status
$overallStatus = if ($summary.SuccessRate -ge 95) { "EXCELLENT" }
                 elseif ($summary.SuccessRate -ge 80) { "GOOD" }
                 elseif ($summary.SuccessRate -ge 60) { "WARNING" }
                 else { "CRITICAL" }

$statusColor = switch ($overallStatus) {
    "EXCELLENT" { "`#28a745" }
    "GOOD" { "`#5cb85c" }
    "WARNING" { "`#ffc107" }
    "CRITICAL" { "`#dc3545" }
}

# Create error log
$errorLog = ""
$errors = $allResults | Where-Object { -not $_.AnalysisSuccess }
if ($errors.Count -gt 0) {
    $errorLog = "<div class='section'><h2>ā¯ Error Log</h2><table><thead><tr><th>Time</th><th>User</th><th>File</th><th>Error</th></tr></thead><tbody>"
    foreach ($error in $errors | Select-Object -First 20) {
        $errorLog += "<tr><td>$($error.Timestamp.ToString('HH:mm:ss'))</td><td>$($error.User)</td><td>$($error.ZipFile)</td><td>$($error.Error)</td></tr>"
    }
    $errorLog += "</tbody></table></div>"
}

$htmlContent = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Analysis Stress Test Report - $timestamp</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, `#667eea 0%, `#764ba2 100%);
            padding: 20px;
            color: `#333;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, `#667eea 0%, `#764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
        }
        .header p {
            font-size: 1.2em;
            opacity: 0.9;
        }
        .status-banner {
            background: $statusColor;
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 1.5em;
            font-weight: bold;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 40px;
            background: `#f8f9fa;
        }
        .summary-card {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-left: 5px solid `#667eea;
            transition: transform 0.3s;
        }
        .summary-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 12px rgba(0,0,0,0.15);
        }
        .summary-card h3 {
            color: `#667eea;
            font-size: 0.9em;
            text-transform: uppercase;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }
        .summary-card .value {
            font-size: 2.5em;
            font-weight: bold;
            color: `#333;
        }
        .summary-card .unit {
            font-size: 0.8em;
            color: `#666;
            margin-left: 5px;
        }
        .content {
            padding: 40px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: `#667eea;
            font-size: 1.8em;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid `#667eea;
        }
        .chart-container {
            background: white;
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .chart-wrapper {
            position: relative;
            height: 400px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        thead {
            background: linear-gradient(135deg, `#667eea 0%, `#764ba2 100%);
            color: white;
        }
        th, td {
            padding: 15px;
            text-align: left;
        }
        tbody tr:nth-child(even) {
            background: `#f8f9fa;
        }
        tbody tr:hover {
            background: `#e9ecef;
        }
        .metric-good { color: `#28a745; font-weight: bold; }
        .metric-warning { color: `#ffc107; font-weight: bold; }
        .metric-bad { color: `#dc3545; font-weight: bold; }
        .footer {
            background: `#f8f9fa;
            padding: 30px;
            text-align: center;
            color: `#666;
            border-top: 1px solid `#dee2e6;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>š” Code Analysis Module</h1>
            <h2>Stress Test Report</h2>
            <p>ZIP Upload Full Flow Testing</p>
            <p>Generated: $($summary.StartTime)</p>
        </div>

        <div class="status-banner">
            Overall Status: $overallStatus
        </div>

        <div class="summary">
            <div class="summary-card">
                <h3>Total Requests</h3>
                <div class="value">$($summary.TotalRequests)<span class="unit">req</span></div>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <div class="value $(if($summary.SuccessRate -ge 95){'metric-good'}elseif($summary.SuccessRate -ge 80){'metric-warning'}else{'metric-bad'})">$($summary.SuccessRate)<span class="unit">%</span></div>
            </div>
            <div class="summary-card">
                <h3>Avg Upload Time</h3>
                <div class="value">$([Math]::Round($metrics.Upload.Average, 0))<span class="unit">ms</span></div>
            </div>
            <div class="summary-card">
                <h3>Avg Analysis Time</h3>
                <div class="value">$([Math]::Round($metrics.Analysis.Average / 1000, 1))<span class="unit">s</span></div>
            </div>
            <div class="summary-card">
                <h3>Throughput</h3>
                <div class="value">$($summary.RequestsPerSecond)<span class="unit">req/s</span></div>
            </div>
            <div class="summary-card">
                <h3>Test Duration</h3>
                <div class="value">$([Math]::Round($summary.Duration, 0))<span class="unit">s</span></div>
            </div>
        </div>

        <div class="content">
            <div class="section">
                <h2>š“ Performance Metrics</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Metric</th>
                            <th>Upload Time</th>
                            <th>Analysis Time</th>
                            <th>Total Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Average</strong></td>
                            <td>$([Math]::Round($metrics.Upload.Average, 0)) ms</td>
                            <td>$([Math]::Round($metrics.Analysis.Average / 1000, 2)) s</td>
                            <td>$([Math]::Round($metrics.Total.Average / 1000, 2)) s</td>
                        </tr>
                        <tr>
                            <td><strong>Median (P50)</strong></td>
                            <td>$([Math]::Round($metrics.Upload.P50, 0)) ms</td>
                            <td>$([Math]::Round($metrics.Analysis.P50 / 1000, 2)) s</td>
                            <td>$([Math]::Round($metrics.Total.P50 / 1000, 2)) s</td>
                        </tr>
                        <tr>
                            <td><strong>P95</strong></td>
                            <td>$([Math]::Round($metrics.Upload.P95, 0)) ms</td>
                            <td>$([Math]::Round($metrics.Analysis.P95 / 1000, 2)) s</td>
                            <td>$([Math]::Round($metrics.Total.P95 / 1000, 2)) s</td>
                        </tr>
                        <tr>
                            <td><strong>P99</strong></td>
                            <td>$([Math]::Round($metrics.Upload.P99, 0)) ms</td>
                            <td>$([Math]::Round($metrics.Analysis.P99 / 1000, 2)) s</td>
                            <td>$([Math]::Round($metrics.Total.P99 / 1000, 2)) s</td>
                        </tr>
                        <tr>
                            <td><strong>Min</strong></td>
                            <td>$([Math]::Round($metrics.Upload.Min, 0)) ms</td>
                            <td>$([Math]::Round($metrics.Analysis.Min / 1000, 2)) s</td>
                            <td>$([Math]::Round($metrics.Total.Min / 1000, 2)) s</td>
                        </tr>
                        <tr>
                            <td><strong>Max</strong></td>
                            <td>$([Math]::Round($metrics.Upload.Max, 0)) ms</td>
                            <td>$([Math]::Round($metrics.Analysis.Max / 1000, 2)) s</td>
                            <td>$([Math]::Round($metrics.Total.Max / 1000, 2)) s</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2>š“ Visual Analytics</h2>
                
                <div class="chart-container">
                    <h3>Response Time Distribution</h3>
                    <div class="chart-wrapper">
                        <canvas id="responseTimeChart"></canvas>
                    </div>
                </div>

                <div class="chart-container">
                    <h3>Success vs Failure Rate</h3>
                    <div class="chart-wrapper">
                        <canvas id="successRateChart"></canvas>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>š“‹ Test Configuration</h2>
                <table>
                    <tbody>
                        <tr>
                            <td><strong>Concurrent Users</strong></td>
                            <td>$ConcurrentUsers</td>
                        </tr>
                        <tr>
                            <td><strong>Test Duration</strong></td>
                            <td>$TestDurationSeconds seconds</td>
                        </tr>
                        <tr>
                            <td><strong>Warmup Duration</strong></td>
                            <td>$WarmupDurationSeconds seconds</td>
                        </tr>
                        <tr>
                            <td><strong>Backend URL</strong></td>
                            <td>$BackendUrl</td>
                        </tr>
                        <tr>
                            <td><strong>ZIP Files Used</strong></td>
                            <td>$($zipFiles.Count) files</td>
                        </tr>
                        <tr>
                            <td><strong>Start Time</strong></td>
                            <td>$($summary.StartTime)</td>
                        </tr>
                        <tr>
                            <td><strong>End Time</strong></td>
                            <td>$($summary.EndTime)</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            $errorLog
        </div>

        <div class="footer">
            <p><strong>CodeAnalyst</strong> - Stress Testing Report</p>
            <p>Code Analysis Module - ZIP Upload Full Flow</p>
            <p>Report Generated: $timestamp</p>
        </div>
    </div>

    <script>
        // Response Time Chart
        const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
        new Chart(responseTimeCtx, {
            type: 'bar',
            data: {
                labels: ['Upload Time', 'Analysis Time', 'Total Time'],
                datasets: [
                    {
                        label: 'Average (ms)',
                        data: [$([Math]::Round($metrics.Upload.Average, 0)), $([Math]::Round($metrics.Analysis.Average, 0)), $([Math]::Round($metrics.Total.Average, 0))],
                        backgroundColor: 'rgba(102, 126, 234, 0.7)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 2
                    },
                    {
                        label: 'P95 (ms)',
                        data: [$([Math]::Round($metrics.Upload.P95, 0)), $([Math]::Round($metrics.Analysis.P95, 0)), $([Math]::Round($metrics.Total.P95, 0))],
                        backgroundColor: 'rgba(118, 75, 162, 0.7)',
                        borderColor: 'rgba(118, 75, 162, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Time (milliseconds)' }
                    }
                }
            }
        });

        // Success Rate Chart
        const successRateCtx = document.getElementById('successRateChart').getContext('2d');
        new Chart(successRateCtx, {
            type: 'doughnut',
            data: {
                labels: ['Successful', 'Failed'],
                datasets: [{
                    data: [$($summary.SuccessfulAnalyses), $($summary.FailedRequests)],
                    backgroundColor: [
                        'rgba(40, 167, 69, 0.8)',
                        'rgba(220, 53, 69, 0.8)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                }
            }
        });
    </script>
</body>
</html>
"@

$htmlContent | Out-File $reportFile -Encoding UTF8
Write-Host "   ā… HTML report generated: $reportFile" -ForegroundColor Green

# Display summary
Write-Host ""
Write-Host "ā•”ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•—" -ForegroundColor Green
Write-Host "ā•‘                   TEST COMPLETE                            ā•‘" -ForegroundColor Green
Write-Host "ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•¯" -ForegroundColor Green
Write-Host ""
Write-Host "š“ RESULTS SUMMARY:" -ForegroundColor Cyan
Write-Host "ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•" -ForegroundColor Cyan
Write-Host ""
Write-Host "Overall Status: " -NoNewline
Write-Host "$overallStatus" -ForegroundColor $(if($overallStatus -eq "EXCELLENT"){"Green"}elseif($overallStatus -eq "GOOD"){"Green"}elseif($overallStatus -eq "WARNING"){"Yellow"}else{"Red"})
Write-Host ""
Write-Host "Total Requests:        $($summary.TotalRequests)" -ForegroundColor White
Write-Host "Successful Uploads:    $($summary.SuccessfulUploads)" -ForegroundColor Green
Write-Host "Successful Analyses:   $($summary.SuccessfulAnalyses)" -ForegroundColor Green
Write-Host "Failed Requests:       $($summary.FailedRequests)" -ForegroundColor $(if($summary.FailedRequests -eq 0){"Green"}else{"Red"})
Write-Host ""
Write-Host "Success Rate:          $($summary.SuccessRate)%" -ForegroundColor $(if($summary.SuccessRate -ge 95){"Green"}elseif($summary.SuccessRate -ge 80){"Yellow"}else{"Red"})
Write-Host "Error Rate:            $($summary.ErrorRate)%" -ForegroundColor $(if($summary.ErrorRate -le 5){"Green"}elseif($summary.ErrorRate -le 20){"Yellow"}else{"Red"})
Write-Host "Throughput:            $($summary.RequestsPerSecond) requests/second" -ForegroundColor White
Write-Host ""
Write-Host "Avg Upload Time:       $(Format-Duration $metrics.Upload.Average)" -ForegroundColor White
Write-Host "Avg Analysis Time:     $(Format-Duration $metrics.Analysis.Average)" -ForegroundColor White
Write-Host "Avg Total Time:        $(Format-Duration $metrics.Total.Average)" -ForegroundColor White
Write-Host ""
Write-Host "P95 Total Time:        $(Format-Duration $metrics.Total.P95)" -ForegroundColor White
Write-Host "P99 Total Time:        $(Format-Duration $metrics.Total.P99)" -ForegroundColor White
Write-Host ""
Write-Host "ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•ā•" -ForegroundColor Cyan
Write-Host ""
Write-Host "š“„ Reports Generated:" -ForegroundColor Cyan
Write-Host "   ā€¢ HTML Report: $reportFile" -ForegroundColor White
Write-Host "   ā€¢ JSON Data:   $jsonFile" -ForegroundColor White
Write-Host ""
Write-Host "š Open HTML report in browser to view detailed charts and metrics" -ForegroundColor Yellow
Write-Host ""
Write-Host "š‘ Test Users Created:" -ForegroundColor Cyan
Write-Host "   Email Pattern: stress_test_user_XXX@codeanalyst.test" -ForegroundColor White
Write-Host "   Password: $testPassword" -ForegroundColor White
Write-Host "   Count: $($testUsers.Count) users" -ForegroundColor White
Write-Host ""
Write-Host "š’ Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Review the HTML report for detailed metrics" -ForegroundColor White
Write-Host "   2. Check backend logs for any errors" -ForegroundColor White
Write-Host "   3. Analyze bottlenecks if success rate < 95%" -ForegroundColor White
Write-Host "   4. Clean up test users when done (manual deletion from database)" -ForegroundColor White
Write-Host ""

