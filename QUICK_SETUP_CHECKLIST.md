# ✅ Quick Setup Checklist

## 🚂 Railway Configuration

**URL:** https://railway.app/dashboard

1. ☐ Open your **"web"** service (development)
2. ☐ Go to **Variables** tab
3. ☐ Add: `GITHUB_CALLBACK_URL=https://web-development-a563.up.railway.app/api/auth/github/callback`
4. ☐ Save (Railway will auto-redeploy)

---

## ▲ Vercel Configuration

**URL:** https://vercel.com/rokas-projects-bff726e7/codeanalyst/settings/environment-variables

1. ☐ Click **"Add New"**
2. ☐ Name: `VITE_API_URL`
3. ☐ Value: `https://web-development-a563.up.railway.app`
4. ☐ Environment: **ONLY CHECK "Preview"** ⚠️
5. ☐ Save

---

## 🔄 Redeploy Vercel

1. ☐ Go to: https://vercel.com/rokas-projects-bff726e7/codeanalyst/deployments
2. ☐ Find latest **Preview** deployment
3. ☐ Click "..." → "Redeploy"

---

## 🧪 Test

1. ☐ Go to: https://codeanalyst-git-develop-rokas-projects-bff726e7.vercel.app
2. ☐ Click "Login with GitHub"
3. ☐ Should work! ✅

---

**That's it! 3 simple steps.** 🚀

