# 🚀 VM Backend + Vercel Frontend Deployment Guide

## Overview
This guide sets up your full-featured backend on VM with ngrok tunnel + frontend on Vercel.

## ✅ Benefits of This Setup
- **Zero functionality loss** - All AI analysis, database, workers intact
- **Professional hosting** - Frontend on Vercel CDN
- **Stable tunnels** - ngrok API key provides persistent URLs
- **Full features** - GitHub OAuth, file uploads, complex analysis

## 📋 Prerequisites
- Your ngrok API key (you provided)
- VM with Windows/Linux
- Node.js 18+ installed
- Git installed

## 🔧 Step 1: Backend Setup on VM

### Option A: Windows (Recommended)
```batch
# Navigate to backend folder
cd backend

# Run setup script
setup-ngrok.bat
# Enter your ngrok API key when prompted

# Start backend with tunnel
start-ngrok.bat
```

### Option B: Manual Setup
```bash
# Install ngrok (if not installed)
# Windows: winget install --id ngrok.ngrok
# Linux: wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz

# Configure ngrok with your API key
ngrok config add-authtoken YOUR_NGROK_API_KEY

# Install backend dependencies
cd backend
npm install

# Create .env from example
cp env.example .env
# Edit .env with your actual values

# Start backend
npm start

# In another terminal, start ngrok tunnel
ngrok http 3001
```

## 🌐 Step 2: Get Your ngrok URL

After starting ngrok, you'll see output like:
```
Session Status                online
Account                       Your Account
Version                       3.x.x
Region                        United States (us)
Latency                       50ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3001
```

**Copy the https:// URL** (e.g., `https://abc123.ngrok-free.app`)

## 🚀 Step 3: Deploy Frontend to Vercel

### Install Vercel CLI
```bash
npm install -g vercel
```

### Deploy
```bash
# Deploy frontend
vercel --prod

# Set environment variables in Vercel
vercel env add VITE_API_URL
# Enter: https://your-ngrok-url.ngrok-free.app/api

vercel env add VITE_GITHUB_CLIENT_ID  
# Enter your GitHub OAuth client ID

vercel env add VITE_FRONTEND_URL
# Enter your Vercel URL (e.g., https://your-project.vercel.app)
```

### Or use Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Set environment variables:
   - `VITE_API_URL`: `https://your-ngrok-url.ngrok-free.app/api`
   - `VITE_GITHUB_CLIENT_ID`: Your GitHub OAuth client ID
   - `VITE_FRONTEND_URL`: Your Vercel app URL

## 🔐 Step 4: Configure GitHub OAuth

Update your GitHub OAuth app settings:
- **Homepage URL**: `https://your-vercel-app.vercel.app`
- **Authorization callback URL**: `https://your-ngrok-url.ngrok-free.app/api/auth/github/callback`

## 🔧 Step 5: Update Backend Environment

Edit `backend/.env`:
```env
# Update these values
FRONTEND_URL=https://your-vercel-app.vercel.app
CORS_ORIGIN=https://your-vercel-app.vercel.app
NODE_ENV=production

# Add your API keys
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_AI_API_KEY=your-google-ai-key

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-oauth-client-id
GITHUB_CLIENT_SECRET=your-github-oauth-client-secret
```

## 🎯 Step 6: Test Everything

1. **Backend Health**: Visit `https://your-ngrok-url.ngrok-free.app/health`
2. **Frontend**: Visit your Vercel URL
3. **GitHub OAuth**: Try logging in with GitHub
4. **Website Analysis**: Test analyzing a website

## 🔧 Troubleshooting

### ngrok Issues
```bash
# Check ngrok status
ngrok version

# Restart ngrok
pkill ngrok
ngrok http 3001
```

### Backend Issues
```bash
# Check backend logs
cd backend
npm start

# Check if port 3001 is free
netstat -tulpn | grep 3001  # Linux
netstat -an | findstr 3001  # Windows
```

### Frontend Issues
```bash
# Rebuild and redeploy
npm run build
vercel --prod
```

## 📊 Monitoring

### ngrok Web Interface
- Visit `http://localhost:4040` for ngrok dashboard
- Monitor requests and responses

### Backend Logs
- Check console output for errors
- Monitor `backend/logs/app.log`

## 🔄 Auto-Restart Setup (Optional)

### Windows Task Scheduler
Create a task to auto-start backend on VM boot:
```batch
# Program: cmd.exe
# Arguments: /c "cd C:\path\to\your\project\backend && start-ngrok.bat"
```

### Linux systemd
```bash
# Create service file
sudo nano /etc/systemd/system/codeanalyst.service

[Unit]
Description=CodeAnalyst Backend
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/your/project/backend
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target

# Enable service
sudo systemctl enable codeanalyst
sudo systemctl start codeanalyst
```

## ✅ Final Architecture

```
User → Vercel Frontend → ngrok tunnel → VM Backend → Database/AI APIs
```

This gives you:
- ✅ Professional frontend hosting
- ✅ Full backend functionality
- ✅ All AI analysis features
- ✅ Database and file uploads
- ✅ GitHub integration
- ✅ Stable URLs with ngrok API key
