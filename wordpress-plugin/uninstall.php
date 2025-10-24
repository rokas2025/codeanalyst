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

// Delete options that might have been created in older versions
delete_option('codeanalyst_version');
delete_option('codeanalyst_install_date');

// Clear scheduled events
wp_clear_scheduled_hook('codeanalyst_daily_sync');

// Delete all transients
delete_transient('codeanalyst_connection_test');
delete_transient('codeanalyst_theme_files');
delete_transient('codeanalyst_api_response');

// Delete any site transients
delete_site_transient('codeanalyst_connection_test');
delete_site_transient('codeanalyst_theme_files');

// Optional: Clean up any custom database tables (if we add them in the future)
// global $wpdb;
// $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}codeanalyst_data");

// Log uninstall (if debugging is enabled)
if (defined('WP_DEBUG') && WP_DEBUG) {
    error_log('CodeAnalyst Connector: Plugin uninstalled and all data cleaned up');
}

// Note: WordPress will automatically delete the plugin files after this script runs
// If you see "Destination folder already exists" error, manually delete the 
// /wp-content/plugins/codeanalyst-connector/ folder via FTP or file manager

