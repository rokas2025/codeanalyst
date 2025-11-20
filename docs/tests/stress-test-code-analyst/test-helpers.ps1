# Test Helper Functions for Code Analysis Stress Testing

$script:BackendUrl = "https://codeanalyst-production.up.railway.app/api"

# Helper: Create test user
function Create-TestUser {
    param(
        [string]$Email,
        [string]$Password,
        [string]$Name
    )
    
    try {
        $body = @{
            email = $Email
            password = $Password
            name = $Name
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$script:BackendUrl/auth/register" `
            -Method Post `
            -Body $body `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        return @{
            Success = $true
            User = $response.user
            Token = $response.token
            Message = "User created successfully"
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorBody = $_.ErrorDetails.Message
        
        # If user already exists, try to login instead
        if ($statusCode -eq 400 -or $statusCode -eq 409) {
            Write-Host "   User exists, attempting login..." -ForegroundColor Yellow
            return Login-TestUser -Email $Email -Password $Password
        }
        
        return @{
            Success = $false
            Error = $errorBody
            StatusCode = $statusCode
            Message = "Failed to create user"
        }
    }
}

# Helper: Login test user
function Login-TestUser {
    param(
        [string]$Email,
        [string]$Password
    )
    
    try {
        $body = @{
            email = $Email
            password = $Password
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$script:BackendUrl/auth/login-supabase" `
            -Method Post `
            -Body $body `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        return @{
            Success = $true
            User = $response.user
            Token = $response.token
            Message = "Login successful"
        }
    }
    catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
            Message = "Login failed"
        }
    }
}

# Helper: Upload ZIP file for analysis
function Upload-ZipFile {
    param(
        [string]$Token,
        [string]$ZipFilePath
    )
    
    $startTime = Get-Date
    
    try {
        # Use .NET HttpClient for reliable multipart upload
        Add-Type -AssemblyName System.Net.Http
        
        $httpClient = New-Object System.Net.Http.HttpClient
        $httpClient.DefaultRequestHeaders.Add("Authorization", "Bearer $Token")
        
        $multipartContent = New-Object System.Net.Http.MultipartFormDataContent
        
        $fileStream = [System.IO.File]::OpenRead($ZipFilePath)
        $fileContent = New-Object System.Net.Http.StreamContent($fileStream)
        $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("application/zip")
        
        $multipartContent.Add($fileContent, "zipFile", [System.IO.Path]::GetFileName($ZipFilePath))
        
        $uploadUrl = "$script:BackendUrl/code-analysis/zip"
        
        $response = $httpClient.PostAsync($uploadUrl, $multipartContent).Result
        $responseContent = $response.Content.ReadAsStringAsync().Result
        
        $fileStream.Close()
        $httpClient.Dispose()
        
        $uploadTime = ((Get-Date) - $startTime).TotalMilliseconds
        
        if ($response.IsSuccessStatusCode) {
            $result = $responseContent | ConvertFrom-Json
            return @{
                Success = $true
                AnalysisId = $result.analysisId
                Status = $result.status
                UploadTime = $uploadTime
                Message = "Upload successful"
            }
        } else {
            return @{
                Success = $false
                Error = $responseContent
                StatusCode = $response.StatusCode
                UploadTime = $uploadTime
                Message = "Upload failed"
            }
        }
    }
    catch {
        $uploadTime = ((Get-Date) - $startTime).TotalMilliseconds
        
        return @{
            Success = $false
            Error = $_.Exception.Message
            UploadTime = $uploadTime
            Message = "Upload failed"
        }
    }
}

# Helper: Poll analysis status
function Poll-AnalysisStatus {
    param(
        [string]$Token,
        [string]$AnalysisId,
        [int]$MaxAttempts = 60,
        [int]$PollIntervalSeconds = 5
    )
    
    $startTime = Get-Date
    $attempts = 0
    
    $headers = @{
        "Authorization" = "Bearer $Token"
    }
    
    while ($attempts -lt $MaxAttempts) {
        try {
            $response = Invoke-RestMethod -Uri "$script:BackendUrl/code-analysis/status/$AnalysisId" `
                -Method Get `
                -Headers $headers `
                -ErrorAction Stop
            
            $attempts++
            
            $status = $response.analysis.status
            $progress = $response.analysis.progress
            
            if ($status -eq "completed") {
                $totalTime = ((Get-Date) - $startTime).TotalMilliseconds
                return @{
                    Success = $true
                    Status = "completed"
                    Progress = $progress
                    Result = $response.analysis
                    TotalTime = $totalTime
                    Attempts = $attempts
                    Message = "Analysis completed"
                }
            }
            
            if ($status -eq "failed") {
                $totalTime = ((Get-Date) - $startTime).TotalMilliseconds
                Write-Host "   Analysis failed details:" -ForegroundColor Red
                Write-Host "   Error: $($response.analysis.error)" -ForegroundColor Red
                Write-Host "   Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Gray
                return @{
                    Success = $false
                    Status = "failed"
                    Error = $response.analysis.error
                    ErrorDetails = $response.analysis
                    TotalTime = $totalTime
                    Attempts = $attempts
                    Message = "Analysis failed"
                }
            }
            
            # Still processing
            Start-Sleep -Seconds $PollIntervalSeconds
        }
        catch {
            $attempts++
            if ($attempts -ge $MaxAttempts) {
                $totalTime = ((Get-Date) - $startTime).TotalMilliseconds
                return @{
                    Success = $false
                    Status = "timeout"
                    Error = "Max polling attempts reached"
                    TotalTime = $totalTime
                    Attempts = $attempts
                    Message = "Polling timeout"
                }
            }
            Start-Sleep -Seconds $PollIntervalSeconds
        }
    }
    
    $totalTime = ((Get-Date) - $startTime).TotalMilliseconds
    return @{
        Success = $false
        Status = "timeout"
        TotalTime = $totalTime
        Attempts = $attempts
        Message = "Analysis timeout"
    }
}

# Helper: Get analysis results
function Get-AnalysisResults {
    param(
        [string]$Token,
        [string]$AnalysisId
    )
    
    try {
        $headers = @{
            "Authorization" = "Bearer $Token"
        }
        
        $response = Invoke-RestMethod -Uri "$script:BackendUrl/code-analysis/status/$AnalysisId" `
            -Method Get `
            -Headers $headers `
            -ErrorAction Stop
        
        return @{
            Success = $true
            Status = $response.status
            Progress = $response.progress
            Result = $response.analysis_result
            Message = "Results retrieved"
        }
    }
    catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
            Message = "Failed to get results"
        }
    }
}

