# 🔧 Environment Variables Configuration

## Overview

This project uses a **single Railway backend** for both production and development branches. Only the frontend URLs change per branch.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│  Vercel Frontend (Multiple URLs)               │
├─────────────────────────────────────────────────┤
│  Production:  analyst-psi.vercel.app           │
│  Development: codeanalyst-git-develop-*.app    │
│  Features:    codeanalyst-git-feature-*.app    │
└─────────────────────────────────────────────────┘
                      ↓
                    (API)
                      ↓
┌─────────────────────────────────────────────────┐
│  Railway Backend (Single Service)              │
├─────────────────────────────────────────────────┤
│  URL: codeanalyst-production.up.railway.app    │
│  Serves: ALL branches (main, develop, feature) │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Supabase Database (Single Instance)           │
├─────────────────────────────────────────────────┤
│  Shared by: ALL environments                    │
└─────────────────────────────────────────────────┘
```

---

## 📋 Vercel Environment Variables

### **Go to**: https://vercel.com/dashboard

### **Your Project Settings → Environment Variables**

Add these variables with **environment-specific values**:

| Variable Name | Production (main) | Preview (develop + features) |
|---------------|-------------------|------------------------------|
| `VITE_API_URL` | `https://codeanalyst-production.up.railway.app/api` | `https://codeanalyst-production.up.railway.app/api` |
| `VITE_GITHUB_CLIENT_ID` | Your production GitHub OAuth Client ID | Your production GitHub OAuth Client ID |
| `VITE_FRONTEND_URL` | `https://analyst-psi.vercel.app` | Auto-detected by Vercel |

**Important**: 
- Select **"All"** for `VITE_API_URL` (same for all environments)
- Select **"All"** for `VITE_GITHUB_CLIENT_ID` (same OAuth app)
- Select **"Production"** only for `VITE_FRONTEND_URL` (preview URLs are auto-detected)

---

## 🚂 Railway Environment Variables

### **Go to**: https://railway.app/dashboard

### **Service**: `codeanalyst-production`

**Current Configuration** (should already be set):

```env
NODE_ENV=production
PORT=3001

# Database
DATABASE_URL=<your-supabase-connection-string>

# Frontend URLs (for CORS)
FRONTEND_URL=https://analyst-psi.vercel.app
# Add preview URLs to CORS_ORIGIN if needed

# GitHub OAuth (Production)
GITHUB_CLIENT_ID=<your-production-github-client-id>
GITHUB_CLIENT_SECRET=<your-production-github-secret>
GITHUB_CALLBACK_URL=https://codeanalyst-production.up.railway.app/api/auth/github/callback

# AI APIs
OPENAI_API_KEY=<your-openai-key>
ANTHROPIC_API_KEY=<your-anthropic-key>
GOOGLE_AI_API_KEY=<your-google-key>

# JWT
JWT_SECRET=<your-jwt-secret>
JWT_EXPIRES_IN=7d
```

**No changes needed** - Railway serves all branches with same configuration!

---

## 🔐 GitHub OAuth Configuration

### **Your Development Deployment:**

- **Frontend URL**: `https://codeanalyst-git-develop-rokas-projects-bff726e7.vercel.app`
- **Backend URL**: `https://codeanalyst-production.up.railway.app`

### **GitHub OAuth App Setup:**

**Go to**: https://github.com/settings/developers

**Select your OAuth App** and add these **Authorization callback URLs**:

```
https://codeanalyst-production.up.railway.app/api/auth/github/callback
https://codeanalyst-git-develop-rokas-projects-bff726e7.vercel.app/api/auth/github/callback
https://codeanalyst-git-*-rokas-projects-bff726e7.vercel.app/api/auth/github/callback
```

**Explanation**:
- Line 1: Railway backend callback (handles OAuth)
- Line 2: Development branch frontend
- Line 3: Wildcard for all feature branches

---

## ⚠️ Important: OAuth Flow

### **How GitHub OAuth Works:**

1. **User clicks** "Login with GitHub" on Vercel frontend
2. **Frontend redirects** to GitHub OAuth page
3. **GitHub redirects back** to Railway backend: `/api/auth/github/callback`
4. **Backend processes** OAuth code, creates JWT token
5. **Backend redirects** to frontend with JWT token
6. **Frontend** stores token and user is logged in

