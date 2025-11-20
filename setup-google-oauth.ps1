# Setup Google OAuth in Supabase
# This script configures Google OAuth provider in Supabase

Write-Host "🔧 Google OAuth Setup for Supabase" -ForegroundColor Cyan
Write-Host ""

# Supabase configuration
$SUPABASE_PROJECT_ID = "ecwpwmsqanlatfntzoul"
$SUPABASE_URL = "https://ecwpwmsqanlatfntzoul.supabase.co"

# Google OAuth credentials
$GOOGLE_CLIENT_ID = "47570713703-b0v8n3nval771sg7r1c6522qrua00riv.apps.googleusercontent.com"
$GOOGLE_CLIENT_SECRET = "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"

# Prompt for Supabase Access Token
Write-Host "Please enter your Supabase Access Token:" -ForegroundColor Yellow
Write-Host "(Get it from: https://supabase.com/dashboard/account/tokens)" -ForegroundColor Gray
$SUPABASE_ACCESS_TOKEN = Read-Host -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($SUPABASE_ACCESS_TOKEN)
$SUPABASE_ACCESS_TOKEN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ([string]::IsNullOrWhiteSpace($SUPABASE_ACCESS_TOKEN)) {
    Write-Host "❌ Error: Access token is required" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔄 Configuring Google OAuth provider..." -ForegroundColor Cyan

# Prepare the configuration payload
$body = @{
    enabled = $true
    client_id = $GOOGLE_CLIENT_ID
    secret = $GOOGLE_CLIENT_SECRET
} | ConvertTo-Json

# API endpoint
$apiUrl = "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_ID/config/auth/providers/google"

try {
    # Make the API request
    $response = Invoke-RestMethod -Uri $apiUrl -Method Put -Headers @{
        "Authorization" = "Bearer $SUPABASE_ACCESS_TOKEN"
        "Content-Type" = "application/json"
    } -Body $body

    Write-Host ""
    Write-Host "✅ Google OAuth configured successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Configuration:" -ForegroundColor Cyan
    Write-Host "  Provider: Google" -ForegroundColor White
    Write-Host "  Status: Enabled" -ForegroundColor Green
    Write-Host "  Client ID: $GOOGLE_CLIENT_ID" -ForegroundColor White
    Write-Host "  Redirect URL: $SUPABASE_URL/auth/v1/callback" -ForegroundColor White
    Write-Host ""
    Write-Host "🎉 You can now test Google login at: https://app.beenex.dev/login" -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "❌ Error configuring Google OAuth:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Configure manually in Supabase Dashboard" -ForegroundColor Yellow
    Write-Host "   URL: https://supabase.com/dashboard/project/$SUPABASE_PROJECT_ID/auth/providers" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

