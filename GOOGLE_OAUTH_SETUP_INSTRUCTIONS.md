# Google OAuth Setup Instructions

This guide will walk you through setting up Google OAuth authentication for the CodeAnalyst application.

## Prerequisites

- Access to Google Cloud Console
- Access to Supabase Dashboard
- Admin access to your Supabase project

---

## Part 1: Google Cloud Console Setup

### Step 1: Create/Select a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Sign in with your Google account
3. Either:
   - **Create a new project**: Click "Select a project" → "New Project" → Enter project name → "Create"
   - **Select existing project**: Click "Select a project" → Choose your project

### Step 2: Enable Google+ API (Optional but Recommended)

1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and press **"Enable"**
4. Wait for the API to be enabled

### Step 3: Configure OAuth Consent Screen

1. In the left sidebar, go to **APIs & Services** → **OAuth consent screen**
2. Select **User Type**:
   - Choose **"External"** (for public access)
   - Click **"Create"**
3. Fill in **App Information**:
   - **App name**: CodeAnalyst (or your app name)
   - **User support email**: Your email address
   - **App logo**: (Optional) Upload your logo
4. Fill in **Developer contact information**:
   - **Email addresses**: Your email address
5. Click **"Save and Continue"**
6. **Scopes** (Step 2):
   - Click **"Add or Remove Scopes"**
   - Select these scopes:
     - `userinfo.email`
     - `userinfo.profile`
     - `openid`
   - Click **"Update"** → **"Save and Continue"**
7. **Test users** (Step 3):
   - Add test users if in testing mode (optional)
   - Click **"Save and Continue"**
8. **Summary** (Step 4):
   - Review your settings
   - Click **"Back to Dashboard"**

### Step 4: Create OAuth 2.0 Credentials

1. In the left sidebar, go to **APIs & Services** → **Credentials**
2. Click **"+ Create Credentials"** at the top
3. Select **"OAuth 2.0 Client ID"**
4. If prompted, configure the consent screen (you may have already done this)
5. **Application type**: Select **"Web application"**
6. **Name**: Enter a name (e.g., "CodeAnalyst Web Client")
7. **Authorized JavaScript origins**:
   - Click **"+ Add URI"**
   - Add: `https://ecwpwmsqanlatfntzoul.supabase.co`
8. **Authorized redirect URIs**:
   - Click **"+ Add URI"**
   - Add: `https://ecwpwmsqanlatfntzoul.supabase.co/auth/v1/callback`
9. Click **"Create"**
10. **IMPORTANT**: A dialog will appear with your credentials:
    - **Client ID**: Copy this (looks like: `123456789-abc123.apps.googleusercontent.com`)
    - **Client Secret**: Copy this (looks like: `GOCSPX-abc123xyz789`)
    - Click **"OK"**

> 💡 **Tip**: You can always view these credentials later by clicking on the OAuth 2.0 Client ID name in the Credentials page.

---

## Part 2: Supabase Dashboard Setup

### Step 1: Access Supabase Authentication Settings

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **ecwpwmsqanlatfntzoul**
3. In the left sidebar, click **Authentication** (shield icon)
4. Click **Providers** tab

### Step 2: Enable Google Provider

1. Scroll down to find **Google** in the provider list
2. Click on **Google** to expand the settings
3. Toggle **"Enable Sign in with Google"** to **ON**

### Step 3: Configure Google OAuth

1. **Client ID (for OAuth)**:
   - Paste the **Client ID** you copied from Google Cloud Console
   - Example: `123456789-abc123.apps.googleusercontent.com`

2. **Client Secret (for OAuth)**:
   - Paste the **Client Secret** you copied from Google Cloud Console
   - Example: `GOCSPX-abc123xyz789`

3. **Authorized Client IDs** (Optional):
   - Leave empty unless you have specific requirements

4. Click **"Save"** at the bottom

### Step 4: Verify Redirect URL

1. In the same Google provider settings, you'll see:
   - **Redirect URL**: `https://ecwpwmsqanlatfntzoul.supabase.co/auth/v1/callback`
2. Verify this matches what you entered in Google Cloud Console
3. If not, go back to Google Cloud Console and update the redirect URI

---

## Part 3: Test Google OAuth

### Step 1: Test Login Flow

