# CodeAnalyst Deployment Setup Script
# Run this script to configure everything for GitHub + Vercel deployment

Write-Host "🚀 CodeAnalyst Deployment Setup" -ForegroundColor Green
Write-Host ""

# Check if ngrok is available
try {
    $ngrokVersion = ngrok version
    Write-Host "✅ ngrok found: $ngrokVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ ngrok not found. Installing..." -ForegroundColor Red
    winget install --id ngrok.ngrok
    Write-Host "⚠️  Please restart PowerShell and run this script again" -ForegroundColor Yellow
    exit
}

# Prompt for ngrok API key
$ngrokApiKey = Read-Host "Enter your ngrok API key"
if ([string]::IsNullOrEmpty($ngrokApiKey)) {
    Write-Host "❌ ngrok API key is required" -ForegroundColor Red
    exit
}

# Configure ngrok
Write-Host "🔐 Configuring ngrok..." -ForegroundColor Blue
ngrok config add-authtoken $ngrokApiKey

# Check backend dependencies
Write-Host "📦 Checking backend dependencies..." -ForegroundColor Blue
cd backend
if (!(Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
}

# Create uploads and temp directories
if (!(Test-Path "uploads")) { New-Item -ItemType Directory -Name "uploads" }
if (!(Test-Path "temp")) { New-Item -ItemType Directory -Name "temp" }
if (!(Test-Path "logs")) { New-Item -ItemType Directory -Name "logs" }

# Start backend
Write-Host "🚀 Starting backend server..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-Command", "cd '$PWD'; npm start" -WindowStyle Normal

# Wait for backend to start
Write-Host "⏳ Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep 5

# Start ngrok tunnel
Write-Host "🌐 Starting ngrok tunnel..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-Command", "ngrok http 3001" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "1. Check the ngrok window for your tunnel URL (https://xxx.ngrok-free.app)"
Write-Host "2. Copy that URL"
Write-Host "3. Push your code to GitHub"
Write-Host "4. Deploy to Vercel with environment variable:"
Write-Host "   VITE_API_URL=https://your-ngrok-url.ngrok-free.app/api"
Write-Host ""
Write-Host "💡 Backend is running on http://localhost:3001" -ForegroundColor Yellow
Write-Host "💡 ngrok tunnel provides public access" -ForegroundColor Yellow
