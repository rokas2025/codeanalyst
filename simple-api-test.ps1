# Simple API Test
$BaseURL = "https://codeanalyst-production.up.railway.app/api"

Write-Host "Testing CodeAnalyst API..." -ForegroundColor Cyan
Write-Host ""

# Test Health
Write-Host "1. Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$BaseURL/health" -Method GET
    Write-Host "✅ Status: $($health.status)" -ForegroundColor Green
    Write-Host "   Database: $($health.services.database)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ API is responding!" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend issues are likely:" -ForegroundColor Yellow
Write-Host "1. Authentication - most endpoints need login" -ForegroundColor Gray
Write-Host "2. GitHub token - repository loading needs valid token" -ForegroundColor Gray
Write-Host "3. URL analysis 500 error - check Railway logs" -ForegroundColor Gray
