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
        
        // Get JWT without corruption - only allow valid JWT characters
        $jwt = isset($_GET['codeanalyst_preview']) ? $_GET['codeanalyst_preview'] : '';
        $jwt = preg_replace('/[^A-Za-z0-9\.\-_]/', '', $jwt);
        
        if (empty($jwt)) {
            wp_die('Invalid preview token', 'Preview Error', array('response' => 400));
        }
        
        // Verify JWT
        $claims = $this->verify_jwt($jwt);
        
        error_log('JWT Debug: verify_jwt returned: ' . ($claims ? 'SUCCESS' : 'FAILED'));
        
        if (!$claims) {
            error_log('JWT Debug: Claims is false, showing error page');
            wp_die('Invalid or expired preview token', 'Preview Error', array('response' => 403));
        }
        
        error_log('JWT Debug: Claims verified, continuing with preview setup');
        error_log('JWT Debug: Target = ' . (isset($claims['target']) ? $claims['target'] : 'NOT SET'));
        
        // Set preview bot user context
        $this->set_preview_user();
        
        // Add CSP header for frame embedding
        $app_url = isset($claims['aud']) ? $claims['aud'] : '';
        $this->set_csp_header($app_url);
        
        // Resolve target and set up query
        $target = $claims['target'];
        $builder = isset($claims['builder']) ? $claims['builder'] : 'auto';
        
        error_log('JWT Debug: About to resolve target: ' . $target);
        $this->resolve_target($target, $builder);
        error_log('JWT Debug: Target resolved successfully');
        
        // Let WordPress continue with normal template loading
        // We'll inject base tag in wp_head hook
    }
    
    /**
     * Verify JWT token
     */
    private function verify_jwt($jwt) {
        $parts = explode('.', $jwt);
        error_log('JWT Debug: Parts count = ' . count($parts));
        
        if (count($parts) !== 3) {
            error_log('JWT Debug: Invalid parts count');
            return false;
        }
        
        list($header_b64, $payload_b64, $signature_b64) = $parts;
        
        error_log('JWT Debug: About to decode header');
        // Decode header (base64url)
        $header = json_decode($this->base64url_decode($header_b64), true);
        error_log('JWT Debug: Header decoded, checking validation');
        
        if (!$header || !isset($header['alg']) || $header['alg'] !== 'HS256') {
            error_log('JWT Debug: Header validation failed. Header=' . print_r($header, true));
            return false;
        }
        error_log('JWT Debug: Header OK');
        
        error_log('JWT Debug: About to decode payload');
        // Decode payload (base64url)
        $payload = json_decode($this->base64url_decode($payload_b64), true);
        error_log('JWT Debug: Payload decoded');
        
        if (!$payload) {
            error_log('JWT Debug: Payload decode failed');
            return false;
        }
        error_log('JWT Debug: Payload OK');
        
        // Verify expiration
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            error_log('JWT Debug: Token expired. Exp=' . $payload['exp'] . ', Now=' . time());
            return false;
        }
        error_log('JWT Debug: Expiration check passed');
        
        // Verify signature
        $secret = defined('AUTH_SALT') ? AUTH_SALT : get_option('codeanalyst_jwt_secret');
        error_log('JWT Debug: Secret source = ' . (defined('AUTH_SALT') ? 'AUTH_SALT' : 'DB option'));
        error_log('JWT Debug: Secret length = ' . strlen($secret));
        
        if (empty($secret)) {
            error_log('JWT Debug: Empty secret');
            return false;
        }
        error_log('JWT Debug: About to verify signature');
        
        $expected_signature = hash_hmac('sha256', $header_b64 . '.' . $payload_b64, $secret, true);
        $provided_signature = $this->base64url_decode($signature_b64);
        
        error_log('JWT Debug: Signature computed');
        error_log('JWT Debug: Expected signature length = ' . strlen($expected_signature));
        error_log('JWT Debug: Provided signature length = ' . strlen($provided_signature));
        error_log('JWT Debug: Expected (hex) = ' . bin2hex($expected_signature));
        error_log('JWT Debug: Provided (hex) = ' . bin2hex($provided_signature));
        
        if (!hash_equals($expected_signature, $provided_signature)) {
            error_log('JWT Debug: Signature mismatch!');
            return false;
        }
        error_log('JWT Debug: Signature verified!');
        
        // Verify audience if APP_PUBLIC_URL is set
        $app_url = get_option('codeanalyst_backend_url');
        error_log('JWT Debug: Checking audience...');
        error_log('JWT Debug: Backend URL from DB = ' . ($app_url ? $app_url : 'EMPTY'));
        error_log('JWT Debug: Payload aud = ' . (isset($payload['aud']) ? $payload['aud'] : 'NOT SET'));
        error_log('JWT Debug: Site URL = ' . get_site_url());
        
        if (!empty($app_url) && isset($payload['aud']) && $payload['aud'] !== $app_url) {
            error_log('JWT Debug: Audience does not match backend URL, checking site URL...');
            // Allow if audience matches site URL or is empty for backward compatibility
            if ($payload['aud'] !== get_site_url() && !empty($payload['aud'])) {
                error_log('JWT Debug: Audience mismatch! Rejecting token.');
                return false;
            }
        }
        
        error_log('JWT Debug: Audience check passed, returning payload');
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
    
    /**
     * Base64url decode (JWT standard)
     */
    private function base64url_decode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}

// Initialize preview handler
new CodeAnalyst_Preview_Handler();

