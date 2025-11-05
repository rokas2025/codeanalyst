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
        
        // Get list of all pages
        register_rest_route('codeanalyst/v1', '/pages', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_pages'),
            'permission_callback' => array($this, 'check_permission')
        ));
        
        // Get page content by ID
        register_rest_route('codeanalyst/v1', '/page-content/(?P<id>[\w-]+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_page_content'),
            'permission_callback' => array($this, 'check_permission')
        ));
        
        // Mint preview URL (POST)
        register_rest_route('codeanalyst/v1', '/preview/mint', array(
            'methods' => 'POST',
            'callback' => array($this, 'mint_preview_url'),
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
                'plugin_version' => defined('CODEANALYST_VERSION') ? CODEANALYST_VERSION : '1.0.0',
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
    
    /**
     * Get list of all pages (including drafts and pending)
     */
    public function get_pages($request) {
        $args = array(
            'post_type' => 'page',
            'post_status' => array('publish', 'draft', 'pending'),
            'posts_per_page' => -1,
            'orderby' => 'title',
            'order' => 'ASC'
        );
        
        $pages = get_posts($args);
        $page_list = array();
        
        // Get home page and posts page IDs
        $home_page_id = get_option('page_on_front');
        $posts_page_id = get_option('page_for_posts');
        
        foreach ($pages as $page) {
            $is_home = ($page->ID == $home_page_id);
            $is_posts_page = ($page->ID == $posts_page_id);
            
            $page_list[] = array(
                'id' => $page->ID,
                'title' => $page->post_title,
                'url' => get_permalink($page->ID),
                'status' => $page->post_status,
                'modified' => $page->post_modified,
                'is_home' => $is_home,
                'is_posts_page' => $is_posts_page
            );
        }
        
        // Sort: home page first, then alphabetically by title
        usort($page_list, function($a, $b) {
            if ($a['is_home']) return -1;
            if ($b['is_home']) return 1;
            return strcmp($a['title'], $b['title']);
        });
        
        return rest_ensure_response(array(
            'success' => true,
            'pages' => $page_list,
            'total' => count($page_list)
        ));
    }
    
    /**
     * Get page content by ID
     */
    public function get_page_content($request) {
        $page_id = $request['id'];
        
        // Handle special 'homepage' identifier
        if ($page_id === 'homepage') {
            $page_id = get_option('page_on_front');
            
            // If no static homepage is set, get the latest posts
            if (!$page_id) {
                $page_id = get_option('page_for_posts');
            }
            
            // If still no page, return site description
            if (!$page_id) {
                return rest_ensure_response(array(
                    'success' => true,
                    'content' => get_bloginfo('description'),
                    'title' => get_bloginfo('name'),
                    'url' => home_url(),
                    'is_homepage' => true
                ));
            }
        }
        
        $page = get_post($page_id);
        
        if (!$page) {
            return rest_ensure_response(array(
                'success' => false,
                'error' => 'Page not found'
            ));
        }
        
        // Get the content with WordPress filters applied
        $content = apply_filters('the_content', $page->post_content);
        
        return rest_ensure_response(array(
            'success' => true,
            'content' => $content,
            'title' => $page->post_title,
            'url' => get_permalink($page->ID),
            'excerpt' => $page->post_excerpt,
            'modified' => $page->post_modified
        ));
    }
    
    /**
     * Mint preview URL with JWT token
     */
    public function mint_preview_url($request) {
        $json_params = $request->get_json_params();
        $target = isset($json_params['target']) ? $json_params['target'] : null;
        $builder = isset($json_params['builder']) ? $json_params['builder'] : 'auto';
        $audience = isset($json_params['audience']) ? $json_params['audience'] : '';
        
        if (empty($target)) {
            return new WP_Error('missing_target', 'Target is required', array('status' => 400));
        }
        
        // Rate limiting: max 10 requests per minute per IP
        $ip = $_SERVER['REMOTE_ADDR'];
        $rate_limit_key = 'codeanalyst_mint_' . md5($ip);
        $rate_limit_count = get_transient($rate_limit_key);
        
        if ($rate_limit_count === false) {
            set_transient($rate_limit_key, 1, 60); // 1 minute expiration
        } else {
            if ($rate_limit_count >= 10) {
                return new WP_Error('rate_limit', 'Too many requests. Please try again later.', array('status' => 429));
            }
            set_transient($rate_limit_key, $rate_limit_count + 1, 60);
        }
        
        // Get JWT secret (use AUTH_SALT if available, otherwise plugin secret)
        $secret = defined('AUTH_SALT') ? AUTH_SALT : get_option('codeanalyst_jwt_secret');
        
        // Generate secret if not exists
        if (empty($secret)) {
            $secret = wp_generate_password(64, true, true);
            update_option('codeanalyst_jwt_secret', $secret);
        }
        
        // Prepare JWT claims
        $now = time();
        $exp = $now + 300; // 5 minutes TTL
        $site_url = get_site_url();
        
        $claims = array(
            'target' => $target,
            'builder' => $builder,
            'aud' => $audience,
            'exp' => $exp,
            'iat' => $now,
            'iss' => $site_url,
            'jti' => wp_generate_password(32, false)
        );
        
        // Generate JWT with base64url encoding
        $header = $this->base64url_encode(json_encode(array('alg' => 'HS256', 'typ' => 'JWT')));
        $payload = $this->base64url_encode(json_encode($claims));
        $signature = hash_hmac('sha256', $header . '.' . $payload, $secret, true);
        $jwt = $header . '.' . $payload . '.' . $this->base64url_encode($signature);
        
        // Build preview URL
        $preview_url = home_url('/?codeanalyst_preview=' . rawurlencode($jwt));
        
        return rest_ensure_response(array(
            'success' => true,
            'preview_url' => $preview_url,
            'ttl' => 300
        ));
    }
    
    /**
     * Base64url encode (JWT standard)
     */
    private function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    /**
     * Base64url decode (JWT standard)
     */
    private function base64url_decode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}

// Initialize REST API
new CodeAnalyst_REST_API();

