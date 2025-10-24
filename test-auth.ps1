# Test Supabase Auth Integration
Write-Host "🧪 Testing Supabase Auth Integration" -ForegroundColor Cyan
Write-Host ""

$backendUrl = "https://codeanalyst-production.up.railway.app"
$frontendUrl = "https://app.beenex.dev"

# Test 1: Backend Health Check
Write-Host "1️⃣  Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$backendUrl/health" -Method GET
    Write-Host "✅ Backend is running!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend health check failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Check if Supabase is configured
Write-Host "2️⃣  Checking Supabase Configuration..." -ForegroundColor Yellow
try {
    $testEmail = "test_$(Get-Random)@example.com"
    $testData = @{
        email = $testEmail
        password = "TestPassword123!"
        name = "Test User"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "$backendUrl/api/auth/register" -Method POST -Body $testData -ContentType "application/json" -ErrorAction Stop
    
    if ($response.StatusCode -eq 201) {
        Write-Host "✅ Supabase Auth is working!" -ForegroundColor Green
        $result = $response.Content | ConvertFrom-Json
        Write-Host "   User created: $($result.user.email)" -ForegroundColor Gray
        Write-Host "   Token received: $($result.token.Substring(0,20))..." -ForegroundColor Gray
    }
} catch {
    $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorResponse.error -like "*already exists*") {
        Write-Host "✅ Supabase Auth is working! (User already exists)" -ForegroundColor Green
    } elseif ($errorResponse.error -like "*not configured*") {
        Write-Host "❌ Supabase Auth NOT configured!" -ForegroundColor Red
        Write-Host "   Error: $($errorResponse.error)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Unexpected response: $($errorResponse.error)" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 3: Frontend accessibility
Write-Host "3️⃣  Testing Frontend..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri $frontendUrl -Method GET -ErrorAction Stop
    Write-Host "✅ Frontend is accessible!" -ForegroundColor Green
    Write-Host "   Status: $($frontend.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Frontend check failed: $_" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "Backend URL:  $backendUrl" -ForegroundColor White
Write-Host "Frontend URL: $frontendUrl" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open: $frontendUrl/register" -ForegroundColor White
Write-Host "2. Create an account with your email" -ForegroundColor White
Write-Host "3. You should be logged in automatically!" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Quick Links:" -ForegroundColor Cyan
Write-Host "   Register: $frontendUrl/register" -ForegroundColor Gray
Write-Host "   Login:    $frontendUrl/login" -ForegroundColor Gray
Write-Host "   Dashboard: $frontendUrl/dashboard" -ForegroundColor Gray

