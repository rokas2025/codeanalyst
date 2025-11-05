# WordPress Plugin Build Script
# This script creates a properly structured WordPress plugin ZIP
# DO NOT MODIFY - This is the ONLY way to build the plugin

Write-Host "🔨 Building CodeAnalyst Connector Plugin..." -ForegroundColor Cyan

# Get plugin version from main file
$pluginFile = Get-Content "wordpress-plugin/codeanalyst-connector.php" -Raw
if ($pluginFile -match "Version:\s*(\d+\.\d+\.\d+)") {
    $version = $matches[1]
    Write-Host "📦 Version: $version" -ForegroundColor Green
} else {
    Write-Host "❌ Could not detect version from plugin file" -ForegroundColor Red
    exit 1
}

# Clean up old builds
Write-Host "🧹 Cleaning up old builds..." -ForegroundColor Yellow
Remove-Item "backend/codeanalyst-connector.zip" -ErrorAction SilentlyContinue
Remove-Item "wordpress-plugin/*.zip" -ErrorAction SilentlyContinue

# Create ZIP with correct structure (files at root level, no parent folder)
Write-Host "📦 Creating ZIP archive..." -ForegroundColor Yellow
Set-Location "wordpress-plugin"

Compress-Archive -Path admin,includes,*.php,*.txt -DestinationPath "../backend/codeanalyst-connector.zip" -Force

Set-Location ".."

# Verify ZIP structure
Write-Host "✅ Verifying ZIP structure..." -ForegroundColor Yellow
Add-Type -Assembly System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("$PWD\backend\codeanalyst-connector.zip")
$entries = $zip.Entries | Select-Object -ExpandProperty FullName

# Check for required files
$requiredFiles = @(
    "admin/settings-page.php",
    "includes/rest-api.php",
    "includes/preview-handler.php",
    "codeanalyst-connector.php"
)

$allGood = $true
foreach ($file in $requiredFiles) {
    if ($entries -contains $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file MISSING!" -ForegroundColor Red
        $allGood = $false
    }
}

$zip.Dispose()

if ($allGood) {
    Write-Host "`n✅ Plugin built successfully!" -ForegroundColor Green
    Write-Host "📍 Location: backend/codeanalyst-connector.zip" -ForegroundColor Cyan
    Write-Host "📊 Version: $version" -ForegroundColor Cyan
    
    # Get file size
    $fileSize = (Get-Item "backend/codeanalyst-connector.zip").Length
    $fileSizeKB = [math]::Round($fileSize / 1KB, 2)
    Write-Host "📦 Size: $fileSizeKB KB" -ForegroundColor Cyan
    
    Write-Host "`n🚀 Next steps:" -ForegroundColor Yellow
    Write-Host "  1. git add backend/codeanalyst-connector.zip"
    Write-Host "  2. git commit -m 'build: Plugin v$version'"
    Write-Host "  3. git push origin main"
    Write-Host "  4. Wait for Railway to deploy (2-3 minutes)"
    Write-Host "  5. Download from: https://app.beenex.dev/connected-sites"
} else {
    Write-Host "`n❌ Plugin build FAILED! Missing required files." -ForegroundColor Red
    exit 1
}

Write-Host "`n💡 TIP: Always use this script to build the plugin!" -ForegroundColor Cyan
Write-Host "   Never create ZIP manually to avoid structure issues." -ForegroundColor Cyan

