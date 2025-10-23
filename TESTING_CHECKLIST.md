# 🧪 Testing Checklist - Step by Step

## Test 1: Authentication System ✅

### A. Email/Password Registration
**URL**: https://app.beenex.dev/register

**Steps**:
1. ✅ Page loads without errors
2. Enter test data:
   - Name: `Test User`
   - Email: `test@example.com` (use your real email)
   - Password: `TestPassword123!`
3. Click "Sign up"

**Expected Results**:
- ✅ Account created successfully
- ✅ Automatically logged in
- ✅ Redirected to dashboard
- ✅ No errors in browser console (F12)

**Status**: ⏳ Waiting for your test

---

### B. Email/Password Login
**URL**: https://app.beenex.dev/login

**Steps**:
1. Log out from dashboard
2. Go to login page
3. Enter credentials from registration
4. Click "Sign in"

**Expected Results**:
- ✅ Successfully logged in
- ✅ Redirected to dashboard
- ✅ Session persists (30 days)

**Status**: ⏳ Waiting for test

---

### C. GitHub OAuth (Existing)
**URL**: https://app.beenex.dev/login

**Steps**:
1. Click "Continue with GitHub"
2. Authorize if needed
3. Should redirect back

**Expected Results**:
- ✅ GitHub login still works
- ✅ No conflicts with new auth

**Status**: ⏳ Waiting for test

---

### D. Google OAuth (Optional)
**URL**: https://app.beenex.dev/login

**Steps**:
1. Click "Continue with Google"
2. Select Google account
3. Authorize

**Expected Results**:
- ✅ Google login works (if Supabase configured)
- ⚠️ Shows error if not configured (expected)

**Status**: ⏳ Waiting for test

---

## Test 2: Bug Fixes Verification ✅

### A. Analysis History - No [Object object]
**URL**: https://app.beenex.dev/dashboard

**Steps**:
1. Go to Analysis History
2. Look at website descriptions/tags
3. Check for `[Object object]` text

**Expected Results**:
- ✅ All text displays properly
- ✅ No `[Object object]` anywhere
- ✅ Tags show as readable text

**Status**: ⏳ Waiting for test

---

### B. Technology Version Detection
**URL**: Run a website analysis

**Steps**:
1. Analyze a website (e.g., `https://prestashop.com`)
2. Check "Technology Stack" section
3. Look at version numbers

**Expected Results**:
- ✅ Versions show correctly (e.g., "v8.1.0")
- ✅ No weird versions like "v6497"
- ✅ "Unknown" if version can't be detected

**Status**: ⏳ Waiting for test

---

### C. Technical Data Developer View
**URL**: Website analysis results

**Steps**:
1. Complete a website analysis
2. Go to "Technical Data" tab
3. Enable "Developer View"

**Expected Results**:
- ✅ JSON data displays properly
- ✅ No empty fields
- ✅ Properly formatted

**Status**: ⏳ Waiting for test

---

## Test 3: Language Detection ✅

### A. Lithuanian Website Analysis
**Test URL**: Analyze a Lithuanian website (e.g., `https://lrt.lt`)

**Steps**:
1. Go to Content Analyst module
2. Enter a Lithuanian website URL
3. Run analysis

**Expected Results**:
- ✅ Detects language as "Lithuanian (LT)"
- ✅ UI labels show in Lithuanian
- ✅ Analysis results in Lithuanian
- ✅ SEO factors in Lithuanian

**Status**: ⏳ Waiting for test

---

### B. English Website Analysis
**Test URL**: Analyze an English website (e.g., `https://example.com`)

**Steps**:
1. Go to Content Analyst module
2. Enter an English website URL
3. Run analysis

**Expected Results**:
- ✅ Detects language as "English (EN)"
- ✅ UI labels show in English
- ✅ Analysis results in English
- ✅ SEO factors in English

**Status**: ⏳ Waiting for test

---

## Test 4: Content Creator Language Selector ✅

**URL**: https://app.beenex.dev/modules/content-creator

