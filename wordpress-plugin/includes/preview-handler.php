<?php
/**
 * CodeAnalyst Preview Handler
 * Handles preview URL requests with JWT authentication
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class CodeAnalyst_Preview_Handler {
    
    /**
     * Constructor
     */
    public function __construct() {
        add_action('template_redirect', array($this, 'handle_preview_request'));
        add_action('wp_head', array($this, 'inject_base_tag'), 1);
    }
    
    /**
     * Handle preview request
     */
    public function handle_preview_request() {
        if (!isset($_GET['codeanalyst_preview'])) {
            return;
        }
        
        $jwt = sanitize_text_field($_GET['codeanalyst_preview']);
        
        if (empty($jwt)) {
            wp_die('Invalid preview token', 'Preview Error', array('response' => 400));
        }
        
        // Verify JWT
        $claims = $this->verify_jwt($jwt);
        
        if (!$claims) {
            wp_die('Invalid or expired preview token', 'Preview Error', array('response' => 403));
        }
        
        // Set preview bot user context
        $this->set_preview_user();
        
        // Add CSP header for frame embedding
        $app_url = isset($claims['aud']) ? $claims['aud'] : '';
        $this->set_csp_header($app_url);
        
        // Resolve target and set up query
        $target = $claims['target'];
        $builder = isset($claims['builder']) ? $claims['builder'] : 'auto';
        
        $this->resolve_target($target, $builder);
        
        // Let WordPress continue with normal template loading
        // We'll inject base tag in wp_head hook
    }
    
    /**
     * Verify JWT token
     */
    private function verify_jwt($jwt) {
        $parts = explode('.', $jwt);
        
        if (count($parts) !== 3) {
            return false;
        }
        
        list($header_b64, $payload_b64, $signature_b64) = $parts;
        
        // Decode header
        $header = json_decode(base64_decode($header_b64), true);
        
        if (!$header || !isset($header['alg']) || $header['alg'] !== 'HS256') {
            return false;
        }
        
        // Decode payload
        $payload = json_decode(base64_decode($payload_b64), true);
        
        if (!$payload) {
            return false;
        }
        
        // Verify expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }
        
        // Verify signature
        $secret = defined('AUTH_SALT') ? AUTH_SALT : get_option('codeanalyst_jwt_secret');
        
        if (empty($secret)) {
            return false;
        }
        
        $expected_signature = hash_hmac('sha256', $header_b64 . '.' . $payload_b64, $secret, true);
        $provided_signature = base64_decode($signature_b64);
        
        if (!hash_equals($expected_signature, $provided_signature)) {
            return false;
        }
        
        // Verify audience if APP_PUBLIC_URL is set
        $app_url = get_option('codeanalyst_backend_url');
        if (!empty($app_url) && isset($payload['aud']) && $payload['aud'] !== $app_url) {
            // Allow if audience matches site URL or is empty for backward compatibility
            if ($payload['aud'] !== get_site_url() && !empty($payload['aud'])) {
                return false;
            }
        }
        
        return $payload;
    }
    
    /**
     * Set preview bot user context
     */
    private function set_preview_user() {
        $username = 'codeanalyst-preview-bot';
        
        $user = get_user_by('login', $username);
        
        if (!$user) {
            // Create preview bot user if doesn't exist
            $user_id = wp_create_user($username, wp_generate_password(64, true, true), 'preview@codeanalyst.local');
            
            if (!is_wp_error($user_id)) {
                $user = get_user_by('id', $user_id);
                if ($user) {
                    $user->set_role('subscriber');
                }
            }
        }
        
        if ($user) {
            wp_set_current_user($user->ID);
        }
    }
    
    /**
     * Resolve target and set up WordPress query
     */
    private function resolve_target($target, $builder) {
        // Check if target is numeric (post ID)
        if (is_numeric($target)) {
            $post_id = intval($target);
            $post = get_post($post_id);
            
            if (!$post) {
                wp_die('Post not found', 'Preview Error', array('response' => 404));
            }
            
            // Set up query for this post
            global $wp_query;
            $wp_query->query_vars['p'] = $post_id;
            $wp_query->query_vars['post_type'] = $post->post_type;
            $wp_query->is_singular = true;
            $wp_query->is_page = ($post->post_type === 'page');
            $wp_query->is_single = ($post->post_type === 'post');
            
            // Apply builder-specific query params
            $this->apply_builder_params($post_id, $builder);
            
        } else {
            // Treat as path
            $path = '/' . ltrim($target, '/');
            $_SERVER['REQUEST_URI'] = $path;
            
            // Parse and set query vars
            global $wp;
            $wp->parse_request();
            
            // Apply builder params if we have a post ID
            if (isset($wp->query_vars['p'])) {
                $this->apply_builder_params($wp->query_vars['p'], $builder);
            }
        }
    }
    
    /**
     * Apply builder-specific query parameters
     */
    private function apply_builder_params($post_id, $builder) {
        // Auto-detect builder if 'auto'
        if ($builder === 'auto') {
            // Check for Elementor
            if (is_plugin_active('elementor/elementor.php')) {
                $builder = 'elementor';
            }
            // Check for Divi
            elseif (is_plugin_active('divi-builder/divi-builder.php') || get_template() === 'Divi') {
                $builder = 'divi';
            }
            // Check for WPBakery
            elseif (is_plugin_active('js_composer/js_composer.php')) {
                $builder = 'wpbakery';
            }
            // Default to Gutenberg
            else {
                $builder = 'gutenberg';
            }
        }
        
        // Apply builder-specific params
        switch ($builder) {
            case 'elementor':
                $_GET['elementor-preview'] = $post_id;
                if (defined('ELEMENTOR_VERSION')) {
                    $_GET['ver'] = ELEMENTOR_VERSION;
                }
                break;
                
            case 'divi':
                $_GET['et_fb'] = '1';
                break;
                
            case 'gutenberg':
                $_GET['preview'] = 'true';
                break;
                
            case 'wpbakery':
                $_GET['vc_editable'] = 'true';
                $_GET['vc_post_id'] = $post_id;
                break;
        }
    }
    
    /**
     * Inject base tag for relative asset resolution
     */
    public function inject_base_tag() {
        if (!isset($_GET['codeanalyst_preview'])) {
            return;
        }
        
        $site_url = get_site_url();
        echo '<base href="' . esc_url($site_url) . '/">' . "\n";
    }
    
    /**
     * Set Content Security Policy header for frame embedding
     */
    private function set_csp_header($app_url) {
        $site_url = get_site_url();
        $allowed_origins = "'self'";
        
        if (!empty($app_url)) {
            $parsed = parse_url($app_url);
            if ($parsed && isset($parsed['scheme']) && isset($parsed['host'])) {
                $origin = $parsed['scheme'] . '://' . $parsed['host'];
                $allowed_origins = "'self' " . $origin;
            }
        }
        
        header("Content-Security-Policy: frame-ancestors " . $allowed_origins);
    }
}

// Initialize preview handler
new CodeAnalyst_Preview_Handler();

