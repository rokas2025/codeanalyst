# 🚀 Quick Start - Development Environment

## For You and Your Developer Team

### ✅ What's Done:
- ✅ `develop` branch created
- ✅ Configuration files updated
- ✅ Ready for staging setup

### 🎯 What You Need To Do (One-Time Setup):

## 1️⃣ Vercel Setup (5 minutes)

**Go to**: https://vercel.com/dashboard

1. Select your project
2. **Settings → Git**:
   - Production Branch: `main` ✅
   - Automatic deployments: ON ✅
3. **Settings → Environment Variables**:
   - Add `VITE_API_URL`:
     - **Production** (`main`): `https://codeanalyst-production.up.railway.app/api`
     - **Preview** (all branches): `https://codeanalyst-staging.up.railway.app/api`

**That's it!** Vercel will automatically create preview URLs for `develop` and any feature branches.

---

## 2️⃣ Railway Staging Service (10 minutes)

**Go to**: https://railway.app/dashboard

1. **New Service** → Connect GitHub Repo
2. **Settings**:
   - Name: `codeanalyst-staging`
   - Branch: `develop` ⚠️ IMPORTANT!
   - Root Directory: `backend`
3. **Variables** (click "Add Variable"):
   ```
   NODE_ENV=staging
   DATABASE_URL=<create new Supabase project>
   FRONTEND_URL=<will get from Vercel after first deploy>
   GITHUB_CLIENT_ID=<create new GitHub OAuth app>
   GITHUB_CLIENT_SECRET=<from GitHub OAuth app>
   ```

---

## 3️⃣ Staging Database (5 minutes)

**Go to**: https://supabase.com/dashboard

1. **New Project**: `codeanalyst-staging`
2. Copy connection string
3. **Update Railway**:
   - Go to `codeanalyst-staging` service
   - Add/Update `DATABASE_URL` variable

---

## 4️⃣ GitHub OAuth Staging App (5 minutes)

**Go to**: https://github.com/settings/developers

1. **New OAuth App**:
   - Name: `CodeAnalyst Staging`
   - Homepage: `https://analyst-psi-git-develop-[yourteam].vercel.app`
   - Callback: `https://codeanalyst-staging.up.railway.app/api/auth/github/callback`
2. Copy Client ID and Secret
3. **Update**:
   - **Railway**: Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
   - **Vercel**: Add `VITE_GITHUB_CLIENT_ID` for Preview environment

---

## 👥 Daily Workflow (For Developers)

### Starting Work:
```bash
# 1. Get latest develop
git checkout develop
git pull origin develop

# 2. Create your feature branch
git checkout -b feature/your-feature-name

# 3. Code away! 💻
```

### Testing Your Changes:
```bash
# 1. Commit and push
git add .
git commit -m "feat: add awesome feature"
git push origin feature/your-feature-name

# 2. Vercel automatically creates preview URL!
# Check GitHub PR or Vercel dashboard for URL

# 3. Test at: https://analyst-psi-git-feature-your-feature-name-[team].vercel.app
```

### Merging to Staging:
```bash
# 1. Create Pull Request on GitHub:
#    feature/your-feature-name → develop

# 2. Get code review

# 3. Merge PR

# 4. Staging automatically updates!
#    https://analyst-psi-git-develop-[team].vercel.app
```

### Deploying to Production:
```bash
# ⚠️ ONLY AFTER APPROVAL!
# Create PR: develop → main
# After merge, production updates automatically
```

---

## 📋 URLs You'll Get:

| What | URL Pattern | Updates When |
|------|-------------|--------------|
| **Production** | `analyst-psi.vercel.app` | Merge to `main` |
| **Staging** | `analyst-psi-git-develop-*.vercel.app` | Merge to `develop` |
| **Your Feature** | `analyst-psi-git-feature-name-*.vercel.app` | Push to feature branch |

---

## 🆘 Quick Commands:

```bash
# See current branch
git branch

# Switch to develop
git checkout develop

# Get latest changes
git pull origin develop

# Create feature branch
git checkout -b feature/name

# Push your work
git push origin feature/name

# Check Vercel deployments
vercel ls

# Check Railway logs
railway logs
```

---

## ⚠️ Rules:
1. ❌ **DON'T** push directly to `main`
2. ❌ **DON'T** merge to `main` without approval
3. ✅ **DO** create feature branches from `develop`
4. ✅ **DO** test in staging before production
5. ✅ **DO** write clear commit messages

---

## 📞 Need More Details?
See full guide: `docs/DEVELOPMENT_STAGING_SETUP.md`

---

**Setup Status**: ⏳ Waiting for Railway + Vercel configuration
**Next Step**: Follow steps 1-4 above to complete setup

