# Proper WordPress Plugin ZIP Creator
# Creates ZIP with correct folder structure (not filename backslashes)

$ErrorActionPreference = "Stop"

Write-Host "Creating WordPress plugin ZIP with proper folder structure..." -ForegroundColor Cyan

# Paths
$sourceDir = "wordpress-plugin"
$outputZip = "backend/codeanalyst-connector.zip"

# Remove old ZIP
if (Test-Path $outputZip) {
    Remove-Item $outputZip -Force
    Write-Host "Removed old ZIP" -ForegroundColor Yellow
}

# Load .NET compression
Add-Type -Assembly System.IO.Compression.FileSystem

# Create ZIP
$zip = [System.IO.Compression.ZipFile]::Open($outputZip, [System.IO.Compression.ZipArchiveMode]::Create)

# Function to add files recursively
function Add-FilesToZip {
    param($Path, $ZipArchive, $BasePath)
    
    Get-ChildItem -Path $Path -Recurse -File | ForEach-Object {
        $relativePath = $_.FullName.Substring($BasePath.Length + 1)
        # Replace backslashes with forward slashes for ZIP
        $zipPath = $relativePath.Replace('\', '/')
        
        Write-Host "  Adding: $zipPath" -ForegroundColor Gray
        [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($ZipArchive, $_.FullName, $zipPath) | Out-Null
    }
}

# Add all files
$fullSourcePath = (Resolve-Path $sourceDir).Path
Add-FilesToZip -Path $fullSourcePath -ZipArchive $zip -BasePath $fullSourcePath

# Close ZIP
$zip.Dispose()

Write-Host "`n✅ ZIP created successfully!" -ForegroundColor Green
Write-Host "Location: $outputZip" -ForegroundColor Cyan

# Verify structure
Write-Host "`nVerifying ZIP structure..." -ForegroundColor Yellow
$verifyZip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $outputZip).Path)
$entries = $verifyZip.Entries | Select-Object -First 10 -ExpandProperty FullName
$verifyZip.Dispose()

Write-Host "First 10 entries:" -ForegroundColor Cyan
$entries | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }

Write-Host "`n✅ Done! Ready to deploy." -ForegroundColor Green

