<?php
/**
 * CodeAnalyst File Reader
 * Reads WordPress theme files and content
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

class CodeAnalyst_File_Reader {
    
    /**
     * Get active theme directory
     */
    private function get_theme_directory() {
        $theme = wp_get_theme();
        return $theme->get_stylesheet_directory();
    }
    
    /**
     * Read theme files
     * Reads PHP, CSS, and JS files from active theme
     */
    public function read_theme_files() {
        $theme_dir = $this->get_theme_directory();
        $files = array();
        
        // File extensions to read
        $extensions = array('php', 'css', 'js');
        
        // Scan theme directory
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($theme_dir),
            RecursiveIteratorIterator::SELF_FIRST
        );
        
        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $extension = pathinfo($file->getFilename(), PATHINFO_EXTENSION);
                
                if (in_array($extension, $extensions)) {
                    $relative_path = str_replace($theme_dir, '', $file->getPathname());
                    
                    // Skip minified files and vendor directories
                    if (strpos($relative_path, '.min.') === false && 
                        strpos($relative_path, 'vendor') === false &&
                        strpos($relative_path, 'node_modules') === false) {
                        
                        $files[] = array(
                            'path' => $relative_path,
                            'type' => $extension,
                            'size' => $file->getSize(),
                            'modified' => date('Y-m-d H:i:s', $file->getMTime())
                        );
                    }
                }
            }
        }
        
        return $files;
    }
    
    /**
     * Get file contents
     */
    public function get_file_contents($relative_path) {
        $theme_dir = $this->get_theme_directory();
        $full_path = $theme_dir . $relative_path;
        
        // Security check - ensure file is within theme directory
        if (strpos(realpath($full_path), realpath($theme_dir)) !== 0) {
            return array(
                'success' => false,
                'message' => 'Security violation: File is outside theme directory'
            );
        }
        
        if (!file_exists($full_path)) {
            return array(
                'success' => false,
                'message' => 'File not found'
            );
        }
        
        $contents = file_get_contents($full_path);
        
        return array(
            'success' => true,
            'contents' => $contents,
            'size' => strlen($contents),
            'path' => $relative_path
        );
    }
    
    /**
     * Read WordPress content (posts and pages)
     */
    public function read_content($post_type = 'post', $limit = 10) {
        $args = array(
            'post_type' => $post_type,
            'posts_per_page' => $limit,
            'post_status' => 'publish',
            'orderby' => 'date',
            'order' => 'DESC'
        );
        
        $query = new WP_Query($args);
        $content = array();
        
        if ($query->have_posts()) {
            while ($query->have_posts()) {
                $query->the_post();
                
                $content[] = array(
                    'id' => get_the_ID(),
                    'title' => get_the_title(),
                    'content' => get_the_content(),
                    'excerpt' => get_the_excerpt(),
                    'date' => get_the_date('Y-m-d H:i:s'),
                    'author' => get_the_author(),
                    'url' => get_permalink()
                );
            }
            wp_reset_postdata();
        }
        
        return $content;
    }
    
    /**
     * Get theme file statistics
     */
    public function get_theme_statistics() {
        $files = $this->read_theme_files();
        
        $stats = array(
            'total_files' => count($files),
            'php_files' => 0,
            'css_files' => 0,
            'js_files' => 0,
            'total_size' => 0
        );
        
        foreach ($files as $file) {
            $stats['total_size'] += $file['size'];
            
            switch ($file['type']) {
                case 'php':
                    $stats['php_files']++;
                    break;
                case 'css':
                    $stats['css_files']++;
                    break;
                case 'js':
                    $stats['js_files']++;
                    break;
            }
        }
        
        return $stats;
    }
}

