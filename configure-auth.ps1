# Configure Supabase Auth across all platforms
Write-Host "🚀 Configuring Supabase Auth" -ForegroundColor Cyan
Write-Host ""

$serviceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjd3B3bXNxYW5sYXRmbnR6b3VsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njk2MjY3OSwiZXhwIjoyMDcyNTM4Njc5fQ.hoayoW_LwwqAV6DRQXl5LCFrw5cXNGdznuz7RAL_pH4"
$supabaseUrl = "https://db.ecwpwmsqanlatfntzoul.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjd3B3bXNxYW5sYXRmbnR6b3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjI2NzksImV4cCI6MjA3MjUzODY3OX0.lGTlrC8ZnuD_ay4ne9JLqznG3O_UnrArTmNMn1UirDo"

# Step 1: Add to Railway
Write-Host "📦 Step 1: Configuring Railway (Backend)" -ForegroundColor Yellow
Write-Host "Adding SUPABASE_SERVICE_ROLE_KEY..." -ForegroundColor Gray

# Create a temporary file with the variable
$tempFile = [System.IO.Path]::GetTempFileName()
Set-Content -Path $tempFile -Value "SUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey"

# Use Railway CLI with the file
railway variables --kv-file $tempFile

Remove-Item $tempFile

Write-Host "✅ Railway configured!" -ForegroundColor Green
Write-Host ""

# Step 2: Configure Vercel
Write-Host "📦 Step 2: Configuring Vercel (Frontend)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please run these commands manually (Vercel CLI requires interactive input):" -ForegroundColor White
Write-Host ""
Write-Host "cd C:\Users\rokas\OneDrive\Dokumentai\Analyst" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Link to your Vercel project first:" -ForegroundColor Gray
Write-Host "vercel link" -ForegroundColor Cyan
Write-Host ""
Write-Host "# Then add environment variables:" -ForegroundColor Gray
Write-Host "vercel env add VITE_SUPABASE_URL production" -ForegroundColor Cyan
Write-Host "# When prompted, enter: $supabaseUrl" -ForegroundColor Gray
Write-Host ""
Write-Host "vercel env add VITE_SUPABASE_ANON_KEY production" -ForegroundColor Cyan
Write-Host "# When prompted, enter: $anonKey" -ForegroundColor Gray
Write-Host ""
Write-Host "# Redeploy:" -ForegroundColor Gray
Write-Host "vercel --prod" -ForegroundColor Cyan
Write-Host ""

# Step 3: Configure Supabase Auth settings
Write-Host "📦 Step 3: Configure Supabase Dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "Opening Supabase Authentication settings..." -ForegroundColor Gray
Start-Process "https://supabase.com/dashboard/project/ecwpwmsqanlatfntzoul/auth/providers"
Start-Sleep -Seconds 2
Write-Host ""
Write-Host "Please complete these steps in Supabase:" -ForegroundColor White
Write-Host ""
Write-Host "1. Enable Email Provider:" -ForegroundColor Cyan
Write-Host "   - Click on 'Email' in the providers list" -ForegroundColor Gray
Write-Host "   - Toggle 'Enable Email provider' to ON" -ForegroundColor Gray
Write-Host "   - Set 'Confirm email' to OFF (for testing)" -ForegroundColor Gray
Write-Host "   - Click 'Save'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure URL Settings:" -ForegroundColor Cyan
Write-Host "   - Go to 'URL Configuration' tab" -ForegroundColor Gray
Write-Host "   - Site URL: https://app.beenex.dev" -ForegroundColor Gray
Write-Host "   - Add Redirect URL: https://app.beenex.dev/auth/callback" -ForegroundColor Gray
Write-Host "   - Click 'Save'" -ForegroundColor Gray
Write-Host ""
Write-Host "3. (Optional) Enable Google OAuth:" -ForegroundColor Cyan
Write-Host "   - Click on 'Google' in the providers list" -ForegroundColor Gray
Write-Host "   - You'll need Google Cloud Console credentials" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ Configuration script complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Complete the Vercel commands above" -ForegroundColor White
Write-Host "2. Complete the Supabase dashboard steps" -ForegroundColor White
Write-Host "3. Wait ~2 minutes for deployments" -ForegroundColor White
Write-Host "4. Test at https://app.beenex.dev/register" -ForegroundColor White

