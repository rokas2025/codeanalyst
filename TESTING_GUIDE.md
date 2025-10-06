# 🧪 Testing Guide - CodeAnalyst Application

## 🌐 **Frontend URLs**

### **Primary URL** (Recommended):
```
https://codeanalyst.vercel.app
```

### **Alternative URL**:
```
https://analyst-psi.vercel.app
```

### **Backend API**:
```
https://codeanalyst-production.up.railway.app/api
```

---

## 📋 **5 Main Modules to Test**

### **Module 1: AI Code Analyst** 🔵
**Route**: `/modules/code-analyst`  
**Purpose**: Analyze website source code and get AI-powered improvement suggestions

### **Module 2: AI Website Analyst** 🔷
**Route**: `/modules/website-analyst`  
**Purpose**: Comprehensive website performance, SEO, and accessibility analysis

### **Module 3: AI Content Analyst** 🟢
**Route**: `/modules/content-analyst`  
**Purpose**: Analyze content for grammar, readability, and SEO optimization

### **Module 4: AI Auto Programmer** 🟣
**Route**: `/modules/auto-programmer`  
**Purpose**: Chat-based feature requests and automatic code generation

### **Module 5: AI Content Creator** 🟠
**Route**: `/modules/content-creator`  
**Purpose**: Generate new content with SEO optimization and multilingual support

---

## 🧪 **Detailed Testing Instructions**

### **STEP 0: Login First** 🔐

1. **Go to**: `https://codeanalyst.vercel.app`
2. **Clear localStorage** (if needed):
   - Press `F12` (Developer Tools)
   - Console tab
   - Run: `localStorage.clear(); location.reload()`
3. **Click**: "Sign in with GitHub"
4. **Complete OAuth flow**
5. **Verify**: You see the Dashboard

✅ **Expected**: 
- Redirected to GitHub
- Redirected back with token
- See Dashboard with 5 module cards

---

## 📊 **MODULE 1: AI Code Analyst** 🔵

### **URL**:
```
https://codeanalyst.vercel.app/modules/code-analyst
```

### **Test Cases**:

#### **Test 1.1: GitHub Repository Analysis**
1. **Navigate to**: Code Analyst module
2. **Select**: "GitHub Repository"
3. **Enter repo**: `facebook/react` or your own repo
4. **Click**: "Analyze Repository"
5. **Wait**: For analysis to complete

✅ **Expected Results**:
- Shows loading spinner
- Progress indicator
- Analysis results with:
  - Code quality score
  - Language breakdown
  - Framework detection
  - Technical debt
  - AI recommendations

❌ **Possible Issues**:
- "Authentication token expired" → Re-login
- "GitHub rate limit" → Wait or use authenticated request
- Analysis timeout → Large repo, try smaller one

#### **Test 1.2: ZIP File Analysis**
1. **Navigate to**: Code Analyst module
2. **Select**: "Upload ZIP"
3. **Upload**: A small project ZIP file
4. **Click**: "Analyze Code"
5. **Wait**: For upload and analysis

✅ **Expected Results**:
- File upload progress
- Analysis processing
- Same analysis results as GitHub

---

## 🌐 **MODULE 2: AI Website Analyst** 🔷

### **URL**:
```
https://codeanalyst.vercel.app/modules/website-analyst
```

### **Test Cases**:

#### **Test 2.1: Public Website Analysis**
1. **Navigate to**: Website Analyst module
2. **Enter URL**: `https://example.com`
3. **Click**: "Start Analysis"
4. **Wait**: 30-60 seconds for complete analysis

✅ **Expected Results**:
- Loading progress bar
- Analysis results with:
  - Performance score (Lighthouse)
  - SEO score
  - Accessibility score
  - Security analysis
  - Meta tags
  - Technologies detected
  - AI insights
  - Business recommendations

❌ **Possible Issues**:
- "Invalid URL" → Check URL format
- "Website unreachable" → Try different site
- Slow analysis → Normal for first run (no cache)

#### **Test 2.2: Your Own Website**
1. **Enter your website URL**
2. **Analyze**
3. **Review recommendations**

✅ **Expected**: Detailed report with actionable insights

---

## 📝 **MODULE 3: AI Content Analyst** 🟢

### **URL**:
```
https://codeanalyst.vercel.app/modules/content-analyst
```

### **Test Cases**:

#### **Test 3.1: URL Content Analysis**
1. **Navigate to**: Content Analyst module
2. **Select**: "Analyze from URL"
3. **Enter URL**: Blog post or article URL
4. **Click**: "Analyze Content"

