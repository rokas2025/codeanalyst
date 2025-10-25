# WordPress Plugin Reinstallation Guide

## Quick Fix for Fatal Errors

If you see **"Fatal error"** or **"Destination folder already exists"**, you need to delete ALL old plugin folders first.

### Automated Cleanup (Windows - RECOMMENDED):

1. Download the cleanup script: `wordpress-plugin-cleanup.ps1`
2. Run PowerShell as Administrator
3. Navigate to your project folder
4. Run:
   ```powershell
   .\wordpress-plugin-cleanup.ps1
   ```
5. Enter your WordPress path when prompted
6. Type `yes` to confirm deletion

### Manual Cleanup (All Platforms):

Delete **ALL** folders matching these patterns from `/wp-content/plugins/`:
- `codeanalyst-connector/`
- `codeanalyst-connector-1/`
- `codeanalyst-connector-2/`
- `codeanalyst-connector-3/`
- Any other `codeanalyst-connector-*` folders

---

## Issue: "Destination folder already exists"

If you see this error when trying to install the plugin:

```
Destination folder already exists. /wp-content/plugins/codeanalyst-connector/
```

This means WordPress didn't fully delete the old plugin files. Here's how to fix it:

---

## Solution 1: Manual Deletion (Recommended)

### Via File Manager (cPanel, Plesk, etc.)

1. Log into your hosting control panel
2. Open **File Manager**
3. Navigate to: `public_html/wp-content/plugins/`
4. Find the `codeanalyst-connector` folder
5. **Delete** the entire folder
6. Go back to WordPress and install the plugin again

### Via FTP (FileZilla, etc.)

1. Connect to your site via FTP
2. Navigate to: `/wp-content/plugins/`
3. Find the `codeanalyst-connector` folder
4. **Delete** the entire folder
5. Go back to WordPress and install the plugin again

---

## Solution 2: Via WordPress (If Plugin is Still Visible)

1. Go to **Plugins** in WordPress admin
2. If you see "CodeAnalyst Connector":
   - Click **Deactivate** (if active)
   - Click **Delete**
   - Confirm deletion
3. If the folder still exists, use Solution 1

---

## Solution 3: Via SSH (Advanced)

If you have SSH access:

```bash
cd /path/to/your/wordpress/wp-content/plugins/
rm -rf codeanalyst-connector/
```

Then install the plugin again via WordPress admin.

---

## What the Plugin Cleans Up

When properly deleted, the plugin removes:

### Database Options
- `codeanalyst_api_key`
- `codeanalyst_backend_url`
- `codeanalyst_connected`
- `codeanalyst_last_sync`
- `codeanalyst_connection_id`

### Scheduled Tasks
- `codeanalyst_daily_sync` cron job

### Cached Data
- All `codeanalyst_*` transients

### Files
- All files in `/wp-content/plugins/codeanalyst-connector/`

---

## Fresh Installation Steps

After cleaning up the old installation:

1. **Download** the latest plugin from Connected Sites page
2. **Upload** via WordPress → Plugins → Add New → Upload Plugin
3. **Activate** the plugin
4. **Configure**:
   - Go to CodeAnalyst in WordPress sidebar
   - Enter your API key from https://app.beenex.dev/settings
   - Click "Save Settings"
   - Click "Connect to CodeAnalyst"
5. **Verify**: Check https://app.beenex.dev/connected-sites

---

## Why This Happens

WordPress sometimes fails to delete plugin folders when:
- File permissions are incorrect
- The plugin is still active during deletion
- A file is locked by the server
- Partial upload/installation occurred

The manual deletion ensures a clean slate for the new installation.

---

## Need Help?

If you continue to have issues:

1. Check file permissions (should be 755 for folders, 644 for files)
2. Ensure you have proper hosting permissions
3. Contact your hosting provider if you can't delete the folder
4. Check WordPress error logs in `wp-content/debug.log`

---

**Note**: Always backup your site before making file system changes!

