# CodeAnalyst Local Backup Script
# Runs every 6 hours to create comprehensive backups

param(
    [string]$BackupPath = "C:\Backups\CodeAnalyst",
    [switch]$IncludeNodeModules = $false,
    [switch]$Verbose = $false
)

# Configuration
$ProjectPath = "C:\Users\rokas\OneDrive\Dokumentai\Analyst"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupName = "CodeAnalyst_Backup_$Timestamp"
$FullBackupPath = Join-Path $BackupPath $BackupName

# Create backup directory
if (-not (Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
    Write-Host "Created backup directory: $BackupPath" -ForegroundColor Green
}

Write-Host "=== CodeAnalyst Backup Started ===" -ForegroundColor Cyan
Write-Host "Timestamp: $(Get-Date)" -ForegroundColor Gray
Write-Host "Source: $ProjectPath" -ForegroundColor Gray
Write-Host "Destination: $FullBackupPath" -ForegroundColor Gray

# Create timestamped backup folder
New-Item -ItemType Directory -Path $FullBackupPath -Force | Out-Null

# Define what to exclude from backup
$ExcludePatterns = @(
    "node_modules",
    "dist",
    "build",
    ".git",
    "*.log",
    "tmp",
    "temp",
    ".DS_Store",
    "Thumbs.db",
    "*.tmp"
)

if (-not $IncludeNodeModules) {
    $ExcludePatterns += "node_modules"
}

# Function to copy files with exclusions
function Copy-ProjectFiles {
    param($Source, $Destination, $Exclude)
    
    $Items = Get-ChildItem -Path $Source -Recurse | Where-Object {
        $Item = $_
        $ShouldExclude = $false
        
        foreach ($Pattern in $Exclude) {
            if ($Item.Name -like $Pattern -or $Item.FullName -like "*\$Pattern\*") {
                $ShouldExclude = $true
                break
            }
        }
        
        return -not $ShouldExclude
    }
    
    foreach ($Item in $Items) {
        $RelativePath = $Item.FullName.Substring($Source.Length + 1)
        $DestPath = Join-Path $Destination $RelativePath
        
        if ($Item.PSIsContainer) {
            if (-not (Test-Path $DestPath)) {
                New-Item -ItemType Directory -Path $DestPath -Force | Out-Null
            }
        } else {
            $DestDir = Split-Path $DestPath
            if (-not (Test-Path $DestDir)) {
                New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
            }
            Copy-Item $Item.FullName -Destination $DestPath -Force
            
            if ($Verbose) {
                Write-Host "Copied: $RelativePath" -ForegroundColor Gray
            }
        }
    }
}

try {
    # 1. Copy project files
    Write-Host "Copying project files..." -ForegroundColor Yellow
    Copy-ProjectFiles -Source $ProjectPath -Destination $FullBackupPath -Exclude $ExcludePatterns
    Write-Host "✓ Project files copied" -ForegroundColor Green
    
    # 2. Export package.json dependencies
    Write-Host "Exporting dependencies..." -ForegroundColor Yellow
    $PackageJsonPath = Join-Path $ProjectPath "package.json"
    if (Test-Path $PackageJsonPath) {
        $BackendPackageJsonPath = Join-Path $ProjectPath "backend\package.json"
        
        # Create dependencies export
        $DepsExport = @{
            timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            frontend_package = if (Test-Path $PackageJsonPath) { Get-Content $PackageJsonPath | ConvertFrom-Json } else { $null }
            backend_package = if (Test-Path $BackendPackageJsonPath) { Get-Content $BackendPackageJsonPath | ConvertFrom-Json } else { $null }
        }
        
        $DepsExport | ConvertTo-Json -Depth 10 | Out-File -FilePath (Join-Path $FullBackupPath "dependencies_export.json") -Encoding UTF8
        Write-Host "✓ Dependencies exported" -ForegroundColor Green
    }
    
    # 3. Git information
    Write-Host "Exporting Git information..." -ForegroundColor Yellow
    Push-Location $ProjectPath
    try {
        $GitInfo = @{
            timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            current_branch = (git branch --show-current 2>$null)
            last_commit = (git log -1 --oneline 2>$null)
            git_status = (git status --porcelain 2>$null)
            remote_url = (git remote get-url origin 2>$null)
            all_branches = (git branch -a 2>$null)
        }
        
        $GitInfo | ConvertTo-Json -Depth 5 | Out-File -FilePath (Join-Path $FullBackupPath "git_info.json") -Encoding UTF8
        Write-Host "✓ Git information exported" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠ Git information export failed: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    finally {
        Pop-Location
    }
    
    # 4. Environment files backup (without sensitive data)
    Write-Host "Backing up environment templates..." -ForegroundColor Yellow
    $EnvFiles = @("frontend.env.example", "env.production", ".env.example")
    foreach ($EnvFile in $EnvFiles) {
        $EnvPath = Join-Path $ProjectPath $EnvFile
        if (Test-Path $EnvPath) {
            Copy-Item $EnvPath -Destination $FullBackupPath -Force
        }
    }
    Write-Host "✓ Environment templates backed up" -ForegroundColor Green
    
    # 5. Create backup manifest
    Write-Host "Creating backup manifest..." -ForegroundColor Yellow
    $Manifest = @{
        backup_date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        backup_name = $BackupName
        project_path = $ProjectPath
        backup_path = $FullBackupPath
        excluded_patterns = $ExcludePatterns
        include_node_modules = $IncludeNodeModules
        backup_size_mb = [math]::Round((Get-ChildItem $FullBackupPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
        file_count = (Get-ChildItem $FullBackupPath -Recurse -File).Count
        created_by = "CodeAnalyst Backup Script v1.0"
    }
    
    $Manifest | ConvertTo-Json -Depth 5 | Out-File -FilePath (Join-Path $FullBackupPath "backup_manifest.json") -Encoding UTF8
    Write-Host "✓ Backup manifest created" -ForegroundColor Green
    
    # 6. Cleanup old backups (keep last 10)
    Write-Host "Cleaning up old backups..." -ForegroundColor Yellow
    $OldBackups = Get-ChildItem $BackupPath -Directory | 
                  Where-Object { $_.Name -like "CodeAnalyst_Backup_*" } | 
                  Sort-Object CreationTime -Descending | 
                  Select-Object -Skip 10
    
    foreach ($OldBackup in $OldBackups) {
        Remove-Item $OldBackup.FullName -Recurse -Force
        Write-Host "Removed old backup: $($OldBackup.Name)" -ForegroundColor Gray
    }
    Write-Host "✓ Old backups cleaned up" -ForegroundColor Green
    
    # 7. Final summary
    $BackupSize = [math]::Round((Get-ChildItem $FullBackupPath -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    $FileCount = (Get-ChildItem $FullBackupPath -Recurse -File).Count
    
    Write-Host ""
    Write-Host "=== Backup Completed Successfully ===" -ForegroundColor Green
    Write-Host "Backup Location: $FullBackupPath" -ForegroundColor Cyan
    Write-Host "Backup Size: $BackupSize MB" -ForegroundColor Cyan
    Write-Host "Files Backed Up: $FileCount" -ForegroundColor Cyan
    Write-Host "Completed: $(Get-Date)" -ForegroundColor Gray
    
    # Log to backup history
    $LogEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - SUCCESS - $BackupName - $BackupSize MB - $FileCount files"
    $LogEntry | Add-Content -Path (Join-Path $BackupPath "backup_history.log")
    
    return $true
}
catch {
    Write-Host ""
    Write-Host "=== Backup Failed ===" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Log error
    $ErrorEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') - ERROR - $($_.Exception.Message)"
    $ErrorEntry | Add-Content -Path (Join-Path $BackupPath "backup_history.log")
    
    return $false
}