✅ **Expected Results**:
- Extracted content
- Grammar analysis
- Readability score
- SEO optimization tips
- Keyword suggestions
- Content improvements

#### **Test 3.2: Text Input Analysis**
1. **Select**: "Analyze Text"
2. **Paste text**: Sample article or blog post
3. **Click**: "Analyze"

✅ **Expected Results**:
- Real-time analysis
- Grammar corrections
- Style suggestions
- SEO recommendations

---

## 💬 **MODULE 4: AI Auto Programmer** 🟣

### **URL**:
```
https://codeanalyst.vercel.app/modules/auto-programmer
```

### **Test Cases**:

#### **Test 4.1: Chat with AI**
1. **Navigate to**: Auto Programmer module
2. **Type message**: "Create a React button component"
3. **Send**
4. **Wait for response**

✅ **Expected Results**:
- AI response with code
- Syntax highlighting
- Markdown formatting
- Clickable file links
- Code examples

#### **Test 4.2: Feature Request**
1. **Type**: "Add dark mode toggle to my app"
2. **Send**
3. **Review**: AI-generated plan and code

✅ **Expected Results**:
- Step-by-step implementation guide
- Code snippets
- File structure suggestions
- Installation instructions

❌ **Possible Issues**:
- "Authentication token expired" → **This was your issue!** Re-login
- Slow response → OpenAI API latency
- No response → Check backend logs

---

## ✨ **MODULE 5: AI Content Creator** 🟠

### **URL**:
```
https://codeanalyst.vercel.app/modules/content-creator
```

### **Test Cases**:

#### **Test 5.1: Generate "About Us" Page**
1. **Navigate to**: Content Creator module
2. **Select template**: "About Us Page"
3. **Fill in form**:
   - Company Name: "Test Company"
   - Industry: "Technology"
   - Founded Year: "2020"
   - Mission: "Making technology accessible"
   - Values: "Innovation, Quality, Customer Focus"
   - Team Size: "21-50 employees"
4. **Click**: "Next" → Settings
5. **Adjust settings** (optional):
   - Tone: Professional
   - Style: Detailed
   - Temperature: 0.7
6. **Click**: "Generate Content"
7. **Wait**: 10-30 seconds

✅ **Expected Results**:
- Loading animation
- Generated content with sections:
  - Hero Section
  - Company Story
  - Mission Statement
  - Core Values
  - Team Introduction
  - Call to Action
- Editable sections
- Word count
- Export options (HTML, Text, Markdown)

❌ **Possible Issues**:
- **"Authentication token expired"** → **YOUR ISSUE!** 
  - Solution: `localStorage.clear()` → Re-login
- "Failed to fetch templates" → Backend connection issue
- "No AI provider available" → OpenAI API key issue

#### **Test 5.2: Generate Product Description**
1. **Select template**: "Product Description"
2. **Fill details**:
   - Product Name: "Wireless Headphones"
   - Category: "Electronics"
   - Key Features: "Noise cancellation, 40h battery, Bluetooth 5.0"
   - Benefits: "Immersive audio experience"
   - Target Audience: "Music lovers"
   - Price Range: "Mid-range ($50-200)"
3. **Generate**

✅ **Expected**: Professional product description ready to use

#### **Test 5.3: Generate Blog Post**
1. **Select template**: "Blog Post"
2. **Fill details**:
   - Topic: "10 Tips for Remote Work Productivity"
   - Keywords: "remote work, productivity, work from home"
   - Audience: "Remote workers"
   - Length: "Medium (800-1500 words)"
   - Purpose: "Educate/Inform"
3. **Generate**

✅ **Expected**: SEO-optimized blog post with proper structure

---

## 🔍 **Testing Checklist**

### **Before Testing**
- [ ] Clear browser cache/localStorage
- [ ] Login with GitHub
- [ ] Verify token is valid (check browser console)
- [ ] Backend is running (check Railway)
- [ ] OpenAI API key is configured

### **Module 1: Code Analyst** 🔵
- [ ] GitHub repo analysis works
- [ ] ZIP file upload works
- [ ] Results display correctly
- [ ] AI recommendations appear

### **Module 2: Website Analyst** 🔷
- [ ] URL analysis works
- [ ] Lighthouse scores appear
- [ ] Technologies detected
- [ ] AI insights generated

### **Module 3: Content Analyst** 🟢
- [ ] URL content extraction works
- [ ] Text analysis works
- [ ] Grammar check appears
- [ ] SEO recommendations shown

### **Module 4: Auto Programmer** 🟣
- [ ] Chat interface works
- [ ] Messages send/receive
- [ ] Code highlighting works
- [ ] Markdown renders properly

