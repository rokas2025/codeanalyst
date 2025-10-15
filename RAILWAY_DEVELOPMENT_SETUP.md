# 🚂 Railway Development Service Setup Guide

## 🎯 Goal

Create a **second Railway service** for the `develop` branch so you have:

```
Production:  main branch    → Railway Service 1 → codeanalyst-production.up.railway.app
Development: develop branch → Railway Service 2 → codeanalyst-development.up.railway.app
```

---

## 📋 Step-by-Step Setup

### **Step 1: Create New Railway Service**

1. Go to: https://railway.app/dashboard
2. Click **"+ New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository: `rokas2025/codeanalyst`
5. Railway will ask which service to create - click **"Add Service"**

---

### **Step 2: Configure the New Service**

#### **2.1 Set Service Name**
1. Click on the new service
2. Go to **Settings** → **General**
3. Change **Service Name** to: `codeanalyst-backend-development`
4. Save

#### **2.2 Set Branch**
1. In **Settings** → **Source**
2. Find **"Branch"** setting
3. Change from `main` to **`develop`**
4. Save

#### **2.3 Set Root Directory**
1. In **Settings** → **Source**
2. Find **"Root Directory"**
3. Set to: `backend`
4. Save

#### **2.4 Set Build & Start Commands**
1. In **Settings** → **Build**
2. **Build Command**: `npm install`
3. **Start Command**: `npm start`
4. Save

---

### **Step 3: Configure Environment Variables**

Copy all environment variables from your **production service**, but with these changes:

#### **Required Variables:**

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `development` | Different from production |
| `DATABASE_URL` | `[Same as production]` | ⚠️ Shared database (or create separate) |
| `JWT_SECRET` | `[Same as production]` | Must be same for token compatibility |
| `JWT_EXPIRES_IN` | `7d` | Same as production |
| `GITHUB_CLIENT_ID` | `[Production OR Dev Client ID]` | See OAuth section below |
| `GITHUB_CLIENT_SECRET` | `[Production OR Dev Secret]` | See OAuth section below |
| `GITHUB_CALLBACK_URL` | `https://codeanalyst-development.up.railway.app/api/auth/github/callback` | ⚠️ **Different!** |
| `FRONTEND_URL` | `https://codeanalyst-git-develop-rokas-projects-bff726e7.vercel.app` | ⚠️ **Different!** |
| `OPENAI_API_KEY` | `[Same as production]` | Shared API key |
| `REDIS_URL` | `[Same as production]` | ⚠️ Shared Redis (or create separate) |
| `PORT` | `3001` | Railway auto-assigns |

---

### **Step 4: GitHub OAuth Configuration**

You have **two options**:

#### **Option A: Shared OAuth App** (Simpler)

Use the **same GitHub OAuth app** for both environments:

1. Go to: https://github.com/settings/developers
2. Click on your OAuth app
3. **Authorization callback URL**: Keep as `https://codeanalyst-production.up.railway.app/api/auth/github/callback`
4. ⚠️ **Problem**: This won't work for development!

**This option requires the dynamic redirect fix we implemented.**

---

#### **Option B: Separate OAuth Apps** (Recommended) ✅

Create a **second GitHub OAuth app** for development:

1. Go to: https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: `CodeAnalyst Development`
   - **Homepage URL**: `https://codeanalyst-git-develop-rokas-projects-bff726e7.vercel.app`
   - **Authorization callback URL**: `https://codeanalyst-development.up.railway.app/api/auth/github/callback`
4. Click **"Register application"**
5. Copy the **Client ID** and generate a **Client Secret**

**Then in Railway Development Service:**
- `GITHUB_CLIENT_ID` = Development Client ID
- `GITHUB_CLIENT_SECRET` = Development Client Secret
- `GITHUB_CALLBACK_URL` = `https://codeanalyst-development.up.railway.app/api/auth/github/callback`

---

### **Step 5: Database Configuration**

You have **two options**:

#### **Option A: Shared Database** (Simpler)

Use the **same database** for both environments:

- ✅ **Pros**: Simple, no extra cost, shared user data
- ⚠️ **Cons**: Development can affect production data

**Setup:**
- Use the same `DATABASE_URL` in both services
- Be careful with database migrations on develop branch

---

#### **Option B: Separate Database** (Recommended for safety)

Create a **separate database** for development:

1. In Railway, click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Name it: `codeanalyst-db-development`
3. Copy the connection string
4. In development service, set `DATABASE_URL` to the new database
5. Run migrations on the new database

**Setup:**
```bash
# Connect to development database and run migrations
psql $DEV_DATABASE_URL < database-schema.sql
```

---

### **Step 6: Update Vercel Environment Variables**

Update Vercel to use the **development backend** for the `develop` branch:

