# Custom Domain Setup Guide: app.beenex.dev

## Issue
After login, users are redirected to `codeanalyst.vercel.app` instead of staying on `app.beenex.dev`

## Solution Steps

### 1. ✅ Add Custom Domain in Vercel (MANUAL STEP)

1. Go to https://vercel.com/your-project/settings/domains
2. Click "Add Domain"
3. Enter: `app.beenex.dev`
4. Vercel will provide DNS records to add:
   - **Type**: `CNAME`
   - **Name**: `app` (or `@` if using root domain)
   - **Value**: `cname.vercel-dns.com`
5. Add these DNS records in your domain registrar (where beenex.dev is registered)
6. Wait for DNS propagation (5-30 minutes)
7. Verify the domain is active in Vercel

### 2. 🔧 Update Railway Environment Variables

Update these environment variables in Railway:

```bash
FRONTEND_URL=https://app.beenex.dev
ALLOWED_ORIGINS=https://app.beenex.dev,https://codeanalyst.vercel.app
```

**How to update in Railway:**
1. Go to https://railway.app
2. Select your project: `codeanalyst-production`
3. Click "Variables" tab
4. Update or add:
   - `FRONTEND_URL` → `https://app.beenex.dev`
   - `ALLOWED_ORIGINS` → `https://app.beenex.dev,https://codeanalyst.vercel.app`
5. Redeploy the service

### 3. 🔐 Update GitHub OAuth App Settings

1. Go to https://github.com/settings/developers
2. Find your OAuth App
3. Update the callback URL:
   - **Old**: `https://codeanalyst-production.up.railway.app/api/auth/github/callback`
   - **New**: Keep the same (backend URL doesn't change)
   - **BUT** also update `GITHUB_CALLBACK_URL` in Railway to match
4. The redirect after auth will use the `FRONTEND_URL` variable

### 4. 📝 Update Backend CORS Configuration

The current CORS config allows ALL origins (`origin: true`). For production, you should:

**Option A: Keep it open for demo (current state)**
```javascript
app.use(cors({ origin: true, credentials: true }))
```

**Option B: Lock down to specific domains (recommended for production)**
```javascript
const allowedOrigins = [
  'https://app.beenex.dev',
  'https://codeanalyst.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));
```

### 5. 🌐 Update Vercel Environment Variables (Frontend)

In Vercel project settings, update:

```bash
VITE_API_URL=https://codeanalyst-production.up.railway.app/api
VITE_FRONTEND_URL=https://app.beenex.dev
```

**How to update:**
1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add/update `VITE_FRONTEND_URL`
5. Redeploy

### 6. ✅ Testing Checklist

After all changes:

- [ ] Navigate to `https://app.beenex.dev`
- [ ] Click "Login with GitHub"
- [ ] Complete OAuth flow
- [ ] **Verify**: After login, URL should be `https://app.beenex.dev/dashboard` (NOT `codeanalyst.vercel.app`)
- [ ] Test all modules (Code Analyst, Website Analyst, etc.)
- [ ] Verify API calls work correctly

## Quick Summary

**What you need to do MANUALLY:**

1. **Vercel Dashboard**: Add `app.beenex.dev` as custom domain
2. **DNS Provider**: Add CNAME record pointing to Vercel
3. **Railway Dashboard**: Update `FRONTEND_URL` to `https://app.beenex.dev`
4. **Wait**: 5-30 minutes for DNS propagation
5. **Test**: Visit `app.beenex.dev` and test login flow

## Current State

- ✅ Backend CORS is wide open (allows all origins)
- ✅ Backend uses `FRONTEND_URL` for OAuth redirects
- ⏳ Need to set `FRONTEND_URL` in Railway to `https://app.beenex.dev`
- ⏳ Need to add domain in Vercel

## Files that Handle Redirects

- `backend/src/routes/auth.js` (line 122-123) - Uses `process.env.FRONTEND_URL`
- `backend/src/index.js` (line 54) - CORS configuration
- `src/stores/authStore.ts` - Frontend auth handling

No code changes needed! Just environment variable updates.

