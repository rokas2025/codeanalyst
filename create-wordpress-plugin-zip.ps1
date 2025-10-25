# Create WordPress Plugin ZIP
# This script packages the CodeAnalyst WordPress plugin for distribution

Write-Host "Creating CodeAnalyst WordPress Plugin ZIP..." -ForegroundColor Cyan

# Define paths
$pluginDir = "wordpress-plugin"
$outputFile = "codeanalyst-connector.zip"

# Check if plugin directory exists
if (-not (Test-Path $pluginDir)) {
    Write-Host "Error: WordPress plugin directory not found!" -ForegroundColor Red
    exit 1
}

# Remove existing zip if it exists
if (Test-Path $outputFile) {
    Write-Host "Removing existing ZIP file..." -ForegroundColor Yellow
    Remove-Item $outputFile -Force
}

Write-Host "Packaging plugin files..." -ForegroundColor Green

# Create ZIP archive
# We need to compress the CONTENTS of the wordpress-plugin folder, not the folder itself
$source = Get-Item -Path $pluginDir
$destination = Join-Path -Path $PWD -ChildPath $outputFile

# Create temporary staging directory structure
# IMPORTANT: WordPress expects the ZIP to contain a folder named 'codeanalyst-connector'
# with all plugin files inside it, not just the files directly
$tempStaging = Join-Path -Path $env:TEMP -ChildPath "codeanalyst-staging"
$tempPluginDir = Join-Path -Path $tempStaging -ChildPath "codeanalyst-connector"

if (Test-Path $tempStaging) {
    Remove-Item $tempStaging -Recurse -Force
}
New-Item -ItemType Directory -Path $tempPluginDir -Force | Out-Null

# Copy plugin files to the properly named folder
Copy-Item -Path "$pluginDir\*" -Destination $tempPluginDir -Recurse -Exclude @('.git*', '.DS_Store', 'node_modules', '*.zip')

# Create ZIP from staging directory (this will include the codeanalyst-connector folder)
Compress-Archive -Path "$tempStaging\*" -DestinationPath $destination -Force

# Clean up staging directory
Remove-Item $tempStaging -Recurse -Force

# Check if ZIP was created successfully
if (Test-Path $outputFile) {
    $size = (Get-Item $outputFile).Length
    $sizeKB = [math]::Round($size / 1KB, 2)
    Write-Host "`nSuccess! Plugin ZIP created:" -ForegroundColor Green
    Write-Host "  File: $outputFile" -ForegroundColor White
    Write-Host "  Size: $sizeKB KB" -ForegroundColor White
    Write-Host "`nThe plugin is ready for distribution!" -ForegroundColor Cyan
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "  1. Upload to GitHub Releases" -ForegroundColor Gray
    Write-Host "  2. Share with users for manual installation" -ForegroundColor Gray
    Write-Host "  3. Submit to WordPress.org (future)" -ForegroundColor Gray
}
else {
    Write-Host "Error: Failed to create ZIP file!" -ForegroundColor Red
    exit 1
}

Write-Host "`nDone!" -ForegroundColor Green

