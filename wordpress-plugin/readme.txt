=== CodeAnalyst Connector ===
Contributors: codeanalyst
Tags: code analysis, theme analysis, performance, seo, content creator
Requires at least: 5.8
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Connect your WordPress site to CodeAnalyst for advanced theme file analysis, code quality checks, and AI-powered content creation.

== Description ==

**CodeAnalyst Connector** seamlessly integrates your WordPress website with the powerful CodeAnalyst platform, giving you access to:

= Key Features =

* **🔌 One-Click Connection** - Easy setup with secure API key authentication
* **🔄 Automatic Sync** - Daily automatic synchronization of site data
* **📊 Theme Analysis** - Analyze your theme files for code quality and best practices
* **🔒 Secure Communication** - All data transmitted via encrypted HTTPS
* **📈 Site Monitoring** - Track WordPress version, PHP version, and plugin compatibility
* **🚀 Performance Insights** - Get recommendations for improving your site

= What Gets Shared? =

The plugin shares non-sensitive technical information with CodeAnalyst:

* Site URL and name
* WordPress and PHP versions
* Active theme and plugin information
* Site health metrics (memory limit, upload size)

**Note:** No passwords, user data, or content is transmitted.

= How It Works =

1. Install and activate the CodeAnalyst Connector plugin
2. Sign up for a free account at [CodeAnalyst](https://codeanalyst.vercel.app)
3. Generate an API key in CodeAnalyst Settings
4. Enter the API key in the plugin settings
5. Click "Connect to CodeAnalyst"
6. View your site's analysis in the CodeAnalyst dashboard

= Future Features =

* Real-time theme file analysis
* Automated code quality reports
* Security vulnerability scanning
* AI-powered content creation and optimization
* SEO recommendations
* Performance optimization suggestions

= Support =

For support, documentation, and feature requests, visit:
* [CodeAnalyst Documentation](https://codeanalyst.vercel.app/docs)
* [GitHub Repository](https://github.com/codeanalyst/codeanalyst)

== Installation ==

= Automatic Installation =

1. Log in to your WordPress admin dashboard
2. Navigate to **Plugins → Add New**
3. Search for "CodeAnalyst Connector"
4. Click **Install Now** and then **Activate**

= Manual Installation =

1. Download the plugin zip file
2. Log in to your WordPress admin dashboard
3. Navigate to **Plugins → Add New → Upload Plugin**
4. Choose the downloaded zip file and click **Install Now**
5. Click **Activate** after installation

= After Activation =

1. Go to **CodeAnalyst** in your WordPress admin sidebar
2. Visit [CodeAnalyst Settings](https://codeanalyst.vercel.app/settings) to generate an API key
3. Copy the API key and paste it into the plugin settings
4. Click **Save Settings**
5. Click **Connect to CodeAnalyst**
6. You're all set! View your connected site in the CodeAnalyst dashboard

== Frequently Asked Questions ==

= Is CodeAnalyst free? =

Yes! CodeAnalyst offers a free tier with essential features. Premium plans with advanced features are also available.

= What data does the plugin collect? =

The plugin only collects technical, non-sensitive information like WordPress version, PHP version, active theme, and plugin list. No user data, passwords, or content is transmitted.

= Is my data secure? =

Yes. All communication uses HTTPS encryption, and API keys are securely stored. CodeAnalyst follows industry-standard security practices.

= Can I disconnect my site? =

Absolutely. You can disconnect your site at any time from the plugin settings page.

= Does this plugin slow down my site? =

No. The plugin only syncs data once daily in the background and has minimal performance impact.

= What if I change themes? =

No problem! The next sync will automatically update your theme information in CodeAnalyst.

= Can I use this with a local development site? =

Yes, but the CodeAnalyst platform needs to be able to reach your site via HTTPS. You may need to use a tunneling service like ngrok for local development.

== Screenshots ==

1. Plugin settings page with connection status
2. CodeAnalyst dashboard showing connected WordPress sites
3. Theme file analysis in CodeAnalyst
4. Site health and performance metrics

== Changelog ==

= 1.0.0 - 2025-10-15 =
* Initial release
* Basic connection to CodeAnalyst platform
* Automatic daily sync
* Site data collection (theme, plugins, health)
* Secure API key authentication
* Connection status monitoring

== Upgrade Notice ==

= 1.0.0 =
Initial release of CodeAnalyst Connector.

== Privacy Policy ==

CodeAnalyst Connector connects your WordPress site to the external CodeAnalyst platform. The plugin transmits the following data:

* Site URL and name
* WordPress version
* PHP version
* Active theme name and version
* List of active plugins (names and versions)
* Site health information (memory limit, max upload size, MySQL version)

This data is transmitted securely via HTTPS to the CodeAnalyst backend API at `https://codeanalyst-production.up.railway.app/api`.

No personal user data, passwords, post content, or other sensitive information is transmitted.

For more information, see the [CodeAnalyst Privacy Policy](https://codeanalyst.vercel.app/privacy).

== External Services ==

This plugin connects to the following external service:

**CodeAnalyst Backend API**
* Service URL: https://codeanalyst-production.up.railway.app/api
* Purpose: Site analysis and data synchronization
* Privacy Policy: https://codeanalyst.vercel.app/privacy
* Terms of Service: https://codeanalyst.vercel.app/terms

Data is transmitted when:
* You click "Connect to CodeAnalyst"
* Daily automatic sync (if connected)
* You click "Test Connection"

== Credits ==

Developed by the CodeAnalyst team.

Icons and graphics from WordPress Dashicons.