# Helper: Measure request time
function Measure-RequestTime {
    param(
        [scriptblock]$ScriptBlock
    )
    
    $startTime = Get-Date
    $result = & $ScriptBlock
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalMilliseconds
    
    return @{
        Result = $result
        Duration = $duration
        StartTime = $startTime
        EndTime = $endTime
    }
}

# Helper: Calculate percentile
function Get-Percentile {
    param(
        [array]$Values,
        [int]$Percentile
    )
    
    if ($Values.Count -eq 0) { return 0 }
    
    $sorted = $Values | Sort-Object
    $index = [Math]::Ceiling(($Percentile / 100) * $sorted.Count) - 1
    if ($index -lt 0) { $index = 0 }
    if ($index -ge $sorted.Count) { $index = $sorted.Count - 1 }
    
    return $sorted[$index]
}

# Helper: Calculate statistics
function Calculate-Statistics {
    param(
        [array]$Values
    )
    
    if ($Values.Count -eq 0) {
        return @{
            Count = 0
            Min = 0
            Max = 0
            Average = 0
            Median = 0
            P50 = 0
            P95 = 0
            P99 = 0
        }
    }
    
    $sorted = $Values | Sort-Object
    
    return @{
        Count = $Values.Count
        Min = $sorted[0]
        Max = $sorted[-1]
        Average = ($Values | Measure-Object -Average).Average
        Median = Get-Percentile -Values $Values -Percentile 50
        P50 = Get-Percentile -Values $Values -Percentile 50
        P95 = Get-Percentile -Values $Values -Percentile 95
        P99 = Get-Percentile -Values $Values -Percentile 99
    }
}

