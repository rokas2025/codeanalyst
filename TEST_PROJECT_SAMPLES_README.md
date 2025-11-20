# CodeAnalyst Test Projects

Test ZIP files created for uploading to **CodeAnalyst module** to see realistic analysis results (not all zeros).

## Created Files

### 1. `react-todo-app.zip` (7.3 KB)
**React + TypeScript Todo Application**

#### What's Inside:
- ✅ **12 files** (TypeScript, Tests, Config)
- ✅ **Full documentation** (JSDoc comments on all functions/types)
- ✅ **Unit tests** (3 test files with comprehensive coverage)
- ✅ **TypeScript** with strict mode
- ✅ **package.json** with dependencies
- ✅ **README.md** with installation instructions
- ✅ **.gitignore** and **tsconfig.json**

#### Expected Analysis Results:
- **Documentation:** ~80% (all components/functions documented)
- **Test Coverage:** ~70% (test files present)
- **Quality Score:** 70-85 (well-structured React app)
- **Code Organization:** High (proper folder structure)
- **Dependencies:** Detected (React 18, TypeScript 5, Jest)
- **Security:** Good (no obvious issues)

---

### 2. `flask-api-project.zip` (6.4 KB)
**Python Flask REST API with Authentication**

#### What's Inside:
- ✅ **10 files** (Python, Tests)
- ✅ **Full docstrings** (Google-style on all classes/methods)
- ✅ **Pytest tests** (2 test files)
- ✅ **requirements.txt** with dependencies
- ✅ **README.md** with API documentation
- ✅ **pytest.ini** config for testing
- ✅ **.gitignore**

#### Expected Analysis Results:
- **Documentation:** ~85% (comprehensive Python docstrings)
- **Test Coverage:** ~75% (pytest test files)
- **Quality Score:** 75-88 (RESTful best practices)
- **Security:** High (password hashing, JWT, validation)
- **Dependencies:** Detected (Flask, SQLAlchemy, pytest)
- **Architecture:** Clean (models/routes/services separation)

---

## How to Use

### Option 1: Upload via Web Interface
1. Go to **CodeAnalyst module**
2. Select **"Upload ZIP"** tab
3. Drag & drop one of these ZIP files
4. Click **"Analyze"**
5. Wait 10-30 seconds for analysis
6. See detailed results (NOT all zeros!)

### Option 2: Direct File Upload
1. Select files from `test-projects/` folder
2. Upload individual files

---

## What You Should See

### Good Scores (Not Zeros):
- ✅ **Quality Score:** 70-85+
- ✅ **Documentation:** 75-85%
- ✅ **Test Coverage:** 70-75%
- ✅ **Code Organization:** High
- ✅ **Dependencies Found:** React/Flask/pytest
- ✅ **Frameworks Detected:** React 18 / Flask 3.0

### Detailed Sections:
- 📊 **System Overview** - File count, lines of code, languages
- 🔧 **Technical Structure** - Frameworks, dependencies, architecture
- 🛠️ **Maintenance Needs** - Technical debt, refactoring suggestions
- 💼 **Business Recommendations** - AI-powered improvement suggestions
- 🔒 **Risk Assessment** - Security issues, outdated deps

---

## Why These Projects?

**React Todo:**
- Modern React patterns (hooks, TypeScript)
- Testing best practices
- Clean component architecture
- Good documentation

**Flask API:**
- Production-ready structure
- Security best practices (password hashing, JWT)
- Comprehensive validation
- Separation of concerns (MVC pattern)

Both projects demonstrate **professional code quality** that CodeAnalyst can properly analyze and score.

---

## Comparing to WordPress Theme

| Metric | WordPress Theme | React Todo | Flask API |
|--------|----------------|------------|-----------|
| Files | 4 | 12 | 10 |
| Tests | 0 | 3 | 2 |
| Documentation | 0% | 80% | 85% |
| Dependencies | None detected | package.json | requirements.txt |
| Quality Score | 20-30 | 70-85 | 75-88 |

**Why WordPress scores low:**
- No unit tests (themes rarely have tests)
- No PHPDoc comments (common in themes)
- Only 4 files fetched (plugin scanning issue?)
- Basic structure (simple theme)

---

## Next Steps

1. **Test React Todo ZIP** - Upload and analyze
2. **Test Flask API ZIP** - Upload and analyze  
3. **Compare results** - See difference from WordPress theme
4. **Investigate WordPress** - Why only 4 files? Should be 50-500+

If WordPress still shows 4 files, the issue is:
- Plugin not scanning subdirectories properly
- OR theme actually IS that minimal
- Check which theme is installed in WordPress

---

## Files Location

```
C:\Users\rokas\OneDrive\Dokumentai\Analyst\
├── react-todo-app.zip         (7.3 KB)
├── flask-api-project.zip      (6.4 KB)
└── test-projects/
    ├── react-todo/            (source files)
    └── flask-api/             (source files)
```

Ready to test! 🚀

