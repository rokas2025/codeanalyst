# CodeAnalyst GitHub Backup Script
# Creates automated backups to GitHub repositories

param(
    [string]$MainRepo = "origin",
    [string]$BackupRepo = "",
    [switch]$CreateBackupBranch = $true,
    [switch]$Verbose = $false
)

# Configuration
$ProjectPath = "C:\Users\rokas\OneDrive\Dokumentai\Analyst"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupBranch = "backup_$Timestamp"

Write-Host "=== CodeAnalyst GitHub Backup Started ===" -ForegroundColor Cyan
Write-Host "Timestamp: $(Get-Date)" -ForegroundColor Gray
Write-Host "Project: $ProjectPath" -ForegroundColor Gray

Push-Location $ProjectPath

try {
    # 1. Check git status
    Write-Host "Checking Git status..." -ForegroundColor Yellow
    $GitStatus = git status --porcelain 2>$null
    $CurrentBranch = git branch --show-current 2>$null
    
    if ($GitStatus) {
        Write-Host "⚠ Uncommitted changes detected:" -ForegroundColor Yellow
        git status --short
        
        # Auto-commit changes with backup timestamp
        Write-Host "Auto-committing changes..." -ForegroundColor Yellow
        git add .
        git commit -m "Auto-backup commit - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        Write-Host "✓ Changes committed" -ForegroundColor Green
    } else {
        Write-Host "✓ Working directory clean" -ForegroundColor Green
    }
    
    # 2. Push to main repository
    Write-Host "Pushing to main repository..." -ForegroundColor Yellow
    git push $MainRepo $CurrentBranch
    Write-Host "✓ Pushed to main repository" -ForegroundColor Green
    
    # 3. Create backup branch (optional)
    if ($CreateBackupBranch) {
        Write-Host "Creating backup branch: $BackupBranch" -ForegroundColor Yellow
        
        # Create and switch to backup branch
        git checkout -b $BackupBranch
        
        # Add backup metadata
        $BackupMetadata = @{
            backup_date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            backup_branch = $BackupBranch
            source_branch = $CurrentBranch
            commit_hash = (git rev-parse HEAD)
            created_by = "CodeAnalyst GitHub Backup Script"
            backup_type = "automated_6hour"
        }
        
        $BackupMetadata | ConvertTo-Json -Depth 5 | Out-File -FilePath "backup_metadata.json" -Encoding UTF8
        
        git add backup_metadata.json
        git commit -m "Backup metadata for $BackupBranch"
        
        # Push backup branch
        git push $MainRepo $BackupBranch
        Write-Host "✓ Backup branch created and pushed" -ForegroundColor Green
        
        # Switch back to original branch
        git checkout $CurrentBranch
        Write-Host "✓ Switched back to $CurrentBranch" -ForegroundColor Green
    }
    
    # 4. Push to backup repository (if specified)
    if ($BackupRepo -and $BackupRepo -ne "") {
        Write-Host "Pushing to backup repository: $BackupRepo" -ForegroundColor Yellow
        
        # Add backup remote if it doesn't exist
        $ExistingRemotes = git remote
        if ($ExistingRemotes -notcontains "backup") {
            git remote add backup $BackupRepo
            Write-Host "✓ Added backup remote" -ForegroundColor Green
        }
        
        # Push all branches to backup
        git push backup --all
        git push backup --tags
        Write-Host "✓ Pushed to backup repository" -ForegroundColor Green
    }
    
    # 5. Cleanup old backup branches (keep last 20)
    Write-Host "Cleaning up old backup branches..." -ForegroundColor Yellow
    $BackupBranches = git branch -r | Where-Object { $_ -like "*backup_*" } | Sort-Object | Select-Object -SkipLast 20
    
    foreach ($Branch in $BackupBranches) {
        $BranchName = $Branch.Trim() -replace "origin/", ""
        if ($BranchName -like "backup_*") {
            git push $MainRepo --delete $BranchName 2>$null
            if ($Verbose) {
                Write-Host "Deleted old backup branch: $BranchName" -ForegroundColor Gray
            }
        }
    }
    Write-Host "✓ Old backup branches cleaned up" -ForegroundColor Green
    
    # 6. Create release tag for major backups (every 24 hours)
    $LastTagDate = git for-each-ref --format='%(refname:short) %(creatordate)' refs/tags | 
                   Where-Object { $_ -like "backup-*" } | 
                   Sort-Object { [DateTime]($_.Split(' ', 2)[1]) } | 
                   Select-Object -Last 1
    
    $ShouldCreateTag = $false
    if (-not $LastTagDate) {
        $ShouldCreateTag = $true
    } else {
        $LastTagTime = [DateTime]($LastTagDate.Split(' ', 2)[1])
        $HoursSinceLastTag = (Get-Date) - $LastTagTime
        if ($HoursSinceLastTag.TotalHours -ge 24) {
            $ShouldCreateTag = $true
        }
    }
    
    if ($ShouldCreateTag) {
        $TagName = "backup-$(Get-Date -Format 'yyyyMMdd')"
        git tag -a $TagName -m "Daily backup tag - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        git push $MainRepo $TagName
        Write-Host "✓ Created daily backup tag: $TagName" -ForegroundColor Green
    }
    
    # 7. Generate backup report
    $CommitCount = git rev-list --count HEAD
    $RepoSize = [math]::Round((Get-ChildItem $ProjectPath -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)
    $LastCommit = git log -1 --oneline
    
    Write-Host ""
    Write-Host "=== GitHub Backup Completed Successfully ===" -ForegroundColor Green
    Write-Host "Repository: $((git remote get-url origin) 2>$null)" -ForegroundColor Cyan
    Write-Host "Current Branch: $CurrentBranch" -ForegroundColor Cyan
    Write-Host "Total Commits: $CommitCount" -ForegroundColor Cyan
    Write-Host "Repository Size: $RepoSize MB" -ForegroundColor Cyan
    Write-Host "Last Commit: $LastCommit" -ForegroundColor Cyan
    if ($CreateBackupBranch) {
        Write-Host "Backup Branch: $BackupBranch" -ForegroundColor Cyan
    }
    Write-Host "Completed: $(Get-Date)" -ForegroundColor Gray
    
    return $true
}
catch {
    Write-Host ""
    Write-Host "=== GitHub Backup Failed ===" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    return $false
}
finally {
    Pop-Location
}
