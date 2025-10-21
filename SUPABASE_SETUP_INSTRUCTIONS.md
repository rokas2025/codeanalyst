# ✅ Supabase Auth Setup - Step by Step

The code is deployed and ready! Now we just need to configure Supabase Auth.

## Step 1: Create Supabase Project

1. Go to **https://supabase.com/dashboard**
2. Sign in or create a free account
3. Click **"New Project"**
4. Fill in:
   - **Name**: CodeAnalyst
   - **Database Password**: (generate a strong password - save it!)
   - **Region**: Choose closest to you (e.g., Frankfurt for Europe)
5. Click **"Create new project"**
6. Wait ~2 minutes for setup to complete

## Step 2: Get Supabase Credentials

Once your project is ready:

1. Go to **Settings** (gear icon in sidebar) → **API**
2. You'll see 3 important values:

   ```
   Project URL:        https://xxxxxxxxxxxxx.supabase.co
   anon public:        eyJhbGciOiJIUzI1N...  (long string)
   service_role:       eyJhbGciOiJIUzI1N...  (different long string)
   ```

3. **Copy these three values** - you'll need them next

## Step 3: Configure Railway (Backend)

1. Go to **https://railway.app/dashboard**
2. Select your **CodeAnalyst** project
3. Click on your backend service
4. Go to **Variables** tab
5. Add these two variables:

   ```
   SUPABASE_URL = https://xxxxxxxxxxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1N... (service_role key)
   ```

6. Railway will automatically redeploy

## Step 4: Configure Vercel (Frontend)

1. Go to **https://vercel.com/dashboard**
2. Select your **CodeAnalyst** project
3. Go to **Settings** → **Environment Variables**
4. Add these two variables (for Production):

   ```
   VITE_SUPABASE_URL = https://xxxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1N... (anon key)
   ```

5. Click **Save**
6. Go to **Deployments** → click the 3 dots on latest deployment → **Redeploy**

## Step 5: Configure Supabase Auth Providers

Back in Supabase Dashboard:

### Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Find **Email** in the list
3. Click to expand
4. Toggle **"Enable Email provider"** to ON
5. **Confirm email**: Toggle to **OFF** (for faster testing, enable later for production)
6. Click **Save**

### Configure Site URLs

1. Go to **Authentication** → **URL Configuration**
2. Set:
   - **Site URL**: `https://app.beenex.dev`
   - **Redirect URLs**: Click "Add URL" and add: `https://app.beenex.dev/auth/callback`
3. Click **Save**

### (Optional) Enable Google OAuth

Only if you want Google sign-in:

1. **Authentication** → **Providers** → **Google**
2. You'll need to:
   - Create a Google Cloud Console project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add callback URL: `https://xxxxxxxxxxxxx.supabase.co/auth/v1/callback`
3. Enter Client ID and Client Secret in Supabase
4. Click **Save**

## Step 6: Test Everything!

1. Wait ~2-3 minutes for deployments to finish
2. Open https://app.beenex.dev/register in incognito mode
3. Try to create an account with email/password
4. You should be logged in automatically!
5. Try logging out and logging back in
6. Try the "Forgot password" flow (if you enabled email confirmation)

## ✅ Success Checklist

- [ ] Supabase project created
- [ ] Railway environment variables set (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
- [ ] Vercel environment variables set (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
- [ ] Email provider enabled in Supabase
- [ ] Site URLs configured in Supabase
- [ ] Both Railway and Vercel redeployed
- [ ] Registration works
- [ ] Login works
- [ ] GitHub OAuth still works

## 🐛 Troubleshooting

### "Authentication service is not configured"
- Check that environment variables are set in Railway/Vercel
- Make sure deployments finished
- Check Railway logs for Supabase connection

### "Email not confirmed"
- Make sure "Confirm email" is set to OFF in Supabase Email provider settings
- Or check your email inbox for confirmation link

### Registration hangs/stuck
- Check browser console for errors (F12)
- Check Railway logs for backend errors
- Make sure SUPABASE_URL and keys are correct (no extra spaces)

### Google login doesn't work
- Did you enable Google provider in Supabase?
- Did you set up Google Cloud Console credentials?
- Are the redirect URLs correct?

## 📞 Need Help?

If something doesn't work:

1. Check Railway logs: `railway logs`
2. Check Vercel logs in dashboard
3. Check browser console (F12)
4. Verify all environment variables are correct
5. Make sure both services redeployed after adding variables

## 🎉 What You'll Have

Once complete:

✅ **Email/Password Registration** - Users can create accounts with email  
✅ **Email/Password Login** - Secure authentication with Supabase  
✅ **Google OAuth** - (Optional) One-click sign-in with Google  
✅ **GitHub OAuth** - Still works perfectly (existing feature)  
✅ **Password Reset** - Built-in from Supabase  
✅ **Email Verification** - Can be enabled anytime  
✅ **Enterprise Security** - Supabase handles all the hard stuff  

---

**Current Status**: ✅ Code deployed, waiting for Supabase configuration

**Time to complete**: ~10 minutes

**Cost**: FREE (Supabase free tier is generous!)

