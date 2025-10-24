<?php
/**
 * Plugin Name: CodeAnalyst Connector
 * Plugin URI: https://codeanalyst.vercel.app
 * Description: Connect your WordPress site to CodeAnalyst for theme file analysis and content management
 * Version: 1.0.0
 * Author: CodeAnalyst
 * Author URI: https://codeanalyst.vercel.app
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: codeanalyst-connector
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('CODEANALYST_VERSION', '1.0.0');
define('CODEANALYST_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CODEANALYST_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include required files (admin functions must be loaded first)
require_once CODEANALYST_PLUGIN_DIR . 'admin/settings-page.php';
require_once CODEANALYST_PLUGIN_DIR . 'includes/api-client.php';
require_once CODEANALYST_PLUGIN_DIR . 'includes/file-reader.php';
require_once CODEANALYST_PLUGIN_DIR . 'includes/rest-api.php';

/**
 * Main Plugin Class
 */
class CodeAnalyst_Connector {
    
    private static $instance = null;
    
    /**
     * Get singleton instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        // Activation and deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // Admin menu
        add_action('admin_menu', array($this, 'add_admin_menu'));
        
        // Settings
        add_action('admin_init', array($this, 'register_settings'));
        
        // AJAX handlers
        add_action('wp_ajax_codeanalyst_connect', array($this, 'ajax_connect'));
        add_action('wp_ajax_codeanalyst_disconnect', array($this, 'ajax_disconnect'));
        add_action('wp_ajax_codeanalyst_test_connection', array($this, 'ajax_test_connection'));
        
        // Daily sync cron job
        add_action('codeanalyst_daily_sync', array($this, 'daily_sync'));
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Schedule daily sync
        if (!wp_next_scheduled('codeanalyst_daily_sync')) {
            wp_schedule_event(time(), 'daily', 'codeanalyst_daily_sync');
        }
        
        // Set default options
        add_option('codeanalyst_api_key', '');
        add_option('codeanalyst_backend_url', 'https://codeanalyst-production.up.railway.app/api');
        add_option('codeanalyst_connected', false);
        add_option('codeanalyst_last_sync', '');
        add_option('codeanalyst_connection_id', '');
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clear scheduled events
        wp_clear_scheduled_hook('codeanalyst_daily_sync');
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            'CodeAnalyst',
            'CodeAnalyst',
            'manage_options',
            'codeanalyst-connector',
            'codeanalyst_settings_page',
            'dashicons-analytics',
            100
        );
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('codeanalyst_settings', 'codeanalyst_api_key');
        register_setting('codeanalyst_settings', 'codeanalyst_backend_url');
        register_setting('codeanalyst_settings', 'codeanalyst_connected');
        register_setting('codeanalyst_settings', 'codeanalyst_last_sync');
        register_setting('codeanalyst_settings', 'codeanalyst_connection_id');
    }
    
    /**
     * AJAX: Connect to CodeAnalyst
     */
    public function ajax_connect() {
        check_ajax_referer('codeanalyst_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Unauthorized');
            return;
        }
        
        $api_key = get_option('codeanalyst_api_key');
        
        if (empty($api_key)) {
            wp_send_json_error('Please enter an API key first');
            return;
        }
        
        $api_client = new CodeAnalyst_API_Client();
        $result = $api_client->connect($api_key);
        
        if ($result['success']) {
            update_option('codeanalyst_connected', true);
            update_option('codeanalyst_last_sync', current_time('mysql'));
            
            // Store connection ID if provided
            if (isset($result['connection_id'])) {
                update_option('codeanalyst_connection_id', $result['connection_id']);
            }
            
            wp_send_json_success('Successfully connected to CodeAnalyst');
        } else {
            wp_send_json_error($result['message']);
        }
    }
    
    /**
     * AJAX: Disconnect from CodeAnalyst
     */
    public function ajax_disconnect() {
        check_ajax_referer('codeanalyst_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Unauthorized');
            return;
        }
        
        update_option('codeanalyst_connected', false);
        wp_send_json_success('Disconnected from CodeAnalyst');
    }
    
    /**
     * AJAX: Test connection
     */
    public function ajax_test_connection() {
        check_ajax_referer('codeanalyst_nonce', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Unauthorized');
            return;
        }
        
        $api_key = get_option('codeanalyst_api_key');
        
        if (empty($api_key)) {
            wp_send_json_error('Please enter an API key first');
            return;
        }
        
        $api_client = new CodeAnalyst_API_Client();
        $result = $api_client->test_connection($api_key);
        
        if ($result['success']) {
            wp_send_json_success('Connection test successful');
        } else {
            wp_send_json_error($result['message']);
        }
    }
    
    /**
     * Daily sync with CodeAnalyst
     */
    public function daily_sync() {
        $connected = get_option('codeanalyst_connected');
        
        if (!$connected) {
            return;
        }
        
        $api_key = get_option('codeanalyst_api_key');
        $api_client = new CodeAnalyst_API_Client();
        $result = $api_client->sync_site_data($api_key);
        
        if ($result['success']) {
            update_option('codeanalyst_last_sync', current_time('mysql'));
        }
    }
}

// Initialize plugin
CodeAnalyst_Connector::get_instance();

