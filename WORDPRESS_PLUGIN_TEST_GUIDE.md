# WordPress Plugin Testing Guide 🧪

## Quick Test Steps

### 1. Test Plugin Download (2 minutes)

1. Go to https://app.beenex.dev/connected-sites
2. Look for the purple "Download Plugin" button in the header
3. Click it
4. Verify `codeanalyst-connector.zip` downloads (13.87 KB)

**Expected Result**: ✅ Plugin ZIP downloads successfully

---

### 2. Test Plugin Installation (5 minutes)

**Prerequisites**: You need a WordPress site (local or hosted)

1. Log into your WordPress admin panel
2. Go to **Plugins → Add New → Upload Plugin**
3. Upload the `codeanalyst-connector.zip` file
4. Click **Install Now**
5. Click **Activate**
6. Look for "CodeAnalyst" in the left sidebar menu

**Expected Result**: ✅ Plugin installs and activates without errors

---

### 3. Test Connection (3 minutes)

1. In CodeAnalyst (https://app.beenex.dev/settings):
   - Scroll to "WordPress Integration"
   - Click "Generate API Key"
   - Copy the generated key

2. In WordPress:
   - Go to **CodeAnalyst** in the sidebar
   - Paste the API key
   - Click "Save Settings"
   - Click "Connect to CodeAnalyst"

3. Back in CodeAnalyst:
   - Go to **Connected Sites** page
   - Refresh the page

**Expected Result**: ✅ Your WordPress site appears in the Connected Sites list

---

### 4. Test Theme File Scanning (Advanced)

**Note**: This requires the backend to be deployed (automatic via Railway)

You can test this via the browser console:

```javascript
// In browser console on app.beenex.dev
const token = localStorage.getItem('auth_token')
const connectionId = 'YOUR_CONNECTION_ID' // Get from Connected Sites page

fetch(`https://codeanalyst-production.up.railway.app/api/wordpress/theme-files/${connectionId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(r => r.json())
.then(data => console.log('Theme files:', data))
```

**Expected Result**: ✅ Returns list of theme files from your WordPress site

---

### 5. Test Plugin Uninstall (2 minutes)

1. In WordPress:
   - Go to **Plugins**
   - Find "CodeAnalyst Connector"
   - Click **Deactivate**
   - Click **Delete**
   - Confirm deletion

2. Verify cleanup:
   - Go to **Settings → General**
   - Check that no CodeAnalyst options remain

**Expected Result**: ✅ Plugin deletes cleanly without leaving data behind

---

## Troubleshooting

### Plugin Won't Install
- **Error**: "The package could not be installed"
- **Fix**: Make sure you downloaded the latest ZIP (13.87 KB)

### Connection Fails
- **Error**: "Invalid API key"
- **Fix**: 
  1. Generate a new API key in CodeAnalyst Settings
  2. Make sure you copied the entire key
  3. Try connecting again

### Site Not Appearing in Connected Sites
- **Fix**:
  1. Refresh the page
  2. Check WordPress plugin is still activated
  3. Try disconnecting and reconnecting

### Theme Files Not Loading
- **Error**: "Failed to fetch theme files"
- **Fix**:
  1. Make sure WordPress site is accessible from internet
  2. Check that plugin is still activated
  3. Verify API key is correct in WordPress settings

---

## What's New in This Version

### ✨ Features
- **Download Button**: Download plugin directly from Connected Sites page
- **REST API**: WordPress plugin now exposes theme files via REST API
- **Theme Scanning**: Backend can fetch and analyze theme files
- **Clean Uninstall**: Plugin properly cleans up all data on deletion

### 🔧 Fixes
- **Connection ID**: Plugin now stores connection ID for better tracking
- **Authentication**: Improved API authentication with headers
- **Error Handling**: Better error messages and validation

### 🔒 Security
- **API Key Auth**: All REST API calls require valid API key
- **Directory Protection**: Prevents accessing files outside theme directory
- **Permission Checks**: Only WordPress admins can access plugin

---

## Need Help?

If you encounter any issues:

1. **Check WordPress Logs**:
   - Enable `WP_DEBUG` in `wp-config.php`
   - Check `wp-content/debug.log`

2. **Check Browser Console**:
   - Press F12
   - Look for errors in Console tab

3. **Check Backend Logs**:
   - Go to Railway dashboard
   - Check deployment logs

4. **Contact Support**:
   - Provide error messages
   - Include WordPress version
   - Include PHP version

---

**Happy Testing! 🚀**
