# 🔧 Environment Variables Setup Instructions

## 📝 **Add to `backend/.env`**

Add this line to your `backend/.env` file:

```env
# Google PageSpeed Insights API
GOOGLE_PAGESPEED_API_KEY=AIzaSyBP7XWIDLCNGNcIGpDWaHim4BlDWKLMXkA
```

## ☁️ **Railway Environment Variables**

Add this environment variable in Railway dashboard:

1. Go to: https://railway.app/project/your-project
2. Select your backend service
3. Go to "Variables" tab
4. Click "New Variable"
5. Add:
   ```
   Name: GOOGLE_PAGESPEED_API_KEY
   Value: AIzaSyBP7XWIDLCNGNcIGpDWaHim4BlDWKLMXkA
   ```

## 🌐 **Vercel Environment Variables**

Vercel doesn't need this API key because:
- The frontend calls the backend API
- The backend makes all external API calls
- Only Railway backend needs the API keys

**No changes needed for Vercel!**

---

## ✅ **APIs That DON'T Need Keys**

These are 100% FREE and work without API keys:
- ✅ **Mozilla Observatory** - No key needed!
- ✅ **SSL Labs** - No key needed!
- ✅ **Readability Scores** - No key needed (NPM package)!
- ✅ **Yoast SEO** - No key needed (NPM package)!

---

## 🔑 **Complete .env File**

Your `backend/.env` should look like this:

```env
# Server Settings
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://codeanalyst.vercel.app

# Database (Supabase)
DATABASE_URL=your_supabase_connection_string

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d

# AI APIs
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_API_KEY=your-google-ai-key

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# NEW: Analysis APIs
GOOGLE_PAGESPEED_API_KEY=AIzaSyBP7XWIDLCNGNcIGpDWaHim4BlDWKLMXkA
```

---

## 🚀 **After Adding the API Key**

1. **Restart your backend** (if running locally):
   ```bash
   cd backend
   npm start
   ```

2. **Redeploy Railway backend**:
   - Railway will auto-deploy when you push to Git
   - OR manually redeploy from Railway dashboard

3. **Test the new endpoints**:
   ```bash
   # Test PageSpeed API
   curl -X POST https://codeanalyst-production.up.railway.app/api/url-analysis/pagespeed \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"url": "https://example.com", "strategy": "mobile"}'
   
   # Test Readability
   curl -X POST https://codeanalyst-production.up.railway.app/api/content-analysis/readability \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"text": "This is a sample text to analyze for readability metrics."}'
   
   # Test Security Headers
   curl -X POST https://codeanalyst-production.up.railway.app/api/url-analysis/security \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"url": "https://example.com"}'
   ```

---

## ❓ **FAQ**

### Q: Where do I add the API key?
**A**: Add it to `backend/.env` file AND Railway environment variables.

### Q: Do I need to add it to Vercel?
**A**: No! Only the backend needs API keys.

### Q: What if I don't have a `.env` file?
**A**: Copy `backend/env.example` to `backend/.env` and add the keys.

### Q: How do I verify it's working?
**A**: Check Railway logs after deployment. You should see no errors about missing API keys.

---

## 🎉 **You're All Set!**

After adding the environment variable:
- ✅ Google PageSpeed Insights will work
- ✅ Mozilla Observatory will work (no key needed)
- ✅ SSL Labs will work (no key needed)
- ✅ Readability analysis will work (no key needed)
- ✅ Yoast SEO analysis will work (no key needed)

All FREE tools are now ready to use! 🚀

