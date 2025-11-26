# CodeAnalyst Connector - Changelog

All notable changes to the CodeAnalyst WordPress Connector plugin.

## [1.2.3] - 2025-11-26

### Added
- WordPress core update detection: API now returns if WordPress needs updating
- Theme update detection: Shows current and latest available theme versions
- Plugin update detection: Lists all plugins that have updates available
- New fields in `/site-info` endpoint:
  - `wp_update_available` (boolean)
  - `wp_latest_version` (string)
  - `theme_update_available` (boolean)
  - `theme_latest_version` (string)
  - `plugin_updates` (array of plugins needing updates)
  - `plugins_needing_update` (count)

### Technical Details
This version enhances the site-info REST endpoint to provide comprehensive
update status information. The update checks use WordPress transients which
are populated during WordPress's automatic update checks.

To ensure accurate update information:
1. WordPress should have automatic update checks enabled
2. Visit Dashboard > Updates to refresh update data if needed
3. Plugin update info requires wp-admin/includes/plugin.php

### API Response Example
```json
{
  "success": true,
  "data": {
    "wp_version": "6.4.2",
    "wp_update_available": true,
    "wp_latest_version": "6.4.3",
    "theme": "My Theme",
    "theme_version": "1.0.0",
    "theme_update_available": false,
    "theme_latest_version": "1.0.0",
    "plugin_updates": [
      {
        "name": "Example Plugin",
        "current_version": "1.0.0",
        "new_version": "1.1.0"
      }
    ],
    "plugins_needing_update": 1
  }
}
```

### Security Recommendations
When plugin updates are detected, consider the following security practices:
- Always backup your site before updating plugins
- Test updates on a staging environment first
- Review changelogs for security-related fixes
- Keep WordPress core updated to the latest version
- Monitor security advisories from WordPress and plugin developers

### Troubleshooting Update Detection
If update information is not showing correctly, try these steps:

1. **Refresh WordPress Update Data**
   - Go to Dashboard > Updates in WordPress admin
   - Click "Check Again" to force an update check
   - This refreshes the transients used by our API

2. **Check WordPress Cron**
   - WordPress uses wp-cron for scheduled tasks including update checks
   - If cron is disabled, updates may not be detected
   - Consider using a real cron job for reliability

3. **Verify Plugin Permissions**
   - The CodeAnalyst Connector needs read access to plugin data
   - Ensure no security plugins are blocking our API endpoints

4. **Debug Mode**
   - Enable WP_DEBUG and WP_DEBUG_LOG in wp-config.php
   - Check wp-content/debug.log for any errors
   - Look for entries with "CodeAnalyst" prefix

### Compatibility Notes
- Requires WordPress 5.0 or higher
- Compatible with PHP 7.4, 8.0, 8.1, 8.2, and 8.3
- Tested with popular security plugins (Wordfence, Sucuri, iThemes)
- Works with multisite installations (per-site basis)

---

## [1.2.2] - 2025-11-26

### Fixed
- Parent theme file fetching now works correctly with `[parent]/` prefix
- Files from parent theme are now properly returned for child theme analysis

## [1.2.1] - 2025-11-26

### Added
- Child theme support: now scans both parent and child theme files
- Debug logging for theme scanning (check WordPress debug.log)
- `is_child_theme` and `parent_theme` fields in API response

### Fixed
- Parent theme files are now included with `[parent]/` prefix in file paths

## [1.2.0] - 2025-11-25

### Fixed
- Fixed `realpath()` comparison for symlinked directories
- Improved file path security validation

### Changed
- Better error messages for file access issues

## [1.1.0] - 2025-11-05

### Added
- Preview URL minting for authenticated page previews
- Site health information in API responses
- Pages endpoint for listing WordPress pages

### Changed
- Improved REST API permission checks

## [1.0.0] - 2025-10-15

### Added
- Initial release
- Theme file scanning and content retrieval
- REST API endpoints for CodeAnalyst integration
- Admin settings page for API key management
- Automatic daily sync with CodeAnalyst platform

