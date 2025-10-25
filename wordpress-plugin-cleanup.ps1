# WordPress Plugin Cleanup Script
# Helps users clean up broken CodeAnalyst plugin installations

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "CodeAnalyst WordPress Plugin Cleanup Tool" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Get WordPress installation path from user
Write-Host "This tool will help you remove broken CodeAnalyst plugin installations." -ForegroundColor White
Write-Host ""
$wpPath = Read-Host "Enter your WordPress installation path (e.g., C:\xampp\htdocs\wordpress)"

if (-not (Test-Path $wpPath)) {
    Write-Host ""
    Write-Host "Error: Path not found: $wpPath" -ForegroundColor Red
    Write-Host "Please check the path and try again." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

$pluginsPath = Join-Path -Path $wpPath -ChildPath "wp-content\plugins"

if (-not (Test-Path $pluginsPath)) {
    Write-Host ""
    Write-Host "Error: wp-content/plugins folder not found!" -ForegroundColor Red
    Write-Host "Make sure you entered the correct WordPress root directory." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Scanning for CodeAnalyst plugin folders..." -ForegroundColor Yellow

# Find all codeanalyst-connector folders
$folders = Get-ChildItem -Path $pluginsPath -Directory -Filter "codeanalyst-connector*"

if ($folders.Count -eq 0) {
    Write-Host ""
    Write-Host "No CodeAnalyst plugin folders found." -ForegroundColor Green
    Write-Host "You can now install the plugin fresh." -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 0
}

Write-Host ""
Write-Host "Found $($folders.Count) CodeAnalyst plugin folder(s):" -ForegroundColor Yellow
Write-Host ""
foreach ($folder in $folders) {
    $size = (Get-ChildItem -Path $folder.FullName -Recurse -File | Measure-Object -Property Length -Sum).Sum
    $sizeKB = [math]::Round($size / 1KB, 2)
    Write-Host "  - $($folder.Name) ($sizeKB KB)" -ForegroundColor White
}

Write-Host ""
Write-Host "WARNING: This will permanently delete these folders!" -ForegroundColor Red
Write-Host ""
$confirm = Read-Host "Delete all these folders? Type 'yes' to confirm"

if ($confirm -eq "yes") {
    Write-Host ""
    Write-Host "Deleting folders..." -ForegroundColor Yellow
    Write-Host ""
    
    $successCount = 0
    $failCount = 0
    
    foreach ($folder in $folders) {
        try {
            Remove-Item $folder.FullName -Recurse -Force -ErrorAction Stop
            Write-Host "  [OK] Deleted: $($folder.Name)" -ForegroundColor Green
            $successCount++
        }
        catch {
            Write-Host "  [FAIL] Could not delete: $($folder.Name)" -ForegroundColor Red
            Write-Host "         Error: $($_.Exception.Message)" -ForegroundColor Red
            $failCount++
        }
    }
    
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "Cleanup Summary:" -ForegroundColor Cyan
    Write-Host "  - Deleted: $successCount folder(s)" -ForegroundColor Green
    Write-Host "  - Failed: $failCount folder(s)" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    
    if ($successCount -gt 0) {
        Write-Host "Success! You can now install the plugin fresh." -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Download the plugin from https://app.beenex.dev/connected-sites" -ForegroundColor White
        Write-Host "  2. Upload to WordPress via Plugins -> Add New -> Upload" -ForegroundColor White
        Write-Host "  3. Activate the plugin" -ForegroundColor White
    }
    
    if ($failCount -gt 0) {
        Write-Host ""
        Write-Host "Some folders could not be deleted." -ForegroundColor Yellow
        Write-Host "You may need to:" -ForegroundColor White
        Write-Host "  - Close any programs accessing those files" -ForegroundColor White
        Write-Host "  - Run this script as Administrator" -ForegroundColor White
        Write-Host "  - Delete manually via FTP or File Manager" -ForegroundColor White
    }
}
else {
    Write-Host ""
    Write-Host "Cleanup cancelled. No files were deleted." -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to exit"

