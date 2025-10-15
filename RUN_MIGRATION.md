# Run WordPress Connections Migration

The `wordpress_connections` table needs to be created in your database. Here are your options:

## ✅ Option 1: Run SQL Directly (EASIEST)

Copy the SQL below and run it in your Supabase SQL Editor or PostgreSQL console:

```sql
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
```

### Steps:
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Paste the SQL above
5. Click **Run**
6. Done! ✅

## Option 2: Run Migration Script on Railway

If your backend is deployed on Railway with DATABASE_URL configured:

```bash
# SSH into Railway or use Railway CLI
railway run node backend/scripts/run-migration.js
```

## Option 3: Use Supabase Migrations

If you're using Supabase migrations:

```bash
# Create new migration file
supabase migration new wordpress_connections

# Copy SQL from backend/scripts/migrate-wordpress-connections.sql
# Then apply
supabase db push
```

## Verify Migration

After running the migration, verify it worked:

```sql
-- Check if table exists
SELECT * FROM wordpress_connections LIMIT 1;

-- Should return empty result with no errors
```

## What This Table Does

This table stores WordPress site connections:
- User can generate API keys in CodeAnalyst Settings
- WordPress plugin connects using the API key
- Site data (theme, plugins, health) is synced daily
- Users manage connections in Connected Sites page

---

**Need Help?** The SQL is also available in:
- `backend/scripts/migrate-wordpress-connections.sql`
- `database-schema.sql` (lines 176-227)

