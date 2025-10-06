# Railway CLI Setup Guide

## Installation Options for Windows

### Option 1: NPM Installation (Recommended)
```powershell
npm install -g @railway/cli
```

### Option 2: PowerShell Script (Official)
```powershell
iwr https://railway.app/install.ps1 | iex
```

### Option 3: Manual Download
1. Visit: https://github.com/railwayapp/cli/releases
2. Download the Windows binary
3. Add to your PATH

## Verify Installation
```powershell
railway --version
```

## Authentication
```powershell
railway login
```
This will open your browser to authenticate with Railway.

## Useful Railway CLI Commands

### Project Management
```powershell
# List all projects
railway list

# Link current directory to Railway project
railway link

# Show project info
railway status

# Show project variables
railway variables
```

### Deployment Management
```powershell
# Deploy current directory
railway up

# Show deployment logs
railway logs

# Show deployment status
railway ps

# Open project in browser
railway open
```

### Environment Management
```powershell
# List environments
railway environment

# Switch environment
railway environment use production

# Set environment variables
railway variables set KEY=value
```

### Database Management
```powershell
# Connect to database
railway connect

# Show database info
railway database

# Create database backup
railway database backup
```

### Development Workflow
```powershell
# Run command with Railway environment
railway run npm start

# Shell with Railway environment
railway shell

# Deploy from current directory
railway up --detach
```

## Common Workflow for Your Project

### 1. Initial Setup (One-time)
```powershell
# Navigate to project directory
cd C:\Users\rokas\OneDrive\Dokumentai\Analyst

# Login to Railway
railway login

# Link to your existing project
railway link
```

### 2. Check Deployment Status
```powershell
# Check current deployment status
railway status

# View recent logs
railway logs --tail

# See running services
railway ps
```

### 3. Manual Deployment (if needed)
```powershell
# Deploy backend
cd backend
railway up

# Or deploy specific service
railway up --service backend
```

### 4. Environment Variables
```powershell
# View current variables
railway variables

# Add new variable
railway variables set NODE_ENV=production

# Delete variable
railway variables delete VARIABLE_NAME
```

### 5. Monitoring
```powershell
# Real-time logs
railway logs --tail

# Service metrics
railway metrics

# Open Railway dashboard
railway open
```

## Troubleshooting

### If Railway CLI doesn't work:
1. Restart your terminal/PowerShell
2. Check if it's in PATH: `where railway`
3. Try reinstalling with: `npm uninstall -g @railway/cli && npm install -g @railway/cli`

### Common Issues:
- **Command not found**: Railway CLI not in PATH - restart terminal
- **Authentication failed**: Run `railway login` again
- **Project not linked**: Run `railway link` in project directory
- **Permission denied**: Run PowerShell as Administrator

## Benefits of Using Railway CLI

1. **Real-time Deployment Status**: See exactly what's happening during deployment
2. **Quick Debugging**: Instantly access logs and metrics
3. **Environment Management**: Easily manage environment variables
4. **Database Access**: Connect directly to your production database
5. **Multiple Environment Support**: Switch between staging/production
6. **Automated Deployments**: Trigger deployments from command line

## Integration with Your Project

### Check Current Chat UI Deployment:
```powershell
# Link to project
railway link

# Check deployment status
railway status

# View logs to see if chat improvements deployed
railway logs --tail

# Open live application
railway open
```

### Verify Chat Improvements:
1. Use `railway open` to open your live application
2. Navigate to AI Chat/AutoProgrammer module
3. Test new features:
   - Markdown rendering
   - Clickable file links
   - Enhanced styling
   - Auto-resizing textarea

---

**Next Steps:**
1. Install Railway CLI using one of the methods above
2. Run `railway login` to authenticate
3. Run `railway link` in your project directory
4. Use `railway status` to check deployment status
5. Use `railway logs` to see deployment progress

*This will make managing your Railway deployments much easier!*