### **Module 5: Content Creator** 🟠
- [ ] Templates load
- [ ] Form submission works
- [ ] Content generates successfully
- [ ] Export options work

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: "Authentication token expired"**
```
❌ Error: HTTP 401 - Authentication token expired
```

**Solution**:
```javascript
// Browser console (F12)
localStorage.clear()
location.href = '/login'
// Then login with GitHub again
```

### **Issue 2: "Failed to fetch templates"**
```
❌ Error fetching templates: Authentication token expired
```

**Root Cause**: JWT token expired (7 days)  
**Solution**: Same as Issue 1 - Re-login

### **Issue 3: Content generation fails**
```
❌ Error generating content: HTTP 401
```

**Check**:
1. Token is valid: See Issue 1
2. Backend is running: Check Railway
3. OpenAI API key: Check backend/.env

### **Issue 4: Slow page load**
**Normal**: First load might be slow  
**Check**: Network tab in DevTools (F12)

### **Issue 5: Blank screen after login**
**Solution**: Hard refresh (`Ctrl + Shift + R`)

---

## 📊 **Testing Priority Order**

### **Priority 1: Critical Flow** (Test First)
1. ✅ Login with GitHub
2. ✅ Dashboard loads
3. ✅ Navigate to any module

### **Priority 2: Module 5 - Content Creator** (Your Issue)
1. ✅ Templates load
2. ✅ Generate "About Us" page
3. ✅ Verify OpenAI integration works

### **Priority 3: Other Modules**
1. ✅ Code Analyst (GitHub repo)
2. ✅ Website Analyst (example.com)
3. ✅ Auto Programmer (chat)

---

## 📝 **Test Results Template**

Copy this and fill it out:

```
# Test Results - [Date]

## Environment
- URL: https://codeanalyst.vercel.app
- Browser: [Chrome/Firefox/Safari/Edge]
- User: [Your GitHub username]

## Module 1: Code Analyst 🔵
- GitHub Analysis: [ ] Pass [ ] Fail [ ] Not Tested
- ZIP Analysis: [ ] Pass [ ] Fail [ ] Not Tested
- Notes: _______________

## Module 2: Website Analyst 🔷
- URL Analysis: [ ] Pass [ ] Fail [ ] Not Tested
- Lighthouse Scores: [ ] Pass [ ] Fail [ ] Not Tested
- Notes: _______________

## Module 3: Content Analyst 🟢
- URL Content: [ ] Pass [ ] Fail [ ] Not Tested
- Text Analysis: [ ] Pass [ ] Fail [ ] Not Tested
- Notes: _______________

## Module 4: Auto Programmer 🟣
- Chat Interface: [ ] Pass [ ] Fail [ ] Not Tested
- Code Generation: [ ] Pass [ ] Fail [ ] Not Tested
- Notes: _______________

## Module 5: Content Creator 🟠
- Template Loading: [ ] Pass [ ] Fail [ ] Not Tested
- Content Generation: [ ] Pass [ ] Fail [ ] Not Tested
- OpenAI Integration: [ ] Pass [ ] Fail [ ] Not Tested
- Notes: _______________

## Issues Found
1. _______________
2. _______________

## Overall Status
[ ] All tests passed
[ ] Some issues found
[ ] Critical issues blocking
```

---

## 🚀 **Quick Test Command**

Run this in browser console to verify token:

```javascript
// Check if logged in and token is valid
const token = localStorage.getItem('auth_token')
if (!token) {
  console.log('❌ Not logged in')
} else {
  const payload = JSON.parse(atob(token.split('.')[1]))
  const expiresAt = new Date(payload.exp * 1000)
  const daysLeft = Math.floor((payload.exp * 1000 - Date.now()) / 86400000)
  console.log('✅ Logged in as:', payload.name)
  console.log('📅 Token expires:', expiresAt.toLocaleString())
  console.log('⏰ Days remaining:', daysLeft)
  
  if (daysLeft < 0) {
    console.log('❌ TOKEN EXPIRED - Please re-login!')
  }
}
```

---

## 📞 **Need Help?**

If you encounter issues:

1. **Check console** (F12 → Console tab)
2. **Check network** (F12 → Network tab)
3. **Check backend logs**: Railway dashboard
4. **Clear cache**: `localStorage.clear()` → Re-login
5. **Test backend directly**: `https://codeanalyst-production.up.railway.app/api/health`

---

**Last Updated**: Current session  
**Status**: Ready for testing  
**Priority**: Module 5 (Content Creator) - Token issue fixed
