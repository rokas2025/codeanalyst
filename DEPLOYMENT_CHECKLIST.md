# Deployment Checklist - WordPress Upload & Bug Fixes

## 📋 Pre-Deployment Steps

### 1. Install Required NPM Packages
```bash
cd backend
npm install adm-zip fast-xml-parser multer
```

**Package Verification:**
- [ ] `adm-zip` installed (for ZIP file parsing)
- [ ] `fast-xml-parser` installed (for WordPress XML parsing)
- [ ] `multer` installed (for file uploads)

### 2. Verify Environment Variables
No new environment variables are required. Verify existing ones:
- [ ] `JWT_SECRET` is set
- [ ] `DATABASE_URL` is configured
- [ ] `FRONTEND_URL` is correct

### 3. Database Migrations
Migrations will run automatically on server startup. Verify these tables are created:
- [ ] `wordpress_connections` (should already exist)
- [ ] `wordpress_files` (new)
- [ ] `wordpress_elementor_pages` (new)
- [ ] `url_analysis.detected_language` column (new)

---

## 🚀 Deployment Steps

### Backend Deployment

1. **Commit Changes:**
```bash
git add .
git commit -m "feat: WordPress upload, language detection, and bug fixes

- Fix authentication timeout (30-day JWT expiration)
- Fix [Object object] display in analysis history
- Fix technology version detection
- Fix empty technical data view
- Implement website language detection (LT/EN)
- Implement WordPress ZIP upload backend
- Implement Elementor data extraction
- Implement WordPress upload frontend UI"
```

2. **Push to Repository:**
```bash
git push origin main
```

3. **Deploy to Railway:**
   - Railway will automatically detect the push
   - Monitor deployment logs for migration success
   - Look for these log messages:
     - ✅ WordPress files table created successfully!
     - ✅ WordPress Elementor pages table created successfully!
     - ✅ Language column added successfully!

4. **Verify Backend:**
   - [ ] Server starts without errors
   - [ ] Database migrations complete
   - [ ] All API endpoints respond

### Frontend Deployment

1. **Build Frontend:**
```bash
npm run build
```

2. **Deploy to Vercel:**
   - Vercel will automatically deploy from main branch
   - Or manually trigger deployment

3. **Verify Frontend:**
   - [ ] Application loads
   - [ ] No console errors
   - [ ] All pages render correctly

---

## ✅ Post-Deployment Testing

### Authentication Testing
- [ ] Login with email/password
- [ ] Verify session persists for 30 days (check JWT expiration)
- [ ] Login with GitHub OAuth
- [ ] Verify no premature logouts

### Display Fixes Testing
- [ ] Go to Projects page
- [ ] Check analysis history - verify no [Object object] tags
- [ ] Open website analysis
- [ ] Check Technical Data Developer View - verify JSON is displayed
- [ ] Check technology versions - verify correct format (not v6497)

### Language Detection Testing
- [ ] Analyze a Lithuanian website
- [ ] Verify language is detected as "lt"
- [ ] Use Content Analyst on Lithuanian content
- [ ] Verify response is in Lithuanian
- [ ] Analyze an English website
- [ ] Verify language is detected as "en"
- [ ] Use Content Analyst on English content
- [ ] Verify response is in English

### WordPress Upload Testing
- [ ] Go to Settings → WordPress Integration
- [ ] Generate API key
- [ ] Install WordPress plugin on test site
- [ ] Connect WordPress site
- [ ] Go to Connected Sites page
- [ ] Verify site appears in list
- [ ] Prepare WordPress ZIP:
  - [ ] Include theme folder
  - [ ] Include WordPress XML export
  - [ ] ZIP file is under 100MB
- [ ] Click "Upload WordPress ZIP"
- [ ] Select prepared ZIP file
- [ ] Verify upload progress bar appears
- [ ] Verify upload completes successfully
- [ ] Click "View Uploaded Files"
- [ ] Verify theme files are listed
- [ ] Verify Elementor pages are listed (if any)
- [ ] Check file counts match upload summary

---

## 🐛 Known Issues & Limitations

### WordPress Upload
1. **File Size Limit:** 100MB maximum
2. **Supported Formats:** Only ZIP files
3. **Large Files Skipped:** Individual files > 5MB are skipped
4. **Elementor Detection:** Requires XML export or SQL dump with `wp_postmeta` table

### Language Detection
1. **Supported Languages:** Only Lithuanian (lt) and English (en)
2. **Fallback:** Defaults to English if detection fails
3. **Confidence Threshold:** 60% minimum for language determination

### Technology Version Detection
1. **Validation:** Only accepts X.Y or X.Y.Z format
2. **Fallback:** Returns null if version can't be determined

---

## 📊 Monitoring

### Metrics to Watch
- [ ] JWT token expiration errors (should decrease)
- [ ] WordPress ZIP upload success rate
- [ ] Language detection accuracy
- [ ] Technology version detection accuracy
- [ ] API response times for new endpoints

### Logs to Monitor
```bash
# Backend logs
✅ WordPress files table created successfully
✅ WordPress Elementor pages table created successfully
✅ Language column added successfully
📦 WordPress ZIP upload initiated
📦 Processing ZIP file
✅ Stored X files successfully
✅ Stored X Elementor pages successfully
🔍 Extracting Elementor data from XML export
Language detected from HTML lang attribute: lt
```

---

## 🔄 Rollback Plan

If issues occur after deployment:

### Quick Rollback
```bash
git revert HEAD
git push origin main
```

### Database Rollback (if needed)
```sql
-- Remove new tables if they cause issues
DROP TABLE IF EXISTS wordpress_elementor_pages;
DROP TABLE IF EXISTS wordpress_files;

-- Remove language column if it causes issues
ALTER TABLE url_analysis DROP COLUMN IF EXISTS detected_language;
```

---

## 📞 Support

### If You Encounter Issues

1. **Check Backend Logs:**
   - Railway dashboard → Your service → Logs
   - Look for error messages

2. **Check Frontend Console:**
   - Browser DevTools → Console
   - Look for JavaScript errors

3. **Database Issues:**
   - Verify migrations ran successfully
   - Check table structures match schema

4. **File Upload Issues:**
   - Verify multer is installed
   - Check file size limits
   - Verify ZIP file structure

---

## ✨ Success Criteria

Deployment is successful when:
- [x] All 8 tasks completed
- [ ] Backend deploys without errors
- [ ] Frontend deploys without errors
- [ ] Database migrations complete
- [ ] All tests pass
- [ ] No critical errors in logs
- [ ] Users can upload WordPress ZIPs
- [ ] Language detection works
- [ ] Authentication timeout fixed
- [ ] Display bugs fixed

---

**Deployment Date:** _____________
**Deployed By:** _____________
**Backend Version:** _____________
**Frontend Version:** _____________
**Status:** ⏳ Pending / ✅ Success / ❌ Failed

---

## 📝 Notes

Add any deployment notes, issues encountered, or special configurations here:

_____________________________________________
_____________________________________________
_____________________________________________

