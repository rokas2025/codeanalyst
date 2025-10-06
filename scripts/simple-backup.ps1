# Simple CodeAnalyst Backup Script
Write-Host "=== CodeAnalyst Simple Backup ===" -ForegroundColor Cyan

# Create backup directory
$BackupPath = "C:\Backups\CodeAnalyst\Simple"
if (-not (Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    Write-Host "Created backup directory: $BackupPath" -ForegroundColor Green
}

# Get timestamp
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFolder = Join-Path $BackupPath "Backup_$Timestamp"
New-Item -ItemType Directory -Path $BackupFolder -Force | Out-Null

Write-Host "Backing up to: $BackupFolder" -ForegroundColor Yellow

# Copy important files
$FilesToBackup = @(
    "package.json",
    "README.md", 
    "tsconfig.json",
    "vite.config.ts",
    "src",
    "backend",
    "docs"
)

$CopiedCount = 0
foreach ($Item in $FilesToBackup) {
    if (Test-Path $Item) {
        if ((Get-Item $Item).PSIsContainer) {
            # It's a directory
            Copy-Item $Item -Destination $BackupFolder -Recurse -Force
            Write-Host "Copied directory: $Item" -ForegroundColor Green
        } else {
            # It's a file
            Copy-Item $Item -Destination $BackupFolder -Force
            Write-Host "Copied file: $Item" -ForegroundColor Green
        }
        $CopiedCount++
    } else {
        Write-Host "Not found: $Item" -ForegroundColor Yellow
    }
}

# Create backup info
$BackupInfo = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    files_copied = $CopiedCount
    backup_path = $BackupFolder
    source_path = (Get-Location).Path
} | ConvertTo-Json

$BackupInfo | Out-File -FilePath (Join-Path $BackupFolder "backup_info.json") -Encoding UTF8

Write-Host ""
Write-Host "=== Backup Complete ===" -ForegroundColor Green
Write-Host "Files copied: $CopiedCount" -ForegroundColor Cyan
Write-Host "Backup location: $BackupFolder" -ForegroundColor Cyan
Write-Host "Backup info: backup_info.json" -ForegroundColor Cyan





