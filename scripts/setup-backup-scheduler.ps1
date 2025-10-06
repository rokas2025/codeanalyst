# Windows Task Scheduler Setup for CodeAnalyst Backups
# Creates scheduled task to run backups every 6 hours

param(
    [string]$TaskName = "CodeAnalyst_AutoBackup",
    [string]$BackupScriptPath = "",
    [string]$BackupBasePath = "C:\Backups\CodeAnalyst",
    [switch]$TestMode = $false,
    [switch]$RemoveExisting = $false
)

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires Administrator privileges to create scheduled tasks." -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    exit 1
}

# Set default script path if not provided
if (-not $BackupScriptPath) {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $BackupScriptPath = Join-Path $ScriptDir "backup-master.ps1"
}

Write-Host "=== CodeAnalyst Backup Scheduler Setup ===" -ForegroundColor Cyan
Write-Host "Task Name: $TaskName" -ForegroundColor Gray
Write-Host "Script Path: $BackupScriptPath" -ForegroundColor Gray
Write-Host "Backup Path: $BackupBasePath" -ForegroundColor Gray

try {
    # 1. Check if task already exists
    $ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($ExistingTask) {
        if ($RemoveExisting) {
            Write-Host "Removing existing task..." -ForegroundColor Yellow
            Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
            Write-Host "✓ Existing task removed" -ForegroundColor Green
        } else {
            Write-Host "Task '$TaskName' already exists!" -ForegroundColor Yellow
            Write-Host "Use -RemoveExisting to replace it, or choose a different name." -ForegroundColor Yellow
            return
        }
    }
    
    # 2. Verify backup script exists
    if (-not (Test-Path $BackupScriptPath)) {
        throw "Backup script not found at: $BackupScriptPath"
    }
    Write-Host "✓ Backup script found" -ForegroundColor Green
    
    # 3. Create backup directory if it doesn't exist
    if (-not (Test-Path $BackupBasePath)) {
        New-Item -ItemType Directory -Path $BackupBasePath -Force | Out-Null
        Write-Host "✓ Created backup directory" -ForegroundColor Green
    }
    
    # 4. Create the scheduled task action
    $TaskAction = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$BackupScriptPath`" -BackupBasePath `"$BackupBasePath`" -Verbose"
    
    # 5. Create the trigger (every 6 hours)
    $TaskTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date).Date.AddHours(2) -RepetitionInterval (New-TimeSpan -Hours 6) -RepetitionDuration (New-TimeSpan -Days 365)
    
    # 6. Create additional triggers for system startup and daily
    $StartupTrigger = New-ScheduledTaskTrigger -AtStartup
    $DailyTrigger = New-ScheduledTaskTrigger -Daily -At "02:00"
    
    # 7. Combine all triggers
    $AllTriggers = @($TaskTrigger, $StartupTrigger, $DailyTrigger)
    
    # 8. Create task settings
    $TaskSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable -DontStopOnIdleEnd
    
    # 9. Create task principal (run as current user)
    $TaskPrincipal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType S4U -RunLevel Highest
    
    # 10. Register the scheduled task
    Write-Host "Creating scheduled task..." -ForegroundColor Yellow
    $Task = New-ScheduledTask -Action $TaskAction -Trigger $AllTriggers -Settings $TaskSettings -Principal $TaskPrincipal
    
    Register-ScheduledTask -TaskName $TaskName -InputObject $Task -Force | Out-Null
    Write-Host "✓ Scheduled task created successfully" -ForegroundColor Green
    
    # 11. Test the task (optional)
    if ($TestMode) {
        Write-Host "Running test backup..." -ForegroundColor Yellow
        Start-ScheduledTask -TaskName $TaskName
        Start-Sleep -Seconds 5
        
        $TaskInfo = Get-ScheduledTaskInfo -TaskName $TaskName
        Write-Host "Test task status: $($TaskInfo.LastTaskResult)" -ForegroundColor Cyan
    }
    
    # 12. Create task management script
    $ManagementScript = @"
# CodeAnalyst Backup Task Management Script
# Use this script to manage your backup scheduled task

# Check task status
Get-ScheduledTaskInfo -TaskName "$TaskName"

# Start backup manually
# Start-ScheduledTask -TaskName "$TaskName"

