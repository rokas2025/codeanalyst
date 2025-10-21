# 🚂 Railway CLI Authentication Required

## 🔐 **Please Complete This Step:**

1. **Open this URL in your browser:**
   ```
   https://railway.com/cli-login?d=d29yZENvZGU9b3JjaGlkLXN0dW5uaW5nLWRyZWFtJmhvc3RuYW1lPXJvY2t5ZWNvbQ==
   ```

2. **OR enter the pairing code:** `orchid-stunning-dream`
   - Go to: https://railway.com/cli-login
   - Enter the code: `orchid-stunning-dream`

3. **Click "Authorize"** in the browser

4. **Come back here and tell me "done"** - Then I'll automatically get your Railway URLs!

---

## 🎯 **What Happens Next (Automatic):**

Once you authorize, I will:
1. ✅ Get your Railway development service URL
2. ✅ Update the `GITHUB_CALLBACK_URL` in Railway
3. ✅ Give you the exact `VITE_API_URL` to add in Vercel
4. ✅ Fix the GitHub OAuth issue

---

## ⚡ **Quick Alternative (If You Prefer):**

If you want to do it manually instead:

1. **Get Railway URL:**
   - Go to: https://railway.app/dashboard
   - Click on your **"web"** service (development)
   - Go to **Settings** → **Networking**
   - Click **"Generate Domain"** if not already created
   - Copy the URL (example: `https://web-production-1234.up.railway.app`)

2. **Add to Railway:**
   ```
   GITHUB_CALLBACK_URL=https://web-production-1234.up.railway.app/api/auth/github/callback
   ```

3. **Add to Vercel:**
   - Go to: https://vercel.com/rokas-projects-bff726e7/codeanalyst/settings/environment-variables
   - Select **"Preview"** environment
   - Add: `VITE_API_URL=https://web-production-1234.up.railway.app`

---

**Which do you prefer?**
- Tell me "done" after authorizing Railway CLI (I'll do everything)
- OR tell me your Railway URL and I'll create the configuration instructions

