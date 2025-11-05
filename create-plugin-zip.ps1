# WordPress Plugin ZIP Creator - CORRECT METHOD
# Uses .NET ZipFile API directly to ensure proper path separators

$ErrorActionPreference = "Stop"

Write-Host "Creating WordPress plugin ZIP with proper structure..." -ForegroundColor Cyan

# Paths
$sourceDir = "wordpress-plugin"
$outputZip = "backend/codeanalyst-connector.zip"
$pluginFolderName = "codeanalyst-connector"

# Remove old ZIP
if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
    Write-Host "Removed old ZIP" -ForegroundColor Yellow
}

# Ensure output directory exists
$outputDir = Split-Path $outputZip -Parent
if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Load .NET compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

# Get absolute paths
$sourceAbsolute = (Resolve-Path $sourceDir).Path
$outputAbsolute = Join-Path (Get-Location) $outputZip

# Create ZIP file
$zip = [System.IO.Compression.ZipFile]::Open($outputAbsolute, [System.IO.Compression.ZipArchiveMode]::Create)

try {
    # Get all files recursively
    $files = Get-ChildItem -Path $sourceAbsolute -Recurse -File
    
    foreach ($file in $files) {
        # Get relative path from source directory
        $relativePath = $file.FullName.Substring($sourceAbsolute.Length + 1)
        
        # CRITICAL: Force forward slashes for ZIP standard
        $zipPath = "$pluginFolderName/" + $relativePath.Replace('\', '/')
        
        Write-Host "  Adding: $zipPath" -ForegroundColor Gray
        
        # Add file to ZIP
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $zipPath, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    }
    
    Write-Host "`n✅ ZIP created successfully!" -ForegroundColor Green
    Write-Host "Location: $outputZip" -ForegroundColor Cyan
    
} finally {
    # Always dispose the ZIP
    $zip.Dispose()
}

# Verify structure
Write-Host "`nVerifying ZIP structure..." -ForegroundColor Yellow
$verifyZip = [System.IO.Compression.ZipFile]::OpenRead($outputAbsolute)
$entries = $verifyZip.Entries | Select-Object -First 10 -ExpandProperty FullName
$verifyZip.Dispose()

Write-Host "First 10 entries:" -ForegroundColor Cyan
$entries | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

Write-Host "`n✅ Done! Ready to deploy." -ForegroundColor Green
