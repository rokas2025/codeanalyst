# CodeAnalyst WordPress Plugin - Quick Installation Guide

## For End Users

### Step 1: Download the Plugin

Download the latest version of the CodeAnalyst Connector plugin:
- **GitHub Release**: [Download ZIP](https://github.com/codeanalyst/codeanalyst/releases)
- **Direct Link**: Contact CodeAnalyst support

### Step 2: Install on WordPress

1. Log in to your WordPress admin dashboard
2. Go to **Plugins → Add New**
3. Click **Upload Plugin** button at the top
4. Click **Choose File** and select the `codeanalyst-connector.zip` file
5. Click **Install Now**
6. Wait for installation to complete
7. Click **Activate Plugin**

### Step 3: Get Your API Key

1. Log in to [CodeAnalyst](https://codeanalyst.vercel.app)
2. Click on **Settings** in the sidebar
3. Scroll down to **WordPress Integration** section
4. Click the **Generate Key** button
5. Copy the API key that appears (it's a long string like `550e8400-e29b-41d4-a716-446655440000`)

### Step 4: Connect Your WordPress Site

1. In WordPress admin, go to **CodeAnalyst** in the left sidebar
2. Paste your API key in the **API Key** field
3. Click **Save Settings**
4. Click the **Connect to CodeAnalyst** button
5. Wait for the success message: "Successfully connected to CodeAnalyst"
6. You're done! 🎉

### Step 5: Verify Connection

1. Go back to [CodeAnalyst Settings](https://codeanalyst.vercel.app/settings)
2. Click **View Connected Sites**
3. You should see your WordPress site listed with:
   - Site name and URL
   - WordPress version
   - PHP version
   - Active theme
   - Number of plugins

## Troubleshooting

### "Invalid API Key" Error

**Problem:** The API key is not recognized.

**Solutions:**
- Make sure you copied the entire API key (no extra spaces)
- Generate a new API key in CodeAnalyst Settings
- The key should be in UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

### "Connection Failed" Error

**Problem:** WordPress can't reach CodeAnalyst servers.

**Solutions:**
- Check if your website has HTTPS (SSL certificate required)
- Contact your hosting provider to ensure outbound HTTPS connections are allowed
- Check if a firewall is blocking the connection
- Make sure the Backend URL is: `https://codeanalyst-production.up.railway.app/api`

### Plugin Not Appearing in Menu

**Problem:** CodeAnalyst menu item not showing in WordPress admin.

**Solutions:**
- Make sure the plugin is **activated** (Plugins → Installed Plugins)
- Check if you're logged in as an Administrator (required)
- Try deactivating and reactivating the plugin
- Check for PHP errors in your WordPress debug log

### Site Not Showing in CodeAnalyst Dashboard

**Problem:** Connected but site doesn't appear in Connected Sites.

**Solutions:**
- Wait a few seconds and refresh the page
- Click "Test Connection" in WordPress plugin settings
- Check the connection status in WordPress plugin (should say "Connected")
- Try disconnecting and reconnecting

### Connection Keeps Disconnecting

**Problem:** Site shows as disconnected after some time.

**Solutions:**
- Check if your WordPress site is accessible (not in maintenance mode)
- Verify SSL certificate is valid
- Check WordPress cron is running properly
- Try clicking "Test Connection" to re-establish

## Features After Connection

Once connected, your WordPress site will:

- ✅ **Auto-sync** site data once per day
- ✅ **Share** theme and plugin information with CodeAnalyst
- ✅ **Monitor** WordPress and PHP versions
- ✅ **Track** site health metrics
- ✅ **Enable** future features (theme analysis, content optimization)

## What Data is Shared?

The plugin shares **non-sensitive** technical information:

| Shared ✅ | Not Shared ❌ |
|-----------|---------------|
| Site URL | Passwords |
| Site name | User data |
| WordPress version | Post content |
| PHP version | Comments |
| Active theme | Email addresses |
| Plugin list | Database info |
| Memory limit | API keys |
| Upload size | Sensitive data |

**Privacy:** All communication is encrypted via HTTPS. No personal or sensitive data is ever transmitted.

## Uninstalling

To completely remove the plugin:

1. In CodeAnalyst, go to **Connected Sites**
2. Click **Disconnect** on your WordPress site
3. In WordPress admin, go to **Plugins → Installed Plugins**
4. Find **CodeAnalyst Connector**
5. Click **Deactivate**
6. Click **Delete**
7. Confirm deletion

This will remove all plugin files and settings from your WordPress installation.

## Need Help?

- 📚 **Documentation**: [CodeAnalyst Docs](https://codeanalyst.vercel.app/docs)
- 💬 **Support**: support@codeanalyst.com
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/codeanalyst/codeanalyst/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/codeanalyst/codeanalyst/discussions)

## Frequently Asked Questions

**Q: Is CodeAnalyst free?**  
A: Yes! CodeAnalyst offers a free tier. Premium plans are available for advanced features.

**Q: Will this slow down my website?**  
A: No. The plugin only syncs data once daily and has minimal performance impact.

**Q: Can I use this on multiple sites?**  
A: Yes! Generate a unique API key for each site, or use the same key for all your sites.

**Q: Is my data secure?**  
A: Absolutely. All data is transmitted via HTTPS encryption and stored securely.

**Q: Can I disconnect anytime?**  
A: Yes. You can disconnect your site anytime from either the WordPress plugin or CodeAnalyst dashboard.

**Q: What happens to my data if I disconnect?**  
A: The connection record is removed from CodeAnalyst. No data remains after disconnection.

## Advanced: For Developers

### Manual Installation from GitHub

```bash
# Clone the repository
git clone https://github.com/codeanalyst/codeanalyst.git

# Navigate to the WordPress plugin folder
cd codeanalyst/wordpress-plugin

# Create a zip file
zip -r codeanalyst-connector.zip . -x "*.git*"

# Upload the zip to WordPress
```

### Testing Connection via Command Line

```bash
# Test the backend endpoint
curl -X POST https://codeanalyst-production.up.railway.app/api/wordpress/connect \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "your-api-key-here",
    "site_url": "https://your-site.com",
    "site_name": "Your Site Name",
    "wordpress_version": "6.4",
    "php_version": "8.1"
  }'
```

### Plugin Files Structure

```
wordpress-plugin/
├── codeanalyst-connector.php    # Main plugin file
├── includes/
│   ├── api-client.php           # API communication
│   └── file-reader.php          # File operations
├── admin/
│   └── settings-page.php        # Admin interface
├── readme.txt                   # WordPress.org format
└── README.md                    # GitHub format
```

### Hooks and Filters

The plugin provides WordPress hooks for developers:

```php
// Before connecting to CodeAnalyst
do_action('codeanalyst_before_connect', $api_key, $site_data);

// After successful connection
do_action('codeanalyst_after_connect', $connection_id);

// Daily sync
do_action('codeanalyst_daily_sync');

// Filter site data before sending
$site_data = apply_filters('codeanalyst_site_data', $site_data);
```

---

**Version:** 1.0.0  
**Last Updated:** October 15, 2025  
**Tested with WordPress:** 5.8 - 6.4  
**Requires PHP:** 7.4+

