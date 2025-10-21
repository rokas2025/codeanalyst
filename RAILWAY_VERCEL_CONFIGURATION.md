# 🎯 Railway + Vercel Configuration Guide

## 📊 Your Railway Development URLs:
- **Primary:** `https://web-development-a563.up.railway.app`
- **Alternate:** `https://web-development-0c8c.up.railway.app`

Let's use the primary one: **`web-development-a563.up.railway.app`**

---

## 🚂 Step 1: Update Railway Environment Variables

### **Go to Railway Dashboard:**
https://railway.app/dashboard

### **Select your "web" service (development)**

### **Go to Variables tab and ADD/UPDATE:**

```bash
GITHUB_CALLBACK_URL=https://web-development-a563.up.railway.app/api/auth/github/callback
```

**Important:** Make sure `NODE_ENV` is still set to `development`

### **Click "Deploy" or wait for auto-deploy**

---

## ▲ Step 2: Update Vercel Environment Variables

### **Go to Vercel Dashboard:**
https://vercel.com/rokas-projects-bff726e7/codeanalyst/settings/environment-variables

### **Add or Update This Variable:**

**Variable Name:**
```
VITE_API_URL
```

**Value:**
```
https://web-development-a563.up.railway.app
```

**Environment:**
- ✅ **ONLY select "Preview"** (NOT Production!)

### **Important Notes:**
- Make sure to **deselect Production** and **deselect Development**
- Only **Preview** should be checked
- This will apply to your `develop` branch deployments

### **After Saving:**
You need to trigger a new deployment:
- Push any change to `develop` branch
- OR click "Redeploy" on your latest Preview deployment

---

## 🧪 Step 3: Test the Fix

### **1. Wait for Vercel to Redeploy:**
Go to: https://vercel.com/rokas-projects-bff726e7/codeanalyst/deployments

Wait for the Preview deployment to finish.

### **2. Test GitHub OAuth:**
1. Go to: https://codeanalyst-git-develop-rokas-projects-bff726e7.vercel.app
2. Click "Login with GitHub"
3. **It should work now!** ✅

### **3. Check Browser Console (F12):**
- **Before fix:** `Unexpected token '<', "<!DOCTYPE"...`
- **After fix:** Should login successfully or show proper API errors

---

## 🔍 Quick Verification

### **Test Backend is Reachable:**
Open this in your browser:
```
https://web-development-a563.up.railway.app/health
```

You should see a JSON response with:
```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": ...
}
```

---

## 📋 Summary of Changes:

### **Railway (Development Service):**
✅ `GITHUB_CALLBACK_URL=https://web-development-a563.up.railway.app/api/auth/github/callback`

### **Vercel (Preview Environment Only):**
✅ `VITE_API_URL=https://web-development-a563.up.railway.app`

### **Vercel Deployment:**
✅ Redeploy `develop` branch after adding the variable

---

## 🚀 You're All Set!

Once you complete these 3 steps, your development environment will be fully configured and GitHub OAuth will work correctly!

**Let me know when you've done this and I'll help you test it!** ✨

