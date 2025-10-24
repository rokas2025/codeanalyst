<?php
/**
 * CodeAnalyst Connector Uninstall
 * 
 * This file is executed when the plugin is deleted from WordPress.
 * It cleans up all plugin data and settings.
 */

// Prevent direct access
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Delete all plugin options
delete_option('codeanalyst_api_key');
delete_option('codeanalyst_backend_url');
delete_option('codeanalyst_connected');
delete_option('codeanalyst_last_sync');
delete_option('codeanalyst_connection_id');

// Clear scheduled events
wp_clear_scheduled_hook('codeanalyst_daily_sync');

// Delete any transients
delete_transient('codeanalyst_connection_test');
delete_transient('codeanalyst_theme_files');

// Optional: Delete connection data from remote server
// This would require making an API call to notify the backend
// that this site is being uninstalled

// Log uninstall (if debugging is enabled)
if (defined('WP_DEBUG') && WP_DEBUG) {
    error_log('CodeAnalyst Connector: Plugin uninstalled and all data cleaned up');
}

