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
}

// Initialize REST API
new CodeAnalyst_REST_API();