# Helper: Format time duration
function Format-Duration {
    param(
        [double]$Milliseconds
    )
    
    if ($Milliseconds -lt 1000) {
        return "$([Math]::Round($Milliseconds, 0))ms"
    }
    elseif ($Milliseconds -lt 60000) {
        return "$([Math]::Round($Milliseconds / 1000, 2))s"
    }
    else {
        $minutes = [Math]::Floor($Milliseconds / 60000)
        $seconds = [Math]::Round(($Milliseconds % 60000) / 1000, 0)
        return "${minutes}m ${seconds}s"
    }
}

# Helper: Test backend connectivity
function Test-BackendConnectivity {
    try {
        $response = Invoke-RestMethod -Uri "$script:BackendUrl/../health" `
            -Method Get `
            -TimeoutSec 10 `
            -ErrorAction Stop
        
        return @{
            Success = $true
            Status = $response.status
            Message = "Backend is reachable"
        }
    }
    catch {
        return @{
            Success = $false
            Error = $_.Exception.Message
            Message = "Backend is not reachable"
        }
    }
}

# Helper: Generate test report data
function New-TestReport {
    param(
        [hashtable]$TestConfig,
        [array]$TestResults,
        [datetime]$StartTime,
        [datetime]$EndTime
    )
    
    $duration = ($EndTime - $StartTime).TotalSeconds
    
    # Calculate metrics
    $totalRequests = $TestResults.Count
    $successfulUploads = ($TestResults | Where-Object { $_.UploadSuccess }).Count
    $successfulAnalyses = ($TestResults | Where-Object { $_.AnalysisSuccess }).Count
    $failedRequests = $totalRequests - $successfulAnalyses
    
    # Time metrics
    $uploadTimes = $TestResults | Where-Object { $_.UploadTime } | ForEach-Object { $_.UploadTime }
    $analysisTimes = $TestResults | Where-Object { $_.AnalysisTime } | ForEach-Object { $_.AnalysisTime }
    $totalTimes = $TestResults | Where-Object { $_.TotalTime } | ForEach-Object { $_.TotalTime }
    
    $uploadStats = Calculate-Statistics -Values $uploadTimes
    $analysisStats = Calculate-Statistics -Values $analysisTimes
    $totalStats = Calculate-Statistics -Values $totalTimes
    
    # Calculate rates
    $requestsPerSecond = if ($duration -gt 0) { [Math]::Round($totalRequests / $duration, 2) } else { 0 }
    $successRate = if ($totalRequests -gt 0) { [Math]::Round(($successfulAnalyses / $totalRequests) * 100, 2) } else { 0 }
    $errorRate = if ($totalRequests -gt 0) { [Math]::Round(($failedRequests / $totalRequests) * 100, 2) } else { 0 }
    
    return @{
        TestConfig = $TestConfig
        Summary = @{
            StartTime = $StartTime.ToString("yyyy-MM-dd HH:mm:ss")
            EndTime = $EndTime.ToString("yyyy-MM-dd HH:mm:ss")
            Duration = $duration
            TotalRequests = $totalRequests
            SuccessfulUploads = $successfulUploads
            SuccessfulAnalyses = $successfulAnalyses
            FailedRequests = $failedRequests
            RequestsPerSecond = $requestsPerSecond
            SuccessRate = $successRate
            ErrorRate = $errorRate
        }
        Metrics = @{
            Upload = $uploadStats
            Analysis = $analysisStats
            Total = $totalStats
        }
        Results = $TestResults
    }
}

# Functions are automatically available when dot-sourced

