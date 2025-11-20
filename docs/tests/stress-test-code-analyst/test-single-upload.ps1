# Test single ZIP upload to verify backend is working
param(
    [string]$ZipFile = ".\sample-zips\project1-simple-html.zip",
    [string]$Email = "stress_test_user_001@codeanalyst.test",
    [string]$Password = "StressTest2024!"
)

$BackendUrl = "https://codeanalyst-production.up.railway.app/api"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Testing ZIP Upload" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
Write-Host "[1/3] Logging in as $Email..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$BackendUrl/auth/login-supabase" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"
    
    $token = $loginResponse.token
    Write-Host "   SUCCESS: Logged in" -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "   ERROR: Login failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Upload ZIP
Write-Host ""
Write-Host "[2/3] Uploading ZIP file..." -ForegroundColor Yellow
Write-Host "   File: $ZipFile" -ForegroundColor Gray

try {
    # Use .NET WebClient for file upload
    Add-Type -AssemblyName System.Net.Http
    
    $httpClient = New-Object System.Net.Http.HttpClient
    $httpClient.DefaultRequestHeaders.Add("Authorization", "Bearer $token")
    
    $multipartContent = New-Object System.Net.Http.MultipartFormDataContent
    
    $fileStream = [System.IO.File]::OpenRead($ZipFile)
    $fileContent = New-Object System.Net.Http.StreamContent($fileStream)
    $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("application/zip")
    
    $multipartContent.Add($fileContent, "zipFile", [System.IO.Path]::GetFileName($ZipFile))
    
    $uploadUrl = "$BackendUrl/code-analysis/zip"
    Write-Host "   Uploading to: $uploadUrl" -ForegroundColor Gray
    
    $response = $httpClient.PostAsync($uploadUrl, $multipartContent).Result
    $responseContent = $response.Content.ReadAsStringAsync().Result
    
    $fileStream.Close()
    $httpClient.Dispose()
    
    if ($response.IsSuccessStatusCode) {
        $result = $responseContent | ConvertFrom-Json
        Write-Host "   SUCCESS: File uploaded!" -ForegroundColor Green
        Write-Host "   Analysis ID: $($result.analysisId)" -ForegroundColor Gray
        Write-Host "   Status: $($result.status)" -ForegroundColor Gray
        
        $analysisId = $result.analysisId
    } else {
        Write-Host "   ERROR: Upload failed" -ForegroundColor Red
        Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Red
        Write-Host "   Response: $responseContent" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Check status
Write-Host ""
Write-Host "[3/3] Checking analysis status..." -ForegroundColor Yellow

try {
    Start-Sleep -Seconds 2
    
    $statusResponse = Invoke-RestMethod -Uri "$BackendUrl/code-analysis/status/$analysisId" `
        -Method Get `
        -Headers @{ "Authorization" = "Bearer $token" }
    
    Write-Host "   Status: $($statusResponse.status)" -ForegroundColor Green
    Write-Host "   Progress: $($statusResponse.progress)%" -ForegroundColor Gray
    
    if ($statusResponse.status -eq "analyzing" -or $statusResponse.status -eq "pending") {
        Write-Host ""
        Write-Host "   Analysis is processing..." -ForegroundColor Cyan
        Write-Host "   You can check status at: $BackendUrl/code-analysis/status/$analysisId" -ForegroundColor Gray
    }
} catch {
    Write-Host "   Could not check status: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "TEST COMPLETE" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend is working! You can now:" -ForegroundColor Cyan
Write-Host "  1. Upload files manually through the website" -ForegroundColor White
Write-Host "  2. Run the full stress test" -ForegroundColor White
Write-Host ""

