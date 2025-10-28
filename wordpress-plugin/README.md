# CodeAnalyst WordPress Connector Plugin

Connect your WordPress website to CodeAnalyst for advanced theme file analysis and content management.

## Features

- 🔌 Easy one-click connection to CodeAnalyst
- 🔄 Automatic daily sync of site data
- 📊 Share theme files, plugin info, and site health metrics
- 🔒 Secure API key authentication
- 📈 Monitor WordPress version, PHP version, and active plugins

## Installation

### Method 1: Manual Installation (Current)

1. Download the `wordpress-plugin` folder from the CodeAnalyst repository
2. Zip the folder contents (not the folder itself)
3. Go to your WordPress admin dashboard
4. Navigate to **Plugins → Add New → Upload Plugin**
5. Upload the zip file and click **Install Now**
6. Click **Activate** after installation

### Method 2: WordPress.org (Coming Soon)

The plugin will be available in the WordPress Plugin Directory soon.

## Setup & Configuration

### Step 1: Generate API Key in CodeAnalyst

1. Log in to your [CodeAnalyst account](https://codeanalyst.vercel.app)
2. Go to **Settings**
3. Scroll to **WordPress Integration** section
4. Click **Generate Key**
5. Copy the generated API key

### Step 2: Configure the WordPress Plugin

1. In your WordPress admin, go to **CodeAnalyst** in the sidebar
2. Paste your API key in the **API Key** field
3. Verify the **Backend URL** is set to: `https://app.beenex.dev/api`
4. Click **Save Settings**
5. Click **Connect to CodeAnalyst**

### Step 3: Verify Connection

1. You should see a success message: "Successfully connected to CodeAnalyst"
2. The connection status will show as **Connected**
3. View your connected site in CodeAnalyst under **Settings → View Connected Sites**

## What Data is Shared?

The plugin shares the following information with CodeAnalyst:

- ✅ Site URL and name
- ✅ WordPress version
- ✅ PHP version
- ✅ Active theme name
- ✅ List of active plugins (names and versions)
- ✅ Site health information (memory limit, upload size, etc.)

**Note:** No sensitive data, passwords, or content is ever transmitted.

## Automatic Sync

The plugin automatically syncs your site data with CodeAnalyst once daily. You can also manually trigger a sync by clicking **Test Connection** in the plugin settings.

## Troubleshooting

### Connection Failed

- **Check API Key:** Make sure you copied the full API key from CodeAnalyst Settings
- **Check URL:** Verify the Backend URL is correct (should be `https://app.beenex.dev/api`)
- **Check Firewall:** Ensure your hosting provider allows outbound HTTPS connections
- **Check SSL:** CodeAnalyst requires SSL/HTTPS connections

### Plugin Not Appearing

- Make sure you've activated the plugin after installation
- Check WordPress admin → Plugins to confirm activation
- Look for **CodeAnalyst** in the left sidebar menu

### API Key Invalid

- Generate a new API key in CodeAnalyst Settings
- Make sure you're copying the entire key (should be a UUID format)
- The key is case-sensitive

## Security

- 🔐 All communications use HTTPS encryption
- 🔑 API keys are securely stored in WordPress database
- 🚫 No passwords or sensitive data are transmitted
- ✅ WordPress nonce verification for all admin actions
- ✅ Capability checks ensure only admins can configure

## Support

- **Documentation:** [CodeAnalyst Docs](https://codeanalyst.vercel.app/docs)
- **Issues:** Create an issue on the GitHub repository
- **Email:** support@codeanalyst.com

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Basic connection to CodeAnalyst
- Automatic daily sync
- Site data sharing (theme, plugins, health)

## Future Features

- 🔜 Real-time theme file analysis
- 🔜 Content synchronization
- 🔜 SEO recommendations
- 🔜 Performance monitoring
- 🔜 Security scanning

## License

GPL v2 or later

## Credits

Developed by the CodeAnalyst team.

