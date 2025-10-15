# ✅ Development Environment Setup - COMPLETE

## 🎉 What's Done Automatically

✅ **Git Branch Created**: `develop` branch created and pushed to GitHub
✅ **Configuration Updated**: `vercel.json` and `railway.toml` configured for multi-environment
✅ **Documentation Created**: Complete setup guides created
✅ **Main Branch Protected**: No changes made to `main` branch

---

## 📋 Current Status

### Git Branches:
- ✅ **`main`**: Production (UNTOUCHED - still safe!)
- ✅ **`develop`**: Staging branch (NEW - ready for development)

### GitHub Status:
```
Repository: https://github.com/rokas2025/codeanalyst
Branch 'develop' pushed successfully!
```

### Vercel:
⏳ **Waiting for your configuration** (5 minutes)
- Vercel will automatically detect the new `develop` branch
- Preview URL will be created automatically

### Railway:
⏳ **Waiting for your configuration** (10 minutes)
- Need to create staging service manually

---

## 🚀 Next Steps (YOU need to do these):

### 1️⃣ Vercel Configuration (5 minutes)

**Go to**: https://vercel.com/dashboard

1. Find your project (analyst-psi or similar)
2. **Settings → Environment Variables**
3. Add `VITE_API_URL`:
   - **For Production** (`main` branch): `https://codeanalyst-production.up.railway.app/api`
   - **For Preview** (all other branches): `https://codeanalyst-staging.up.railway.app/api`
4. Click on your project → **Deployments** tab
5. You should see a new deployment for `develop` branch starting automatically!
6. **Copy the preview URL** (will look like `https://analyst-psi-git-develop-yourteam.vercel.app`)

---

### 2️⃣ Railway Staging Service (10 minutes)

**Go to**: https://railway.app/dashboard

1. Select your existing project
2. Click **"New Service"** (top right corner)
3. Select **"GitHub Repo"**
4. Configure the service:
   - **Service Name**: `codeanalyst-staging`
   - **Branch**: ⚠️ IMPORTANT: Select `develop`
   - **Root Directory**: `backend`
   - **Start Command**: Should auto-detect from railway.toml

5. **Add Environment Variables** (click "Add Variable"):
   ```
   NODE_ENV=staging
   PORT=3001
   DATABASE_URL=<see step 3 below>
   FRONTEND_URL=<paste Vercel preview URL from step 1>
   GITHUB_CLIENT_ID=<see step 4 below>
   GITHUB_CLIENT_SECRET=<see step 4 below>
   OPENAI_API_KEY=<same as production or separate>
   ANTHROPIC_API_KEY=<same as production or separate>
   JWT_SECRET=<generate new random string>
   JWT_EXPIRES_IN=7d
   ```

6. **Deploy** - Railway will start building automatically
7. **Copy the Railway staging URL** after deployment completes

---

### 3️⃣ Staging Database (5 minutes)

**Go to**: https://supabase.com/dashboard

1. **New Project**:
   - Name: `codeanalyst-staging`
   - Region: Same as production for consistency
   - Password: Generate strong password

2. **Get Connection String**:
   - Go to **Settings → Database**
   - Copy the **Connection string** (URI format)
   - Replace `[YOUR-PASSWORD]` with your actual password

3. **Run Schema** (from your computer):
   ```bash
   # Download your database-schema.sql if not local
   # Then connect and run:
   psql "postgresql://postgres:[password]@[staging-host]:5432/postgres" -f database-schema.sql
   ```

4. **Update Railway**:
   - Go back to Railway → codeanalyst-staging → Variables
   - Update `DATABASE_URL` with the Supabase connection string

---

### 4️⃣ GitHub OAuth Staging App (5 minutes)

**Go to**: https://github.com/settings/developers

1. **New OAuth App**:
   - **Application name**: `CodeAnalyst Staging`
   - **Homepage URL**: `https://analyst-psi-git-develop-[yourteam].vercel.app` (from step 1)
   - **Authorization callback URL**: `https://codeanalyst-staging.up.railway.app/api/auth/github/callback` (from step 2)

2. Click **"Register application"**

3. **Generate a client secret**

4. **Copy**:
   - Client ID
   - Client Secret

5. **Update Railway**:
   - Go to codeanalyst-staging service
   - Add variables:
     - `GITHUB_CLIENT_ID`: paste client ID
     - `GITHUB_CLIENT_SECRET`: paste client secret

