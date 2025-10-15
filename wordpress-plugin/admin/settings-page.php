<?php
/**
 * CodeAnalyst Settings Page
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Render settings page
 */
function codeanalyst_settings_page() {
    // Check user capabilities
    if (!current_user_can('manage_options')) {
        return;
    }
    
    $api_key = get_option('codeanalyst_api_key', '');
    $backend_url = get_option('codeanalyst_backend_url', 'https://codeanalyst-production.up.railway.app/api');
    $connected = get_option('codeanalyst_connected', false);
    $last_sync = get_option('codeanalyst_last_sync', '');
    
    ?>
    <div class="wrap">
        <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
        
        <div class="codeanalyst-container">
            <div class="codeanalyst-card">
                <h2>Connection Settings</h2>
                
                <form method="post" action="options.php">
                    <?php
                    settings_fields('codeanalyst_settings');
                    do_settings_sections('codeanalyst_settings');
                    ?>
                    
                    <table class="form-table">
                        <tr>
                            <th scope="row">
                                <label for="codeanalyst_backend_url">CodeAnalyst Backend URL</label>
                            </th>
                            <td>
                                <input type="url" 
                                       id="codeanalyst_backend_url" 
                                       name="codeanalyst_backend_url" 
                                       value="<?php echo esc_attr($backend_url); ?>" 
                                       class="regular-text" 
                                       readonly>
                                <p class="description">Default backend URL for CodeAnalyst</p>
                            </td>
                        </tr>
                        
                        <tr>
                            <th scope="row">
                                <label for="codeanalyst_api_key">API Key</label>
                            </th>
                            <td>
                                <input type="text" 
                                       id="codeanalyst_api_key" 
                                       name="codeanalyst_api_key" 
                                       value="<?php echo esc_attr($api_key); ?>" 
                                       class="regular-text" 
                                       placeholder="Enter your CodeAnalyst API key">
                                <button type="button" 
                                        class="button" 
                                        id="copy-api-key"
                                        <?php echo empty($api_key) ? 'disabled' : ''; ?>>
                                    Copy
                                </button>
                                <p class="description">
                                    Get your API key from <a href="https://codeanalyst.vercel.app/settings" target="_blank">CodeAnalyst Settings</a>
                                </p>
                            </td>
                        </tr>
                    </table>
                    
                    <?php submit_button('Save Settings'); ?>
                </form>
                
                <hr>
                
                <h3>Connection Status</h3>
                <table class="form-table">
                    <tr>
                        <th scope="row">Status</th>
                        <td>
                            <span class="codeanalyst-status <?php echo $connected ? 'connected' : 'disconnected'; ?>">
                                <?php echo $connected ? '● Connected' : '○ Not Connected'; ?>
                            </span>
                        </td>
                    </tr>
                    
                    <?php if ($connected && $last_sync): ?>
                    <tr>
                        <th scope="row">Last Sync</th>
                        <td><?php echo esc_html($last_sync); ?></td>
                    </tr>
                    <?php endif; ?>
                </table>
                
                <p>
                    <?php if ($connected): ?>
                        <button type="button" class="button" id="test-connection">Test Connection</button>
                        <button type="button" class="button" id="disconnect">Disconnect</button>
                    <?php else: ?>
                        <button type="button" class="button button-primary" id="connect" <?php echo empty($api_key) ? 'disabled' : ''; ?>>
                            Connect to CodeAnalyst
                        </button>
                        <button type="button" class="button" id="test-connection" <?php echo empty($api_key) ? 'disabled' : ''; ?>>
                            Test Connection
                        </button>
                    <?php endif; ?>
                </p>
                
                <div id="connection-message"></div>
            </div>
            
            <?php if ($connected): ?>
            <div class="codeanalyst-card">
                <h2>Site Information</h2>
                <?php
                $file_reader = new CodeAnalyst_File_Reader();
                $stats = $file_reader->get_theme_statistics();
                ?>
                <table class="widefat">
                    <tbody>
                        <tr>
                            <td><strong>Site URL</strong></td>
                            <td><?php echo esc_html(get_site_url()); ?></td>
                        </tr>
                        <tr>
                            <td><strong>WordPress Version</strong></td>
                            <td><?php echo esc_html(get_bloginfo('version')); ?></td>
                        </tr>
                        <tr>
                            <td><strong>Active Theme</strong></td>
                            <td><?php echo esc_html(wp_get_theme()->get('Name')); ?></td>
                        </tr>
                        <tr>
                            <td><strong>PHP Version</strong></td>
                            <td><?php echo esc_html(PHP_VERSION); ?></td>
                        </tr>
                        <tr>
                            <td><strong>Theme Files</strong></td>
                            <td>
                                <?php echo esc_html($stats['total_files']); ?> files
                                (<?php echo esc_html($stats['php_files']); ?> PHP, 
                                <?php echo esc_html($stats['css_files']); ?> CSS, 
                                <?php echo esc_html($stats['js_files']); ?> JS)
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        </div>
    </div>
    
    <style>
        .codeanalyst-container {
            max-width: 1200px;
        }
        .codeanalyst-card {
            background: #fff;
            border: 1px solid #ccd0d4;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 1px 1px rgba(0,0,0,.04);
        }
        .codeanalyst-card h2 {
            margin-top: 0;
        }
        .codeanalyst-status {
            font-weight: bold;
            padding: 5px 10px;
            border-radius: 3px;
        }
        .codeanalyst-status.connected {
            color: #046408;
            background: #d4edda;
        }
        .codeanalyst-status.disconnected {
            color: #721c24;
            background: #f8d7da;
        }
        #connection-message {
            margin-top: 15px;
        }
        #connection-message.success {
            color: #046408;
            background: #d4edda;
            padding: 10px;
            border-left: 4px solid #28a745;
        }
        #connection-message.error {
            color: #721c24;
            background: #f8d7da;
            padding: 10px;
            border-left: 4px solid #dc3545;
        }
    </style>
    
    <script>
    jQuery(document).ready(function($) {
        var nonce = '<?php echo wp_create_nonce('codeanalyst_nonce'); ?>';
        
        // Copy API key
        $('#copy-api-key').on('click', function() {
            var apiKey = $('#codeanalyst_api_key').val();
            navigator.clipboard.writeText(apiKey).then(function() {
                showMessage('API key copied to clipboard', 'success');
            });
        });
        
        // Connect
        $('#connect').on('click', function() {
            var button = $(this);
            button.prop('disabled', true).text('Connecting...');
            
            $.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'codeanalyst_connect',
                    nonce: nonce
                },
                success: function(response) {
                    if (response.success) {
                        showMessage(response.data, 'success');
                        setTimeout(function() {
                            location.reload();
                        }, 1500);
                    } else {
                        showMessage(response.data, 'error');
                        button.prop('disabled', false).text('Connect to CodeAnalyst');
                    }
                },
                error: function() {
                    showMessage('Connection failed. Please try again.', 'error');
                    button.prop('disabled', false).text('Connect to CodeAnalyst');
                }
            });
        });
        
        // Disconnect
        $('#disconnect').on('click', function() {
            if (!confirm('Are you sure you want to disconnect from CodeAnalyst?')) {
                return;
            }
            
            $.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'codeanalyst_disconnect',
                    nonce: nonce
                },
                success: function(response) {
                    if (response.success) {
                        showMessage(response.data, 'success');
                        setTimeout(function() {
                            location.reload();
                        }, 1500);
                    } else {
                        showMessage(response.data, 'error');
                    }
                }
            });
        });
        
        // Test connection
        $('#test-connection').on('click', function() {
            var button = $(this);
            button.prop('disabled', true).text('Testing...');
            
            $.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'codeanalyst_test_connection',
                    nonce: nonce
                },
                success: function(response) {
                    if (response.success) {
                        showMessage(response.data, 'success');
                    } else {
                        showMessage(response.data, 'error');
                    }
                    button.prop('disabled', false).text('Test Connection');
                },
                error: function() {
                    showMessage('Connection test failed', 'error');
                    button.prop('disabled', false).text('Test Connection');
                }
            });
        });
        
        function showMessage(message, type) {
            $('#connection-message')
                .removeClass('success error')
                .addClass(type)
                .html(message)
                .show();
        }
    });
    </script>
    <?php
}

