# 🚂 Railway Service Configuration Required

## ⚠️ **Issue**
Railway/Nixpacks is auto-detecting `cd backend` in the start command, but the Docker build already sets the working directory to `/app` (which contains the backend code).

## ✅ **Solution: Configure in Railway Dashboard**

### **Step 1: Go to Railway Dashboard**
1. Open: https://railway.app/dashboard
2. Select your **development service** (the one you just created)

### **Step 2: Configure Service Settings**

Go to **Settings** tab and configure:

#### **Root Directory**
- Set to: `backend`
- This tells Railway where your application code is

#### **Start Command** (Override)
- Set to: `npm start`
- This prevents Railway from adding `cd backend &&`

#### **Build Command** (Optional)
- Leave empty or set to: `npm ci`

### **Step 3: Redeploy**
After saving these settings, trigger a new deployment:
- Go to **Deployments** tab
- Click **Deploy** button (or push a new commit)

---

## 🔧 **Alternative: Use nixpacks.json**

If the above doesn't work, create `backend/nixpacks.json`:

```json
{
  "phases": {
    "setup": {
      "nixPkgs": ["nodejs_22", "npm-9_x", "openssl"]
    },
    "install": {
      "cmds": ["npm ci"]
    },
    "build": {
      "cmds": ["npm run build"]
    }
  },
  "start": {
    "cmd": "npm start"
  }
}
```

---

## 📋 **Current Railway Configuration**

Your `railway.toml` is correct:
```toml
[build]
workingDirectory = "backend"

[deploy]
startCommand = "npm start"
workingDirectory = "backend"
```

But Railway Dashboard settings **override** `railway.toml` when using Nixpacks.

---

## 🎯 **Quick Fix Steps**

1. **Go to Railway Dashboard** → Your development service
2. **Settings** → **Root Directory** → Set to `backend`
3. **Settings** → **Start Command** → Set to `npm start`
4. **Save** and **Redeploy**

This should fix the `cd backend` error! 🚀

