# CodeAnalyst Comprehensive Backup System

## Overview
This document describes the complete backup system for CodeAnalyst, featuring automated local backups, GitHub repository backups, and database backups running every 6 hours.

## 🎯 **Backup Strategy**

### Three-Tier Backup System:
1. **Local File Backups** - Complete project files stored locally
2. **GitHub Repository Backups** - Code versioning and remote storage
3. **Database Backups** - PostgreSQL database snapshots via Railway

### Automation Schedule:
- **Every 6 hours** - Full backup cycle
- **On system startup** - Immediate backup after restart
- **Daily at 2 AM** - Additional scheduled backup
- **Manual execution** - On-demand backups

## 📁 **Backup Structure**

```
C:\Backups\CodeAnalyst\
├── Local\
│   ├── CodeAnalyst_Backup_20241221_143022\
│   ├── CodeAnalyst_Backup_20241221_203022\
│   └── backup_history.log
├── Database\
│   ├── database_backup_20241221_143022.sql
│   ├── database_backup_manifest_20241221_143022.json
│   └── database_backup_history.log
├── backup_master.log
├── backup_report_20241221_143022.json
└── backup_status.ps1
```

## 🚀 **Quick Setup**

### 1. **One-Time Setup (Run as Administrator)**
```powershell
# Navigate to project directory
cd C:\Users\rokas\OneDrive\Dokumentai\Analyst

# Setup automated backups
& "scripts\setup-backup-scheduler.ps1" -RemoveExisting
```

### 2. **Manual Backup (Test Run)**
```powershell
# Run complete backup cycle
& "scripts\backup-master.ps1" -TestMode

# Run actual backup
& "scripts\backup-master.ps1" -Verbose
```

### 3. **Check Status**
```powershell
# Quick status check
& "scripts\backup-status.ps1"

# Detailed task info
Get-ScheduledTaskInfo -TaskName "CodeAnalyst_AutoBackup"
```

## 📝 **Backup Scripts Overview**

### `backup-master.ps1` - Main Orchestrator
**Purpose**: Coordinates all backup types and creates consolidated reports
**Features**:
- Executes all backup scripts in sequence
- Creates comprehensive backup reports
- Handles error logging and notifications
- Configurable backup options

**Usage**:
```powershell
# Standard backup
& "scripts\backup-master.ps1"

# Custom options
& "scripts\backup-master.ps1" -BackupBasePath "D:\MyBackups" -IncludeNodeModules -Verbose
```

### `backup-local.ps1` - File System Backup
**Purpose**: Creates complete local backups of project files
**Features**:
- Excludes unnecessary files (node_modules, dist, .git)
- Creates timestamped backup folders
- Exports dependency information
- Git metadata backup
- Automatic cleanup of old backups

**What's Backed Up**:
- ✅ Source code (src/, backend/, scripts/)
- ✅ Configuration files (package.json, tsconfig.json, etc.)
- ✅ Documentation (docs/, README.md)
- ✅ Environment templates (.env.example)
- ✅ Git information and metadata
- ❌ node_modules (optional)
- ❌ Build artifacts (dist/, build/)
- ❌ Log files and temporary files

### `backup-github.ps1` - Repository Backup
**Purpose**: Ensures code is safely stored on GitHub with versioning
**Features**:
- Auto-commits any uncommitted changes
- Creates timestamped backup branches
- Pushes to multiple repositories (main + backup)
- Creates release tags for major backups
- Cleanup of old backup branches

**Backup Flow**:
1. Check for uncommitted changes → auto-commit
2. Push to main repository
3. Create backup branch with metadata
4. Push backup branch
5. Cleanup old backup branches (keep last 20)
6. Create daily release tags

### `backup-database.ps1` - Database Backup
**Purpose**: Creates PostgreSQL database backups via Railway CLI
**Features**:
- Uses Railway CLI for secure database access
- Creates SQL dump files
- Backup metadata and manifests
- Multiple backup methods (direct, shell, metadata)
- Automatic cleanup of old database backups

### `setup-backup-scheduler.ps1` - Windows Task Scheduler Setup
**Purpose**: Automates backup execution using Windows Task Scheduler
**Features**:
- Creates scheduled task for 6-hour intervals
- Additional triggers (startup, daily)
- Administrator privilege handling
- Task management scripts generation

## ⚙️ **Configuration Options**

### Environment Variables
```powershell
# Backup base path
$BackupBasePath = "C:\Backups\CodeAnalyst"

# Include node_modules in backups
$IncludeNodeModules = $false

# Skip specific backup types
$SkipDatabase = $false
$SkipGitHub = $false

# Railway project name
$ProjectName = "melodious-presence"
```

