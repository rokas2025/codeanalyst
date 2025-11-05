# Proper WordPress Plugin ZIP Creator
# Creates ZIP with correct folder structure

$ErrorActionPreference = "Stop"

Write-Host "Creating WordPress plugin ZIP with proper folder structure..." -ForegroundColor Cyan

# Paths
$sourceDir = "wordpress-plugin"
$outputZip = "backend/codeanalyst-connector.zip"
$tempDir = "temp-plugin-build"
$pluginFolderName = "codeanalyst-connector"

# Clean up any previous temp directory
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}

# Remove old ZIP
if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
    Write-Host "Removed old ZIP" -ForegroundColor Yellow
}

# Create temp directory with plugin folder name
$tempPluginPath = Join-Path $tempDir $pluginFolderName
New-Item -ItemType Directory -Path $tempPluginPath -Force | Out-Null

# Copy all plugin files to temp directory
Write-Host "Copying plugin files..." -ForegroundColor Cyan
Copy-Item -Path "$sourceDir\*" -Destination $tempPluginPath -Recurse -Force

# Create ZIP from temp directory (this will include the parent folder)
Write-Host "Creating ZIP archive..." -ForegroundColor Cyan
Compress-Archive -Path "$tempDir\*" -DestinationPath $outputZip -Force

# Clean up temp directory
Remove-Item $tempDir -Recurse -Force

Write-Host "`n✅ ZIP created successfully!" -ForegroundColor Green
Write-Host "Location: $outputZip" -ForegroundColor Cyan

# Verify structure using .NET
Write-Host "`nVerifying ZIP structure..." -ForegroundColor Yellow
Add-Type -AssemblyName System.IO.Compression.FileSystem
$outputZipAbsolute = Join-Path (Get-Location) $outputZip
$verifyZip = [System.IO.Compression.ZipFile]::OpenRead($outputZipAbsolute)
$entries = $verifyZip.Entries | Select-Object -First 10 -ExpandProperty FullName
$verifyZip.Dispose()

Write-Host "First 10 entries:" -ForegroundColor Cyan
$entries | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

Write-Host "`n✅ Done! Ready to deploy." -ForegroundColor Green
