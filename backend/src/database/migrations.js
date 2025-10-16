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
    
    console.log('🎉 All migrations complete!')
    
  } catch (error) {
    console.error('❌ Migration error:', error.message)
    console.error('Stack:', error.stack)
    // Don't stop the server if migration fails
    // Server can still run for other features
  }
}

