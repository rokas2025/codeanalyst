<?php
/**
 * Plugin Name: CodeAnalyst Connector
 * Plugin URI: https://codeanalyst.vercel.app
 * Description: Connect your WordPress site to CodeAnalyst for theme file analysis and content management
 * Version: 1.2.0
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
define('CODEANALYST_VERSION', '1.2.0');
define('CODEANALYST_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CODEANALYST_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include required files with error checking
$required_files = array(
    'admin/settings-page.php',
    'includes/api-client.php',
    'includes/file-reader.php',
    'includes/rest-api.php',
    'includes/preview-handler.php'
);

foreach ($required_files as $file) {
    $file_path = CODEANALYST_PLUGIN_DIR . $file;
    if (!file_exists($file_path)) {
        // Show helpful error message instead of fatal error
        wp_die(
            sprintf(
                '<h1>CodeAnalyst Connector - Installation Error</h1>' .
                '<p><strong>Required file missing:</strong> <code>%s</code></p>' .
                '<p>This usually means the plugin was not installed correctly.</p>' .
                '<h3>How to Fix:</h3>' .
                '<ol>' .
                '<li>Go to <strong>Plugins</strong> in WordPress admin</li>' .
                '<li>Find all folders starting with <code>codeanalyst-connector</code></li>' .
                '<li>Delete them via FTP/File Manager from: <code>wp-content/plugins/</code></li>' .
                '<li>Download a fresh copy of the plugin</li>' .
                '<li>Upload and activate again</li>' .
                '</ol>' .
                '<p><strong>Plugin directory:</strong> <code>%s</code></p>' .
                '<p><strong>Expected file:</strong> <code>%s</code></p>',
                $file,
                CODEANALYST_PLUGIN_DIR,
                $file_path
            ),
            'CodeAnalyst Connector - Installation Error',
            array('back_link' => true)
        );
    }
    require_once $file_path;
}

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
        
        // Add Settings link to plugin actions
        add_filter('plugin_action_links_' . plugin_basename(__FILE__), array($this, 'add_plugin_action_links'));
        
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
        add_option('codeanalyst_backend_url', 'https://app.beenex.dev/api');
        add_option('codeanalyst_connected', false);
        add_option('codeanalyst_last_sync', '');
        add_option('codeanalyst_connection_id', '');
        
        // Create preview bot user if doesn't exist
        $this->create_preview_bot_user();
        
        // Generate JWT secret if not exists
        if (empty(get_option('codeanalyst_jwt_secret'))) {
            $secret = wp_generate_password(64, true, true);
            update_option('codeanalyst_jwt_secret', $secret);
        }
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clear scheduled events
        wp_clear_scheduled_hook('codeanalyst_daily_sync');
        
        // Clear any cached data
        delete_transient('codeanalyst_connection_test');
        delete_transient('codeanalyst_theme_files');
        
        // Log deactivation
        if (defined('WP_DEBUG') && WP_DEBUG) {
            error_log('CodeAnalyst Connector: Plugin deactivated');
        }
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
     * Add Settings link to plugin action links
     */
    public function add_plugin_action_links($links) {
        $settings_link = '<a href="' . admin_url('admin.php?page=codeanalyst-connector') . '">' . __('Settings') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
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
    
    /**
     * Create preview bot user for preview functionality
     */
    private function create_preview_bot_user() {
        $username = 'codeanalyst-preview-bot';
        
        if (!username_exists($username)) {
            $password = wp_generate_password(64, true, true);
            $user_id = wp_create_user($username, $password, 'preview@codeanalyst.local');
            
            if (!is_wp_error($user_id)) {
                $user = get_user_by('id', $user_id);
                if ($user) {
                    $user->set_role('subscriber');
                }
            }
        }
    }
}

// Initialize plugin
CodeAnalyst_Connector::get_instance();

