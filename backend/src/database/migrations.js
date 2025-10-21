/**
 * Database Migrations
 * Automatically run on server startup
 */

import { db } from './connection.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Run all pending migrations
 */
export async function runMigrations() {
  try {
    console.log('🔄 Checking for pending migrations...')
    
    // Enable required PostgreSQL extensions
    try {
      await db.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
      await db.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
      console.log('✅ PostgreSQL extensions enabled (uuid-ossp, pgcrypto)')
    } catch (extError) {
      console.warn('⚠️  Could not create extensions (may already exist or need superuser):', extError.message)
    }
    
    // Check if wordpress_connections table exists
    const checkTable = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'wordpress_connections'
      )
    `)
    
    if (!checkTable.rows[0].exists) {
      console.log('📦 Running WordPress connections migration...')
      
      // Read and execute the migration SQL
      const sqlPath = join(__dirname, '../../scripts/migrate-wordpress-connections.sql')
      const sql = readFileSync(sqlPath, 'utf-8')
      
      await db.query(sql)
      console.log('✅ WordPress connections table created successfully!')
    } else {
      console.log('✅ WordPress connections table already exists')
    }
    
    // Check if wordpress_files table exists
    const checkFilesTable = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'wordpress_files'
      )
    `)
    
    if (!checkFilesTable.rows[0].exists) {
      console.log('📦 Running WordPress files migration...')
      
      await db.query(`
        CREATE TABLE wordpress_files (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          connection_id UUID REFERENCES wordpress_connections(id) ON DELETE CASCADE,
          file_path TEXT NOT NULL,
          file_type VARCHAR(50),
          file_content TEXT,
          file_size INTEGER,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_wordpress_files_connection ON wordpress_files(connection_id);
      `)
      console.log('✅ WordPress files table created successfully!')
    } else {
      console.log('✅ WordPress files table already exists')
    }
    
    // Check if wordpress_pages table exists (unified table for all editor types)
    const checkPagesTable = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'wordpress_pages'
      )
    `)
    
    if (!checkPagesTable.rows[0].exists) {
      console.log('📦 Running WordPress pages migration...')
      
      await db.query(`
        CREATE TABLE wordpress_pages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          connection_id UUID REFERENCES wordpress_connections(id) ON DELETE CASCADE,
          post_id BIGINT NOT NULL,
          post_title TEXT,
          post_type VARCHAR(50),
          editor_type VARCHAR(20) NOT NULL,
          content TEXT,
          elementor_data JSONB,
          blocks JSONB,
          block_count INTEGER,
          page_url TEXT,
          last_modified TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(connection_id, post_id)
        );
        
        CREATE INDEX idx_wordpress_pages_connection ON wordpress_pages(connection_id);
        CREATE INDEX idx_wordpress_pages_post_id ON wordpress_pages(post_id);
        CREATE INDEX idx_wordpress_pages_editor_type ON wordpress_pages(editor_type);
      `)
      console.log('✅ WordPress pages table created successfully!')
    } else {
      console.log('✅ WordPress pages table already exists')
    }
    
    // Migrate old wordpress_elementor_pages to new wordpress_pages table (if exists)
    const checkOldElementorTable = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'wordpress_elementor_pages'
      )
    `)
    
    if (checkOldElementorTable.rows[0].exists) {
      console.log('📦 Migrating old Elementor pages to unified pages table...')
      
      try {
        await db.query(`
          INSERT INTO wordpress_pages (
            connection_id, post_id, post_title, editor_type, 
            elementor_data, page_url, last_modified, created_at
          )
          SELECT 
            connection_id, post_id, post_title, 'elementor',
            elementor_data, page_url, last_modified, created_at
          FROM wordpress_elementor_pages
          ON CONFLICT (connection_id, post_id) DO NOTHING
        `)
        console.log('✅ Migrated old Elementor pages successfully!')
      } catch (migrateError) {
        console.log('⚠️  Migration of old Elementor pages skipped (may already be migrated)')
      }
    }
    
    // Add language field to url_analysis table if it exists
    const checkUrlAnalysisTable = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'url_analysis'
      )
    `)
    
    if (checkUrlAnalysisTable.rows[0].exists) {
      const checkLanguageColumn = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'url_analysis' AND column_name = 'detected_language'
        )
      `)
      
      if (!checkLanguageColumn.rows[0].exists) {
        console.log('📦 Adding detected_language column to url_analysis table...')
        
        await db.query(`
          ALTER TABLE url_analysis ADD COLUMN IF NOT EXISTS detected_language VARCHAR(10);
        `)
        console.log('✅ Language column added successfully!')
      } else {
        console.log('✅ Language column already exists')
      }
    } else {
      console.log('ℹ️  url_analysis table does not exist yet (will be created on first website analysis)')
    }
    
    // Check if content_templates table exists and add translations column
    const checkTemplatesTable = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'content_templates'
      )
    `)
    
    if (checkTemplatesTable.rows[0].exists) {
      // Check if translations column exists
      const checkTranslationsColumn = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'content_templates' AND column_name = 'translations'
        )
      `)
      
      if (!checkTranslationsColumn.rows[0].exists) {
        console.log('📦 Adding translations column to content_templates table...')
        
        await db.query(`
          ALTER TABLE content_templates ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
        `)
        console.log('✅ Translations column added successfully!')
      } else {
        console.log('✅ Translations column already exists')
      }
    } else {
      console.log('ℹ️  content_templates table does not exist yet (will be created on first use)')
    }
    
    // Add auth_provider column to users table for hybrid auth
    const checkUsersTable = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      )
    `)
    
    if (checkUsersTable.rows[0].exists) {
      const checkAuthProviderColumn = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = 'users' AND column_name = 'auth_provider'
        )
      `)
      
      if (!checkAuthProviderColumn.rows[0].exists) {
        console.log('📦 Adding auth_provider column to users table...')
        
        await db.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) DEFAULT 'custom';
        `)
        console.log('✅ Auth provider column added successfully!')
      } else {
        console.log('✅ Auth provider column already exists')
      }
    }
    
    console.log('🎉 All migrations complete!')
    
  } catch (error) {
    console.error('❌ Migration error:', error.message)
    console.error('Stack:', error.stack)
    // Don't stop the server if migration fails
    // Server can still run for other features
  }
}