1. Go to: https://vercel.com/dashboard
2. Click your project → **Settings** → **Environment Variables**
3. Find `VITE_API_URL`
4. Add a **new value** for **Preview** environment only:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://codeanalyst-development.up.railway.app/api`
   - **Environment**: ☑️ **Preview** only (uncheck Production)
5. Save

**If using separate OAuth app:**
6. Find `VITE_GITHUB_CLIENT_ID`
7. Add a **new value** for **Preview** environment:
   - **Key**: `VITE_GITHUB_CLIENT_ID`
   - **Value**: `[Development Client ID]`
   - **Environment**: ☑️ **Preview** only
8. Save

---

### **Step 7: Deploy and Test**

#### **7.1 Trigger Deployment**

1. Push a commit to `develop` branch:
   ```bash
   git checkout develop
   git commit --allow-empty -m "chore: Trigger Railway development deployment"
   git push origin develop
   ```

2. Check Railway dashboard - you should see:
   - **Service 1** (Production): Deploying from `main`
   - **Service 2** (Development): Deploying from `develop` ✅

#### **7.2 Get Development Backend URL**

1. In Railway, click the **development service**
2. Go to **Settings** → **Domains**
3. Click **"Generate Domain"**
4. Copy the URL (e.g., `codeanalyst-development.up.railway.app`)

#### **7.3 Update Environment Variables**

Update these variables with the actual development URL:

**In Railway Development Service:**
- `GITHUB_CALLBACK_URL` = `https://[your-dev-url].up.railway.app/api/auth/github/callback`

**In Vercel (Preview environment):**
- `VITE_API_URL` = `https://[your-dev-url].up.railway.app/api`

**In GitHub OAuth App (if separate):**
- **Authorization callback URL** = `https://[your-dev-url].up.railway.app/api/auth/github/callback`

#### **7.4 Test the Development Environment**

1. Go to: `https://codeanalyst-git-develop-rokas-projects-bff726e7.vercel.app`
2. Open DevTools (F12) → Network tab
3. Click "Login with GitHub"
4. Check that requests go to the **development backend**:
   ```
   https://codeanalyst-development.up.railway.app/api/auth/github
   ```
5. After OAuth, you should be redirected back to the development URL ✅

---

## 📊 Final Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PRODUCTION                               │
├─────────────────────────────────────────────────────────────┤
│  Vercel (main)          → Railway Service 1 (main)          │
│  app.beenex.dev         → codeanalyst-production.up...      │
│                         → PostgreSQL (production)            │
│                         → Redis (production)                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPMENT                               │
├─────────────────────────────────────────────────────────────┤
│  Vercel (develop)       → Railway Service 2 (develop)       │
│  codeanalyst-git-dev... → codeanalyst-development.up...     │
│                         → PostgreSQL (shared or separate)    │
│                         → Redis (shared or separate)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Summary Checklist

- [ ] Create new Railway service
- [ ] Configure service name: `codeanalyst-backend-development`
- [ ] Set branch to `develop`
- [ ] Set root directory to `backend`
- [ ] Copy all environment variables
- [ ] Update `NODE_ENV` to `development`
- [ ] Update `GITHUB_CALLBACK_URL` with development URL
- [ ] Update `FRONTEND_URL` with Vercel develop URL
- [ ] Create separate GitHub OAuth app (recommended)
- [ ] Generate Railway domain
- [ ] Update Vercel `VITE_API_URL` for Preview environment
- [ ] Update Vercel `VITE_GITHUB_CLIENT_ID` for Preview (if separate OAuth)
- [ ] Test GitHub login on development URL
- [ ] Verify backend requests go to development Railway service

---

## 🆘 Troubleshooting

### **Railway not deploying from develop?**
- Check **Settings** → **Source** → **Branch** is set to `develop`
- Check **Deployments** tab for errors
- Try pushing an empty commit to trigger deployment

### **OAuth still redirecting to production?**
- Check `FRONTEND_URL` in Railway development service
- Check that Vercel is using the development backend URL
- Clear browser cache and try again

### **Database connection errors?**
- If using shared database, check `DATABASE_URL` is correct
- If using separate database, ensure migrations are run
- Check Railway logs for connection errors

### **CORS errors?**
- Check backend CORS configuration allows Vercel preview URLs
- Check `FRONTEND_URL` matches the Vercel preview URL exactly

---

## 💰 Cost Considerations

**Railway Pricing:**
- Each service uses resources (RAM, CPU, bandwidth)
- Development service will consume additional credits
- Consider using Railway's free tier for development if available
- Or share database/Redis to reduce costs

**Recommendation:**
- Start with shared database/Redis
- Upgrade to separate resources if needed for testing

---

## 🎉 Benefits

✅ **True dev/prod separation**
✅ **Test backend changes before merging**
✅ **Independent deployments**
✅ **Safer development workflow**
✅ **Can test database migrations**
✅ **Full staging environment**

---

**Created**: 2025-01-15  
**Status**: Ready to implement  
**Estimated Setup Time**: 15-20 minutes

