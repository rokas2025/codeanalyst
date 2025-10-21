# Railway CLI Setup Script for Windows PowerShell

Write-Host "Railway CLI Setup for CodeAnalyst Development" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
Write-Host "Checking if Railway CLI is installed..." -ForegroundColor Yellow
$railwayInstalled = Get-Command railway -ErrorAction SilentlyContinue

if (-not $railwayInstalled) {
    Write-Host "Railway CLI not found. Installing..." -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing Railway CLI via npm..." -ForegroundColor Yellow
    npm install -g @railway/cli
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Installation failed. Please install manually:" -ForegroundColor Red
        Write-Host "   npm install -g @railway/cli" -ForegroundColor White
        exit 1
    }
    
    Write-Host "Railway CLI installed successfully!" -ForegroundColor Green
} else {
    Write-Host "Railway CLI is already installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Login to Railway:" -ForegroundColor Yellow
Write-Host "   railway login" -ForegroundColor White
Write-Host ""
Write-Host "2. Link to your project:" -ForegroundColor Yellow
Write-Host "   railway link" -ForegroundColor White
Write-Host ""
Write-Host "3. List your services:" -ForegroundColor Yellow
Write-Host "   railway service" -ForegroundColor White
Write-Host ""
Write-Host "Or share your Railway API token for automatic setup!" -ForegroundColor Green
$tokenUrl = "https://railway.app/account/tokens"
Write-Host "Get token here: $tokenUrl" -ForegroundColor Cyan
Write-Host ""
