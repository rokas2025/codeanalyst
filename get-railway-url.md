# 🔗 Get Railway Development URL

## Option 1: Railway Dashboard (Easiest)

1. Go to: https://railway.app/dashboard
2. Click on your **development service** (the one named `web` for develop branch)
3. Go to **Settings** tab
4. Look for **"Networking"** section
5. Click **"Generate Domain"** if you don't have one yet
6. Copy the URL (it will look like: `https://web-production-xxxx.up.railway.app`)

---

## Option 2: Railway CLI

```bash
railway status
```

This will show the deployment URL.

---

## What to Do With the URL

Once you have the Railway URL (example: `https://web-production-1234.up.railway.app`):

### 1. **Update Railway Environment Variables**

Add to your Railway development service:

```
GITHUB_CALLBACK_URL=https://web-production-1234.up.railway.app/api/auth/github/callback
```

### 2. **Update Vercel Environment Variables**

Go to: https://vercel.com/rokas-projects-bff726e7/codeanalyst/settings/environment-variables

For **Preview** environment (develop branch), add/update:

```
VITE_API_URL=https://web-production-1234.up.railway.app
```

**Important:** Make sure to select **"Preview"** as the environment, NOT Production!

### 3. **Redeploy**

After updating Vercel variables:
- Push any change to `develop` branch
- OR click "Redeploy" in Vercel dashboard

---

## ✅ **Test the Fix**

1. Go to: https://codeanalyst-git-develop-rokas-projects-bff726e7.vercel.app
2. Click "Login with GitHub"
3. It should redirect properly now!

---

## 🔍 **How to Verify**

Check browser console (F12):
- **Before fix:** `Unexpected token '<', "<!DOCTYPE"...`
- **After fix:** Should login successfully or show a proper API error