**Steps**:
1. Go to Content Creator
2. Find language selector (top right)
3. Try changing languages: EN → LT → ES → FR → DE

**Expected Results**:
- ✅ Language selector visible
- ✅ Can switch between languages
- ✅ Templates update to selected language
- ✅ Preference saved (persists on refresh)

**Status**: ⏳ Waiting for test

---

## Test 5: WordPress Integration (Backend) ✅

### A. Check WordPress Routes
**Test with curl or Postman**:

```bash
# Check if endpoints exist
curl https://codeanalyst-production.up.railway.app/api/wordpress/connections
```

**Expected Results**:
- ✅ Endpoint responds (may need auth)
- ✅ No 404 errors
- ✅ Proper error messages if not authenticated

**Status**: ⏳ Waiting for test

---

### B. Database Tables Created
**Check in Supabase Dashboard**:

**Steps**:
1. Go to Supabase → Table Editor
2. Look for new tables:
   - `wordpress_files`
   - `wordpress_pages`
3. Check `url_analysis` has `detected_language` column

**Expected Results**:
- ✅ All tables exist
- ✅ Proper schema structure
- ✅ No migration errors

**Status**: ⏳ Waiting for test

---

## Test 6: Scoring Improvements ✅

### A. AdoreIno Score (Code Analysis)
**Test**: Analyze a GitHub repository

**Steps**:
1. Go to Code Analyst module
2. Enter a GitHub repo URL
3. Check the "Overall Score"

**Expected Results**:
- ✅ Score is dynamic (not always 75)
- ✅ Score reflects actual code quality
- ✅ Breakdown shows specific metrics

**Status**: ⏳ Waiting for test

---

### B. SEO Score
**Test**: Run website analysis

**Steps**:
1. Analyze any website
2. Check SEO score in results

**Expected Results**:
- ✅ Score is realistic (not hardcoded)
- ✅ Varies based on actual SEO factors
- ✅ Detailed breakdown provided

**Status**: ⏳ Waiting for test

---

## Test 7: Session Persistence ✅

**Steps**:
1. Log in to the dashboard
2. Close browser completely
3. Open browser again
4. Go to https://app.beenex.dev

**Expected Results**:
- ✅ Still logged in (no re-login needed)
- ✅ Session lasts 30 days
- ✅ No timeout after 30 seconds

**Status**: ⏳ Waiting for test

---

## Test 8: Error Handling ✅

### A. Invalid Login
**Steps**:
1. Try logging in with wrong password
2. Try logging in with non-existent email

**Expected Results**:
- ✅ Shows friendly error message
- ✅ Doesn't crash
- ✅ Can try again

**Status**: ⏳ Waiting for test

---

### B. Invalid Analysis Input
**Steps**:
1. Try analyzing an invalid URL
2. Try analyzing with empty input

**Expected Results**:
- ✅ Shows validation error
- ✅ Doesn't crash
- ✅ Clear error message

**Status**: ⏳ Waiting for test

---

## 📊 Testing Summary

### Quick Test Status
- [ ] Authentication (4 tests)
- [ ] Bug Fixes (3 tests)
- [ ] Language Detection (2 tests)
- [ ] Content Creator (1 test)
- [ ] WordPress Backend (2 tests)
- [ ] Scoring (2 tests)
- [ ] Session Persistence (1 test)
- [ ] Error Handling (2 tests)

**Total**: 17 tests

---

## 🐛 Issue Reporting Template

If you find any issues, report them like this:

```
**Test**: [Test name]
**Issue**: [What went wrong]
**Expected**: [What should happen]
**Actual**: [What actually happened]
**Steps**: [How to reproduce]
**Browser**: [Chrome/Firefox/Safari]
**Screenshot**: [If applicable]
```

---

## ✅ When All Tests Pass

Once all tests pass, we'll move on to:
1. Building WordPress frontend UI
2. Completing Content Creator workflow
3. Adding final polish

---

**Ready to start testing!** 🚀

**Begin with Test 1A**: Try registering at https://app.beenex.dev/register

