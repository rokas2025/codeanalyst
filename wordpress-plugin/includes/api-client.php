<?php
/**
 * CodeAnalyst API Client
 * Handles all communication with CodeAnalyst backend
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class CodeAnalyst_API_Client {
    
    /**
     * Get backend URL
     */
    private function get_backend_url() {
        $url = get_option('codeanalyst_backend_url', 'https://codeanalyst-production.up.railway.app/api');
        return trailingslashit($url);
    }
    
    /**
     * Collect site data for connection
     */
    private function collect_site_data() {
        global $wp_version;
        
        // Get active theme
        $theme = wp_get_theme();
        
        // Get active plugins
        $plugins = get_option('active_plugins');
        $plugin_data = array();
        foreach ($plugins as $plugin) {
            $plugin_info = get_plugin_data(WP_PLUGIN_DIR . '/' . $plugin);
            $plugin_data[] = array(
                'name' => $plugin_info['Name'],
                'version' => $plugin_info['Version']
            );
        }
        
        // Get site health (basic info)
        $site_health = array(
            'php_version' => PHP_VERSION,
            'mysql_version' => $GLOBALS['wpdb']->db_version(),
            'memory_limit' => WP_MEMORY_LIMIT,
            'max_upload_size' => size_format(wp_max_upload_size())
        );
        
        return array(
            'site_url' => get_site_url(),
            'site_name' => get_bloginfo('name'),
            'wordpress_version' => $wp_version,
            'active_theme' => $theme->get('Name') . ' ' . $theme->get('Version'),
            'active_plugins' => $plugin_data,
            'site_health' => $site_health,
            'php_version' => PHP_VERSION
        );
    }
    
    /**
     * Make API request
     */
    private function make_request($endpoint, $method = 'GET', $data = array()) {
        $url = $this->get_backend_url() . $endpoint;
        
        $args = array(
            'method' => $method,
            'timeout' => 30,
            'headers' => array(
                'Content-Type' => 'application/json'
            )
        );
        
        if (!empty($data)) {
            $args['body'] = json_encode($data);
        }
        
        $response = wp_remote_request($url, $args);
        
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'message' => $response->get_error_message()
            );
        }
        
        $body = wp_remote_retrieve_body($response);
        $decoded = json_decode($body, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return array(
                'success' => false,
                'message' => 'Invalid JSON response from server'
            );
        }
        
        return $decoded;
    }
    
    /**
     * Connect to CodeAnalyst
     */
    public function connect($api_key) {
        $site_data = $this->collect_site_data();
        $site_data['api_key'] = $api_key;
        
        return $this->make_request('wordpress/connect', 'POST', $site_data);
    }
    
    /**
     * Test connection
     */
    public function test_connection($api_key) {
        $data = array(
            'api_key' => $api_key,
            'test' => true
        );
        
        // Just try to connect - if it works, connection is good
        return $this->connect($api_key);
    }
    
    /**
     * Sync site data with CodeAnalyst
     */
    public function sync_site_data($api_key) {
        $site_data = $this->collect_site_data();
        $site_data['api_key'] = $api_key;
        
        return $this->make_request('wordpress/connect', 'POST', $site_data);
    }
    
    /**
     * Send file contents to CodeAnalyst
     */
    public function send_file_contents($api_key, $file_path, $file_contents) {
        $data = array(
            'api_key' => $api_key,
            'file_path' => $file_path,
            'contents' => base64_encode($file_contents)
        );
        
        return $this->make_request('wordpress/files/send', 'POST', $data);
    }
}

