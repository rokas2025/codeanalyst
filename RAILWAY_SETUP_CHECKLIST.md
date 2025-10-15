# ✅ Railway Development Service - Quick Setup Checklist

## 🎯 What You Need to Do

I've created the configuration files. Now you need to **manually set up the second Railway service** in the Railway dashboard.

---

## 📋 Quick Steps (15 minutes)

### **1. Create New Railway Service** (5 min)

1. Go to: https://railway.app/dashboard
2. Click **"+ New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose: `rokas2025/codeanalyst`
5. Click **"Add Service"**

---

### **2. Configure Service** (3 min)

**Service Name:**
- Settings → General → Service Name: `codeanalyst-backend-development`

**Branch:**
- Settings → Source → Branch: `develop` ⚠️ **Important!**

**Root Directory:**
- Settings → Source → Root Directory: `backend`

**Commands:**
- Settings → Build → Build Command: `npm install`
- Settings → Build → Start Command: `npm start`

---

### **3. Copy Environment Variables** (5 min)

Go to your **production Railway service** and copy ALL variables, then paste into the **development service** with these changes:

| Variable | Change To |
|----------|-----------|
| `NODE_ENV` | `development` |
| `GITHUB_CALLBACK_URL` | `https://[dev-url].up.railway.app/api/auth/github/callback` |
| `FRONTEND_URL` | `https://codeanalyst-git-develop-rokas-projects-bff726e7.vercel.app` |

**Keep the same:**
- `DATABASE_URL` (shared database)
- `JWT_SECRET` (must be same!)
- `OPENAI_API_KEY`
- `REDIS_URL`
- All other variables

---

### **4. Generate Domain** (1 min)

1. In development service: Settings → Domains
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `codeanalyst-development.up.railway.app`)
4. Update `GITHUB_CALLBACK_URL` with this URL

---

### **5. Update Vercel** (2 min)

1. Go to: https://vercel.com/dashboard
2. Your project → Settings → Environment Variables
3. Find `VITE_API_URL`
4. Click **"Edit"**
5. Add **new value** for **Preview** environment:
   - Value: `https://[your-dev-railway-url].up.railway.app/api`
   - Environment: ☑️ **Preview** only (uncheck Production)
6. Save
7. **Redeploy** the develop branch in Vercel

---

### **6. Test** (2 min)

1. Go to: `https://codeanalyst-git-develop-rokas-projects-bff726e7.vercel.app/login`
2. Open DevTools (F12) → Network tab
3. Click "Login with GitHub"
4. Check request goes to: `https://[dev-railway-url].up.railway.app/api/auth/github`
5. ✅ Should work!

---

## 🎯 Result

After setup, you'll have:

```
Production:
  Vercel (main) → Railway Service 1 (main) → app.beenex.dev

Development:
  Vercel (develop) → Railway Service 2 (develop) → codeanalyst-git-develop-...
```

---

## 📝 Important URLs to Update

After generating the Railway development domain, update these:

1. **Railway Development Service:**
   - `GITHUB_CALLBACK_URL` = `https://[dev-url].up.railway.app/api/auth/github/callback`

2. **Vercel (Preview environment):**
   - `VITE_API_URL` = `https://[dev-url].up.railway.app/api`

3. **GitHub OAuth App** (if using separate app):
   - Authorization callback URL = `https://[dev-url].up.railway.app/api/auth/github/callback`

---

## 🆘 Need Help?

See the full guide: `RAILWAY_DEVELOPMENT_SETUP.md`

---

**Status**: Configuration files ready ✅  
**Next**: Manual Railway dashboard setup (15 min)  
**Then**: Update Vercel environment variables  
**Finally**: Test OAuth flow

