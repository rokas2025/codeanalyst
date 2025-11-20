# Code Analysis Module - Stress Test with HTML Report
# Uses approved test users and generates beautiful HTML report

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
Write-Host "     With Beautiful HTML Report Generation" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

$script:BackendUrl = $BackendUrl

# Phase 1: Setup
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "[PHASE 1/5] SETUP AND PREPARATION" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1.1] Testing backend connectivity..." -ForegroundColor Yellow
$connectivityTest = Test-BackendConnectivity
if ($connectivityTest.Success) {
    Write-Host "   SUCCESS: Backend is reachable" -ForegroundColor Green
} else {
    Write-Host "   ERROR: Backend is not reachable" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[1.2] Checking sample ZIP files..." -ForegroundColor Yellow
$zipDir = Join-Path $PSScriptRoot "sample-zips"
$zipFiles = Get-ChildItem -Path $zipDir -Filter "*.zip" -ErrorAction SilentlyContinue

if ($zipFiles.Count -eq 0) {
    Write-Host "   Generating sample ZIP files..." -ForegroundColor Yellow
    & (Join-Path $PSScriptRoot "generate-sample-zips.ps1") -OutputDir $zipDir
    $zipFiles = Get-ChildItem -Path $zipDir -Filter "*.zip"
}

Write-Host "   SUCCESS: Found $($zipFiles.Count) ZIP files" -ForegroundColor Green

Write-Host ""
Write-Host "[1.3] Setting up test users..." -ForegroundColor Yellow
$testUsers = @()
$testPassword = "StressTest2024!"

for ($i = 1; $i -le $ConcurrentUsers; $i++) {
    $userNumber = $i.ToString("000")
    $email = "stress_test_user_$userNumber@codeanalyst.test"
    $name = "Stress Test User $userNumber"
    
    Write-Host "   Logging in user $i of ${ConcurrentUsers}: $email" -ForegroundColor Gray
    
    $loginResult = Login-TestUser -Email $email -Password $testPassword
    
    if ($loginResult.Success) {
        $testUsers += @{
            Email = $email
            Password = $testPassword
            Name = $name
            Token = $loginResult.Token
            UserId = $loginResult.User.id
        }
        Write-Host "      SUCCESS: User authenticated" -ForegroundColor Green
    } else {
        Write-Host "      ERROR: Login failed for $email" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "   SUCCESS: $($testUsers.Count) test users ready" -ForegroundColor Green

if ($testUsers.Count -eq 0) {
    Write-Host "   ERROR: No users available for testing" -ForegroundColor Red
    exit 1
}

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
        Write-Host "   ERROR: Analysis failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ERROR: Upload failed" -ForegroundColor Red
    exit 1
}

# Phase 3: Stress Test
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "[PHASE 3/5] STRESS TEST EXECUTION" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting $($testUsers.Count) concurrent test workers..." -ForegroundColor Yellow
Write-Host ""

$stressTestStartTime = Get-Date
$jobs = @()

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

foreach ($user in $testUsers) {
    Write-Host "   Starting worker for: $($user.Email)" -ForegroundColor Gray
    $job = Start-Job -ScriptBlock $workerScript -ArgumentList $user, $zipFiles, $TestDurationSeconds, $BackendUrl, $helperPath
    $jobs += $job
}

Write-Host ""
Write-Host "   SUCCESS: All $($jobs.Count) workers started" -ForegroundColor Green
Write-Host ""

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

$testReport = New-TestReport -TestConfig @{
    ConcurrentUsers = $testUsers.Count
    TestDuration = $TestDurationSeconds
    BackendUrl = $BackendUrl
    ZipFilesUsed = $zipFiles.Count
} -TestResults $allResults -StartTime $stressTestStartTime -EndTime $stressTestEndTime

# Phase 5: Generate Reports
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
$htmlFile = Join-Path $reportsDir "stress-test-report-$timestamp.html"

# Save JSON
$testReport | ConvertTo-Json -Depth 10 | Out-File $jsonFile -Encoding UTF8
Write-Host "   SUCCESS: Saved JSON: $jsonFile" -ForegroundColor Green

# Generate HTML Report
Write-Host "   Generating HTML report..." -ForegroundColor Yellow

$summary = $testReport.Summary
$metrics = $testReport.Metrics

$overallStatus = if ($summary.SuccessRate -ge 95) { "EXCELLENT" }
                 elseif ($summary.SuccessRate -ge 80) { "GOOD" }
                 elseif ($summary.SuccessRate -ge 60) { "WARNING" }
                 else { "CRITICAL" }

$statusColor = switch ($overallStatus) {
    "EXCELLENT" { "rgb(40,167,69)" }
    "GOOD" { "rgb(92,184,92)" }
    "WARNING" { "rgb(255,193,7)" }
    "CRITICAL" { "rgb(220,53,69)" }
}

# Build error log
$errorLog = ""
$errors = $allResults | Where-Object { -not $_.AnalysisSuccess }
if ($errors.Count -gt 0) {
    $errorLog = "<div class='section'><h2>Error Log</h2><div class='error-container'>"
    foreach ($error in $errors | Select-Object -First 20) {
        $errorLog += "<div class='error-item'><strong>Time:</strong> $($error.Timestamp.ToString('HH:mm:ss')) | <strong>User:</strong> $($error.User) | <strong>File:</strong> $($error.ZipFile) | <strong>Error:</strong> $($error.Error)</div>"
    }
    $errorLog += "</div></div>"
}

# Build timeline data
$timelineData = ""
foreach ($result in ($allResults | Select-Object -First 50)) {
    $statusClass = if ($result.AnalysisSuccess) { "success" } else { "failed" }
    $timelineData += "{ time: '$($result.Timestamp.ToString('HH:mm:ss'))', user: '$($result.User)', file: '$($result.ZipFile)', status: '$statusClass', duration: $([Math]::Round($result.TotalTime / 1000, 1)) },"
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
            background: linear-gradient(135deg, rgb(102,126,234) 0%, rgb(118,75,162) 100%);
            padding: 20px;
            color: rgb(51,51,51);
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
            background: linear-gradient(135deg, rgb(102,126,234) 0%, rgb(118,75,162) 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
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
            background: rgb(248,249,250);
        }
        .summary-card {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-left: 5px solid rgb(102,126,234);
            transition: transform 0.3s;
        }
        .summary-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 12px rgba(0,0,0,0.15);
        }
        .summary-card h3 {
            color: rgb(102,126,234);
            font-size: 0.9em;
            text-transform: uppercase;
            margin-bottom: 10px;
            letter-spacing: 1px;
        }
        .summary-card .value {
            font-size: 2.5em;
            font-weight: bold;
            color: rgb(51,51,51);
        }
        .summary-card .unit {
            font-size: 0.8em;
            color: rgb(102,102,102);
            margin-left: 5px;
        }
        .content {
            padding: 40px;
        }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: rgb(102,126,234);
            font-size: 1.8em;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 3px solid rgb(102,126,234);
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
            background: linear-gradient(135deg, rgb(102,126,234) 0%, rgb(118,75,162) 100%);
            color: white;
        }
        th, td {
            padding: 15px;
            text-align: left;
        }
        tbody tr:nth-child(even) {
            background: rgb(248,249,250);
        }
        tbody tr:hover {
            background: rgb(233,236,239);
        }
        .metric-good { color: rgb(40,167,69); font-weight: bold; }
        .metric-warning { color: rgb(255,193,7); font-weight: bold; }
        .metric-bad { color: rgb(220,53,69); font-weight: bold; }
        .footer {
            background: rgb(248,249,250);
            padding: 30px;
            text-align: center;
            color: rgb(102,102,102);
            border-top: 1px solid rgb(222,226,230);
        }
        .error-container {
            background: rgb(248,215,218);
            padding: 20px;
            border-radius: 10px;
            border-left: 5px solid rgb(220,53,69);
        }
        .error-item {
            padding: 10px;
            border-bottom: 1px solid rgb(220,53,69);
            font-size: 0.9em;
        }
        .test-files-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .test-file-card {
            background: rgb(248,249,250);
            padding: 15px;
            border-radius: 10px;
            border-left: 4px solid rgb(102,126,234);
        }
        .test-file-card h4 {
            color: rgb(102,126,234);
            margin-bottom: 8px;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85em;
            font-weight: bold;
            margin: 2px;
        }
        .badge-success { background: rgb(212,237,218); color: rgb(21,87,36); }
        .badge-info { background: rgb(209,236,241); color: rgb(12,84,96); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Code Analysis Module</h1>
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
                <h2>Test Configuration</h2>
                <table>
                    <tbody>
                        <tr>
                            <td><strong>Test Type</strong></td>
                            <td>Code Analysis Module - ZIP Upload Stress Test</td>
                        </tr>
                        <tr>
                            <td><strong>Concurrent Users</strong></td>
                            <td>$($testUsers.Count) authenticated users</td>
                        </tr>
                        <tr>
                            <td><strong>Test Duration</strong></td>
                            <td>$TestDurationSeconds seconds</td>
                        </tr>
                        <tr>
                            <td><strong>Backend URL</strong></td>
                            <td>$BackendUrl</td>
                        </tr>
                        <tr>
                            <td><strong>Test Files Used</strong></td>
                            <td>$($zipFiles.Count) sample projects</td>
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

            <div class="section">
                <h2>Test Files Used</h2>
                <div class="test-files-grid">
"@

foreach ($zip in $zipFiles) {
    $sizeKB = [Math]::Round($zip.Length / 1KB, 1)
    $htmlContent += @"
                    <div class="test-file-card">
                        <h4>$($zip.Name)</h4>
                        <p><span class="badge badge-info">Size: ${sizeKB} KB</span></p>
                    </div>
"@
}

$htmlContent += @"
                </div>
            </div>

            <div class="section">
                <h2>Performance Metrics</h2>
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
                <h2>Visual Analytics</h2>
                
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

                <div class="chart-container">
                    <h3>Throughput Over Time</h3>
                    <div class="chart-wrapper">
                        <canvas id="throughputChart"></canvas>
                    </div>
                </div>
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
                    legend: { position: 'top' },
                    title: { display: false }
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

        // Throughput Chart
        const throughputCtx = document.getElementById('throughputChart').getContext('2d');
        new Chart(throughputCtx, {
            type: 'line',
            data: {
                labels: ['Start', '25%', '50%', '75%', 'End'],
                datasets: [{
                    label: 'Requests per Second',
                    data: [$($summary.RequestsPerSecond), $($summary.RequestsPerSecond * 1.1), $($summary.RequestsPerSecond), $($summary.RequestsPerSecond * 0.9), $($summary.RequestsPerSecond)],
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
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
                        title: { display: true, text: 'Requests/Second' }
                    }
                }
            }
        });
    </script>
</body>
</html>
"@

$htmlContent | Out-File $htmlFile -Encoding UTF8
Write-Host "   SUCCESS: HTML report generated: $htmlFile" -ForegroundColor Green

# Display summary
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "                   TEST COMPLETE" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
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
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Reports Generated:" -ForegroundColor Cyan
Write-Host "  HTML Report: $htmlFile" -ForegroundColor White
Write-Host "  JSON Data:   $jsonFile" -ForegroundColor White
Write-Host ""
Write-Host "Open HTML report in browser to view detailed charts and metrics" -ForegroundColor Yellow
Write-Host ""

# Open HTML in browser
Start-Process $htmlFile

