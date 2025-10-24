# Configure Supabase Auth Settings via API
$projectRef = "ecwpwmsqanlatfntzoul"
$serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjd3B3bXNxYW5sYXRmbnR6b3VsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk2MjY3OSwiZXhwIjoyMDcyNTM4Njc5fQ.hoayoW_LwwqAV6DRQXl5LCFrw5cXNGdznuz7RAL_pH4"

Write-Host "🔧 Configuring Supabase Auth Settings" -ForegroundColor Cyan
Write-Host ""

# Configure auth settings
$authConfig = @{
    SITE_URL = "https://app.beenex.dev"
    REDIRECT_URLS = @("https://app.beenex.dev/auth/callback")
    DISABLE_SIGNUP = $false
    MAILER_AUTOCONFIRM = $true  # Auto-confirm emails for testing
} | ConvertTo-Json

Write-Host "Auth Configuration:" -ForegroundColor Yellow
Write-Host $authConfig -ForegroundColor Gray
Write-Host ""

# Note: Supabase Management API requires a different access token
# Opening dashboard for manual configuration
Write-Host "⚠️  Supabase Auth configuration requires dashboard access" -ForegroundColor Yellow
Write-Host ""
Write-Host "Opening Supabase dashboard..." -ForegroundColor Cyan
Start-Process "https://supabase.com/dashboard/project/$projectRef/auth/providers"

Write-Host ""
Write-Host "📋 Please complete these steps:" -ForegroundColor White
Write-Host ""
Write-Host "1️⃣  Enable Email Provider:" -ForegroundColor Cyan
Write-Host "   ✓ Click on 'Email' in the providers list" -ForegroundColor Gray
Write-Host "   ✓ Toggle 'Enable Email provider' to ON" -ForegroundColor Gray
Write-Host "   ✓ Set 'Confirm email' to OFF (for testing)" -ForegroundColor Gray
Write-Host "   ✓ Click 'Save'" -ForegroundColor Gray
Write-Host ""

Write-Host "2️⃣  Configure URL Settings:" -ForegroundColor Cyan
Start-Sleep -Seconds 2
Start-Process "https://supabase.com/dashboard/project/$projectRef/auth/url-configuration"
Write-Host "   ✓ Site URL: https://app.beenex.dev" -ForegroundColor Gray
Write-Host "   ✓ Redirect URLs: https://app.beenex.dev/auth/callback" -ForegroundColor Gray
Write-Host "   ✓ Click 'Save'" -ForegroundColor Gray
Write-Host ""

Write-Host "3️⃣  (Optional) Enable Google OAuth:" -ForegroundColor Cyan
Write-Host "   ✓ Go back to Providers" -ForegroundColor Gray
Write-Host "   ✓ Click on 'Google'" -ForegroundColor Gray
Write-Host "   ✓ You'll need Google Cloud Console credentials" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Once you complete these steps, authentication will be fully working!" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key when done..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