1. Go to your CodeAnalyst application: [https://codeanalyst.vercel.app](https://codeanalyst.vercel.app)
2. Click **"Continue with Google"** button
3. You should be redirected to Google's consent screen
4. Select your Google account
5. Review the permissions requested
6. Click **"Allow"** or **"Continue"**
7. You should be redirected back to CodeAnalyst and logged in

### Step 2: Verify User Creation

1. After successful login, check your Supabase database:
   - Go to **Supabase Dashboard** → **Table Editor** → **users** table
   - You should see a new user with:
     - `auth_provider`: `supabase`
     - `email`: Your Google email
     - `is_active`: `false`
     - `pending_approval`: `true`

2. As a superadmin, approve the user:
   - Go to **User Management** in CodeAnalyst
   - Find the new user
   - Click **"Activate"**

### Step 3: Verify Role Assignment

1. After activation, the user should have:
   - `role`: `admin` (in `user_roles` table)
   - `is_active`: `true`
   - `pending_approval`: `false`

2. Log out and log in again with Google
3. You should now see the admin navigation (My Projects, etc.)

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Problem**: The redirect URI in Google Cloud Console doesn't match Supabase's redirect URL.

**Solution**:
1. Go to Google Cloud Console → Credentials
2. Click on your OAuth 2.0 Client ID
3. Under "Authorized redirect URIs", ensure you have:
   ```
   https://ecwpwmsqanlatfntzoul.supabase.co/auth/v1/callback
   ```
4. Save changes and try again

### Error: "Access blocked: This app's request is invalid"

**Problem**: OAuth consent screen is not properly configured.

**Solution**:
1. Go to Google Cloud Console → OAuth consent screen
2. Ensure the app is published or you're added as a test user
3. Verify all required fields are filled in
4. Try again

### Error: "Account is pending approval"

**Problem**: New Google OAuth users need superadmin approval.

**Solution**:
1. Log in as superadmin (`rokas@zubas.lt` or `rokas2025` GitHub)
2. Go to **User Management**
3. Find the pending user
4. Click **"Activate"**
5. User can now log in

### Google Login Button Does Nothing

**Problem**: Supabase environment variables not set in Vercel.

**Solution**:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify these are set:
   - `VITE_SUPABASE_URL`: `https://ecwpwmsqanlatfntzoul.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: (Your anon key)
3. Redeploy the frontend

### Users Can't See Admin Features After Login

**Problem**: Role not included in JWT or not assigned.

**Solution**:
1. Check backend logs for role assignment
2. Verify `user_roles` table has entry for the user
3. Log out and log in again to get fresh JWT with role

---

## Security Best Practices

1. **Keep Client Secret Secure**:
   - Never commit Client Secret to Git
   - Store only in Supabase Dashboard
   - Rotate periodically

2. **Review OAuth Scopes**:
   - Only request necessary scopes (email, profile)
   - Don't request excessive permissions

3. **Monitor OAuth Usage**:
   - Check Google Cloud Console → APIs & Services → Dashboard
   - Monitor for unusual activity

4. **Production Checklist**:
   - [ ] OAuth consent screen published
   - [ ] Correct redirect URIs configured
   - [ ] Client ID and Secret stored securely
   - [ ] Test login flow works
   - [ ] User approval workflow tested
   - [ ] Role assignment verified

---

## Environment Variables Reference

### Supabase Dashboard (Already Configured)
- Google Client ID: (Set in Authentication → Providers → Google)
- Google Client Secret: (Set in Authentication → Providers → Google)

### Vercel Frontend (Should Already Be Set)
```bash
VITE_SUPABASE_URL=https://ecwpwmsqanlatfntzoul.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_API_URL=<your-backend-url>
VITE_FRONTEND_URL=https://codeanalyst.vercel.app
```

### Railway Backend (Should Already Be Set)
```bash
SUPABASE_URL=https://ecwpwmsqanlatfntzoul.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
FRONTEND_URL=https://codeanalyst.vercel.app
JWT_SECRET=<your-jwt-secret>
```

---

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Google OAuth Guide](https://supabase.com/docs/guides/auth/social-login/auth-google)

---

## Support

If you encounter issues not covered in this guide:

1. Check browser console for errors
2. Check backend logs in Railway
3. Check Supabase logs in Dashboard → Logs
4. Contact support with:
   - Error message
   - Steps to reproduce
   - Browser and OS version

---

**Last Updated**: 2025-01-30
**Version**: 1.0

