# Setup Supabase Auth for CodeAnalyst
# This script will guide you through setting up Supabase Auth

Write-Host "🚀 CodeAnalyst Supabase Auth Setup" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Check if we already have Supabase credentials
$hasSupabase = $false
try {
    $railwayVars = railway variables 2>&1
    if ($railwayVars -match "SUPABASE_URL") {
        Write-Host "✅ Found existing Supabase configuration in Railway" -ForegroundColor Green
        $hasSupabase = $true
    }
} catch {
    Write-Host "⚠️  Railway CLI not found or not logged in" -ForegroundColor Yellow
}

if (-not $hasSupabase) {
    Write-Host "📝 Supabase Project Setup Required" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Please follow these steps:" -ForegroundColor White
    Write-Host ""
    Write-Host "1. Go to https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "2. Sign in or create a free account" -ForegroundColor White
    Write-Host "3. Click 'New Project'" -ForegroundColor White
    Write-Host "4. Fill in:" -ForegroundColor White
    Write-Host "   - Name: CodeAnalyst" -ForegroundColor Gray
    Write-Host "   - Database Password: (generate a strong password)" -ForegroundColor Gray
    Write-Host "   - Region: Choose closest to you" -ForegroundColor Gray
    Write-Host "5. Wait for project to be created (~2 minutes)" -ForegroundColor White
    Write-Host ""
    Write-Host "Press any key when your project is ready..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    Write-Host ""
}

Write-Host "🔑 Getting Supabase Credentials" -ForegroundColor Cyan
Write-Host ""
Write-Host "Go to: Settings → API in your Supabase dashboard" -ForegroundColor White
Write-Host ""
Write-Host "You'll need 3 values:" -ForegroundColor White
Write-Host "  1. Project URL (e.g., https://xxxxx.supabase.co)" -ForegroundColor Gray
Write-Host "  2. anon public key (starts with 'eyJ...')" -ForegroundColor Gray
Write-Host "  3. service_role secret key (starts with 'eyJ...')" -ForegroundColor Gray
Write-Host ""

# Get Project URL
Write-Host "Enter your Supabase Project URL:" -ForegroundColor Yellow
$supabaseUrl = Read-Host "URL"

# Get Anon Key
Write-Host ""
Write-Host "Enter your Supabase Anon Key (public):" -ForegroundColor Yellow
$supabaseAnonKey = Read-Host "Anon Key"

# Get Service Role Key
Write-Host ""
Write-Host "Enter your Supabase Service Role Key (secret):" -ForegroundColor Yellow
$supabaseServiceKey = Read-Host "Service Role Key"

Write-Host ""
Write-Host "📤 Setting Environment Variables..." -ForegroundColor Cyan

# Set Railway variables
Write-Host ""
Write-Host "Setting Railway (Backend) variables..." -ForegroundColor White
try {
    railway variables set SUPABASE_URL="$supabaseUrl" 2>&1 | Out-Null
    railway variables set SUPABASE_SERVICE_ROLE_KEY="$supabaseServiceKey" 2>&1 | Out-Null
    Write-Host "✅ Railway variables set" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set Railway variables: $_" -ForegroundColor Red
    Write-Host "   You may need to run: railway login" -ForegroundColor Yellow
}

# Set Vercel variables
Write-Host ""
Write-Host "Setting Vercel (Frontend) variables..." -ForegroundColor White
try {
    vercel env add VITE_SUPABASE_URL production 2>&1 | Out-Null
    Write-Host $supabaseUrl | vercel env add VITE_SUPABASE_URL production 2>&1 | Out-Null
    
    vercel env add VITE_SUPABASE_ANON_KEY production 2>&1 | Out-Null
    Write-Host $supabaseAnonKey | vercel env add VITE_SUPABASE_ANON_KEY production 2>&1 | Out-Null
    
    Write-Host "✅ Vercel variables set" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set Vercel variables: $_" -ForegroundColor Red
    Write-Host "   You may need to run: vercel login" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🔧 Configuring Supabase Auth Providers..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Now configure these in Supabase Dashboard:" -ForegroundColor White
Write-Host ""
Write-Host "1. Enable Email Authentication:" -ForegroundColor Yellow
Write-Host "   → Authentication → Providers → Email" -ForegroundColor Gray
Write-Host "   → Toggle 'Enable Email provider' ON" -ForegroundColor Gray
Write-Host "   → Confirm email: OFF (for faster testing)" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure Site URLs:" -ForegroundColor Yellow
Write-Host "   → Authentication → URL Configuration" -ForegroundColor Gray
Write-Host "   → Site URL: https://app.beenex.dev" -ForegroundColor Gray
Write-Host "   → Redirect URLs: https://app.beenex.dev/auth/callback" -ForegroundColor Gray
Write-Host ""
Write-Host "3. (Optional) Enable Google OAuth:" -ForegroundColor Yellow
Write-Host "   → Authentication → Providers → Google" -ForegroundColor Gray
Write-Host "   → You'll need Google Cloud Console credentials" -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key when configuration is complete..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host ""
Write-Host "🚀 Triggering Redeployment..." -ForegroundColor Cyan

# Trigger Railway redeploy
try {
    Write-Host "Redeploying Railway backend..." -ForegroundColor White
    railway up --detach 2>&1 | Out-Null
    Write-Host "✅ Railway redeployment triggered" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not trigger Railway redeploy automatically" -ForegroundColor Yellow
    Write-Host "   Push a commit to trigger redeploy" -ForegroundColor Gray
}

# Trigger Vercel redeploy
try {
    Write-Host "Redeploying Vercel frontend..." -ForegroundColor White
    vercel --prod 2>&1 | Out-Null
    Write-Host "✅ Vercel redeployment triggered" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not trigger Vercel redeploy automatically" -ForegroundColor Yellow
    Write-Host "   Push a commit to trigger redeploy" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "  ✓ Supabase credentials configured" -ForegroundColor Gray
Write-Host "  ✓ Railway environment variables set" -ForegroundColor Gray
Write-Host "  ✓ Vercel environment variables set" -ForegroundColor Gray
Write-Host "  ✓ Redeployment triggered" -ForegroundColor Gray
Write-Host ""
Write-Host "🧪 Test Your Setup:" -ForegroundColor Cyan
Write-Host "  1. Wait ~2 minutes for deployments" -ForegroundColor Gray
Write-Host "  2. Go to https://app.beenex.dev/register" -ForegroundColor Gray
Write-Host "  3. Create an account with email/password" -ForegroundColor Gray
Write-Host "  4. You should be logged in automatically!" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "  See HYBRID_AUTH_SETUP.md for more details" -ForegroundColor Gray
Write-Host ""

