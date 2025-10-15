# 🚀 Development Branch Setup - Simple Approach

## Overview

You now have two branches using **the same infrastructure**:
- **`main`** - Production branch (live)
- **`develop`** - Development branch (for testing)

**Both branches will**:
- Use the same Railway backend
- Use the same database
- Use the same API keys
- Use the same GitHub OAuth app

**The difference**:
- Each branch gets its own Vercel preview URL
- You can test changes in `develop` before merging to `main`

---

## ✅ What's Already Done

✅ `develop` branch created and pushed to GitHub
✅ Both branches use same configuration files
✅ You're currently on `main` branch (safe)

---

## 🎯 Setup Steps

### 1️⃣ Vercel - Enable Branch Deployments (2 minutes)

**Go to**: https://vercel.com/dashboard

1. **Select your project**
2. **Settings → Git**
3. **Ensure these are enabled**:
   - ✅ Production Branch: `main`
   - ✅ Automatic Branch Deployments: **ON**
   - ✅ Deploy all branches: **YES**

4. **Settings → Environment Variables**
   
   Your existing variables will work for **both** `main` and `develop`:
   
   | Variable | Value | Apply To |
   |----------|-------|----------|
   | `VITE_API_URL` | `https://codeanalyst-production.up.railway.app/api` | **All Environments** |
   | `VITE_GITHUB_CLIENT_ID` | Your existing client ID | **All Environments** |
   | `VITE_FRONTEND_URL` | Leave empty (auto-detected) | **All Environments** |

**That's it for Vercel!** ✅

---

### 2️⃣ Railway - Enable Branch Deployments (1 minute)

**Go to**: https://railway.app/dashboard

1. **Select your existing service** (`codeanalyst-production`)
2. **Settings → Service**
3. **Branch Deployments**: Enable if not already
4. **Watch Branch**: Add `develop` to the list

**Railway will now deploy both branches using same environment variables!**

---

### 3️⃣ GitHub OAuth - Update Callback URLs (2 minutes)

**Go to**: https://github.com/settings/developers

1. **Find your existing OAuth App**
2. **Update Authorization callback URLs**:
   
   Add **multiple callback URLs** (comma or newline separated):
   ```
   https://codeanalyst-production.up.railway.app/api/auth/github/callback
   https://analyst-psi.vercel.app/auth/callback
   https://analyst-psi-git-develop-*.vercel.app/auth/callback
   ```
   
   *(Replace `analyst-psi` with your actual Vercel project name)*

3. **Save changes**

**That's it!** Your OAuth will work for all deployments ✅

---

## 📋 What You Get

### Automatic URLs After Pushing:

| Branch | Frontend URL | Backend | Database |
|--------|-------------|---------|----------|
| **`main`** (Production) | `https://analyst-psi.vercel.app` | Same Railway | Same DB |
| **`develop`** (Testing) | `https://analyst-psi-git-develop-*.vercel.app` | Same Railway | Same DB |
| **Feature branches** | `https://analyst-psi-git-feature-name-*.vercel.app` | Same Railway | Same DB |

### Benefits:
- ✅ No duplicate infrastructure needed
- ✅ Test in `develop` before going to production
- ✅ Each branch gets its own preview URL
- ✅ Safe to test without affecting live users
- ✅ Simple setup (5 minutes total)

---

## 👥 Developer Workflow

### Daily Work:

```bash
# 1. Switch to develop
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feature/my-feature

# 3. Make changes, test locally
npm run dev

# 4. Commit and push
git add .
git commit -m "feat: add something"
git push origin feature/my-feature

# 5. Vercel automatically creates preview URL!
# Check GitHub PR or Vercel dashboard
```

### Testing:
- Open the Vercel preview URL
- Test your changes
- Everything works? Create PR to `develop`

### Releasing to Production:
```bash
# Only when ready!
# 1. Create PR: develop → main
# 2. Review and test
# 3. Merge
# 4. Production automatically updates!
```

---

## 🔍 Testing Your Setup

### 1. Test Vercel Preview:
```bash
# Push something to develop
git checkout develop
# ... make a small change ...
git push origin develop

# Check Vercel dashboard
# You should see: "develop" deployment
# Get preview URL
```

### 2. Test Feature Branch:
```bash
# Create test feature
git checkout -b feature/test
# ... make a change ...
git push origin feature/test

# Vercel creates another preview URL!
# Each branch gets its own URL
```

---

## ⚠️ Important Notes

### Data Safety:
- ⚠️ Both `main` and `develop` use **same database**
- 🔒 Be careful when testing data-changing operations
- 💡 Consider adding `NODE_ENV` checks in code for test data

### Example Safety Check:
```javascript
// In your backend code
if (process.env.NODE_ENV === 'production') {
  // Production logic
} else {
  // Add test data prefix or warning
  console.log('⚠️ Running in development mode');
}
```

---

## 🎯 Quick Checklist

- [ ] Vercel: Enable automatic branch deployments
- [ ] Vercel: Verify environment variables apply to all branches
- [ ] Railway: Enable branch deployments (optional)
- [ ] GitHub OAuth: Add wildcard callback URLs
- [ ] Test: Push to `develop` and verify preview URL
- [ ] Test: Create feature branch and verify preview URL
- [ ] Test: Login with GitHub on preview URL

---

## 📞 FAQ

**Q: Will develop branch affect production?**
A: No! Each branch gets its own Vercel URL. However, they share the backend/database, so be careful with data operations.

**Q: Do I need to pay for extra Vercel deployments?**
A: No! Preview deployments are included in Vercel free tier.

**Q: What if I want separate databases?**
A: You'd need to create a second Railway service with separate DATABASE_URL. Let me know if you want that setup instead.

**Q: How do I prevent accidental merges to main?**
A: Set up branch protection on GitHub:
- Go to GitHub → Settings → Branches
- Add rule for `main`
- Require pull request reviews before merging

---

## ✅ Current Status

- ✅ `develop` branch exists on GitHub
- ✅ `main` branch is safe and unchanged  
- ✅ Configuration files ready
- ⏳ **Next**: Enable automatic deployments in Vercel (2 min)

---

**Time to Complete Setup**: 5 minutes
**Complexity**: Simple (same infrastructure, different URLs)
**Cost**: $0 (uses existing resources)

**Next Step**: Follow steps 1-3 above to enable branch deployments!

