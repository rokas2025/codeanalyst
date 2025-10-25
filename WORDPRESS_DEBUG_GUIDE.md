# WordPress Debug Guide for CodeAnalyst Plugin

## Enable WordPress Debug Mode

### Step 1: Edit wp-config.php

Connect to your site via FTP or File Manager and edit `wp-config.php`:

```php
// Find these lines and replace them:
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
@ini_set('display_errors', 0);

// Add this line to log errors to a file:
define('WP_DEBUG_LOG', true);
```

### Step 2: Check the Error Log

After enabling debug mode, errors will be logged to:
- `wp-content/debug.log`

### Step 3: Try Activating the Plugin

1. Go to WordPress → Plugins
2. Try to activate CodeAnalyst Connector
3. If it fails, check `wp-content/debug.log` for the error

### Step 4: Send Me the Error

Look for lines like:
```
[25-Oct-2025 12:00:00 UTC] PHP Fatal error: ...
[25-Oct-2025 12:00:00 UTC] PHP Parse error: ...
```

---

## Common Fatal Errors & Fixes

### Error: "Cannot redeclare function"
**Cause**: Function defined twice
**Fix**: Check if another plugin has the same function name

### Error: "Class not found"
**Cause**: Missing file or wrong path
**Fix**: Verify all files are uploaded correctly

### Error: "Call to undefined function"
**Cause**: Missing WordPress function or PHP extension
**Fix**: Check PHP version (need 7.4+)

---

## Manual Plugin Deletion

If you can't delete via WordPress:

### Via File Manager (cPanel/Plesk):

1. Go to File Manager
2. Navigate to: `public_html/wp-content/plugins/`
3. Find folder: `codeanalyst-connector` or `codeanalyst-connector-1`
4. **Delete** the entire folder
5. Also check for: `codeanalyst-connector.zip` and delete it

### Via FTP:

1. Connect via FTP
2. Go to: `/wp-content/plugins/`
3. Delete: `codeanalyst-connector` folder
4. Delete: `codeanalyst-connector-1` folder (if exists)

### Via SSH:

```bash
cd /path/to/wordpress/wp-content/plugins/
rm -rf codeanalyst-connector*
```

---

## Check PHP Version

The plugin requires **PHP 7.4 or higher**.

Check your PHP version:
1. WordPress → Tools → Site Health
2. Look for "PHP version"

Or add this to a test file:
```php
<?php phpinfo(); ?>
```

---

## Folder Name Issue

The error mentions `codeanalyst-connector-1/` which suggests WordPress renamed the folder.

This happens when:
- A folder with the same name already exists
- Previous installation wasn't fully deleted

**Solution**: Manually delete ALL folders matching `codeanalyst-connector*` before reinstalling.

---

## After Fixing

1. **Delete old folders** manually
2. **Download fresh plugin** from https://app.beenex.dev/connected-sites
3. **Upload** via WordPress → Plugins → Add New → Upload
4. **Activate** and check for errors
5. **Send debug.log** if errors persist

---

## Need More Help?

Send me:
1. Contents of `wp-content/debug.log` (last 50 lines)
2. PHP version from Site Health
3. Screenshot of the error message
4. List of folders in `/wp-content/plugins/` that start with "codeanalyst"