# Stop running backup
# Stop-ScheduledTask -TaskName "$TaskName"

# Disable automatic backups
# Disable-ScheduledTask -TaskName "$TaskName"

# Enable automatic backups
# Enable-ScheduledTask -TaskName "$TaskName"

# Remove backup task completely
# Unregister-ScheduledTask -TaskName "$TaskName" -Confirm:`$false

# View backup logs
# Get-Content "$BackupBasePath\backup_master.log" -Tail 50

# View latest backup report
# Get-ChildItem "$BackupBasePath\backup_report_*.json" | Sort-Object CreationTime -Descending | Select-Object -First 1 | Get-Content | ConvertFrom-Json
"@
    
    $ManagementScriptPath = Join-Path (Split-Path $BackupScriptPath) "manage-backup-task.ps1"
    $ManagementScript | Out-File -FilePath $ManagementScriptPath -Encoding UTF8
    
    # 13. Create quick status check script
    $StatusScript = @"
# Quick Backup Status Check
Write-Host "=== CodeAnalyst Backup Status ===" -ForegroundColor Cyan

# Task Status
`$Task = Get-ScheduledTask -TaskName "$TaskName" -ErrorAction SilentlyContinue
if (`$Task) {
    `$TaskInfo = Get-ScheduledTaskInfo -TaskName "$TaskName"
    Write-Host "Task State: `$(`$Task.State)" -ForegroundColor Green
    Write-Host "Last Run: `$(`$TaskInfo.LastRunTime)" -ForegroundColor Gray
    Write-Host "Next Run: `$(`$TaskInfo.NextRunTime)" -ForegroundColor Gray
    Write-Host "Last Result: `$(`$TaskInfo.LastTaskResult)" -ForegroundColor Gray
} else {
    Write-Host "Backup task not found!" -ForegroundColor Red
}

# Recent Backups
Write-Host "`nRecent Backups:" -ForegroundColor Cyan
if (Test-Path "$BackupBasePath") {
    Get-ChildItem "$BackupBasePath\Local" -Directory | Sort-Object CreationTime -Descending | Select-Object -First 3 | ForEach-Object {
        Write-Host "  `$(`$_.CreationTime.ToString('yyyy-MM-dd HH:mm')) - `$(`$_.Name)" -ForegroundColor Gray
    }
} else {
    Write-Host "  No backups found" -ForegroundColor Yellow
}

# Log Summary
Write-Host "`nRecent Log Entries:" -ForegroundColor Cyan
if (Test-Path "$BackupBasePath\backup_master.log") {
    Get-Content "$BackupBasePath\backup_master.log" -Tail 5 | ForEach-Object {
        Write-Host "  `$_" -ForegroundColor Gray
    }
} else {
    Write-Host "  No log file found" -ForegroundColor Yellow
}
"@
    
    $StatusScriptPath = Join-Path (Split-Path $BackupScriptPath) "backup-status.ps1"
    $StatusScript | Out-File -FilePath $StatusScriptPath -Encoding UTF8
    
    # 14. Final summary
    $NextRun = (Get-ScheduledTaskInfo -TaskName $TaskName).NextRunTime
    
    Write-Host ""
    Write-Host "=== Backup Scheduler Setup Complete ===" -ForegroundColor Green
    Write-Host "Task Name: $TaskName" -ForegroundColor Cyan
    Write-Host "Schedule: Every 6 hours + startup + daily at 2 AM" -ForegroundColor Cyan
    Write-Host "Next Run: $NextRun" -ForegroundColor Cyan
    Write-Host "Backup Location: $BackupBasePath" -ForegroundColor Cyan
    Write-Host "Management Script: $ManagementScriptPath" -ForegroundColor Cyan
    Write-Host "Status Script: $StatusScriptPath" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "Quick Commands:" -ForegroundColor Yellow
    Write-Host "  Check Status: & '$StatusScriptPath'" -ForegroundColor Gray
    Write-Host "  Run Now: Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Gray
    Write-Host "  View Logs: Get-Content '$BackupBasePath\backup_master.log' -Tail 20" -ForegroundColor Gray
    
    return $true
}
catch {
    Write-Host ""
    Write-Host "=== Scheduler Setup Failed ===" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    return $false
}
