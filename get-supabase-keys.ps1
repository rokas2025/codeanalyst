# Quick script to get Supabase service role key
Write-Host "🔑 Getting Supabase Service Role Key" -ForegroundColor Cyan
Write-Host ""

$supabaseUrl = "https://db.ecwpwmsqanlatfntzoul.supabase.co"
$projectRef = "ecwpwmsqanlatfntzoul"

Write-Host "Your Supabase Project: $projectRef" -ForegroundColor Green
Write-Host ""
Write-Host "To get the service_role key:" -ForegroundColor Yellow
Write-Host "1. Go to: https://supabase.com/dashboard/project/$projectRef/settings/api" -ForegroundColor White
Write-Host "2. Find 'service_role' key under 'Project API keys'" -ForegroundColor White
Write-Host "3. Click 'Copy' (it's a long string starting with 'eyJ...')" -ForegroundColor White
Write-Host ""
Write-Host "Paste the service_role key here:" -ForegroundColor Yellow
$serviceRoleKey = Read-Host "Service Role Key"

if ($serviceRoleKey -match "^eyJ") {
    Write-Host ""
    Write-Host "✅ Valid key format detected!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📤 Setting in Railway..." -ForegroundColor Cyan
    
    # Use Railway CLI to set the variable
    $env:SUPABASE_SERVICE_ROLE_KEY = $serviceRoleKey
    railway variables --set "SUPABASE_SERVICE_ROLE_KEY=$serviceRoleKey"
    
    Write-Host "✅ Railway variable set!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📤 Now setting in Vercel..." -ForegroundColor Cyan
    Write-Host "Run these commands manually:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "vercel env add VITE_SUPABASE_URL production" -ForegroundColor Gray
    Write-Host "# Enter: $supabaseUrl" -ForegroundColor Gray
    Write-Host ""
    Write-Host "vercel env add VITE_SUPABASE_ANON_KEY production" -ForegroundColor Gray
    Write-Host "# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjd3B3bXNxYW5sYXRmbnR6b3VsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NjI2NzksImV4cCI6MjA3MjUzODY3OX0.lGTlrC8ZnuD_ay4ne9JLqznG3O_UnrArTmNMn1UirDo" -ForegroundColor Gray
    
} else {
    Write-Host "❌ Invalid key format. Should start with 'eyJ'" -ForegroundColor Red
}

