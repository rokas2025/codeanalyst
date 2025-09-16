# Vercel Deployment Setup with Ngrok Backend

## Step 1: Prepare Your Backend with Ngrok

1. **Start your backend server locally:**
   ```bash
   cd backend
   npm start
   ```

2. **Start ngrok to expose your backend:**
   ```bash
   # Install ngrok if you haven't: https://ngrok.com/download
   ngrok http 3002
   ```

3. **Note your ngrok URL** (e.g., `https://abc123.ngrok-free.app`)

## Step 2: Configure Environment Variables

### Backend Environment Variables (if not already set):
```bash
# In backend/.env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=https://your-ngrok-url.ngrok-free.app/api/auth/github/callback
FRONTEND_URL=https://your-vercel-app.vercel.app
JWT_SECRET=your_jwt_secret
DATABASE_URL=your_database_url
```

### Frontend Environment Variables for Vercel:
Set these in your Vercel dashboard or use the CLI:

```bash
VITE_API_URL=https://your-ngrok-url.ngrok-free.app/api
```

## Step 3: Deploy to Vercel

### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add VITE_API_URL
# Enter: https://your-ngrok-url.ngrok-free.app/api
```

### Option B: Using GitHub Integration
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

## Step 4: GitHub OAuth Configuration

### GitHub OAuth App Settings:
- **Homepage URL:** `https://your-vercel-app.vercel.app`
- **Authorization callback URL:** `https://your-ngrok-url.ngrok-free.app/api/auth/github/callback`

## Step 5: Update Backend Allowed Origins

Update your backend CORS configuration to allow your Vercel domain:

```javascript
// In your backend CORS config
const allowedOrigins = [
  'http://localhost:3000',
  'https://your-vercel-app.vercel.app'
]
```

## Important Notes:

1. **Ngrok URLs change** when you restart ngrok (unless you have a paid plan)
2. **Update environment variables** in Vercel when your ngrok URL changes
3. **GitHub OAuth will work with any GitHub account** - not restricted to yours
4. **Database should be hosted** (not local) for production use

## Troubleshooting:

- If build fails, check that all environment variables are set
- If GitHub OAuth fails, verify callback URLs match exactly
- If API calls fail, check CORS settings and ngrok URL 