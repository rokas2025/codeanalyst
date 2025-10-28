<?php
/**
 * CodeAnalyst REST API
 * Provides REST API endpoints for theme file access
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class CodeAnalyst_REST_API {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    /**
     * Register REST API routes
     */
    public function register_routes() {
        // Get list of theme files
        register_rest_route('codeanalyst/v1', '/theme-files', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_theme_files'),
            'permission_callback' => array($this, 'check_permission')
        ));
        
        // Get specific theme file content
        register_rest_route('codeanalyst/v1', '/theme-file/(?P<file>.+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_theme_file_content'),
            'permission_callback' => array($this, 'check_permission')
        ));
        
        // Get site information (theme, builders, versions)
        register_rest_route('codeanalyst/v1', '/site-info', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_site_info'),
            'permission_callback' => array($this, 'check_permission')
        ));
    }
    
    /**
     * Check API permission
     */
    public function check_permission($request) {
        $api_key = $request->get_header('X-API-Key');
        $stored_key = get_option('codeanalyst_api_key');
        
        if (empty($api_key) || empty($stored_key)) {
            return false;
        }
        
        return $api_key === $stored_key;
    }
    
    /**
     * Get list of theme files
     */
    public function get_theme_files($request) {
        $theme = wp_get_theme();
        $theme_dir = $theme->get_stylesheet_directory();
        
        $files = $this->scan_directory($theme_dir);
        
        return rest_ensure_response(array(
            'success' => true,
            'theme' => $theme->get('Name'),
            'theme_version' => $theme->get('Version'),
            'theme_dir' => basename($theme_dir),
            'files' => $files,
            'total_files' => count($files)
        ));
    }
    
    /**
     * Get theme file content
     */
    public function get_theme_file_content($request) {
        $file = $request->get_param('file');
        $theme = wp_get_theme();
        $theme_dir = $theme->get_stylesheet_directory();
        $file_path = $theme_dir . '/' . $file;
        
        // Security: prevent directory traversal
        $real_path = realpath($file_path);
        if ($real_path === false || strpos($real_path, $theme_dir) !== 0) {
            return new WP_Error('invalid_file', 'Invalid file path', array('status' => 403));
        }
        
        if (!file_exists($file_path)) {
            return new WP_Error('file_not_found', 'File not found', array('status' => 404));
        }
        
        $content = file_get_contents($file_path);
        
        return rest_ensure_response(array(
            'success' => true,
            'file' => $file,
            'content' => base64_encode($content),
            'size' => filesize($file_path),
            'modified' => filemtime($file_path)
        ));
    }
    
    /**
     * Recursively scan directory for files
     */
    private function scan_directory($dir, $base_dir = null) {
        if ($base_dir === null) {
            $base_dir = $dir;
        }
        
        $files = array();
        
        if (!is_dir($dir)) {
            return $files;
        }
        
        $items = scandir($dir);
        
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            
            $path = $dir . '/' . $item;
            $relative_path = str_replace($base_dir . '/', '', $path);
            
            if (is_dir($path)) {
                // Recursively scan subdirectories
                $files = array_merge($files, $this->scan_directory($path, $base_dir));
            } else {
                // Check if file extension is allowed
                $ext = pathinfo($path, PATHINFO_EXTENSION);
                if (in_array($ext, array('php', 'css', 'js', 'html', 'json', 'scss', 'sass', 'less'))) {
                    $files[] = array(
                        'path' => $relative_path,
                        'name' => basename($path),
                        'extension' => $ext,
                        'size' => filesize($path),
                        'modified' => filemtime($path)
                    );
                }
            }
        }
        
        return $files;
    }
    
    /**
     * Get site information including page builders
     */
    public function get_site_info($request) {
        global $wp_version;
        
        // Get active theme
        $theme = wp_get_theme();
        
        // Detect page builders
        $builders = array();
        $builder_versions = array();
        
        // Check for Elementor
        if (is_plugin_active('elementor/elementor.php')) {
            $builders[] = 'elementor';
            if (defined('ELEMENTOR_VERSION')) {
                $builder_versions['elementor'] = ELEMENTOR_VERSION;
            }
        }
        
        // Check for Gutenberg (Block Editor) - always available in WP 5.0+
        if (version_compare($wp_version, '5.0', '>=')) {
            $builders[] = 'gutenberg';
            $builder_versions['gutenberg'] = $wp_version;
        }
        
        // Check for WPBakery Page Builder
        if (is_plugin_active('js_composer/js_composer.php')) {
            $builders[] = 'wpbakery';
            if (defined('WPB_VC_VERSION')) {
                $builder_versions['wpbakery'] = WPB_VC_VERSION;
            }
        }
        
        // Check for Divi Builder
        if (is_plugin_active('divi-builder/divi-builder.php') || $theme->get_template() === 'Divi') {
            $builders[] = 'divi';
            if (defined('ET_BUILDER_VERSION')) {
                $builder_versions['divi'] = ET_BUILDER_VERSION;
            }
        }
        
        // Check for Beaver Builder
        if (is_plugin_active('beaver-builder-lite-version/fl-builder.php') || is_plugin_active('bb-plugin/fl-builder.php')) {
            $builders[] = 'beaver';
            if (defined('FL_BUILDER_VERSION')) {
                $builder_versions['beaver'] = FL_BUILDER_VERSION;
            }
        }
        
        // Check for Oxygen Builder
        if (is_plugin_active('oxygen/functions.php')) {
            $builders[] = 'oxygen';
            if (defined('CT_VERSION')) {
                $builder_versions['oxygen'] = CT_VERSION;
            }
        }
        
        // Check for Bricks Builder
        if ($theme->get_template() === 'bricks' || $theme->get_stylesheet() === 'bricks') {
            $builders[] = 'bricks';
            $builder_versions['bricks'] = $theme->get('Version');
        }
        
        // Get active plugins
        $active_plugins = get_option('active_plugins', array());
        $plugin_data = array();
        
        foreach ($active_plugins as $plugin_path) {
            if (!function_exists('get_plugin_data')) {
                require_once ABSPATH . 'wp-admin/includes/plugin.php';
            }
            $plugin_file = WP_PLUGIN_DIR . '/' . $plugin_path;
            if (file_exists($plugin_file)) {
                $data = get_plugin_data($plugin_file);
                $plugin_data[] = array(
                    'name' => $data['Name'],
                    'version' => $data['Version']
                );
            }
        }
        
        // Get PHP and MySQL versions
        $mysql_version = '';
        global $wpdb;
        if ($wpdb) {
            $mysql_version = $wpdb->db_version();
        }
        
        return rest_ensure_response(array(
            'success' => true,
            'data' => array(
                'theme' => $theme->get('Name'),
                'theme_version' => $theme->get('Version'),
                'theme_template' => $theme->get_template(),
                'builders' => $builders,
                'builder_versions' => $builder_versions,
                'wp_version' => $wp_version,
                'php_version' => PHP_VERSION,
                'mysql_version' => $mysql_version,
                'active_plugins' => $plugin_data,
                'site_url' => get_site_url(),
                'home_url' => get_home_url(),
                'admin_email' => get_option('admin_email'),
                'language' => get_locale(),
                'timezone' => get_option('timezone_string'),
                'memory_limit' => WP_MEMORY_LIMIT,
                'max_upload_size' => size_format(wp_max_upload_size())
            )
        ));
    }
}

// Initialize REST API
new CodeAnalyst_REST_API();