6. **Update Vercel**:
   - Go to Vercel → Settings → Environment Variables
   - Add `VITE_GITHUB_CLIENT_ID`:
     - For Preview (all branches): paste staging client ID

---

## 🧪 Testing Your Setup

### Test 1: Check Vercel Preview

```bash
# Vercel should automatically deploy develop branch
# Go to: https://vercel.com/[yourteam]/[project]/deployments
# Find deployment for "develop" branch
# Click and open preview URL
```

**Expected**: Frontend loads successfully

---

### Test 2: Check Railway Staging

```bash
# Go to your staging Railway URL + /api/health
# Example: https://codeanalyst-staging.up.railway.app/api/health
```

**Expected Response**:
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "database": "connected"
  }
}
```

---

### Test 3: End-to-End Test

1. Open Vercel preview URL
2. Click "Login with GitHub"
3. Should redirect to GitHub OAuth (staging app)
4. Authorize
5. Should redirect back and log you in
6. Try analyzing a website
7. Try analyzing a GitHub repo

**All working?** ✅ Setup complete!

---

## 👥 For Your Developer Team

Share these files:
- **Quick Start**: `DEVELOPMENT_QUICK_START.md` (read this first!)
- **Full Guide**: `docs/DEVELOPMENT_STAGING_SETUP.md` (detailed instructions)

### Developer Workflow:
```bash
# 1. Clone repo (if they haven't)
git clone https://github.com/rokas2025/codeanalyst.git
cd codeanalyst

# 2. Get develop branch
git checkout develop
git pull origin develop

# 3. Create feature branch
git checkout -b feature/my-feature

# 4. Make changes, commit, push
git add .
git commit -m "feat: add something"
git push origin feature/my-feature

# 5. Vercel automatically creates preview URL!
# Check GitHub or Vercel for the URL

# 6. Create PR on GitHub: feature/my-feature → develop
# 7. After review, merge
# 8. Staging automatically updates!
```

---

## 📊 Your Environment URLs (After Setup)

| Environment | Frontend | Backend | Branch | Auto-Deploy |
|-------------|----------|---------|--------|-------------|
| **Production** | `analyst-psi.vercel.app` | `codeanalyst-production.up.railway.app` | `main` | ✅ Yes |
| **Staging** | `analyst-psi-git-develop-*.vercel.app` | `codeanalyst-staging.up.railway.app` | `develop` | ✅ Yes |
| **Feature** | `analyst-psi-git-feature-*-*.vercel.app` | Uses staging | `feature/*` | ✅ Yes |

---

## ⚠️ Important Notes

1. **Main branch is SAFE**: No changes were made to production
2. **Automatic deployments**: Vercel and Railway will auto-deploy on push
3. **Preview URLs**: Vercel creates unique URL for each branch
4. **Database**: Staging uses separate database (won't affect production)
5. **OAuth**: Staging uses separate GitHub app (won't affect production users)

---

## 📞 Troubleshooting

### Vercel not deploying?
- Check Settings → Git → ensure auto-deploy is on
- Check Deployments tab for errors

### Railway staging not working?
- Check service logs in Railway dashboard
- Verify branch is set to `develop`
- Verify environment variables are all set

### Database connection error?
- Verify DATABASE_URL is correct
- Test connection: `psql "your-connection-string"`

### GitHub OAuth not working?
- Verify callback URL matches exactly
- Check Client ID in both Vercel and Railway

---

## ✅ Setup Checklist

- [ ] Vercel preview URL obtained
- [ ] Railway staging service created
- [ ] Staging database created and migrated
- [ ] GitHub OAuth staging app created
- [ ] All environment variables set
- [ ] Test: Vercel preview loads
- [ ] Test: Railway health check passes
- [ ] Test: Can login with GitHub
- [ ] Test: Can analyze website
- [ ] Test: Can analyze code repo
- [ ] Shared guides with developer team

---

**Status**: ✅ Code Changes Complete | ⏳ Waiting for Platform Configuration
**Time Estimate**: 25-30 minutes total for all 4 steps
**Next**: Follow steps 1-4 above to complete setup

---

**Created**: $(date)
**Branch**: `develop` 
**Commit**: `f44f62e`
**Files Modified**: 
- `vercel.json`
- `railway.toml`
- `docs/DEVELOPMENT_STAGING_SETUP.md` (new)
- `DEVELOPMENT_QUICK_START.md` (new)

