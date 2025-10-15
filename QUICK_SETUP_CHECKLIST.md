# ✅ Quick Setup Checklist - 5 Minutes

## What You Have:
- ✅ `main` branch - Production (live)
- ✅ `develop` branch - Development (testing)
- ✅ Same backend, database, and API keys for both

## What You Need to Do:

### ☐ Step 1: Vercel (2 minutes)
**Link**: https://vercel.com/dashboard

1. Open your project
2. **Settings → Git**
   - ✅ Production Branch: `main`
   - ✅ Automatic deployments: **ON**
3. **Done!** Vercel will create preview URLs automatically

---

### ☐ Step 2: GitHub OAuth (2 minutes)
**Link**: https://github.com/settings/developers

1. Open your OAuth App
2. **Authorization callback URL**: Add this line
   ```
   https://analyst-psi-git-develop-*.vercel.app/auth/callback
   ```
3. **Save**

---

### ☐ Step 3: Test (1 minute)

```bash
# Make a small change to develop
git checkout develop
# ... edit a file ...
git add .
git commit -m "test: verify preview deployment"
git push origin develop
```

Check Vercel dashboard - you should see new deployment!

---

## That's It! 🎉

### What Happens Now:
- Push to `main` → Updates production: `analyst-psi.vercel.app`
- Push to `develop` → Creates preview: `analyst-psi-git-develop-*.vercel.app`
- Push to `feature/*` → Creates preview: `analyst-psi-git-feature-*.vercel.app`

### All Using:
- ✅ Same Railway backend
- ✅ Same database
- ✅ Same API keys
- ✅ Same GitHub OAuth

**Simple and free!** 🚀

---

**Full Guide**: See `DEV_BRANCH_SETUP.md` if you need more details.

