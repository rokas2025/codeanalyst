-- Migration: Add WordPress Connections Table
-- Created: 2025-10-15
-- Description: Adds wordpress_connections table for WordPress plugin integration

-- Create the wordpress_connections table
CREATE TABLE IF NOT EXISTS wordpress_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    api_key VARCHAR(64) UNIQUE NOT NULL,
    site_url TEXT NOT NULL,
    site_name VARCHAR(255),
    wordpress_version VARCHAR(50),
    active_theme VARCHAR(255),
    active_plugins JSONB,
    site_health JSONB,
    php_version VARCHAR(50),
    is_connected BOOLEAN DEFAULT true,
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wordpress_connections_user ON wordpress_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_wordpress_connections_api_key ON wordpress_connections(api_key);

-- Create trigger for automatic updated_at timestamp
CREATE TRIGGER update_wordpress_connections_updated_at 
BEFORE UPDATE ON wordpress_connections
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created
SELECT 'WordPress connections table created successfully!' AS status;
SELECT COUNT(*) as connection_count FROM wordpress_connections;