### Backup Retention
- **Local Backups**: Keep last 10 backups
- **Database Backups**: Keep last 20 backups
- **GitHub Backup Branches**: Keep last 20 branches
- **Release Tags**: Daily tags (never deleted automatically)

## 📊 **Monitoring and Reports**

### Backup Reports
Each backup cycle creates a detailed JSON report:
```json
{
  "timestamp": "2024-12-21 14:30:22",
  "backup_session": "20241221_143022",
  "results": {
    "local_backup": true,
    "github_backup": true,
    "database_backup": true
  },
  "summary": {
    "success_rate": 100,
    "total_duration": "00:02:45"
  },
  "next_backup": "2024-12-21 20:30:22"
}
```

### Log Files
- **Master Log**: `backup_master.log` - All backup operations
- **Local Log**: `backup_history.log` - Local backup details
- **Database Log**: `database_backup_history.log` - Database backup details

### Status Monitoring
```powershell
# Quick status check
& "scripts\backup-status.ps1"

# View recent logs
Get-Content "C:\Backups\CodeAnalyst\backup_master.log" -Tail 20

# Check scheduled task
Get-ScheduledTaskInfo -TaskName "CodeAnalyst_AutoBackup"
```

## 🛠️ **Management Commands**

### Manual Backup Execution
```powershell
# Run all backups
Start-ScheduledTask -TaskName "CodeAnalyst_AutoBackup"

# Run specific backup type
& "scripts\backup-local.ps1" -Verbose
& "scripts\backup-github.ps1" -Verbose
& "scripts\backup-database.ps1" -Verbose
```

### Task Management
```powershell
# Enable/Disable automated backups
Enable-ScheduledTask -TaskName "CodeAnalyst_AutoBackup"
Disable-ScheduledTask -TaskName "CodeAnalyst_AutoBackup"

# Remove backup automation
Unregister-ScheduledTask -TaskName "CodeAnalyst_AutoBackup" -Confirm:$false
```

### Backup Restoration
```powershell
# List available backups
Get-ChildItem "C:\Backups\CodeAnalyst\Local" | Sort-Object CreationTime -Descending

# Restore from backup (manual process)
# 1. Stop all development servers
# 2. Copy backup contents to project directory
# 3. Run npm install
# 4. Restore database if needed
```

## 🔧 **Troubleshooting**

### Common Issues

**1. Permission Errors**
```powershell
# Run PowerShell as Administrator
# Set execution policy if needed
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**2. Railway CLI Not Found**
```powershell
# Install Railway CLI
npm install -g @railway/cli

# Authenticate
railway login
```

**3. Git Authentication Issues**
```powershell
# Check git authentication
git config --list | findstr user

# Test repository access
git remote -v
git fetch origin
```

**4. Disk Space Issues**
```powershell
# Check backup directory size
Get-ChildItem "C:\Backups\CodeAnalyst" -Recurse | Measure-Object -Property Length -Sum

# Manual cleanup if needed
& "scripts\backup-master.ps1" -CleanupOnly
```

### Recovery Scenarios

**Complete Project Loss**:
1. Install Node.js and npm
2. Install Railway CLI and authenticate
3. Restore latest local backup
4. Run `npm install` in project and backend directories
5. Restore database from latest backup
6. Update environment variables

**Database Corruption**:
1. Use Railway dashboard to create new database
2. Restore from latest database backup SQL file
3. Update DATABASE_URL in environment variables
4. Test application connectivity

**Git Repository Issues**:
1. Clone fresh repository from GitHub
2. Copy working files from local backup
3. Restore recent commits from backup branches
4. Push corrected version to main branch

## 📈 **Backup Statistics**

### Typical Backup Sizes
- **Local Backup**: ~50-200 MB (without node_modules)
- **Database Backup**: ~10-100 MB (depending on data)
- **GitHub Repository**: Tracks changes only

### Performance Metrics
- **Local Backup**: ~2-5 minutes
- **GitHub Backup**: ~1-3 minutes
- **Database Backup**: ~1-2 minutes
- **Total Cycle**: ~5-10 minutes

## 🎯 **Best Practices**

1. **Monitor Backup Status**: Check `backup-status.ps1` weekly
2. **Test Restoration**: Perform quarterly restore tests
3. **Verify GitHub Backups**: Ensure repository is accessible
4. **Database Validation**: Test database backup integrity monthly
5. **Disk Space Management**: Monitor backup directory size
6. **Update Schedules**: Adjust frequency based on development activity

---

**The backup system provides comprehensive protection for your CodeAnalyst project with minimal manual intervention required!** 🛡️

*System will automatically backup every 6 hours once configured.*
