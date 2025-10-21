# 🔍 WordPress Plugin Debug Guide

## ❌ **Error:** "Plugin could not be activated because it triggered a fatal error"

## 🔍 **Debug Steps:**

### **Step 1: Enable WordPress Debug Mode**

Add these lines to your `wp-config.php` (before "That's all, stop editing!"):

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

### **Step 2: Try to Activate Plugin Again**

This will create a debug log file.

### **Step 3: Check the Error Log**

Go to: `/wp-content/debug.log`

Look for the actual error message - it will show you:
- Which file has the error
- Which line number
- What the exact error is

### **Step 4: Share the Error**

Copy the last few lines from `debug.log` and share them here.

---

## 🧹 **Manual Cleanup (If WordPress didn't delete properly):**

### **Via FTP/File Manager:**

1. Connect to your WordPress files
2. Go to: `/wp-content/plugins/`
3. **Delete the entire `codeanalyst-connector` folder**
4. Confirm it's completely gone
5. Then upload the new ZIP

### **Via SSH:**

```bash
cd /path/to/wordpress/wp-content/plugins/
rm -rf codeanalyst-connector
```

---

## 🔍 **Common Issues:**

### **Issue 1: Old Files Not Deleted**
- **Symptom:** "Folder already exists" warning
- **Cause:** WordPress deletion didn't remove all files
- **Solution:** Manually delete the plugin folder via FTP

### **Issue 2: PHP Syntax Error**
- **Symptom:** Fatal error on activation
- **Cause:** PHP version incompatibility or typo
- **Solution:** Check PHP version (need 7.4+) and debug log

### **Issue 3: Missing Dependencies**
- **Symptom:** "Call to undefined function"
- **Cause:** Required WordPress functions not available
- **Solution:** Check WordPress version (need 5.0+)

### **Issue 4: Folder Structure Wrong**
- **Symptom:** Files not in expected locations
- **Cause:** ZIP extracted incorrectly
- **Solution:** ZIP should extract to create `codeanalyst-connector/` folder

---

## 📋 **Expected Folder Structure:**

```
/wp-content/plugins/codeanalyst-connector/
├── codeanalyst-connector.php
├── admin/
│   ├── settings-page.php
│   └── css/
│       └── admin-styles.css
└── includes/
    ├── api-client.php
    └── file-reader.php
```

---

## 🧪 **Test Commands:**

### **Check if Plugin Folder Exists:**
```bash
ls -la /wp-content/plugins/ | grep codeanalyst
```

### **Check PHP Version:**
```bash
php -v
```

### **Check WordPress Version:**
Go to WordPress Admin → Dashboard (shows version in footer)

---

## 📝 **What I Need From You:**

Please provide:

1. **The exact error from `wp-content/debug.log`** (last 10-20 lines)
2. **Your PHP version** (Dashboard → Site Health → Info → Server)
3. **Your WordPress version** (Dashboard footer)
4. **Screenshot of the error** (if possible)

With this info, I can fix the exact issue!

---

## 🚀 **Quick Fix to Try Now:**

1. **Completely delete the plugin folder manually** (via FTP/cPanel File Manager)
2. **Upload the ZIP again**
3. **Activate**
4. **If still fails, enable debug mode and share the error**

---

**Let me know what you find in the debug log!** 🔍


