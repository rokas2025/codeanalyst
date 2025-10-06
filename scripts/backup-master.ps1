# CodeAnalyst Master Backup Script
# Orchestrates all backup types and runs every 6 hours

param(
    [string]$BackupBasePath = "C:\Backups\CodeAnalyst",
    [switch]$IncludeNodeModules = $false,
    [switch]$SkipDatabase = $false,
    [switch]$SkipGitHub = $false,
    [switch]$Verbose = $false,
    [switch]$TestMode = $false
)

# Configuration
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogPath = Join-Path $BackupBasePath "backup_master.log"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Ensure backup directory exists
if (-not (Test-Path $BackupBasePath)) {
    New-Item -ItemType Directory -Path $BackupBasePath -Force | Out-Null
}

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $LogEntry = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [$Level] $Message"
    Write-Host $LogEntry
    $LogEntry | Add-Content -Path $LogPath
}

Write-Log "=== CodeAnalyst Master Backup Started ===" "INFO"
Write-Log "Timestamp: $Timestamp" "INFO"
Write-Log "Base Path: $BackupBasePath" "INFO"
Write-Log "Test Mode: $TestMode" "INFO"

$Results = @{
    local_backup = $false
    github_backup = $false
    database_backup = $false
    start_time = Get-Date
    end_time = $null
    total_duration = $null
    errors = @()
}

