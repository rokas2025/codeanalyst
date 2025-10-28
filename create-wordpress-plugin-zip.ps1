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

# Create temporary staging directory
# IMPORTANT: WordPress extracts ZIP and creates folder from ZIP name
# Files should be at ROOT of ZIP, not in a subfolder
$tempStaging = Join-Path -Path $env:TEMP -ChildPath "codeanalyst-staging"

if (Test-Path $tempStaging) {
    Remove-Item $tempStaging -Recurse -Force
}
New-Item -ItemType Directory -Path $tempStaging -Force | Out-Null

# Copy plugin files DIRECTLY to staging root (no subfolder)
# WordPress will create the codeanalyst-connector/ folder when extracting
Copy-Item -Path "$pluginDir\*" -Destination $tempStaging -Recurse -Exclude @('.git*', '.DS_Store', 'node_modules', '*.zip')

# Create ZIP with proper folder structure using .NET System.IO.Compression
# CRITICAL: Manually create entries with FORWARD SLASHES for cross-platform compatibility
# Windows CreateFromDirectory uses backslashes which breaks on Linux WordPress servers
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.IO.Compression

# Remove old zip if exists
if (Test-Path $destination) {
    Remove-Item $destination -Force
}

Write-Host "Creating ZIP with forward slash paths for cross-platform compatibility..." -ForegroundColor Yellow

# Create ZIP archive manually to control path separators
$zipArchive = [System.IO.Compression.ZipFile]::Open($destination, 'Create')

try {
    # Get all files recursively from staging directory
    $files = Get-ChildItem -Path $tempStaging -Recurse -File
    
    foreach ($file in $files) {
        # Get relative path from staging directory
        $relativePath = $file.FullName.Substring($tempStaging.Length + 1)
        
        # CRITICAL: Replace backslashes with forward slashes for ZIP standard
        $zipEntryName = $relativePath -replace '\\', '/'
        
        Write-Host "  Adding: $zipEntryName" -ForegroundColor Gray
        
        # Create entry in ZIP with forward slash path
        $entry = $zipArchive.CreateEntry($zipEntryName, 'Optimal')
        
        # Copy file contents to ZIP entry
        $entryStream = $entry.Open()
        $fileStream = [System.IO.File]::OpenRead($file.FullName)
        $fileStream.CopyTo($entryStream)
        $fileStream.Close()
        $entryStream.Close()
    }
    
    Write-Host "ZIP created with forward slash paths (cross-platform compatible)" -ForegroundColor Green
}
finally {
    # Always close the ZIP archive
    $zipArchive.Dispose()
}

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

