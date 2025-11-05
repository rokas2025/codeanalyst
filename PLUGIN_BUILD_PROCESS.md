# WordPress Plugin Build Process

## ⚠️ CRITICAL: READ THIS BEFORE BUILDING PLUGIN

This document explains the CORRECT way to build the WordPress plugin ZIP file.

---

## 🚨 Common Mistake (DO NOT DO THIS!)

**WRONG:** Creating a ZIP that contains a parent folder:
```
codeanalyst-connector.zip
└── codeanalyst-connector/
    ├── admin/
    ├── includes/
    └── codeanalyst-connector.php
```

This causes the error:
```
Required file missing: admin/settings-page.php
```

---

## ✅ Correct Structure (ALWAYS DO THIS!)

**CORRECT:** Files at root level, NO parent folder:
```
codeanalyst-connector.zip
├── admin/
│   ├── settings-page.php
│   └── css/
├── includes/
│   ├── rest-api.php
│   ├── preview-handler.php
│   └── ...
├── codeanalyst-connector.php
├── uninstall.php
└── readme.txt
```

---

## 🔨 How to Build (AUTOMATED)

### Use the Build Script (Recommended)

```powershell
# Run this command from project root
.\build-plugin.ps1
```

This script will:
1. ✅ Detect version from plugin file
2. ✅ Create ZIP with correct structure
3. ✅ Verify all required files are present
4. ✅ Show next steps for deployment

### Manual Build (NOT Recommended)

If you must build manually:

```powershell
cd wordpress-plugin
Compress-Archive -Path admin,includes,*.php,*.txt -DestinationPath "../backend/codeanalyst-connector.zip" -Force
cd ..
```

**Important:** 
- Use `-Path admin,includes,*.php,*.txt` (comma-separated, no parent folder)
- DO NOT use `-Path wordpress-plugin` (creates parent folder)
- DO NOT use `-Path .` from inside wordpress-plugin (creates parent folder)

---

## 📋 Required Files Checklist

The ZIP MUST contain these files at root level:

- [ ] `admin/settings-page.php`
- [ ] `admin/css/admin-styles.css`
- [ ] `includes/api-client.php`
- [ ] `includes/file-reader.php`
- [ ] `includes/rest-api.php`
- [ ] `includes/preview-handler.php`
- [ ] `codeanalyst-connector.php` (main plugin file)
- [ ] `uninstall.php`
- [ ] `readme.txt`

---

## 🧪 How to Verify ZIP Structure

### PowerShell Command:
```powershell
Add-Type -Assembly System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::OpenRead("$PWD\backend\codeanalyst-connector.zip").Entries | Select-Object FullName
```

### Expected Output:
```
FullName
--------
admin/settings-page.php
admin/css/admin-styles.css
includes/api-client.php
includes/file-reader.php
includes/preview-handler.php
includes/rest-api.php
codeanalyst-connector.php
uninstall.php
readme.txt
```

**✅ GOOD:** Paths start with `admin/` or `includes/`  
**❌ BAD:** Paths start with `codeanalyst-connector/admin/`

---

## 🚀 Deployment Process

### 1. Update Plugin Version

Edit `wordpress-plugin/codeanalyst-connector.php`:
```php
/**
 * Version: 1.2.0  // <-- Update this
 */

define('CODEANALYST_VERSION', '1.2.0');  // <-- And this
```

### 2. Build Plugin

```powershell
.\build-plugin.ps1
```

### 3. Commit & Push

```powershell
git add backend/codeanalyst-connector.zip
git add wordpress-plugin/codeanalyst-connector.php
git commit -m "build: Plugin v1.2.0 - [describe changes]"
git push origin main
```

### 4. Wait for Railway Deploy

- Railway auto-deploys when you push to main
- Takes 2-3 minutes
- Check: https://railway.app/project/[your-project]

### 5. Test Download

- Go to: https://app.beenex.dev/connected-sites
- Click "Download Plugin"
- Extract ZIP and verify structure
- Install on test WordPress site

---

## 🐛 Troubleshooting

### Error: "Required file missing: admin/settings-page.php"

**Cause:** ZIP has parent folder  
**Fix:** Rebuild using `build-plugin.ps1`

### Error: "Plugin could not be activated"

**Cause:** Missing main plugin file  
**Fix:** Ensure `codeanalyst-connector.php` is at root level

### Plugin shows as "v1.0.0" after installing v1.1.0

**Cause:** Didn't update version in plugin file  
**Fix:** Update both `Version:` header and `CODEANALYST_VERSION` constant

---

## 📝 Version History

| Version | Date | Changes | Build Method |
|---------|------|---------|--------------|
| 1.1.0 | 2025-11-05 | Live Preview, JWT, Home page detection | ✅ build-plugin.ps1 |
| 1.0.0 | 2025-10-01 | Initial release | Manual (correct structure) |

---

## 🎯 Best Practices

1. **ALWAYS use `build-plugin.ps1`** - Never build manually
2. **Test locally first** - Install on test WordPress site before deploying
3. **Verify structure** - Check ZIP contents before committing
4. **Update version numbers** - In both plugin header and constant
5. **Document changes** - Update CHANGELOG.md
6. **Backup old version** - Keep previous working ZIP

---

## 🔒 Why This Structure Matters

WordPress expects plugin ZIPs to have files at root level because:

1. **WordPress extracts to:** `wp-content/plugins/codeanalyst-connector/`
2. **WordPress looks for:** `wp-content/plugins/codeanalyst-connector/codeanalyst-connector.php`
3. **If ZIP has parent folder:** Files end up at `wp-content/plugins/codeanalyst-connector/codeanalyst-connector/...` ❌
4. **If ZIP has no parent folder:** Files end up at `wp-content/plugins/codeanalyst-connector/...` ✅

---

## 📞 Support

If you encounter issues:

1. Check this document first
2. Verify ZIP structure using commands above
3. Rebuild using `build-plugin.ps1`
4. Test on local WordPress before deploying

---

**Last Updated:** 2025-11-05  
**Maintained By:** CodeAnalyst Team  
**Script Location:** `build-plugin.ps1`

