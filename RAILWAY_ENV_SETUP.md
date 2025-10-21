# 🔧 Railway Development Environment Variables Setup

## ⚠️ Why Manual Setup is Required

Railway environment variables are **highly sensitive** (database passwords, API keys, secrets) and Railway requires **manual authentication** through their dashboard for security. There's no API I can access to configure these automatically without your Railway access token.

---

## 📋 Quick Copy-Paste Guide

### **Step 1: Open Railway Dashboard**
1. Go to: https://railway.app/dashboard
2. Find your **development service** (the one you just created for the `develop` branch)
3. Click on it
4. Go to the **Variables** tab

### **Step 2: Copy These Variables**

Click **"New Variable"** for each of these and copy the values from your **production service**:

#### **Core Required Variables:**

```bash
# Environment
NODE_ENV=development

# Database - ⚠️ REQUIRED - Copy from production
DATABASE_URL=<copy-from-production-service>

# JWT - ⚠️ MUST be same as production for token compatibility
JWT_SECRET=<copy-from-production-service>
JWT_EXPIRES_IN=7d

# OpenAI - ⚠️ REQUIRED for AI analysis
OPENAI_API_KEY=<copy-from-production-service>

# Anthropic Claude - Optional
ANTHROPIC_API_KEY=<copy-from-production-service>

# Google AI - Optional
GOOGLE_AI_API_KEY=<copy-from-production-service>

# GitHub OAuth - Development (NEW VALUES)
GITHUB_CLIENT_ID=Ov23liRkiQaCMrZxlYPM
GITHUB_CLIENT_SECRET=688e3bc5d899f8bdeda1f07e07f89a0e6e129fae
GITHUB_CALLBACK_URL=https://[your-railway-dev-url]/api/auth/github/callback

# Frontend URL - Development
FRONTEND_URL=https://codeanalyst-git-develop-rokas-projects-bff726e7.vercel.app

# Redis - Optional (if you use it)
REDIS_HOST=<copy-from-production-service-if-exists>
REDIS_PORT=<copy-from-production-service-if-exists>
REDIS_PASSWORD=<copy-from-production-service-if-exists>

# Server Port
PORT=3001

# Analysis APIs - Optional
GOOGLE_PAGESPEED_API_KEY=<copy-from-production-service-if-exists>
```

---

## 🚀 **Fastest Way to Copy Variables**

### **Method 1: Use Railway CLI (Fastest)**

If you have Railway CLI installed:

```bash
# Install Railway CLI (if not installed)
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Copy variables from production to development
railway variables --service codeanalyst-backend-production
# Then manually add them to development service
```

### **Method 2: Dashboard Copy (5 minutes)**

1. Open **two browser tabs**:
   - Tab 1: Production service → Variables
   - Tab 2: Development service → Variables
2. For each variable in production:
   - Copy the name
   - Click "Show" to reveal value
   - Copy value
   - Switch to Tab 2
   - Click "New Variable"
   - Paste name and value
   - Click "Add"

---

## 🔍 **Variables You Can Skip (Optional)**

These are **optional** and the app will work without them:

- `REDIS_*` (only if you use job queues)
- `ANTHROPIC_API_KEY` (backup AI)
- `GOOGLE_AI_API_KEY` (backup AI)
- `GOOGLE_PAGESPEED_API_KEY` (optional analysis feature)
- `GITHUB_PERSONAL_ACCESS_TOKEN` (only for private repos)

---

## ✅ **Minimum Required Variables for Testing**

To just get the app running, you **ONLY** need these:

```bash
NODE_ENV=development
DATABASE_URL=<from-production>
JWT_SECRET=<from-production>
OPENAI_API_KEY=<from-production>
GITHUB_CLIENT_ID=Ov23liRkiQaCMrZxlYPM
GITHUB_CLIENT_SECRET=688e3bc5d899f8bdeda1f07e07f89a0e6e129fae
FRONTEND_URL=https://codeanalyst-git-develop-rokas-projects-bff726e7.vercel.app
PORT=3001
```

---

## 📝 **After Adding Variables**

1. Railway will **automatically redeploy**
2. Wait ~2 minutes for deployment to complete
3. Your app should start successfully
4. You'll get a Railway URL like: `https://codeanalyst-development-xxxx.up.railway.app`
5. **Update one more variable**: `GITHUB_CALLBACK_URL` with your actual Railway URL

---

## 🎯 **What Happens After Setup**

Once variables are added and deployed:
- ✅ Database connection will work
- ✅ OpenAI integration will work
- ✅ GitHub OAuth will work
- ✅ App will start successfully
- ✅ You can test the development environment

---

## 🆘 **Need Help?**

If you're stuck, you can:
1. Share a screenshot of your production Railway variables (hide sensitive parts)
2. I'll create a checklist of exactly what to copy
3. Or we can use Railway CLI together

---

**Estimated time: 5-10 minutes** ⏱️

The manual step is necessary for security, but it's a one-time setup! 🚀

