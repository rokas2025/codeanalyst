# Test Script for New Analysis Endpoints
# Make sure you're logged in to get a valid token

$baseUrl = "https://codeanalyst-production.up.railway.app/api"

# Get token from localStorage (you need to be logged in via frontend first)
# Or use a dev token for testing
$token = "dev-token-test"  # This should work with your dev auth

Write-Host "🧪 Testing New Analysis Endpoints" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Readability Analysis
Write-Host "1️⃣ Testing Readability Analysis..." -ForegroundColor Yellow
$readabilityBody = @{
    text = "This is a sample text to analyze. It contains multiple sentences. Some are short. Others might be longer with more complex vocabulary and structure. This helps test the readability metrics comprehensively."
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/content-analysis/readability" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $token"
            "ngrok-skip-browser-warning" = "true"
        } `
        -Body $readabilityBody
    
    Write-Host "✅ Readability Test PASSED" -ForegroundColor Green
    Write-Host "   - Flesch Score: $($response.scores.fleschReadingEase.score)" -ForegroundColor White
    Write-Host "   - Grade: $($response.overallGrade)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Readability Test FAILED: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 2: PageSpeed Analysis
Write-Host "2️⃣ Testing PageSpeed Analysis..." -ForegroundColor Yellow
$pagespeedBody = @{
    url = "https://example.com"
    strategy = "mobile"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/url-analysis/pagespeed" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $token"
            "ngrok-skip-browser-warning" = "true"
        } `
        -Body $pagespeedBody `
        -TimeoutSec 120
    
    Write-Host "✅ PageSpeed Test PASSED" -ForegroundColor Green
    Write-Host "   - Performance: $($response.scores.performance)/100" -ForegroundColor White
    Write-Host "   - SEO: $($response.scores.seo)/100" -ForegroundColor White
    Write-Host "   - Accessibility: $($response.scores.accessibility)/100" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ PageSpeed Test FAILED: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 3: Security Analysis
Write-Host "3️⃣ Testing Mozilla Observatory Security Analysis..." -ForegroundColor Yellow
$securityBody = @{
    url = "https://example.com"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/url-analysis/security" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $token"
            "ngrok-skip-browser-warning" = "true"
        } `
        -Body $securityBody `
        -TimeoutSec 60
    
    Write-Host "✅ Security Test PASSED" -ForegroundColor Green
    Write-Host "   - Grade: $($response.grade)" -ForegroundColor White
    Write-Host "   - Score: $($response.score)/100" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Security Test FAILED: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 4: SSL Labs Rate Limit Check
Write-Host "4️⃣ Testing SSL Labs Rate Limit Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/url-analysis/ssl/rate-limit-info/example.com" `
        -Method Get `
        -Headers @{
            "Authorization" = "Bearer $token"
            "ngrok-skip-browser-warning" = "true"
        }
    
    Write-Host "✅ SSL Rate Limit Check PASSED" -ForegroundColor Green
    Write-Host "   - Can Scan: $($response.canScanNow)" -ForegroundColor White
    if (-not $response.canScanNow) {
        Write-Host "   - Remaining Minutes: $($response.remainingMinutes)" -ForegroundColor White
    }
    Write-Host ""
} catch {
    Write-Host "❌ SSL Rate Limit Check FAILED: $_" -ForegroundColor Red
    Write-Host ""
}

# Test 5: Yoast SEO Analysis
Write-Host "5️⃣ Testing Yoast SEO Analysis..." -ForegroundColor Yellow
$seoBody = @{
    content = "<h1>SEO Example Title</h1><p>This is content about SEO optimization techniques. SEO is important for search rankings.</p><p>We should use the keyword naturally throughout the content.</p>"
    keyword = "SEO"
    title = "SEO Example Title"
    metaDescription = "Learn about SEO optimization techniques and best practices for improving search engine rankings and visibility online."
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/content-analysis/seo" `
        -Method Post `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $token"
            "ngrok-skip-browser-warning" = "true"
        } `
        -Body $seoBody
    
    Write-Host "✅ Yoast SEO Test PASSED" -ForegroundColor Green
    Write-Host "   - SEO Score: $($response.overallScore)/100" -ForegroundColor White
    Write-Host "   - Grade: $($response.grade)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ Yoast SEO Test FAILED: $_" -ForegroundColor Red
    Write-Host ""
}

Write-Host "=================================" -ForegroundColor Cyan
Write-Host "🎉 Testing Complete!" -ForegroundColor Cyan

