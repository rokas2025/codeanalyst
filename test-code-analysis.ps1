# Test Code Analysis Flow
# This tests the complete code analysis system end-to-end

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CODE ANALYST TESTING SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$backendUrl = "https://codeanalyst-production.up.railway.app/api"

# Step 1: Login with demo credentials
Write-Host "[1/5] Logging in..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "test@demo.com"
        password = "test123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$backendUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Login successful!" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Create a test GitHub analysis request
Write-Host ""
Write-Host "[2/5] Starting GitHub repository analysis..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    # Use a small test repository for faster testing
    $analysisBody = @{
        repoUrl = "https://github.com/octocat/Hello-World"
        options = @{
            aiProfile = "technical"
            includeTests = $false
        }
    } | ConvertTo-Json -Depth 3

    $analysisResponse = Invoke-RestMethod -Uri "$backendUrl/code-analysis/github" -Method Post -Body $analysisBody -Headers $headers -ContentType "application/json"
    $analysisId = $analysisResponse.analysisId
    Write-Host "✅ Analysis started!" -ForegroundColor Green
    Write-Host "   Analysis ID: $analysisId" -ForegroundColor Gray
    Write-Host "   Status: $($analysisResponse.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Analysis failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Response: $($_.Exception.Response | ConvertTo-Json)" -ForegroundColor Red
    exit 1
}

# Step 3: Poll for progress
Write-Host ""
Write-Host "[3/5] Polling for progress..." -ForegroundColor Yellow
$maxPolls = 20
$pollCount = 0
$lastProgress = -1

while ($pollCount -lt $maxPolls) {
    try {
        $statusResponse = Invoke-RestMethod -Uri "$backendUrl/code-analysis/status/$analysisId" -Method Get -Headers $headers
        
        if ($statusResponse.progress -ne $lastProgress) {
            Write-Host "   Progress: $($statusResponse.progress)% - Status: $($statusResponse.status)" -ForegroundColor Cyan
            $lastProgress = $statusResponse.progress
        }
        
        if ($statusResponse.status -eq "completed") {
            Write-Host "✅ Analysis completed!" -ForegroundColor Green
            break
        }
        
        if ($statusResponse.status -eq "failed") {
            Write-Host "❌ Analysis failed: $($statusResponse.error_message)" -ForegroundColor Red
            exit 1
        }
        
        Start-Sleep -Seconds 3
        $pollCount++
    } catch {
        Write-Host "⚠️ Polling error: $($_.Exception.Message)" -ForegroundColor Yellow
        $pollCount++
    }
}

if ($pollCount -ge $maxPolls) {
    Write-Host "⚠️ Analysis still running after $maxPolls polls (timeout)" -ForegroundColor Yellow
}

# Step 4: Get final results
Write-Host ""
Write-Host "[4/5] Fetching final results..." -ForegroundColor Yellow
try {
    $resultsResponse = Invoke-RestMethod -Uri "$backendUrl/code-analysis/status/$analysisId" -Method Get -Headers $headers
    
    Write-Host "✅ Results retrieved!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "ANALYSIS RESULTS" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Status: $($resultsResponse.status)" -ForegroundColor White
    Write-Host "Progress: $($resultsResponse.progress)%" -ForegroundColor White
    
    if ($resultsResponse.analysis_result) {
        $result = $resultsResponse.analysis_result | ConvertFrom-Json
        Write-Host ""
        Write-Host "Technologies Found: $($result.technologies.count)" -ForegroundColor White
        if ($result.improvements) {
            Write-Host "Improvements Suggested: $($result.improvements.count)" -ForegroundColor White
        }
        if ($result.summary) {
            Write-Host ""
            Write-Host "Summary:" -ForegroundColor Yellow
            Write-Host $result.summary -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ Failed to get results: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Check Railway logs
Write-Host ""
Write-Host "[5/5] Test Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Check Railway logs for backend errors" -ForegroundColor White
Write-Host "2. Verify database updated_at trigger is working" -ForegroundColor White
Write-Host "3. Check if analysis result was saved to database" -ForegroundColor White
Write-Host ""