### **Why Railway Callback?**

The OAuth **callback goes to Railway** (backend), not Vercel (frontend), because:
- Backend needs to exchange OAuth code for access token
- Backend creates JWT token for your app
- Backend has GITHUB_CLIENT_SECRET (never expose to frontend)

### **Why Vercel Callback Too?**

Some OAuth implementations might redirect to frontend first, so we add both for safety.

---

## 🧪 Testing Your Setup

### **1. Test Production (main branch):**
```
URL: https://analyst-psi.vercel.app
Backend: https://codeanalyst-production.up.railway.app/api

Test:
✅ Click "Login with GitHub"
✅ Should redirect to GitHub
✅ Authorize app
✅ Should redirect back and log in
```

### **2. Test Development (develop branch):**
```
URL: https://codeanalyst-git-develop-rokas-projects-bff726e7.vercel.app
Backend: https://codeanalyst-production.up.railway.app/api (same!)

Test:
✅ Click "Login with GitHub"
✅ Should redirect to GitHub
✅ Authorize app
✅ Should redirect back and log in
```

### **3. Test API Connection:**
```bash
# Production
curl https://codeanalyst-production.up.railway.app/api/health

# Should return:
{
  "success": true,
  "status": "healthy",
  "services": {
    "database": "connected"
  }
}
```

---

## 🔍 Debugging

### **If OAuth Fails:**

1. **Check GitHub OAuth App**:
   - Callback URLs include both Railway and Vercel
   - Client ID matches `VITE_GITHUB_CLIENT_ID`

2. **Check Browser Console**:
   ```javascript
   // Should see:
   VITE_API_URL: "https://codeanalyst-production.up.railway.app/api"
   ```

3. **Check Railway Logs**:
   ```bash
   railway logs
   # Look for: "GitHub OAuth callback received"
   ```

4. **Check CORS**:
   - Railway allows requests from your Vercel URLs
   - Check backend CORS configuration

---

## 📊 Current Configuration Summary

| Environment | Frontend | Backend | Database |
|-------------|----------|---------|----------|
| **Production** | `analyst-psi.vercel.app` | Railway | Supabase |
| **Development** | `codeanalyst-git-develop-*.vercel.app` | Railway ✅ Same | Supabase ✅ Same |
| **Features** | `codeanalyst-git-*-*.vercel.app` | Railway ✅ Same | Supabase ✅ Same |

**Benefits**:
- ✅ Simple setup (one backend for all)
- ✅ No duplicate infrastructure
- ✅ Free (no extra costs)
- ✅ Consistent API across all branches

**Considerations**:
- ⚠️ All branches share same database
- ⚠️ Test data visible in all environments
- 💡 Add `NODE_ENV` checks for test-only features

---

## 🔑 Quick Reference

### **Your Specific URLs:**

**Production Frontend**: `https://analyst-psi.vercel.app`
**Development Frontend**: `https://codeanalyst-git-develop-rokas-projects-bff726e7.vercel.app`
**Backend (All)**: `https://codeanalyst-production.up.railway.app`

### **Environment Variables to Set:**

**Vercel** (for all environments):
```
VITE_API_URL=https://codeanalyst-production.up.railway.app/api
VITE_GITHUB_CLIENT_ID=<your-github-client-id>
```

**Railway** (already set):
```
GITHUB_CLIENT_SECRET=<your-github-client-secret>
DATABASE_URL=<your-database-url>
OPENAI_API_KEY=<your-openai-key>
```

**GitHub OAuth** (add all callback URLs):
```
https://codeanalyst-production.up.railway.app/api/auth/github/callback
https://codeanalyst-git-develop-rokas-projects-bff726e7.vercel.app/api/auth/github/callback
https://codeanalyst-git-*-rokas-projects-bff726e7.vercel.app/api/auth/github/callback
```

---

## ✅ Checklist

- [ ] Vercel: Add `VITE_API_URL` for all environments
- [ ] Vercel: Add `VITE_GITHUB_CLIENT_ID` for all environments
- [ ] Railway: Verify all environment variables are set
- [ ] GitHub OAuth: Add all three callback URLs
- [ ] Test: Production login works
- [ ] Test: Development login works
- [ ] Test: API connection from both environments

---

**Last Updated**: Now
**Environment**: Production + Development (Shared Backend)
**Status**: Ready to configure