try {
    # 1. Local File Backup
    Write-Log "Starting local file backup..." "INFO"
    try {
        $LocalBackupScript = Join-Path $ScriptPath "backup-local.ps1"
        $LocalParams = @{
            BackupPath = Join-Path $BackupBasePath "Local"
            IncludeNodeModules = $IncludeNodeModules
            Verbose = $Verbose
        }
        
        if ($TestMode) {
            Write-Log "TEST MODE: Would run local backup with params: $($LocalParams | ConvertTo-Json)" "INFO"
            $Results.local_backup = $true
        } else {
            $Results.local_backup = & $LocalBackupScript @LocalParams
        }
        
        if ($Results.local_backup) {
            Write-Log "✓ Local backup completed successfully" "SUCCESS"
        } else {
            Write-Log "✗ Local backup failed" "ERROR"
            $Results.errors += "Local backup failed"
        }
    }
    catch {
        Write-Log "✗ Local backup error: $($_.Exception.Message)" "ERROR"
        $Results.errors += "Local backup error: $($_.Exception.Message)"
    }
    
    # 2. GitHub Backup
    if (-not $SkipGitHub) {
        Write-Log "Starting GitHub backup..." "INFO"
        try {
            $GitHubBackupScript = Join-Path $ScriptPath "backup-github.ps1"
            $GitHubParams = @{
                MainRepo = "origin"
                CreateBackupBranch = $true
                Verbose = $Verbose
            }
            
            if ($TestMode) {
                Write-Log "TEST MODE: Would run GitHub backup with params: $($GitHubParams | ConvertTo-Json)" "INFO"
                $Results.github_backup = $true
            } else {
                $Results.github_backup = & $GitHubBackupScript @GitHubParams
            }
            
            if ($Results.github_backup) {
                Write-Log "✓ GitHub backup completed successfully" "SUCCESS"
            } else {
                Write-Log "✗ GitHub backup failed" "ERROR"
                $Results.errors += "GitHub backup failed"
            }
        }
        catch {
            Write-Log "✗ GitHub backup error: $($_.Exception.Message)" "ERROR"
            $Results.errors += "GitHub backup error: $($_.Exception.Message)"
        }
    } else {
        Write-Log "GitHub backup skipped" "INFO"
    }
    
    # 3. Database Backup
    if (-not $SkipDatabase) {
        Write-Log "Starting database backup..." "INFO"
        try {
            $DatabaseBackupScript = Join-Path $ScriptPath "backup-database.ps1"
            $DatabaseParams = @{
                BackupPath = Join-Path $BackupBasePath "Database"
                ProjectName = "melodious-presence"
                Verbose = $Verbose
            }
            
            if ($TestMode) {
                Write-Log "TEST MODE: Would run database backup with params: $($DatabaseParams | ConvertTo-Json)" "INFO"
                $Results.database_backup = $true
            } else {
                $Results.database_backup = & $DatabaseBackupScript @DatabaseParams
            }
            
            if ($Results.database_backup) {
                Write-Log "✓ Database backup completed successfully" "SUCCESS"
            } else {
                Write-Log "✗ Database backup failed" "ERROR"
                $Results.errors += "Database backup failed"
            }
        }
        catch {
            Write-Log "✗ Database backup error: $($_.Exception.Message)" "ERROR"
            $Results.errors += "Database backup error: $($_.Exception.Message)"
        }
    } else {
        Write-Log "Database backup skipped" "INFO"
    }
    
    # 4. Create consolidated backup report
    $Results.end_time = Get-Date
    $Results.total_duration = $Results.end_time - $Results.start_time
    
    $BackupReport = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        backup_session = $Timestamp
        results = $Results
        summary = @{
            total_backups = 3
            successful_backups = @($Results.local_backup, $Results.github_backup, $Results.database_backup).Where({$_}).Count
            failed_backups = @($Results.local_backup, $Results.github_backup, $Results.database_backup).Where({-not $_}).Count
            success_rate = [math]::Round((@($Results.local_backup, $Results.github_backup, $Results.database_backup).Where({$_}).Count / 3) * 100, 2)
        }
        configuration = @{
            base_path = $BackupBasePath
            include_node_modules = $IncludeNodeModules
            skip_database = $SkipDatabase
            skip_github = $SkipGitHub
            test_mode = $TestMode
        }
        next_backup = (Get-Date).AddHours(6).ToString("yyyy-MM-dd HH:mm:ss")
    }
    
    $ReportPath = Join-Path $BackupBasePath "backup_report_$Timestamp.json"
    $BackupReport | ConvertTo-Json -Depth 10 | Out-File -FilePath $ReportPath -Encoding UTF8
    
    # 5. Final summary
    $SuccessCount = @($Results.local_backup, $Results.github_backup, $Results.database_backup).Where({$_}).Count
    $TotalCount = 3
    
    Write-Log "" "INFO"
    Write-Log "=== Master Backup Completed ===" "INFO"
    $SuccessRate = [math]::Round(($SuccessCount/$TotalCount)*100, 2)
    Write-Log "Success Rate: $SuccessCount/$TotalCount ($SuccessRate%)" "INFO"
    Write-Log "Duration: $($Results.total_duration.ToString('hh\:mm\:ss'))" "INFO"
    Write-Log "Local Backup: $(if($Results.local_backup){'✓ Success'}else{'✗ Failed'})" "INFO"
    Write-Log "GitHub Backup: $(if($Results.github_backup){'✓ Success'}elseif($SkipGitHub){'⊝ Skipped'}else{'✗ Failed'})" "INFO"
    Write-Log "Database Backup: $(if($Results.database_backup){'✓ Success'}elseif($SkipDatabase){'⊝ Skipped'}else{'✗ Failed'})" "INFO"
    Write-Log "Report: $ReportPath" "INFO"
    Write-Log "Next Backup: $((Get-Date).AddHours(6).ToString('yyyy-MM-dd HH:mm:ss'))" "INFO"
    
    if ($Results.errors.Count -gt 0) {
        Write-Log "Errors encountered:" "ERROR"
        foreach ($Error in $Results.errors) {
            Write-Log "  - $Error" "ERROR"
        }
    }
    
    # 6. Send notification (if configured)
    if (-not $TestMode -and $SuccessCount -eq $TotalCount) {
        Write-Log "All backups completed successfully! 🎉" "SUCCESS"
    } elseif ($SuccessCount -gt 0) {
        Write-Log "Partial backup success - some backups failed ⚠️" "WARNING"
    } else {
        Write-Log "All backups failed! ❌" "ERROR"
    }
    
    return $BackupReport
}
catch {
    Write-Log "Master backup script error: $($_.Exception.Message)" "ERROR"
    return $null
}
