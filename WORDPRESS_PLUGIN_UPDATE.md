# WordPress Plugin Update Instructions

## 🚨 IMPORTANT: Update Required for Preview Feature

Your WordPress site needs the **CodeAnalyst Connector v1.1.0** plugin to enable the Live Preview feature.

---

## Quick Update Steps

### Option 1: Via WordPress Admin (Recommended)

1. **Download the Plugin:**
   - Go to your CodeAnalyst dashboard: https://app.beenex.dev
   - Navigate to **WordPress Connections**
   - Click **"Download Plugin v1.1.0"** button
   - OR download from: `wordpress-plugin/codeanalyst-connector-v1.1.0.zip`

2. **Deactivate Old Plugin:**
   - Go to your WordPress admin: https://wemods.es/wp-admin
   - Navigate to **Plugins** → **Installed Plugins**
   - Find **CodeAnalyst Connector**
   - Click **Deactivate**

3. **Delete Old Plugin:**
   - After deactivating, click **Delete**
   - Confirm deletion

4. **Install New Plugin:**
   - Click **Add New Plugin** → **Upload Plugin**
   - Choose the downloaded `codeanalyst-connector-v1.1.0.zip`
   - Click **Install Now**
   - Click **Activate Plugin**

5. **Verify Connection:**
   - Go to **Settings** → **CodeAnalyst**
   - Your API key should still be there
   - Connection status should show **Connected**

---

### Option 2: Via FTP/File Manager

1. **Download the Plugin:**
   - Download `wordpress-plugin/codeanalyst-connector-v1.1.0.zip`
   - Extract the ZIP file

2. **Delete Old Plugin Folder:**
   - Connect via FTP or use cPanel File Manager
   - Navigate to `/wp-content/plugins/`
   - Delete the `codeanalyst-connector` folder

3. **Upload New Plugin:**
   - Upload the extracted `codeanalyst-connector` folder to `/wp-content/plugins/`

4. **Activate Plugin:**
   - Go to WordPress admin → **Plugins**
   - Find **CodeAnalyst Connector v1.1.0**
   - Click **Activate**

---

## What's New in v1.1.0?

### ✨ New Features:
- **Live Preview:** Real-time, pixel-perfect preview of WordPress pages
- **JWT-based Security:** Short-lived signed preview URLs
- **Page Builder Support:** Auto-detection for Elementor, Divi, Gutenberg, WPBakery
- **Home Page Detection:** Automatically identifies and sorts home page first
- **Draft/Pending Support:** Preview unpublished content

### 🔧 Technical Changes:
- New REST endpoint: `POST /wp-json/codeanalyst/v1/preview/mint`
- New preview handler for JWT verification
- Enhanced security headers (CSP frame-ancestors)
- Rate limiting for preview minting (10 requests/minute)
- Low-privilege preview bot user

---

## Verification Steps

After updating, verify the plugin is working:

1. **Check Plugin Version:**
   - Go to **Plugins** in WordPress admin
   - Confirm **CodeAnalyst Connector** shows version **1.1.0**

2. **Test REST Endpoint:**
   - Visit: `https://wemods.es/wp-json/codeanalyst/v1/preview/mint`
   - You should see a 401 error (this is correct - it means the endpoint exists)
   - If you see 404, the plugin didn't update correctly

3. **Test Preview Feature:**
   - Go to CodeAnalyst dashboard
   - Navigate to **AutoProgrammer**
   - Select **WordPress Site** input method
   - Choose your site and a page
   - Click **Load & Preview**
   - You should see a live preview of your page

---

## Troubleshooting

### Plugin Version Still Shows Old Version
- **Clear WordPress cache** (if using a caching plugin)
- **Deactivate and reactivate** the plugin
- **Check file permissions** (should be 644 for files, 755 for folders)

### Preview Still Shows 404 Error
- **Flush WordPress permalinks:**
  - Go to **Settings** → **Permalinks**
  - Click **Save Changes** (don't change anything)
- **Check .htaccess file** for any rules blocking REST API

### Connection Lost After Update
- Go to **Settings** → **CodeAnalyst**
- Your API key should still be there
- If not, reconnect from CodeAnalyst dashboard

### Preview Bot User Not Created
- The plugin creates a `codeanalyst-preview-bot` user automatically
- If you see errors, check **Users** in WordPress admin
- The bot should be a **Subscriber** role

---

## Support

If you encounter any issues:

1. **Check WordPress error logs:**
   - Enable debug mode in `wp-config.php`:
     ```php
     define('WP_DEBUG', true);
     define('WP_DEBUG_LOG', true);
     ```
   - Check `/wp-content/debug.log`

2. **Check browser console:**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check Network tab for failed requests

3. **Contact Support:**
   - Email: support@codeanalyst.com
   - Include: WordPress version, PHP version, error messages

---

## File Locations

- **Plugin ZIP:** `wordpress-plugin/codeanalyst-connector-v1.1.0.zip`
- **Plugin Folder:** `/wp-content/plugins/codeanalyst-connector/`
- **Main File:** `codeanalyst-connector.php`
- **Version:** 1.1.0
- **Requires:** WordPress 5.0+, PHP 7.4+

---

## Important Notes

⚠️ **Backup First:** Always backup your site before updating plugins

⚠️ **API Key Preserved:** Your API key and connection settings are preserved during update

⚠️ **No Data Loss:** The update doesn't affect your WordPress content or database

✅ **Safe to Update:** This is a non-breaking update - all existing features continue to work

---

## Next Steps

After updating the plugin:

1. ✅ Test the Live Preview feature
2. ✅ Verify all pages load correctly
3. ✅ Check that home page is identified correctly
4. ✅ Try previewing draft/pending posts
5. ✅ Test different page builders (if applicable)

---

**Last Updated:** November 4, 2025  
**Plugin Version:** 1.1.0  
**Compatibility:** WordPress 5.0+ | PHP 7.4+

